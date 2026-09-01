import jsPDF from 'jspdf';
import type { GeneratedPaper } from './types';

/**
 * Generates and downloads the Student Question Paper PDF using jsPDF.
 * Prefills Class and Subject. Leaves Roll Number blank for the student to write.
 */
export function downloadStudentPaper(paper: GeneratedPaper): void {
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

  // Helper to add header on every page
  const addHeader = (isFirstPage = false) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(30, 41, 59); // dark slate
    doc.text('SHIKSHA SETU — ASSESSMENT PAPER', pageWidth / 2, y, { align: 'center' });
    y += 7;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(`Academic Evaluation Sheet`, pageWidth / 2, y, { align: 'center' });
    y += 8;

    // Divider line
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);
    y += 6;

    if (isFirstPage) {
      // Info box with prefilled Class & Subject, blank Roll No
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(margin, y, contentWidth, 22, 2, 2, 'F');
      doc.rect(margin, y, contentWidth, 22, 'S');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);

      // Left column: Prefilled Class & Subject
      doc.text(`Class: ${paper.className}`, margin + 5, y + 7);
      doc.text(`Subject: ${paper.subjectName}`, margin + 5, y + 15);

      // Right column: Total Qs, Total Marks, Blank Roll No
      const totalMarks = paper.questions.reduce((sum, q) => sum + (q.marks || 1), 0);
      doc.text(`Total Questions: ${paper.totalQuestions}`, margin + contentWidth / 2 + 5, y + 7);
      doc.text(`Total Marks: ${totalMarks}`, margin + contentWidth / 2 + 5, y + 15);

      y += 26;

      // Student Roll Number box
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('Student Roll Number: [ ____________________ ]', margin + 5, y);
      doc.text('Date: ____/____/20____', margin + contentWidth - 55, y);
      y += 10;

      // Divider line
      doc.line(margin, y, pageWidth - margin, y);
      y += 8;
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
  doc.setFont('helvetica', 'bold');
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
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);
    doc.text(qTitle, margin, y);
    y += 5;

    // Question Body
    doc.setFont('helvetica', 'normal');
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
    doc.setFont('helvetica', 'italic');
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
 */
export function downloadAnswerKey(paper: GeneratedPaper): void {
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

  const addHeader = (isFirstPage = false) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(180, 83, 9); // Amber/brown for Answer Key header
    doc.text('TEACHER ANSWER KEY — CONFIDENTIAL', pageWidth / 2, y, { align: 'center' });
    y += 7;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(`Shiksha Setu Evaluation Guide`, pageWidth / 2, y, { align: 'center' });
    y += 8;

    doc.setDrawColor(245, 158, 11); // Amber line
    doc.setLineWidth(0.7);
    doc.line(margin, y, pageWidth - margin, y);
    y += 6;

    if (isFirstPage) {
      doc.setFillColor(254, 243, 199); // light amber box
      doc.roundedRect(margin, y, contentWidth, 20, 2, 2, 'F');
      doc.rect(margin, y, contentWidth, 20, 'S');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(120, 53, 15);

      doc.text(`Class: ${paper.className}`, margin + 5, y + 7);
      doc.text(`Subject: ${paper.subjectName}`, margin + 5, y + 14);

      const totalMarks = paper.questions.reduce((sum, q) => sum + (q.marks || 1), 0);
      doc.text(`Total Questions: ${paper.totalQuestions}`, margin + contentWidth / 2 + 5, y + 7);
      doc.text(`Total Marks: ${totalMarks}`, margin + contentWidth / 2 + 5, y + 14);

      y += 24;
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

  doc.setFont('helvetica', 'bold');
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
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);
    doc.text(qTitle, margin, y);
    y += 5;

    // Question Text
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(51, 65, 85);
    doc.text(qTextLines, margin + 5, y);
    y += qTextLines.length * 5 + 3;

    // Correct Answer Highlight Box
    doc.setFillColor(236, 253, 245); // emerald tint
    doc.roundedRect(margin + 5, y, contentWidth - 10, ansLines.length * 5 + 4, 1, 1, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(4, 120, 87); // emerald 700
    doc.text(ansLines, margin + 8, y + 5);

    y += ansLines.length * 5 + 9;
  });

  // Footer
  const pageCount = (doc.internal as any).getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184);
    doc.text(`Page ${i} of ${pageCount} — FOR TEACHER USE ONLY`, pageWidth / 2, pageHeight - 8, { align: 'center' });
  }

  const filename = `Answer_Key_${paper.className.replace(/\s+/g, '_')}_${paper.subjectName.replace(/\s+/g, '_')}_${paper.id.slice(-6)}.pdf`;
  doc.save(filename);
}
