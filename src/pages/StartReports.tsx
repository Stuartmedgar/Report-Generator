// src/pages/StartReports.tsx
// Replaces: StartReports, SelectClass, Step2Template, GetTemplate, SelectTemplate, PickTemplate
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { Class, Template } from '../types';
import PageNav from '../components/PageNav';

function StartReports() {
  const { state, addTemplate, deleteTemplate } = useData();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
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
  };

  const handleTemplateSelect = (template: Template) => {
    sessionStorage.setItem('continueEditing', JSON.stringify({
      classId: selectedClass?.id,
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

  // The template-options grid gets a wider canvas so the "Recommended for"
  // captions can sit in the space beside the buttons instead of below them.
  const contentStyle: React.CSSProperties = {
    maxWidth: !isMobile && templateView === 'options' ? '1300px' : '720px',
    margin: '0 auto',
    padding: isMobile ? '24px 16px' : '40px 24px',
  };

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

  // Mobile: wraps each big button together with its "Recommended for" caption
  // in one bordered card, stacked below the button.
  const optionCardStyle: React.CSSProperties = {
    border: '2px solid #e5e7eb',
    borderRadius: '16px',
    padding: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    backgroundColor: 'white',
  };

  const recommendedTextStyle: React.CSSProperties = {
    fontSize: '12px',
    color: '#64748b',
    margin: 0,
    lineHeight: 1.5,
    textAlign: 'center',
    padding: '0 4px',
  };

  // Desktop: caption sits in the space beside its button instead — a colored
  // accent border on the inner edge (facing the button) ties the two together.
  const sideCaptionStyle = (side: 'left' | 'right', accentColor: string): React.CSSProperties => ({
    fontSize: '12px',
    color: '#64748b',
    margin: 0,
    lineHeight: 1.6,
    textAlign: side,
    alignSelf: 'center',
    borderRight: side === 'right' ? `3px solid ${accentColor}` : undefined,
    borderLeft: side === 'left' ? `3px solid ${accentColor}` : undefined,
    paddingRight: side === 'right' ? '16px' : undefined,
    paddingLeft: side === 'left' ? '16px' : undefined,
  });

  // ─── Step 2a: Choose how to get a template ───────────────────────────────

  const renderTemplateOptions = () => (
    <div>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: isMobile ? '26px' : '32px', fontWeight: '800', color: '#1e293b', margin: '0 0 8px 0' }}>
          Choose a Template
        </h1>
        <p style={{ fontSize: '15px', color: '#64748b', margin: 0 }}>
          {selectedClass ? <>Writing reports for <strong>{selectedClass.name}</strong>.</> : 'Pick how you\'d like to build it — you\'ll choose or create a class next.'}
        </p>
      </div>

      {(() => {
        const quickStartBtn = (
          <button
            key="quick-start"
            onClick={() => navigate('/create-template', { state: { method: 'quick-start', classId: selectedClass?.id } })}
            style={{ ...bigBtnStyle('#10b981'), boxShadow: '0 4px 14px rgba(16,185,129,0.35)' }}
            onMouseEnter={e => { if (!isMobile) { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 10px 24px rgba(16,185,129,0.45)'; } }}
            onMouseLeave={e => { if (!isMobile) { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(16,185,129,0.35)'; } }}
          >
            <span style={{ fontSize: '30px' }}>🚀</span>
            <span style={{ fontSize: isMobile ? '18px' : '20px', fontWeight: '800' }}>Quick Start</span>
            <span style={{ fontSize: '13px', fontWeight: '500', opacity: 0.88 }}>Pick your subject — instant pre-filled template</span>
          </button>
        );
        const quickStartCaption = <>teachers who want to start writing right now — pick a subject and get a ready-made template in seconds.</>;

        const aiQuickBuildBtn = (
          <button
            key="ai-quick-build"
            onClick={() => navigate('/import-template', { state: { classId: selectedClass?.id } })}
            style={{ ...bigBtnStyle('#8b5cf6'), boxShadow: '0 4px 14px rgba(139,92,246,0.35)' }}
            onMouseEnter={e => { if (!isMobile) { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 10px 24px rgba(139,92,246,0.45)'; } }}
            onMouseLeave={e => { if (!isMobile) { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(139,92,246,0.35)'; } }}
          >
            <span style={{ fontSize: '30px' }}>⚡</span>
            <span style={{ fontSize: isMobile ? '18px' : '20px', fontWeight: '800' }}>AI Quick Build</span>
            <span style={{ fontSize: '13px', fontWeight: '500', opacity: 0.88 }}>Paste your reports — AI builds a template in ~2 min</span>
          </button>
        );
        const aiQuickBuildCaption = <>teachers who already have reports written in their own words and want AI to turn them into a reusable template.</>;

        const templateWizardBtn = (
          <button
            key="template-wizard"
            onClick={() => navigate('/create-template', { state: { method: 'build-as-you-go', classId: selectedClass?.id } })}
            style={{ ...bigBtnStyle('#f59e0b'), boxShadow: '0 4px 14px rgba(245,158,11,0.35)' }}
            onMouseEnter={e => { if (!isMobile) { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 10px 24px rgba(245,158,11,0.45)'; } }}
            onMouseLeave={e => { if (!isMobile) { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(245,158,11,0.35)'; } }}
          >
            <span style={{ fontSize: '30px' }}>🧱</span>
            <span style={{ fontSize: isMobile ? '18px' : '20px', fontWeight: '800' }}>Template Wizard</span>
            <span style={{ fontSize: '13px', fontWeight: '500', opacity: 0.88 }}>Build your template section by section</span>
          </button>
        );
        const templateWizardCaption = <>teachers who want full control, building every section themselves step by step.</>;

        const alreadyGotBtn = (
          <button
            key="already-got"
            onClick={() => setTemplateView('existing')}
            style={{ ...bigBtnStyle('#3b82f6'), boxShadow: '0 4px 14px rgba(59,130,246,0.35)' }}
            onMouseEnter={e => { if (!isMobile) { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 10px 24px rgba(59,130,246,0.45)'; } }}
            onMouseLeave={e => { if (!isMobile) { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(59,130,246,0.35)'; } }}
          >
            <span style={{ fontSize: '30px' }}>📁</span>
            <span style={{ fontSize: isMobile ? '18px' : '20px', fontWeight: '800' }}>Already Got a Template</span>
            <span style={{ fontSize: '13px', fontWeight: '500', opacity: 0.88 }}>Use a saved template, or import a file</span>
          </button>
        );
        const alreadyGotCaption = <>teachers reusing one of their own saved templates, or importing a template file from a colleague.</>;

        if (isMobile) {
          return (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '14px' }}>
              {[
                [quickStartBtn, quickStartCaption],
                [aiQuickBuildBtn, aiQuickBuildCaption],
                [templateWizardBtn, templateWizardCaption],
                [alreadyGotBtn, alreadyGotCaption],
              ].map(([btn, caption], i) => (
                <div key={i} style={optionCardStyle}>
                  {btn}
                  <p style={recommendedTextStyle}><strong style={{ color: '#475569' }}>Recommended for:</strong> {caption}</p>
                </div>
              ))}
            </div>
          );
        }

        // Desktop — 4 columns: [caption, button, button, caption] per row, so
        // each caption sits in the space beside its button instead of below it.
        return (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(150px, 1fr) 320px 320px minmax(150px, 1fr)',
            columnGap: '24px',
            rowGap: '28px',
            alignItems: 'center',
          }}>
            <p style={sideCaptionStyle('right', '#10b981')}><strong style={{ color: '#475569' }}>Recommended for:</strong> {quickStartCaption}</p>
            {quickStartBtn}
            {aiQuickBuildBtn}
            <p style={sideCaptionStyle('left', '#8b5cf6')}><strong style={{ color: '#475569' }}>Recommended for:</strong> {aiQuickBuildCaption}</p>

            <p style={sideCaptionStyle('right', '#f59e0b')}><strong style={{ color: '#475569' }}>Recommended for:</strong> {templateWizardCaption}</p>
            {templateWizardBtn}
            {alreadyGotBtn}
            <p style={sideCaptionStyle('left', '#3b82f6')}><strong style={{ color: '#475569' }}>Recommended for:</strong> {alreadyGotCaption}</p>
          </div>
        );
      })()}
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
          {selectedClass && <>Writing reports for <strong>{selectedClass.name}</strong>. </>}
          {state.templates.length > 0 ? 'Select a template below.' : 'You don’t have any saved templates yet.'}
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
          {state.templates.length > 0 ? 'Or Import a Template' : 'Import a Template'}
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px' }}>

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

        {/* Step content */}
        {templateView === 'options' && renderTemplateOptions()}
        {templateView === 'existing' && renderExistingTemplates()}

        {/* Back button when viewing existing/imported/prebuilt templates */}
        {templateView === 'existing' && (
          <button
            onClick={() => setTemplateView('options')}
            style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '13px', cursor: 'pointer', padding: '16px 0 0 0', display: 'block' }}
          >
            ← Back
          </button>
        )}

      </div>
    </div>
  );
}

export default StartReports;