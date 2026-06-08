import React, { useState, useRef, useEffect, useCallback } from 'react';
import { TemplateSection, SectionType } from '../types';
import { buildUniversalSections, SUBJECT_EXTRAS, SUBJECTS } from '../data/starterComments';

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

// ─── SECTION DEFINITIONS ─────────────────────────────────────────────────────
// Each selectable section card shown on the section picker screen.

interface SectionDef {
  id: string;
  label: string;
  description: string;
  type: SectionType;
  isSubjectSpecific?: boolean;
  subjectKey?: string; // matches key in SUBJECT_EXTRAS
  starterKey?: string; // key to find in universal starters
}

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

const SUBJECT_ICONS: Record<string, string> = {
  'PE': '🏃', 'English': '📖', 'Maths': '📐', 'Science': '🔬',
  'History': '🏛️', 'Geography': '🌍', 'Modern Languages': '💬',
  'Art & Design': '🎨', 'Music': '🎵', 'Generic': '📋',
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

// Build a list of AddedSection objects from selected section IDs and subject
function buildSectionsFromSelection(
  selectedIds: string[],
  subject: string,
  standardContent: string
): AddedSection[] {
  const universal = buildUniversalSections();
  const result: AddedSection[] = [];

  // Standard comment first if provided
  if (standardContent.trim()) {
    result.push({
      id: makeId(), type: 'standard-comment', name: 'Introduction',
      buttons: [], content: standardContent, instruction: '', showHeader: false,
    });
  }

  // Universal sections in order
  const universalMap: Record<string, AddedSection> = {};
  for (const s of universal) {
    if (!s.name) continue;
    let buttons: StatementButton[] = [];
    if (s.type === 'rated-comment') {
      buttons = [
        { name: 'Excellent', statements: s.data.comments?.excellent || [] },
        { name: 'Good', statements: s.data.comments?.good || [] },
        { name: 'Satisfactory', statements: s.data.comments?.satisfactory || [] },
        { name: 'Needs Improvement', statements: s.data.comments?.needsImprovement || [] },
      ];
    } else if (s.type === 'qualities') {
      buttons = Object.entries(s.data.comments || {}).map(([k, v]) => ({ name: k, statements: v as string[] }));
    } else if (s.type === 'next-steps') {
      buttons = Object.entries(s.data.focusAreas || {}).map(([k, v]) => ({ name: k, statements: v as string[] }));
    }
    universalMap[s.name] = {
      id: makeId(), type: s.type as SectionType, name: s.name!,
      buttons, content: '', instruction: '', showHeader: false,
    };
  }

  // Subject extras map
  const extrasMap: Record<string, AddedSection> = {};
  const subjectExtras = SUBJECT_EXTRAS[subject] || [];
  for (const extra of subjectExtras) {
    let buttons: StatementButton[] = [];
    if (extra.section.type === 'rated-comment') {
      buttons = [
        { name: 'Excellent', statements: extra.section.data.comments?.excellent || [] },
        { name: 'Good', statements: extra.section.data.comments?.good || [] },
        { name: 'Satisfactory', statements: extra.section.data.comments?.satisfactory || [] },
        { name: 'Needs Improvement', statements: extra.section.data.comments?.needsImprovement || [] },
      ];
    } else if (extra.section.type === 'qualities') {
      buttons = Object.entries(extra.section.data.comments || {}).map(([k, v]) => ({ name: k, statements: v as string[] }));
    } else if (extra.section.type === 'next-steps') {
      buttons = Object.entries(extra.section.data.focusAreas || {}).map(([k, v]) => ({ name: k, statements: v as string[] }));
    }
    extrasMap[extra.id] = {
      id: makeId(), type: extra.section.type as SectionType, name: extra.label,
      buttons, content: '', instruction: '', showHeader: false,
    };
  }

  // Add in selected order
  for (const id of selectedIds) {
    if (universalMap[id]) result.push(universalMap[id]);
    else if (extrasMap[id]) result.push(extrasMap[id]);
  }

  return result;
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

type Screen = 'subject' | 'standard-comment' | 'section-picker' | 'section-editor' | 'review';

const BuildAsYouGo: React.FC<BuildAsYouGoProps> = ({ templateName, classId, onComplete, onCancel }) => {

  const reportsPanelScrollRef = useRef<number>(0);
  const reportsPanelRef = useRef<HTMLTextAreaElement>(null);
  const handleReportsPanelScroll = useCallback((e: React.UIEvent<HTMLTextAreaElement>) => {
    reportsPanelScrollRef.current = e.currentTarget.scrollTop;
  }, []);
  useEffect(() => {
    if (reportsPanelRef.current) reportsPanelRef.current.scrollTop = reportsPanelScrollRef.current;
  });

  // ─── TOP-LEVEL FLOW STATE ─────────────────────────────────────────────────
  const [screen, setScreen] = useState<Screen>('subject');
  const [subject, setSubject] = useState<string>('');
  const [standardContent, setStandardContent] = useState('');
  const [hasStandardComment, setHasStandardComment] = useState<boolean | null>(null);

  // Section picker state
  const [selectedSectionIds, setSelectedSectionIds] = useState<string[]>([]);

  // Sections being edited (built from selection)
  const [addedSections, setAddedSections] = useState<AddedSection[]>([]);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);

  // Reports panel
  const [reportsPanelOpen, setReportsPanelOpen] = useState(true);
  const [pastedReports, setPastedReports] = useState('');
  const hasReports = pastedReports.trim().length > 50;

  // Section editor state
  const [buttons, setButtons] = useState<StatementButton[]>([]);
  const [activeButtonIndex, setActiveButtonIndex] = useState(0);
  const [newStatement, setNewStatement] = useState('');
  const [newButtonName, setNewButtonName] = useState('');
  const [addingNewButton, setAddingNewButton] = useState(false);
  const [namingButtonIndex, setNamingButtonIndex] = useState<number | null>(null);
  const [namingButtonValue, setNamingButtonValue] = useState('');
  const [editingStatementKey, setEditingStatementKey] = useState<{ buttonIdx: number; stmtIdx: number } | null>(null);
  const [editingStatementValue, setEditingStatementValue] = useState('');
  const [movingStatementKey, setMovingStatementKey] = useState<{ buttonIdx: number; stmtIdx: number } | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Review screen
  const [reviewViewMode, setReviewViewMode] = useState<'reports' | 'test-report'>('reports');
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const dragSourceIndex = useRef<number | null>(null);

  const statementInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (addedSections.length > 0) saveDraft(templateName, addedSections);
  }, [addedSections, templateName]);

  // Initialise section picker selection when arriving at that screen
  useEffect(() => {
    if (screen === 'section-picker' && selectedSectionIds.length === 0 && subject) {
      const universal = buildUniversalSections().filter(s => s.name && s.type !== 'new-line' && s.type !== 'optional-additional-comment');
      const subjectExtras = SUBJECT_EXTRAS[subject] || [];
      setSelectedSectionIds([
        ...universal.map(s => s.name!),
        ...subjectExtras.map(e => e.id),
      ]);
    }
  }, [screen, subject]);

  // ─── STYLES ───────────────────────────────────────────────────────────────
  const primaryBtn: React.CSSProperties = { backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', padding: '11px 24px', fontSize: '15px', fontWeight: '600', cursor: 'pointer' };
  const secondaryBtn: React.CSSProperties = { backgroundColor: '#f3f4f6', color: '#374151', border: 'none', borderRadius: '8px', padding: '11px 24px', fontSize: '15px', fontWeight: '500', cursor: 'pointer' };
  const smallBtn = (color: string): React.CSSProperties => ({ backgroundColor: color, color: 'white', border: 'none', borderRadius: '6px', padding: '6px 14px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' });
  const inp: React.CSSProperties = { width: '100%', padding: '10px 14px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', textAlign: 'left' };
  const txa: React.CSSProperties = { ...inp, resize: 'vertical' };

  const currentSection = addedSections[currentSectionIndex];
  const isRatedFixed = currentSection?.type === 'rated-comment';
  const isAssessment = currentSection?.type === 'assessment-comment';
  const accentColor = currentSection ? (SECTION_COLORS[currentSection.type] || '#3b82f6') : '#3b82f6';

  // ─── TOP BAR ──────────────────────────────────────────────────────────────
  const TopBar = ({ title }: { title?: string }) => (
    <div style={{ backgroundColor: 'white', borderBottom: '1px solid #e5e7eb', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
      <div style={{ fontSize: '14px', fontWeight: '600', color: '#374151' }}>{title || templateName}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {screen === 'section-editor' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '120px', height: '4px', backgroundColor: '#e5e7eb', borderRadius: '2px' }}>
              <div style={{ width: `${((currentSectionIndex + 1) / addedSections.length) * 100}%`, height: '100%', backgroundColor: '#3b82f6', borderRadius: '2px', transition: 'width 0.3s ease' }} />
            </div>
            <span style={{ fontSize: '12px', color: '#6b7280' }}>{currentSectionIndex + 1}/{addedSections.length}</span>
          </div>
        )}
        {(screen === 'section-editor' || screen === 'review') && (
          <button onClick={() => setReportsPanelOpen(o => !o)}
            style={{ backgroundColor: '#f3f4f6', color: '#6b7280', border: '1px solid #d1d5db', borderRadius: '6px', padding: '6px 14px', fontSize: '13px', fontWeight: '500', cursor: 'pointer' }}>
            {reportsPanelOpen ? 'Hide reports' : '📄 Show reports'}
          </button>
        )}
        <button onClick={handleCancel} style={{ background: 'none', border: 'none', color: '#9ca3af', fontSize: '13px', cursor: 'pointer' }}>← Back</button>
      </div>
    </div>
  );

  // ─── REPORTS PANEL ────────────────────────────────────────────────────────
  const ReportsPanel = () => (
    <div style={{ flex: '0 0 44%', borderLeft: '1px solid #e5e7eb', backgroundColor: 'white', display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #f3f4f6', flexShrink: 0 }}>
        <div style={{ fontSize: '13px', fontWeight: '600', color: '#374151' }}>
          Your existing reports
          {hasReports && <span style={{ color: '#10b981', fontWeight: '500', marginLeft: '8px' }}>✓ Ready for AI</span>}
        </div>
        <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>Paste here — AI uses these when you click "Find in my reports"</div>
      </div>
      <div style={{ flex: 1, padding: '12px 16px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <textarea ref={reportsPanelRef} value={pastedReports} onChange={e => setPastedReports(e.target.value)}
          onScroll={handleReportsPanelScroll}
          placeholder="Paste your existing reports here. Separate each with a blank line or ---."
          style={{ flex: 1, width: '100%', padding: '10px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '12px', lineHeight: '1.7', outline: 'none', resize: 'none', boxSizing: 'border-box', fontFamily: 'inherit', color: '#374151' }} />
      </div>
    </div>
  );

  // ─── CANCEL ───────────────────────────────────────────────────────────────
  const handleCancel = () => {
    if (addedSections.length > 0 || screen === 'section-editor') {
      if (!window.confirm('Are you sure you want to go back? Your progress will be lost.')) return;
    }
    onCancel();
  };

  // ─── COMPLETE ─────────────────────────────────────────────────────────────
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

  // ─── SECTION EDITOR HANDLERS ─────────────────────────────────────────────

  // Load a section's buttons into editor state
  const loadSectionIntoEditor = (section: AddedSection) => {
    setButtons(section.buttons.length > 0 ? section.buttons.map(b => ({ ...b, statements: [...b.statements] })) : []);
    setActiveButtonIndex(0);
    setNewStatement('');
    setNewButtonName('');
    setAddingNewButton(false);
    setNamingButtonIndex(null);
    setNamingButtonValue('');
    setAiError(null);
    setEditingStatementKey(null);
    setMovingStatementKey(null);
  };

  // Save editor state back to addedSections
  const saveEditorToSection = () => {
    setAddedSections(prev => prev.map((s, i) =>
      i === currentSectionIndex ? { ...s, buttons } : s
    ));
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
    setButtons(prev => { const u = [...prev]; const ss = [...u[bi].statements]; ss[si] = editingStatementValue.trim(); u[bi] = { ...u[bi], statements: ss }; return u; });
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

  const handleConfirmButtonName = () => {
    if (!namingButtonValue.trim()) return;
    setButtons(prev => { const u = [...prev]; u[namingButtonIndex!] = { ...u[namingButtonIndex!], name: namingButtonValue.trim() }; return u; });
    setNamingButtonIndex(null); setNamingButtonValue('');
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
    if (!hasReports || !currentSection) return;
    setAiLoading(true); setAiError(null);
    try {
      const existingStatements: string[] = [];
      buttons.forEach(b => { if (b.name && b.statements.length > 0) existingStatements.push(...b.statements); });
      if (!existingStatements.length) {
        setAiError('The pre-populated statements will be used as examples for the AI to match against your reports.');
        setAiLoading(false); return;
      }
      const positionType = currentSection.type === 'next-steps' ? 'next-steps'
        : currentSection.type === 'rated-comment' ? 'rating'
        : currentSection.type === 'assessment-comment' ? 'assessment-comment'
        : 'qualities';

      const response = await fetch(SUPABASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'extract-only',
          subject: currentSection.name,
          yearGroup: '',
          reportText: pastedReports,
          pronounSet: 'they/their',
          openerType: 'name',
          sectionName: currentSection.name,
          positionType,
          selectedText: existingStatements.slice(0, 4).join('\n'),
          scaleType: isRatedFixed ? 'four-level' : 'own',
        }),
      });

      if (!response.ok) throw new Error('failed');
      const data = await response.json();
      const headings: { name: string; comments: string[] }[] = data.headings || [];

      if (headings.length === 0) {
        setAiError('No matching sentences found in your reports for this section.');
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
      setAiError('AI extraction failed. Please try again.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleSectionNext = () => {
    // Save current editor state back
    const updated = [...addedSections];
    updated[currentSectionIndex] = { ...updated[currentSectionIndex], buttons };
    setAddedSections(updated);

    if (currentSectionIndex < addedSections.length - 1) {
      const nextSection = updated[currentSectionIndex + 1];
      setCurrentSectionIndex(i => i + 1);
      loadSectionIntoEditor(nextSection);
    } else {
      setScreen('review');
    }
  };

  const handleSectionBack = () => {
    const updated = [...addedSections];
    updated[currentSectionIndex] = { ...updated[currentSectionIndex], buttons };
    setAddedSections(updated);

    if (currentSectionIndex > 0) {
      const prevSection = updated[currentSectionIndex - 1];
      setCurrentSectionIndex(i => i - 1);
      loadSectionIntoEditor(prevSection);
    } else {
      setScreen('section-picker');
    }
  };

  // ─── REVIEW HANDLERS ──────────────────────────────────────────────────────
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
  const handleRemoveSection = (id: string) => setAddedSections(prev => prev.filter(s => s.id !== id));
  const handleToggleHeader = (id: string) => setAddedSections(prev => prev.map(s => s.id === id ? { ...s, showHeader: !s.showHeader } : s));
  const handleAddSpecialSection = (type: 'new-line' | 'optional-additional-comment', afterIndex: number) => {
    const newSection: AddedSection = { id: makeId(), type: type as SectionType, name: type === 'new-line' ? '' : 'Additional Comments', buttons: [], content: '', instruction: '', showHeader: false };
    setAddedSections(prev => { const u = [...prev]; u.splice(afterIndex + 1, 0, newSection); return u; });
  };

  // ─── SCREEN: SUBJECT PICKER ───────────────────────────────────────────────

  if (screen === 'subject') {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', display: 'flex', flexDirection: 'column' }}>
        <TopBar title="Build as You Go" />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 24px' }}>
          <div style={{ maxWidth: '560px', width: '100%', backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.07)', padding: '40px 44px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#111827', marginBottom: '8px' }}>What subject are you teaching?</h2>
            <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '28px', lineHeight: '1.6' }}>
              This unlocks subject-specific sections alongside the universal ones like Progress, Effort and Behaviour.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '28px' }}>
              {SUBJECTS.map(s => (
                <button key={s} onClick={() => { setSubject(s); setScreen('standard-comment'); }}
                  style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 16px', backgroundColor: 'white', border: '2px solid #e5e7eb', borderRadius: '10px', cursor: 'pointer', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#111827' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.backgroundColor = '#eff6ff'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.backgroundColor = 'white'; }}>
                  <span style={{ fontSize: '22px' }}>{SUBJECT_ICONS[s]}</span>
                  <span>{s}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── SCREEN: STANDARD COMMENT ─────────────────────────────────────────────

  if (screen === 'standard-comment') {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', display: 'flex', flexDirection: 'column' }}>
        <TopBar title="Build as You Go" />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 24px' }}>
          <div style={{ maxWidth: '560px', width: '100%', backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.07)', padding: '40px 44px' }}>
            <div style={{ display: 'inline-block', backgroundColor: '#d1fae520', color: '#10b981', border: '1px solid #10b98140', borderRadius: '20px', padding: '4px 12px', fontSize: '12px', fontWeight: '600', marginBottom: '16px' }}>
              Fixed Statement
            </div>
            <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#111827', marginBottom: '10px' }}>
              Do your reports contain fixed statements that all pupils receive?
            </h2>
            <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '24px', lineHeight: '1.6' }}>
              For example, an introduction sentence or closing remark that is the same for every pupil.
            </p>

            {hasStandardComment === null && (
              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={() => setHasStandardComment(true)} style={{ ...primaryBtn, flex: 1 }}>Yes</button>
                <button onClick={() => { setHasStandardComment(false); setScreen('section-picker'); }} style={{ ...secondaryBtn, flex: 1 }}>No</button>
              </div>
            )}

            {hasStandardComment === true && (
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>Paste your statement here:</label>
                <textarea value={standardContent} onChange={e => setStandardContent(e.target.value)}
                  placeholder="e.g. It has been a pleasure teaching [Name] this term..."
                  style={{ ...txa, minHeight: '120px', borderColor: '#10b981', marginBottom: '20px' }} />
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button onClick={() => setHasStandardComment(null)} style={secondaryBtn}>← Back</button>
                  <button onClick={() => setScreen('section-picker')} style={primaryBtn}>
                    {standardContent.trim() ? 'Continue →' : 'Skip →'}
                  </button>
                </div>
              </div>
            )}

            {hasStandardComment === null && (
              <div style={{ marginTop: '16px' }}>
                <button onClick={() => setScreen('subject')} style={{ background: 'none', border: 'none', color: '#9ca3af', fontSize: '13px', cursor: 'pointer', padding: 0 }}>← Change subject</button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ─── SCREEN: SECTION PICKER ───────────────────────────────────────────────

  if (screen === 'section-picker') {
    const universal = buildUniversalSections().filter(s => s.name && s.type !== 'new-line' && s.type !== 'optional-additional-comment');
    const subjectExtras = SUBJECT_EXTRAS[subject] || [];

    // Build full list of selectable section IDs
    const allUniversalIds = universal.map(s => s.name!);
    const allExtraIds = subjectExtras.map(e => e.id);

    const toggleSection = (id: string) => {
      setSelectedSectionIds(prev =>
        prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
      );
    };

    const handleConfirmSections = () => {
      if (selectedSectionIds.length === 0) { alert('Please select at least one section.'); return; }
      const sections = buildSectionsFromSelection(selectedSectionIds, subject, standardContent);
      setAddedSections(sections);
      setCurrentSectionIndex(0);
      loadSectionIntoEditor(sections[0]);
      setScreen('section-editor');
    };

    const SectionCard = ({ id, label, description, type, checked }: { id: string; label: string; description: string; type: SectionType; checked: boolean }) => (
      <button onClick={() => toggleSection(id)}
        style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '14px 16px', backgroundColor: checked ? (SECTION_COLORS[type] + '08') : 'white', border: `2px solid ${checked ? SECTION_COLORS[type] : '#e5e7eb'}`, borderRadius: '10px', cursor: 'pointer', textAlign: 'left', width: '100%', transition: 'all 0.15s' }}>
        <div style={{ width: '20px', height: '20px', borderRadius: '4px', backgroundColor: checked ? SECTION_COLORS[type] : 'white', border: `2px solid ${checked ? SECTION_COLORS[type] : '#d1d5db'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '1px', fontSize: '12px', color: 'white', fontWeight: '700' }}>
          {checked ? '✓' : ''}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827', marginBottom: '2px' }}>{label}</div>
          <div style={{ fontSize: '12px', color: '#6b7280' }}>{description}</div>
        </div>
        <div style={{ fontSize: '11px', color: SECTION_COLORS[type], backgroundColor: SECTION_COLORS[type] + '15', padding: '2px 8px', borderRadius: '10px', fontWeight: '600', flexShrink: 0, alignSelf: 'flex-start' }}>
          {SECTION_LABELS[type]}
        </div>
      </button>
    );

    const typeDescriptions: Record<string, string> = {
      'rated-comment': 'Excellent / Good / Satisfactory / Needs Improvement',
      'qualities': 'Teacher picks from named comment buttons',
      'next-steps': 'Target / focus area buttons',
    };

    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', display: 'flex', flexDirection: 'column' }}>
        <TopBar title="Build as You Go" />
        <div style={{ flex: 1, overflowY: 'auto', padding: '32px 24px' }}>
          <div style={{ maxWidth: '640px', margin: '0 auto' }}>
            <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#111827', marginBottom: '8px' }}>
              Choose your sections
            </h2>
            <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px', lineHeight: '1.6' }}>
              All sections come pre-populated with generic statements ready to use. You'll review and edit each one — and can use AI to add sentences from your own reports.
            </p>
            <div style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', color: '#1e40af', marginBottom: '28px' }}>
              Untick any sections you don't need. You can always add or remove sections after the template is built.
            </div>

            {/* Universal sections */}
            <div style={{ fontSize: '12px', fontWeight: '700', color: '#6b7280', letterSpacing: '0.05em', marginBottom: '10px' }}>UNIVERSAL — WORKS FOR ANY SUBJECT</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
              {universal.map(s => (
                <SectionCard key={s.name!} id={s.name!} label={s.name!}
                  description={typeDescriptions[s.type] || SECTION_LABELS[s.type]}
                  type={s.type as SectionType}
                  checked={selectedSectionIds.includes(s.name!)} />
              ))}
            </div>

            {/* Subject-specific extras */}
            {subjectExtras.length > 0 && (
              <>
                <div style={{ fontSize: '12px', fontWeight: '700', color: '#6b7280', letterSpacing: '0.05em', marginBottom: '10px' }}>
                  {subject.toUpperCase()} — SUBJECT-SPECIFIC
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '28px' }}>
                  {subjectExtras.map(extra => (
                    <SectionCard key={extra.id} id={extra.id} label={extra.label}
                      description={typeDescriptions[extra.section.type] || SECTION_LABELS[extra.section.type]}
                      type={extra.section.type as SectionType}
                      checked={selectedSectionIds.includes(extra.id)} />
                  ))}
                </div>
              </>
            )}

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button onClick={() => setScreen('standard-comment')} style={secondaryBtn}>← Back</button>
              <button onClick={handleConfirmSections} style={primaryBtn}>
                Review {selectedSectionIds.length} section{selectedSectionIds.length !== 1 ? 's' : ''} →
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── SCREEN: SECTION EDITOR ───────────────────────────────────────────────

  if (screen === 'section-editor' && currentSection) {
    const totalStmts = buttons.reduce((n, b) => n + b.statements.length, 0);

    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <TopBar />
        <div style={{ flex: 1, display: 'flex', width: '100%', overflow: 'hidden', minHeight: 0 }}>
          <div style={{ flex: 1, overflowY: 'auto', padding: '32px 40px', minWidth: 0 }}>
            <div style={{ maxWidth: '560px', width: '100%', margin: '0 auto' }}>

              <div style={{ display: 'inline-block', backgroundColor: accentColor + '20', color: accentColor, border: `1px solid ${accentColor}40`, borderRadius: '20px', padding: '4px 12px', fontSize: '12px', fontWeight: '600', marginBottom: '16px' }}>
                {SECTION_LABELS[currentSection.type]}
              </div>

              <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#111827', marginBottom: '6px' }}>{currentSection.name}</h2>
              <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '16px', lineHeight: '1.6' }}>
                Pre-populated statements are loaded below. Edit or delete any that don't sound like you, add your own, or use AI to find matching sentences from your existing reports.
              </p>

              {/* Statement count indicator */}
              <div style={{ backgroundColor: totalStmts > 0 ? '#f0fdf4' : '#fffbeb', border: `1px solid ${totalStmts > 0 ? '#bbf7d0' : '#fde68a'}`, borderRadius: '8px', padding: '10px 14px', fontSize: '13px', color: totalStmts > 0 ? '#166534' : '#78350f', marginBottom: '20px' }}>
                {totalStmts > 0
                  ? `✓ ${totalStmts} statement${totalStmts !== 1 ? 's' : ''} ready — edit, remove or add more below`
                  : '⚠️ No statements yet — add some below or use AI to find them from your reports'}
              </div>

              {/* Rated section */}
              {isRatedFixed && (
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'flex-start', marginBottom: '16px' }}>
                    {buttons.map((btn, i) => (
                      <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <input type="text" value={btn.name}
                            onChange={e => handleRatedButtonRename(i, e.target.value)}
                            onClick={() => { setActiveButtonIndex(i); setAddingNewButton(false); }}
                            onFocus={() => setActiveButtonIndex(i)}
                            style={{ padding: '7px 10px', border: `2px solid ${accentColor}`, borderRadius: '6px', fontSize: '13px', fontWeight: '600', outline: 'none', backgroundColor: activeButtonIndex === i ? accentColor : 'white', color: activeButtonIndex === i ? 'white' : accentColor, width: `${Math.max(80, btn.name.length * 8 + 20)}px`, minWidth: '80px', maxWidth: '180px', textAlign: 'center', cursor: 'pointer' }} />
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

              {/* Qualities / next-steps section */}
              {!isRatedFixed && currentSection.type !== 'standard-comment' && (
                <div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px', alignItems: 'center' }}>
                    {buttons.map((btn, i) => btn.name ? (
                      <button key={i} onClick={() => { setActiveButtonIndex(i); setAddingNewButton(false); setNamingButtonIndex(null); }}
                        style={{ padding: '6px 14px', border: `2px solid ${accentColor}`, borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', backgroundColor: activeButtonIndex === i && namingButtonIndex === null && !addingNewButton ? accentColor : 'white', color: activeButtonIndex === i && namingButtonIndex === null && !addingNewButton ? 'white' : accentColor }}>
                        {btn.name}{btn.statements.length > 0 && <span style={{ marginLeft: '6px', fontSize: '11px', opacity: 0.8 }}>({btn.statements.length})</span>}
                      </button>
                    ) : null)}
                    {!addingNewButton && namingButtonIndex === null && (
                      <button onClick={() => { setAddingNewButton(true); setNewButtonName(''); }}
                        style={{ padding: '6px 14px', border: `2px dashed ${accentColor}`, borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', backgroundColor: 'white', color: accentColor }}>
                        + New Button
                      </button>
                    )}
                  </div>

                  {addingNewButton && (
                    <div style={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '12px', marginBottom: '16px' }}>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>New button name:</label>
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

              {/* Statement editor for active button */}
              {(isRatedFixed || (buttons[activeButtonIndex]?.name && !addingNewButton)) && currentSection.type !== 'standard-comment' && (
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                    {isRatedFixed ? (
                      <>Statements for <span style={{ color: accentColor }}>{buttons[activeButtonIndex]?.name}</span>:</>
                    ) : (
                      <>Statements for <span style={{ color: accentColor }}>{buttons[activeButtonIndex]?.name}</span>:</>
                    )}
                  </label>

                  {/* Existing statements */}
                  {buttons[activeButtonIndex]?.statements.length > 0 && (
                    <div style={{ marginBottom: '12px' }}>
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
                                <span style={{ flex: 1, fontSize: '13px', color: '#374151', lineHeight: '1.5' }}>{stmt}</span>
                                <div style={{ display: 'flex', gap: '2px', flexShrink: 0 }}>
                                  <button onClick={() => handleStartEditStatement(activeButtonIndex, i, stmt)}
                                    title="Edit" style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: '13px', padding: '2px 4px' }}>✏️</button>
                                  {buttons.filter(b => b.name).length > 1 && (
                                    <button onClick={() => setMovingStatementKey({ buttonIdx: activeButtonIndex, stmtIdx: i })}
                                      title="Move" style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: '13px', padding: '2px 4px' }}>↔</button>
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

                  {/* Add new statement */}
                  <textarea ref={statementInputRef} value={newStatement} onChange={e => setNewStatement(e.target.value)}
                    placeholder="Type or paste a statement... Use [Name] for pupil name."
                    style={{ ...txa, minHeight: '70px', borderColor: accentColor, marginBottom: '8px' }} />
                  <button onClick={handleAddStatement} disabled={!newStatement.trim()}
                    style={{ ...smallBtn(accentColor), opacity: !newStatement.trim() ? 0.4 : 1, marginBottom: '20px' }}>+ Add statement</button>
                </div>
              )}

              {/* AI Find in Reports */}
              {hasReports && !aiLoading && currentSection.type !== 'standard-comment' && (
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ height: '1px', backgroundColor: '#f3f4f6', margin: '4px 0 14px' }} />
                  <button onClick={handleAiFindInReports}
                    style={{ width: '100%', padding: '12px 16px', backgroundColor: '#faf5ff', border: '2px solid #8b5cf6', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}
                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#f3e8ff'; }}
                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#faf5ff'; }}>
                    <span style={{ fontSize: '20px' }}>🔍</span>
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontSize: '14px', fontWeight: '700', color: '#7c3aed' }}>Find in my reports</div>
                      <div style={{ fontSize: '12px', color: '#9ca3af' }}>Uses pre-populated statements as examples to find matching sentences in your reports</div>
                    </div>
                  </button>
                </div>
              )}

              {aiLoading && (
                <div style={{ marginBottom: '16px', padding: '14px 16px', backgroundColor: '#faf5ff', border: '2px solid #8b5cf6', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {[0,1,2].map(i => <div key={i} style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#8b5cf6', animation: 'pulse 1.2s ease-in-out infinite', animationDelay: `${i * 0.2}s` }} />)}
                  </div>
                  <div style={{ fontSize: '13px', color: '#7c3aed' }}>Searching your reports...</div>
                  <style>{`@keyframes pulse{0%,100%{opacity:.3;transform:scale(.8)}50%{opacity:1;transform:scale(1.2)}}`}</style>
                </div>
              )}

              {aiError && (
                <div style={{ marginBottom: '16px', padding: '10px 14px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', fontSize: '13px', color: '#b91c1c' }}>
                  ⚠️ {aiError}
                </div>
              )}

              {!hasReports && currentSection.type !== 'standard-comment' && (
                <div style={{ marginBottom: '16px', padding: '10px 14px', backgroundColor: '#f9fafb', border: '1px dashed #d1d5db', borderRadius: '8px', fontSize: '12px', color: '#9ca3af' }}>
                  💡 Paste existing reports in the right panel to enable AI search.
                </div>
              )}

              {/* Navigation */}
              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button onClick={handleSectionBack} style={secondaryBtn}>← Back</button>
                <button onClick={handleSectionNext} style={primaryBtn}>
                  {currentSectionIndex < addedSections.length - 1 ? `Next: ${addedSections[currentSectionIndex + 1]?.name} →` : 'Review template →'}
                </button>
              </div>

              {/* Sections progress list */}
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

  // ─── SCREEN: REVIEW ───────────────────────────────────────────────────────

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
              <button onClick={() => setScreen('section-picker')} style={secondaryBtn}>← Back</button>
              <button onClick={handleComplete} style={primaryBtn}>Save template →</button>
            </div>
          </div>
        </div>

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
};

export default BuildAsYouGo;