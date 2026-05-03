// src/pages/ImportTemplate.tsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { TemplateSection } from '../types';

// ─── TYPES ──────────────────────────────────────────────────────────────────

type Step = 'paste' | 'preprocess' | 'generating' | 'preview' | 'saved';

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

function buildCleanedText(
  rawText: string,
  preDefinedSections: PreDefinedSections
): string {
  let cleaned = rawText;

  // Replace standard comment text with placeholders
  preDefinedSections.standardComments.forEach(sc => {
    if (sc.content.trim()) {
      // Escape special regex characters
      const escaped = sc.content.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escaped, 'g');
      cleaned = cleaned.replace(regex, `{{STANDARD:${sc.name}}}`);
    }
  });

  // Replace choice comment variants with placeholders
  preDefinedSections.choiceComments.forEach(cc => {
    cc.variants.forEach(variant => {
      if (variant.content.trim()) {
        const escaped = variant.content.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(escaped, 'g');
        cleaned = cleaned.replace(regex, `{{CHOICE:${cc.name}}}`);
      }
    });
  });

  return cleaned;
}

function buildPreDefinedTemplateSections(
  preDefinedSections: PreDefinedSections
): TemplateSection[] {
  const sections: TemplateSection[] = [];

  preDefinedSections.standardComments.forEach((sc, i) => {
    sections.push({
      id: `predefined_standard_${i}_${Date.now()}`,
      type: 'standard-comment',
      name: sc.name,
      data: { content: sc.content },
    });
  });

  preDefinedSections.choiceComments.forEach((cc, i) => {
    const categories: Record<string, string[]> = {};
    cc.variants.forEach(v => {
      if (v.label && v.content) {
        categories[v.label] = [v.content];
      }
    });
    sections.push({
      id: `predefined_choice_${i}_${Date.now()}`,
      type: 'qualities',
      name: cc.name,
      data: { comments: categories },
    });
  });

  return sections;
}

function assembleFinalTemplate(
  aiSections: TemplateSection[],
  preDefinedSections: PreDefinedSections
): TemplateSection[] {
  // Build lookup for pre-defined sections by placeholder name
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
    cc.variants.forEach(v => {
      if (v.label && v.content) {
        categories[v.label] = [v.content];
      }
    });
    choiceLookup[cc.name] = {
      id: `predefined_choice_${i}_${Date.now()}`,
      type: 'qualities',
      name: cc.name,
      data: { comments: categories },
    };
  });

  // Replace placeholder sections in AI output with pre-defined sections
  const assembled: TemplateSection[] = [];
  let sectionIndex = 0;

  aiSections.forEach(section => {
    // Check if this section references a placeholder
    const nameStr = section.name || '';
    if (nameStr.startsWith('STANDARD:')) {
      const key = nameStr.replace('STANDARD:', '').trim();
      if (standardLookup[key]) {
        assembled.push({ ...standardLookup[key], id: `assembled_${sectionIndex++}_${Date.now()}` });
        return;
      }
    }
    if (nameStr.startsWith('CHOICE:')) {
      const key = nameStr.replace('CHOICE:', '').trim();
      if (choiceLookup[key]) {
        assembled.push({ ...choiceLookup[key], id: `assembled_${sectionIndex++}_${Date.now()}` });
        return;
      }
    }

    // Check standard-comment content for placeholders
    if (section.type === 'standard-comment' && section.data?.content) {
      const match = section.data.content.match(/\{\{STANDARD:(.+?)\}\}/);
      if (match && standardLookup[match[1]]) {
        assembled.push({ ...standardLookup[match[1]], id: `assembled_${sectionIndex++}_${Date.now()}` });
        return;
      }
      const choiceMatch = section.data.content.match(/\{\{CHOICE:(.+?)\}\}/);
      if (choiceMatch && choiceLookup[choiceMatch[1]]) {
        assembled.push({ ...choiceLookup[choiceMatch[1]], id: `assembled_${sectionIndex++}_${Date.now()}` });
        return;
      }
    }

    assembled.push({ ...section, id: `assembled_${sectionIndex++}_${Date.now()}` });
  });

  return assembled;
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────

export default function ImportTemplate() {
  const navigate = useNavigate();
  const { addTemplate } = useData();

  const [step, setStep] = useState<Step>('paste');
  const [subject, setSubject] = useState('');
  const [yearGroup, setYearGroup] = useState('');
  const [rawReportText, setRawReportText] = useState('');
  const [additionalContext, setAdditionalContext] = useState('');
  const [generatedTemplate, setGeneratedTemplate] = useState<GeneratedTemplate | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [generatingMessage, setGeneratingMessage] = useState('Analysing your reports...');
  const [isMobile] = useState(window.innerWidth <= 768);

  // Pre-defined sections state
  const [preDefinedSections, setPreDefinedSections] = useState<PreDefinedSections>({
    standardComments: [],
    choiceComments: [],
  });

  // Standard comment draft
  const [scName, setScName] = useState('');
  const [scContent, setScContent] = useState('');

  // Choice comment draft
  const [ccName, setCcName] = useState('');
  const [ccVariants, setCcVariants] = useState([
    { label: '', content: '' },
    { label: '', content: '' },
  ]);

  // Refinement
  const [refineText, setRefineText] = useState('');
  const [isRefining, setIsRefining] = useState(false);
  const [refineError, setRefineError] = useState<string | null>(null);

  // ─── COMPUTED ───────────────────────────────────────────────────────────────

  const cleanedText = buildCleanedText(rawReportText, preDefinedSections);
  const cleanedCharCount = cleanedText.length;
  const rawCharCount = rawReportText.length;
  const charsSaved = rawCharCount - cleanedCharCount;
  const isOverLimit = cleanedCharCount > GENERATION_CHAR_LIMIT;
  const refineCharCount = refineText.length;

  // ─── PRE-PROCESSING HANDLERS ─────────────────────────────────────────────

  const handleAddStandardComment = () => {
    if (!scName.trim() || !scContent.trim()) return;
    setPreDefinedSections(prev => ({
      ...prev,
      standardComments: [
        ...prev.standardComments,
        { id: Date.now().toString(), name: scName.trim(), content: scContent.trim() },
      ],
    }));
    setScName('');
    setScContent('');
  };

  const handleRemoveStandardComment = (id: string) => {
    setPreDefinedSections(prev => ({
      ...prev,
      standardComments: prev.standardComments.filter(sc => sc.id !== id),
    }));
  };

  const handleAddChoiceComment = () => {
    if (!ccName.trim()) return;
    const validVariants = ccVariants.filter(v => v.label.trim() && v.content.trim());
    if (validVariants.length < 2) return;
    setPreDefinedSections(prev => ({
      ...prev,
      choiceComments: [
        ...prev.choiceComments,
        { id: Date.now().toString(), name: ccName.trim(), variants: validVariants },
      ],
    }));
    setCcName('');
    setCcVariants([{ label: '', content: '' }, { label: '', content: '' }]);
  };

  const handleRemoveChoiceComment = (id: string) => {
    setPreDefinedSections(prev => ({
      ...prev,
      choiceComments: prev.choiceComments.filter(cc => cc.id !== id),
    }));
  };

  const updateCcVariant = (index: number, field: 'label' | 'content', value: string) => {
    setCcVariants(prev => prev.map((v, i) => i === index ? { ...v, [field]: value } : v));
  };

  const addCcVariant = () => {
    setCcVariants(prev => [...prev, { label: '', content: '' }]);
  };

  // ─── GENERATION ──────────────────────────────────────────────────────────

  const callGenerateFunction = async (
    isRefinement: boolean,
    attempt = 1
  ): Promise<GeneratedTemplate> => {
    if (attempt > 1) setGeneratingMessage('Retrying generation...');

    const textToSend = isRefinement
      ? refineText.substring(0, GENERATION_CHAR_LIMIT)
      : cleanedText.substring(0, GENERATION_CHAR_LIMIT);

    const response = await fetch(
      'https://wozbrojwuzktwrzngllh.supabase.co/functions/v1/generate-template',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject,
          yearGroup,
          reportText: textToSend,
          additionalContext,
          hasPlaceholders: !isRefinement && preDefinedSections.standardComments.length + preDefinedSections.choiceComments.length > 0,
          standardCommentNames: preDefinedSections.standardComments.map(sc => sc.name),
          choiceCommentNames: preDefinedSections.choiceComments.map(cc => cc.name),
          isRefinement,
          existingTemplate: isRefinement && generatedTemplate
            ? { name: generatedTemplate.name, sections: generatedTemplate.sections }
            : null,
        }),
      }
    );

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

    // Assemble final sections — insert pre-defined sections at placeholder positions
    const assembled = assembleFinalTemplate(data.sections, preDefinedSections);

    return {
      name: data.templateName,
      subject,
      yearGroup,
      sections: assembled,
    };
  };

  const handleGenerate = async () => {
    if (!rawReportText.trim()) {
      setError('Please paste your reports before generating.');
      return;
    }
    if (!subject.trim()) {
      setError('Please enter the subject for this template.');
      return;
    }

    setError(null);
    setGeneratingMessage('Analysing your reports...');
    setStep('generating');

    try {
      const result = await callGenerateFunction(false);
      setGeneratedTemplate(result);
      setStep('preview');
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
      setStep('preprocess');
    }
  };

  const handleRefine = async () => {
    if (!refineText.trim() || refineCharCount < 200) {
      setRefineError('Please paste more reports — at least 200 characters needed.');
      return;
    }
    setRefineError(null);
    setIsRefining(true);
    try {
      const result = await callGenerateFunction(true);
      setGeneratedTemplate(result);
      setRefineText('');
    } catch (err: any) {
      setRefineError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsRefining(false);
    }
  };

  const handleSave = () => {
    if (!generatedTemplate) return;
    addTemplate({
      name: generatedTemplate.name,
      sections: generatedTemplate.sections,
    });
    setStep('saved');
  };

  const handleEditFirst = () => {
    if (!generatedTemplate) return;
    const template = {
      name: generatedTemplate.name,
      sections: generatedTemplate.sections,
    };
    addTemplate(template);
    navigate('/create-template', { state: { editTemplate: template } });
  };

  // ─── SECTION HELPERS ─────────────────────────────────────────────────────

  const getSectionTypeLabel = (type: string) => ({
    'rated-comment': 'Rated Comment',
    'standard-comment': 'Standard Comment',
    'assessment-comment': 'Assessment Comment',
    'personalised-comment': 'Personalised Comment',
    'optional-additional-comment': 'Optional Comment',
    'next-steps': 'Next Steps',
    'qualities': 'Choice Comment',
    'new-line': 'New Line',
  }[type] || type);

  const getSectionTypeColor = (type: string) => ({
    'rated-comment': '#3b82f6',
    'standard-comment': '#10b981',
    'assessment-comment': '#8b5cf6',
    'personalised-comment': '#f59e0b',
    'optional-additional-comment': '#ef4444',
    'next-steps': '#06b6d4',
    'qualities': '#f59e0b',
    'new-line': '#9ca3af',
  }[type] || '#6b7280');

  const getSectionSummary = (section: TemplateSection): string => {
    switch (section.type) {
      case 'rated-comment': {
        const total = Object.values(section.data?.comments || {})
          .reduce((s: number, a: any) => s + (Array.isArray(a) ? a.length : 0), 0);
        return `${total} comments across 4 performance levels`;
      }
      case 'standard-comment':
        return ((section.data?.content || '') as string).substring(0, 80) + '...';
      case 'assessment-comment': {
        const total = Object.values(section.data?.comments || {})
          .reduce((s: number, a: any) => s + (Array.isArray(a) ? a.length : 0), 0);
        return `${total} comments across 5 levels — uses [Score]`;
      }
      case 'qualities': {
        const headings = Object.keys(section.data?.comments || {});
        return `${headings.length} options: ${headings.slice(0, 3).join(', ')}${headings.length > 3 ? '...' : ''}`;
      }
      case 'next-steps': {
        const areas = Object.keys(section.data?.focusAreas || {});
        return `${areas.length} focus areas`;
      }
      case 'optional-additional-comment': return 'Free text box';
      case 'new-line': return 'Line break';
      default: return '';
    }
  };

  // ─── SHARED STYLES ───────────────────────────────────────────────────────

  const cardStyle: React.CSSProperties = {
    backgroundColor: 'white', borderRadius: '10px',
    border: '1px solid #e5e7eb', padding: '20px', marginBottom: '16px',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: '13px', fontWeight: '500',
    color: '#374151', marginBottom: '6px',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 12px', border: '1px solid #d1d5db',
    borderRadius: '6px', fontSize: '14px', outline: 'none', boxSizing: 'border-box',
  };

  const textareaStyle: React.CSSProperties = {
    width: '100%', padding: '10px 12px', border: '1px solid #d1d5db',
    borderRadius: '6px', fontSize: '13px', outline: 'none',
    boxSizing: 'border-box', fontFamily: 'inherit', resize: 'vertical',
  };

  const btnPrimary: React.CSSProperties = {
    backgroundColor: '#3b82f6', color: 'white', padding: '10px 18px',
    border: 'none', borderRadius: '8px', fontSize: '14px',
    fontWeight: '600', cursor: 'pointer',
  };

  const btnSecondary: React.CSSProperties = {
    backgroundColor: '#f3f4f6', color: '#374151', padding: '10px 18px',
    border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px',
    fontWeight: '500', cursor: 'pointer',
  };

  // ─── STEP: PASTE ─────────────────────────────────────────────────────────

  if (step === 'paste') {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
        <header style={{
          backgroundColor: 'white', borderBottom: '1px solid #e5e7eb',
          padding: isMobile ? '16px' : '20px 24px',
          display: 'flex', alignItems: 'center', gap: '16px',
        }}>
          <Link to="/manage-templates" style={{ textDecoration: 'none' }}>
            <button style={btnSecondary}>← Back</button>
          </Link>
          <div>
            <h1 style={{ margin: 0, fontSize: isMobile ? '18px' : '22px', fontWeight: '700', color: '#111827' }}>
              🪄 Import from Reports
            </h1>
            <p style={{ margin: 0, fontSize: '13px', color: '#6b7280' }}>
              Step 1 of 2 — Paste your reports
            </p>
          </div>
        </header>

        <main style={{ maxWidth: '800px', margin: '0 auto', padding: isMobile ? '16px' : '32px 24px' }}>

          <div style={{
            backgroundColor: '#eff6ff', border: '1px solid #bfdbfe',
            borderRadius: '10px', padding: '16px', marginBottom: '24px',
          }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600', color: '#1d4ed8' }}>
              💡 How this works
            </h3>
            <p style={{ margin: 0, fontSize: '13px', color: '#1e40af', lineHeight: '1.6' }}>
              <strong>Step 1:</strong> Paste all your reports below — no character limit here.<br />
              <strong>Step 2:</strong> Identify any repeated sections (like pathway paragraphs or standard closing sentences) so they're handled efficiently before AI generation.<br />
              <strong>Step 3:</strong> The AI generates your template from the unique content only, producing a much richer result.
            </p>
          </div>

          {/* Template details */}
          <div style={cardStyle}>
            <h2 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600', color: '#111827' }}>
              Template Details
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={labelStyle}>Subject <span style={{ color: '#ef4444' }}>*</span></label>
                <input
                  type="text" value={subject}
                  onChange={e => setSubject(e.target.value)}
                  placeholder="e.g. Physical Education"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Year Group</label>
                <select value={yearGroup} onChange={e => setYearGroup(e.target.value)} style={inputStyle}>
                  <option value="">Select year group...</option>
                  {['S1','S2','S3','S4','S5','S6','Mixed'].map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Report text */}
          <div style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <div>
                <h2 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '600', color: '#111827' }}>
                  Paste Your Reports <span style={{ color: '#ef4444' }}>*</span>
                </h2>
                <p style={{ margin: 0, fontSize: '13px', color: '#6b7280' }}>
                  Paste all your reports — the more the better. No limit at this stage.
                </p>
              </div>
              <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: '500', whiteSpace: 'nowrap', marginLeft: '12px' }}>
                {rawCharCount.toLocaleString()} characters
              </span>
            </div>
            <textarea
              value={rawReportText}
              onChange={e => setRawReportText(e.target.value)}
              placeholder="Paste your reports here..."
              style={{ ...textareaStyle, minHeight: '320px' }}
            />
          </div>

          {/* Additional context */}
          <div style={cardStyle}>
            <h2 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '600', color: '#111827' }}>
              Additional Context{' '}
              <span style={{ fontSize: '13px', fontWeight: '400', color: '#9ca3af' }}>(optional)</span>
            </h2>
            <textarea
              value={additionalContext}
              onChange={e => setAdditionalContext(e.target.value)}
              placeholder="e.g. We teach swimming, gymnastics and games. Include a section for each activity."
              style={{ ...textareaStyle, minHeight: '80px' }}
            />
          </div>

          <button
            onClick={() => {
              if (!rawReportText.trim()) { setError('Please paste your reports first.'); return; }
              if (!subject.trim()) { setError('Please enter the subject.'); return; }
              setError(null);
              setStep('preprocess');
            }}
            style={{ ...btnPrimary, width: '100%', padding: '16px', fontSize: '16px' }}
          >
            Next: Identify Repeated Sections →
          </button>

          {error && (
            <div style={{
              backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px',
              padding: '12px 16px', marginTop: '12px', color: '#b91c1c', fontSize: '14px',
            }}>
              ⚠️ {error}
            </div>
          )}
        </main>
      </div>
    );
  }

  // ─── STEP: PRE-PROCESS ───────────────────────────────────────────────────

  if (step === 'preprocess') {
    const charColor = isOverLimit ? '#ef4444' : cleanedCharCount > GENERATION_CHAR_LIMIT * 0.8 ? '#f59e0b' : '#10b981';

    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
        <header style={{
          backgroundColor: 'white', borderBottom: '1px solid #e5e7eb',
          padding: isMobile ? '16px' : '20px 24px',
          display: 'flex', alignItems: 'center', gap: '16px',
        }}>
          <button onClick={() => setStep('paste')} style={btnSecondary}>← Back</button>
          <div>
            <h1 style={{ margin: 0, fontSize: isMobile ? '18px' : '22px', fontWeight: '700', color: '#111827' }}>
              🪄 Import from Reports
            </h1>
            <p style={{ margin: 0, fontSize: '13px', color: '#6b7280' }}>
              Step 2 of 2 — Identify repeated sections
            </p>
          </div>
        </header>

        <main style={{ maxWidth: '800px', margin: '0 auto', padding: isMobile ? '16px' : '32px 24px' }}>

          {/* Character count summary */}
          <div style={{
            backgroundColor: isOverLimit ? '#fef2f2' : '#f0fdf4',
            border: `1px solid ${isOverLimit ? '#fecaca' : '#bbf7d0'}`,
            borderRadius: '10px', padding: '16px', marginBottom: '24px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: '600', color: isOverLimit ? '#b91c1c' : '#166534' }}>
                  {isOverLimit ? '⚠️ Still over the generation limit' : '✅ Ready to generate'}
                </h3>
                <p style={{ margin: 0, fontSize: '13px', color: isOverLimit ? '#b91c1c' : '#15803d' }}>
                  {rawCharCount.toLocaleString()} characters pasted →{' '}
                  <strong>{cleanedCharCount.toLocaleString()} characters</strong> after removing repeated sections
                  {charsSaved > 0 && ` (${charsSaved.toLocaleString()} saved)`}
                  {' '}— limit is {GENERATION_CHAR_LIMIT.toLocaleString()}
                </p>
              </div>
              <span style={{
                fontSize: '20px', fontWeight: '700', color: charColor,
              }}>
                {cleanedCharCount.toLocaleString()} / {GENERATION_CHAR_LIMIT.toLocaleString()}
              </span>
            </div>
            {/* Progress bar */}
            <div style={{ height: '6px', backgroundColor: '#e5e7eb', borderRadius: '3px', marginTop: '12px' }}>
              <div style={{
                height: '100%',
                width: `${Math.min((cleanedCharCount / GENERATION_CHAR_LIMIT) * 100, 100)}%`,
                backgroundColor: charColor, borderRadius: '3px',
                transition: 'width 0.3s, background-color 0.3s',
              }} />
            </div>
          </div>

          {/* Instructions */}
          <div style={{
            backgroundColor: '#fffbeb', border: '1px solid #fde68a',
            borderRadius: '10px', padding: '16px', marginBottom: '24px',
          }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600', color: '#92400e' }}>
              💡 What to do here
            </h3>
            <p style={{ margin: 0, fontSize: '13px', color: '#78350f', lineHeight: '1.7' }}>
              Look through your reports and identify any text that is repeated across multiple reports.
              Adding these here removes them from the AI's processing, freeing up space for more unique content
              and making the AI's job much easier.<br /><br />
              <strong>Standard Comment</strong> — text that is identical (or nearly identical) in every report,
              like an assessment analysis sentence or supported study information.<br />
              <strong>Choice Comment</strong> — text where there are 2-3 different versions used for different
              students, like a pathway paragraph. The teacher will choose which version applies to each student.
            </p>
          </div>

          {/* ── STANDARD COMMENTS ── */}
          <div style={cardStyle}>
            <h2 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '600', color: '#111827' }}>
              Standard Comments
            </h2>
            <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#6b7280' }}>
              Text that appears identically in every report. Paste it once and name it.
            </p>

            {/* Added standard comments */}
            {preDefinedSections.standardComments.length > 0 && (
              <div style={{ marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {preDefinedSections.standardComments.map(sc => (
                  <div key={sc.id} style={{
                    backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0',
                    borderRadius: '8px', padding: '12px',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px',
                  }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: '0 0 4px 0', fontSize: '13px', fontWeight: '600', color: '#166534' }}>
                        ✅ {sc.name}
                      </p>
                      <p style={{ margin: 0, fontSize: '12px', color: '#15803d' }}>
                        {sc.content.substring(0, 80)}{sc.content.length > 80 ? '...' : ''}
                      </p>
                    </div>
                    <button
                      onClick={() => handleRemoveStandardComment(sc.id)}
                      style={{
                        background: 'none', border: 'none', color: '#ef4444',
                        cursor: 'pointer', fontSize: '18px', flexShrink: 0,
                      }}
                    >×</button>
                  </div>
                ))}
              </div>
            )}

            {/* Add new standard comment */}
            <div style={{
              border: '1px dashed #d1d5db', borderRadius: '8px',
              padding: '16px', backgroundColor: '#f9fafb',
            }}>
              <div style={{ marginBottom: '10px' }}>
                <label style={labelStyle}>Section Name</label>
                <input
                  type="text" value={scName}
                  onChange={e => setScName(e.target.value)}
                  placeholder="e.g. Assessment Analysis"
                  style={inputStyle}
                />
              </div>
              <div style={{ marginBottom: '10px' }}>
                <label style={labelStyle}>Paste the repeated text</label>
                <textarea
                  value={scContent}
                  onChange={e => setScContent(e.target.value)}
                  placeholder="Paste the text that appears identically in every report..."
                  style={{ ...textareaStyle, minHeight: '80px' }}
                />
              </div>
              <button
                onClick={handleAddStandardComment}
                disabled={!scName.trim() || !scContent.trim()}
                style={{
                  ...btnPrimary,
                  backgroundColor: scName.trim() && scContent.trim() ? '#10b981' : '#9ca3af',
                  cursor: scName.trim() && scContent.trim() ? 'pointer' : 'not-allowed',
                }}
              >
                + Add Standard Comment
              </button>
            </div>
          </div>

          {/* ── CHOICE COMMENTS ── */}
          <div style={cardStyle}>
            <h2 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '600', color: '#111827' }}>
              Choice Comments
            </h2>
            <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#6b7280' }}>
              Where there are 2-3 different versions of the same section for different students.
              The teacher picks which version applies when writing reports.
            </p>

            {/* Added choice comments */}
            {preDefinedSections.choiceComments.length > 0 && (
              <div style={{ marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {preDefinedSections.choiceComments.map(cc => (
                  <div key={cc.id} style={{
                    backgroundColor: '#fffbeb', border: '1px solid #fde68a',
                    borderRadius: '8px', padding: '12px',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px',
                  }}>
                    <div>
                      <p style={{ margin: '0 0 4px 0', fontSize: '13px', fontWeight: '600', color: '#92400e' }}>
                        ✅ {cc.name}
                      </p>
                      <p style={{ margin: 0, fontSize: '12px', color: '#78350f' }}>
                        {cc.variants.length} options: {cc.variants.map(v => v.label).join(', ')}
                      </p>
                    </div>
                    <button
                      onClick={() => handleRemoveChoiceComment(cc.id)}
                      style={{
                        background: 'none', border: 'none', color: '#ef4444',
                        cursor: 'pointer', fontSize: '18px', flexShrink: 0,
                      }}
                    >×</button>
                  </div>
                ))}
              </div>
            )}

            {/* Add new choice comment */}
            <div style={{
              border: '1px dashed #d1d5db', borderRadius: '8px',
              padding: '16px', backgroundColor: '#f9fafb',
            }}>
              <div style={{ marginBottom: '12px' }}>
                <label style={labelStyle}>Section Name</label>
                <input
                  type="text" value={ccName}
                  onChange={e => setCcName(e.target.value)}
                  placeholder="e.g. Pathway Information"
                  style={inputStyle}
                />
              </div>

              {ccVariants.map((variant, index) => (
                <div key={index} style={{
                  border: '1px solid #e5e7eb', borderRadius: '8px',
                  padding: '12px', marginBottom: '10px', backgroundColor: 'white',
                }}>
                  <div style={{ marginBottom: '8px' }}>
                    <label style={{ ...labelStyle, fontSize: '12px' }}>
                      Option {index + 1} — Button Label
                    </label>
                    <input
                      type="text" value={variant.label}
                      onChange={e => updateCcVariant(index, 'label', e.target.value)}
                      placeholder="e.g. Standard Pathway"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={{ ...labelStyle, fontSize: '12px' }}>
                      Option {index + 1} — Text
                    </label>
                    <textarea
                      value={variant.content}
                      onChange={e => updateCcVariant(index, 'content', e.target.value)}
                      placeholder="Paste this version of the text..."
                      style={{ ...textareaStyle, minHeight: '80px' }}
                    />
                  </div>
                </div>
              ))}

              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <button
                  onClick={addCcVariant}
                  style={{ ...btnSecondary, fontSize: '13px' }}
                >
                  + Add Another Option
                </button>
                <button
                  onClick={handleAddChoiceComment}
                  disabled={!ccName.trim() || ccVariants.filter(v => v.label && v.content).length < 2}
                  style={{
                    ...btnPrimary,
                    backgroundColor: ccName.trim() && ccVariants.filter(v => v.label && v.content).length >= 2
                      ? '#f59e0b' : '#9ca3af',
                    cursor: ccName.trim() && ccVariants.filter(v => v.label && v.content).length >= 2
                      ? 'pointer' : 'not-allowed',
                  }}
                >
                  + Add Choice Comment
                </button>
              </div>
            </div>
          </div>

          {/* Overflow handling */}
          {isOverLimit && (
            <div style={{
              backgroundColor: '#fef2f2', border: '1px solid #fecaca',
              borderRadius: '10px', padding: '16px', marginBottom: '16px',
            }}>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600', color: '#b91c1c' }}>
                ⚠️ Still {(cleanedCharCount - GENERATION_CHAR_LIMIT).toLocaleString()} characters over the limit
              </h3>
              <p style={{ margin: '0 0 12px 0', fontSize: '13px', color: '#b91c1c' }}>
                Add more standard or choice comments above to reduce the character count, or generate now
                and use the Refine feature to add the remaining reports afterwards.
              </p>
              <p style={{ margin: 0, fontSize: '13px', color: '#b91c1c' }}>
                The first {GENERATION_CHAR_LIMIT.toLocaleString()} characters of your cleaned reports will be used.
                Copy the remainder into the refinement box after generating.
              </p>
            </div>
          )}

          {error && (
            <div style={{
              backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px',
              padding: '12px 16px', marginBottom: '16px', color: '#b91c1c', fontSize: '14px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <span>⚠️ {error}</span>
              <button onClick={handleGenerate} style={{ ...btnPrimary, backgroundColor: '#ef4444', padding: '6px 12px', fontSize: '13px' }}>
                Try again
              </button>
            </div>
          )}

          <button
            onClick={handleGenerate}
            style={{ ...btnPrimary, width: '100%', padding: '16px', fontSize: '16px' }}
          >
            🪄 Generate Template
          </button>

          <p style={{ textAlign: 'center', fontSize: '12px', color: '#9ca3af', marginTop: '12px' }}>
            Generation typically takes 20–40 seconds. Reports are used only to generate the template and are not stored.
          </p>
        </main>
      </div>
    );
  }

  // ─── STEP: GENERATING ────────────────────────────────────────────────────

  if (step === 'generating') {
    return (
      <div style={{
        minHeight: '100vh', backgroundColor: '#f8fafc',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px',
      }}>
        <div style={{
          backgroundColor: 'white', borderRadius: '16px', padding: '48px 40px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)', textAlign: 'center', maxWidth: '400px',
        }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>🪄</div>
          <h2 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: '700', color: '#111827' }}>
            Building Your Template
          </h2>
          <p style={{ margin: '0 0 24px 0', color: '#6b7280', fontSize: '14px', lineHeight: '1.6' }}>
            {generatingMessage}
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
            {[0,1,2].map(i => (
              <div key={i} style={{
                width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#3b82f6',
                animation: 'pulse 1.2s ease-in-out infinite', animationDelay: `${i * 0.2}s`,
              }} />
            ))}
          </div>
          <style>{`@keyframes pulse { 0%,100%{opacity:.3;transform:scale(.8)} 50%{opacity:1;transform:scale(1.2)} }`}</style>
          <p style={{ margin: '24px 0 0 0', fontSize: '12px', color: '#9ca3af' }}>
            This usually takes 20–40 seconds
          </p>
        </div>
      </div>
    );
  }

  // ─── STEP: PREVIEW ───────────────────────────────────────────────────────

  if (step === 'preview' && generatedTemplate) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
        <header style={{
          backgroundColor: 'white', borderBottom: '1px solid #e5e7eb',
          padding: isMobile ? '16px' : '20px 24px',
        }}>
          <div style={{
            maxWidth: '800px', margin: '0 auto',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            gap: '12px', flexWrap: 'wrap',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button onClick={() => setStep('preprocess')} style={btnSecondary}>← Back</button>
              <div>
                <h1 style={{ margin: 0, fontSize: isMobile ? '16px' : '20px', fontWeight: '700', color: '#111827' }}>
                  ✅ Template Generated
                </h1>
                <p style={{ margin: 0, fontSize: '12px', color: '#6b7280' }}>
                  Review, refine with more reports, or save
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={handleEditFirst} style={btnSecondary}>Save & Edit</button>
              <button onClick={handleSave} style={btnPrimary}>Save Template</button>
            </div>
          </div>
        </header>

        <main style={{ maxWidth: '800px', margin: '0 auto', padding: isMobile ? '16px' : '32px 24px' }}>

          {/* Template name */}
          <div style={{ ...cardStyle, marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <div style={{ flex: 1 }}>
                <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>TEMPLATE NAME</p>
                <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#111827' }}>
                  {generatedTemplate.name}
                </h2>
              </div>
              <div style={{
                backgroundColor: '#eff6ff', color: '#1d4ed8', padding: '6px 12px',
                borderRadius: '6px', fontSize: '13px', fontWeight: '500',
              }}>
                {generatedTemplate.sections.length} sections
              </div>
            </div>
          </div>

          {/* Sections */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
            {generatedTemplate.sections.map((section, index) => (
              <div key={section.id} style={{ ...cardStyle, marginBottom: 0, padding: '14px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <span style={{
                    backgroundColor: '#f3f4f6', color: '#6b7280', fontSize: '11px',
                    fontWeight: '600', padding: '2px 6px', borderRadius: '4px', flexShrink: 0, marginTop: '2px',
                  }}>
                    {index + 1}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                      <span style={{
                        backgroundColor: getSectionTypeColor(section.type), color: 'white',
                        fontSize: '11px', fontWeight: '600', padding: '2px 8px', borderRadius: '4px',
                      }}>
                        {getSectionTypeLabel(section.type)}
                      </span>
                      {section.name && section.type !== 'new-line' && (
                        <span style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>
                          {section.name}
                        </span>
                      )}
                    </div>
                    <p style={{ margin: 0, fontSize: '12px', color: '#6b7280', lineHeight: '1.5' }}>
                      {getSectionSummary(section)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Refine */}
          <div style={{ ...cardStyle, border: '2px solid #8b5cf6', marginBottom: '16px' }}>
            <h3 style={{ margin: '0 0 6px 0', fontSize: '15px', fontWeight: '600', color: '#111827' }}>
              🔄 Refine with More Reports
            </h3>
            <p style={{ margin: '0 0 12px 0', fontSize: '13px', color: '#6b7280' }}>
              Paste more reports to improve and enrich the template further.
            </p>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '13px', color: '#374151' }}>Additional reports</span>
              <span style={{ fontSize: '12px', fontWeight: '600', color: refineCharCount > GENERATION_CHAR_LIMIT ? '#ef4444' : '#6b7280' }}>
                {refineCharCount.toLocaleString()} / {GENERATION_CHAR_LIMIT.toLocaleString()}
              </span>
            </div>
            <textarea
              value={refineText}
              onChange={e => setRefineText(e.target.value.substring(0, GENERATION_CHAR_LIMIT))}
              placeholder="Paste more reports here..."
              style={{ ...textareaStyle, minHeight: '120px', marginBottom: '12px' }}
            />
            {refineError && (
              <div style={{
                backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px',
                padding: '10px', marginBottom: '10px', color: '#b91c1c', fontSize: '13px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <span>⚠️ {refineError}</span>
                <button onClick={handleRefine} style={{ ...btnPrimary, backgroundColor: '#ef4444', padding: '4px 10px', fontSize: '12px' }}>
                  Try again
                </button>
              </div>
            )}
            <button
              onClick={handleRefine}
              disabled={refineCharCount < 200 || isRefining}
              style={{
                width: '100%', padding: '12px', border: 'none', borderRadius: '8px',
                fontSize: '14px', fontWeight: '600',
                backgroundColor: isRefining ? '#9ca3af' : refineCharCount >= 200 ? '#8b5cf6' : '#d1d5db',
                color: 'white', cursor: refineCharCount >= 200 && !isRefining ? 'pointer' : 'not-allowed',
              }}
            >
              {isRefining ? '🔄 Refining...' : '🔄 Refine Template'}
            </button>
          </div>

          {/* Info */}
          <div style={{
            backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0',
            borderRadius: '10px', padding: '16px', marginBottom: '24px',
          }}>
            <p style={{ margin: 0, fontSize: '13px', color: '#15803d', lineHeight: '1.6' }}>
              <strong>Save Template</strong> — saves to your library ready to use.<br />
              <strong>Save &amp; Edit</strong> — saves and opens in the editor to fine-tune.<br />
              <strong>Refine</strong> — add more reports to improve before saving.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={handleEditFirst} style={{ ...btnSecondary, flex: 1, padding: '14px', fontSize: '15px' }}>
              ✏️ Save & Edit
            </button>
            <button onClick={handleSave} style={{ ...btnPrimary, flex: 1, padding: '14px', fontSize: '15px' }}>
              ✅ Save Template
            </button>
          </div>
        </main>
      </div>
    );
  }

  // ─── STEP: SAVED ─────────────────────────────────────────────────────────

  if (step === 'saved') {
    return (
      <div style={{
        minHeight: '100vh', backgroundColor: '#f8fafc',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px',
      }}>
        <div style={{
          backgroundColor: 'white', borderRadius: '16px', padding: '48px 40px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)', textAlign: 'center', maxWidth: '400px',
        }}>
          <div style={{ fontSize: '56px', marginBottom: '16px' }}>🎉</div>
          <h2 style={{ margin: '0 0 8px 0', fontSize: '22px', fontWeight: '700', color: '#111827' }}>Template Saved!</h2>
          <p style={{ margin: '0 0 8px 0', color: '#374151', fontWeight: '600', fontSize: '16px' }}>
            {generatedTemplate?.name}
          </p>
          <p style={{ margin: '0 0 32px 0', color: '#6b7280', fontSize: '14px' }}>
            Your template is ready to use. You can edit it at any time from the Manage Templates page.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <Link to="/manage-templates" style={{ textDecoration: 'none' }}>
              <button style={{ ...btnPrimary, width: '100%', padding: '14px', fontSize: '15px' }}>
                Go to Templates
              </button>
            </Link>
            <button
              onClick={() => {
                setStep('paste');
                setRawReportText('');
                setRefineText('');
                setSubject('');
                setYearGroup('');
                setAdditionalContext('');
                setGeneratedTemplate(null);
                setPreDefinedSections({ standardComments: [], choiceComments: [] });
                setError(null);
                setRefineError(null);
              }}
              style={{ ...btnSecondary, width: '100%', padding: '14px', fontSize: '15px' }}
            >
              Import Another Template
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}