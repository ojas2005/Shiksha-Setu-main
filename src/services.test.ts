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