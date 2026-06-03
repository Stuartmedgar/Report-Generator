import React, { useState, useRef, useEffect, useCallback } from 'react';
import { TemplateSection, SectionType } from '../types';

const SUPABASE_URL = 'https://wozbrojwuzktwrzngllh.supabase.co/functions/v1/generate-template';

interface BuildAsYouGoProps {
  templateName: string;
  classId?: string;
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
  showHeader?: boolean;
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
  examples?: string[];
  positionType: string;
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
    positionType: 'standard',
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
    positionType: 'qualities',
    examples: [
      '[Name] consistently demonstrates excellent effort and a positive attitude towards learning.',
      '[Name] is a natural leader who supports and encourages classmates.',
      '[Name] shows great resilience and perseverance when faced with challenges.',
    ],
  },
  {
    id: 'rated-comment',
    question: 'Do your reports rate pupils on their performance?',
    description: "Comments tied to a rating — Excellent, Good, Satisfactory, Needs Improvement. Click any button name to edit it to suit your school's language.",
    sectionType: 'rated-comment',
    namePlaceholder: 'e.g. Progress, Effort Rating',
    defaultName: 'Progress',
    allowMultiple: true,
    hasButtons: true,
    isRatedFixed: true,
    positionType: 'rating',
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
    positionType: 'assessment-comment',
    examples: [
      '[Name] achieved [Score] in the recent assessment, which reflects their hard work throughout the unit.',
      '[Name] scored [Score] in the recent test, demonstrating a strong grasp of the material.',
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
    positionType: 'personalised-comment',
    examples: [
      '[Name] has shown particular enthusiasm for [Info 1] this term and has made impressive progress.',
      'It was great to see [Name] represent the school in [Info 1] — a real achievement.',
      "[Name]'s involvement in [Info 1] has had a positive impact on their confidence and skills.",
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
    positionType: 'next-steps',
    examples: [
      '[Name] should focus on developing their extended writing skills to reach the next level.',
      '[Name] should practise their times tables regularly at home to consolidate their understanding.',
      "[Name]'s next step is to take more risks in their learning and back their own judgement.",
    ],
  },
  {
    id: 'other-comments',
    question: 'Do your reports contain any other types of comments?',
    description: 'If your reports include any other categories of comment not covered above, add them here.',
    sectionType: 'qualities',
    namePlaceholder: 'e.g. Behaviour, Homework, Wider Achievement',
    defaultName: 'Other Comments',
    allowMultiple: true,
    hasButtons: true,
    positionType: 'qualities',
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
  'new-line': 'Line Break',
};

const DEFAULT_RATED_BUTTONS = ['Excellent', 'Good', 'Satisfactory', 'Needs Improvement'];
const RATED_KEYS = ['excellent', 'good', 'satisfactory', 'needsImprovement'];
const makeId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

const AUTOSAVE_KEY = 'buildAsYouGo_draft';
function saveDraft(templateName: string, sections: AddedSection[]) {
  try { localStorage.setItem(AUTOSAVE_KEY, JSON.stringify({ templateName, sections, savedAt: Date.now() })); } catch (_) {}
}
function clearDraft() {
  try { localStorage.removeItem(AUTOSAVE_KEY); } catch (_) {}
}

function generateTestReport(sections: AddedSection[]): string {
  const parts: string[] = [];
  for (const s of sections) {
    if (s.type === 'new-line') { parts.push('\n\n'); continue; }
    if (s.showHeader && s.name) parts.push(`${s.name.toUpperCase()}\n`);
    if (s.type === 'standard-comment') {
      if (s.content) parts.push(s.content.replace(/\[Name\]/g, 'Alex'));
    } else if (s.type === 'optional-additional-comment') {
      parts.push('[Optional comment — teacher types here]');
    } else {
      const btn = s.buttons.find(b => b.name && b.statements.length > 0);
      if (btn) parts.push(btn.statements[0].replace(/\[Name\]/g, 'Alex').replace(/\[Score\]/g, '78%').replace(/\[Info 1\]/g, 'football'));
    }
  }
  return parts.join(' ').replace(/ {2,}/g, ' ').replace(/\n /g, '\n').trim();
}

const BuildAsYouGo: React.FC<BuildAsYouGoProps> = ({ templateName, classId, onComplete, onCancel }) => {

  const reportsPanelScrollRef = useRef<number>(0);
  const reportsPanelRef = useRef<HTMLTextAreaElement>(null);
  const handleReportsPanelScroll = useCallback((e: React.UIEvent<HTMLTextAreaElement>) => {
    reportsPanelScrollRef.current = e.currentTarget.scrollTop;
  }, []);
  useEffect(() => {
    if (reportsPanelRef.current) reportsPanelRef.current.scrollTop = reportsPanelScrollRef.current;
  });

  const [reportsPanelOpen, setReportsPanelOpen] = useState(true);
  const [pastedReports, setPastedReports] = useState('');
  const [currentStep, setCurrentStep] = useState(0);
  const [addedSections, setAddedSections] = useState<AddedSection[]>([]);
  const [screen, setScreen] = useState<'questions' | 'review'>('questions');
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
  const [showExamples, setShowExamples] = useState(false);

  const [editingStatementKey, setEditingStatementKey] = useState<{ buttonIdx: number; stmtIdx: number } | null>(null);
  const [editingStatementValue, setEditingStatementValue] = useState('');
  const [movingStatementKey, setMovingStatementKey] = useState<{ buttonIdx: number; stmtIdx: number } | null>(null);

  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const [reviewViewMode, setReviewViewMode] = useState<'reports' | 'test-report'>('reports');
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const dragSourceIndex = useRef<number | null>(null);

  const statementInputRef = useRef<HTMLTextAreaElement>(null);
  const question = QUESTIONS[currentStep];
  const isLastQuestion = currentStep === QUESTIONS.length - 1;
  const isRatedFixed = question?.isRatedFixed === true;
  const isAssessment = question?.sectionType === 'assessment-comment';
  const hasReports = pastedReports.trim().length > 50;

  useEffect(() => {
    if (addedSections.length > 0) saveDraft(templateName, addedSections);
  }, [addedSections, templateName]);

  const resetQuestion = () => {
    setPhase('ask'); setSectionName(''); setSectionInstruction('');
    setButtons([]); setActiveButtonIndex(0); setNewStatement('');
    setNewButtonName(''); setAddingNewButton(false);
    setNamingButtonIndex(null); setNamingButtonValue('');
    setStandardContent(''); setShowExamples(false);
    setAiError(null); setEditingStatementKey(null); setMovingStatementKey(null);
  };

  const handlePreviousQuestion = () => {
    if (currentStep > 0) { setCurrentStep(s => s - 1); resetQuestion(); }
  };

  const advanceQuestion = () => {
    if (isLastQuestion) setScreen('review');
    else { setCurrentStep(s => s + 1); resetQuestion(); }
  };

  const handleYes = () => { setSectionName(question.defaultName); setPhase('name'); };
  const handleNo = () => advanceQuestion();

  const handleNameConfirmed = () => {
    if (!sectionName.trim()) return;
    if (isAssessment) { setSectionInstruction(''); setPhase('instruction'); return; }
    if (question.hasButtons) {
      if (isRatedFixed) setButtons(DEFAULT_RATED_BUTTONS.map(n => ({ name: n, statements: [] })));
      else { setButtons([{ name: '', statements: [] }]); setNamingButtonIndex(0); setNamingButtonValue(''); }
      setActiveButtonIndex(0);
      setPhase('statements');
    } else {
      setPhase('statements');
    }
  };

  const handleInstructionConfirmed = () => {
    setButtons([{ name: '', statements: [] }]);
    setNamingButtonIndex(0); setNamingButtonValue('');
    setActiveButtonIndex(0); setPhase('statements');
  };

  const handleConfirmButtonName = () => {
    if (!namingButtonValue.trim()) return;
    setButtons(prev => { const u = [...prev]; u[namingButtonIndex!] = { ...u[namingButtonIndex!], name: namingButtonValue.trim() }; return u; });
    setNamingButtonIndex(null); setNamingButtonValue('');
  };

  const handleAddStatement = () => {
    if (!newStatement.trim()) return;
    setButtons(prev => { const u = [...prev]; u[activeButtonIndex] = { ...u[activeButtonIndex], statements: [...u[activeButtonIndex].statements, newStatement.trim()] }; return u; });
    setNewStatement('');
    statementInputRef.current?.focus();
  };

  const handleRemoveStatement = (bi: number, si: number) => {
    setButtons(prev => { const u = [...prev]; u[bi] = { ...u[bi], statements: u[bi].statements.filter((_, i) => i !== si) }; return u; });
  };

  const handleStartEditStatement = (bi: number, si: number, val: string) => {
    setEditingStatementKey({ buttonIdx: bi, stmtIdx: si });
    setEditingStatementValue(val);
    setMovingStatementKey(null);
  };

  const handleSaveEditStatement = () => {
    if (!editingStatementKey || !editingStatementValue.trim()) return;
    const { buttonIdx: bi, stmtIdx: si } = editingStatementKey;
    setButtons(prev => { const u = [...prev]; const s = [...u[bi].statements]; s[si] = editingStatementValue.trim(); u[bi] = { ...u[bi], statements: s }; return u; });
    setEditingStatementKey(null);
  };

  const handleMoveStatement = (bi: number, si: number, targetBi: number) => {
    const stmt = buttons[bi].statements[si];
    setButtons(prev => {
      const u = prev.map(b => ({ ...b, statements: [...b.statements] }));
      u[bi].statements.splice(si, 1);
      u[targetBi].statements.push(stmt);
      return u;
    });
    setMovingStatementKey(null);
  };

  const handleConfirmNewButton = () => {
    if (!newButtonName.trim()) return;
    const idx = buttons.length;
    setButtons(prev => [...prev, { name: newButtonName.trim(), statements: [] }]);
    setActiveButtonIndex(idx); setNewButtonName(''); setAddingNewButton(false);
  };

  const handleAddRatedButton = () => setButtons(prev => [...prev, { name: 'New Level', statements: [] }]);
  const handleDeleteRatedButton = (idx: number) => {
    if (buttons.length <= 1) return;
    setButtons(prev => prev.filter((_, i) => i !== idx));
    setActiveButtonIndex(0);
  };
  const handleRatedButtonRename = (idx: number, val: string) => {
    setButtons(prev => { const u = [...prev]; u[idx] = { ...u[idx], name: val }; return u; });
  };

  const handleAiFindInReports = async () => {
    if (!hasReports) return;
    setAiLoading(true); setAiError(null);
    try {
      const existingStatements: string[] = [];
      buttons.forEach(b => { if (b.name && b.statements.length > 0) existingStatements.push(...b.statements); });

      const selectedText = existingStatements.length > 0
        ? existingStatements.join('\n')
        : question.examples?.slice(0, 2).join('\n') || '';

      if (!selectedText) {
        setAiError('Add at least one example statement first so the AI knows what to look for.');
        setAiLoading(false); return;
      }

      const response = await fetch(SUPABASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'extract-only',
          subject: sectionName,
          yearGroup: '',
          reportText: pastedReports,
          pronounSet: 'they/their',
          openerType: 'name',
          sectionName,
          positionType: question.positionType,
          selectedText,
          scaleType: isRatedFixed ? 'four-level' : 'own',
        }),
      });

      if (!response.ok) throw new Error('failed');
      const data = await response.json();
      const headings: { name: string; comments: string[] }[] = data.headings || [];

      if (headings.length === 0) {
        setAiError('No matching sentences found. Try adding a statement manually first so the AI has a pattern to match.');
        setAiLoading(false); return;
      }

      if (isRatedFixed) {
        setButtons(prev => {
          const u = [...prev];
          headings.forEach(h => {
            const n = h.name.toLowerCase();
            let ti = 1;
            if (n.includes('excellent') || n.includes('outstanding') || n.includes('strong')) ti = 0;
            else if (n.includes('good') || n.includes('solid')) ti = 1;
            else if (n.includes('satisfactory') || n.includes('making')) ti = 2;
            else if (n.includes('improvement') || n.includes('needs') || n.includes('difficult')) ti = 3;
            if (ti < u.length) {
              const newStmts = h.comments.filter(c => !u[ti].statements.includes(c));
              u[ti] = { ...u[ti], statements: [...u[ti].statements, ...newStmts] };
            }
          });
          return u;
        });
      } else {
        setButtons(prev => {
          const merged = [...prev];
          headings.forEach(h => {
            const ei = merged.findIndex(b => b.name.toLowerCase() === h.name.toLowerCase());
            if (ei >= 0) {
              const newStmts = h.comments.filter(c => !merged[ei].statements.includes(c));
              merged[ei] = { ...merged[ei], statements: [...merged[ei].statements, ...newStmts] };
            } else if (h.name && h.comments.length > 0) {
              merged.push({ name: h.name, statements: h.comments });
            }
          });
          return merged.filter(b => b.name);
        });
      }
    } catch {
      setAiError('AI extraction failed. Please try again or add statements manually.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleAddSection = () => {
    const name = sectionName.trim() || question.defaultName;
    const newSection: AddedSection = {
      id: editingSectionId || makeId(),
      type: question.sectionType,
      name,
      buttons: question.hasButtons ? buttons : [],
      content: standardContent,
      instruction: sectionInstruction,
      showHeader: false,
    };
    if (editingSectionId) {
      setAddedSections(prev => prev.map(s => s.id === editingSectionId ? { ...newSection, showHeader: s.showHeader } : s));
      setEditingSectionId(null);
      setScreen('review');
    } else {
      setAddedSections(prev => [...prev, newSection]);
      setPhase('added');
    }
  };

  const handleAddAnother = () => {
    setSectionName(question.defaultName); setSectionInstruction('');
    setPhase('name'); setButtons([]); setActiveButtonIndex(0);
    setNewStatement(''); setNewButtonName(''); setAddingNewButton(false);
    setNamingButtonIndex(null); setNamingButtonValue('');
    setStandardContent(''); setShowExamples(false);
    setAiError(null); setEditingStatementKey(null); setMovingStatementKey(null);
  };

  const handleEditExistingSection = (section: AddedSection) => {
    const qIdx = QUESTIONS.findIndex(q =>
      section.type === 'qualities' && section.name === 'Other Comments' ? q.id === 'other-comments' : q.sectionType === section.type
    );
    if (qIdx === -1) return;
    setCurrentStep(qIdx); setEditingSectionId(section.id);
    setSectionName(section.name); setSectionInstruction(section.instruction || '');
    setButtons(section.buttons.length > 0 ? section.buttons : [{ name: '', statements: [] }]);
    setActiveButtonIndex(0); setStandardContent(section.content || '');
    setNamingButtonIndex(null); setNamingButtonValue('');
    setAddingNewButton(false); setShowExamples(false);
    setAiError(null); setEditingStatementKey(null); setMovingStatementKey(null);
    setPhase('statements'); setScreen('questions');
  };

  const handleRemoveSection = (id: string) => setAddedSections(prev => prev.filter(s => s.id !== id));

  const handleToggleHeader = (id: string) =>
    setAddedSections(prev => prev.map(s => s.id === id ? { ...s, showHeader: !s.showHeader } : s));

  const handleAddSpecialSection = (type: 'new-line' | 'optional-additional-comment', afterIndex: number) => {
    const newSection: AddedSection = {
      id: makeId(), type: type as SectionType,
      name: type === 'new-line' ? '' : 'Additional Comments',
      buttons: [], content: '', instruction: '', showHeader: false,
    };
    setAddedSections(prev => { const u = [...prev]; u.splice(afterIndex + 1, 0, newSection); return u; });
  };

  const handleDragStart = (index: number) => { dragSourceIndex.current = index; };
  const handleDragOver = (e: React.DragEvent, index: number) => { e.preventDefault(); setDragOverIndex(index); };
  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    const src = dragSourceIndex.current;
    if (src === null || src === targetIndex) { setDragOverIndex(null); return; }
    setAddedSections(prev => { const u = [...prev]; const [m] = u.splice(src, 1); u.splice(targetIndex, 0, m); return u; });
    dragSourceIndex.current = null; setDragOverIndex(null);
  };
  const handleDragEnd = () => { dragSourceIndex.current = null; setDragOverIndex(null); };

  const handleComplete = () => {
    if (addedSections.filter(s => s.type !== 'new-line' && s.type !== 'optional-additional-comment').length === 0) {
      alert('Please add at least one section to your template.'); return;
    }
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
    clearDraft();
    onComplete(sections);
  };

  // ─── FIXED: warn before losing progress ───────────────────────────────────
  const handleCancel = () => {
    if (addedSections.length > 0) {
      const confirmed = window.confirm(
        'Are you sure you want to go back? Your progress on this template will be lost.'
      );
      if (!confirmed) return;
    }
    onCancel();
  };

  // ─── STYLES ───────────────────────────────────────────────────────────────

  const primaryBtn: React.CSSProperties = { backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', padding: '11px 24px', fontSize: '15px', fontWeight: '600', cursor: 'pointer' };
  const secondaryBtn: React.CSSProperties = { backgroundColor: '#f3f4f6', color: '#374151', border: 'none', borderRadius: '8px', padding: '11px 24px', fontSize: '15px', fontWeight: '500', cursor: 'pointer' };
  const smallBtn = (color: string): React.CSSProperties => ({ backgroundColor: color, color: 'white', border: 'none', borderRadius: '6px', padding: '6px 14px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' });
  const inp: React.CSSProperties = { width: '100%', padding: '10px 14px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', textAlign: 'left' };
  const txa: React.CSSProperties = { ...inp, resize: 'vertical' };
  const accentColor = question ? (SECTION_COLORS[question.sectionType] || '#3b82f6') : '#3b82f6';

  // ─── REPORTS PANEL ────────────────────────────────────────────────────────

  const ReportsPanel = () => (
    <div style={{ flex: '0 0 44%', borderLeft: '1px solid #e5e7eb', backgroundColor: 'white', display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #f3f4f6', flexShrink: 0 }}>
        <div style={{ fontSize: '13px', fontWeight: '600', color: '#374151' }}>
          Your existing reports
          {hasReports && <span style={{ color: '#10b981', fontWeight: '500', marginLeft: '8px' }}>✓ Ready for AI</span>}
        </div>
        <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>Paste here — the AI uses these when you click "Find in my reports"</div>
      </div>
      <div style={{ flex: 1, padding: '12px 16px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <textarea
          ref={reportsPanelRef}
          value={pastedReports}
          onChange={e => setPastedReports(e.target.value)}
          onScroll={handleReportsPanelScroll}
          placeholder="Paste your existing reports here. Separate each with a blank line or ---."
          style={{ flex: 1, width: '100%', padding: '10px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '12px', lineHeight: '1.7', outline: 'none', resize: 'none', boxSizing: 'border-box', fontFamily: 'inherit', color: '#374151' }}
        />
      </div>
    </div>
  );

  // ─── TOP BAR ──────────────────────────────────────────────────────────────

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
        <button onClick={handleCancel} style={{ background: 'none', border: 'none', color: '#9ca3af', fontSize: '13px', cursor: 'pointer' }}>← Back</button>
      </div>
    </div>
  );

  // ─── REVIEW SCREEN ────────────────────────────────────────────────────────

  if (screen === 'review') {
    const testReport = generateTestReport(addedSections);
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <TopBar />
        <div style={{ flex: 1, display: 'flex', width: '100%', overflow: 'hidden', minHeight: 0 }}>
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px', minWidth: 0 }}>
            <div style={{ maxWidth: '680px', margin: '0 auto' }}>
              <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#111827', marginBottom: '6px' }}>Review your template</h1>
              <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '16px', lineHeight: '1.6' }}>
                Drag sections to reorder. Toggle section headings on or off. Add line breaks or optional comment boxes between sections.
              </p>
              <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '10px 14px', marginBottom: '18px', fontSize: '12px', color: '#78350f', lineHeight: '1.6' }}>
                <strong>Line break</strong> — adds a paragraph gap in the finished report. <strong>Optional comment box</strong> — lets you type a free note for individual pupils.
              </div>

              {addedSections.map((s, index) => {
                const isSpecial = s.type === 'new-line' || s.type === 'optional-additional-comment';
                const isDragOver = dragOverIndex === index;
                const totalStmts = s.buttons.reduce((a, b) => a + b.statements.length, 0) + (s.content ? 1 : 0);
                return (
                  <div key={s.id}>
                    <div style={{ height: isDragOver ? '36px' : '4px', backgroundColor: isDragOver ? '#dbeafe' : 'transparent', border: isDragOver ? '2px dashed #3b82f6' : 'none', borderRadius: '6px', transition: 'all 0.15s', marginBottom: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      onDragOver={e => handleDragOver(e, index)} onDrop={e => handleDrop(e, index)}>
                      {isDragOver && <span style={{ fontSize: '12px', color: '#3b82f6' }}>Drop here</span>}
                    </div>
                    <div draggable onDragStart={() => handleDragStart(index)} onDragEnd={handleDragEnd}
                      style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: isSpecial ? '8px 14px' : '12px 14px', backgroundColor: isSpecial ? '#f9fafb' : 'white', border: `1px solid ${isSpecial ? '#f3f4f6' : '#e5e7eb'}`, borderRadius: '8px', marginBottom: '4px', cursor: 'grab', opacity: dragSourceIndex.current === index ? 0.5 : 1 }}>
                      <div style={{ fontSize: '16px', color: '#d1d5db', cursor: 'grab' }}>⠿</div>
                      {!isSpecial && <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: SECTION_COLORS[s.type] || '#9ca3af', flexShrink: 0 }} />}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        {isSpecial ? (
                          <div style={{ fontSize: '12px', color: '#9ca3af', fontStyle: 'italic' }}>
                            {s.type === 'new-line' ? '— Line break —' : '[ Optional comment box ]'}
                          </div>
                        ) : (
                          <>
                            <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>{s.name}</div>
                            <div style={{ fontSize: '11px', color: '#9ca3af' }}>{SECTION_LABELS[s.type]}{totalStmts > 0 && ` · ${totalStmts} statement${totalStmts !== 1 ? 's' : ''}`}</div>
                          </>
                        )}
                      </div>
                      {!isSpecial && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                          <span style={{ fontSize: '11px', color: '#9ca3af' }}>Heading</span>
                          <button onClick={() => handleToggleHeader(s.id)}
                            style={{ width: '36px', height: '20px', borderRadius: '10px', border: 'none', cursor: 'pointer', backgroundColor: s.showHeader ? '#3b82f6' : '#d1d5db', position: 'relative', transition: 'background-color 0.2s', flexShrink: 0 }}>
                            <div style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: 'white', position: 'absolute', top: '2px', left: s.showHeader ? '18px' : '2px', transition: 'left 0.2s' }} />
                          </button>
                        </div>
                      )}
                      <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                        {!isSpecial && <button onClick={() => handleEditExistingSection(s)} style={{ ...secondaryBtn, padding: '4px 10px', fontSize: '12px' }}>✏️</button>}
                        <button onClick={() => handleRemoveSection(s.id)} style={{ backgroundColor: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '6px', padding: '4px 10px', fontSize: '12px', cursor: 'pointer' }}>✕</button>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '6px', marginBottom: '6px', paddingLeft: '28px' }}>
                      <button onClick={() => handleAddSpecialSection('new-line', index)}
                        style={{ background: 'none', border: '1px dashed #d1d5db', borderRadius: '4px', padding: '2px 8px', fontSize: '11px', color: '#9ca3af', cursor: 'pointer' }}>+ line break</button>
                      <button onClick={() => handleAddSpecialSection('optional-additional-comment', index)}
                        style={{ background: 'none', border: '1px dashed #d1d5db', borderRadius: '4px', padding: '2px 8px', fontSize: '11px', color: '#9ca3af', cursor: 'pointer' }}>+ optional comment box</button>
                    </div>
                  </div>
                );
              })}

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                <button onClick={() => setScreen('questions')} style={secondaryBtn}>← Back</button>
                <button onClick={handleComplete} style={primaryBtn}>Start writing reports →</button>
              </div>
            </div>
          </div>

          {/* ─── FIXED: Right panel wider + test report left-aligned ─────────── */}
          {reportsPanelOpen && (
            <div style={{ flex: '0 0 48%', borderLeft: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb', flexShrink: 0 }}>
                {(['reports', 'test-report'] as const).map(mode => (
                  <button key={mode} onClick={() => setReviewViewMode(mode)}
                    style={{ flex: 1, padding: '10px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: reviewViewMode === mode ? '600' : '400', color: reviewViewMode === mode ? '#111827' : '#9ca3af', backgroundColor: reviewViewMode === mode ? 'white' : '#f9fafb', borderBottom: reviewViewMode === mode ? '2px solid #3b82f6' : '2px solid transparent' }}>
                    {mode === 'reports' ? '📄 Your reports' : '👁 Test report'}
                  </button>
                ))}
              </div>
              {reviewViewMode === 'reports' ? (
                <ReportsPanel />
              ) : (
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
  }

  // ─── QUESTIONS SCREEN ─────────────────────────────────────────────────────

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <TopBar />
      <div style={{ flex: 1, display: 'flex', width: '100%', overflow: 'hidden', minHeight: 0 }}>
        <div style={{ flex: 1, overflowY: 'auto', padding: '32px 40px', minWidth: 0 }}>
          <div style={{ maxWidth: '560px', width: '100%', margin: '0 auto' }}>

            <div style={{ display: 'inline-block', backgroundColor: accentColor + '20', color: accentColor, border: `1px solid ${accentColor}40`, borderRadius: '20px', padding: '4px 12px', fontSize: '12px', fontWeight: '600', marginBottom: '16px' }}>
              {SECTION_LABELS[question.sectionType] || question.id}
            </div>

            <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#111827', marginBottom: '10px', lineHeight: '1.3', textAlign: 'left' }}>{question.question}</h2>
            <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '20px', lineHeight: '1.6', textAlign: 'left' }}>{question.description}</p>

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

            {/* ASK */}
            {phase === 'ask' && (
              <div>
                <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                  <button onClick={handleYes} style={{ ...primaryBtn, flex: 1 }}>Yes</button>
                  <button onClick={handleNo} style={{ ...secondaryBtn, flex: 1 }}>No</button>
                </div>
                {currentStep > 0 && (
                  <button onClick={handlePreviousQuestion} style={{ background: 'none', border: 'none', color: '#9ca3af', fontSize: '13px', cursor: 'pointer', padding: 0 }}>← Previous question</button>
                )}
              </div>
            )}

            {/* NAME */}
            {phase === 'name' && (
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '8px', textAlign: 'left' }}>What would you like to call this section?</label>
                <input type="text" value={sectionName} onChange={e => setSectionName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleNameConfirmed(); }}
                  placeholder={question.namePlaceholder} autoFocus
                  style={{ ...inp, borderColor: accentColor, marginBottom: '16px' }} />
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button onClick={() => setPhase('ask')} style={secondaryBtn}>← Back</button>
                  <button onClick={handleNameConfirmed} disabled={!sectionName.trim()} style={{ ...primaryBtn, opacity: !sectionName.trim() ? 0.4 : 1 }}>Continue →</button>
                </div>
              </div>
            )}

            {/* INSTRUCTION */}
            {phase === 'instruction' && (
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '8px', textAlign: 'left' }}>What does the score represent? (optional)</label>
                <input type="text" value={sectionInstruction} onChange={e => setSectionInstruction(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleInstructionConfirmed(); }}
                  placeholder="e.g. Black Death test score, Reading assessment percentage..."
                  autoFocus style={{ ...inp, marginBottom: '8px' }} />
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '16px', fontStyle: 'italic', textAlign: 'left' }}>This will appear in the report writer as a reminder.</div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button onClick={() => setPhase('name')} style={secondaryBtn}>← Back</button>
                  <button onClick={handleInstructionConfirmed} style={primaryBtn}>Continue →</button>
                </div>
              </div>
            )}

            {/* STATEMENTS */}
            {phase === 'statements' && (
              <div>
                {question.hasButtons && (
                  <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', color: '#166534', marginBottom: '20px', lineHeight: '1.5', textAlign: 'left' }}>
                    💡 Add 1–2 statements to get started. Use the AI button to find more from your reports once you have an example.
                  </div>
                )}

                {/* Standard comment */}
                {!question.hasButtons && (
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '8px', textAlign: 'left' }}>Paste your statement here:</label>
                    <textarea value={standardContent} onChange={e => setStandardContent(e.target.value)}
                      placeholder="Paste or type the statement here... Use [Name] for pupil name."
                      style={{ ...txa, minHeight: '140px', borderColor: accentColor, marginBottom: '16px' }} />
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <button onClick={() => setPhase('name')} style={secondaryBtn}>← Back</button>
                      <button onClick={handleAddSection} style={primaryBtn}>{standardContent.trim() ? 'Save section →' : 'Skip →'}</button>
                    </div>
                  </div>
                )}

                {/* Button-based */}
                {question.hasButtons && (
                  <div>
                    {isRatedFixed && (
                      <div style={{ marginBottom: '16px' }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'flex-start' }}>
                          {buttons.map((btn, i) => (
                            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                                <input type="text" value={btn.name}
                                  onChange={e => handleRatedButtonRename(i, e.target.value)}
                                  onClick={() => { setActiveButtonIndex(i); setAddingNewButton(false); }}
                                  onFocus={() => setActiveButtonIndex(i)}
                                  style={{
                                    padding: '7px 10px', border: `2px solid ${accentColor}`, borderRadius: '6px',
                                    fontSize: '13px', fontWeight: '600', outline: 'none',
                                    backgroundColor: activeButtonIndex === i ? accentColor : 'white',
                                    color: activeButtonIndex === i ? 'white' : accentColor,
                                    width: `${Math.max(80, btn.name.length * 8 + 20)}px`,
                                    minWidth: '80px', maxWidth: '180px', textAlign: 'center', cursor: 'pointer',
                                  }} />
                                {buttons.length > 1 && (
                                  <button onClick={() => handleDeleteRatedButton(i)}
                                    style={{ width: '18px', height: '18px', borderRadius: '50%', border: 'none', backgroundColor: '#fee2e2', color: '#ef4444', cursor: 'pointer', fontSize: '10px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                                )}
                              </div>
                              {btn.statements.length > 0 && <div style={{ fontSize: '10px', color: '#9ca3af' }}>({btn.statements.length})</div>}
                            </div>
                          ))}
                          <button onClick={handleAddRatedButton}
                            style={{ padding: '7px 12px', border: `2px dashed ${accentColor}`, borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', backgroundColor: 'white', color: accentColor, minWidth: '70px', alignSelf: 'flex-start' }}>
                            + Add
                          </button>
                        </div>
                      </div>
                    )}

                    {!isRatedFixed && (
                      <div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px', alignItems: 'center' }}>
                          {buttons.map((btn, i) => btn.name ? (
                            <button key={i} onClick={() => { setActiveButtonIndex(i); setAddingNewButton(false); setNamingButtonIndex(null); }}
                              style={{ padding: '6px 14px', border: `2px solid ${accentColor}`, borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', backgroundColor: activeButtonIndex === i && namingButtonIndex === null && !addingNewButton ? accentColor : 'white', color: activeButtonIndex === i && namingButtonIndex === null && !addingNewButton ? 'white' : accentColor }}>
                              {btn.name}{btn.statements.length > 0 && <span style={{ marginLeft: '6px', fontSize: '11px', opacity: 0.8 }}>({btn.statements.length})</span>}
                            </button>
                          ) : null)}
                          {!addingNewButton && namingButtonIndex === null && (
                            <button onClick={() => {
                              if (buttons.some(b => !b.name)) { const idx = buttons.findIndex(b => !b.name); setNamingButtonIndex(idx); setNamingButtonValue(''); setActiveButtonIndex(idx); }
                              else { setAddingNewButton(true); setNewButtonName(''); }
                            }} style={{ padding: '6px 14px', border: `2px dashed ${accentColor}`, borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', backgroundColor: 'white', color: accentColor }}>
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
                              <button onClick={handleConfirmNewButton} disabled={!newButtonName.trim()} style={{ ...smallBtn(accentColor), opacity: !newButtonName.trim() ? 0.4 : 1 }}>Add button</button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {isAssessment && (
                      <div style={{ backgroundColor: '#f3e8ff', border: '1px solid #d8b4fe', borderRadius: '8px', padding: '10px 14px', fontSize: '12px', color: '#7c3aed', marginBottom: '16px', textAlign: 'left', lineHeight: '1.5' }}>
                        <strong>Score placeholders:</strong> use <code>[Score]</code> or <code>[Score 1]</code> <code>[Score 2]</code> for multiple scores.
                        {sectionInstruction && <div style={{ marginTop: '6px' }}><strong>Reminder:</strong> {sectionInstruction}</div>}
                      </div>
                    )}

                    {(isRatedFixed || (buttons[activeButtonIndex]?.name && namingButtonIndex === null)) && !addingNewButton && (
                      <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '8px', textAlign: 'left' }}>
                          Add a statement for <span style={{ color: accentColor }}>{buttons[activeButtonIndex]?.name || `Button ${activeButtonIndex + 1}`}</span>:
                        </label>
                        <textarea ref={statementInputRef} value={newStatement} onChange={e => setNewStatement(e.target.value)}
                          placeholder="Paste or type a statement... Use [Name] for pupil name."
                          style={{ ...txa, minHeight: '80px', borderColor: accentColor, marginBottom: '8px' }} />
                        <button onClick={handleAddStatement} disabled={!newStatement.trim()}
                          style={{ ...smallBtn(accentColor), opacity: !newStatement.trim() ? 0.4 : 1, marginBottom: '16px' }}>+ Add</button>

                        {buttons[activeButtonIndex]?.statements.length > 0 && (
                          <div style={{ marginBottom: '16px' }}>
                            {buttons[activeButtonIndex].statements.map((stmt, i) => {
                              const isEditing = editingStatementKey?.buttonIdx === activeButtonIndex && editingStatementKey?.stmtIdx === i;
                              const isMoving = movingStatementKey?.buttonIdx === activeButtonIndex && movingStatementKey?.stmtIdx === i;
                              return (
                                <div key={i} style={{ backgroundColor: 'white', border: `1px solid ${isEditing ? accentColor : '#e5e7eb'}`, borderRadius: '6px', marginBottom: '6px', overflow: 'hidden' }}>
                                  {isEditing ? (
                                    <div style={{ padding: '8px' }}>
                                      <textarea value={editingStatementValue} onChange={e => setEditingStatementValue(e.target.value)}
                                        autoFocus style={{ ...txa, minHeight: '60px', marginBottom: '6px', borderColor: accentColor }} />
                                      <div style={{ display: 'flex', gap: '6px' }}>
                                        <button onClick={() => setEditingStatementKey(null)} style={{ ...secondaryBtn, padding: '4px 10px', fontSize: '12px' }}>Cancel</button>
                                        <button onClick={handleSaveEditStatement} style={smallBtn(accentColor)}>Save</button>
                                      </div>
                                    </div>
                                  ) : isMoving ? (
                                    <div style={{ padding: '8px' }}>
                                      <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '6px' }}>Move to which button?</div>
                                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                        {buttons.map((b, bi) => bi !== activeButtonIndex && b.name ? (
                                          <button key={bi} onClick={() => handleMoveStatement(activeButtonIndex, i, bi)}
                                            style={{ ...smallBtn(accentColor), fontSize: '12px', padding: '4px 10px' }}>{b.name}</button>
                                        ) : null)}
                                        <button onClick={() => setMovingStatementKey(null)} style={{ ...secondaryBtn, padding: '4px 10px', fontSize: '12px' }}>Cancel</button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '8px 10px' }}>
                                      <span style={{ flex: 1, fontSize: '13px', color: '#374151', textAlign: 'left', lineHeight: '1.5' }}>{stmt}</span>
                                      <div style={{ display: 'flex', gap: '2px', flexShrink: 0 }}>
                                        <button onClick={() => handleStartEditStatement(activeButtonIndex, i, stmt)}
                                          title="Edit" style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: '13px', padding: '2px 4px' }}>✏️</button>
                                        {buttons.filter(b => b.name).length > 1 && (
                                          <button onClick={() => setMovingStatementKey({ buttonIdx: activeButtonIndex, stmtIdx: i })}
                                            title="Move to another button" style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: '13px', padding: '2px 4px' }}>↔</button>
                                        )}
                                        <button onClick={() => handleRemoveStatement(activeButtonIndex, i)}
                                          style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '14px', padding: '2px 4px' }}>✕</button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}

                    {hasReports && !aiLoading && (
                      <div style={{ marginBottom: '16px' }}>
                        <div style={{ height: '1px', backgroundColor: '#f3f4f6', margin: '4px 0 14px' }} />
                        <button onClick={handleAiFindInReports}
                          style={{ width: '100%', padding: '12px 16px', backgroundColor: '#faf5ff', border: '2px solid #8b5cf6', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}
                          onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#f3e8ff'; }}
                          onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#faf5ff'; }}>
                          <span style={{ fontSize: '20px' }}>🔍</span>
                          <div style={{ textAlign: 'left' }}>
                            <div style={{ fontSize: '14px', fontWeight: '700', color: '#7c3aed' }}>Find in my reports</div>
                            <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                              {buttons.some(b => b.statements.length > 0)
                                ? 'Uses your existing statements as examples to find more like them in your reports'
                                : 'Add at least one statement first so the AI has a pattern to match'}
                            </div>
                          </div>
                        </button>
                      </div>
                    )}

                    {aiLoading && (
                      <div style={{ marginBottom: '16px', padding: '14px 16px', backgroundColor: '#faf5ff', border: '2px solid #8b5cf6', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          {[0,1,2].map(i => <div key={i} style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#8b5cf6', animation: 'pulse 1.2s ease-in-out infinite', animationDelay: `${i * 0.2}s` }} />)}
                        </div>
                        <div style={{ fontSize: '13px', color: '#7c3aed' }}>Searching your reports for matching sentences...</div>
                        <style>{`@keyframes pulse{0%,100%{opacity:.3;transform:scale(.8)}50%{opacity:1;transform:scale(1.2)}}`}</style>
                      </div>
                    )}

                    {aiError && (
                      <div style={{ marginBottom: '16px', padding: '10px 14px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', fontSize: '13px', color: '#b91c1c' }}>
                        ⚠️ {aiError}
                      </div>
                    )}

                    {!hasReports && (
                      <div style={{ marginBottom: '16px', padding: '10px 14px', backgroundColor: '#f9fafb', border: '1px dashed #d1d5db', borderRadius: '8px', fontSize: '12px', color: '#9ca3af' }}>
                        💡 Paste existing reports in the right panel to enable AI search.
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: '12px' }}>
                      <button onClick={() => editingSectionId ? setScreen('review') : setPhase('name')} style={secondaryBtn}>← Back</button>
                      <button onClick={handleAddSection} style={primaryBtn}>
                        {editingSectionId ? 'Save changes →' : 'Save section →'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ADDED */}
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

            {addedSections.length > 0 && phase !== 'added' && (
              <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid #f3f4f6' }}>
                <div style={{ fontSize: '12px', fontWeight: '600', color: '#9ca3af', marginBottom: '8px', textAlign: 'left' }}>SECTIONS ADDED SO FAR</div>
                {addedSections.map(s => (
                  <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: SECTION_COLORS[s.type] || '#9ca3af', flexShrink: 0 }} />
                    <span style={{ fontSize: '13px', color: '#374151' }}>{s.name || SECTION_LABELS[s.type]}</span>
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