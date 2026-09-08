import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import type { GeneratedPaper } from '../types';

/**
 * Devanagari-safe PDF rendering.
 *
 * jsPDF draws text with the 14 standard PDF fonts, all of which are Latin-1,
 * so Devanagari codepoints are emitted as raw bytes and render as garbage.
 * Embedding a Noto TTF does not fix it either: jsPDF has no OpenType shaping
 * engine, and Devanagari needs GSUB/GPOS to reorder matras (ि is stored after
 * its consonant but must render before it) and to form conjuncts (क् + ष → क्ष).
 * Glyphs would appear in logical order — still wrong.
 *
 * The browser already has a complete shaping engine. So for any paper carrying
 * Devanagari we lay the page out as HTML, let the browser shape it, rasterise
 * with html2canvas and place that into the PDF. Correct by construction, and
 * html2canvas already ships as a jspdf dependency, so nothing new is added.
 *
 * Trade-off: this page is an image, so its text is not selectable or
 * searchable and the file is larger. Latin-only papers keep the vector path.
 */

const DEVANAGARI = /[ऀ-ॿ]/;

// System Devanagari faces, so shaping works with no network — the app is offline-first.
const FONT_STACK =
  "'Noto Sans Devanagari','Nirmala UI','Kohinoor Devanagari','Devanagari MT','Mangal'," +
  "'Inter',system-ui,-apple-system,sans-serif";

export function paperHasDevanagari(paper: GeneratedPaper): boolean {
  if (DEVANAGARI.test(paper.subjectName) || DEVANAGARI.test(paper.className)) return true;
  return paper.questions.some(
    q =>
      DEVANAGARI.test(q.text) ||
      DEVANAGARI.test(q.answer ?? '') ||
      (q.options ?? []).some(o => DEVANAGARI.test(o)),
  );
}

const esc = (s: string) =>
  String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));

function buildHtml(paper: GeneratedPaper, answerKey: boolean): string {
  const totalMarks = paper.questions.reduce((sum, q) => sum + (q.marks || 1), 0);
  const letters = ['A', 'B', 'C', 'D', 'E', 'F'];

  const questions = paper.questions
    .map((q, i) => {
      const marks = q.marks || 1;
      const opts =
        q.type === 'MCQ' && q.options?.length
          ? `<div class="opts">${q.options
              .map((o, oi) => {
                const correct = answerKey && o === q.answer;
                return `<div class="opt${correct ? ' correct' : ''}">
                  <span class="k">(${letters[oi] ?? oi + 1})</span>${esc(o)}
                  ${correct ? '<span class="tick">&#10003;</span>' : ''}</div>`;
              })
              .join('')}</div>`
          : `<div class="answer-space">${
              answerKey ? `<b>Answer:</b> ${esc(q.answer ?? '')}` : '&nbsp;'
            }</div>`;

      const keyLine =
        answerKey && q.type === 'MCQ'
          ? `<div class="keyline"><b>Correct answer:</b> ${esc(q.answer ?? '')}</div>`
          : '';

      return `<section class="q">
        <div class="qhead">Q${i + 1}. (${marks} mark${marks > 1 ? 's' : ''}) [${esc(q.type)}]</div>
        <div class="qtext">${esc(q.text)}</div>
        ${opts}${keyLine}
      </section>`;
    })
    .join('');

  return `<style>
    .sheet{font-family:${FONT_STACK};color:#0f172a;padding:38px 44px;width:794px;box-sizing:border-box;background:#fff}
    .sheet *{box-sizing:border-box}
    .brand{text-align:center;font-size:19px;font-weight:700;letter-spacing:.2px;color:#1e293b}
    .sub{text-align:center;font-size:11px;color:#475569;margin-top:5px}
    .kicker{text-align:center;font-size:11px;font-weight:700;color:#0b6e69;margin-top:7px;letter-spacing:.7px}
    .rule{height:1px;background:#cbd5e1;margin:15px 0}
    .info{display:flex;justify-content:space-between;gap:18px;background:#f8fafc;border:1px solid #e2e8f0;
          border-radius:5px;padding:12px 15px;font-size:12px;line-height:1.85}
    .info b{font-weight:700}
    .idline{display:flex;justify-content:space-between;font-size:11px;margin:13px 2px 0;color:#334155}
    .qs-title{font-size:13px;font-weight:700;margin:20px 0 4px}
    .q{margin-top:14px;padding-bottom:3px}
    .qhead{font-size:11px;font-weight:700;color:#1e293b}
    .qtext{font-size:12.5px;line-height:1.62;margin:5px 0 8px;color:#0f172a}
    .opts{display:grid;grid-template-columns:1fr 1fr;gap:7px}
    .opt{font-size:12px;line-height:1.55;border:1px solid #e2e8f0;border-radius:5px;padding:6px 10px;color:#334155}
    .opt .k{color:#64748b;margin-right:7px;font-weight:600}
    .opt.correct{background:#ecfdf5;border-color:#6ee7b7;color:#047857;font-weight:600}
    .opt .tick{float:right;color:#047857;font-weight:700}
    .answer-space{border:1px solid #e2e8f0;border-radius:5px;min-height:44px;padding:8px 10px;font-size:12px;color:#334155}
    .keyline{margin-top:7px;font-size:11.5px;color:#047857}
    .foot{margin-top:26px;padding-top:9px;border-top:1px solid #e2e8f0;font-size:10px;color:#64748b;text-align:center}
  </style>
  <div class="sheet">
    <div class="brand">SHIKSHA SETU &mdash; ${answerKey ? 'ANSWER KEY' : 'ASSESSMENT PAPER'}</div>
    <div class="sub">Academic Evaluation Sheet</div>
    ${answerKey ? '<div class="kicker">TEACHER COPY &middot; NOT FOR DISTRIBUTION</div>' : ''}
    <div class="rule"></div>
    <div class="info">
      <div><b>Class:</b> ${esc(paper.className)}<br><b>Subject:</b> ${esc(paper.subjectName)}</div>
      <div><b>Total Questions:</b> ${paper.totalQuestions}<br><b>Total Marks:</b> ${totalMarks}</div>
    </div>
    <div class="idline">
      <span>Student Roll Number: [ ____________________ ]</span><span>Date: ____/____/20____</span>
    </div>
    <div class="rule"></div>
    <div class="qs-title">Questions</div>
    ${questions}
    <div class="foot">${esc(paper.setName ?? '')} &middot; Generated by Shiksha Setu</div>
  </div>`;
}

export async function downloadPaperAsImagePdf(paper: GeneratedPaper, answerKey: boolean): Promise<void> {
  const host = document.createElement('div');
  host.setAttribute('aria-hidden', 'true');
  host.style.cssText = 'position:fixed;left:-10000px;top:0;width:794px;background:#fff;z-index:-1;';
  host.innerHTML = buildHtml(paper, answerKey);
  document.body.appendChild(host);

  try {
    // Wait for the Devanagari face to be ready, or shaping falls back mid-render.
    if (document.fonts?.ready) await document.fonts.ready;

    const canvas = await html2canvas(host, {
      scale: 2,                 // 2x for crisp print output
      backgroundColor: '#ffffff',
      logging: false,
      windowWidth: 794,
    });

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const PW = 210, PH = 297;
    const imgH = (canvas.height * PW) / canvas.width;
    const img = canvas.toDataURL('image/jpeg', 0.94);

    doc.addImage(img, 'JPEG', 0, 0, PW, imgH, undefined, 'FAST');
    let rendered = PH;
    while (rendered < imgH) {
      doc.addPage();
      doc.addImage(img, 'JPEG', 0, -rendered, PW, imgH, undefined, 'FAST');
      rendered += PH;
    }

    const base = paper.setName || `${paper.className}_${paper.subjectName}`.replace(/\s+/g, '_');
    doc.save(`${base}_${answerKey ? 'Answer_Key' : 'Student_Paper'}.pdf`);
  } finally {
    host.remove();
  }
}
