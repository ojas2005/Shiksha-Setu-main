import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2, Download, FileText, Upload, Sparkles, Copy,
  ArrowRight, ArrowLeft, RefreshCw, BarChart2, FileCheck, Layers,
  ExternalLink, BookmarkPlus, Eye, Users, FileSpreadsheet
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { SeedData, GeneratedPaper, AssessmentSession, GroupRecommendation, SavedQuestionSet, Student } from '../types';
import { CLASS_SUBJECT_MAP, CLASS_LABELS, getLevelLabel, MONTHS_LIST, YEARS_LIST } from '../lib/data';
import { EducationGraph, getQuestionsForAssessment } from '../lib/knowledge-graph';
import { downloadStudentPaper, downloadAnswerKey } from '../components/print-paper';
import { parseResultsCSV, mapResultsToStudents, buildGroupRecommendations } from '../lib/services';
import { savePaper, saveSession, saveSavedSet, saveStudent } from '../lib/db';

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
  const [selectedMonthName, setSelectedMonthName] = useState<string>('September');
  const [selectedYear, setSelectedYear] = useState<string>('2026');
  const selectedMonth = useMemo(() => `${selectedMonthName} ${selectedYear}`, [selectedMonthName, selectedYear]);
  const [setNumber, setSetNumber] = useState<string>('01');
  const [framingMode, setFramingMode] = useState<'EQUAL_PROPORTION' | 'GAUSSIAN'>('EQUAL_PROPORTION');
  const [gaussianCenterLevelId, setGaussianCenterLevelId] = useState<string>('l3');
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

  // Selected Standard ID helper
  const selectedStandardId = useMemo(() => {
    const classObj = data.classrooms.find(c => c.id === selectedClassId);
    if (!classObj) return 'std-6';
    if (classObj.name.includes('Grade 12')) return 'std-12';
    if (classObj.name.includes('Grade 11')) return 'std-11';
    if (classObj.name.includes('Grade 10')) return 'std-10';
    if (classObj.name.includes('Grade 9')) return 'std-9';
    if (classObj.name.includes('Grade 8')) return 'std-8';
    if (classObj.name.includes('Grade 7')) return 'std-7';
    return 'std-6';
  }, [selectedClassId, data.classrooms]);

  // Generate standard_month_setno identifier
  const computedSetName = useMemo(() => {
    const classPrefix = selectedStandardId.replace('-', '');
    const monthClean = selectedMonth.toLowerCase().replace(/\s+/g, '');
    return `${classPrefix}_${monthClean}_set${setNumber}`;
  }, [selectedStandardId, selectedMonth, setNumber]);

  // Available subjects dynamic based on class mapping (6-8: hin, eng, mat, sci | 9-12: eng, mat, bio, che, phy)
  const availableSubjects = useMemo(() => {
    const allowedSubjectIds = CLASS_SUBJECT_MAP[selectedStandardId] || ['hin', 'eng', 'mat', 'sci'];
    return data.subjects.filter(s => allowedSubjectIds.includes(s.id));
  }, [selectedStandardId, data.subjects]);

  // Ensure selectedSubject is valid for selected class
  React.useEffect(() => {
    if (availableSubjects.length > 0 && !availableSubjects.some(s => s.id === selectedSubject)) {
      setSelectedSubject(availableSubjects[0].id);
    }
  }, [availableSubjects, selectedSubject]);

  // Step 1: Generate Paper Covering All Levels
  const handleGeneratePaper = async () => {
    setIsGenerating(true);
    try {
      const targetClassObj = data.classrooms.find(c => c.id === selectedClassId) || data.classrooms[0];
      const subjectObj = data.subjects.find(s => s.id === selectedSubject) || data.subjects[0];

      let selectedQuestions = [];
      let distribution: Record<string, number> = {};

      if (framingMode === 'EQUAL_PROPORTION') {
        // Equal proportion across levels L1 to L5
        const targetPerLevel = Math.max(1, Math.floor(questionCount / data.levels.length));
        let countAssigned = 0;
        for (const lvl of data.levels) {
          const matches = data.questions.filter(
            q => q.subjectId === selectedSubject && q.levelId === lvl.id && (q.standardId === selectedStandardId || !q.standardId)
          );
          const fallbackMatches = data.questions.filter(q => q.subjectId === selectedSubject && q.levelId === lvl.id);
          const pool = matches.length > 0 ? matches : (fallbackMatches.length > 0 ? fallbackMatches : data.questions);

          // Take questions not already chosen. Indexing pool[0] for every level
          // returned the same template sentence five times over, differing only
          // by the level name, which read as a repeated question.
          const chosenIds = new Set(selectedQuestions.map(q => q.id));
          const chosenTexts = new Set(selectedQuestions.map(q => q.text));
          let taken = 0;
          for (const candidate of pool) {
            if (taken >= targetPerLevel || countAssigned >= questionCount) break;
            if (chosenIds.has(candidate.id) || chosenTexts.has(candidate.text)) continue;
            selectedQuestions.push(candidate);
            chosenIds.add(candidate.id);
            chosenTexts.add(candidate.text);
            distribution[lvl.id] = (distribution[lvl.id] || 0) + 1;
            countAssigned++;
            taken++;
          }
        }
      } else {
        // Gaussian distribution centered on user-selected gaussianCenterLevelId
        const result = getQuestionsForAssessment(
          graph,
          data,
          selectedStandardId,
          selectedSubject,
          gaussianCenterLevelId,
          questionCount
        );
        selectedQuestions = result.questions;
        distribution = result.distribution;
      }

      const targetLvlObj = data.levels.find(l => l.id === gaussianCenterLevelId) || data.levels[2];
      const generatedPaper: GeneratedPaper = {
        id: `paper-${Date.now()}`,
        setName: computedSetName,
        timestamp: new Date().toISOString(),
        classId: selectedClassId,
        className: targetClassObj.name,
        subjectId: selectedSubject,
        subjectName: subjectObj.name,
        targetLevelId: framingMode === 'GAUSSIAN' ? gaussianCenterLevelId : 'l3',
        targetLevelName: framingMode === 'GAUSSIAN'
          ? `Gaussian Peak at ${targetLvlObj.code} (${getLevelLabel(selectedSubject, targetLvlObj.id)})`
          : 'Calibrated L1–L5 Coverage',
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

==================================================
EVALUATION CONTEXT

Class / Room:
${paper?.className || data.classrooms[0]?.name}

Subject:
${paper?.subjectName || 'Mathematics'}

Assessment Set Name:
${paper?.setName || computedSetName}

Total Questions:
${paper?.totalQuestions || 5}

==================================================
ANSWER KEY & MARKING SCHEME

${paper?.questions.map((q, i) => {
  const lvl = data.levels.find(l => l.id === q.levelId);
  return `${i + 1}. [${lvl?.code} - ${lvl?.name}]
Question Type: ${q.type}
Question: ${q.text}
Correct Answer: ${q.answer}
Marks: ${q.marks || 1}`;
}).join('\n\n') || ''}

==================================================
TASK

Evaluate all attached student answer sheets.
For each student:
1. Extract Roll Number.
2. Extract Student Name if available.
3. Extract Assessment Date if available.
4. Compare every answer against the answer key.
5. Award FULL marks if correct.
6. Award ZERO marks if incorrect.
7. Record marks under the corresponding learning level.

==================================================
SCORING RULES

- Correct Answer = Full Marks
- Incorrect Answer = 0 Marks
- Blank Answer = 0 Marks
- Do not partially award marks.
- Sum marks for each level separately.
- Final Level = Highest level where student has scored marks (if multiple levels have marks, pick the highest)

==================================================
OUTPUT REQUIREMENTS

Return ONLY valid downloadable CSV.

DO NOT return:

- Markdown
- JSON
- Code Blocks
- Explanations
- Notes
- Comments
- Additional Text

The first row MUST be the CSV header.

==================================================
CSV FORMAT

Roll Number, Student Name, Date of Assessment, L1 Mark, L2 Mark, L3 Mark, L4 Mark, L5 Mark, Final Level

==================================================
EXAMPLE OUTPUT

Roll Number, Student Name, Date of Assessment, L1 Mark, L2 Mark, L3 Mark, L4 Mark, L5 Mark, Final Level
1, Anita Devi, 2026-09-05, 1, 1, 0, 0, 0, 2
2, Sohan Lal, 2026-09-05, 1, 1, 2, 0, 0, 3
14, Rekha Kumari, 2026-09-05, 1, 1, 2, 2, 0, 4

IMPORTANT:
- Generate one downloadable CSV row per student.
- Return valid CSV only.
- No extra text before or after the CSV.`;

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
      fullName: getLevelLabel(paper.subjectId, lvl.id),
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
              <label>Assessment Month & Year</label>
              <div className="field-split">
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

            <div className="form-group">
              <label>Set Number</label>
              <select value={setNumber} onChange={e => setSetNumber(e.target.value)}>
                <option value="01">Set 01</option>
                <option value="02">Set 02</option>
                <option value="03">Set 03</option>
              </select>
            </div>

            <div className="form-group">
              <label>Total Number of Questions</label>
              <select
                value={questionCount}
                onChange={e => setQuestionCount(parseInt(e.target.value, 10))}
              >
                <option value={5}>5 Questions (5-Min Quick Pulse)</option>
                <option value={10}>10 Questions (Standard Assessment)</option>
                <option value={15}>15 Questions (Detailed Diagnostic)</option>
                <option value={20}>20 Questions (Comprehensive Paper)</option>
              </select>
            </div>

            <div className="form-group">
              <label>Level Distribution Framing</label>
              <select value={framingMode} onChange={e => setFramingMode(e.target.value as any)}>
                <option value="EQUAL_PROPORTION">Equal Proportion Across Levels (L1–L5)</option>
                <option value="GAUSSIAN">Gaussian Normal Distribution (Weighted Peak Level)</option>
              </select>
            </div>

            {framingMode === 'GAUSSIAN' && (
              <div className="form-group animate-fade-in">
                <label>Gaussian Peak Level (Center Difficulty)</label>
                <select
                  value={gaussianCenterLevelId}
                  onChange={e => setGaussianCenterLevelId(e.target.value)}
                >
                  {data.levels.map(l => (
                    <option key={l.id} value={l.id}>
                      {l.code} - {getLevelLabel(selectedSubject, l.id)}
                    </option>
                  ))}
                </select>
              </div>
            )}

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
                Copy the prompt below and send it along with photos of student answer sheets to Gemini or ChatGPT. The AI will evaluate and return a CSV with results.
              </p>
            </div>
          </div>

          <div className="instructions-grid">
            <div className="steps-list">
              <div className="instr-step">
                <span className="step-num">1</span>
                <div>
                  <strong>Photograph Student Response Sheets</strong>
                  <p>Take clear photos of each student's handwritten answers.</p>
                </div>
              </div>
              <div className="instr-step">
                <span className="step-num">2</span>
                <div>
                  <strong>Copy the Evaluation Prompt</strong>
                  <p>Click the "Copy Prompt" button on the right.</p>
                </div>
              </div>
              <div className="instr-step">
                <span className="step-num">3</span>
                <div>
                  <strong>Send to Gemini or ChatGPT</strong>
                  <p>Paste the prompt and upload student photos to your AI assistant.</p>
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
                <span className="step-num">4</span>
                <div>
                  <strong>Proceed to Step 4</strong>
                  <p>Copy the CSV output and paste it in Step 4 to update student levels.</p>
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
            </div>
          </div>

          {/* Upload Area */}
          <div className="upload-area-section">
            <div className="upload-tabs">
              <div className="tab-option">
                <strong>Option 1: Upload CSV File</strong>
                <div className="upload-box">
                  <Upload size={36} className="text-teal" />
                  <p><strong>Drag and drop Gemini / ChatGPT CSV file here</strong> or click to browse</p>
                  <span className="tiny-note">Accepts .csv, .xlsx, .txt formatted tables</span>
                  <input type="file" accept=".csv,.xlsx,.txt" onChange={handleFileUpload} />
                </div>
              </div>

              <div className="tab-option">
                <strong>Option 2: Paste CSV Output</strong>
                <p className="muted" style={{ marginBottom: '12px' }}>Since Gemini does not provide downloadable CSV, copy and paste the result table below:</p>
                <textarea
                  placeholder="Paste CSV output from Gemini / ChatGPT here...\n\nExample:\nRoll Number, Student Name, Date of Assessment, L1 Mark, L2 Mark, L3 Mark, L4 Mark, L5 Mark, Final Level\n1, Anita Devi, 2026-09-05, 1, 1, 0, 0, 0, 2\n2, Sohan Lal, 2026-09-05, 1, 1, 2, 0, 0, 3"
                  value={rawCsvInput}
                  onChange={(e) => {
                    setRawCsvInput(e.target.value);
                    if (e.target.value.trim()) {
                      processCSV(e.target.value);
                    }
                  }}
                  className="csv-textarea"
                />
              </div>
            </div>
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
