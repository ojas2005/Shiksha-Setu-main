import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight, BookOpen, CheckCircle2, ClipboardCheck, Download, Filter,
  Layers3, RefreshCw, Search, ShieldCheck, SlidersHorizontal, Sparkles,
  User, UserPlus, Phone, Mail, FileText, Calendar, Plus, X, Save,
  AlertCircle, Eye, Printer, HeartHandshake, ChevronDown, Check, Layers, Network
} from 'lucide-react';
import { generateMonthlyPulse, getRecommendation } from '../lib/services';
import type { SeedData, Student, Classroom, Competency, Question } from '../types';
import { StudyMaterialModal } from '../components/study-material-modal';
import { downloadStudentPaper } from '../components/print-paper';
import { saveKGEdit } from '../lib/db';
import { CLASS_SUBJECT_MAP, CLASS_LABELS, getLevelLabel, MONTHS_LIST, YEARS_LIST } from '../lib/data';
import jsPDF from 'jspdf';

function PageHeader({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: React.ReactNode }) {
  return (
    <div className="page-header">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="muted">{description}</p>
      </div>
      {action}
    </div>
  );
}

// ── Academic Structure Master Data View ──────────────────────────────────────
export function AcademicStructure({ data }: { data: SeedData }) {
  const [tab, setTab] = useState('Standards');
  const tabs = ['Standards', 'Subjects', 'Level frameworks', 'Competencies'];
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState('');

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  return (
    <>
      {toastMsg && (
        <div className="floating-toast">
          <CheckCircle2 size={18} className="text-green" />
          <span>{toastMsg}</span>
        </div>
      )}

      <div className="page-header space-between">
        <div>
          <p className="eyebrow">Knowledge Management</p>
          <h1>Academic Structure</h1>
          <p className="muted">Configurable master data powering every assessment and recommendation.</p>
        </div>
        <button className="primary" onClick={() => setShowAddModal(true)}>
          <Layers3 size={17} /> + Add Record
        </button>
      </div>

      <div className="tabs">
        {tabs.map(item => (
          <button
            className={tab === item ? 'tab active' : 'tab'}
            onClick={() => setTab(item)}
            key={item}
          >
            {item}
          </button>
        ))}
      </div>

      <div className="panel list-panel">
        <div className="list-toolbar">
          <div className="search">
            <Search size={16} />
            <input
              placeholder={`Search ${tab.toLowerCase()}...`}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <button className="filter-button" onClick={() => showToast(`Filtered active ${tab}`)}>
            <Filter size={15} /> Active Filter
          </button>
        </div>

        {tab === 'Standards' && (
          <div className="master-list">
            {[
              'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5',
              'Grade 6', 'Grade 7', 'Grade 8', 'Bridge Course A'
            ]
              .filter(n => n.toLowerCase().includes(searchQuery.toLowerCase()))
              .map((name, index) => (
                <div className="master-row" key={name}>
                  <div className="record-icon">
                    {index <= 7 ? <CheckCircle2 size={17} /> : <BookOpen size={17} />}
                  </div>
                  <div className="record-main">
                    <strong>{name}</strong>
                    <span>{index <= 4 ? 'Primary Stage (Foundational & Preparatory)' : index <= 7 ? 'Middle Stage (Upper Primary)' : 'Bridge Learning Recovery'}</span>
                  </div>
                  <span className="tag success">Active</span>
                  <span className="version">v2 · NEP 2020 Aligned</span>
                  <button className="link-button" onClick={() => setShowEditModal(name)}>
                    Edit <ArrowRight size={13} />
                  </button>
                </div>
              ))}
          </div>
        )}

        {tab === 'Subjects' && (
          <div className="subject-grid">
            {data.subjects
              .filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()))
              .map(subject => (
                <div className="subject-card" key={subject.id} onClick={() => showToast(`Selected ${subject.name}`)}>
                  <span style={{ background: subject.color }} />
                  <div>
                    <strong>{subject.name}</strong>
                    <small>{subject.code} · mapped to 8 standards</small>
                  </div>
                  <ArrowRight size={15} />
                </div>
              ))}
          </div>
        )}

        {tab === 'Level frameworks' && (
          <div className="framework-card">
            <div className="framework-head">
              <div>
                <span className="tag success">ACTIVE</span>
                <h3>Five-Level Learning Recovery Framework</h3>
                <p className="muted">Dynamic thresholds, icons, and remedial mappings used by assessment generation.</p>
              </div>
              <span className="version">v2</span>
            </div>
            {data.levels.map(level => (
              <div className="level-row" key={level.id}>
                <i style={{ background: level.color }}>{level.icon}</i>
                <strong>{level.code} {level.name}</strong>
                <span>Mastery threshold {level.threshold}%</span>
              </div>
            ))}
          </div>
        )}

        {tab === 'Competencies' && (
          <div className="competency-grid">
            {data.competencies
              .filter(c => c.title.toLowerCase().includes(searchQuery.toLowerCase()) || c.domain.toLowerCase().includes(searchQuery.toLowerCase()))
              .slice(0, 15)
              .map(item => (
                <div className="competency-card" key={item.id}>
                  <small>{item.standardId.toUpperCase()} · {item.domain}</small>
                  <strong>{item.title}</strong>
                  <p>{item.outcome}</p>
                  <span className="tag">{item.levelId.toUpperCase()} Target</span>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Add Record Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content animate-fade-in" onClick={e => e.stopPropagation()}>
            <div className="modal-header space-between">
              <h3>Add Master Record</h3>
              <button className="icon-button" onClick={() => setShowAddModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={e => { e.preventDefault(); setShowAddModal(false); showToast('Master record added successfully'); }}>
              <div className="form-group">
                <label>Record Type</label>
                <select>
                  <option>Academic Standard / Grade</option>
                  <option>Subject</option>
                  <option>Learning Outcome / Competency</option>
                </select>
              </div>
              <div className="form-group">
                <label>Title / Identifier</label>
                <input required placeholder="e.g. Grade 9 Core Mathematics" />
              </div>
              <div className="modal-actions">
                <button type="button" className="secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="primary"><Save size={15} /> Save Record</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Record Modal */}
      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(null)}>
          <div className="modal-content animate-fade-in" onClick={e => e.stopPropagation()}>
            <div className="modal-header space-between">
              <h3>Edit {showEditModal}</h3>
              <button className="icon-button" onClick={() => setShowEditModal(null)}><X size={18} /></button>
            </div>
            <form onSubmit={e => { e.preventDefault(); setShowEditModal(null); showToast(`Updated ${showEditModal}`); }}>
              <div className="form-group">
                <label>Status</label>
                <select defaultValue="Active">
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Archived">Archived</option>
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="secondary" onClick={() => setShowEditModal(null)}>Cancel</button>
                <button type="submit" className="primary"><Save size={15} /> Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

// ── Question Bank View ───────────────────────────────────────────────────────
export function Questions({ data }: { data: SeedData }) {
  const [query, setQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const filtered = data.questions.filter(q => {
    const matchQ = q.text.toLowerCase().includes(query.toLowerCase());
    const matchSub = selectedSubject === 'all' || q.subjectId === selectedSubject;
    return matchQ && matchSub;
  });

  React.useEffect(() => {
    setCurrentPage(1);
  }, [query, selectedSubject]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginatedQuestions = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  const handleDownloadCSV = () => {
    const headers = 'ID,Standard,Subject,Level,Type,Marks,Text,Answer';
    const rows = filtered.map(q => [
      q.id,
      q.standardId,
      q.subjectId,
      q.levelId,
      q.type,
      q.marks,
      `"${q.text.replace(/"/g, '""')}"`,
      `"${q.answer.replace(/"/g, '""')}"`
    ].join(','));
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encoded = encodeURI(csvContent);
    const a = document.createElement('a');
    a.href = encoded;
    a.download = `Question_Bank_Export_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  return (
    <>
      <div className="page-header space-between">
        <div>
          <p className="eyebrow">Content Library · {data.questions.length} Items</p>
          <h1>Question Bank</h1>
          <p className="muted">Competency-first questions mapped by standard and level, ready for print and offline assessment.</p>
        </div>
        <button className="secondary" onClick={handleDownloadCSV}>
          <Download size={16} /> Download CSV ({filtered.length})
        </button>
      </div>

      <div className="notice">
        <BookOpen size={19} />
        <div>
          <strong>Curriculum Validated Bank</strong>
          <span>Questions are categorized from L1 (Foundation) through L5 (Advanced) for multi-grade diagnosis.</span>
        </div>
      </div>

      <div className="panel list-panel">
        <div className="list-toolbar">
          <div className="search">
            <Search size={16} />
            <input
              value={query}
              onChange={event => setQuery(event.target.value)}
              placeholder="Search question text or competency..."
            />
          </div>
          <div className="filter-item">
            <select value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)}>
              <option value="all">All Subjects</option>
              {data.subjects.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="master-list" style={{ maxHeight: '520px', overflowY: 'auto' }}>
          {paginatedQuestions.length === 0 ? (
            <p className="muted p-4">No questions found matching criteria.</p>
          ) : (
            paginatedQuestions.map(question => {
              const lvlObj = data.levels.find(l => l.id === question.levelId);
              return (
                <div className="question-row" key={question.id}>
                  <span className="q-number">{question.id.replace('q-', '#')}</span>
                  <div>
                    <strong>{question.text}</strong>
                    <small>
                      {question.subjectId.toUpperCase()} · {question.standardId.toUpperCase()} ·
                      <span style={{ color: lvlObj?.color, fontWeight: 700, marginLeft: 4 }}>
                        {lvlObj?.code} {lvlObj?.name}
                      </span>
                    </small>
                  </div>
                  <span className="tag success">Print ready</span>
                  <button className="link-button" onClick={() => setSelectedQuestion(question)}>
                    Review <ArrowRight size={13} />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Pagination Toolbar */}
        <div className="table-pagination-bar">
          <div className="table-pagination-info">
            <span>
              Showing {filtered.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} to{' '}
              {Math.min(currentPage * pageSize, filtered.length)} of {filtered.length} questions
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
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
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

      {selectedQuestion && (
        <div className="modal-overlay" onClick={() => setSelectedQuestion(null)}>
          <div className="modal-content animate-fade-in" onClick={e => e.stopPropagation()}>
            <div className="modal-header space-between">
              <h3>Question Detail ({selectedQuestion.id})</h3>
              <button className="icon-button" onClick={() => setSelectedQuestion(null)}><X size={18} /></button>
            </div>
            <div className="question-item-card">
              <div className="q-header">
                <span className="badge badge-blue">{selectedQuestion.type}</span>
                <span className="q-marks">{selectedQuestion.marks} Mark(s)</span>
              </div>
              <p className="q-text">{selectedQuestion.text}</p>
              {selectedQuestion.options && selectedQuestion.options.length > 0 && (
                <div className="q-options-grid">
                  {selectedQuestion.options.map((opt, i) => (
                    <div key={i} className={`opt-chip ${opt === selectedQuestion.answer ? 'opt-correct' : ''}`}>
                      ({String.fromCharCode(65 + i)}) {opt}
                    </div>
                  ))}
                </div>
              )}
              <div className="q-answer-note">
                <strong>Correct Answer:</strong> {selectedQuestion.answer}
              </div>
            </div>
            <div className="modal-actions">
              <button className="secondary" onClick={() => setSelectedQuestion(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ── Knowledge Graph View ────────────────────────────────────────────────────
export function KnowledgeGraph({ data }: { data: SeedData }) {
  const navigate = useNavigate();
  const [selectedComp, setSelectedComp] = useState<Competency>(data.competencies[0] || {
    id: 'comp-1', standardId: 'std-6', subjectId: 'mat', domain: 'Number System',
    title: 'Place Value & Operations', outcome: 'Understanding place value and basic arithmetic.',
    levelId: 'l1', teachingActivity: 'Use concrete counting objects.'
  });
  const [studyModalOpen, setStudyModalOpen] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);

  // Form State for Updating Knowledge Graph
  const [newStandardId, setNewStandardId] = useState<string>('std-6');
  const [newCompSubjectId, setNewCompSubjectId] = useState<string>('mat');
  const [newDomain, setNewDomain] = useState<string>('');
  const [newCompTitle, setNewCompTitle] = useState<string>('');
  const [newCompOutcome, setNewCompOutcome] = useState<string>('');
  const [newCompLevelId, setNewCompLevelId] = useState<string>('l3');
  const [newTeachingActivity, setNewTeachingActivity] = useState<string>('');
  const [toastMsg, setToastMsg] = useState('');

  const availableSubjectIdsForStandard = CLASS_SUBJECT_MAP[newStandardId] || ['hin', 'eng', 'mat', 'sci'];
  const availableSubjectsForStandard = data.subjects.filter(s => availableSubjectIdsForStandard.includes(s.id));

  const handleSaveCompetency = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompTitle || !newDomain || !newCompOutcome) return;

    const newComp: Competency = {
      id: `comp-user-${Date.now()}`,
      standardId: newStandardId,
      subjectId: newCompSubjectId,
      domain: newDomain.trim(),
      title: newCompTitle.trim(),
      outcome: newCompOutcome.trim(),
      levelId: newCompLevelId,
      teachingActivity: newTeachingActivity.trim() || 'Conduct small group practice activities.',
    };

    await saveKGEdit({
      id: `edit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: 'ADD_COMPETENCY',
      payload: newComp as any,
    });

    data.competencies.push(newComp);
    setSelectedComp(newComp);
    setToastMsg(`Knowledge Graph Updated! Added node: "${newCompTitle}"`);
    setShowUpdateModal(false);
    setNewCompTitle('');
    setNewCompOutcome('');
    setNewDomain('');
    setNewTeachingActivity('');

    setTimeout(() => setToastMsg(''), 3500);
  };

  return (
    <>
      {toastMsg && (
        <div className="floating-toast animate-fade-in">
          <CheckCircle2 size={18} className="text-green" />
          <span>{toastMsg}</span>
        </div>
      )}

      <div className="page-header space-between">
        <div>
          <p className="eyebrow">Relationships · Explainable by Design</p>
          <h1>Curriculum Knowledge Graph</h1>
          <p className="muted">Explore how curriculum nodes connect evidence directly to next-day remedial resources.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button className="primary" onClick={() => setShowUpdateModal(true)}>
            <Plus size={16} /> Update Knowledge Graph
          </button>
          <button className="secondary" onClick={() => navigate('/teacher/knowledge-graph')}>
            <Network size={16} /> Open Explorer & Editor
          </button>
          <button className="secondary" onClick={() => setStudyModalOpen(true)}>
            <Sparkles size={16} /> Study Materials Guide
          </button>
        </div>
      </div>

      <div className="graph-layout">
        <div className="panel graph-canvas">
          <div className="graph-legend">
            <span><i className="node curriculum" /> Curriculum</span>
            <span><i className="node academic" /> Academic</span>
            <span><i className="node evidence" /> Evidence</span>
          </div>
          <div className="graph-tree">
            <div className="graph-node root">AY2026_27<br /><small>Academic Year</small></div>
            <div className="connector vertical" />
            <div className="graph-node framework">NEP 2020 Learning Recovery<br /><small>Curriculum Framework</small></div>
            <div className="connector vertical" />
            <div className="graph-branches">
              <div>
                <div className="connector horizontal" />
                <div className="graph-node academic">Classes 6–12<br /><small>Classes 6–12</small></div>
                <div className="connector vertical" />
                <div className="graph-node subject">{data.subjects[0].name}<br /><small>Subject</small></div>
                <div className="connector vertical" />
                <div className="graph-node domain">{selectedComp.domain}<br /><small>Domain</small></div>
                <div className="connector vertical" />
                <div className="graph-node competency">{selectedComp.title}<br /><small>Competency</small></div>
              </div>
              <div className="side-node">
                <span>→</span>
                <div className="graph-node resource" onClick={() => setStudyModalOpen(true)} style={{ cursor: 'pointer' }}>
                  5-Level Resources<br /><small>Click to view</small>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="panel detail-panel">
          <p className="eyebrow">Selected Node</p>
          <h2>{selectedComp.title}</h2>
          <p className="muted">{selectedComp.outcome}</p>

          <div className="detail-section">
            <strong>Target Standard & Domain</strong>
            <span>{selectedComp.standardId.toUpperCase()} · {selectedComp.domain}</span>
          </div>

          <div className="detail-section">
            <strong>Next-Day Teaching Action</strong>
            <span>{selectedComp.teachingActivity}</span>
          </div>

          <button className="primary full" onClick={() => setStudyModalOpen(true)}>
            Open Level Remedial Pack <ArrowRight size={15} />
          </button>
        </div>
      </div>

      <StudyMaterialModal
        isOpen={studyModalOpen}
        onClose={() => setStudyModalOpen(false)}
        data={data}
        initialLevelId={selectedComp.levelId}
        initialSubjectId={selectedComp.subjectId}
      />

      {/* Update Knowledge Graph Modal */}
      {showUpdateModal && (
        <div className="modal-overlay" onClick={() => setShowUpdateModal(false)}>
          <div className="modal-content animate-fade-in" onClick={e => e.stopPropagation()}>
            <div className="modal-header space-between">
              <h3><Sparkles size={18} className="text-teal" /> Update Knowledge Graph Node</h3>
              <button className="icon-button" onClick={() => setShowUpdateModal(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveCompetency}>
              <div className="form-row-2">
                <div className="form-group">
                  <label>Target Class / Standard</label>
                  <select
                    value={newStandardId}
                    onChange={e => {
                      const std = e.target.value;
                      setNewStandardId(std);
                      const validSubs = CLASS_SUBJECT_MAP[std] || ['hin', 'eng', 'mat', 'sci'];
                      if (!validSubs.includes(newCompSubjectId)) {
                        setNewCompSubjectId(validSubs[0]);
                      }
                    }}
                  >
                    {Object.entries(CLASS_LABELS).map(([id, label]) => (
                      <option key={id} value={id}>{label}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Subject (Class-Based)</label>
                  <select
                    value={newCompSubjectId}
                    onChange={e => setNewCompSubjectId(e.target.value)}
                  >
                    {availableSubjectsForStandard.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Curriculum Domain</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Number System, Optics, Cell Biology, Algebra..."
                  value={newDomain}
                  onChange={e => setNewDomain(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Competency / Skill Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Solve linear equations with two variables"
                  value={newCompTitle}
                  onChange={e => setNewCompTitle(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Learning Outcome Description</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Describe what students will master through this node..."
                  value={newCompOutcome}
                  onChange={e => setNewCompOutcome(e.target.value)}
                />
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label>Target Difficulty Level</label>
                  <select value={newCompLevelId} onChange={e => setNewCompLevelId(e.target.value)}>
                    {data.levels.map(l => (
                      <option key={l.id} value={l.id}>
                        {l.code} - {getLevelLabel(newCompSubjectId, l.id)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Next-Day Remedial Teaching Action</label>
                  <input
                    type="text"
                    placeholder="Actionable remedial activity for low performers"
                    value={newTeachingActivity}
                    onChange={e => setNewTeachingActivity(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="secondary" onClick={() => setShowUpdateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="primary">
                  <Save size={16} /> Save Node to Knowledge Graph
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

// ── Schools View ────────────────────────────────────────────────────────────
export function Schools({ data }: { data: SeedData }) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState('');

  return (
    <>
      {toastMsg && (
        <div className="floating-toast">
          <CheckCircle2 size={18} className="text-green" />
          <span>{toastMsg}</span>
        </div>
      )}

      <PageHeader
        eyebrow="Delivery Structure"
        title="Schools & Multi-Grade Units"
        description="School delivery structures with multi-grade classrooms across rural learning centers."
        action={
          <button className="primary" onClick={() => setShowAddModal(true)}>
            + Add School Unit
          </button>
        }
      />

      <div className="stat-grid">
        <div className="mini-stat"><strong>2</strong><span>Active Schools</span></div>
        <div className="mini-stat"><strong>{data.classrooms.length}</strong><span>Classroom Units</span></div>
        <div className="mini-stat"><strong>{data.stats.teachers}</strong><span>Teachers</span></div>
        <div className="mini-stat"><strong>{data.students.length}</strong><span>Enrolled Students</span></div>
      </div>

      <div className="panel list-panel">
        {[
          { name: 'Hans Vriksh Demo School', location: 'Bahraich District · Block Central', classes: 5 },
          { name: 'Nadiya Community Learning Center', location: 'Shrawasti District · Block North', classes: 3 }
        ].map((school) => (
          <div className="school-row" key={school.name}>
            <div className="school-icon"><BookOpen size={18} /></div>
            <div>
              <strong>{school.name}</strong>
              <span>{school.location}</span>
            </div>
            <span className="tag success">Active</span>
            <span>{school.classes} Classrooms</span>
            <button className="link-button" onClick={() => setSelectedSchool(school.name)}>
              Open <ArrowRight size={13} />
            </button>
          </div>
        ))}
      </div>

      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content animate-fade-in" onClick={e => e.stopPropagation()}>
            <div className="modal-header space-between">
              <h3>Add School Center</h3>
              <button className="icon-button" onClick={() => setShowAddModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={e => { e.preventDefault(); setShowAddModal(false); setToastMsg('School unit registered'); }}>
              <div className="form-group">
                <label>School / Center Name</label>
                <input required placeholder="e.g. Hans Vriksh Shrawasti Center 2" />
              </div>
              <div className="form-group">
                <label>District & Block</label>
                <input required placeholder="e.g. Bahraich · Block South" />
              </div>
              <div className="modal-actions">
                <button type="button" className="secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="primary"><Save size={15} /> Save School</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedSchool && (
        <div className="modal-overlay" onClick={() => setSelectedSchool(null)}>
          <div className="modal-content animate-fade-in" onClick={e => e.stopPropagation()}>
            <div className="modal-header space-between">
              <h3>{selectedSchool}</h3>
              <button className="icon-button" onClick={() => setSelectedSchool(null)}><X size={18} /></button>
            </div>
            <p className="muted">Assigned classrooms in this unit:</p>
            <div className="cards-stack">
              {data.classrooms.map(c => (
                <div className="history-item-card" key={c.id}>
                  <strong>{c.name}</strong>
                  <small className="muted">{c.teacherName} · {c.academicYear}</small>
                </div>
              ))}
            </div>
            <div className="modal-actions">
              <button className="secondary" onClick={() => setSelectedSchool(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ── Sync Queue View ─────────────────────────────────────────────────────────
export function SyncQueue({ data }: { data: SeedData }) {
  const [syncing, setSyncing] = useState(false);
  const [synced, setSynced] = useState(false);

  const handleSync = () => {
    setSyncing(true);
    setTimeout(() => {
      setSyncing(false);
      setSynced(true);
      setTimeout(() => setSynced(false), 4000);
    }, 2000);
  };

  return (
    <>
      <PageHeader
        eyebrow="Offline First"
        title="Synchronization Queue"
        description="Local actions and assessments remain safe on your device until network connection is available."
        action={
          <button className="primary" disabled={syncing} onClick={handleSync}>
            <RefreshCw size={16} className={syncing ? 'spin' : ''} /> {syncing ? 'Syncing with Server…' : 'Sync Offline Records'}
          </button>
        }
      />

      {synced && (
        <div className="notice teacher animate-fade-in">
          <CheckCircle2 size={18} className="text-green" />
          <span>All 7 offline assessment records synchronized successfully!</span>
        </div>
      )}

      <div className="sync-banner">
        <span className="status-dot" />
        <div>
          <strong>{synced ? '0' : data.stats.sync} records waiting locally on device</strong>
          <span>Nothing is lost. The local Dexie IndexedDB cache automatically replays pending logs.</span>
        </div>
      </div>

      <div className="panel list-panel">
        {[
          'September pulse · Grade 1, 3, 4 Room B',
          'Evidence batch · 14 student results mapped',
          'Parent cards · 8 generated & printed',
          'Teaching group · Fractions & Concrete Counting',
          'Custom Student Record · Added to Register'
        ].map((item, index) => (
          <div className="school-row" key={item}>
            <div className="record-icon"><RefreshCw size={16} /></div>
            <div>
              <strong>{item}</strong>
              <span>Created {index + 1} hour{index ? 's' : ''} ago · Saved locally</span>
            </div>
            <span className={`tag ${synced ? 'success' : 'warning'}`}>{synced ? 'Synced' : 'Pending'}</span>
            <span className="version">Dexie v3</span>
          </div>
        ))}
      </div>
    </>
  );
}

// ── My Classes & Monthwise Reports View ─────────────────────────────────────
export function Classes({ data }: { data: SeedData }) {
  const navigate = useNavigate();
  const [selectedClassId, setSelectedClassId] = useState<string>(data.classrooms[0]?.id || 'class-6-a');
  const [selectedMonthName, setSelectedMonthName] = useState<string>('September');
  const [selectedYear, setSelectedYear] = useState<string>('2026');
  const selectedMonth = `${selectedMonthName} ${selectedYear}`;
  const [studyModalOpen, setStudyModalOpen] = useState<boolean>(false);
  const [activeStudyLevel, setActiveStudyLevel] = useState<string>('l3');
  const [selectedStudentForCard, setSelectedStudentForCard] = useState<Student | null>(null);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  const currentClass = data.classrooms.find(c => c.id === selectedClassId) || data.classrooms[0];
  
  const allClassStudents = data.students.filter(s => s.classId === selectedClassId);
  
  const filteredClassStudents = React.useMemo(() => {
    if (!searchQuery) return allClassStudents;
    return allClassStudents.filter(s =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.parentName && s.parentName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      s.rollNumber.toString().includes(searchQuery)
    );
  }, [allClassStudents, searchQuery]);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [selectedClassId, searchQuery, selectedMonth]);

  const totalPages = Math.max(1, Math.ceil(filteredClassStudents.length / pageSize));
  const paginatedClassStudents = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredClassStudents.slice(start, start + pageSize);
  }, [filteredClassStudents, currentPage, pageSize]);

  // Group counts for L1 to L5
  const levelCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  allClassStudents.forEach(s => {
    const lvlNum = s.monthwiseLevels?.[selectedMonth] || (s.currentLevelId ? parseInt(s.currentLevelId.replace('l', ''), 10) : 3);
    levelCounts[lvlNum] = (levelCounts[lvlNum] || 0) + 1;
  });

  const openStudyMaterial = (lvlId: string, student?: Student) => {
    setActiveStudyLevel(lvlId);
    setStudyModalOpen(true);
  };

  return (
    <div className="classes-page animate-fade-in">
      {/* Header */}
      <div className="page-header space-between">
        <div>
          <p className="eyebrow">Teacher Dashboard · Classroom Evidence</p>
          <h1>Classroom Dashboard & Monthly Reports</h1>
          <p className="muted">
            Namaste, Sunita Jha. View multi-grade classrooms, monthly student levels, and click any level flag for instant remedial study materials.
          </p>
        </div>
        <div className="action-buttons-row">
          <button className="secondary" onClick={() => navigate('/teacher/student-register')}>
            <UserPlus size={16} /> Student Register
          </button>
          <button className="primary" onClick={() => navigate('/teacher/new-assessment')}>
            <ClipboardCheck size={16} /> Start 5-Min Assessment
          </button>
        </div>
      </div>

      {/* Classroom Switcher Tabs */}
      <div className="classrooms-ribbon">
        {data.classrooms.map(c => {
          const count = data.students.filter(s => s.classId === c.id).length;
          return (
            <div
              key={c.id}
              className={`classroom-card-pill ${selectedClassId === c.id ? 'active' : ''}`}
              onClick={() => setSelectedClassId(c.id)}
            >
              <div className="c-info">
                <strong>{c.name}</strong>
                <small>{count} Students · {c.teacherName}</small>
              </div>
            </div>
          );
        })}
      </div>

      {/* Stats Summary Bar */}
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-icon blue"><User size={18} /></div>
          <div><strong>{allClassStudents.length}</strong><span>Students in Room</span><small>{currentClass?.name}</small></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green"><CheckCircle2 size={18} /></div>
          <div><strong>{allClassStudents.length}</strong><span>Assessed ({selectedMonth.split(' ')[0]})</span><small>100% evaluated</small></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon orange"><Sparkles size={18} /></div>
          <div><strong>5</strong><span>Learning Groups</span><small>L1 Foundation to L5</small></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon purple"><ShieldCheck size={18} /></div>
          <div><strong>{allClassStudents.length}</strong><span>Parent Cards Ready</span><small>Ready to print</small></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon teal"><Calendar size={18} /></div>
          <div><strong>{selectedMonth}</strong><span>Active Cycle</span><small>Offline ready</small></div>
        </div>
      </div>

      {/* 5-Level Groups Breakdown (Matching THF Mockup) */}
      <div className="panel mb-4">
        <div className="panel-heading space-between">
          <div>
            <h3>Learning Groups & Next-Day Teaching Plan ({currentClass?.name})</h3>
            <p className="muted">Tap any group to view student roster and open targeted remedial worksheets.</p>
          </div>
          <div className="month-selector-inline" style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <label>Cycle:</label>
            <select value={selectedMonthName} onChange={e => setSelectedMonthName(e.target.value)}>
              {MONTHS_LIST.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
            <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)}>
              {YEARS_LIST.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="learning-groups-row">
          {data.levels.map((lvl, idx) => {
            const count = levelCounts[idx + 1] || 0;
            return (
              <div
                className="learning-group-tile"
                key={lvl.id}
                style={{ borderTopColor: lvl.color }}
                onClick={() => openStudyMaterial(lvl.id)}
              >
                <div className="group-tile-top">
                  <span className="lvl-chip" style={{ backgroundColor: lvl.color }}>{lvl.code}</span>
                  <span className="lvl-count">{count} Students</span>
                </div>
                <strong>{lvl.name}</strong>
                <p className="tiny-note">Click for study material</p>
                <button
                  className="small-button secondary mt-2"
                  style={{ color: lvl.color, borderColor: lvl.color }}
                  onClick={(e) => {
                    e.stopPropagation();
                    openStudyMaterial(lvl.id);
                  }}
                >
                  <BookOpen size={13} /> Open Pack
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Student List with Prominent Clickable Level Flags */}
      <div className="panel list-panel">
        <div className="list-toolbar space-between">
          <div className="search">
            <input
              type="text"
              placeholder="Search student by name or roll..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="action-buttons-row">
            <button className="secondary small" onClick={() => navigate('/teacher/student-register')}>
              <UserPlus size={14} /> + Add Student
            </button>
            <button className="primary small" onClick={() => navigate('/teacher/new-assessment')}>
              <ClipboardCheck size={14} /> + Upload Results CSV
            </button>
          </div>
        </div>

        <div className="students-table-container">
          <table className="custom-data-table">
            <thead>
              <tr>
                <th>Roll</th>
                <th>Student Name</th>
                <th>Grade</th>
                <th>Parent Name & Phone</th>
                <th>Recent Assessment Flag (Click for Remedial)</th>
                <th>Parent Signal</th>
                <th className="text-right">Progress Card</th>
              </tr>
            </thead>
            <tbody>
              {paginatedClassStudents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="empty-table-cell">No students found matching search.</td>
                </tr>
              ) : (
                paginatedClassStudents.map(student => {
                  const lvlNum = student.monthwiseLevels?.[selectedMonth] || (student.currentLevelId ? parseInt(student.currentLevelId.replace('l', ''), 10) : 3);
                  const levelObj = data.levels[lvlNum - 1] || data.levels[2];

                  return (
                    <tr key={student.id}>
                      <td>
                        <span className="roll-badge">#{student.rollNumber}</span>
                      </td>
                      <td>
                        <div className="student-name-cell">
                          <strong>{student.name}</strong>
                          <small className="muted">{student.gender || 'Student'} · {student.admission}</small>
                        </div>
                      </td>
                      <td>
                        <span className="class-tag">{student.gradeLevel || 'Grade 3'}</span>
                      </td>
                      <td>
                        <div className="contact-cell">
                          <strong>{student.parentName || 'Parent'}</strong>
                          {student.parentPhone && <small className="muted">{student.parentPhone}</small>}
                        </div>
                      </td>
                      <td>
                        {/* PROMINENT CLICKABLE LEVEL FLAG REDIRECTING TO STUDY MATERIAL */}
                        <button
                          className="level-flag-btn"
                          style={{
                            backgroundColor: levelObj.color,
                            color: '#fff',
                            borderColor: levelObj.color,
                          }}
                          title={`Click to open ${levelObj.name} remedial worksheets and teaching guides`}
                          onClick={() => openStudyMaterial(levelObj.id, student)}
                        >
                          <span className="flag-icon">{levelObj.icon}</span>
                          <span className="flag-code">{levelObj.code}</span>
                          <span className="flag-name">{levelObj.name.split('/')[0]}</span>
                          <Sparkles size={12} className="flag-sparkle" />
                        </button>
                      </td>
                      <td>
                        <span className={`trend-pill ${student.trend === 'Improving' ? 'trend-green' : student.trend === 'Review required' ? 'trend-orange' : 'trend-blue'}`}>
                          {student.trend}
                        </span>
                      </td>
                      <td className="text-right">
                        <button
                          className="small-button secondary highlight-teal"
                          onClick={() => setSelectedStudentForCard(student)}
                        >
                          <Eye size={13} /> View Card
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Toolbar */}
        <div className="table-pagination-bar">
          <div className="table-pagination-info">
            <span>
              Showing {filteredClassStudents.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} to{' '}
              {Math.min(currentPage * pageSize, filteredClassStudents.length)} of {filteredClassStudents.length} students
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

      {/* Student Progress Card Modal (Matching Mockup Screen 9) */}
      {selectedStudentForCard && (
        <div className="modal-overlay" onClick={() => setSelectedStudentForCard(null)}>
          <div className="modal-content student-progress-modal animate-fade-in" onClick={e => e.stopPropagation()}>
            <div className="modal-header space-between">
              <div className="student-profile-header">
                <div className="avatar-big warm">
                  {selectedStudentForCard.name.slice(0, 2)}
                </div>
                <div>
                  <p className="eyebrow">Student Progress · {selectedMonth}</p>
                  <h3>{selectedStudentForCard.name}</h3>
                  <small className="muted">{selectedStudentForCard.gradeLevel} · Roll #{selectedStudentForCard.rollNumber} · {currentClass.name}</small>
                </div>
              </div>
              <button className="icon-button" onClick={() => setSelectedStudentForCard(null)}><X size={18} /></button>
            </div>

            <div className="progress-domains-grid">
              <div className="domain-score-box">
                <span className="d-icon">📖</span>
                <div>
                  <strong>Reading Level</strong>
                  <small className="muted">{selectedStudentForCard.readingLevel || 'Sentence Reader (L4)'}</small>
                </div>
                <span className="d-badge" style={{ backgroundColor: '#2b927d' }}>L4</span>
              </div>

              <div className="domain-score-box">
                <span className="d-icon">✍️</span>
                <div>
                  <strong>Writing Level</strong>
                  <small className="muted">{selectedStudentForCard.writingLevel || 'Paragraphs (L5)'}</small>
                </div>
                <span className="d-badge" style={{ backgroundColor: '#3777a8' }}>L5</span>
              </div>

              <div className="domain-score-box">
                <span className="d-icon">🔢</span>
                <div>
                  <strong>Numeracy Level</strong>
                  <small className="muted">{selectedStudentForCard.numeracyLevel || '2-Digit Addition (L3)'}</small>
                </div>
                <span className="d-badge" style={{ backgroundColor: '#ad9b31' }}>L3</span>
              </div>
            </div>

            <div className="parent-signal-card">
              <div className="signal-top">
                <span className="signal-indicator green">🟢</span>
                <div>
                  <strong>Parent Progress Signal: Improving</strong>
                  <p className="muted">Showing consistent growth across foundational competencies.</p>
                </div>
              </div>
            </div>

            <div className="teacher-note-box">
              <strong>Teacher's Action Plan & Next-Step Intervention:</strong>
              <p className="note-text">
                "{selectedStudentForCard.notes || `${selectedStudentForCard.name} has demonstrated good progress in sentence reading. Next month, focus on basic story comprehension and introducing subtraction with regrouping in Numeracy.`}"
              </p>
            </div>

            <div className="modal-actions space-between">
              <button
                className="secondary highlight-teal"
                onClick={() => {
                  openStudyMaterial(selectedStudentForCard.currentLevelId || 'l3', selectedStudentForCard);
                  setSelectedStudentForCard(null);
                }}
              >
                <BookOpen size={15} /> Open Targeted Study Material
              </button>
              <button className="secondary" onClick={() => setSelectedStudentForCard(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Study Material Modal from Clickable Level Flag */}
      <StudyMaterialModal
        isOpen={studyModalOpen}
        onClose={() => setStudyModalOpen(false)}
        data={data}
        initialLevelId={activeStudyLevel}
      />
    </div>
  );
}

// ── Assessments Studio ──────────────────────────────────────────────────────
export function Assessments({ data }: { data: SeedData }) {
  const navigate = useNavigate();
  const [generated, setGenerated] = useState(false);
  const questions = generateMonthlyPulse(data, 'std-6', 'mat');

  const handlePrint = () => {
    downloadStudentPaper({
      id: `paper-std6-${Date.now()}`,
      setName: 'std6_sep2026_set01',
      timestamp: new Date().toISOString(),
      classId: 'std-6',
      className: 'Grade 6 · Section A',
      subjectId: 'mat',
      subjectName: 'Mathematics',
      targetLevelId: 'l3',
      targetLevelName: 'Balanced Coverage',
      totalQuestions: questions.length,
      questions,
      levelDistribution: { l1: 1, l2: 1, l3: 1, l4: 1, l5: 1 }
    });
  };

  return (
    <>
      <PageHeader
        eyebrow="Assessment Studio"
        title="Monthly Pulse Generator"
        description="One question per active performance level. Five minutes, printable and explainable."
        action={
          <div className="action-buttons-row">
            <button className="secondary" onClick={() => navigate('/teacher/saved-sets')}>
              <FileText size={16} /> Saved Sets
            </button>
            <button className="primary" onClick={() => setGenerated(true)}>
              <ClipboardCheck size={17} /> Generate 5-Min Pulse
            </button>
          </div>
        }
      />

      {generated && (
        <div className="notice teacher animate-fade-in">
          <CheckCircle2 size={19} className="text-green" />
          <div>
            <strong>STD6_MAT_202609_SET01 is Ready</strong>
            <span>{questions.length} Questions · 5 Minutes · Coverage across L1–L5 · Balanced Framing</span>
          </div>
          <button className="primary small" onClick={handlePrint}>
            <Download size={15} /> Print Paper (PDF)
          </button>
        </div>
      )}

      <div className="assessment-layout">
        <div className="panel">
          <div className="panel-heading">
            <div>
              <h3>September 2026 · Grade 6 Mathematics</h3>
              <p className="muted">Hans Vriksh Demo School · Grade 6, Section A</p>
            </div>
            <span className="tag success">Active</span>
          </div>

          <div className="config-list">
            <div><span>Assessment Mode</span><strong>5-Minute Monthly Pulse</strong></div>
            <div><span>Level Framework</span><strong>Five-Level Learning Recovery</strong></div>
            <div><span>Question Count</span><strong>{questions.length} Calibrated Items</strong></div>
            <div><span>Duration</span><strong>5 Minutes</strong></div>
          </div>

          <h4>Question Coverage Across Levels</h4>
          {data.levels.map((level, index) => (
            <div className="coverage-row" key={level.id}>
              <i style={{ background: level.color }}>{level.icon}</i>
              <div>
                <strong>{level.code} · {level.name}</strong>
                <small>{questions[index]?.text ?? 'Question selected from Knowledge Graph pool'}</small>
              </div>
              <span className="tag success">1 Question</span>
            </div>
          ))}
        </div>

        <div className="panel recommendation">
          <Sparkles size={21} />
          <h3>Designed for Next-Day Action</h3>
          <p>Each selected item maps to one competency and one level. After results are uploaded via CSV, the learner's unmet prerequisite guides the next-day activity.</p>
          <div className="recommendation-box">
            <strong>Example Recommendation:</strong>
            <span>{getRecommendation('Foundation')}</span>
          </div>
          <button className="primary full" onClick={handlePrint}>
            <Download size={15} /> Download Student Paper (PDF)
          </button>
        </div>
      </div>
    </>
  );
}

// ── Teaching Groups View ────────────────────────────────────────────────────
export function TeachingGroups({ data }: { data: SeedData }) {
  const [studyModalOpen, setStudyModalOpen] = useState(false);
  const [activeLevel, setActiveLevel] = useState('l1');
  const [refreshed, setRefreshed] = useState(false);

  const handleRefresh = () => {
    setRefreshed(true);
    setTimeout(() => setRefreshed(false), 3000);
  };

  const openMaterial = (lvl: string) => {
    setActiveLevel(lvl);
    setStudyModalOpen(true);
  };

  return (
    <>
      <PageHeader
        eyebrow="Next-Day Teaching"
        title="Dynamic Teaching Groups"
        description="Flexible groups built from competency evidence, not a permanent label."
        action={
          <button className="primary" onClick={handleRefresh}>
            <RefreshCw size={15} className={refreshed ? 'spin' : ''} /> {refreshed ? 'Groups Refreshed!' : 'Refresh Groups'}
          </button>
        }
      />

      {refreshed && (
        <div className="notice teacher animate-fade-in">
          <CheckCircle2 size={18} className="text-green" />
          <span>Teaching groups synchronized with latest September assessment evidence!</span>
        </div>
      )}

      <div className="group-grid">
        {[
          ['Foundation · Concrete Counting', '#d95c59', 'l1', 12, 'Tactile counters and number lines'],
          ['Emerging · Place Value & Bundles', '#d58a32', 'l2', 9, 'Matchstick bundles of 10 and ten-frames'],
          ['Developing · 2-Digit Addition', '#ad9b31', 'l3', 14, 'Semi-abstract bar models & guided carryover'],
          ['Proficient · Sentence Reading', '#2b927d', 'l4', 8, 'Story comprehension & inference cards'],
          ['Advanced · Problem Solving', '#3777a8', 'l5', 5, 'Open-ended investigations & student peer tutoring']
        ].map(group => (
          <div className="panel group-card" key={group[0] as string}>
            <div className="group-head">
              <i style={{ background: group[1] as string }} />
              <div>
                <h3>{group[0] as string}</h3>
                <span>{group[2].toString().toUpperCase()} · September Evidence</span>
              </div>
            </div>
            <strong className="group-count">{group[3] as number} <small>Learners</small></strong>
            <div className="recommendation-box">
              <strong>Next-Day Activity:</strong>
              <span>{group[4] as string}</span>
            </div>
            <button className="primary full" onClick={() => openMaterial(group[2] as string)}>
              <BookOpen size={15} /> Open Remedial Pack <ArrowRight size={15} />
            </button>
          </div>
        ))}
      </div>

      <StudyMaterialModal
        isOpen={studyModalOpen}
        onClose={() => setStudyModalOpen(false)}
        data={data}
        initialLevelId={activeLevel}
      />
    </>
  );
}

// ── Parent Progress Cards View ──────────────────────────────────────────────
export function ParentProgress({ data }: { data: SeedData }) {
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [toastMsg, setToastMsg] = useState('');

  const handlePrintAll = () => {
    const doc = new jsPDF();
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('SHIKSHA SETU — PARENT PROGRESS CARDS BATCH', 20, 20);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('September 2026 Cycle · Hans Vriksh Multi-Grade Classrooms', 20, 28);

    data.students.slice(0, 10).forEach((s, idx) => {
      const y = 40 + (idx % 4) * 55;
      if (idx > 0 && idx % 4 === 0) doc.addPage();
      doc.rect(20, y, 170, 50);
      doc.setFont('helvetica', 'bold');
      doc.text(`Student: ${s.name} (Roll #${s.rollNumber})`, 25, y + 10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Parent: ${s.parentName || 'Parent / Guardian'} · Phone: ${s.parentPhone || '—'}`, 25, y + 18);
      doc.text(`Current Focus: ${s.focus} | Signal: ${s.trend}`, 25, y + 26);
      doc.text(`Home Support Tip: Practice 5 minutes of daily counting or reading conversation at home.`, 25, y + 36);
    });

    doc.save('Parent_Progress_Cards_Batch.pdf');
    setToastMsg('Downloaded 10 Parent Progress Cards (PDF)');
    setTimeout(() => setToastMsg(''), 3500);
  };

  return (
    <>
      {toastMsg && (
        <div className="floating-toast">
          <CheckCircle2 size={18} className="text-green" />
          <span>{toastMsg}</span>
        </div>
      )}

      <PageHeader
        eyebrow="Family Connection"
        title="Parent Progress Signals"
        description="Print-friendly signals that make learning progress easy to discuss without diagnostic labels."
        action={
          <button className="primary" onClick={handlePrintAll}>
            <Download size={16} /> Print All Parent Cards (PDF)
          </button>
        }
      />

      <div className="notice">
        <ShieldCheck size={19} />
        <div>
          <strong>Simple & Actionable by Design</strong>
          <span>Cards show a learner's current focus, a positive growth signal, and one 5-minute home practice suggestion.</span>
        </div>
      </div>

      <div className="panel list-panel">
        {data.students.slice(0, 12).map(student => (
          <div className="student-row" key={student.id}>
            <div className="avatar warm">{student.name.slice(0, 2)}</div>
            <div>
              <strong>{student.name} (Roll #{student.rollNumber})</strong>
              <small>Parent: {student.parentName || 'Parent'} · {student.parentPhone || '—'} · {student.focus}</small>
            </div>
            <span className={`trend-pill ${student.trend === 'Improving' ? 'trend-green' : 'trend-blue'}`}>
              {student.trend}
            </span>
            <button className="link-button" onClick={() => setSelectedStudent(student)}>
              Preview Card <ArrowRight size={13} />
            </button>
          </div>
        ))}
      </div>

      {/* Parent Card Preview Modal */}
      {selectedStudent && (
        <div className="modal-overlay" onClick={() => setSelectedStudent(null)}>
          <div className="modal-content animate-fade-in" onClick={e => e.stopPropagation()}>
            <div className="modal-header space-between">
              <h3>Parent Progress Card Preview</h3>
              <button className="icon-button" onClick={() => setSelectedStudent(null)}><X size={18} /></button>
            </div>

            <div className="parent-card-preview-container">
              <div className="card-brand">
                <strong>SHIKSHA SETU · शिक्षा सेतु</strong>
                <small>Monthly Learning Progress Card</small>
              </div>

              <div className="card-child-info">
                <div><strong>Child:</strong> {selectedStudent.name}</div>
                <div><strong>Roll No:</strong> #{selectedStudent.rollNumber}</div>
                <div><strong>Parent:</strong> {selectedStudent.parentName || 'Parent / Guardian'}</div>
                <div><strong>Phone:</strong> {selectedStudent.parentPhone || '—'}</div>
              </div>

              <div className="card-growth-highlight">
                <span className="badge-growth">🌟 Positive Growth Signal</span>
                <p>{selectedStudent.name} is making steady progress in {selectedStudent.focus}.</p>
              </div>

              <div className="card-home-action">
                <strong>🏠 5-Minute Home Support Suggestion:</strong>
                <p>"Spend 5 minutes asking your child to count small everyday items or read one sentence together before dinner."</p>
              </div>
            </div>

            <div className="modal-actions">
              <button className="secondary" onClick={() => setSelectedStudent(null)}>Close</button>
              <button
                className="primary"
                onClick={() => {
                  const doc = new jsPDF();
                  doc.setFont('helvetica', 'bold');
                  doc.setFontSize(14);
                  doc.text(`Parent Progress Card — ${selectedStudent.name}`, 20, 20);
                  doc.setFontSize(10);
                  doc.setFont('helvetica', 'normal');
                  doc.text(`Roll #${selectedStudent.rollNumber} · Parent: ${selectedStudent.parentName || 'Parent'}`, 20, 30);
                  doc.text(`Focus: ${selectedStudent.focus} | Signal: ${selectedStudent.trend}`, 20, 40);
                  doc.text(`Home Support Tip: 5 minutes daily reading or counting conversation.`, 20, 50);
                  doc.save(`Parent_Card_${selectedStudent.name.replace(/\s+/g, '_')}.pdf`);
                  setSelectedStudent(null);
                }}
              >
                <Printer size={15} /> Download Single Card (PDF)
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
