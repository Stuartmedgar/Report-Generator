import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { Student } from '../types';
import PageNav from '../components/PageNav';

interface CreateClassProps {
  onComplete: (newClassId: string) => void;
  onCancel: () => void;
}

const truncateSurname = (surname: string): string => {
  if (!surname || surname.length === 0) return '';
  const truncated = surname.slice(0, 2);
  if (truncated.length === 1) return truncated.charAt(0).toUpperCase();
  return truncated.charAt(0).toUpperCase() + truncated.charAt(1).toLowerCase();
};

function CreateClass({ onComplete, onCancel }: CreateClassProps) {
  const [className, setClassName] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [csvText, setCsvText] = useState('');
  const { addClass } = useData();

  const isMobile = window.innerWidth <= 768;

  const handleProcessCSV = () => {
    if (!csvText.trim()) { alert('Please enter student data'); return; }

    try {
      const lines = csvText.trim().split('\n');
      const newStudents: Student[] = [];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        if (i === 0 && (line.toLowerCase().includes('first') || line.toLowerCase().includes('last'))) {
          const headers = line.toLowerCase().split(',').map(h => h.trim());
          const firstNameIndex = headers.findIndex(h => h.includes('first') || h.includes('given'));
          const lastNameIndex = headers.findIndex(h => h.includes('last') || h.includes('sur') || h.includes('family'));
          if (firstNameIndex >= 0 && lastNameIndex >= 0) {
            for (let j = 1; j < lines.length; j++) {
              const values = lines[j].split(',').map(v => v.trim());
              if (values.length >= 2 && values[firstNameIndex] && values[lastNameIndex]) {
                newStudents.push({
                  id: Date.now().toString() + Math.random().toString(36).substr(2, 9) + j,
                  firstName: values[firstNameIndex],
                  lastName: truncateSurname(values[lastNameIndex])
                });
              }
            }
            break;
          }
        }

        const nameParts = line.split(/\s+/);
        if (nameParts.length >= 2) {
          const firstName = nameParts[0];
          const lastName = nameParts[nameParts.length - 1];
          if (firstName && lastName) {
            newStudents.push({
              id: Date.now().toString() + Math.random().toString(36).substr(2, 9) + i,
              firstName,
              lastName: truncateSurname(lastName)
            });
          }
        } else if (nameParts.length === 1 && nameParts[0]) {
          const singleName = nameParts[0];
          const useAsLastName = window.confirm(`Found single name "${singleName}". Use as Last Name (OK) or First Name (Cancel)?`);
          newStudents.push({
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9) + i,
            firstName: useAsLastName ? '' : singleName,
            lastName: useAsLastName ? truncateSurname(singleName) : ''
          });
        }
      }

      if (newStudents.length > 0) {
        setStudents([...students, ...newStudents]);
        setCsvText('');
      } else {
        alert('No valid student names found. Please check the format and try again.');
      }
    } catch (error) {
      alert('Error processing student list. Please check the format and try again.');
    }
  };

  const handleRemoveStudent = (studentId: string) => {
    setStudents(students.filter(s => s.id !== studentId));
  };

  const handleCreateClass = () => {
    if (!className.trim()) { alert('Please enter a class name'); return; }

    const newClassId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const newClass = {
      id: newClassId,
      name: className.trim(),
      students,
      createdAt: new Date().toISOString()
    };

    addClass(newClass);
    onComplete(newClassId);
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
    }}>

      {/* PageNav replaces the old ← Back button */}
      <div style={{ width: '100%' }}>
        <PageNav />
      </div>

      <div style={{
        width: '100%',
        maxWidth: '600px',
        padding: isMobile ? '20px 16px' : '32px 24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '20px', width: '100%' }}>
          <h1 style={{
            fontSize: isMobile ? '26px' : '32px', fontWeight: '800',
            color: '#1e293b', margin: '0 0 6px 0', lineHeight: '1.15'
          }}>
            Create a Class
          </h1>
          <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>
            Paste your class list now, or skip this and add pupils one at a time while you write reports.
          </p>
        </div>

        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '12px' }}>

          {/* Privacy notice */}
          <div style={{
            backgroundColor: '#fefce8',
            border: '1px solid #fde68a',
            borderRadius: '10px',
            padding: '12px 16px',
            display: 'flex',
            gap: '10px',
            alignItems: 'flex-start'
          }}>
            <span style={{ fontSize: '16px', flexShrink: 0, marginTop: '1px' }}>🔒</span>
            <p style={{ fontSize: '12px', color: '#92400e', margin: 0, lineHeight: '1.6' }}>
              <strong>Privacy Protection:</strong> Surnames are shortened to 2 letters only (e.g. "Smith" → "SM").
              Names are stored only on your own computer and never sent to any server.
            </p>
          </div>

          {/* Class name */}
          <div style={{
            backgroundColor: 'white', borderRadius: '12px',
            padding: '16px 20px',
            boxShadow: '0 1px 4px rgba(0,0,0,0.06)'
          }}>
            <label style={{
              display: 'block', fontSize: '13px', fontWeight: '600',
              color: '#374151', marginBottom: '8px'
            }}>
              Class Name
            </label>
            <input
              type="text"
              placeholder="e.g., 8A English, Year 9 Science"
              value={className}
              onChange={e => setClassName(e.target.value)}
              autoFocus
              style={{
                width: '100%', padding: '10px 14px',
                border: '2px solid #e5e7eb', borderRadius: '8px',
                fontSize: '15px', outline: 'none', boxSizing: 'border-box',
                transition: 'border-color 0.15s'
              }}
              onFocus={e => e.target.style.borderColor = '#8b5cf6'}
              onBlur={e => e.target.style.borderColor = '#e5e7eb'}
            />
          </div>

          {/* Paste class list */}
          <div style={{
            backgroundColor: 'white', borderRadius: '12px',
            padding: '16px 20px',
            boxShadow: '0 1px 4px rgba(0,0,0,0.06)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
              <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151' }}>
                Paste Your Class List
              </label>
              <span style={{ fontSize: '11px', color: '#94a3b8' }}>one pupil per line</span>
            </div>

            <textarea
              placeholder={'John Smith\nSarah Johnson\nMichael Brown\nEmma Davis'}
              value={csvText}
              onChange={e => setCsvText(e.target.value)}
              style={{
                width: '100%', height: isMobile ? '120px' : '140px',
                padding: '10px 14px',
                border: '2px solid #e5e7eb', borderRadius: '8px',
                fontSize: '14px', resize: 'none',
                fontFamily: 'inherit', boxSizing: 'border-box',
                marginBottom: '10px', outline: 'none',
                transition: 'border-color 0.15s'
              }}
              onFocus={e => e.target.style.borderColor = '#8b5cf6'}
              onBlur={e => e.target.style.borderColor = '#e5e7eb'}
            />

            <button
              onClick={handleProcessCSV}
              disabled={!csvText.trim()}
              style={{
                backgroundColor: csvText.trim() ? '#8b5cf6' : '#e2e8f0',
                color: csvText.trim() ? 'white' : '#94a3b8',
                padding: '9px 20px', border: 'none', borderRadius: '8px',
                fontSize: '14px', fontWeight: '600',
                cursor: csvText.trim() ? 'pointer' : 'not-allowed',
                transition: 'background-color 0.15s'
              }}
            >
              Import Pupils
            </button>
          </div>

          {/* Student list preview — only shown after import */}
          {students.length > 0 && (
            <div style={{
              backgroundColor: 'white', borderRadius: '12px',
              padding: '16px 20px',
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '13px', fontWeight: '600', color: '#374151' }}>Pupils Added</span>
                <span style={{
                  backgroundColor: '#f0fdf4', color: '#059669',
                  fontSize: '12px', fontWeight: '600',
                  padding: '3px 10px', borderRadius: '20px',
                  border: '1px solid #bbf7d0'
                }}>
                  {students.length} {students.length === 1 ? 'pupil' : 'pupils'}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '160px', overflowY: 'auto' }}>
                {students.map((student, index) => (
                  <div
                    key={student.id}
                    style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '8px 12px', backgroundColor: '#f8fafc',
                      borderRadius: '8px', border: '1px solid #f1f5f9'
                    }}
                  >
                    <span style={{ fontSize: '13px', fontWeight: '500', color: '#1e293b' }}>
                      {index + 1}. {student.firstName} {student.lastName}
                    </span>
                    <button
                      onClick={() => handleRemoveStudent(student.id)}
                      style={{
                        backgroundColor: 'transparent', color: '#94a3b8',
                        border: 'none', cursor: 'pointer',
                        fontSize: '12px', padding: '3px 8px', borderRadius: '6px'
                      }}
                      onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.backgroundColor = '#fef2f2'; }}
                      onMouseLeave={e => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.backgroundColor = 'transparent'; }}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Create class button */}
          <button
            onClick={handleCreateClass}
            disabled={!className.trim()}
            style={{
              backgroundColor: className.trim() ? '#10b981' : '#e2e8f0',
              color: className.trim() ? 'white' : '#94a3b8',
              padding: '14px 32px', border: 'none', borderRadius: '12px',
              fontSize: '16px', fontWeight: '700',
              cursor: className.trim() ? 'pointer' : 'not-allowed',
              width: '100%', transition: 'background-color 0.15s',
              boxShadow: className.trim() ? '0 4px 14px rgba(16,185,129,0.3)' : 'none'
            }}
            onMouseEnter={e => { if (className.trim()) (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#059669'; }}
            onMouseLeave={e => { if (className.trim()) (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#10b981'; }}
          >
            {students.length > 0 ? 'Create Class →' : 'Create Class (add pupils as you write) →'}
          </button>

        </div>
      </div>
    </div>
  );
}

export default CreateClass;