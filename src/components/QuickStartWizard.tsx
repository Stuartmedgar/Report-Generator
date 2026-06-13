// src/components/QuickStartWizard.tsx
import React, { useState } from 'react';
import { SUBJECTS, SUBJECT_EXTRAS, SubjectExtra, buildQuickStartTemplate } from '../data/starterComments';

interface Props {
  templateName: string;
  onComplete: (template: { name: string; sections: any[] }) => void;
  onCancel: () => void;
}

const SUBJECT_ICONS: Record<string, string> = {
  'PE': '🏃',
  'English': '📖',
  'Maths': '📐',
  'Science': '🔬',
  'History': '🏛️',
  'Geography': '🌍',
  'Modern Languages': '💬',
  'Art & Design': '🎨',
  'Music': '🎵',
  'Generic': '📋',
};

const QuickStartWizard: React.FC<Props> = ({ templateName: initialName, onComplete, onCancel }) => {
  const [step, setStep] = useState<'subject' | 'extras'>('subject');
  const [templateName, setTemplateName] = useState(initialName || '');
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [selectedExtraIds, setSelectedExtraIds] = useState<string[]>([]);
  const [nameError, setNameError] = useState('');

  // ─── Shared styles ────────────────────────────────────────────────────────

  const shell: React.CSSProperties = {
    minHeight: '100vh',
    backgroundColor: '#f8fafc',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    display: 'flex',
    flexDirection: 'column',
  };

  const topBar: React.CSSProperties = {
    backgroundColor: 'white',
    borderBottom: '1px solid #e2e8f0',
    padding: '12px 24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexShrink: 0,
  };

  const content: React.CSSProperties = {
    flex: 1,
    maxWidth: '640px',
    width: '100%',
    margin: '0 auto',
    padding: '36px 24px',
  };

  const primaryBtn: React.CSSProperties = {
    backgroundColor: '#10b981',
    color: 'white',
    padding: '12px 28px',
    border: 'none',
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
  };

  const secondaryBtn: React.CSSProperties = {
    backgroundColor: 'white',
    color: '#374151',
    padding: '12px 24px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: '500',
    cursor: 'pointer',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '11px 14px',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '15px',
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
  };

  // ─── Handlers ────────────────────────────────────────────────────────────

  const handleSubjectSelect = (subject: string) => {
    if (!templateName.trim()) {
      setNameError('Please enter a template name first.');
      return;
    }
    setNameError('');
    setSelectedSubject(subject);
    // Auto-suggest name if still default/empty
    if (!templateName.trim() || templateName === initialName) {
      setTemplateName(`${subject} Report Template`);
    }
    const extras = SUBJECT_EXTRAS[subject] || [];
    setSelectedExtraIds(extras.map(e => e.id));
    setStep('extras');
  };

  const toggleExtra = (id: string) => {
    setSelectedExtraIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleBuild = () => {
    if (!selectedSubject) return;
    const name = templateName.trim() || `${selectedSubject} Report Template`;
    const template = buildQuickStartTemplate(name, selectedSubject, selectedExtraIds);
    onComplete({ ...template, name });
  };

  const extras: SubjectExtra[] = selectedSubject ? (SUBJECT_EXTRAS[selectedSubject] || []) : [];
  const hasExtras = extras.length > 0;

  // ─── STEP 1: Name + Subject ───────────────────────────────────────────────

  if (step === 'subject') {
    return (
      <div style={shell}>
        {/* Top bar */}
        <div style={topBar}>
          <button onClick={onCancel} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '14px', fontWeight: '500', cursor: 'pointer', padding: 0 }}>
            ← Back
          </button>
          <span style={{ fontSize: '15px', fontWeight: '700', color: '#1e293b' }}>Quick Start</span>
          <span style={{ fontSize: '13px', color: '#94a3b8', fontWeight: '500' }}>Step 1 of 2</span>
        </div>

        <div style={content}>
          {/* Heading */}
          <div style={{ marginBottom: '28px' }}>
            <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#1e293b', margin: '0 0 8px 0' }}>
              Quick Start Template
            </h1>
            <p style={{ fontSize: '15px', color: '#64748b', margin: 0, lineHeight: '1.6' }}>
              Pick your subject and we'll instantly build a ready-to-use template pre-populated with comments. Fully editable.
            </p>
          </div>

          {/* Template name */}
          <div style={{ marginBottom: '28px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
              Template Name *
            </label>
            <input
              type="text"
              value={templateName}
              onChange={e => { setTemplateName(e.target.value); if (nameError) setNameError(''); }}
              placeholder="e.g. S3 PE Reports, Year 9 English"
              style={{ ...inputStyle, borderColor: nameError ? '#ef4444' : '#e5e7eb' }}
              autoFocus
            />
            {nameError && (
              <p style={{ fontSize: '13px', color: '#ef4444', margin: '6px 0 0 0' }}>{nameError}</p>
            )}
          </div>

          {/* Universal sections info */}
          <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '12px 16px', marginBottom: '24px' }}>
            <div style={{ fontSize: '12px', fontWeight: '700', color: '#065f46', marginBottom: '6px', letterSpacing: '0.05em' }}>
              ✓ INCLUDED IN EVERY TEMPLATE
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {['Progress', 'Effort & Application', 'Behaviour & Attitude', 'Homework', 'Strengths', 'Next Steps'].map(s => (
                <span key={s} style={{ backgroundColor: 'white', border: '1px solid #6ee7b7', color: '#065f46', fontSize: '12px', padding: '3px 10px', borderRadius: '12px', fontWeight: '500' }}>
                  {s}
                </span>
              ))}
            </div>
          </div>

          {/* Subject grid */}
          <div style={{ marginBottom: '8px' }}>
            <p style={{ fontSize: '13px', fontWeight: '600', color: '#374151', margin: '0 0 12px 0' }}>
              Select your subject:
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
              {SUBJECTS.map(subject => (
                <button
                  key={subject}
                  onClick={() => handleSubjectSelect(subject)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '14px 16px',
                    backgroundColor: 'white',
                    border: '2px solid #e5e7eb',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#111827',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = '#10b981';
                    e.currentTarget.style.backgroundColor = '#f0fdf4';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = '#e5e7eb';
                    e.currentTarget.style.backgroundColor = 'white';
                  }}
                >
                  <span style={{ fontSize: '22px' }}>{SUBJECT_ICONS[subject]}</span>
                  <span>{subject}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── STEP 2: Extras ───────────────────────────────────────────────────────

  return (
    <div style={shell}>
      {/* Top bar */}
      <div style={topBar}>
        <button onClick={() => setStep('subject')} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '14px', fontWeight: '500', cursor: 'pointer', padding: 0 }}>
          ← Back
        </button>
        <span style={{ fontSize: '15px', fontWeight: '700', color: '#1e293b' }}>Quick Start</span>
        <span style={{ fontSize: '13px', color: '#94a3b8', fontWeight: '500' }}>Step 2 of 2</span>
      </div>

      <div style={content}>
        {/* Heading */}
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#1e293b', margin: '0 0 6px 0' }}>
            {SUBJECT_ICONS[selectedSubject!]} {selectedSubject} — Extra Sections
          </h1>
          <p style={{ fontSize: '14px', color: '#64748b', margin: 0, lineHeight: '1.6' }}>
            The 6 universal sections are already included. Tick any {selectedSubject}-specific extras you'd like to add. All selected by default.
          </p>
        </div>

        {/* Universal summary */}
        <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '10px 14px', marginBottom: '20px' }}>
          <div style={{ fontSize: '12px', fontWeight: '700', color: '#065f46', marginBottom: '4px', letterSpacing: '0.04em' }}>
            ✓ ALREADY INCLUDED
          </div>
          <div style={{ fontSize: '12px', color: '#047857' }}>
            Progress · Effort & Application · Behaviour & Attitude · Homework · Strengths · Next Steps
          </div>
        </div>

        {/* Extras list */}
        {hasExtras ? (
          <>
            <p style={{ fontSize: '13px', fontWeight: '600', color: '#374151', margin: '0 0 10px 0' }}>
              {selectedSubject}-specific sections:
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
              {extras.map(extra => {
                const isSelected = selectedExtraIds.includes(extra.id);
                return (
                  <button
                    key={extra.id}
                    onClick={() => toggleExtra(extra.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '14px 16px',
                      backgroundColor: isSelected ? '#f0fdf4' : 'white',
                      border: isSelected ? '2px solid #10b981' : '2px solid #e5e7eb',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s ease',
                      width: '100%',
                    }}
                  >
                    <div style={{
                      width: '20px', height: '20px', borderRadius: '4px', flexShrink: 0,
                      backgroundColor: isSelected ? '#10b981' : 'white',
                      border: isSelected ? '2px solid #10b981' : '2px solid #d1d5db',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '12px', color: 'white', fontWeight: '700',
                    }}>
                      {isSelected ? '✓' : ''}
                    </div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>
                        {extra.label}
                      </div>
                      <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '1px' }}>
                        {extra.section.type === 'rated-comment' ? 'Rated comment section' :
                         extra.section.type === 'qualities' ? 'Choice comment section' :
                         extra.section.type === 'next-steps' ? 'Next steps section' : extra.section.type}
                        {' · '}
                        {extra.section.type === 'rated-comment'
                          ? '4 performance levels with pre-written comments'
                          : `${Object.keys((extra.section.data as any)?.comments || (extra.section.data as any)?.focusAreas || {}).length} buttons with pre-written comments`}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        ) : (
          <div style={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '16px', marginBottom: '24px', fontSize: '14px', color: '#6b7280', textAlign: 'center' }}>
            No subject-specific extras for {selectedSubject} — the universal sections cover everything you need.
          </div>
        )}

        {/* Summary */}
        <div style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '12px 16px', marginBottom: '24px', fontSize: '13px', color: '#1e40af' }}>
          <strong>Your template will include:</strong> the 6 universal sections
          {selectedExtraIds.length > 0 && ` + ${selectedExtraIds.length} ${selectedSubject} section${selectedExtraIds.length > 1 ? 's' : ''}`}.
          Everything will be editable once built.
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={() => setStep('subject')} style={secondaryBtn}>
            ← Change subject
          </button>
          <button onClick={handleBuild} style={{ ...primaryBtn, flex: 1 }}>
            Build my template →
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuickStartWizard;