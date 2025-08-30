import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import CreateClass from '../components/CreateClass';
import ClassDetail from '../components/ClassDetail';

function ClassManagement() {
  const navigate = useNavigate();
  const { state, deleteClass } = useData();
  const [showCreateClass, setShowCreateClass] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);

  const handleDeleteClass = (classId: string, className: string) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete the class "${className}"? This will also delete all reports for this class. This action cannot be undone.`
    );
    if (confirmed) {
      deleteClass(classId);
    }
  };

  const handleCreateClassComplete = () => {
    setShowCreateClass(false);
  };

  const handleClassSelect = (classId: string) => {
    setSelectedClassId(classId);
  };

  const handleBackFromClassDetail = () => {
    setSelectedClassId(null);
  };

  // Check if a class has reports in progress
  const getClassReportStatus = (classData: any) => {
    const classReports = state.reports.filter(report => report.classId === classData.id);
    const totalStudents = classData.students.length;
    const studentsWithReports = new Set(classReports.map(report => report.studentId)).size;
    
    return {
      hasReports: classReports.length > 0,
      completed: studentsWithReports,
      total: totalStudents,
      lastReportTime: classReports.length > 0 
        ? Math.max(...classReports.map(report => new Date(report.createdAt || 0).getTime()))
        : null
    };
  };

  // Get the last student worked on for continue editing
  const getLastStudentWorkedOn = (classData: any) => {
    const classReports = state.reports.filter(report => report.classId === classData.id);
    if (classReports.length === 0) return null;

    // Find the most recent report
    const mostRecentReport = classReports.reduce((latest, current) => {
      const latestTime = new Date(latest.createdAt || 0).getTime();
      const currentTime = new Date(current.createdAt || 0).getTime();
      return currentTime > latestTime ? current : latest;
    });

    // Find the student index
    const studentIndex = classData.students.findIndex(
      (student: any) => student.id === mostRecentReport.studentId
    );

    return {
      studentIndex: studentIndex >= 0 ? studentIndex : 0,
      templateId: mostRecentReport.templateId,
      student: classData.students[studentIndex >= 0 ? studentIndex : 0]
    };
  };

  // Continue editing reports for a class
  const handleContinueEditing = (classData: any) => {
    const lastWorked = getLastStudentWorkedOn(classData);
    if (!lastWorked) return;

    // Store the continue editing info in sessionStorage for the WriteReports page to pick up
    sessionStorage.setItem('continueEditing', JSON.stringify({
      classId: classData.id,
      templateId: lastWorked.templateId,
      studentIndex: lastWorked.studentIndex
    }));

    // Navigate to write reports page
    navigate('/write-reports');
  };

  // Show Create Class page
  if (showCreateClass) {
    return (
      <CreateClass 
        onComplete={handleCreateClassComplete}
        onCancel={() => setShowCreateClass(false)}
      />
    );
  }

  // Show specific class detail page
  if (selectedClassId) {
    const selectedClass = state.classes.find(c => c.id === selectedClassId);
    if (selectedClass) {
      return (
        <ClassDetail 
          classData={selectedClass}
          onBack={handleBackFromClassDetail}
        />
      );
    }
  }

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
          Class Management
        </h1>
        <p style={{ 
          color: '#6b7280', 
          margin: '8px 0 0 0',
          fontSize: '16px'
        }}>
          Create and manage your student classes
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

        <div style={{
          backgroundColor: 'white',
          padding: '32px',
          borderRadius: '12px',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
          marginBottom: '24px'
        }}>
          
          {/* Create New Class Button */}
          <div style={{ marginBottom: '32px' }}>
            <button
              onClick={() => setShowCreateClass(true)}
              style={{
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
              }}
            >
              Create New Class
            </button>
            <p style={{ 
              color: '#6b7280', 
              fontSize: '14px',
              margin: '8px 0 0 0',
              textAlign: 'center'
            }}>
              Add a new class and import your student list
            </p>
          </div>

          {/* Current Classes */}
          <h2 style={{ 
            fontSize: '20px', 
            fontWeight: '600', 
            color: '#111827',
            marginBottom: '16px'
          }}>
            Your Classes ({state.classes.length})
          </h2>

          {state.classes.length === 0 ? (
            <div style={{
              border: '2px dashed #d1d5db',
              borderRadius: '8px',
              padding: '48px',
              textAlign: 'center',
              color: '#9ca3af'
            }}>
              <p style={{ margin: '0 0 8px 0' }}>No classes created yet.</p>
              <p style={{ margin: 0 }}>Create your first class to get started!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {state.classes.map((classItem) => {
                const reportStatus = getClassReportStatus(classItem);
                const lastWorked = getLastStudentWorkedOn(classItem);
                
                return (
                  <div key={classItem.id} style={{
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
                      <div 
                        style={{ flex: 1, cursor: 'pointer' }}
                        onClick={() => handleClassSelect(classItem.id)}
                      >
                        <h3 style={{ 
                          fontSize: '18px', 
                          fontWeight: '600', 
                          color: '#111827',
                          margin: '0 0 8px 0'
                        }}>
                          {classItem.name}
                        </h3>
                        <div style={{
                          display: 'flex',
                          gap: '16px',
                          fontSize: '14px',
                          color: '#6b7280',
                          marginBottom: '8px'
                        }}>
                          <span>{classItem.students.length} students</span>
                          <span>Created: {new Date(classItem.createdAt).toLocaleDateString()}</span>
                        </div>
                        
                        {/* Report Status */}
                        {reportStatus.hasReports && (
                          <div style={{
                            display: 'flex',
                            gap: '16px',
                            fontSize: '14px',
                            color: '#059669'
                          }}>
                            <span>📝 Reports: {reportStatus.completed}/{reportStatus.total} completed</span>
                            {lastWorked && (
                              <span>👤 Last: {lastWorked.student?.firstName} {lastWorked.student?.lastName}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div style={{ 
                      display: 'flex', 
                      gap: '8px', 
                      flexWrap: 'wrap' 
                    }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleClassSelect(classItem.id);
                        }}
                        style={{
                          backgroundColor: '#3b82f6',
                          color: 'white',
                          padding: '8px 16px',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '14px',
                          fontWeight: '500',
                          cursor: 'pointer'
                        }}
                      >
                        View Students ({classItem.students.length})
                      </button>
                      
                      {/* Continue Editing Button - only show if reports exist */}
                      {reportStatus.hasReports && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleContinueEditing(classItem);
                          }}
                          style={{
                            backgroundColor: '#f59e0b',
                            color: 'white',
                            padding: '8px 16px',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '14px',
                            fontWeight: '500',
                            cursor: 'pointer'
                          }}
                        >
                          Continue Editing
                        </button>
                      )}
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/view-reports/${classItem.id}`);
                        }}
                        style={{
                          backgroundColor: '#8b5cf6',
                          color: 'white',
                          padding: '8px 16px',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '14px',
                          fontWeight: '500',
                          cursor: 'pointer'
                        }}
                      >
                        View Reports
                      </button>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClass(classItem.id, classItem.name);
                        }}
                        style={{
                          backgroundColor: '#ef4444',
                          color: 'white',
                          padding: '8px 16px',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '14px',
                          fontWeight: '500',
                          cursor: 'pointer'
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default ClassManagement;