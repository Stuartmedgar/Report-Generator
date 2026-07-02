import React, { useState, useEffect } from 'react';

interface TourStep {
  target?: string;
  title: string;
  content: string;
  position?: 'below' | 'above' | 'left' | 'right';
}

const STEPS: TourStep[] = [
  {
    title: 'Welcome to the Report Writer',
    content: 'This quick tour covers the main features. Click Next to begin, or Skip to dismiss.',
  },
  {
    target: 'pronoun',
    title: 'Set the pronoun',
    content: 'Choose He, She, or They for this student. All comment options switch to the right pronoun throughout the report automatically.',
    position: 'below',
  },
  {
    target: 'section',
    title: 'Choose a comment',
    content: 'Click a button to select a comment for this section. The report preview on the right updates instantly. Click the same button again to deselect.',
    position: 'below',
  },
  {
    target: 'section-actions',
    title: 'Edit or remove a section',
    content: 'The ✏️ pencil opens the statement editor — add, edit, split or remove statements. 🗑 removes the section from your template entirely. ▲▼ on the left reorders sections.',
    position: 'above',
  },
  {
    target: 'preview',
    title: 'Live report preview',
    content: 'Your report builds here as you make selections. You can also click directly into the text to make one-off edits for this student — perfect for fine-tuning without changing the template.',
    position: 'left',
  },
  {
    target: 'navigation',
    title: 'Student navigation',
    content: 'Use the arrows to move between students. Reports are saved automatically as you move. Press Finish when you\'re done to go to the reports view.',
    position: 'left',
  },
  {
    title: "You're all set!",
    content: 'You can replay this tour at any time by clicking the ? Help button in the top bar.',
  },
];

const PAD = 6;
const TIP_W = 290;

interface Props {
  onDismiss: () => void;
}

export function ReportWriterTour({ onDismiss }: Props) {
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);

  const current = STEPS[step];

  useEffect(() => {
    if (!current.target) { setRect(null); return; }
    const id = setTimeout(() => {
      const el = document.querySelector(`[data-tour="${current.target}"]`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        setRect(el.getBoundingClientRect());
      } else {
        setRect(null);
      }
    }, 80);
    return () => clearTimeout(id);
  }, [step, current.target]);

  useEffect(() => {
    if (!current.target) return;
    const remeasure = () => {
      const el = document.querySelector(`[data-tour="${current.target}"]`);
      if (el) setRect(el.getBoundingClientRect());
    };
    window.addEventListener('resize', remeasure);
    return () => window.removeEventListener('resize', remeasure);
  }, [step, current.target]);

  const next = () => { if (step < STEPS.length - 1) setStep(s => s + 1); else onDismiss(); };
  const prev = () => setStep(s => Math.max(0, s - 1));

  const safeLeft = (l: number) => Math.max(8, Math.min(l, window.innerWidth - TIP_W - 8));

  const tipStyle = (): React.CSSProperties => {
    const base: React.CSSProperties = {
      position: 'fixed', zIndex: 10001,
      backgroundColor: 'white', borderRadius: '12px',
      padding: '18px 20px', width: `${TIP_W}px`,
      boxShadow: '0 8px 32px rgba(0,0,0,0.28)', fontFamily: 'inherit',
    };
    if (!rect) return { ...base, top: '50%', left: '50%', transform: 'translate(-50%,-50%)' };
    const pos = current.position ?? 'below';
    if (pos === 'below') return { ...base, top: rect.bottom + PAD + 8, left: safeLeft(rect.left) };
    if (pos === 'above') return { ...base, bottom: window.innerHeight - rect.top + PAD + 8, left: safeLeft(rect.left) };
    if (pos === 'left')  return { ...base, top: Math.max(8, rect.top), right: window.innerWidth - rect.left + PAD + 8 };
    if (pos === 'right') return { ...base, top: Math.max(8, rect.top), left: rect.right + PAD + 8 };
    return { ...base, top: rect.bottom + 8, left: safeLeft(rect.left) };
  };

  return (
    <>
      {/* Click trap — prevents interaction with page while tour is open */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 9999 }} />

      {/* Spotlight or full backdrop */}
      {rect ? (
        <div style={{
          position: 'fixed',
          top: rect.top - PAD, left: rect.left - PAD,
          width: rect.width + PAD * 2, height: rect.height + PAD * 2,
          borderRadius: '8px',
          boxShadow: '0 0 0 9999px rgba(0,0,0,0.55)',
          outline: '2px solid #3b82f6',
          zIndex: 10000, pointerEvents: 'none',
        }} />
      ) : (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.55)', zIndex: 10000, pointerEvents: 'none' }} />
      )}

      {/* Tooltip */}
      <div style={tipStyle()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
          <div style={{ fontSize: '14px', fontWeight: '700', color: '#111827', flex: 1, paddingRight: '8px' }}>{current.title}</div>
          <div style={{ fontSize: '11px', color: '#6b7280', flexShrink: 0, backgroundColor: '#f3f4f6', padding: '2px 7px', borderRadius: '10px' }}>{step + 1} / {STEPS.length}</div>
        </div>
        <div style={{ fontSize: '13px', color: '#4b5563', lineHeight: '1.65', marginBottom: '16px' }}>{current.content}</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button onClick={onDismiss} style={{ background: 'none', border: 'none', fontSize: '12px', color: '#9ca3af', cursor: 'pointer', padding: 0 }}>Skip tour</button>
          <div style={{ display: 'flex', gap: '8px' }}>
            {step > 0 && (
              <button onClick={prev} style={{ backgroundColor: '#f3f4f6', color: '#374151', border: 'none', borderRadius: '6px', padding: '7px 14px', fontSize: '13px', cursor: 'pointer' }}>← Back</button>
            )}
            <button onClick={next} style={{ backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', padding: '7px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
              {step === STEPS.length - 1 ? 'Done ✓' : 'Next →'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
