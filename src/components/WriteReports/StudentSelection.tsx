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

const StudentSelection: React.FC<StudentSelectionProps> = ({
  template,
  classData,
  onSelectStudents,
  onBack,
  isMobile
}) => {
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

  const handleClearSelection = () => {
    setSelectedStudentIds([]);
  };

  const handleContinue = (mode: 'all' | 'selected') => {
    if (mode === 'all') {
      onSelectStudents('all');
    } else {
      onSelectStudents('selected', selectedStudentIds);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      
      {/* Mobile vs Desktop Header */}
      <header style={{ 
        backgroundColor: 'white',
        borderBottom: '1px solid #e5e7eb',
        padding: isMobile ? '16px' : '24px 32px'
      }}>
        {isMobile ? (
          // Mobile: Simple progress indicator
          <div style={{ textAlign: 'center' }}>
            <h1 style={{ fontSize: '18px', fontWeight: '600', margin: 0, color: '#111827' }}>
              Final Step (3 of 3)
            </h1>
            <p style={{ fontSize: '14px', color: '#6b7280', margin: '4px 0 0 0' }}>
              Select students for reports
            </p>
          </div>
        ) : (
          // Desktop: Full breadcrumb
          <div>
            <nav style={{ fontSize: '14px', color: '#6b7280', marginBottom: '16px' }}>
              <span>Write Reports</span>
              <span style={{ margin: '0 8px' }}>›</span>
              <span>{template.name}</span>
              <span style={{ margin: '0 8px' }}>›</span>
              <span>{classData.name}</span>
              <span style={{ margin: '0 8px' }}>›</span>
              <span style={{ color: '#111827', fontWeight: '500' }}>Select Students</span>
            </nav>
            <h1 style={{ fontSize: '28px', fontWeight: '700', margin: 0, color: '#111827' }}>
              Select Students for Reports
            </h1>
          </div>
        )}
      </header>

      <main style={{ 
        maxWidth: isMobile ? '100%' : '800px', 
        margin: '0 auto', 
        padding: isMobile ? '16px' : '32px 24px'
      }}>

        {/* Back Button and Home Button - Same Line - Mobile Only */}
        {isMobile && (
          <div style={{
            display: 'flex',
            gap: '8px',
            marginBottom: '16px'
          }}>
            <button 
              onClick={onBack}
              style={{
                backgroundColor: '#6b7280',
                color: 'white',
                padding: '12px 16px',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                flex: 1
              }}
            >
              ← Change Class
            </button>
            
            <Link to="/" style={{ textDecoration: 'none', flex: 1 }}>
              <button style={{
                backgroundColor: '#3b82f6',
                color: 'white',
                padding: '12px 16px',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                width: '100%'
              }}>
                Home
              </button>
            </Link>
          </div>
        )}

        {/* Desktop Back Button */}
        {!isMobile && (
          <button 
            onClick={onBack}
            style={{
              backgroundColor: '#6b7280',
              color: 'white',
              padding: '12px 24px',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              marginBottom: '24px'
            }}
          >
            ← Back to Class Selection
          </button>
        )}

        {/* Summary Card */}
        <div style={{
          backgroundColor: 'white',
          padding: isMobile ? '16px' : '24px',
          borderRadius: '8px',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
          marginBottom: '20px'
        }}>
          <div style={{
            display: 'flex',
            gap: isMobile ? '12px' : '16px',
            marginBottom: '16px',
            flexDirection: isMobile ? 'column' : 'row',
            alignItems: isMobile ? 'flex-start' : 'center'
          }}>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', margin: '0 0 4px 0', color: '#111827' }}>
                {template.name}
              </h3>
              <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
                Class: {classData.name} • {classData.students.length} students
              </p>
            </div>
          </div>

          {/* Main Action Button */}
          <button
            onClick={() => handleContinue('all')}
            style={{
              backgroundColor: '#10b981',
              color: 'white',
              padding: isMobile ? '14px 20px' : '16px 32px',
              border: 'none',
              borderRadius: '8px',
              fontSize: isMobile ? '16px' : '18px',
              fontWeight: '600',
              cursor: 'pointer',
              width: '100%',
              marginBottom: '16px',
              boxShadow: '0 2px 4px 0 rgba(0, 0, 0, 0.1)'
            }}
          >
            Write Reports for All Students ({classData.students.length})
          </button>

          {/* OR Divider */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            margin: '20px 0',
            color: '#6b7280',
            fontSize: '14px'
          }}>
            <div style={{ flex: 1, height: '1px', backgroundColor: '#e5e7eb' }}></div>
            <span style={{ padding: '0 16px', fontWeight: '500' }}>OR</span>
            <div style={{ flex: 1, height: '1px', backgroundColor: '#e5e7eb' }}></div>
          </div>

          {/* Select Specific Students */}
          <h4 style={{ fontSize: '14px', fontWeight: '600', margin: '0 0 12px 0', color: '#111827' }}>
            Select specific students:
          </h4>

          {/* Quick Actions */}
          <div style={{
            display: 'flex',
            gap: '8px',
            marginBottom: '12px',
            flexWrap: 'wrap'
          }}>
            <button
              onClick={handleSelectAll}
              style={{
                backgroundColor: '#f3f4f6',
                color: '#374151',
                padding: '6px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              Select All
            </button>
            <button
              onClick={handleClearSelection}
              style={{
                backgroundColor: '#f3f4f6',
                color: '#374151',
                padding: '6px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              Clear Selection
            </button>
          </div>
        </div>

        {/* Main Selection Card */}
        <div style={{
          backgroundColor: 'white',
          padding: isMobile ? '16px' : '32px',
          borderRadius: isMobile ? '8px' : '12px',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
        }}>
          {/* Student List */}
          <div style={{
            maxHeight: isMobile ? '50vh' : '60vh',
            overflowY: 'auto',
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
            marginBottom: '20px'
          }}>
            {isMobile ? (
              // Mobile: Clean tap-to-select list
              classData.students.map((student) => (
                <div
                  key={student.id}
                  onClick={() => handleStudentToggle(student.id)}
                  style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid #f3f4f6',
                    backgroundColor: selectedStudentIds.includes(student.id) ? '#dbeafe' : 'white',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '14px',
                    color: '#111827'
                  }}
                >
                  <span>
                    {student.firstName} {student.lastName}
                    {student.studentId && <span style={{ color: '#6b7280', marginLeft: '8px' }}>({student.studentId})</span>}
                  </span>
                  {selectedStudentIds.includes(student.id) && (
                    <span style={{
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      borderRadius: '50%',
                      width: '20px',
                      height: '20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px'
                    }}>
                      ✓
                    </span>
                  )}
                </div>
              ))
            ) : (
              // Desktop: Grid with checkboxes
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                gap: '12px',
                padding: '16px'
              }}>
                {classData.students.map((student) => (
                  <div
                    key={student.id}
                    onClick={() => handleStudentToggle(student.id)}
                    style={{
                      padding: '16px',
                      border: `2px solid ${selectedStudentIds.includes(student.id) ? '#3b82f6' : '#e5e7eb'}`,
                      borderRadius: '8px',
                      backgroundColor: selectedStudentIds.includes(student.id) ? '#eff6ff' : 'white',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      position: 'relative'
                    }}
                  >
                    <div style={{
                      position: 'absolute',
                      top: '12px',
                      right: '12px',
                      width: '16px',
                      height: '16px',
                      border: `2px solid ${selectedStudentIds.includes(student.id) ? '#3b82f6' : '#d1d5db'}`,
                      borderRadius: '3px',
                      backgroundColor: selectedStudentIds.includes(student.id) ? '#3b82f6' : 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {selectedStudentIds.includes(student.id) && (
                        <div style={{
                          width: '8px',
                          height: '8px',
                          backgroundColor: 'white',
                          borderRadius: '1px'
                        }} />
                      )}
                    </div>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#111827',
                      marginBottom: '4px',
                      paddingRight: '24px'
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
                ))}
              </div>
            )}
          </div>

          {/* Selected Count & Continue */}
          {selectedStudentIds.length > 0 && (
            <div style={{
              backgroundColor: '#f0f9ff',
              border: '1px solid #0ea5e9',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '20px'
            }}>
              <p style={{
                margin: '0 0 12px 0',
                fontSize: '14px',
                color: '#0369a1',
                fontWeight: '500'
              }}>
                {selectedStudentIds.length} student{selectedStudentIds.length !== 1 ? 's' : ''} selected
              </p>
              <button
                onClick={() => handleContinue('selected')}
                style={{
                  backgroundColor: '#0ea5e9',
                  color: 'white',
                  padding: '12px 24px',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  width: '100%'
                }}
              >
                Write Reports for Selected Students ({selectedStudentIds.length})
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default StudentSelection;