import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText, Download, FileCheck, Trash2, Calendar, BookOpen,
  Sparkles, Layers, ArrowRight, PlusCircle, CheckCircle2, Eye, X, Filter
} from 'lucide-react';
import type { SavedQuestionSet, SeedData, GeneratedPaper } from './types';
import { deleteSavedSet, saveSavedSet } from './db';
import { downloadStudentPaper, downloadAnswerKey } from './print-paper';

interface SavedQuestionSetsProps {
  data: SeedData;
  onRefreshData?: () => void;
}

export function SavedQuestionSets({ data, onRefreshData }: SavedQuestionSetsProps) {
  const navigate = useNavigate();
  const [selectedSet, setSelectedSet] = useState<SavedQuestionSet | null>(null);
  const [filterMonth, setFilterMonth] = useState<string>('all');
  const [filterStandard, setFilterStandard] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(6);

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete question set "${name}"?`)) {
      await deleteSavedSet(id);
      data.savedSets = data.savedSets.filter(s => s.id !== id);
      if (onRefreshData) onRefreshData();
    }
  };

  const filteredSets = React.useMemo(() => {
    return data.savedSets.filter(s => {
      const matchMonth = filterMonth === 'all' || s.month === filterMonth;
      const matchStd = filterStandard === 'all' || s.standardId === filterStandard;
      const matchQuery = !searchQuery ||
        s.setName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.subjectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.standardName.toLowerCase().includes(searchQuery.toLowerCase());
      return matchMonth && matchStd && matchQuery;
    });
  }, [data.savedSets, filterMonth, filterStandard, searchQuery]);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [filterMonth, filterStandard, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredSets.length / pageSize));
  const paginatedSets = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredSets.slice(start, start + pageSize);
  }, [filteredSets, currentPage, pageSize]);

  const monthsList = Array.from(new Set(data.savedSets.map(s => s.month)));

  const convertToGeneratedPaper = (set: SavedQuestionSet): GeneratedPaper => ({
    id: set.id,
    setName: set.setName,
    timestamp: set.createdAt,
    classId: set.standardId,
    className: set.standardName,
    subjectId: set.subjectId,
    subjectName: set.subjectName,
    targetLevelId: set.targetLevelId || 'l3',
    targetLevelName: 'Balanced (All Levels)',
    totalQuestions: set.totalQuestions,
    questions: set.questions,
    levelDistribution: set.levelDistribution,
  });

  return (
    <div className="saved-sets-page animate-fade-in">
      {/* Header */}
      <div className="page-header space-between">
        <div>
          <p className="eyebrow">Assessment Archive · Standard Format</p>
          <h1>Saved Question Sets (stand_month_setno)</h1>
          <p className="muted">
            All finalized assessment sets covering calibrated levels (L1–L5). Ready for student paper print or teacher answer key download.
          </p>
        </div>
        <button className="primary" onClick={() => navigate('/teacher/new-assessment')}>
          <PlusCircle size={18} /> + Generate New Assessment Set
        </button>
      </div>

      {/* Toolbar / Filters */}
      <div className="panel list-panel">
        <div className="list-toolbar">
          <div className="search">
            <input
              type="text"
              placeholder="Search by set name, standard, or subject..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="filter-group-row">
            <div className="filter-item">
              <label>Standard / Class:</label>
              <select value={filterStandard} onChange={e => setFilterStandard(e.target.value)}>
                <option value="all">All Standards</option>
                {data.classrooms.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-item">
              <label>Month:</label>
              <select value={filterMonth} onChange={e => setFilterMonth(e.target.value)}>
                <option value="all">All Months</option>
                {monthsList.map(m => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Saved Sets Grid */}
        <div className="saved-sets-grid">
          {paginatedSets.length === 0 ? (
            <div className="empty-state-box">
              <FileText size={48} className="text-muted" />
              <h3>No Saved Question Sets Found</h3>
              <p className="muted">
                Generate an assessment paper from the Knowledge Graph and click "Save to Question Sets".
              </p>
              <button className="primary" onClick={() => navigate('/teacher/new-assessment')}>
                <PlusCircle size={16} /> Generate Assessment Now
              </button>
            </div>
          ) : (
            paginatedSets.map(set => (
              <div className="saved-set-card" key={set.id}>
                <div className="set-card-header">
                  <div className="set-name-badge">
                    <FileText size={16} className="text-teal" />
                    <strong>{set.setName}</strong>
                  </div>
                  <span className="tag success">FINALIZED</span>
                </div>

                <div className="set-meta-info">
                  <p className="set-subtitle">
                    <strong>{set.standardName}</strong> · {set.subjectName}
                  </p>
                  <span className="tiny-date">
                    <Calendar size={12} /> {set.month} · Created on {new Date(set.createdAt).toLocaleDateString()}
                  </span>
                </div>

                {/* Level Distribution Pills */}
                <div className="level-distribution-ribbon">
                  <small className="muted">Coverage across L1–L5:</small>
                  <div className="pills-row">
                    {Object.entries(set.levelDistribution || {}).map(([lvlId, count]) => {
                      const lvlObj = data.levels.find(l => l.id === lvlId);
                      return (
                        <span
                          key={lvlId}
                          className="level-pill"
                          style={{ backgroundColor: lvlObj?.color || '#0b6e69' }}
                          title={`${lvlObj?.name}: ${count} questions`}
                        >
                          {lvlObj?.code || lvlId.toUpperCase()}: {count}
                        </span>
                      );
                    })}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="set-card-actions">
                  <button
                    className="small-button secondary"
                    title="View Questions"
                    onClick={() => setSelectedSet(set)}
                  >
                    <Eye size={14} /> Preview Set
                  </button>

                  <button
                    className="small-button primary"
                    title="Print clean paper to share with students"
                    onClick={() => downloadStudentPaper(convertToGeneratedPaper(set))}
                  >
                    <Download size={14} /> Student Paper (PDF)
                  </button>

                  <button
                    className="small-button secondary highlight-amber"
                    title="Download reference paper with level labels and answers"
                    onClick={() => downloadAnswerKey(convertToGeneratedPaper(set))}
                  >
                    <FileCheck size={14} /> Answer Key (PDF)
                  </button>

                  <button
                    className="icon-button danger"
                    title="Delete question set"
                    onClick={() => handleDelete(set.id, set.setName)}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination Toolbar */}
        <div className="table-pagination-bar">
          <div className="table-pagination-info">
            <span>
              Showing {filteredSets.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} to{' '}
              {Math.min(currentPage * pageSize, filteredSets.length)} of {filteredSets.length} sets
            </span>
            <div className="page-size-selector">
              <label>Per page:</label>
              <select
                value={pageSize}
                onChange={e => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
              >
                <option value={3}>3</option>
                <option value={6}>6</option>
                <option value={12}>12</option>
              </select>
            </div>
          </div>

          <div className="table-pagination-actions">
            <button
              className="pagination-btn"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            >
              Previous
            </button>
            <span className="pagination-page-num">
              Page {currentPage} of {totalPages}
            </span>
            <button
              className="pagination-btn"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Set Preview Modal */}
      {selectedSet && (
        <div className="modal-overlay" onClick={() => setSelectedSet(null)}>
          <div className="modal-content large animate-fade-in" onClick={e => e.stopPropagation()}>
            <div className="modal-header space-between">
              <div>
                <p className="eyebrow">Question Set Preview</p>
                <h3>{selectedSet.setName}</h3>
                <small className="muted">{selectedSet.standardName} · {selectedSet.subjectName} · {selectedSet.month}</small>
              </div>
              <button className="icon-button" onClick={() => setSelectedSet(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="preview-modal-actions-row">
              <button
                className="primary"
                onClick={() => downloadStudentPaper(convertToGeneratedPaper(selectedSet))}
              >
                <Download size={15} /> Download Student Paper (PDF)
              </button>
              <button
                className="secondary highlight-amber"
                onClick={() => downloadAnswerKey(convertToGeneratedPaper(selectedSet))}
              >
                <FileCheck size={15} /> Download Answer Key with Level Labels (PDF)
              </button>
            </div>

            <div className="question-list-scrollable">
              {selectedSet.questions.map((q, idx) => {
                const lvlObj = data.levels.find(l => l.id === q.levelId);
                return (
                  <div className="question-item-card" key={q.id}>
                    <div className="q-header">
                      <span className="q-number">Q{idx + 1}</span>
                      <span
                        className="level-pill"
                        style={{ backgroundColor: lvlObj?.color || '#0b6e69' }}
                      >
                        {lvlObj?.code} · {lvlObj?.name}
                      </span>
                      <span className="badge badge-blue">{q.type}</span>
                      <span className="q-marks">{q.marks || 1} Mark(s)</span>
                    </div>

                    <p className="q-text">{q.text}</p>

                    {q.type === 'MCQ' && q.options && q.options.length > 0 && (
                      <div className="q-options-grid">
                        {q.options.map((opt, oIdx) => (
                          <div
                            key={oIdx}
                            className={`opt-chip ${opt === q.answer ? 'opt-correct' : ''}`}
                          >
                            <strong>({String.fromCharCode(65 + oIdx)})</strong> {opt}
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="q-answer-note">
                      <strong>Correct Answer:</strong> {q.answer}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="modal-actions">
              <button className="secondary" onClick={() => setSelectedSet(null)}>
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
