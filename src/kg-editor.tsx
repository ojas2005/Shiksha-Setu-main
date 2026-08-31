import React, { useState } from 'react';
import {
  Network, Plus, Edit2, Trash2, CheckCircle2, ChevronRight,
  ChevronDown, BookOpen, Layers, HelpCircle, Save, X, Sparkles
} from 'lucide-react';
import type { SeedData, Question, QuestionKind } from './types';
import { EducationGraph, getGraphStats } from './knowledge-graph';
import { saveKGEdit } from './db';

interface KGEditorProps {
  data: SeedData;
  graph: EducationGraph;
}

export function KGEditor({ data, graph }: KGEditorProps) {
  const stats = getGraphStats(graph);

  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('mat');
  const [expandedDomains, setExpandedDomains] = useState<Record<string, boolean>>({ 'Number System': true, 'Fractions & Decimals': true });
  const [expandedCompetencies, setExpandedCompetencies] = useState<Record<string, boolean>>({});

  // Add Question Modal State
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [targetCompId, setTargetCompId] = useState<string>('');
  const [newQText, setNewQText] = useState<string>('');
  const [newQType, setNewQType] = useState<QuestionKind>('MCQ');
  const [newQOptions, setNewQOptions] = useState<string>('Option A, Option B, Option C, Option D');
  const [newQAnswer, setNewQAnswer] = useState<string>('');
  const [newQLevelId, setNewQLevelId] = useState<string>('l3');
  const [newQMarks, setNewQMarks] = useState<number>(1);
  const [savedFeedback, setSavedFeedback] = useState<string>('');

  const toggleDomain = (domain: string) => {
    setExpandedDomains(prev => ({ ...prev, [domain]: !prev[domain] }));
  };

  const toggleComp = (compId: string) => {
    setExpandedCompetencies(prev => ({ ...prev, [compId]: !prev[compId] }));
  };

  // Group competencies by domain for selected subject
  const compsForSubject = data.competencies.filter(c => c.subjectId === selectedSubjectId);
  const domainGroups = compsForSubject.reduce((acc, c) => {
    if (!acc[c.domain]) acc[c.domain] = [];
    acc[c.domain].push(c);
    return acc;
  }, {} as Record<string, typeof compsForSubject>);

  const handleOpenAddModal = (compId: string) => {
    setTargetCompId(compId);
    setShowAddModal(true);
  };

  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQText || !newQAnswer) return;

    const comp = data.competencies.find(c => c.id === targetCompId);
    if (!comp) return;

    const optionsArray = newQType === 'MCQ'
      ? newQOptions.split(',').map(s => s.trim()).filter(Boolean)
      : [];

    const newQuestion: Question = {
      id: `q-user-${Date.now()}`,
      standardId: comp.standardId,
      subjectId: comp.subjectId,
      competencyId: comp.id,
      levelId: newQLevelId,
      text: newQText,
      options: optionsArray,
      answer: newQAnswer,
      marks: newQMarks,
      type: newQType,
    };

    // Save edit log in IndexedDB
    await saveKGEdit({
      id: `edit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: 'ADD_QUESTION',
      payload: newQuestion as any,
    });

    // Dynamically update runtime data state
    data.questions.push(newQuestion);

    setSavedFeedback('Question added to Knowledge Graph!');
    setShowAddModal(false);
    setNewQText('');
    setNewQAnswer('');

    setTimeout(() => setSavedFeedback(''), 3000);
  };

  return (
    <div className="kg-editor-page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Knowledge Base · Interactive Graph</p>
          <h1>Knowledge Graph Explorer & Editor</h1>
          <p className="muted">
            Visualize the curriculum domain hierarchy, view linked competencies and questions, and add custom assessment items.
          </p>
        </div>
      </div>

      {savedFeedback && (
        <div className="notice teacher animate-fade-in">
          <CheckCircle2 size={18} className="text-green" />
          <span>{savedFeedback}</span>
        </div>
      )}

      {/* Graph Stats Bar */}
      <div className="kg-stats-row">
        <div className="kg-stat-item">
          <Network size={18} className="text-teal" />
          <span>Total Nodes: <strong>{stats.totalNodes}</strong></span>
        </div>
        <div className="kg-stat-item">
          <Layers size={18} className="text-blue" />
          <span>Total Edges: <strong>{stats.totalEdges}</strong></span>
        </div>
        <div className="kg-stat-item">
          <BookOpen size={18} className="text-purple" />
          <span>Domains: <strong>{stats.byType.DOMAIN || 0}</strong></span>
        </div>
        <div className="kg-stat-item">
          <HelpCircle size={18} className="text-amber" />
          <span>Questions Linked: <strong>{stats.byType.QUESTION || 0}</strong></span>
        </div>
      </div>

      {/* Subject Filter Tabs */}
      <div className="subject-tabs-row">
        {data.subjects.map(s => (
          <button
            key={s.id}
            className={`tab-btn ${selectedSubjectId === s.id ? 'active' : ''}`}
            onClick={() => setSelectedSubjectId(s.id)}
          >
            {s.name}
          </button>
        ))}
      </div>

      {/* Interactive Tree View */}
      <div className="kg-tree-container">
        {Object.keys(domainGroups).length === 0 ? (
          <p className="muted p-4">No competencies found for this subject.</p>
        ) : (
          Object.entries(domainGroups).map(([domain, comps]) => {
            const isDomainExpanded = expandedDomains[domain];
            return (
              <div className="tree-domain-node" key={domain}>
                <div className="domain-node-header" onClick={() => toggleDomain(domain)}>
                  {isDomainExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                  <BookOpen size={16} className="text-purple" />
                  <strong>Domain: {domain}</strong>
                  <span className="badge-count">{comps.length} Competencies</span>
                </div>

                {isDomainExpanded && (
                  <div className="domain-children-container">
                    {comps.map(comp => {
                      const isCompExpanded = expandedCompetencies[comp.id];
                      const compQuestions = data.questions.filter(q => q.competencyId === comp.id);
                      return (
                        <div className="tree-comp-node" key={comp.id}>
                          <div className="comp-node-header" onClick={() => toggleComp(comp.id)}>
                            {isCompExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                            <Layers size={15} className="text-blue" />
                            <div className="comp-title-block">
                              <strong>{comp.title}</strong>
                              <small className="muted">{comp.outcome}</small>
                            </div>
                            <span className="tag blue">{compQuestions.length} Questions</span>
                            <button
                              className="small-button secondary text-teal"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenAddModal(comp.id);
                              }}
                            >
                              <Plus size={14} /> Add Question
                            </button>
                          </div>

                          {/* Teaching Action indicator from KG */}
                          {isCompExpanded && (
                            <div className="comp-body-expanded">
                              <div className="kg-teaching-box">
                                <Sparkles size={14} className="text-amber" />
                                <div>
                                  <strong>KG Teaching Action:</strong>
                                  <p>{comp.teachingActivity}</p>
                                </div>
                              </div>

                              {/* Question Rows */}
                              <div className="comp-questions-list">
                                {compQuestions.map((q, qIdx) => (
                                  <div className="q-row-item" key={q.id}>
                                    <span className="q-tag">{q.type}</span>
                                    <p className="q-row-text">{q.text}</p>
                                    <span className="q-row-ans">Ans: {q.answer}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Add Question Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content animate-fade-in">
            <div className="modal-header space-between">
              <h3>Add Question to Knowledge Graph</h3>
              <button className="icon-button" onClick={() => setShowAddModal(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveQuestion}>
              <div className="form-group">
                <label>Question Type</label>
                <select value={newQType} onChange={e => setNewQType(e.target.value as QuestionKind)}>
                  <option value="MCQ">Multiple Choice (MCQ)</option>
                  <option value="DESCRIPTIVE">Descriptive / Short Answer</option>
                </select>
              </div>

              <div className="form-group">
                <label>Question Text</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Enter the assessment question text…"
                  value={newQText}
                  onChange={e => setNewQText(e.target.value)}
                />
              </div>

              {newQType === 'MCQ' && (
                <div className="form-group">
                  <label>Options (Comma Separated)</label>
                  <input
                    type="text"
                    value={newQOptions}
                    onChange={e => setNewQOptions(e.target.value)}
                    placeholder="Option A, Option B, Option C, Option D"
                  />
                </div>
              )}

              <div className="form-group">
                <label>Correct Answer</label>
                <input
                  type="text"
                  required
                  placeholder="Enter correct answer or sample response"
                  value={newQAnswer}
                  onChange={e => setNewQAnswer(e.target.value)}
                />
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label>Difficulty Level</label>
                  <select value={newQLevelId} onChange={e => setNewQLevelId(e.target.value)}>
                    {data.levels.map(l => (
                      <option key={l.id} value={l.id}>
                        {l.code} - {l.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Marks</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={newQMarks}
                    onChange={e => setNewQMarks(parseInt(e.target.value, 10))}
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="primary">
                  <Save size={16} /> Save to Knowledge Graph
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
