import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2, Download, FileText, Upload, Sparkles, Copy,
  ArrowRight, ArrowLeft, RefreshCw, BarChart2, FileCheck, Layers,
  ExternalLink, BookmarkPlus, Eye, Users, FileSpreadsheet
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { SeedData, GeneratedPaper, AssessmentSession, GroupRecommendation, SavedQuestionSet, Student } from './types';
import { CLASS_SUBJECT_MAP, CLASS_LABELS } from './data';
import { EducationGraph, getQuestionsForAssessment } from './knowledge-graph';
import { downloadStudentPaper, downloadAnswerKey } from './print-paper';
import { parseResultsCSV, mapResultsToStudents, buildGroupRecommendations } from './services';
import { savePaper, saveSession, saveSavedSet, saveStudent } from './db';

interface AssessmentFlowProps {
  data: SeedData;
  graph: EducationGraph;
  onRefreshData?: () => void;
}

export function AssessmentFlow({ data, graph, onRefreshData }: AssessmentFlowProps) {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 1 Form State
  const [selectedClassId, setSelectedClassId] = useState<string>(data.classrooms[0]?.id || 'class-multigrade-1');
  const [selectedSubject, setSelectedSubject] = useState<string>('mat');
  const [selectedMonth, setSelectedMonth] = useState<string>('September 2026');
  const [setNumber, setSetNumber] = useState<string>('01');
  const [framingMode, setFramingMode] = useState<'EQUAL_PROPORTION' | 'GAUSSIAN'>('EQUAL_PROPORTION');
  const [questionCount, setQuestionCount] = useState<number>(5);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  // Generated Paper State
  const [paper, setPaper] = useState<GeneratedPaper | null>(null);
  const [savedSetSuccess, setSavedSetSuccess] = useState<boolean>(false);

  // Step 3/4 State
  const [copiedPrompt, setCopiedPrompt] = useState<boolean>(false);
  const [rawCsvInput, setRawCsvInput] = useState<string>('');
  const [uploadedSession, setUploadedSession] = useState<AssessmentSession | null>(null);
  const [groups, setGroups] = useState<GroupRecommendation[]>([]);
  const [isSavingSession, setIsSavingSession] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  // Generate standard_month_setno identifier
  const computedSetName = useMemo(() => {
    const classObj = data.classrooms.find(c => c.id === selectedClassId);
    let classPrefix = 'std3';
    if (classObj) {
      if (classObj.name.includes('Grade 6')) classPrefix = 'std6';
      else if (classObj.name.includes('Grade 5')) classPrefix = 'std5';
      else if (classObj.name.includes('Grade 1, 3, 4')) classPrefix = 'std1_3_4';
      else if (classObj.name.includes('Grade 7')) classPrefix = 'std7';
      else if (classObj.name.includes('Grade 8')) classPrefix = 'std8';
    }
    const monthClean = selectedMonth.toLowerCase().replace(/\s+/g, '');
    return `${classPrefix}_${monthClean}_set${setNumber}`;
  }, [selectedClassId, selectedMonth, setNumber, data.classrooms]);

  // Available subjects
  const availableSubjects = useMemo(() => {
    return data.subjects.slice(0, 4);
  }, [data.subjects]);

  // Step 1: Generate Paper Covering All Levels
  const handleGeneratePaper = async () => {
    setIsGenerating(true);
    try {
      const targetClassObj = data.classrooms.find(c => c.id === selectedClassId) || data.classrooms[0];
      const subjectObj = data.subjects.find(s => s.id === selectedSubject) || data.subjects[0];

      let selectedQuestions = [];
      let distribution: Record<string, number> = {};

      if (framingMode === 'EQUAL_PROPORTION') {
        // Calibrated equal proportion: Pick 1 question from each level L1 to L5
        for (const lvl of data.levels) {
          const match = data.questions.find(
            q => q.subjectId === selectedSubject && q.levelId === lvl.id
          ) || data.questions.find(q => q.levelId === lvl.id) || data.questions[0];

          if (match) {
            selectedQuestions.push(match);
            distribution[lvl.id] = (distribution[lvl.id] || 0) + 1;
          }
        }
      } else {
        // Gaussian distribution centered on L3
        const result = getQuestionsForAssessment(
          graph,
          data,
          'std-6',
          selectedSubject,
          'l3',
          questionCount
        );
        selectedQuestions = result.questions;
        distribution = result.distribution;
      }

      const generatedPaper: GeneratedPaper = {
        id: `paper-${Date.now()}`,
        setName: computedSetName,
        timestamp: new Date().toISOString(),
        classId: selectedClassId,
        className: targetClassObj.name,
        subjectId: selectedSubject,
        subjectName: subjectObj.name,
        targetLevelId: 'l3',
        targetLevelName: 'Calibrated L1–L5 Coverage',
        totalQuestions: selectedQuestions.length,
        questions: selectedQuestions,
        levelDistribution: distribution,
      };

      setPaper(generatedPaper);
      await savePaper(generatedPaper);
      setStep(2);
    } catch (err) {
      console.error('Error generating paper:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  // Save to Saved Question Sets (stand_month_setno)
  const handleSaveToQuestionSets = async () => {
    if (!paper) return;
    const targetClassObj = data.classrooms.find(c => c.id === selectedClassId) || data.classrooms[0];
    const subjectObj = data.subjects.find(s => s.id === selectedSubject) || data.subjects[0];

    const savedSet: SavedQuestionSet = {
      id: `set-${Date.now()}`,
      setName: paper.setName || computedSetName,
      standardId: selectedClassId,
      standardName: targetClassObj.name,
      month: selectedMonth,
      setNumber: setNumber,
      subjectId: selectedSubject,
      subjectName: subjectObj.name,
      targetLevelId: 'l3',
      createdAt: new Date().toISOString(),
      totalQuestions: paper.questions.length,
      questions: paper.questions,
      levelDistribution: paper.levelDistribution,
      status: 'FINALIZED',
    };

    await saveSavedSet(savedSet);
    data.savedSets.unshift(savedSet);
    setSavedSetSuccess(true);
    setTimeout(() => setSavedSetSuccess(false), 3000);
    if (onRefreshData) onRefreshData();
  };

  // Predefined CSV Download Template
  const handleDownloadCSVTemplate = () => {
    const headers = 'Roll Number, Student Name, Date of Assessment, L1 Mark, L2 Mark, L3 Mark, L4 Mark, L5 Mark, Final Level, Remarks';
    const sampleRows = [
      '1, Anita Devi, 2026-09-05, 1, 1, 0, 0, 0, 2, Mastered letter sounds',
      '2, Sohan Lal, 2026-09-05, 1, 1, 2, 0, 0, 3, Ready for sentence builder',
      '3, Pooja Kumari, 2026-09-05, 1, 1, 2, 2, 0, 4, Fluent reader',
      '4, Amit Kumar, 2026-09-05, 1, 0, 0, 0, 0, 1, Needs tactile counters',
      '14, Rekha Kumari, 2026-09-05, 1, 1, 2, 2, 0, 4, Strong progress',
    ];
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...sampleRows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Shiksha_Setu_Result_Template_${computedSetName}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Sample CSV generator for instant demo
  const handleLoadSampleCSV = () => {
    const sampleRows = [
      'Roll Number, Student Name, Date of Assessment, L1 Mark, L2 Mark, L3 Mark, L4 Mark, L5 Mark, Final Level, Remarks',
      '1, Anita Devi, 2026-09-05, 1, 1, 0, 0, 0, 2, Emerging word reader',
      '2, Sohan Lal, 2026-09-05, 1, 1, 2, 0, 0, 3, Consistent word building',
      '3, Pooja Kumari, 2026-09-05, 1, 1, 2, 2, 0, 4, Proficient sentence reading',
      '4, Amit Kumar, 2026-09-05, 1, 0, 0, 0, 0, 1, Requires concrete foundation pack',
      '5, Meera Joshi, 2026-09-05, 1, 1, 2, 2, 3, 5, Grade-level mastery achieved',
      '6, Kabir Singh, 2026-09-05, 1, 1, 2, 0, 0, 3, Developing paragraph reader',
      '7, Priya Verma, 2026-09-05, 1, 1, 0, 0, 0, 2, Practicing vowel sounds',
      '14, Rekha Kumari, 2026-09-05, 1, 1, 2, 2, 0, 4, Sentence fluency checked',
    ];
    const csvText = sampleRows.join('\n');
    setRawCsvInput(csvText);
    processCSV(csvText);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setRawCsvInput(text);
      processCSV(text);
    };
    reader.readAsText(file);
  };

  const processCSV = (csvText: string) => {
    const parsedResults = parseResultsCSV(csvText);
    const studentResults = mapResultsToStudents(parsedResults, data.students, selectedClassId);

    const recGroups = buildGroupRecommendations(
      studentResults,
      data.levels,
      graph,
      data,
      selectedSubject,
      'std-6'
    );

    setGroups(recGroups);

    // Update students' level in current month in memory & DB
    for (const res of studentResults) {
      const matchedStudent = data.students.find(s => s.id === res.studentId);
      if (matchedStudent) {
        if (!matchedStudent.monthwiseLevels) matchedStudent.monthwiseLevels = {};
        matchedStudent.monthwiseLevels[selectedMonth] = res.level;
        matchedStudent.currentLevelId = `l${res.level}`;
        const lvlObj = data.levels[res.level - 1];
        if (lvlObj) matchedStudent.level = lvlObj.name;
        saveStudent(matchedStudent);
      }
    }

    const session: AssessmentSession = {
      id: `session-${Date.now()}`,
      paperId: paper?.id,
      setName: paper?.setName || computedSetName,
      classId: selectedClassId,
      className: paper?.className || 'Classroom',
      subjectName: paper?.subjectName || 'Subject',
      month: selectedMonth,
      uploadedAt: new Date().toISOString(),
      results: studentResults,
      groupRecommendations: recGroups,
    };

    setUploadedSession(session);
  };

  const handleSaveSession = async () => {
    if (!uploadedSession) return;
    setIsSavingSession(true);
    try {
      await saveSession(uploadedSession);
      setSavedSuccess(true);
      if (onRefreshData) onRefreshData();
      setTimeout(() => {
        navigate('/teacher/classes');
      }, 1200);
    } catch (err) {
      console.error('Error saving session:', err);
    } finally {
      setIsSavingSession(false);
    }
  };

  // Pre-Engineered Multimodal Prompt for Google Gemini / ChatGPT
  const promptTemplate = `You are an expert AI evaluator for Shiksha Setu (Learning Recovery Tool) under the NEP 2020 framework.

Evaluation Context:
Class / Room: ${paper?.className || data.classrooms[0]?.name}
Subject: ${paper?.subjectName || 'Mathematics'}
Assessment Set Name: ${paper?.setName || computedSetName}
Total Questions: ${paper?.totalQuestions || 5}

Reference Question Set & Marking Criteria:
${paper?.questions.map((q, i) => {
  const lvl = data.levels.find(l => l.id === q.levelId);
  return `${i + 1}. [${lvl?.code} - ${lvl?.name}] [${q.type}] ${q.text}\n   -> Correct Answer: ${q.answer} (${q.marks || 1} mark${(q.marks || 1) > 1 ? 's' : ''})`;
}).join('\n') || ''}

Task:
Evaluate the attached student answer sheets (photographed response papers) against the reference key above.
For each student, evaluate their answers level-by-level (L1 to L5) and assign:
1. Roll Number (written at top of paper)
2. Student Name (if visible, otherwise leave blank)
3. Date of Assessment
4. Marks obtained for each Level: L1 Mark, L2 Mark, L3 Mark, L4 Mark, L5 Mark
5. Final Level (1 to 5) determined by highest mastery level achieved
6. Brief Teacher Remark

OUTPUT FORMAT REQUIREMENT:
Respond ONLY with a standard CSV table. Do not include markdown code block quotes or extra conversational commentary.

Predefined CSV Format:
Roll Number, Student Name, Date of Assessment, L1 Mark, L2 Mark, L3 Mark, L4 Mark, L5 Mark, Final Level, Remarks
1, Anita Devi, 2026-09-05, 1, 1, 0, 0, 0, 2, Emerging word reader
2, Sohan Lal, 2026-09-05, 1, 1, 2, 0, 0, 3, Developing 2-digit addition
14, Rekha Kumari, 2026-09-05, 1, 1, 2, 2, 0, 4, Sentence fluency checked`;

  const copyPromptToClipboard = () => {
    navigator.clipboard.writeText(promptTemplate);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2500);
  };

  // Recharts data preparation for Step 2
  const chartData = useMemo(() => {
    if (!paper) return [];
    return data.levels.map(lvl => ({
      name: lvl.code,
      fullName: lvl.name,
      count: paper.levelDistribution[lvl.id] || 0,
      color: lvl.color,
    }));
  }, [paper, data.levels]);

  return (
    <div className="assessment-wizard">
      {/* Wizard Stepper Header */}
      <div className="wizard-header">
        <div>
          <p className="eyebrow">Assessment Studio · Knowledge Graph Driven</p>
          <h1>Create & Conduct 5-Minute Assessment</h1>
        </div>
        <div className="stepper">
          {[
            { num: 1, label: '1. Frame Set' },
            { num: 2, label: '2. Review & Save' },
            { num: 3, label: '3. GenAI Grading Guide' },
            { num: 4, label: '4. Upload Results & Action' },
          ].map(s => (
            <div
              key={s.num}
              className={`step-item ${step === s.num ? 'active' : ''} ${step > s.num ? 'completed' : ''}`}
              onClick={() => {
                if (s.num < step || (s.num === 2 && paper)) setStep(s.num as any);
              }}
            >
              <div className="step-circle">{step > s.num ? <CheckCircle2 size={16} /> : s.num}</div>
              <span>{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* STEP 1: CONFIGURE ASSESSMENT */}
      {step === 1 && (
        <div className="wizard-card animate-fade-in">
          <div className="card-heading">
            <Layers size={22} className="text-teal" />
            <div>
              <h2>Step 1: Frame Assessment Set Covering All Levels (L1–L5)</h2>
              <p className="muted">
                Frame questions covering all competency levels in equal or calibrated proportion. Name will be formatted as <code>stand_month_setno</code>.
              </p>
            </div>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label>Target Classroom / Multi-Grade Room</label>
              <select value={selectedClassId} onChange={e => setSelectedClassId(e.target.value)}>
                {data.classrooms.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.teacherName})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Subject</label>
              <select value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)}>
                {availableSubjects.map(sub => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Assessment Month</label>
              <select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)}>
                <option value="August 2026">August 2026</option>
                <option value="September 2026">September 2026</option>
                <option value="October 2026">October 2026</option>
                <option value="November 2026">November 2026</option>
              </select>
            </div>

            <div className="form-group">
              <label>Set Number</label>
              <select value={setNumber} onChange={e => setSetNumber(e.target.value)}>
                <option value="01">Set 01</option>
                <option value="02">Set 02</option>
                <option value="03">Set 03</option>
              </select>
            </div>

            <div className="form-group">
              <label>Level Distribution Framing</label>
              <select value={framingMode} onChange={e => setFramingMode(e.target.value as any)}>
                <option value="EQUAL_PROPORTION">Equal Proportion: 1 Question per Level (L1–L5)</option>
                <option value="GAUSSIAN">Gaussian Distribution (Centered on L3)</option>
              </select>
            </div>

            <div className="form-group">
              <label>Generated Set Identifier</label>
              <div className="set-name-preview-box">
                <FileText size={15} className="text-teal" />
                <strong>{computedSetName}</strong>
              </div>
            </div>
          </div>

          <div className="card-actions">
            <button
              className="primary large"
              disabled={isGenerating}
              onClick={handleGeneratePaper}
            >
              {isGenerating ? (
                <>
                  <RefreshCw size={18} className="spin" /> Framing Assessment Set…
                </>
              ) : (
                <>
                  <Sparkles size={18} /> Frame Assessment from Knowledge Graph <ArrowRight size={18} />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: REVIEW, SAVE SET & DOWNLOAD PDF */}
      {step === 2 && paper && (
        <div className="wizard-card animate-fade-in">
          <div className="card-heading space-between">
            <div>
              <div className="set-title-badge">
                <span className="tag success">SET NAME: {paper.setName || computedSetName}</span>
                <h2>Step 2: Review Framed Assessment Set</h2>
              </div>
              <p className="muted">
                {paper.className} · {paper.subjectName} · {paper.totalQuestions} Questions covering L1 to L5
              </p>
            </div>

            <div className="action-buttons-row">
              <button
                className={`secondary ${savedSetSuccess ? 'btn-success' : 'highlight-teal'}`}
                onClick={handleSaveToQuestionSets}
              >
                <BookmarkPlus size={16} /> {savedSetSuccess ? '✓ Saved to Sets!' : 'Save to Question Sets'}
              </button>
              <button className="primary" onClick={() => downloadStudentPaper(paper)}>
                <Download size={16} /> Download Student Paper (PDF)
              </button>
              <button className="secondary highlight-amber" onClick={() => downloadAnswerKey(paper)}>
                <FileCheck size={16} /> Download Answer Key (PDF)
              </button>
            </div>
          </div>

          {/* Distribution Chart */}
          <div className="distribution-panel">
            <div className="space-between">
              <h3>Calibrated Level Coverage Across Questions</h3>
              <span className="tiny-note">Covering all levels in equal/calibrated proportion</span>
            </div>
            <div className="chart-container" style={{ width: '100%', height: 160 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip
                    formatter={(value: any) => [`${value} question(s)`, 'Coverage']}
                    labelFormatter={(label: any) => `Level: ${label}`}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Questions Preview */}
          <div className="questions-preview">
            <h3>Questions in Set ({paper.questions.length})</h3>
            <div className="question-list">
              {paper.questions.map((q, idx) => {
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
                      <span className={`badge ${q.type === 'MCQ' ? 'badge-blue' : 'badge-purple'}`}>
                        {q.type}
                      </span>
                      <span className="q-marks">{q.marks || 1} mark(s)</span>
                    </div>
                    <p className="q-text">{q.text}</p>
                    {q.type === 'MCQ' && q.options && (
                      <div className="q-options-grid">
                        {q.options.map((opt, optIdx) => (
                          <div key={optIdx} className={`opt-chip ${opt === q.answer ? 'opt-correct' : ''}`}>
                            <strong>({String.fromCharCode(65 + optIdx)})</strong> {opt}
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
          </div>

          <div className="card-actions space-between">
            <button className="secondary" onClick={() => setStep(1)}>
              <ArrowLeft size={16} /> Back to Framing
            </button>
            <div className="action-buttons-row">
              <button className="secondary" onClick={() => navigate('/teacher/saved-sets')}>
                <Eye size={16} /> View All Saved Sets
              </button>
              <button className="primary" onClick={() => setStep(3)}>
                Proceed to GenAI Grading Guide <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: GEMINI / CHATGPT GRADING PROMPT STUDIO */}
      {step === 3 && (
        <div className="wizard-card animate-fade-in">
          <div className="card-heading">
            <FileText size={22} className="text-amber" />
            <div>
              <h2>Step 3: GenAI Grading Studio (Google Gemini / ChatGPT)</h2>
              <p className="muted">
                Use your smartphone photo of student response sheets with this pre-engineered multimodal prompt to evaluate offline assessments in seconds.
              </p>
            </div>
          </div>

          <div className="instructions-grid">
            <div className="steps-list">
              <div className="instr-step">
                <span className="step-num">1</span>
                <div>
                  <strong>Get Worksheet & Reference Key</strong>
                  <p>Keep your downloaded Student Paper and Answer Key reference ready.</p>
                </div>
              </div>
              <div className="instr-step">
                <span className="step-num">2</span>
                <div>
                  <strong>Photograph Student Response Sheets</strong>
                  <p>Take one clear photo of each student's handwritten answer sheet.</p>
                </div>
              </div>
              <div className="instr-step">
                <span className="step-num">3</span>
                <div>
                  <strong>Copy Evaluation Prompt</strong>
                  <p>Click "Copy Prompt Template" on the right.</p>
                </div>
              </div>
              <div className="instr-step">
                <span className="step-num">4</span>
                <div>
                  <strong>Send to Gemini or ChatGPT</strong>
                  <p>Paste the prompt and upload the photos to your AI assistant.</p>
                  <div className="external-ai-links">
                    <a
                      href="https://gemini.google.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ai-link-btn gemini"
                    >
                      Open Google Gemini <ExternalLink size={12} />
                    </a>
                    <a
                      href="https://chatgpt.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ai-link-btn chatgpt"
                    >
                      Open ChatGPT <ExternalLink size={12} />
                    </a>
                  </div>
                </div>
              </div>
              <div className="instr-step">
                <span className="step-num">5</span>
                <div>
                  <strong>Bring Result CSV Back to Step 4</strong>
                  <p>Copy the CSV output table and proceed to Step 4 to upload.</p>
                </div>
              </div>
            </div>

            {/* Prompt Box */}
            <div className="prompt-container">
              <div className="prompt-header">
                <strong>Multimodal GenAI Evaluation Prompt</strong>
                <button className="small-button" onClick={copyPromptToClipboard}>
                  {copiedPrompt ? <CheckCircle2 size={14} className="text-green" /> : <Copy size={14} />}
                  {copiedPrompt ? 'Copied Prompt!' : 'Copy Prompt'}
                </button>
              </div>
              <pre className="prompt-code">{promptTemplate}</pre>
            </div>
          </div>

          <div className="card-actions space-between">
            <button className="secondary" onClick={() => setStep(2)}>
              <ArrowLeft size={16} /> Back to Review
            </button>
            <button className="primary" onClick={() => setStep(4)}>
              Proceed to Upload Results <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: UPLOAD CSV & STUDENT MAPPING */}
      {step === 4 && (
        <div className="wizard-card animate-fade-in">
          <div className="card-heading space-between">
            <div>
              <h2>Step 4: Upload Result CSV & Map to Student Register</h2>
              <p className="muted">
                Upload the evaluation CSV in predefined format. Roll numbers will automatically map to student names, updating monthwise reports and next-day teaching groups.
              </p>
            </div>
            <div className="action-buttons-row">
              <button className="secondary" onClick={handleDownloadCSVTemplate}>
                <FileSpreadsheet size={16} /> Download CSV Template
              </button>
              <button className="secondary highlight-blue" onClick={handleLoadSampleCSV}>
                <Sparkles size={16} /> Load Sample Result CSV
              </button>
            </div>
          </div>

          {/* Upload Area */}
          <div className="upload-box">
            <Upload size={36} className="text-teal" />
            <p><strong>Drag and drop Gemini / ChatGPT CSV file here</strong> or click to browse</p>
            <span className="tiny-note">Accepts .csv, .txt formatted tables</span>
            <input type="file" accept=".csv,.xlsx,.txt" onChange={handleFileUpload} />
          </div>

          {/* Grouping Cards from Knowledge Graph */}
          {groups.length > 0 && (
            <div className="group-results-section animate-fade-in">
              <div className="section-title">
                <BarChart2 size={20} className="text-teal" />
                <h3>Mapped Student Results & Next-Day Teaching Actions</h3>
              </div>

              <div className="level-groups-grid">
                {groups.map(group => (
                  <div className="level-group-card" key={group.level}>
                    <div className="group-card-header" style={{ borderColor: group.levelColor }}>
                      <span className="group-badge" style={{ backgroundColor: group.levelColor }}>
                        {group.levelName} (L{group.level})
                      </span>
                      <span className="student-count">{group.students.length} Student(s)</span>
                    </div>

                    <div className="group-students-list">
                      <strong>Assigned Students:</strong>
                      {group.students.length === 0 ? (
                        <p className="tiny-note">No students at this level</p>
                      ) : (
                        <ul>
                          {group.students.map(s => (
                            <li key={s.studentId}>
                              <strong>Roll #{s.rollNumber}</strong>: {s.studentName}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <div className="group-teaching-action">
                      <div className="action-title">
                        <Sparkles size={14} /> <strong>What to teach tomorrow:</strong>
                      </div>
                      <p>{group.activity}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="card-actions space-between">
            <button className="secondary" onClick={() => setStep(3)}>
              <ArrowLeft size={16} /> Back to Guide
            </button>
            <button
              className="primary large"
              disabled={!uploadedSession || isSavingSession || savedSuccess}
              onClick={handleSaveSession}
            >
              {isSavingSession ? (
                <>
                  <RefreshCw size={18} className="spin" /> Saving Session…
                </>
              ) : savedSuccess ? (
                <>
                  <CheckCircle2 size={18} /> Results Mapped! Redirecting to Monthly Reports…
                </>
              ) : (
                <>
                  <FileCheck size={18} /> Save Assessment Results & Update Monthly Reports
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
