// src/pages/ImportTemplate.tsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { TemplateSection } from '../types';

// ─── TYPES ───────────────────────────────────────────────────────────────────

type WizardStep =
  | 'paste'
  | 'preprocess'
  | 'q1_progress'
  | 'q2_qualities'
  | 'q2a_copy_qualities'
  | 'q3_different_qualities'
  | 'q3a_copy_qualities'
  | 'q4_assessment'
  | 'q4_assessment_type'
  | 'q4_assessment_count'
  | 'q4_assessment_sentence_type'
  | 'q4_assessment_examples'
  | 'q4_assessment_part2'
  | 'q4_assessment_part3'
  | 'q4_assessment_judgement'
  | 'q4_assessment_qualities'
  | 'q5_nextsteps'
  | 'q5a_more_nextsteps'
  | 'add_sections'
  | 'add_standard'
  | 'add_qualities'
  | 'add_nextsteps'
  | 'generating'
  | 'preview'
  | 'saved';

type PronounSet = 'he/his' | 'she/her' | 'they/their';
type OpenerType = 'name' | 'pronoun';
type AssessmentType = 'same-statement' | 'different-statements';
type AssessmentCount = 'one' | 'multiple';
type AssessmentSentenceType = 'one-sentence' | 'separate';
type GroupMode = 'find-more' | 'use-exactly';

interface BuiltSection {
  id: string;
  type: 'qualities' | 'next-steps' | 'assessment-comment' | 'standard-comment' | 'personalised-comment' | 'optional-additional-comment';
  name: string;
  openerType: OpenerType;
  positionType: string;
  data: any;
}

interface StandardCommentDraft {
  id: string;
  name: string;
  content: string;
}

interface GeneratedTemplate {
  name: string;
  sections: TemplateSection[];
}

const SUPABASE_URL = 'https://wozbrojwuzktwrzngllh.supabase.co/functions/v1/generate-template';

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function getPronounCapital(pronounSet: PronounSet): string {
  return pronounSet.split('/')[0].charAt(0).toUpperCase() + pronounSet.split('/')[0].slice(1);
}

function replaceScoresWithPlaceholder(text: string): string {
  return text
    .replace(/\b\d{1,3}%/g, '[Score]')
    .replace(/\b\d{1,3}\/\d{1,3}\b/g, '[Score]')
    .replace(/\b\d{1,3} out of \d{1,3}\b/gi, '[Score]');
}

function replaceNamesWithPlaceholder(text: string): string {
  // Replace capitalised words that aren't subject/topic names
  const subjectWords = new Set(['Queen', 'Death', 'Scots', 'Romans', 'Black', 'Mary', 'History', 'Maths', 'Mathematics', 'English', 'Science', 'French', 'Spanish', 'PE', 'Art', 'Music', 'Drama', 'Business', 'Geography', 'Biology', 'Chemistry', 'Physics', 'Computing', 'National', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'January', 'February', 'March', 'April', 'June', 'July', 'August', 'September', 'October', 'November', 'December', 'S1', 'S2', 'S3', 'S4', 'S5', 'S6']);
  return text.replace(/\b([A-Z][a-z]{1,})\b/g, (match) => {
    if (subjectWords.has(match)) return match;
    return '[Name]';
  });
}

function buildSameStatementSection(name: string, examples: string[]): BuiltSection {
  const validExamples = examples.filter(e => e.trim().length > 5);
  const cleanedComments = validExamples.map(e => {
    let cleaned = replaceNamesWithPlaceholder(e.trim());
    cleaned = replaceScoresWithPlaceholder(cleaned);
    return cleaned;
  });
  const unique = [...new Set(cleanedComments)];
  return {
    id: `section_${Date.now()}`,
    type: 'personalised-comment',
    name,
    openerType: 'name',
    positionType: 'personalised-comment',
    data: {
      instruction: 'Enter the assessment score for this pupil',
      categories: { 'Assessment Score': unique.length > 0 ? unique : ['[Name] scored [Score] in the assessment.'] },
    },
  };
}

// Build section directly from teacher's examples without calling Claude
function buildExactSection(name: string, positionType: string, openerType: OpenerType, pronounCapital: string, examples: string[]): { sectionName: string; headings: { name: string; comments: string[] }[] } {
  const cleanedComments = examples
    .filter(e => e.trim().length > 5)
    .map(e => {
      let cleaned = replaceNamesWithPlaceholder(e.trim());
      cleaned = replaceScoresWithPlaceholder(cleaned);
      // Apply opener type
      if (openerType === 'pronoun') {
        cleaned = cleaned.replace(/^\[Name\]/, pronounCapital);
      }
      return cleaned;
    });

  return {
    sectionName: name,
    headings: [{ name: 'Option', comments: [...new Set(cleanedComments)] }],
  };
}

async function callGroup(params: {
  subject: string;
  yearGroup: string;
  reportText: string;
  pronounSet: PronounSet;
  examples: string[];
  positionType: string;
  openerType: OpenerType;
  sectionName: string;
}): Promise<{ sectionName: string; headings: { name: string; comments: string[] }[] }> {
  const response = await fetch(SUPABASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mode: 'group', ...params }),
  });
  if (!response.ok) throw new Error('Failed to group sentences');
  return response.json();
}

async function callRewrite(params: {
  pronounSet: PronounSet;
  openerType: OpenerType;
  sourceSection: any;
}): Promise<{ sectionName: string; headings: { name: string; comments: string[] }[] }> {
  const response = await fetch(SUPABASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mode: 'rewrite', ...params }),
  });
  if (!response.ok) throw new Error('Failed to rewrite section');
  return response.json();
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────

export default function ImportTemplate() {
  const navigate = useNavigate();
  const { addTemplate } = useData();

  const [step, setStep] = useState<WizardStep>('paste');
  const [subject, setSubject] = useState('');
  const [yearGroup, setYearGroup] = useState('');
  const [pronounSet, setPronounSet] = useState<PronounSet>('they/their');
  const [rawReportText, setRawReportText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [isMobile] = useState(window.innerWidth <= 768);

  const [standardComments, setStandardComments] = useState<StandardCommentDraft[]>([]);
  const [scName, setScName] = useState('');
  const [scContent, setScContent] = useState('');

  const [builtSections, setBuiltSections] = useState<BuiltSection[]>([]);
  const [currentExamples, setCurrentExamples] = useState<string[]>(['', '', '', '', '']);
  const [qualitiesGroupIndex, setQualitiesGroupIndex] = useState(0);
  const [nextStepsSentenceIndex, setNextStepsSentenceIndex] = useState(1);
  const [lastQualitiesResult, setLastQualitiesResult] = useState<any>(null);
  const [groupMode, setGroupMode] = useState<GroupMode>('find-more');

  // Add sections state
  const [addSectionType, setAddSectionType] = useState<string>('');
  const [addSectionName, setAddSectionName] = useState('');
  const [addSectionContent, setAddSectionContent] = useState('');
  const [addSectionOpener, setAddSectionOpener] = useState<OpenerType>('name');
  const [addSectionExamples, setAddSectionExamples] = useState<string[]>(['', '', '', '', '']);

  // Assessment flow
  const [assessmentType, setAssessmentType] = useState<AssessmentType>('same-statement');
  const [assessmentCount, setAssessmentCount] = useState<AssessmentCount>('one');
  const [assessmentSentenceType, setAssessmentSentenceType] = useState<AssessmentSentenceType>('separate');
  const [assessmentPartIndex, setAssessmentPartIndex] = useState(1);
  const [totalAssessmentParts, setTotalAssessmentParts] = useState(2);

  const [generatedTemplate, setGeneratedTemplate] = useState<GeneratedTemplate | null>(null);
  const [refineText, setRefineText] = useState('');
  const [isRefining, setIsRefining] = useState(false);

  // ─── STYLES ────────────────────────────────────────────────────────────────

  const card: React.CSSProperties = { backgroundColor: 'white', borderRadius: '10px', border: '1px solid #e5e7eb', padding: '20px', marginBottom: '16px' };
  const lbl: React.CSSProperties = { display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' };
  const inp: React.CSSProperties = { width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' };
  const txa: React.CSSProperties = { width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', resize: 'vertical' };
  const btnP: React.CSSProperties = { backgroundColor: '#3b82f6', color: 'white', padding: '10px 18px', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' };
  const btnS: React.CSSProperties = { backgroundColor: '#f3f4f6', color: '#374151', padding: '10px 18px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', fontWeight: '500', cursor: 'pointer' };
  const btnG: React.CSSProperties = { backgroundColor: '#10b981', color: 'white', padding: '10px 18px', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' };
  const btnV: React.CSSProperties = { backgroundColor: '#8b5cf6', color: 'white', padding: '10px 18px', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' };

  const pronounCapital = getPronounCapital(pronounSet);

  // ─── HANDLERS ─────────────────────────────────────────────────────────────

  const resetExamples = () => setCurrentExamples(['', '', '', '', '']);
  const getValidExamples = () => currentExamples.filter(e => e.trim().length > 5);

  const handleAddStandardComment = () => {
    if (!scName.trim() || !scContent.trim()) return;
    setStandardComments(prev => [...prev, { id: Date.now().toString(), name: scName.trim(), content: scContent.trim() }]);
    setScName(''); setScContent('');
  };

  const addSectionFromResult = (result: any, positionType: string, openerType: OpenerType): BuiltSection => {
    const isNextSteps = positionType === 'next-steps' || positionType === 'development';
    return {
      id: `section_${Date.now()}`,
      type: isNextSteps ? 'next-steps' : positionType === 'assessment-comment' ? 'assessment-comment' : 'qualities',
      name: result.sectionName,
      openerType,
      positionType,
      data: isNextSteps
        ? { focusAreas: Object.fromEntries(result.headings.map((h: any) => [h.name, h.comments])) }
        : positionType === 'assessment-comment'
        ? { scoreType: 'percentage', comments: buildAssessmentComments(result.headings) }
        : { comments: Object.fromEntries(result.headings.map((h: any) => [h.name, h.comments])) },
    };
  };

  const handleGroupAndAdd = async (positionType: string, openerType: OpenerType, sectionName: string, nextStep: WizardStep, useExactly = false) => {
    const examples = getValidExamples();
    if (examples.length === 0) { setError('Please paste at least one example sentence.'); return; }
    setError(null);
    setIsLoading(true);
    setLoadingMessage(useExactly ? 'Building section from your examples...' : 'Reading your reports and grouping sentences...');

    try {
      let result: any;
      if (useExactly) {
        result = buildExactSection(sectionName, positionType, openerType, pronounCapital, examples);
      } else {
        result = await callGroup({ subject, yearGroup, reportText: rawReportText, pronounSet, examples, positionType, openerType, sectionName });
      }

      const newSection = addSectionFromResult(result, positionType, openerType);
      setBuiltSections(prev => [...prev, newSection]);

      if (positionType !== 'next-steps' && positionType !== 'development' && positionType !== 'assessment-comment') {
        setLastQualitiesResult(result);
      }

      resetExamples();
      setGroupMode('find-more');
      setStep(nextStep);
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopySection = async (openerType: OpenerType, repeatStep: WizardStep) => {
    if (!lastQualitiesResult) return;
    setError(null);
    setIsLoading(true);
    setLoadingMessage('Rewriting section with ' + (openerType === 'pronoun' ? pronounCapital : '[Name]') + '...');
    try {
      const rewritten = await callRewrite({ pronounSet, openerType, sourceSection: lastQualitiesResult });
      const newSection: BuiltSection = {
        id: `section_${Date.now()}`,
        type: 'qualities',
        name: rewritten.sectionName + (openerType === 'pronoun' ? ` — ${pronounCapital}-led` : ' — [Name]-led'),
        openerType,
        positionType: 'qualities',
        data: { comments: Object.fromEntries(rewritten.headings.map((h: any) => [h.name, h.comments])) },
      };
      setBuiltSections(prev => [...prev, newSection]);
      setStep(repeatStep);
    } catch (err: any) {
      setError(err.message || 'Rewrite failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const buildAssessmentComments = (headings: any[]) => {
    const levels: Record<string, string[]> = { excellent: [], good: [], satisfactory: [], needsImprovement: [], notCompleted: [] };
    headings.forEach(h => {
      const name = h.name.toLowerCase();
      if (name.includes('excellent') || name.includes('strong') || name.includes('outstanding') || name.includes('very well')) levels.excellent.push(...h.comments);
      else if (name.includes('good') || name.includes('solid') || name.includes('well')) levels.good.push(...h.comments);
      else if (name.includes('satisfactory') || name.includes('some') || name.includes('challenge')) levels.satisfactory.push(...h.comments);
      else if (name.includes('improvement') || name.includes('weak') || name.includes('poor') || name.includes('difficult')) levels.needsImprovement.push(...h.comments);
      else if (name.includes('completed') || name.includes('absent') || name.includes('missed')) levels.notCompleted.push(...h.comments);
      else levels.good.push(...h.comments);
    });
    if (levels.excellent.length === 0) levels.excellent = ['[Name] scored [Score] — an excellent result, keep it up!', '[Name] achieved [Score] — a fantastic result.', '[Name] scored [Score], showing excellent understanding.', '[Name] achieved [Score] — a great result to be really proud of.'];
    if (levels.good.length === 0) levels.good = ['[Name] scored [Score] — a good result.', '[Name] achieved [Score] — a solid performance.', '[Name] scored [Score], demonstrating good understanding.', '[Name] achieved [Score] — a positive result.'];
    if (levels.satisfactory.length === 0) levels.satisfactory = ['[Name] scored [Score] with some areas to develop.', '[Name] achieved [Score] — there are areas to work on going forward.', '[Name] scored [Score], showing understanding in several areas.', '[Name] achieved [Score] and would benefit from focused revision.'];
    if (levels.needsImprovement.length === 0) levels.needsImprovement = ['[Name] scored [Score] — this does not fully reflect their capabilities.', '[Name] achieved [Score], though they are more capable than this result suggests.', '[Name] scored [Score] and is encouraged to make use of support available.', '[Name] achieved [Score] — greater preparation will make a real difference.'];
    if (levels.notCompleted.length === 0) levels.notCompleted = ['[Name] has not yet completed this assessment.', '[Name] was absent for this assessment.'];
    return levels;
  };

  const handleAssemble = () => {
    setIsLoading(true);
    setLoadingMessage('Assembling your template...');
    setStep('generating');

    const allSections: BuiltSection[] = [
      ...standardComments.map(sc => ({
        id: sc.id,
        type: 'standard-comment' as const,
        name: sc.name,
        positionType: 'standard',
        openerType: 'name' as OpenerType,
        data: { content: sc.content },
      })),
      ...builtSections,
    ];

    // Mechanical assembly — no API call needed
    fetch(SUPABASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: 'assemble', subject, yearGroup, pronounSet, builtSections: allSections }),
    })
      .then(r => r.json())
      .then(data => {
        if (!data.templateName || !data.sections) throw new Error('Invalid template structure');
        setGeneratedTemplate({ name: data.templateName, sections: data.sections });
        setStep('preview');
      })
      .catch(err => {
        setError(err.message || 'Assembly failed. Please try again.');
        setStep('add_sections');
      })
      .finally(() => setIsLoading(false));
  };

  const handleRefine = async () => {
    if (!refineText.trim() || refineText.length < 200) { setError('Please paste more reports — at least 200 characters needed.'); return; }
    setError(null); setIsRefining(true);
    try {
      const response = await fetch(SUPABASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'refine', subject, yearGroup, pronounSet, existingTemplate: { name: generatedTemplate?.name, sections: generatedTemplate?.sections }, refineText }),
      });
      if (!response.ok) throw new Error('Refinement failed');
      const data = await response.json();
      setGeneratedTemplate({ name: data.templateName, sections: data.sections });
      setRefineText('');
    } catch (err: any) { setError(err.message || 'Refinement failed.'); }
    finally { setIsRefining(false); }
  };

  const handleSave = () => {
    if (!generatedTemplate) return;
    addTemplate({ name: generatedTemplate.name, sections: generatedTemplate.sections });
    setStep('saved');
  };

  const handleEditFirst = () => {
    if (!generatedTemplate) return;
    addTemplate({ name: generatedTemplate.name, sections: generatedTemplate.sections });
    navigate('/create-template', { state: { editTemplate: { name: generatedTemplate.name, sections: generatedTemplate.sections } } });
  };

  const handleReset = () => {
    setStep('paste'); setSubject(''); setYearGroup(''); setRawReportText('');
    setPronounSet('they/their'); setStandardComments([]); setBuiltSections([]);
    setGeneratedTemplate(null); setError(null); resetExamples();
    setQualitiesGroupIndex(0); setNextStepsSentenceIndex(1);
    setAssessmentPartIndex(1); setLastQualitiesResult(null); setGroupMode('find-more');
  };

  const getSectionSummary = (section: TemplateSection): string => {
    switch (section.type) {
      case 'qualities': { const h = Object.keys(section.data?.comments || {}); return `${h.length} options: ${h.slice(0, 3).join(', ')}${h.length > 3 ? '...' : ''}`; }
      case 'standard-comment': return ((section.data?.content || '') as string).substring(0, 80) + '...';
      case 'assessment-comment': return 'Assessment with [Score] — 5 levels';
      case 'personalised-comment': return 'Teacher enters score per pupil';
      case 'next-steps': { const a = Object.keys(section.data?.focusAreas || {}); return `${a.length} focus areas`; }
      case 'new-line': return 'Line break';
      case 'optional-additional-comment': return 'Free text box';
      default: return '';
    }
  };

  const getSectionTypeColor = (type: string) => ({ 'standard-comment': '#10b981', 'assessment-comment': '#8b5cf6', 'personalised-comment': '#f59e0b', 'next-steps': '#06b6d4', 'qualities': '#f59e0b', 'new-line': '#9ca3af', 'optional-additional-comment': '#ef4444' }[type] || '#6b7280');
  const getSectionTypeLabel = (type: string) => ({ 'standard-comment': 'Standard Comment', 'assessment-comment': 'Assessment', 'personalised-comment': 'Score Entry', 'next-steps': 'Next Steps', 'qualities': 'Choice Comment', 'new-line': 'New Line', 'optional-additional-comment': 'Optional Comment' }[type] || type);

  const pronounOptions: { value: PronounSet; label: string; example: string }[] = [
    { value: 'he/his', label: 'He / His', example: 'He works hard. His effort is excellent.' },
    { value: 'she/her', label: 'She / Her', example: 'She works hard. Her effort is excellent.' },
    { value: 'they/their', label: 'They / Their', example: 'They work hard. Their effort is excellent.' },
  ];

  // ─── SHARED COMPONENTS ────────────────────────────────────────────────────

  const Header = ({ title, subtitle, onBack }: { title: string; subtitle?: string; onBack?: () => void }) => (
    <header style={{ backgroundColor: 'white', borderBottom: '1px solid #e5e7eb', padding: isMobile ? '16px' : '20px 24px', display: 'flex', alignItems: 'center', gap: '16px', position: 'sticky', top: 0, zIndex: 10 }}>
      {onBack ? <button onClick={onBack} style={btnS}>← Back</button> : <Link to="/manage-templates" style={{ textDecoration: 'none' }}><button style={btnS}>← Back</button></Link>}
      <div>
        <h1 style={{ margin: 0, fontSize: isMobile ? '18px' : '22px', fontWeight: '700', color: '#111827' }}>{title}</h1>
        {subtitle && <p style={{ margin: 0, fontSize: '13px', color: '#6b7280' }}>{subtitle}</p>}
      </div>
    </header>
  );

  const ExampleBoxes = ({ count = 5, label = 'Paste an example sentence', examples: exs = currentExamples, onChange = (i: number, v: string) => { const u = [...currentExamples]; u[i] = v; setCurrentExamples(u); } }: { count?: number; label?: string; examples?: string[]; onChange?: (i: number, v: string) => void }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i}>
          <label style={{ ...lbl, fontSize: '12px', color: '#9ca3af' }}>Example {i + 1}{i > 1 ? ' (optional)' : ''}</label>
          <input type="text" value={exs[i] || ''} onChange={e => onChange(i, e.target.value)} placeholder={label} style={inp} />
        </div>
      ))}
    </div>
  );

  const GroupModeToggle = () => (
    <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', marginTop: '4px' }}>
      <button
        onClick={() => setGroupMode('find-more')}
        style={{ flex: 1, padding: '10px', borderRadius: '8px', border: groupMode === 'find-more' ? '2px solid #3b82f6' : '1px solid #d1d5db', backgroundColor: groupMode === 'find-more' ? '#eff6ff' : 'white', cursor: 'pointer', fontSize: '13px', fontWeight: groupMode === 'find-more' ? '600' : '400', color: groupMode === 'find-more' ? '#1d4ed8' : '#374151' }}
      >
        🔍 Read all my reports and find more versions
      </button>
      <button
        onClick={() => setGroupMode('use-exactly')}
        style={{ flex: 1, padding: '10px', borderRadius: '8px', border: groupMode === 'use-exactly' ? '2px solid #10b981' : '1px solid #d1d5db', backgroundColor: groupMode === 'use-exactly' ? '#f0fdf4' : 'white', cursor: 'pointer', fontSize: '13px', fontWeight: groupMode === 'use-exactly' ? '600' : '400', color: groupMode === 'use-exactly' ? '#166534' : '#374151' }}
      >
        ✓ Use exactly these options as they are
      </button>
    </div>
  );

  const BuiltSectionsList = () => builtSections.length > 0 ? (
    <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '12px', marginBottom: '16px' }}>
      <p style={{ margin: '0 0 8px 0', fontSize: '12px', fontWeight: '600', color: '#166534' }}>✅ Sections built so far ({builtSections.length}):</p>
      {builtSections.map((s, i) => <p key={s.id} style={{ margin: '2px 0', fontSize: '12px', color: '#15803d' }}>{i + 1}. {s.name} ({s.openerType === 'pronoun' ? pronounCapital + '-led' : '[Name]-led'})</p>)}
    </div>
  ) : null;

  const ErrorBox = () => error ? (
    <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px', color: '#b91c1c', fontSize: '14px' }}>⚠️ {error}</div>
  ) : null;

  const LoadingScreen = ({ icon, title, message }: { icon: string; title: string; message: string }) => (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '48px 40px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', textAlign: 'center', maxWidth: '400px' }}>
        <div style={{ fontSize: '48px', marginBottom: '20px' }}>{icon}</div>
        <h2 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: '700', color: '#111827' }}>{title}</h2>
        <p style={{ margin: '0 0 24px 0', color: '#6b7280', fontSize: '14px' }}>{message}</p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
          {[0,1,2].map(i => <div key={i} style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#3b82f6', animation: 'pulse 1.2s ease-in-out infinite', animationDelay: `${i * 0.2}s` }} />)}
        </div>
        <style>{`@keyframes pulse{0%,100%{opacity:.3;transform:scale(.8)}50%{opacity:1;transform:scale(1.2)}}`}</style>
      </div>
    </div>
  );

  const QuestionLayout = ({ question, description, children, onNo, noLabel = 'No — skip this', onBack }: { question: string; description?: string; children: React.ReactNode; onNo: () => void; noLabel?: string; onBack?: () => void }) => (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      <Header title="🪄 Import from Reports" subtitle="Building your template" onBack={onBack} />
      <main style={{ maxWidth: '700px', margin: '0 auto', padding: isMobile ? '16px' : '32px 24px' }}>
        <BuiltSectionsList />
        <div style={card}>
          <h2 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '700', color: '#111827' }}>{question}</h2>
          {description && <p style={{ margin: '0 0 20px 0', fontSize: '14px', color: '#6b7280', lineHeight: '1.6' }}>{description}</p>}
          <ErrorBox />
          {children}
          <button onClick={onNo} style={{ ...btnS, width: '100%', marginTop: '10px' }}>{noLabel}</button>
        </div>
      </main>
    </div>
  );

  const ChoiceLayout = ({ question, description, children, onBack }: { question: string; description?: string; children: React.ReactNode; onBack?: () => void }) => (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      <Header title="🪄 Import from Reports" subtitle="Building your template" onBack={onBack} />
      <main style={{ maxWidth: '700px', margin: '0 auto', padding: isMobile ? '16px' : '32px 24px' }}>
        <BuiltSectionsList />
        <div style={card}>
          <h2 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '700', color: '#111827' }}>{question}</h2>
          {description && <p style={{ margin: '0 0 20px 0', fontSize: '14px', color: '#6b7280', lineHeight: '1.6' }}>{description}</p>}
          <ErrorBox />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>{children}</div>
        </div>
      </main>
    </div>
  );

  // ─── LOADING ──────────────────────────────────────────────────────────────

  if (isLoading && step === 'generating') return <LoadingScreen icon="🪄" title="Building Your Template" message={loadingMessage} />;
  if (isLoading) return <LoadingScreen icon="🔍" title="Reading Your Reports" message={loadingMessage} />;

  // ─── STEP: PASTE ──────────────────────────────────────────────────────────

  if (step === 'paste') return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      <Header title="🪄 Import from Reports" subtitle="Build a template from your existing reports" />
      <main style={{ maxWidth: '800px', margin: '0 auto', padding: isMobile ? '16px' : '32px 24px' }}>
        <div style={card}>
          <h2 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600', color: '#111827' }}>Template Details</h2>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '12px' }}>
            <div><label style={lbl}>Subject <span style={{ color: '#ef4444' }}>*</span></label><input type="text" value={subject} onChange={e => setSubject(e.target.value)} placeholder="e.g. History" style={inp} /></div>
            <div><label style={lbl}>Year Group</label><select value={yearGroup} onChange={e => setYearGroup(e.target.value)} style={inp}><option value="">Select year group...</option>{['S1','S2','S3','S4','S5','S6','Mixed'].map(y => <option key={y} value={y}>{y}</option>)}</select></div>
          </div>
        </div>
        <div style={card}>
          <h2 style={{ margin: '0 0 6px 0', fontSize: '16px', fontWeight: '600', color: '#111827' }}>Pronoun Set</h2>
          <p style={{ margin: '0 0 14px 0', fontSize: '13px', color: '#6b7280' }}>Choose the pronoun set for this class.</p>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '10px' }}>
            {pronounOptions.map(opt => (
              <button key={opt.value} onClick={() => setPronounSet(opt.value)} style={{ padding: '14px', borderRadius: '8px', cursor: 'pointer', textAlign: 'left', border: pronounSet === opt.value ? '2px solid #3b82f6' : '2px solid #e5e7eb', backgroundColor: pronounSet === opt.value ? '#eff6ff' : 'white' }}>
                <div style={{ fontSize: '15px', fontWeight: '700', color: pronounSet === opt.value ? '#1d4ed8' : '#111827', marginBottom: '4px' }}>{opt.label}</div>
                <div style={{ fontSize: '12px', color: '#6b7280', fontStyle: 'italic' }}>{opt.example}</div>
              </button>
            ))}
          </div>
        </div>
        <div style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div><h2 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '600', color: '#111827' }}>Paste Your Reports <span style={{ color: '#ef4444' }}>*</span></h2><p style={{ margin: 0, fontSize: '13px', color: '#6b7280' }}>Paste all your reports together — the more the better.</p></div>
            <span style={{ fontSize: '12px', color: '#6b7280', whiteSpace: 'nowrap', marginLeft: '12px' }}>{rawReportText.length.toLocaleString()} chars</span>
          </div>
          <textarea value={rawReportText} onChange={e => setRawReportText(e.target.value)} placeholder="Paste your reports here..." style={{ ...txa, minHeight: '320px' }} />
        </div>
        <ErrorBox />
        <button onClick={() => { if (!subject.trim()) { setError('Please enter the subject.'); return; } if (!rawReportText.trim()) { setError('Please paste your reports.'); return; } setError(null); setStep('preprocess'); }} style={{ ...btnP, width: '100%', padding: '16px', fontSize: '16px' }}>Next: Identify Fixed Sections →</button>
        <p style={{ textAlign: 'center', fontSize: '12px', color: '#9ca3af', marginTop: '12px' }}>Reports are not stored after processing.</p>
      </main>
    </div>
  );

  // ─── STEP: PREPROCESS ─────────────────────────────────────────────────────

  if (step === 'preprocess') return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      <Header title="🪄 Import from Reports" subtitle="Step 2 — Identify fixed sections" onBack={() => setStep('paste')} />
      <main style={{ maxWidth: '800px', margin: '0 auto', padding: isMobile ? '16px' : '32px 24px' }}>
        <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '10px', padding: '16px', marginBottom: '24px' }}>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600', color: '#92400e' }}>💡 What to do here</h3>
          <p style={{ margin: 0, fontSize: '13px', color: '#78350f', lineHeight: '1.6' }}>If your reports contain text that appears <strong>word-for-word in every report</strong> — like course descriptions, department information, or closing statements — add it here. This text appears automatically in every report without the teacher needing to choose it.</p>
        </div>
        {standardComments.length > 0 && (
          <div style={{ marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {standardComments.map(sc => (
              <div key={sc.id} style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                <div style={{ flex: 1 }}><p style={{ margin: '0 0 4px 0', fontSize: '13px', fontWeight: '600', color: '#166534' }}>✅ {sc.name}</p><p style={{ margin: 0, fontSize: '12px', color: '#15803d' }}>{sc.content.substring(0, 100)}{sc.content.length > 100 ? '...' : ''}</p></div>
                <button onClick={() => setStandardComments(prev => prev.filter(x => x.id !== sc.id))} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '18px' }}>×</button>
              </div>
            ))}
          </div>
        )}
        <div style={card}>
          <h2 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '600', color: '#111827' }}>Add Standard Comment</h2>
          <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#6b7280' }}>Text that is identical in every report.</p>
          <div style={{ marginBottom: '10px' }}><label style={lbl}>Section Name</label><input type="text" value={scName} onChange={e => setScName(e.target.value)} placeholder="e.g. Course Content, Assessment Analysis" style={inp} /></div>
          <div style={{ marginBottom: '12px' }}><label style={lbl}>Paste the exact text</label><textarea value={scContent} onChange={e => setScContent(e.target.value)} placeholder="Paste the identical text here..." style={{ ...txa, minHeight: '100px' }} /></div>
          <button onClick={handleAddStandardComment} disabled={!scName.trim() || !scContent.trim()} style={{ ...btnG, opacity: scName.trim() && scContent.trim() ? 1 : 0.5, cursor: scName.trim() && scContent.trim() ? 'pointer' : 'not-allowed' }}>+ Add Standard Comment</button>
        </div>
        <button onClick={() => setStep('q1_progress')} style={{ ...btnP, width: '100%', padding: '16px', fontSize: '16px' }}>Next: Build Your Template →</button>
        <p style={{ textAlign: 'center', fontSize: '13px', color: '#9ca3af', marginTop: '8px' }}>You can skip this if your reports don't have fixed identical sections.</p>
      </main>
    </div>
  );

  // ─── Q1: PROGRESS ─────────────────────────────────────────────────────────

  if (step === 'q1_progress') return (
    <QuestionLayout question="Do your reports include a sentence about each pupil's progress or how they are doing overall?" description="This is usually the opening sentence. Paste 3–5 examples from different reports showing different levels of progress." onNo={() => setStep('q2_qualities')} noLabel="No — my reports don't include a progress statement" onBack={() => setStep('preprocess')}>
      <GroupModeToggle />
      <ExampleBoxes label="Paste a progress sentence from one report..." />
      <button onClick={() => handleGroupAndAdd('progress', 'name', 'Opening Statement', 'q2_qualities', groupMode === 'use-exactly')} style={{ ...btnP, width: '100%', marginTop: '16px', padding: '14px' }}>
        {groupMode === 'use-exactly' ? '✓ Use exactly these options' : '✓ Read my reports and group these sentences'}
      </button>
    </QuestionLayout>
  );

  // ─── Q2: QUALITIES ────────────────────────────────────────────────────────

  if (step === 'q2_qualities') return (
    <QuestionLayout question="Do your reports include sentences describing the pupil's personal qualities?" description="Things like effort, behaviour, attitude, working style, character. Paste 3–5 examples — include both positive and less positive examples if your reports have both." onNo={() => setStep('q4_assessment')} noLabel="No — move on to assessment" onBack={() => setStep('q1_progress')}>
      <GroupModeToggle />
      <ExampleBoxes label="Paste a qualities sentence from one report..." />
      <button onClick={() => { setQualitiesGroupIndex(1); handleGroupAndAdd('qualities', 'name', 'Personal Qualities', 'q2a_copy_qualities', groupMode === 'use-exactly'); }} style={{ ...btnP, width: '100%', marginTop: '16px', padding: '14px' }}>
        {groupMode === 'use-exactly' ? '✓ Use exactly these options' : '✓ Read my reports and group these sentences'}
      </button>
    </QuestionLayout>
  );

  // ─── Q2a: COPY QUALITIES ─────────────────────────────────────────────────

  if (step === 'q2a_copy_qualities') return (
    <ChoiceLayout question="Would you like to copy this qualities statement so that you can add another pupil quality to your report?" description="You can choose to have this statement with name or pronoun to make it read better." onBack={() => setStep('q2_qualities')}>
      <button onClick={() => handleCopySection('name', 'q2a_copy_qualities')} style={{ ...btnP, padding: '14px' }}>Yes, copy with [Name]</button>
      <button onClick={() => handleCopySection('pronoun', 'q2a_copy_qualities')} style={{ ...btnV, padding: '14px' }}>Yes, copy with {pronounCapital} ({pronounSet.split('/')[0]})</button>
      <button onClick={() => setStep('q3_different_qualities')} style={{ ...btnS, padding: '14px' }}>No — move on</button>
    </ChoiceLayout>
  );

  // ─── Q3: DIFFERENT QUALITIES ─────────────────────────────────────────────

  if (step === 'q3_different_qualities') return (
    <QuestionLayout question="Do your reports include a different type of quality statement from another part of the report?" description="For example, a sentence about classroom participation, specific skills, a pathway paragraph, or a different aspect of the pupil's character not already covered." onNo={() => setStep('q4_assessment')} noLabel="No — move on to assessment" onBack={() => setStep('q2a_copy_qualities')}>
      <GroupModeToggle />
      <ExampleBoxes label="Paste an example of this different quality statement..." />
      <button onClick={() => { setQualitiesGroupIndex(prev => prev + 1); handleGroupAndAdd('qualities', 'name', `Personal Qualities ${qualitiesGroupIndex + 1}`, 'q3a_copy_qualities', groupMode === 'use-exactly'); }} style={{ ...btnP, width: '100%', marginTop: '16px', padding: '14px' }}>
        {groupMode === 'use-exactly' ? '✓ Use exactly these options' : '✓ Read my reports and group these sentences'}
      </button>
    </QuestionLayout>
  );

  // ─── Q3a: COPY DIFFERENT QUALITIES ───────────────────────────────────────

  if (step === 'q3a_copy_qualities') return (
    <ChoiceLayout question="Would you like to copy this qualities statement so that you can add another pupil quality to your report?" description="You can choose to have this statement with name or pronoun to make it read better." onBack={() => setStep('q3_different_qualities')}>
      <button onClick={() => handleCopySection('name', 'q3a_copy_qualities')} style={{ ...btnP, padding: '14px' }}>Yes, copy with [Name]</button>
      <button onClick={() => handleCopySection('pronoun', 'q3a_copy_qualities')} style={{ ...btnV, padding: '14px' }}>Yes, copy with {pronounCapital} ({pronounSet.split('/')[0]})</button>
      <button onClick={() => setStep('q3_different_qualities')} style={{ ...btnS, padding: '14px' }}>No, but add another different quality type</button>
      <button onClick={() => setStep('q4_assessment')} style={{ ...btnS, padding: '14px' }}>No — move on to assessment</button>
    </ChoiceLayout>
  );

  // ─── Q4: ASSESSMENT ───────────────────────────────────────────────────────

  if (step === 'q4_assessment') return (
    <ChoiceLayout question="Do your reports include assessment scores or percentages?" description="If your reports mention assessment results we'll create the right type of section for them." onBack={() => setStep('q3_different_qualities')}>
      <button onClick={() => setStep('q4_assessment_type')} style={{ ...btnP, padding: '14px' }}>Yes — my reports include assessment information</button>
      <button onClick={() => setStep('q5_nextsteps')} style={{ ...btnS, padding: '14px' }}>No — move on to next steps</button>
    </ChoiceLayout>
  );

  // ─── Q4: ASSESSMENT TYPE ─────────────────────────────────────────────────

  if (step === 'q4_assessment_type') return (
    <ChoiceLayout question="How do you report on the assessment score?" onBack={() => setStep('q4_assessment')}>
      <button onClick={() => { setAssessmentType('same-statement'); setStep('q4_assessment_count'); }} style={{ ...btnP, padding: '16px', textAlign: 'left' }}>
        <div style={{ fontWeight: '700', marginBottom: '4px' }}>A) Same or similar statement for every pupil</div>
        <div style={{ fontSize: '13px', opacity: 0.9 }}>Only the name and score change — e.g. "[Name] scored X% in the end of unit assessment"</div>
      </button>
      <button onClick={() => { setAssessmentType('different-statements'); setStep('q4_assessment_count'); }} style={{ ...btnV, padding: '16px', textAlign: 'left' }}>
        <div style={{ fontWeight: '700', marginBottom: '4px' }}>B) Different statements depending on how well the pupil did</div>
        <div style={{ fontSize: '13px', opacity: 0.9 }}>e.g. "performed excellently" for high scorers, "found the assessment challenging" for lower scorers</div>
      </button>
    </ChoiceLayout>
  );

  // ─── Q4: ASSESSMENT COUNT ────────────────────────────────────────────────

  if (step === 'q4_assessment_count') return (
    <ChoiceLayout question="How many assessments do you report on?" onBack={() => setStep('q4_assessment_type')}>
      <button onClick={() => { setAssessmentCount('one'); setAssessmentPartIndex(1); setStep('q4_assessment_examples'); }} style={{ ...btnP, padding: '14px' }}>A) One assessment only</button>
      <button onClick={() => { setAssessmentCount('multiple'); setStep('q4_assessment_sentence_type'); }} style={{ ...btnV, padding: '14px' }}>B) More than one assessment</button>
    </ChoiceLayout>
  );

  // ─── Q4: ASSESSMENT SENTENCE TYPE ────────────────────────────────────────

  if (step === 'q4_assessment_sentence_type') return (
    <ChoiceLayout question="How do you write about multiple assessments?" onBack={() => setStep('q4_assessment_count')}>
      <button onClick={() => { setAssessmentSentenceType('one-sentence'); setAssessmentPartIndex(1); setStep('q4_assessment_examples'); }} style={{ ...btnP, padding: '16px', textAlign: 'left' }}>
        <div style={{ fontWeight: '700', marginBottom: '4px' }}>A) One sentence covers all scores</div>
        <div style={{ fontSize: '13px', opacity: 0.9 }}>e.g. "[Name] scored X% in Test 1 and Y% in Test 2"</div>
      </button>
      <button onClick={() => { setAssessmentSentenceType('separate'); setAssessmentPartIndex(1); setStep('q4_assessment_examples'); }} style={{ ...btnV, padding: '16px', textAlign: 'left' }}>
        <div style={{ fontWeight: '700', marginBottom: '4px' }}>B) A different sentence for each assessment</div>
        <div style={{ fontSize: '13px', opacity: 0.9 }}>Each assessment gets its own separate statement</div>
      </button>
    </ChoiceLayout>
  );

  // ─── Q4: ASSESSMENT EXAMPLES ─────────────────────────────────────────────

  if (step === 'q4_assessment_examples') {
    const isOneSentenceMultiple = assessmentCount === 'multiple' && assessmentSentenceType === 'one-sentence';
    const isSeparateMultiple = assessmentCount === 'multiple' && assessmentSentenceType === 'separate';
    const partDesc = isOneSentenceMultiple
      ? assessmentPartIndex === 1 ? 'This is the start of the sentence including the first score. e.g. "[Name] scored X% in the Mary Queen of Scots assessment". We will link this to the next part.' : `This is part ${assessmentPartIndex}. e.g. "and Y% in the Black Death assessment." Start with the connecting word.`
      : assessmentType === 'same-statement'
      ? 'Paste 1–2 examples of the sentence you use. We will replace the actual score with [Score] so the teacher can type the score for each pupil.'
      : 'Paste 3–5 examples showing different performance levels so we can create options for each level.';

    return (
      <QuestionLayout
        question={isOneSentenceMultiple ? `Paste examples of part ${assessmentPartIndex} of your assessment sentence` : isSeparateMultiple ? `Paste examples for assessment ${assessmentPartIndex}` : 'Paste examples of your assessment statement'}
        description={partDesc}
        onNo={() => setStep('q5_nextsteps')}
        noLabel="Skip assessment section"
        onBack={() => setStep(assessmentCount === 'multiple' ? 'q4_assessment_sentence_type' : 'q4_assessment_count')}
      >
        <ExampleBoxes count={assessmentType === 'same-statement' ? 2 : 5} label="Paste an example from one report..." />
        {isOneSentenceMultiple && (
          <div style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '12px', marginBottom: '12px', marginTop: '8px' }}>
            <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#1e40af' }}>How many scores are in your sentence?</p>
            <div style={{ display: 'flex', gap: '8px' }}>
              {[2, 3].map(n => <button key={n} onClick={() => setTotalAssessmentParts(n)} style={{ padding: '6px 14px', borderRadius: '6px', border: totalAssessmentParts === n ? '2px solid #3b82f6' : '1px solid #d1d5db', backgroundColor: totalAssessmentParts === n ? '#eff6ff' : 'white', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>{n} scores</button>)}
            </div>
          </div>
        )}
        <button onClick={() => {
          const examples = getValidExamples();
          if (examples.length === 0) { setError('Please paste at least one example.'); return; }
          setError(null);
          if (assessmentType === 'same-statement') {
            const sectionLabel = isOneSentenceMultiple ? `Assessment — Part ${assessmentPartIndex}` : isSeparateMultiple ? `Assessment ${assessmentPartIndex}` : 'Assessment';
            const newSection = buildSameStatementSection(sectionLabel, examples);
            setBuiltSections(prev => [...prev, newSection]);
            resetExamples();
            const hasMoreParts = (isOneSentenceMultiple && assessmentPartIndex < totalAssessmentParts) || (isSeparateMultiple && assessmentPartIndex < 3);
            if (hasMoreParts) { setAssessmentPartIndex(prev => prev + 1); setStep('q4_assessment_part2'); }
            else setStep('q4_assessment_judgement');
          } else {
            const sectionLabel = isOneSentenceMultiple ? `Assessment — Part ${assessmentPartIndex}` : isSeparateMultiple ? `Assessment ${assessmentPartIndex}` : 'Assessment';
            const hasMoreParts = (isOneSentenceMultiple && assessmentPartIndex < totalAssessmentParts) || (isSeparateMultiple && assessmentPartIndex < 3);
            const nextStep: WizardStep = hasMoreParts ? 'q4_assessment_part2' : 'q4_assessment_judgement';
            handleGroupAndAdd('assessment-comment', 'name', sectionLabel, nextStep, false);
            if (hasMoreParts) setAssessmentPartIndex(prev => prev + 1);
          }
        }} style={{ ...btnP, width: '100%', marginTop: '16px', padding: '14px' }}>
          ✓ {assessmentType === 'same-statement' ? 'Create this assessment section' : 'Read my reports and group these statements'}
        </button>
      </QuestionLayout>
    );
  }

  // ─── Q4: ASSESSMENT PART 2/3 ─────────────────────────────────────────────

  if (step === 'q4_assessment_part2' || step === 'q4_assessment_part3') {
    const isOneSentence = assessmentSentenceType === 'one-sentence';
    return (
      <QuestionLayout
        question={`Would you like to add ${isOneSentence ? `part ${assessmentPartIndex} of the assessment sentence` : `another assessment`}?`}
        description={isOneSentence ? `Add the next part of your assessment sentence. It will join the previous part to read as one natural sentence.` : `Add another assessment section for a different test.`}
        onNo={() => setStep('q4_assessment_judgement')}
        noLabel="No — no more assessment parts"
        onBack={() => setStep('q4_assessment_examples')}
      >
        <ExampleBoxes count={assessmentType === 'same-statement' ? 2 : 5} label="Paste an example..." />
        <button onClick={() => {
          const examples = getValidExamples();
          if (examples.length === 0) { setError('Please paste at least one example.'); return; }
          setError(null);
          const sectionLabel = isOneSentence ? `Assessment — Part ${assessmentPartIndex}` : `Assessment ${assessmentPartIndex}`;
          const nextStep: WizardStep = step === 'q4_assessment_part2' ? 'q4_assessment_part3' : 'q4_assessment_judgement';
          if (assessmentType === 'same-statement') {
            const newSection = buildSameStatementSection(sectionLabel, examples);
            setBuiltSections(prev => [...prev, newSection]);
            resetExamples();
            setAssessmentPartIndex(prev => prev + 1);
            setStep(nextStep);
          } else {
            handleGroupAndAdd('assessment-comment', 'name', sectionLabel, nextStep, false);
            setAssessmentPartIndex(prev => prev + 1);
          }
        }} style={{ ...btnP, width: '100%', marginTop: '16px', padding: '14px' }}>✓ Add this assessment section</button>
      </QuestionLayout>
    );
  }

  // ─── Q4: ASSESSMENT JUDGEMENT ────────────────────────────────────────────

  if (step === 'q4_assessment_judgement') return (
    <ChoiceLayout question="Would you like to add a judgement statement after the assessment score?" description="For example, a comment about how well the pupil did overall — as a separate qualities section the teacher can choose from." onBack={() => setStep('q4_assessment_examples')}>
      <button onClick={() => { resetExamples(); setStep('q4_assessment_qualities'); }} style={{ ...btnP, padding: '14px' }}>Yes — add a judgement comment section</button>
      <button onClick={() => setStep('q5_nextsteps')} style={{ ...btnS, padding: '14px' }}>No — move on to next steps</button>
    </ChoiceLayout>
  );

  // ─── Q4: ASSESSMENT QUALITIES ────────────────────────────────────────────

  if (step === 'q4_assessment_qualities') return (
    <QuestionLayout question="Paste examples of your assessment judgement statements" description="Sentences commenting on how well the pupil did — different statements for different performance levels. Paste 3–5 examples." onNo={() => setStep('q5_nextsteps')} noLabel="Skip this" onBack={() => setStep('q4_assessment_judgement')}>
      <GroupModeToggle />
      <ExampleBoxes label="Paste a judgement statement from one report..." />
      <button onClick={() => handleGroupAndAdd('qualities', 'pronoun', 'Assessment Reflection', 'q5_nextsteps', groupMode === 'use-exactly')} style={{ ...btnP, width: '100%', marginTop: '16px', padding: '14px' }}>
        {groupMode === 'use-exactly' ? '✓ Use exactly these options' : '✓ Read my reports and group these statements'}
      </button>
    </QuestionLayout>
  );

  // ─── Q5: NEXT STEPS ───────────────────────────────────────────────────────

  if (step === 'q5_nextsteps') return (
    <QuestionLayout question="Do your reports include next steps or areas for development?" description="These can be improvement suggestions, development areas, or anything the pupil needs to work on. Paste 3–5 examples of the first sentence. If they always start with a phrase like 'Moving forward,' include that." onNo={() => setStep('add_sections')} noLabel="No — move on to final review" onBack={() => setStep('q4_assessment')}>
      <GroupModeToggle />
      <ExampleBoxes label="Paste a next steps or development sentence from one report..." />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '16px' }}>
        <button onClick={() => { setNextStepsSentenceIndex(1); handleGroupAndAdd('next-steps', 'name', 'Next Steps', 'q5a_more_nextsteps', groupMode === 'use-exactly'); }} style={{ ...btnP, padding: '14px' }}>
          {groupMode === 'use-exactly' ? '✓ Yes, use exactly these, starting with [Name]' : '✓ Yes, starting with [Name]'}
        </button>
        <button onClick={() => { setNextStepsSentenceIndex(1); handleGroupAndAdd('next-steps', 'pronoun', 'Next Steps', 'q5a_more_nextsteps', groupMode === 'use-exactly'); }} style={{ ...btnV, padding: '14px' }}>
          {groupMode === 'use-exactly' ? `✓ Yes, use exactly these, starting with ${pronounCapital}` : `✓ Yes, starting with ${pronounCapital} (${pronounSet.split('/')[0]})`}
        </button>
      </div>
    </QuestionLayout>
  );

  // ─── Q5a: MORE NEXT STEPS ─────────────────────────────────────────────────

  if (step === 'q5a_more_nextsteps') return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      <Header title="🪄 Import from Reports" subtitle="Building your template" onBack={() => setStep('q5_nextsteps')} />
      <main style={{ maxWidth: '700px', margin: '0 auto', padding: isMobile ? '16px' : '32px 24px' }}>
        <BuiltSectionsList />
        <div style={card}>
          <h2 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '700', color: '#111827' }}>Would you like to add another next steps sentence to your report?</h2>
          <p style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#6b7280', lineHeight: '1.6' }}>You can choose to have this statement with name or pronoun to make it read better. Paste 3–5 examples of the next sentence.</p>
          <GroupModeToggle />
          <ExampleBoxes count={5} label="Paste a next steps sentence..." />
          <ErrorBox />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '16px' }}>
            <button onClick={() => { setNextStepsSentenceIndex(prev => prev + 1); handleGroupAndAdd('next-steps', 'name', `Next Steps — Sentence ${nextStepsSentenceIndex + 1}`, 'q5a_more_nextsteps', groupMode === 'use-exactly'); }} style={{ ...btnP, padding: '14px' }}>Yes, starting with [Name]</button>
            <button onClick={() => { setNextStepsSentenceIndex(prev => prev + 1); handleGroupAndAdd('next-steps', 'pronoun', `Next Steps — Sentence ${nextStepsSentenceIndex + 1}`, 'q5a_more_nextsteps', groupMode === 'use-exactly'); }} style={{ ...btnV, padding: '14px' }}>Yes, starting with {pronounCapital} ({pronounSet.split('/')[0]})</button>
            <button onClick={() => setStep('add_sections')} style={{ ...btnG, padding: '14px' }}>No — move on to final review</button>
          </div>
        </div>
      </main>
    </div>
  );

  // ─── STEP: ADD SECTIONS ───────────────────────────────────────────────────

  if (step === 'add_sections') return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      <Header title="🪄 Import from Reports" subtitle="Final review — add anything missing" onBack={() => setStep('q5a_more_nextsteps')} />
      <main style={{ maxWidth: '700px', margin: '0 auto', padding: isMobile ? '16px' : '32px 24px' }}>
        <BuiltSectionsList />

        <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '10px', padding: '16px', marginBottom: '20px' }}>
          <h3 style={{ margin: '0 0 6px 0', fontSize: '14px', fontWeight: '600', color: '#92400e' }}>💡 Anything missing?</h3>
          <p style={{ margin: 0, fontSize: '13px', color: '#78350f', lineHeight: '1.6' }}>This is your chance to add any sections you forgot or that the wizard didn't ask about — pathway paragraphs, assessment analysis notes, closing statements, or anything else your reports include.</p>
        </div>

        <div style={card}>
          <h2 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600', color: '#111827' }}>Add a section</h2>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: '10px', marginBottom: '16px' }}>
            <button onClick={() => setStep('add_standard')} style={{ padding: '16px', border: '2px solid #10b981', borderRadius: '10px', backgroundColor: 'white', cursor: 'pointer', textAlign: 'left' }}>
              <div style={{ fontSize: '20px', marginBottom: '6px' }}>📌</div>
              <div style={{ fontSize: '14px', fontWeight: '700', color: '#111827', marginBottom: '4px' }}>Standard Comment</div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>Fixed text that appears in every report automatically</div>
            </button>
            <button onClick={() => setStep('add_qualities')} style={{ padding: '16px', border: '2px solid #f59e0b', borderRadius: '10px', backgroundColor: 'white', cursor: 'pointer', textAlign: 'left' }}>
              <div style={{ fontSize: '20px', marginBottom: '6px' }}>🎯</div>
              <div style={{ fontSize: '14px', fontWeight: '700', color: '#111827', marginBottom: '4px' }}>Choice Comment</div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>Options the teacher chooses between for each pupil</div>
            </button>
            <button onClick={() => setStep('add_nextsteps')} style={{ padding: '16px', border: '2px solid #06b6d4', borderRadius: '10px', backgroundColor: 'white', cursor: 'pointer', textAlign: 'left' }}>
              <div style={{ fontSize: '20px', marginBottom: '6px' }}>📈</div>
              <div style={{ fontSize: '14px', fontWeight: '700', color: '#111827', marginBottom: '4px' }}>Next Steps</div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>Improvement suggestions organised by topic</div>
            </button>
            <button onClick={() => {
              const optionalSection: BuiltSection = { id: `section_${Date.now()}`, type: 'optional-additional-comment', name: 'Additional Comments', openerType: 'name', positionType: 'optional', data: {} };
              setBuiltSections(prev => [...prev, optionalSection]);
            }} style={{ padding: '16px', border: '2px solid #ef4444', borderRadius: '10px', backgroundColor: 'white', cursor: 'pointer', textAlign: 'left' }}>
              <div style={{ fontSize: '20px', marginBottom: '6px' }}>✏️</div>
              <div style={{ fontSize: '14px', fontWeight: '700', color: '#111827', marginBottom: '4px' }}>Optional Comment Box</div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>Free text the teacher types per pupil</div>
            </button>
          </div>
          <ErrorBox />
          <button onClick={handleAssemble} style={{ ...btnG, width: '100%', padding: '16px', fontSize: '16px' }}>
            🪄 Generate My Template
          </button>
        </div>
      </main>
    </div>
  );

  // ─── STEP: ADD STANDARD ───────────────────────────────────────────────────

  if (step === 'add_standard') return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      <Header title="🪄 Import from Reports" subtitle="Add a standard comment" onBack={() => setStep('add_sections')} />
      <main style={{ maxWidth: '700px', margin: '0 auto', padding: isMobile ? '16px' : '32px 24px' }}>
        <div style={card}>
          <h2 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '700', color: '#111827' }}>Add a Standard Comment</h2>
          <p style={{ margin: '0 0 20px 0', fontSize: '14px', color: '#6b7280' }}>Text that appears identically in every report. Paste it exactly as it appears.</p>
          <div style={{ marginBottom: '12px' }}><label style={lbl}>Section Name</label><input type="text" value={addSectionName} onChange={e => setAddSectionName(e.target.value)} placeholder="e.g. Assessment Analysis, Pathway Information" style={inp} /></div>
          <div style={{ marginBottom: '16px' }}><label style={lbl}>Text content</label><textarea value={addSectionContent} onChange={e => setAddSectionContent(e.target.value)} placeholder="Paste the text here..." style={{ ...txa, minHeight: '120px' }} /></div>
          <ErrorBox />
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => setStep('add_sections')} style={{ ...btnS, flex: 1 }}>Cancel</button>
            <button onClick={() => {
              if (!addSectionName.trim() || !addSectionContent.trim()) { setError('Please enter a name and content.'); return; }
              const newSection: BuiltSection = { id: `section_${Date.now()}`, type: 'standard-comment', name: addSectionName.trim(), openerType: 'name', positionType: 'standard', data: { content: addSectionContent.trim() } };
              setBuiltSections(prev => [...prev, newSection]);
              setAddSectionName(''); setAddSectionContent(''); setError(null);
              setStep('add_sections');
            }} style={{ ...btnG, flex: 1 }}>Add Section</button>
          </div>
        </div>
      </main>
    </div>
  );

  // ─── STEP: ADD QUALITIES ─────────────────────────────────────────────────

  if (step === 'add_qualities') return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      <Header title="🪄 Import from Reports" subtitle="Add a choice comment" onBack={() => setStep('add_sections')} />
      <main style={{ maxWidth: '700px', margin: '0 auto', padding: isMobile ? '16px' : '32px 24px' }}>
        <div style={card}>
          <h2 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '700', color: '#111827' }}>Add a Choice Comment</h2>
          <p style={{ margin: '0 0 20px 0', fontSize: '14px', color: '#6b7280' }}>Paste examples of the sentences you use for this section. Claude will read your reports and group them into options.</p>
          <div style={{ marginBottom: '12px' }}><label style={lbl}>Section Name</label><input type="text" value={addSectionName} onChange={e => setAddSectionName(e.target.value)} placeholder="e.g. Pathway Information, Closing Comment" style={inp} /></div>
          <div style={{ marginBottom: '12px' }}>
            <label style={lbl}>Opener</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setAddSectionOpener('name')} style={{ flex: 1, padding: '8px', borderRadius: '6px', border: addSectionOpener === 'name' ? '2px solid #3b82f6' : '1px solid #d1d5db', backgroundColor: addSectionOpener === 'name' ? '#eff6ff' : 'white', cursor: 'pointer', fontSize: '13px', fontWeight: addSectionOpener === 'name' ? '600' : '400' }}>Starts with [Name]</button>
              <button onClick={() => setAddSectionOpener('pronoun')} style={{ flex: 1, padding: '8px', borderRadius: '6px', border: addSectionOpener === 'pronoun' ? '2px solid #8b5cf6' : '1px solid #d1d5db', backgroundColor: addSectionOpener === 'pronoun' ? '#f5f3ff' : 'white', cursor: 'pointer', fontSize: '13px', fontWeight: addSectionOpener === 'pronoun' ? '600' : '400' }}>Starts with {pronounCapital}</button>
            </div>
          </div>
          <div style={{ marginBottom: '12px' }}>
            <GroupModeToggle />
          </div>
          <ExampleBoxes
            count={5}
            label="Paste an example sentence..."
            examples={addSectionExamples}
            onChange={(i, v) => { const u = [...addSectionExamples]; u[i] = v; setAddSectionExamples(u); }}
          />
          <ErrorBox />
          <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
            <button onClick={() => setStep('add_sections')} style={{ ...btnS, flex: 1 }}>Cancel</button>
            <button onClick={async () => {
              const examples = addSectionExamples.filter(e => e.trim().length > 5);
              if (!addSectionName.trim() || examples.length === 0) { setError('Please enter a name and at least one example.'); return; }
              setError(null);
              setIsLoading(true);
              setLoadingMessage('Building this section...');
              try {
                let result: any;
                if (groupMode === 'use-exactly') {
                  result = buildExactSection(addSectionName.trim(), 'qualities', addSectionOpener, pronounCapital, examples);
                } else {
                  result = await callGroup({ subject, yearGroup, reportText: rawReportText, pronounSet, examples, positionType: 'qualities', openerType: addSectionOpener, sectionName: addSectionName.trim() });
                }
                const newSection = addSectionFromResult(result, 'qualities', addSectionOpener);
                setBuiltSections(prev => [...prev, newSection]);
                setAddSectionName(''); setAddSectionExamples(['', '', '', '', '']); setGroupMode('find-more');
                setStep('add_sections');
              } catch (err: any) { setError(err.message || 'Failed to build section.'); }
              finally { setIsLoading(false); }
            }} style={{ ...btnG, flex: 1 }}>Add Section</button>
          </div>
        </div>
      </main>
    </div>
  );

  // ─── STEP: ADD NEXT STEPS ─────────────────────────────────────────────────

  if (step === 'add_nextsteps') return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      <Header title="🪄 Import from Reports" subtitle="Add a next steps section" onBack={() => setStep('add_sections')} />
      <main style={{ maxWidth: '700px', margin: '0 auto', padding: isMobile ? '16px' : '32px 24px' }}>
        <div style={card}>
          <h2 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '700', color: '#111827' }}>Add a Next Steps Section</h2>
          <p style={{ margin: '0 0 20px 0', fontSize: '14px', color: '#6b7280' }}>Paste examples of the improvement suggestions you use. Claude will group them by topic.</p>
          <div style={{ marginBottom: '12px' }}><label style={lbl}>Section Name</label><input type="text" value={addSectionName} onChange={e => setAddSectionName(e.target.value)} placeholder="e.g. Areas for Development, Next Steps" style={inp} /></div>
          <div style={{ marginBottom: '12px' }}>
            <label style={lbl}>Opener</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setAddSectionOpener('name')} style={{ flex: 1, padding: '8px', borderRadius: '6px', border: addSectionOpener === 'name' ? '2px solid #3b82f6' : '1px solid #d1d5db', backgroundColor: addSectionOpener === 'name' ? '#eff6ff' : 'white', cursor: 'pointer', fontSize: '13px', fontWeight: addSectionOpener === 'name' ? '600' : '400' }}>Starts with [Name]</button>
              <button onClick={() => setAddSectionOpener('pronoun')} style={{ flex: 1, padding: '8px', borderRadius: '6px', border: addSectionOpener === 'pronoun' ? '2px solid #8b5cf6' : '1px solid #d1d5db', backgroundColor: addSectionOpener === 'pronoun' ? '#f5f3ff' : 'white', cursor: 'pointer', fontSize: '13px', fontWeight: addSectionOpener === 'pronoun' ? '600' : '400' }}>Starts with {pronounCapital}</button>
            </div>
          </div>
          <div style={{ marginBottom: '12px' }}><GroupModeToggle /></div>
          <ExampleBoxes
            count={5}
            label="Paste an improvement suggestion..."
            examples={addSectionExamples}
            onChange={(i, v) => { const u = [...addSectionExamples]; u[i] = v; setAddSectionExamples(u); }}
          />
          <ErrorBox />
          <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
            <button onClick={() => setStep('add_sections')} style={{ ...btnS, flex: 1 }}>Cancel</button>
            <button onClick={async () => {
              const examples = addSectionExamples.filter(e => e.trim().length > 5);
              if (!addSectionName.trim() || examples.length === 0) { setError('Please enter a name and at least one example.'); return; }
              setError(null);
              setIsLoading(true);
              setLoadingMessage('Building this section...');
              try {
                let result: any;
                if (groupMode === 'use-exactly') {
                  result = buildExactSection(addSectionName.trim(), 'next-steps', addSectionOpener, pronounCapital, examples);
                } else {
                  result = await callGroup({ subject, yearGroup, reportText: rawReportText, pronounSet, examples, positionType: 'next-steps', openerType: addSectionOpener, sectionName: addSectionName.trim() });
                }
                const newSection = addSectionFromResult(result, 'next-steps', addSectionOpener);
                setBuiltSections(prev => [...prev, newSection]);
                setAddSectionName(''); setAddSectionExamples(['', '', '', '', '']); setGroupMode('find-more');
                setStep('add_sections');
              } catch (err: any) { setError(err.message || 'Failed to build section.'); }
              finally { setIsLoading(false); }
            }} style={{ ...btnG, flex: 1 }}>Add Section</button>
          </div>
        </div>
      </main>
    </div>
  );

  // ─── STEP: PREVIEW ────────────────────────────────────────────────────────

  if (step === 'preview' && generatedTemplate) return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      <header style={{ backgroundColor: 'white', borderBottom: '1px solid #e5e7eb', padding: isMobile ? '16px' : '20px 24px' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
          <div><h1 style={{ margin: 0, fontSize: isMobile ? '16px' : '20px', fontWeight: '700', color: '#111827' }}>✅ Template Generated</h1><p style={{ margin: 0, fontSize: '12px', color: '#6b7280' }}>Review, refine, or save</p></div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={handleEditFirst} style={btnS}>Save & Edit</button>
            <button onClick={handleSave} style={btnP}>Save Template</button>
          </div>
        </div>
      </header>
      <main style={{ maxWidth: '800px', margin: '0 auto', padding: isMobile ? '16px' : '32px 24px' }}>
        <div style={{ ...card, marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ flex: 1 }}><p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>TEMPLATE NAME</p><h2 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#111827' }}>{generatedTemplate.name}</h2></div>
            <div style={{ backgroundColor: '#eff6ff', color: '#1d4ed8', padding: '6px 12px', borderRadius: '6px', fontSize: '13px', fontWeight: '500' }}>{generatedTemplate.sections.length} sections</div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
          {generatedTemplate.sections.map((section, index) => (
            <div key={section.id} style={{ ...card, marginBottom: 0, padding: '14px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <span style={{ backgroundColor: '#f3f4f6', color: '#6b7280', fontSize: '11px', fontWeight: '600', padding: '2px 6px', borderRadius: '4px', flexShrink: 0, marginTop: '2px' }}>{index + 1}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                    <span style={{ backgroundColor: getSectionTypeColor(section.type), color: 'white', fontSize: '11px', fontWeight: '600', padding: '2px 8px', borderRadius: '4px' }}>{getSectionTypeLabel(section.type)}</span>
                    {section.name && section.type !== 'new-line' && <span style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>{section.name}</span>}
                  </div>
                  <p style={{ margin: 0, fontSize: '12px', color: '#6b7280', lineHeight: '1.5' }}>{getSectionSummary(section)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ ...card, border: '2px solid #8b5cf6', marginBottom: '16px' }}>
          <h3 style={{ margin: '0 0 6px 0', fontSize: '15px', fontWeight: '600', color: '#111827' }}>🔄 Refine with More Reports</h3>
          <p style={{ margin: '0 0 12px 0', fontSize: '13px', color: '#6b7280' }}>Paste more reports to add additional options and improve variety.</p>
          <textarea value={refineText} onChange={e => setRefineText(e.target.value)} placeholder="Paste more reports here..." style={{ ...txa, minHeight: '120px', marginBottom: '12px' }} />
          {error && <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '10px', marginBottom: '10px', color: '#b91c1c', fontSize: '13px' }}>⚠️ {error}</div>}
          <button onClick={handleRefine} disabled={refineText.length < 200 || isRefining} style={{ width: '100%', padding: '12px', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', backgroundColor: isRefining ? '#9ca3af' : refineText.length >= 200 ? '#8b5cf6' : '#d1d5db', color: 'white', cursor: refineText.length >= 200 && !isRefining ? 'pointer' : 'not-allowed' }}>
            {isRefining ? '🔄 Refining...' : '🔄 Refine Template'}
          </button>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={handleEditFirst} style={{ ...btnS, flex: 1, padding: '14px', fontSize: '15px' }}>✏️ Save & Edit</button>
          <button onClick={handleSave} style={{ ...btnP, flex: 1, padding: '14px', fontSize: '15px' }}>✅ Save Template</button>
        </div>
      </main>
    </div>
  );

  // ─── STEP: SAVED ──────────────────────────────────────────────────────────

  if (step === 'saved') return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '48px 40px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', textAlign: 'center', maxWidth: '400px' }}>
        <div style={{ fontSize: '56px', marginBottom: '16px' }}>🎉</div>
        <h2 style={{ margin: '0 0 8px 0', fontSize: '22px', fontWeight: '700', color: '#111827' }}>Template Saved!</h2>
        <p style={{ margin: '0 0 8px 0', color: '#374151', fontWeight: '600', fontSize: '16px' }}>{generatedTemplate?.name}</p>
        <p style={{ margin: '0 0 32px 0', color: '#6b7280', fontSize: '14px' }}>Your template is ready to use.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <Link to="/manage-templates" style={{ textDecoration: 'none' }}><button style={{ ...btnP, width: '100%', padding: '14px', fontSize: '15px' }}>Go to Templates</button></Link>
          <button onClick={handleReset} style={{ ...btnS, width: '100%', padding: '14px', fontSize: '15px' }}>Import Another Template</button>
        </div>
      </div>
    </div>
  );

  return null;
}