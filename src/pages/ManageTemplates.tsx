import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { Template } from '../types';
import MobileManageTemplates from '../components/MobileManageTemplates';
import PageNav from '../components/PageNav';

export default function ManageTemplates() {
  const navigate = useNavigate();
  const { state, deleteTemplate } = useData();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIfMobile = () => setIsMobile(window.innerWidth <= 768);
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  if (isMobile) return <MobileManageTemplates />;

  const handleEdit = (template: Template) => {
    navigate('/write-reports', { state: { templatePreview: template } });
  };

  const handleDelete = (template: Template) => {
    const confirmed = window.confirm(`Are you sure you want to delete the template "${template.name}"? This action cannot be undone.`);
    if (confirmed) {
      deleteTemplate(template.id);
      alert(`Template "${template.name}" has been deleted.`);
    }
  };

  const handleShare = (template: Template) => {
    const exportData = { template, exportedAt: new Date().toISOString(), exportedBy: 'Report Writing App', version: '1.0' };
    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${template.name.replace(/[^a-z0-9]/gi, '_')}_template.json`;
    a.click();
    URL.revokeObjectURL(url);
    alert(`Template "${template.name}" has been exported! Share the downloaded file with others.`);
  };

  // ─── Continue writing the most recently updated report, same behaviour as
  //     the Home screen's "Continue Writing" button ───────────────────────────
  const handleContinueReports = () => {
    if (state.reports.length === 0) return;

    const mostRecentReport = state.reports.reduce((latest, current) =>
      new Date(current.updatedAt || current.createdAt) > new Date(latest.updatedAt || latest.createdAt)
        ? current : latest
    );

    const classId = mostRecentReport.classId;
    const classData = state.classes.find(c => c.id === classId);
    if (!classData) { navigate('/no-reports'); return; }

    const studentIndex = classData.students.findIndex(s => s.id === mostRecentReport.studentId);
    sessionStorage.setItem('continueEditing', JSON.stringify({
      classId,
      templateId: mostRecentReport.templateId,
      studentIndex: studentIndex >= 0 ? studentIndex : 0
    }));
    navigate('/write-reports');
  };

  const actionBtnStyle = (color: string): React.CSSProperties => ({
    backgroundColor: color, color: 'white', padding: '8px 16px',
    border: 'none', borderRadius: '6px', fontSize: '14px',
    fontWeight: '500', cursor: 'pointer'
  });

  const topBtnStyle = (color: string): React.CSSProperties => ({
    backgroundColor: color, color: 'white', padding: '10px 18px',
    border: 'none', borderRadius: '8px', fontSize: '14px',
    fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap'
  });

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      <PageNav />

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px' }}>

        {/* Page title + action buttons */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '12px' }}>
          <h1 style={{ fontSize: '26px', fontWeight: '700', color: '#111827', margin: 0 }}>
            Report Templates
          </h1>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={() => navigate('/import-template')}
              style={topBtnStyle('#8b5cf6')}
            >
              ⚡ Create Template — AI Quick Build
            </button>
            <button
              onClick={() => navigate('/create-template', { state: { method: 'build-as-you-go' } })}
              style={topBtnStyle('#f59e0b')}
            >
              🧱 Create Template — Template Wizard
            </button>
            <button
              onClick={() => navigate('/start')}
              style={topBtnStyle('#10b981')}
            >
              🚀 Start New Reports
            </button>
            {state.reports.length > 0 && (
              <button
                onClick={handleContinueReports}
                style={topBtnStyle('#3b82f6')}
              >
                ▶️ Continue Reports
              </button>
            )}
          </div>
        </div>

        {/* Templates list */}
        <div style={{ backgroundColor: 'white', padding: '28px', borderRadius: '12px', boxShadow: '0 1px 3px 0 rgba(0,0,0,0.08)' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 16px 0' }}>
            Your Templates ({state.templates.length})
          </h2>

          {state.templates.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#6b7280' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📝</div>
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>No templates yet</h3>
              <p style={{ marginBottom: '24px' }}>Get started by creating your first template.</p>
              <button
                onClick={() => navigate('/import-template')}
                style={{ backgroundColor: '#8b5cf6', color: 'white', padding: '12px 24px', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: '500', cursor: 'pointer' }}
              >
                + Create Your First Template
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '12px' }}>
              {state.templates.map((template) => (
                <div key={template.id} style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '20px', backgroundColor: '#f9fafb' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: '200px' }}>
                      <h3 style={{ fontSize: '17px', fontWeight: '600', color: '#111827', marginBottom: '6px' }}>
                        {template.name}
                      </h3>
                      <p style={{ color: '#6b7280', fontSize: '13px', marginBottom: '8px' }}>
                        {template.sections.length} sections · Created {new Date(template.createdAt).toLocaleDateString()}
                      </p>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {template.sections.slice(0, 3).map((section, index) => (
                          <span key={index} style={{ backgroundColor: '#e0e7ff', color: '#3730a3', padding: '2px 8px', borderRadius: '4px', fontSize: '12px' }}>
                            {section.type.replace('-', ' ')}
                          </span>
                        ))}
                        {template.sections.length > 3 && <span style={{ color: '#6b7280', fontSize: '12px' }}>+{template.sections.length - 3} more</span>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <button onClick={() => handleEdit(template)} style={actionBtnStyle('#3b82f6')}>✏️ Edit</button>
                      <button onClick={() => handleShare(template)} style={actionBtnStyle('#10b981')}>📤 Share</button>
                      <button onClick={() => handleDelete(template)} style={actionBtnStyle('#ef4444')}>🗑️ Delete</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </main>
    </div>
  );
}
