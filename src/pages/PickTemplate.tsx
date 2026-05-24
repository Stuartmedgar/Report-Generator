import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { Template } from '../types';
import PageNav from '../components/PageNav';

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
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>

      <PageNav />

      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" accept=".json" onChange={handleFileSelect} style={{ display: 'none' }} />

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: isMobile ? '32px 16px' : '48px 40px',
      }}>

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
            fontSize: isMobile ? '28px' : '40px', fontWeight: '800',
            color: '#1e293b', margin: '0 0 12px 0', lineHeight: '1.2'
          }}>
            Pick Your Template
          </h1>
          {selectedClass && (
            <p style={{ fontSize: '15px', color: '#64748b', margin: 0 }}>
              Writing reports for <strong>{selectedClass.name}</strong>
            </p>
          )}
        </div>

        <div style={{ width: '100%', maxWidth: '960px' }}>

          {/* Import from file */}
          <div style={{
            backgroundColor: 'white', borderRadius: '12px',
            padding: '20px 24px', marginBottom: '24px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', flexWrap: 'wrap', gap: '12px'
          }}>
            <div>
              <div style={{ fontSize: '15px', fontWeight: '600', color: '#1e293b' }}>
                Import from file
              </div>
              <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '2px' }}>
                Import a saved .json template file from your device
              </div>
            </div>
            <button
              onClick={handleImportClick}
              disabled={isImporting}
              style={{
                backgroundColor: '#3b82f6', color: 'white',
                padding: '10px 20px', border: 'none', borderRadius: '8px',
                fontSize: '14px', fontWeight: '600', cursor: 'pointer',
                opacity: isImporting ? 0.7 : 1
              }}
            >
              {isImporting ? 'Importing...' : '📂 Import File'}
            </button>
          </div>

          {/* Template list */}
          {state.templates.length === 0 ? (
            <div style={{
              backgroundColor: 'white', borderRadius: '16px',
              padding: '48px', textAlign: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📝</div>
              <p style={{ color: '#64748b', marginBottom: '8px', fontSize: '16px', fontWeight: '600' }}>
                No templates saved yet
              </p>
              <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '24px' }}>
                Import a file above or go back to create a template first.
              </p>
            </div>
          ) : (
            <div style={{
              backgroundColor: 'white', borderRadius: '16px',
              overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
            }}>
              <div style={{
                padding: '16px 24px', borderBottom: '1px solid #f1f5f9',
                fontSize: '13px', fontWeight: '600', color: '#94a3b8',
                textTransform: 'uppercase', letterSpacing: '0.05em'
              }}>
                Your Templates ({state.templates.length})
              </div>
              {state.templates.map((template, index) => (
                <div
                  key={template.id}
                  onClick={() => handleTemplateSelect(template)}
                  style={{
                    padding: '18px 24px',
                    borderBottom: index < state.templates.length - 1 ? '1px solid #f1f5f9' : 'none',
                    cursor: selectedClass ? 'pointer' : 'not-allowed',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    transition: 'background-color 0.15s',
                    opacity: selectedClass ? 1 : 0.5,
                  }}
                  onMouseEnter={e => {
                    if (selectedClass) (e.currentTarget as HTMLDivElement).style.backgroundColor = '#f8fafc';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLDivElement).style.backgroundColor = 'transparent';
                  }}
                >
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: '600', color: '#1e293b' }}>
                      {template.name}
                    </div>
                    <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '2px' }}>
                      {template.sections.length} sections · {new Date(template.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <span style={{ color: '#cbd5e1', fontSize: '18px' }}>›</span>
                </div>
              ))}
            </div>
          )}

          {!selectedClass && (
            <div style={{
              marginTop: '16px', padding: '12px 16px',
              backgroundColor: '#fef3c7', borderRadius: '8px',
              fontSize: '13px', color: '#92400e', textAlign: 'center'
            }}>
              ⚠️ No class selected — go back and select a class first.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PickTemplate;