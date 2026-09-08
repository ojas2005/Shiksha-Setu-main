import jsPDF from 'jspdf';
import type { GeneratedPaper } from '../types';
import { paperHasDevanagari, downloadPaperAsImagePdf } from './pdf-devanagari';

// ============================================================================
// DEVANAGARI FONT SUPPORT
// ============================================================================
// To enable Hindi (Devanagari) text rendering in PDFs:
// 1. Download: https://fonts.google.com/download?family=Noto%20Sans%20Devanagari
// 2. Extract NotoSansDevanagari-Regular.ttf
// 3. Convert using: npx jspdf-fontconverter NotoSansDevanagari-Regular.ttf
// 4. Place generated files in public/fonts/ directory
// 5. Update fontRegistrationPath below to point to the correct location
// ============================================================================

/** Detects if text contains Hindi/Devanagari Unicode characters */
function containsHindi(text: string): boolean {
  return /[\u0900-\u097F]/.test(text);
}

/** Registers Devanagari font if available; gracefully falls back to Helvetica */
function registerDevanagariFont(doc: jsPDF): void {
  try {
    // Import statement: import './fonts/NotoSansDevanagari-Regular';
    // This assumes the font converter has been run and files placed in public/fonts/
    const devanagariAvailable = (globalThis as any).pdfMake?.fonts?.['NotoSansDevanagari-Regular'];
    if (devanagariAvailable) {
      doc.addFont('NotoSansDevanagari-Regular.ttf', 'NotoSansDevanagari', 'normal');
    }
  } catch (e) {
    // Font not available - will fall back to Helvetica for all text
  }
}

/** Sets font based on text content: Devanagari for Hindi, Helvetica for English */
function setFontForContent(doc: jsPDF, text: string, isBold = false): void {
  if (containsHindi(text)) {
    try {
      doc.setFont('NotoSansDevanagari', isBold ? 'bold' : 'normal');
      return;
    } catch (e) {
      // Font not available, fall through to Helvetica
    }
  }
  doc.setFont('helvetica', isBold ? 'bold' : 'normal');
}

/**
 * Generates and downloads the Student Question Paper PDF using jsPDF.
 * Prefills Class and Subject. Leaves Roll Number blank for the student to write.
 * Supports both English and Hindi (Devanagari) text.
 */
export async function downloadStudentPaper(paper: GeneratedPaper): Promise<void> {
  // The 14 standard PDF fonts are Latin-1 only and jsPDF does no OpenType
  // shaping, so Devanagari cannot render on the vector path. Hand those
  // papers to the browser-shaped renderer instead.
  if (paperHasDevanagari(paper)) return downloadPaperAsImagePdf(paper, false);

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  let y = 15;

  // Register Devanagari font if available
  registerDevanagariFont(doc);

  // Helper to add header on every page
  const addHeader = (isFirstPage = false) => {
    setFontForContent(doc, 'SHIKSHA SETU', true);
    doc.setFontSize(16);
    doc.setTextColor(30, 41, 59); // dark slate
    doc.text('SHIKSHA SETU — ASSESSMENT PAPER', pageWidth / 2, y, { align: 'center' });
    y += 7;

    doc.setFontSize(10);
    setFontForContent(doc, 'Academic Evaluation Sheet', false);
    doc.setTextColor(71, 85, 105);
    doc.text(`Academic Evaluation Sheet`, pageWidth / 2, y, { align: 'center' });
    y += 8;

    // Divider line
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);
    y += 6;

    // Roll Number on EVERY page (top right corner for quick identification)
    setFontForContent(doc, 'Roll', false);
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text('Roll No: [ ____________ ]', margin + contentWidth - 50, y - 6);

    if (isFirstPage) {
      // Info box with prefilled Class & Subject, blank Roll No
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(margin, y, contentWidth, 22, 2, 2, 'F');
      doc.rect(margin, y, contentWidth, 22, 'S');

      setFontForContent(doc, paper.className, true);
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);

      // Left column: Prefilled Class & Subject
      doc.text(`Class: ${paper.className}`, margin + 5, y + 7);
      setFontForContent(doc, paper.subjectName, false);
      doc.text(`Subject: ${paper.subjectName}`, margin + 5, y + 15);

      // Right column: Total Qs, Total Marks, Blank Roll No
      const totalMarks = paper.questions.reduce((sum, q) => sum + (q.marks || 1), 0);
      setFontForContent(doc, 'Total Questions', false);
      doc.text(`Total Questions: ${paper.totalQuestions}`, margin + contentWidth / 2 + 5, y + 7);
      setFontForContent(doc, 'Total Marks', false);
      doc.text(`Total Marks: ${totalMarks}`, margin + contentWidth / 2 + 5, y + 15);

      y += 26;

      // Student Roll Number box
      setFontForContent(doc, 'Student Roll Number', true);
      doc.setFontSize(10);
      doc.text('Student Roll Number: [ ____________________ ]', margin + 5, y);
      setFontForContent(doc, 'Date', false);
      doc.text('Date: ____/____/20____', margin + contentWidth - 55, y);
      y += 10;

      // Divider line
      doc.line(margin, y, pageWidth - margin, y);
      y += 8;
    } else {
      // On subsequent pages, add some spacing after the header
      y += 2;
    }
  };

  const checkPageBreak = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - margin) {
      doc.addPage();
      y = 15;
      addHeader(false);
    }
  };

  addHeader(true);

  // Question List
  setFontForContent(doc, 'Questions', true);
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text('Questions', margin, y);
  y += 7;

  paper.questions.forEach((q, idx) => {
    const qNum = idx + 1;
    const qTitle = `Q${qNum}. (${q.marks || 1} mark${(q.marks || 1) > 1 ? 's' : ''}) [${q.type}]`;
    const qTextLines = doc.splitTextToSize(q.text, contentWidth - 10);

    const neededHeight = 10 + qTextLines.length * 6 + (q.type === 'MCQ' ? (q.options?.length || 4) * 6 + 4 : 20);
    checkPageBreak(neededHeight);

    // Question Header
    setFontForContent(doc, q.text, true);
    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);
    doc.text(qTitle, margin, y);
    y += 5;

    // Question Body
    setFontForContent(doc, q.text, false);
    doc.setFontSize(10);
    doc.setTextColor(51, 65, 85);
    doc.text(qTextLines, margin + 5, y);
    y += qTextLines.length * 5 + 3;

    // Options or Answer Space
    if (q.type === 'MCQ' && q.options && q.options.length > 0) {
      const optionLabels = ['(A)', '(B)', '(C)', '(D)', '(E)'];
      q.options.forEach((opt, optIdx) => {
        checkPageBreak(6);
        const label = optionLabels[optIdx] || `(${optIdx + 1})`;
        setFontForContent(doc, opt, false);
        doc.text(`${label} ${opt}`, margin + 10, y);
        y += 5;
      });
      y += 3;
    } else {
      // Descriptive question: draw blank lines for writing answer
      checkPageBreak(18);
      doc.setDrawColor(226, 232, 240);
      for (let i = 0; i < 3; i++) {
        doc.line(margin + 5, y, margin + contentWidth - 5, y);
        y += 6;
      }
      y += 2;
    }

    y += 4;
  });

  // Footer page numbers
  const pageCount = (doc.internal as any).getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    setFontForContent(doc, 'Page', false);
    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184);
    doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, pageHeight - 8, { align: 'center' });
    doc.text(`Shiksha Setu Assessment Engine`, margin, pageHeight - 8);
  }

  // Save PDF
  const filename = `Question_Paper_${paper.className.replace(/\s+/g, '_')}_${paper.subjectName.replace(/\s+/g, '_')}_${paper.id.slice(-6)}.pdf`;
  doc.save(filename);
}

/**
 * Generates and downloads the Answer Key PDF for Teachers using jsPDF.
 * Supports both English and Hindi (Devanagari) text.
 */
export async function downloadAnswerKey(paper: GeneratedPaper): Promise<void> {
  // The 14 standard PDF fonts are Latin-1 only and jsPDF does no OpenType
  // shaping, so Devanagari cannot render on the vector path. Hand those
  // papers to the browser-shaped renderer instead.
  if (paperHasDevanagari(paper)) return downloadPaperAsImagePdf(paper, true);

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  let y = 15;

  // Register Devanagari font if available
  registerDevanagariFont(doc);

  const addHeader = (isFirstPage = false) => {
    setFontForContent(doc, 'TEACHER ANSWER KEY', true);
    doc.setFontSize(16);
    doc.setTextColor(180, 83, 9); // Amber/brown for Answer Key header
    doc.text('TEACHER ANSWER KEY — CONFIDENTIAL', pageWidth / 2, y, { align: 'center' });
    y += 7;

    doc.setFontSize(10);
    setFontForContent(doc, 'Shiksha Setu Evaluation Guide', false);
    doc.setTextColor(71, 85, 105);
    doc.text(`Shiksha Setu Evaluation Guide`, pageWidth / 2, y, { align: 'center' });
    y += 8;

    doc.setDrawColor(245, 158, 11); // Amber line
    doc.setLineWidth(0.7);
    doc.line(margin, y, pageWidth - margin, y);
    y += 6;

    // Roll Number on EVERY page (top right corner for quick identification)
    setFontForContent(doc, 'Roll', false);
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text('Roll No: [ ____________ ]', margin + contentWidth - 50, y - 6);

    if (isFirstPage) {
      doc.setFillColor(254, 243, 199); // light amber box
      doc.roundedRect(margin, y, contentWidth, 20, 2, 2, 'F');
      doc.rect(margin, y, contentWidth, 20, 'S');

      setFontForContent(doc, paper.className, true);
      doc.setFontSize(11);
      doc.setTextColor(120, 53, 15);

      doc.text(`Class: ${paper.className}`, margin + 5, y + 7);
      setFontForContent(doc, paper.subjectName, false);
      doc.text(`Subject: ${paper.subjectName}`, margin + 5, y + 14);

      const totalMarks = paper.questions.reduce((sum, q) => sum + (q.marks || 1), 0);
      setFontForContent(doc, 'Total Questions', false);
      doc.text(`Total Questions: ${paper.totalQuestions}`, margin + contentWidth / 2 + 5, y + 7);
      setFontForContent(doc, 'Total Marks', false);
      doc.text(`Total Marks: ${totalMarks}`, margin + contentWidth / 2 + 5, y + 14);

      y += 24;
    } else {
      // On subsequent pages, add some spacing after the header
      y += 2;
    }
  };

  const checkPageBreak = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - margin) {
      doc.addPage();
      y = 15;
      addHeader(false);
    }
  };

  addHeader(true);

  setFontForContent(doc, 'Answer Key & Marking Scheme', true);
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text('Answer Key & Marking Scheme', margin, y);
  y += 7;

  paper.questions.forEach((q, idx) => {
    const qNum = idx + 1;
    const qTitle = `Q${qNum}. [${q.type}] (${q.marks || 1} mark${(q.marks || 1) > 1 ? 's' : ''})`;
    const qTextLines = doc.splitTextToSize(q.text, contentWidth - 10);
    const ansLines = doc.splitTextToSize(`Correct Answer: ${q.answer}`, contentWidth - 15);

    const neededHeight = 12 + qTextLines.length * 5 + ansLines.length * 5;
    checkPageBreak(neededHeight);

    // Question label
    setFontForContent(doc, q.text, true);
    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);
    doc.text(qTitle, margin, y);
    y += 5;

    // Question Text
    setFontForContent(doc, q.text, false);
    doc.setFontSize(10);
    doc.setTextColor(51, 65, 85);
    doc.text(qTextLines, margin + 5, y);
    y += qTextLines.length * 5 + 3;

    // Correct Answer Highlight Box
    doc.setFillColor(236, 253, 245); // emerald tint
    doc.roundedRect(margin + 5, y, contentWidth - 10, ansLines.length * 5 + 4, 1, 1, 'F');

    setFontForContent(doc, q.answer, true);
    doc.setFontSize(10);
    doc.setTextColor(4, 120, 87); // emerald 700
    doc.text(ansLines, margin + 8, y + 5);

    y += ansLines.length * 5 + 9;
  });

  // Footer
  const pageCount = (doc.internal as any).getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    setFontForContent(doc, 'Page', false);
    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184);
    doc.text(`Page ${i} of ${pageCount} — FOR TEACHER USE ONLY`, pageWidth / 2, pageHeight - 8, { align: 'center' });
  }

  const filename = `Answer_Key_${paper.className.replace(/\s+/g, '_')}_${paper.subjectName.replace(/\s+/g, '_')}_${paper.id.slice(-6)}.pdf`;
  doc.save(filename);
}
