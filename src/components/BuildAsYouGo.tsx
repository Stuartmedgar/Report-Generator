import React, { useState, useRef, useEffect } from 'react';
import { TemplateSection, SectionType } from '../types';

interface BuildAsYouGoProps {
  templateName: string;
  onComplete: (sections: TemplateSection[]) => void;
  onCancel: () => void;
}

interface StatementButton {
  name: string;
  statements: string[];
}

interface AddedSection {
  id: string;
  type: SectionType;
  name: string;
  buttons: StatementButton[];
  content: string;
  instruction: string;
}

interface Question {
  id: string;
  question: string;
  description: string;
  sectionType: SectionType;
  namePlaceholder: string;
  defaultName: string;
  allowMultiple: boolean;
  hasButtons: boolean;
  noName?: boolean;
  isRatedFixed?: boolean;
  examples?: string[]; // Fix 2: example sentences per section type
}

// Fix 4 & 6 & 7: removed optional-comment and new-line questions,
// replaced with a catch-all "other comments" question and a final choice question
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
    examples: [
      '[Name] is a valued member of the class and contributes positively to our learning environment.',
      'It has been a pleasure teaching [Name] this term.',
      '[Name] has worked hard throughout this session and should be proud of their efforts.',
    ],
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
    examples: [
      '[Name] consistently demonstrates excellent effort and a positive attitude towards learning.',
      '[Name] is a natural leader who supports and encourages classmates.',
      '[Name] shows great resilience and perseverance when faced with challenges.',
    ],
  },
  {
    id: 'rated-comment',
    question: 'Do your reports rate pupils on their performance?',
    description: 'Comments tied to a rating — Excellent, Good, Satisfactory, Needs Improvement. Button names can be edited to suit your school\'s language.',
    sectionType: 'rated-comment',
    namePlaceholder: 'e.g. Progress, Effort Rating',
    defaultName: 'Progress',
    allowMultiple: true,
    hasButtons: true,
    isRatedFixed: true,
    examples: [
      '[Name] has made excellent progress this term and consistently produces work of the highest standard.',
      '[Name] is making good progress and demonstrates a solid understanding of the key concepts.',
      '[Name] needs to focus on consolidating their understanding of the core topics covered this term.',
    ],
  },
  {
    id: 'assessment-comment',
    question: 'Do your reports include assessment results with a score?',
    description: 'Comments linked to a score or percentage. Create your own performance buttons to suit the assessment.',
    sectionType: 'assessment-comment',
    namePlaceholder: 'e.g. Assessment Result, Test Score',
    defaultName: 'Assessment',
    allowMultiple: true,
    hasButtons: true,
    isRatedFixed: false,
    examples: [
      '[Name] achieved [Score] in the recent assessment, which reflects their hard work throughout the unit.',
      '[Name] scored [Score] in the [Score 2] assessment, demonstrating a strong grasp of the material.',
      'In the recent assessment [Name] achieved [Score], which is an area we will continue to develop.',
    ],
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
    examples: [
      '[Name] has shown particular enthusiasm for [Info 1] this term and has made impressive progress.',
      'It was great to see [Name] represent the school in [Info 1] — a real achievement.',
      '[Name]\'s involvement in [Info 1] has had a positive impact on their confidence and skills.',
    ],
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
    examples: [
      '[Name] should focus on developing their extended writing skills to reach the next level.',
      'To continue improving, [Name] should practise their times tables regularly at home.',
      '[Name]\'s next step is to take more risks in their learning and back their own judgement.',
    ],
  },
  {
    id: 'other-comments',
    question: 'Do your reports contain any other types of comments?',
    description: 'If your reports include any other categories of comment not covered above, add them here as a free-choice section.',
    sectionType: 'qualities', // uses the same free-button structure as qualities
    namePlaceholder: 'e.g. Behaviour, Homework, Wider Achievement',
    defaultName: 'Other Comments',
    allowMultiple: true,
    hasButtons: true,
    examples: [
      '[Name] consistently demonstrates excellent behaviour and is a pleasure to have in class.',
      '[Name] completes homework to a high standard and always meets deadlines.',
      '[Name] has made a significant contribution to the wider life of the school this year.',
    ],
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
  'other-comments': 'Other Comments',
};

const DEFAULT_RATED_BUTTONS = ['Excellent', 'Good', 'Satisfactory', 'Needs Improvement'];
const RATED_KEYS = ['excellent', 'good', 'satisfactory', 'needsImprovement'];

const makeId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

// ─── AUTOSAVE helper ──────────────────────────────────────────────────────────
const AUTOSAVE_KEY = 'buildAsYouGo_draft';

function saveDraft(templateName: string, sections: AddedSection[]) {
  try {
    localStorage.setItem(AUTOSAVE_KEY, JSON.stringify({ templateName, sections, savedAt: Date.now() }));
  } catch (_) {}
}

function clearDraft() {
  try { localStorage.removeItem(AUTOSAVE_KEY); } catch (_) {}
}

const BuildAsYouGo: React.FC<BuildAsYouGoProps> = ({ templateName, onComplete, onCancel }) => {

  const [reportsPanelOpen, setReportsPanelOpen] = useState(true);
  const [pastedReports, setPastedReports] = useState('');

  const [currentStep, setCurrentStep] = useState(0);
  const [addedSections, setAddedSections] = useState<AddedSection[]>([]);

  // Fix 7: 'questions' | 'final-choice' | 'summary'
  const [screen, setScreen] = useState<'questions' | 'final-choice' | 'summary'>('questions');

  // Fix 3: which section is being edited in summary
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);

  const [phase, setPhase] = useState<'ask' | 'name' | 'instruction' | 'statements' | 'added'>('ask');
  const [sectionName, setSectionName] = useState('');
  const [sectionInstruction, setSectionInstruction] = useState('');

  const [buttons, setButtons] = useState<StatementButton[]>([]);
  const [activeButtonIndex, setActiveButtonIndex] = useState(0);
  const [newStatement, setNewStatement] = useState('');
  const [newButtonName, setNewButtonName] = useState('');
  const [addingNewButton, setAddingNewButton] = useState(false);
  const [namingButtonIndex, setNamingButtonIndex] = useState<number | null>(null);
  const [namingButtonValue, setNamingButtonValue] = useState('');
  const [standardContent, setStandardContent] = useState('');

  // Fix 2: examples dropdown
  const [showExamples, setShowExamples] = useState(false);

  const statementInputRef = useRef<HTMLTextAreaElement>(null);

  const question = QUESTIONS[currentStep];
  const isLastQuestion = currentStep === QUESTIONS.length - 1;
  const isRatedFixed = question?.isRatedFixed === true;
  const isAssessment = question?.sectionType === 'assessment-comment';

  // Fix 5: autosave whenever sections change
  useEffect(() => {
    if (addedSections.length > 0) {
      saveDraft(templateName, addedSections);
    }
  }, [addedSections, templateName]);

  const resetQuestion = () => {
    setPhase('ask');
    setSectionName('');
    setSectionInstruction('');
    setButtons([]);
    setActiveButtonIndex(0);
    setNewStatement('');
    setNewButtonName('');
    setAddingNewButton(false);
    setNamingButtonIndex(null);
    setNamingButtonValue('');
    setStandardContent('');
    setShowExamples(false);
  };

  // Fix 1: go back to previous question
  const handlePreviousQuestion = () => {
    if (currentStep > 0) {
      setCurrentStep(s => s - 1);
      resetQuestion();
    }
  };

  const advanceQuestion = () => {
    if (isLastQuestion) {
      setScreen('final-choice');
    } else {
      setCurrentStep(s => s + 1);
      resetQuestion();
    }
  };

  const handleYes = () => { setSectionName(question.defaultName); setPhase('name'); };
  const handleNo = () => advanceQuestion();

  const handleNameConfirmed = () => {
    if (question.noName) { handleAddSection(); return; }
    if (!sectionName.trim()) return;
    if (isAssessment) { setSectionInstruction(''); setPhase('instruction'); return; }
    if (question.hasButtons) {
      if (isRatedFixed) {
        setButtons(DEFAULT_RATED_BUTTONS.map(n => ({ name: n, statements: [] })));
      } else {
        setButtons([{ name: '', statements: [] }]);
        setNamingButtonIndex(0);
        setNamingButtonValue('');
      }
      setActiveButtonIndex(0);
      setPhase('statements');
    } else {
      setPhase('statements');
    }
  };

  const handleInstructionConfirmed = () => {
    setButtons([{ name: '', statements: [] }]);
    setNamingButtonIndex(0);
    setNamingButtonValue('');
    setActiveButtonIndex(0);
    setPhase('statements');
  };

  const handleConfirmButtonName = () => {
    if (!namingButtonValue.trim()) return;
    setButtons(prev => {
      const updated = [...prev];
      updated[namingButtonIndex!] = { ...updated[namingButtonIndex!], name: namingButtonValue.trim() };
      return updated;
    });
    setNamingButtonIndex(null);
    setNamingButtonValue('');
  };

  const handleAddStatement = () => {
    if (!newStatement.trim()) return;
    setButtons(prev => {
      const updated = [...prev];
      updated[activeButtonIndex] = { ...updated[activeButtonIndex], statements: [...updated[activeButtonIndex].statements, newStatement.trim()] };
      return updated;
    });
    setNewStatement('');
    statementInputRef.current?.focus();
  };

  const handleRemoveStatement = (buttonIdx: number, stmtIdx: number) => {
    setButtons(prev => {
      const updated = [...prev];
      updated[buttonIdx] = { ...updated[buttonIdx], statements: updated[buttonIdx].statements.filter((_, i) => i !== stmtIdx) };
      return updated;
    });
  };

  const handleConfirmNewButton = () => {
    if (!newButtonName.trim()) return;
    const newIdx = buttons.length;
    setButtons(prev => [...prev, { name: newButtonName.trim(), statements: [] }]);
    setActiveButtonIndex(newIdx);
    setNewButtonName('');
    setAddingNewButton(false);
  };

  const handleRatedButtonRename = (idx: number, value: string) => {
    setButtons(prev => { const updated = [...prev]; updated[idx] = { ...updated[idx], name: value }; return updated; });
  };

  const handleAddSection = () => {
    const name = question.noName ? question.defaultName : sectionName.trim() || question.defaultName;
    const newSection: AddedSection = {
      id: editingSectionId || makeId(),
      type: question.sectionType,
      name,
      buttons: question.hasButtons ? buttons : [],
      content: standardContent,
      instruction: sectionInstruction,
    };

    if (editingSectionId) {
      // Fix 3: update existing section
      setAddedSections(prev => prev.map(s => s.id === editingSectionId ? newSection : s));
      setEditingSectionId(null);
      setScreen('summary');
    } else {
      setAddedSections(prev => [...prev, newSection]);
      setPhase('added');
    }
  };

  const handleAddAnother = () => {
    setSectionName(question.defaultName);
    setSectionInstruction('');
    setPhase('name');
    setButtons([]);
    setActiveButtonIndex(0);
    setNewStatement('');
    setNewButtonName('');
    setAddingNewButton(false);
    setNamingButtonIndex(null);
    setNamingButtonValue('');
    setStandardContent('');
    setShowExamples(false);
  };

  // Fix 3: edit an existing section from summary
  const handleEditExistingSection = (section: AddedSection) => {
    // Find which question matches this section type
    const qIdx = QUESTIONS.findIndex(q => {
      if (section.type === 'qualities' && section.name === 'Other Comments') return q.id === 'other-comments';
      return q.sectionType === section.type;
    });
    if (qIdx === -1) return;

    setCurrentStep(qIdx);
    setEditingSectionId(section.id);
    setSectionName(section.name);
    setSectionInstruction(section.instruction || '');
    setButtons(section.buttons.length > 0 ? section.buttons : [{ name: '', statements: [] }]);
    setActiveButtonIndex(0);
    setStandardContent(section.content || '');
    setNamingButtonIndex(null);
    setNamingButtonValue('');
    setAddingNewButton(false);
    setShowExamples(false);
    setPhase('statements');
    setScreen('questions');
  };

  const handleMoveSection = (index: number, direction: 'up' | 'down') => {
    const next = [...addedSections];
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setAddedSections(next);
  };

  const handleRemoveSection = (id: string) => setAddedSections(prev => prev.filter(s => s.id !== id));

  const handleComplete = () => {
    if (addedSections.length === 0) { alert('Please add at least one section to your template.'); return; }
    const sections: TemplateSection[] = addedSections.map(s => {
      let data: any = {};
      if (s.type === 'standard-comment') {
        data = { content: s.content || '' };
      } else if (s.type === 'qualities') {
        const comments: Record<string, string[]> = {};
        s.buttons.forEach(b => { if (b.name) comments[b.name] = b.statements; });
        data = { comments };
      } else if (s.type === 'rated-comment') {
        const comments: Record<string, string[]> = {};
        s.buttons.forEach((b, i) => { const key = RATED_KEYS[i] || b.name.toLowerCase().replace(/\s+/g, ''); comments[key] = b.statements; });
        data = { comments };
      } else if (s.type === 'assessment-comment') {
        const comments: Record<string, string[]> = {};
        s.buttons.forEach(b => { if (b.name) comments[b.name] = b.statements; });
        data = { comments, instruction: s.instruction || '' };
      } else if (s.type === 'personalised-comment') {
        const categories: Record<string, string[]> = {};
        s.buttons.forEach(b => { if (b.name) categories[b.name] = b.statements; });
        data = { categories, instruction: '' };
      } else if (s.type === 'next-steps') {
        const focusAreas: Record<string, string[]> = {};
        s.buttons.forEach(b => { if (b.name) focusAreas[b.name] = b.statements; });
        data = { focusAreas };
      }
      return { id: s.id, type: s.type, name: s.name, data };
    });
    clearDraft();
    onComplete(sections);
  };

  // Fix 5: warn before cancelling
  const handleCancel = () => {
    if (addedSections.length > 0) {
      const ok = window.confirm('You have sections in progress. Your work has been saved as a draft — but going back will exit this wizard. Continue?');
      if (!ok) return;
    }
    onCancel();
  };

  // ─── STYLES ───────────────────────────────────────────────────────────

  const primaryBtn: React.CSSProperties = { backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', padding: '11px 24px', fontSize: '15px', fontWeight: '600', cursor: 'pointer' };
  const secondaryBtn: React.CSSProperties = { backgroundColor: '#f3f4f6', color: '#374151', border: 'none', borderRadius: '8px', padding: '11px 24px', fontSize: '15px', fontWeight: '500', cursor: 'pointer' };
  const smallBtn = (color: string): React.CSSProperties => ({ backgroundColor: color, color: 'white', border: 'none', borderRadius: '6px', padding: '6px 14px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' });
  const inp: React.CSSProperties = { width: '100%', padding: '10px 14px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', textAlign: 'left' };
  const txa: React.CSSProperties = { ...inp, resize: 'vertical' };

  const accentColor = question ? (SECTION_COLORS[question.sectionType] || '#3b82f6') : '#3b82f6';

  // ─── REPORTS PANEL (shared) ───────────────────────────────────────────

  const ReportsPanel = () => (
    <div style={{ flex: '0 0 45%', borderLeft: '1px solid #e5e7eb', backgroundColor: 'white', display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid #f3f4f6', flexShrink: 0 }}>
        <div style={{ fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '4px' }}>Your existing reports</div>
        <div style={{ fontSize: '12px', color: '#6b7280', lineHeight: '1.5' }}>
          Paste reports here as a reference. Up to 10 is plenty — even one or two helps.
        </div>
      </div>
      <div style={{ flex: 1, padding: '16px 20px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <textarea value={pastedReports} onChange={e => setPastedReports(e.target.value)}
          placeholder="Paste your existing reports here. Separate each with a blank line or ---."
          style={{ flex: 1, width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '13px', lineHeight: '1.7', outline: 'none', resize: 'none', boxSizing: 'border-box', fontFamily: 'inherit', color: '#374151', whiteSpace: 'pre-wrap', textAlign: 'left' }} />
      </div>
    </div>
  );

  // ─── TOP BAR (shared) ─────────────────────────────────────────────────

  const TopBar = () => (
    <div style={{ backgroundColor: 'white', borderBottom: '1px solid #e5e7eb', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
      <div style={{ fontSize: '14px', fontWeight: '600', color: '#374151' }}>{templateName}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {screen === 'questions' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '120px', height: '4px', backgroundColor: '#e5e7eb', borderRadius: '2px' }}>
              <div style={{ width: `${((currentStep + 1) / QUESTIONS.length) * 100}%`, height: '100%', backgroundColor: '#3b82f6', borderRadius: '2px', transition: 'width 0.3s ease' }} />
            </div>
            <span style={{ fontSize: '12px', color: '#6b7280' }}>{currentStep + 1}/{QUESTIONS.length}</span>
          </div>
        )}
        <button onClick={() => setReportsPanelOpen(o => !o)}
          style={{ backgroundColor: '#f3f4f6', color: '#6b7280', border: '1px solid #d1d5db', borderRadius: '6px', padding: '6px 14px', fontSize: '13px', fontWeight: '500', cursor: 'pointer' }}>
          {reportsPanelOpen ? 'Hide reports' : '📄 Show reports'}
        </button>
        {/* Fix 5: warn before cancelling */}
        <button onClick={handleCancel} style={{ background: 'none', border: 'none', color: '#9ca3af', fontSize: '13px', cursor: 'pointer' }}>← Back</button>
      </div>
    </div>
  );

  // ─── FINAL CHOICE SCREEN (Fix 7) ──────────────────────────────────────

  if (screen === 'final-choice') {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <TopBar />
        <div style={{ flex: 1, display: 'flex', width: '100%', overflow: 'hidden', minHeight: 0 }}>
          <div style={{ flex: 1, overflowY: 'auto', padding: '32px 40px', display: 'flex', alignItems: 'flex-start', justifyContent: 'center' }}>
            <div style={{ maxWidth: '520px', width: '100%' }}>
              <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#111827', marginBottom: '10px' }}>
                Your template is ready to use.
              </h2>
              <p style={{ fontSize: '15px', color: '#6b7280', marginBottom: '32px', lineHeight: '1.6' }}>
                You can start writing reports now and add more comments as you go — or review your template first and add more statements from your existing reports.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
                <button onClick={handleComplete}
                  style={{ ...primaryBtn, fontSize: '16px', padding: '16px 24px', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '24px' }}>✏️</span>
                  <div>
                    <div style={{ fontWeight: '700' }}>Start writing reports</div>
                    <div style={{ fontSize: '13px', fontWeight: '400', opacity: 0.85 }}>Go straight to the report writer with the template as it is</div>
                  </div>
                </button>

                <button onClick={() => setScreen('summary')}
                  style={{ ...secondaryBtn, fontSize: '16px', padding: '16px 24px', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '12px', border: '2px solid #e5e7eb' }}>
                  <span style={{ fontSize: '24px' }}>📋</span>
                  <div>
                    <div style={{ fontWeight: '700', color: '#111827' }}>Review and add more statements</div>
                    <div style={{ fontSize: '13px', color: '#6b7280' }}>Reorder sections and add more comments from your existing reports</div>
                  </div>
                </button>
              </div>

              {/* Sections summary */}
              <div style={{ fontSize: '12px', fontWeight: '600', color: '#9ca3af', marginBottom: '10px' }}>SECTIONS IN YOUR TEMPLATE</div>
              {addedSections.map(s => (
                <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: SECTION_COLORS[s.type] || '#9ca3af', flexShrink: 0 }} />
                  <span style={{ fontSize: '13px', color: '#374151' }}>{s.name || SECTION_LABELS[s.type]}</span>
                </div>
              ))}
            </div>
          </div>
          {reportsPanelOpen && <ReportsPanel />}
        </div>
      </div>
    );
  }

  // ─── SUMMARY SCREEN (Fix 3 & 8) ───────────────────────────────────────

  if (screen === 'summary') {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <TopBar />
        <div style={{ flex: 1, display: 'flex', width: '100%', overflow: 'hidden', minHeight: 0 }}>
          <div style={{ flex: 1, overflowY: 'auto', padding: '32px 40px', minWidth: 0 }}>
            <div style={{ maxWidth: '680px', width: '100%', margin: '0 auto' }}>
              <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#111827', marginBottom: '8px' }}>Review your template</h1>
              <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '24px' }}>
                Reorder or remove sections. Click any section to edit it and add more statements.
              </p>

              {addedSections.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px', color: '#9ca3af', border: '2px dashed #e5e7eb', borderRadius: '8px', marginBottom: '24px' }}>No sections added yet.</div>
              ) : (
                <div style={{ marginBottom: '24px' }}>
                  {addedSections.map((s, index) => {
                    const totalStatements = s.buttons.reduce((acc, b) => acc + b.statements.length, 0) + (s.content ? 1 : 0);
                    return (
                      <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', marginBottom: '8px', cursor: 'pointer' }}
                        onClick={() => handleEditExistingSection(s)}>
                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: SECTION_COLORS[s.type] || '#9ca3af', flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                          <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>{s.name || SECTION_LABELS[s.type]}</div>
                          <div style={{ fontSize: '11px', color: '#9ca3af' }}>
                            {SECTION_LABELS[s.type]}
                            {totalStatements > 0 && ` · ${totalStatements} statement${totalStatements !== 1 ? 's' : ''}`}
                            {s.buttons.filter(b => b.name).length > 0 && s.type !== 'standard-comment' && ` · ${s.buttons.filter(b => b.name).length} button${s.buttons.filter(b => b.name).length !== 1 ? 's' : ''}`}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '4px' }} onClick={e => e.stopPropagation()}>
                          <button onClick={() => handleMoveSection(index, 'up')} disabled={index === 0}
                            style={{ ...secondaryBtn, padding: '4px 10px', fontSize: '12px', opacity: index === 0 ? 0.4 : 1 }}>▲</button>
                          <button onClick={() => handleMoveSection(index, 'down')} disabled={index === addedSections.length - 1}
                            style={{ ...secondaryBtn, padding: '4px 10px', fontSize: '12px', opacity: index === addedSections.length - 1 ? 0.4 : 1 }}>▼</button>
                          <button onClick={() => handleRemoveSection(s.id)}
                            style={{ backgroundColor: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '6px', padding: '4px 10px', fontSize: '12px', cursor: 'pointer' }}>✕</button>
                        </div>
                        <div style={{ fontSize: '12px', color: '#9ca3af' }}>✏️ Edit</div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button onClick={() => setScreen('final-choice')} style={secondaryBtn}>← Back</button>
                <button onClick={handleComplete} disabled={addedSections.length === 0}
                  style={{ ...primaryBtn, opacity: addedSections.length === 0 ? 0.4 : 1, cursor: addedSections.length === 0 ? 'not-allowed' : 'pointer' }}>
                  Start writing reports →
                </button>
              </div>
            </div>
          </div>
          {/* Fix 8: reports panel visible at summary */}
          {reportsPanelOpen && <ReportsPanel />}
        </div>
      </div>
    );
  }

  // ─── QUESTIONS SCREEN ─────────────────────────────────────────────────

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <TopBar />
      <div style={{ flex: 1, display: 'flex', width: '100%', overflow: 'hidden', minHeight: 0 }}>

        {/* Left panel */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '32px 40px', minWidth: 0 }}>
          <div style={{ maxWidth: '560px', width: '100%', margin: '0 auto' }}>

            <div style={{ display: 'inline-block', backgroundColor: accentColor + '20', color: accentColor, border: `1px solid ${accentColor}40`, borderRadius: '20px', padding: '4px 12px', fontSize: '12px', fontWeight: '600', marginBottom: '16px' }}>
              {SECTION_LABELS[question.sectionType] || question.id}
            </div>

            <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#111827', marginBottom: '10px', lineHeight: '1.3', textAlign: 'left' }}>{question.question}</h2>
            <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '20px', lineHeight: '1.6', textAlign: 'left' }}>{question.description}</p>

            {/* Fix 2: examples dropdown */}
            {question.examples && phase !== 'ask' && (
              <div style={{ marginBottom: '20px' }}>
                <button onClick={() => setShowExamples(o => !o)}
                  style={{ background: 'none', border: 'none', color: accentColor, fontSize: '13px', cursor: 'pointer', padding: 0, fontWeight: '500', textDecoration: 'underline' }}>
                  {showExamples ? '▲ Hide examples' : '▼ See example statements'}
                </button>
                {showExamples && (
                  <div style={{ marginTop: '10px', backgroundColor: 'white', border: `1px solid ${accentColor}40`, borderRadius: '8px', padding: '12px' }}>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>Click to copy into the paste area:</div>
                    {question.examples.map((ex, i) => (
                      <div key={i} onClick={() => { setNewStatement(ex); setShowExamples(false); statementInputRef.current?.focus(); }}
                        style={{ fontSize: '13px', color: '#374151', padding: '8px 10px', borderRadius: '6px', cursor: 'pointer', marginBottom: '4px', backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', textAlign: 'left' }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = accentColor + '15'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = '#f9fafb'}>
                        {ex}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── ASK ── */}
            {phase === 'ask' && (
              <div>
                <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                  <button onClick={handleYes} style={{ ...primaryBtn, flex: 1 }}>Yes</button>
                  <button onClick={handleNo} style={{ ...secondaryBtn, flex: 1 }}>No</button>
                </div>
                {/* Fix 1: back to previous question */}
                {currentStep > 0 && (
                  <button onClick={handlePreviousQuestion}
                    style={{ background: 'none', border: 'none', color: '#9ca3af', fontSize: '13px', cursor: 'pointer', padding: 0 }}>
                    ← Previous question
                  </button>
                )}
              </div>
            )}

            {/* ── NAME ── */}
            {phase === 'name' && !question.noName && (
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '8px', textAlign: 'left' }}>
                  What would you like to call this section?
                </label>
                <input type="text" value={sectionName} onChange={e => setSectionName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleNameConfirmed(); }}
                  placeholder={question.namePlaceholder} autoFocus
                  style={{ ...inp, borderColor: accentColor, marginBottom: '16px' }} />
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button onClick={() => setPhase('ask')} style={secondaryBtn}>← Back</button>
                  <button onClick={handleNameConfirmed} disabled={!sectionName.trim()}
                    style={{ ...primaryBtn, opacity: !sectionName.trim() ? 0.4 : 1 }}>Continue →</button>
                </div>
              </div>
            )}

            {/* ── INSTRUCTION (assessment) ── */}
            {phase === 'instruction' && (
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '8px', textAlign: 'left' }}>
                  What does the score represent? (optional reminder for when you write reports)
                </label>
                <input type="text" value={sectionInstruction} onChange={e => setSectionInstruction(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleInstructionConfirmed(); }}
                  placeholder="e.g. Black Death test score, Reading assessment percentage..."
                  autoFocus style={{ ...inp, marginBottom: '8px' }} />
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '16px', fontStyle: 'italic', textAlign: 'left' }}>
                  This note will appear in the report writer to remind you what score to enter.
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button onClick={() => setPhase('name')} style={secondaryBtn}>← Back</button>
                  <button onClick={handleInstructionConfirmed} style={primaryBtn}>Continue →</button>
                </div>
              </div>
            )}

            {/* ── STATEMENTS ── */}
            {phase === 'statements' && (
              <div>
                {question.hasButtons && (
                  <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', color: '#166534', marginBottom: '20px', lineHeight: '1.5', textAlign: 'left' }}>
                    💡 Even 1–2 statements per button is enough to get started. You can add more as you write reports.
                  </div>
                )}

                {/* STANDARD COMMENT */}
                {!question.hasButtons && (
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '8px', textAlign: 'left' }}>
                      Paste your statement here:
                    </label>
                    <textarea value={standardContent} onChange={e => setStandardContent(e.target.value)}
                      placeholder="Paste or type the statement here... Use [Name] for pupil name."
                      style={{ ...txa, minHeight: '140px', borderColor: accentColor, marginBottom: '16px' }} />
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <button onClick={() => setPhase('name')} style={secondaryBtn}>← Back</button>
                      <button onClick={handleAddSection} style={primaryBtn}>{standardContent.trim() ? 'Save section →' : 'Skip →'}</button>
                    </div>
                  </div>
                )}

                {/* BUTTON-BASED */}
                {question.hasButtons && (
                  <div>
                    {/* Rated — editable fixed buttons */}
                    {isRatedFixed && (
                      <div style={{ marginBottom: '16px' }}>
                        <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px', textAlign: 'left', fontStyle: 'italic' }}>
                          Button names can be edited to suit your school's language.
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
                          {buttons.map((btn, i) => (
                            <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              <input type="text" value={btn.name} onChange={e => handleRatedButtonRename(i, e.target.value)}
                                onClick={() => { setActiveButtonIndex(i); setAddingNewButton(false); }}
                                onFocus={() => setActiveButtonIndex(i)}
                                style={{ padding: '6px 12px', border: `2px solid ${accentColor}`, borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', outline: 'none', backgroundColor: activeButtonIndex === i ? accentColor : 'white', color: activeButtonIndex === i ? 'white' : accentColor, width: '130px', textAlign: 'center' }} />
                              {btn.statements.length > 0 && <div style={{ fontSize: '10px', color: '#9ca3af', textAlign: 'center' }}>({btn.statements.length})</div>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Free buttons */}
                    {!isRatedFixed && (
                      <div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px', alignItems: 'center' }}>
                          {buttons.map((btn, i) => btn.name ? (
                            <button key={i} onClick={() => { setActiveButtonIndex(i); setAddingNewButton(false); setNamingButtonIndex(null); }}
                              style={{ padding: '6px 14px', border: `2px solid ${accentColor}`, borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', backgroundColor: activeButtonIndex === i && namingButtonIndex === null && !addingNewButton ? accentColor : 'white', color: activeButtonIndex === i && namingButtonIndex === null && !addingNewButton ? 'white' : accentColor }}>
                              {btn.name}{btn.statements.length > 0 && <span style={{ marginLeft: '6px', fontSize: '11px', opacity: 0.8 }}>({btn.statements.length})</span>}
                            </button>
                          ) : null)}
                          {/* Fix 2: + New Button label */}
                          {!addingNewButton && namingButtonIndex === null && (
                            <button onClick={() => {
                              if (buttons.some(b => !b.name)) {
                                const idx = buttons.findIndex(b => !b.name);
                                setNamingButtonIndex(idx); setNamingButtonValue(''); setActiveButtonIndex(idx);
                              } else { setAddingNewButton(true); setNewButtonName(''); }
                            }}
                              style={{ padding: '6px 14px', border: `2px dashed ${accentColor}`, borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', backgroundColor: 'white', color: accentColor }}>
                              + New Button
                            </button>
                          )}
                        </div>

                        {namingButtonIndex !== null && (
                          <div style={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '12px', marginBottom: '16px' }}>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '8px', textAlign: 'left' }}>Name this button:</label>
                            <input type="text" value={namingButtonValue} onChange={e => setNamingButtonValue(e.target.value)}
                              onKeyDown={e => { if (e.key === 'Enter') handleConfirmButtonName(); }}
                              placeholder="e.g. Effort, Teamwork, Attitude..." autoFocus style={{ ...inp, borderColor: accentColor, marginBottom: '10px' }} />
                            <button onClick={handleConfirmButtonName} disabled={!namingButtonValue.trim()}
                              style={{ ...smallBtn(accentColor), opacity: !namingButtonValue.trim() ? 0.4 : 1 }}>Confirm name</button>
                          </div>
                        )}

                        {addingNewButton && (
                          <div style={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '12px', marginBottom: '16px' }}>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '8px', textAlign: 'left' }}>New button name:</label>
                            <input type="text" value={newButtonName} onChange={e => setNewButtonName(e.target.value)}
                              onKeyDown={e => { if (e.key === 'Enter') handleConfirmNewButton(); }}
                              placeholder="e.g. Teamwork, Resilience..." autoFocus style={{ ...inp, marginBottom: '10px' }} />
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button onClick={() => setAddingNewButton(false)} style={{ ...secondaryBtn, padding: '7px 16px', fontSize: '13px' }}>Cancel</button>
                              <button onClick={handleConfirmNewButton} disabled={!newButtonName.trim()}
                                style={{ ...smallBtn(accentColor), opacity: !newButtonName.trim() ? 0.4 : 1 }}>Add button</button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Score placeholder hint for assessment */}
                    {isAssessment && (
                      <div style={{ backgroundColor: '#f3e8ff', border: '1px solid #d8b4fe', borderRadius: '8px', padding: '10px 14px', fontSize: '12px', color: '#7c3aed', marginBottom: '16px', textAlign: 'left', lineHeight: '1.5' }}>
                        <strong>Score placeholders:</strong> use <code>[Score]</code> for a single score, or <code>[Score 1]</code> <code>[Score 2]</code> for multiple scores.
                        {sectionInstruction && <div style={{ marginTop: '6px' }}><strong>Reminder:</strong> {sectionInstruction}</div>}
                      </div>
                    )}

                    {/* Statement input */}
                    {(isRatedFixed || (buttons[activeButtonIndex]?.name && namingButtonIndex === null)) && !addingNewButton && (
                      <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '8px', textAlign: 'left' }}>
                          Paste a statement for <span style={{ color: accentColor }}>{buttons[activeButtonIndex]?.name || `Button ${activeButtonIndex + 1}`}</span>:
                        </label>
                        <textarea ref={statementInputRef} value={newStatement} onChange={e => setNewStatement(e.target.value)}
                          placeholder="Paste or type a statement... Use [Name] for pupil name."
                          style={{ ...txa, minHeight: '80px', borderColor: accentColor, marginBottom: '8px' }} />
                        <button onClick={handleAddStatement} disabled={!newStatement.trim()}
                          style={{ ...smallBtn(accentColor), opacity: !newStatement.trim() ? 0.4 : 1, marginBottom: '16px' }}>+ Add</button>

                        {buttons[activeButtonIndex]?.statements.length > 0 && (
                          <div style={{ marginBottom: '16px' }}>
                            {buttons[activeButtonIndex].statements.map((stmt, i) => (
                              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '8px 10px', backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '6px', marginBottom: '6px', textAlign: 'left' }}>
                                <span style={{ flex: 1, fontSize: '13px', color: '#374151', textAlign: 'left' }}>{stmt}</span>
                                <button onClick={() => handleRemoveStatement(activeButtonIndex, i)}
                                  style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '14px', padding: 0, flexShrink: 0 }}>✕</button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: '12px' }}>
                      <button onClick={() => editingSectionId ? setScreen('summary') : setPhase('name')} style={secondaryBtn}>← Back</button>
                      <button onClick={handleAddSection} style={primaryBtn}>
                        {editingSectionId ? 'Save changes →' : 'Save section →'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── ADDED ── */}
            {phase === 'added' && (
              <div>
                <div style={{ backgroundColor: '#d1fae5', color: '#065f46', borderRadius: '8px', padding: '12px 16px', fontSize: '13px', fontWeight: '600', marginBottom: '20px', textAlign: 'left' }}>✓ Section added</div>
                {question.allowMultiple && (
                  <>
                    <p style={{ fontSize: '14px', color: '#374151', marginBottom: '16px', textAlign: 'left' }}>
                      Would you like to add another {SECTION_LABELS[question.sectionType]?.toLowerCase() || 'section'}?
                    </p>
                    <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                      <button onClick={advanceQuestion} style={secondaryBtn}>No, continue →</button>
                      <button onClick={handleAddAnother} style={primaryBtn}>Yes, add another</button>
                    </div>
                  </>
                )}
                {!question.allowMultiple && <button onClick={advanceQuestion} style={primaryBtn}>Continue →</button>}
              </div>
            )}

            {/* Sections added so far */}
            {addedSections.length > 0 && phase !== 'added' && (
              <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid #f3f4f6' }}>
                <div style={{ fontSize: '12px', fontWeight: '600', color: '#9ca3af', marginBottom: '8px', textAlign: 'left' }}>SECTIONS ADDED SO FAR</div>
                {addedSections.map(s => (
                  <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: SECTION_COLORS[s.type], flexShrink: 0 }} />
                    <span style={{ fontSize: '13px', color: '#374151', textAlign: 'left' }}>{s.name || SECTION_LABELS[s.type]}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {reportsPanelOpen && <ReportsPanel />}
      </div>
    </div>
  );
};

export default BuildAsYouGo;