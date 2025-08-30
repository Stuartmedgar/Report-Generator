import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { Template, Class, Student } from '../types';
import ClassSelector from '../components/ClassSelector';
import ReportWriter from '../components/ReportWriter';

type Step = 'template' | 'class' | 'students' | 'writing';

function WriteReports() {
  const navigate = useNavigate();
  const { state } = useData();
  const [currentStep, setCurrentStep] = useState<Step>('template');
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [resumeStudentIndex, setResumeStudentIndex] = useState<number>(0);
const [writeMode, setWriteMode] = useState('all');

 
  useEffect(() => {
    const continueEditingData = sessionStorage.getItem('continueEditing');
    if (continueEditingData) {
      try {
        const { classId, templateId, studentIndex } = JSON.parse(continueEditingData);
        
        // Find the template and class
        const template = state.templates.find(t => t.id === templateId);
        const classData = state.classes.find(c => c.id === classId);
        
        if (template && classData) {
          // Set up the state to resume exactly where left off
          setSelectedTemplate(template);
          setSelectedClass(classData);
          setSelectedStudents(classData.students.map(s => s.id));
          setWriteMode('all');
          setResumeStudentIndex(studentIndex);
          setCurrentStep('writing');
          
          // Clear the session storage
          sessionStorage.removeItem('continueEditing');
        }
      } catch (error) {
        console.error('Error parsing continue editing data:', error);
        sessionStorage.removeItem('continueEditing');
      }
    }
  }, [state.templates, state.classes]);

  // Check if there are any classes with reports in progress
  const getClassesWithReports = () => {
    return state.classes.filter(classData => {
      const classReports = state.reports.filter(report => report.classId === classData.id);
      return classReports.length > 0;
    });
  };

  const handleTemplateSelect = (template: Template) => {
    setSelectedTemplate(template);
    setCurrentStep('class');
  };

  const handleClassSelect = (classData: Class) => {
    setSelectedClass(classData);
    setCurrentStep('students');
  };

  const handleStudentSelection = (mode: 'all' | 'selected', studentIds: string[] = []) => {
    setWriteMode(mode);
    setSelectedStudents(mode === 'all' ? selectedClass?.students.map((s: Student) => s.id) || [] : studentIds);
    setResumeStudentIndex(0); // Start from beginning for new sessions
    setCurrentStep('writing');
  };

  const handleBackToTemplates = () => {
    setSelectedTemplate(null);
    setSelectedClass(null);
    setSelectedStudents([]);
    setResumeStudentIndex(0);
    setCurrentStep('template');
  };

  const handleBackToClasses = () => {
    setSelectedClass(null);
    setSelectedStudents([]);
    setResumeStudentIndex(0);
    setCurrentStep('class');
  };

  const handleBackToStudents = () => {
    setSelectedStudents([]);
    setResumeStudentIndex(0);
    setCurrentStep('students');
  };

  // Get students for writing (all or selected)
  const studentsToWrite = selectedClass?.students.filter(s => 
    selectedStudents.includes(s.id)
  ) || [];

  // If we're in writing mode, show the report writer
  if (currentStep === 'writing' && selectedTemplate && selectedClass) {
    return (
      <ReportWriter
        template={selectedTemplate}
        classData={selectedClass}
        students={studentsToWrite}
        onBack={handleBackToStudents}
        startStudentIndex={resumeStudentIndex} // Pass the resume index
      />
    );
  }

  // If we're selecting students, show student selection
  if (currentStep === 'students' && selectedTemplate && selectedClass) {
    return (
      <StudentSelector
        template={selectedTemplate}
        classData={selectedClass}
        onSelectStudents={handleStudentSelection}
        onBack={handleBackToClasses}
      />
    );
  }

  // If we're selecting a class, show class selector
  if (currentStep === 'class' && selectedTemplate) {
    return (
      <ClassSelector
        template={selectedTemplate}
        onSelectClass={handleClassSelect}
        onBack={handleBackToTemplates}
      />
    );
  }

  // Default: Template selection
  const classesWithReports = getClassesWithReports();

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
          Write Reports
        </h1>
        <p style={{ 
          color: '#6b7280', 
          margin: '8px 0 0 0',
          fontSize: '16px'
        }}>
          Select a template to start writing reports
        </p>
      </header>

      <main style={{ 
        maxWidth: '800px', 
        margin: '0 auto', 
        padding: '32px 24px' 
      }}>
        
        <Link to="/" style={{ textDecoration: 'none' }}>
          <button style={{
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
            ← Back to Home
          </button>
        </Link>

        {/* Continue Writing Reports Section */}
        {classesWithReports.length > 0 && (
          <div style={{
            backgroundColor: '#fef3c7',
            border: '2px solid #f59e0b',
            padding: '24px',
            borderRadius: '12px',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
            marginBottom: '24px'
          }}>
            <h2 style={{ 
              fontSize: '18px', 
              fontWeight: '600', 
              color: '#92400e',
              margin: '0 0 12px 0'
            }}>
              📝 Continue Writing Reports
            </h2>
            <p style={{ 
              color: '#92400e', 
              fontSize: '14px',
              margin: '0 0 16px 0'
            }}>
              You have {classesWithReports.length} class{classesWithReports.length > 1 ? 'es' : ''} with reports in progress.
            </p>
            <button
              onClick={() => navigate('/class-management')}
              style={{
                backgroundColor: '#f59e0b',
                color: 'white',
                padding: '12px 24px',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '500',
                cursor: 'pointer',
                width: '100%'
              }}
            >
              Continue Writing Reports →
            </button>
          </div>
        )}

        <div style={{
          backgroundColor: 'white',
          padding: '32px',
          borderRadius: '12px',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
          marginBottom: '24px'
        }}>

          {/* Create Template Button */}
          <div style={{ marginBottom: '32px' }}>
            <Link to="/create-template" style={{ textDecoration: 'none' }}>
              <button style={{
                backgroundColor: '#10b981',
                color: 'white',
                padding: '16px 32px',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '500',
                cursor: 'pointer',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                width: '100%'
              }}>
                Create New Template
              </button>
            </Link>
            <p style={{ 
              color: '#6b7280', 
              fontSize: '14px',
              margin: '8px 0 0 0',
              textAlign: 'center'
            }}>
              Build a new report template from scratch
            </p>
          </div>

          {/* Available Templates */}
          <h2 style={{ 
            fontSize: '20px', 
            fontWeight: '600', 
            color: '#111827',
            marginBottom: '16px'
          }}>
            Start New Reports - Select a Template ({state.templates.length})
          </h2>

          {state.templates.length === 0 ? (
            <div style={{
              border: '2px dashed #d1d5db',
              borderRadius: '8px',
              padding: '48px',
              textAlign: 'center',
              color: '#9ca3af'
            }}>
              <p style={{ margin: '0 0 8px 0' }}>No templates available yet.</p>
              <p style={{ margin: '0 0 16px 0' }}>Create your first template to start writing reports!</p>
              <Link to="/create-template" style={{ textDecoration: 'none' }}>
                <button style={{
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  padding: '12px 24px',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}>
                  Create Template
                </button>
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {state.templates.map((template) => (
                <div key={template.id} style={{
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  padding: '16px',
                  backgroundColor: '#fafafa',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#3b82f6';
                  e.currentTarget.style.backgroundColor = '#f8fafc';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#e5e7eb';
                  e.currentTarget.style.backgroundColor = '#fafafa';
                }}>
                  
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'flex-start',
                    marginBottom: '12px'
                  }}>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ 
                        fontSize: '18px', 
                        fontWeight: '600', 
                        color: '#111827',
                        margin: '0 0 8px 0'
                      }}>
                        {template.name}
                      </h3>
                      <div style={{
                        display: 'flex',
                        gap: '16px',
                        fontSize: '14px',
                        color: '#6b7280',
                        marginBottom: '8px'
                      }}>
                        <span>{template.sections.length} sections</span>
                        <span>Created: {new Date(template.createdAt).toLocaleDateString()}</span>
                      </div>
                      
                      {/* Template Sections Preview */}
                      <div style={{ 
                        display: 'flex', 
                        flexWrap: 'wrap', 
                        gap: '4px' 
                      }}>
                        {template.sections.slice(0, 5).map((section, index) => (
                          <span key={section.id} style={{
                            backgroundColor: '#e5e7eb',
                            color: '#374151',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: '500'
                          }}>
                            {getSectionDisplayName(section.type)}
                          </span>
                        ))}
                        {template.sections.length > 5 && (
                          <span style={{
                            color: '#6b7280',
                            fontSize: '11px'
                          }}>
                            +{template.sections.length - 5} more
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Select Button */}
                  <button
                    onClick={() => handleTemplateSelect(template)}
                    style={{
                      backgroundColor: '#3b82f6',
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
                    Use This Template
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

// Helper function to get section display names
function getSectionDisplayName(type: string) {
  const names: { [key: string]: string } = {
    'rated-comment': 'Rated',
    'standard-comment': 'Standard',
    'assessment-comment': 'Assessment',
    'personalised-comment': 'Personalised',
    'optional-additional-comment': 'Optional',
    'next-steps': 'Next Steps',
    'new-line': 'Line Break'
  };
  return names[type] || type;
}

// Component for student selection (we'll create this next)
function StudentSelector({ template, classData, onSelectStudents, onBack }: {
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
          ← Back to Class Selection
        </button>

        <div style={{
          backgroundColor: 'white',
          padding: '32px',
          borderRadius: '12px',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
          marginBottom: '24px'
        }}>

          {/* Write All Button */}
          <div style={{ marginBottom: '32px' }}>
            <button
              onClick={() => onSelectStudents('all')}
              style={{
                backgroundColor: '#10b981',
                color: 'white',
                padding: '16px 32px',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '500',
                cursor: 'pointer',
                width: '100%'
              }}
            >
              Write All Reports ({classData.students.length} students)
            </button>
            <p style={{ 
              color: '#6b7280', 
              fontSize: '14px',
              margin: '8px 0 0 0',
              textAlign: 'center'
            }}>
              Start writing reports for all students in alphabetical order
            </p>
          </div>

          {/* Student Selection */}
          <h3 style={{ 
            fontSize: '20px', 
            fontWeight: '600', 
            color: '#111827',
            marginBottom: '16px'
          }}>
            Or select specific students ({selectedStudentIds.length} selected)
          </h3>

          {/* Select/Deselect All Buttons */}
          <div style={{ 
            display: 'flex', 
            gap: '8px', 
            marginBottom: '16px' 
          }}>
            <button
              onClick={handleSelectAll}
              style={{
                backgroundColor: '#3b82f6',
                color: 'white',
                padding: '8px 16px',
                border: 'none',
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
                backgroundColor: '#6b7280',
                color: 'white',
                padding: '8px 16px',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              Deselect All
            </button>
          </div>

          {/* Student List */}
          <div style={{
            border: '2px solid #e5e7eb',
            borderRadius: '8px',
            maxHeight: '400px',
            overflowY: 'auto',
            marginBottom: '24px'
          }}>
            {classData.students
              .sort((a, b) => a.lastName.localeCompare(b.lastName))
              .map((student, index) => (
              <div key={student.id} style={{
                display: 'flex',
                alignItems: 'center',
                padding: '12px 16px',
                borderBottom: index < classData.students.length - 1 ? '1px solid #e5e7eb' : 'none',
                backgroundColor: selectedStudentIds.includes(student.id) ? '#eff6ff' : 
                  (index % 2 === 0 ? '#f9fafb' : 'white'),
                cursor: 'pointer'
              }}
              onClick={() => handleStudentToggle(student.id)}>
                <input
                  type="checkbox"
                  checked={selectedStudentIds.includes(student.id)}
                  onChange={() => handleStudentToggle(student.id)}
                  style={{
                    marginRight: '12px',
                    transform: 'scale(1.1)'
                  }}
                />
                <span style={{ fontWeight: '500' }}>
                  {student.firstName} {student.lastName}
                </span>
              </div>
            ))}
          </div>

          {/* Write Selected Button */}
          {selectedStudentIds.length > 0 && (
            <button
              onClick={() => onSelectStudents('selected', selectedStudentIds)}
              style={{
                backgroundColor: '#8b5cf6',
                color: 'white',
                padding: '16px 32px',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '500',
                cursor: 'pointer',
                width: '100%'
              }}
            >
              Write Selected Reports ({selectedStudentIds.length} students)
            </button>
          )}

        </div>
      </main>
    </div>
  );
}

export default WriteReports;
