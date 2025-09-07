import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { Student } from '../types';

interface CreateClassProps {
  onComplete: () => void;
  onCancel: () => void;
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
      lastName: truncateSurname(newStudent.lastName.trim()), // Apply surname truncation
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
        setStudents([...students, ...newStudents]);
        setCsvText('');
        alert(`Successfully imported ${newStudents.length} students! (Surnames truncated to first 2 letters for privacy)`);
      } else {
        alert('No valid student names found. Please check the format and try again.');
      }
    } catch (error) {
      alert('Error processing student list. Please check the format and try again.');
    }
  };

  const handleCreateClass = () => {
    if (!className.trim()) {
      alert('Please enter a class name');
      return;
    }

    if (students.length === 0) {
      alert('Please add at least one student');
      return;
    }

    const newClass = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      name: className.trim(),
      students: students,
      createdAt: new Date().toISOString()
    };

    addClass(newClass);
    onComplete();
  };

  const isMobile = window.innerWidth <= 768;

  return (
    <div style={{ 
      padding: isMobile ? '16px' : '20px', 
      maxWidth: '800px', 
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
        <h1 style={{ 
          fontSize: isMobile ? '24px' : '28px', 
          fontWeight: 'bold', 
          color: '#1f2937',
          margin: 0,
          textAlign: isMobile ? 'center' : 'left'
        }}>
          Create New Class
        </h1>
        <button
          onClick={onCancel}
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
          Cancel
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
          🔒 Privacy Protection: Surnames will be automatically shortened to first 2 letters only (e.g., "Smith" becomes "SM")
        </p>
      </div>

      {/* Class Name */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{
          display: 'block',
          fontSize: '16px',
          fontWeight: '600',
          color: '#374151',
          marginBottom: '8px'
        }}>
          Class Name *
        </label>
        <input
          type="text"
          placeholder="e.g., 8A English, Year 9 Science"
          value={className}
          onChange={(e) => setClassName(e.target.value)}
          style={{
            width: '100%',
            padding: '12px',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '16px',
            boxSizing: 'border-box'
          }}
        />
      </div>

      {/* Input Method Selection */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{
          display: 'block',
          fontSize: '16px',
          fontWeight: '600',
          color: '#374151',
          marginBottom: '12px'
        }}>
          How would you like to add students?
        </label>
        
        <div style={{ 
          display: 'flex', 
          gap: '12px',
          flexDirection: isMobile ? 'column' : 'row'
        }}>
          <button
            onClick={() => setInputMethod('individual')}
            style={{
              flex: 1,
              padding: '12px 16px',
              border: inputMethod === 'individual' ? '2px solid #3b82f6' : '1px solid #d1d5db',
              borderRadius: '6px',
              backgroundColor: inputMethod === 'individual' ? '#eff6ff' : 'white',
              color: inputMethod === 'individual' ? '#1d4ed8' : '#374151',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            ➕ Add One by One
          </button>
          
          <button
            onClick={() => setInputMethod('csv')}
            style={{
              flex: 1,
              padding: '12px 16px',
              border: inputMethod === 'csv' ? '2px solid #3b82f6' : '1px solid #d1d5db',
              borderRadius: '6px',
              backgroundColor: inputMethod === 'csv' ? '#eff6ff' : 'white',
              color: inputMethod === 'csv' ? '#1d4ed8' : '#374151',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            📋 Paste List
          </button>
        </div>
      </div>

      {/* Individual Student Input */}
      {inputMethod === 'individual' && (
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
            Add Student
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
          
          <button
            onClick={handleAddIndividualStudent}
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
        </div>
      )}

      {/* CSV Input */}
      {inputMethod === 'csv' && (
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
            Paste Student List
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
        </div>
      )}

      {/* Student List */}
      {students.length > 0 && (
        <div style={{
          backgroundColor: 'white',
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
            Students in Class ({students.length})
          </h3>
          
          <div style={{ 
            display: 'grid', 
            gap: '8px',
            maxHeight: '300px',
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
                  borderRadius: '6px'
                }}
              >
                <div style={{ flex: 1 }}>
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
                      marginLeft: '8px'
                    }}>
                      (ID: {student.studentId})
                    </span>
                  )}
                </div>
                <button
                  onClick={() => handleRemoveStudent(student.id)}
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
            ))}
          </div>
        </div>
      )}

      {/* Create Class Button */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center',
        paddingTop: '20px'
      }}>
        <button
          onClick={handleCreateClass}
          disabled={!className.trim() || students.length === 0}
          style={{
            backgroundColor: (className.trim() && students.length > 0) ? '#10b981' : '#d1d5db',
            color: 'white',
            padding: isMobile ? '14px 32px' : '16px 40px',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: (className.trim() && students.length > 0) ? 'pointer' : 'not-allowed',
            transition: 'background-color 0.2s'
          }}
          onMouseOver={(e) => {
            if (className.trim() && students.length > 0) {
              e.currentTarget.style.backgroundColor = '#059669';
            }
          }}
          onMouseOut={(e) => {
            if (className.trim() && students.length > 0) {
              e.currentTarget.style.backgroundColor = '#10b981';
            }
          }}
        >
          🎓 Create Class
        </button>
      </div>
    </div>
  );
}

export default CreateClass;