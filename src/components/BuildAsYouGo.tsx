import React, { useState, useRef, useEffect, useCallback } from 'react';
import { TemplateSection, SectionType } from '../types';
import { buildUniversalSections, buildDevelopmentSection, SUBJECT_EXTRAS, SUBJECTS, STRENGTHS_ADDABLE_UNIVERSAL, STRENGTHS_ADDABLE_BY_SUBJECT, NEXT_STEPS_ADDABLE_UNIVERSAL, NEXT_STEPS_ADDABLE_BY_SUBJECT, DEVELOPMENT_ADDABLE_UNIVERSAL, DEVELOPMENT_ADDABLE_BY_SUBJECT, AddableButton } from '../data/starterComments';

const SUPABASE_URL = 'https://wozbrojwuzktwrzngllh.supabase.co/functions/v1/generate-template';

interface BuildAsYouGoProps {
  templateName: string;
  classId?: string;
  onComplete: (sections: TemplateSection[]) => void;
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

const QUESTIONS: Question[] = [
  { id: 'qualities', question: 'Do your reports comment on pupil qualities or strengths?', description: 'Comments picked from a set of options — for example effort, attitude, teamwork.', sectionType: 'qualities', namePlaceholder: 'e.g. Character Qualities, Strengths', defaultName: 'Character Qualities', allowMultiple: true, hasButtons: true, positionType: 'qualities', examples: ['[Name] consistently demonstrates excellent effort and a positive attitude towards learning.', '[Name] is a natural leader who supports and encourages classmates.', '[Name] shows great resilience and perseverance when faced with challenges.'] },
  { id: 'rated-comment', question: 'Do your reports rate pupils on their performance?', description: "Comments tied to a rating — Excellent, Good, Satisfactory, Needs Improvement.", sectionType: 'rated-comment', namePlaceholder: 'e.g. Progress, Effort Rating', defaultName: 'Progress', allowMultiple: true, hasButtons: true, isRatedFixed: true, positionType: 'rating', examples: ['[Name] has made excellent progress this term and consistently produces work of the highest standard.', '[Name] needs to focus on consolidating their understanding of the core topics covered this term.'] },
  { id: 'assessment-comment', question: 'Do your reports include assessment results with a score?', description: 'Comments linked to a score or percentage.', sectionType: 'assessment-comment', namePlaceholder: 'e.g. Assessment Result, Test Score', defaultName: 'Assessment', allowMultiple: true, hasButtons: true, isRatedFixed: false, positionType: 'assessment-comment', examples: ['[Name] achieved [Score] in the recent assessment, which reflects their hard work throughout the unit.'] },
  { id: 'personalised-comment', question: 'Do your reports mention specific pupil achievements or activities?', description: 'Comments that include personalised information — for example a sport, instrument, or club.', sectionType: 'personalised-comment', namePlaceholder: 'e.g. Personal Achievement, Activity', defaultName: 'Personal Achievement', allowMultiple: true, hasButtons: true, positionType: 'personalised-comment', examples: ['[Name] has shown particular enthusiasm for [Info 1] this term and has made impressive progress.'] },
  { id: 'next-steps', question: 'Do your reports include targets or next steps for the pupil?', description: 'Suggestions for what the pupil should focus on to improve.', sectionType: 'next-steps', namePlaceholder: 'e.g. Next Steps, Targets, Areas for Development', defaultName: 'Next Steps', allowMultiple: true, hasButtons: true, positionType: 'next-steps', examples: ['[Name] should focus on developing their extended writing skills to reach the next level.'] },
  { id: 'other-comments', question: 'Do your reports contain any other types of comments?', description: 'Any other categories not covered above.', sectionType: 'qualities', namePlaceholder: 'e.g. Behaviour, Homework, Wider Achievement', defaultName: 'Other Comments', allowMultiple: true, hasButtons: true, positionType: 'qualities', examples: ['[Name] consistently demonstrates excellent behaviour and is a pleasure to have in class.', '[Name] completes homework to a high standard and always meets deadlines.'] },
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

function generateTestReport(sections: AddedSection[]): string {
  const parts: string[] = [];
  for (const s of sections) {
    if (s.type === 'new-line') { parts.push('\n\n'); continue; }
    if (s.showHeader && s.name) parts.push(`${s.name.toUpperCase()}\n`);
    if (s.type === 'standard-comment') { if (s.content) parts.push(s.content.replace(/\[Name\]/g, 'Alex')); }
    else if (s.type === 'optional-additional-comment') { parts.push('[Optional comment — teacher types here]'); }
    else { const btn = s.buttons.find(b => b.name && b.statements.length > 0); if (btn) parts.push(btn.statements[0].replace(/\[Name\]/g, 'Alex').replace(/\[Score\]/g, '78%').replace(/\[Info 1\]/g, 'football')); }
  }
  return parts.join(' ').replace(/ {2,}/g, ' ').replace(/\n /g, '\n').trim();
}

function buildSectionsFromSelection(selectedIds: string[], subject: string, standardStatements: string[]): AddedSection[] {
  const universal = buildUniversalSections();
  const result: AddedSection[] = [];
  for (const stmt of standardStatements) {
    if (stmt.trim()) result.push({ id: makeId(), type: 'standard-comment', name: 'Fixed Statement', buttons: [], content: stmt.trim(), instruction: '', showHeader: false });
  }
  const devSection = buildDevelopmentSection();
  const devAdded: AddedSection = { id: makeId(), type: devSection.type as SectionType, name: devSection.name!, buttons: Object.entries(devSection.data.focusAreas || {}).map(([k, v]) => ({ name: k, statements: v as string[] })), content: '', instruction: '', showHeader: false };
  const universalMap: Record<string, AddedSection> = {};
  for (const s of universal) {
    if (!s.name) continue;
    let buttons: StatementButton[] = [];
    if (s.type === 'rated-comment') buttons = [{ name: 'Excellent', statements: s.data.comments?.excellent || [] }, { name: 'Good', statements: s.data.comments?.good || [] }, { name: 'Satisfactory', statements: s.data.comments?.satisfactory || [] }, { name: 'Needs Improvement', statements: s.data.comments?.needsImprovement || [] }];
    else if (s.type === 'qualities') buttons = Object.entries(s.data.comments || {}).map(([k, v]) => ({ name: k, statements: v as string[] }));
    else if (s.type === 'next-steps') buttons = Object.entries(s.data.focusAreas || {}).map(([k, v]) => ({ name: k, statements: v as string[] }));
    universalMap[s.name] = { id: makeId(), type: s.type as SectionType, name: s.name!, buttons, content: '', instruction: '', showHeader: false };
  }
  const extrasMap: Record<string, AddedSection> = {};
  for (const extra of (SUBJECT_EXTRAS[subject] || [])) {
    let buttons: StatementButton[] = [];
    if (extra.section.type === 'rated-comment') buttons = [{ name: 'Excellent', statements: extra.section.data.comments?.excellent || [] }, { name: 'Good', statements: extra.section.data.comments?.good || [] }, { name: 'Satisfactory', statements: extra.section.data.comments?.satisfactory || [] }, { name: 'Needs Improvement', statements: extra.section.data.comments?.needsImprovement || [] }];
    else if (extra.section.type === 'qualities') buttons = Object.entries(extra.section.data.comments || {}).map(([k, v]) => ({ name: k, statements: v as string[] }));
    else if (extra.section.type === 'next-steps') buttons = Object.entries(extra.section.data.focusAreas || {}).map(([k, v]) => ({ name: k, statements: v as string[] }));
    extrasMap[extra.id] = { id: makeId(), type: extra.section.type as SectionType, name: extra.label, buttons, content: '', instruction: '', showHeader: false };
  }
  for (const id of selectedIds) {
    if (id === 'areas-for-development') result.push(devAdded);
    else if (universalMap[id]) result.push(universalMap[id]);
    else if (extrasMap[id]) result.push(extrasMap[id]);
  }
  return result;
}

type Screen = 'subject' | 'ready-made-choice' | 'standard-comment' | 'section-picker' | 'section-editor' | 'wizard' | 'review';

const BuildAsYouGo: React.FC<BuildAsYouGoProps> = ({ templateName, classId, onComplete, onCancel }) => {
  const reportsPanelScrollRef = useRef<number>(0);
  const reportsPanelRef = useRef<HTMLTextAreaElement>(null);
  const handleReportsPanelScroll = useCallback((e: React.UIEvent<HTMLTextAreaElement>) => { reportsPanelScrollRef.current = e.currentTarget.scrollTop; }, []);
  useEffect(() => { if (reportsPanelRef.current) reportsPanelRef.current.scrollTop = reportsPanelScrollRef.current; });

  const [screen, setScreen] = useState<Screen>('subject');
  const [subject, setSubject] = useState('');
  const [useReadyMade, setUseReadyMade] = useState<boolean | null>(null);
  const [standardStatements, setStandardStatements] = useState<string[]>([]);
  const [hasStandardComment, setHasStandardComment] = useState<boolean | string | null>(null);
  const [standardContent, setStandardContent] = useState('');
  const [aiCandidates, setAiCandidates] = useState<string[]>([]);
  const [selectedCandidates, setSelectedCandidates] = useState<Set<string>>(new Set());
  const [selectedSectionIds, setSelectedSectionIds] = useState<string[]>([]);
  const [addedSections, setAddedSections] = useState<AddedSection[]>([]);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [reportsPanelOpen, setReportsPanelOpen] = useState(true);
  const [pastedReports, setPastedReports] = useState('');
  const hasReports = pastedReports.trim().length > 50;
  const [buttons, setButtons] = useState<StatementButton[]>([]);
  const [activeButtonIndex, setActiveButtonIndex] = useState(0);
  const [newStatement, setNewStatement] = useState('');
  const [newButtonName, setNewButtonName] = useState('');
  const [addingNewButton, setAddingNewButton] = useState(false);
  const [namingButtonIndex, setNamingButtonIndex] = useState<number | null>(null);
  const [namingButtonValue, setNamingButtonValue] = useState('');
  const [sectionName, setSectionName] = useState('');
  const [editingSectionName, setEditingSectionName] = useState(false);
  const [sectionInstruction, setSectionInstruction] = useState('');
  const [showExamples, setShowExamples] = useState(false);
  const [editingStatementKey, setEditingStatementKey] = useState<{ buttonIdx: number; stmtIdx: number } | null>(null);
  const [editingStatementValue, setEditingStatementValue] = useState('');
  const [movingStatementKey, setMovingStatementKey] = useState<{ buttonIdx: number; stmtIdx: number } | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [phase, setPhase] = useState<'ask' | 'name' | 'instruction' | 'statements' | 'added'>('ask');
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [reviewViewMode, setReviewViewMode] = useState<'reports' | 'test-report'>('reports');
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const dragSourceIndex = useRef<number | null>(null);
  const sectionNameInputRef = useRef<HTMLInputElement>(null);
  const statementInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { if (addedSections.length > 0) saveDraft(templateName, addedSections); }, [addedSections, templateName]);
  useEffect(() => {
    if (screen === 'section-picker' && selectedSectionIds.length === 0 && subject) {
      const universal = buildUniversalSections().filter(s => s.name && s.type !== 'new-line' && s.type !== 'optional-additional-comment');
      setSelectedSectionIds([...universal.map(s => s.name!), ...(SUBJECT_EXTRAS[subject] || []).map(e => e.id)]);
    }
  }, [screen, subject]);
  useEffect(() => { if (editingSectionName && sectionNameInputRef.current) sectionNameInputRef.current.focus(); }, [editingSectionName]);

  const question = QUESTIONS[currentStep];
  const isLastQuestion = currentStep === QUESTIONS.length - 1;
  const currentSection = addedSections[currentSectionIndex];
  const accentColor = screen === 'wizard' ? (SECTION_COLORS[question?.sectionType] || '#3b82f6') : (currentSection ? (SECTION_COLORS[currentSection.type] || '#3b82f6') : '#3b82f6');

  const primaryBtn: React.CSSProperties = { backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', padding: '11px 24px', fontSize: '15px', fontWeight: '600', cursor: 'pointer' };
  const secondaryBtn: React.CSSProperties = { backgroundColor: '#f3f4f6', color: '#374151', border: 'none', borderRadius: '8px', padding: '11px 24px', fontSize: '15px', fontWeight: '500', cursor: 'pointer' };
  const smallBtn = (color: string): React.CSSProperties => ({ backgroundColor: color, color: 'white', border: 'none', borderRadius: '6px', padding: '6px 14px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' });
  const inp: React.CSSProperties = { width: '100%', padding: '10px 14px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', textAlign: 'left' };
  const txa: React.CSSProperties = { ...inp, resize: 'vertical' };

  const loadSectionIntoEditor = (section: AddedSection) => {
    setButtons(section.buttons.length > 0 ? section.buttons.map(b => ({ ...b, statements: [...b.statements] })) : []);
    setSectionName(section.name); setActiveButtonIndex(0); setNewStatement(''); setNewButtonName('');
    setAddingNewButton(false); setNamingButtonIndex(null); setNamingButtonValue('');
    setAiError(null); setEditingStatementKey(null); setMovingStatementKey(null); setEditingSectionName(false);
  };

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

  const handleAiFindInReports = async (sName?: string, sType?: string) => {
    if (!hasReports) return;
    setAiLoading(true); setAiError(null);
    const activeName = sName || (screen === 'wizard' ? sectionName : currentSection?.name) || '';
    const activeType = sType || (screen === 'wizard' ? question?.sectionType : currentSection?.type) || 'qualities';
    try {
      const exampleLines: string[] = [];
      buttons.forEach(b => { if (b.name && b.statements.length > 0) exampleLines.push(...b.statements.slice(0, 2)); });
      if (!exampleLines.length) { setAiError('No statements to use as examples yet.'); setAiLoading(false); return; }
      const positionType = activeType === 'next-steps' ? 'next-steps' : activeType === 'rated-comment' ? 'rating' : activeType === 'assessment-comment' ? 'assessment-comment' : activeName === 'Areas for Development' ? 'next-steps' : 'qualities';
      const response = await fetch(SUPABASE_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mode: 'extract-only', subject: subject || activeName, yearGroup: '', reportText: pastedReports, pronounSet: 'they/their', openerType: 'name', sectionName: activeName, positionType, selectedText: exampleLines.join('\n'), scaleType: activeType === 'rated-comment' ? 'four-level' : 'own' }) });
      if (!response.ok) throw new Error('failed');
      const data = await response.json();
      const headings: { name: string; comments: string[] }[] = data.headings || [];
      if (headings.length === 0) { setAiError('No matching sentences found in your reports for this section.'); setAiLoading(false); return; }
      if (activeType === 'rated-comment') {
        setButtons(prev => {
          const u = [...prev];
          headings.forEach(h => {
            const n = h.name.toLowerCase(); let ti = 1;
            if (n.includes('excellent') || n.includes('outstanding') || n.includes('strong')) ti = 0;
            else if (n.includes('good') || n.includes('solid') || n.includes('pleasing')) ti = 1;
            else if (n.includes('satisfactory') || n.includes('adequate') || n.includes('reasonable')) ti = 2;
            else if (n.includes('improvement') || n.includes('needs') || n.includes('limited') || n.includes('poor')) ti = 3;
            if (ti < u.length) { const newStmts = h.comments.filter(c => !u[ti].statements.includes(c)); u[ti] = { ...u[ti], statements: [...u[ti].statements, ...newStmts].slice(0, MAX_STATEMENTS) }; }
          });
          return u;
        });
      } else {
        setButtons(prev => {
          const merged = [...prev];
          headings.forEach(h => {
            const ei = merged.findIndex(b => b.name.toLowerCase() === h.name.toLowerCase() || h.name.toLowerCase().includes(b.name.toLowerCase()) || b.name.toLowerCase().includes(h.name.toLowerCase()));
            if (ei >= 0) { const newStmts = h.comments.filter(c => !merged[ei].statements.includes(c)); merged[ei] = { ...merged[ei], statements: [...merged[ei].statements, ...newStmts].slice(0, MAX_STATEMENTS) }; }
            else if (h.name && h.comments.length > 0) merged.push({ name: h.name, statements: h.comments });
          });
          return merged.filter(b => b.name);
        });
      }
    } catch { setAiError('AI extraction failed. Please try again.'); }
    finally { setAiLoading(false); }
  };

  const handleSectionNext = () => {
    const updated = [...addedSections]; updated[currentSectionIndex] = { ...updated[currentSectionIndex], buttons, name: sectionName }; setAddedSections(updated);
    if (currentSectionIndex < addedSections.length - 1) { const next = updated[currentSectionIndex + 1]; setCurrentSectionIndex(i => i + 1); loadSectionIntoEditor(next); }
    else setScreen('review');
  };
  const handleSectionBack = () => {
    const updated = [...addedSections]; updated[currentSectionIndex] = { ...updated[currentSectionIndex], buttons, name: sectionName }; setAddedSections(updated);
    if (currentSectionIndex > 0) { const prev = updated[currentSectionIndex - 1]; setCurrentSectionIndex(i => i - 1); loadSectionIntoEditor(prev); }
    else setScreen('section-picker');
  };

  const resetWizardQuestion = () => {
    setPhase('ask'); setSectionName(''); setSectionInstruction(''); setButtons([]); setActiveButtonIndex(0);
    setNewStatement(''); setNewButtonName(''); setAddingNewButton(false); setNamingButtonIndex(null); setNamingButtonValue('');
    setStandardContent(''); setShowExamples(false); setAiError(null); setEditingStatementKey(null); setMovingStatementKey(null);
  };
  const advanceQuestion = () => { if (isLastQuestion) setScreen('review'); else { setCurrentStep(s => s + 1); resetWizardQuestion(); } };
  const handleWizardYes = () => { setSectionName(question.defaultName); setPhase('name'); };
  const handleWizardNo = () => advanceQuestion();
  const handleNameConfirmed = () => {
    if (!sectionName.trim()) return;
    if (question.sectionType === 'assessment-comment') { setSectionInstruction(''); setPhase('instruction'); return; }
    if (question.hasButtons) { if (question.isRatedFixed) setButtons(DEFAULT_RATED_BUTTONS.map(n => ({ name: n, statements: [] }))); else { setButtons([{ name: '', statements: [] }]); setNamingButtonIndex(0); setNamingButtonValue(''); } setActiveButtonIndex(0); }
    setPhase('statements');
  };
  const handleInstructionConfirmed = () => { setButtons([{ name: '', statements: [] }]); setNamingButtonIndex(0); setNamingButtonValue(''); setActiveButtonIndex(0); setPhase('statements'); };
  const handleWizardAddSection = () => {
    const name = sectionName.trim() || question.defaultName;
    const newSection: AddedSection = { id: editingSectionId || makeId(), type: question.sectionType, name, buttons: question.hasButtons ? buttons : [], content: standardContent, instruction: sectionInstruction, showHeader: false };
    if (editingSectionId) { setAddedSections(prev => prev.map(s => s.id === editingSectionId ? { ...newSection, showHeader: s.showHeader } : s)); setEditingSectionId(null); setScreen('review'); }
    else { setAddedSections(prev => [...prev, newSection]); setPhase('added'); }
  };
  const handleAddAnother = () => {
    setSectionName(question.defaultName); setSectionInstruction(''); setPhase('name'); setButtons([]); setActiveButtonIndex(0);
    setNewStatement(''); setNewButtonName(''); setAddingNewButton(false); setNamingButtonIndex(null); setNamingButtonValue('');
    setStandardContent(''); setShowExamples(false); setAiError(null); setEditingStatementKey(null); setMovingStatementKey(null);
  };

  const handleDragStart = (i: number) => { dragSourceIndex.current = i; };
  const handleDragOver = (e: React.DragEvent, i: number) => { e.preventDefault(); setDragOverIndex(i); };
  const handleDrop = (e: React.DragEvent, ti: number) => { e.preventDefault(); const src = dragSourceIndex.current; if (src === null || src === ti) { setDragOverIndex(null); return; } setAddedSections(prev => { const u = [...prev]; const [m] = u.splice(src, 1); u.splice(ti, 0, m); return u; }); dragSourceIndex.current = null; setDragOverIndex(null); };
  const handleDragEnd = () => { dragSourceIndex.current = null; setDragOverIndex(null); };
  const handleRemoveSection = (id: string) => setAddedSections(prev => prev.filter(s => s.id !== id));
  const handleToggleHeader = (id: string) => setAddedSections(prev => prev.map(s => s.id === id ? { ...s, showHeader: !s.showHeader } : s));
  const handleAddSpecialSection = (type: 'new-line' | 'optional-additional-comment', afterIndex: number) => {
    const ns: AddedSection = { id: makeId(), type: type as SectionType, name: type === 'new-line' ? '' : 'Additional Comments', buttons: [], content: '', instruction: '', showHeader: false };
    setAddedSections(prev => { const u = [...prev]; u.splice(afterIndex + 1, 0, ns); return u; });
  };

  const handleCancel = () => { if (addedSections.length > 0 || screen === 'section-editor' || screen === 'wizard') { if (!window.confirm('Are you sure? Your progress will be lost.')) return; } onCancel(); };
  const handleComplete = () => {
    if (addedSections.filter(s => s.type !== 'new-line' && s.type !== 'optional-additional-comment').length === 0) { alert('Please add at least one section.'); return; }
    const sections: TemplateSection[] = addedSections.map(s => {
      let data: any = {};
      if (s.type === 'standard-comment') data = { content: s.content || '' };
      else if (s.type === 'qualities') { const c: Record<string, string[]> = {}; s.buttons.forEach(b => { if (b.name) c[b.name] = b.statements; }); data = { comments: c }; }
      else if (s.type === 'rated-comment') { const c: Record<string, string[]> = {}; s.buttons.forEach((b, i) => { const key = RATED_KEYS[i] || b.name.toLowerCase().replace(/\s+/g, ''); c[key] = b.statements; }); data = { comments: c }; }
      else if (s.type === 'assessment-comment') { const c: Record<string, string[]> = {}; s.buttons.forEach(b => { if (b.name) c[b.name] = b.statements; }); data = { comments: c, instruction: s.instruction || '' }; }
      else if (s.type === 'personalised-comment') { const c: Record<string, string[]> = {}; s.buttons.forEach(b => { if (b.name) c[b.name] = b.statements; }); data = { categories: c, instruction: '' }; }
      else if (s.type === 'next-steps') { const f: Record<string, string[]> = {}; s.buttons.forEach(b => { if (b.name) f[b.name] = b.statements; }); data = { focusAreas: f }; }
      return { id: s.id, type: s.type, name: s.name, showHeader: s.showHeader || false, data };
    });
    clearDraft(); onComplete(sections);
  };

  const TopBar = ({ title }: { title?: string }) => (
    <div style={{ backgroundColor: 'white', borderBottom: '1px solid #e5e7eb', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
      <div style={{ fontSize: '14px', fontWeight: '600', color: '#374151' }}>{title || templateName}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {(screen === 'section-editor' || screen === 'wizard') && (
          <>
            {screen === 'section-editor' && <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ width: '120px', height: '4px', backgroundColor: '#e5e7eb', borderRadius: '2px' }}><div style={{ width: `${((currentSectionIndex + 1) / addedSections.length) * 100}%`, height: '100%', backgroundColor: '#3b82f6', borderRadius: '2px', transition: 'width 0.3s ease' }} /></div><span style={{ fontSize: '12px', color: '#6b7280' }}>{currentSectionIndex + 1}/{addedSections.length}</span></div>}
            {screen === 'wizard' && <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ width: '120px', height: '4px', backgroundColor: '#e5e7eb', borderRadius: '2px' }}><div style={{ width: `${((currentStep + 1) / QUESTIONS.length) * 100}%`, height: '100%', backgroundColor: '#3b82f6', borderRadius: '2px', transition: 'width 0.3s ease' }} /></div><span style={{ fontSize: '12px', color: '#6b7280' }}>{currentStep + 1}/{QUESTIONS.length}</span></div>}
            <button onClick={() => setReportsPanelOpen(o => !o)} style={{ backgroundColor: '#f3f4f6', color: '#6b7280', border: '1px solid #d1d5db', borderRadius: '6px', padding: '6px 14px', fontSize: '13px', fontWeight: '500', cursor: 'pointer' }}>{reportsPanelOpen ? 'Hide reports' : '📄 Show reports'}</button>
          </>
        )}
        <button onClick={handleCancel} style={{ background: 'none', border: 'none', color: '#9ca3af', fontSize: '13px', cursor: 'pointer' }}>← Back</button>
      </div>
    </div>
  );

  const ReportsPanel = () => (
    <div style={{ flex: '0 0 44%', borderLeft: '1px solid #e5e7eb', backgroundColor: 'white', display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #f3f4f6', flexShrink: 0 }}>
        <div style={{ fontSize: '13px', fontWeight: '600', color: '#374151' }}>Your existing reports{hasReports && <span style={{ color: '#10b981', fontWeight: '500', marginLeft: '8px' }}>✓ Ready for AI</span>}</div>
        <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>Paste here — AI uses these when you click "Find in my reports"</div>
      </div>
      <div style={{ flex: 1, padding: '12px 16px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <textarea ref={reportsPanelRef} value={pastedReports} onChange={e => setPastedReports(e.target.value)} onScroll={handleReportsPanelScroll} placeholder="Paste your existing reports here. Separate each with a blank line or ---." style={{ flex: 1, width: '100%', padding: '10px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '12px', lineHeight: '1.7', outline: 'none', resize: 'none', boxSizing: 'border-box', fontFamily: 'inherit', color: '#374151' }} />
      </div>
    </div>
  );

  // Shared statement editor used by both section-editor and wizard
  const renderStatementEditor = (sType: string, sName: string) => {
    const isRated = sType === 'rated-comment';
    const isStrengths = sName === 'Strengths'; const isNextSteps = sName === 'Next Steps'; const isDevelopment = sName === 'Areas for Development';
    const universalPool: AddableButton[] = isStrengths ? STRENGTHS_ADDABLE_UNIVERSAL : isNextSteps ? NEXT_STEPS_ADDABLE_UNIVERSAL : isDevelopment ? DEVELOPMENT_ADDABLE_UNIVERSAL : [];
    const subjectPool: AddableButton[] = isStrengths ? (STRENGTHS_ADDABLE_BY_SUBJECT[subject] || []) : isNextSteps ? (NEXT_STEPS_ADDABLE_BY_SUBJECT[subject] || []) : isDevelopment ? (DEVELOPMENT_ADDABLE_BY_SUBJECT[subject] || []) : [];
    const activeNames = buttons.map(b => b.name);
    const availableUniversal = universalPool.filter(b => !activeNames.includes(b.name));
    const availableSubject = subjectPool.filter(b => !activeNames.includes(b.name));
    return (
      <div>
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
        {(isStrengths || isNextSteps || isDevelopment) && (availableUniversal.length > 0 || availableSubject.length > 0) && (
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
                <textarea ref={statementInputRef} value={newStatement} onChange={e => setNewStatement(e.target.value)} placeholder="Type or paste a statement... Use [Name] for pupil name." style={{ ...txa, minHeight: '70px', borderColor: accentColor, marginBottom: '8px' }} />
                <button onClick={handleAddStatement} disabled={!newStatement.trim()} style={{ ...smallBtn(accentColor), opacity: !newStatement.trim() ? 0.4 : 1, marginBottom: '20px' }}>+ Add statement</button>
              </>
            )}
          </div>
        )}
        {hasReports && !aiLoading && sType !== 'standard-comment' && (
          <div style={{ marginBottom: '16px' }}>
            <div style={{ height: '1px', backgroundColor: '#f3f4f6', margin: '4px 0 14px' }} />
            <button onClick={() => handleAiFindInReports(sName, sType)} style={{ width: '100%', padding: '12px 16px', backgroundColor: '#faf5ff', border: '2px solid #8b5cf6', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }} onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#f3e8ff'; }} onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#faf5ff'; }}>
              <span style={{ fontSize: '20px' }}>🔍</span>
              <div style={{ textAlign: 'left' }}><div style={{ fontSize: '14px', fontWeight: '700', color: '#7c3aed' }}>Find in my reports</div><div style={{ fontSize: '12px', color: '#9ca3af' }}>Uses statements as examples to find matching sentences in your reports</div></div>
            </button>
          </div>
        )}
        {aiLoading && <div style={{ marginBottom: '16px', padding: '14px 16px', backgroundColor: '#faf5ff', border: '2px solid #8b5cf6', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}><div style={{ display: 'flex', gap: '4px' }}>{[0,1,2].map(i => <div key={i} style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#8b5cf6', animation: 'pulse 1.2s ease-in-out infinite', animationDelay: `${i * 0.2}s` }} />)}</div><div style={{ fontSize: '13px', color: '#7c3aed' }}>Searching your reports...</div><style>{`@keyframes pulse{0%,100%{opacity:.3;transform:scale(.8)}50%{opacity:1;transform:scale(1.2)}}`}</style></div>}
        {aiError && <div style={{ marginBottom: '16px', padding: '10px 14px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', fontSize: '13px', color: '#b91c1c' }}>⚠️ {aiError}</div>}
        {!hasReports && sType !== 'standard-comment' && <div style={{ marginBottom: '16px', padding: '12px 16px', backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', fontSize: '13px', color: '#78350f', lineHeight: '1.5' }}>💡 <strong>Have existing reports?</strong> Paste them in the right panel and click "Find in my reports" to auto-populate statements.</div>}
      </div>
    );
  };

  // ─── SUBJECT PICKER ───────────────────────────────────────────────────────
  if (screen === 'subject') return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', display: 'flex', flexDirection: 'column' }}>
      <TopBar title="Build as You Go" />
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 24px' }}>
        <div style={{ maxWidth: '560px', width: '100%', backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.07)', padding: '40px 44px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#111827', marginBottom: '8px' }}>What subject are you teaching?</h2>
          <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '28px', lineHeight: '1.6' }}>This unlocks subject-specific sections and buttons alongside the universal ones.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
            {SUBJECTS.map(s => (
              <button key={s} onClick={() => { setSubject(s); setScreen('ready-made-choice'); }} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 16px', backgroundColor: 'white', border: '2px solid #e5e7eb', borderRadius: '10px', cursor: 'pointer', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#111827' }} onMouseEnter={e => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.backgroundColor = '#eff6ff'; }} onMouseLeave={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.backgroundColor = 'white'; }}>
                <span style={{ fontSize: '22px' }}>{SUBJECT_ICONS[s]}</span><span>{s}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // ─── READY-MADE CHOICE ────────────────────────────────────────────────────
  if (screen === 'ready-made-choice') return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', display: 'flex', flexDirection: 'column' }}>
      <TopBar title="Build as You Go" />
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 24px' }}>
        <div style={{ maxWidth: '560px', width: '100%', backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.07)', padding: '40px 44px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#111827', marginBottom: '8px' }}>Would you like to use ready-made sections?</h2>
          <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px', lineHeight: '1.6' }}>Ready-made sections come pre-populated with generic statements covering Progress, Effort, Behaviour, Strengths, Next Steps and more. You can edit every section, button and statement to match your own voice.</p>
          <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', color: '#166534', marginBottom: '28px', lineHeight: '1.5' }}>✓ Everything is fully editable — the ready-made content is a starting point, not a fixed template</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
            <button onClick={() => { setUseReadyMade(true); setScreen('standard-comment'); }} style={{ textAlign: 'left', padding: '18px 20px', backgroundColor: '#eff6ff', border: '2px solid #3b82f6', borderRadius: '10px', cursor: 'pointer' }} onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#dbeafe'; }} onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#eff6ff'; }}>
              <div style={{ fontSize: '15px', fontWeight: '700', color: '#1e40af', marginBottom: '4px' }}>🚀 Yes — use ready-made sections</div>
              <div style={{ fontSize: '13px', color: '#3b82f6' }}>Pick which sections to include, then edit each one. Fastest way to get started.</div>
            </button>
            <button onClick={() => { setUseReadyMade(false); setCurrentStep(0); resetWizardQuestion(); setScreen('standard-comment'); }} style={{ textAlign: 'left', padding: '18px 20px', backgroundColor: 'white', border: '2px solid #e5e7eb', borderRadius: '10px', cursor: 'pointer' }} onMouseEnter={e => { e.currentTarget.style.borderColor = '#6b7280'; e.currentTarget.style.backgroundColor = '#f9fafb'; }} onMouseLeave={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.backgroundColor = 'white'; }}>
              <div style={{ fontSize: '15px', fontWeight: '700', color: '#374151', marginBottom: '4px' }}>🧱 No — build from scratch</div>
              <div style={{ fontSize: '13px', color: '#6b7280' }}>Answer questions about your reports and build each section yourself with complete freedom.</div>
            </button>
          </div>
          <button onClick={() => setScreen('subject')} style={{ background: 'none', border: 'none', color: '#9ca3af', fontSize: '13px', cursor: 'pointer', padding: 0 }}>← Change subject</button>
        </div>
      </div>
    </div>
  );

  // ─── STANDARD COMMENT ─────────────────────────────────────────────────────
  if (screen === 'standard-comment') {
    const addStandardStatement = () => { if (!standardContent.trim()) return; setStandardStatements(prev => [...prev, standardContent.trim()]); setStandardContent(''); };
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
      const chosen = aiCandidates.filter(c => selectedCandidates.has(c));
      setStandardStatements(prev => { const ex = new Set(prev); return [...prev, ...chosen.filter(c => !ex.has(c))]; });
      setAiCandidates([]); setSelectedCandidates(new Set()); setHasStandardComment('manual');
    };
    const goNext = () => { if (useReadyMade) setScreen('section-picker'); else { setCurrentStep(0); resetWizardQuestion(); setScreen('wizard'); } };

    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <TopBar title="Build as You Go" />
        <div style={{ flex: 1, display: 'flex', width: '100%', overflow: 'hidden', minHeight: 0 }}>
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '32px 24px' }}>
            <div style={{ maxWidth: '560px', width: '100%', backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.07)', padding: '40px 44px' }}>
              <div style={{ display: 'inline-block', backgroundColor: '#d1fae520', color: '#10b981', border: '1px solid #10b98140', borderRadius: '20px', padding: '4px 12px', fontSize: '12px', fontWeight: '600', marginBottom: '16px' }}>Fixed Statement</div>
              <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#111827', marginBottom: '10px' }}>Do your reports contain fixed statements?</h2>
              <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '24px', lineHeight: '1.6' }}>Fixed statements appear in most or all reports unchanged — for example an introduction sentence or closing remark. These are excluded from the template so you don't have to keep adding them when writing reports.</p>

              {hasStandardComment === null && (
                <div>
                  <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                    <button onClick={() => setHasStandardComment('choose')} style={{ ...primaryBtn, flex: 1 }}>Yes</button>
                    <button onClick={goNext} style={{ ...secondaryBtn, flex: 1 }}>No</button>
                  </div>
                  <button onClick={() => setScreen('ready-made-choice')} style={{ background: 'none', border: 'none', color: '#9ca3af', fontSize: '13px', cursor: 'pointer', padding: 0 }}>← Back</button>
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
                  {standardStatements.length > 0 && (
                    <div style={{ marginBottom: '16px' }}>
                      <div style={{ fontSize: '12px', fontWeight: '700', color: '#6b7280', letterSpacing: '0.04em', marginBottom: '8px' }}>ADDED ({standardStatements.length})</div>
                      {standardStatements.map((stmt, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '6px', padding: '10px 12px', marginBottom: '6px' }}>
                          <span style={{ flex: 1, fontSize: '13px', color: '#166534', lineHeight: '1.5' }}>{stmt}</span>
                          <button onClick={() => setStandardStatements(prev => prev.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: '14px', flexShrink: 0, padding: '0 2px' }}>✕</button>
                        </div>
                      ))}
                    </div>
                  )}
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>{standardStatements.length === 0 ? 'Paste your statement here:' : 'Add another:'}</label>
                  <textarea value={standardContent} onChange={e => setStandardContent(e.target.value)} placeholder="e.g. It has been a pleasure teaching [Name] this term..." style={{ ...txa, minHeight: '90px', borderColor: '#10b981', marginBottom: '10px' }} />
                  {standardContent.trim() && <button onClick={addStandardStatement} style={{ backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '6px', padding: '8px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', marginBottom: '16px' }}>+ Add statement</button>}
                  <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                    <button onClick={() => setHasStandardComment('choose')} style={secondaryBtn}>← Back</button>
                    <button onClick={goNext} style={primaryBtn}>{standardStatements.length > 0 ? `Continue with ${standardStatements.length} →` : 'Skip →'}</button>
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

  // ─── SECTION PICKER ───────────────────────────────────────────────────────
  if (screen === 'section-picker') {
    const universal = buildUniversalSections().filter(s => s.name && s.type !== 'new-line' && s.type !== 'optional-additional-comment');
    const subjectExtras = SUBJECT_EXTRAS[subject] || [];
    const toggleSection = (id: string) => setSelectedSectionIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    const handleConfirmSections = () => {
      if (selectedSectionIds.length === 0) { alert('Please select at least one section.'); return; }
      const sections = buildSectionsFromSelection(selectedSectionIds, subject, standardStatements);
      setAddedSections(sections); setCurrentSectionIndex(0); loadSectionIntoEditor(sections[0]); setScreen('section-editor');
    };
    const typeDescs: Record<string, string> = { 'rated-comment': 'Excellent / Good / Satisfactory / Needs Improvement', 'qualities': 'Teacher picks from named comment buttons', 'next-steps': 'Target / focus area buttons' };
    const SCard = ({ id, label, description, type, checked }: { id: string; label: string; description: string; type: SectionType; checked: boolean }) => (
      <button onClick={() => toggleSection(id)} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '14px 16px', backgroundColor: checked ? (SECTION_COLORS[type] + '08') : 'white', border: `2px solid ${checked ? SECTION_COLORS[type] : '#e5e7eb'}`, borderRadius: '10px', cursor: 'pointer', textAlign: 'left', width: '100%' }}>
        <div style={{ width: '20px', height: '20px', borderRadius: '4px', backgroundColor: checked ? SECTION_COLORS[type] : 'white', border: `2px solid ${checked ? SECTION_COLORS[type] : '#d1d5db'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '1px', fontSize: '12px', color: 'white', fontWeight: '700' }}>{checked ? '✓' : ''}</div>
        <div style={{ flex: 1 }}><div style={{ fontSize: '14px', fontWeight: '600', color: '#111827', marginBottom: '2px' }}>{label}</div><div style={{ fontSize: '12px', color: '#6b7280' }}>{description}</div></div>
        <div style={{ fontSize: '11px', color: SECTION_COLORS[type], backgroundColor: SECTION_COLORS[type] + '15', padding: '2px 8px', borderRadius: '10px', fontWeight: '600', flexShrink: 0, alignSelf: 'flex-start' }}>{SECTION_LABELS[type]}</div>
      </button>
    );
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', display: 'flex', flexDirection: 'column' }}>
        <TopBar title="Build as You Go" />
        <div style={{ flex: 1, overflowY: 'auto', padding: '32px 24px' }}>
          <div style={{ maxWidth: '640px', margin: '0 auto' }}>
            <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#111827', marginBottom: '8px' }}>Choose your sections</h2>
            <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px', lineHeight: '1.6' }}>All sections come pre-populated with generic statements ready to edit. Use AI to add sentences from your own reports.</p>
            <div style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', color: '#1e40af', marginBottom: '28px' }}>Untick any sections you don't need. You can add more after the template is built.</div>
            <div style={{ fontSize: '12px', fontWeight: '700', color: '#6b7280', letterSpacing: '0.05em', marginBottom: '10px' }}>UNIVERSAL — WORKS FOR ANY SUBJECT</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>{universal.map(s => <SCard key={s.name!} id={s.name!} label={s.name!} description={typeDescs[s.type] || SECTION_LABELS[s.type]} type={s.type as SectionType} checked={selectedSectionIds.includes(s.name!)} />)}</div>
            <div style={{ fontSize: '12px', fontWeight: '700', color: '#6b7280', letterSpacing: '0.05em', marginBottom: '10px' }}>OPTIONAL</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}><SCard id="areas-for-development" label="Areas for Development" description="Focus areas and targets for pupils who need to improve" type={'next-steps' as SectionType} checked={selectedSectionIds.includes('areas-for-development')} /></div>
            {subjectExtras.length > 0 && (<><div style={{ fontSize: '12px', fontWeight: '700', color: '#6b7280', letterSpacing: '0.05em', marginBottom: '10px' }}>{subject.toUpperCase()} — SUBJECT-SPECIFIC</div><div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '28px' }}>{subjectExtras.map(e => <SCard key={e.id} id={e.id} label={e.label} description={typeDescs[e.section.type] || SECTION_LABELS[e.section.type]} type={e.section.type as SectionType} checked={selectedSectionIds.includes(e.id)} />)}</div></>)}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button onClick={() => setScreen('standard-comment')} style={secondaryBtn}>← Back</button>
              <button onClick={handleConfirmSections} style={primaryBtn}>Review {selectedSectionIds.length} section{selectedSectionIds.length !== 1 ? 's' : ''} →</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── SECTION EDITOR (pre-built path) ──────────────────────────────────────
  if (screen === 'section-editor' && currentSection) {
    const totalStmts = buttons.reduce((n, b) => n + b.statements.length, 0);
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <TopBar />
        <div style={{ flex: 1, display: 'flex', width: '100%', overflow: 'hidden', minHeight: 0 }}>
          <div style={{ flex: 1, overflowY: 'auto', padding: '32px 40px', minWidth: 0 }}>
            <div style={{ maxWidth: '560px', width: '100%', margin: '0 auto' }}>
              <div style={{ display: 'inline-block', backgroundColor: accentColor + '20', color: accentColor, border: `1px solid ${accentColor}40`, borderRadius: '20px', padding: '4px 12px', fontSize: '12px', fontWeight: '600', marginBottom: '16px' }}>{SECTION_LABELS[currentSection.type]}</div>
              {/* Editable section heading */}
              <div style={{ marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                {editingSectionName ? (
                  <input ref={sectionNameInputRef} type="text" value={sectionName} onChange={e => setSectionName(e.target.value)} onBlur={() => setEditingSectionName(false)} onKeyDown={e => { if (e.key === 'Enter') setEditingSectionName(false); }} style={{ fontSize: '22px', fontWeight: '700', color: '#111827', border: 'none', borderBottom: '2px solid #3b82f6', outline: 'none', background: 'transparent', width: '100%', padding: '0 0 2px 0', fontFamily: 'inherit' }} />
                ) : (
                  <><h2 style={{ fontSize: '22px', fontWeight: '700', color: '#111827', margin: 0 }}>{sectionName}</h2><button onClick={() => setEditingSectionName(true)} title="Edit section name" style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: '14px', padding: '2px 4px', flexShrink: 0 }}>✏️</button></>
                )}
              </div>
              <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '16px', lineHeight: '1.6' }}>Pre-populated statements are loaded below. Edit, delete or add your own — or use AI to find matching sentences from your existing reports.</p>
              {currentSection.type !== 'standard-comment' && (
                <div style={{ backgroundColor: totalStmts > 0 ? '#f0fdf4' : '#fffbeb', border: `1px solid ${totalStmts > 0 ? '#bbf7d0' : '#fde68a'}`, borderRadius: '8px', padding: '10px 14px', fontSize: '13px', color: totalStmts > 0 ? '#166534' : '#78350f', marginBottom: '20px' }}>
                  {totalStmts > 0 ? `✓ ${totalStmts} statement${totalStmts !== 1 ? 's' : ''} ready — edit, remove or add more below` : '⚠️ No statements yet — add some below or use AI to find them from your reports'}
                </div>
              )}
              {currentSection.type === 'standard-comment' ? (
                <div>
                  <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', color: '#166534', marginBottom: '16px', lineHeight: '1.5' }}>
                    This statement will appear as fixed text in every report — it is included automatically.
                  </div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>Statement text:</label>
                  <textarea
                    value={addedSections[currentSectionIndex]?.content || ''}
                    onChange={e => {
                      const updated = [...addedSections];
                      updated[currentSectionIndex] = { ...updated[currentSectionIndex], content: e.target.value };
                      setAddedSections(updated);
                    }}
                    placeholder="e.g. It has been a pleasure teaching [Name] this term..."
                    style={{ ...txa, minHeight: '100px', borderColor: '#10b981', marginBottom: '8px' }}
                  />
                  <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '16px' }}>Use [Name] as a placeholder for the pupil's name.</div>
                </div>
              ) : (
                renderStatementEditor(currentSection.type, sectionName)
              )}
              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button onClick={handleSectionBack} style={secondaryBtn}>← Back</button>
                <button onClick={handleSectionNext} style={primaryBtn}>{currentSectionIndex < addedSections.length - 1 ? `Next: ${addedSections[currentSectionIndex + 1]?.name} →` : 'Review template →'}</button>
              </div>
              <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid #f3f4f6' }}>
                <div style={{ fontSize: '12px', fontWeight: '600', color: '#9ca3af', marginBottom: '8px' }}>ALL SECTIONS</div>
                {addedSections.map((s, i) => (
                  <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', opacity: i === currentSectionIndex ? 1 : 0.5 }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: i < currentSectionIndex ? '#10b981' : i === currentSectionIndex ? accentColor : '#d1d5db', flexShrink: 0 }} />
                    <span style={{ fontSize: '13px', color: i === currentSectionIndex ? '#111827' : '#6b7280', fontWeight: i === currentSectionIndex ? '600' : '400' }}>{s.name}</span>
                    {i < currentSectionIndex && <span style={{ fontSize: '11px', color: '#10b981' }}>✓</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>
          {reportsPanelOpen && <ReportsPanel />}
        </div>
      </div>
    );
  }

  // ─── WIZARD (build from scratch + add custom section from review) ─────────
  if (screen === 'wizard') {
    const wAccent = SECTION_COLORS[question?.sectionType] || '#3b82f6';
    const wIsAssessment = question?.sectionType === 'assessment-comment';
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
                  {currentStep > 0 ? <button onClick={() => { setCurrentStep(s => s - 1); resetWizardQuestion(); }} style={{ background: 'none', border: 'none', color: '#9ca3af', fontSize: '13px', cursor: 'pointer', padding: 0 }}>← Previous question</button>
                    : <button onClick={() => setScreen(useReadyMade ? 'review' : 'standard-comment')} style={{ background: 'none', border: 'none', color: '#9ca3af', fontSize: '13px', cursor: 'pointer', padding: 0 }}>← Back</button>}
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

              {phase === 'instruction' && (
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>What does the score represent? (optional)</label>
                  <input type="text" value={sectionInstruction} onChange={e => setSectionInstruction(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleInstructionConfirmed(); }} placeholder="e.g. Black Death test score, Reading assessment percentage..." autoFocus style={{ ...inp, marginBottom: '8px' }} />
                  <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '16px', fontStyle: 'italic' }}>This will appear in the report writer as a reminder.</div>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button onClick={() => setPhase('name')} style={secondaryBtn}>← Back</button>
                    <button onClick={handleInstructionConfirmed} style={primaryBtn}>Continue →</button>
                  </div>
                </div>
              )}

              {phase === 'statements' && (
                <div>
                  {question?.hasButtons && <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', color: '#166534', marginBottom: '20px', lineHeight: '1.5' }}>💡 Add 1–2 statements to get started. Use the AI button to find more from your reports.</div>}
                  {!question?.hasButtons ? (
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>Paste your statement here:</label>
                      <textarea value={standardContent} onChange={e => setStandardContent(e.target.value)} placeholder="Paste or type the statement... Use [Name] for pupil name." style={{ ...txa, minHeight: '140px', borderColor: wAccent, marginBottom: '16px' }} />
                      <div style={{ display: 'flex', gap: '12px' }}>
                        <button onClick={() => setPhase('name')} style={secondaryBtn}>← Back</button>
                        <button onClick={handleWizardAddSection} style={primaryBtn}>{standardContent.trim() ? 'Save section →' : 'Skip →'}</button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      {renderStatementEditor(question.sectionType, sectionName)}
                      {wIsAssessment && <div style={{ backgroundColor: '#f3e8ff', border: '1px solid #d8b4fe', borderRadius: '8px', padding: '10px 14px', fontSize: '12px', color: '#7c3aed', marginBottom: '16px', lineHeight: '1.5' }}><strong>Score placeholders:</strong> use <code>[Score]</code> or <code>[Score 1]</code> <code>[Score 2]</code>.{sectionInstruction && <div style={{ marginTop: '6px' }}><strong>Reminder:</strong> {sectionInstruction}</div>}</div>}
                      <div style={{ display: 'flex', gap: '12px' }}>
                        <button onClick={() => editingSectionId ? setScreen('review') : setPhase('name')} style={secondaryBtn}>← Back</button>
                        <button onClick={handleWizardAddSection} style={primaryBtn}>{editingSectionId ? 'Save changes →' : 'Save section →'}</button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {phase === 'added' && (
                <div>
                  <div style={{ backgroundColor: '#d1fae5', color: '#065f46', borderRadius: '8px', padding: '12px 16px', fontSize: '13px', fontWeight: '600', marginBottom: '20px' }}>✓ Section added</div>
                  {question?.allowMultiple && (<><p style={{ fontSize: '14px', color: '#374151', marginBottom: '16px' }}>Would you like to add another {SECTION_LABELS[question.sectionType]?.toLowerCase()}?</p><div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}><button onClick={advanceQuestion} style={secondaryBtn}>No, continue →</button><button onClick={handleAddAnother} style={primaryBtn}>Yes, add another</button></div></>)}
                  {!question?.allowMultiple && <button onClick={advanceQuestion} style={primaryBtn}>Continue →</button>}
                </div>
              )}

              {addedSections.length > 0 && phase !== 'added' && (
                <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid #f3f4f6' }}>
                  <div style={{ fontSize: '12px', fontWeight: '600', color: '#9ca3af', marginBottom: '8px' }}>SECTIONS ADDED SO FAR</div>
                  {addedSections.map(s => (<div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}><div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: SECTION_COLORS[s.type] || '#9ca3af', flexShrink: 0 }} /><span style={{ fontSize: '13px', color: '#374151' }}>{s.name}</span></div>))}
                </div>
              )}
            </div>
          </div>
          {reportsPanelOpen && <ReportsPanel />}
        </div>
      </div>
    );
  }

  // ─── REVIEW ───────────────────────────────────────────────────────────────
  const testReport = generateTestReport(addedSections);
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <TopBar />
      <div style={{ flex: 1, display: 'flex', width: '100%', overflow: 'hidden', minHeight: 0 }}>
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px', minWidth: 0 }}>
          <div style={{ maxWidth: '680px', margin: '0 auto' }}>
            <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#111827', marginBottom: '6px' }}>Review your template</h1>
            <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '16px', lineHeight: '1.6' }}>Drag sections to reorder. Toggle headings. Add line breaks or optional comment boxes.</p>
            <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '10px 14px', marginBottom: '18px', fontSize: '12px', color: '#78350f', lineHeight: '1.6' }}><strong>Line break</strong> — adds a paragraph gap. <strong>Optional comment box</strong> — lets you type a free note per pupil.</div>

            {addedSections.map((s, index) => {
              const isSpecial = s.type === 'new-line' || s.type === 'optional-additional-comment';
              const isDragOver = dragOverIndex === index;
              const totalStmts = s.buttons.reduce((a, b) => a + b.statements.length, 0) + (s.content ? 1 : 0);
              return (
                <div key={s.id}>
                  <div style={{ height: isDragOver ? '36px' : '4px', backgroundColor: isDragOver ? '#dbeafe' : 'transparent', border: isDragOver ? '2px dashed #3b82f6' : 'none', borderRadius: '6px', transition: 'all 0.15s', marginBottom: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onDragOver={e => handleDragOver(e, index)} onDrop={e => handleDrop(e, index)}>{isDragOver && <span style={{ fontSize: '12px', color: '#3b82f6' }}>Drop here</span>}</div>
                  <div draggable onDragStart={() => handleDragStart(index)} onDragEnd={handleDragEnd} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: isSpecial ? '8px 14px' : '12px 14px', backgroundColor: isSpecial ? '#f9fafb' : 'white', border: `1px solid ${isSpecial ? '#f3f4f6' : '#e5e7eb'}`, borderRadius: '8px', marginBottom: '4px', cursor: 'grab' }}>
                    <div style={{ fontSize: '16px', color: '#d1d5db', cursor: 'grab' }}>⠿</div>
                    {!isSpecial && <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: SECTION_COLORS[s.type] || '#9ca3af', flexShrink: 0 }} />}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {isSpecial ? <div style={{ fontSize: '12px', color: '#9ca3af', fontStyle: 'italic' }}>{s.type === 'new-line' ? '— Line break —' : '[ Optional comment box ]'}</div>
                        : <><div style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>{s.name}</div><div style={{ fontSize: '11px', color: '#9ca3af' }}>{SECTION_LABELS[s.type]}{totalStmts > 0 && ` · ${totalStmts} statement${totalStmts !== 1 ? 's' : ''}`}</div></>}
                    </div>
                    {!isSpecial && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                        <span style={{ fontSize: '11px', color: '#9ca3af' }}>Heading</span>
                        <button onClick={() => handleToggleHeader(s.id)} style={{ width: '36px', height: '20px', borderRadius: '10px', border: 'none', cursor: 'pointer', backgroundColor: s.showHeader ? '#3b82f6' : '#d1d5db', position: 'relative', transition: 'background-color 0.2s', flexShrink: 0 }}>
                          <div style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: 'white', position: 'absolute', top: '2px', left: s.showHeader ? '18px' : '2px', transition: 'left 0.2s' }} />
                        </button>
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                      <button onClick={() => handleRemoveSection(s.id)} style={{ backgroundColor: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '6px', padding: '4px 10px', fontSize: '12px', cursor: 'pointer' }}>✕</button>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '6px', marginBottom: '6px', paddingLeft: '28px' }}>
                    <button onClick={() => handleAddSpecialSection('new-line', index)} style={{ background: 'none', border: '1px dashed #d1d5db', borderRadius: '4px', padding: '2px 8px', fontSize: '11px', color: '#9ca3af', cursor: 'pointer' }}>+ line break</button>
                    <button onClick={() => handleAddSpecialSection('optional-additional-comment', index)} style={{ background: 'none', border: '1px dashed #d1d5db', borderRadius: '4px', padding: '2px 8px', fontSize: '11px', color: '#9ca3af', cursor: 'pointer' }}>+ optional comment box</button>
                  </div>
                </div>
              );
            })}

            <button onClick={() => { setCurrentStep(0); resetWizardQuestion(); setEditingSectionId(null); setScreen('wizard'); }} style={{ width: '100%', padding: '12px', backgroundColor: 'white', border: '2px dashed #d1d5db', borderRadius: '8px', color: '#6b7280', fontSize: '14px', fontWeight: '500', cursor: 'pointer', marginTop: '8px', marginBottom: '24px' }} onMouseEnter={e => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.color = '#3b82f6'; }} onMouseLeave={e => { e.currentTarget.style.borderColor = '#d1d5db'; e.currentTarget.style.color = '#6b7280'; }}>
              ﹢ Add a custom section
            </button>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button onClick={() => setScreen(useReadyMade ? 'section-picker' : 'wizard')} style={secondaryBtn}>← Back</button>
              <button onClick={handleComplete} style={primaryBtn}>Save template →</button>
            </div>
          </div>
        </div>

        {reportsPanelOpen && (
          <div style={{ flex: '0 0 48%', borderLeft: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb', flexShrink: 0 }}>
              {(['reports', 'test-report'] as const).map(mode => (
                <button key={mode} onClick={() => setReviewViewMode(mode)} style={{ flex: 1, padding: '10px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: reviewViewMode === mode ? '600' : '400', color: reviewViewMode === mode ? '#111827' : '#9ca3af', backgroundColor: reviewViewMode === mode ? 'white' : '#f9fafb', borderBottom: reviewViewMode === mode ? '2px solid #3b82f6' : '2px solid transparent' }}>
                  {mode === 'reports' ? '📄 Your reports' : '👁 Test report'}
                </button>
              ))}
            </div>
            {reviewViewMode === 'reports' ? <ReportsPanel /> : (
              <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
                <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '10px' }}>Sample using first statement from each section. Pupil shown as "Alex".</div>
                <div style={{ fontSize: '14px', color: '#374151', lineHeight: '1.9', backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '16px', whiteSpace: 'pre-wrap', textAlign: 'left' as const }}>
                  {testReport || <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>Add sections with statements to see a preview here.</span>}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BuildAsYouGo;