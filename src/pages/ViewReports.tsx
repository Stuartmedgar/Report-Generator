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
    <div style={{ 
      padding: '20px', 
      maxWidth: '1000px', 
      margin: '0 auto',
      fontFamily: 'Arial, sans-serif'
    }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <h1 style={{ 
          fontSize: '24px', 
          fontWeight: 'bold', 
          color: '#1f2937',
          margin: 0 
        }}>
          View Reports
        </h1>
        <Link 
          to="/" 
          style={{
            backgroundColor: '#6b7280',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '6px',
            textDecoration: 'none',
            fontSize: '14px'
          }}
        >
          Back to Home
        </Link>
      </div>

      {/* Instructions */}
      <div style={{
        backgroundColor: '#f0f9ff',
        border: '1px solid #bfdbfe',
        borderRadius: '8px',
        padding: '16px',
        marginBottom: '24px'
      }}>
        <h3 style={{ 
          fontSize: '16px', 
          fontWeight: '600', 
          color: '#1e40af',
          margin: '0 0 8px 0'
        }}>
          Select a class to see reports
        </h3>
        <p style={{ 
          color: '#1e40af', 
          fontSize: '14px',
          margin: 0
        }}>
          Choose a class below to view individual reports or all reports for that class. You can also delete all reports for a class if needed.
        </p>
      </div>

      {/* Classes with Reports */}
      {classesWithReports.length === 0 ? (
        <div style={{
          backgroundColor: '#f9fafb',
          border: '2px dashed #d1d5db',
          borderRadius: '8px',
          padding: '48px',
          textAlign: 'center'
        }}>
          <div style={{ 
            fontSize: '48px', 
            marginBottom: '16px',
            color: '#9ca3af'
          }}>
            📄
          </div>
          <h3 style={{ 
            fontSize: '18px', 
            fontWeight: '600', 
            color: '#374151',
            margin: '0 0 8px 0'
          }}>
            No Reports Found
          </h3>
          <p style={{ 
            color: '#6b7280', 
            fontSize: '14px',
            margin: '0 0 16px 0'
          }}>
            No reports have been created yet. Use "Write Reports" to create some reports first.
          </p>
          <Link 
            to="/write-reports"
            style={{
              backgroundColor: '#3b82f6',
              color: 'white',
              padding: '12px 24px',
              borderRadius: '6px',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: '600'
            }}
          >
            Write Reports
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {classesWithReports.map((classItem) => {
            const reportCount = getReportCount(classItem.id);
            const students = classItem.students || [];
            
            return (
              <div key={classItem.id} style={{
                backgroundColor: 'white',
                border: '2px solid #e5e7eb',
                borderRadius: '12px',
                padding: '24px',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
              }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'flex-start',
                  marginBottom: '16px'
                }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ 
                      fontSize: '20px', 
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
                      marginBottom: '12px'
                    }}>
                      <span>👥 {students.length} students</span>
                      <span>📄 {reportCount} reports</span>
                      <span>📅 Created: {new Date(classItem.createdAt).toLocaleDateString()}</span>
                    </div>
                    
                    {/* Show completion status */}
                    <div style={{
                      backgroundColor: reportCount === students.length ? '#dcfce7' : '#fef3c7',
                      color: reportCount === students.length ? '#166534' : '#92400e',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: '600',
                      display: 'inline-block'
                    }}>
                      {reportCount === students.length ? '✅ All reports complete' : `⚠️ ${students.length - reportCount} reports missing`}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div style={{ 
                  display: 'flex', 
                  gap: '12px', 
                  flexWrap: 'wrap' 
                }}>
                  <button
                    onClick={() => handleViewClassReports(classItem.id)}
                    style={{
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      padding: '10px 20px',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    👁️ View Reports
                  </button>
                  
                  <button
                    onClick={() => handleDeleteClassReports(classItem.id, classItem.name)}
                    style={{
                      backgroundColor: '#ef4444',
                      color: 'white',
                      padding: '10px 20px',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    🗑️ Delete All Reports
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Summary Stats */}
      {classesWithReports.length > 0 && (
        <div style={{
          backgroundColor: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          padding: '16px',
          marginTop: '24px'
        }}>
          <h4 style={{ 
            fontSize: '14px', 
            fontWeight: '600', 
            color: '#374151',
            margin: '0 0 8px 0'
          }}>
            Report Summary
          </h4>
          <div style={{
            display: 'flex',
            gap: '24px',
            fontSize: '14px',
            color: '#6b7280'
          }}>
            <span>📚 {classesWithReports.length} classes with reports</span>
            <span>📄 {state.reports.length} total reports</span>
            <span>👥 {classesWithReports.reduce((total, c) => total + (c.students?.length || 0), 0)} total students</span>
          </div>
        </div>
      )}
    </div>
  );
}