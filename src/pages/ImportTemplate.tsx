// src/pages/ImportTemplate.tsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { TemplateSection } from '../types';

// ─── TYPES ───────────────────────────────────────────────────────────────────

type PronounSet = 'he/his' | 'she/her' | 'they/their';
type OpenerType = 'name' | 'pronoun';
type MainStep = 'paste' | 'builder' | 'generating' | 'preview' | 'saved';
type SectionStep =
  | 'menu'
  | 'rating_name' | 'rating_scale' | 'rating_examples' | 'rating_building'
  | 'qualities_selected' | 'qualities_building' | 'qualities_copy'
  | 'standard_type' | 'standard_single' | 'standard_multi'
  | 'assessment_flow'
  | 'development_selected' | 'development_building' | 'development_more'
  | 'nextsteps_selected' | 'nextsteps_building' | 'nextsteps_more';

interface BuiltSection {
  id: string;
  type: 'qualities' | 'next-steps' | 'assessment-comment' | 'standard-comment' | 'personalised-comment' | 'rated-comment' | 'optional-additional-comment';
  name: string;
  openerType: OpenerType;
  data: any;
}

interface AssessmentState {
  statementType: 'same' | 'different' | null;
  count: 'one' | 'multiple' | null;
  sentenceType: 'one-sentence' | 'separate' | null;
  totalParts: number;
  partIndex: number;
  examples: string[];
  wantsJudgement: boolean | null;
}

interface GeneratedTemplate { name: string; sections: TemplateSection[]; }

const SUPABASE_URL = 'https://wozbrojwuzktwrzngllh.supabase.co/functions/v1/generate-template';

function getPronounCapital(p: PronounSet) { return p.split('/')[0].charAt(0).toUpperCase() + p.split('/')[0].slice(1); }
function getPronounFull(p: PronounSet) { return ({ "he/his": "HE/HIM/HIS/HIMSELF", "she/her": "SHE/HER/HERS/HERSELF", "they/their": "THEY/THEM/THEIR/THEMSELVES" } as Record<string, string>)[p] || "THEY/THEM/THEIR/THEMSELVES"; }
function stripPercent(text: string) { return text.replace(/\[Score\]%/g, '[Score]').replace(/\b\d{1,3}%/g, '[Score]').replace(/\b\d{1,3}\/\d{1,3}\b/g, '[Score]'); }

// ─── COMPONENT ────────────────────────────────────────────────────────────────

export default function ImportTemplate() {
  const navigate = useNavigate();
  const { addTemplate } = useData();

  // Core
  const [mainStep, setMainStep] = useState<MainStep>('paste');
  const [sectionStep, setSectionStep] = useState<SectionStep>('menu');
  const [subject, setSubject] = useState('');
  const [yearGroup, setYearGroup] = useState('');
  const [pronounSet, setPronounSet] = useState<PronounSet>('they/their');
  const [rawReportText, setRawReportText] = useState('');
  const [builtSections, setBuiltSections] = useState<BuiltSection[]>([]);
  const [generatedTemplate, setGeneratedTemplate] = useState<GeneratedTemplate | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [isMobile] = useState(window.innerWidth <= 768);

  // Rating section state
  const [ratingName, setRatingName] = useState('');
  const [ratingScale, setRatingScale] = useState<'four-level' | 'own' | null>(null);
  const [ratingExamples, setRatingExamples] = useState(['', '', '', '', '']);

  // Qualities section state
  const [qualitiesName, setQualitiesName] = useState('Personal Qualities');
  const [qualitiesSelected, setQualitiesSelected] = useState('');
  const [qualitiesOpener, setQualitiesOpener] = useState<OpenerType>('name');
  const [lastQualitiesResult, setLastQualitiesResult] = useState<any>(null);
  const [qualitiesCopyOpener, setQualitiesCopyOpener] = useState<OpenerType>('pronoun');

  // Standard comment state
  const [standardName, setStandardName] = useState('');
  const [standardContent, setStandardContent] = useState('');
  const [multiOptions, setMultiOptions] = useState<{ label: string; content: string }[]>([{ label: '', content: '' }]);

  // Development/next steps state
  const [devName, setDevName] = useState('');
  const [devSelected, setDevSelected] = useState('');
  const [devOpener, setDevOpener] = useState<OpenerType>('name');
  const [devType, setDevType] = useState<'development' | 'nextsteps'>('development');
  const [devSentenceIndex, setDevSentenceIndex] = useState(1);

  // Assessment state
  const [assessment, setAssessment] = useState<AssessmentState>({
    statementType: null, count: null, sentenceType: null,
    totalParts: 2, partIndex: 1, examples: ['', '', '', '', ''],
    wantsJudgement: null,
  });
  const [assessmentStep, setAssessmentStep] = useState<'type' | 'count' | 'sentence_type' | 'examples' | 'part2' | 'part3' | 'judgement' | 'judgement_examples'>('type');

  // Refine
  const [refineText, setRefineText] = useState('');
  const [isRefining, setIsRefining] = useState(false);

  const pronounCapital = getPronounCapital(pronounSet);

  // ─── STYLES ────────────────────────────────────────────────────────────────
  const card: React.CSSProperties = { backgroundColor: 'white', borderRadius: '10px', border: '1px solid #e5e7eb', padding: '20px', marginBottom: '16px' };
  const lbl: React.CSSProperties = { display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' };
  const inp: React.CSSProperties = { width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' };
  const txa: React.CSSProperties = { width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', resize: 'vertical' };
  const btnP: React.CSSProperties = { backgroundColor: '#3b82f6', color: 'white', padding: '10px 18px', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' };
  const btnS: React.CSSProperties = { backgroundColor: '#f3f4f6', color: '#374151', padding: '10px 18px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', fontWeight: '500', cursor: 'pointer' };
  const btnG: React.CSSProperties = { backgroundColor: '#10b981', color: 'white', padding: '10px 18px', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' };
  const btnV: React.CSSProperties = { backgroundColor: '#8b5cf6', color: 'white', padding: '10px 18px', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' };

  // ─── API CALLS ─────────────────────────────────────────────────────────────

  const callApi = async (body: any) => {
    const response = await fetch(SUPABASE_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (!response.ok) throw new Error('API call failed');
    return response.json();
  };

  // ─── SECTION HANDLERS ─────────────────────────────────────────────────────

  const addSection = (section: BuiltSection) => {
    setBuiltSections(prev => [...prev, section]);
    setSectionStep('menu');
    setError(null);
  };

  const handleBuildRating = async () => {
    const examples = ratingExamples.filter(e => e.trim().length > 5);
    if (examples.length === 0) { setError('Please paste at least one example sentence.'); return; }
    setIsLoading(true);
    setLoadingMessage('Building your rating section...');
    try {
      const result = await callApi({ mode: 'rating', subject, yearGroup, reportText: rawReportText, pronounSet, sectionName: ratingName, scaleType: ratingScale, examples });
      if (result.type === 'rated-comment') {
        addSection({ id: `s_${Date.now()}`, type: 'rated-comment', name: ratingName, openerType: 'name', data: { comments: result.result } });
      } else {
        addSection({ id: `s_${Date.now()}`, type: 'qualities', name: ratingName, openerType: 'name', data: { comments: Object.fromEntries(result.result.headings.map((h: any) => [h.name, h.comments])) } });
      }
      setRatingName(''); setRatingScale(null); setRatingExamples(['', '', '', '', '']);
    } catch { setError('Building failed. Please try again.'); }
    finally { setIsLoading(false); }
  };

  const handleBuildQualities = async () => {
    if (!qualitiesSelected.trim()) { setError('Please paste your selected quality sentences.'); return; }
    setIsLoading(true);
    setLoadingMessage('Extracting quality sentences from your reports...');
    try {
      const result = await callApi({ mode: 'extract-qualities', subject, yearGroup, reportText: rawReportText, pronounSet, sectionName: qualitiesName, openerType: qualitiesOpener, selectedText: qualitiesSelected });
      const newSection: BuiltSection = { id: `s_${Date.now()}`, type: 'qualities', name: result.sectionName || qualitiesName, openerType: qualitiesOpener, data: { comments: Object.fromEntries(result.headings.map((h: any) => [h.name, h.comments])) } };
      setBuiltSections(prev => [...prev, newSection]);
      setLastQualitiesResult(result);
      setSectionStep('qualities_copy');
    } catch { setError('Extraction failed. Please try again.'); }
    finally { setIsLoading(false); }
  };

  const handleCopyQualities = async (openerType: OpenerType) => {
    if (!lastQualitiesResult) return;
    setIsLoading(true);
    setLoadingMessage('Rewriting with ' + (openerType === 'pronoun' ? pronounCapital : '[Name]') + '...');
    try {
      const rewritten = await callApi({ mode: 'rewrite', pronounSet, openerType, sourceSection: lastQualitiesResult });
      const lastSection = builtSections[builtSections.length - 1];
      addSection({ id: `s_${Date.now()}`, type: 'qualities', name: (lastSection?.name || qualitiesName) + (openerType === 'pronoun' ? ` — ${pronounCapital}-led` : ' — [Name]-led'), openerType, data: { comments: Object.fromEntries(rewritten.headings.map((h: any) => [h.name, h.comments])) } });
    } catch { setError('Rewrite failed. Please try again.'); }
    finally { setIsLoading(false); }
  };

  const handleCopyDevSection = async (openerType: OpenerType) => {
    const lastSection = builtSections[builtSections.length - 1];
    if (!lastSection || lastSection.type !== 'next-steps') return;
    setIsLoading(true);
    setLoadingMessage('Rewriting with ' + (openerType === 'pronoun' ? pronounCapital : '[Name]') + '...');
    try {
      // Build source in headings format for rewrite
      const sourceSection = {
        sectionName: lastSection.name,
        headings: Object.entries(lastSection.data?.focusAreas || {}).map(([name, comments]) => ({ name, comments })),
      };
      const rewritten = await callApi({ mode: 'rewrite', pronounSet, openerType, sourceSection });
      const newSection: BuiltSection = {
        id: `s_${Date.now()}`,
        type: 'next-steps',
        name: lastSection.name + (openerType === 'pronoun' ? ` — ${pronounCapital}-led` : ' — [Name]-led'),
        openerType,
        data: { focusAreas: Object.fromEntries(rewritten.headings.map((h: any) => [h.name, h.comments])) },
      };
      setBuiltSections(prev => [...prev, newSection]);
      // Stay on more screen
    } catch { setError('Rewrite failed. Please try again.'); }
    finally { setIsLoading(false); }
  };

  const handleBuildDevelopment = async () => {
    if (!devSelected.trim()) { setError('Please paste your selected sentences.'); return; }
    setIsLoading(true);
    setLoadingMessage('Extracting and grouping sentences...');
    try {
      const result = await callApi({ mode: 'extract-development', subject, yearGroup, reportText: rawReportText, pronounSet, sectionName: devName, openerType: devOpener, positionType: devType, selectedText: devSelected });
      const sName = devType === 'nextsteps' && devSentenceIndex > 1 ? `${devName} — Sentence ${devSentenceIndex}` : (result.sectionName || devName);
      addSection({ id: `s_${Date.now()}`, type: 'next-steps', name: sName, openerType: devOpener, data: { focusAreas: result.focusAreas || {} } });
      setDevSentenceIndex(prev => prev + 1);
      setSectionStep(devType === 'nextsteps' ? 'nextsteps_more' : 'development_more');
    } catch { setError('Extraction failed. Please try again.'); }
    finally { setIsLoading(false); }
  };

  const handleAddStandardSingle = () => {
    if (!standardName.trim() || !standardContent.trim()) { setError('Please enter both a name and the text.'); return; }
    addSection({ id: `s_${Date.now()}`, type: 'standard-comment', name: standardName.trim(), openerType: 'name', data: { content: standardContent.trim() } });
    setStandardName(''); setStandardContent('');
  };

  const handleAddStandardMulti = () => {
    const valid = multiOptions.filter(o => o.label.trim() && o.content.trim());
    if (!standardName.trim() || valid.length === 0) { setError('Please enter a section name and at least one option.'); return; }
    const comments: Record<string, string[]> = {};
    valid.forEach(o => { comments[o.label.trim()] = [o.content.trim()]; });
    addSection({ id: `s_${Date.now()}`, type: 'qualities', name: standardName.trim(), openerType: 'name', data: { comments } });
    setStandardName(''); setMultiOptions([{ label: '', content: '' }]);
  };

  const handleBuildAssessmentSame = (examples: string[], name: string) => {
    const safeWords = new Set(['Monday','Tuesday','Wednesday','Thursday','Friday','National','Maths','Mathematics','English','History','Science','French','Spanish','Biology','Chemistry','Physics','Computing','Geography','Drama','Music','Art','Business','Black','Death','Mary','Queen','Scots','Romans']);
    const cleaned = examples.filter(e => e.trim()).map(e => {
      let text = e.trim();
      // Protect existing [Name] and [Score] placeholders before replacement runs
      text = text.replace(/\[Name\]/g, '\u0000NAME\u0000').replace(/\[Score\]/g, '\u0000SCORE\u0000');
      // Replace actual pupil names
      text = text.replace(/\b([A-Z][a-z]{2,})\b/g, (m: string) => safeWords.has(m) ? m : '[Name]');
      // Strip actual percentages and scores
      text = stripPercent(text);
      // Restore placeholders
      text = text.replace(/\u0000NAME\u0000/g, '[Name]').replace(/\u0000SCORE\u0000/g, '[Score]');
      return text;
    });
    addSection({ id: `s_${Date.now()}`, type: 'personalised-comment', name, openerType: 'name', data: { instruction: 'Enter the assessment score for this pupil', categories: { 'Assessment Score': Array.from(new Set(cleaned)).filter(Boolean) || ['[Name] scored [Score] in the assessment.'] } } });
  };

  const handleAssemble = () => {
    setIsLoading(true);
    setLoadingMessage('Assembling your template...');
    setMainStep('generating');
    callApi({ mode: 'assemble', subject, yearGroup, builtSections })
      .then(data => { setGeneratedTemplate({ name: data.templateName, sections: data.sections }); setMainStep('preview'); })
      .catch(err => { setError(err.message); setMainStep('builder'); setSectionStep('menu'); })
      .finally(() => setIsLoading(false));
  };

  const handleRefine = async () => {
    if (refineText.length < 200) { setError('Please paste more reports.'); return; }
    setIsRefining(true); setError(null);
    try {
      const data = await callApi({ mode: 'refine', subject, yearGroup, pronounSet, existingTemplate: { name: generatedTemplate?.name, sections: generatedTemplate?.sections }, refineText });
      setGeneratedTemplate({ name: data.templateName, sections: data.sections });
      setRefineText('');
    } catch { setError('Refinement failed.'); }
    finally { setIsRefining(false); }
  };

  const handleSave = () => { if (!generatedTemplate) return; navigate('/template-review', { state: { template: { name: generatedTemplate.name, sections: generatedTemplate.sections } } }); };
  const handleEditFirst = () => { if (!generatedTemplate) return; navigate('/template-review', { state: { template: { name: generatedTemplate.name, sections: generatedTemplate.sections } } }); };
  const handleReset = () => { setMainStep('paste'); setSectionStep('menu'); setSubject(''); setYearGroup(''); setRawReportText(''); setPronounSet('they/their'); setBuiltSections([]); setGeneratedTemplate(null); setError(null); setRatingName(''); setRatingScale(null); setRatingExamples(['','','','','']); setQualitiesSelected(''); setDevSelected(''); setDevSentenceIndex(1); setLastQualitiesResult(null); };

  // ─── SHARED ────────────────────────────────────────────────────────────────

  const Header = ({ onBack, subtitle }: { onBack?: () => void; subtitle?: string }) => (
    <header style={{ backgroundColor: 'white', borderBottom: '1px solid #e5e7eb', padding: isMobile ? '16px' : '20px 24px', display: 'flex', alignItems: 'center', gap: '16px', position: 'sticky', top: 0, zIndex: 10 }}>
      {onBack ? <button onClick={onBack} style={btnS}>← Back</button> : <Link to="/manage-templates" style={{ textDecoration: 'none' }}><button style={btnS}>← Back</button></Link>}
      <div>
        <h1 style={{ margin: 0, fontSize: isMobile ? '18px' : '22px', fontWeight: '700', color: '#111827' }}>🪄 Import from Reports</h1>
        {subtitle && <p style={{ margin: 0, fontSize: '13px', color: '#6b7280' }}>{subtitle}</p>}
      </div>
    </header>
  );

  const ErrorBox = () => error ? <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px', color: '#b91c1c', fontSize: '14px' }}>⚠️ {error}</div> : null;

  const BuiltList = () => builtSections.length > 0 ? (
    <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '12px', marginBottom: '16px' }}>
      <p style={{ margin: '0 0 6px 0', fontSize: '12px', fontWeight: '600', color: '#166534' }}>✅ Sections added ({builtSections.length}):</p>
      {builtSections.map((s, i) => <p key={s.id} style={{ margin: '2px 0', fontSize: '12px', color: '#15803d' }}>{i + 1}. {s.name} — {s.type}</p>)}
    </div>
  ) : null;

  const OpenerChoice = ({ value, onChange }: { value: OpenerType; onChange: (v: OpenerType) => void }) => (
    <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
      <button onClick={() => onChange('name')} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: value === 'name' ? '2px solid #3b82f6' : '1px solid #d1d5db', backgroundColor: value === 'name' ? '#eff6ff' : 'white', cursor: 'pointer', fontSize: '13px', fontWeight: value === 'name' ? '600' : '400', color: value === 'name' ? '#1d4ed8' : '#374151' }}>Contains [Name]</button>
      <button onClick={() => onChange('pronoun')} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: value === 'pronoun' ? '2px solid #8b5cf6' : '1px solid #d1d5db', backgroundColor: value === 'pronoun' ? '#f5f3ff' : 'white', cursor: 'pointer', fontSize: '13px', fontWeight: value === 'pronoun' ? '600' : '400', color: value === 'pronoun' ? '#5b21b6' : '#374151' }}>Contains {pronounCapital}</button>
    </div>
  );

  const LoadingScreen = ({ icon, title, msg }: { icon: string; title: string; msg: string }) => (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '48px 40px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', textAlign: 'center', maxWidth: '400px' }}>
        <div style={{ fontSize: '48px', marginBottom: '20px' }}>{icon}</div>
        <h2 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: '700', color: '#111827' }}>{title}</h2>
        <p style={{ margin: '0 0 24px 0', color: '#6b7280', fontSize: '14px' }}>{msg}</p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
          {[0,1,2].map(i => <div key={i} style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#3b82f6', animation: 'pulse 1.2s ease-in-out infinite', animationDelay: `${i*0.2}s` }} />)}
        </div>
        <style>{`@keyframes pulse{0%,100%{opacity:.3;transform:scale(.8)}50%{opacity:1;transform:scale(1.2)}}`}</style>
      </div>
    </div>
  );

  const getSectionTypeColor = (type: string) => ({ 'standard-comment': '#10b981', 'assessment-comment': '#8b5cf6', 'personalised-comment': '#f59e0b', 'next-steps': '#06b6d4', 'qualities': '#f59e0b', 'rated-comment': '#3b82f6', 'new-line': '#9ca3af', 'optional-additional-comment': '#ef4444' }[type] || '#6b7280');
  const getSectionTypeLabel = (type: string) => ({ 'standard-comment': 'Standard Comment', 'assessment-comment': 'Assessment', 'personalised-comment': 'Score Entry', 'next-steps': 'Next Steps', 'qualities': 'Choice Comment', 'rated-comment': 'Rated Comment', 'new-line': 'New Line', 'optional-additional-comment': 'Optional Comment' }[type] || type);
  const getSectionSummary = (section: TemplateSection): string => {
    switch (section.type) {
      case 'qualities': { const h = Object.keys(section.data?.comments || {}); return `${h.length} options: ${h.slice(0,3).join(', ')}${h.length>3?'...':''}`; }
      case 'rated-comment': return '4-level rating: excellent / good / satisfactory / needs improvement';
      case 'standard-comment': return ((section.data?.content||'') as string).substring(0,80)+'...';
      case 'assessment-comment': return 'Assessment with [Score] — 5 levels';
      case 'personalised-comment': return 'Teacher enters score per pupil';
      case 'next-steps': { const a = Object.keys(section.data?.focusAreas||{}); return `${a.length} focus areas`; }
      case 'new-line': return 'Line break';
      case 'optional-additional-comment': return 'Free text box';
      default: return '';
    }
  };

  // ─── LOADING ──────────────────────────────────────────────────────────────
  if (isLoading && mainStep === 'generating') return <LoadingScreen icon="🪄" title="Building Your Template" msg={loadingMessage} />;
  if (isLoading) return <LoadingScreen icon="🔍" title="Reading Your Reports" msg={loadingMessage} />;

  // ─── STEP: PASTE ──────────────────────────────────────────────────────────
  if (mainStep === 'paste') return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      <Header subtitle="Build a template from your existing reports" />
      <main style={{ maxWidth: '800px', margin: '0 auto', padding: isMobile ? '16px' : '32px 24px' }}>
        <div style={card}>
          <h2 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600', color: '#111827' }}>Template Details</h2>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '12px' }}>
            <div><label style={lbl}>Subject <span style={{ color: '#ef4444' }}>*</span></label><input type="text" value={subject} onChange={e => setSubject(e.target.value)} placeholder="e.g. History" style={inp} /></div>
            <div><label style={lbl}>Year Group</label><select value={yearGroup} onChange={e => setYearGroup(e.target.value)} style={inp}><option value="">Select...</option>{['S1','S2','S3','S4','S5','S6','Mixed'].map(y=><option key={y} value={y}>{y}</option>)}</select></div>
          </div>
        </div>
        <div style={card}>
          <h2 style={{ margin: '0 0 6px 0', fontSize: '16px', fontWeight: '600', color: '#111827' }}>Pronoun Set</h2>
          <p style={{ margin: '0 0 14px 0', fontSize: '13px', color: '#6b7280' }}>Choose the pronoun set for this class.</p>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3,1fr)', gap: '10px' }}>
            {(['he/his','she/her','they/their'] as PronounSet[]).map(p => (
              <button key={p} onClick={() => setPronounSet(p)} style={{ padding: '14px', borderRadius: '8px', cursor: 'pointer', textAlign: 'left', border: pronounSet===p ? '2px solid #3b82f6' : '2px solid #e5e7eb', backgroundColor: pronounSet===p ? '#eff6ff' : 'white' }}>
                <div style={{ fontSize: '15px', fontWeight: '700', color: pronounSet===p ? '#1d4ed8' : '#111827', marginBottom: '4px' }}>{p === 'he/his' ? 'He / His' : p === 'she/her' ? 'She / Her' : 'They / Their'}</div>
                <div style={{ fontSize: '12px', color: '#6b7280', fontStyle: 'italic' }}>{p === 'he/his' ? 'He works hard. His effort is excellent.' : p === 'she/her' ? 'She works hard. Her effort is excellent.' : 'They work hard. Their effort is excellent.'}</div>
              </button>
            ))}
          </div>
        </div>
        <div style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div><h2 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '600', color: '#111827' }}>Paste Your Reports <span style={{ color: '#ef4444' }}>*</span></h2><p style={{ margin: 0, fontSize: '13px', color: '#6b7280' }}>Paste all your reports — the more the better.</p></div>
            <span style={{ fontSize: '12px', color: '#6b7280', whiteSpace: 'nowrap', marginLeft: '12px' }}>{rawReportText.length.toLocaleString()} chars</span>
          </div>
          <textarea value={rawReportText} onChange={e => setRawReportText(e.target.value)} placeholder="Paste your reports here..." style={{ ...txa, minHeight: '320px' }} />
        </div>
        <ErrorBox />
        <button onClick={() => { if (!subject.trim()) { setError('Please enter the subject.'); return; } if (!rawReportText.trim()) { setError('Please paste your reports.'); return; } setError(null); setMainStep('builder'); setSectionStep('menu'); }} style={{ ...btnP, width: '100%', padding: '16px', fontSize: '16px' }}>Start Building My Template →</button>
        <p style={{ textAlign: 'center', fontSize: '12px', color: '#9ca3af', marginTop: '12px' }}>Reports are not stored after processing.</p>
      </main>
    </div>
  );

  // ─── STEP: BUILDER ────────────────────────────────────────────────────────
  if (mainStep === 'builder') {

    // ── MENU ──────────────────────────────────────────────────────────────────
    if (sectionStep === 'menu') return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
        <Header onBack={() => setMainStep('paste')} subtitle="Add sections in the order they appear in your reports" />
        <main style={{ maxWidth: '800px', margin: '0 auto', padding: isMobile ? '16px' : '32px 24px' }}>
          <BuiltList />
          <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '10px', padding: '16px', marginBottom: '20px' }}>
            <h3 style={{ margin: '0 0 6px 0', fontSize: '14px', fontWeight: '600', color: '#92400e' }}>💡 How this works</h3>
            <p style={{ margin: 0, fontSize: '13px', color: '#78350f', lineHeight: '1.6' }}>Work through your report from top to bottom. For each section in your report, pick the type below and we'll help you build it. Add as many sections as you need, then generate your template.</p>
          </div>
          <div style={card}>
            <h2 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600', color: '#111827' }}>What's the next section in your report?</h2>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2,1fr)', gap: '12px' }}>
              {[
                { icon: '⭐', title: 'Rating / Judgement Statement', desc: 'e.g. progress, effort, behaviour — where you rate how well each pupil is doing', step: 'rating_name' as SectionStep },
                { icon: '🎯', title: 'Pupil Qualities', desc: 'Character, attitude, working style, participation — what you say about each pupil as a person', step: 'qualities_selected' as SectionStep },
                { icon: '📌', title: 'Standard Comment or Comments', desc: 'Fixed text or a set of options the teacher selects — no AI involvement', step: 'standard_type' as SectionStep },
                { icon: '📊', title: 'Assessment Score', desc: 'Reporting on test or assessment results, with or without a numeric score', step: 'assessment_flow' as SectionStep },
                { icon: '📈', title: 'Areas for Development', desc: 'What the pupil needs to improve — development sentences grouped by topic', step: 'development_selected' as SectionStep },
                { icon: '🚀', title: 'Next Steps', desc: 'Forward-looking improvement suggestions, often starting with "Moving forward,"', step: 'nextsteps_selected' as SectionStep },
                { icon: '✏️', title: 'Optional Comment Box', desc: 'A free text box the teacher fills in per pupil', step: 'menu' as SectionStep, action: () => { addSection({ id: `s_${Date.now()}`, type: 'optional-additional-comment', name: 'Additional Comments', openerType: 'name', data: {} }); } },
              ].map(item => (
                <button key={item.title} onClick={() => { if (item.action) { item.action(); } else { setSectionStep(item.step); setError(null); } }}
                  style={{ padding: '18px', border: '2px solid #e5e7eb', borderRadius: '10px', backgroundColor: 'white', cursor: 'pointer', textAlign: 'left', transition: 'border-color 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = '#3b82f6')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = '#e5e7eb')}>
                  <div style={{ fontSize: '22px', marginBottom: '8px' }}>{item.icon}</div>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: '#111827', marginBottom: '4px' }}>{item.title}</div>
                  <div style={{ fontSize: '12px', color: '#6b7280', lineHeight: '1.5' }}>{item.desc}</div>
                </button>
              ))}
            </div>
          </div>
          {builtSections.length > 0 && (
            <button onClick={handleAssemble} style={{ ...btnG, width: '100%', padding: '16px', fontSize: '16px' }}>🪄 Generate My Template</button>
          )}
        </main>
      </div>
    );

    // ── RATING: NAME ──────────────────────────────────────────────────────────
    if (sectionStep === 'rating_name') return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
        <Header onBack={() => setSectionStep('menu')} subtitle="Rating / Judgement Statement" />
        <main style={{ maxWidth: '700px', margin: '0 auto', padding: isMobile ? '16px' : '32px 24px' }}>
          <div style={card}>
            <h2 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '700', color: '#111827' }}>What are you rating or judging?</h2>
            <p style={{ margin: '0 0 20px 0', fontSize: '14px', color: '#6b7280' }}>This will become the name of the section. e.g. "Progress", "Effort", "Behaviour", "Attainment"</p>
            <ErrorBox />
            <input type="text" value={ratingName} onChange={e => setRatingName(e.target.value)} placeholder="e.g. Overall Progress" style={{ ...inp, marginBottom: '16px' }} />
            <button onClick={() => { if (!ratingName.trim()) { setError('Please enter what you are rating.'); return; } setError(null); setSectionStep('rating_scale'); }} style={{ ...btnP, width: '100%', padding: '14px' }}>Next →</button>
            <button onClick={() => setSectionStep('menu')} style={{ ...btnS, width: '100%', marginTop: '8px' }}>Cancel</button>
          </div>
        </main>
      </div>
    );

    // ── RATING: SCALE ─────────────────────────────────────────────────────────
    if (sectionStep === 'rating_scale') return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
        <Header onBack={() => setSectionStep('rating_name')} subtitle={`Rating — ${ratingName}`} />
        <main style={{ maxWidth: '700px', margin: '0 auto', padding: isMobile ? '16px' : '32px 24px' }}>
          <div style={card}>
            <h2 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '700', color: '#111827' }}>How do you rate {ratingName.toLowerCase()} in your reports?</h2>
            <p style={{ margin: '0 0 20px 0', fontSize: '14px', color: '#6b7280' }}>Choose the scale that best matches how you write your reports.</p>
            <ErrorBox />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button onClick={() => { setRatingScale('four-level'); setSectionStep('rating_examples'); }} style={{ ...btnP, padding: '18px', textAlign: 'left' }}>
                <div style={{ fontWeight: '700', marginBottom: '4px' }}>A) Standard 4-level scale</div>
                <div style={{ fontSize: '13px', opacity: 0.9 }}>Excellent · Good · Satisfactory · Needs Improvement — Claude will map your sentences to these four levels</div>
              </button>
              <button onClick={() => { setRatingScale('own'); setSectionStep('rating_examples'); }} style={{ ...btnV, padding: '18px', textAlign: 'left' }}>
                <div style={{ fontWeight: '700', marginBottom: '4px' }}>B) My own scale from my reports</div>
                <div style={{ fontSize: '13px', opacity: 0.9 }}>Claude will identify your own groupings from your reports and create headings that match your language</div>
              </button>
            </div>
            <button onClick={() => setSectionStep('menu')} style={{ ...btnS, width: '100%', marginTop: '10px' }}>Cancel</button>
          </div>
        </main>
      </div>
    );

    // ── RATING: EXAMPLES ──────────────────────────────────────────────────────
    if (sectionStep === 'rating_examples') return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
        <Header onBack={() => setSectionStep('rating_scale')} subtitle={`Rating — ${ratingName}`} />
        <main style={{ maxWidth: '700px', margin: '0 auto', padding: isMobile ? '16px' : '32px 24px' }}>
          <div style={card}>
            <h2 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '700', color: '#111827' }}>Paste example sentences about {ratingName.toLowerCase()}</h2>
            <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#6b7280' }}>
              {ratingScale === 'four-level' ? 'Paste 3–5 examples showing different levels — excellent, good, satisfactory, needs improvement. Claude will map them to the 4 levels and generate any missing options.' : 'Paste 3–5 examples showing your different groupings. Claude will identify your own scale and create headings that match your language.'}
            </p>
            <div style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '10px 12px', marginBottom: '16px' }}>
              <p style={{ margin: 0, fontSize: '13px', color: '#1e40af' }}>💡 Replace any pupil names in your examples with [Name] before pasting.</p>
            </div>
            <ErrorBox />
            {ratingExamples.map((ex, i) => (
              <div key={i} style={{ marginBottom: '8px' }}>
                <label style={{ ...lbl, fontSize: '12px', color: '#9ca3af' }}>Example {i+1}{i>1?' (optional)':''}</label>
                <input type="text" value={ex} onChange={e => { const u = [...ratingExamples]; u[i]=e.target.value; setRatingExamples(u); }} placeholder={`Paste an example ${ratingName.toLowerCase()} sentence...`} style={inp} />
              </div>
            ))}
            <button onClick={handleBuildRating} style={{ ...btnP, width: '100%', marginTop: '16px', padding: '14px' }}>✓ Read my reports and build this section</button>
            <button onClick={() => setSectionStep('menu')} style={{ ...btnS, width: '100%', marginTop: '8px' }}>Cancel</button>
          </div>
        </main>
      </div>
    );

    // ── QUALITIES: SELECTED ───────────────────────────────────────────────────
    if (sectionStep === 'qualities_selected') return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
        <Header onBack={() => setSectionStep('menu')} subtitle="Pupil Qualities" />
        <main style={{ maxWidth: '700px', margin: '0 auto', padding: isMobile ? '16px' : '32px 24px' }}>
          <div style={card}>
            <h2 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '700', color: '#111827' }}>Paste quality sentences from your reports</h2>
            <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#6b7280' }}>Copy and paste just the quality/character sentences from several of your reports — not the whole reports, just the sentences describing each pupil's qualities, effort, behaviour and working style. Include a range of different types of pupil. Claude will use these to find all quality sentences across all your reports.</p>
            <div style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '10px 12px', marginBottom: '16px' }}>
              <p style={{ margin: 0, fontSize: '13px', color: '#1e40af' }}>💡 Replace any pupil names with [Name] before pasting.</p>
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label style={lbl}>Section name</label>
              <input type="text" value={qualitiesName} onChange={e => setQualitiesName(e.target.value)} placeholder="e.g. Personal Qualities" style={inp} />
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label style={lbl}>Does this sentence use the pupil's name or pronoun?</label>
              <OpenerChoice value={qualitiesOpener} onChange={setQualitiesOpener} />
            </div>
            <label style={lbl}>Paste your selected quality sentences</label>
            <textarea value={qualitiesSelected} onChange={e => setQualitiesSelected(e.target.value)} placeholder="Paste quality sentences from several reports here..." style={{ ...txa, minHeight: '200px', marginBottom: '16px' }} />
            <ErrorBox />
            <button onClick={handleBuildQualities} style={{ ...btnP, width: '100%', padding: '14px' }}>✓ Extract and group all quality sentences</button>
            <button onClick={() => setSectionStep('menu')} style={{ ...btnS, width: '100%', marginTop: '8px' }}>Cancel</button>
          </div>
        </main>
      </div>
    );

    // ── QUALITIES: COPY ───────────────────────────────────────────────────────
    if (sectionStep === 'qualities_copy') return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
        <Header onBack={() => setSectionStep('menu')} subtitle="Pupil Qualities" />
        <main style={{ maxWidth: '700px', margin: '0 auto', padding: isMobile ? '16px' : '32px 24px' }}>
          <BuiltList />
          <div style={card}>
            <h2 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '700', color: '#111827' }}>Would you like to add another version of this qualities section?</h2>
            <p style={{ margin: '0 0 20px 0', fontSize: '14px', color: '#6b7280' }}>You can create a copy where every sentence starts with {pronounCapital} instead of [Name] — or another [Name]-led copy. This lets teachers pick a name-led sentence and a pronoun-led follow-on sentence to build a natural flowing paragraph.</p>
            <ErrorBox />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button onClick={() => handleCopyQualities('pronoun')} style={{ ...btnV, padding: '14px' }}>Yes — create a {pronounCapital}-led copy</button>
              <button onClick={() => handleCopyQualities('name')} style={{ ...btnP, padding: '14px' }}>Yes — create a [Name]-led copy</button>
              <button onClick={() => setSectionStep('menu')} style={{ ...btnS, padding: '14px' }}>No — that's enough qualities sections</button>
            </div>
          </div>
        </main>
      </div>
    );

    // ── STANDARD: TYPE ────────────────────────────────────────────────────────
    if (sectionStep === 'standard_type') return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
        <Header onBack={() => setSectionStep('menu')} subtitle="Standard Comment or Comments" />
        <main style={{ maxWidth: '700px', margin: '0 auto', padding: isMobile ? '16px' : '32px 24px' }}>
          <div style={card}>
            <h2 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '700', color: '#111827' }}>What type of standard comment is this?</h2>
            <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#6b7280' }}>No AI will be involved — you paste exactly what you want to appear.</p>
            <div style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '10px 12px', marginBottom: '20px' }}>
              <p style={{ margin: 0, fontSize: '13px', color: '#1e40af' }}>💡 Replace any pupil names with [Name] before pasting.</p>
            </div>
            <ErrorBox />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button onClick={() => setSectionStep('standard_single')} style={{ ...btnP, padding: '18px', textAlign: 'left' }}>
                <div style={{ fontWeight: '700', marginBottom: '4px' }}>A) One sentence or paragraph that appears in almost all reports</div>
                <div style={{ fontSize: '13px', opacity: 0.9 }}>e.g. a course description, assessment analysis note, department information. Appears automatically — teacher can exclude for individuals if needed.</div>
              </button>
              <button onClick={() => setSectionStep('standard_multi')} style={{ ...btnV, padding: '18px', textAlign: 'left' }}>
                <div style={{ fontWeight: '700', marginBottom: '4px' }}>B) Different sentences for different pupils</div>
                <div style={{ fontSize: '13px', opacity: 0.9 }}>e.g. pathway options, course levels. You give each option a button label and paste the text — teacher picks the right one when writing each report.</div>
              </button>
            </div>
            <button onClick={() => setSectionStep('menu')} style={{ ...btnS, width: '100%', marginTop: '10px' }}>Cancel</button>
          </div>
        </main>
      </div>
    );

    // ── STANDARD: SINGLE ──────────────────────────────────────────────────────
    if (sectionStep === 'standard_single') return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
        <Header onBack={() => setSectionStep('standard_type')} subtitle="Standard Comment" />
        <main style={{ maxWidth: '700px', margin: '0 auto', padding: isMobile ? '16px' : '32px 24px' }}>
          <div style={card}>
            <h2 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '700', color: '#111827' }}>Enter your standard comment</h2>
            <p style={{ margin: '0 0 20px 0', fontSize: '14px', color: '#6b7280' }}>This will appear automatically in every report. Replace any pupil names with [Name] before pasting.</p>
            <ErrorBox />
            <div style={{ marginBottom: '12px' }}><label style={lbl}>Section name</label><input type="text" value={standardName} onChange={e => setStandardName(e.target.value)} placeholder="e.g. Course Content, Assessment Analysis" style={inp} /></div>
            <div style={{ marginBottom: '16px' }}><label style={lbl}>Text (paste exactly as it should appear)</label><textarea value={standardContent} onChange={e => setStandardContent(e.target.value)} placeholder="Paste the text here — with [Name] instead of pupil names..." style={{ ...txa, minHeight: '120px' }} /></div>
            <button onClick={handleAddStandardSingle} style={{ ...btnG, width: '100%', padding: '14px' }}>Add Standard Comment</button>
            <button onClick={() => setSectionStep('menu')} style={{ ...btnS, width: '100%', marginTop: '8px' }}>Cancel</button>
          </div>
        </main>
      </div>
    );

    // ── STANDARD: MULTI ───────────────────────────────────────────────────────
    if (sectionStep === 'standard_multi') return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
        <Header onBack={() => setSectionStep('standard_type')} subtitle="Standard Comments — Multiple Options" />
        <main style={{ maxWidth: '700px', margin: '0 auto', padding: isMobile ? '16px' : '32px 24px' }}>
          <div style={card}>
            <h2 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '700', color: '#111827' }}>Enter your comment options</h2>
            <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#6b7280' }}>Give each option a button label (what the teacher will click) and paste the text. Replace any pupil names with [Name].</p>
            <div style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '10px 12px', marginBottom: '16px' }}>
              <p style={{ margin: 0, fontSize: '13px', color: '#1e40af' }}>💡 The button label is what the teacher sees and clicks — e.g. "National 5 Pathway", "National 4 Pathway"</p>
            </div>
            <ErrorBox />
            <div style={{ marginBottom: '16px' }}><label style={lbl}>Section name</label><input type="text" value={standardName} onChange={e => setStandardName(e.target.value)} placeholder="e.g. Pathway Information" style={inp} /></div>
            {multiOptions.map((opt, i) => (
              <div key={i} style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '14px', marginBottom: '10px', backgroundColor: '#f9fafb' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: '#374151' }}>Option {i+1}</span>
                  {i > 0 && <button onClick={() => setMultiOptions(prev => prev.filter((_,j) => j !== i))} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '18px' }}>×</button>}
                </div>
                <div style={{ marginBottom: '8px' }}><label style={{ ...lbl, fontSize: '12px' }}>Button label</label><input type="text" value={opt.label} onChange={e => { const u=[...multiOptions]; u[i]={...u[i],label:e.target.value}; setMultiOptions(u); }} placeholder="e.g. National 5 Pathway" style={inp} /></div>
                <div><label style={{ ...lbl, fontSize: '12px' }}>Text (with [Name] instead of pupil names)</label><textarea value={opt.content} onChange={e => { const u=[...multiOptions]; u[i]={...u[i],content:e.target.value}; setMultiOptions(u); }} placeholder="Paste the text for this option..." style={{ ...txa, minHeight: '100px' }} /></div>
              </div>
            ))}
            <button onClick={() => setMultiOptions(prev => [...prev, { label: '', content: '' }])} style={{ ...btnS, width: '100%', marginBottom: '12px' }}>+ Add Another Option</button>
            <button onClick={handleAddStandardMulti} style={{ ...btnG, width: '100%', padding: '14px' }}>Add Section</button>
            <button onClick={() => setSectionStep('menu')} style={{ ...btnS, width: '100%', marginTop: '8px' }}>Cancel</button>
          </div>
        </main>
      </div>
    );

    // ── ASSESSMENT FLOW ───────────────────────────────────────────────────────
    if (sectionStep === 'assessment_flow') {

      if (assessmentStep === 'type') return (
        <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
          <Header onBack={() => { setSectionStep('menu'); setAssessmentStep('type'); }} subtitle="Assessment Score" />
          <main style={{ maxWidth: '700px', margin: '0 auto', padding: isMobile ? '16px' : '32px 24px' }}>
            <div style={card}>
              <h2 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '700', color: '#111827' }}>How do you report on the assessment score?</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
                <button onClick={() => { setAssessment(a => ({...a, statementType: 'same'})); setAssessmentStep('count'); }} style={{ ...btnP, padding: '18px', textAlign: 'left' }}>
                  <div style={{ fontWeight: '700', marginBottom: '4px' }}>A) Same or similar statement for every pupil</div>
                  <div style={{ fontSize: '13px', opacity: 0.9 }}>Only the name and score change — e.g. "[Name] scored [Score] in the end of unit assessment"</div>
                </button>
                <button onClick={() => { setAssessment(a => ({...a, statementType: 'different'})); setAssessmentStep('count'); }} style={{ ...btnV, padding: '18px', textAlign: 'left' }}>
                  <div style={{ fontWeight: '700', marginBottom: '4px' }}>B) Different statements depending on performance</div>
                  <div style={{ fontSize: '13px', opacity: 0.9 }}>e.g. "performed excellently" for high scores, "found it challenging" for lower scores</div>
                </button>
              </div>
              <button onClick={() => setSectionStep('menu')} style={{ ...btnS, width: '100%', marginTop: '10px' }}>Cancel</button>
            </div>
          </main>
        </div>
      );

      if (assessmentStep === 'count') return (
        <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
          <Header onBack={() => setAssessmentStep('type')} subtitle="Assessment Score" />
          <main style={{ maxWidth: '700px', margin: '0 auto', padding: isMobile ? '16px' : '32px 24px' }}>
            <div style={card}>
              <h2 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '700', color: '#111827' }}>How many assessments do you report on?</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
                <button onClick={() => { setAssessment(a => ({...a, count: 'one', partIndex: 1})); setAssessmentStep('examples'); }} style={{ ...btnP, padding: '14px' }}>A) One assessment only</button>
                <button onClick={() => { setAssessment(a => ({...a, count: 'multiple'})); setAssessmentStep('sentence_type'); }} style={{ ...btnV, padding: '14px' }}>B) More than one assessment</button>
              </div>
              <button onClick={() => setSectionStep('menu')} style={{ ...btnS, width: '100%', marginTop: '10px' }}>Cancel</button>
            </div>
          </main>
        </div>
      );

      if (assessmentStep === 'sentence_type') return (
        <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
          <Header onBack={() => setAssessmentStep('count')} subtitle="Assessment Score" />
          <main style={{ maxWidth: '700px', margin: '0 auto', padding: isMobile ? '16px' : '32px 24px' }}>
            <div style={card}>
              <h2 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '700', color: '#111827' }}>How do you write about multiple assessments?</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
                <button onClick={() => { setAssessment(a => ({...a, sentenceType: 'one-sentence', partIndex: 1})); setAssessmentStep('examples'); }} style={{ ...btnP, padding: '18px', textAlign: 'left' }}>
                  <div style={{ fontWeight: '700', marginBottom: '4px' }}>A) One sentence covers all scores</div>
                  <div style={{ fontSize: '13px', opacity: 0.9 }}>e.g. "[Name] scored [Score] in Test 1 and [Score] in Test 2"</div>
                </button>
                <button onClick={() => { setAssessment(a => ({...a, sentenceType: 'separate', partIndex: 1})); setAssessmentStep('examples'); }} style={{ ...btnV, padding: '18px', textAlign: 'left' }}>
                  <div style={{ fontWeight: '700', marginBottom: '4px' }}>B) A different sentence for each assessment</div>
                  <div style={{ fontSize: '13px', opacity: 0.9 }}>Each assessment gets its own separate statement</div>
                </button>
              </div>
              <button onClick={() => setSectionStep('menu')} style={{ ...btnS, width: '100%', marginTop: '10px' }}>Cancel</button>
            </div>
          </main>
        </div>
      );

      if (assessmentStep === 'examples' || assessmentStep === 'part2' || assessmentStep === 'part3') {
        const isOneSentence = assessment.count === 'multiple' && assessment.sentenceType === 'one-sentence';
        const isSeparate = assessment.count === 'multiple' && assessment.sentenceType === 'separate';
        const partLabel = isOneSentence ? ` — Part ${assessment.partIndex}` : isSeparate ? ` ${assessment.partIndex}` : '';
        const sectionLabel = `Assessment${partLabel}`;
        const desc = isOneSentence && assessment.partIndex === 1
          ? 'Paste the start of the sentence including the first score. e.g. "[Name] scored [Score] in the MQS assessment". We will link this to the next part.'
          : isOneSentence
          ? `Part ${assessment.partIndex} of the sentence. e.g. "and [Score] in the Black Death assessment." Start with the connecting word.`
          : assessment.statementType === 'same'
          ? 'Replace the actual score with [Score] and any pupil names with [Name] before pasting.'
          : 'Paste 3–5 examples showing different performance levels.';

        return (
          <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
            <Header onBack={() => setAssessmentStep(assessmentStep === 'examples' ? 'count' : 'examples')} subtitle="Assessment Score" />
            <main style={{ maxWidth: '700px', margin: '0 auto', padding: isMobile ? '16px' : '32px 24px' }}>
              <div style={card}>
                <h2 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '700', color: '#111827' }}>
                  {isOneSentence ? `Part ${assessment.partIndex} of your assessment sentence` : isSeparate ? `Assessment ${assessment.partIndex}` : 'Your assessment statement'}
                </h2>
                <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#6b7280' }}>{desc}</p>
                {isOneSentence && assessment.partIndex === 1 && (
                  <div style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '10px 12px', marginBottom: '12px' }}>
                    <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#1e40af' }}>How many scores in your sentence?</p>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {[2,3].map(n => <button key={n} onClick={() => setAssessment(a => ({...a, totalParts: n}))} style={{ padding: '6px 14px', borderRadius: '6px', border: assessment.totalParts===n ? '2px solid #3b82f6' : '1px solid #d1d5db', backgroundColor: assessment.totalParts===n ? '#eff6ff' : 'white', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>{n} scores</button>)}
                    </div>
                  </div>
                )}
                <ErrorBox />
                {assessment.examples.map((ex, i) => (
                  <div key={i} style={{ marginBottom: '8px' }}>
                    <label style={{ ...lbl, fontSize: '12px', color: '#9ca3af' }}>Example {i+1}{i>1?' (optional)':''}</label>
                    <input type="text" value={ex} onChange={e => { const u=[...assessment.examples]; u[i]=e.target.value; setAssessment(a => ({...a, examples: u})); }} placeholder="Paste an example..." style={inp} />
                  </div>
                ))}
                <button onClick={() => {
                  const examples = assessment.examples.filter(e => e.trim());
                  if (examples.length === 0) { setError('Please paste at least one example.'); return; }
                  setError(null);
                  if (assessment.statementType === 'same') {
                    handleBuildAssessmentSame(examples, sectionLabel);
                  } else {
                    // Different statements — use rating mode with assessment-comment
                    setIsLoading(true);
                    setLoadingMessage('Building assessment section...');
                    callApi({ mode: 'rating', subject, yearGroup, reportText: rawReportText, pronounSet, sectionName: sectionLabel, scaleType: 'four-level', examples })
                      .then(result => {
                        const comments = result.result || {};
                        // Strip % from all assessment comments
                        Object.keys(comments).forEach(k => { comments[k] = (comments[k] as string[]).map(stripPercent); });
                        if (!comments.notCompleted || comments.notCompleted.length === 0) { comments.notCompleted = ['[Name] has not yet completed this assessment.', '[Name] was absent for this assessment.']; }
                        addSection({ id: `s_${Date.now()}`, type: 'assessment-comment', name: sectionLabel, openerType: 'name', data: { scoreType: 'percentage', comments } });
                      })
                      .catch(() => setError('Failed. Please try again.'))
                      .finally(() => setIsLoading(false));
                  }
                  // Determine next step
                  const hasMoreParts = (isOneSentence && assessment.partIndex < assessment.totalParts) || (isSeparate && assessment.partIndex < 3);
                  if (hasMoreParts) { setAssessment(a => ({...a, partIndex: a.partIndex + 1, examples: ['','','','','']})); setAssessmentStep('part2'); }
                  else { setAssessment(a => ({...a, examples: ['','','','','']})); setAssessmentStep('judgement'); }
                }} style={{ ...btnP, width: '100%', marginTop: '16px', padding: '14px' }}>
                  ✓ {assessment.statementType === 'same' ? 'Create this assessment section' : 'Read my reports and build this section'}
                </button>
                <button onClick={() => setSectionStep('menu')} style={{ ...btnS, width: '100%', marginTop: '8px' }}>Cancel</button>
              </div>
            </main>
          </div>
        );
      }

      if (assessmentStep === 'judgement') return (
        <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
          <Header onBack={() => setAssessmentStep('examples')} subtitle="Assessment Score" />
          <main style={{ maxWidth: '700px', margin: '0 auto', padding: isMobile ? '16px' : '32px 24px' }}>
            <BuiltList />
            <div style={card}>
              <h2 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '700', color: '#111827' }}>Would you like to add a judgement statement after the assessment score?</h2>
              <p style={{ margin: '0 0 20px 0', fontSize: '14px', color: '#6b7280' }}>A separate qualities section the teacher chooses from — commenting on how well the pupil did overall.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button onClick={() => setAssessmentStep('judgement_examples')} style={{ ...btnP, padding: '14px' }}>Yes — add a judgement comment section</button>
                <button onClick={() => { setAssessmentStep('type'); setSectionStep('menu'); }} style={{ ...btnS, padding: '14px' }}>No — assessment sections are done</button>
              </div>
            </div>
          </main>
        </div>
      );

      if (assessmentStep === 'judgement_examples') return (
        <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
          <Header onBack={() => setAssessmentStep('judgement')} subtitle="Assessment Judgement" />
          <main style={{ maxWidth: '700px', margin: '0 auto', padding: isMobile ? '16px' : '32px 24px' }}>
            <div style={card}>
              <h2 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '700', color: '#111827' }}>Paste examples of your assessment judgement statements</h2>
              <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#6b7280' }}>Different statements for different performance levels. Replace pupil names with [Name].</p>
              <ErrorBox />
              {assessment.examples.map((ex, i) => (
                <div key={i} style={{ marginBottom: '8px' }}>
                  <label style={{ ...lbl, fontSize: '12px', color: '#9ca3af' }}>Example {i+1}{i>1?' (optional)':''}</label>
                  <input type="text" value={ex} onChange={e => { const u=[...assessment.examples]; u[i]=e.target.value; setAssessment(a => ({...a, examples: u})); }} placeholder="Paste a judgement statement..." style={inp} />
                </div>
              ))}
              <button onClick={async () => {
                const examples = assessment.examples.filter(e => e.trim());
                if (examples.length === 0) { setError('Please paste at least one example.'); return; }
                setError(null); setIsLoading(true); setLoadingMessage('Building judgement section...');
                try {
                  const result = await callApi({ mode: 'extract-qualities', subject, yearGroup, reportText: rawReportText, pronounSet, sectionName: 'Assessment Reflection', openerType: 'pronoun', selectedText: examples.join('\n') });
                  addSection({ id: `s_${Date.now()}`, type: 'qualities', name: result.sectionName || 'Assessment Reflection', openerType: 'pronoun', data: { comments: Object.fromEntries(result.headings.map((h: any) => [h.name, h.comments])) } });
                  setAssessmentStep('type');
                } catch { setError('Failed. Please try again.'); }
                finally { setIsLoading(false); }
              }} style={{ ...btnP, width: '100%', marginTop: '16px', padding: '14px' }}>✓ Build judgement section</button>
              <button onClick={() => setSectionStep('menu')} style={{ ...btnS, width: '100%', marginTop: '8px' }}>Cancel</button>
            </div>
          </main>
        </div>
      );
    }

    // ── DEVELOPMENT / NEXT STEPS: SELECTED ────────────────────────────────────
    const isDevOrNS = sectionStep === 'development_selected' || sectionStep === 'nextsteps_selected' || sectionStep === 'development_building' || sectionStep === 'nextsteps_building' || sectionStep === 'development_more' || sectionStep === 'nextsteps_more';
    if (isDevOrNS) {
      const isNS = sectionStep === 'nextsteps_selected' || sectionStep === 'nextsteps_building' || sectionStep === 'nextsteps_more';
      const currentType: 'development' | 'nextsteps' = isNS ? 'nextsteps' : 'development';

      if (sectionStep === 'development_selected' || sectionStep === 'nextsteps_selected') return (
        <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
          <Header onBack={() => setSectionStep('menu')} subtitle={isNS ? 'Next Steps' : 'Areas for Development'} />
          <main style={{ maxWidth: '700px', margin: '0 auto', padding: isMobile ? '16px' : '32px 24px' }}>
            <div style={card}>
              <h2 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '700', color: '#111827' }}>Paste {isNS ? 'next steps' : 'areas for development'} sentences from your reports</h2>
              <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#6b7280' }}>
                {isNS ? 'Copy just the next steps sentences from several of your reports. If they always start with a phrase like "Moving forward," include that. Claude will group them by topic.' : 'Copy just the development sentences from several reports — what each pupil needs to improve. Claude will group them by topic. Don\'t include any "Next Steps:" headings or standard closing advice.'}
              </p>
              <div style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '10px 12px', marginBottom: '16px' }}>
                <p style={{ margin: 0, fontSize: '13px', color: '#1e40af' }}>💡 Replace any pupil names with [Name] before pasting.</p>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={lbl}>Section name</label>
                <input type="text" value={devName} onChange={e => setDevName(e.target.value)} placeholder={isNS ? 'e.g. Next Steps, Moving Forward' : 'e.g. Areas for Development'} style={inp} />
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={lbl}>Does the first sentence use the pupil's name or pronoun?</label>
                <OpenerChoice value={devOpener} onChange={setDevOpener} />
              </div>
              <label style={lbl}>Paste your selected sentences</label>
              <textarea value={devSelected} onChange={e => setDevSelected(e.target.value)} placeholder={`Paste ${isNS ? 'next steps' : 'development'} sentences from several reports here...`} style={{ ...txa, minHeight: '180px', marginBottom: '16px' }} />
              <ErrorBox />
              <button onClick={() => { setDevType(currentType); setDevSentenceIndex(1); handleBuildDevelopment(); }} style={{ ...btnP, width: '100%', padding: '14px' }}>✓ Group these into topics</button>
              <button onClick={() => setSectionStep('menu')} style={{ ...btnS, width: '100%', marginTop: '8px' }}>Cancel</button>
            </div>
          </main>
        </div>
      );

      if (sectionStep === 'development_more' || sectionStep === 'nextsteps_more') return (
        <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
          <Header onBack={() => setSectionStep('menu')} subtitle={isNS ? 'Next Steps' : 'Areas for Development'} />
          <main style={{ maxWidth: '700px', margin: '0 auto', padding: isMobile ? '16px' : '32px 24px' }}>
            <BuiltList />
            <div style={card}>
              <h2 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '700', color: '#111827' }}>What would you like to do next?</h2>
              <p style={{ margin: '0 0 20px 0', fontSize: '14px', color: '#6b7280' }}>You can add a copy of the last section with a different opener, add a brand new sentence, or move on.</p>
              <ErrorBox />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button onClick={() => handleCopyDevSection('name')} style={{ ...btnP, padding: '14px' }}>Copy last section — containing [Name]</button>
                <button onClick={() => handleCopyDevSection('pronoun')} style={{ ...btnV, padding: '14px' }}>Copy last section — containing {pronounCapital}</button>
                <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '14px', backgroundColor: '#f9fafb' }}>
                  <p style={{ margin: '0 0 10px 0', fontSize: '13px', fontWeight: '600', color: '#374151' }}>Or add a brand new sentence:</p>
                  <div style={{ marginBottom: '10px' }}>
                    <label style={{ ...lbl, fontSize: '12px' }}>Section name</label>
                    <input type="text" value={devName} onChange={e => setDevName(e.target.value)} placeholder={isNS ? 'e.g. Next Steps — Sentence 2' : 'e.g. Areas for Development — Sentence 2'} style={inp} />
                  </div>
                  <div style={{ marginBottom: '10px' }}>
                    <OpenerChoice value={devOpener} onChange={setDevOpener} />
                  </div>
                  <textarea value={devSelected} onChange={e => setDevSelected(e.target.value)} placeholder="Paste examples from several reports..." style={{ ...txa, minHeight: '120px', marginBottom: '10px' }} />
                  <button onClick={() => { setDevType(currentType); handleBuildDevelopment(); }} style={{ ...btnP, width: '100%', padding: '12px' }}>Build this new sentence section</button>
                </div>
                <button onClick={() => setSectionStep('menu')} style={{ ...btnG, padding: '14px' }}>No more — move on</button>
              </div>
            </div>
          </main>
        </div>
      );
    }
  }

  // ─── GENERATING ───────────────────────────────────────────────────────────
  if (mainStep === 'generating') return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '48px 40px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', textAlign: 'center', maxWidth: '400px' }}>
        <div style={{ fontSize: '48px', marginBottom: '20px' }}>🪄</div>
        <h2 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: '700', color: '#111827' }}>Building Your Template</h2>
        <p style={{ margin: '0 0 24px 0', color: '#6b7280', fontSize: '14px' }}>Assembling all your sections...</p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
          {[0,1,2].map(i => <div key={i} style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#3b82f6', animation: 'pulse 1.2s ease-in-out infinite', animationDelay: `${i*0.2}s` }} />)}
        </div>
        <style>{`@keyframes pulse{0%,100%{opacity:.3;transform:scale(.8)}50%{opacity:1;transform:scale(1.2)}}`}</style>
      </div>
    </div>
  );

  // ─── PREVIEW ──────────────────────────────────────────────────────────────
  if (mainStep === 'preview' && generatedTemplate) return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      <header style={{ backgroundColor: 'white', borderBottom: '1px solid #e5e7eb', padding: isMobile ? '16px' : '20px 24px' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
          <div><h1 style={{ margin: 0, fontSize: isMobile ? '16px' : '20px', fontWeight: '700', color: '#111827' }}>✅ Template Generated</h1><p style={{ margin: 0, fontSize: '12px', color: '#6b7280' }}>Review, refine, or save</p></div>
          <div style={{ display: 'flex', gap: '8px' }}><button onClick={handleEditFirst} style={{ ...{ backgroundColor: '#f3f4f6', color: '#374151', padding: '10px 18px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', fontWeight: '500', cursor: 'pointer' } }}>Save & Edit</button><button onClick={handleSave} style={btnP}>Save Template</button></div>
        </div>
      </header>
      <main style={{ maxWidth: '800px', margin: '0 auto', padding: isMobile ? '16px' : '32px 24px' }}>
        <div style={{ ...card, marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ flex: 1 }}><p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>TEMPLATE NAME</p><h2 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#111827' }}>{generatedTemplate.name}</h2></div>
            <div style={{ backgroundColor: '#eff6ff', color: '#1d4ed8', padding: '6px 12px', borderRadius: '6px', fontSize: '13px', fontWeight: '500' }}>{generatedTemplate.sections.length} sections</div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
          {generatedTemplate.sections.map((section, index) => (
            <div key={section.id} style={{ ...card, marginBottom: 0, padding: '14px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <span style={{ backgroundColor: '#f3f4f6', color: '#6b7280', fontSize: '11px', fontWeight: '600', padding: '2px 6px', borderRadius: '4px', flexShrink: 0, marginTop: '2px' }}>{index+1}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                    <span style={{ backgroundColor: getSectionTypeColor(section.type), color: 'white', fontSize: '11px', fontWeight: '600', padding: '2px 8px', borderRadius: '4px' }}>{getSectionTypeLabel(section.type)}</span>
                    {section.name && section.type !== 'new-line' && <span style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>{section.name}</span>}
                  </div>
                  <p style={{ margin: 0, fontSize: '12px', color: '#6b7280' }}>{getSectionSummary(section)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ ...card, border: '2px solid #8b5cf6', marginBottom: '16px' }}>
          <h3 style={{ margin: '0 0 6px 0', fontSize: '15px', fontWeight: '600', color: '#111827' }}>🔄 Refine with More Reports</h3>
          <p style={{ margin: '0 0 12px 0', fontSize: '13px', color: '#6b7280' }}>Paste more reports to add additional options.</p>
          <textarea value={refineText} onChange={e => setRefineText(e.target.value)} placeholder="Paste more reports here..." style={{ ...txa, minHeight: '120px', marginBottom: '12px' }} />
          {error && <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '10px', marginBottom: '10px', color: '#b91c1c', fontSize: '13px' }}>⚠️ {error}</div>}
          <button onClick={handleRefine} disabled={refineText.length < 200 || isRefining} style={{ width: '100%', padding: '12px', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', backgroundColor: isRefining ? '#9ca3af' : refineText.length >= 200 ? '#8b5cf6' : '#d1d5db', color: 'white', cursor: refineText.length >= 200 && !isRefining ? 'pointer' : 'not-allowed' }}>
            {isRefining ? '🔄 Refining...' : '🔄 Refine Template'}
          </button>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={handleEditFirst} style={{ ...{ backgroundColor: '#f3f4f6', color: '#374151', padding: '14px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '15px', fontWeight: '500', cursor: 'pointer' }, flex: 1 }}>✏️ Save & Edit</button>
          <button onClick={handleSave} style={{ ...btnP, flex: 1, padding: '14px', fontSize: '15px' }}>✅ Save Template</button>
        </div>
      </main>
    </div>
  );

  // ─── SAVED ────────────────────────────────────────────────────────────────
  if (mainStep === 'saved') return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '48px 40px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', textAlign: 'center', maxWidth: '400px' }}>
        <div style={{ fontSize: '56px', marginBottom: '16px' }}>🎉</div>
        <h2 style={{ margin: '0 0 8px 0', fontSize: '22px', fontWeight: '700', color: '#111827' }}>Template Saved!</h2>
        <p style={{ margin: '0 0 8px 0', color: '#374151', fontWeight: '600', fontSize: '16px' }}>{generatedTemplate?.name}</p>
        <p style={{ margin: '0 0 32px 0', color: '#6b7280', fontSize: '14px' }}>Your template is ready to use.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <Link to="/manage-templates" style={{ textDecoration: 'none' }}><button style={{ ...btnP, width: '100%', padding: '14px', fontSize: '15px' }}>Go to Templates</button></Link>
          <button onClick={handleReset} style={{ ...{ backgroundColor: '#f3f4f6', color: '#374151', padding: '14px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '15px', fontWeight: '500', cursor: 'pointer' }, width: '100%' }}>Import Another Template</button>
        </div>
      </div>
    </div>
  );

  return null;
}