import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import CreateClass from '../components/CreateClass';
import ClassDetail from '../components/ClassDetail';
import MobileClassManagement from '../components/MobileClassManagement';

export default function ClassManagement() {
  const navigate = useNavigate();
  const { state, deleteClass } = useData();
  const [showCreateClass, setShowCreateClass] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleCreateClassComplete = () => {
    setShowCreateClass(false);
    alert('Class has been created successfully!');
  };

  const handleDeleteClass = (classId: string, className: string) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete the class "${className}"? This will also delete all reports for this class. This action cannot be undone.`
    );
    if (confirmed) {
      deleteClass(classId);
      alert(`Class "${className}" has been deleted.`);
    }
  };

  const handleViewClass = (classId: string) => {
    setSelectedClassId(classId);
  };

  const handleBackFromClassDetail = () => {
    setSelectedClassId(null);
  };

  // Get last student worked on for continue editing feature
  const getLastStudentWorkedOn = (classData: any) => {
    const classReports = state.reports.filter(report => report.classId === classData.id);
    if (classReports.length === 0) return null;

    // Find the most recent report
    const mostRecentReport = classReports.reduce((latest, current) => {
      return new Date(current.updatedAt) > new Date(latest.updatedAt) ? current : latest;
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

  // Mobile view
  if (isMobile) {
    return (
      <MobileClassManagement 
        onViewClass={handleViewClass}
        onCreateClass={() => setShowCreateClass(true)}
      />
    );
  }

  // Desktop view - PRESERVED EXACTLY AS ORIGINAL
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      {/* Header with consistent layout */}
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
              Class Management
            </h1>
            <p style={{ 
              color: '#6b7280', 
              margin: '8px 0 0 0',
              fontSize: '16px'
            }}>
              Create and manage your student classes
            </p>
          </div>
          
          <div style={{
            display: 'flex',
            gap: '12px',
            flexWrap: 'wrap'
          }}>
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
            
            <button
              onClick={() => setShowCreateClass(true)}
              style={{
                backgroundColor: '#10b981',
                color: 'white',
                padding: '12px 20px',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              + Create New Class
            </button>

            <Link to="/write-reports" style={{ textDecoration: 'none' }}>
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
                📝 Write Reports
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

        {/* Classes List */}
        <div style={{
          backgroundColor: 'white',
          padding: '32px',
          borderRadius: '12px',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
          marginBottom: '32px'
        }}>
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
              <p style={{ margin: '0 0 16px 0' }}>Create your first class to start managing students!</p>
              <button
                onClick={() => setShowCreateClass(true)}
                style={{
                  backgroundColor: '#10b981',
                  color: 'white',
                  padding: '12px 24px',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                Create Your First Class
              </button>
            </div>
          ) : (
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
              gap: '16px'
            }}>
              {state.classes.map((classItem) => {
                const reportCount = state.reports.filter(r => r.classId === classItem.id).length;
                const lastWorked = getLastStudentWorkedOn(classItem);
                
                return (
                  <div key={classItem.id} style={{
                    border: '2px solid #e5e7eb',
                    borderRadius: '12px',
                    padding: '20px',
                    backgroundColor: 'white',
                    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)'
                  }}>
                    {/* Class Header */}
                    <div style={{ marginBottom: '16px' }}>
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
                        <span>👥 {classItem.students.length} students</span>
                        <span>📅 Created: {new Date(classItem.createdAt).toLocaleDateString()}</span>
                      </div>

                      {reportCount > 0 && (
                        <div style={{
                          backgroundColor: '#fef3c7',
                          color: '#92400e',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: '500',
                          display: 'inline-block'
                        }}>
                          📝 {reportCount} reports written
                        </div>
                      )}
                      
                      {/* Show first few student names */}
                      {classItem.students.length > 0 && (
                        <div style={{
                          fontSize: '12px',
                          color: '#6b7280',
                          marginTop: '8px'
                        }}>
                          Students: {classItem.students
                            .sort((a, b) => a.lastName.localeCompare(b.lastName))
                            .slice(0, 3)
                            .map(s => `${s.firstName} ${s.lastName}`)
                            .join(', ')}
                          {classItem.students.length > 3 && ` +${classItem.students.length - 3} more`}
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div style={{ 
                      display: 'grid',
                      gridTemplateColumns: 'repeat(2, 1fr)',
                      gap: '8px',
                      marginBottom: '8px'
                    }}>
                      <button
                        onClick={() => handleViewClass(classItem.id)}
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
                        👀 View Details
                      </button>
                      
                      <button
                        onClick={() => navigate(`/view-reports/${classItem.id}`)}
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
                        📊 View Reports
                      </button>
                    </div>

                    <div style={{ 
                      display: 'grid',
                      gridTemplateColumns: reportCount > 0 ? 'repeat(2, 1fr)' : '1fr',
                      gap: '8px'
                    }}>
                      {reportCount > 0 && (
                        <button
                          onClick={() => handleContinueEditing(classItem)}
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
                          ✏️ Continue Editing
                        </button>
                      )}
                      
                      <button
                        onClick={() => handleDeleteClass(classItem.id, classItem.name)}
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
                        🗑️ Delete Class
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Help Section */}
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
            💡 Class Management Tips
          </h3>
          <p style={{ 
            color: '#1e40af', 
            fontSize: '14px',
            margin: '0 0 16px 0'
          }}>
            Create classes by adding students individually or importing from a CSV file. 
            You can edit student details, continue writing reports, or view completed reports for each class.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/write-reports" style={{ textDecoration: 'none' }}>
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
                Start Writing Reports
              </button>
            </Link>
            <Link to="/manage-templates" style={{ textDecoration: 'none' }}>
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
                Manage Templates
              </button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}