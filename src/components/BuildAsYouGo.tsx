import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { TemplateSection, SectionType } from '../types';
import { useData } from '../contexts/DataContext';
import { SUBJECT_EXTRAS, SUBJECTS, STRENGTHS_ADDABLE_UNIVERSAL, STRENGTHS_ADDABLE_BY_SUBJECT, NEXT_STEPS_ADDABLE_UNIVERSAL, NEXT_STEPS_ADDABLE_BY_SUBJECT, DEVELOPMENT_ADDABLE_UNIVERSAL, DEVELOPMENT_ADDABLE_BY_SUBJECT, AddableButton } from '../data/starterComments';

const SUPABASE_URL = 'https://wozbrojwuzktwrzngllh.supabase.co/functions/v1/generate-template';

interface BuildAsYouGoProps {
  templateName: string;
  classId?: string;
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
  { id: 'qualities', question: 'Do your reports comment on pupil qualities or strengths?', description: 'Comments picked from a set of options — for example effort, attitude, teamwork.', sectionType: 'qualities', namePlaceholder: 'e.g. Character Qualities, Strengths', defaultName: 'Character Qualities', allowMultiple: true, hasButtons: true, positionType: 'qualities', examples: ['[Name] consistently demonstrates excellent effort and a positive attitude towards learning.', '[Name] is a natural leader who supports and encourages classmates.', '[Name] shows great resilience and perseverance when faced with challenges.'] },
  { id: 'rated-comment', question: 'Do your reports rate pupils on their performance?', description: 'Comments tied to a rating — Excellent, Good, Satisfactory, Needs Improvement.', sectionType: 'rated-comment', namePlaceholder: 'e.g. Progress, Effort Rating', defaultName: 'Progress', allowMultiple: true, hasButtons: true, isRatedFixed: true, positionType: 'rating', examples: ['[Name] has made excellent progress this term and consistently produces work of the highest standard.', '[Name] needs to focus on consolidating their understanding of the core topics covered this term.'] },
  { id: 'assessment-comment', question: 'Do your reports include assessment results with a score?', description: 'Comments linked to a score or percentage — use [Score] as the placeholder.', sectionType: 'assessment-comment', namePlaceholder: 'e.g. Assessment Result, Test Score', defaultName: 'Assessment', allowMultiple: true, hasButtons: true, isRatedFixed: false, positionType: 'assessment-comment', examples: ['[Name] achieved [Score] in the recent assessment, which reflects their hard work throughout the unit.'] },
  { id: 'personalised-comment', question: 'Do your reports include targets or specific information per pupil?', description: 'Comments where a detail unique to each pupil is typed in — for example a target, sport, instrument, or achievement.', sectionType: 'personalised-comment', namePlaceholder: 'e.g. Personal Target, Focus Area, Activity', defaultName: 'Personal Target', allowMultiple: true, hasButtons: true, positionType: 'personalised-comment', examples: ['[Name] should focus on [Info 1] as a key area for development going forward.', '[Name] has shown particular enthusiasm for [Info 1] this term and has made impressive progress.'] },
  { id: 'next-steps', question: 'Do your reports include general next steps or areas for development?', description: 'Suggestions for what the pupil should focus on — chosen from a set of options rather than typed per pupil.', sectionType: 'next-steps', namePlaceholder: 'e.g. Next Steps, Areas for Development', defaultName: 'Next Steps', allowMultiple: true, hasButtons: true, positionType: 'next-steps', examples: ['[Name] should focus on developing their extended writing skills to reach the next level.', '[Name] should aim to consolidate the key topics covered this session through regular review.'] },
  { id: 'other-comments', question: 'Do your reports contain any other types of comments?', description: 'Any other categories not covered above — for example behaviour, homework, or wider achievement.', sectionType: 'qualities', namePlaceholder: 'e.g. Behaviour, Homework, Wider Achievement', defaultName: 'Other Comments', allowMultiple: true, hasButtons: true, positionType: 'qualities', examples: ['[Name] consistently demonstrates excellent behaviour and is a pleasure to have in class.', '[Name] completes homework to a high standard and always meets deadlines.'] },
];

const SECTION_COLORS: Record<string, string> = { 'standard-comment': '#10b981', 'qualities': '#8b5cf6', 'rated-comment': '#3b82f6', 'assessment-comment': '#8b5cf6', 'personalised-comment': '#f59e0b', 'next-steps': '#06b6d4', 'optional-additional-comment': '#ef4444', 'new-line': '#9ca3af' };
const SECTION_LABELS: Record<string, string> = { 'standard-comment': 'Fixed Statement', 'qualities': 'Qualities / Strengths', 'rated-comment': 'Rated Comment', 'assessment-comment': 'Assessment Score', 'personalised-comment': 'Personalised Comment', 'next-steps': 'Next Steps / Targets', 'optional-additional-comment': 'Optional Notes Box', 'new-line': 'Line Break' };
const SUBJECT_ICONS: Record<string, string> = { 'PE': '🏃', 'English': '📖', 'Maths': '📐', 'Science': '🔬', 'History': '🏛️', 'Geography': '🌍', 'Modern Languages': '💬', 'Art & Design': '🎨', 'Music': '🎵', 'Generic': '📋' };
const DEFAULT_RATED_BUTTONS = ['Excellent', 'Good', 'Satisfactory', 'Needs Improvement'];
const RATED_KEYS = ['excellent', 'good', 'satisfactory', 'needsImprovement'];
const MAX_STATEMENTS = 8;
const makeId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
const AUTOSAVE_KEY = 'buildAsYouGo_draft';
function saveDraft(n: string, s: AddedSection[]) { try { localStorage.setItem(AUTOSAVE_KEY, JSON.stringify({ templateName: n, sections: s, savedAt: Date.now() })); } catch (_) {} }
function clearDraft() { try { localStorage.removeItem(AUTOSAVE_KEY); } catch (_) {} }


type Screen = 'subject' | 'standard-comment' | 'wizard';

const BuildAsYouGo: React.FC<BuildAsYouGoProps> = ({ templateName, classId, onComplete, onCancel }) => {
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
  const [activePlaceholder, setActivePlaceholder] = useState<string | null>(null);
  const statementInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { if (addedSections.length > 0) saveDraft(localTemplateName, addedSections); }, [addedSections, localTemplateName]);
  useEffect(() => { setRestructuredReports(null); }, [pastedReports]);

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
  const handleMoveStatement = (bi: number, si: number, targetBi: number) => {
    const stmt = buttons[bi].statements[si];
    setButtons(prev => { const u = prev.map(b => ({ ...b, statements: [...b.statements] })); u[bi].statements.splice(si, 1); u[targetBi].statements.push(stmt); return u; });
    setMovingStatementKey(null);
  };
  const handleConfirmNewButton = () => { if (!newButtonName.trim()) return; const idx = buttons.length; setButtons(prev => [...prev, { name: newButtonName.trim(), statements: [] }]); setActiveButtonIndex(idx); setNewButtonName(''); setAddingNewButton(false); };
  const handleConfirmButtonName = () => { if (!namingButtonValue.trim()) return; setButtons(prev => { const u = [...prev]; u[namingButtonIndex!] = { ...u[namingButtonIndex!], name: namingButtonValue.trim() }; return u; }); setNamingButtonIndex(null); setNamingButtonValue(''); };
  const handleAddRatedButton = () => setButtons(prev => [...prev, { name: 'New Level', statements: [] }]);
  const handleDeleteRatedButton = (idx: number) => { if (buttons.length <= 1) return; setButtons(prev => prev.filter((_, i) => i !== idx)); setActiveButtonIndex(0); };
  const handleRatedButtonRename = (idx: number, val: string) => { setButtons(prev => { const u = [...prev]; u[idx] = { ...u[idx], name: val }; return u; }); };

  const resetWizardQuestion = () => {
    setPhase('ask'); setSectionName(''); setButtons([]); setActiveButtonIndex(0);
    setNewStatement(''); setNewButtonName(''); setAddingNewButton(false); setNamingButtonIndex(null); setNamingButtonValue('');
    setStandardContent(''); setShowExamples(false); setAiError(null); setEditingStatementKey(null); setMovingStatementKey(null);
    setHighlightedExamples([]);
  };
  const advanceQuestion = () => { if (isLastQuestion) handleSaveAndWrite(); else { setCurrentStep(s => s + 1); resetWizardQuestion(); } };
  const handleWizardYes = () => { setSectionName(question.defaultName); setPhase('name'); };
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
  const handleAddAnother = () => {
    setSectionName(question.defaultName); setPhase('name'); setButtons([]); setActiveButtonIndex(0);
    setNewStatement(''); setNewButtonName(''); setAddingNewButton(false); setNamingButtonIndex(null); setNamingButtonValue('');
    setStandardContent(''); setShowExamples(false); setAiError(null); setEditingStatementKey(null); setMovingStatementKey(null);
    setHighlightedExamples([]);
  };

  const handleAiFindInReports = async (sName?: string, sType?: string) => {
    if (!hasReports) return;
    setAiLoading(true); setAiError(null);
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
          const rRes = await fetch(SUPABASE_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mode: 'restructure', reportText: pastedReports, subject: subject || '' }) });
          if (rRes.ok) {
            const rData = await rRes.json();
            if (rData.restructuredText) { setRestructuredReports(rData.restructuredText); reportTextForAI = rData.restructuredText; }
          }
        } catch { /* fail silently — use original */ }
        finally { setIsRestructuring(false); }
      } else {
        reportTextForAI = restructuredReports;
      }

      const positionType = activeType === 'next-steps' ? 'next-steps' : activeType === 'rated-comment' ? 'rating' : activeType === 'assessment-comment' ? 'assessment-comment' : activeType === 'personalised-comment' ? 'personalised-comment' : activeName === 'Areas for Development' ? 'next-steps' : 'qualities';
      const response = await fetch(SUPABASE_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mode: 'extract-only', subject: subject || activeName, yearGroup: '', reportText: reportTextForAI, pronounSet: 'they/their', openerType: 'name', sectionName: activeName, positionType, selectedText: selectedTextForAI, scaleType: activeType === 'rated-comment' ? 'four-level' : 'own' }) });
      if (!response.ok) throw new Error('failed');
      const data = await response.json();
      const headings: { name: string; comments: string[] }[] = data.headings || [];
      if (headings.length === 0) { setAiError('No matching sentences found. Try selecting a specific example sentence from your reports first.'); setAiLoading(false); return; }
      setNamingButtonIndex(null);
      setButtons(prev => {
        const u = [...prev];
        if (isRated) {
          headings.forEach(h => {
            const n = h.name.toLowerCase(); let ti = 1;
            if (n.includes('excellent') || n.includes('outstanding') || n.includes('strong')) ti = 0;
            else if (n.includes('good') || n.includes('solid') || n.includes('pleasing')) ti = 1;
            else if (n.includes('satisfactory') || n.includes('adequate') || n.includes('reasonable')) ti = 2;
            else if (n.includes('improvement') || n.includes('needs') || n.includes('limited') || n.includes('poor')) ti = 3;
            if (ti < u.length) { const newStmts = h.comments.filter(c => !u[ti].statements.includes(c)); u[ti] = { ...u[ti], statements: [...u[ti].statements, ...newStmts].slice(0, MAX_STATEMENTS) }; }
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
    } catch { setAiError('AI extraction failed. Please try again.'); }
    finally { setAiLoading(false); }
  };


  const handleCancel = () => { if (addedSections.length > 0 || screen === 'wizard') { if (!window.confirm('Are you sure? Your progress will be lost.')) return; } onCancel(); };

  const buildFinalSections = (): TemplateSection[] => {
    const builtSections: TemplateSection[] = addedSections.map(s => {
      let data: any = {};
      if (s.type === 'standard-comment') data = { content: s.content || '' };
      else if (s.type === 'qualities') { const c: Record<string, string[]> = {}; s.buttons.forEach(b => { if (b.name) c[b.name] = b.statements; }); data = { comments: c }; }
      else if (s.type === 'rated-comment') { const c: Record<string, string[]> = {}; s.buttons.forEach((b, i) => { const key = RATED_KEYS[i] || b.name.toLowerCase().replace(/\s+/g, ''); c[key] = b.statements; }); data = { comments: c }; }
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
    if (classId) {
      sessionStorage.setItem('continueEditing', JSON.stringify({ classId, templateId: newTemplateId, studentIndex: 0 }));
      navigate('/write-reports');
    } else {
      navigate('/start');
    }
  };

  const TopBar = ({ title }: { title?: string }) => (
    <div style={{ backgroundColor: 'white', borderBottom: '1px solid #e5e7eb', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
      <div style={{ fontSize: '14px', fontWeight: '600', color: '#374151' }}>{title || localTemplateName || templateName}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {screen === 'wizard' && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '120px', height: '4px', backgroundColor: '#e5e7eb', borderRadius: '2px' }}>
                <div style={{ width: `${((currentStep + 1) / QUESTIONS.length) * 100}%`, height: '100%', backgroundColor: '#3b82f6', borderRadius: '2px', transition: 'width 0.3s ease' }} />
              </div>
              <span style={{ fontSize: '12px', color: '#6b7280' }}>{currentStep + 1}/{QUESTIONS.length}</span>
            </div>
            <button onClick={() => setReportsPanelOpen(o => !o)} style={{ backgroundColor: '#f3f4f6', color: '#6b7280', border: '1px solid #d1d5db', borderRadius: '6px', padding: '6px 14px', fontSize: '13px', fontWeight: '500', cursor: 'pointer' }}>{reportsPanelOpen ? 'Hide reports' : '📄 Show reports'}</button>
          </>
        )}
        <button onClick={handleCancel} style={{ background: 'none', border: 'none', color: '#9ca3af', fontSize: '13px', cursor: 'pointer' }}>← Back</button>
      </div>
    </div>
  );

  const ReportsPanel = () => {
    const handleMouseUp = () => {
      const sel = window.getSelection();
      const text = sel?.toString().trim() || '';
      if (text.length > 15 && !highlightedExamples.includes(text)) {
        setHighlightedExamples(prev => [...prev, text]);
      }
    };
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
                ? `Highlight sentences from the "${currentSectionLabel}" section, then click "Find in my reports" →`
                : 'Highlight example sentences, then click "Find in my reports" →'
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
            <div onMouseUp={handleMouseUp} style={{ flex: 1, overflowY: 'auto', padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '12px', lineHeight: '1.7', color: '#374151', cursor: 'text', userSelect: 'text', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {pastedReports}
            </div>
          ) : (
            <textarea ref={reportsPanelRef} value={pastedReports} onChange={e => setPastedReports(e.target.value)} onScroll={handleReportsPanelScroll} placeholder="Paste your existing reports here. Your reports stay on your device — they are never sent to a server or stored." style={{ flex: 1, width: '100%', padding: '10px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '12px', lineHeight: '1.7', outline: 'none', resize: 'none', boxSizing: 'border-box', fontFamily: 'inherit', color: '#374151' }} />
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

  const placeholderBtn = (p: string) => (
    <button
      key={p}
      onClick={() => setActivePlaceholder(prev => prev === p ? null : p)}
      style={{ padding: '3px 7px', border: `1px solid ${activePlaceholder === p ? '#f59e0b' : '#fde68a'}`, borderRadius: '5px', backgroundColor: activePlaceholder === p ? '#fef3c7' : 'white', color: '#92400e', fontSize: '11px', fontWeight: '700', cursor: 'pointer', flexShrink: 0 }}
    >{p}</button>
  );

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
                {placeholderBtn('[Name]')}
                {sType === 'assessment-comment' && <>{placeholderBtn('[Score 1]')}{placeholderBtn('[Score 2]')}</>}
                {sType === 'personalised-comment' && <>{placeholderBtn('[Info 1]')}{placeholderBtn('[Info 2]')}</>}
              </div>
              <button onClick={() => { setHighlightedExamples([]); setActivePlaceholder(null); }} style={{ background: 'none', border: 'none', color: '#a16207', cursor: 'pointer', fontSize: '12px', fontWeight: '500', padding: 0 }}>Clear all</button>
            </div>
            {activePlaceholder && <p style={{ fontSize: '11px', color: '#92400e', margin: '0 0 10px 0' }}>Click any word to replace it with {activePlaceholder}</p>}
            {highlightedExamples.map((ex, i) => (
              <div key={i} style={{ backgroundColor: 'white', border: '1px solid #fde68a', borderRadius: '8px', padding: '10px 12px', marginBottom: '8px', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                <div style={{ flex: 1, fontSize: '13px', lineHeight: '1.7', wordBreak: 'break-word' }}>
                  {activePlaceholder ? renderHighlightedTokens(ex, i) : <span style={{ color: '#374151' }}>{ex}</span>}
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
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px', alignItems: 'center' }}>
              {buttons.map((btn, i) => btn.name ? (
                <button key={i} onClick={() => { setActiveButtonIndex(i); setAddingNewButton(false); setNamingButtonIndex(null); }} style={{ padding: '6px 14px', border: `2px solid ${accentColor}`, borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', backgroundColor: activeButtonIndex === i && namingButtonIndex === null && !addingNewButton ? accentColor : 'white', color: activeButtonIndex === i && namingButtonIndex === null && !addingNewButton ? 'white' : accentColor }}>
                  {btn.name}{btn.statements.length > 0 && <span style={{ marginLeft: '6px', fontSize: '11px', opacity: 0.8 }}>({btn.statements.length})</span>}
                </button>
              ) : null)}
              {!addingNewButton && namingButtonIndex === null && <button onClick={() => { setAddingNewButton(true); setNewButtonName(''); }} style={{ padding: '6px 14px', border: `2px dashed ${accentColor}`, borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', backgroundColor: 'white', color: accentColor }}>+ New Button</button>}
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
            <div style={{ height: '1px', backgroundColor: '#f3f4f6', margin: '8px 0 14px' }} />
            <div style={{ fontSize: '12px', fontWeight: '700', color: '#9ca3af', letterSpacing: '0.04em', marginBottom: '10px' }}>ADD MORE BUTTONS</div>
            {availableUniversal.length > 0 && <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: availableSubject.length > 0 ? '10px' : '0' }}>{availableUniversal.map((btn, i) => <button key={i} onClick={() => setButtons(prev => [...prev, { name: btn.name, statements: btn.statements }])} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', border: `2px solid ${accentColor}`, borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', backgroundColor: 'white', color: accentColor, opacity: 0.7 }} onMouseEnter={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.backgroundColor = accentColor + '15'; }} onMouseLeave={e => { e.currentTarget.style.opacity = '0.7'; e.currentTarget.style.backgroundColor = 'white'; }}><span style={{ fontSize: '14px', fontWeight: '700', lineHeight: 1 }}>﹢</span>{btn.name}</button>)}</div>}
            {availableSubject.length > 0 && <div><div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '6px', fontWeight: '600' }}>{subject.toUpperCase()} SPECIFIC</div><div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>{availableSubject.map((btn, i) => <button key={i} onClick={() => setButtons(prev => [...prev, { name: btn.name, statements: btn.statements }])} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', border: `2px solid ${accentColor}`, borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', backgroundColor: 'white', color: accentColor, opacity: 0.7 }} onMouseEnter={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.backgroundColor = accentColor + '15'; }} onMouseLeave={e => { e.currentTarget.style.opacity = '0.7'; e.currentTarget.style.backgroundColor = 'white'; }}><span style={{ fontSize: '14px', fontWeight: '700', lineHeight: 1 }}>﹢</span>{btn.name}</button>)}</div></div>}
          </div>
        )}
        {(isRated || (buttons[activeButtonIndex]?.name && !addingNewButton && namingButtonIndex === null)) && sType !== 'standard-comment' && (
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>Statements for <span style={{ color: accentColor }}>{buttons[activeButtonIndex]?.name}</span>:</label>
            {buttons[activeButtonIndex]?.statements.length > 0 && (
              <div style={{ marginBottom: '12px' }}>
                {buttons[activeButtonIndex].statements.map((stmt, i) => {
                  const isEd = editingStatementKey?.buttonIdx === activeButtonIndex && editingStatementKey?.stmtIdx === i;
                  const isMv = movingStatementKey?.buttonIdx === activeButtonIndex && movingStatementKey?.stmtIdx === i;
                  return (
                    <div key={i} style={{ backgroundColor: 'white', border: `1px solid ${isEd ? accentColor : '#e5e7eb'}`, borderRadius: '6px', marginBottom: '6px', overflow: 'hidden' }}>
                      {isEd ? (
                        <div style={{ padding: '8px' }}>
                          <textarea value={editingStatementValue} onChange={e => setEditingStatementValue(e.target.value)} autoFocus style={{ ...txa, minHeight: '60px', marginBottom: '6px', borderColor: accentColor }} />
                          <div style={{ display: 'flex', gap: '6px' }}><button onClick={() => setEditingStatementKey(null)} style={{ ...secondaryBtn, padding: '4px 10px', fontSize: '12px' }}>Cancel</button><button onClick={handleSaveEditStatement} style={smallBtn(accentColor)}>Save</button></div>
                        </div>
                      ) : isMv ? (
                        <div style={{ padding: '8px' }}>
                          <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '6px' }}>Move to which button?</div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                            {buttons.map((b, bi) => bi !== activeButtonIndex && b.name ? <button key={bi} onClick={() => handleMoveStatement(activeButtonIndex, i, bi)} style={{ ...smallBtn(accentColor), fontSize: '12px', padding: '4px 10px' }}>{b.name}</button> : null)}
                            <button onClick={() => setMovingStatementKey(null)} style={{ ...secondaryBtn, padding: '4px 10px', fontSize: '12px' }}>Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '8px 10px' }}>
                          <span style={{ flex: 1, fontSize: '13px', color: '#374151', lineHeight: '1.5' }}>{stmt}</span>
                          <div style={{ display: 'flex', gap: '2px', flexShrink: 0 }}>
                            <button onClick={() => handleStartEditStatement(activeButtonIndex, i, stmt)} title="Edit" style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: '13px', padding: '2px 4px' }}>✏️</button>
                            {buttons.filter(b => b.name).length > 1 && <button onClick={() => setMovingStatementKey({ buttonIdx: activeButtonIndex, stmtIdx: i })} title="Move" style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: '13px', padding: '2px 4px' }}>↔</button>}
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
            ) : (
              <>
                <textarea ref={statementInputRef} value={newStatement} onChange={e => setNewStatement(e.target.value)} placeholder="Type or paste a statement... Use [Name] for pupil name, [Score] for scores, [Info 1] for personalised info." style={{ ...txa, minHeight: '70px', borderColor: accentColor, marginBottom: '8px' }} />
                <button onClick={handleAddStatement} disabled={!newStatement.trim()} style={{ ...smallBtn(accentColor), opacity: !newStatement.trim() ? 0.4 : 1, marginBottom: '20px' }}>+ Add statement</button>
              </>
            )}
          </div>
        )}
        {hasReports && !aiLoading && sType !== 'standard-comment' && (
          <div style={{ marginBottom: '16px' }}>
            <div style={{ height: '1px', backgroundColor: '#f3f4f6', margin: '4px 0 14px' }} />
            <button onClick={() => handleAiFindInReports(sName, sType)} style={{ width: '100%', padding: '12px 16px', backgroundColor: highlightedExamples.length > 0 ? '#fffbeb' : '#faf5ff', border: `2px solid ${highlightedExamples.length > 0 ? '#f59e0b' : '#8b5cf6'}`, borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }} onMouseEnter={e => { e.currentTarget.style.backgroundColor = highlightedExamples.length > 0 ? '#fef3c7' : '#f3e8ff'; }} onMouseLeave={e => { e.currentTarget.style.backgroundColor = highlightedExamples.length > 0 ? '#fffbeb' : '#faf5ff'; }}>
              <span style={{ fontSize: '20px' }}>🔍</span>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '14px', fontWeight: '700', color: highlightedExamples.length > 0 ? '#b45309' : '#7c3aed' }}>Find in my reports</div>
                <div style={{ fontSize: '12px', color: '#9ca3af' }}>{highlightedExamples.length > 0 ? `AI will search for sentences matching your ${highlightedExamples.length} selected example${highlightedExamples.length > 1 ? 's' : ''}` : 'Highlight example sentences in your reports first, or click to search automatically'}</div>
              </div>
            </button>
          </div>
        )}
        {aiLoading && <div style={{ marginBottom: '16px', padding: '14px 16px', backgroundColor: '#faf5ff', border: '2px solid #8b5cf6', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}><div style={{ display: 'flex', gap: '4px' }}>{[0,1,2].map(i => <div key={i} style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#8b5cf6', animation: 'pulse 1.2s ease-in-out infinite', animationDelay: `${i * 0.2}s` }} />)}</div><div style={{ fontSize: '13px', color: '#7c3aed' }}>{isRestructuring ? 'Structuring your reports first (once only)...' : 'Searching your reports...'}</div><style>{`@keyframes pulse{0%,100%{opacity:.3;transform:scale(.8)}50%{opacity:1;transform:scale(1.2)}}`}</style></div>}
        {aiError && <div style={{ marginBottom: '16px', padding: '10px 14px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', fontSize: '13px', color: '#b91c1c' }}>⚠️ {aiError}</div>}
        {!hasReports && sType !== 'standard-comment' && <div style={{ marginBottom: '16px', padding: '12px 16px', backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', fontSize: '13px', color: '#78350f', lineHeight: '1.5' }}>💡 <strong>Have existing reports?</strong> Paste them in the right panel, select an example sentence, then click "Find in my reports" to auto-populate statements.</div>}
      </div>
    );
  };

  // ─── SUBJECT SCREEN ───────────────────────────────────────────────────────

  if (screen === 'subject') return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', display: 'flex', flexDirection: 'column' }}>
      <TopBar title="Template Wizard" />
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
              <button key={s} onClick={() => { if (!localTemplateName.trim()) { setTemplateNameError('Please enter a template name first.'); return; } setSubject(s); setScreen('standard-comment'); }} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 16px', backgroundColor: 'white', border: '2px solid #e5e7eb', borderRadius: '10px', cursor: 'pointer', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#111827' }} onMouseEnter={e => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.backgroundColor = '#eff6ff'; }} onMouseLeave={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.backgroundColor = 'white'; }}>
                <span style={{ fontSize: '22px' }}>{SUBJECT_ICONS[s]}</span><span>{s}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // ─── STANDARD COMMENT SCREEN ──────────────────────────────────────────────

  if (screen === 'standard-comment') {
    const handleFindFixed = async () => {
      setAiLoading(true); setAiError(null);
      try {
        const response = await fetch(SUPABASE_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mode: 'find-fixed', reportText: pastedReports, subject: subject || '' }) });
        if (!response.ok) throw new Error('failed');
        const data = await response.json();
        const candidates: string[] = data.statements || [];
        if (candidates.length === 0) { setAiError('No repeated fixed statements found. You can add them manually below.'); }
        else { setAiCandidates(candidates); setSelectedCandidates(new Set(candidates)); setHasStandardComment('candidates'); }
      } catch { setAiError('AI scan failed. Please try again or add statements manually.'); }
      finally { setAiLoading(false); }
    };
    const confirmCandidates = () => {
      const existingContents = new Set(addedSections.filter(s => s.type === 'standard-comment').map(s => s.content));
      const chosen = aiCandidates.filter(c => selectedCandidates.has(c) && !existingContents.has(c));
      setAddedSections(prev => [...prev, ...chosen.map(c => ({ id: makeId(), type: 'standard-comment' as SectionType, name: '', buttons: [], content: c, instruction: '', showHeader: false }))]);
      setAiCandidates([]); setSelectedCandidates(new Set()); setHasStandardComment('manual');
    };
    const goNext = () => { setCurrentStep(0); resetWizardQuestion(); setScreen('wizard'); };

    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <TopBar title="Template Wizard" />
        <div style={{ flex: 1, display: 'flex', width: '100%', overflow: 'hidden', minHeight: 0 }}>
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '32px 24px' }}>
            <div style={{ maxWidth: '560px', width: '100%', backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.07)', padding: '40px 44px' }}>
              <div style={{ display: 'inline-block', backgroundColor: '#d1fae520', color: '#10b981', border: '1px solid #10b98140', borderRadius: '20px', padding: '4px 12px', fontSize: '12px', fontWeight: '600', marginBottom: '16px' }}>Fixed Statement</div>
              <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#111827', marginBottom: '10px' }}>Do your reports contain fixed statements?</h2>
              <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '24px', lineHeight: '1.6' }}>Fixed statements appear in most or all reports unchanged — for example an introduction sentence or closing remark.</p>

              {hasStandardComment === null && (
                <div>
                  <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                    <button onClick={() => setHasStandardComment('choose')} style={{ ...primaryBtn, flex: 1 }}>Yes</button>
                    <button onClick={goNext} style={{ ...secondaryBtn, flex: 1 }}>No</button>
                  </div>
                  <button onClick={() => setScreen('subject')} style={{ background: 'none', border: 'none', color: '#9ca3af', fontSize: '13px', cursor: 'pointer', padding: 0 }}>← Back</button>
                </div>
              )}

              {hasStandardComment === 'choose' && (
                <div>
                  <button onClick={hasReports ? handleFindFixed : undefined} disabled={!hasReports || aiLoading} style={{ width: '100%', textAlign: 'left', padding: '16px', backgroundColor: hasReports ? '#faf5ff' : '#f9fafb', border: `2px solid ${hasReports ? '#8b5cf6' : '#e5e7eb'}`, borderRadius: '10px', cursor: hasReports ? 'pointer' : 'not-allowed', marginBottom: '10px', opacity: hasReports ? 1 : 0.6 }} onMouseEnter={e => { if (hasReports) e.currentTarget.style.backgroundColor = '#f3e8ff'; }} onMouseLeave={e => { if (hasReports) e.currentTarget.style.backgroundColor = '#faf5ff'; }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><span style={{ fontSize: '22px' }}>🔍</span><div><div style={{ fontSize: '14px', fontWeight: '700', color: '#7c3aed' }}>Find them for me</div><div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>{hasReports ? 'AI scans your pasted reports and identifies repeated sentences' : 'Paste your reports in the right panel to use this option'}</div></div></div>
                  </button>
                  <button onClick={() => setHasStandardComment('manual')} style={{ width: '100%', textAlign: 'left', padding: '16px', backgroundColor: 'white', border: '2px solid #e5e7eb', borderRadius: '10px', cursor: 'pointer', marginBottom: '16px' }} onMouseEnter={e => { e.currentTarget.style.borderColor = '#10b981'; e.currentTarget.style.backgroundColor = '#f0fdf4'; }} onMouseLeave={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.backgroundColor = 'white'; }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><span style={{ fontSize: '22px' }}>✏️</span><div><div style={{ fontSize: '14px', fontWeight: '700', color: '#374151' }}>I'll add them manually</div><div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>Paste or type each fixed statement yourself</div></div></div>
                  </button>
                  {aiLoading && <div style={{ padding: '14px 16px', backgroundColor: '#faf5ff', border: '2px solid #8b5cf6', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}><div style={{ display: 'flex', gap: '4px' }}>{[0,1,2].map(i => <div key={i} style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#8b5cf6', animation: 'pulse 1.2s ease-in-out infinite', animationDelay: `${i * 0.2}s` }} />)}</div><div style={{ fontSize: '13px', color: '#7c3aed' }}>Scanning your reports...</div><style>{`@keyframes pulse{0%,100%{opacity:.3;transform:scale(.8)}50%{opacity:1;transform:scale(1.2)}}`}</style></div>}
                  {aiError && <div style={{ padding: '10px 14px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', fontSize: '13px', color: '#b91c1c', marginBottom: '16px' }}>⚠️ {aiError}</div>}
                  <button onClick={() => setHasStandardComment(null)} style={{ background: 'none', border: 'none', color: '#9ca3af', fontSize: '13px', cursor: 'pointer', padding: 0 }}>← Back</button>
                </div>
              )}

              {hasStandardComment === 'candidates' && (
                <div>
                  <div style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', color: '#1e40af', marginBottom: '16px', lineHeight: '1.5' }}>✨ Found {aiCandidates.length} repeated statement{aiCandidates.length !== 1 ? 's' : ''}. Untick any you don't want.</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
                    {aiCandidates.map((stmt, i) => { const checked = selectedCandidates.has(stmt); return (
                      <button key={i} onClick={() => setSelectedCandidates(prev => { const next = new Set(prev); if (next.has(stmt)) next.delete(stmt); else next.add(stmt); return next; })} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '12px 14px', backgroundColor: checked ? '#f0fdf4' : 'white', border: `2px solid ${checked ? '#10b981' : '#e5e7eb'}`, borderRadius: '8px', cursor: 'pointer', textAlign: 'left', width: '100%' }}>
                        <div style={{ width: '18px', height: '18px', borderRadius: '4px', backgroundColor: checked ? '#10b981' : 'white', border: `2px solid ${checked ? '#10b981' : '#d1d5db'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '1px', fontSize: '11px', color: 'white', fontWeight: '700' }}>{checked ? '✓' : ''}</div>
                        <span style={{ fontSize: '13px', color: '#374151', lineHeight: '1.5' }}>{stmt}</span>
                      </button>
                    ); })}
                  </div>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button onClick={() => { setHasStandardComment('choose'); setAiCandidates([]); setSelectedCandidates(new Set()); setAiError(null); }} style={secondaryBtn}>← Back</button>
                    <button onClick={confirmCandidates} style={{ ...primaryBtn, backgroundColor: '#10b981' }}>Confirm {selectedCandidates.size} →</button>
                  </div>
                </div>
              )}

              {hasStandardComment === 'manual' && (
                <div>
                  {highlightedExamples.length > 0 && (
                    <div style={{ marginBottom: '20px', backgroundColor: '#fefce8', border: `1px solid ${activePlaceholder === '[Name]' ? '#f59e0b' : '#fde68a'}`, borderRadius: '10px', padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: activePlaceholder === '[Name]' ? '6px' : '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '13px', fontWeight: '700', color: '#713f12' }}>Selected Statements ({highlightedExamples.length})</span>
                          {placeholderBtn('[Name]')}
                        </div>
                        <button onClick={() => { setHighlightedExamples([]); setActivePlaceholder(null); }} style={{ background: 'none', border: 'none', color: '#a16207', cursor: 'pointer', fontSize: '12px', fontWeight: '500', padding: 0 }}>Clear all</button>
                      </div>
                      {activePlaceholder === '[Name]' && <p style={{ fontSize: '11px', color: '#92400e', margin: '0 0 10px 0' }}>Click any word to replace it with [Name]</p>}
                      {highlightedExamples.map((ex, i) => (
                        <div key={i} style={{ backgroundColor: 'white', border: '1px solid #fde68a', borderRadius: '8px', padding: '10px 12px', marginBottom: '8px', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                          <div style={{ flex: 1, fontSize: '13px', lineHeight: '1.7', wordBreak: 'break-word' }}>
                            {activePlaceholder === '[Name]' ? renderHighlightedTokens(ex, i) : <span style={{ color: '#374151' }}>{ex}</span>}
                          </div>
                          <button
                            onClick={() => { setAddedSections(prev => [...prev, { id: makeId(), type: 'standard-comment' as SectionType, name: '', buttons: [], content: ex, instruction: '', showHeader: false }]); setHighlightedExamples(prev => prev.filter((_, j) => j !== i)); }}
                            style={{ padding: '4px 10px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '5px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', flexShrink: 0 }}
                          >Add</button>
                          <button onClick={() => setHighlightedExamples(prev => prev.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', color: '#a16207', cursor: 'pointer', fontSize: '16px', flexShrink: 0, lineHeight: 1, padding: '2px 0' }}>✕</button>
                        </div>
                      ))}
                    </div>
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
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>Section name (optional)</label>
                  <input value={standardSectionName} onChange={e => setStandardSectionName(e.target.value)} placeholder="e.g. Introduction, Coursework Covered" style={{ ...inp, marginBottom: '10px' }} />
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>{addedSections.filter(s => s.type === 'standard-comment').length === 0 ? 'Paste your statement here:' : 'Add another:'}</label>
                  <textarea value={standardContent} onChange={e => setStandardContent(e.target.value)} placeholder="e.g. It has been a pleasure teaching [Name] this term..." style={{ ...txa, minHeight: '90px', borderColor: '#10b981', marginBottom: '10px' }} />
                  {standardContent.trim() && (
                    <button onClick={() => { setAddedSections(prev => [...prev, { id: makeId(), type: 'standard-comment' as SectionType, name: standardSectionName.trim(), buttons: [], content: standardContent.trim(), instruction: '', showHeader: false }]); setStandardContent(''); setStandardSectionName(''); }} style={{ backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '6px', padding: '8px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', marginBottom: '16px' }}>+ Add statement</button>
                  )}
                  <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                    <button onClick={() => setHasStandardComment('choose')} style={secondaryBtn}>← Back</button>
                    <button onClick={goNext} style={primaryBtn}>{addedSections.filter(s => s.type === 'standard-comment').length > 0 ? `Continue with ${addedSections.filter(s => s.type === 'standard-comment').length} →` : 'Skip →'}</button>
                  </div>
                </div>
              )}
            </div>
          </div>
          <ReportsPanel />
        </div>
      </div>
    );
  }

  // ─── WIZARD SCREEN ────────────────────────────────────────────────────────

  if (screen === 'wizard') {
    const wAccent = SECTION_COLORS[question?.sectionType] || '#3b82f6';
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <TopBar />
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
                  <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                    <button onClick={handleWizardYes} style={{ ...primaryBtn, flex: 1 }}>Yes</button>
                    <button onClick={handleWizardNo} style={{ ...secondaryBtn, flex: 1 }}>No</button>
                  </div>
                  {currentStep > 0
                    ? <button onClick={() => { setCurrentStep(s => s - 1); resetWizardQuestion(); }} style={{ background: 'none', border: 'none', color: '#9ca3af', fontSize: '13px', cursor: 'pointer', padding: 0 }}>← Previous question</button>
                    : <button onClick={() => setScreen('standard-comment')} style={{ background: 'none', border: 'none', color: '#9ca3af', fontSize: '13px', cursor: 'pointer', padding: 0 }}>← Back</button>}
                </div>
              )}

              {phase === 'name' && (
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>What would you like to call this section?</label>
                  <input type="text" value={sectionName} onChange={e => setSectionName(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleNameConfirmed(); }} placeholder={question.namePlaceholder} autoFocus style={{ ...inp, borderColor: wAccent, marginBottom: '16px' }} />
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button onClick={() => setPhase('ask')} style={secondaryBtn}>← Back</button>
                    <button onClick={handleNameConfirmed} disabled={!sectionName.trim()} style={{ ...primaryBtn, opacity: !sectionName.trim() ? 0.4 : 1 }}>Continue →</button>
                  </div>
                </div>
              )}

              {phase === 'statements' && (
                <div>
                  <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', color: '#166534', marginBottom: '20px', lineHeight: '1.5' }}>💡 Add your own statements below, or use the ready-made buttons from the pool below. Paste existing reports on the right and use AI to find more.</div>
                  {renderStatementEditor(question.sectionType, sectionName)}
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button onClick={() => setPhase('name')} style={secondaryBtn}>← Back</button>
                    <button onClick={handleWizardAddSection} style={primaryBtn}>{editingSectionId ? 'Save changes →' : 'Save section →'}</button>
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
          {reportsPanelOpen && <ReportsPanel />}
        </div>
      </div>
    );
  }

  return null;
};

export default BuildAsYouGo;