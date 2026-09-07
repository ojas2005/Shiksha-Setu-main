import { seedData } from './data';
import Dexie, { type Table } from 'dexie';
import type { SeedData, GeneratedPaper, AssessmentSession, KGEdit, SavedQuestionSet, Student, Classroom } from './types';

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
