# Shiksha Setu — Build Specification

> **How to use this document.** Paste it whole into a coding assistant with the
> instruction: *"Build this project exactly as specified."* Every block marked
> **VERBATIM** is transcribed from the shipped source and must be reproduced
> character-for-character. Sections marked **SPEC** describe behaviour precisely
> enough to implement, but the resulting JSX will not be textually identical.
>
> Source of truth: commit `b4a083a`, 19 source files, 8,926 lines.

---

## 0. What this builds

Shiksha Setu is an **offline-first, no-backend PWA** for multi-grade rural
classrooms (Grades 6–12). One teacher, several grades, unreliable connectivity.

The product loop:

1. Teacher frames a **5-question assessment** spanning proficiency levels L1–L5,
   drawn from a curriculum knowledge graph.
2. Downloads a PDF student paper + answer key. Students write on paper.
3. Grading happens externally (Gemini / ChatGPT) into a fixed CSV format.
4. CSV is uploaded, mapped to the student register by roll number, and produces
   **next-day teaching groups**, each with a concrete activity.
5. Parent cards report progress **without diagnostic labels**.

Two roles: `ADMIN` and `TEACHER`, with separate nav and route trees.
Auth is a demo profile switcher — credentials are never validated.

**Hard constraint:** all state lives in IndexedDB via Dexie. There is no server.
The only network traffic is the service worker caching its own assets.

---

## 1. Scaffolding

### 1.1 `package.json` — VERBATIM
```json
{
  "name": "shiksha-setu",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "lint": "tsc --noEmit"
  },
  "dependencies": {
    "@vitejs/plugin-react": "latest",
    "date-fns": "latest",
    "dexie": "latest",
    "jspdf": "^4.2.1",
    "lucide-react": "latest",
    "papaparse": "latest",
    "react": "latest",
    "react-dom": "latest",
    "react-router-dom": "latest",
    "recharts": "latest",
    "vite-plugin-pwa": "^1.3.0",
    "zod": "latest"
  },
  "devDependencies": {
    "@types/papaparse": "latest",
    "@types/react": "latest",
    "@types/react-dom": "latest",
    "@vitejs/plugin-react": "latest",
    "sharp": "^0.35.4",
    "typescript": "latest",
    "vite": "latest",
    "vitest": "latest"
  }
}
```

> Nine dependencies are declared `latest`. Pin them if you need reproducibility.

### 1.2 `vite.config.ts` — VERBATIM
```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: { enabled: true },
      includeAssets: ['favicon.svg', 'favicon.png', 'apple-touch-icon.png'],
      manifest: {
        name: 'Shiksha Setu',
        short_name: 'Shiksha Setu',
        description: 'Five-minute assessment. Next-day teaching action.',
        theme_color: '#0b6e69',
        background_color: '#f6f8f7',
        display: 'standalone',
        start_url: '/login',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
          { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,ico,png}'],
        navigateFallback: '/index.html',
        cleanupOutdatedCaches: true,
      },
    }),
  ],
});
```

### 1.3 TypeScript config — VERBATIM

`tsconfig.json`
```json
{
  "files": [],
  "references": [{ "path": "./tsconfig.app.json" }, { "path": "./tsconfig.node.json" }]
}
```

`tsconfig.app.json`
```json
{
  "compilerOptions": {
    "target": "ES2022", "useDefineForClassFields": true, "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "allowJs": false, "skipLibCheck": true, "esModuleInterop": true, "allowSyntheticDefaultImports": true,
    "strict": true, "forceConsistentCasingInFileNames": true, "module": "ESNext", "moduleResolution": "Bundler",
    "resolveJsonModule": true, "isolatedModules": true, "noEmit": true, "jsx": "react-jsx"
  },
  "include": ["src"]
}
```

`tsconfig.node.json`
```json
{ "compilerOptions": { "composite": true, "skipLibCheck": true, "module": "ESNext", "moduleResolution": "Bundler", "allowSyntheticDefaultImports": true }, "include": ["vite.config.ts"] }
```

> ⚠️ `composite: true` makes `tsc -b` emit `vite.config.js` and `vite.config.d.ts`
> next to the source. **Both are build output — gitignore them, never commit them.**

### 1.4 `index.html` — VERBATIM
```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#0b6e69" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
    <link rel="manifest" href="/manifest.webmanifest" />
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <meta name="apple-mobile-web-app-title" content="Shiksha Setu" />
    <title>Shiksha Setu | Five-Minute Assessment</title>
  </head>
  <body><div id="root"></div><script type="module" src="/src/main.tsx"></script></body>
</html>
```

### 1.5 `.gitignore` — VERBATIM
```gitignore
# Dependencies
node_modules/

# Build output
dist/
dev-dist/

# TypeScript build info
*.tsbuildinfo

# Emitted by `tsc -b` from vite.config.ts (composite project)
vite.config.js
vite.config.d.ts

# Logs
*.log
npm-debug.log*

# Editor/OS
.DS_Store
Thumbs.db
.vscode/*
!.vscode/extensions.json

# Env files
.env
.env.local
.env.*.local
```

### 1.6 File layout

```
Documents/                    non-code: demo guide, HTML prototype, sample CSV
public/                       10 PWA icons (PNG + SVG)
scripts/generate-icons.mjs    sharp-based icon generator
index.html                    Vite entry — MUST stay at root
vite.config.ts  tsconfig*.json  package.json

src/
  main.tsx                    app shell, routing, login, sidebar
  types.ts                    every shared type
  vite-env.d.ts               /// <reference types="vite/client" />
  lib/
    data.ts                   seed data + generators
    db.ts                     Dexie schema + migration
    knowledge-graph.ts        graph build, weighted BFS, level allocation
    services.ts               CSV parsing, mapping, grouping
    services.test.ts
  views/                      one module per route
    main-views.tsx            9 exported views
    assessment-flow.tsx  assessment-history.tsx
    student-register.tsx  saved-question-sets.tsx  kg-editor.tsx
  components/
    study-material-modal.tsx  print-paper.tsx
  styles/
    styles.css  extra.css  ui-polish.css
```

> ⚠️ **Stylesheet import order is load-bearing.** `main.tsx` imports
> `styles.css` → `extra.css` → `ui-polish.css`. `ui-polish.css` refines rules
> declared in the earlier two and silently fails if reordered.

---

## 2. Domain model — `src/types.ts` — VERBATIM

Reproduce this file exactly. Every other module depends on these shapes.

```ts
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
  classId: string;           // e.g. 'std-6'
  className: string;         // e.g. 'Grade 6'
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
```

---

## 3. Seed data — `src/lib/data.ts`

### 3.1 Constants — VERBATIM (lines 1–70)

```ts
import type { DemoUser, SeedData, Competency, Question, Student, Classroom, StudyMaterial, SavedQuestionSet } from '../types';

export const demoUsers: DemoUser[] = [
  { username: 'teacher.sunita', password: 'Teacher@123', name: 'Sunita Devi (Jha)', role: 'TEACHER', mobileNumber: '+91 98765 43210', teacherId: 'HV-SRW-0142' },
  { username: 'teacher.anita', password: 'Teacher@123', name: 'Anita Sharma', role: 'TEACHER', mobileNumber: '+91 98123 45678', teacherId: 'HV-BHR-0089' },
  { username: 'admin.aarav', password: 'Admin@123', name: 'Aarav Mehta', role: 'ADMIN', mobileNumber: '+91 99999 00000', teacherId: 'HV-ADM-0001' },
  { username: 'teacher.rekha', password: 'Teacher@123', name: 'Rekha Verma', role: 'TEACHER', mobileNumber: '+91 97654 32109', teacherId: 'HV-SRW-0215' },
];

export const levels = [
  { id: 'l1', code: 'L1', name: 'Non-Reader / Foundation', color: '#d95c59', icon: '●', threshold: 40 },
  { id: 'l2', code: 'L2', name: 'Letter Recognition / Emerging', color: '#d58a32', icon: '◐', threshold: 50 },
  { id: 'l3', code: 'L3', name: 'Word Reader / Developing', color: '#ad9b31', icon: '◒', threshold: 60 },
  { id: 'l4', code: 'L4', name: 'Sentence Reader / Proficient', color: '#2b927d', icon: '●', threshold: 70 },
  { id: 'l5', code: 'L5', name: 'Grade-Level Reader / Advanced', color: '#3777a8', icon: '★', threshold: 80 },
];

export const subjects = [
  { id: 'hin', code: 'HIN', name: 'Hindi / भाषा', color: '#8b5a9b' },
  { id: 'eng', code: 'ENG', name: 'English', color: '#3d79a5' },
  { id: 'mat', code: 'MAT', name: 'Mathematics / Numeracy', color: '#cf6d39' },
  { id: 'sci', code: 'SCI', name: 'Science', color: '#2b927d' },
  { id: 'bio', code: 'BIO', name: 'Biology', color: '#48bb78' },
  { id: 'che', code: 'CHE', name: 'Chemistry', color: '#ed8936' },
  { id: 'phy', code: 'PHY', name: 'Physics', color: '#4299e1' },
];

export const CLASS_SUBJECT_MAP: Record<string, string[]> = {
  'std-6':  ['hin', 'eng', 'mat', 'sci'],
  'std-7':  ['hin', 'eng', 'mat', 'sci'],
  'std-8':  ['hin', 'eng', 'mat', 'sci'],
  'std-9':  ['eng', 'mat', 'bio', 'che', 'phy'],
  'std-10': ['eng', 'mat', 'bio', 'che', 'phy'],
  'std-11': ['eng', 'mat', 'bio', 'che', 'phy'],
  'std-12': ['eng', 'mat', 'bio', 'che', 'phy'],
};

export const CLASS_LABELS: Record<string, string> = {
  'std-6': 'Grade 6',
  'std-7': 'Grade 7',
  'std-8': 'Grade 8',
  'std-9': 'Grade 9',
  'std-10': 'Grade 10',
  'std-11': 'Grade 11',
  'std-12': 'Grade 12',
};

export const MONTHS_LIST = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const YEARS_LIST = ['2024', '2025', '2026', '2027', '2028', '2029', '2030'];

// Reading-fluency level names (Non-Reader/Letter/Word/Sentence Reader) only make sense for literacy subjects.
const LITERACY_SUBJECTS = new Set(['hin', 'eng']);
const GENERIC_LEVEL_NAMES: Record<string, string> = {
  l1: 'Foundation',
  l2: 'Emerging',
  l3: 'Developing',
  l4: 'Proficient',
  l5: 'Advanced',
};
export function getLevelLabel(subjectId: string, levelId: string): string {
  const lvl = levels.find(l => l.id === levelId);
  if (!lvl) return levelId;
  return LITERACY_SUBJECTS.has(subjectId) ? lvl.name : (GENERIC_LEVEL_NAMES[levelId] || lvl.name);
}
```

### 3.2 Literal record arrays — SPEC

Four large arrays follow the constants. They are hand-authored demo content;
reproduce the **shape** and generate plausible records to the stated counts.

| Export | Lines | Count | Shape |
|---|---|---|---|
| `seedClassrooms` | 71–137 | 7 | `Classroom` — `std-6` … `std-12`, names like `Grade 6 · Section A`, `roomName`, `teacherName`, `academicYear: '2026-27'` |
| `seedStudyMaterials` | 138–424 | ~15 | `StudyMaterial` — one per level×subject, with `teacherGuide`, `concreteActivities[]`, `printableWorksheets[]`, `parentHomeActivity`, `suggestedDuration` |
| `seedStudents` | 425–765 | ~60 | `Student` — Indian names, `rollNumber`, `admission` like `HV-26-001`, parent name/phone/email, `trend`, `focus`, `currentLevelId`, `monthwiseLevels` |
| `seedSavedSets` | 766–1000 | 3 | `SavedQuestionSet` — **contains the hand-authored real questions** |

**Real Grade 6 Mathematics questions** (inside `seedSavedSets`, set
`std6_september2026_set01`) — reproduce verbatim, they are referenced throughout:

| id | level | text | options | answer | marks |
|---|---|---|---|---|---|
| `q-s6-l1` | l1 | What is the place value of digit 7 in 4,752? | 7 / 70 / 700 / 7000 | `700` | 1 |
| `q-s6-l2` | l2 | Which is greater: 0.7 or 0.07? | 0.7 / 0.07 / Both are equal / Cannot be determined | `0.7` | 1 |
| `q-s6-l3` | l3 | Solve: 3/4 + 1/2 = ? | 4/6 / 5/4 / 1 / 4/4 | `5/4` | 2 |
| `q-s6-l4` | l4 | Find the perimeter of a rectangle with length 12 cm and width 8 cm. | 20 cm / 40 cm / 96 sq cm / 24 cm | `40 cm` | 2 |
| `q-s6-l5` | l5 | If 3x + 7 = 28, find the value of 2x − 1. | 11 / 13 / 14 / 7 | `13` | 3 |

Competency ids: `comp-mat-6-1` (l1, l2), `comp-mat-6-2` (l3), `comp-mat-6-3` (l4),
`comp-mat-6-4` (l5). All `type: 'MCQ'`.

### 3.3 Question collection + generators — VERBATIM (lines 1001–1100)

```ts
export const competencies: Competency[] = [];
// Seed with hand-authored real questions first so the paper generator (which
// finds the first subject+level match) prefers real content over templates below.
const seenRealQuestionKeys = new Set<string>();
export const questions: Question[] = seedSavedSets
  .flatMap(set => set.questions)
  .filter(q => {
    const key = `${q.subjectId}|${q.levelId}`;
    if (seenRealQuestionKeys.has(key)) return false;
    seenRealQuestionKeys.add(key);
    return true;
  });

const domainsBySubject: Record<string, string[]> = {
  hin: ['ध्वनि व वर्ण पहचान', 'शब्द रचना', 'वाक्य व अर्थग्रहण', 'रचनात्मक अभिव्यक्ति'],
  eng: ['Reading and Language', 'Grammar', 'Vocabulary', 'Writing'],
  mat: ['Number System', 'Geometry', 'Algebra', 'Statistics'],
  sci: ['Living World', 'Forces and Motion', 'Cell Biology', 'Chemical Reactions'],
  bio: ['Genetics & Evolution', 'Cellular Biology', 'Human Physiology', 'Ecology & Environment'],
  che: ['Atomic Structure', 'Chemical Bonding', 'Organic Chemistry', 'Thermodynamics & Kinetics'],
  phy: ['Mechanics & Motion', 'Electromagnetism', 'Optics & Wave Physics', 'Modern Physics & Quantum'],
  soc: ['Civic Life', 'Our Environment', 'History & Heritage'],
  evs: ['Our Surroundings', 'Plants & Animals', 'Clean Water & Air'],
};

const standards = ['std-6', 'std-7', 'std-8', 'std-9', 'std-10', 'std-11', 'std-12'];

let compCounter = 1;
let questionCounter = 1;

for (const stdId of standards) {
  const subjectIds = CLASS_SUBJECT_MAP[stdId] || ['mat', 'eng', 'hin', 'sci'];
  for (const subId of subjectIds) {
    const domains = domainsBySubject[subId] || ['General Core', 'Applied Practice'];
    for (const domain of domains) {
      for (const level of levels) {
        const levelLabel = getLevelLabel(subId, level.id);
        const compId = `comp-${stdId}-${subId}-${compCounter++}`;
        const title = `${domain} · ${levelLabel} Competency (${CLASS_LABELS[stdId] || stdId})`;
        const outcome = `Demonstrates clear mastery and application in ${domain} at ${levelLabel} standard.`;
        const teachingActivity = `Next-day action for ${levelLabel}: Engage students with targeted ${domain.toLowerCase()} hands-on practice and guided feedback.`;

        competencies.push({
          id: compId,
          standardId: stdId,
          subjectId: subId,
          domain,
          title,
          outcome,
          levelId: level.id,
          teachingActivity,
        });

        // Add 2 questions per competency
        questions.push({
          id: `q-${questionCounter++}`,
          standardId: stdId,
          subjectId: subId,
          competencyId: compId,
          levelId: level.id,
          text: `[${CLASS_LABELS[stdId]} ${domain}] Identify the key concept of ${domain} for ${levelLabel}.`,
          options: ['Option A (Fundamental)', 'Option B (Key Principle - Correct)', 'Option C (Alternative)', 'Option D (Extended)'],
          answer: 'Option B (Key Principle - Correct)',
          marks: level.id === 'l1' || level.id === 'l2' ? 1 : level.id === 'l3' || level.id === 'l4' ? 2 : 3,
          type: 'MCQ',
        });

        questions.push({
          id: `q-${questionCounter++}`,
          standardId: stdId,
          subjectId: subId,
          competencyId: compId,
          levelId: level.id,
          text: `[${CLASS_LABELS[stdId]} ${domain}] Explain or compute the solution for ${domain} at ${level.code} level.`,
          options: [],
          answer: `Accurate application of ${domain} concepts with logical steps.`,
          marks: 2,
          type: 'DESCRIPTIVE',
        });
      }
    }
  }
}

export const seedData: SeedData = {
  years: [
    { id: 'AY2025_26', label: '2025–26', status: 'ARCHIVED' },
    { id: 'AY2026_27', label: '2026–27', status: 'ACTIVE' },
    { id: 'AY2027_28', label: '2027–28', status: 'PLANNED' },
  ],
  levels,
  subjects,
  competencies,
  questions,
  students: seedStudents,
  classrooms: seedClassrooms,
  studyMaterials: seedStudyMaterials,
  savedSets: seedSavedSets,
  stats: { schools: 2, teachers: 3, classes: 5, assessments: 24, sync: 4 },
};
```

> ⚠️ **Ordering is load-bearing.** Hand-authored questions are collected from
> `seedSavedSets` and de-duplicated on `` `${subjectId}|${levelId}` `` **before**
> template questions are appended. The paper generator takes the first
> subject+level match, so this order is what makes real questions win over
> templates. Reverse it and every generated paper silently becomes placeholder
> text — with nothing failing visibly.

The loop produces **140 competencies** and **280 template questions**
(7 standards × 4–5 subjects × 4 domains × 5 levels × 2 questions).

---

## 4. Storage — `src/lib/db.ts` — VERBATIM

```ts
import { seedData } from './data';
import Dexie, { type Table } from 'dexie';
import type { SeedData, GeneratedPaper, AssessmentSession, KGEdit, SavedQuestionSet, Student, Classroom } from '../types';

class ShikshaSetuDatabase extends Dexie {
  payload!: Table<{ id: string; data: SeedData }, string>;
  papers!: Table<GeneratedPaper, string>;
  savedSets!: Table<SavedQuestionSet, string>;
  sessions!: Table<AssessmentSession, string>;
  knowledgeGraphEdits!: Table<KGEdit, string>;
  customStudents!: Table<Student, string>;
  customClassrooms!: Table<Classroom, string>;

  constructor() {
    super('shiksha-setu-demo');
    this.version(3).stores({
      payload: 'id',
      papers: 'id, timestamp, classId, subjectId',
      savedSets: 'id, setName, standardId, month, subjectId',
      sessions: 'id, paperId, setName, uploadedAt, month',
      knowledgeGraphEdits: 'id, timestamp, type',
      customStudents: 'id, classId, rollNumber, name',
      customClassrooms: 'id, name, roomName',
    });
  }
}

const database = new ShikshaSetuDatabase();
const SEED_ID = 'seed-data-v6';

export async function loadData(): Promise<SeedData> {
  const existing = await database.payload.get(SEED_ID);
  let loaded: SeedData;
  if (existing) {
    // Merge any dynamically added savedSets or students into memory
    const extraSavedSets = await database.savedSets.toArray();
    const extraStudents = await database.customStudents.toArray();
    const extraClassrooms = await database.customClassrooms.toArray();

    const mergedData = { ...existing.data };
    if (extraSavedSets.length > 0) {
      const setIds = new Set(mergedData.savedSets.map(s => s.id));
      for (const s of extraSavedSets) {
        if (!setIds.has(s.id)) mergedData.savedSets.unshift(s);
      }
    }
    if (extraStudents.length > 0) {
      const studentIds = new Set(mergedData.students.map(s => s.id));
      for (const st of extraStudents) {
        if (!studentIds.has(st.id)) mergedData.students.push(st);
      }
    }
    if (extraClassrooms.length > 0) {
      const classIds = new Set(mergedData.classrooms.map(c => c.id));
      for (const cl of extraClassrooms) {
        if (!classIds.has(cl.id)) mergedData.classrooms.push(cl);
      }
    }
    loaded = mergedData;
  } else {
    await database.payload.put({ id: SEED_ID, data: seedData });
    loaded = seedData;
  }

  // Filter out any legacy Grade 1-5 classrooms (checking exact grades array)
  const legacyGrades = new Set(['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5']);
  loaded.classrooms = loaded.classrooms.filter(c => !c.grades.some(g => legacyGrades.has(g)));
  const validClassIds = new Set(loaded.classrooms.map(c => c.id));
  loaded.students = loaded.students.filter(s => validClassIds.has(s.classId));
  if (loaded.students.length === 0) {
    loaded.students = seedData.students;
  }

  return loaded;
}

export async function resetDemoData(): Promise<SeedData> {
  await database.payload.delete(SEED_ID);
  await database.savedSets.clear();
  await database.customStudents.clear();
  await database.customClassrooms.clear();
  await database.sessions.clear();
  await database.papers.clear();
  return loadData();
}

// ── Assessment Papers ────────────────────────────────────────────────────────
export async function savePaper(paper: GeneratedPaper): Promise<void> {
  await database.papers.put(paper);
}

export async function getAllPapers(): Promise<GeneratedPaper[]> {
  return database.papers.orderBy('timestamp').reverse().toArray();
}

export async function getPaper(id: string): Promise<GeneratedPaper | undefined> {
  return database.papers.get(id);
}

export async function deletePaper(id: string): Promise<void> {
  await database.papers.delete(id);
}

// ── Saved Question Sets (stand_month_setno) ──────────────────────────────────
export async function saveSavedSet(set: SavedQuestionSet): Promise<void> {
  await database.savedSets.put(set);
  // Also update in payload
  const current = await database.payload.get(SEED_ID);
  if (current) {
    const existingIndex = current.data.savedSets.findIndex(s => s.id === set.id);
    if (existingIndex >= 0) {
      current.data.savedSets[existingIndex] = set;
    } else {
      current.data.savedSets.unshift(set);
    }
    await database.payload.put(current);
  }
}

export async function getAllSavedSets(): Promise<SavedQuestionSet[]> {
  return database.savedSets.orderBy('createdAt').reverse().toArray();
}

export async function deleteSavedSet(id: string): Promise<void> {
  await database.savedSets.delete(id);
  const current = await database.payload.get(SEED_ID);
  if (current) {
    current.data.savedSets = current.data.savedSets.filter(s => s.id !== id);
    await database.payload.put(current);
  }
}

// ── Students & Classrooms ───────────────────────────────────────────────────
export async function saveStudent(student: Student): Promise<void> {
  await database.customStudents.put(student);
  const current = await database.payload.get(SEED_ID);
  if (current) {
    const idx = current.data.students.findIndex(s => s.id === student.id);
    if (idx >= 0) {
      current.data.students[idx] = student;
    } else {
      current.data.students.push(student);
    }
    await database.payload.put(current);
  }
}

export async function deleteStudent(id: string): Promise<void> {
  await database.customStudents.delete(id);
  const current = await database.payload.get(SEED_ID);
  if (current) {
    current.data.students = current.data.students.filter(s => s.id !== id);
    await database.payload.put(current);
  }
}

export async function saveClassroom(classroom: Classroom): Promise<void> {
  await database.customClassrooms.put(classroom);
  const current = await database.payload.get(SEED_ID);
  if (current) {
    const idx = current.data.classrooms.findIndex(c => c.id === classroom.id);
    if (idx >= 0) {
      current.data.classrooms[idx] = classroom;
    } else {
      current.data.classrooms.push(classroom);
    }
    await database.payload.put(current);
  }
}

// ── Assessment Sessions (Results) ────────────────────────────────────────────
export async function saveSession(session: AssessmentSession): Promise<void> {
  await database.sessions.put(session);
}

export async function getAllSessions(): Promise<AssessmentSession[]> {
  return database.sessions.orderBy('uploadedAt').reverse().toArray();
}

export async function getSessionByPaper(paperId: string): Promise<AssessmentSession | undefined> {
  return database.sessions.where('paperId').equals(paperId).first();
}

// ── Knowledge Graph Edits ────────────────────────────────────────────────────
export async function saveKGEdit(edit: KGEdit): Promise<void> {
  await database.knowledgeGraphEdits.put(edit);
}

export async function getAllKGEdits(): Promise<KGEdit[]> {
  return database.knowledgeGraphEdits.orderBy('timestamp').toArray();
}

export const dbInfo = { engine: 'Dexie / IndexedDB', version: 3, validationStatus: 'VALIDATED_LOCAL_FIRST' };
```

> ⚠️ The legacy-grade filter is a **migration**, not a nicety. Databases seeded
> before the Grades 6–12 retarget still hold Grade 1–5 classrooms; without this
> filter, returning users see stale rooms.

---

## 5. Knowledge graph — `src/lib/knowledge-graph.ts` — VERBATIM

```ts
/**
 * Shiksha Setu — Education Knowledge Graph
 *
 * Architecture inspired by SimulateX's knowledge graph (nodes, edges, adjacency list, weighted BFS).
 * Adapted for an education domain: Subject → Domain → Competency → Question hierarchy.
 *
 * Node types:   SUBJECT | DOMAIN | COMPETENCY | QUESTION
 * Edge types:   CONTAINS | ASSESSED_BY | PREREQUISITE | TEACHES
 */

import type { SeedData, KGNode, KGEdge, KGEdit, Question, Competency } from '../types';

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
```

---

## 6. Services — `src/lib/services.ts` — VERBATIM

```ts
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
```

---

## 7. Tests — `src/lib/services.test.ts` — VERBATIM

```ts
import { describe, expect, it } from 'vitest';
import { seedData } from './data';
import { generateMonthlyPulse, parseResultsCSV, mapResultsToStudents, buildGroupRecommendations } from './services';
import { buildEducationGraph } from './knowledge-graph';

describe('Assessment Services & Knowledge Graph Integration', () => {
  it('selects exactly one question for every active level (L1–L5)', () => {
    const questions = generateMonthlyPulse(seedData, 'std-6', 'mat');
    expect(questions).toHaveLength(seedData.levels.length);
    expect(new Set(questions.map(q => q.levelId)).size).toBe(seedData.levels.length);
  });

  it('parses predefined CSV format with Roll Number, Level marks, and Final Level', () => {
    const csvContent = `Roll Number, Student Name, Date of Assessment, L1 Mark, L2 Mark, L3 Mark, L4 Mark, L5 Mark, Final Level, Remarks
1, Anita Devi, 2026-09-05, 1, 1, 0, 0, 0, 2, Emerging word reader
2, Sohan Lal, 2026-09-05, 1, 1, 2, 0, 0, 3, Developing 2-digit addition
14, Rekha Kumari, 2026-09-05, 1, 1, 2, 2, 0, 4, Sentence fluency checked`;

    const parsed = parseResultsCSV(csvContent);
    expect(parsed).toHaveLength(3);
    expect(parsed[0].rollNumber).toBe(1);
    expect(parsed[0].level).toBe(2);
    expect(parsed[1].rollNumber).toBe(2);
    expect(parsed[1].level).toBe(3);
    expect(parsed[2].rollNumber).toBe(14);
    expect(parsed[2].level).toBe(4);
  });

  it('maps parsed CSV results to existing student records in class', () => {
    const rawResults: { rollNumber: number; level: number; topicScores: Record<string, number> }[] = [
      { rollNumber: 14, level: 4, topicScores: { Fractions: 85 } },
      { rollNumber: 1, level: 2, topicScores: { Letters: 50 } },
    ];

    const mapped = mapResultsToStudents(rawResults, seedData.students, 'class-multigrade-1');
    expect(mapped).toHaveLength(2);
    expect(mapped[0].studentName).toBe('Rekha Kumari');
    expect(mapped[0].level).toBe(4);
    expect(mapped[1].studentName).toBe('Anita Devi');
    expect(mapped[1].level).toBe(2);
  });

  it('builds group recommendations using Knowledge Graph actions', () => {
    const graph = buildEducationGraph(seedData);
    const studentResults = [
      { rollNumber: 1, studentId: 'stu-1', studentName: 'Student 1', level: 1, topicScores: {} },
      { rollNumber: 2, studentId: 'stu-2', studentName: 'Student 2', level: 3, topicScores: {} },
    ];

    const groups = buildGroupRecommendations(
      studentResults,
      seedData.levels,
      graph,
      seedData,
      'mat',
      'std-6'
    );

    expect(groups).toHaveLength(5);
    expect(groups[0].level).toBe(1);
    expect(groups[0].students).toHaveLength(1);
    expect(groups[2].level).toBe(3);
    expect(groups[2].students).toHaveLength(1);
    expect(groups[0].activity).toBeDefined();
  });
});
```


---

## 8. Routing and app shell — `src/main.tsx` — SPEC

`BrowserRouter`. Unauthenticated traffic redirects to `/login`.
Logged-in user is held in React state (no persistence of the session itself).

### 8.1 Navigation — VERBATIM

```tsx
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
```

### 8.2 Route table

| Role | Path | Component |
|---|---|---|
| ADMIN | `/admin/dashboard` | `AdminDashboard` (local to main.tsx) |
| ADMIN | `/admin/standards` | `AcademicStructure` |
| ADMIN | `/admin/questions` | `Questions` |
| ADMIN | `/admin/knowledge-graph` | `KnowledgeGraph` |
| ADMIN | `/admin/schools` | `Schools` |
| ADMIN | `/admin/sync-queue` | `SyncQueue` |
| TEACHER | `/teacher/dashboard` | `TeacherDashboard` (local to main.tsx) |
| TEACHER | `/teacher/new-assessment` | `AssessmentFlow` |
| TEACHER | `/teacher/saved-sets` | `SavedQuestionSets` |
| TEACHER | `/teacher/student-register` | `StudentRegister` |
| TEACHER | `/teacher/classes` | `Classes` |
| TEACHER | `/teacher/teaching-groups` | `TeachingGroups` |
| TEACHER | `/teacher/parent-progress` | `ParentProgress` |
| TEACHER | `/teacher/history` | `AssessmentHistory` |
| TEACHER | `/teacher/knowledge-graph` | `KGEditor` |
| TEACHER | `/teacher/assessments` | `Assessments` — route exists, **no nav entry** |
| — | `/login` | `Login` |
| — | `*` | `<Navigate to="/login" replace />` |

### 8.3 Shell structure

```
.app-shell                        flex row, align-items: flex-start
  aside.sidebar                   250px; sticky top:0 height:100dvh ≥701px
    .sidebar-top > .brand-lockup  "Shiksha Setu" / "Learning Recovery"
    .year-switch                  Academic Year — 2026–27
    nav > button.nav-item         .active for current route
    .sidebar-bottom               Reset Demo Data (ADMIN only), Sign Out
  section.main-area               flex:1; min-width:0
    header.topbar                 .crumb breadcrumb + .top-actions (avatar, name)
    main.page-content             padding 38px; max-width 1440px; margin auto
```

Below 700px the sidebar becomes a fixed off-canvas drawer toggled by a `.open`
class and `translateX`; `.mobile-menu` and `.mobile-close` buttons appear.

### 8.4 Login screen

Split layout: `.login-art` (headline *"Five-minute assessment. Next-day teaching
action."*, the word "Next-day teaching action" in `--orange`) and `.login-card`.

The card holds a **4-profile switcher** (`.profile-card-btn` per `demoUsers`
entry), a Mobile Number field defaulting to `+91 98765 43210`, a Teacher ID
field defaulting to `HV-SRW-0142`, and a submit button
`.primary.full` labelled **"Enter Teacher Workspace"**.

Submitting calls `onLogin(selectedUser)` and routes to
`/teacher/dashboard` or `/admin/dashboard` by role. **No validation.**

### 8.5 Bootstrapping

```
registerSW({ immediate: true })      // from 'virtual:pwa-register'
loadData()                           // Dexie → SeedData
buildEducationGraph(data)            // memoised with React.useMemo
```

---

## 9. Views — SPEC

Every view takes `{ data: SeedData }`. Mutating views also take
`onRefreshData: () => Promise<void>`, called after any write.

| Export | Module | Responsibility |
|---|---|---|
| `AcademicStructure` | main-views | Tabs: Standards / Subjects / Level frameworks / Competencies |
| `Questions` | main-views | Question bank; subject filtered by standard; paginated 10/page |
| `KnowledgeGraph` | main-views | Read-only graph explorer, `.graph-layout` + detail panel |
| `Schools` | main-views | School and multi-grade unit registry |
| `SyncQueue` | main-views | Pending offline sync records |
| `Classes` | main-views | Classroom ribbon, 5 stat tiles, L1–L5 group cards, student table |
| `Assessments` | main-views | Monthly Pulse Generator — one question per level |
| `TeachingGroups` | main-views | 5 dynamic groups, each with next-day activity + Open Pack |
| `ParentProgress` | main-views | Parent cards list, label-free, batch PDF |
| `AssessmentFlow` | assessment-flow | The 4-step wizard (§10) |
| `AssessmentHistory` | assessment-history | Past papers, re-download, session groups |
| `StudentRegister` | student-register | Roster CRUD, parent contacts, CSV export |
| `SavedQuestionSets` | saved-question-sets | Finalised set archive with filters |
| `KGEditor` | kg-editor | Add questions and competencies to the graph |
| `StudyMaterialModal` | components | Level-switchable remedial pack |

### 9.1 Cross-cutting behaviours

- **Pagination** — `currentPage` + `pageSize` (default 10, options 5/10/20).
  `setCurrentPage(1)` on **any** filter or search change.
  Bar markup: `.table-pagination-bar` > `.table-pagination-info`
  (`Showing X to Y of Z records` + `.page-size-selector`) and
  `.table-pagination-actions` (Previous / `Page N of M` / Next).
- **Search** — case-insensitive substring over class name, subject name and set name.
- **Subject choices** are always constrained by `CLASS_SUBJECT_MAP[standardId]`.
- **Level labels** always go through `getLevelLabel(subjectId, levelId)`.
- **Toasts** — `.floating-toast`, bottom-right, auto-dismiss ~3.5s.

### 9.2 `StudyMaterialModal`

Props: `{ material, levels, selectedLevelId, onSelectLevel, onClose }`.
Header shows a level chip + title *"Targeted Remedial Study Material"*.
Then `.level-switch-ribbon` (label "Level:" + `.level-buttons-row` of
`.level-btn-pill`, one per level — **must wrap, never scroll**), the hero
summary, *Teacher Instruction Guide (Next-Day Action)*, *Concrete Hands-on /
Tactile Activities* (numbered), and printable worksheets.

---

## 10. Assessment workflow — SPEC

### 10.1 Four steps

1. **Frame Assessment Set Covering All Levels (L1–L5)** — fields: Target
   Classroom, Subject, Assessment Month & Year (two selects side by side),
   Set Number, Total Number of Questions, Level Distribution Framing, and a
   read-only Generated Set Identifier. CTA: *"Frame Assessment from Knowledge Graph"*.
2. **Review Framed Assessment Set** — level-coverage chart, question list with
   options and highlighted correct answer, *Save to Question Sets*,
   *Download Student Paper (PDF)*, *Download Answer Key (PDF)*.
3. **GenAI Grading Studio (Google Gemini / ChatGPT)** — copyable prompt block
   (`.prompt-code`, monospace) plus deep links to both tools.
4. **Upload Result CSV & Map to Student Register** — *Download CSV Template*,
   a drag-and-drop `.upload-box`, and a paste textarea. Then parse → map →
   build groups → persist an `AssessmentSession`.

### 10.2 Set identifier — VERBATIM

```ts
const classPrefix = selectedStandardId.replace('-', '');              // 'std-6' -> 'std6'
const monthClean  = selectedMonth.toLowerCase().replace(/\s+/g, ''); // 'September 2026' -> 'september2026'
const computedSetName = `${classPrefix}_${monthClean}_set${setNumber}`;
// -> std6_september2026_set01
```

### 10.3 Result CSV contract

```
Roll Number, Student Name, Date of Assessment, L1 Mark, L2 Mark, L3 Mark, L4 Mark, L5 Mark, Final Level, Remarks
```

`Final Level` (1–5) is **authoritative** — the app does not recompute a level
from the per-level marks. Column order is not enforced; detection is by regex
(see `parseResultsCSV`).

Example rows:
```csv
1, Anita Devi, 2026-09-05, 1, 1, 0, 0, 0, 2, Emerging word reader
3, Pooja Kumari, 2026-09-05, 1, 1, 2, 2, 0, 4, Proficient sentence reading
4, Amit Kumar, 2026-09-05, 1, 0, 0, 0, 0, 1, Requires concrete foundation pack
```

---

## 11. PDF output — `src/components/print-paper.tsx` — SPEC

jsPDF, A4 portrait, `unit: 'mm'`, margin 15mm.

- `downloadStudentPaper(paper: GeneratedPaper)` — centred header
  `SHIKSHA SETU — ASSESSMENT PAPER` at 16pt, colour `rgb(30,41,59)`, then
  `Academic Evaluation Sheet` at 10pt, colour `rgb(71,85,105)`. Metadata row
  (class, subject, set name, date), then question blocks with lettered options
  and answer space. Header repeats on every page.
- `downloadAnswerKey(paper)` — same layout, with correct answers and level labels.
- `registerDevanagariFont(doc)` — attempts to register Noto Sans Devanagari,
  falls back to Helvetica when absent. Wrap in try/catch.
- Parent cards are generated inline in `ParentProgress`: `doc.rect(20, y, 170, 50)`,
  4 per page, `y = 40 + (idx % 4) * 55`.

---

## 12. Design system — SPEC

### 12.1 `src/styles/styles.css` root tokens — VERBATIM

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
:root{--font:'Inter','Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;font-family:var(--font);color:#1e3033;background:#f6f8f7;font-synthesis:none;--ink:#1e3033;--muted:#6d7c7c;--line:#dfe7e4;--teal:#0b6e69;--teal-dark:#075653;--mint:#e1f2ee;--orange:#c86b36;--shadow:0 12px 35px rgba(24,57,55,.08)}*{box-sizing:border-box}body{margin:0}button,input,select{font:inherit}button{cursor:pointer;border:0}.login-page{min-height:100vh;display:grid;grid-template-columns:1fr 460px;background:#eef5f2}.login-art{padding:clamp(40px,8vw,120px);background:radial-gradient(circle at 70% 20%,#bcded4 0,#e6f1ed 28%,#eef5f2 65%);position:relative;overflow:hidden}.login-art:after{content:'';position:absolute;width:420px;height:420px;border:1px solid #a4ccc1;border-radius:50%;right:-120px;bottom:-130px}.brand-mark{width:44px;height:44px;background:var(--teal);color:#fff;display:grid;place-items:center;font-weight:700;border-radius:12px;letter-spacing:-1px}.brand-mark.small{width:34px;height:34px;border-radius:9px;font-size:12px}.eyebrow{text-transform:uppercase;letter-spacing:1.5px;font-size:11px;font-weight:700;color:var(--teal);margin:0 0 12px}.login-art .eyebrow{margin-top:80px}.login-art h1{font:600 clamp(38px,5vw,70px)/1.02 var(--font);margin:0;color:#183837;letter-spacing:-1.5px}.login-art h1 em{color:var(--orange);font-style:normal}.login-copy{max-width:410px;font-size:17px;line-height:1.65;color:#536b69;margin:26px 0}.signal-row{display:flex;gap:24px;color:var(--teal);font-size:13px}.signal-row span{display:flex;align-items:center;gap:7px}.login-card{background:#fff;margin:auto;width:min(390px,calc(100% - 40px));padding:40px;border-radius:18px;box-shadow:var(--shadow);display:grid;gap:24px}.brand-lockup{display:flex;gap:11px;align-items:center}.brand-lockup strong,.brand-lockup small{display:block}.brand-lockup small{font-size:11px;color:var(--muted);margin-top:2px}.login-card h2{font:600 34px var(--font);margin:0 0 7px}.muted{color:var(--muted);font-size:13px;line-height:1.55;margin:0}.login-card label{display:grid;gap:7px;color:#536261;font-size:12px;font-weight:700}.login-card input,.login-card select{border:1px solid var(--line);border-radius:9px;padding:12px;background:#fff;color:var(--ink);outline-color:var(--teal)}.primary,.secondary{border-radius:9px;padding:12px 16px;display:inline-flex;align-items:center;justify-content:center;gap:8px;font-weight:700;font-size:13px}.primary{background:var(--teal);color:#fff}.primary:hover{background:var(--teal-dark)}.secondary{background:#e6f2ef;color:var(--teal)}.full{width:100%}.tiny-note{font-size:11px;color:#899694;text-align:center;margin:0}.error{color:#b54343;font-size:12px;margin:0}.app-shell{min-height:100vh;display:flex}.sidebar{width:250px;background:#fff;border-right:1px solid var(--line);display:flex;flex-direction:column;padding:24px 15px;flex:none}.sidebar-top{padding:0 10px 24px}.sidebar .brand-lockup{padding-bottom:20px}.year-switch{border-top:1px solid var(--line);border-bottom:1px solid var(--line);padding:13px 10px;margin-bottom:20px}.year-switch span,.year-switch strong{display:block;font-size:11px}.year-switch span{color:var(--muted);margin-bottom:4px}.year-switch strong{display:flex;justify-content:space-between;align-items:center}.sidebar nav{display:grid;gap:4px}.nav-item{background:transparent;color:#657574;text-align:left;border-radius:8px;padding:11px 10px;display:flex;gap:12px;align-items:center;font-size:13px}.nav-item.active{background:var(--mint);color:var(--teal);font-weight:700}.nav-item:hover{background:#f2f7f5}.sidebar-bottom{margin-top:auto;padding:15px 10px 0;border-top:1px solid var(--line);display:grid;gap:12px}.status-dot{width:7px;height:7px;border-radius:50%;background:#51a37c;display:inline-block}.status-dot.offline{background:#c86b36}.text-button,.link-button{background:none;color:var(--teal);font-size:12px;display:inline-flex;gap:7px;align-items:center;padding:0}.text-button{color:var(--muted);justify-content:flex-start}.main-area{flex:1;min-width:0}.topbar{height:72px;background:#fff;border-bottom:1px solid var(--line);display:flex;align-items:center;justify-content:space-between;padding:0 38px}.crumb{font-size:12px;color:var(--muted)}.crumb span{margin:0 9px;color:#bac5c2}.top-actions{display:flex;align-items:center;gap:12px}.avatar{width:32px;height:32px;border-radius:50%;background:#d8ebe6;color:var(--teal);display:grid;place-items:center;font-size:11px;font-weight:700}.avatar.warm{background:#f4e4d5;color:#b45e2f;width:30px;height:30px}.user-name{font-size:12px;font-weight:700}.page-content{padding:38px;max-width:1440px;margin:auto}.page-header{display:flex;justify-content:space-between;align-items:flex-end;gap:20px;margin-bottom:28px}.page-header h1{font:600 38px var(--font);margin:0 0 8px;color:#183837;letter-spacing:-.5px}.notice{background:#e3f1ed;border:1px solid #cde5de;border-radius:12px;padding:16px 18px;display:flex;align-items:center;gap:14px;margin-bottom:22px;color:var(--teal)}.notice div{display:grid;gap:3px;flex:1}.notice strong{font-size:13px}.notice span{font-size:12px;color:#53716d}.icon-button{background:transparent;color:var(--muted);padding:5px;display:inline-flex}.stat-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:14px;margin-bottom:22px}.stat-card{background:#fff;border:1px solid var(--line);border-radius:12px;padding:17px;display:flex;gap:13px;align-items:flex-start}.stat-icon{width:34px;height:34px;border-radius:8px;display:grid;place-items:center}.stat-icon.teal{background:#dff0ec;color:var(--teal)}.stat-icon.orange{background:#f8e8dc;color:#be602e}.stat-icon.blue{background:#e2edf5;color:#39729b}.stat-icon.green{background:#e4f0e3;color:#4c8754}.stat-icon.purple{background:#ede8f2;color:#78619b}.stat-icon.yellow{background:#f4efd7;color:#987f22}.stat-card strong,.stat-card span,.stat-card small{display:block}.stat-card strong{font-size:24px;color:#183837}.stat-card span{font-size:12px;font-weight:700;margin-top:2px}.stat-card small{font-size:10px;color:var(--muted);margin-top:5px}.dashboard-grid{display:grid;grid-template-columns:1.5fr 1fr;gap:22px}.panel{background:#fff;border:1px solid var(--line);border-radius:12px;padding:22px}.panel.wide{min-height:290px}.panel-heading{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:24px}.panel h3{font-size:15px;margin:0 0 5px}.bars{height:175px;display:flex;align-items:end;justify-content:space-around;gap:18px;border-bottom:1px solid var(--line);padding:0 20px}.bar-col{height:100%;display:flex;flex-direction:column;justify-content:end;align-items:center;gap:8px}.bar-track{width:34px;height:145px;display:flex;align-items:end;gap:3px}.bar{width:15px;background:#4b9d8c;border-radius:4px 4px 0 0}.bar.second{background:#b7ddd2}.bar-col small{font-size:10px;color:var(--muted)}.legend{display:flex;gap:18px;font-size:10px;color:var(--muted);margin-top:16px}.legend-dot{display:inline-block;width:8px;height:8px;border-radius:50%;margin-right:5px}.legend-dot.teal{background:#4b9d8c}.legend-dot.pale{background:#b7ddd2}.student-row{display:flex;align-items:center;gap:10px;border-top:1px solid #edf1ef;padding:14px 0}.student-row div:nth-child(2){flex:1}.student-row strong,.student-row small{display:block}.student-row strong{font-size:12px}.student-row small{font-size:10px;color:var(--muted);margin-top:4px}.flag,.tag{font-size:10px;padding:5px 8px;border-radius:5px;white-space:nowrap}.flag{background:#f8e8dc;color:#ad572d}.tag{background:#edf2f0;color:#60716f}.tag.success{background:#e1f1eb;color:#29765f}.tag.warning{background:#f8edd8;color:#977125}.signal-table{display:grid}.table-head,.table-row{display:grid;grid-template-columns:1.2fr 1fr 1fr .9fr;align-items:center;gap:14px}.table-head{font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:1px;padding-bottom:10px}.table-row{border-top:1px solid #edf1ef;padding:16px 0;font-size:12px}.table-row>span{color:var(--muted);font-size:11px}.progress{height:7px;border-radius:10px;background:#e6efec;overflow:hidden}.progress i{display:block;height:100%;background:#4d9b89;border-radius:10px}.action-panel{display:grid;align-content:start;gap:11px}.action-panel h3{margin-bottom:6px}.action-link{display:flex;align-items:center;gap:10px;background:#f7faf9;border:1px solid #e5eeeb;border-radius:8px;padding:13px;text-align:left;color:var(--teal)}.action-link span{flex:1}.action-link strong,.action-link small{display:block}.action-link strong{font-size:12px}.action-link small{font-size:10px;color:var(--muted);margin-top:4px}.mobile-menu,.mobile-close{display:none}
```

*(`styles.css` continues with the app shell, login, sidebar, topbar, stat grid,
dashboard grid and two media queries at 1050px and 700px — 5 physical lines,
heavily minified.)*

### 12.2 `src/styles/ui-polish.css` tokens — VERBATIM

```css
:root{
  /* Inter is declared as --font in styles.css; mono is reserved for
     pre-formatted blocks where proportional spacing would break alignment. */
  --font-mono:ui-monospace,'SF Mono',Menlo,Consolas,'Liberation Mono',monospace;

  --elev-1:0 1px 2px rgba(24,57,55,.05), 0 2px 8px rgba(24,57,55,.045);
  --elev-2:0 2px 5px rgba(24,57,55,.06), 0 10px 24px rgba(24,57,55,.09);
  --elev-3:0 8px 18px rgba(24,57,55,.10), 0 24px 55px rgba(24,57,55,.14);

  --glow-teal:0 0 0 3px rgba(11,110,105,.16), 0 8px 20px rgba(11,110,105,.30);
  --glow-soft:0 0 0 3px rgba(11,110,105,.12), 0 6px 16px rgba(11,110,105,.16);
  --glow-danger:0 0 0 3px rgba(220,38,38,.14), 0 6px 16px rgba(220,38,38,.24);
  --glow-amber:0 0 0 3px rgba(180,83,9,.13), 0 6px 16px rgba(180,83,9,.20);

  --ease:cubic-bezier(.22,.61,.36,1);
}

body{
  -webkit-font-smoothing:antialiased;
```

### 12.3 Typography

- **Inter** is the single typeface for the whole UI, loaded from Google Fonts
  at weights 400;500;600;700;800 and exposed as `--font`.
- Only exception: `.prompt-code` stays monospace (`--font-mono`) because it
  renders pre-formatted prompt text where alignment matters.
- Display headings get weight 700 and tightened tracking (−.02em to −.035em).
- Stat figures and data tables use `font-variant-numeric: tabular-nums`.

### 12.4 Interaction rules

| Element | Rest | Hover | Active |
|---|---|---|---|
| Cards | `--elev-1` | `translateY(-3px)` + `--elev-2`, border → teal | `translateY(-1px)` |
| `.panel` (large containers) | `--elev-1` | `--elev-2`, **no transform** | — |
| Buttons | hue-matched shadow | `translateY(-2px)` + `--glow-*` | `translateY(0)` |
| Modals | — | — | `popIn` scale-and-rise + ambient teal glow |
| Rows | — | tint `#f7fbfa` | — |

Also required: `:focus-visible` rings on every interactive target;
`prefers-reduced-motion` strips animation and transforms;
`@media (hover:none)` drops lifts so taps don't stick; print drops shadows.

### 12.5 Form controls

> ⚠️ Every `<select>` **must** set `appearance: none` and supply an inline-SVG
> chevron via `background-image`, turning teal on hover/focus.
> **Never use the `background` shorthand on a select** — it erases the chevron.
> Set `background-color` and `background-image` separately.

Two control sizes only:

| Tier | Height | Used by |
|---|---|---|
| Form field | **38px** | `.form-group` inputs/selects/textareas, `.field-split` |
| Compact | **31px** | `.filter-item`, `.month-selector-inline`, `.page-size-selector`, `.pagination-btn` |

Inputs inside a bordered shell (`.search`, `.input-with-icon`) stay borderless.
Checkboxes/radios use `accent-color: var(--teal)`.

---

## 13. Responsive behaviour — SPEC

Breakpoints: **1050px** (tablet), **700px** (phone), **420px** (small phone).

- Content grids collapse 3 → 2 columns at 1050px, → 1 column at 700px.
- Below 700px the sidebar is a fixed off-canvas drawer (`translateX(-100%)`,
  `.open` → `translateX(0)`).
- At **≥701px** the sidebar is `position: sticky; top: 0; height: 100dvh;
  overflow-y: auto`, and `.app-shell` sets `align-items: flex-start` —
  a stretched flex item has no room to stick.
- Field `font-size: 16px` under 700px so iOS Safari does not zoom on focus.
- Tab strips and chip ribbons scroll horizontally; **control clusters wrap**.

### Three recurring defects and their required remedies

1. **`1fr` has a min-content floor.** One long identifier or a `<select>` whose
   longest option is wide will push a track past its container.
   → Use `minmax(0,1fr)`, never bare `1fr`.
2. **Flex/grid children default to `min-width: auto`.** Their content widens the
   page even when `overflow-x` is set.
   → Add `min-width: 0` to every scroll container and its ancestors.
3. **`overflow-x: auto` also scrolls the block axis.** CSS does not allow
   `visible` on one axis alone, so the container crops the hover lift of cards
   inside it.
   → Give such scrollers vertical padding with a matching negative margin.

---

## 14. Build and verify

```bash
npm install
npm run lint     # tsc --noEmit — must be clean
npm test         # vitest run — 4 tests must pass
npm run build    # tsc -b && vite build
npm run dev      # http://localhost:5173
```

### Acceptance checklist

- [ ] All 16 routes render with no runtime errors
- [ ] Login profile switcher routes ADMIN vs TEACHER correctly
- [ ] Assessment wizard reaches step 4 and generates 5 questions across L1–L5
- [ ] Generated paper uses **real** questions, not `Option B (Key Principle - Correct)` templates
- [ ] CSV upload maps roll numbers to students and builds 5 groups
- [ ] Student paper and answer key PDFs download
- [ ] Zero horizontal overflow at 320px, 375px, 768px, 1024px
- [ ] Every `<select>` shows the custom chevron, not the OS one
- [ ] Sidebar stays pinned while content scrolls (≥701px); drawer opens (<701px)
- [ ] `npm test` → 4 passed

---

## 15. Fidelity limits — read this

A build from this document reproduces the **architecture, type contract, every
algorithm, all routes, the data model and the design system**. Sections marked
VERBATIM will come out character-identical.

It will **not** produce byte-identical source overall, for three reasons:

1. **Literal content.** `data.ts` holds ~930 lines of hand-authored records —
   60+ students with names and parent phone numbers, study materials with
   worksheet text, saved sets with real items. §3.2 gives their shape, counts
   and the critical real questions; the remaining literals live only in the repo.
2. **The views are 5,465 lines of JSX.** §9 specifies their props, state,
   sections, class names and behaviour precisely — but prose admits many
   equivalent implementations. Variable names and JSX ordering will differ.
3. **Nine dependencies are `latest`.** A fresh install resolves to whatever is
   current at that moment.

For an exact byte-for-byte reproduction, the git repository is the only
sufficient source. Everything marked ⚠️ in this document is a rule whose
violation causes **silent** breakage rather than a visible error — those are
the ones to check first if a rebuild behaves oddly.

