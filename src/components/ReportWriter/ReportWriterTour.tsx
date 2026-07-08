import React, { useState, useEffect } from 'react';

interface TourStep {
  target?: string;
  title: string;
  content: string;
  position?: 'below' | 'above' | 'left' | 'right';
}

const WRITING_STEPS: TourStep[] = [
  {
    target: 'pronoun',
    title: 'Report pronoun',
    content: 'Choose He, She, or They for this student. All comment options switch to the right pronoun throughout the report automatically.',
    position: 'below',
  },
  {
    target: 'section',
    title: 'Choose a comment',
    content: '• Click a button to select a comment for this section.\n• The report preview on the right updates instantly.\n• Clicking the same button again selects a different statement on the same topic.\n• If you decide you no longer want a statement for this section, click Exclude.',
    position: 'below',
  },
  {
    target: 'name-or-pronoun',
    title: 'Name or Pronoun',
    content: "To avoid repetition of names, you can choose to have he/she/they instead of the pupil's name for that statement. The pronoun selected for the report will be used.",
    position: 'below',
  },
  {
    target: 'edit-comment',
    title: 'Edit Comment',
    content: 'Click + Edit Comment to fine-tune the wording of the selected statement for this student, without changing the template. Type the changes you want in the editing box and click Save. You will see your changes in the preview.',
    position: 'above',
  },
  {
    target: 'add-section',
    title: '+ Button',
    content: 'Use the "for this student only" options in this menu to add an optional comment box, so you can write a personal comment for the student.',
    position: 'above',
  },
  {
    target: 'preview',
    title: 'Live report preview',
    content: "Your report builds here as you make selections. The latest comment displays in blue so it's easy to see.",
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
    content: 'You can edit your template at any time while writing — changes are tracked and can be saved at the end. Use ? Help → Editing templates whenever you want a walkthrough of those features.',
  },
];

const EDITING_STEPS: TourStep[] = [
  {
    title: 'Editing templates — quick tour',
    content: 'You can edit your template at any time while writing — changes are tracked and can be saved at the end. This tour covers everything you can do to a section, from quick per-student tweaks to permanent template changes.',
  },
  {
    target: 'add-section',
    title: 'Adding a section',
    content: "Click the + button to add a new section after this one. Choose from rated comments, qualities, next steps, assessment scores, personalised comments, standard fixed text, or a line break.",
    position: 'above',
  },
  {
    target: 'section-actions',
    title: 'The pencil edit button',
    content: 'Click the ✏️ pencil to open the full statement editor for this section — add, edit, split or remove individual statements in the template.',
    position: 'above',
  },
  {
    target: 'header-style',
    title: 'Header function',
    content: 'Tick Header to show a heading before the comment, then choose a style — inline or on its own line, normal or CAPS. Leave it unticked to skip the header.',
    position: 'below',
  },
  {
    target: 'name-or-pronoun',
    title: 'Name or Pronoun',
    content: "To avoid repetition of names, you can choose to have he/she/they instead of the pupil's name for that statement. The pronoun selected for the report will be used.",
    position: 'below',
  },
  {
    target: 'edit-comment',
    title: 'Edit Comment',
    content: 'Click + Edit Comment to fine-tune the wording of the selected statement for this student, without changing the template. Type the changes you want in the editing box and click Save. You will see your changes in the preview.\n\nTry it now: click "Try it" below, select a comment on any section, then click + Edit Comment to open the editing box. Click "▶ Resume tour" to come back and leave the box open — the next few steps point at the buttons inside it.',
    position: 'above',
  },
  {
    target: 'save-comment',
    title: 'Save',
    content: 'The Save button saves your changes for that report — this student only. The template itself is not affected.',
    position: 'above',
  },
  {
    target: 'replace-in-template',
    title: 'Replace in template',
    content: 'The Replace in template button updates the comment in the template permanently.',
    position: 'above',
  },
  {
    target: 'add-to-button',
    title: 'Add to button',
    content: 'The Add to button saves your new comment separately to the button, alongside the existing options.',
    position: 'above',
  },
  {
    target: 'add-to-new-button',
    title: 'Add to new button',
    content: 'The Add to new button allows you to create a new button that the statement will be added to.',
    position: 'above',
  },
  {
    target: 'move-to',
    title: 'Move to',
    content: 'The Move to function allows you to change the button the comment is found under.',
    position: 'above',
  },
  {
    target: 'duplicate',
    title: 'Duplicate and merge',
    content: '⧉ Duplicate creates a copy of the section — useful for offering more than one comment in the same area. ⇥ Merge into… combines all the buttons from this section into another one, then removes this section.',
    position: 'below',
  },
  {
    target: 'reorder',
    title: 'Reorder sections',
    content: 'The ▲ ▼ arrows on the left of each section let you change the order they appear in the report. Only template sections can be reordered.',
    position: 'right',
  },
  {
    target: 'save-template',
    title: 'Saving template changes',
    content: 'Any changes you make are tracked. Click 💾 Save Template in the header bar to save changes to the template permanently, or skip it to discard.',
    position: 'below',
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
    target: 'reorder',
    title: '1 of 6 — Reorder the sections',
    content: 'Use the ▲ ▼ arrows to move sections into the order you want them to appear in your reports. Get this right now and you won\'t need to think about it again.',
    position: 'right',
  },
  {
    target: 'duplicate',
    title: '2 of 6 — Duplicating sections',
    content: '⧉ Duplicate creates an identical copy of a section — useful for subject-specific or pronoun variants, or for offering more than one comment in the same area.',
    position: 'below',
  },
  {
    target: 'section-title',
    title: '3 of 6 — Renaming sections',
    content: 'Click any section title to rename it. Type your new name and press Enter (or click away) to save. Clear names make writing reports faster.',
    position: 'below',
  },
  {
    target: 'add-section',
    title: '4 of 6 — Add line breaks and optional additional comments',
    content: 'Click + to open the add menu. A ⏎ Line Break adds spacing between sections in the report. A 📝 Optional Comment Box adds a free-text field for one-off additions — both appear exactly where you place them.',
    position: 'above',
  },
  {
    target: 'header-style',
    title: '5 of 6 — Sort the format of the header, if wanted',
    content: 'Tick Header to show a heading before each comment, then pick a style — inline or on its own line, normal or CAPS. Leave it unticked to skip headers altogether.',
    position: 'below',
  },
  {
    target: 'save-template',
    title: '6 of 6 — Save your template',
    content: 'Once you\'re happy with everything, click 💾 Save Template Now in the header bar. This saves all changes permanently and your template is ready to use for your whole class.',
    position: 'below',
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
        <div style={{ fontSize: '13px', color: '#4b5563', lineHeight: '1.65', marginBottom: '16px', whiteSpace: 'pre-line' }}>{current.content}</div>
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
