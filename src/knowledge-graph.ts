/**
 * Shiksha Setu — Education Knowledge Graph
 *
 * Architecture inspired by SimulateX's knowledge graph (nodes, edges, adjacency list, weighted BFS).
 * Adapted for an education domain: Subject → Domain → Competency → Question hierarchy.
 *
 * Node types:   SUBJECT | DOMAIN | COMPETENCY | QUESTION
 * Edge types:   CONTAINS | ASSESSED_BY | PREREQUISITE | TEACHES
 */

import type { SeedData, KGNode, KGEdge, KGEdit, Question, Competency } from './types';

// ── Internal adjacency list structure ────────────────────────────────────────
type AdjEntry = { targetId: string; edgeType: KGEdge['edgeType']; weight: number };

export interface EducationGraph {
  nodes: Map<string, KGNode>;
  adj: Map<string, AdjEntry[]>;
}

// ── Graph Construction ────────────────────────────────────────────────────────
export function buildEducationGraph(data: SeedData, kgEdits: KGEdit[] = []): EducationGraph {
  const nodes = new Map<string, KGNode>();
  const adj = new Map<string, AdjEntry[]>();

  function addNode(node: KGNode) {
    nodes.set(node.id, node);
    if (!adj.has(node.id)) adj.set(node.id, []);
  }

  function addEdge(sourceId: string, targetId: string, edgeType: KGEdge['edgeType'], weight = 1.0) {
    if (!adj.has(sourceId)) adj.set(sourceId, []);
    adj.get(sourceId)!.push({ targetId, edgeType, weight });
  }

  // 1. Add Subject nodes
  for (const subject of data.subjects) {
    addNode({
      id: `subject:${subject.id}`,
      nodeType: 'SUBJECT',
      label: subject.name,
      metadata: { code: subject.code, color: subject.color },
      weight: 1.0,
    });
  }

  // 2. Build Domain nodes per subject (collect unique domains from competencies)
  const domainMap = new Map<string, Set<string>>(); // subjectId → Set<domain>
  for (const comp of data.competencies) {
    if (!domainMap.has(comp.subjectId)) domainMap.set(comp.subjectId, new Set());
    domainMap.get(comp.subjectId)!.add(comp.domain);
  }
  for (const [subjectId, domains] of domainMap.entries()) {
    for (const domain of domains) {
      const domainId = `domain:${subjectId}:${domain.replace(/\s+/g, '_')}`;
      addNode({
        id: domainId,
        nodeType: 'DOMAIN',
        label: domain,
        metadata: { subjectId },
        weight: 1.0,
      });
      // SUBJECT -CONTAINS-> DOMAIN
      addEdge(`subject:${subjectId}`, domainId, 'CONTAINS', 1.0);
    }
  }

  // 3. Add Competency nodes
  for (const comp of data.competencies) {
    const nodeId = `competency:${comp.id}`;
    const domainId = `domain:${comp.subjectId}:${comp.domain.replace(/\s+/g, '_')}`;
    addNode({
      id: nodeId,
      nodeType: 'COMPETENCY',
      label: comp.title,
      metadata: {
        standardId: comp.standardId,
        subjectId: comp.subjectId,
        domain: comp.domain,
        levelId: comp.levelId,
        outcome: comp.outcome,
        teachingActivity: comp.teachingActivity,
      },
      weight: 1.0,
    });
    // DOMAIN -CONTAINS-> COMPETENCY
    if (nodes.has(domainId)) {
      addEdge(domainId, nodeId, 'CONTAINS', 1.0);
    }
  }

  // 4. Add Question nodes and ASSESSED_BY edges
  for (const question of data.questions) {
    const nodeId = `question:${question.id}`;
    addNode({
      id: nodeId,
      nodeType: 'QUESTION',
      label: question.text.slice(0, 60) + (question.text.length > 60 ? '…' : ''),
      metadata: {
        standardId: question.standardId,
        subjectId: question.subjectId,
        competencyId: question.competencyId,
        levelId: question.levelId,
        type: question.type,
      },
      weight: 1.0,
    });
    // COMPETENCY -ASSESSED_BY-> QUESTION
    const compNodeId = `competency:${question.competencyId}`;
    if (nodes.has(compNodeId)) {
      addEdge(compNodeId, nodeId, 'ASSESSED_BY', 1.0);
    }
  }

  // 5. Apply KG edits (teacher additions/modifications)
  for (const edit of kgEdits) {
    if (edit.type === 'ADD_QUESTION') {
      const q = edit.payload as unknown as Question;
      const nodeId = `question:${q.id}`;
      if (!nodes.has(nodeId)) {
        addNode({
          id: nodeId, nodeType: 'QUESTION',
          label: q.text.slice(0, 60),
          metadata: { standardId: q.standardId, subjectId: q.subjectId, competencyId: q.competencyId, levelId: q.levelId, type: q.type },
          weight: 1.2, // slightly prefer teacher-added questions
        });
        const compNodeId = `competency:${q.competencyId}`;
        if (nodes.has(compNodeId)) addEdge(compNodeId, nodeId, 'ASSESSED_BY', 1.2);
      }
    } else if (edit.type === 'DELETE_QUESTION') {
      const questionId = edit.payload['questionId'] as string;
      nodes.delete(`question:${questionId}`);
    }
  }

  return { nodes, adj };
}

// ── Weighted BFS ─────────────────────────────────────────────────────────────
interface BFSResult { node: KGNode; cumulativeWeight: number; path: string[] }

export function weightedBFS(
  graph: EducationGraph,
  startIds: string[],
  targetType: KGNode['nodeType'],
  allowedEdges: KGEdge['edgeType'][],
  maxDepth = 5,
): BFSResult[] {
  const visited = new Set<string>();
  const queue: Array<{ id: string; weight: number; path: string[] }> = [];
  const results: BFSResult[] = [];

  for (const sid of startIds) {
    if (graph.nodes.has(sid)) {
      const node = graph.nodes.get(sid)!;
      queue.push({ id: sid, weight: node.weight, path: [sid] });
    }
  }

  while (queue.length > 0) {
    const item = queue.shift()!;
    const { id, weight, path } = item;

    if (visited.has(id) || path.length > maxDepth) continue;
    visited.add(id);

    const node = graph.nodes.get(id);
    if (!node) continue;

    if (node.nodeType === targetType) {
      results.push({ node, cumulativeWeight: weight, path });
      // continue traversal — don't stop (may reach siblings via graph structure)
    }

    const neighbours = graph.adj.get(id) ?? [];
    for (const edge of neighbours) {
      if (!visited.has(edge.targetId) && allowedEdges.includes(edge.edgeType)) {
        const targetNode = graph.nodes.get(edge.targetId);
        if (targetNode) {
          const newWeight = weight * edge.weight * targetNode.weight;
          queue.push({ id: edge.targetId, weight: newWeight, path: [...path, edge.targetId] });
        }
      }
    }
  }

  results.sort((a, b) => b.cumulativeWeight - a.cumulativeWeight);
  return results;
}

// ── Normal Distribution Question Allocation ───────────────────────────────────
/**
 * Given a target level (1–5) and total question count, returns how many questions
 * should come from each level using a discrete normal distribution centred on targetLevel.
 */
export function computeLevelDistribution(
  targetLevelIndex: number, // 0-based (0=L1, 4=L5)
  totalQuestions: number,
  levelIds: string[],
): Record<string, number> {
  const sigma = 1.2;
  const weights: number[] = levelIds.map((_, i) => {
    return Math.exp(-((i - targetLevelIndex) ** 2) / (2 * sigma * sigma));
  });
  const total = weights.reduce((a, b) => a + b, 0);
  const normalised = weights.map(w => w / total);

  // Convert to integer counts, ensuring sum = totalQuestions
  const rawCounts = normalised.map(p => p * totalQuestions);
  const counts = rawCounts.map(Math.round);

  // Fix rounding error so sum exactly equals totalQuestions
  let diff = totalQuestions - counts.reduce((a, b) => a + b, 0);
  // distribute remainder to levels closest to target
  const order = levelIds.map((_, i) => i).sort((a, b) => Math.abs(a - targetLevelIndex) - Math.abs(b - targetLevelIndex));
  let oi = 0;
  while (diff !== 0) {
    const idx = order[oi % order.length];
    counts[idx] += diff > 0 ? 1 : -1;
    diff += diff > 0 ? -1 : 1;
    oi++;
  }

  const distribution: Record<string, number> = {};
  for (let i = 0; i < levelIds.length; i++) {
    distribution[levelIds[i]] = Math.max(0, counts[i]);
  }
  return distribution;
}

// ── Question Selection from KG ────────────────────────────────────────────────
/**
 * Main function: traverse the graph, select questions matching standardId + subjectId,
 * then allocate them across levels using normal distribution.
 */
export function getQuestionsForAssessment(
  graph: EducationGraph,
  data: SeedData,
  standardId: string,
  subjectId: string,
  targetLevelId: string,
  totalQuestions: number,
): { questions: Question[]; distribution: Record<string, number> } {
  const levelIds = data.levels.map(l => l.id); // ['l1','l2','l3','l4','l5']
  const targetLevelIndex = levelIds.indexOf(targetLevelId);

  // Compute distribution
  const distribution = computeLevelDistribution(targetLevelIndex, totalQuestions, levelIds);

  // BFS from subject node to get all question nodes for this subject+standard
  const subjectNodeId = `subject:${subjectId}`;
  const traversalResults = weightedBFS(
    graph,
    [subjectNodeId],
    'QUESTION',
    ['CONTAINS', 'ASSESSED_BY'],
    6,
  );

  // Filter traversal results to this subject, prioritizing exact standard match
  const candidatesByLevel: Record<string, KGNode[]> = {};
  for (const levelId of levelIds) candidatesByLevel[levelId] = [];

  // First pass: exact standard + subject match
  for (const result of traversalResults) {
    const meta = result.node.metadata;
    if (meta.subjectId === subjectId && (meta.standardId === standardId || !meta.standardId)) {
      const lid = meta.levelId;
      if (lid && candidatesByLevel[lid]) {
        candidatesByLevel[lid].push(result.node);
      }
    }
  }

  // Second pass: if any level is missing candidates, fill with subject-level questions from data
  for (const levelId of levelIds) {
    if (candidatesByLevel[levelId].length === 0) {
      const fallbackQuestions = data.questions.filter(
        q => q.subjectId === subjectId && q.levelId === levelId
      );
      for (const fq of fallbackQuestions) {
        candidatesByLevel[levelId].push({
          id: `question:${fq.id}`,
          nodeType: 'QUESTION',
          label: fq.text.slice(0, 60),
          metadata: { standardId: fq.standardId, subjectId: fq.subjectId, competencyId: fq.competencyId, levelId: fq.levelId, type: fq.type },
          weight: 1.0,
        });
      }
    }
  }

  // Sample questions per level
  const selected: Question[] = [];
  for (const levelId of levelIds) {
    const needed = distribution[levelId] ?? 0;
    if (needed === 0) continue;

    // Shuffle candidates for this level
    const candidates = [...candidatesByLevel[levelId]];
    for (let i = candidates.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
    }

    // Pick up to `needed` questions; try to mix MCQ and Descriptive
    const picked: Question[] = [];
    const mcqs = candidates.filter(n => n.metadata.type === 'MCQ');
    const descs = candidates.filter(n => n.metadata.type === 'DESCRIPTIVE');

    const mcqTarget = Math.ceil(needed * 0.6); // ~60% MCQ
    const descTarget = needed - mcqTarget;

    for (let i = 0; i < Math.min(mcqTarget, mcqs.length); i++) {
      const q = findQuestion(data, mcqs[i].id);
      if (q) picked.push(q);
    }
    for (let i = 0; i < Math.min(descTarget, descs.length); i++) {
      const q = findQuestion(data, descs[i].id);
      if (q && !picked.find(p => p.id === q.id)) picked.push(q);
    }
    // Fill remaining from any available if we didn't get enough
    if (picked.length < needed) {
      for (const candidate of candidates) {
        if (picked.length >= needed) break;
        const q = findQuestion(data, candidate.id);
        if (q && !picked.find(p => p.id === q.id)) picked.push(q);
      }
    }

    // Global fallback for this level if dataset is sparse
    if (picked.length < needed) {
      const globalPool = data.questions.filter(q => q.subjectId === subjectId);
      for (const gq of globalPool) {
        if (picked.length >= needed) break;
        if (!selected.find(s => s.id === gq.id) && !picked.find(p => p.id === gq.id)) {
          picked.push(gq);
        }
      }
    }

    selected.push(...picked.slice(0, needed));
  }

  return { questions: selected, distribution };
}

function findQuestion(data: SeedData, nodeId: string): Question | undefined {
  // nodeId format: "question:q-123"
  const qId = nodeId.replace('question:', '');
  return data.questions.find(q => q.id === qId);
}

// ── Teaching Recommendations from KG ─────────────────────────────────────────
/**
 * Given a level id and a set of competencies that were tested, return
 * the most relevant teaching activity by traversing competency nodes.
 */
export function getTeachingRecommendationFromKG(
  graph: EducationGraph,
  data: SeedData,
  subjectId: string,
  standardId: string,
  levelId: string,
): string {
  // Find competency nodes for this subject+standard+level
  const relevantComps: Competency[] = data.competencies.filter(
    c => c.subjectId === subjectId && c.standardId === standardId && c.levelId === levelId,
  );

  if (relevantComps.length > 0) {
    // Use the first competency's teaching activity (all comps of same level+domain share the same activity)
    return relevantComps[0].teachingActivity;
  }

  // Fallback: traverse the graph to find any COMPETENCY node for this subject and level
  const subjectNodeId = `subject:${subjectId}`;
  const compResults = weightedBFS(graph, [subjectNodeId], 'COMPETENCY', ['CONTAINS'], 4);
  const match = compResults.find(r => r.node.metadata.levelId === levelId);
  if (match) return match.node.metadata.teachingActivity ?? '';

  const fallbacks: Record<string, string> = {
    l1: 'Use concrete, hands-on activities and visual aids to build foundational understanding.',
    l2: 'Guided pair practice with modelled examples before independent work.',
    l3: 'Semi-abstract representations and structured practice problems.',
    l4: 'Multi-step application problems with written reasoning required.',
    l5: 'Open investigation or peer-teaching task to deepen and extend mastery.',
  };
  return fallbacks[levelId] ?? 'Adapt the next lesson to meet students where they are.';
}

// ── Graph Stats (for UI) ──────────────────────────────────────────────────────
export function getGraphStats(graph: EducationGraph) {
  let subjects = 0, domains = 0, competencies = 0, questionNodes = 0;
  for (const node of graph.nodes.values()) {
    if (node.nodeType === 'SUBJECT') subjects++;
    else if (node.nodeType === 'DOMAIN') domains++;
    else if (node.nodeType === 'COMPETENCY') competencies++;
    else if (node.nodeType === 'QUESTION') questionNodes++;
  }
  let edges = 0;
  for (const adj of graph.adj.values()) edges += adj.length;
  return {
    totalNodes: graph.nodes.size,
    totalEdges: edges,
    subjects,
    domains,
    competencies,
    questions: questionNodes,
    byType: {
      SUBJECT: subjects,
      DOMAIN: domains,
      COMPETENCY: competencies,
      QUESTION: questionNodes,
    },
  };
}
