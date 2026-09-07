import type { Question, SeedData, Student, StudentResult, GroupRecommendation, Level } from '../types';
import { getTeachingRecommendationFromKG, EducationGraph } from './knowledge-graph';
import Papa from 'papaparse';

export function generateMonthlyPulse(data: SeedData, standardId: string, subjectId: string) {
  return data.levels.map(level => data.questions.find(question => question.standardId === standardId && question.subjectId === subjectId && question.levelId === level.id) ?? data.questions.find(question => question.levelId === level.id) as Question).filter(Boolean);
}

export function getRecommendation(level: string) {
  return level === 'Foundation' ? 'Use a 20-minute concrete practice activity and check the prerequisite again tomorrow.' : level === 'Emerging' ? 'Model one example, then pair learners for a guided practice round.' : 'Offer an extension prompt and ask the learner to explain their reasoning.';
}

export function parseResultsCSV(csvText: string): { rollNumber: number; level: number; topicScores: Record<string, number> }[] {
  const parseResult = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
  });

  const results: { rollNumber: number; level: number; topicScores: Record<string, number> }[] = [];

  for (const row of parseResult.data) {
    // Find roll number column (could be 'Roll Number', 'Roll No', 'roll_number', 'roll', etc.)
    const rollKey = Object.keys(row).find(k => /roll/i.test(k)) || Object.keys(row)[0];
    const levelKey = Object.keys(row).find(k => /level|grade/i.test(k)) || Object.keys(row)[1];

    if (!rollKey || !row[rollKey]) continue;

    const rollNumber = parseInt(row[rollKey].trim(), 10);
    const level = parseInt(row[levelKey]?.trim() || '3', 10);

    if (isNaN(rollNumber)) continue;

    // Any remaining columns are assumed to be topic scores
    const topicScores: Record<string, number> = {};
    for (const [k, v] of Object.entries(row)) {
      if (k !== rollKey && k !== levelKey && v) {
        const score = parseFloat(v);
        if (!isNaN(score)) {
          topicScores[k.trim()] = score;
        }
      }
    }

    results.push({
      rollNumber,
      level: Math.min(5, Math.max(1, isNaN(level) ? 3 : level)),
      topicScores,
    });
  }

  return results;
}

export function mapResultsToStudents(
  rawResults: { rollNumber: number; level: number; topicScores: Record<string, number> }[],
  allStudents: Student[],
  selectedClassId?: string
): StudentResult[] {
  // If a classId is selected, filter students by classId. Otherwise use all students.
  const classStudents = selectedClassId
    ? allStudents.filter(s => s.classId === selectedClassId)
    : allStudents;

  return rawResults.map(raw => {
    // Match by rollNumber within the target class first, or fallback to global match
    const student = classStudents.find(s => s.rollNumber === raw.rollNumber)
      || allStudents.find(s => s.rollNumber === raw.rollNumber);

    return {
      rollNumber: raw.rollNumber,
      studentId: student ? student.id : `stu-roll-${raw.rollNumber}`,
      studentName: student ? student.name : `Student (Roll #${raw.rollNumber})`,
      level: raw.level,
      topicScores: raw.topicScores,
    };
  });
}

export function buildGroupRecommendations(
  results: StudentResult[],
  levels: Level[],
  graph: EducationGraph,
  data: SeedData,
  subjectId: string,
  standardId: string
): GroupRecommendation[] {
  // Map levels 1 to 5 to levelId l1 to l5
  const levelMap: Record<number, Level> = {};
  levels.forEach((l, idx) => {
    levelMap[idx + 1] = l;
  });

  const groups: GroupRecommendation[] = [];

  for (let lvlNum = 1; lvlNum <= 5; lvlNum++) {
    const levelObj = levelMap[lvlNum] || {
      id: `l${lvlNum}`,
      code: `L${lvlNum}`,
      name: `Level ${lvlNum}`,
      color: '#6366f1',
      icon: 'Target',
      threshold: lvlNum * 20,
    };

    const studentInGroup = results.filter(r => r.level === lvlNum);

    // Get recommendation from Knowledge Graph for this level & subject
    const activityFromKG = getTeachingRecommendationFromKG(graph, data, subjectId, standardId, levelObj.id);

    groups.push({
      level: lvlNum,
      levelId: levelObj.id,
      levelName: levelObj.name,
      levelColor: levelObj.color,
      levelIcon: levelObj.icon,
      students: studentInGroup,
      activity: activityFromKG,
    });
  }

  return groups;
}
