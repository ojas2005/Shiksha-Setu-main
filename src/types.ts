export type Role = 'ADMIN' | 'TEACHER';
export type Status = 'ACTIVE' | 'INACTIVE' | 'ARCHIVED' | 'PLANNED';
export type QuestionKind = 'MCQ' | 'DESCRIPTIVE';

export type Level = { id: string; code: string; name: string; color: string; icon: string; threshold: number };
export type Subject = { id: string; code: string; name: string; color: string };
export type Competency = {
  id: string; standardId: string; subjectId: string; domain: string;
  title: string; outcome: string; levelId: string;
  teachingActivity: string;  // what teacher does tomorrow for students at this level
};
export type Question = {
  id: string; standardId: string; subjectId: string; competencyId: string;
  levelId: string; text: string; options: string[]; answer: string;
  marks: number; type: QuestionKind;
};

export type Student = {
  id: string;
  name: string;
  classId: string;
  admission: string;
  rollNumber: number;
  gender?: 'Girl' | 'Boy' | 'Other';
  parentName?: string;
  parentPhone?: string;
  parentEmail?: string;
  gradeLevel?: string;
  trend: 'Improving' | 'Stable' | 'Review required' | 'Newly assessed';
  focus: string;
  level: string; // Current overall level name
  currentLevelId?: string; // e.g. 'l1', 'l2', 'l3', 'l4', 'l5'
  monthwiseLevels?: Record<string, number>; // 'August 2026' -> 3, 'September 2026' -> 4
  readingLevel?: string;
  writingLevel?: string;
  numeracyLevel?: string;
  notes?: string;
};

export type Classroom = {
  id: string;
  name: string;
  grades: string[]; // e.g. ['Grade 1', 'Grade 3', 'Grade 4']
  roomName: string; // e.g. 'Room B'
  teacherName: string;
  studentCount?: number;
  academicYear: string;
};

export type DemoUser = {
  username: string;
  password: string;
  name: string;
  role: Role;
  mobileNumber?: string;
  teacherId?: string;
};

export type StudyMaterial = {
  id: string;
  levelId: string;
  levelCode: string;
  levelName: string;
  subjectId: string;
  subjectName: string;
  domain: string;
  title: string;
  summary: string;
  teacherGuide: string;
  concreteActivities: string[];
  printableWorksheets: {
    title: string;
    description: string;
    content: string[];
  }[];
  parentHomeActivity: string;
  suggestedDuration: string;
};

export type SavedQuestionSet = {
  id: string;
  setName: string; // stand_month_setno (e.g. std6_aug2026_set01)
  standardId: string;
  standardName: string;
  month: string;
  setNumber: string;
  subjectId: string;
  subjectName: string;
  targetLevelId?: string;
  createdAt: string;
  totalQuestions: number;
  questions: Question[];
  levelDistribution: Record<string, number>;
  status: 'DRAFT' | 'FINALIZED' | 'ARCHIVED';
};

export type SeedData = {
  years: { id: string; label: string; status: Status }[];
  levels: Level[];
  subjects: Subject[];
  competencies: Competency[];
  questions: Question[];
  students: Student[];
  classrooms: Classroom[];
  studyMaterials: StudyMaterial[];
  savedSets: SavedQuestionSet[];
  stats: { schools: number; teachers: number; classes: number; assessments: number; sync: number };
};

// ── Knowledge Graph ─────────────────────────────────────────────────────────
export type KGNodeType = 'SUBJECT' | 'DOMAIN' | 'COMPETENCY' | 'QUESTION';
export type KGEdgeType = 'CONTAINS' | 'ASSESSED_BY' | 'PREREQUISITE' | 'TEACHES';

export type KGNode = {
  id: string;
  nodeType: KGNodeType;
  label: string;
  metadata: Record<string, string>;
  weight: number;
};

export type KGEdge = {
  sourceId: string;
  targetId: string;
  edgeType: KGEdgeType;
  weight: number;
};

export type KGEdit = {
  id: string;
  timestamp: string;
  type: 'ADD_QUESTION' | 'EDIT_QUESTION' | 'DELETE_QUESTION' | 'ADD_COMPETENCY';
  payload: Record<string, unknown>;
};

// ── Assessment Paper ─────────────────────────────────────────────────────────
export type LevelDistribution = Record<string, number>; // levelId → count

export type GeneratedPaper = {
  id: string;
  setName?: string; // stand_month_setno
  timestamp: string;
  classId: string;           // e.g. 'std-8'
  className: string;         // e.g. 'Grade 8'
  subjectId: string;
  subjectName: string;
  targetLevelId: string;     // e.g. 'l3'
  targetLevelName: string;
  totalQuestions: number;
  questions: Question[];
  levelDistribution: LevelDistribution;
};

// ── Assessment Results ───────────────────────────────────────────────────────
export type StudentResult = {
  rollNumber: number;
  studentId: string;
  studentName: string;
  date?: string;
  level: number;                           // 1–5
  levelScores?: {
    l1?: number;
    l2?: number;
    l3?: number;
    l4?: number;
    l5?: number;
  };
  topicScores: Record<string, number>;     // domain → score percentage
  remarks?: string;
};

export type GroupRecommendation = {
  level: number;
  levelId: string;
  levelName: string;
  levelColor: string;
  levelIcon: string;
  students: StudentResult[];
  activity: string;   // what to teach tomorrow — from KG
  studyMaterialId?: string;
};

export type AssessmentSession = {
  id: string;
  paperId?: string;
  setName?: string; // stand_month_setno
  classId?: string;
  className: string;
  subjectName: string;
  month: string;
  uploadedAt: string;
  results: StudentResult[];
  groupRecommendations: GroupRecommendation[];
};
