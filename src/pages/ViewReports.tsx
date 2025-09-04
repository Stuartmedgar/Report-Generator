import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext';

export default function ViewReports() {
  const navigate = useNavigate();
  const { state, deleteReport } = useData();

  // Get classes that have reports
  const classesWithReports = state.classes.filter(classItem => 
    state.reports.some(report => report.classId === classItem.id)
  );

  // Get report count for each class
  const getReportCount = (classId: string) => {
    return state.reports.filter(report => report.classId === classId).length;
  };

  // Get unique templates used in reports for a class
  const getTemplatesUsed = (classId: string) => {
    const classReports = state.reports.filter(report => report.classId === classId);
    const templateIds = Array.from(new Set(classReports.map(report => report.templateId)));
    return templateIds.map(id => state.templates.find(t => t.id === id)?.name || 'Unknown Template');
  };

  // Get last updated date for class reports
  const getLastUpdated = (classId: string) => {
    const classReports = state.reports.filter(report => report.classId === classId);
    if (classReports.length === 0) return null;
    
    const mostRecent = classReports.reduce((latest, current) => {
      return new Date(current.updatedAt) > new Date(latest.updatedAt) ? current : latest;
    });
    
    return new Date(mostRecent.updatedAt);
  };

  const handleDeleteClassReports = (classId: string, className: string) => {
    const reportCount = getReportCount(classId);
    const confirmed = window.confirm(
      `Are you sure you want to delete all ${reportCount} reports for "${className}"? This action cannot be undone.`
    );
    
    if (confirmed) {
      // Delete all reports for this class
      const reportsToDelete = state.reports.filter(report => report.classId === classId);
      reportsToDelete.forEach(report => deleteReport(report.id));
      
      alert(`Deleted ${reportCount} reports for "${className}"`);
    }
  };

  const handleViewClassReports = (classId: string) => {
    navigate(`/view-reports/${classId}`);
  };

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
              View Reports
            </h1>
            <p style={{ 
              color: '#6b7280', 
              margin: '8px 0 0 0',
              fontSize: '16px'
            }}>
              View, edit, and download completed reports for your classes
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
            
            <Link to="/write-reports" style={{ textDecoration: 'none' }}>
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
                📝 Write Reports
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
                👥 Manage Classes
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

        {/* Classes with Reports */}
        <div style={{
          backgroundColor: 'white',
          padding: '32px',
          borderRadius: '12px',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
        }}>
          <h2 style={{ 
            fontSize: '20px', 
            fontWeight: '600', 
            color: '#111827',
            marginBottom: '16px'
          }}>
            Classes with Reports ({classesWithReports.length})
          </h2>

          {classesWithReports.length === 0 ? (
            <div style={{
              border: '2px dashed #d1d5db',
              borderRadius: '8px',
              padding: '48px',
              textAlign: 'center',
              color: '#9ca3af'
            }}>
              <p style={{ margin: '0 0 8px 0' }}>No reports have been created yet.</p>
              <p style={{ margin: '0 0 16px 0' }}>Start writing reports to see them here!</p>
              <Link to="/write-reports" style={{ textDecoration: 'none' }}>
                <button style={{
                  backgroundColor: '#10b981',
                  color: 'white',
                  padding: '12px 24px',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}>
                  Start Writing Reports
                </button>
              </Link>
            </div>
          ) : (
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
              gap: '16px'
            }}>
              {classesWithReports.map((classItem) => {
                const reportCount = getReportCount(classItem.id);
                const templatesUsed = getTemplatesUsed(classItem.id);
                const lastUpdated = getLastUpdated(classItem.id);
                
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
                        marginBottom: '8px',
                        flexWrap: 'wrap'
                      }}>
                        <span>📝 {reportCount} reports</span>
                        <span>👥 {classItem.students.length} students</span>
                        {lastUpdated && (
                          <span>⏰ Updated: {lastUpdated.toLocaleDateString()}</span>
                        )}
                      </div>

                      {/* Templates used */}
                      <div style={{
                        fontSize: '12px',
                        color: '#6b7280'
                      }}>
                        Templates: {templatesUsed.slice(0, 2).join(', ')}
                        {templatesUsed.length > 2 && ` +${templatesUsed.length - 2} more`}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div style={{ 
                      display: 'grid',
                      gridTemplateColumns: 'repeat(2, 1fr)',
                      gap: '8px',
                      marginBottom: '8px'
                    }}>
                      <button
                        onClick={() => handleViewClassReports(classItem.id)}
                        style={{
                          backgroundColor: '#3b82f6',
                          color: 'white',
                          padding: '12px 16px',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '14px',
                          fontWeight: '500',
                          cursor: 'pointer'
                        }}
                      >
                        📊 View All Reports
                      </button>
                      
                      <button
                        onClick={() => navigate(`/view-reports/${classItem.id}/all`)}
                        style={{
                          backgroundColor: '#10b981',
                          color: 'white',
                          padding: '12px 16px',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '14px',
                          fontWeight: '500',
                          cursor: 'pointer'
                        }}
                      >
                        📄 View Summary
                      </button>
                    </div>

                    <div style={{ 
                      display: 'grid',
                      gridTemplateColumns: 'repeat(2, 1fr)',
                      gap: '8px'
                    }}>
                      <button
                        onClick={() => {
                          // Navigate to write reports and continue editing
                          sessionStorage.setItem('continueEditing', JSON.stringify({
                            classId: classItem.id,
                            templateId: state.reports.find(r => r.classId === classItem.id)?.templateId,
                            studentIndex: 0
                          }));
                          navigate('/write-reports');
                        }}
                        style={{
                          backgroundColor: '#f59e0b',
                          color: 'white',
                          padding: '12px 16px',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '14px',
                          fontWeight: '500',
                          cursor: 'pointer'
                        }}
                      >
                        ✏️ Continue Writing
                      </button>
                      
                      <button
                        onClick={() => handleDeleteClassReports(classItem.id, classItem.name)}
                        style={{
                          backgroundColor: '#ef4444',
                          color: 'white',
                          padding: '12px 16px',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '14px',
                          fontWeight: '500',
                          cursor: 'pointer'
                        }}
                      >
                        🗑️ Delete Reports
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
            💡 Report Viewing Guide
          </h3>
          <p style={{ 
            color: '#1e40af', 
            fontSize: '14px',
            margin: '0 0 16px 0'
          }}>
            Click "View All Reports" to see individual student reports, or "View Summary" to see all reports in one document. 
            You can continue writing more reports or delete existing ones as needed.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/write-reports" style={{ textDecoration: 'none' }}>
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
                Write New Reports
              </button>
            </Link>
            <Link to="/class-management" style={{ textDecoration: 'none' }}>
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
                Manage Classes
              </button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}