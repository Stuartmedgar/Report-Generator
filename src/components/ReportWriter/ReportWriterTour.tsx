import React, { useState, useEffect } from 'react';

interface TourStep {
  target?: string;
  title: string;
  content: string;
  position?: 'below' | 'above' | 'left' | 'right';
}

const WRITING_STEPS: TourStep[] = [
  {
    title: 'Writing reports — quick tour',
    content: 'This covers the essentials for writing reports. Click Next to begin, or Skip to dismiss.',
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
    target: 'preview',
    title: 'Live report preview',
    content: 'Your report builds here as you make selections. You can also click directly into the preview text to make one-off edits for this student without changing the template.',
    position: 'left',
  },
  {
    target: 'navigation',
    title: 'Student navigation',
    content: 'Use the arrows to move between students. Reports save automatically as you move. Press Finish when done to go to the reports view.',
    position: 'left',
  },
  {
    title: "That's the essentials!",
    content: 'Use ? Help → Editing templates whenever you want to learn how to customise your template while you write.',
  },
];

const EDITING_STEPS: TourStep[] = [
  {
    title: 'Editing templates — quick tour',
    content: 'You can edit your template at any time while writing — changes are tracked and can be saved at the end.',
  },
  {
    target: 'section-actions',
    title: 'Section action buttons',
    content: 'The ✏️ pencil opens the full statement editor for this section — add, edit, split or remove individual statements. 🗑 permanently removes the section from your template.',
    position: 'above',
  },
  {
    target: 'reorder',
    title: 'Reorder sections',
    content: 'The ▲ ▼ arrows on the left of each section let you change the order they appear in the report. Only template sections can be reordered.',
    position: 'right',
  },
  {
    target: 'add-section',
    title: 'Add a section',
    content: "The + button adds a new section after this one. You can add rated comments, qualities, next steps, assessment scores, personalised comments, standard fixed text, or a line break.",
    position: 'above',
  },
  {
    title: 'Saving template changes',
    content: 'Any changes you make are tracked. A 💾 Save Template button appears in the header bar — click it to save changes to the template permanently, or skip it to discard.',
  },
  {
    title: "You're ready to edit!",
    content: 'Use ? Help → Writing reports any time to revisit the report-writing tour.',
  },
];

const AI_BUILDER_STEPS: TourStep[] = [
  {
    target: 'merge',
    title: '1 of 7 — Merge duplicate sections',
    content: 'If the AI has created several sections covering the same area, you can combine them. Find ⇥ Merge into… in the section header, choose the target section from the dropdown, and all its buttons will move across. The original section is then removed.',
    position: 'below',
  },
  {
    target: 'duplicate',
    title: '2 of 7 — Duplicate sections',
    content: 'Once your sections are consolidated, use ⧉ Duplicate to create copies where needed. This lets you offer pupils more than one comment in the same area — for example a general strengths section and a subject-specific one.',
    position: 'below',
  },
  {
    target: 'section-actions',
    title: '3 of 7 — Check and edit statements',
    content: 'Click ✏️ to open the statement editor for any section. Here you can read through what the AI has created, edit individual statements, split chunked text into separate options, and remove anything that doesn\'t fit.',
    position: 'above',
  },
  {
    target: 'reorder',
    title: '4 of 7 — Reorganise section order',
    content: 'Use ▲ ▼ to move sections into the order you want them to appear in the report. Get this right now and you won\'t need to adjust it while writing.',
    position: 'right',
  },
  {
    target: 'section-title',
    title: '5 of 7 — Rename sections',
    content: 'Click any section title to rename it. Type your new name and press Enter (or click away) to save. Clear names make writing reports faster.',
    position: 'below',
  },
  {
    target: 'add-section',
    title: '6 of 7 — Add missing sections',
    content: 'Click + to add anything the AI missed. A ⏎ Line Break improves spacing between sections in the final report. A 📝 Optional Comment Box gives a free-text space for personal pupil comments. All standard section types are also available.',
    position: 'above',
  },
  {
    target: 'save-template',
    title: '7 of 7 — Save your template',
    content: 'Once you\'re happy with everything, click 💾 Save Template Now in the header bar. This saves all changes permanently and your template is ready to use for your whole class.',
    position: 'below',
  },
];

const WIZARD_STEPS: TourStep[] = [
  {
    title: "Your template is built — let's get it ready!",
    content: 'Before you start writing, here are a few things worth setting up.',
  },
  {
    target: 'reorder',
    title: 'Arrange sections in report order',
    content: 'Use the ▲ ▼ arrows to move sections into the order you want them to appear in your reports. Get this right now and you won\'t need to think about it again.',
    position: 'right',
  },
  {
    target: 'add-section',
    title: 'Add line breaks and optional comments',
    content: 'Click + to open the add menu. A ⏎ Line Break adds spacing between sections in the report. A 📝 Optional Comment Box adds a free-text field for one-off additions — both appear exactly where you place them.',
    position: 'above',
  },
  {
    target: 'duplicate',
    title: 'Duplicate and merge sections',
    content: '⧉ Duplicate creates an identical copy of a section — useful for subject-specific or pronoun variants. ⇥ Merge into… combines all the buttons from one section into another, then removes the original.',
    position: 'below',
  },
  {
    title: "Ready to write your first report!",
    content: 'Use ? Help → Writing reports for a walkthrough of the report-writing features.',
  },
];

const PAD = 6;
const TIP_W = 290;

interface Props {
  tourType: 'writing' | 'editing' | 'ai-builder' | 'wizard';
  onDismiss: () => void;
}

export function ReportWriterTour({ tourType, onDismiss }: Props) {
  const STEPS =
    tourType === 'writing' ? WRITING_STEPS :
    tourType === 'editing' ? EDITING_STEPS :
    tourType === 'ai-builder' ? AI_BUILDER_STEPS :
    WIZARD_STEPS;
  const accentColor =
    tourType === 'writing' ? '#3b82f6' :
    tourType === 'editing' ? '#8b5cf6' :
    tourType === 'ai-builder' ? '#f59e0b' :
    '#10b981';

  const [step, setStep] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [paused, setPaused] = useState(false);

  const current = STEPS[step];

  // Scroll into view once when the step changes
  useEffect(() => {
    if (!current.target || paused) return;
    const id = setTimeout(() => {
      const el = document.querySelector(`[data-tour="${current.target}"]`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 80);
    return () => clearTimeout(id);
  }, [step, current.target]); // eslint-disable-line react-hooks/exhaustive-deps

  // Track element position on every animation frame so the spotlight
  // follows the element when the page scrolls or content shifts
  useEffect(() => {
    setRect(null);
    if (!current.target || paused) return;
    let frameId: number;
    let lt = -1, ll = -1, lw = -1, lh = -1;
    const track = () => {
      const el = document.querySelector(`[data-tour="${current.target}"]`);
      if (el) {
        const r = el.getBoundingClientRect();
        const t = Math.round(r.top), l = Math.round(r.left), w = Math.round(r.width), h = Math.round(r.height);
        if (t !== lt || l !== ll || w !== lw || h !== lh) {
          lt = t; ll = l; lw = w; lh = h;
          setRect(r);
        }
      }
      frameId = requestAnimationFrame(track);
    };
    frameId = requestAnimationFrame(track);
    return () => cancelAnimationFrame(frameId);
  }, [step, current.target, paused]); // eslint-disable-line react-hooks/exhaustive-deps

  const next = () => { setPaused(false); if (step < STEPS.length - 1) setStep(s => s + 1); else onDismiss(); };
  const prev = () => { setPaused(false); setStep(s => Math.max(0, s - 1)); };

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

  if (paused) {
    return (
      <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 10001 }}>
        <button
          onClick={() => setPaused(false)}
          style={{ backgroundColor: accentColor, color: 'white', border: 'none', borderRadius: '20px', padding: '10px 20px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', boxShadow: '0 4px 14px rgba(0,0,0,0.25)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          ▶ Resume tour <span style={{ opacity: 0.75, fontWeight: '400', fontSize: '12px' }}>step {step + 1} of {STEPS.length}</span>
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Spotlight or full backdrop */}
      {rect ? (
        <div style={{
          position: 'fixed',
          top: rect.top - PAD, left: rect.left - PAD,
          width: rect.width + PAD * 2, height: rect.height + PAD * 2,
          borderRadius: '8px',
          boxShadow: '0 0 0 9999px rgba(0,0,0,0.55)',
          outline: `2px solid ${accentColor}`,
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
            {current.target && (
              <button onClick={() => setPaused(true)} style={{ backgroundColor: '#f3f4f6', color: '#374151', border: 'none', borderRadius: '6px', padding: '7px 14px', fontSize: '13px', cursor: 'pointer' }}>Try it ↗</button>
            )}
            <button onClick={next} style={{ backgroundColor: accentColor, color: 'white', border: 'none', borderRadius: '6px', padding: '7px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
              {step === STEPS.length - 1 ? 'Done ✓' : 'Next →'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
