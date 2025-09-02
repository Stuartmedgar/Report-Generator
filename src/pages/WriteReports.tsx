import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { Template, Class, Student } from '../types';
import ReportWriter from '../components/ReportWriter';

type Step = 'selection' | 'students' | 'writing';

function WriteReports() {
  const navigate = useNavigate();
  const { state } = useData();
  const [currentStep, setCurrentStep] = useState<Step>('selection');
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [resumeStudentIndex, setResumeStudentIndex] = useState<number>(0);

  useEffect(() => {
    const continueEditingData = sessionStorage.getItem('continueEditing');
    if (continueEditingData) {
      try {
        const { classId, templateId, studentIndex } = JSON.parse(continueEditingData);
        
        const template = state.templates.find(t => t.id === templateId);
        const classData = state.classes.find(c => c.id === classId);
        
        if (template && classData) {
          setSelectedTemplate(template);
          setSelectedClass(classData);
          setSelectedStudents(classData.students.map(s => s.id));
          setResumeStudentIndex(studentIndex);
          setCurrentStep('writing');
          sessionStorage.removeItem('continueEditing');
        }
      } catch (error) {
        console.error('Error parsing continue editing data:', error);
        sessionStorage.removeItem('continueEditing');
      }
    }
  }, [state.templates, state.classes]);

  const getClassesWithReports = () => {
    return state.classes.filter(classData => {
      const classReports = state.reports.filter(report => report.classId === classData.id);
      return classReports.length > 0;
    });
  };

  const handleTemplateSelect = (template: Template) => {
    setSelectedTemplate(template);
  };

  const handleClassSelect = (classData: Class) => {
    setSelectedClass(classData);
  };

  const handleContinueToStudents = () => {
    if (selectedTemplate && selectedClass) {
      setCurrentStep('students');
    }
  };

  const handleStudentSelection = (mode: 'all' | 'selected', studentIds: string[] = []) => {
    setSelectedStudents(mode === 'all' ? 
      selectedClass?.students.map((s: Student) => s.id) || [] : studentIds);
    setResumeStudentIndex(0);
    setCurrentStep('writing');
  };

  const handleBackToSelection = () => {
    setSelectedTemplate(null);
    setSelectedClass(null);
    setSelectedStudents([]);
    setResumeStudentIndex(0);
    setCurrentStep('selection');
  };

  const handleBackToStudents = () => {
    setSelectedStudents([]);
    setResumeStudentIndex(0);
    setCurrentStep('students');
  };

  const studentsToWrite = selectedClass?.students.filter(s => 
    selectedStudents.includes(s.id)
  ) || [];

  if (currentStep === 'writing' && selectedTemplate && selectedClass) {
    return (
      <ReportWriter
        template={selectedTemplate}
        classData={selectedClass}
        students={studentsToWrite}
        onBack={handleBackToStudents}
        startStudentIndex={resumeStudentIndex}
      />
    );
  }

  if (currentStep === 'students' && selectedTemplate && selectedClass) {
    return (
      <StudentSelector
        template={selectedTemplate}
        classData={selectedClass}
        onSelectStudents={handleStudentSelection}
        onBack={handleBackToSelection}
      />
    );
  }

  const classesWithReports = getClassesWithReports();

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      <header style={{ 
        backgroundColor: 'white', 
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        padding: '32px 24px'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div>
            <h1 style={{ 
              fontSize: '28px', 
              fontWeight: '600', 
              color: '#111827',
              margin: 0
            }}>
              Write Reports
            </h1>
            <p style={{ 
              color: '#6b7280', 
              margin: '8px 0 0 0',
              fontSize: '16px'
            }}>
              Select a template and class to start writing reports
            </p>
          </div>
          
          <div style={{
            display: 'flex',
            gap: '12px',
            flexWrap: 'wrap'
          }}>
            {classesWithReports.length > 0 && (
  <button
    onClick={() => navigate('/class-management')}
    style={{
      backgroundColor: '#f59e0b',
      color: 'white',
      padding: '12px 20px',
      border: 'none',
      borderRadius: '8px',
      fontSize: '14px',
      fontWeight: '500',
      cursor: 'pointer',
      display: 'inline-block' // 👈 ensures size matches the Link buttons
    }}
  >
    Continue Writing
  </button>
)}

            
            <Link to="/" style={{ textDecoration: 'none' }}>
              <button style={{
                backgroundColor: '#6b7280',
                color: 'white',
                padding: '12px 20px',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer'
              }}>
                ← Back to Home
              </button>
            </Link>
            
            <Link to="/create-template" style={{ textDecoration: 'none' }}>
              <button style={{
                backgroundColor: '#10b981',
                color: 'white',
                padding: '12px 20px',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer'
              }}>
                + Create Template
              </button>
            </Link>

            <Link to="/class-management" style={{ textDecoration: 'none' }}>
              <button style={{
                backgroundColor: '#3b82f6',
                color: 'white',
                padding: '12px 20px',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer'
              }}>
                + Create Class
              </button>
            </Link>
          </div>
        </div>
      </header>

      <main style={{ 
        maxWidth: '1200px', 
        margin: '0 auto', 
        padding: '32px 24px' 
      }}>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '32px',
          marginBottom: '32px'
        }}>

          <div style={{
            backgroundColor: 'white',
            padding: '32px',
            borderRadius: '12px',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
            border: selectedTemplate ? '2px solid #3b82f6' : '2px solid #e5e7eb'
          }}>
            <h2 style={{ 
              fontSize: '20px', 
              fontWeight: '600', 
              color: '#111827',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              📋 Select Template 
              {selectedTemplate && <span style={{ color: '#3b82f6', fontSize: '16px' }}>✓</span>}
              <span style={{ 
                fontSize: '14px', 
                fontWeight: 'normal',
                color: '#6b7280'
              }}>
                ({state.templates.length})
              </span>
            </h2>

            {selectedTemplate && (
              <div style={{
                backgroundColor: '#f0f9ff',
                border: '1px solid #3b82f6',
                borderRadius: '6px',
                padding: '12px',
                marginBottom: '16px'
              }}>
                <div style={{ fontSize: '14px', color: '#1d4ed8', fontWeight: '600' }}>
                  Selected: {selectedTemplate.name}
                </div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>
                  {selectedTemplate.sections.length} sections
                </div>
              </div>
            )}

            {state.templates.length === 0 ? (
              <div style={{
                border: '2px dashed #d1d5db',
                borderRadius: '8px',
                padding: '48px',
                textAlign: 'center',
                color: '#9ca3af'
              }}>
                <p style={{ margin: '0 0 8px 0' }}>No templates available yet.</p>
                <p style={{ margin: '0 0 16px 0' }}>Create your first template!</p>
                <Link to="/create-template" style={{ textDecoration: 'none' }}>
                  <button style={{
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    padding: '12px 24px',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}>
                    Create Template
                  </button>
                </Link>
              </div>
            ) : (
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '8px',
                maxHeight: '400px',
                overflowY: 'auto'
              }}>
                {state.templates.map((template) => (
                  <div key={template.id} 
                    style={{
                      border: selectedTemplate?.id === template.id ? '2px solid #3b82f6' : '2px solid #e5e7eb',
                      borderRadius: '8px',
                      padding: '12px',
                      backgroundColor: selectedTemplate?.id === template.id ? '#f0f9ff' : '#fafafa',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onClick={() => handleTemplateSelect(template)}
                  >
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'flex-start',
                      marginBottom: '4px' 
                    }}>
                      <h3 style={{ 
                        fontSize: '16px', 
                        fontWeight: '600', 
                        color: '#111827',
                        margin: 0 
                      }}>
                        {template.name}
                      </h3>
                      <span style={{ 
                        fontSize: '11px', 
                        color: '#6b7280',
                        backgroundColor: selectedTemplate?.id === template.id ? '#e0f2fe' : '#f3f4f6',
                        padding: '2px 6px',
                        borderRadius: '4px'
                      }}>
                        {template.sections.length} sections
                      </span>
                    </div>
                    <p style={{ 
                      color: '#6b7280', 
                      fontSize: '12px',
                      margin: '0 0 4px 0' 
                    }}>
                      {new Date(template.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{
            backgroundColor: 'white',
            padding: '32px',
            borderRadius: '12px',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
            border: selectedClass ? '2px solid #10b981' : '2px solid #e5e7eb'
          }}>
            <h2 style={{ 
              fontSize: '20px', 
              fontWeight: '600', 
              color: '#111827',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              👥 Select Class 
              {selectedClass && <span style={{ color: '#10b981', fontSize: '16px' }}>✓</span>}
              <span style={{ 
                fontSize: '14px', 
                fontWeight: 'normal',
                color: '#6b7280'
              }}>
                ({state.classes.length})
              </span>
            </h2>

            {selectedClass && (
              <div style={{
                backgroundColor: '#f0fdf4',
                border: '1px solid #10b981',
                borderRadius: '6px',
                padding: '12px',
                marginBottom: '16px'
              }}>
                <div style={{ fontSize: '14px', color: '#059669', fontWeight: '600' }}>
                  Selected: {selectedClass.name}
                </div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>
                  {selectedClass.students.length} students
                </div>
              </div>
            )}

            {state.classes.length === 0 ? (
              <div style={{
                border: '2px dashed #d1d5db',
                borderRadius: '8px',
                padding: '48px',
                textAlign: 'center',
                color: '#9ca3af'
              }}>
                <p style={{ margin: '0 0 8px 0' }}>No classes available yet.</p>
                <p style={{ margin: '0 0 16px 0' }}>Create your first class!</p>
                <Link to="/class-management" style={{ textDecoration: 'none' }}>
                  <button style={{
                    backgroundColor: '#10b981',
                    color: 'white',
                    padding: '12px 24px',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}>
                    Create Class
                  </button>
                </Link>
              </div>
            ) : (
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '8px',
                maxHeight: '400px',
                overflowY: 'auto'
              }}>
                {state.classes.map((classItem) => (
                  <div key={classItem.id} 
                    style={{
                      border: selectedClass?.id === classItem.id ? '2px solid #10b981' : '2px solid #e5e7eb',
                      borderRadius: '8px',
                      padding: '12px',
                      backgroundColor: selectedClass?.id === classItem.id ? '#f0fdf4' : '#fafafa',
                      cursor: classItem.students.length === 0 ? 'not-allowed' : 'pointer',
                      opacity: classItem.students.length === 0 ? 0.6 : 1,
                      transition: 'all 0.2s'
                    }}
                    onClick={() => classItem.students.length > 0 && handleClassSelect(classItem)}
                  >
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'flex-start',
                      marginBottom: '4px'
                    }}>
                      <h3 style={{ 
                        fontSize: '16px', 
                        fontWeight: '600', 
                        color: classItem.students.length === 0 ? '#9ca3af' : '#111827',
                        margin: 0 
                      }}>
                        {classItem.name}
                      </h3>
                      <span style={{ 
                        fontSize: '11px', 
                        color: '#6b7280',
                        backgroundColor: selectedClass?.id === classItem.id ? '#dcfce7' : '#f3f4f6',
                        padding: '2px 6px',
                        borderRadius: '4px'
                      }}>
                        {classItem.students.length} students
                      </span>
                    </div>
                    <p style={{ 
                      color: '#6b7280', 
                      fontSize: '12px',
                      margin: '0 0 4px 0' 
                    }}>
                      {new Date(classItem.createdAt).toLocaleDateString()}
                    </p>
                    {classItem.students.length === 0 && (
                      <p style={{ 
                        color: '#ef4444', 
                        fontSize: '11px',
                        margin: 0,
                        fontStyle: 'italic'
                      }}>
                        No students in this class
                      </p>
                    )}
                    {classItem.students.length > 0 && (
                      <div style={{
                        fontSize: '11px',
                        color: '#6b7280'
                      }}>
                        {classItem.students
                          .slice(0, 2)
                          .map(s => `${s.firstName} ${s.lastName}`)
                          .join(', ')}
                        {classItem.students.length > 2 && ` +${classItem.students.length - 2} more`}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {selectedTemplate && selectedClass && (
          <div style={{
            backgroundColor: 'white',
            padding: '24px',
            borderRadius: '12px',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
            textAlign: 'center'
          }}>
            <button
              onClick={handleContinueToStudents}
              style={{
                backgroundColor: '#3b82f6',
                color: 'white',
                padding: '16px 48px',
                border: 'none',
                borderRadius: '8px',
                fontSize: '18px',
                fontWeight: '600',
                cursor: 'pointer',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
              }}
            >
              Continue to Student Selection →
            </button>
            <p style={{ 
              color: '#6b7280', 
              fontSize: '14px',
              margin: '8px 0 0 0'
            }}>
              Using "{selectedTemplate.name}" template with "{selectedClass.name}" class
            </p>
          </div>
        )}

        <div style={{
          backgroundColor: '#f0f9ff',
          border: '2px solid #3b82f6',
          borderRadius: '12px',
          padding: '20px',
          textAlign: 'center'
        }}>
          <h3 style={{ 
            fontSize: '18px', 
            fontWeight: '600', 
            color: '#1e40af',
            margin: '0 0 8px 0'
          }}>
            💡 How to Get Started
          </h3>
          <p style={{ 
            color: '#1e40af', 
            fontSize: '14px',
            margin: '0 0 16px 0'
          }}>
            Select a template on the left and a class on the right to start writing reports. 
            Need help? Create your first template or class using the buttons above!
          </p>
          <Link to="/manage-templates" style={{ textDecoration: 'none', marginRight: '16px' }}>
            <button style={{
              backgroundColor: '#3b82f6',
              color: 'white',
              padding: '8px 16px',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer'
            }}>
              Browse All Templates
            </button>
          </Link>
          <Link to="/class-management" style={{ textDecoration: 'none' }}>
            <button style={{
              backgroundColor: '#10b981',
              color: 'white',
              padding: '8px 16px',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer'
            }}>
              Manage Classes
            </button>
          </Link>
        </div>
      </main>
    </div>
  );
}

function StudentSelector({ 
  template, 
  classData, 
  onSelectStudents, 
  onBack 
}: {
  template: Template;
  classData: Class;
  onSelectStudents: (mode: 'all' | 'selected', studentIds?: string[]) => void;
  onBack: () => void;
}) {
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
          Select Students
        </h1>
        <p style={{ 
          color: '#6b7280', 
          margin: '8px 0 0 0',
          fontSize: '16px'
        }}>
          {template.name} • {classData.name}
        </p>
      </header>

      <main style={{ 
        maxWidth: '800px', 
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
          ← Back to Template & Class Selection
        </button>

        <div style={{
          backgroundColor: 'white',
          padding: '32px',
          borderRadius: '12px',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
          marginBottom: '24px'
        }}>

          <div style={{
            display: 'flex',
            gap: '16px',
            marginBottom: '24px',
            flexWrap: 'wrap'
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
                flex: '1',
                minWidth: '200px'
              }}
            >
              📝 Write Reports for All Students ({classData.students.length})
            </button>

            <button
              onClick={() => selectedStudentIds.length > 0 ? onSelectStudents('selected', selectedStudentIds) : alert('Please select at least one student')}
              disabled={selectedStudentIds.length === 0}
              style={{
                backgroundColor: selectedStudentIds.length > 0 ? '#3b82f6' : '#9ca3af',
                color: 'white',
                padding: '16px 32px',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: selectedStudentIds.length > 0 ? 'pointer' : 'not-allowed',
                flex: '1',
                minWidth: '200px'
              }}
            >
              📝 Write Reports for Selected ({selectedStudentIds.length})
            </button>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '16px'
            }}>
              <h2 style={{ 
                fontSize: '20px', 
                fontWeight: '600', 
                color: '#111827',
                margin: 0
              }}>
                Select Individual Students
              </h2>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={handleSelectAll}
                  style={{
                    backgroundColor: '#f3f4f6',
                    color: '#374151',
                    padding: '8px 16px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}
                >
                  Select All
                </button>
                <button
                  onClick={handleDeselectAll}
                  style={{
                    backgroundColor: '#f3f4f6',
                    color: '#374151',
                    padding: '8px 16px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}
                >
                  Clear All
                </button>
              </div>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: '12px'
            }}>
              {classData.students.map((student) => (
                <label key={student.id} style={{
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
        </div>
      </main>
    </div>
  );
}

export default WriteReports;