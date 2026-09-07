import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText, Download, FileCheck, Trash2, Calendar, Users,
  Sparkles, Layers, ArrowRight, PlusCircle, CheckCircle2
} from 'lucide-react';
import type { GeneratedPaper, AssessmentSession, SeedData } from '../types';
import { getAllPapers, getAllSessions, deletePaper } from '../lib/db';
import { downloadStudentPaper, downloadAnswerKey } from '../components/print-paper';

interface AssessmentHistoryProps {
  data: SeedData;
}

export function AssessmentHistory({ data }: AssessmentHistoryProps) {
  const navigate = useNavigate();
  const [papers, setPapers] = useState<GeneratedPaper[]>([]);
  const [sessions, setSessions] = useState<AssessmentSession[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedSession, setSelectedSession] = useState<AssessmentSession | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(5);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const [fetchedPapers, fetchedSessions] = await Promise.all([
        getAllPapers(),
        getAllSessions(),
      ]);
      setPapers(fetchedPapers);
      setSessions(fetchedSessions);
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleDelete = async (paperId: string) => {
    if (confirm('Are you sure you want to delete this assessment paper record?')) {
      await deletePaper(paperId);
      await loadHistory();
    }
  };

  const getSessionForPaper = (paperId: string) => {
    return sessions.find(s => s.paperId === paperId);
  };

  const filteredPapers = React.useMemo(() => {
    if (!searchQuery) return papers;
    return papers.filter(p =>
      p.className.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.subjectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.setName && p.setName.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [papers, searchQuery]);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredPapers.length / pageSize));
  const paginatedPapers = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredPapers.slice(start, start + pageSize);
  }, [filteredPapers, currentPage, pageSize]);

  return (
    <div className="history-page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Assessment Engine · Archives</p>
          <h1>Assessment History & Answer Keys</h1>
          <p className="muted">
            Access past generated assessment papers, re-download student PDFs or teacher answer keys, and review student level groupings.
          </p>
        </div>
        <button className="primary" onClick={() => navigate('/teacher/new-assessment')}>
          <PlusCircle size={18} /> New Assessment
        </button>
      </div>

      {loading ? (
        <div className="loading-state">
          <Sparkles className="spin" size={24} /> Loading assessment archive…
        </div>
      ) : papers.length === 0 ? (
        <div className="empty-state-card">
          <FileText size={48} className="text-muted" />
          <h3>No Assessments Generated Yet</h3>
          <p className="muted">Create your first assessment paper powered by the Knowledge Graph.</p>
          <button className="primary" onClick={() => navigate('/teacher/new-assessment')}>
            <PlusCircle size={18} /> Create New Assessment
          </button>
        </div>
      ) : (
        <div className="history-grid">
          <div className="history-list-panel">
            <div className="list-toolbar" style={{ border: 0, padding: '0 0 16px 0' }}>
              <div className="search">
                <input
                  type="text"
                  placeholder="Search assessment history by class or subject..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <h2>Generated Papers ({filteredPapers.length})</h2>
            <div className="cards-stack">
              {paginatedPapers.length === 0 ? (
                <p className="muted p-4">No matching assessment records found.</p>
              ) : (
                paginatedPapers.map(p => {
                  const session = getSessionForPaper(p.id);
                  return (
                    <div className="history-item-card" key={p.id}>
                      <div className="card-top-row">
                        <div className="title-block">
                          <strong>{p.className} · {p.subjectName}</strong>
                          <span className="tiny-date">
                            <Calendar size={13} /> {new Date(p.timestamp).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <div className="badge-group">
                          <span className="tag blue">{p.totalQuestions} Questions</span>
                          {session ? (
                            <span className="tag success">
                              <CheckCircle2 size={12} /> Assessed ({session.results.length} learners)
                            </span>
                          ) : (
                            <span className="tag warning">Pending Upload</span>
                          )}
                        </div>
                      </div>

                      <div className="distribution-pill-row">
                        {Object.entries(p.levelDistribution || {}).map(([lvlId, count]) => {
                          const lvlObj = data.levels.find(l => l.id === lvlId);
                          return (
                            <span
                              key={lvlId}
                              className="level-pill"
                              style={{ backgroundColor: lvlObj?.color || '#94a3b8' }}
                              title={`${lvlObj?.name}: ${count} questions`}
                            >
                              {lvlObj?.code}: {count}
                            </span>
                          );
                        })}
                      </div>

                      <div className="card-actions-row">
                        <button className="small-button secondary" onClick={() => downloadStudentPaper(p)}>
                          <Download size={14} /> Paper PDF
                        </button>
                        <button className="small-button secondary highlight-amber" onClick={() => downloadAnswerKey(p)}>
                          <FileCheck size={14} /> Answer Key
                        </button>

                        {session && (
                          <button
                            className="small-button secondary highlight-teal"
                            onClick={() => setSelectedSession(selectedSession?.id === session.id ? null : session)}
                          >
                            <Users size={14} /> {selectedSession?.id === session.id ? 'Hide Groups' : 'View Groups'}
                          </button>
                        )}

                        <button className="icon-button danger" onClick={() => handleDelete(p.id)}>
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Pagination Controls */}
            <div className="table-pagination-bar">
              <div className="table-pagination-info">
                <span>
                  Showing {filteredPapers.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} to{' '}
                  {Math.min(currentPage * pageSize, filteredPapers.length)} of {filteredPapers.length} records
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
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
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

          {/* Session Detail Modal / Side Panel */}
          {selectedSession && (
            <div className="session-detail-panel animate-fade-in">
              <div className="panel-header space-between">
                <div>
                  <h3>Results for {selectedSession.className} - {selectedSession.subjectName}</h3>
                  <small className="muted">
                    Uploaded: {new Date(selectedSession.uploadedAt).toLocaleDateString()}
                  </small>
                </div>
                <button className="text-button" onClick={() => setSelectedSession(null)}>Close</button>
              </div>

              <div className="groups-container-vertical">
                {selectedSession.groupRecommendations.map(group => (
                  <div className="session-group-box" key={group.level}>
                    <div className="s-group-header" style={{ borderLeftColor: group.levelColor }}>
                      <strong>{group.levelName} (L{group.level})</strong>
                      <span>{group.students.length} Learners</span>
                    </div>

                    <div className="s-student-chips">
                      {group.students.map(s => (
                        <span key={s.studentId} className="student-chip">
                          Roll #{s.rollNumber} {s.studentName}
                        </span>
                      ))}
                    </div>

                    <div className="s-action-box">
                      <Sparkles size={13} />
                      <span><strong>Next Action:</strong> {group.activity}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
