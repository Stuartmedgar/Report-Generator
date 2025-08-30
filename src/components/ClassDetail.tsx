import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { Class, Student } from '../types';

interface ClassDetailProps {
  classData: Class;
  onBack: () => void;
}

function ClassDetail({ classData, onBack }: ClassDetailProps) {
  const [students, setStudents] = useState<Student[]>(classData.students);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [newStudent, setNewStudent] = useState({ firstName: '', lastName: '', studentId: '', email: '' });
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [csvText, setCsvText] = useState('');
  const [showCSVImport, setShowCSVImport] = useState(false);
  const { updateClass } = useData();

  const saveChanges = () => {
    const updatedClass: Class = {
      ...classData,
      students: students
    };
    updateClass(updatedClass);
  };

  const handleAddStudent = () => {
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

    const updatedStudents = [...students, student];
    setStudents(updatedStudents);
    setNewStudent({ firstName: '', lastName: '', studentId: '', email: '' });
    setShowAddStudent(false);
    
    // Auto-save changes
    const updatedClass: Class = {
      ...classData,
      students: updatedStudents
    };
    updateClass(updatedClass);
    
    alert('Student added successfully!');
  };

  const handleDeleteStudent = (studentId: string, studentName: string) => {
    const confirmed = window.confirm(`Are you sure you want to remove ${studentName} from this class?`);
    if (confirmed) {
      const updatedStudents = students.filter(s => s.id !== studentId);
      setStudents(updatedStudents);
      
      // Auto-save changes
      const updatedClass: Class = {
        ...classData,
        students: updatedStudents
      };
      updateClass(updatedClass);
      
      alert('Student removed successfully!');
    }
  };

  const handleEditStudent = (student: Student) => {
    setEditingStudent(student);
  };

  const handleSaveEdit = () => {
    if (!editingStudent || !editingStudent.firstName.trim() || !editingStudent.lastName.trim()) {
      alert('Please enter both first name and last name');
      return;
    }

    const updatedStudents = students.map(s => 
      s.id === editingStudent.id ? editingStudent : s
    );
    setStudents(updatedStudents);
    setEditingStudent(null);
    
    // Auto-save changes
    const updatedClass: Class = {
      ...classData,
      students: updatedStudents
    };
    updateClass(updatedClass);
    
    alert('Student updated successfully!');
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
        const updatedStudents = [...students, ...newStudents];
        setStudents(updatedStudents);
        setCsvText('');
        setShowCSVImport(false);
        
        // Auto-save changes
        const updatedClass: Class = {
          ...classData,
          students: updatedStudents
        };
        updateClass(updatedClass);
        
        alert(`Successfully imported ${newStudents.length} students!`);
      } else {
        alert('No valid student names found. Please check the format and try again.');
      }
    } catch (error) {
      alert('Error processing student list. Please check the format and try again.');
    }
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
          {classData.name}
        </h1>
        <p style={{ 
          color: '#6b7280', 
          margin: '8px 0 0 0',
          fontSize: '16px'
        }}>
          {students.length} students • Created {new Date(classData.createdAt).toLocaleDateString()}
        </p>
      </header>

      <main style={{ 
        maxWidth: '900px', 
        margin: '0 auto', 
        padding: '32px 24px' 
      }}>
        
        <button 
          onClick={onBack}
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

          {/* Action Buttons */}
          <div style={{ 
            display: 'flex', 
            gap: '12px', 
            marginBottom: '32px',
            flexWrap: 'wrap'
          }}>
            <button
              onClick={() => setShowAddStudent(true)}
              style={{
                backgroundColor: '#10b981',
                color: 'white',
                padding: '12px 24px',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              + Add Student
            </button>
            
            <button
              onClick={() => setShowCSVImport(true)}
              style={{
                backgroundColor: '#3b82f6',
                color: 'white',
                padding: '12px 24px',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              📁 Import List
            </button>
            
            <button
              onClick={() => {
                // TODO: Navigate to reports for this class
                alert('View Reports functionality coming soon!');
              }}
              style={{
                backgroundColor: '#8b5cf6',
                color: 'white',
                padding: '12px 24px',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              📊 View Reports
            </button>
          </div>

          {/* Add Student Form */}
          {showAddStudent && (
            <div style={{
              border: '2px solid #10b981',
              borderRadius: '8px',
              padding: '24px',
              backgroundColor: '#f0fdf4',
              marginBottom: '24px'
            }}>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#10b981',
                marginBottom: '16px'
              }}>
                Add New Student
              </h3>
              
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
              
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={handleAddStudent}
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
                <button
                  onClick={() => {
                    setShowAddStudent(false);
                    setNewStudent({ firstName: '', lastName: '', studentId: '', email: '' });
                  }}
                  style={{
                    backgroundColor: '#6b7280',
                    color: 'white',
                    padding: '8px 16px',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* CSV Import */}
          {showCSVImport && (
            <div style={{
              border: '2px solid #3b82f6',
              borderRadius: '8px',
              padding: '24px',
              backgroundColor: '#eff6ff',
              marginBottom: '24px'
            }}>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#3b82f6',
                marginBottom: '16px'
              }}>
                Import Students from List
              </h3>
              
              <div style={{
                backgroundColor: '#ffffff',
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
              
              <div style={{ display: 'flex', gap: '8px' }}>
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
                <button
                  onClick={() => {
                    setShowCSVImport(false);
                    setCsvText('');
                  }}
                  style={{
                    backgroundColor: '#6b7280',
                    color: 'white',
                    padding: '8px 16px',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Students List */}
          <h3 style={{ 
            fontSize: '20px', 
            fontWeight: '600', 
            color: '#111827',
            marginBottom: '16px'
          }}>
            Students ({students.length})
          </h3>

          {students.length === 0 ? (
            <div style={{
              border: '2px dashed #d1d5db',
              borderRadius: '8px',
              padding: '48px',
              textAlign: 'center',
              color: '#9ca3af'
            }}>
              <p style={{ margin: '0 0 8px 0' }}>No students in this class yet.</p>
              <p style={{ margin: 0 }}>Add students individually or import from a list!</p>
            </div>
          ) : (
            <div style={{
              border: '2px solid #e5e7eb',
              borderRadius: '8px',
              maxHeight: '600px',
              overflowY: 'auto'
            }}>
              {students
                .sort((a, b) => a.lastName.localeCompare(b.lastName))
                .map((student, index) => (
                <div key={student.id} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '16px',
                  borderBottom: index < students.length - 1 ? '1px solid #e5e7eb' : 'none',
                  backgroundColor: index % 2 === 0 ? '#f9fafb' : 'white'
                }}>
                  
                  {/* Student Info */}
                  {editingStudent?.id === student.id ? (
                    // Edit Mode
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
                      gap: '8px',
                      flex: 1,
                      marginRight: '16px'
                    }}>
                      <input
                        type="text"
                        value={editingStudent.firstName}
                        onChange={(e) => setEditingStudent({...editingStudent, firstName: e.target.value})}
                        style={{
                          padding: '6px 8px',
                          border: '1px solid #d1d5db',
                          borderRadius: '4px',
                          fontSize: '14px'
                        }}
                      />
                      <input
                        type="text"
                        value={editingStudent.lastName}
                        onChange={(e) => setEditingStudent({...editingStudent, lastName: e.target.value})}
                        style={{
                          padding: '6px 8px',
                          border: '1px solid #d1d5db',
                          borderRadius: '4px',
                          fontSize: '14px'
                        }}
                      />
                      <input
                        type="text"
                        value={editingStudent.studentId || ''}
                        onChange={(e) => setEditingStudent({...editingStudent, studentId: e.target.value})}
                        placeholder="Student ID"
                        style={{
                          padding: '6px 8px',
                          border: '1px solid #d1d5db',
                          borderRadius: '4px',
                          fontSize: '14px'
                        }}
                      />
                      <input
                        type="email"
                        value={editingStudent.email || ''}
                        onChange={(e) => setEditingStudent({...editingStudent, email: e.target.value})}
                        placeholder="Email"
                        style={{
                          padding: '6px 8px',
                          border: '1px solid #d1d5db',
                          borderRadius: '4px',
                          fontSize: '14px'
                        }}
                      />
                    </div>
                  ) : (
                    // View Mode
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '500', fontSize: '16px' }}>
                        {student.firstName} {student.lastName}
                      </div>
                      {(student.studentId || student.email) && (
                        <div style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>
                          {student.studentId && <span>ID: {student.studentId}</span>}
                          {student.studentId && student.email && <span> • </span>}
                          {student.email && <span>{student.email}</span>}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {editingStudent?.id === student.id ? (
                      <>
                        <button
                          onClick={handleSaveEdit}
                          style={{
                            backgroundColor: '#10b981',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            padding: '6px 12px',
                            fontSize: '12px',
                            cursor: 'pointer'
                          }}
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingStudent(null)}
                          style={{
                            backgroundColor: '#6b7280',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            padding: '6px 12px',
                            fontSize: '12px',
                            cursor: 'pointer'
                          }}
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => handleEditStudent(student)}
                          style={{
                            backgroundColor: '#3b82f6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            padding: '6px 12px',
                            fontSize: '12px',
                            cursor: 'pointer'
                          }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteStudent(student.id, `${student.firstName} ${student.lastName}`)}
                          style={{
                            backgroundColor: '#ef4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            padding: '6px 12px',
                            fontSize: '12px',
                            cursor: 'pointer'
                          }}
                        >
                          Remove
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </main>
    </div>
  );
}

export default ClassDetail;