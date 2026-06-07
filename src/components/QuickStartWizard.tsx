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

const QuickStartWizard: React.FC<Props> = ({ templateName, onComplete, onCancel }) => {
  const [step, setStep] = useState<'subject' | 'extras'>('subject');
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [selectedExtraIds, setSelectedExtraIds] = useState<string[]>([]);

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

  const handleSubjectSelect = (subject: string) => {
    setSelectedSubject(subject);
    // Default: all extras selected
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
    const template = buildQuickStartTemplate(templateName, selectedSubject, selectedExtraIds);
    onComplete(template);
  };

  const extras: SubjectExtra[] = selectedSubject ? (SUBJECT_EXTRAS[selectedSubject] || []) : [];
  const hasExtras = extras.length > 0;

  // ─── STEP 1: Subject Picker ────────────────────────────────────────────────

  if (step === 'subject') {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{ maxWidth: '620px', width: '100%' }}>

          {/* Header */}
          <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.07)', padding: '40px 48px', marginBottom: '12px' }}>
            <h1 style={{ fontSize: '26px', fontWeight: '700', color: '#111827', marginBottom: '8px' }}>
              Quick Start — "{templateName}"
            </h1>
            <p style={{ color: '#6b7280', fontSize: '15px', marginBottom: '32px', lineHeight: '1.6' }}>
              We'll build you a ready-to-use template with sections covering progress, effort, behaviour, strengths and next steps — all pre-populated with generic comments that work for any pupil.
              <br /><br />
              Pick your subject and we'll also offer you some subject-specific extras to include.
            </p>

            {/* Universal sections preview */}
            <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '14px 18px', marginBottom: '28px' }}>
              <div style={{ fontSize: '12px', fontWeight: '700', color: '#065f46', marginBottom: '8px', letterSpacing: '0.05em' }}>
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
            <p style={{ fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '14px' }}>
              Select your subject:
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '28px' }}>
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
                    transition: 'all 0.15s ease',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#111827',
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

            <button onClick={onCancel} style={{ ...secondaryBtn, width: '100%' }}>
              ← Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── STEP 2: Extras Selection ──────────────────────────────────────────────

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ maxWidth: '620px', width: '100%' }}>
        <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.07)', padding: '40px 48px' }}>

          <h1 style={{ fontSize: '26px', fontWeight: '700', color: '#111827', marginBottom: '6px' }}>
            {SUBJECT_ICONS[selectedSubject!]} {selectedSubject} — Extra Sections
          </h1>
          <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '24px', lineHeight: '1.6' }}>
            Your template already includes the universal sections. Below are subject-specific extras available for {selectedSubject}. They're all selected by default — untick any you don't need. You can always add or remove them later in the template editor.
          </p>

          {/* Universal summary */}
          <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '12px 16px', marginBottom: '20px' }}>
            <div style={{ fontSize: '12px', fontWeight: '700', color: '#065f46', marginBottom: '6px', letterSpacing: '0.04em' }}>
              ✓ UNIVERSAL SECTIONS ALREADY INCLUDED
            </div>
            <div style={{ fontSize: '12px', color: '#047857' }}>
              Progress · Effort & Application · Behaviour & Attitude · Homework · Strengths · Next Steps
            </div>
          </div>

          {/* Extras list */}
          {hasExtras ? (
            <>
              <p style={{ fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '10px' }}>
                {selectedSubject}-specific sections:
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '28px' }}>
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
                        width: '20px',
                        height: '20px',
                        borderRadius: '4px',
                        backgroundColor: isSelected ? '#10b981' : 'white',
                        border: isSelected ? '2px solid #10b981' : '2px solid #d1d5db',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        fontSize: '12px',
                        color: 'white',
                        fontWeight: '700',
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
              No subject-specific extras for this subject — the universal sections cover everything you need.
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
    </div>
  );
};

export default QuickStartWizard;