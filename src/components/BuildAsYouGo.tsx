import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { TemplateSection, SectionType } from '../types';
import { useData } from '../contexts/DataContext';
import { SUBJECT_EXTRAS, SUBJECTS, STRENGTHS_ADDABLE_UNIVERSAL, STRENGTHS_ADDABLE_BY_SUBJECT, NEXT_STEPS_ADDABLE_UNIVERSAL, NEXT_STEPS_ADDABLE_BY_SUBJECT, DEVELOPMENT_ADDABLE_UNIVERSAL, DEVELOPMENT_ADDABLE_BY_SUBJECT, AddableButton } from '../data/starterComments';
import { callGenerateTemplate, InsufficientCreditError, AuthRequiredError } from '../services/aiTemplateService';

interface BuildAsYouGoProps {
  templateName: string;
  onComplete: (sections: TemplateSection[], name?: string) => void;
  onCancel: () => void;
}

interface StatementButton { name: string; statements: string[]; }

interface AddedSection {
  id: string; type: SectionType; name: string;
  buttons: StatementButton[]; content: string; instruction: string; showHeader?: boolean;
}

interface Question {
  id: string; question: string; description: string; sectionType: SectionType;
  namePlaceholder: string; defaultName: string; allowMultiple: boolean;
  hasButtons: boolean; isRatedFixed?: boolean; examples?: string[]; positionType: string;
}

// Generic assessment button pool (score-linked comments)
const ASSESSMENT_ADDABLE_UNIVERSAL: AddableButton[] = [
  { name: 'Excellent', statements: ['[Name] achieved an excellent score of [Score], reflecting consistent hard work and strong understanding throughout the unit.', '[Name] performed exceptionally well, scoring [Score] and demonstrating a thorough grasp of the material.', '[Name] achieved [Score] — an excellent result that reflects their commitment and ability.'] },
  { name: 'Good', statements: ['[Name] achieved a good score of [Score], demonstrating solid understanding of the key topics covered.', '[Name] performed well in the assessment, scoring [Score] and showing a good grasp of the material.', '[Name] scored [Score], which is a pleasing result that reflects their effort and engagement.'] },
  { name: 'Satisfactory', statements: ['[Name] achieved a score of [Score], which demonstrates a satisfactory understanding of the material covered.', '[Name] scored [Score] in the assessment, showing a reasonable grasp of the core topics.', '[Name] achieved [Score] — a satisfactory result, with room to improve through further review and practice.'] },
  { name: 'Needs Improvement', statements: ['[Name] scored [Score] in the assessment, indicating that further revision of the key topics is needed.', '[Name] achieved [Score], which suggests some gaps in understanding that should be addressed going forward.', '[Name] scored [Score] — with focused revision and practice, [Name] has the ability to improve significantly.'] },
  { name: 'Not Completed', statements: ['[Name] has not yet completed this assessment and will need to do so at the earliest opportunity.', '[Name] was absent for this assessment and arrangements will be made for it to be completed.', 'This assessment has not yet been completed by [Name].'] },
];

// Generic personalised-comment button pool (targets / specific info per pupil)
const PERSONALISED_ADDABLE_UNIVERSAL: AddableButton[] = [
  { name: 'Focus target', statements: ['[Name] should focus on [Info 1] as a key area for development going forward.', 'A key target for [Name] is to work on [Info 1] to continue making progress.', '[Name] has identified [Info 1] as an area to develop and is encouraged to focus on this.'] },
  { name: 'Achievement', statements: ['[Name] has shown particular enthusiasm for [Info 1] this session and has made impressive progress.', 'A highlight for [Name] this term has been [Info 1], where real progress has been made.', '[Name] has excelled in [Info 1], demonstrating real ability and commitment.'] },
  { name: 'Target grade', statements: ['[Name] is working towards a target grade of [Info 1] and is encouraged to keep this in mind.', 'With continued effort, [Name] is on track to achieve their target of [Info 1].', '[Name]\'s target grade of [Info 1] is achievable with sustained effort and focus.'] },
  { name: 'Personal goal', statements: ['[Name] has set a personal goal of [Info 1] and is working hard to achieve it.', 'A personal goal for [Name] is [Info 1] and they are making good progress towards this.', '[Name] is working towards [Info 1] and is encouraged to keep this goal in mind.'] },
];

// Areas for development buttons that can be added to next-steps or personalised sections
const DEVELOPMENT_BUTTONS_FOR_WIZARD: AddableButton[] = [
  { name: 'Written work', statements: ['[Name] should focus on developing their extended writing skills to improve the quality of their written work.', 'Improving the structure and detail of written responses is a key target for [Name] going forward.', '[Name] is encouraged to spend time developing their written communication skills.'] },
  { name: 'Exam technique', statements: ['[Name] should focus on developing their exam technique, particularly in managing time effectively.', 'Practising past paper questions will help [Name] improve their exam technique and confidence.', '[Name] would benefit from focusing on exam technique to ensure their knowledge is fully rewarded.'] },
  { name: 'Class participation', statements: ['[Name] should look to increase their participation in class discussions and activities.', 'Contributing more regularly to class discussions will help [Name] consolidate their understanding.', '[Name] is encouraged to share their ideas more confidently in class.'] },
  { name: 'Attention to detail', statements: ['[Name] should pay closer attention to detail in their work to avoid losing marks unnecessarily.', 'Taking more time to check work carefully will help [Name] improve accuracy and presentation.', '[Name] would benefit from developing greater attention to detail across all areas of their work.'] },
];

const QUESTIONS: Question[] = [
  { id: 'qualities', question: 'Do your reports comment on pupil qualities or strengths?', description: 'Comments picked from a set of options — for example effort, attitude, teamwork.', sectionType: 'qualities', namePlaceholder: 'e.g. Pupil Strengths, Character Qualities', defaultName: 'Pupil Strengths', allowMultiple: true, hasButtons: true, positionType: 'qualities', examples: ['[Name] consistently demonstrates excellent effort and a positive attitude towards learning.', '[Name] is a natural leader who supports and encourages classmates.', '[Name] shows great resilience and perseverance when faced with challenges.'] },
  { id: 'rated-comment', question: 'Do your reports rate pupils on their performance?', description: 'Comments tied to a rating — Excellent, Good, Satisfactory, Needs Improvement.', sectionType: 'rated-comment', namePlaceholder: 'e.g. Progress, Effort Rating', defaultName: 'Progress', allowMultiple: true, hasButtons: true, isRatedFixed: true, positionType: 'rating', examples: ['[Name] has made excellent progress this term and consistently produces work of the highest standard.', '[Name] needs to focus on consolidating their understanding of the core topics covered this term.'] },
  { id: 'assessment-comment', question: 'Do your reports include assessment results with a score?', description: 'Comments linked to a score or percentage — use [Score] as the placeholder.', sectionType: 'assessment-comment', namePlaceholder: 'e.g. Assessment Result, Test Score', defaultName: 'Assessment', allowMultiple: true, hasButtons: true, isRatedFixed: false, positionType: 'assessment-comment', examples: ['[Name] achieved [Score] in the recent assessment, which reflects their hard work throughout the unit.'] },
  { id: 'personalised-comment', question: 'Do your reports include targets or specific information per pupil?', description: 'Comments where a detail unique to each pupil is typed in — for example a target, sport, instrument, or achievement.', sectionType: 'personalised-comment', namePlaceholder: 'e.g. Personal Target, Focus Area, Activity', defaultName: 'Personal Target', allowMultiple: true, hasButtons: true, positionType: 'personalised-comment', examples: ['[Name] should focus on [Info 1] as a key area for development going forward.', '[Name] has shown particular enthusiasm for [Info 1] this term and has made impressive progress.'] },
  { id: 'next-steps', question: 'Do your reports include general next steps or areas for development?', description: 'Suggestions for what the pupil should focus on — chosen from a set of options rather than typed per pupil.', sectionType: 'next-steps', namePlaceholder: 'e.g. Pupil Next Steps, Areas for Development', defaultName: 'Pupil Next Steps', allowMultiple: true, hasButtons: true, positionType: 'next-steps', examples: ['[Name] should focus on developing their extended writing skills to reach the next level.', '[Name] should aim to consolidate the key topics covered this session through regular review.'] },
  { id: 'other-comments', question: 'Do your reports contain any other types of comments?', description: 'Any other categories not covered above — for example behaviour, homework, or wider achievement.', sectionType: 'qualities', namePlaceholder: 'e.g. Behaviour, Homework, Wider Achievement', defaultName: 'Other Comments', allowMultiple: true, hasButtons: true, positionType: 'qualities', examples: ['[Name] consistently demonstrates excellent behaviour and is a pleasure to have in class.', '[Name] completes homework to a high standard and always meets deadlines.'] },
];

const SECTION_COLORS: Record<string, string> = { 'standard-comment': '#10b981', 'qualities': '#8b5cf6', 'rated-comment': '#3b82f6', 'assessment-comment': '#8b5cf6', 'personalised-comment': '#f59e0b', 'next-steps': '#06b6d4', 'optional-additional-comment': '#ef4444', 'new-line': '#9ca3af' };
const SECTION_LABELS: Record<string, string> = { 'standard-comment': 'Fixed Statement', 'qualities': 'Qualities / Strengths', 'rated-comment': 'Rated Comment', 'assessment-comment': 'Assessment Score', 'personalised-comment': 'Personalised Comment', 'next-steps': 'Next Steps / Targets', 'optional-additional-comment': 'Optional Notes Box', 'new-line': 'Line Break' };
const SUBJECT_ICONS: Record<string, string> = { 'PE': '🏃', 'English': '📖', 'Maths': '📐', 'Science': '🔬', 'History': '🏛️', 'Geography': '🌍', 'Modern Languages': '💬', 'Art & Design': '🎨', 'Music': '🎵', 'Generic': '📋' };
const DEFAULT_RATED_BUTTONS = ['Excellent', 'Good', 'Satisfactory', 'Needs Improvement'];
const MAX_STATEMENTS = 8;
const makeId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
const AUTOSAVE_KEY = 'buildAsYouGo_draft';
function saveDraft(n: string, s: AddedSection[]) { try { localStorage.setItem(AUTOSAVE_KEY, JSON.stringify({ templateName: n, sections: s, savedAt: Date.now() })); } catch (_) {} }
function clearDraft() { try { localStorage.removeItem(AUTOSAVE_KEY); } catch (_) {} }
const normalizeForDedupe = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ');


const HelpStep = ({ text, tip }: { text: React.ReactNode; tip: string }) => {
  const [hover, setHover] = React.useState(false);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
      <span style={{ flex: 1 }}>{text}</span>
      <span style={{ position: 'relative', flexShrink: 0 }} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
        <span style={{ fontSize: '10px', fontWeight: '700', border: '1px solid currentColor', borderRadius: '50%', width: '14px', height: '14px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'default', opacity: 0.65 }}>?</span>
        {hover && (
          <div style={{ position: 'absolute', right: 0, top: '18px', width: '220px', backgroundColor: '#1e293b', color: 'white', padding: '8px 10px', borderRadius: '6px', fontSize: '11px', lineHeight: '1.5', zIndex: 100, boxShadow: '0 4px 12px rgba(0,0,0,0.25)', pointerEvents: 'none' }}>
            {tip}
          </div>
        )}
      </span>
    </div>
  );
};

type Screen = 'subject' | 'wizard';

type TipsTab = 'reports' | 'ai' | 'scratch';

const QUICK_TIPS: Record<TipsTab, string[]> = {
  reports: [
    'Copy your reports into the paste panel provided.',
    "Don't worry about the order sections appear in — you can freely reorder them later, during final editing.",
    'Want more than one statement to appear in an area, e.g. pupil strengths? Build one section with all the statements, then duplicate it during final editing — each duplicate adds one more statement to the report.',
    'Everything stays editable, both during final editing and later while writing each report.',
  ],
  ai: [
    'Check the buttons and statements the AI creates before moving on — it can occasionally make mistakes or miss the mark, so review them against what you actually want.',
    "You can edit anything the AI adds afterwards, so don't worry about getting it perfect first time.",
  ],
  scratch: [
    "Plan your report's structure first. Most teachers' reports follow a consistent shape — for example: an opening statement about the course, a progress rating, a behaviour/effort rating, a strengths section, an assessment statement, then next steps.",
    'Work through the wizard to build each section in that order.',
    "Add just enough statements and buttons to get going — you can always add more later, including while you're writing reports.",
    'For sections like strengths or next steps where you want more than one statement, build one section then duplicate it during final editing.',
    "Write statements that stand alone — they'll be mixed in with others in the final report, so make sure each one makes sense by itself.",
  ],
};

const QUICK_TIPS_LABELS: Record<TipsTab, string> = {
  reports: 'Using previous reports',
  ai: 'Using AI',
  scratch: 'Starting from scratch',
};

const BuildAsYouGo: React.FC<BuildAsYouGoProps> = ({ templateName, onComplete, onCancel }) => {
  const navigate = useNavigate();
  const { addTemplate } = useData();

  const reportsPanelScrollRef = useRef<number>(0);
  const reportsPanelRef = useRef<HTMLTextAreaElement>(null);
  const handleReportsPanelScroll = useCallback((e: React.UIEvent<HTMLTextAreaElement>) => { reportsPanelScrollRef.current = e.currentTarget.scrollTop; }, []);
  useEffect(() => { if (reportsPanelRef.current) reportsPanelRef.current.scrollTop = reportsPanelScrollRef.current; });


  const [screen, setScreen] = useState<Screen>('subject');
  const [subject, setSubject] = useState('');
  const [localTemplateName, setLocalTemplateName] = useState(templateName || '');
  const [templateNameError, setTemplateNameError] = useState('');

  const [showQuickTips, setShowQuickTips] = useState(false);
  const [quickTipsTab, setQuickTipsTab] = useState<TipsTab>('reports');

  const [hasStandardComment, setHasStandardComment] = useState<boolean | string | null>(null);
  const [standardContent, setStandardContent] = useState('');
  const [standardSectionName, setStandardSectionName] = useState('');
  const [aiCandidates, setAiCandidates] = useState<string[]>([]);
  const [selectedCandidates, setSelectedCandidates] = useState<Set<string>>(new Set());

  const [currentStep, setCurrentStep] = useState(0);
  const [phase, setPhase] = useState<'ask' | 'name' | 'statements' | 'added'>('ask');
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);

  const [addedSections, setAddedSections] = useState<AddedSection[]>([]);
  const [reportsPanelOpen, setReportsPanelOpen] = useState(true);
  const [pastedReports, setPastedReports] = useState('');
  const hasReports = pastedReports.trim().length > 50;
  const [highlightedExamples, setHighlightedExamples] = useState<string[]>([]);
  const [reportsEditMode, setReportsEditMode] = useState(false);
  const [restructuredReports, setRestructuredReports] = useState<string | null>(null);
  const [isRestructuring, setIsRestructuring] = useState(false);
  const [buttons, setButtons] = useState<StatementButton[]>([]);
  const [activeButtonIndex, setActiveButtonIndex] = useState(0);
  const [newStatement, setNewStatement] = useState('');
  const [newButtonName, setNewButtonName] = useState('');
  const [addingNewButton, setAddingNewButton] = useState(false);
  const [namingButtonIndex, setNamingButtonIndex] = useState<number | null>(null);
  const [namingButtonValue, setNamingButtonValue] = useState('');
  const [sectionName, setSectionName] = useState('');
  const [showExamples, setShowExamples] = useState(false);
  const [editingStatementKey, setEditingStatementKey] = useState<{ buttonIdx: number; stmtIdx: number } | null>(null);
  const [editingStatementValue, setEditingStatementValue] = useState('');
  const [movingStatementKey, setMovingStatementKey] = useState<{ buttonIdx: number; stmtIdx: number } | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiAuthRequired, setAiAuthRequired] = useState(false);
  const [activePlaceholder, setActivePlaceholder] = useState<string | null>(null);
  const [showPool, setShowPool] = useState(false);
  const [standardCandidateName, setStandardCandidateName] = useState('');
  const [aiUsedForSection, setAiUsedForSection] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [movingToNew, setMovingToNew] = useState(false);
  const [movingToNewName, setMovingToNewName] = useState('');
  const [splittingStatementKey, setSplittingStatementKey] = useState<{ buttonIdx: number; stmtIdx: number } | null>(null);
  const [splitSelectedText, setSplitSelectedText] = useState('');
  const [editingHighlightedIndex, setEditingHighlightedIndex] = useState<number | null>(null);
  const [editingHighlightedValue, setEditingHighlightedValue] = useState('');
  const statementInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { if (addedSections.length > 0) saveDraft(localTemplateName, addedSections); }, [addedSections, localTemplateName]);
  useEffect(() => { setRestructuredReports(null); }, [pastedReports]);
  useEffect(() => {
    const handler = () => {
      const sel = window.getSelection();
      const text = sel?.toString().trim() || '';
      const el = document.querySelector('[data-reports-reading-view]');
      if (text.length >= 10 && el?.contains(sel?.anchorNode ?? null)) {
        setHighlightedExamples(prev => prev.includes(text) ? prev : [...prev, text]);
      }
    };
    document.addEventListener('mouseup', handler);
    return () => document.removeEventListener('mouseup', handler);
  }, []);

  const question = QUESTIONS[currentStep];
  const isLastQuestion = currentStep === QUESTIONS.length - 1;
  const accentColor = screen === 'wizard' ? (SECTION_COLORS[question?.sectionType] || '#3b82f6') : '#3b82f6';

  const primaryBtn: React.CSSProperties = { backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', padding: '11px 24px', fontSize: '15px', fontWeight: '600', cursor: 'pointer' };
  const secondaryBtn: React.CSSProperties = { backgroundColor: '#f3f4f6', color: '#374151', border: 'none', borderRadius: '8px', padding: '11px 24px', fontSize: '15px', fontWeight: '500', cursor: 'pointer' };
  const smallBtn = (color: string): React.CSSProperties => ({ backgroundColor: color, color: 'white', border: 'none', borderRadius: '6px', padding: '6px 14px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' });
  const inp: React.CSSProperties = { width: '100%', padding: '10px 14px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', textAlign: 'left' };
  const txa: React.CSSProperties = { ...inp, resize: 'vertical' };

  const handleAddStatement = () => {
    if (!newStatement.trim()) return;
    setButtons(prev => { const u = [...prev]; if (u[activeButtonIndex].statements.length >= MAX_STATEMENTS) return u; u[activeButtonIndex] = { ...u[activeButtonIndex], statements: [...u[activeButtonIndex].statements, newStatement.trim()] }; return u; });
    setNewStatement(''); statementInputRef.current?.focus();
  };
  const handleRemoveStatement = (bi: number, si: number) => { setButtons(prev => { const u = [...prev]; u[bi] = { ...u[bi], statements: u[bi].statements.filter((_, i) => i !== si) }; return u; }); };
  const handleStartEditStatement = (bi: number, si: number, val: string) => { setEditingStatementKey({ buttonIdx: bi, stmtIdx: si }); setEditingStatementValue(val); setMovingStatementKey(null); };
  const handleSaveEditStatement = () => {
    if (!editingStatementKey || !editingStatementValue.trim()) return;
    const { buttonIdx: bi, stmtIdx: si } = editingStatementKey;
    setButtons(prev => { const u = [...prev]; const ss = [...u[bi].statements]; ss[si] = editingStatementValue.trim(); u[bi] = { ...u[bi], statements: ss }; return u; });
    setEditingStatementKey(null);
  };
  const handleMoveStatement = (bi: number, si: number, targetBi: number, newBtnName?: string) => {
    const stmt = buttons[bi].statements[si];
    setButtons(prev => {
      const u = prev.map(b => ({ ...b, statements: [...b.statements] }));
      u[bi].statements.splice(si, 1);
      if (newBtnName) { u.push({ name: newBtnName, statements: [stmt] }); }
      else { u[targetBi].statements.push(stmt); }
      return u;
    });
    setMovingStatementKey(null); setMovingToNew(false); setMovingToNewName('');
  };
  const handleConfirmNewButton = () => { if (!newButtonName.trim()) return; const idx = buttons.length; setButtons(prev => [...prev, { name: newButtonName.trim(), statements: [] }]); setActiveButtonIndex(idx); setNewButtonName(''); setAddingNewButton(false); };
  const handleConfirmButtonName = () => { if (!namingButtonValue.trim()) return; setButtons(prev => { const u = [...prev]; u[namingButtonIndex!] = { ...u[namingButtonIndex!], name: namingButtonValue.trim() }; return u; }); setNamingButtonIndex(null); setNamingButtonValue(''); };
  const handleAddRatedButton = () => setButtons(prev => [...prev, { name: 'New Level', statements: [] }]);
  const handleDeleteRatedButton = (idx: number) => { if (buttons.length <= 1) return; setButtons(prev => prev.filter((_, i) => i !== idx)); setActiveButtonIndex(0); };
  const handleRatedButtonRename = (idx: number, val: string) => { setButtons(prev => { const u = [...prev]; u[idx] = { ...u[idx], name: val }; return u; }); };
  const handleSplitConfirm = (buttonIdx: number, stmtIdx: number, originalStmt: string) => {
    if (!splitSelectedText) return;
    const idx = originalStmt.indexOf(splitSelectedText);
    if (idx === -1) return;
    const before = originalStmt.slice(0, idx).trim();
    const after = originalStmt.slice(idx + splitSelectedText.length).trim();
    const remaining = [before, after].filter(Boolean).join(' ');
    setButtons(prev => {
      const u = prev.map(b => ({ ...b, statements: [...b.statements] }));
      const stmts = u[buttonIdx].statements;
      if (remaining) { stmts[stmtIdx] = remaining; stmts.splice(stmtIdx + 1, 0, splitSelectedText); }
      else { stmts[stmtIdx] = splitSelectedText; }
      return u;
    });
    setSplittingStatementKey(null); setSplitSelectedText('');
  };
  const handleSaveEditedHighlighted = () => {
    if (editingHighlightedIndex === null || !editingHighlightedValue.trim()) return;
    const idx = editingHighlightedIndex;
    setHighlightedExamples(prev => prev.map((e, j) => j === idx ? editingHighlightedValue.trim() : e));
    setEditingHighlightedIndex(null);
  };
  const handleSplitHighlighted = (i: number) => {
    setHighlightedExamples(prev => { const u = [...prev]; u.splice(i, 1, u[i], u[i]); return u; });
  };

  const resetWizardQuestion = (defaultName?: string) => {
    setPhase('ask'); setSectionName(defaultName ?? ''); setButtons([]); setActiveButtonIndex(0);
    setNewStatement(''); setNewButtonName(''); setAddingNewButton(false); setNamingButtonIndex(null); setNamingButtonValue('');
    setStandardContent(''); setShowExamples(false); setAiError(null); setEditingStatementKey(null); setMovingStatementKey(null);
    setHighlightedExamples([]); setShowPool(false);
    setAiUsedForSection(false); setShowInstructions(true); setMovingToNew(false); setMovingToNewName('');
    setSplittingStatementKey(null); setSplitSelectedText('');
    setEditingHighlightedIndex(null); setEditingHighlightedValue('');
  };
  const advanceQuestion = () => {
    if (isLastQuestion) handleSaveAndWrite();
    else { const nextStep = currentStep + 1; setCurrentStep(nextStep); resetWizardQuestion(QUESTIONS[nextStep]?.defaultName); }
  };
  const handleWizardYes = () => {
    const name = sectionName.trim() || question.defaultName;
    setSectionName(name);
    if (question.hasButtons) {
      if (question.isRatedFixed) setButtons(DEFAULT_RATED_BUTTONS.map(n => ({ name: n, statements: [] })));
      else if (question.id === 'assessment-comment') setButtons(ASSESSMENT_ADDABLE_UNIVERSAL.map(b => ({ name: b.name, statements: [] })));
      else if (question.id === 'qualities' || question.id === 'next-steps') { setButtons([]); }
      else if (hasReports) { setButtons([]); }
      else { setButtons([{ name: '', statements: [] }]); setNamingButtonIndex(0); setNamingButtonValue(''); }
      setActiveButtonIndex(0);
    }
    setPhase('statements');
  };
  const handleWizardNo = () => advanceQuestion();
  const handleNameConfirmed = () => {
    if (!sectionName.trim()) return;
    if (question.hasButtons) {
      if (question.isRatedFixed) setButtons(DEFAULT_RATED_BUTTONS.map(n => ({ name: n, statements: [] })));
      else if (question.id === 'assessment-comment') setButtons(ASSESSMENT_ADDABLE_UNIVERSAL.map(b => ({ name: b.name, statements: [] })));
      else { setButtons([{ name: '', statements: [] }]); setNamingButtonIndex(0); setNamingButtonValue(''); }
      setActiveButtonIndex(0);
    }
    setPhase('statements');
  };
  const handleWizardAddSection = () => {
    const name = sectionName.trim() || question.defaultName;
    const newSection: AddedSection = { id: editingSectionId || makeId(), type: question.sectionType, name, buttons: question.hasButtons ? buttons : [], content: '', instruction: '', showHeader: false };
    if (editingSectionId) { setAddedSections(prev => prev.map(s => s.id === editingSectionId ? { ...newSection, showHeader: s.showHeader } : s)); setEditingSectionId(null); setPhase('added'); }
    else { setAddedSections(prev => [...prev, newSection]); setPhase('added'); }
  };
  const handleAddAnother = () => { resetWizardQuestion(question?.defaultName); };
  const handleWizardAddSectionAndDuplicate = () => {
    const name = sectionName.trim() || question.defaultName;
    const btns = question.hasButtons ? buttons : [];
    const section1: AddedSection = { id: editingSectionId || makeId(), type: question.sectionType, name, buttons: btns, content: '', instruction: '', showHeader: false };
    const section2: AddedSection = { ...section1, id: makeId() };
    if (editingSectionId) {
      setAddedSections(prev => [...prev.map(s => s.id === editingSectionId ? { ...section1, showHeader: s.showHeader } : s), section2]);
      setEditingSectionId(null);
    } else {
      setAddedSections(prev => [...prev, section1, section2]);
    }
    setPhase('added');
  };

  const handleAiFindInReports = async (sName?: string, sType?: string) => {
    if (!hasReports) return;
    setAiLoading(true); setAiError(null); setAiAuthRequired(false);
    const activeName = sName || sectionName || '';
    const activeType = sType || question?.sectionType || 'qualities';
    const isRated = activeType === 'rated-comment' || activeType === 'assessment-comment';
    try {
      let selectedTextForAI = highlightedExamples.join('\n');
      if (!selectedTextForAI) {
        const exampleLines: string[] = [];
        buttons.forEach(b => { if (b.name && b.statements.length > 0) exampleLines.push(...b.statements.slice(0, 2)); });
        if (exampleLines.length) {
          selectedTextForAI = exampleLines.join('\n');
        } else {
          const qExamples = QUESTIONS.find(q => q.sectionType === activeType || q.id === activeType)?.examples || [];
          if (qExamples.length) { selectedTextForAI = qExamples.join('\n'); }
          else { setAiError('Select example sentences in the reports panel first.'); setAiLoading(false); return; }
        }
      }

      // Restructure reports on first use, then cache
      let reportTextForAI = pastedReports;
      if (!restructuredReports) {
        setIsRestructuring(true);
        try {
          const rData = await callGenerateTemplate({ mode: 'restructure', reportText: pastedReports, subject: subject || '' });
          if (rData.restructuredText) { setRestructuredReports(rData.restructuredText); reportTextForAI = rData.restructuredText; }
        } catch (err) {
          if (err instanceof InsufficientCreditError) throw err;
          // any other failure — fail silently, use original
        }
        finally { setIsRestructuring(false); }
      } else {
        reportTextForAI = restructuredReports;
      }

      const positionType = activeType === 'next-steps' ? 'next-steps' : activeType === 'rated-comment' ? 'rating' : activeType === 'assessment-comment' ? 'assessment-comment' : activeType === 'personalised-comment' ? 'personalised-comment' : activeName === 'Areas for Development' ? 'next-steps' : 'qualities';
      const ratingLevels = isRated ? buttons.map(b => b.name).filter(Boolean) : undefined;
      const data = await callGenerateTemplate({ mode: 'extract-only', subject: subject || activeName, yearGroup: '', reportText: reportTextForAI, pronounSet: 'they/their', openerType: 'name', sectionName: activeName, positionType, selectedText: selectedTextForAI, scaleType: activeType === 'rated-comment' ? 'four-level' : 'own', ratingLevels });
      const headings: { name: string; comments: string[] }[] = data.headings || [];
      if (headings.length === 0) { setAiError('No matching sentences found. Try selecting a specific example sentence from your reports first.'); setAiLoading(false); return; }
      setNamingButtonIndex(null);
      setButtons(prev => {
        const u = [...prev];
        if (isRated) {
          headings.forEach(h => {
            const ei = u.findIndex(b => b.name && (b.name.toLowerCase() === h.name.toLowerCase() || h.name.toLowerCase().includes(b.name.toLowerCase()) || b.name.toLowerCase().includes(h.name.toLowerCase())));
            if (ei >= 0) { const newStmts = h.comments.filter(c => !u[ei].statements.includes(c)); u[ei] = { ...u[ei], statements: [...u[ei].statements, ...newStmts].slice(0, MAX_STATEMENTS) }; }
          });
        } else {
          headings.forEach(h => {
            const ei = u.findIndex(b => b.name && (b.name.toLowerCase() === h.name.toLowerCase() || h.name.toLowerCase().includes(b.name.toLowerCase()) || b.name.toLowerCase().includes(h.name.toLowerCase())));
            if (ei >= 0) { const newStmts = h.comments.filter(c => !u[ei].statements.includes(c)); u[ei] = { ...u[ei], statements: [...u[ei].statements, ...newStmts].slice(0, MAX_STATEMENTS) }; }
            else if (h.name && h.comments.length > 0) u.push({ name: h.name, statements: h.comments });
          });
          // Also add any highlighted examples not already captured
          if (highlightedExamples.length > 0) {
            const allStmts = new Set(u.flatMap(b => b.statements));
            const toAdd = highlightedExamples.filter(ex => !allStmts.has(ex));
            if (toAdd.length > 0) {
              const targetIdx = u.findIndex(b => b.name && b.statements.length < MAX_STATEMENTS);
              if (targetIdx >= 0) u[targetIdx] = { ...u[targetIdx], statements: [...u[targetIdx].statements, ...toAdd].slice(0, MAX_STATEMENTS) };
            }
          }
        }
        return u.filter(b => b.name);
      });
      setHighlightedExamples([]);
      setAiUsedForSection(true);
    } catch (err) {
      setAiAuthRequired(err instanceof AuthRequiredError);
      setAiError(err instanceof AuthRequiredError || err instanceof InsufficientCreditError ? err.message : 'AI extraction failed. Please try again.');
    }
    finally { setAiLoading(false); }
  };

  // "Find Statements with AI" — same extraction call as handleAiFindInReports,
  // but hands the results back as a flat, alphabetised, deduped list in
  // highlightedExamples for the teacher to edit/split/assign themselves,
  // instead of the AI deciding button groupings automatically.
  const handleAiFindStatements = async (sName?: string, sType?: string) => {
    if (!hasReports) return;
    setAiLoading(true); setAiError(null); setAiAuthRequired(false);
    const activeName = sName || sectionName || '';
    const activeType = sType || question?.sectionType || 'qualities';
    const isRated = activeType === 'rated-comment' || activeType === 'assessment-comment';
    try {
      let selectedTextForAI = highlightedExamples.join('\n');
      if (!selectedTextForAI) {
        const exampleLines: string[] = [];
        buttons.forEach(b => { if (b.name && b.statements.length > 0) exampleLines.push(...b.statements.slice(0, 2)); });
        if (exampleLines.length) {
          selectedTextForAI = exampleLines.join('\n');
        } else {
          const qExamples = QUESTIONS.find(q => q.sectionType === activeType || q.id === activeType)?.examples || [];
          if (qExamples.length) { selectedTextForAI = qExamples.join('\n'); }
          else { setAiError('Select example sentences in the reports panel first.'); setAiLoading(false); return; }
        }
      }

      let reportTextForAI = pastedReports;
      if (!restructuredReports) {
        setIsRestructuring(true);
        try {
          const rData = await callGenerateTemplate({ mode: 'restructure', reportText: pastedReports, subject: subject || '' });
          if (rData.restructuredText) { setRestructuredReports(rData.restructuredText); reportTextForAI = rData.restructuredText; }
        } catch (err) {
          if (err instanceof InsufficientCreditError) throw err;
        }
        finally { setIsRestructuring(false); }
      } else {
        reportTextForAI = restructuredReports;
      }

      const positionType = activeType === 'next-steps' ? 'next-steps' : activeType === 'rated-comment' ? 'rating' : activeType === 'assessment-comment' ? 'assessment-comment' : activeType === 'personalised-comment' ? 'personalised-comment' : activeName === 'Areas for Development' ? 'next-steps' : 'qualities';
      const ratingLevels = isRated ? buttons.map(b => b.name).filter(Boolean) : undefined;
      const data = await callGenerateTemplate({ mode: 'extract-only', subject: subject || activeName, yearGroup: '', reportText: reportTextForAI, pronounSet: 'they/their', openerType: 'name', sectionName: activeName, positionType, selectedText: selectedTextForAI, scaleType: activeType === 'rated-comment' ? 'four-level' : 'own', ratingLevels });
      const headings: { name: string; comments: string[] }[] = data.headings || [];
      const found = headings.flatMap(h => h.comments);
      if (found.length === 0) { setAiError('No matching sentences found. Try selecting a specific example sentence from your reports first.'); setAiLoading(false); return; }

      const existingStatements = new Set(buttons.flatMap(b => b.statements).map(normalizeForDedupe));
      setHighlightedExamples(prev => {
        const seen = new Set(prev.map(normalizeForDedupe));
        const merged = [...prev];
        found.forEach(stmt => {
          const key = normalizeForDedupe(stmt);
          if (seen.has(key) || existingStatements.has(key)) return;
          seen.add(key);
          merged.push(stmt);
        });
        return merged.sort((a, b) => a.localeCompare(b));
      });
    } catch (err) {
      setAiAuthRequired(err instanceof AuthRequiredError);
      setAiError(err instanceof AuthRequiredError || err instanceof InsufficientCreditError ? err.message : 'AI search failed. Please try again.');
    }
    finally { setAiLoading(false); }
  };


  const handleCancel = () => { if (addedSections.length > 0 || screen === 'wizard') { if (!window.confirm('Are you sure? Your progress will be lost.')) return; } onCancel(); };

  const buildFinalSections = (): TemplateSection[] => {
    const builtSections: TemplateSection[] = addedSections.map(s => {
      let data: any = {};
      if (s.type === 'standard-comment') data = { content: s.content || '' };
      else if (s.type === 'qualities') { const c: Record<string, string[]> = {}; s.buttons.forEach(b => { if (b.name) c[b.name] = b.statements; }); data = { comments: c }; }
      else if (s.type === 'rated-comment') { const c: Record<string, string[]> = {}; s.buttons.forEach(b => { if (b.name) c[b.name] = b.statements; }); data = { comments: c }; }
      else if (s.type === 'assessment-comment') { const c: Record<string, string[]> = {}; s.buttons.forEach(b => { if (b.name) c[b.name] = b.statements; }); data = { comments: c, instruction: s.instruction || '' }; }
      else if (s.type === 'personalised-comment') { const c: Record<string, string[]> = {}; s.buttons.forEach(b => { if (b.name) c[b.name] = b.statements; }); data = { categories: c, instruction: '' }; }
      else if (s.type === 'next-steps') { const f: Record<string, string[]> = {}; s.buttons.forEach(b => { if (b.name) f[b.name] = b.statements; }); data = { focusAreas: f }; }
      return { id: s.id, type: s.type, name: s.name, showHeader: s.showHeader || false, data };
    });
    return builtSections;
  };

const handleSaveAndWrite = () => {
    if (addedSections.filter(s => s.type !== 'new-line' && s.type !== 'optional-additional-comment').length === 0) { alert('Please add at least one section.'); return; }
    const sections = buildFinalSections();
    const name = localTemplateName.trim() || 'My Template';
    const newTemplateId = addTemplate({ name, sections });
    clearDraft();
    sessionStorage.setItem('continueEditing', JSON.stringify({ templateId: newTemplateId, studentIndex: 0, tourSource: 'wizard' }));
    navigate('/write-reports');
  };

  const TopBar = ({ title }: { title?: string }) => (
    <div style={{ backgroundColor: 'white', borderBottom: '1px solid #e5e7eb', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
      <div style={{ fontSize: '14px', fontWeight: '600', color: '#374151' }}>{title || localTemplateName || templateName}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {screen === 'wizard' && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '120px', height: '4px', backgroundColor: '#e5e7eb', borderRadius: '2px' }}>
                <div style={{ width: `${currentStep >= 0 ? ((currentStep + 1) / QUESTIONS.length) * 100 : 0}%`, height: '100%', backgroundColor: '#3b82f6', borderRadius: '2px', transition: 'width 0.3s ease' }} />
              </div>
              <span style={{ fontSize: '12px', color: '#6b7280' }}>{currentStep >= 0 ? `${currentStep + 1}/${QUESTIONS.length}` : 'Intro'}</span>
            </div>
            <button onClick={() => setReportsPanelOpen(o => !o)} style={{ backgroundColor: '#f3f4f6', color: '#6b7280', border: '1px solid #d1d5db', borderRadius: '6px', padding: '6px 14px', fontSize: '13px', fontWeight: '500', cursor: 'pointer' }}>{reportsPanelOpen ? 'Hide reports' : '📄 Show reports'}</button>
          </>
        )}
        <button onClick={handleCancel} style={{ background: 'none', border: 'none', color: '#9ca3af', fontSize: '13px', cursor: 'pointer' }}>← Back</button>
      </div>
    </div>
  );

  const ReportsPanel = () => {
    const showReadingView = hasReports && !reportsEditMode;
    const currentSectionLabel = question ? (sectionName || question.defaultName) : '';
    return (
      <div style={{ flex: '0 0 44%', borderLeft: '1px solid #e5e7eb', backgroundColor: 'white', display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid #f3f4f6', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: '13px', fontWeight: '600', color: '#374151' }}>Your existing reports{hasReports && <span style={{ color: '#10b981', fontWeight: '500', marginLeft: '8px' }}>{restructuredReports ? '✓ Structured' : '✓ Ready'}</span>}</div>
            {hasReports && <button onClick={() => setReportsEditMode(m => !m)} style={{ background: 'none', border: '1px solid #d1d5db', borderRadius: '5px', color: '#6b7280', fontSize: '12px', cursor: 'pointer', padding: '3px 8px' }}>{reportsEditMode ? 'Done editing' : 'Edit'}</button>}
          </div>
          <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>
            {showReadingView
              ? currentSectionLabel
                ? `Highlight sentences from the "${currentSectionLabel}" section, then use an AI button →`
                : 'Highlight example sentences, then use an AI button →'
              : 'Paste your reports here — they stay on your device and are never stored'}
          </div>
        </div>
        {highlightedExamples.length > 0 && (
          <div style={{ padding: '6px 12px', backgroundColor: '#fefce8', borderBottom: '1px solid #fef08a', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', fontWeight: '600', color: '#92400e' }}>📌 {highlightedExamples.length} statement{highlightedExamples.length !== 1 ? 's' : ''} captured — assign in left panel</span>
            <button onClick={() => setHighlightedExamples([])} style={{ background: 'none', border: 'none', color: '#a16207', cursor: 'pointer', fontSize: '11px', padding: 0 }}>Clear</button>
          </div>
        )}
        <div style={{ flex: 1, padding: '12px 16px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {showReadingView ? (
            <div data-reports-reading-view="true" style={{ flex: 1, overflowY: 'auto', padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '12px', lineHeight: '1.7', color: '#374151', cursor: 'text', userSelect: 'text', whiteSpace: 'pre-wrap', wordBreak: 'break-word', textAlign: 'left' }}>
              {pastedReports}
            </div>
          ) : (
            <>
              {!hasReports && (
                <div style={{ textAlign: 'center', padding: '14px 0 10px 0' }}>
                  <div style={{ fontSize: '20px', fontWeight: '800', color: '#1e293b', marginBottom: '5px' }}>Paste your reports here</div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>Keep to one class worth of reports for best results</div>
                </div>
              )}
              <textarea ref={reportsPanelRef} value={pastedReports} onChange={e => setPastedReports(e.target.value)} onScroll={handleReportsPanelScroll} placeholder="Paste existing reports here — they stay on your device and are never stored." style={{ flex: 1, width: '100%', padding: '10px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '12px', lineHeight: '1.7', outline: 'none', resize: 'none', boxSizing: 'border-box', fontFamily: 'inherit', color: '#374151' }} />
            </>
          )}
        </div>
      </div>
    );
  };

  // Determine which ready-made pools to show based on current question
  const getTokenStyle = (token: string): React.CSSProperties => {
    const base: React.CSSProperties = { cursor: 'pointer', borderRadius: '3px', padding: '1px 3px' };
    if (activePlaceholder === '[Name]') {
      return /^[A-Z][a-zA-Z]/.test(token) && !token.startsWith('[')
        ? { ...base, backgroundColor: '#dbeafe', border: '1px solid #93c5fd', color: '#1d4ed8' }
        : { ...base, backgroundColor: '#fef9c3', border: '1px solid #fde047', color: '#713f12' };
    }
    if (activePlaceholder === '[Score 1]' || activePlaceholder === '[Score 2]') {
      return /^\d/.test(token)
        ? { ...base, backgroundColor: '#dcfce7', border: '1px solid #86efac', color: '#166534' }
        : { ...base, backgroundColor: '#fef9c3', border: '1px solid #fde047', color: '#713f12' };
    }
    return { ...base, backgroundColor: '#fef9c3', border: '1px solid #fde047', color: '#713f12' };
  };

  const placeholderBtn = (p: string) => {
    const tooltips: Record<string, string> = {
      '[Name]': 'Replaces a pupil\'s real name with [Name] so the comment works for any pupil. Activate, then click names in the statements below.',
      '[Score 1]': 'Replaces a score or percentage with [Score 1] so you can type the real value when writing. Activate, then click numbers in the statements.',
      '[Score 2]': 'A second score placeholder — useful if a section shows two scores. Activate, then click numbers in the statements.',
      '[Info 1]': 'Replaces any word or phrase with [Info 1] so you can personalise it per pupil (e.g. a target or sport). Activate, then click the word to replace.',
      '[Info 2]': 'A second personalised placeholder for a different piece of pupil-specific information.',
    };
    return (
      <button
        key={p}
        onClick={() => setActivePlaceholder(prev => prev === p ? null : p)}
        title={tooltips[p] || p}
        style={{ padding: '3px 7px', border: `1px solid ${activePlaceholder === p ? '#f59e0b' : '#fde68a'}`, borderRadius: '5px', backgroundColor: activePlaceholder === p ? '#fef3c7' : 'white', color: '#92400e', fontSize: '11px', fontWeight: '700', cursor: 'pointer', flexShrink: 0 }}
      >{p}</button>
    );
  };

  const renderHighlightedTokens = (ex: string, i: number) => {
    const tokens = ex.split(/(\s+)/);
    return tokens.map((token, ti) =>
      /^\s+$/.test(token) ? <span key={ti}>{token}</span> : (
        <span
          key={ti}
          onClick={() => {
            const updated = [...tokens];
            updated[ti] = activePlaceholder!;
            setHighlightedExamples(prev => prev.map((e, j) => j === i ? updated.join('') : e));
          }}
          title={`Click to replace with ${activePlaceholder}`}
          style={getTokenStyle(token)}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#fbbf24'; e.currentTarget.style.color = 'white'; }}
          onMouseLeave={e => { const s = getTokenStyle(token); e.currentTarget.style.backgroundColor = s.backgroundColor as string; e.currentTarget.style.color = s.color as string; }}
        >{token}</span>
      )
    );
  };

  const getPoolsForQuestion = (): { universal: AddableButton[]; subject: AddableButton[] } => {
    if (!question) return { universal: [], subject: [] };
    const qid = question.id;
    const stype = question.sectionType;
    if (qid === 'qualities') return { universal: STRENGTHS_ADDABLE_UNIVERSAL, subject: STRENGTHS_ADDABLE_BY_SUBJECT[subject] || [] };
    if (qid === 'next-steps') return { universal: [...NEXT_STEPS_ADDABLE_UNIVERSAL, ...DEVELOPMENT_BUTTONS_FOR_WIZARD], subject: NEXT_STEPS_ADDABLE_BY_SUBJECT[subject] || [] };
    if (qid === 'assessment-comment') return { universal: ASSESSMENT_ADDABLE_UNIVERSAL, subject: [] };
    if (qid === 'personalised-comment') return { universal: [...PERSONALISED_ADDABLE_UNIVERSAL, ...DEVELOPMENT_BUTTONS_FOR_WIZARD], subject: [] };
    if (qid === 'other-comments') return { universal: DEVELOPMENT_ADDABLE_UNIVERSAL, subject: DEVELOPMENT_ADDABLE_BY_SUBJECT[subject] || [] };
    return { universal: [], subject: [] };
  };

  const renderStatementEditor = (sType: string, sName: string) => {
    const isRated = sType === 'rated-comment' || sType === 'assessment-comment';
    const { universal: universalPool, subject: subjectPool } = getPoolsForQuestion();
    const activeNames = buttons.map(b => b.name);
    const availableUniversal = universalPool.filter(b => !activeNames.includes(b.name));
    const availableSubject = subjectPool.filter(b => !activeNames.includes(b.name));
    const hasPool = availableUniversal.length > 0 || availableSubject.length > 0;

    const handleAssignHighlight = (ex: string, exIdx: number, val: string) => {
      if (!val) return;
      if (val === 'new') {
        const name = window.prompt('Name for the new button:');
        if (!name?.trim()) return;
        const newIdx = buttons.length;
        setButtons(prev => [...prev, { name: name.trim(), statements: [ex] }]);
        setActiveButtonIndex(newIdx);
      } else {
        const bi = parseInt(val);
        if (buttons[bi]?.statements.length >= MAX_STATEMENTS) {
          alert(`"${buttons[bi].name}" already has the maximum ${MAX_STATEMENTS} statements.`);
          return;
        }
        setButtons(prev => { const u = [...prev]; u[bi] = { ...u[bi], statements: [...u[bi].statements, ex] }; return u; });
        setActiveButtonIndex(bi);
      }
      setHighlightedExamples(prev => prev.filter((_, j) => j !== exIdx));
    };

    return (
      <div>
        {highlightedExamples.length > 0 && sType !== 'standard-comment' && (
          <div style={{ marginBottom: '20px', backgroundColor: '#fefce8', border: `1px solid ${activePlaceholder ? '#f59e0b' : '#fde68a'}`, borderRadius: '10px', padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: activePlaceholder ? '6px' : '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '13px', fontWeight: '700', color: '#713f12' }}>Selected Statements ({highlightedExamples.length})</span>
                <span style={{ fontSize: '11px', color: '#a16207', fontStyle: 'italic' }}>— replace words with placeholders (hover for help):</span>
                {placeholderBtn('[Name]')}
                {sType === 'assessment-comment' && <>{placeholderBtn('[Score 1]')}{placeholderBtn('[Score 2]')}</>}
                {sType === 'personalised-comment' && <>{placeholderBtn('[Info 1]')}{placeholderBtn('[Info 2]')}</>}
              </div>
              <button onClick={() => { setHighlightedExamples([]); setActivePlaceholder(null); }} style={{ background: 'none', border: 'none', color: '#a16207', cursor: 'pointer', fontSize: '12px', fontWeight: '500', padding: 0 }}>Clear all</button>
            </div>
            {activePlaceholder && <p style={{ fontSize: '11px', color: '#92400e', margin: '0 0 10px 0' }}>Click any word to replace it with {activePlaceholder}</p>}
            {highlightedExamples.map((ex, i) => (
              <div key={i} style={{ backgroundColor: 'white', border: `1px solid ${editingHighlightedIndex === i ? '#f59e0b' : '#fde68a'}`, borderRadius: '8px', padding: '10px 12px', marginBottom: '8px' }}>
                {editingHighlightedIndex === i ? (
                  <div>
                    <textarea value={editingHighlightedValue} onChange={e => setEditingHighlightedValue(e.target.value)} autoFocus style={{ ...txa, minHeight: '60px', marginBottom: '6px', borderColor: '#f59e0b' }} />
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button onClick={() => setEditingHighlightedIndex(null)} style={{ ...secondaryBtn, padding: '4px 10px', fontSize: '12px' }}>Cancel</button>
                      <button onClick={handleSaveEditedHighlighted} style={smallBtn('#f59e0b')}>Save</button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                    <div style={{ flex: 1, fontSize: '13px', lineHeight: '1.7', wordBreak: 'break-word', textAlign: 'left' }}>
                      {activePlaceholder ? renderHighlightedTokens(ex, i) : <span style={{ color: '#374151' }}>{ex}</span>}
                    </div>
                    <div style={{ display: 'flex', gap: '2px', flexShrink: 0 }}>
                      <button onClick={() => { setEditingHighlightedIndex(i); setEditingHighlightedValue(ex); }} title="Edit" style={{ background: 'none', border: 'none', color: '#a16207', cursor: 'pointer', fontSize: '13px', padding: '2px 4px' }}>✏️</button>
                      <button onClick={() => handleSplitHighlighted(i)} title="Split into two" style={{ background: 'none', border: 'none', color: '#a16207', cursor: 'pointer', fontSize: '13px', padding: '2px 4px' }}>✂</button>
                    </div>
                    <select
                      value=""
                      onChange={e => handleAssignHighlight(ex, i, e.target.value)}
                      style={{ width: '155px', flexShrink: 0, fontSize: '12px', padding: '5px 6px', border: '1px solid #fde68a', borderRadius: '6px', backgroundColor: '#fffbeb', color: '#78350f', cursor: 'pointer' }}
                    >
                      <option value="">— assign —</option>
                      {buttons.map((b, bi) => b.name ? (
                        <option key={bi} value={String(bi)} disabled={b.statements.length >= MAX_STATEMENTS}>
                          {b.name}{b.statements.length >= MAX_STATEMENTS ? ' (full)' : ''}
                        </option>
                      ) : null)}
                      <option value="new">+ New button</option>
                    </select>
                    <button onClick={() => setHighlightedExamples(prev => prev.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', color: '#a16207', cursor: 'pointer', fontSize: '16px', flexShrink: 0, lineHeight: 1, padding: '2px 0' }}>✕</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        {isRated && (
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'flex-start', marginBottom: '16px' }}>
              {buttons.map((btn, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <input type="text" value={btn.name} onChange={e => handleRatedButtonRename(i, e.target.value)} onClick={() => { setActiveButtonIndex(i); setAddingNewButton(false); }} onFocus={() => setActiveButtonIndex(i)} style={{ padding: '7px 10px', border: `2px solid ${accentColor}`, borderRadius: '6px', fontSize: '13px', fontWeight: '600', outline: 'none', backgroundColor: activeButtonIndex === i ? accentColor : 'white', color: activeButtonIndex === i ? 'white' : accentColor, width: `${Math.max(80, btn.name.length * 8 + 20)}px`, minWidth: '80px', maxWidth: '180px', textAlign: 'center', cursor: 'pointer' }} />
                    {buttons.length > 1 && <button onClick={() => handleDeleteRatedButton(i)} style={{ width: '18px', height: '18px', borderRadius: '50%', border: 'none', backgroundColor: '#fee2e2', color: '#ef4444', cursor: 'pointer', fontSize: '10px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>}
                  </div>
                  {btn.statements.length > 0 && <div style={{ fontSize: '10px', color: '#9ca3af' }}>({btn.statements.length})</div>}
                </div>
              ))}
              <button onClick={handleAddRatedButton} style={{ padding: '7px 12px', border: `2px dashed ${accentColor}`, borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', backgroundColor: 'white', color: accentColor, minWidth: '70px', alignSelf: 'flex-start' }}>+ Add</button>
            </div>
          </div>
        )}
        {!isRated && sType !== 'standard-comment' && (
          <div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px', alignItems: 'flex-end' }}>
              {buttons.map((btn, i) => (btn.name || (activeButtonIndex === i && namingButtonIndex !== i)) ? (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <input
                      type="text"
                      value={btn.name}
                      onChange={e => handleRatedButtonRename(i, e.target.value)}
                      onClick={() => { setActiveButtonIndex(i); setAddingNewButton(false); setNamingButtonIndex(null); }}
                      onFocus={() => { setActiveButtonIndex(i); setAddingNewButton(false); setNamingButtonIndex(null); }}
                      style={{
                        padding: '6px 12px', border: `2px solid ${accentColor}`, borderRadius: '6px', fontSize: '13px', fontWeight: '600', outline: 'none', cursor: 'pointer',
                        backgroundColor: activeButtonIndex === i && namingButtonIndex === null && !addingNewButton ? accentColor : 'white',
                        color: activeButtonIndex === i && namingButtonIndex === null && !addingNewButton ? 'white' : accentColor,
                        width: `${Math.max(80, btn.name.length * 8 + 24)}px`, minWidth: '80px', maxWidth: '200px', textAlign: 'center', fontFamily: 'inherit',
                      }}
                    />
                    {buttons.length > 1 && <button onClick={() => handleDeleteRatedButton(i)} style={{ width: '18px', height: '18px', borderRadius: '50%', border: 'none', backgroundColor: '#fee2e2', color: '#ef4444', cursor: 'pointer', fontSize: '10px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>}
                  </div>
                  {btn.statements.length > 0 && <div style={{ fontSize: '10px', color: '#9ca3af' }}>({btn.statements.length})</div>}
                </div>
              ) : null)}
              {!addingNewButton && namingButtonIndex === null && <button onClick={() => { setAddingNewButton(true); setNewButtonName(''); }} style={{ padding: '6px 14px', border: `2px dashed ${accentColor}`, borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', backgroundColor: 'white', color: accentColor, alignSelf: 'flex-start' }}>+ New Button</button>}
            </div>
            {namingButtonIndex !== null && (
              <div style={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '12px', marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>Name this button:</label>
                <input type="text" value={namingButtonValue} onChange={e => setNamingButtonValue(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleConfirmButtonName(); }} placeholder="e.g. Effort, Teamwork..." autoFocus style={{ ...inp, borderColor: accentColor, marginBottom: '10px' }} />
                <button onClick={handleConfirmButtonName} disabled={!namingButtonValue.trim()} style={{ ...smallBtn(accentColor), opacity: !namingButtonValue.trim() ? 0.4 : 1 }}>Confirm name</button>
              </div>
            )}
            {addingNewButton && (
              <div style={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '12px', marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>New button name:</label>
                <input type="text" value={newButtonName} onChange={e => setNewButtonName(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleConfirmNewButton(); }} placeholder="e.g. Teamwork, Resilience..." autoFocus style={{ ...inp, marginBottom: '10px' }} />
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => setAddingNewButton(false)} style={{ ...secondaryBtn, padding: '7px 16px', fontSize: '13px' }}>Cancel</button>
                  <button onClick={handleConfirmNewButton} disabled={!newButtonName.trim()} style={{ ...smallBtn(accentColor), opacity: !newButtonName.trim() ? 0.4 : 1 }}>Add button</button>
                </div>
              </div>
            )}
          </div>
        )}
        {hasPool && (
          <div style={{ marginBottom: '20px' }}>
            <div style={{ height: '1px', backgroundColor: '#f3f4f6', margin: '8px 0 10px' }} />
            <button onClick={() => setShowPool(o => !o)} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer', padding: '0 0 8px 0', width: '100%', textAlign: 'left' }}>
              <span style={{ fontSize: '12px', fontWeight: '700', color: '#9ca3af', letterSpacing: '0.04em' }}>ADD MORE BUTTONS</span>
              <span style={{ fontSize: '11px', color: '#9ca3af' }}>{showPool ? '▲ hide' : '▼ show'}</span>
            </button>
            {showPool && (
              <div>
                {availableUniversal.length > 0 && <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: availableSubject.length > 0 ? '10px' : '0' }}>{availableUniversal.map((btn, i) => <button key={i} onClick={() => setButtons(prev => [...prev, { name: btn.name, statements: btn.statements }])} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', border: `2px solid ${accentColor}`, borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', backgroundColor: 'white', color: accentColor, opacity: 0.7 }} onMouseEnter={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.backgroundColor = accentColor + '15'; }} onMouseLeave={e => { e.currentTarget.style.opacity = '0.7'; e.currentTarget.style.backgroundColor = 'white'; }}><span style={{ fontSize: '14px', fontWeight: '700', lineHeight: 1 }}>﹢</span>{btn.name}</button>)}</div>}
                {availableSubject.length > 0 && <div><div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '6px', fontWeight: '600' }}>{subject.toUpperCase()} SPECIFIC</div><div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>{availableSubject.map((btn, i) => <button key={i} onClick={() => setButtons(prev => [...prev, { name: btn.name, statements: btn.statements }])} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', border: `2px solid ${accentColor}`, borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', backgroundColor: 'white', color: accentColor, opacity: 0.7 }} onMouseEnter={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.backgroundColor = accentColor + '15'; }} onMouseLeave={e => { e.currentTarget.style.opacity = '0.7'; e.currentTarget.style.backgroundColor = 'white'; }}><span style={{ fontSize: '14px', fontWeight: '700', lineHeight: 1 }}>﹢</span>{btn.name}</button>)}</div></div>}
              </div>
            )}
          </div>
        )}
        {(isRated || (buttons[activeButtonIndex] && !addingNewButton && namingButtonIndex === null)) && sType !== 'standard-comment' && (
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>Statements for <span style={{ color: accentColor }}>{buttons[activeButtonIndex]?.name}</span>:</label>
            {buttons[activeButtonIndex]?.statements.length > 0 && (
              <div style={{ marginBottom: '12px' }}>
                {buttons[activeButtonIndex].statements.map((stmt, i) => {
                  const isEd = editingStatementKey?.buttonIdx === activeButtonIndex && editingStatementKey?.stmtIdx === i;
                  const isMv = movingStatementKey?.buttonIdx === activeButtonIndex && movingStatementKey?.stmtIdx === i;
                  const isSp = splittingStatementKey?.buttonIdx === activeButtonIndex && splittingStatementKey?.stmtIdx === i;
                  return (
                    <div key={i} style={{ backgroundColor: 'white', border: `1px solid ${isEd || isSp ? accentColor : '#e5e7eb'}`, borderRadius: '6px', marginBottom: '6px', overflow: 'hidden' }}>
                      {isEd ? (
                        <div style={{ padding: '8px' }}>
                          <textarea value={editingStatementValue} onChange={e => setEditingStatementValue(e.target.value)} autoFocus style={{ ...txa, minHeight: '60px', marginBottom: '6px', borderColor: accentColor }} />
                          <div style={{ display: 'flex', gap: '6px' }}><button onClick={() => setEditingStatementKey(null)} style={{ ...secondaryBtn, padding: '4px 10px', fontSize: '12px' }}>Cancel</button><button onClick={handleSaveEditStatement} style={smallBtn(accentColor)}>Save</button></div>
                        </div>
                      ) : isSp ? (
                        <div style={{ padding: '8px' }}>
                          <div style={{ fontSize: '12px', color: '#92400e', fontWeight: '600', marginBottom: '6px' }}>Select the part to split into a new statement</div>
                          <div
                            style={{ fontSize: '13px', color: '#374151', lineHeight: '1.5', backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '4px', padding: '8px', cursor: 'text', userSelect: 'text', marginBottom: '8px' }}
                            onMouseUp={() => { const sel = window.getSelection(); const text = sel?.toString().trim() || ''; if (text.length > 0) setSplitSelectedText(text); }}
                          >{stmt}</div>
                          {splitSelectedText && <div style={{ fontSize: '12px', color: '#374151', backgroundColor: '#fef9c3', border: '1px solid #fde68a', borderRadius: '4px', padding: '6px 8px', marginBottom: '8px' }}>Split out: "<em>{splitSelectedText}</em>"</div>}
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button onClick={() => { setSplittingStatementKey(null); setSplitSelectedText(''); }} style={{ ...secondaryBtn, padding: '4px 10px', fontSize: '12px' }}>Cancel</button>
                            {splitSelectedText && <button onClick={() => handleSplitConfirm(activeButtonIndex, i, stmt)} style={smallBtn(accentColor)}>Split</button>}
                          </div>
                        </div>
                      ) : isMv ? (
                        <div style={{ padding: '8px' }}>
                          <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '6px' }}>Move to which button?</div>
                          {buttons.filter(b => b.name && b !== buttons[activeButtonIndex]).length > 0 && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '6px' }}>
                              {buttons.map((b, bi) => bi !== activeButtonIndex && b.name ? <button key={bi} onClick={() => handleMoveStatement(activeButtonIndex, i, bi)} style={{ ...smallBtn(accentColor), fontSize: '12px', padding: '4px 10px' }}>{b.name}</button> : null)}
                            </div>
                          )}
                          {movingToNew ? (
                            <div style={{ display: 'flex', gap: '4px', alignItems: 'center', marginBottom: '4px' }}>
                              <input value={movingToNewName} onChange={e => setMovingToNewName(e.target.value)} placeholder="New button name..." autoFocus style={{ ...inp, flex: 1, padding: '5px 10px', fontSize: '13px' }} onKeyDown={e => { if (e.key === 'Enter' && movingToNewName.trim()) handleMoveStatement(activeButtonIndex, i, -1, movingToNewName.trim()); if (e.key === 'Escape') { setMovingToNew(false); setMovingToNewName(''); } }} />
                              <button onClick={() => { if (movingToNewName.trim()) handleMoveStatement(activeButtonIndex, i, -1, movingToNewName.trim()); }} disabled={!movingToNewName.trim()} style={{ ...smallBtn(accentColor), fontSize: '12px', padding: '4px 10px', opacity: !movingToNewName.trim() ? 0.4 : 1 }}>Move</button>
                              <button onClick={() => { setMovingToNew(false); setMovingToNewName(''); }} style={{ ...secondaryBtn, padding: '4px 8px', fontSize: '12px' }}>✕</button>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                              <button onClick={() => { setMovingToNew(true); setMovingToNewName(''); }} style={{ padding: '4px 10px', border: `1px dashed ${accentColor}`, borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', backgroundColor: 'white', color: accentColor }}>+ New button</button>
                              <button onClick={() => { setMovingStatementKey(null); setMovingToNew(false); }} style={{ ...secondaryBtn, padding: '4px 10px', fontSize: '12px' }}>Cancel</button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '8px 10px' }}>
                          <span style={{ flex: 1, fontSize: '13px', color: '#374151', lineHeight: '1.5', textAlign: 'left' }}>{stmt}</span>
                          <div style={{ display: 'flex', gap: '2px', flexShrink: 0 }}>
                            <button onClick={() => handleStartEditStatement(activeButtonIndex, i, stmt)} title="Edit" style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: '13px', padding: '2px 4px' }}>✏️</button>
                            <button onClick={() => { setMovingStatementKey({ buttonIdx: activeButtonIndex, stmtIdx: i }); setMovingToNew(false); setMovingToNewName(''); }} title="Move" style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: '13px', padding: '2px 4px' }}>↔</button>
                            <button onClick={() => { setSplittingStatementKey({ buttonIdx: activeButtonIndex, stmtIdx: i }); setSplitSelectedText(''); }} title="Split" style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: '13px', padding: '2px 4px' }}>✂</button>
                            <button onClick={() => handleRemoveStatement(activeButtonIndex, i)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '14px', padding: '2px 4px' }}>✕</button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            {buttons[activeButtonIndex]?.statements.length >= MAX_STATEMENTS ? (
              <div style={{ fontSize: '12px', color: '#6b7280', backgroundColor: '#f3f4f6', borderRadius: '6px', padding: '8px 12px', marginBottom: '20px' }}>Maximum {MAX_STATEMENTS} statements per button reached.</div>
            ) : !hasReports ? (
              <>
                <textarea ref={statementInputRef} value={newStatement} onChange={e => setNewStatement(e.target.value)} placeholder="Type or paste a statement... Use [Name] for pupil name, [Score] for scores, [Info 1] for personalised info." style={{ ...txa, minHeight: '70px', borderColor: accentColor, marginBottom: '8px' }} />
                <button onClick={handleAddStatement} disabled={!newStatement.trim()} style={{ ...smallBtn(accentColor), opacity: !newStatement.trim() ? 0.4 : 1, marginBottom: '20px' }}>+ Add statement</button>
              </>
            ) : null}
          </div>
        )}
        {hasReports && !aiLoading && sType !== 'standard-comment' && (
          <div style={{ marginBottom: '16px' }}>
            <div style={{ height: '1px', backgroundColor: '#f3f4f6', margin: '4px 0 14px' }} />
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button onClick={() => handleAiFindInReports(sName, sType)} style={{ flex: '1 1 240px', padding: '12px 16px', backgroundColor: highlightedExamples.length > 0 ? '#fffbeb' : '#faf5ff', border: `2px solid ${highlightedExamples.length > 0 ? '#f59e0b' : '#8b5cf6'}`, borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }} onMouseEnter={e => { e.currentTarget.style.backgroundColor = highlightedExamples.length > 0 ? '#fef3c7' : '#f3e8ff'; }} onMouseLeave={e => { e.currentTarget.style.backgroundColor = highlightedExamples.length > 0 ? '#fffbeb' : '#faf5ff'; }}>
                <span style={{ fontSize: '20px' }}>🪄</span>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: highlightedExamples.length > 0 ? '#b45309' : '#7c3aed' }}>Create Section with AI</div>
                  <div style={{ fontSize: '12px', color: '#9ca3af' }}>AI builds buttons and fills them with statements for you</div>
                </div>
              </button>
              <button onClick={() => handleAiFindStatements(sName, sType)} style={{ flex: '1 1 240px', padding: '12px 16px', backgroundColor: '#eff6ff', border: '2px solid #3b82f6', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }} onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#dbeafe'; }} onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#eff6ff'; }}>
                <span style={{ fontSize: '20px' }}>🔍</span>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: '#1d4ed8' }}>Find Statements with AI</div>
                  <div style={{ fontSize: '12px', color: '#9ca3af' }}>AI finds matching statements — you edit, split and assign them yourself</div>
                </div>
              </button>
            </div>
          </div>
        )}
        {aiLoading && <div style={{ marginBottom: '16px', padding: '14px 16px', backgroundColor: '#faf5ff', border: '2px solid #8b5cf6', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}><div style={{ display: 'flex', gap: '4px' }}>{[0,1,2].map(i => <div key={i} style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#8b5cf6', animation: 'pulse 1.2s ease-in-out infinite', animationDelay: `${i * 0.2}s` }} />)}</div><div style={{ fontSize: '13px', color: '#7c3aed' }}>{isRestructuring ? 'Structuring your reports first (once only)...' : 'Searching your reports...'}</div><style>{`@keyframes pulse{0%,100%{opacity:.3;transform:scale(.8)}50%{opacity:1;transform:scale(1.2)}}`}</style></div>}
        {aiError && aiAuthRequired && (
          <div style={{ marginBottom: '16px', padding: '14px 16px', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', fontSize: '13px', color: '#1e40af', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
            <span>🔒 {aiError}</span>
            <button onClick={() => navigate('/signup')} style={{ padding: '8px 16px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 600, fontSize: '13px', cursor: 'pointer', whiteSpace: 'nowrap' }}>Sign Up Free</button>
          </div>
        )}
        {aiError && !aiAuthRequired && <div style={{ marginBottom: '16px', padding: '10px 14px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', fontSize: '13px', color: '#b91c1c' }}>⚠️ {aiError}</div>}
        {!hasReports && sType !== 'standard-comment' && <div style={{ marginBottom: '16px', padding: '12px 16px', backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', fontSize: '13px', color: '#78350f', lineHeight: '1.5' }}>💡 <strong>Have existing reports?</strong> Paste them in the right panel, then use "Create Section with AI" or "Find Statements with AI" to get started.</div>}
      </div>
    );
  };

  // ─── SUBJECT SCREEN ───────────────────────────────────────────────────────

  if (screen === 'subject') return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', display: 'flex', flexDirection: 'column' }}>
      {TopBar({ title: 'Template Wizard' })}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 24px' }}>
        <div style={{ maxWidth: '560px', width: '100%', backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.07)', padding: '40px 44px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#111827', marginBottom: '8px' }}>Template Wizard</h2>
          <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '28px', lineHeight: '1.6' }}>Name your template, choose your subject, then answer a few questions to build it section by section.</p>
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>Template Name *</label>
            <input type="text" value={localTemplateName} onChange={e => { setLocalTemplateName(e.target.value); if (templateNameError) setTemplateNameError(''); }} placeholder="e.g. S3 PE Reports, Year 9 English" style={{ width: '100%', padding: '10px 14px', border: `2px solid ${templateNameError ? '#ef4444' : '#e5e7eb'}`, borderRadius: '8px', fontSize: '15px', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }} autoFocus />
            {templateNameError && <p style={{ fontSize: '13px', color: '#ef4444', margin: '6px 0 0 0' }}>{templateNameError}</p>}
          </div>
          <p style={{ fontSize: '13px', fontWeight: '600', color: '#374151', margin: '0 0 12px 0' }}>Select your subject:</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
            {SUBJECTS.map(s => (
              <button key={s} onClick={() => { if (!localTemplateName.trim()) { setTemplateNameError('Please enter a template name first.'); return; } setSubject(s); setCurrentStep(-1); setHasStandardComment(null); setScreen('wizard'); }} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 16px', backgroundColor: 'white', border: '2px solid #e5e7eb', borderRadius: '10px', cursor: 'pointer', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#111827' }} onMouseEnter={e => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.backgroundColor = '#eff6ff'; }} onMouseLeave={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.backgroundColor = 'white'; }}>
                <span style={{ fontSize: '22px' }}>{SUBJECT_ICONS[s]}</span><span>{s}</span>
              </button>
            ))}
          </div>

          {/* Quick Tips — collapsed by default, split by how the teacher is building this template */}
          <div style={{ marginTop: '28px', borderTop: '1px solid #f1f5f9', paddingTop: '18px' }}>
            <button
              onClick={() => setShowQuickTips(o => !o)}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            >
              <span style={{ fontSize: '14px', fontWeight: '700', color: '#374151' }}>💡 Quick Tips</span>
              <span style={{ fontSize: '12px', color: '#9ca3af', fontWeight: '600' }}>{showQuickTips ? '▲ Hide' : '▼ Show'}</span>
            </button>

            {showQuickTips && (
              <div style={{ marginTop: '16px' }}>
                <div style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '12px 14px', marginBottom: '14px', fontSize: '12.5px', color: '#1e3a8a', lineHeight: '1.6' }}>
                  <strong>Remember</strong> — you only need to build your template once. Save it somewhere safe once it's complete and you can use it again and again, making future reports quick to complete.
                </div>

                <div style={{ display: 'flex', gap: '6px', marginBottom: '14px' }}>
                  {(Object.keys(QUICK_TIPS_LABELS) as TipsTab[]).map(tab => (
                    <button
                      key={tab}
                      onClick={() => setQuickTipsTab(tab)}
                      style={{
                        flex: 1, padding: '8px 6px', borderRadius: '6px',
                        border: quickTipsTab === tab ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                        backgroundColor: quickTipsTab === tab ? '#eff6ff' : 'white',
                        fontSize: '11.5px', fontWeight: '600', cursor: 'pointer',
                        color: quickTipsTab === tab ? '#1d4ed8' : '#6b7280',
                      }}
                    >
                      {QUICK_TIPS_LABELS[tab]}
                    </button>
                  ))}
                </div>

                <ol style={{ margin: '0 0 14px 0', paddingLeft: '18px', fontSize: '13px', color: '#374151', lineHeight: '1.7' }}>
                  {QUICK_TIPS[quickTipsTab].map((tip, i) => <li key={i} style={{ marginBottom: '6px' }}>{tip}</li>)}
                </ol>

                <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '12px 14px', fontSize: '12.5px', color: '#78350f', lineHeight: '1.6' }}>
                  💡 Pronouns are handled for you — write your statements normally and choose he/his, she/her or they/their when writing each report. If you'll often use they/them, it's easiest to write your statements with they/them from the start, since some verbs change form (e.g. "tries" → "try").
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // ─── WIZARD SCREEN ────────────────────────────────────────────────────────

  if (screen === 'wizard') {
    // ── Step -1: Fixed / Standard Comment ──────────────────────────────────
    if (currentStep === -1) {
    const handleFindFixed = async () => {
      setAiLoading(true); setAiError(null); setAiAuthRequired(false);
      try {
        const data = await callGenerateTemplate({ mode: 'find-fixed', reportText: pastedReports, subject: subject || '' });
        const candidates: string[] = data.statements || [];
        if (candidates.length === 0) { setAiError('No repeated fixed statements found. You can add them manually below.'); }
        else { setAiCandidates(candidates); setSelectedCandidates(new Set(candidates)); setHasStandardComment('candidates'); }
      } catch (err) {
        setAiAuthRequired(err instanceof AuthRequiredError);
        setAiError(err instanceof AuthRequiredError || err instanceof InsufficientCreditError ? err.message : 'AI scan failed. Please try again or add statements manually.');
      }
      finally { setAiLoading(false); }
    };
    const confirmCandidates = () => {
      const existingContents = new Set(addedSections.filter(s => s.type === 'standard-comment').map(s => s.content));
      const chosen = aiCandidates.filter(c => selectedCandidates.has(c) && !existingContents.has(c));
      const heading = standardCandidateName.trim();
      setAddedSections(prev => [...prev, ...chosen.map(c => ({ id: makeId(), type: 'standard-comment' as SectionType, name: heading, buttons: [], content: c, instruction: '', showHeader: !!heading }))]);
      setAiCandidates([]); setSelectedCandidates(new Set()); setHasStandardComment('manual'); setStandardCandidateName('');
    };
    const goNext = () => { setCurrentStep(0); resetWizardQuestion(QUESTIONS[0]?.defaultName); };

    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {TopBar({ title: 'Template Wizard' })}
        <div style={{ flex: 1, display: 'flex', width: '100%', overflow: 'hidden', minHeight: 0 }}>
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '32px 24px' }}>
            <div style={{ maxWidth: '560px', width: '100%', backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.07)', padding: '40px 44px' }}>
              <div style={{ display: 'inline-block', backgroundColor: '#d1fae520', color: '#10b981', border: '1px solid #10b98140', borderRadius: '20px', padding: '4px 12px', fontSize: '12px', fontWeight: '600', marginBottom: '16px' }}>Fixed Statement</div>
              <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#111827', marginBottom: '10px' }}>Do your reports contain fixed statements?</h2>
              <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '24px', lineHeight: '1.6' }}>Fixed statements appear in most or all reports unchanged — for example an introduction sentence or closing remark.</p>

              {hasStandardComment === null && (
                <div>
                  <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                    <button onClick={() => setHasStandardComment('manual')} style={{ ...primaryBtn, flex: 1 }}>Yes</button>
                    <button onClick={goNext} style={{ ...secondaryBtn, flex: 1 }}>No</button>
                  </div>
                  <button onClick={() => setScreen('subject')} style={{ background: 'none', border: 'none', color: '#9ca3af', fontSize: '13px', cursor: 'pointer', padding: 0 }}>← Back</button>
                </div>
              )}

              {false && (
                <div>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button onClick={() => { setHasStandardComment('manual'); }} style={secondaryBtn}>← Back</button>
                    <button onClick={confirmCandidates} style={{ ...primaryBtn, backgroundColor: '#10b981' }}>Confirm {selectedCandidates.size} →</button>
                  </div>
                </div>
              )}

              {hasStandardComment === 'manual' && (
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>Section heading (optional)</label>
                  <input value={standardSectionName} onChange={e => setStandardSectionName(e.target.value)} placeholder="e.g. Introduction, Opening Remarks" style={{ ...inp, marginBottom: '16px' }} autoFocus />

                  {hasReports ? (
                    <>
                      {highlightedExamples.length === 0 ? (
                        <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '16px 18px', marginBottom: '16px' }}>
                          <div style={{ fontSize: '14px', fontWeight: '700', color: '#065f46', marginBottom: '6px' }}>👉 Highlight the statement in the reports panel</div>
                          <div style={{ fontSize: '12px', color: '#047857', lineHeight: '1.7' }}>
                            <div>Select the text you want to use — it will appear here ready to add.</div>
                            <div style={{ marginTop: '4px' }}>To replace pupil names: click <strong>[Name]</strong> above the statement, then click any word to swap it for the placeholder.</div>
                          </div>
                        </div>
                      ) : (
                        <div style={{ marginBottom: '16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '12px', color: '#6b7280' }}>Replace pupil names with a placeholder:</span>
                            {placeholderBtn('[Name]')}
                          </div>
                          {activePlaceholder === '[Name]' && <p style={{ fontSize: '11px', color: '#92400e', margin: '0 0 8px 0' }}>Click any word to replace it with [Name]</p>}
                          {highlightedExamples.map((ex, i) => (
                            <div key={i} style={{ backgroundColor: 'white', border: '1px solid #fde68a', borderRadius: '8px', padding: '10px 12px', marginBottom: '8px', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                              <div style={{ flex: 1, fontSize: '13px', lineHeight: '1.7', wordBreak: 'break-word' }}>
                                {activePlaceholder === '[Name]' ? renderHighlightedTokens(ex, i) : <span style={{ color: '#374151' }}>{ex}</span>}
                              </div>
                              <button
                                onClick={() => { setAddedSections(prev => [...prev, { id: makeId(), type: 'standard-comment' as SectionType, name: standardSectionName.trim(), buttons: [], content: ex, instruction: '', showHeader: !!standardSectionName.trim() }]); setHighlightedExamples(prev => prev.filter((_, j) => j !== i)); setActivePlaceholder(null); }}
                                style={{ padding: '4px 10px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '5px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', flexShrink: 0 }}
                              >Add</button>
                              <button onClick={() => setHighlightedExamples(prev => prev.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', color: '#a16207', cursor: 'pointer', fontSize: '16px', flexShrink: 0, lineHeight: 1, padding: '2px 0' }}>✕</button>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                        {addedSections.filter(s => s.type === 'standard-comment').length === 0 ? 'Type or paste your statement:' : 'Add another:'}
                      </label>
                      <textarea value={standardContent} onChange={e => setStandardContent(e.target.value)} placeholder="e.g. It has been a pleasure teaching [Name] this term..." style={{ ...txa, minHeight: '90px', borderColor: '#10b981', marginBottom: '10px' }} />
                      {standardContent.trim() && (
                        <button onClick={() => { setAddedSections(prev => [...prev, { id: makeId(), type: 'standard-comment' as SectionType, name: standardSectionName.trim(), buttons: [], content: standardContent.trim(), instruction: '', showHeader: false }]); setStandardContent(''); }} style={{ backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '6px', padding: '8px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', marginBottom: '16px' }}>+ Add statement</button>
                      )}
                    </>
                  )}

                  {(() => { const stmts = addedSections.filter(s => s.type === 'standard-comment'); return stmts.length > 0 && (
                    <div style={{ marginBottom: '16px' }}>
                      <div style={{ fontSize: '12px', fontWeight: '700', color: '#6b7280', letterSpacing: '0.04em', marginBottom: '8px' }}>ADDED ({stmts.length})</div>
                      {stmts.map(stmt => (
                        <div key={stmt.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '6px', padding: '10px 12px', marginBottom: '6px' }}>
                          <div style={{ flex: 1 }}>
                            {stmt.name && <div style={{ fontSize: '11px', fontWeight: '700', color: '#065f46', marginBottom: '3px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{stmt.name}</div>}
                            <span style={{ fontSize: '13px', color: '#166534', lineHeight: '1.5' }}>{stmt.content}</span>
                          </div>
                          <button onClick={() => setAddedSections(prev => prev.filter(s => s.id !== stmt.id))} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: '14px', flexShrink: 0, padding: '0 2px' }}>✕</button>
                        </div>
                      ))}
                    </div>
                  ); })()}

                  <div style={{ display: 'flex', gap: '12px', marginTop: '8px', flexWrap: 'wrap' }}>
                    <button onClick={() => setHasStandardComment(null)} style={secondaryBtn}>← Back</button>
                    {addedSections.filter(s => s.type === 'standard-comment').length > 0 && (
                      <button onClick={() => { setStandardSectionName(''); setStandardContent(''); setHighlightedExamples([]); setActivePlaceholder(null); }} style={secondaryBtn}>+ Add another</button>
                    )}
                    <button onClick={goNext} style={primaryBtn}>{addedSections.filter(s => s.type === 'standard-comment').length > 0 ? `Continue with ${addedSections.filter(s => s.type === 'standard-comment').length} →` : 'Skip →'}</button>
                  </div>
                </div>
              )}
            </div>
          </div>
          {ReportsPanel()}
        </div>
      </div>
    );
    } // end step -1

    // ── Regular wizard questions ────────────────────────────────────────────
    const wAccent = SECTION_COLORS[question?.sectionType] || '#3b82f6';
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {TopBar({})}
        <div style={{ flex: 1, display: 'flex', width: '100%', overflow: 'hidden', minHeight: 0 }}>
          <div style={{ flex: 1, overflowY: 'auto', padding: '32px 40px', minWidth: 0 }}>
            <div style={{ maxWidth: '560px', width: '100%', margin: '0 auto' }}>
              <div style={{ display: 'inline-block', backgroundColor: wAccent + '20', color: wAccent, border: `1px solid ${wAccent}40`, borderRadius: '20px', padding: '4px 12px', fontSize: '12px', fontWeight: '600', marginBottom: '16px' }}>{SECTION_LABELS[question?.sectionType] || question?.id}</div>
              <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#111827', marginBottom: '10px', lineHeight: '1.3' }}>{question?.question}</h2>
              <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '20px', lineHeight: '1.6' }}>{question?.description}</p>

              {question?.examples && phase !== 'ask' && (
                <div style={{ marginBottom: '20px' }}>
                  <button onClick={() => setShowExamples(o => !o)} style={{ background: 'none', border: 'none', color: wAccent, fontSize: '13px', cursor: 'pointer', padding: 0, fontWeight: '500', textDecoration: 'underline' }}>{showExamples ? '▲ Hide examples' : '▼ See example statements'}</button>
                  {showExamples && (
                    <div style={{ marginTop: '10px', backgroundColor: 'white', border: `1px solid ${wAccent}40`, borderRadius: '8px', padding: '12px' }}>
                      {question.examples.map((ex, i) => (
                        <div key={i} onClick={() => { setNewStatement(ex); setShowExamples(false); statementInputRef.current?.focus(); }} style={{ fontSize: '13px', color: '#374151', padding: '8px 10px', borderRadius: '6px', cursor: 'pointer', marginBottom: '4px', backgroundColor: '#f9fafb', border: '1px solid #e5e7eb' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = wAccent + '15'} onMouseLeave={e => e.currentTarget.style.backgroundColor = '#f9fafb'}>{ex}</div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {phase === 'ask' && (
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>Section name:</label>
                  <input type="text" value={sectionName} onChange={e => setSectionName(e.target.value)} placeholder={question.namePlaceholder || question.defaultName} style={{ ...inp, borderColor: wAccent, marginBottom: '16px' }} />
                  <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                    <button onClick={handleWizardYes} style={{ ...primaryBtn, flex: 1 }}>Yes — build this section →</button>
                    <button onClick={handleWizardNo} style={{ ...secondaryBtn, flex: 1 }}>Skip</button>
                  </div>
                  {currentStep > 0
                    ? <button onClick={() => { const prev = currentStep - 1; setCurrentStep(prev); resetWizardQuestion(QUESTIONS[prev]?.defaultName); }} style={{ background: 'none', border: 'none', color: '#9ca3af', fontSize: '13px', cursor: 'pointer', padding: 0 }}>← Previous question</button>
                    : <button onClick={() => { setCurrentStep(-1); setHasStandardComment(null); }} style={{ background: 'none', border: 'none', color: '#9ca3af', fontSize: '13px', cursor: 'pointer', padding: 0 }}>← Back</button>}
                </div>
              )}

              {phase === 'statements' && (
                <div>
                  <div style={{ backgroundColor: aiUsedForSection ? '#f0fdf4' : '#eff6ff', border: `1px solid ${aiUsedForSection ? '#bbf7d0' : '#bfdbfe'}`, borderRadius: '8px', padding: '10px 14px', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: showInstructions ? '8px' : '0' }}>
                      <span style={{ fontSize: '12px', fontWeight: '700', color: aiUsedForSection ? '#065f46' : '#1e40af' }}>
                        {aiUsedForSection ? '✓ AI complete — check & adjust' : 'How to build this section'}
                      </span>
                      <button onClick={() => setShowInstructions(o => !o)} style={{ background: 'none', border: 'none', color: aiUsedForSection ? '#065f46' : '#1e40af', cursor: 'pointer', fontSize: '11px', padding: 0 }}>
                        {showInstructions ? 'hide ▲' : 'show ▼'}
                      </button>
                    </div>
                    {showInstructions && (
                      <div style={{ fontSize: '12px', color: aiUsedForSection ? '#047857' : '#1d4ed8', lineHeight: '1.8', textAlign: 'left' }}>
                        {aiUsedForSection ? (
                          question.sectionType === 'rated-comment' ? (<>
                            <HelpStep text="1. Check statements for each rating level — AI sometimes makes mistakes" tip="Read through each button's statements carefully — AI can misclassify levels or add extra words." />
                            <HelpStep text={<>2. Use ✏️ edit, ↔ to move between buttons and ✕ delete to make changes to statements</>} tip="Click ✏️ to edit a statement inline. Use ↔ to move it to a different button. ✕ removes it." />
                            <HelpStep text={<>3. Rename a button by clicking on it and typing — use <strong>+ Add</strong> to add more levels or ✕ (beside the button name) to delete one</>} tip="Click the button label itself to rename it. Use + Add to create extra performance levels if needed." />
                            <HelpStep text={<>4. When finished: <strong>Save section</strong> or <strong>Duplicate</strong> to create two linked rated sections</>} tip="Duplicate creates a second copy — useful if you want two rated sections side by side, e.g. effort and attainment." />
                          </>) : question.sectionType === 'assessment-comment' ? (<>
                            <HelpStep text={<>1. Check statements — replace actual scores with <strong>[Score 1]</strong> (click it in the orange box, then click the number)</>} tip="Click [Score 1] in the placeholder bar above the statement, then click the actual number in the statement to swap it." />
                            <HelpStep text={<>2. For additional scores use <strong>[Score 2]</strong>, <strong>[Score 3]</strong> etc.</>} tip="If a statement references two scores, use [Score 1] for the first and [Score 2] for the second." />
                            <HelpStep text={<>3. Rename a button by clicking on it and typing — use <strong>+ Add</strong> to add more or ✕ to delete one</>} tip="Click the button label itself to rename it. Button names appear as labels in the report writer." />
                            <HelpStep text={<>4. Use ✏️ edit, ↔ to move between buttons and ✕ delete to make changes to statements</>} tip="Click ✏️ to edit a statement inline. Use ↔ to move it to a different button. ✕ removes it." />
                            <HelpStep text={<>5. When finished: <strong>Save section</strong> or <strong>Duplicate</strong> for multiple assessment sections</>} tip="Duplicate creates a second copy — useful if pupils sit more than one assessment." />
                          </>) : question.sectionType === 'personalised-comment' ? (<>
                            <HelpStep text={<>1. Check statements — replace specific details with <strong>[Info 1]</strong> (click it in the orange box, then click the word)</>} tip="Click [Info 1] in the placeholder bar above the statement, then click the specific word in the statement to swap it out." />
                            <HelpStep text={<>2. If a statement has two pieces of personal info, use <strong>[Info 2]</strong> for the second one</>} tip="For example: '[Name] excelled at [Info 1] and also showed talent in [Info 2].'" />
                            <HelpStep text={<>3. Use ✏️ edit, ↔ to move between buttons and ✕ delete to make changes</>} tip="Click ✏️ to edit a statement inline. Use ↔ to move it to a different button. ✕ removes it." />
                            <HelpStep text={<>4. When finished: <strong>Save section</strong> or <strong>Duplicate</strong> for multiple target sections</>} tip="Duplicate creates a second copy — useful if you want separate sections for different types of personal info." />
                          </>) : (<>
                            <HelpStep text="1. Check the buttons and statements — AI sometimes makes mistakes" tip="Read through each button's statements carefully — AI can misclassify or add extra words." />
                            <HelpStep text={<>2. Use ✏️ edit, ↔ to move between buttons and ✕ delete to make changes</>} tip="Click ✏️ to edit a statement inline. Use ↔ to move it to a different button. ✕ removes it." />
                            <HelpStep text="3. Move also lets you create a new button" tip="When moving a statement, choose 'New button' to place it in a brand new category." />
                            <HelpStep text="4. Rename a button by clicking on it and typing" tip="Click the button label itself to rename it directly." />
                            <HelpStep text={<>5. When finished: <strong>Save section</strong> or <strong>Duplicate</strong> to select multiple statements per pupil when writing reports</>} tip="Duplicate creates a second copy of this section — useful for selecting more than one statement per pupil." />
                          </>)
                        ) : hasReports ? (
                          question.sectionType === 'rated-comment' ? (<>
                            <HelpStep text="1. Select your rating statements by highlighting them in the reports" tip="Click and drag to highlight a sentence in the reports panel on the right — it will appear as a captured statement ready to assign." />
                            <HelpStep text={<>2. If using AI: highlight a few examples, then click <strong>Create Section with AI</strong> or <strong>Find Statements with AI</strong> below</>} tip="Select 2–3 statements from the reports panel — Create Section with AI builds buttons and fills them in automatically, Find Statements with AI just finds matching statements for you to sort yourself." />
                            <HelpStep text="3. Otherwise select as many statements needed to get started. (You can add more when writing reports)" tip="Highlight as many as you want now. You can always highlight more later while writing reports." />
                            <HelpStep text={<>4. Replace pupil names: click <strong>[Name]</strong> in the orange box, then click any pupil names to replace</>} tip="Click [Name] in the orange placeholder bar, then click the pupil's name in the statement to swap it out." />
                            <HelpStep text={<>5. Rename a button by clicking on it and typing — use <strong>+ Add</strong> to add more or ✕ to delete one</>} tip="Click the button label itself to rename it. Use + Add to create extra performance levels if needed." />
                            <HelpStep text={<>6. When finished: <strong>Save section</strong></>} tip="Save section adds it to your template. Use the Duplicate button below to add a second linked rated section if needed." />
                          </>) : question.sectionType === 'assessment-comment' ? (<>
                            <HelpStep text="1. Select your assessment statements by highlighting them in the reports" tip="Click and drag to highlight a sentence in the reports panel on the right — it will appear as a captured statement ready to assign." />
                            <HelpStep text={<>2. If using AI: highlight a few examples, then click <strong>Create Section with AI</strong> or <strong>Find Statements with AI</strong> below</>} tip="Select 2–3 statements from the reports panel — Create Section with AI builds buttons and fills them in automatically, Find Statements with AI just finds matching statements for you to sort yourself." />
                            <HelpStep text="3. Otherwise select as many statements needed to get started. (You can add more when writing reports)" tip="Highlight as many as you want now. You can always highlight more later while writing reports." />
                            <HelpStep text={<>4. Replace pupil names: click <strong>[Name]</strong> in the orange box, then click any pupil names to replace</>} tip="Click [Name] in the orange placeholder bar, then click the pupil's name in the statement to swap it out." />
                            <HelpStep text={<>5. Replace assessment scores: click <strong>[Score 1]</strong> in the orange box, then click the number to be replaced</>} tip="Click [Score 1] in the orange placeholder bar, then click the actual score number in the statement to swap it." />
                            <HelpStep text={<>6. If your statement has further scores, repeat with <strong>[Score 2]</strong>, <strong>[Score 3]</strong> etc.</>} tip="If a statement has e.g. a raw score and a percentage, use [Score 1] for one and [Score 2] for the other." />
                            <HelpStep text="7. If reports only state a score with no judgement, one button may be enough" tip="For example, if your reports just say 'Test score: 78%' with no other comment, a single button is sufficient." />
                            <HelpStep text={<>8. Rename a button by clicking on it and typing — use <strong>+ Add</strong> to add more or ✕ to delete one</>} tip="Button names appear as labels in the report writer — keep them short and descriptive." />
                            <HelpStep text={<>9. When finished: <strong>Save section</strong></>} tip="Save section adds it to your template. Use the Duplicate button below to add a second assessment section if needed." />
                          </>) : question.sectionType === 'personalised-comment' ? (<>
                            <HelpStep text="1. Select your personalised statements by highlighting them in the reports" tip="Click and drag to highlight a sentence in the reports panel on the right — it will appear as a captured statement ready to assign." />
                            <HelpStep text={<>2. If using AI: highlight a few examples, then click <strong>Create Section with AI</strong> or <strong>Find Statements with AI</strong> below</>} tip="Select 2–3 statements from the reports panel — Create Section with AI builds buttons and fills them in automatically, Find Statements with AI just finds matching statements for you to sort yourself." />
                            <HelpStep text="3. Otherwise select as many statements needed to get started. (You can add more when writing reports)" tip="Highlight as many as you want now. You can always highlight more later while writing reports." />
                            <HelpStep text={<>4. Replace pupil names: click <strong>[Name]</strong> in the orange box, then click any pupil names to replace</>} tip="Click [Name] in the orange placeholder bar, then click the pupil's name in the statement to swap it out." />
                            <HelpStep text={<>5. Use <strong>[Info 1]</strong> to replace the specific detail — click it in the orange box, then click the words to be replaced</>} tip="Click [Info 1] in the orange placeholder bar, then click the word(s) in the statement you want to replace with personal info." />
                            <HelpStep text={<>6. If a statement has two pieces of personal info, use <strong>[Info 2]</strong> for the second one</>} tip="For example: '[Name] excelled at [Info 1] and also showed talent in [Info 2].'" />
                            <HelpStep text={<>7. When finished: <strong>Save section</strong></>} tip="Save section adds it to your template. Use the Duplicate button below to add a second personalised section if needed." />
                          </>) : (<>
                            <HelpStep text="1. Select your statements by highlighting them in the reports" tip="Click and drag to highlight a sentence in the reports panel on the right — it will appear as a captured statement ready to assign." />
                            <HelpStep text={<>2. If using AI: highlight a few examples, then click <strong>Create Section with AI</strong> or <strong>Find Statements with AI</strong> below</>} tip="Select 2–3 statements from the reports panel — Create Section with AI builds buttons and fills them in automatically, Find Statements with AI just finds matching statements for you to sort yourself." />
                            <HelpStep text="3. Or highlight as many statements as you want manually — you can add more whilst writing reports" tip="You don't need to add every statement now — highlight a good starting set and add more when you're writing reports." />
                            <HelpStep text={<>4. Replace pupil names: click <strong>[Name]</strong> in the orange box, then click any pupil names to replace</>} tip="Click [Name] in the orange placeholder bar, then click the pupil's name in the statement to swap it out." />
                            <HelpStep text={<>5. Assign each statement to a button — click <strong>+ New button</strong> to create one first</>} tip="Create a button with a descriptive name, then highlight a statement and assign it. Repeat for each button." />
                            <HelpStep text={<>6. When finished: <strong>Save section</strong> or <strong>Duplicate</strong> to select multiple statements per pupil when writing reports</>} tip="Duplicate creates a second copy of this section — useful for selecting more than one statement per pupil." />
                          </>)
                        ) : (
                          question.sectionType === 'rated-comment' ? (<>
                            <HelpStep text="1. Click a rating button — Excellent, Good etc. — to select it" tip="You need to select a button before typing — the selected button is highlighted. Repeat for each rating level." />
                            <HelpStep text="2. Type or paste statements for that performance level" tip="Type directly in the statement box below, or paste statements you've written elsewhere." />
                            <HelpStep text="3. Repeat for each of the rating levels" tip="Work through Excellent, Good, Satisfactory and Needs Improvement (or rename them to match your school's language)." />
                            <HelpStep text={<>4. Rename a button by clicking on it and typing — use <strong>+ Add</strong> to add more levels or ✕ to delete one</>} tip="Click the button label itself to rename it. Use + Add to create extra performance levels if needed." />
                            <HelpStep text={<>5. When finished: <strong>Save section</strong> or <strong>Duplicate</strong> to create two linked rated sections</>} tip="Duplicate creates a second copy — useful if you want two rated sections side by side, e.g. effort and attainment." />
                          </>) : question.sectionType === 'assessment-comment' ? (<>
                            <HelpStep text={<>1. Click a button to select it, then type statements using <strong>[Score 1]</strong> where the score goes</>} tip="Type [Score 1] as a placeholder — when writing reports you'll type the actual score in its place." />
                            <HelpStep text={<>2. For additional scores in one comment use <strong>[Score 2]</strong>, <strong>[Score 3]</strong> etc.</>} tip="If a statement references two scores, use [Score 1] for the first and [Score 2] for the second." />
                            <HelpStep text="3. If comments only state a score with no other text, one button is enough" tip="In this case, just add a single button and leave the statement as '[Score 1]' alone." />
                            <HelpStep text={<>4. Rename a button by clicking on it and typing — use <strong>+ Add</strong> to create more or ✕ to delete one</>} tip="Button names appear as labels in the report writer — keep them short and descriptive." />
                            <HelpStep text={<>5. When finished: <strong>Save section</strong> or <strong>Duplicate</strong> for multiple assessment sections</>} tip="Duplicate creates a second copy — useful if pupils sit more than one assessment." />
                          </>) : question.sectionType === 'personalised-comment' ? (<>
                            <HelpStep text={<>1. Click <strong>+ New button</strong> to create a button, then type statements using <strong>[Info 1]</strong> for the specific detail</>} tip="Type [Info 1] as a placeholder — when writing reports you'll type the actual detail (e.g. a sport, instrument, or target) in its place." />
                            <HelpStep text={<>2. If a statement has two pieces of personal info, use <strong>[Info 2]</strong> for the second one</>} tip="For example: '[Name] excelled at [Info 1] and also showed talent in [Info 2].'" />
                            <HelpStep text="3. Rename a button by clicking on it and typing" tip="Click the button label itself to rename it directly." />
                            <HelpStep text="4. Repeat for as many buttons as you need" tip="Each button becomes a selectable option in the report writer." />
                            <HelpStep text={<>5. When finished: <strong>Save section</strong> or <strong>Duplicate</strong> for multiple target sections</>} tip="Duplicate creates a second copy — useful if you want separate sections for different types of personal info." />
                          </>) : (<>
                            <HelpStep text={<>1. Click <strong>+ New button</strong> to create a button, then type or paste statements for it</>} tip="Each button groups related statements together — e.g. one button per theme or topic." />
                            <HelpStep text="2. Rename a button by clicking on it and typing" tip="Click the button label itself to rename it directly." />
                            <HelpStep text="3. Repeat for as many buttons as you need" tip="Each button becomes a selectable option in the report writer." />
                            <HelpStep text={<>4. When finished: <strong>Save section</strong> or <strong>Duplicate</strong> to select multiple statements per pupil when writing reports</>} tip="Duplicate creates a second copy of this section — useful for selecting more than one statement per pupil." />
                          </>)
                        )}
                      </div>
                    )}
                  </div>
                  {renderStatementEditor(question.sectionType, sectionName)}
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <button onClick={() => setPhase('ask')} style={secondaryBtn}>← Back</button>
                    <button onClick={handleWizardAddSection} style={primaryBtn}>{editingSectionId ? 'Save changes →' : 'Save section →'}</button>
                    <button onClick={handleWizardAddSectionAndDuplicate} style={{ ...primaryBtn, backgroundColor: '#7c3aed' }}>Duplicate →</button>
                  </div>
                </div>
              )}

              {phase === 'added' && (
                <div>
                  <div style={{ backgroundColor: '#d1fae5', color: '#065f46', borderRadius: '8px', padding: '12px 16px', fontSize: '13px', fontWeight: '600', marginBottom: '20px' }}>✓ Section added</div>
                  {question?.allowMultiple && (
                    <>
                      <p style={{ fontSize: '14px', color: '#374151', marginBottom: '16px' }}>Would you like to add another {SECTION_LABELS[question.sectionType]?.toLowerCase()}?</p>
                      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                        <button onClick={advanceQuestion} style={secondaryBtn}>No, continue →</button>
                        <button onClick={handleAddAnother} style={primaryBtn}>Yes, add another</button>
                      </div>
                    </>
                  )}
                  {!question?.allowMultiple && <button onClick={advanceQuestion} style={primaryBtn}>Continue →</button>}
                </div>
              )}

              {addedSections.length > 0 && phase !== 'added' && (
                <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid #f3f4f6' }}>
                  <div style={{ fontSize: '12px', fontWeight: '600', color: '#9ca3af', marginBottom: '8px' }}>SECTIONS ADDED SO FAR</div>
                  {addedSections.map(s => (
                    <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: SECTION_COLORS[s.type] || '#9ca3af', flexShrink: 0 }} />
                      <span style={{ fontSize: '13px', color: '#374151' }}>{s.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          {reportsPanelOpen && ReportsPanel()}
        </div>
      </div>
    );
  }

  return null;
};

export default BuildAsYouGo;