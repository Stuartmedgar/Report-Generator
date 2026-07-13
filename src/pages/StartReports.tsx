// src/pages/StartReports.tsx
// Replaces: StartReports, SelectClass, Step2Template, GetTemplate, SelectTemplate, PickTemplate
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { Class, Template } from '../types';
import PageNav from '../components/PageNav';

type Step = 'class' | 'template';

function StartReports() {
  const { state, addTemplate, deleteTemplate } = useData();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [step, setStep] = useState<Step>('class');
  const [templateView, setTemplateView] = useState<'options' | 'existing'>('options');
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // If we were sent here after creating/picking a class elsewhere (e.g. the
  // "Create New Class" flow on /class-management), jump straight to the
  // template step for that class instead of making the teacher pick it again.
  useEffect(() => {
    const pendingClassId = sessionStorage.getItem('selectedClassId');
    if (!pendingClassId) return;
    const cls = state.classes.find(c => c.id === pendingClassId);
    if (cls) {
      sessionStorage.removeItem('selectedClassId');
      handleClassSelect(cls);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.classes]);

  // ─── Handlers ────────────────────────────────────────────────────────────

  const handleClassSelect = (cls: Class) => {
    setSelectedClass(cls);
    setTemplateView('options');
    setStep('template');
  };

  const handleTemplateSelect = (template: Template) => {
    if (!selectedClass) return;
    sessionStorage.setItem('continueEditing', JSON.stringify({
      classId: selectedClass.id,
      templateId: template.id,
      studentIndex: 0,
    }));
    navigate('/write-reports');
  };

  const handleImportClick = () => fileInputRef.current?.click();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith('.json')) { alert('Please select a valid template file (.json)'); return; }
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importData = JSON.parse(e.target?.result as string);
        if (!importData.template?.name || !importData.template?.sections) throw new Error('Invalid format');
        const importedTemplate = importData.template;
        const existing = state.templates.find(t => t.name === importedTemplate.name);
        let templateName = importedTemplate.name;
        if (existing) {
          const replace = window.confirm(`"${importedTemplate.name}" already exists. Replace it (OK) or import as copy (Cancel)?`);
          if (replace) deleteTemplate(existing.id);
          else templateName = `${importedTemplate.name} (Imported)`;
        }
        const { id, createdAt, ...templateData } = importedTemplate;
        addTemplate({ ...templateData, name: templateName });
        alert(`Template "${templateName}" imported! Select it below.`);
      } catch {
        alert('Error importing template. Please check the file is valid.');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  // ─── Styles ───────────────────────────────────────────────────────────────

  const containerStyle: React.CSSProperties = {
    minHeight: '100vh',
    backgroundColor: '#f8fafc',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  };

  const contentStyle: React.CSSProperties = {
    maxWidth: '720px',
    margin: '0 auto',
    padding: isMobile ? '24px 16px' : '40px 24px',
  };

  const stepIndicatorStyle = (active: boolean, done: boolean): React.CSSProperties => ({
    width: '32px', height: '32px', borderRadius: '50%',
    backgroundColor: done ? '#10b981' : active ? '#8b5cf6' : '#e2e8f0',
    color: done || active ? 'white' : '#94a3b8',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '14px', fontWeight: '700', flexShrink: 0,
  });

  const cardStyle: React.CSSProperties = {
    backgroundColor: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    padding: '16px 20px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    transition: 'border-color 0.15s, box-shadow 0.15s',
    marginBottom: '8px',
  };

  const primaryBtnStyle = (color: string): React.CSSProperties => ({
    backgroundColor: color,
    color: 'white',
    padding: '12px 20px',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    width: '100%',
    textAlign: 'left',
  });

  const bigBtnStyle = (color: string): React.CSSProperties => ({
    backgroundColor: color,
    color: 'white',
    border: 'none',
    padding: isMobile ? '32px 22px' : '40px 24px',
    borderRadius: isMobile ? '12px' : '16px',
    cursor: 'pointer',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    width: '100%',
    boxSizing: 'border-box',
    transition: 'transform 0.2s, box-shadow 0.2s',
  });

  const optionBtnStyle = (color: string): React.CSSProperties => ({
    backgroundColor: color,
    color: 'white',
    padding: '14px 20px',
    border: 'none',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    width: '100%',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    textAlign: 'left',
    lineHeight: '1.4',
    marginBottom: '10px',
  });

  // ─── Step 1: Select Class ─────────────────────────────────────────────────

  const renderClassStep = () => (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: isMobile ? '26px' : '32px', fontWeight: '800', color: '#1e293b', margin: '0 0 6px 0' }}>
            Choose a Class
          </h1>
          <p style={{ fontSize: '15px', color: '#64748b', margin: 0 }}>
            Select the class you want to write reports for.
          </p>
        </div>
        <Link to="/class-management?create=true" style={{ textDecoration: 'none', flexShrink: 0 }}>
          <button style={{
            backgroundColor: '#8b5cf6', color: 'white',
            padding: '10px 16px', border: 'none', borderRadius: '8px',
            fontSize: '14px', fontWeight: '600', cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}>
            + New Class
          </button>
        </Link>
      </div>

      {state.classes.length === 0 ? (
        <div style={{ backgroundColor: 'white', border: '2px dashed #d1d5db', borderRadius: '12px', padding: '40px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>👥</div>
          <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b', margin: '0 0 8px 0' }}>No classes yet</h3>
          <p style={{ fontSize: '14px', color: '#64748b', margin: '0 0 20px 0' }}>
            Add your students to get started.
          </p>
          <Link to="/class-management?create=true" style={{ textDecoration: 'none' }}>
            <button style={{ backgroundColor: '#8b5cf6', color: 'white', padding: '12px 24px', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: '600', cursor: 'pointer' }}>
              + Add a Class
            </button>
          </Link>
        </div>
      ) : (
        <div>
          {state.classes.map((cls) => (
            <div
              key={cls.id}
              onClick={() => handleClassSelect(cls)}
              style={cardStyle}
              onMouseEnter={e => {
                (e.currentTarget as HTMLDivElement).style.borderColor = '#8b5cf6';
                (e.currentTarget as HTMLDivElement).style.boxShadow = '0 0 0 3px rgba(139,92,246,0.1)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLDivElement).style.borderColor = '#e5e7eb';
                (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
              }}
            >
              <div>
                <div style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b' }}>{cls.name}</div>
                <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '2px' }}>
                  {cls.students.length} student{cls.students.length !== 1 ? 's' : ''}
                </div>
              </div>
              <span style={{ color: '#cbd5e1', fontSize: '20px' }}>›</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // ─── Step 2a: Choose how to get a template ───────────────────────────────

  const renderTemplateOptions = () => (
    <div>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: isMobile ? '26px' : '32px', fontWeight: '800', color: '#1e293b', margin: '0 0 8px 0' }}>
          Choose a Template
        </h1>
        <p style={{ fontSize: '15px', color: '#64748b', margin: 0 }}>
          Writing reports for <strong>{selectedClass?.name}</strong>.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: isMobile ? '14px' : '20px' }}>

        <button
          onClick={() => navigate('/import-template', { state: { classId: selectedClass?.id } })}
          style={{ ...bigBtnStyle('#8b5cf6'), boxShadow: '0 4px 14px rgba(139,92,246,0.35)' }}
          onMouseEnter={e => { if (!isMobile) { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 10px 24px rgba(139,92,246,0.45)'; } }}
          onMouseLeave={e => { if (!isMobile) { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(139,92,246,0.35)'; } }}
        >
          <span style={{ fontSize: '30px' }}>⚡</span>
          <span style={{ fontSize: isMobile ? '18px' : '20px', fontWeight: '800' }}>AI Quick Build</span>
          <span style={{ fontSize: '13px', fontWeight: '500', opacity: 0.88 }}>Paste your reports — AI builds a template in ~2 min</span>
        </button>

        <button
          onClick={() => navigate('/create-template', { state: { method: 'build-as-you-go', classId: selectedClass?.id } })}
          style={{ ...bigBtnStyle('#f59e0b'), boxShadow: '0 4px 14px rgba(245,158,11,0.35)' }}
          onMouseEnter={e => { if (!isMobile) { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 10px 24px rgba(245,158,11,0.45)'; } }}
          onMouseLeave={e => { if (!isMobile) { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(245,158,11,0.35)'; } }}
        >
          <span style={{ fontSize: '30px' }}>🧱</span>
          <span style={{ fontSize: isMobile ? '18px' : '20px', fontWeight: '800' }}>Template Wizard</span>
          <span style={{ fontSize: '13px', fontWeight: '500', opacity: 0.88 }}>Build your template section by section</span>
        </button>

        <button
          onClick={() => setTemplateView('existing')}
          style={{ ...bigBtnStyle('#3b82f6'), boxShadow: '0 4px 14px rgba(59,130,246,0.35)' }}
          onMouseEnter={e => { if (!isMobile) { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 10px 24px rgba(59,130,246,0.45)'; } }}
          onMouseLeave={e => { if (!isMobile) { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(59,130,246,0.35)'; } }}
        >
          <span style={{ fontSize: '30px' }}>📁</span>
          <span style={{ fontSize: isMobile ? '18px' : '20px', fontWeight: '800' }}>Already Got a Template</span>
          <span style={{ fontSize: '13px', fontWeight: '500', opacity: 0.88 }}>Use a saved template, import a file, or pick a prebuilt one</span>
        </button>

      </div>
    </div>
  );

  // ─── Step 2b: Use an existing / imported / prebuilt template ────────────

  const renderExistingTemplates = () => (
    <div>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: isMobile ? '26px' : '32px', fontWeight: '800', color: '#1e293b', margin: '0 0 8px 0' }}>
          Choose a Template
        </h1>
        <p style={{ fontSize: '15px', color: '#64748b', margin: 0 }}>
          Writing reports for <strong>{selectedClass?.name}</strong>.
          {state.templates.length > 0 ? ' Select a template below.' : ' You don’t have any saved templates yet.'}
        </p>
      </div>

      {/* Existing templates */}
      {state.templates.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <p style={{ fontSize: '13px', fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 10px 0' }}>
            Your Templates
          </p>
          {/* Scrollable list — capped at ~4 templates so create options stay visible */}
          <div style={{
            maxHeight: '260px',
            overflowY: state.templates.length > 3 ? 'auto' : 'visible',
            borderRadius: '12px',
            border: state.templates.length > 3 ? '1px solid #e5e7eb' : 'none',
            paddingRight: state.templates.length > 3 ? '2px' : 0,
          }}>
            {state.templates.map((template) => (
              <div
                key={template.id}
                onClick={() => handleTemplateSelect(template)}
                style={{
                  ...cardStyle,
                  borderRadius: '10px',
                  marginBottom: '6px',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = '#10b981';
                  (e.currentTarget as HTMLDivElement).style.boxShadow = '0 0 0 3px rgba(16,185,129,0.1)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = '#e5e7eb';
                  (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
                }}
              >
                <div>
                  <div style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b' }}>{template.name}</div>
                  <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '2px' }}>
                    {template.sections.filter(s => s.type !== 'new-line').length} sections · {new Date(template.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <span style={{ color: '#cbd5e1', fontSize: '20px' }}>›</span>
              </div>
            ))}
          </div>
          {state.templates.length > 3 && (
            <p style={{ fontSize: '12px', color: '#94a3b8', margin: '6px 0 0 0', textAlign: 'center' }}>
              Scroll to see all {state.templates.length} templates
            </p>
          )}
        </div>
      )}

      {/* Get a template from elsewhere */}
      <div>
        <p style={{ fontSize: '13px', fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 10px 0' }}>
          {state.templates.length > 0 ? 'Or Get Another Template' : 'Get a Template'}
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '10px' }}>

          <button
            onClick={handleImportClick}
            style={{ ...optionBtnStyle('#3b82f6'), marginBottom: 0 }}
          >
            <span style={{ fontSize: '22px', flexShrink: 0 }}>📂</span>
            <div>
              <div style={{ fontWeight: '700' }}>Import File</div>
              <div style={{ fontSize: '12px', opacity: 0.9, fontWeight: '400', marginTop: '2px' }}>
                Import a .json template from a colleague
              </div>
            </div>
          </button>

          <button
            onClick={() => navigate('/create-template', { state: { method: 'quick-start', classId: selectedClass?.id } })}
            style={{ ...optionBtnStyle('#10b981'), marginBottom: 0 }}
          >
            <span style={{ fontSize: '22px', flexShrink: 0 }}>🚀</span>
            <div>
              <div style={{ fontWeight: '700' }}>Prebuilt Templates</div>
              <div style={{ fontSize: '12px', opacity: 0.9, fontWeight: '400', marginTop: '2px' }}>
                Pick your subject — instant pre-filled template
              </div>
            </div>
          </button>

        </div>
      </div>

      {/* Hidden file input for import */}
      <input ref={fileInputRef} type="file" accept=".json" onChange={handleFileSelect} style={{ display: 'none' }} />
    </div>
  );

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div style={containerStyle}>

      <PageNav />

      <div style={contentStyle}>

        {/* Step indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '32px' }}>
          <div style={stepIndicatorStyle(step === 'class', step === 'template')}>
            {step === 'template' ? '✓' : '1'}
          </div>
          <span style={{ fontSize: '13px', fontWeight: '600', color: step === 'class' ? '#8b5cf6' : '#10b981' }}>
            Class
          </span>
          <div style={{ flex: 1, height: '2px', backgroundColor: step === 'template' ? '#10b981' : '#e2e8f0', borderRadius: '2px', maxWidth: '60px' }} />
          <div style={stepIndicatorStyle(step === 'template', false)}>2</div>
          <span style={{ fontSize: '13px', fontWeight: '600', color: step === 'template' ? '#8b5cf6' : '#94a3b8' }}>
            Template
          </span>
        </div>

        {/* Step content */}
        {step === 'class' && renderClassStep()}
        {step === 'template' && templateView === 'options' && renderTemplateOptions()}
        {step === 'template' && templateView === 'existing' && renderExistingTemplates()}

        {/* Back button on step 2 */}
        {step === 'template' && (
          <button
            onClick={() => {
              if (templateView === 'existing') { setTemplateView('options'); return; }
              setStep('class'); setSelectedClass(null);
            }}
            style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '13px', cursor: 'pointer', padding: '16px 0 0 0', display: 'block' }}
          >
            {templateView === 'existing' ? '← Back' : '← Change class'}
          </button>
        )}

      </div>
    </div>
  );
}

export default StartReports;