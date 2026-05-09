import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useData } from '../../contexts/DataContext';
import { Template, Class } from '../../types';

interface TemplateSelectionProps {
  selectedTemplate: Template | null;
  selectedClass: Class | null;
  onTemplateSelect: (template: Template) => void;
  onClassSelect: (classData: Class) => void;
  onContinueToStudents: () => void;
  isMobile: boolean;
}

function TemplateSelection({
  selectedTemplate,
  selectedClass,
  onTemplateSelect,
  onClassSelect,
  onContinueToStudents,
  isMobile
}: TemplateSelectionProps) {
  const navigate = useNavigate();
  const { state } = useData();

  const hasTemplates = state.templates.length > 0;
  const hasClasses = state.classes.length > 0;
  const isNewUser = !hasTemplates && !hasClasses;

  const TEMPLATE_LIBRARY_URL = 'https://drive.google.com/drive/folders/1Kc0O9QSqpHCBUuDfcMcjk2gAfNtbPPnf?usp=drive_link';

  const sectionHeadingStyle: React.CSSProperties = {
    fontSize: '13px',
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    margin: '0 0 10px 0'
  };

  const panelBtnPrimary = (bg: string): React.CSSProperties => ({
    backgroundColor: bg,
    color: 'white',
    padding: '11px 18px',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer'
  });

  const panelBtnSecondary: React.CSSProperties = {
    backgroundColor: '#f3f4f6',
    color: '#374151',
    padding: '11px 18px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer'
  };

  // ── NEW USER EMPTY STATE ──────────────────────────────────────────────────
  const NewUserState = () => (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>

      <div style={{
        backgroundColor: '#fefce8',
        border: '1.5px dashed #f59e0b',
        borderRadius: '10px',
        padding: '16px 20px',
        marginBottom: '24px',
        textAlign: 'center'
      }}>
        <p style={{ fontSize: '15px', fontWeight: '600', color: '#92400e', margin: '0 0 4px 0' }}>
          👋 Welcome! To write reports you need a class and a template.
        </p>
        <p style={{ fontSize: '13px', color: '#92400e', margin: 0 }}>
          Start by adding your class below, then get a template.
        </p>
      </div>

      {/* Step 1 — Add your class */}
      <div style={{
        backgroundColor: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '20px'
      }}>
        <p style={sectionHeadingStyle}>Step 1 — Add your class</p>
        <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 16px 0', lineHeight: '1.6' }}>
          Enter your students' names so you're ready to write reports for them.
        </p>
        <Link to="/class-management" style={{ textDecoration: 'none' }}>
          <button style={panelBtnPrimary('#8b5cf6')}>
            + Add Your Class
          </button>
        </Link>
      </div>

      {/* Step 2 — Get a template */}
      <div style={{
        backgroundColor: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '20px'
      }}>
        <p style={sectionHeadingStyle}>Step 2 — Get a template</p>
        <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 20px 0', lineHeight: '1.6' }}>
          A template defines the structure of your reports. Choose how you'd like to get one.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '16px' }}>

          {/* Create */}
          <div style={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '18px' }}>
            <p style={{ ...sectionHeadingStyle, marginBottom: '8px' }}>Create a template</p>
            <p style={{ fontSize: '13px', color: '#6b7280', margin: '0 0 14px 0', lineHeight: '1.5' }}>
              Build from your existing reports using the guided wizard, or construct one manually.
            </p>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <Link to="/import-template" style={{ textDecoration: 'none' }}>
                <button style={panelBtnPrimary('#8b5cf6')}>🪄 Use the Wizard</button>
              </Link>
              <Link to="/create-template" style={{ textDecoration: 'none' }}>
                <button style={panelBtnSecondary}>✏️ Build Manually</button>
              </Link>
            </div>
          </div>

          {/* Import */}
          <div style={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '18px' }}>
            <p style={{ ...sectionHeadingStyle, marginBottom: '8px' }}>Import a template</p>
            <p style={{ fontSize: '13px', color: '#6b7280', margin: '0 0 14px 0', lineHeight: '1.5' }}>
              Already have one? Import a file from a colleague or browse the library.
            </p>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <Link to="/manage-templates" style={{ textDecoration: 'none' }}>
                <button style={panelBtnPrimary('#3b82f6')}>📂 Import from File</button>
              </Link>
              <button
                onClick={() => window.open(TEMPLATE_LIBRARY_URL, '_blank', 'noopener,noreferrer')}
                style={panelBtnSecondary}
              >
                📚 Browse Library
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // ── MISSING ONLY TEMPLATES ────────────────────────────────────────────────
  const MissingTemplatesState = () => (
    <div style={{
      backgroundColor: 'white',
      border: '1px solid #e5e7eb',
      borderRadius: '12px',
      padding: '32px',
      textAlign: 'center',
      maxWidth: '600px',
      margin: '0 auto'
    }}>
      <div style={{ fontSize: '48px', marginBottom: '16px' }}>📝</div>
      <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginBottom: '8px' }}>
        You need a template to get started
      </h3>
      <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '24px' }}>
        You have {state.classes.length} {state.classes.length === 1 ? 'class' : 'classes'} ready — now get a template and you can start writing.
      </p>
      <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
        <Link to="/import-template" style={{ textDecoration: 'none' }}>
          <button style={panelBtnPrimary('#8b5cf6')}>🪄 Use the Wizard</button>
        </Link>
        <Link to="/manage-templates" style={{ textDecoration: 'none' }}>
          <button style={panelBtnSecondary}>Browse & Import</button>
        </Link>
      </div>
    </div>
  );

  // ── MISSING ONLY CLASSES ──────────────────────────────────────────────────
  const MissingClassesState = () => (
    <div style={{
      backgroundColor: 'white',
      border: '1px solid #e5e7eb',
      borderRadius: '12px',
      padding: '32px',
      textAlign: 'center',
      maxWidth: '600px',
      margin: '0 auto'
    }}>
      <div style={{ fontSize: '48px', marginBottom: '16px' }}>👥</div>
      <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginBottom: '8px' }}>
        You need a class to get started
      </h3>
      <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '24px' }}>
        You have {state.templates.length} {state.templates.length === 1 ? 'template' : 'templates'} ready — add your class and you can start writing.
      </p>
      <Link to="/class-management" style={{ textDecoration: 'none' }}>
        <button style={panelBtnPrimary('#8b5cf6')}>+ Add Your Class</button>
      </Link>
    </div>
  );

  // ── RETURNING USER — FULL SELECTION ──────────────────────────────────────
  const ReturningUserDesktop = () => (
    <>
      {/* Continue button when both selected */}
      {(selectedTemplate || selectedClass) && (
        <div style={{
          backgroundColor: '#f0f9ff',
          border: '2px solid #3b82f6',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '24px',
          textAlign: 'center'
        }}>
          {selectedTemplate && selectedClass && (
            <button
              onClick={onContinueToStudents}
              style={{
                backgroundColor: '#10b981',
                color: 'white',
                padding: '16px 32px',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'block',
                margin: '0 auto 8px auto'
              }}
            >
              Continue to Student Selection →
            </button>
          )}
          <p style={{ color: '#6b7280', fontSize: '14px', margin: '8px 0 0 0' }}>
            Using "{selectedTemplate?.name || '...'}" template with "{selectedClass?.name || '...'}" class
          </p>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', marginBottom: '24px' }}>

        {/* Template Selection panel */}
        <div style={{
          backgroundColor: 'white',
          padding: '24px',
          borderRadius: '12px',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
          border: selectedTemplate ? '2px solid #3b82f6' : '2px solid #e5e7eb'
        }}>
          {/* Panel header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              📝 Select Template
              {selectedTemplate && <span style={{ color: '#3b82f6', fontSize: '16px' }}>✓</span>}
              <span style={{ fontSize: '14px', fontWeight: 'normal', color: '#6b7280' }}>
                ({state.templates.length})
              </span>
            </h2>
            <Link to="/manage-templates" style={{ textDecoration: 'none' }}>
              <button style={{
                backgroundColor: '#f3f4f6',
                color: '#374151',
                padding: '6px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '500',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}>
                + Manage Templates
              </button>
            </Link>
          </div>

          {selectedTemplate && (
            <div style={{ backgroundColor: '#eff6ff', border: '1px solid #3b82f6', borderRadius: '6px', padding: '12px', marginBottom: '16px' }}>
              <div style={{ fontSize: '14px', color: '#1e40af', fontWeight: '600' }}>Selected: {selectedTemplate.name}</div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>{selectedTemplate.sections.length} sections</div>
            </div>
          )}

          <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: '6px' }}>
            {state.templates.map((template) => (
              <div
                key={template.id}
                onClick={() => onTemplateSelect(template)}
                style={{
                  padding: '12px',
                  borderBottom: '1px solid #f3f4f6',
                  cursor: 'pointer',
                  backgroundColor: selectedTemplate?.id === template.id ? '#eff6ff' : 'transparent',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (selectedTemplate?.id !== template.id) e.currentTarget.style.backgroundColor = '#f9fafb';
                }}
                onMouseLeave={(e) => {
                  if (selectedTemplate?.id !== template.id) e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <div style={{
                  fontWeight: selectedTemplate?.id === template.id ? '600' : '500',
                  color: selectedTemplate?.id === template.id ? '#1e40af' : '#111827',
                  fontSize: '14px',
                  marginBottom: '4px'
                }}>
                  {template.name}
                  <span style={{
                    marginLeft: '8px',
                    fontSize: '11px',
                    backgroundColor: selectedTemplate?.id === template.id ? '#bfdbfe' : '#f3f4f6',
                    color: selectedTemplate?.id === template.id ? '#1e40af' : '#6b7280',
                    padding: '2px 6px',
                    borderRadius: '4px'
                  }}>
                    {template.sections.length} sections
                  </span>
                </div>
                <p style={{ color: '#6b7280', fontSize: '12px', margin: 0 }}>
                  {new Date(template.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Class Selection panel */}
        <div style={{
          backgroundColor: 'white',
          padding: '24px',
          borderRadius: '12px',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
          border: selectedClass ? '2px solid #10b981' : '2px solid #e5e7eb'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              👥 Select Class
              {selectedClass && <span style={{ color: '#10b981', fontSize: '16px' }}>✓</span>}
              <span style={{ fontSize: '14px', fontWeight: 'normal', color: '#6b7280' }}>
                ({state.classes.length})
              </span>
            </h2>
            <Link to="/class-management" style={{ textDecoration: 'none' }}>
              <button style={{
                backgroundColor: '#f3f4f6',
                color: '#374151',
                padding: '6px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '500',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}>
                + Manage Classes
              </button>
            </Link>
          </div>

          {selectedClass && (
            <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #10b981', borderRadius: '6px', padding: '12px', marginBottom: '16px' }}>
              <div style={{ fontSize: '14px', color: '#059669', fontWeight: '600' }}>Selected: {selectedClass.name}</div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>{selectedClass.students.length} students</div>
            </div>
          )}

          <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: '6px' }}>
            {state.classes.map((classData) => (
              <div
                key={classData.id}
                onClick={() => onClassSelect(classData)}
                style={{
                  padding: '12px',
                  borderBottom: '1px solid #f3f4f6',
                  cursor: 'pointer',
                  backgroundColor: selectedClass?.id === classData.id ? '#f0fdf4' : 'transparent',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (selectedClass?.id !== classData.id) e.currentTarget.style.backgroundColor = '#f9fafb';
                }}
                onMouseLeave={(e) => {
                  if (selectedClass?.id !== classData.id) e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <div style={{
                  fontWeight: selectedClass?.id === classData.id ? '600' : '500',
                  color: selectedClass?.id === classData.id ? '#059669' : '#111827',
                  fontSize: '14px',
                  marginBottom: '4px'
                }}>
                  {classData.name}
                  <span style={{
                    marginLeft: '8px',
                    fontSize: '11px',
                    backgroundColor: selectedClass?.id === classData.id ? '#bbf7d0' : '#f3f4f6',
                    color: selectedClass?.id === classData.id ? '#059669' : '#6b7280',
                    padding: '2px 6px',
                    borderRadius: '4px'
                  }}>
                    {classData.students.length} students
                  </span>
                </div>
                <p style={{ color: '#6b7280', fontSize: '12px', margin: 0 }}>
                  {new Date(classData.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );

  // ── MOBILE TEMPLATE LIST ──────────────────────────────────────────────────
  const MobileTemplateList = () => (
    <div>
      <Link to="/" style={{ textDecoration: 'none', display: 'inline-block', marginBottom: '16px' }}>
        <button style={{
          backgroundColor: '#6b7280',
          color: 'white',
          padding: '8px 12px',
          border: 'none',
          borderRadius: '6px',
          fontSize: '14px',
          fontWeight: '500',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          ← Home
        </button>
      </Link>

      <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)', overflow: 'hidden' }}>
        <div style={{ padding: '16px', borderBottom: '1px solid #e5e7eb', backgroundColor: '#f9fafb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', margin: 0 }}>
            Select a Template
          </h3>
          <Link to="/manage-templates" style={{ textDecoration: 'none' }}>
            <button style={{
              backgroundColor: '#8b5cf6',
              color: 'white',
              padding: '6px 10px',
              border: 'none',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: '500',
              cursor: 'pointer'
            }}>
              + Manage
            </button>
          </Link>
        </div>

        {state.templates.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 16px' }}>
            <p style={{ color: '#6b7280', marginBottom: '16px', fontSize: '14px' }}>No templates yet</p>
            <Link to="/import-template" style={{ textDecoration: 'none' }}>
              <button style={{ backgroundColor: '#8b5cf6', color: 'white', padding: '12px 20px', border: 'none', borderRadius: '6px', fontSize: '14px', fontWeight: '500', cursor: 'pointer' }}>
                🪄 Use the Wizard
              </button>
            </Link>
          </div>
        ) : (
          state.templates.map((template, index) => (
            <div
              key={template.id}
              onClick={() => onTemplateSelect(template)}
              style={{
                padding: '16px',
                borderBottom: index < state.templates.length - 1 ? '1px solid #f3f4f6' : 'none',
                cursor: 'pointer',
                backgroundColor: 'white',
                transition: 'background-color 0.2s'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '4px' }}>{template.name}</div>
                  <div style={{ fontSize: '13px', color: '#6b7280' }}>{template.sections.length} sections</div>
                  <div style={{ fontSize: '12px', color: '#9ca3af' }}>{new Date(template.createdAt).toLocaleDateString()}</div>
                </div>
                <div style={{ fontSize: '18px', color: '#3b82f6' }}>→</div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Mobile help */}
      <div style={{ backgroundColor: '#f0f9ff', border: '2px solid #3b82f6', borderRadius: '8px', padding: '16px', textAlign: 'center', marginTop: '20px' }}>
        <p style={{ color: '#1e40af', fontSize: '14px', fontWeight: '600', margin: '0 0 12px 0' }}>
          💡 Need a template?
        </p>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/import-template" style={{ textDecoration: 'none' }}>
            <button style={{ backgroundColor: '#8b5cf6', color: 'white', padding: '8px 12px', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '500', cursor: 'pointer' }}>
              🪄 Wizard
            </button>
          </Link>
          <Link to="/manage-templates" style={{ textDecoration: 'none' }}>
            <button style={{ backgroundColor: '#3b82f6', color: 'white', padding: '8px 12px', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '500', cursor: 'pointer' }}>
              Browse & Import
            </button>
          </Link>
        </div>
      </div>
    </div>
  );

  // ── RENDER ────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>

      {/* Header */}
      <header style={{
        backgroundColor: 'white',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        padding: isMobile ? '12px 16px' : '32px 24px'
      }}>
        <div style={{
          maxWidth: isMobile ? '100%' : '1200px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: isMobile ? '8px' : '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h1 style={{ fontSize: isMobile ? '18px' : '28px', fontWeight: '600', color: '#111827', margin: 0 }}>
              {isMobile ? 'Select Template' : 'Write Reports'}
            </h1>
            {isMobile && (
              <span style={{ fontSize: '12px', backgroundColor: '#e0f2fe', color: '#0277bd', padding: '4px 8px', borderRadius: '12px', fontWeight: '500' }}>
                Step 1 of 3
              </span>
            )}
          </div>

          {!isMobile && (
            <p style={{ color: '#6b7280', margin: '8px 0 0 0', fontSize: '16px', position: 'absolute', left: '24px', top: '70px' }}>
              {isNewUser
                ? 'Get set up and start writing reports'
                : 'Select a template and class to start writing reports'}
            </p>
          )}

          {!isMobile && (
            <Link to="/" style={{ textDecoration: 'none' }}>
              <button style={{ backgroundColor: '#6b7280', color: 'white', padding: '12px 20px', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '500', cursor: 'pointer' }}>
                ← Back to Home
              </button>
            </Link>
          )}
        </div>
      </header>

      <main style={{ maxWidth: isMobile ? '100%' : '1200px', margin: '0 auto', padding: isMobile ? '16px' : '32px 24px' }}>

        {/* Mobile layout */}
        {isMobile ? (
          isNewUser || !hasTemplates ? <NewUserState /> : <MobileTemplateList />
        ) : (
          /* Desktop layout — state aware */
          isNewUser ? (
            <NewUserState />
          ) : !hasTemplates ? (
            <MissingTemplatesState />
          ) : !hasClasses ? (
            <MissingClassesState />
          ) : (
            <ReturningUserDesktop />
          )
        )}

      </main>
    </div>
  );
}

export default TemplateSelection;