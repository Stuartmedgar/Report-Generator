import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Template, Class } from '../../types';

interface StudentSelectionProps {
  template: Template;
  classData: Class;
  onSelectStudents: (mode: 'all' | 'selected', studentIds?: string[]) => void;
  onBack: () => void;
  isMobile: boolean;
}

function StudentSelection({ 
  template, 
  classData, 
  onSelectStudents, 
  onBack,
  isMobile 
}: StudentSelectionProps) {
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);

  const handleStudentToggle = (studentId: string) => {
    setSelectedStudentIds(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleSelectAll = () => {
    setSelectedStudentIds(classData.students.map(s => s.id));
  };

  const handleDeselectAll = () => {
    setSelectedStudentIds([]);
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      
      {/* Mobile vs Desktop Header */}
      <header style={{ 
        backgroundColor: 'white', 
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        padding: isMobile ? '12px 16px' : '32px 24px'
      }}>
        {isMobile ? (
          // Mobile Header
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <h1 style={{ 
                fontSize: '18px', 
                fontWeight: '600', 
                color: '#111827',
                margin: 0
              }}>
                Select Students
              </h1>
              <span style={{
                fontSize: '12px',
                backgroundColor: '#e0f2fe',
                color: '#0277bd',
                padding: '4px 8px',
                borderRadius: '12px',
                fontWeight: '500'
              }}>
                Step 3 of 3
              </span>
            </div>
            
            <Link to="/" style={{ textDecoration: 'none' }}>
              <button style={{
                backgroundColor: '#3b82f6',
                color: 'white',
                padding: '6px',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                cursor: 'pointer',
                minWidth: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                🏠
              </button>
            </Link>
          </div>
        ) : (
          // Desktop Header
          <div style={{ textAlign: 'center' }}>
            <h1 style={{ 
              fontSize: '28px', 
              fontWeight: '600', 
              color: '#111827',
              margin: 0
            }}>
              Select Students
            </h1>
            <p style={{ 
              color: '#6b7280', 
              margin: '8px 0 0 0',
              fontSize: '16px'
            }}>
              {template.name} • {classData.name}
            </p>
          </div>
        )}
      </header>

      <main style={{ 
        maxWidth: isMobile ? '100%' : '800px', 
        margin: '0 auto', 
        padding: isMobile ? '16px' : '32px 24px'
      }}>
        
        {/* Mobile: Selected Template & Class Info */}
        {isMobile && (
          <div style={{
            backgroundColor: '#eff6ff',
            border: '2px solid #3b82f6',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '20px',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '14px',
              color: '#1e40af',
              fontWeight: '600',
              marginBottom: '8px'
            }}>
              ✓ Template: {template.name}
            </div>
            <div style={{
              fontSize: '14px',
              color: '#059669',
              fontWeight: '600'
            }}>
              ✓ Class: {classData.name} ({classData.students.length} students)
            </div>
          </div>
        )}
        
        {/* Back Button */}
        <button 
          onClick={onBack}
          style={{
            backgroundColor: '#6b7280',
            color: 'white',
            padding: isMobile ? '12px 16px' : '12px 24px',
            border: 'none',
            borderRadius: '8px',
            fontSize: isMobile ? '14px' : '16px',
            fontWeight: '500',
            cursor: 'pointer',
            marginBottom: '24px',
            width: isMobile ? '100%' : 'auto'
          }}
        >
          ← {isMobile ? 'Change Class' : 'Back to Template & Class Selection'}
        </button>

        {/* Main Selection Card */}
        <div style={{
          backgroundColor: 'white',
          padding: isMobile ? '16px' : '32px',
          borderRadius: isMobile ? '8px' : '12px',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
          marginBottom: '24px'
        }}>

          {/* Action Buttons */}
          <div style={{
            display: 'flex',
            gap: isMobile ? '12px' : '16px',
            marginBottom: '24px',
            flexDirection: isMobile ? 'column' : 'row'
          }}>
            <button
              onClick={() => onSelectStudents('all')}
              style={{
                backgroundColor: '#10b981',
                color: 'white',
                padding: '16px 32px',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                flex: isMobile ? 'none' : '1',
                minWidth: isMobile ? 'auto' : '200px'
              }}
            >
              📝 Write Reports for All Students ({classData.students.length})
            </button>

            <button
              onClick={() => selectedStudentIds.length > 0 ? onSelectStudents('selected', selectedStudentIds) : alert('Please select at least one student')}
              disabled={selectedStudentIds.length === 0}
              style={{
                backgroundColor: selectedStudentIds.length > 0 ? '#3b82f6' : '#e5e7eb',
                color: selectedStudentIds.length > 0 ? 'white' : '#9ca3af',
                padding: '16px 32px',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: selectedStudentIds.length > 0 ? 'pointer' : 'not-allowed',
                flex: isMobile ? 'none' : '1',
                minWidth: isMobile ? 'auto' : '200px'
              }}
            >
              📝 Write Reports for Selected ({selectedStudentIds.length})
            </button>
          </div>

          {/* Select All/Clear All */}
          <div style={{
            display: 'flex',
            gap: '16px',
            marginBottom: '24px',
            justifyContent: 'center'
          }}>
            <button onClick={handleSelectAll} style={{
              backgroundColor: 'transparent',
              color: '#3b82f6',
              padding: '8px 16px',
              border: '1px solid #3b82f6',
              borderRadius: '6px',
              fontSize: '14px',
              cursor: 'pointer'
            }}>
              Select All
            </button>
            <button onClick={handleDeselectAll} style={{
              backgroundColor: 'transparent',
              color: '#6b7280',
              padding: '8px 16px',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              fontSize: '14px',
              cursor: 'pointer'
            }}>
              Clear All
            </button>
          </div>

          {/* Students Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(250px, 1fr))',
            gap: '12px'
          }}>
            {classData.students.map((student) => (
              <label
                key={student.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '12px',
                  border: selectedStudentIds.includes(student.id) ? '2px solid #3b82f6' : '2px solid #e5e7eb',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  backgroundColor: selectedStudentIds.includes(student.id) ? '#f0f9ff' : 'white',
                  transition: 'all 0.2s'
                }}>
                <input
                  type="checkbox"
                  checked={selectedStudentIds.includes(student.id)}
                  onChange={() => handleStudentToggle(student.id)}
                  style={{
                    marginRight: '8px',
                    width: '16px',
                    height: '16px'
                  }}
                />
                <div>
                  <div style={{
                    fontWeight: '600',
                    color: '#111827',
                    fontSize: '14px'
                  }}>
                    {student.firstName} {student.lastName}
                  </div>
                  {student.studentId && (
                    <div style={{
                      fontSize: '12px',
                      color: '#6b7280'
                    }}>
                      ID: {student.studentId}
                    </div>
                  )}
                </div>
              </label>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

export default StudentSelection;