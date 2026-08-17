import React, { useState, useMemo } from 'react';
import {
  Users, UserPlus, Search, Filter, Phone, Mail, User, BookOpen,
  Plus, Edit2, Trash2, CheckCircle2, Download, Layers, Sparkles, X, Save, ArrowRight
} from 'lucide-react';
import type { SeedData, Student, Classroom } from './types';
import { saveStudent, deleteStudent, saveClassroom } from './db';
import { StudyMaterialModal } from './study-material-modal';

interface StudentRegisterProps {
  data: SeedData;
  onRefreshData?: () => void;
}

export function StudentRegister({ data, onRefreshData }: StudentRegisterProps) {
  const [selectedClassId, setSelectedClassId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [genderFilter, setGenderFilter] = useState<string>('all');

  // Modal States
  const [showAddStudentModal, setShowAddStudentModal] = useState<boolean>(false);
  const [showAddClassModal, setShowAddClassModal] = useState<boolean>(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  // Study Material Modal Trigger
  const [studyModalOpen, setStudyModalOpen] = useState<boolean>(false);
  const [activeStudyLevel, setActiveStudyLevel] = useState<string>('l3');
  const [activeStudentForStudy, setActiveStudentForStudy] = useState<Student | null>(null);

  // Student Form State
  const [name, setName] = useState<string>('');
  const [rollNumber, setRollNumber] = useState<number>(1);
  const [targetClassId, setTargetClassId] = useState<string>(data.classrooms[0]?.id || 'class-multigrade-1');
  const [gradeLevel, setGradeLevel] = useState<string>('Grade 3');
  const [gender, setGender] = useState<'Girl' | 'Boy' | 'Other'>('Girl');
  const [parentName, setParentName] = useState<string>('');
  const [parentPhone, setParentPhone] = useState<string>('+91 ');
  const [parentEmail, setParentEmail] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string>('');

  // Classroom Form State
  const [newRoomName, setNewRoomName] = useState<string>('Room B');
  const [newTeacherName, setNewTeacherName] = useState<string>('Sunita Devi');
  const [selectedGradesForRoom, setSelectedGradesForRoom] = useState<string[]>(['Grade 1', 'Grade 3', 'Grade 4']);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  // Filtered Students
  const filteredStudents = useMemo(() => {
    return data.students.filter(s => {
      const matchClass = selectedClassId === 'all' || s.classId === selectedClassId;
      const matchGender = genderFilter === 'all' || s.gender === genderFilter;
      const matchQuery =
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.parentName && s.parentName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (s.parentPhone && s.parentPhone.includes(searchQuery)) ||
        s.rollNumber.toString().includes(searchQuery);
      return matchClass && matchGender && matchQuery;
    });
  }, [data.students, selectedClassId, genderFilter, searchQuery]);

  // Open Edit Modal
  const handleOpenEdit = (student: Student) => {
    setEditingStudent(student);
    setName(student.name);
    setRollNumber(student.rollNumber);
    setTargetClassId(student.classId);
    setGradeLevel(student.gradeLevel || 'Grade 3');
    setGender(student.gender || 'Girl');
    setParentName(student.parentName || '');
    setParentPhone(student.parentPhone || '+91 ');
    setParentEmail(student.parentEmail || '');
    setNotes(student.notes || '');
    setShowAddStudentModal(true);
  };

  // Open Add Modal
  const handleOpenAdd = () => {
    setEditingStudent(null);
    setName('');
    const currentClassStudents = data.students.filter(s => s.classId === (selectedClassId === 'all' ? data.classrooms[0]?.id : selectedClassId));
    const nextRoll = currentClassStudents.length > 0 ? Math.max(...currentClassStudents.map(s => s.rollNumber)) + 1 : 1;
    setRollNumber(nextRoll);
    setTargetClassId(selectedClassId === 'all' ? (data.classrooms[0]?.id || 'class-multigrade-1') : selectedClassId);
    setGradeLevel('Grade 3');
    setGender('Girl');
    setParentName('');
    setParentPhone('+91 98765 ');
    setParentEmail('');
    setNotes('');
    setShowAddStudentModal(true);
  };

  // Save Student (Add or Edit)
  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const studentId = editingStudent ? editingStudent.id : `stu-custom-${Date.now()}`;
    const levelName = editingStudent ? editingStudent.level : 'Word Reader / Developing';
    const levelId = editingStudent?.currentLevelId || 'l3';

    const newOrUpdatedStudent: Student = {
      id: studentId,
      name: name.trim(),
      classId: targetClassId,
      admission: editingStudent ? editingStudent.admission : `HV-26-${String(Math.floor(Math.random() * 900) + 100)}`,
      rollNumber: Number(rollNumber),
      gender,
      gradeLevel,
      parentName: parentName.trim(),
      parentPhone: parentPhone.trim(),
      parentEmail: parentEmail.trim(),
      trend: editingStudent ? editingStudent.trend : 'Newly assessed',
      focus: editingStudent ? editingStudent.focus : 'Mathematics / Numeracy',
      level: levelName,
      currentLevelId: levelId,
      monthwiseLevels: editingStudent?.monthwiseLevels || { 'September 2026': 3, 'August 2026': 3 },
      notes: notes.trim(),
    };

    await saveStudent(newOrUpdatedStudent);

    // Update in memory list
    const existingIdx = data.students.findIndex(s => s.id === studentId);
    if (existingIdx >= 0) {
      data.students[existingIdx] = newOrUpdatedStudent;
    } else {
      data.students.unshift(newOrUpdatedStudent);
    }

    showToast(editingStudent ? `Updated student: ${name}` : `Added student: ${name} (Roll #${rollNumber})`);
    setShowAddStudentModal(false);
    if (onRefreshData) onRefreshData();
  };

  // Delete Student
  const handleDeleteStudent = async (student: Student) => {
    if (window.confirm(`Are you sure you want to remove ${student.name} (Roll #${student.rollNumber})?`)) {
      await deleteStudent(student.id);
      data.students = data.students.filter(s => s.id !== student.id);
      showToast(`Removed student ${student.name}`);
      if (onRefreshData) onRefreshData();
    }
  };

  // Create Classroom
  const handleSaveClassroom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedGradesForRoom.length === 0) {
      alert('Please select at least one grade for this classroom.');
      return;
    }

    const classId = `class-${Date.now()}`;
    const className = `${selectedGradesForRoom.join(', ')} · ${newRoomName}`;

    const newClass: Classroom = {
      id: classId,
      name: className,
      grades: selectedGradesForRoom,
      roomName: newRoomName,
      teacherName: newTeacherName,
      studentCount: 0,
      academicYear: '2026–27',
    };

    await saveClassroom(newClass);
    data.classrooms.push(newClass);

    showToast(`Created new classroom: ${className}`);
    setShowAddClassModal(false);
    setSelectedClassId(classId);
    if (onRefreshData) onRefreshData();
  };

  const toggleGradeSelection = (grade: string) => {
    if (selectedGradesForRoom.includes(grade)) {
      setSelectedGradesForRoom(selectedGradesForRoom.filter(g => g !== grade));
    } else {
      setSelectedGradesForRoom([...selectedGradesForRoom, grade]);
    }
  };

  // Export Student Register as CSV
  const handleExportCSV = () => {
    const headers = ['Roll Number', 'Student Name', 'Gender', 'Grade', 'Classroom', 'Parent Name', 'Parent Phone', 'Parent Email', 'Current Level', 'Trend'];
    const rows = filteredStudents.map(s => {
      const classObj = data.classrooms.find(c => c.id === s.classId);
      return [
        s.rollNumber,
        `"${s.name}"`,
        s.gender || 'Not specified',
        s.gradeLevel || '',
        `"${classObj?.name || s.classId}"`,
        `"${s.parentName || ''}"`,
        `"${s.parentPhone || ''}"`,
        `"${s.parentEmail || ''}"`,
        `"${s.level}"`,
        s.trend
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Student_Register_${selectedClassId}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const openStudyMaterialForStudent = (student: Student) => {
    setActiveStudentForStudy(student);
    setActiveStudyLevel(student.currentLevelId || 'l3');
    setStudyModalOpen(true);
  };

  return (
    <div className="student-register-page animate-fade-in">
      {/* Toast */}
      {toastMessage && (
        <div className="floating-toast">
          <CheckCircle2 size={18} className="text-green" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="page-header space-between">
        <div>
          <p className="eyebrow">Classroom & Student Administration</p>
          <h1>Student Register & Parent Contacts</h1>
          <p className="muted">
            Map students to multi-grade classrooms, manage parent phone numbers & emails, and track monthly level badges.
          </p>
        </div>
        <div className="action-buttons-row">
          <button className="secondary" onClick={() => setShowAddClassModal(true)}>
            <Layers size={16} /> + Create Classroom
          </button>
          <button className="secondary" onClick={handleExportCSV}>
            <Download size={16} /> Export Register (CSV)
          </button>
          <button className="primary" onClick={handleOpenAdd}>
            <UserPlus size={17} /> + Add Student
          </button>
        </div>
      </div>

      {/* Classroom Ribbon Cards */}
      <div className="classrooms-ribbon">
        <div
          className={`classroom-card-pill ${selectedClassId === 'all' ? 'active' : ''}`}
          onClick={() => setSelectedClassId('all')}
        >
          <div className="c-info">
            <strong>All Classrooms</strong>
            <small>{data.students.length} Total Students</small>
          </div>
        </div>

        {data.classrooms.map(c => {
          const count = data.students.filter(s => s.classId === c.id).length;
          return (
            <div
              key={c.id}
              className={`classroom-card-pill ${selectedClassId === c.id ? 'active' : ''}`}
              onClick={() => setSelectedClassId(c.id)}
            >
              <div className="c-info">
                <strong>{c.name}</strong>
                <small>{count} Students · {c.teacherName}</small>
              </div>
            </div>
          );
        })}
      </div>

      {/* Toolbar & Filters */}
      <div className="panel list-panel">
        <div className="list-toolbar">
          <div className="search">
            <Search size={16} />
            <input
              placeholder="Search by student name, roll number, parent name or phone..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="filter-group-row">
            <div className="filter-item">
              <label>Gender:</label>
              <select value={genderFilter} onChange={e => setGenderFilter(e.target.value)}>
                <option value="all">All Genders</option>
                <option value="Girl">Girls Only</option>
                <option value="Boy">Boys Only</option>
              </select>
            </div>
            <button className="secondary small" onClick={handleOpenAdd}>
              <Plus size={14} /> Add Student
            </button>
          </div>
        </div>

        {/* Student Table */}
        <div className="students-table-container">
          <table className="custom-data-table">
            <thead>
              <tr>
                <th>Roll</th>
                <th>Student Name</th>
                <th>Grade / Room</th>
                <th>Parent Name</th>
                <th>Parent Contact</th>
                <th>Recent Level Flag (Click for Remedial)</th>
                <th>Trend</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="empty-table-cell">
                    <User size={36} className="text-muted" />
                    <p>No students found matching your criteria.</p>
                    <button className="primary small" onClick={handleOpenAdd}>
                      + Add New Student
                    </button>
                  </td>
                </tr>
              ) : (
                filteredStudents.map(student => {
                  const classObj = data.classrooms.find(c => c.id === student.classId);
                  const levelObj = data.levels.find(l => l.id === student.currentLevelId) || data.levels[2];
                  return (
                    <tr key={student.id}>
                      <td>
                        <span className="roll-badge">#{student.rollNumber}</span>
                      </td>
                      <td>
                        <div className="student-name-cell">
                          <strong>{student.name}</strong>
                          <small className="muted">{student.gender || 'Student'} · {student.admission}</small>
                        </div>
                      </td>
                      <td>
                        <span className="class-tag">
                          {student.gradeLevel || 'Grade 3'} · {classObj?.roomName || 'Room B'}
                        </span>
                      </td>
                      <td>
                        <strong>{student.parentName || '—'}</strong>
                      </td>
                      <td>
                        <div className="contact-cell">
                          {student.parentPhone && (
                            <span className="contact-item">
                              <Phone size={12} className="text-teal" /> {student.parentPhone}
                            </span>
                          )}
                          {student.parentEmail && (
                            <span className="contact-item">
                              <Mail size={12} className="text-muted" /> {student.parentEmail}
                            </span>
                          )}
                          {!student.parentPhone && !student.parentEmail && <span className="muted">No contact</span>}
                        </div>
                      </td>
                      <td>
                        {/* CLICKABLE LEVEL FLAG REDIRECTING TO STUDY MATERIAL */}
                        <button
                          className="level-flag-btn"
                          style={{
                            backgroundColor: levelObj.color,
                            color: '#fff',
                            borderColor: levelObj.color,
                          }}
                          title="Click to open targeted study material and practice sheets"
                          onClick={() => openStudyMaterialForStudent(student)}
                        >
                          <span className="flag-icon">{levelObj.icon}</span>
                          <span className="flag-code">{levelObj.code}</span>
                          <span className="flag-name">{levelObj.name.split('/')[0]}</span>
                          <Sparkles size={12} className="flag-sparkle" />
                        </button>
                      </td>
                      <td>
                        <span className={`trend-pill ${student.trend === 'Improving' ? 'trend-green' : student.trend === 'Review required' ? 'trend-orange' : 'trend-blue'}`}>
                          {student.trend}
                        </span>
                      </td>
                      <td className="text-right">
                        <div className="table-actions">
                          <button
                            className="icon-btn-action"
                            title="Edit Student"
                            onClick={() => handleOpenEdit(student)}
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            className="icon-btn-action danger"
                            title="Delete Student"
                            onClick={() => handleDeleteStudent(student)}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD / EDIT STUDENT MODAL */}
      {showAddStudentModal && (
        <div className="modal-overlay" onClick={() => setShowAddStudentModal(false)}>
          <div className="modal-content animate-fade-in" onClick={e => e.stopPropagation()}>
            <div className="modal-header space-between">
              <h3>{editingStudent ? 'Edit Student Details' : 'Add Student to Classroom'}</h3>
              <button className="icon-button" onClick={() => setShowAddStudentModal(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveStudent}>
              <div className="form-row-2">
                <div className="form-group">
                  <label>Roll Number *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={rollNumber}
                    onChange={e => setRollNumber(parseInt(e.target.value, 10) || 1)}
                  />
                </div>
                <div className="form-group">
                  <label>Gender *</label>
                  <select value={gender} onChange={e => setGender(e.target.value as any)}>
                    <option value="Girl">लड़की / Girl</option>
                    <option value="Boy">लड़का / Boy</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Student Full Name (छात्र का नाम) *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rekha Kumari"
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label>Classroom Mapping *</label>
                  <select value={targetClassId} onChange={e => setTargetClassId(e.target.value)}>
                    {data.classrooms.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.teacherName})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Grade Level</label>
                  <select value={gradeLevel} onChange={e => setGradeLevel(e.target.value)}>
                    <option value="Grade 1">Grade 1</option>
                    <option value="Grade 2">Grade 2</option>
                    <option value="Grade 3">Grade 3</option>
                    <option value="Grade 4">Grade 4</option>
                    <option value="Grade 5">Grade 5</option>
                    <option value="Grade 6">Grade 6</option>
                    <option value="Grade 7">Grade 7</option>
                    <option value="Grade 8">Grade 8</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Parent / Guardian Name (अभिभावक का नाम)</label>
                <input
                  type="text"
                  placeholder="e.g. Rameshwar Kumar"
                  value={parentName}
                  onChange={e => setParentName(e.target.value)}
                />
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label>Parent Phone Number (मोबाइल नंबर)</label>
                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={parentPhone}
                    onChange={e => setParentPhone(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Parent Email (ईमेल - Optional)</label>
                  <input
                    type="email"
                    placeholder="parent@email.com"
                    value={parentEmail}
                    onChange={e => setParentEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Teacher Note / Learning Focus</label>
                <textarea
                  rows={2}
                  placeholder="Any specific learning needs or baseline observations..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="secondary" onClick={() => setShowAddStudentModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="primary">
                  <Save size={16} /> {editingStudent ? 'Update Student' : 'Save Student to Register'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE CLASSROOM MODAL */}
      {showAddClassModal && (
        <div className="modal-overlay" onClick={() => setShowAddClassModal(false)}>
          <div className="modal-content animate-fade-in" onClick={e => e.stopPropagation()}>
            <div className="modal-header space-between">
              <div>
                <p className="eyebrow">Classroom Setup</p>
                <h3>Create Classroom (कक्षा बनाएं)</h3>
              </div>
              <button className="icon-button" onClick={() => setShowAddClassModal(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveClassroom}>
              <div className="form-group">
                <label>Teacher Name (शिक्षक का नाम)</label>
                <input
                  type="text"
                  required
                  value={newTeacherName}
                  onChange={e => setNewTeacherName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Which grades are in this room? (कौन सी कक्षाएं हैं?)</label>
                <p className="tiny-note" style={{ textAlign: 'left', marginBottom: 8 }}>
                  Tap all grades taught together in this room for multi-grade classrooms.
                </p>
                <div className="grades-select-grid">
                  {['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8'].map(g => (
                    <button
                      key={g}
                      type="button"
                      className={`grade-chip-btn ${selectedGradesForRoom.includes(g) ? 'active' : ''}`}
                      onClick={() => toggleGradeSelection(g)}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>Room / Class Name (e.g. Room B, Room A, Section 1)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Room B"
                  value={newRoomName}
                  onChange={e => setNewRoomName(e.target.value)}
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="secondary" onClick={() => setShowAddClassModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="primary">
                  <Layers size={16} /> Create Classroom & Add Students
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Study Material Modal from Clickable Level Flag */}
      <StudyMaterialModal
        isOpen={studyModalOpen}
        onClose={() => setStudyModalOpen(false)}
        data={data}
        initialLevelId={activeStudyLevel}
        studentName={activeStudentForStudy?.name}
        studentRoll={activeStudentForStudy?.rollNumber}
      />
    </div>
  );
}
