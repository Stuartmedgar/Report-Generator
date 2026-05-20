import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { Template } from '../types';

function PickTemplate() {
  const { state, addTemplate, deleteTemplate } = useData();
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const selectedClassId = sessionStorage.getItem('selectedClassId');
  const selectedClass = state.classes.find(c => c.id === selectedClassId) || null;

  const handleTemplateSelect = (template: Template) => {
    if (!selectedClass) return;
    sessionStorage.setItem('continueEditing', JSON.stringify({
      classId: selectedClass.id,
      templateId: template.id,
      studentIndex: 0
    }));
    navigate('/write-reports');
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
        addTemplate({ ...templateData, name: templateName });
        alert(`Template "${templateName}" imported successfully! You can now select it below.`);

      } catch (error) {
        console.error('Import error:', error);
        alert('Error importing template. Please check that you selected a valid template file.');
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = '';
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

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: isMobile ? '32px 16px' : '48px 40px',
    }}>
      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" accept=".json" onChange={handleFileSelect} style={{ display: 'none' }} />

      {/* Back */}
      <div style={{ width: '100%', maxWidth: '960px', marginBottom: '24px' }}>
        <Link to="/step2" style={{ color: '#6b7280', textDecoration: 'none', fontSize: '14px' }}>
          ← Back
        </Link>
      </div>

      {/* Step indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '28px' }}>
        <div style={{
          width: '32px', height: '32px', borderRadius: '50%',
          backgroundColor: '#10b981', color: 'white',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '16px', fontWeight: '700'
        }}>✓</div>
        <div style={{ width: '48px', height: '3px', backgroundColor: '#10b981', borderRadius: '2px' }} />
        <div style={{
          width: '32px', height: '32px', borderRadius: '50%',
          backgroundColor: '#10b981', color: 'white',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '16px', fontWeight: '700'
        }}>✓</div>
      </div>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '36px', maxWidth: '680px', width: '100%' }}>
        <p style={{
          fontSize: '13px', fontWeight: '600', color: '#8b5cf6',
          textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 10px 0'
        }}>
          Step 2 — Select a Template
        </p>
        <h1 style={{
          fontSize: isMobile ? '28px' : '36px', fontWeight: '800',
          color: '#1e293b', margin: '0 0 10px 0', lineHeight: '1.2'
        }}>
          Choose Your Template
        </h1>
        {selectedClass && (
          <p style={{ fontSize: '16px', color: '#64748b', margin: 0 }}>
            Writing reports for <strong style={{ color: '#1e293b' }}>{selectedClass.name}</strong>
          </p>
        )}
      </div>

      <div style={{ width: '100%', maxWidth: '960px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* Import from file */}
        <div style={{
          backgroundColor: 'white', borderRadius: '14px',
          padding: isMobile ? '20px' : '24px 32px',
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: isMobile ? 'flex-start' : 'center',
          justifyContent: 'space-between',
          gap: '16px'
        }}>
          <div>
            <div style={{ fontSize: '15px', fontWeight: '700', color: '#1e293b', marginBottom: '4px' }}>
              📂 Import a template from file
            </div>
            <div style={{ fontSize: '13px', color: '#64748b' }}>
              Got a .json template file from a colleague? Import it here and select it below.
            </div>
          </div>
          <button
            onClick={handleImportClick}
            disabled={isImporting}
            style={{
              backgroundColor: '#3b82f6', color: 'white',
              padding: '10px 22px', border: 'none', borderRadius: '8px',
              fontSize: '14px', fontWeight: '600',
              cursor: isImporting ? 'not-allowed' : 'pointer',
              opacity: isImporting ? 0.7 : 1,
              whiteSpace: 'nowrap', flexShrink: 0
            }}
          >
            {isImporting ? 'Importing...' : 'Import File'}
          </button>
        </div>

        {/* Template list */}
        {state.templates.length === 0 ? (
          <div style={{
            backgroundColor: 'white', borderRadius: '14px',
            padding: '56px 32px', textAlign: 'center',
            boxShadow: '0 1px 4px rgba(0,0,0,0.06)'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📝</div>
            <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#1e293b', marginBottom: '8px' }}>
              No templates yet
            </h3>
            <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '28px' }}>
              You need to create a template before you can write reports.
            </p>
            <Link to="/get-template" style={{ textDecoration: 'none' }}>
              <button style={{
                backgroundColor: '#8b5cf6', color: 'white',
                padding: '13px 32px', border: 'none', borderRadius: '10px',
                fontSize: '15px', fontWeight: '600', cursor: 'pointer'
              }}>
                ✨ Create a Template
              </button>
            </Link>
          </div>
        ) : (
          <div style={{
            backgroundColor: 'white', borderRadius: '14px',
            boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden'
          }}>
            <div style={{ padding: '20px 32px', borderBottom: '1px solid #f1f5f9' }}>
              <div style={{ fontSize: '15px', fontWeight: '700', color: '#1e293b' }}>
                Your Saved Templates
              </div>
              <div style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
                {state.templates.length} {state.templates.length === 1 ? 'template' : 'templates'} — click one to start writing
              </div>
            </div>

            {state.templates.map((template, index) => (
              <div
                key={template.id}
                onClick={() => handleTemplateSelect(template)}
                style={{
                  padding: isMobile ? '16px 20px' : '20px 32px',
                  borderBottom: index < state.templates.length - 1 ? '1px solid #f1f5f9' : 'none',
                  cursor: 'pointer',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  gap: '16px',
                  transition: 'background-color 0.15s'
                }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#f8fafc'; }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                <div>
                  <div style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b', marginBottom: '4px' }}>
                    {template.name}
                  </div>
                  <div style={{ fontSize: '13px', color: '#64748b' }}>
                    {template.sections.length} sections
                    {template.createdAt && ` · Created ${new Date(template.createdAt).toLocaleDateString()}`}
                  </div>
                </div>
                <div style={{
                  fontSize: '14px', color: '#10b981', fontWeight: '600',
                  flexShrink: 0, display: 'flex', alignItems: 'center', gap: '6px'
                }}>
                  Write reports →
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Link to create a new template */}
        {state.templates.length > 0 && (
          <div style={{ textAlign: 'center' }}>
            <Link to="/get-template" style={{
              color: '#8b5cf6', textDecoration: 'none', fontSize: '14px', fontWeight: '500'
            }}>
              + Create a new template instead
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default PickTemplate;