import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { Template } from '../types';

export default function SelectTemplate() {
  const navigate = useNavigate();
  const location = useLocation();
  const { state } = useData();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Class passed via navigation state from home screen or class management
  const classId = location.state?.classId as string | undefined;
  const classData = classId ? state.classes.find(c => c.id === classId) : null;
  const className = classData?.name || 'your class';

  const hasTemplates = state.templates.length > 0;

  const hoverOn = (e: React.MouseEvent<HTMLElement>) => {
    if (!isMobile) {
      e.currentTarget.style.transform = 'translateY(-2px)';
      e.currentTarget.style.boxShadow = '0 8px 15px rgba(0,0,0,0.15)';
    }
  };
  const hoverOff = (e: React.MouseEvent<HTMLElement>) => {
    if (!isMobile) {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
    }
  };

  const handleSelectTemplate = (template: Template) => {
    // Navigate to write reports with both class and template pre-selected
    navigate('/write-reports', {
      state: {
        preselectedClassId: classId,
        preselectedTemplateId: template.id,
      }
    });
  };

  const handleNeedTemplate = () => {
    navigate('/get-template', { state: { classId } });
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', padding: isMobile ? '40px 16px' : '60px 20px 40px' }}>

      {/* Back */}
      <div style={{ width: '100%', maxWidth: isMobile ? 'none' : '680px', marginBottom: '24px' }}>
        <button onClick={() => navigate('/')}
          style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '14px', cursor: 'pointer', padding: 0, fontWeight: '500', display: 'flex', alignItems: 'center', gap: '4px' }}>
          ← Back
        </button>
      </div>

      {/* Title */}
      <div style={{ textAlign: 'center', marginBottom: isMobile ? '36px' : '48px', maxWidth: '600px', width: '100%' }}>
        <h1 style={{ fontSize: isMobile ? '26px' : '40px', fontWeight: '800', color: '#1e293b', margin: '0 0 12px 0', lineHeight: 1.2 }}>
          {classData ? (
            <>
              Great — <span style={{ color: '#8b5cf6' }}>{className}</span> is ready.
            </>
          ) : 'Choose a template.'}
        </h1>
        <p style={{ fontSize: isMobile ? '15px' : '17px', color: '#64748b', margin: 0, lineHeight: 1.6 }}>
          Now choose a template to write reports with.
        </p>
      </div>

      <div style={{ width: '100%', maxWidth: isMobile ? 'none' : '680px', display: 'flex', flexDirection: 'column', gap: isMobile ? '16px' : '20px' }}>

        {/* Need a template */}
        <button onClick={handleNeedTemplate}
          style={{
            backgroundColor: '#3b82f6', color: 'white',
            padding: isMobile ? '28px 24px' : '32px 28px',
            borderRadius: isMobile ? '8px' : '12px',
            border: 'none',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            transition: 'transform 0.2s, box-shadow 0.2s',
            cursor: 'pointer', width: '100%',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: '8px',
          }}
          onMouseEnter={hoverOn} onMouseLeave={hoverOff}>
          <span style={{ fontSize: '28px', lineHeight: 1 }}>📋</span>
          <span style={{ fontSize: isMobile ? '18px' : '21px', fontWeight: '700' }}>
            {hasTemplates ? 'Create a new template' : 'Need a template?'}
          </span>
          <span style={{ fontSize: '13px', opacity: 0.9, fontWeight: '400' }}>
            Choose how to build one — takes just a few minutes
          </span>
        </button>

        {/* Saved templates */}
        {hasTemplates && (
          <div style={{ backgroundColor: 'white', borderRadius: isMobile ? '8px' : '12px', border: '1px solid #e5e7eb', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #f3f4f6' }}>
              <div style={{ fontSize: isMobile ? '15px' : '17px', fontWeight: '700', color: '#1e293b' }}>
                Your saved templates
              </div>
              <div style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
                {state.templates.length} {state.templates.length === 1 ? 'template' : 'templates'} — click one to start writing
              </div>
            </div>
            <div>
              {state.templates.map((template, index) => (
                <button key={template.id}
                  onClick={() => handleSelectTemplate(template)}
                  style={{
                    width: '100%', display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center', padding: '16px 20px',
                    border: 'none', borderBottom: index < state.templates.length - 1 ? '1px solid #f3f4f6' : 'none',
                    backgroundColor: 'white', cursor: 'pointer', textAlign: 'left',
                    transition: 'background-color 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#f0fdf4'; }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'white'; }}>
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: '600', color: '#111827' }}>{template.name}</div>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
                      {template.sections?.length || 0} sections
                      {template.createdAt && ` · Created ${new Date(template.createdAt).toLocaleDateString()}`}
                    </div>
                  </div>
                  <div style={{ fontSize: '13px', color: '#10b981', fontWeight: '600', flexShrink: 0, marginLeft: '12px' }}>
                    Write reports →
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* No templates yet — friendly nudge */}
        {!hasTemplates && (
          <div style={{ textAlign: 'center', padding: '20px', color: '#9ca3af', fontSize: '14px' }}>
            You don't have any saved templates yet — click above to create your first one.
          </div>
        )}

      </div>
    </div>
  );
}