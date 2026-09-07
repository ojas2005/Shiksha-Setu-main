import React, { useEffect, useState, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowRight, BookOpen, CheckCircle2, ChevronDown, ClipboardCheck, Database,
  FileText, GraduationCap, LayoutDashboard, LogOut, Menu, Network, RefreshCw,
  Search, Settings2, ShieldCheck, Sparkles, Users, Wifi, X, UserPlus,
  BookmarkPlus, Phone, Lock, HeartHandshake, Eye
} from 'lucide-react';
import { registerSW } from 'virtual:pwa-register';
import { demoUsers } from './lib/data';
import { loadData, resetDemoData } from './lib/db';
import type { DemoUser, SeedData } from './types';
import './styles/styles.css';
import './styles/extra.css';
import './styles/ui-polish.css';
import {
  AcademicStructure, Questions, KnowledgeGraph, Schools, SyncQueue,
  Classes, Assessments, TeachingGroups, ParentProgress
} from './views/main-views';
import { AssessmentFlow } from './views/assessment-flow';
import { AssessmentHistory } from './views/assessment-history';
import { KGEditor } from './views/kg-editor';
import { buildEducationGraph } from './lib/knowledge-graph';
import { StudentRegister } from './views/student-register';
import { SavedQuestionSets } from './views/saved-question-sets';

registerSW({ immediate: true });

const navAdmin = [
  { label: 'Overview', path: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Academic structure', path: '/admin/standards', icon: BookOpen },
  { label: 'Question bank', path: '/admin/questions', icon: ClipboardCheck },
  { label: 'Knowledge graph', path: '/admin/knowledge-graph', icon: Network },
  { label: 'Schools & centers', path: '/admin/schools', icon: GraduationCap },
  { label: 'Sync queue', path: '/admin/sync-queue', icon: RefreshCw },
];

const navTeacher = [
  { label: 'My Dashboard', path: '/teacher/dashboard', icon: LayoutDashboard },
  { label: '5-Min Assessment', path: '/teacher/new-assessment', icon: ClipboardCheck },
  { label: 'Saved Question Sets', path: '/teacher/saved-sets', icon: BookmarkPlus },
  { label: 'Student Register', path: '/teacher/student-register', icon: UserPlus },
  { label: 'Classes & Monthly Reports', path: '/teacher/classes', icon: Users },
  { label: 'Teaching Groups', path: '/teacher/teaching-groups', icon: Sparkles },
  { label: 'Parent Cards', path: '/teacher/parent-progress', icon: HeartHandshake },
  { label: 'Assessment History', path: '/teacher/history', icon: FileText },
  { label: 'Knowledge Graph', path: '/teacher/knowledge-graph', icon: Network },
];

// ── Login Component with 1-Click Demo Select & Mobile/Teacher ID Inputs ─────
function Login({ onLogin }: { onLogin: (user: DemoUser) => void }) {
  const [selectedUser, setSelectedUser] = useState<DemoUser>(demoUsers[0]);
  const [mobileNum, setMobileNum] = useState<string>('+91 98765 43210');
  const [teacherId, setTeacherId] = useState<string>('HV-SRW-0142');
  const [activeTab, setActiveTab] = useState<'quick' | 'direct'>('quick');

  const handleQuickSelect = (user: DemoUser) => {
    setSelectedUser(user);
    if (user.mobileNumber) setMobileNum(user.mobileNumber);
    if (user.teacherId) setTeacherId(user.teacherId);
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    onLogin(selectedUser);
  };

  return (
    <main className="login-page">
      <div className="login-art">
        <div className="brand-mark">SS</div>
        <p className="eyebrow">Shiksha Setu · शिक्षा सेतु</p>
        <h1>Five-minute assessment.<br /><em>Next-day teaching action.</em></h1>
        <p className="login-copy">
          An offline-first bridge from multi-grade classroom evidence to immediate remedial teaching moves and transparent parent signals.
        </p>
        <div className="signal-row">
          <span><CheckCircle2 size={16} /> NEP 2020 Multi-Grade Aligned</span>
          <span><Wifi size={16} /> 100% Offline Capable</span>
        </div>
      </div>

      <form className="login-card animate-fade-in" onSubmit={submit}>
        <div className="brand-lockup">
          <div className="brand-mark small">SS</div>
          <div>
            <strong>Shiksha Setu (शिक्षा सेतु)</strong>
            <small>Learning Recovery Workspace</small>
          </div>
        </div>

        <div>
          <p className="eyebrow">Authentication</p>
          <h2>Welcome Back</h2>
          <p className="muted">Choose a demonstration profile or log in with Teacher ID.</p>
        </div>

        {/* 1-Click Role Switcher Tabs */}
        <div className="demo-accounts-stack">
          <label className="input-label">Quick Profile Switcher:</label>
          <div className="profiles-grid">
            {demoUsers.map(user => (
              <button
                type="button"
                key={user.username}
                className={`profile-card-btn ${selectedUser.username === user.username ? 'active' : ''}`}
                onClick={() => handleQuickSelect(user)}
              >
                <div className="p-avatar">{user.name.slice(0, 2)}</div>
                <div className="p-details">
                  <strong>{user.name}</strong>
                  <small>{user.role === 'ADMIN' ? 'System Administrator' : 'Classroom Teacher'}</small>
                </div>
                {selectedUser.username === user.username && <CheckCircle2 size={15} className="text-teal" />}
              </button>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label>Mobile Number (मोबाइल नंबर)</label>
          <div className="input-with-icon">
            <Phone size={16} className="text-muted" />
            <input
              type="text"
              value={mobileNum}
              onChange={e => setMobileNum(e.target.value)}
              placeholder="+91 98765 43210"
            />
          </div>
        </div>

        <div className="form-group">
          <label>Teacher ID / Username (शिक्षक आईडी)</label>
          <div className="input-with-icon">
            <Lock size={16} className="text-muted" />
            <input
              type="text"
              value={teacherId}
              onChange={e => setTeacherId(e.target.value)}
              placeholder="HV-SRW-0142"
            />
          </div>
        </div>

        <button className="primary full" type="submit">
          Enter {selectedUser.role === 'ADMIN' ? 'Admin' : 'Teacher'} Workspace <ArrowRight size={17} />
        </button>

        <p className="tiny-note">
          Offline Local Storage ready. No cloud connection or student data leakage.
        </p>
      </form>
    </main>
  );
}

// ── App Shell ───────────────────────────────────────────────────────────────
function AppShell({
  user,
  data,
  onLogout,
  onReset,
  onRefreshData
}: {
  user: DemoUser;
  data: SeedData;
  onLogout: () => void;
  onReset: () => void;
  onRefreshData: () => void;
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const graph = React.useMemo(() => buildEducationGraph(data), [data]);
  const nav = user.role === 'ADMIN' ? navAdmin : navTeacher;

  return (
    <div className="app-shell">
      <aside className={mobileOpen ? 'sidebar open' : 'sidebar'}>
        <div className="sidebar-top">
          <div className="brand-lockup">
            <div className="brand-mark small">SS</div>
            <div>
              <strong>Shiksha Setu</strong>
              <small>Learning Recovery</small>
            </div>
          </div>
          <button className="icon-button mobile-close" onClick={() => setMobileOpen(false)}>
            <X size={18} />
          </button>
        </div>

        <div className="year-switch">
          <span>Academic Year</span>
          <strong>2026–27 <ChevronDown size={14} /></strong>
        </div>

        <nav>
          {nav.map(item => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <button
                className={isActive ? 'nav-item active' : 'nav-item'}
                key={item.path}
                onClick={() => {
                  navigate(item.path);
                  setMobileOpen(false);
                }}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="sidebar-bottom">
          {user.role === 'ADMIN' && (
            <button className="text-button" onClick={onReset}>
              <RefreshCw size={14} /> Reset Demo Data
            </button>
          )}
          <button className="text-button" onClick={onLogout}>
            <LogOut size={15} /> Sign Out ({user.name.split(' ')[0]})
          </button>
        </div>
      </aside>

      <section className="main-area">
        <header className="topbar">
          <button className="icon-button mobile-menu" onClick={() => setMobileOpen(true)}>
            <Menu size={20} />
          </button>
          <div className="crumb">
            Workspace <span>/</span> {user.role === 'ADMIN' ? 'Administration' : 'Teacher View'} <span>/</span> <strong>{user.name}</strong>
          </div>
          <div className="top-actions">
            <div className="avatar">{user.name.split(' ').map(p => p[0]).join('')}</div>
            <span className="user-name">{user.name} ({user.role})</span>
          </div>
        </header>

        <main className="page-content">
          <Routes>
            {/* Admin Routes */}
            <Route path="/admin/dashboard" element={<AdminDashboard data={data} />} />
            <Route path="/admin/standards" element={<AcademicStructure data={data} />} />
            <Route path="/admin/questions" element={<Questions data={data} />} />
            <Route path="/admin/knowledge-graph" element={<KnowledgeGraph data={data} />} />
            <Route path="/admin/schools" element={<Schools data={data} />} />
            <Route path="/admin/sync-queue" element={<SyncQueue data={data} />} />

            {/* Teacher Routes */}
            <Route path="/teacher/dashboard" element={<TeacherDashboard data={data} />} />
            <Route path="/teacher/new-assessment" element={<AssessmentFlow data={data} graph={graph} onRefreshData={onRefreshData} />} />
            <Route path="/teacher/saved-sets" element={<SavedQuestionSets data={data} onRefreshData={onRefreshData} />} />
            <Route path="/teacher/student-register" element={<StudentRegister data={data} onRefreshData={onRefreshData} />} />
            <Route path="/teacher/classes" element={<Classes data={data} />} />
            <Route path="/teacher/teaching-groups" element={<TeachingGroups data={data} />} />
            <Route path="/teacher/parent-progress" element={<ParentProgress data={data} />} />
            <Route path="/teacher/history" element={<AssessmentHistory data={data} />} />
            <Route path="/teacher/knowledge-graph" element={<KGEditor data={data} graph={graph} />} />
            <Route path="/teacher/assessments" element={<Assessments data={data} />} />

            {/* Default Redirection */}
            <Route
              path="*"
              element={<Navigate to={user.role === 'ADMIN' ? '/admin/dashboard' : '/teacher/dashboard'} replace />}
            />
          </Routes>
        </main>
      </section>
    </div>
  );
}

// ── Admin Dashboard ─────────────────────────────────────────────────────────
function AdminDashboard({ data }: { data: SeedData }) {
  const navigate = useNavigate();
  return (
    <>
      <div className="page-header space-between">
        <div>
          <p className="eyebrow">Administration · Live Monitoring</p>
          <h1>Good morning, Aarav</h1>
          <p className="muted">The Shiksha Setu multi-grade school network is active with local offline assessments.</p>
        </div>
        <button className="primary" onClick={() => navigate('/admin/sync-queue')}>
          <ClipboardCheck size={17} /> Review Sync Queue
        </button>
      </div>

      <div className="notice">
        <Sparkles size={19} />
        <div>
          <strong>Multi-Grade Assessment Network Active</strong>
          <span>Covering Bahraich and Shrawasti rural learning recovery centers under NEP 2020.</span>
        </div>
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-icon orange"><Database size={18} /></div>
          <div><strong>2</strong><span>Schools</span><small>Bahraich & Shrawasti</small></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon blue"><Database size={18} /></div>
          <div><strong>{data.stats.teachers}</strong><span>Active Teachers</span><small>Multi-grade assigned</small></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green"><Database size={18} /></div>
          <div><strong>{data.students.length}</strong><span>Students Enrolled</span><small>Classes 6–12</small></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon purple"><Database size={18} /></div>
          <div><strong>{data.savedSets.length}</strong><span>Saved Sets</span><small>stand_month_setno</small></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon yellow"><Database size={18} /></div>
          <div><strong>{data.stats.sync}</strong><span>Offline Logs</span><small>Ready to sync</small></div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="panel wide">
          <div className="panel-heading">
            <div>
              <h3>Learning Recovery Pulse</h3>
              <p className="muted">Multi-month mastery progression across foundational levels</p>
            </div>
            <span className="tag success">Jul–Sep 2026</span>
          </div>
          <div className="bars">
            {['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'].map((month, index) => (
              <div className="bar-col" key={month}>
                <div className="bar-track">
                  <div className="bar" style={{ height: `${48 + index * 7}%` }} />
                  <div className="bar second" style={{ height: `${32 + index * 5}%` }} />
                </div>
                <small>{month}</small>
              </div>
            ))}
          </div>
          <div className="legend">
            <span><i className="legend-dot teal" /> Proficient or Above (L4–L5)</span>
            <span><i className="legend-dot pale" /> Developing (L1–L3)</span>
          </div>
        </div>

        <div className="panel">
          <div className="panel-heading">
            <h3>Learners Requiring Support</h3>
            <button className="link-button" onClick={() => navigate('/admin/standards')}>View Master Standards</button>
          </div>
          {data.students.filter(student => student.trend === 'Review required').slice(0, 4).map(student => (
            <div className="student-row" key={student.id}>
              <div className="avatar warm">{student.name.slice(0, 2)}</div>
              <div>
                <strong>{student.name} (Roll #{student.rollNumber})</strong>
                <small>Parent: {student.parentPhone || '—'} · {student.level}</small>
              </div>
              <span className="flag">Review Needed</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

// ── Teacher Dashboard ───────────────────────────────────────────────────────
function TeacherDashboard({ data }: { data: SeedData }) {
  const navigate = useNavigate();
  return (
    <>
      <div className="page-header space-between">
        <div>
          <p className="eyebrow">Teacher Workspace · Namaste, Sunita Devi</p>
          <h1>Next-Day Teaching Action Center</h1>
          <p className="muted">5-minute assessments, multi-grade student registers, and instant remedial actions.</p>
        </div>
        <button className="primary" onClick={() => navigate('/teacher/new-assessment')}>
          <ClipboardCheck size={17} /> Start 5-Min Assessment
        </button>
      </div>

      <div className="notice teacher">
        <Sparkles size={19} />
        <div>
          <strong>Tomorrow's Multi-Grade Teaching Plan Ready</strong>
          <span>14 learners in Grade 1, 3, 4 Room B need a concrete number matching & letter recognition activity.</span>
        </div>
        <button className="secondary" onClick={() => navigate('/teacher/teaching-groups')}>
          Open Teaching Groups
        </button>
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-icon blue"><Users size={18} /></div>
          <div><strong>{data.students.length}</strong><span>Students Registered</span><small>With parent phone/emails</small></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon orange"><ClipboardCheck size={18} /></div>
          <div><strong>{data.savedSets.length}</strong><span>Saved Sets</span><small>stand_month_setno</small></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green"><Sparkles size={18} /></div>
          <div><strong>100%</strong><span>Offline Ready</span><small>Saved on device</small></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon purple"><ShieldCheck size={18} /></div>
          <div><strong>{data.students.length}</strong><span>Parent Cards</span><small>Ready to print</small></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon teal"><BookOpen size={18} /></div>
          <div><strong>5</strong><span>Learning Levels</span><small>L1 Foundation to L5</small></div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="panel wide">
          <div className="panel-heading">
            <div>
              <h3>Class Learning Signals ({data.classrooms[0]?.name})</h3>
              <p className="muted">Latest competency level and evidence completeness</p>
            </div>
            <button className="link-button" onClick={() => navigate('/teacher/classes')}>
              Monthly Reports <ArrowRight size={14} />
            </button>
          </div>

          <div className="signal-table">
            <div className="table-head">
              <span>Classroom</span>
              <span>Students</span>
              <span>Evidence Complete</span>
              <span>Signal</span>
            </div>
            {data.classrooms.map((c, index) => {
              const count = data.students.filter(s => s.classId === c.id).length;
              return (
                <div className="table-row" key={c.id}>
                  <strong>{c.name}</strong>
                  <span>{count} learners</span>
                  <div className="progress"><i style={{ width: `${88 - index * 10}%` }} /></div>
                  <span className={`tag ${index === 0 ? 'success' : 'warning'}`}>
                    {index === 0 ? 'Assessed (Sep)' : 'On Track'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="panel action-panel">
          <h3>Quick Actions</h3>

          <button className="action-link" onClick={() => navigate('/teacher/new-assessment')}>
            <ClipboardCheck size={17} />
            <span>
              <strong>Frame Knowledge Graph Assessment</strong>
              <small>Calibrated questions covering L1 to L5</small>
            </span>
            <ArrowRight size={15} />
          </button>

          <button className="action-link" onClick={() => navigate('/teacher/saved-sets')}>
            <BookmarkPlus size={17} />
            <span>
              <strong>Saved Question Sets (stand_month_setno)</strong>
              <small>Download student paper & teacher answer keys</small>
            </span>
            <ArrowRight size={15} />
          </button>

          <button className="action-link" onClick={() => navigate('/teacher/student-register')}>
            <UserPlus size={17} />
            <span>
              <strong>Student Register & Parent Contacts</strong>
              <small>Map multi-grade rooms & parent phone numbers</small>
            </span>
            <ArrowRight size={15} />
          </button>

          <button className="action-link" onClick={() => navigate('/teacher/classes')}>
            <Users size={17} />
            <span>
              <strong>Monthly Reports & Clickable Level Flags</strong>
              <small>Open targeted remedial study materials</small>
            </span>
            <ArrowRight size={15} />
          </button>
        </div>
      </div>
    </>
  );
}

// ── Root Application ────────────────────────────────────────────────────────
function PrototypeApp() {
  const [user, setUser] = useState<DemoUser | null>(() => {
    const saved = localStorage.getItem('shiksha-setu-user');
    return saved ? (JSON.parse(saved) as DemoUser) : null;
  });

  const [data, setData] = useState<SeedData | null>(null);

  const refreshData = useCallback(() => {
    loadData().then(setData);
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const login = (nextUser: DemoUser) => {
    localStorage.setItem('shiksha-setu-user', JSON.stringify(nextUser));
    setUser(nextUser);
  };

  const logout = () => {
    localStorage.removeItem('shiksha-setu-user');
    setUser(null);
  };

  const reset = () => {
    resetDemoData().then(setData);
  };

  if (!data) {
    return (
      <div className="loading">
        <RefreshCw size={24} className="spin" />
        <span>Loading Shiksha Setu Workspace…</span>
      </div>
    );
  }

  return user ? (
    <AppShell
      user={user}
      data={data}
      onLogout={logout}
      onReset={reset}
      onRefreshData={refreshData}
    />
  ) : (
    <Routes>
      <Route path="/login" element={<Login onLogin={login} />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <PrototypeApp />
    </BrowserRouter>
  </React.StrictMode>
);
