import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext';

export default function MobileViewReports() {
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

  const handleViewClassReports = (classId: string) => {
    navigate(`/view-reports/${classId}`);
  };

  const handleViewSummary = (classId: string) => {
    navigate(`/view-reports/${classId}/summary`);
  };

  const handleContinueWriting = (classId: string) => {
    const classData = state.classes.find(c => c.id === classId);
    if (!classData) return;

    const classReports = state.reports.filter(report => report.classId === classId);
    if (classReports.length === 0) return;

    const mostRecentReport = classReports.reduce((latest, current) => {
      return new Date(current.updatedAt) > new Date(latest.updatedAt) ? current : latest;
    });

    const studentIndex = classData.students.findIndex(
      student => student.id === mostRecentReport.studentId
    );

    sessionStorage.setItem('continueEditing', JSON.stringify({
      classId: classId,
      templateId: mostRecentReport.templateId,
      studentIndex: studentIndex >= 0 ? studentIndex : 0
    }));

    navigate('/write-reports');
  };

  const handleDeleteClassReports = (classId: string, className: string) => {
    const reportCount = getReportCount(classId);
    const confirmed = window.confirm(
      `Are you sure you want to delete all ${reportCount} reports for "${className}"? This action cannot be undone.`
    );
    
    if (confirmed) {
      const reportsToDelete = state.reports.filter(report => report.classId === classId);
      reportsToDelete.forEach(report => deleteReport(report.id));
      alert(`Deleted ${reportCount} reports for "${className}"`);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      
      {/* Isolated CSS for this component */}
      <style>{`
        .mobile-view-reports-isolated * {
          box-sizing: border-box !important;
        }
        .mobile-view-reports-isolated .nav-btn {
          color: white !important;
          padding: 8px 6px !important;
          margin: 0 !important;
          border: none !important;
          border-radius: 4px !important;
          font-size: 11px !important;
          font-weight: 500 !important;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
          text-decoration: none !important;
          text-align: center !important;
          display: block !important;
          width: 100% !important;
          height: 32px !important;
          line-height: 16px !important;
          cursor: pointer !important;
          min-height: auto !important;
          min-width: auto !important;
          box-shadow: none !important;
          outline: none !important;
        }
        .mobile-view-reports-isolated .nav-btn.home { background: #6b7280 !important; }
        
        .mobile-view-reports-isolated .action-btn {
          color: white !important;
          padding: 6px 8px !important;
          margin: 0 !important;
          border: none !important;
          border-radius: 4px !important;
          font-size: 11px !important;
          font-weight: 500 !important;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
          text-decoration: none !important;
          text-align: center !important;
          display: block !important;
          width: 100% !important;
          cursor: pointer !important;
          min-height: auto !important;
          min-width: auto !important;
          box-shadow: none !important;
          outline: none !important;
        }
        .mobile-view-reports-isolated .action-btn.view { background: #3b82f6 !important; }
        .mobile-view-reports-isolated .action-btn.summary { background: #8b5cf6 !important; }
        .mobile-view-reports-isolated .action-btn.continue { background: #f59e0b !important; }
        .mobile-view-reports-isolated .action-btn.delete { background: #ef4444 !important; }
      `}</style>

      <div className="mobile-view-reports-isolated">
        {/* Header */}
        <div style={{ backgroundColor: '#fff', padding: '16px', textAlign: 'center', borderBottom: '1px solid #e5e7eb' }}>
          <h1 style={{ fontSize: '20px', fontWeight: '600', color: '#111827', margin: '0 0 4px 0' }}>
            View Reports
          </h1>
          <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
            View and manage your reports
          </p>
        </div>

        {/* Navigation */}
        <div style={{ padding: '16px', backgroundColor: '#fff' }}>
          <Link to="/" className="nav-btn home">
            Back to Home
          </Link>
        </div>

        {/* Content */}
        <div style={{ padding: '16px' }}>
          <div style={{ backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)', overflow: 'hidden' }}>
            <div style={{ padding: '16px', borderBottom: '1px solid #e5e7eb', backgroundColor: '#f9fafb' }}>
              <h2 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', margin: 0 }}>
                Classes with Reports ({classesWithReports.length})
              </h2>
            </div>

            {classesWithReports.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 16px', color: '#6b7280' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>📝</div>
                <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                  No reports yet
                </h3>
                <p style={{ fontSize: '14px', marginBottom: '20px' }}>
                  Write your first report to get started!
                </p>
                <Link to="/write-reports" style={{ textDecoration: 'none' }}>
                  <button
                    style={{
                      backgroundColor: '#10b981',
                      color: '#fff',
                      padding: '12px 20px',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      width: '100%',
                      maxWidth: '200px'
                    }}
                  >
                    Write Reports
                  </button>
                </Link>
              </div>
            ) : (
              <div>
                {classesWithReports.map((classItem, index) => {
                  const reportCount = getReportCount(classItem.id);
                  
                  return (
                    <div
                      key={classItem.id}
                      style={{
                        padding: '16px',
                        borderBottom: index < classesWithReports.length - 1 ? '1px solid #f3f4f6' : 'none'
                      }}
                    >
                      <div style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '4px' }}>
                        {classItem.name}
                      </div>
                      <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '12px' }}>
                        {reportCount} reports • {classItem.students.length} students
                      </div>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
                        <button
                          onClick={() => handleViewClassReports(classItem.id)}
                          className="action-btn view"
                        >
                          View All
                        </button>
                        <button
                          onClick={() => handleViewSummary(classItem.id)}
                          className="action-btn summary"
                        >
                          Summary
                        </button>
                        <button
                          onClick={() => handleContinueWriting(classItem.id)}
                          className="action-btn continue"
                        >
                          Continue
                        </button>
                        <button
                          onClick={() => handleDeleteClassReports(classItem.id, classItem.name)}
                          className="action-btn delete"
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
        </div>
      </div>
    </div>
  );
}