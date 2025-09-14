import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useData } from '../../contexts/DataContext';
import { Template, Class } from '../../types';

interface TemplateSelectionProps {
  selectedTemplate: Template | null;
  selectedClass: Class | null;
  onTemplateSelect: (template: Template) => void;
  onClassSelect: (classData: Class) => void;
  onContinueToStudents: () => void;
  isMobile: boolean;
}

function TemplateSelection({ 
  selectedTemplate, 
  selectedClass, 
  onTemplateSelect, 
  onClassSelect, 
  onContinueToStudents, 
  isMobile 
}: TemplateSelectionProps) {
  const navigate = useNavigate();
  const { state } = useData();

  const getClassesWithReports = () => {
    return state.classes.filter(classData => {
      const classReports = state.reports.filter(report => report.classId === classData.id);
      return classReports.length > 0;
    });
  };

  const classesWithReports = getClassesWithReports();

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      
      {/* Header - Different for mobile vs desktop */}
      <header style={{ 
        backgroundColor: 'white', 
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        padding: isMobile ? '12px 16px' : '32px 24px'
      }}>
        <div style={{
          maxWidth: isMobile ? '100%' : '1200px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: isMobile ? '8px' : '16px'
        }}>
          
          {/* LEFT SIDE - Title and Step indicator */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <h1 style={{ 
              fontSize: isMobile ? '18px' : '28px',
              fontWeight: '600', 
              color: '#111827',
              margin: 0
            }}>
              {isMobile ? 'Select Template' : 'Write Reports'}
            </h1>
            
            {/* Mobile: Step indicator */}
            {isMobile && (
              <span style={{
                fontSize: '12px',
                backgroundColor: '#e0f2fe',
                color: '#0277bd',
                padding: '4px 8px',
                borderRadius: '12px',
                fontWeight: '500'
              }}>
                Step 1 of 3
              </span>
            )}
            
            {/* Mobile: Small home icon */}
            {isMobile && (
              <Link to="/" style={{ textDecoration: 'none', marginLeft: 'auto' }}>
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
            )}
          </div>
          
          {/* DESKTOP SUBTITLE - Hidden on mobile */}
          {!isMobile && (
            <p style={{ 
              color: '#6b7280', 
              margin: '8px 0 0 0',
              fontSize: '16px',
              position: 'absolute',
              left: '24px',
              top: '70px'
            }}>
              Select a template and class to start writing reports
            </p>
          )}
          
          {/* RIGHT SIDE - Action buttons (desktop only) */}
          {!isMobile && (
            <div style={{
              display: 'flex',
              gap: '12px',
              flexWrap: 'wrap',
              alignItems: 'center'
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
                    cursor: 'pointer'
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
            </div>
          )}
        </div>
      </header>

      <main style={{ 
        maxWidth: isMobile ? '100%' : '1200px', 
        margin: '0 auto', 
        padding: isMobile ? '16px' : '32px 24px'
      }}>
        
        {/* DESKTOP: Selection Progress */}
        {!isMobile && (selectedTemplate || selectedClass) && (
          <div style={{
            backgroundColor: '#f0f9ff',
            border: '2px solid #3b82f6',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '24px',
            textAlign: 'center'
          }}>
            {selectedTemplate && selectedClass && (
              <button
                onClick={onContinueToStudents}
                style={{
                  backgroundColor: '#10b981',
                  color: 'white',
                  padding: '16px 32px',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                  marginBottom: '8px',
                  display: 'block',
                  margin: '0 auto 8px auto'
                }}
              >
                Continue to Student Selection →
              </button>
            )}
            <p style={{ 
              color: '#6b7280', 
              fontSize: '14px',
              margin: '8px 0 0 0'
            }}>
              Using "{selectedTemplate?.name || '...'}" template with "{selectedClass?.name || '...'}" class
            </p>
          </div>
        )}

        {/* MOBILE: Template Selection Only */}
        {isMobile ? (
          <div>
            {/* Back to Home button - top left */}
            <Link to="/" style={{ textDecoration: 'none', display: 'inline-block', marginBottom: '16px' }}>
              <button style={{
                backgroundColor: '#6b7280',
                color: 'white',
                padding: '8px 12px',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                ← Home
              </button>
            </Link>

            <div style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
              overflow: 'hidden'
            }}>
              <div style={{
                padding: '16px',
                borderBottom: '1px solid #e5e7eb',
                backgroundColor: '#f9fafb'
              }}>
                <h3 style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#111827',
                  margin: 0
                }}>
                  Select a Template for your reports
                </h3>
              </div>
              
              {state.templates.length === 0 ? (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '32px 16px'
                }}>
                  <p style={{ 
                    color: '#6b7280', 
                    marginBottom: '16px',
                    fontSize: '14px'
                  }}>
                    No templates found
                  </p>
                  <Link to="/create-template" style={{ textDecoration: 'none' }}>
                    <button style={{
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      padding: '12px 20px',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer'
                    }}>
                      Create Your First Template
                    </button>
                  </Link>
                </div>
              ) : (
                state.templates.map((template, index) => (
                  <div
                    key={template.id}
                    onClick={() => onTemplateSelect(template)}
                    style={{
                      padding: '16px',
                      borderBottom: index < state.templates.length - 1 ? '1px solid #f3f4f6' : 'none',
                      cursor: 'pointer',
                      backgroundColor: 'white',
                      transition: 'background-color 0.2s'
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div>
                        <div style={{
                          fontSize: '16px',
                          fontWeight: '600',
                          color: '#111827',
                          marginBottom: '4px'
                        }}>
                          {template.name}
                        </div>
                        <div style={{
                          fontSize: '13px',
                          color: '#6b7280',
                          marginBottom: '2px'
                        }}>
                          {template.sections.length} sections
                        </div>
                        <div style={{
                          fontSize: '12px',
                          color: '#9ca3af'
                        }}>
                          {new Date(template.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div style={{
                        fontSize: '18px',
                        color: '#3b82f6'
                      }}>
                        →
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          /* DESKTOP: Template and Class Selection Grid */
          <>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '32px',
              marginBottom: '32px'
            }}>
              
              {/* Template Selection */}
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
                  📝 Select Template
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
                    backgroundColor: '#eff6ff',
                    border: '1px solid #3b82f6',
                    borderRadius: '6px',
                    padding: '12px',
                    marginBottom: '16px'
                  }}>
                    <div style={{ fontSize: '14px', color: '#1e40af', fontWeight: '600' }}>
                      Selected: {selectedTemplate.name}
                    </div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>
                      {selectedTemplate.sections.length} sections
                    </div>
                  </div>
                )}

                {state.templates.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '32px' }}>
                    <p style={{ color: '#6b7280', marginBottom: '16px' }}>No templates found</p>
                    <Link to="/create-template" style={{ textDecoration: 'none' }}>
                      <button style={{
                        backgroundColor: '#3b82f6',
                        color: 'white',
                        padding: '12px 20px',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '14px',
                        fontWeight: '500',
                        cursor: 'pointer'
                      }}>
                        Create Your First Template
                      </button>
                    </Link>
                  </div>
                ) : (
                  <div style={{ 
                    maxHeight: '300px', 
                    overflowY: 'auto',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px'
                  }}>
                    {state.templates.map((template) => (
                      <div
                        key={template.id}
                        onClick={() => onTemplateSelect(template)}
                        style={{
                          padding: '12px',
                          borderBottom: '1px solid #f3f4f6',
                          cursor: 'pointer',
                          backgroundColor: selectedTemplate?.id === template.id ? '#eff6ff' : 'transparent',
                          transition: 'background-color 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          if (selectedTemplate?.id !== template.id) {
                            e.currentTarget.style.backgroundColor = '#f9fafb';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (selectedTemplate?.id !== template.id) {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }
                        }}
                      >
                        <div style={{ 
                          fontWeight: selectedTemplate?.id === template.id ? '600' : '500',
                          color: selectedTemplate?.id === template.id ? '#1e40af' : '#111827',
                          fontSize: '14px',
                          marginBottom: '4px'
                        }}>
                          {template.name}
                          <span style={{
                            marginLeft: '8px',
                            fontSize: '11px',
                            backgroundColor: selectedTemplate?.id === template.id ? '#bfdbfe' : '#f3f4f6',
                            color: selectedTemplate?.id === template.id ? '#1e40af' : '#6b7280',
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

              {/* Class Selection */}
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
                  <div style={{ textAlign: 'center', padding: '32px' }}>
                    <p style={{ color: '#6b7280', marginBottom: '16px' }}>No classes found</p>
                    <Link to="/class-management" style={{ textDecoration: 'none' }}>
                      <button style={{
                        backgroundColor: '#10b981',
                        color: 'white',
                        padding: '12px 20px',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '14px',
                        fontWeight: '500',
                        cursor: 'pointer'
                      }}>
                        Create Your First Class
                      </button>
                    </Link>
                  </div>
                ) : (
                  <div style={{ 
                    maxHeight: '300px', 
                    overflowY: 'auto',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px'
                  }}>
                    {state.classes.map((classData) => (
                      <div
                        key={classData.id}
                        onClick={() => onClassSelect(classData)}
                        style={{
                          padding: '12px',
                          borderBottom: '1px solid #f3f4f6',
                          cursor: 'pointer',
                          backgroundColor: selectedClass?.id === classData.id ? '#f0fdf4' : 'transparent',
                          transition: 'background-color 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          if (selectedClass?.id !== classData.id) {
                            e.currentTarget.style.backgroundColor = '#f9fafb';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (selectedClass?.id !== classData.id) {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }
                        }}
                      >
                        <div style={{ 
                          fontWeight: selectedClass?.id === classData.id ? '600' : '500',
                          color: selectedClass?.id === classData.id ? '#059669' : '#111827',
                          fontSize: '14px',
                          marginBottom: '4px'
                        }}>
                          {classData.name}
                          <span style={{
                            marginLeft: '8px',
                            fontSize: '11px',
                            backgroundColor: selectedClass?.id === classData.id ? '#bbf7d0' : '#f3f4f6',
                            color: selectedClass?.id === classData.id ? '#059669' : '#6b7280',
                            padding: '2px 6px',
                            borderRadius: '4px'
                          }}>
                            {classData.students.length} students
                          </span>
                        </div>
                        <p style={{ 
                          color: '#6b7280', 
                          fontSize: '12px',
                          margin: '0 0 4px 0' 
                        }}>
                          {new Date(classData.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Help Section - Desktop Only */}
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
              <div style={{
                display: 'flex',
                gap: '16px',
                justifyContent: 'center',
                flexWrap: 'wrap'
              }}>
                <Link to="/manage-templates" style={{ textDecoration: 'none' }}>
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
            </div>
          </>
        )}

        {/* MOBILE: Help Section */}
        {isMobile && (
          <div style={{
            backgroundColor: '#f0f9ff',
            border: '2px solid #3b82f6',
            borderRadius: '8px',
            padding: '16px',
            textAlign: 'center',
            marginTop: '20px'
          }}>
            <h3 style={{ 
              fontSize: '16px', 
              fontWeight: '600', 
              color: '#1e40af',
              margin: '0 0 8px 0'
            }}>
              💡 Need Help?
            </h3>
            <p style={{ 
              color: '#1e40af', 
              fontSize: '14px',
              margin: '0 0 16px 0'
            }}>
              Choose a template above to get started. Need to create templates first?
            </p>
            <div style={{
              display: 'flex',
              gap: '8px',
              justifyContent: 'center',
              flexWrap: 'wrap'
            }}>
              <Link to="/create-template" style={{ textDecoration: 'none' }}>
                <button style={{
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  padding: '8px 12px',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}>
                  Create Template
                </button>
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default TemplateSelection;