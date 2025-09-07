import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { Class, Student } from '../types';

interface ClassDetailProps {
  classData: Class;
  onBack: () => void;
}

// Privacy utility function to truncate surnames to first 2 letters
const truncateSurname = (surname: string): string => {
  if (!surname || surname.length === 0) return '';
  const truncated = surname.slice(0, 2);
  if (truncated.length === 1) {
    return truncated.charAt(0).toUpperCase();
  }
  return truncated.charAt(0).toUpperCase() + truncated.charAt(1).toLowerCase();
};

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
      lastName: truncateSurname(newStudent.lastName.trim()), // Apply surname truncation
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

    // Apply surname truncation when saving edits
    const updatedEditingStudent = {
      ...editingStudent,
      lastName: truncateSurname(editingStudent.lastName)
    };

    const updatedStudents = students.map(s => 
      s.id === editingStudent.id ? updatedEditingStudent : s
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
                  lastName: truncateSurname(values[lastNameIndex]) // Apply surname truncation
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
              lastName: truncateSurname(lastName) // Apply surname truncation
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
            lastName: useAsLastName ? truncateSurname(singleName) : '' // Apply surname truncation
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
        
        alert(`Successfully imported ${newStudents.length} students! (Surnames truncated to first 2 letters for privacy)`);
      } else {
        alert('No valid student names found. Please check the format and try again.');
      }
    } catch (error) {
      alert('Error processing student list. Please check the format and try again.');
    }
  };

  // Mobile detection
  const isMobile = window.innerWidth <= 768;

  return (
    <div style={{ 
      padding: isMobile ? '16px' : '20px', 
      maxWidth: '1000px', 
      margin: '0 auto',
      fontFamily: 'Arial, sans-serif'
    }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '20px',
        flexDirection: isMobile ? 'column' : 'row',
        gap: isMobile ? '12px' : '0'
      }}>
        <div style={{ textAlign: isMobile ? 'center' : 'left' }}>
          <h1 style={{ 
            fontSize: isMobile ? '24px' : '28px', 
            fontWeight: 'bold', 
            color: '#1f2937',
            margin: '0 0 8px 0'
          }}>
            {classData.name}
          </h1>
          <p style={{
            fontSize: '14px',
            color: '#6b7280',
            margin: 0
          }}>
            {students.length} student{students.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={onBack}
          style={{
            backgroundColor: '#6b7280',
            color: 'white',
            padding: isMobile ? '10px 20px' : '12px 24px',
            border: 'none',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'background-color 0.2s'
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#4b5563'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#6b7280'}
        >
          ← Back to Classes
        </button>
      </div>

      {/* Privacy Notice */}
      <div style={{
        backgroundColor: '#fef3c7',
        border: '1px solid #f59e0b',
        borderRadius: '6px',
        padding: '12px',
        marginBottom: '20px'
      }}>
        <p style={{
          fontSize: '14px',
          color: '#92400e',
          margin: '0',
          fontWeight: '500'
        }}>
          🔒 Privacy Protection: Surnames are shortened to first 2 letters only for student privacy
        </p>
      </div>

      {/* Action Buttons */}
      <div style={{ 
        display: 'flex', 
        gap: '12px', 
        marginBottom: '20px',
        flexDirection: isMobile ? 'column' : 'row'
      }}>
        <button
          onClick={() => setShowAddStudent(true)}
          style={{
            backgroundColor: '#3b82f6',
            color: 'white',
            padding: '12px 20px',
            border: 'none',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            flex: isMobile ? 'none' : '1'
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#3b82f6'}
        >
          ➕ Add Student
        </button>
        
        <button
          onClick={() => setShowCSVImport(true)}
          style={{
            backgroundColor: '#10b981',
            color: 'white',
            padding: '12px 20px',
            border: 'none',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            flex: isMobile ? 'none' : '1'
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#059669'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#10b981'}
        >
          📋 Import Students
        </button>
      </div>

      {/* Add Student Form */}
      {showAddStudent && (
        <div style={{
          backgroundColor: '#f9fafb',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          padding: '20px',
          marginBottom: '20px'
        }}>
          <h3 style={{
            fontSize: '18px',
            fontWeight: '600',
            color: '#374151',
            marginBottom: '16px',
            margin: '0 0 16px 0'
          }}>
            Add New Student
          </h3>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', 
            gap: '12px',
            marginBottom: '16px'
          }}>
            <div>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '4px'
              }}>
                First Name *
              </label>
              <input
                type="text"
                placeholder="First name"
                value={newStudent.firstName}
                onChange={(e) => setNewStudent({...newStudent, firstName: e.target.value})}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            
            <div>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '4px'
              }}>
                Last Name * (will be shortened to 2 letters)
              </label>
              <input
                type="text"
                placeholder="Last name"
                value={newStudent.lastName}
                onChange={(e) => setNewStudent({...newStudent, lastName: e.target.value})}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
              {newStudent.lastName && (
                <p style={{
                  fontSize: '12px',
                  color: '#6b7280',
                  margin: '4px 0 0 0'
                }}>
                  Will be stored as: {truncateSurname(newStudent.lastName)}
                </p>
              )}
            </div>
          </div>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', 
            gap: '12px',
            marginBottom: '16px'
          }}>
            <div>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '4px'
              }}>
                Student ID (optional)
              </label>
              <input
                type="text"
                placeholder="Student ID"
                value={newStudent.studentId}
                onChange={(e) => setNewStudent({...newStudent, studentId: e.target.value})}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            
            <div>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '4px'
              }}>
                Email (optional)
              </label>
              <input
                type="email"
                placeholder="Email address"
                value={newStudent.email}
                onChange={(e) => setNewStudent({...newStudent, email: e.target.value})}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleAddStudent}
              disabled={!newStudent.firstName.trim() || !newStudent.lastName.trim()}
              style={{
                backgroundColor: (newStudent.firstName.trim() && newStudent.lastName.trim()) ? '#3b82f6' : '#d1d5db',
                color: 'white',
                padding: '10px 20px',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: (newStudent.firstName.trim() && newStudent.lastName.trim()) ? 'pointer' : 'not-allowed'
              }}
            >
              ➕ Add Student
            </button>
            
            <button
              onClick={() => {
                setShowAddStudent(false);
                setNewStudent({ firstName: '', lastName: '', studentId: '', email: '' });
              }}
              style={{
                backgroundColor: '#6b7280',
                color: 'white',
                padding: '10px 20px',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
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
          backgroundColor: '#f9fafb',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          padding: '20px',
          marginBottom: '20px'
        }}>
          <h3 style={{
            fontSize: '18px',
            fontWeight: '600',
            color: '#374151',
            marginBottom: '16px',
            margin: '0 0 16px 0'
          }}>
            Import Students from List
          </h3>
          
          <div style={{
            backgroundColor: '#dbeafe',
            border: '1px solid #3b82f6',
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
              Also works with CSV format if you have headers like "firstName,lastName"<br/>
              <strong>Surnames will be automatically shortened to 2 letters for privacy</strong>
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
                padding: '10px 20px',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: csvText.trim() ? 'pointer' : 'not-allowed'
              }}
            >
              📋 Import Students
            </button>
            
            <button
              onClick={() => {
                setShowCSVImport(false);
                setCsvText('');
              }}
              style={{
                backgroundColor: '#6b7280',
                color: 'white',
                padding: '10px 20px',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Student List */}
      {students.length > 0 ? (
        <div style={{
          backgroundColor: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          padding: '20px'
        }}>
          <h3 style={{
            fontSize: '18px',
            fontWeight: '600',
            color: '#374151',
            marginBottom: '16px',
            margin: '0 0 16px 0'
          }}>
            Class Students ({students.length})
          </h3>
          
          <div style={{ 
            display: 'grid', 
            gap: '8px',
            maxHeight: '400px',
            overflowY: 'auto'
          }}>
            {students.map((student, index) => (
              <div
                key={student.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px',
                  backgroundColor: '#f9fafb',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  flexDirection: isMobile ? 'column' : 'row',
                  gap: isMobile ? '8px' : '0'
                }}
              >
                <div style={{ 
                  flex: 1,
                  textAlign: isMobile ? 'center' : 'left'
                }}>
                  <span style={{
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#374151'
                  }}>
                    {index + 1}. {student.firstName} {student.lastName}
                  </span>
                  {student.studentId && (
                    <span style={{
                      fontSize: '12px',
                      color: '#6b7280',
                      marginLeft: isMobile ? '0' : '8px',
                      display: isMobile ? 'block' : 'inline'
                    }}>
                      ID: {student.studentId}
                    </span>
                  )}
                  {student.email && (
                    <span style={{
                      fontSize: '12px',
                      color: '#6b7280',
                      marginLeft: isMobile ? '0' : '8px',
                      display: isMobile ? 'block' : 'inline'
                    }}>
                      Email: {student.email}
                    </span>
                  )}
                </div>
                
                <div style={{ 
                  display: 'flex', 
                  gap: '8px',
                  flexDirection: isMobile ? 'row' : 'row'
                }}>
                  <button
                    onClick={() => handleEditStudent(student)}
                    style={{
                      backgroundColor: '#f59e0b',
                      color: 'white',
                      padding: '6px 12px',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#d97706'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#f59e0b'}
                  >
                    Edit
                  </button>
                  
                  <button
                    onClick={() => handleDeleteStudent(student.id, `${student.firstName} ${student.lastName}`)}
                    style={{
                      backgroundColor: '#ef4444',
                      color: 'white',
                      padding: '6px 12px',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#dc2626'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#ef4444'}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div style={{
          backgroundColor: '#f9fafb',
          border: '2px dashed #d1d5db',
          borderRadius: '8px',
          padding: '40px 20px',
          textAlign: 'center'
        }}>
          <p style={{
            fontSize: '16px',
            color: '#6b7280',
            margin: '0 0 16px 0'
          }}>
            No students in this class yet
          </p>
          <button
            onClick={() => setShowAddStudent(true)}
            style={{
              backgroundColor: '#3b82f6',
              color: 'white',
              padding: '12px 24px',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            ➕ Add Your First Student
          </button>
        </div>
      )}

      {/* Edit Student Modal */}
      {editingStudent && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '24px',
            borderRadius: '8px',
            width: isMobile ? '90%' : '500px',
            maxWidth: '90vw'
          }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '16px',
              margin: '0 0 16px 0'
            }}>
              Edit Student
            </h3>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '4px'
              }}>
                First Name *
              </label>
              <input
                type="text"
                value={editingStudent.firstName}
                onChange={(e) => setEditingStudent({...editingStudent, firstName: e.target.value})}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '4px'
              }}>
                Last Name * (will be shortened to 2 letters)
              </label>
              <input
                type="text"
                value={editingStudent.lastName}
                onChange={(e) => setEditingStudent({...editingStudent, lastName: e.target.value})}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
              {editingStudent.lastName && (
                <p style={{
                  fontSize: '12px',
                  color: '#6b7280',
                  margin: '4px 0 0 0'
                }}>
                  Will be stored as: {truncateSurname(editingStudent.lastName)}
                </p>
              )}
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '4px'
              }}>
                Student ID (optional)
              </label>
              <input
                type="text"
                value={editingStudent.studentId || ''}
                onChange={(e) => setEditingStudent({...editingStudent, studentId: e.target.value})}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '4px'
              }}>
                Email (optional)
              </label>
              <input
                type="email"
                value={editingStudent.email || ''}
                onChange={(e) => setEditingStudent({...editingStudent, email: e.target.value})}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setEditingStudent(null)}
                style={{
                  backgroundColor: '#6b7280',
                  color: 'white',
                  padding: '10px 20px',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              
              <button
                onClick={handleSaveEdit}
                disabled={!editingStudent.firstName.trim() || !editingStudent.lastName.trim()}
                style={{
                  backgroundColor: (editingStudent.firstName.trim() && editingStudent.lastName.trim()) ? '#3b82f6' : '#d1d5db',
                  color: 'white',
                  padding: '10px 20px',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: (editingStudent.firstName.trim() && editingStudent.lastName.trim()) ? 'pointer' : 'not-allowed'
                }}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ClassDetail;