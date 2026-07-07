import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { Template } from '../types';

export default function MobileManageTemplates() {
  const navigate = useNavigate();
  const { state, deleteTemplate, addTemplate } = useData();
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleEdit = (template: Template) => {
    navigate('/write-reports', { state: { templatePreview: template } });
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

  const handleDelete = (template: Template) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete the template "${template.name}"? This action cannot be undone.`
    );
    if (confirmed) {
      deleteTemplate(template.id);
      alert(`Template "${template.name}" has been deleted.`);
    }
  };

  const handleShare = (template: Template) => {
    const exportData = {
      template: template,
      exportedAt: new Date().toISOString(),
      exportedBy: 'Report Writing App',
      version: '1.0'
    };

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

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.json')) {
      alert('Please select a valid template file (.json)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const result = e.target?.result as string;
        const importData = JSON.parse(result);
        
        if (!importData.template || !importData.template.name || !importData.template.sections) {
          throw new Error('Invalid template file format');
        }

        const importedTemplate = importData.template;
        const existingTemplate = state.templates.find(t => t.name === importedTemplate.name);
        
        let templateName = importedTemplate.name;
        if (existingTemplate) {
          const shouldReplace = window.confirm(
            `A template named "${importedTemplate.name}" already exists. Do you want to replace it (OK) or import as a copy (Cancel)?`
          );
          
          if (shouldReplace) {
            deleteTemplate(existingTemplate.id);
          } else {
            templateName = `${importedTemplate.name} (Imported)`;
          }
        }

        const { id, createdAt, ...templateData } = importedTemplate;
        const newTemplateData = {
          ...templateData,
          name: templateName
        };

        addTemplate(newTemplateData);
        alert(`Template "${templateName}" has been imported successfully!`);
        
      } catch (error) {
        console.error('Import error:', error);
        alert('Error importing template. Please check that you selected a valid template file.');
      } finally {
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        setIsImporting(false);
      }
    };
    
    reader.onerror = () => {
      alert('Error reading file. Please try again.');
      setIsImporting(false);
    };
    
    setIsImporting(true);
    reader.readAsText(file);
  };

  // Inline styles to avoid CSS conflicts
  const styles = {
    container: {
      minHeight: '100vh',
      backgroundColor: '#f9fafb',
      padding: '0',
      margin: '0',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    },
    header: {
      backgroundColor: '#fff',
      padding: '16px',
      textAlign: 'center' as const,
      borderBottom: '1px solid #e5e7eb'
    },
    title: {
      fontSize: '20px',
      fontWeight: '600' as const,
      color: '#111827',
      margin: '0 0 4px 0'
    },
    subtitle: {
      fontSize: '14px',
      color: '#6b7280',
      margin: '0'
    },
    nav: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr 1fr',
      gap: '8px',
      padding: '16px',
      backgroundColor: '#fff'
    },
    navButton: {
      padding: '10px 8px !important' as any,
      border: 'none !important' as any,
      borderRadius: '6px !important' as any,
      fontSize: '11px !important' as any,
      fontWeight: '500' as any,
      color: '#fff !important' as any,
      textAlign: 'center' as const,
      textDecoration: 'none !important' as any,
      display: 'block !important' as any,
      cursor: 'pointer !important' as any,
      height: '40px !important' as any,
      lineHeight: '20px !important' as any,
      boxSizing: 'border-box' as any,
      minHeight: 'auto !important' as any,
      minWidth: 'auto !important' as any,
      fontFamily: 'inherit !important' as any
    },
    content: {
      padding: '16px'
    },
    card: {
      backgroundColor: '#fff',
      borderRadius: '8px',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      overflow: 'hidden'
    },
    cardHeader: {
      padding: '16px',
      borderBottom: '1px solid #e5e7eb',
      backgroundColor: '#f9fafb'
    },
    cardTitle: {
      fontSize: '16px',
      fontWeight: '600' as const,
      color: '#111827',
      margin: '0'
    },
    emptyState: {
      textAlign: 'center' as const,
      padding: '32px 16px',
      color: '#6b7280'
    },
    emptyIcon: {
      fontSize: '48px',
      marginBottom: '16px'
    },
    emptyTitle: {
      fontSize: '16px',
      fontWeight: '600' as const,
      color: '#374151',
      marginBottom: '8px'
    },
    emptyText: {
      fontSize: '14px',
      marginBottom: '20px'
    },
    emptyButtons: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '8px'
    },
    primaryButton: {
      backgroundColor: '#10b981 !important' as any,
      color: '#fff !important' as any,
      padding: '12px 16px !important' as any,
      border: 'none !important' as any,
      borderRadius: '6px !important' as any,
      fontSize: '14px !important' as any,
      fontWeight: '500' as any,
      cursor: 'pointer !important' as any,
      textDecoration: 'none !important' as any,
      textAlign: 'center' as const,
      display: 'block !important' as any,
      minHeight: 'auto !important' as any,
      minWidth: 'auto !important' as any,
      height: 'auto !important' as any,
      fontFamily: 'inherit !important' as any
    },
    secondaryButton: {
      backgroundColor: '#8b5cf6 !important' as any,
      color: '#fff !important' as any,
      padding: '12px 16px !important' as any,
      border: 'none !important' as any,
      borderRadius: '6px !important' as any,
      fontSize: '14px !important' as any,
      fontWeight: '500' as any,
      cursor: 'pointer !important' as any,
      textDecoration: 'none !important' as any,
      textAlign: 'center' as const,
      display: 'block !important' as any,
      minHeight: 'auto !important' as any,
      minWidth: 'auto !important' as any,
      height: 'auto !important' as any,
      fontFamily: 'inherit !important' as any
    },
    templateItem: {
      padding: '16px',
      borderBottom: '1px solid #f3f4f6'
    },
    templateName: {
      fontSize: '16px',
      fontWeight: '600' as const,
      color: '#111827',
      marginBottom: '4px'
    },
    templateMeta: {
      fontSize: '12px',
      color: '#6b7280',
      marginBottom: '8px'
    },
    templateActions: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr 1fr 1fr',
      gap: '4px',
      marginTop: '12px'
    },
    actionButton: {
      padding: '6px 4px !important' as any,
      border: 'none !important' as any,
      borderRadius: '4px !important' as any,
      fontSize: '10px !important' as any,
      fontWeight: '500' as any,
      cursor: 'pointer !important' as any,
      textAlign: 'center' as const,
      minHeight: 'auto !important' as any,
      minWidth: 'auto !important' as any,
      height: 'auto !important' as any,
      fontFamily: 'inherit !important' as any
    },
    hiddenInput: {
      display: 'none'
    }
  };

  return (
    <div style={styles.container}>
      {/* CSS Reset specifically for this component */}
      <style>{`
        .mobile-manage-isolated * {
          box-sizing: border-box !important;
        }
        .mobile-manage-isolated .nav-btn {
          background: #6b7280 !important;
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
        .mobile-manage-isolated .nav-btn.home { background: #6b7280 !important; }

        .mobile-manage-isolated .action-nav-btn {
          color: white !important;
          padding: 12px 14px !important;
          margin: 0 !important;
          border: none !important;
          border-radius: 6px !important;
          font-size: 13px !important;
          font-weight: 600 !important;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
          text-decoration: none !important;
          text-align: center !important;
          display: block !important;
          width: 100% !important;
          height: auto !important;
          cursor: pointer !important;
          min-height: auto !important;
          min-width: auto !important;
          box-shadow: none !important;
          outline: none !important;
        }
        .mobile-manage-isolated .action-nav-btn.ai-quick-build { background: #8b5cf6 !important; }
        .mobile-manage-isolated .action-nav-btn.template-wizard { background: #f59e0b !important; }
        .mobile-manage-isolated .action-nav-btn.start-reports { background: #10b981 !important; }
        .mobile-manage-isolated .action-nav-btn.continue-reports { background: #3b82f6 !important; }

        .mobile-manage-isolated .action-btn {
          color: white !important;
          padding: 8px 12px !important;
          margin: 0 !important;
          border: none !important;
          border-radius: 4px !important;
          font-size: 12px !important;
          font-weight: 500 !important;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
          text-decoration: none !important;
          text-align: center !important;
          display: block !important;
          width: 100% !important;
          height: auto !important;
          cursor: pointer !important;
          min-height: auto !important;
          min-width: auto !important;
          box-shadow: none !important;
          outline: none !important;
        }
        .mobile-manage-isolated .action-btn.edit { background: #3b82f6 !important; }
        .mobile-manage-isolated .action-btn.share { background: #10b981 !important; }
        .mobile-manage-isolated .action-btn.delete { background: #ef4444 !important; }
      `}</style>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileSelect}
        style={styles.hiddenInput}
      />

      {/* Everything wrapped in isolation class */}
      <div className="mobile-manage-isolated">
        {/* Header */}
        <div style={styles.header}>
          <h1 style={styles.title}>Manage Templates</h1>
          <p style={styles.subtitle}>Edit, share, and organize your templates</p>
        </div>

        {/* Navigation */}
        <div style={{ padding: '16px', backgroundColor: '#fff' }}>
          <Link to="/" className="nav-btn home" style={{ marginBottom: '10px' }}>
            Back to Home
          </Link>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button onClick={() => navigate('/import-template')} className="action-nav-btn ai-quick-build">
              ⚡ Create Template — AI Quick Build
            </button>
            <button onClick={() => navigate('/create-template', { state: { method: 'build-as-you-go' } })} className="action-nav-btn template-wizard">
              🧱 Create Template — Template Wizard
            </button>
            <button onClick={() => navigate('/start')} className="action-nav-btn start-reports">
              🚀 Start New Reports
            </button>
            {state.reports.length > 0 && (
              <button onClick={handleContinueReports} className="action-nav-btn continue-reports">
                ▶️ Continue Reports
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div style={styles.content}>
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h2 style={styles.cardTitle}>
                Your Templates ({state.templates.length})
              </h2>
            </div>

            {state.templates.length === 0 ? (
              <div style={styles.emptyState}>
                <div style={styles.emptyIcon}>📝</div>
                <h3 style={styles.emptyTitle}>No templates yet</h3>
                <p style={styles.emptyText}>
                  Get started by creating your first template.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <button onClick={() => navigate('/import-template')} className="action-nav-btn ai-quick-build">
                    Create Your First Template
                  </button>
                  <button onClick={handleImportClick} className="action-btn" style={{backgroundColor: '#3b82f6 !important'}}>
                    Import Template
                  </button>
                </div>
              </div>
            ) : (
              <div>
                {state.templates.map((template, index) => (
                  <div
                    key={template.id}
                    style={{
                      ...styles.templateItem,
                      borderBottom: index < state.templates.length - 1 ? '1px solid #f3f4f6' : 'none'
                    }}
                  >
                    <div style={styles.templateName}>{template.name}</div>
                    <div style={styles.templateMeta}>
                      {template.sections.length} sections • Created {new Date(template.createdAt).toLocaleDateString()}
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '4px', marginTop: '12px' }}>
                      <button
                        onClick={() => handleEdit(template)}
                        className="action-btn edit"
                        style={{fontSize: '9px !important', padding: '4px 2px !important'}}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleShare(template)}
                        className="action-btn share"
                        style={{fontSize: '9px !important', padding: '4px 2px !important'}}
                      >
                        Share
                      </button>
                      <button
                        onClick={() => handleDelete(template)}
                        className="action-btn delete"
                        style={{fontSize: '9px !important', padding: '4px 2px !important'}}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}