import React, { useState, useRef } from 'react';
import { TemplateSection, SectionType } from '../types';

interface BuildAsYouGoProps {
  templateName: string;
  onComplete: (sections: TemplateSection[]) => void;
  onCancel: () => void;
}

// ─── TYPES ────────────────────────────────────────────────────────────────────

interface StatementButton {
  name: string;
  statements: string[];
}

interface AddedSection {
  id: string;
  type: SectionType;
  name: string;
  buttons: StatementButton[]; // for button-based sections
  content: string;            // for standard-comment
}

interface Question {
  id: string;
  question: string;
  description: string;
  sectionType: SectionType;
  namePlaceholder: string;
  defaultName: string;
  allowMultiple: boolean;
  hasButtons: boolean; // qualities, next-steps, personalised → needs button naming
  noName?: boolean;
}

const QUESTIONS: Question[] = [
  {
    id: 'standard-comment',
    question: 'Do your reports contain fixed statements that all pupils receive?',
    description: 'For example, an introduction sentence or a closing remark that is the same for every pupil.',
    sectionType: 'standard-comment',
    namePlaceholder: 'e.g. Introduction, Closing Statement',
    defaultName: 'Introduction',
    allowMultiple: true,
    hasButtons: false,
  },
  {
    id: 'qualities',
    question: 'Do your reports comment on pupil qualities or strengths?',
    description: 'Comments picked from a set of options — for example effort, attitude, teamwork.',
    sectionType: 'qualities',
    namePlaceholder: 'e.g. Character Qualities, Strengths',
    defaultName: 'Character Qualities',
    allowMultiple: true,
    hasButtons: true,
  },
  {
    id: 'rated-comment',
    question: 'Do your reports rate pupils on their performance?',
    description: 'Comments tied to a rating — Excellent, Good, Satisfactory, Needs Improvement.',
    sectionType: 'rated-comment',
    namePlaceholder: 'e.g. Performance, Effort Rating',
    defaultName: 'Performance',
    allowMultiple: true,
    hasButtons: true,
  },
  {
    id: 'assessment-comment',
    question: 'Do your reports include assessment results with a score?',
    description: 'Comments linked to a score or percentage — for example a test result.',
    sectionType: 'assessment-comment',
    namePlaceholder: 'e.g. Assessment Result, Test Score',
    defaultName: 'Assessment',
    allowMultiple: true,
    hasButtons: true,
  },
  {
    id: 'personalised-comment',
    question: 'Do your reports mention specific pupil achievements or activities?',
    description: 'Comments that include personalised information — for example a sport, instrument, or club.',
    sectionType: 'personalised-comment',
    namePlaceholder: 'e.g. Personal Achievement, Activity',
    defaultName: 'Personal Achievement',
    allowMultiple: true,
    hasButtons: true,
  },
  {
    id: 'next-steps',
    question: 'Do your reports include targets or next steps for the pupil?',
    description: 'Suggestions for what the pupil should focus on to improve.',
    sectionType: 'next-steps',
    namePlaceholder: 'e.g. Next Steps, Targets, Areas for Development',
    defaultName: 'Next Steps',
    allowMultiple: true,
    hasButtons: true,
  },
  {
    id: 'optional-additional-comment',
    question: 'Do you want space to add individual notes for specific pupils?',
    description: 'An optional free-text box that only appears in the report if you fill it in.',
    sectionType: 'optional-additional-comment',
    namePlaceholder: '',
    defaultName: 'Additional Comments',
    allowMultiple: false,
    hasButtons: false,
    noName: true,
  },
  {
    id: 'new-line',
    question: 'Do you want paragraph breaks between sections?',
    description: 'Adds spacing between sections to make the report easier to read.',
    sectionType: 'new-line',
    namePlaceholder: '',
    defaultName: '',
    allowMultiple: false,
    hasButtons: false,
    noName: true,
  },
];

const SECTION_COLORS: Record<string, string> = {
  'standard-comment': '#10b981',
  'qualities': '#8b5cf6',
  'rated-comment': '#3b82f6',
  'assessment-comment': '#8b5cf6',
  'personalised-comment': '#f59e0b',
  'next-steps': '#06b6d4',
  'optional-additional-comment': '#ef4444',
  'new-line': '#9ca3af',
};

const SECTION_LABELS: Record<string, string> = {
  'standard-comment': 'Fixed Statement',
  'qualities': 'Qualities / Strengths',
  'rated-comment': 'Rated Comment',
  'assessment-comment': 'Assessment Score',
  'personalised-comment': 'Personalised Comment',
  'next-steps': 'Next Steps / Targets',
  'optional-additional-comment': 'Optional Notes Box',
  'new-line': 'Paragraph Break',
};

// Rated comment has fixed button names
const RATED_BUTTONS = ['Excellent', 'Good', 'Satisfactory', 'Needs Improvement'];
const ASSESSMENT_BUTTONS = ['Excellent', 'Good', 'Satisfactory', 'Needs Improvement', 'Not Completed'];

const makeId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

// ─── COMPONENT ────────────────────────────────────────────────────────────────

const BuildAsYouGo: React.FC<BuildAsYouGoProps> = ({ templateName, onComplete, onCancel }) => {

  // ─── REPORTS PANEL ──────────────────────────────────────────────────────
  const [reportsPanelOpen, setReportsPanelOpen] = useState(false);
  const [pastedReports, setPastedReports] = useState('');

  // ─── QUESTION FLOW ──────────────────────────────────────────────────────
  const [currentStep, setCurrentStep] = useState(0);
  const [addedSections, setAddedSections] = useState<AddedSection[]>([]);
  const [showSummary, setShowSummary] = useState(false);

  // Per-question state
  const [phase, setPhase] = useState<'ask' | 'name' | 'statements' | 'added'>('ask');
  const [sectionName, setSectionName] = useState('');

  // Buttons state (for hasButtons sections)
  const [buttons, setButtons] = useState<StatementButton[]>([]);
  const [activeButtonIndex, setActiveButtonIndex] = useState(0);
  const [newStatement, setNewStatement] = useState('');
  const [newButtonName, setNewButtonName] = useState('');
  const [addingNewButton, setAddingNewButton] = useState(false);

  // Standard comment content
  const [standardContent, setStandardContent] = useState('');
  const [newStatementStd, setNewStatementStd] = useState('');

  const statementInputRef = useRef<HTMLTextAreaElement>(null);

  const question = QUESTIONS[currentStep];
  const isLastQuestion = currentStep === QUESTIONS.length - 1;
  const isRatedFixed = question.sectionType === 'rated-comment' || question.sectionType === 'assessment-comment';

  const resetQuestion = () => {
    setPhase('ask');
    setSectionName('');
    setButtons([]);
    setActiveButtonIndex(0);
    setNewStatement('');
    setNewButtonName('');
    setAddingNewButton(false);
    setStandardContent('');
    setNewStatementStd('');
  };

  const advanceQuestion = () => {
    if (isLastQuestion) {
      setShowSummary(true);
    } else {
      setCurrentStep(s => s + 1);
      resetQuestion();
    }
  };

  // ─── YES HANDLER ──────────────────────────────────────────────────────

  const handleYes = () => {
    setSectionName(question.defaultName);
    setPhase('name');
  };

  const handleNo = () => advanceQuestion();

  // ─── NAME CONFIRMED ───────────────────────────────────────────────────

  const handleNameConfirmed = () => {
    if (question.noName) {
      // No name needed — go straight to adding
      handleAddSection();
      return;
    }
    if (!sectionName.trim()) return;

    if (question.hasButtons) {
      // For rated/assessment: pre-create fixed buttons
      if (isRatedFixed) {
        const fixedNames = question.sectionType === 'assessment-comment' ? ASSESSMENT_BUTTONS : RATED_BUTTONS;
        setButtons(fixedNames.map(n => ({ name: n, statements: [] })));
        setActiveButtonIndex(0);
      } else {
        // Free buttons — start with one empty button
        setButtons([{ name: '', statements: [] }]);
        setActiveButtonIndex(0);
      }
      setPhase('statements');
    } else {
      // standard-comment: go to statement paste
      setPhase('statements');
    }
  };

  // ─── ADD STATEMENT (button-based) ─────────────────────────────────────

  const handleAddStatement = () => {
    if (!newStatement.trim()) return;
    setButtons(prev => {
      const updated = [...prev];
      updated[activeButtonIndex] = {
        ...updated[activeButtonIndex],
        statements: [...updated[activeButtonIndex].statements, newStatement.trim()],
      };
      return updated;
    });
    setNewStatement('');
    statementInputRef.current?.focus();
  };

  const handleRemoveStatement = (buttonIdx: number, stmtIdx: number) => {
    setButtons(prev => {
      const updated = [...prev];
      updated[buttonIdx] = {
        ...updated[buttonIdx],
        statements: updated[buttonIdx].statements.filter((_, i) => i !== stmtIdx),
      };
      return updated;
    });
  };

  // ─── ADD NEW BUTTON ───────────────────────────────────────────────────

  const handleConfirmNewButton = () => {
    if (!newButtonName.trim()) return;
    setButtons(prev => [...prev, { name: newButtonName.trim(), statements: [] }]);
    setActiveButtonIndex(buttons.length);
    setNewButtonName('');
    setAddingNewButton(false);
  };

  // ─── ADD STANDARD STATEMENT ───────────────────────────────────────────

  const handleAddStandardStatement = () => {
    if (!newStatementStd.trim()) return;
    setStandardContent(prev => prev ? prev + '\n' + newStatementStd.trim() : newStatementStd.trim());
    setNewStatementStd('');
  };

  // ─── SAVE SECTION ─────────────────────────────────────────────────────

  const handleAddSection = () => {
    const name = question.noName ? question.defaultName : sectionName.trim() || question.defaultName;
    const newSection: AddedSection = {
      id: makeId(),
      type: question.sectionType,
      name,
      buttons: question.hasButtons ? buttons : [],
      content: standardContent,
    };
    setAddedSections(prev => [...prev, newSection]);
    setPhase('added');
  };

  const handleAddAnother = () => {
    setSectionName(question.defaultName);
    setPhase('name');
    setButtons([]);
    setActiveButtonIndex(0);
    setNewStatement('');
    setNewButtonName('');
    setAddingNewButton(false);
    setStandardContent('');
    setNewStatementStd('');
  };

  // ─── SUMMARY ACTIONS ──────────────────────────────────────────────────

  const handleMoveSection = (index: number, direction: 'up' | 'down') => {
    const next = [...addedSections];
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setAddedSections(next);
  };

  const handleRemoveSection = (id: string) => {
    setAddedSections(prev => prev.filter(s => s.id !== id));
  };

  // ─── COMPLETE ─────────────────────────────────────────────────────────

  const handleComplete = () => {
    if (addedSections.length === 0) {
      alert('Please add at least one section to your template.');
      return;
    }

    const sections: TemplateSection[] = addedSections.map(s => {
      let data: any = {};

      if (s.type === 'standard-comment') {
        data = { content: s.content || '' };

      } else if (s.type === 'qualities') {
        const comments: Record<string, string[]> = {};
        s.buttons.forEach(b => {
          if (b.name) comments[b.name] = b.statements;
        });
        data = { comments };

      } else if (s.type === 'rated-comment') {
        const comments: Record<string, string[]> = {};
        s.buttons.forEach(b => { comments[b.name] = b.statements; });
        data = { comments };

      } else if (s.type === 'assessment-comment') {
        const comments: Record<string, string[]> = {};
        s.buttons.forEach(b => { comments[b.name] = b.statements; });
        data = { comments };

      } else if (s.type === 'personalised-comment') {
        const categories: Record<string, string[]> = {};
        s.buttons.forEach(b => {
          if (b.name) categories[b.name] = b.statements;
        });
        data = { categories, instruction: '' };

      } else if (s.type === 'next-steps') {
        const focusAreas: Record<string, string[]> = {};
        s.buttons.forEach(b => {
          if (b.name) focusAreas[b.name] = b.statements;
        });
        data = { focusAreas };
      }

      return { id: s.id, type: s.type, name: s.name, data };
    });

    onComplete(sections);
  };

  // ─── STYLES ───────────────────────────────────────────────────────────

  const primaryBtn: React.CSSProperties = {
    backgroundColor: '#3b82f6', color: 'white', border: 'none',
    borderRadius: '8px', padding: '11px 24px', fontSize: '15px',
    fontWeight: '600', cursor: 'pointer',
  };
  const secondaryBtn: React.CSSProperties = {
    backgroundColor: '#f3f4f6', color: '#374151', border: 'none',
    borderRadius: '8px', padding: '11px 24px', fontSize: '15px',
    fontWeight: '500', cursor: 'pointer',
  };
  const smallBtn = (color: string): React.CSSProperties => ({
    backgroundColor: color, color: 'white', border: 'none',
    borderRadius: '6px', padding: '6px 14px', fontSize: '13px',
    fontWeight: '600', cursor: 'pointer',
  });
  const inp: React.CSSProperties = {
    width: '100%', padding: '10px 14px',
    border: '2px solid #e5e7eb', borderRadius: '8px',
    fontSize: '14px', outline: 'none', boxSizing: 'border-box',
    fontFamily: 'inherit',
  };
  const txa: React.CSSProperties = {
    ...inp, minHeight: '72px', resize: 'vertical',
  };

  const accentColor = SECTION_COLORS[question.sectionType] || '#3b82f6';

  // ─── SUMMARY SCREEN ───────────────────────────────────────────────────

  if (showSummary) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{ maxWidth: '700px', width: '100%', backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 24px rgba(0,0,0,0.1)', padding: '40px' }}>
          <h1 style={{ fontSize: '26px', fontWeight: '700', color: '#111827', marginBottom: '8px' }}>
            Your template structure
          </h1>
          <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '24px' }}>
            Reorder or remove sections, then continue to start writing reports.
          </p>

          {addedSections.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px', color: '#9ca3af', border: '2px dashed #e5e7eb', borderRadius: '8px', marginBottom: '24px' }}>
              No sections added yet. Go back and answer Yes to at least one question.
            </div>
          ) : (
            <div style={{ marginBottom: '24px' }}>
              {addedSections.map((s, index) => {
                const totalStatements = s.buttons.reduce((acc, b) => acc + b.statements.length, 0) + (s.content ? 1 : 0);
                return (
                  <div key={s.id} style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '12px 14px', backgroundColor: '#f9fafb',
                    border: '1px solid #e5e7eb', borderRadius: '8px', marginBottom: '8px',
                  }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: SECTION_COLORS[s.type] || '#9ca3af', flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>
                        {s.name || SECTION_LABELS[s.type]}
                      </div>
                      <div style={{ fontSize: '11px', color: '#9ca3af' }}>
                        {SECTION_LABELS[s.type]}
                        {totalStatements > 0 && ` · ${totalStatements} statement${totalStatements !== 1 ? 's' : ''}`}
                        {s.buttons.length > 0 && s.type !== 'standard-comment' && ` · ${s.buttons.filter(b => b.name).length} button${s.buttons.filter(b => b.name).length !== 1 ? 's' : ''}`}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button onClick={() => handleMoveSection(index, 'up')} disabled={index === 0}
                        style={{ ...secondaryBtn, padding: '4px 10px', fontSize: '12px', opacity: index === 0 ? 0.4 : 1 }}>▲</button>
                      <button onClick={() => handleMoveSection(index, 'down')} disabled={index === addedSections.length - 1}
                        style={{ ...secondaryBtn, padding: '4px 10px', fontSize: '12px', opacity: index === addedSections.length - 1 ? 0.4 : 1 }}>▼</button>
                      <button onClick={() => handleRemoveSection(s.id)}
                        style={{ backgroundColor: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '6px', padding: '4px 10px', fontSize: '12px', cursor: 'pointer' }}>✕</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button onClick={() => { setShowSummary(false); setCurrentStep(0); resetQuestion(); setAddedSections([]); }} style={secondaryBtn}>
              ← Start again
            </button>
            <button onClick={handleComplete} disabled={addedSections.length === 0}
              style={{ ...primaryBtn, opacity: addedSections.length === 0 ? 0.4 : 1, cursor: addedSections.length === 0 ? 'not-allowed' : 'pointer' }}>
              Start writing reports →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── MAIN QUESTION LAYOUT ─────────────────────────────────────────────

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', display: 'flex', flexDirection: 'column' }}>

      {/* Top bar */}
      <div style={{ backgroundColor: 'white', borderBottom: '1px solid #e5e7eb', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: '14px', fontWeight: '600', color: '#374151' }}>{templateName}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Progress */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '120px', height: '4px', backgroundColor: '#e5e7eb', borderRadius: '2px' }}>
              <div style={{ width: `${((currentStep + 1) / QUESTIONS.length) * 100}%`, height: '100%', backgroundColor: '#3b82f6', borderRadius: '2px', transition: 'width 0.3s ease' }} />
            </div>
            <span style={{ fontSize: '12px', color: '#6b7280' }}>{currentStep + 1}/{QUESTIONS.length}</span>
          </div>
          {/* Reports panel toggle */}
          <button
            onClick={() => setReportsPanelOpen(o => !o)}
            style={{
              backgroundColor: reportsPanelOpen ? '#eff6ff' : 'white',
              color: reportsPanelOpen ? '#3b82f6' : '#6b7280',
              border: `1px solid ${reportsPanelOpen ? '#3b82f6' : '#d1d5db'}`,
              borderRadius: '6px', padding: '6px 14px', fontSize: '13px',
              fontWeight: '500', cursor: 'pointer',
            }}
          >
            {reportsPanelOpen ? '✕ Hide reports' : '📄 Paste existing reports'}
          </button>
          <button onClick={onCancel} style={{ background: 'none', border: 'none', color: '#9ca3af', fontSize: '13px', cursor: 'pointer' }}>
            ← Back
          </button>
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* Left — Question panel */}
        <div style={{
          flex: reportsPanelOpen ? '0 0 50%' : '1',
          overflowY: 'auto',
          padding: '32px 40px',
          display: 'flex',
          flexDirection: 'column',
          transition: 'flex 0.2s ease',
        }}>
          <div style={{ maxWidth: '560px', width: '100%', margin: '0 auto' }}>

            {/* Section type badge */}
            <div style={{
              display: 'inline-block',
              backgroundColor: accentColor + '20',
              color: accentColor,
              border: `1px solid ${accentColor}40`,
              borderRadius: '20px', padding: '4px 12px',
              fontSize: '12px', fontWeight: '600', marginBottom: '16px',
            }}>
              {SECTION_LABELS[question.sectionType]}
            </div>

            {/* Question */}
            <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#111827', marginBottom: '10px', lineHeight: '1.3' }}>
              {question.question}
            </h2>
            <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '28px', lineHeight: '1.6' }}>
              {question.description}
            </p>

            {/* ── PHASE: ASK ──────────────────────────────────────────── */}
            {phase === 'ask' && (
              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={handleYes} style={{ ...primaryBtn, flex: 1 }}>Yes</button>
                <button onClick={handleNo} style={{ ...secondaryBtn, flex: 1 }}>No</button>
              </div>
            )}

            {/* ── PHASE: NAME ──────────────────────────────────────────── */}
            {phase === 'name' && !question.noName && (
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                  What would you like to call this section?
                </label>
                <input
                  type="text" value={sectionName}
                  onChange={e => setSectionName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleNameConfirmed(); }}
                  placeholder={question.namePlaceholder}
                  autoFocus style={{ ...inp, borderColor: accentColor, marginBottom: '16px' }}
                />
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button onClick={() => setPhase('ask')} style={secondaryBtn}>← Back</button>
                  <button onClick={handleNameConfirmed} disabled={!sectionName.trim()}
                    style={{ ...primaryBtn, opacity: !sectionName.trim() ? 0.4 : 1, cursor: !sectionName.trim() ? 'not-allowed' : 'pointer' }}>
                    Continue →
                  </button>
                </div>
              </div>
            )}

            {/* ── PHASE: STATEMENTS ────────────────────────────────────── */}
            {phase === 'statements' && (
              <div>
                <div style={{
                  backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0',
                  borderRadius: '8px', padding: '10px 14px',
                  fontSize: '13px', color: '#166534', marginBottom: '20px', lineHeight: '1.5',
                }}>
                  💡 Even 1–2 statements per button is enough to get started. You can add more as you write reports.
                </div>

                {/* STANDARD COMMENT — flat statement list */}
                {!question.hasButtons && (
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                      Paste a statement:
                    </label>
                    <textarea
                      value={newStatementStd}
                      onChange={e => setNewStatementStd(e.target.value)}
                      placeholder="Paste or type a statement here... Use [Name] for pupil name."
                      style={{ ...txa, borderColor: accentColor, marginBottom: '8px' }}
                    />
                    <button onClick={handleAddStandardStatement} disabled={!newStatementStd.trim()}
                      style={{ ...smallBtn(accentColor), opacity: !newStatementStd.trim() ? 0.4 : 1, marginBottom: '16px' }}>
                      + Add
                    </button>

                    {standardContent && (
                      <div style={{ marginBottom: '16px' }}>
                        <div style={{ fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                          Statements added:
                        </div>
                        {standardContent.split('\n').map((stmt, i) => (
                          <div key={i} style={{
                            display: 'flex', alignItems: 'flex-start', gap: '8px',
                            padding: '8px 10px', backgroundColor: 'white',
                            border: '1px solid #e5e7eb', borderRadius: '6px', marginBottom: '6px',
                          }}>
                            <span style={{ flex: 1, fontSize: '13px', color: '#374151' }}>{stmt}</span>
                            <button onClick={() => {
                              const lines = standardContent.split('\n').filter((_, idx) => idx !== i);
                              setStandardContent(lines.join('\n'));
                            }} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '14px', padding: 0 }}>✕</button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: '12px' }}>
                      <button onClick={() => setPhase('name')} style={secondaryBtn}>← Back</button>
                      <button onClick={handleAddSection} style={primaryBtn}>
                        {standardContent ? 'Save section →' : 'Skip statements →'}
                      </button>
                    </div>
                  </div>
                )}

                {/* BUTTON-BASED SECTIONS */}
                {question.hasButtons && (
                  <div>
                    {/* Button tabs */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px', alignItems: 'center' }}>
                      {buttons.map((btn, i) => (
                        <button
                          key={i}
                          onClick={() => { setActiveButtonIndex(i); setAddingNewButton(false); }}
                          style={{
                            padding: '6px 14px',
                            border: `2px solid ${accentColor}`,
                            borderRadius: '6px', fontSize: '13px', fontWeight: '600',
                            cursor: 'pointer',
                            backgroundColor: activeButtonIndex === i && !addingNewButton ? accentColor : 'white',
                            color: activeButtonIndex === i && !addingNewButton ? 'white' : accentColor,
                          }}
                        >
                          {btn.name || `Button ${i + 1}`}
                          {btn.statements.length > 0 && (
                            <span style={{ marginLeft: '6px', fontSize: '11px', opacity: 0.8 }}>({btn.statements.length})</span>
                          )}
                        </button>
                      ))}

                      {/* Add new button — only for free-button sections */}
                      {!isRatedFixed && !addingNewButton && (
                        <button
                          onClick={() => { setAddingNewButton(true); setNewButtonName(''); }}
                          style={{
                            padding: '6px 10px', border: `2px dashed ${accentColor}`,
                            borderRadius: '6px', fontSize: '14px', fontWeight: '700',
                            cursor: 'pointer', backgroundColor: 'white', color: accentColor,
                          }}
                        >+</button>
                      )}
                    </div>

                    {/* New button name input */}
                    {addingNewButton && (
                      <div style={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '12px', marginBottom: '16px' }}>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                          New button name:
                        </label>
                        <input type="text" value={newButtonName} onChange={e => setNewButtonName(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') handleConfirmNewButton(); }}
                          placeholder="e.g. Teamwork, Resilience..."
                          autoFocus style={{ ...inp, marginBottom: '10px' }} />
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={() => setAddingNewButton(false)} style={{ ...secondaryBtn, padding: '7px 16px', fontSize: '13px' }}>Cancel</button>
                          <button onClick={handleConfirmNewButton} disabled={!newButtonName.trim()}
                            style={{ ...smallBtn(accentColor), opacity: !newButtonName.trim() ? 0.4 : 1 }}>Add button</button>
                        </div>
                      </div>
                    )}

                    {/* Button name input for free-button sections (first button) */}
                    {!isRatedFixed && !addingNewButton && buttons[activeButtonIndex] && buttons[activeButtonIndex].name === '' && (
                      <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                          Name this button:
                        </label>
                        <input type="text"
                          value={buttons[activeButtonIndex]?.name || ''}
                          onChange={e => {
                            setButtons(prev => {
                              const updated = [...prev];
                              updated[activeButtonIndex] = { ...updated[activeButtonIndex], name: e.target.value };
                              return updated;
                            });
                          }}
                          placeholder="e.g. Effort, Teamwork, Attitude..."
                          autoFocus style={{ ...inp, borderColor: accentColor, marginBottom: '12px' }} />
                      </div>
                    )}

                    {/* Statement input */}
                    {(isRatedFixed || buttons[activeButtonIndex]?.name) && !addingNewButton && (
                      <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                          Paste a statement for <span style={{ color: accentColor }}>{buttons[activeButtonIndex]?.name || `Button ${activeButtonIndex + 1}`}</span>:
                        </label>
                        <textarea
                          ref={statementInputRef}
                          value={newStatement}
                          onChange={e => setNewStatement(e.target.value)}
                          placeholder={`Paste or type a statement... Use [Name] for pupil name.`}
                          style={{ ...txa, borderColor: accentColor, marginBottom: '8px' }}
                        />
                        <button onClick={handleAddStatement} disabled={!newStatement.trim()}
                          style={{ ...smallBtn(accentColor), opacity: !newStatement.trim() ? 0.4 : 1, marginBottom: '16px' }}>
                          + Add
                        </button>

                        {/* Statements for active button */}
                        {buttons[activeButtonIndex]?.statements.length > 0 && (
                          <div style={{ marginBottom: '16px' }}>
                            {buttons[activeButtonIndex].statements.map((stmt, i) => (
                              <div key={i} style={{
                                display: 'flex', alignItems: 'flex-start', gap: '8px',
                                padding: '8px 10px', backgroundColor: 'white',
                                border: '1px solid #e5e7eb', borderRadius: '6px', marginBottom: '6px',
                              }}>
                                <span style={{ flex: 1, fontSize: '13px', color: '#374151' }}>{stmt}</span>
                                <button onClick={() => handleRemoveStatement(activeButtonIndex, i)}
                                  style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '14px', padding: 0 }}>✕</button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: '12px' }}>
                      <button onClick={() => setPhase('name')} style={secondaryBtn}>← Back</button>
                      <button onClick={handleAddSection} style={primaryBtn}>
                        Save section →
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── PHASE: ADDED ─────────────────────────────────────────── */}
            {phase === 'added' && (
              <div>
                <div style={{
                  backgroundColor: '#d1fae5', color: '#065f46',
                  borderRadius: '8px', padding: '12px 16px',
                  fontSize: '13px', fontWeight: '600', marginBottom: '20px',
                }}>
                  ✓ Section added
                </div>
                {question.allowMultiple && (
                  <>
                    <p style={{ fontSize: '14px', color: '#374151', marginBottom: '16px' }}>
                      Would you like to add another {SECTION_LABELS[question.sectionType].toLowerCase()} section?
                    </p>
                    <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                      <button onClick={advanceQuestion} style={secondaryBtn}>No, continue →</button>
                      <button onClick={handleAddAnother} style={primaryBtn}>Yes, add another</button>
                    </div>
                  </>
                )}
                {!question.allowMultiple && (
                  <button onClick={advanceQuestion} style={primaryBtn}>Continue →</button>
                )}
              </div>
            )}

            {/* Sections added so far — mini summary */}
            {addedSections.length > 0 && (
              <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid #f3f4f6' }}>
                <div style={{ fontSize: '12px', fontWeight: '600', color: '#9ca3af', marginBottom: '8px' }}>
                  SECTIONS ADDED SO FAR
                </div>
                {addedSections.map(s => (
                  <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: SECTION_COLORS[s.type], flexShrink: 0 }} />
                    <span style={{ fontSize: '13px', color: '#374151' }}>{s.name || SECTION_LABELS[s.type]}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right — Reports panel */}
        {reportsPanelOpen && (
          <div style={{
            flex: '0 0 50%',
            borderLeft: '1px solid #e5e7eb',
            backgroundColor: 'white',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #f3f4f6' }}>
              <div style={{ fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '4px' }}>
                Paste existing reports here
              </div>
              <div style={{ fontSize: '12px', color: '#6b7280', lineHeight: '1.5' }}>
                Use these as a reference while you work through the questions. Up to 10 reports is plenty — even one or two helps.
              </div>
            </div>
            <div style={{ flex: 1, padding: '16px 20px', overflowY: 'auto' }}>
              <textarea
                value={pastedReports}
                onChange={e => setPastedReports(e.target.value)}
                placeholder="Paste your existing reports here. Separate each report with a blank line or a line of dashes (---). These are for your reference only."
                style={{
                  width: '100%',
                  height: '100%',
                  minHeight: '400px',
                  padding: '12px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '13px',
                  lineHeight: '1.7',
                  outline: 'none',
                  resize: 'none',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit',
                  color: '#374151',
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BuildAsYouGo;