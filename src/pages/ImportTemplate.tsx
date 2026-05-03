// src/pages/ImportTemplate.tsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { TemplateSection } from '../types';

// ─── TYPES ───────────────────────────────────────────────────────────────────

type Step = 'paste' | 'preprocess' | 'generating' | 'preview' | 'saved';
type StartMode = 'quick' | 'full' | null;

interface StandardCommentDraft {
  id: string;
  name: string;
  content: string;
}

interface ChoiceCommentDraft {
  id: string;
  name: string;
  variants: { label: string; content: string }[];
}

interface PreDefinedSections {
  standardComments: StandardCommentDraft[];
  choiceComments: ChoiceCommentDraft[];
}

interface GeneratedTemplate {
  name: string;
  subject: string;
  yearGroup: string;
  sections: TemplateSection[];
}

const GENERATION_CHAR_LIMIT = 24000;
const MAX_RETRIES = 2;

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function buildCleanedText(rawText: string, preDefinedSections: PreDefinedSections): string {
  let cleaned = rawText;
  preDefinedSections.standardComments.forEach(sc => {
    if (sc.content.trim()) {
      const escaped = sc.content.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      cleaned = cleaned.replace(new RegExp(escaped, 'g'), `{{STANDARD:${sc.name}}}`);
    }
  });
  preDefinedSections.choiceComments.forEach(cc => {
    cc.variants.forEach(variant => {
      if (variant.content.trim()) {
        const escaped = variant.content.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        cleaned = cleaned.replace(new RegExp(escaped, 'g'), `{{CHOICE:${cc.name}}}`);
      }
    });
  });
  return cleaned;
}

function assembleFinalTemplate(aiSections: TemplateSection[], preDefinedSections: PreDefinedSections): TemplateSection[] {
  const standardLookup: Record<string, TemplateSection> = {};
  preDefinedSections.standardComments.forEach((sc, i) => {
    standardLookup[sc.name] = {
      id: `predefined_standard_${i}_${Date.now()}`,
      type: 'standard-comment',
      name: sc.name,
      data: { content: sc.content },
    };
  });

  const choiceLookup: Record<string, TemplateSection> = {};
  preDefinedSections.choiceComments.forEach((cc, i) => {
    const categories: Record<string, string[]> = {};
    cc.variants.forEach(v => { if (v.label && v.content) categories[v.label] = [v.content]; });
    choiceLookup[cc.name] = {
      id: `predefined_choice_${i}_${Date.now()}`,
      type: 'qualities',
      name: cc.name,
      data: { comments: categories },
    };
  });

  const assembled: TemplateSection[] = [];
  let idx = 0;

  aiSections.forEach(section => {
    const nameStr = section.name || '';

    if (nameStr.startsWith('STANDARD:')) {
      const key = nameStr.replace('STANDARD:', '').trim();
      if (standardLookup[key]) { assembled.push({ ...standardLookup[key], id: `assembled_${idx++}_${Date.now()}` }); return; }
    }
    if (nameStr.startsWith('CHOICE:')) {
      const key = nameStr.replace('CHOICE:', '').trim();
      if (choiceLookup[key]) { assembled.push({ ...choiceLookup[key], id: `assembled_${idx++}_${Date.now()}` }); return; }
    }
    if (section.type === 'standard-comment' && section.data?.content) {
      const m1 = section.data.content.match(/\{\{STANDARD:(.+?)\}\}/);
      if (m1 && standardLookup[m1[1]]) { assembled.push({ ...standardLookup[m1[1]], id: `assembled_${idx++}_${Date.now()}` }); return; }
      const m2 = section.data.content.match(/\{\{CHOICE:(.+?)\}\}/);
      if (m2 && choiceLookup[m2[1]]) { assembled.push({ ...choiceLookup[m2[1]], id: `assembled_${idx++}_${Date.now()}` }); return; }
    }

    assembled.push({ ...section, id: `assembled_${idx++}_${Date.now()}` });
  });

  return assembled;
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────

export default function ImportTemplate() {
  const navigate = useNavigate();
  const { addTemplate } = useData();

  const [step, setStep] = useState<Step>('paste');
  const [startMode, setStartMode] = useState<StartMode>(null);
  const [subject, setSubject] = useState('');
  const [yearGroup, setYearGroup] = useState('');
  const [rawReportText, setRawReportText] = useState('');
  const [additionalContext, setAdditionalContext] = useState('');
  const [generatedTemplate, setGeneratedTemplate] = useState<GeneratedTemplate | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [generatingMessage, setGeneratingMessage] = useState('Analysing your reports...');
  const [isMobile] = useState(window.innerWidth <= 768);
  const [overflowCopied, setOverflowCopied] = useState(false);

  const [preDefinedSections, setPreDefinedSections] = useState<PreDefinedSections>({
    standardComments: [], choiceComments: [],
  });

  const [scName, setScName] = useState('');
  const [scContent, setScContent] = useState('');
  const [ccName, setCcName] = useState('');
  const [ccVariants, setCcVariants] = useState([{ label: '', content: '' }, { label: '', content: '' }]);

  const [refineText, setRefineText] = useState('');
  const [isRefining, setIsRefining] = useState(false);
  const [refineError, setRefineError] = useState<string | null>(null);

  // ─── COMPUTED ──────────────────────────────────────────────────────────────

  const isQuickMode = startMode === 'quick';
  const effectivePreDefined = isQuickMode ? { standardComments: [], choiceComments: [] } : preDefinedSections;
  const cleanedText = buildCleanedText(rawReportText, effectivePreDefined);
  const cleanedCharCount = cleanedText.length;
  const rawCharCount = rawReportText.length;
  const charsSaved = rawCharCount - cleanedCharCount;
  const isOverLimit = cleanedCharCount > GENERATION_CHAR_LIMIT;
  const overflowText = isOverLimit ? cleanedText.substring(GENERATION_CHAR_LIMIT) : '';
  const refineCharCount = refineText.length;

  // ─── HANDLERS ──────────────────────────────────────────────────────────────

  const handleAddStandardComment = () => {
    if (!scName.trim() || !scContent.trim()) return;
    setPreDefinedSections(prev => ({
      ...prev,
      standardComments: [...prev.standardComments, { id: Date.now().toString(), name: scName.trim(), content: scContent.trim() }],
    }));
    setScName(''); setScContent('');
  };

  const handleAddChoiceComment = () => {
    if (!ccName.trim()) return;
    const validVariants = ccVariants.filter(v => v.label.trim() && v.content.trim());
    if (validVariants.length < 2) return;
    setPreDefinedSections(prev => ({
      ...prev,
      choiceComments: [...prev.choiceComments, { id: Date.now().toString(), name: ccName.trim(), variants: validVariants }],
    }));
    setCcName(''); setCcVariants([{ label: '', content: '' }, { label: '', content: '' }]);
  };

  const updateCcVariant = (index: number, field: 'label' | 'content', value: string) => {
    setCcVariants(prev => prev.map((v, i) => i === index ? { ...v, [field]: value } : v));
  };

  const handleCopyOverflow = () => {
    navigator.clipboard.writeText(overflowText);
    setOverflowCopied(true);
    setTimeout(() => setOverflowCopied(false), 3000);
  };

  const callGenerateFunction = async (isRefinement: boolean, attempt = 1): Promise<GeneratedTemplate> => {
    if (attempt > 1) setGeneratingMessage('Retrying generation...');

    const textToSend = isRefinement
      ? refineText.substring(0, GENERATION_CHAR_LIMIT)
      : cleanedText.substring(0, GENERATION_CHAR_LIMIT);

    const response = await fetch('https://wozbrojwuzktwrzngllh.supabase.co/functions/v1/generate-template', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subject, yearGroup,
        reportText: textToSend,
        additionalContext,
        hasPlaceholders: !isRefinement && !isQuickMode && (effectivePreDefined.standardComments.length + effectivePreDefined.choiceComments.length > 0),
        standardCommentNames: effectivePreDefined.standardComments.map(sc => sc.name),
        choiceCommentNames: effectivePreDefined.choiceComments.map(cc => cc.name),
        isRefinement,
        existingTemplate: isRefinement && generatedTemplate
          ? { name: generatedTemplate.name, sections: generatedTemplate.sections }
          : null,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      if (attempt < MAX_RETRIES && response.status >= 500) {
        await new Promise(r => setTimeout(r, 2000));
        return callGenerateFunction(isRefinement, attempt + 1);
      }
      throw new Error(data.error || `Server error: ${response.status}`);
    }

    if (!data.templateName || !data.sections || !Array.isArray(data.sections)) {
      if (attempt < MAX_RETRIES) {
        await new Promise(r => setTimeout(r, 2000));
        return callGenerateFunction(isRefinement, attempt + 1);
      }
      throw new Error('The template could not be generated correctly. Please try again.');
    }

    const assembled = isQuickMode
      ? data.sections.map((s: TemplateSection, i: number) => ({ ...s, id: `assembled_${i}_${Date.now()}` }))
      : assembleFinalTemplate(data.sections, preDefinedSections);

    return { name: data.templateName, subject, yearGroup, sections: assembled };
  };

  const handleGenerate = async () => {
    if (!rawReportText.trim()) { setError('Please paste your reports before generating.'); return; }
    if (!subject.trim()) { setError('Please enter the subject for this template.'); return; }
    setError(null);
    setGeneratingMessage('Analysing your reports...');
    setStep('generating');
    try {
      const result = await callGenerateFunction(false);
      setGeneratedTemplate(result);
      setStep('preview');
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
      setStep(isQuickMode ? 'paste' : 'preprocess');
    }
  };

  const handleRefine = async () => {
    if (!refineText.trim() || refineCharCount < 200) { setRefineError('Please paste more reports — at least 200 characters needed.'); return; }
    setRefineError(null); setIsRefining(true);
    try {
      const result = await callGenerateFunction(true);
      setGeneratedTemplate(result); setRefineText('');
    } catch (err: any) {
      setRefineError(err.message || 'Something went wrong. Please try again.');
    } finally { setIsRefining(false); }
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
    setStep('paste'); setStartMode(null);
    setRawReportText(''); setRefineText('');
    setSubject(''); setYearGroup(''); setAdditionalContext('');
    setGeneratedTemplate(null);
    setPreDefinedSections({ standardComments: [], choiceComments: [] });
    setError(null); setRefineError(null);
  };

  // ─── SECTION HELPERS ─────────────────────────────────────────────────────

  const getSectionTypeLabel = (type: string) => ({
    'rated-comment': 'Rated Comment', 'standard-comment': 'Standard Comment',
    'assessment-comment': 'Assessment Comment', 'personalised-comment': 'Personalised Comment',
    'optional-additional-comment': 'Optional Comment', 'next-steps': 'Next Steps',
    'qualities': 'Choice Comment', 'new-line': 'New Line',
  }[type] || type);

  const getSectionTypeColor = (type: string) => ({
    'rated-comment': '#3b82f6', 'standard-comment': '#10b981',
    'assessment-comment': '#8b5cf6', 'personalised-comment': '#f59e0b',
    'optional-additional-comment': '#ef4444', 'next-steps': '#06b6d4',
    'qualities': '#f59e0b', 'new-line': '#9ca3af',
  }[type] || '#6b7280');

  const getSectionSummary = (section: TemplateSection): string => {
    switch (section.type) {
      case 'rated-comment': { const t = Object.values(section.data?.comments || {}).reduce((s: number, a: any) => s + (Array.isArray(a) ? a.length : 0), 0); return `${t} comments across 4 levels`; }
      case 'standard-comment': return ((section.data?.content || '') as string).substring(0, 80) + '...';
      case 'assessment-comment': { const t = Object.values(section.data?.comments || {}).reduce((s: number, a: any) => s + (Array.isArray(a) ? a.length : 0), 0); return `${t} comments across 5 levels — uses [Score]`; }
      case 'qualities': { const h = Object.keys(section.data?.comments || {}); return `${h.length} options: ${h.slice(0, 3).join(', ')}${h.length > 3 ? '...' : ''}`; }
      case 'next-steps': { const a = Object.keys(section.data?.focusAreas || {}); return `${a.length} focus areas`; }
      case 'optional-additional-comment': return 'Free text box';
      case 'new-line': return 'Line break';
      default: return '';
    }
  };

  // ─── SHARED STYLES ────────────────────────────────────────────────────────

  const card: React.CSSProperties = { backgroundColor: 'white', borderRadius: '10px', border: '1px solid #e5e7eb', padding: '20px', marginBottom: '16px' };
  const lbl: React.CSSProperties = { display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' };
  const inp: React.CSSProperties = { width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' };
  const txa: React.CSSProperties = { width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', resize: 'vertical' };
  const btnP: React.CSSProperties = { backgroundColor: '#3b82f6', color: 'white', padding: '10px 18px', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' };
  const btnS: React.CSSProperties = { backgroundColor: '#f3f4f6', color: '#374151', padding: '10px 18px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', fontWeight: '500', cursor: 'pointer' };

  // ─── STEP: PASTE (combined for quick and full) ────────────────────────────

  if (step === 'paste') {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
        <header style={{ backgroundColor: 'white', borderBottom: '1px solid #e5e7eb', padding: isMobile ? '16px' : '20px 24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link to="/manage-templates" style={{ textDecoration: 'none' }}><button style={btnS}>← Back</button></Link>
          <div>
            <h1 style={{ margin: 0, fontSize: isMobile ? '18px' : '22px', fontWeight: '700', color: '#111827' }}>🪄 Import from Reports</h1>
            <p style={{ margin: 0, fontSize: '13px', color: '#6b7280' }}>Paste your reports and AI will build your template</p>
          </div>
        </header>

        <main style={{ maxWidth: '800px', margin: '0 auto', padding: isMobile ? '16px' : '32px 24px' }}>

          {/* Mode selection — shown if not yet chosen */}
          {!startMode && (
            <div style={{ marginBottom: '24px' }}>
              <h2 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600', color: '#111827' }}>How would you like to start?</h2>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '12px' }}>
                <button
                  onClick={() => setStartMode('quick')}
                  style={{
                    padding: '24px', border: '2px solid #3b82f6', borderRadius: '12px',
                    backgroundColor: 'white', cursor: 'pointer', textAlign: 'left',
                  }}
                >
                  <div style={{ fontSize: '24px', marginBottom: '8px' }}>⚡</div>
                  <div style={{ fontSize: '15px', fontWeight: '700', color: '#111827', marginBottom: '6px' }}>Quick Start</div>
                  <div style={{ fontSize: '13px', color: '#6b7280', lineHeight: '1.5' }}>
                    Paste your reports and generate immediately. Best for shorter reports or when you want a fast first draft.
                  </div>
                </button>
                <button
                  onClick={() => setStartMode('full')}
                  style={{
                    padding: '24px', border: '2px solid #8b5cf6', borderRadius: '12px',
                    backgroundColor: 'white', cursor: 'pointer', textAlign: 'left',
                  }}
                >
                  <div style={{ fontSize: '24px', marginBottom: '8px' }}>🔧</div>
                  <div style={{ fontSize: '15px', fontWeight: '700', color: '#111827', marginBottom: '6px' }}>Full Import</div>
                  <div style={{ fontSize: '13px', color: '#6b7280', lineHeight: '1.5' }}>
                    Identify repeated sections first to maximise the character limit and get a richer template. Best for longer or certificated reports.
                  </div>
                </button>
              </div>
            </div>
          )}

          {startMode && (
            <>
              {/* Info banner */}
              <div style={{ backgroundColor: startMode === 'quick' ? '#eff6ff' : '#f5f3ff', border: `1px solid ${startMode === 'quick' ? '#bfdbfe' : '#ddd6fe'}`, borderRadius: '10px', padding: '14px 16px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <p style={{ margin: 0, fontSize: '13px', color: startMode === 'quick' ? '#1e40af' : '#5b21b6', lineHeight: '1.5' }}>
                  {startMode === 'quick'
                    ? '⚡ Quick Start — paste your reports and generate immediately.'
                    : '🔧 Full Import — paste all reports, then identify repeated sections to maximise quality.'}
                </p>
                <button onClick={() => setStartMode(null)} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: '13px', whiteSpace: 'nowrap', marginLeft: '12px' }}>Change</button>
              </div>

              {/* Template details */}
              <div style={card}>
                <h2 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600', color: '#111827' }}>Template Details</h2>
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={lbl}>Subject <span style={{ color: '#ef4444' }}>*</span></label>
                    <input type="text" value={subject} onChange={e => setSubject(e.target.value)} placeholder="e.g. Physical Education" style={inp} />
                  </div>
                  <div>
                    <label style={lbl}>Year Group</label>
                    <select value={yearGroup} onChange={e => setYearGroup(e.target.value)} style={inp}>
                      <option value="">Select year group...</option>
                      {['S1','S2','S3','S4','S5','S6','Mixed'].map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Report text */}
              <div style={card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div>
                    <h2 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '600', color: '#111827' }}>Paste Your Reports <span style={{ color: '#ef4444' }}>*</span></h2>
                    <p style={{ margin: 0, fontSize: '13px', color: '#6b7280' }}>
                      {startMode === 'quick' ? 'Paste all your reports here — the more the better.' : 'Paste all your reports — no character limit at this stage.'}
                    </p>
                  </div>
                  <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: '500', whiteSpace: 'nowrap', marginLeft: '12px' }}>{rawCharCount.toLocaleString()} characters</span>
                </div>
                <textarea value={rawReportText} onChange={e => setRawReportText(e.target.value)} placeholder="Paste your reports here..." style={{ ...txa, minHeight: '320px' }} />
              </div>

              {/* Additional context */}
              <div style={card}>
                <h2 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '600', color: '#111827' }}>Additional Context <span style={{ fontSize: '13px', fontWeight: '400', color: '#9ca3af' }}>(optional)</span></h2>
                <textarea value={additionalContext} onChange={e => setAdditionalContext(e.target.value)} placeholder="e.g. We teach swimming, gymnastics and games." style={{ ...txa, minHeight: '80px' }} />
              </div>

              {error && (
                <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px', color: '#b91c1c', fontSize: '14px' }}>
                  ⚠️ {error}
                </div>
              )}

              {startMode === 'quick' ? (
                <button onClick={handleGenerate} style={{ ...btnP, width: '100%', padding: '16px', fontSize: '16px' }}>
                  🪄 Generate Template
                </button>
              ) : (
                <button
                  onClick={() => {
                    if (!rawReportText.trim()) { setError('Please paste your reports first.'); return; }
                    if (!subject.trim()) { setError('Please enter the subject.'); return; }
                    setError(null); setStep('preprocess');
                  }}
                  style={{ ...btnP, width: '100%', padding: '16px', fontSize: '16px', backgroundColor: '#8b5cf6' }}
                >
                  Next: Identify Repeated Sections →
                </button>
              )}

              <p style={{ textAlign: 'center', fontSize: '12px', color: '#9ca3af', marginTop: '12px' }}>
                {startMode === 'quick' ? 'Generation typically takes 20–40 seconds.' : 'You\'ll identify repeated sections on the next screen.'}
              </p>
            </>
          )}
        </main>
      </div>
    );
  }

  // ─── STEP: PRE-PROCESS ────────────────────────────────────────────────────

  if (step === 'preprocess') {
    const charColor = isOverLimit ? '#ef4444' : cleanedCharCount > GENERATION_CHAR_LIMIT * 0.8 ? '#f59e0b' : '#10b981';
    const firstChunk = cleanedText.substring(0, GENERATION_CHAR_LIMIT);

    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
        <header style={{ backgroundColor: 'white', borderBottom: '1px solid #e5e7eb', padding: isMobile ? '16px' : '20px 24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button onClick={() => setStep('paste')} style={btnS}>← Back</button>
          <div>
            <h1 style={{ margin: 0, fontSize: isMobile ? '18px' : '22px', fontWeight: '700', color: '#111827' }}>🪄 Import from Reports</h1>
            <p style={{ margin: 0, fontSize: '13px', color: '#6b7280' }}>Step 2 — Identify repeated sections</p>
          </div>
        </header>

        <main style={{ maxWidth: '800px', margin: '0 auto', padding: isMobile ? '16px' : '32px 24px' }}>

          {/* Character count */}
          <div style={{ backgroundColor: isOverLimit ? '#fef2f2' : '#f0fdf4', border: `1px solid ${isOverLimit ? '#fecaca' : '#bbf7d0'}`, borderRadius: '10px', padding: '16px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: '600', color: isOverLimit ? '#b91c1c' : '#166534' }}>
                  {isOverLimit ? '⚠️ Still over the generation limit' : '✅ Ready to generate'}
                </h3>
                <p style={{ margin: 0, fontSize: '13px', color: isOverLimit ? '#b91c1c' : '#15803d' }}>
                  {rawCharCount.toLocaleString()} pasted → <strong>{cleanedCharCount.toLocaleString()}</strong> after removing repeated sections
                  {charsSaved > 0 && ` (${charsSaved.toLocaleString()} saved)`} — limit is {GENERATION_CHAR_LIMIT.toLocaleString()}
                </p>
              </div>
              <span style={{ fontSize: '20px', fontWeight: '700', color: charColor }}>{cleanedCharCount.toLocaleString()} / {GENERATION_CHAR_LIMIT.toLocaleString()}</span>
            </div>
            <div style={{ height: '6px', backgroundColor: '#e5e7eb', borderRadius: '3px', marginTop: '12px' }}>
              <div style={{ height: '100%', width: `${Math.min((cleanedCharCount / GENERATION_CHAR_LIMIT) * 100, 100)}%`, backgroundColor: charColor, borderRadius: '3px', transition: 'width 0.3s' }} />
            </div>
          </div>

          {/* Instructions */}
          <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '10px', padding: '16px', marginBottom: '24px' }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600', color: '#92400e' }}>💡 What to do here</h3>
            <p style={{ margin: 0, fontSize: '13px', color: '#78350f', lineHeight: '1.7' }}>
              Look through your reports and identify repeated text. Adding it here removes it from AI processing, freeing up space and making the AI's job easier.<br /><br />
              <strong>Standard Comment</strong> — identical in every report (assessment analysis sentences, study info).<br />
              <strong>Choice Comment</strong> — 2-3 different versions for different students (pathway paragraphs). Teacher picks which applies.
            </p>
          </div>

          {/* Standard Comments */}
          <div style={card}>
            <h2 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '600', color: '#111827' }}>Standard Comments</h2>
            <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#6b7280' }}>Text that appears identically in every report.</p>

            {preDefinedSections.standardComments.length > 0 && (
              <div style={{ marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {preDefinedSections.standardComments.map(sc => (
                  <div key={sc.id} style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: '0 0 4px 0', fontSize: '13px', fontWeight: '600', color: '#166534' }}>✅ {sc.name}</p>
                      <p style={{ margin: 0, fontSize: '12px', color: '#15803d' }}>{sc.content.substring(0, 80)}{sc.content.length > 80 ? '...' : ''}</p>
                    </div>
                    <button onClick={() => setPreDefinedSections(prev => ({ ...prev, standardComments: prev.standardComments.filter(x => x.id !== sc.id) }))} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '18px' }}>×</button>
                  </div>
                ))}
              </div>
            )}

            <div style={{ border: '1px dashed #d1d5db', borderRadius: '8px', padding: '16px', backgroundColor: '#f9fafb' }}>
              <div style={{ marginBottom: '10px' }}>
                <label style={lbl}>Section Name</label>
                <input type="text" value={scName} onChange={e => setScName(e.target.value)} placeholder="e.g. Assessment Analysis" style={inp} />
              </div>
              <div style={{ marginBottom: '10px' }}>
                <label style={lbl}>Paste the repeated text</label>
                <textarea value={scContent} onChange={e => setScContent(e.target.value)} placeholder="Paste the identical text here..." style={{ ...txa, minHeight: '80px' }} />
              </div>
              <button onClick={handleAddStandardComment} disabled={!scName.trim() || !scContent.trim()} style={{ ...btnP, backgroundColor: scName.trim() && scContent.trim() ? '#10b981' : '#9ca3af', cursor: scName.trim() && scContent.trim() ? 'pointer' : 'not-allowed' }}>
                + Add Standard Comment
              </button>
            </div>
          </div>

          {/* Choice Comments */}
          <div style={card}>
            <h2 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '600', color: '#111827' }}>Choice Comments</h2>
            <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#6b7280' }}>2-3 different versions of the same section for different students.</p>

            {preDefinedSections.choiceComments.length > 0 && (
              <div style={{ marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {preDefinedSections.choiceComments.map(cc => (
                  <div key={cc.id} style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                    <div>
                      <p style={{ margin: '0 0 4px 0', fontSize: '13px', fontWeight: '600', color: '#92400e' }}>✅ {cc.name}</p>
                      <p style={{ margin: 0, fontSize: '12px', color: '#78350f' }}>{cc.variants.length} options: {cc.variants.map(v => v.label).join(', ')}</p>
                    </div>
                    <button onClick={() => setPreDefinedSections(prev => ({ ...prev, choiceComments: prev.choiceComments.filter(x => x.id !== cc.id) }))} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '18px' }}>×</button>
                  </div>
                ))}
              </div>
            )}

            <div style={{ border: '1px dashed #d1d5db', borderRadius: '8px', padding: '16px', backgroundColor: '#f9fafb' }}>
              <div style={{ marginBottom: '12px' }}>
                <label style={lbl}>Section Name</label>
                <input type="text" value={ccName} onChange={e => setCcName(e.target.value)} placeholder="e.g. Pathway Information" style={inp} />
              </div>
              {ccVariants.map((variant, index) => (
                <div key={index} style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '12px', marginBottom: '10px', backgroundColor: 'white' }}>
                  <div style={{ marginBottom: '8px' }}>
                    <label style={{ ...lbl, fontSize: '12px' }}>Option {index + 1} — Button Label</label>
                    <input type="text" value={variant.label} onChange={e => updateCcVariant(index, 'label', e.target.value)} placeholder="e.g. Standard Pathway" style={inp} />
                  </div>
                  <div>
                    <label style={{ ...lbl, fontSize: '12px' }}>Option {index + 1} — Text</label>
                    <textarea value={variant.content} onChange={e => updateCcVariant(index, 'content', e.target.value)} placeholder="Paste this version of the text..." style={{ ...txa, minHeight: '80px' }} />
                  </div>
                </div>
              ))}
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <button onClick={() => setCcVariants(prev => [...prev, { label: '', content: '' }])} style={{ ...btnS, fontSize: '13px' }}>+ Add Another Option</button>
                <button onClick={handleAddChoiceComment} disabled={!ccName.trim() || ccVariants.filter(v => v.label && v.content).length < 2} style={{ ...btnP, backgroundColor: ccName.trim() && ccVariants.filter(v => v.label && v.content).length >= 2 ? '#f59e0b' : '#9ca3af', cursor: ccName.trim() && ccVariants.filter(v => v.label && v.content).length >= 2 ? 'pointer' : 'not-allowed' }}>
                  + Add Choice Comment
                </button>
              </div>
            </div>
          </div>

          {/* Overflow section — shown when still over limit */}
          {isOverLimit && (
            <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '16px', marginBottom: '16px' }}>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600', color: '#b91c1c' }}>
                ⚠️ {(cleanedCharCount - GENERATION_CHAR_LIMIT).toLocaleString()} characters over the limit
              </h3>
              <p style={{ margin: '0 0 12px 0', fontSize: '13px', color: '#b91c1c' }}>
                The first {GENERATION_CHAR_LIMIT.toLocaleString()} characters will be used for generation.
                Copy the overflow text below and paste it into the Refine box after generating to enrich the template further.
              </p>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: '600', color: '#b91c1c' }}>
                  Overflow text ({overflowText.length.toLocaleString()} characters) — copy this for refinement:
                </span>
                <button
                  onClick={handleCopyOverflow}
                  style={{ ...btnP, backgroundColor: overflowCopied ? '#10b981' : '#ef4444', padding: '6px 14px', fontSize: '13px' }}
                >
                  {overflowCopied ? '✅ Copied!' : '📋 Copy Overflow'}
                </button>
              </div>
              <textarea
                readOnly
                value={overflowText}
                style={{ ...txa, minHeight: '120px', backgroundColor: '#fff5f5', color: '#7f1d1d', fontSize: '12px' }}
              />
            </div>
          )}

          {error && (
            <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px', color: '#b91c1c', fontSize: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>⚠️ {error}</span>
              <button onClick={handleGenerate} style={{ ...btnP, backgroundColor: '#ef4444', padding: '6px 12px', fontSize: '13px' }}>Try again</button>
            </div>
          )}

          <button onClick={handleGenerate} style={{ ...btnP, width: '100%', padding: '16px', fontSize: '16px', backgroundColor: '#8b5cf6' }}>
            🪄 Generate Template
          </button>
          <p style={{ textAlign: 'center', fontSize: '12px', color: '#9ca3af', marginTop: '12px' }}>
            Generation typically takes 20–40 seconds. Reports are not stored.
          </p>
        </main>
      </div>
    );
  }

  // ─── STEP: GENERATING ────────────────────────────────────────────────────

  if (step === 'generating') {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '48px 40px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', textAlign: 'center', maxWidth: '400px' }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>🪄</div>
          <h2 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: '700', color: '#111827' }}>Building Your Template</h2>
          <p style={{ margin: '0 0 24px 0', color: '#6b7280', fontSize: '14px', lineHeight: '1.6' }}>{generatingMessage}</p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
            {[0,1,2].map(i => <div key={i} style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#3b82f6', animation: 'pulse 1.2s ease-in-out infinite', animationDelay: `${i * 0.2}s` }} />)}
          </div>
          <style>{`@keyframes pulse{0%,100%{opacity:.3;transform:scale(.8)}50%{opacity:1;transform:scale(1.2)}}`}</style>
          <p style={{ margin: '24px 0 0 0', fontSize: '12px', color: '#9ca3af' }}>This usually takes 20–40 seconds</p>
        </div>
      </div>
    );
  }

  // ─── STEP: PREVIEW ───────────────────────────────────────────────────────

  if (step === 'preview' && generatedTemplate) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
        <header style={{ backgroundColor: 'white', borderBottom: '1px solid #e5e7eb', padding: isMobile ? '16px' : '20px 24px' }}>
          <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button onClick={() => setStep(isQuickMode ? 'paste' : 'preprocess')} style={btnS}>← Back</button>
              <div>
                <h1 style={{ margin: 0, fontSize: isMobile ? '16px' : '20px', fontWeight: '700', color: '#111827' }}>✅ Template Generated</h1>
                <p style={{ margin: 0, fontSize: '12px', color: '#6b7280' }}>Review, refine with more reports, or save</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={handleEditFirst} style={btnS}>Save & Edit</button>
              <button onClick={handleSave} style={btnP}>Save Template</button>
            </div>
          </div>
        </header>

        <main style={{ maxWidth: '800px', margin: '0 auto', padding: isMobile ? '16px' : '32px 24px' }}>

          <div style={{ ...card, marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <div style={{ flex: 1 }}>
                <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>TEMPLATE NAME</p>
                <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#111827' }}>{generatedTemplate.name}</h2>
              </div>
              <div style={{ backgroundColor: '#eff6ff', color: '#1d4ed8', padding: '6px 12px', borderRadius: '6px', fontSize: '13px', fontWeight: '500' }}>
                {generatedTemplate.sections.length} sections
              </div>
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

          {/* Refine */}
          <div style={{ ...card, border: '2px solid #8b5cf6', marginBottom: '16px' }}>
            <h3 style={{ margin: '0 0 6px 0', fontSize: '15px', fontWeight: '600', color: '#111827' }}>🔄 Refine with More Reports</h3>
            <p style={{ margin: '0 0 12px 0', fontSize: '13px', color: '#6b7280' }}>
              Paste more reports to improve the template. If you copied overflow text earlier, paste it here now.
            </p>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '13px', color: '#374151' }}>Additional reports</span>
              <span style={{ fontSize: '12px', fontWeight: '600', color: refineCharCount > GENERATION_CHAR_LIMIT ? '#ef4444' : '#6b7280' }}>{refineCharCount.toLocaleString()} / {GENERATION_CHAR_LIMIT.toLocaleString()}</span>
            </div>
            <textarea value={refineText} onChange={e => setRefineText(e.target.value.substring(0, GENERATION_CHAR_LIMIT))} placeholder="Paste more reports here — or paste the overflow text from the previous screen..." style={{ ...txa, minHeight: '120px', marginBottom: '12px' }} />
            {refineError && (
              <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '10px', marginBottom: '10px', color: '#b91c1c', fontSize: '13px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>⚠️ {refineError}</span>
                <button onClick={handleRefine} style={{ ...btnP, backgroundColor: '#ef4444', padding: '4px 10px', fontSize: '12px' }}>Try again</button>
              </div>
            )}
            <button onClick={handleRefine} disabled={refineCharCount < 200 || isRefining} style={{ width: '100%', padding: '12px', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', backgroundColor: isRefining ? '#9ca3af' : refineCharCount >= 200 ? '#8b5cf6' : '#d1d5db', color: 'white', cursor: refineCharCount >= 200 && !isRefining ? 'pointer' : 'not-allowed' }}>
              {isRefining ? '🔄 Refining...' : '🔄 Refine Template'}
            </button>
          </div>

          <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '16px', marginBottom: '24px' }}>
            <p style={{ margin: 0, fontSize: '13px', color: '#15803d', lineHeight: '1.6' }}>
              <strong>Save Template</strong> — saves to your library ready to use.<br />
              <strong>Save &amp; Edit</strong> — saves and opens in the editor to fine-tune.<br />
              <strong>Refine</strong> — add more reports to improve before saving.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={handleEditFirst} style={{ ...btnS, flex: 1, padding: '14px', fontSize: '15px' }}>✏️ Save & Edit</button>
            <button onClick={handleSave} style={{ ...btnP, flex: 1, padding: '14px', fontSize: '15px' }}>✅ Save Template</button>
          </div>
        </main>
      </div>
    );
  }

  // ─── STEP: SAVED ─────────────────────────────────────────────────────────

  if (step === 'saved') {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '48px 40px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', textAlign: 'center', maxWidth: '400px' }}>
          <div style={{ fontSize: '56px', marginBottom: '16px' }}>🎉</div>
          <h2 style={{ margin: '0 0 8px 0', fontSize: '22px', fontWeight: '700', color: '#111827' }}>Template Saved!</h2>
          <p style={{ margin: '0 0 8px 0', color: '#374151', fontWeight: '600', fontSize: '16px' }}>{generatedTemplate?.name}</p>
          <p style={{ margin: '0 0 32px 0', color: '#6b7280', fontSize: '14px' }}>Your template is ready to use. You can edit it at any time from the Manage Templates page.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <Link to="/manage-templates" style={{ textDecoration: 'none' }}>
              <button style={{ ...btnP, width: '100%', padding: '14px', fontSize: '15px' }}>Go to Templates</button>
            </Link>
            <button onClick={handleReset} style={{ ...btnS, width: '100%', padding: '14px', fontSize: '15px' }}>Import Another Template</button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}