import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import MobileViewReports from '../components/MobileViewReports';
import PageNav from '../components/PageNav';

export default function ViewReports() {
  const navigate = useNavigate();
  const { state, deleteReport } = useData();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const classesWithReports = state.classes.filter(classItem =>
    state.reports.some(report => report.classId === classItem.id)
  );

  const getReportCount = (classId: string) =>
    state.reports.filter(report => report.classId === classId).length;

  const getTemplatesUsed = (classId: string) => {
    const classReports = state.reports.filter(report => report.classId === classId);
    const templateIds = Array.from(new Set(classReports.map(report => report.templateId)));
    return templateIds.map(id => state.templates.find(t => t.id === id)?.name || 'Unknown Template');
  };

  const getLastUpdated = (classId: string) => {
    const classReports = state.reports.filter(report => report.classId === classId);
    if (classReports.length === 0) return null;
    const mostRecent = classReports.reduce((latest, current) =>
      new Date(current.updatedAt) > new Date(latest.updatedAt) ? current : latest
    );
    return new Date(mostRecent.updatedAt);
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

  const handleContinueWriting = (classId: string) => {
    const classData = state.classes.find(c => c.id === classId);
    if (!classData) return;
    const classReports = state.reports.filter(report => report.classId === classId);
    if (classReports.length === 0) return;
    const mostRecentReport = classReports.reduce((latest, current) =>
      new Date(current.updatedAt) > new Date(latest.updatedAt) ? current : latest
    );
    const studentIndex = classData.students.findIndex(
      student => student.id === mostRecentReport.studentId
    );
    sessionStorage.setItem('continueEditing', JSON.stringify({
      classId,
      templateId: mostRecentReport.templateId,
      studentIndex: studentIndex >= 0 ? studentIndex : 0
    }));
    navigate('/write-reports');
  };

  if (isMobile) return <MobileViewReports />;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      <PageNav />

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px' }}>

        <h1 style={{
          fontSize: '28px', fontWeight: '700', color: '#111827',
          margin: '0 0 24px 0'
        }}>
          View Reports
        </h1>

        {classesWithReports.length === 0 ? (
          <div style={{
            backgroundColor: 'white', borderRadius: '12px',
            border: '2px dashed #d1d5db', padding: '48px',
            textAlign: 'center', color: '#9ca3af'
          }}>
            <p style={{ margin: '0 0 8px 0' }}>No reports created yet.</p>
            <p style={{ margin: '0 0 16px 0' }}>Write your first report to get started!</p>
            <Link to="/start" style={{ textDecoration: 'none' }}>
              <button style={{
                backgroundColor: '#10b981', color: 'white',
                padding: '12px 24px', border: 'none', borderRadius: '8px',
                fontSize: '16px', fontWeight: '500', cursor: 'pointer'
              }}>
                Start Writing Reports
              </button>
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {classesWithReports.map((classItem) => {
              const reportCount = getReportCount(classItem.id);
              const templatesUsed = getTemplatesUsed(classItem.id);
              const lastUpdated = getLastUpdated(classItem.id);

              return (
                <div key={classItem.id} style={{
                  backgroundColor: 'white',
                  borderRadius: '12px',
                  border: '1px solid #e5e7eb',
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                }}>
                  {/* Class info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '4px' }}>
                      {classItem.name}
                    </div>
                    <div style={{ fontSize: '13px', color: '#6b7280', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                      <span>📝 {reportCount} report{reportCount !== 1 ? 's' : ''}</span>
                      <span>👥 {classItem.students.length} students</span>
                      {lastUpdated && <span>⏰ {lastUpdated.toLocaleDateString()}</span>}
                      {templatesUsed.length > 0 && (
                        <span style={{ color: '#9ca3af' }}>
                          {templatesUsed.slice(0, 2).join(', ')}{templatesUsed.length > 2 ? ` +${templatesUsed.length - 2} more` : ''}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action buttons — all on one line */}
                  <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                    <button
                      onClick={() => navigate(`/view-reports/${classItem.id}`)}
                      style={{
                        backgroundColor: '#3b82f6', color: 'white',
                        padding: '8px 14px', border: 'none', borderRadius: '6px',
                        fontSize: '13px', fontWeight: '500', cursor: 'pointer',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      📋 View Reports
                    </button>

                    <button
                      onClick={() => handleContinueWriting(classItem.id)}
                      style={{
                        backgroundColor: '#f59e0b', color: 'white',
                        padding: '8px 14px', border: 'none', borderRadius: '6px',
                        fontSize: '13px', fontWeight: '500', cursor: 'pointer',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      ✏️ Continue Writing
                    </button>

                    <button
                      onClick={() => handleDeleteClassReports(classItem.id, classItem.name)}
                      style={{
                        backgroundColor: '#fee2e2', color: '#ef4444',
                        padding: '8px 14px', border: 'none', borderRadius: '6px',
                        fontSize: '13px', fontWeight: '500', cursor: 'pointer',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}