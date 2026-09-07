import React, { useState } from 'react';
import {
  X, BookOpen, Sparkles, Printer, CheckCircle2,
  ChevronRight, HeartHandshake, Layers, Clock, HelpCircle, ArrowRight
} from 'lucide-react';
import type { StudyMaterial, Level, SeedData } from './types';
import jsPDF from 'jspdf';

interface StudyMaterialModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: SeedData;
  initialLevelId?: string; // e.g. 'l1', 'l2', 'l3', 'l4', 'l5'
  initialSubjectId?: string; // e.g. 'mat', 'hin', 'eng', 'sci'
  studentName?: string;
  studentRoll?: number;
}

export function StudyMaterialModal({
  isOpen,
  onClose,
  data,
  initialLevelId = 'l3',
  initialSubjectId = 'mat',
  studentName,
  studentRoll,
}: StudyMaterialModalProps) {
  const [selectedLevelId, setSelectedLevelId] = useState<string>(initialLevelId);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(initialSubjectId);
  const [activeTab, setActiveTab] = useState<'guide' | 'worksheets' | 'parent'>('guide');

  if (!isOpen) return null;

  // Find matching study material or fallback to closest
  const currentMaterial: StudyMaterial | undefined = data.studyMaterials.find(
    m => m.levelId === selectedLevelId && m.subjectId === selectedSubjectId
  ) || data.studyMaterials.find(m => m.levelId === selectedLevelId) || data.studyMaterials[0];

  const currentLevel = data.levels.find(l => l.id === selectedLevelId) || data.levels[0];
  const currentSubject = data.subjects.find(s => s.id === selectedSubjectId) || data.subjects[0];

  const handlePrintWorksheet = (worksheetIndex = 0) => {
    if (!currentMaterial) return;
    const ws = currentMaterial.printableWorksheets[worksheetIndex] || currentMaterial.printableWorksheets[0];

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    let y = 15;

    // Header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(11, 110, 105); // Shiksha Setu teal
    doc.text('SHIKSHA SETU — REMEDIAL PRACTICE WORKSHEET', pageWidth / 2, y, { align: 'center' });
    y += 7;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(`Target Level: ${currentLevel.code} (${currentLevel.name}) · Subject: ${currentSubject.name}`, pageWidth / 2, y, { align: 'center' });
    y += 8;

    doc.setDrawColor(203, 213, 225);
    doc.line(margin, y, pageWidth - margin, y);
    y += 8;

    // Student Header Box
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(margin, y, pageWidth - margin * 2, 18, 2, 2, 'F');
    doc.rect(margin, y, pageWidth - margin * 2, 18, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text(`Student: ${studentName || '___________________________'}`, margin + 5, y + 7);
    doc.text(`Roll No: ${studentRoll || '_______'}`, margin + 110, y + 7);
    doc.text(`Date: ____/____/20____`, margin + 5, y + 14);
    doc.text(`Class: ________________`, margin + 110, y + 14);
    y += 24;

    // Worksheet Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(30, 41, 59);
    doc.text(ws.title, margin, y);
    y += 6;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    doc.text(ws.description, margin, y);
    y += 10;

    // Worksheet Items
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);

    ws.content.forEach((item, idx) => {
      doc.text(`${idx + 1}.  ${item}`, margin + 5, y);
      y += 8;
      // Dotted line for answer
      doc.setDrawColor(226, 232, 240);
      doc.line(margin + 10, y, pageWidth - margin - 10, y);
      y += 10;
    });

    // Footer note
    y += 10;
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184);
    doc.text('Shiksha Setu Learning Recovery · 5-Minute Daily Intervention', pageWidth / 2, 280, { align: 'center' });

    doc.save(`Remedial_Worksheet_${currentLevel.code}_${currentSubject.code}.pdf`);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content study-material-dialog animate-fade-in" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="study-modal-header">
          <div className="header-info">
            <span
              className="level-flag-tag large"
              style={{ backgroundColor: currentLevel.color, color: '#fff' }}
            >
              {currentLevel.code} · {currentLevel.name}
            </span>
            <div>
              <h2>Targeted Remedial Study Material</h2>
              <p className="muted">
                {studentName ? (
                  <span>
                    Direct action plan for <strong>{studentName}</strong> (Roll #{studentRoll}) · {currentSubject.name}
                  </span>
                ) : (
                  <span>Knowledge Graph linked teaching resources & practice packs</span>
                )}
              </p>
            </div>
          </div>
          <button className="icon-button close-btn" onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        {/* Level Switcher Ribbon */}
        <div className="level-switch-ribbon pt-8">
          <span className="ribbon-label">Level:</span>
          <div className="level-buttons-row">
            {data.levels.map(lvl => (
              <button
                key={lvl.id}
                className={`level-btn-pill pt-8 ${selectedLevelId === lvl.id ? 'active' : ''}`}
                style={{
                  borderColor: lvl.color,
                  backgroundColor: selectedLevelId === lvl.id ? lvl.color : 'transparent',
                  color: selectedLevelId === lvl.id ? '#fff' : lvl.color,
                }}
                onClick={() => setSelectedLevelId(lvl.id)}
              >
                {lvl.code} {lvl.name}
              </button>
            ))}
          </div>
        </div>

        {/* Subject Switcher */}
        <div className="subject-pills-row">
          <span className="ribbon-label">Subject:</span>
          {data.subjects.slice(0, 4).map(sub => (
            <button
              key={sub.id}
              className={`subject-pill ${selectedSubjectId === sub.id ? 'active' : ''}`}
              onClick={() => setSelectedSubjectId(sub.id)}
            >
              {sub.name}
            </button>
          ))}
        </div>

        {/* Nav Tabs */}
        <div className="study-modal-tabs">
          <button
            className={`s-tab ${activeTab === 'guide' ? 'active' : ''}`}
            onClick={() => setActiveTab('guide')}
          >
            <Sparkles size={16} /> Teacher Action Guide & Activities
          </button>
          <button
            className={`s-tab ${activeTab === 'worksheets' ? 'active' : ''}`}
            onClick={() => setActiveTab('worksheets')}
          >
            <BookOpen size={16} /> Printable Worksheets ({currentMaterial?.printableWorksheets?.length || 1})
          </button>
          <button
            className={`s-tab ${activeTab === 'parent' ? 'active' : ''}`}
            onClick={() => setActiveTab('parent')}
          >
            <HeartHandshake size={16} /> 5-Min Parent Home Activity
          </button>
        </div>

        {/* Tab 1: Teacher Guide & Concrete Activities */}
        {activeTab === 'guide' && currentMaterial && (
          <div className="study-tab-body animate-fade-in">
            <div className="material-hero-card">
              <div className="hero-top">
                <span className="domain-badge">{currentMaterial.domain}</span>
                <span className="duration-badge"><Clock size={13} /> {currentMaterial.suggestedDuration}</span>
              </div>
              <h3>{currentMaterial.title}</h3>
              <p className="hero-summary">{currentMaterial.summary}</p>
            </div>

            <div className="section-block">
              <h4><Sparkles size={16} className="text-teal" /> Teacher Instruction Guide (Next-Day Action)</h4>
              <div className="teacher-guide-box">
                <p>{currentMaterial.teacherGuide}</p>
              </div>
            </div>

            <div className="section-block">
              <h4><Layers size={16} className="text-blue" /> Concrete Hands-on / Tactile Activities</h4>
              <div className="concrete-grid">
                {currentMaterial.concreteActivities.map((act, index) => (
                  <div className="concrete-item-card" key={index}>
                    <div className="act-number">{index + 1}</div>
                    <p>{act}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Printable Worksheets */}
        {activeTab === 'worksheets' && currentMaterial && (
          <div className="study-tab-body animate-fade-in">
            <div className="worksheets-list">
              {currentMaterial.printableWorksheets.map((ws, index) => (
                <div className="worksheet-card" key={index}>
                  <div className="ws-top">
                    <div>
                      <h4>{ws.title}</h4>
                      <p className="muted">{ws.description}</p>
                    </div>
                    <button className="primary" onClick={() => handlePrintWorksheet(index)}>
                      <Printer size={15} /> Download PDF
                    </button>
                  </div>

                  <div className="ws-preview-box">
                    <span className="preview-label">Sheet Content Preview:</span>
                    <ul>
                      {ws.content.map((c, cIdx) => (
                        <li key={cIdx}>
                          <strong>Q{cIdx + 1}:</strong> {c}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Parent Home Practice */}
        {activeTab === 'parent' && currentMaterial && (
          <div className="study-tab-body animate-fade-in">
            <div className="parent-tip-card">
              <div className="tip-header">
                <HeartHandshake size={28} className="text-orange" />
                <div>
                  <h3>5-Minute Home Support Action for Parents</h3>
                  <p className="muted">No technical literacy needed — designed for everyday household items.</p>
                </div>
              </div>
              <div className="parent-script-box">
                <strong>Parent Guidance Activity:</strong>
                <p className="script-text">"{currentMaterial.parentHomeActivity}"</p>
              </div>
              <div className="benefit-row">
                <CheckCircle2 size={16} className="text-green" />
                <span>Reinforces learning without pressure using stones, spoons, or everyday conversation.</span>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="study-modal-footer">
          <button className="secondary" onClick={onClose}>
            Close
          </button>
          {activeTab === 'worksheets' ? (
            <button className="primary" onClick={() => handlePrintWorksheet(0)}>
              <Printer size={16} /> Download All Worksheets (PDF)
            </button>
          ) : (
            <button className="primary" onClick={() => setActiveTab('worksheets')}>
              View & Print Worksheets <ArrowRight size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
