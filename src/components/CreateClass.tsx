import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { Student } from '../types';

interface CreateClassProps {
  onComplete: () => void;
  onCancel: () => void;
}

function CreateClass({ onComplete, onCancel }: CreateClassProps) {
  const [className, setClassName] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [inputMethod, setInputMethod] = useState<'individual' | 'csv'>('individual');
  const [csvText, setCsvText] = useState('');
  const [newStudent, setNewStudent] = useState({ firstName: '', lastName: '', studentId: '', email: '' });
  const { addClass } = useData();

  const handleAddIndividualStudent = () => {
    if (!newStudent.firstName.trim() || !newStudent.lastName.trim()) {
      alert('Please enter both first name and last name');
      return;
    }

    const student: Student = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      firstName: newStudent.firstName.trim(),
      lastName: newStudent.lastName.trim(),
      studentId: newStudent.studentId.trim() || undefined,
      email: newStudent.email.trim() || undefined
    };

    setStudents([...students, student]);
    setNewStudent({ firstName: '', lastName: '', studentId: '', email: '' });
  };

  const handleRemoveStudent = (studentId: string) => {
    setStudents(students.filter(s => s.id !== studentId));
  };

  const handleProcessCSV = () => {
    if (!csvText.trim()) {
      alert('Please enter student data');
      return;
    }

    try {
      const lines = csvText.trim().split('\n');
      const newStudents: Student[] = [];
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue; // Skip empty lines
        
        // Check if it's a CSV header line (contains 'first' and 'last' or similar)
        if (i === 0 && (line.toLowerCase().includes('first') || line.toLowerCase().includes('last'))) {
          // This looks like a header, try to parse as CSV
          const headers = line.toLowerCase().split(',').map(h => h.trim());
          const firstNameIndex = headers.findIndex(h => h.includes('first') || h.includes('given'));
          const lastNameIndex = headers.findIndex(h => h.includes('last') || h.includes('sur') || h.includes('family'));
          
          if (firstNameIndex >= 0 && lastNameIndex >= 0) {
            // Process remaining lines as CSV
            for (let j = 1; j < lines.length; j++) {
              const values = lines[j].split(',').map(v => v.trim());
              if (values.length >= 2 && values[firstNameIndex] && values[lastNameIndex]) {
                const student: Student = {
                  id: Date.now().toString() + Math.random().toString(36).substr(2, 9) + j,
                  firstName: values[firstNameIndex],
                  lastName: values[lastNameIndex]
                };
                newStudents.push(student);
              }
            }
            break; // Exit the main loop since we processed as CSV
          }
        }
        
        // Try to parse as "FirstName LastName" format
        const nameParts = line.split(/\s+/); // Split on any whitespace
        
        if (nameParts.length >= 2) {
          // Take first part as firstName, last part as lastName
          // If there are middle names, they'll be ignored for simplicity
          const firstName = nameParts[0];
          const lastName = nameParts[nameParts.length - 1];
          
          if (firstName && lastName) {
            const student: Student = {
              id: Date.now().toString() + Math.random().toString(36).substr(2, 9) + i,
              firstName: firstName,
              lastName: lastName
            };
            newStudents.push(student);
          }
        } else if (nameParts.length === 1 && nameParts[0]) {
          // Single name - treat as first name, ask user what to do
          const singleName = nameParts[0];
          const useAsLastName = window.confirm(
            `Found single name "${singleName}". Use as Last Name (OK) or First Name (Cancel)?`
          );
          
          const student: Student = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9) + i,
            firstName: useAsLastName ? '' : singleName,
            lastName: useAsLastName ? singleName : ''
          };
          newStudents.push(student);
        }
      }

      if (newStudents.length > 0) {
        setStudents([...students, ...newStudents]);
        setCsvText('');
        alert(`Successfully imported ${newStudents.length} students!`);
      } else {
        alert('No valid student names found. Please check the format and try again.');
      }
    } catch (error) {
      alert('Error processing student list. Please check the format and try again.');
    }
  };

  const handleSaveClass = () => {
    if (!className.trim()) {
      alert('Please enter a class name');
      return;
    }

    if (students.length === 0) {
      alert('Please add at least one student to the class');
      return;
    }

    addClass({
      name: className.trim(),
      students: students
    });

    alert(`Class "${className}" created successfully with ${students.length} students!`);
    onComplete();
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      <header style={{ 
        backgroundColor: 'white', 
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        padding: '32px 24px',
        textAlign: 'center'
      }}>
        <h1 style={{ 
          fontSize: '28px', 
          fontWeight: '600', 
          color: '#111827',
          margin: 0
        }}>
          Create New Class
        </h1>
      </header>

      <main style={{ 
        maxWidth: '900px', 
        margin: '0 auto', 
        padding: '32px 24px' 
      }}>
        
        <button 
          onClick={onCancel}
          style={{
            backgroundColor: '#6b7280',
            color: 'white',
            padding: '12px 24px',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: '500',
            cursor: 'pointer',
            marginBottom: '24px'
          }}>
          ← Back to Class Management
        </button>

        <div style={{
          backgroundColor: 'white',
          padding: '32px',
          borderRadius: '12px',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
          marginBottom: '24px'
        }}>
          
          {/* Class Name */}
          <div style={{ marginBottom: '32px' }}>
            <label style={{ 
              display: 'block',
              fontSize: '18px', 
              fontWeight: '600', 
              color: '#111827',
              marginBottom: '8px'
            }}>
              Class Name
            </label>
            <input
              type="text"
              placeholder="e.g. Year 7 Maths, S1 Physical Education, 9B English..."
              value={className}
              onChange={(e) => setClassName(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '16px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Input Method Selection */}
          <div style={{ marginBottom: '32px' }}>
            <h3 style={{ 
              fontSize: '18px', 
              fontWeight: '600', 
              color: '#111827',
              marginBottom: '16px'
            }}>
              Add Students
            </h3>
            
            <div style={{ 
              display: 'flex', 
              gap: '16px',
              marginBottom: '24px'
            }}>
              <label style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px',
                cursor: 'pointer'
              }}>
                <input 
                  type="radio"
                  value="individual"
                  checked={inputMethod === 'individual'}
                  onChange={(e) => setInputMethod(e.target.value as 'individual' | 'csv')}
                  style={{ transform: 'scale(1.1)' }}
                />
                <span>Add students individually</span>
              </label>
              
              <label style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px',
                cursor: 'pointer'
              }}>
                <input 
                  type="radio"
                  value="csv"
                  checked={inputMethod === 'csv'}
                  onChange={(e) => setInputMethod(e.target.value as 'individual' | 'csv')}
                  style={{ transform: 'scale(1.1)' }}
                />
                <span>Paste student list</span>
              </label>
            </div>

            {/* Individual Student Entry */}
            {inputMethod === 'individual' && (
              <div style={{
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                padding: '24px',
                backgroundColor: '#f8fafc'
              }}>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                  gap: '16px',
                  marginBottom: '16px'
                }}>
                  <input
                    type="text"
                    placeholder="First Name *"
                    value={newStudent.firstName}
                    onChange={(e) => setNewStudent({...newStudent, firstName: e.target.value})}
                    style={{
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  />
                  <input
                    type="text"
                    placeholder="Last Name *"
                    value={newStudent.lastName}
                    onChange={(e) => setNewStudent({...newStudent, lastName: e.target.value})}
                    style={{
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  />
                  <input
                    type="text"
                    placeholder="Student ID (optional)"
                    value={newStudent.studentId}
                    onChange={(e) => setNewStudent({...newStudent, studentId: e.target.value})}
                    style={{
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  />
                  <input
                    type="email"
                    placeholder="Email (optional)"
                    value={newStudent.email}
                    onChange={(e) => setNewStudent({...newStudent, email: e.target.value})}
                    style={{
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  />
                </div>
                <button
                  onClick={handleAddIndividualStudent}
                  style={{
                    backgroundColor: '#10b981',
                    color: 'white',
                    padding: '8px 16px',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  Add Student
                </button>
              </div>
            )}

            {/* Simple Import */}
            {inputMethod === 'csv' && (
              <div style={{
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                padding: '24px',
                backgroundColor: '#f8fafc'
              }}>
                <div style={{
                  backgroundColor: '#eff6ff',
                  border: '1px solid #bfdbfe',
                  borderRadius: '6px',
                  padding: '12px',
                  marginBottom: '16px'
                }}>
                  <h4 style={{ 
                    fontSize: '14px', 
                    fontWeight: '600', 
                    color: '#1e40af',
                    margin: '0 0 8px 0'
                  }}>
                    Simple Format - Just paste names, one per line:
                  </h4>
                  <code style={{ 
                    fontSize: '12px', 
                    color: '#1e40af',
                    display: 'block',
                    lineHeight: '1.4'
                  }}>
                    John Smith<br/>
                    Sarah Johnson<br/>
                    Michael Brown<br/>
                    Emma Davis
                  </code>
                  <p style={{
                    fontSize: '12px',
                    color: '#1e40af',
                    margin: '8px 0 0 0'
                  }}>
                    Also works with CSV format if you have headers like "firstName,lastName"
                  </p>
                </div>
                
                <textarea
                  placeholder="Paste your student names here, one per line:&#10;&#10;John Smith&#10;Sarah Johnson&#10;Michael Brown&#10;Emma Davis"
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                  style={{
                    width: '100%',
                    height: '120px',
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box',
                    marginBottom: '12px'
                  }}
                />
                <button
                  onClick={handleProcessCSV}
                  disabled={!csvText.trim()}
                  style={{
                    backgroundColor: csvText.trim() ? '#3b82f6' : '#d1d5db',
                    color: 'white',
                    padding: '8px 16px',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: csvText.trim() ? 'pointer' : 'not-allowed'
                  }}
                >
                  Import Students
                </button>
              </div>
            )}
          </div>

          {/* Students List */}
          {students.length > 0 && (
            <div style={{ marginBottom: '32px' }}>
              <h3 style={{ 
                fontSize: '18px', 
                fontWeight: '600', 
                color: '#111827',
                marginBottom: '16px'
              }}>
                Students in Class ({students.length})
              </h3>
              
              <div style={{
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                maxHeight: '300px',
                overflowY: 'auto'
              }}>
                {students.map((student, index) => (
                  <div key={student.id} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 16px',
                    borderBottom: index < students.length - 1 ? '1px solid #e5e7eb' : 'none',
                    backgroundColor: index % 2 === 0 ? '#f9fafb' : 'white'
                  }}>
                    <div>
                      <span style={{ fontWeight: '500' }}>
                        {student.firstName} {student.lastName}
                      </span>
                      {(student.studentId || student.email) && (
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>
                          {student.studentId && <span>ID: {student.studentId}</span>}
                          {student.studentId && student.email && <span> • </span>}
                          {student.email && <span>{student.email}</span>}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => handleRemoveStudent(student.id)}
                      style={{
                        backgroundColor: '#ef4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '4px 8px',
                        fontSize: '12px',
                        cursor: 'pointer'
                      }}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Save Button */}
          <div style={{ 
            display: 'flex', 
            gap: '16px', 
            justifyContent: 'flex-end' 
          }}>
            <button
              onClick={onCancel}
              style={{
                backgroundColor: '#6b7280',
                color: 'white',
                padding: '16px 32px',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSaveClass}
              disabled={!className.trim() || students.length === 0}
              style={{
                backgroundColor: (className.trim() && students.length > 0) ? '#10b981' : '#d1d5db',
                color: 'white',
                padding: '16px 32px',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '500',
                cursor: (className.trim() && students.length > 0) ? 'pointer' : 'not-allowed'
              }}
            >
              Save Class
            </button>
          </div>

        </div>
      </main>
    </div>
  );
}

export default CreateClass;