// src/pages/ImportTemplate.tsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { Template, TemplateSection } from '../types';

type Step = 'input' | 'generating' | 'preview' | 'saved';

interface GeneratedTemplate {
  name: string;
  subject: string;
  yearGroup: string;
  sections: TemplateSection[];
}

const CHAR_LIMIT = 6000;

export default function ImportTemplate() {
  const navigate = useNavigate();
  const { addTemplate } = useData();

  const [step, setStep] = useState<Step>('input');
  const [subject, setSubject] = useState('');
  const [yearGroup, setYearGroup] = useState('');
  const [reportText, setReportText] = useState('');
  const [additionalContext, setAdditionalContext] = useState('');
  const [generatedTemplate, setGeneratedTemplate] = useState<GeneratedTemplate | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isMobile] = useState(window.innerWidth <= 768);

  const charCount = reportText.length;
  const charPercent = Math.min((charCount / CHAR_LIMIT) * 100, 100);
  const charColor = charCount >= CHAR_LIMIT ? '#ef4444' : charCount >= CHAR_LIMIT * 0.8 ? '#f59e0b' : '#10b981';

  const handleGenerate = async () => {
    if (!reportText.trim()) {
      setError('Please paste some reports before generating.');
      return;
    }
    if (charCount < 200) {
      setError('Please paste more report text — at least 200 characters needed for a good template.');
      return;
    }
    if (!subject.trim()) {
      setError('Please enter the subject for this template.');
      return;
    }

    setError(null);
    setStep('generating');

    try {
      const response = await fetch('/.netlify/functions/generate-template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject,
          yearGroup,
          reportText,
          additionalContext,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Server error: ${response.status}`);
      }

      if (!data.templateName || !data.sections || !Array.isArray(data.sections)) {
        throw new Error('Generated template has invalid structure.');
      }

      const sectionsWithIds = data.sections.map((s: any, i: number) => ({
        ...s,
        id: `imported_${Date.now()}_${i}`,
      }));

      setGeneratedTemplate({
        name: data.templateName,
        subject,
        yearGroup,
        sections: sectionsWithIds,
      });
      setStep('preview');

    } catch (err: any) {
      console.error('Generation error:', err);
      setError(err.message || 'Something went wrong. Please try again.');
      setStep('input');
    }
  };

  const handleSave = () => {
    if (!generatedTemplate) return;

    const template: Template = {
      id: Date.now().toString(),
      name: generatedTemplate.name,
      sections: generatedTemplate.sections,
      createdAt: new Date().toISOString(),
    };

    addTemplate(template);
    setStep('saved');
  };

  const handleEditFirst = () => {
    if (!generatedTemplate) return;

    const template: Template = {
      id: Date.now().toString(),
      name: generatedTemplate.name,
      sections: generatedTemplate.sections,
      createdAt: new Date().toISOString(),
    };

    addTemplate(template);
    navigate('/create-template', { state: { editTemplate: template } });
  };

  const getSectionTypeLabel = (type: string): string => {
    const map: Record<string, string> = {
      'rated-comment': 'Rated Comment',
      'standard-comment': 'Standard Comment',
      'assessment-comment': 'Assessment Comment',
      'personalised-comment': 'Personalised Comment',
      'optional-additional-comment': 'Optional Comment',
      'next-steps': 'Next Steps',
      'qualities': 'Qualities',
      'new-line': 'New Line',
    };
    return map[type] || type;
  };

  const getSectionTypeColor = (type: string): string => {
    const map: Record<string, string> = {
      'rated-comment': '#3b82f6',
      'standard-comment': '#10b981',
      'assessment-comment': '#8b5cf6',
      'personalised-comment': '#f59e0b',
      'optional-additional-comment': '#ef4444',
      'next-steps': '#06b6d4',
      'qualities': '#8b5cf6',
      'new-line': '#9ca3af',
    };
    return map[type] || '#6b7280';
  };

  const getSectionSummary = (section: TemplateSection): string => {
    switch (section.type) {
      case 'rated-comment': {
        const total = Object.values(section.data?.comments || {})
          .reduce((sum: number, arr: any) => sum + (Array.isArray(arr) ? arr.length : 0), 0);
        return `${total} comments across 4 performance levels`;
      }
      case 'standard-comment':
        return ((section.data?.content || '') as string).substring(0, 80) + '...';
      case 'assessment-comment': {
        const total = Object.values(section.data?.comments || {})
          .reduce((sum: number, arr: any) => sum + (Array.isArray(arr) ? arr.length : 0), 0);
        return `${total} comments across 5 levels (${section.data?.scoreType || 'score'})`;
      }
      case 'personalised-comment': {
        const cats = Object.keys(section.data?.categories || {});
        return `${cats.length} categories: ${cats.slice(0, 3).join(', ')}${cats.length > 3 ? '...' : ''}`;
      }
      case 'next-steps': {
        const areas = Object.keys(section.data?.focusAreas || {});
        return `${areas.length} focus areas: ${areas.slice(0, 3).join(', ')}${areas.length > 3 ? '...' : ''}`;
      }
      case 'qualities': {
        const headings = Object.keys(section.data?.comments || {});
        return `${headings.length} headings: ${headings.join(', ')}`;
      }
      case 'optional-additional-comment':
        return 'Free text box for personalised additions';
      case 'new-line':
        return 'Line break for formatting';
      default:
        return '';
    }
  };

  // ─── STEP: INPUT ────────────────────────────────────────────────────────────
  if (step === 'input') {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
        <header style={{
          backgroundColor: 'white',
          borderBottom: '1px solid #e5e7eb',
          padding: isMobile ? '16px' : '20px 24px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
        }}>
          <Link to="/manage-templates" style={{ textDecoration: 'none' }}>
            <button style={{
              background: 'none', border: '1px solid #d1d5db', borderRadius: '6px',
              padding: '8px 12px', cursor: 'pointer', color: '#374151', fontSize: '14px',
            }}>
              ← Back
            </button>
          </Link>
          <div>
            <h1 style={{ margin: 0, fontSize: isMobile ? '18px' : '22px', fontWeight: '700', color: '#111827' }}>
              🪄 Import from Reports
            </h1>
            <p style={{ margin: 0, fontSize: '13px', color: '#6b7280' }}>
              Paste existing reports and AI will build your template
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
              Paste in reports you've written previously — up to {CHAR_LIMIT.toLocaleString()} characters.
              Keep pasting until the counter turns amber or red. The AI will analyse the language,
              identify patterns, and automatically build a complete template using the right section
              types — rated comments, assessment scores, next steps, qualities, and more — all in your own voice.
            </p>
          </div>

          <div style={{
            backgroundColor: 'white', borderRadius: '10px',
            border: '1px solid #e5e7eb', padding: '20px', marginBottom: '16px',
          }}>
            <h2 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600', color: '#111827' }}>
              Template Details
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                  Subject <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  placeholder="e.g. Physical Education"
                  style={{
                    width: '100%', padding: '10px 12px', border: '1px solid #d1d5db',
                    borderRadius: '6px', fontSize: '14px', outline: 'none', boxSizing: 'border-box',
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                  Year Group
                </label>
                <select
                  value={yearGroup}
                  onChange={e => setYearGroup(e.target.value)}
                  style={{
                    width: '100%', padding: '10px 12px', border: '1px solid #d1d5db',
                    borderRadius: '6px', fontSize: '14px', outline: 'none',
                    backgroundColor: 'white', boxSizing: 'border-box',
                  }}
                >
                  <option value="">Select year group...</option>
                  <option value="S1">S1</option>
                  <option value="S2">S2</option>
                  <option value="S3">S3</option>
                  <option value="S4">S4</option>
                  <option value="S5">S5</option>
                  <option value="S6">S6</option>
                  <option value="Mixed">Mixed</option>
                </select>
              </div>
            </div>
          </div>

          <div style={{
            backgroundColor: 'white', borderRadius: '10px',
            border: '1px solid #e5e7eb', padding: '20px', marginBottom: '16px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <div>
                <h2 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '600', color: '#111827' }}>
                  Paste Your Reports <span style={{ color: '#ef4444' }}>*</span>
                </h2>
                <p style={{ margin: 0, fontSize: '13px', color: '#6b7280' }}>
                  Copy reports directly from Word. Keep pasting until the counter turns amber for best results.
                </p>
              </div>
              <span style={{
                fontSize: '12px', color: charColor,
                fontWeight: '600', whiteSpace: 'nowrap', marginLeft: '12px',
              }}>
                {charCount.toLocaleString()} / {CHAR_LIMIT.toLocaleString()}
              </span>
            </div>

            {/* Character progress bar */}
            <div style={{
              height: '4px', backgroundColor: '#e5e7eb', borderRadius: '2px', marginBottom: '12px'
            }}>
              <div style={{
                height: '100%', width: `${charPercent}%`,
                backgroundColor: charColor, borderRadius: '2px',
                transition: 'width 0.2s, background-color 0.2s'
              }} />
            </div>

            <textarea
              value={reportText}
              onChange={e => setReportText(e.target.value.substring(0, CHAR_LIMIT))}
              placeholder={`Paste your reports here. Keep adding reports until the counter turns amber or red for the best quality template.\n\nFor example:\n\nJohn has shown excellent commitment throughout the year...\n\nSarah demonstrates good understanding of the subject...\n\n[Continue pasting more reports...]`}
              style={{
                width: '100%', minHeight: '280px', padding: '12px',
                border: '1px solid #d1d5db', borderRadius: '6px',
                fontSize: '13px', lineHeight: '1.6', resize: 'vertical',
                outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
              }}
            />
            {charCount >= CHAR_LIMIT && (
              <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#ef4444' }}>
                Maximum reached — the AI will use all {CHAR_LIMIT.toLocaleString()} characters you've provided.
              </p>
            )}
          </div>

          <div style={{
            backgroundColor: 'white', borderRadius: '10px',
            border: '1px solid #e5e7eb', padding: '20px', marginBottom: '24px',
          }}>
            <h2 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '600', color: '#111827' }}>
              Additional Context{' '}
              <span style={{ fontSize: '13px', fontWeight: '400', color: '#9ca3af' }}>(optional)</span>
            </h2>
            <p style={{ margin: '0 0 10px 0', fontSize: '13px', color: '#6b7280' }}>
              Any specific areas, units, or features you'd like the template to include?
            </p>
            <textarea
              value={additionalContext}
              onChange={e => setAdditionalContext(e.target.value)}
              placeholder="e.g. We teach swimming, gymnastics and games. Include a section for each activity. Also include an assessment section for our fitness test (scored out of 100)."
              style={{
                width: '100%', minHeight: '80px', padding: '10px 12px',
                border: '1px solid #d1d5db', borderRadius: '6px',
                fontSize: '13px', resize: 'vertical', outline: 'none',
                boxSizing: 'border-box', fontFamily: 'inherit',
              }}
            />
          </div>

          {error && (
            <div style={{
              backgroundColor: '#fef2f2', border: '1px solid #fecaca',
              borderRadius: '8px', padding: '12px 16px', marginBottom: '16px',
              color: '#b91c1c', fontSize: '14px',
            }}>
              ⚠️ {error}
            </div>
          )}

          <button
            onClick={handleGenerate}
            style={{
              width: '100%', backgroundColor: '#3b82f6', color: 'white',
              padding: '16px', border: 'none', borderRadius: '10px',
              fontSize: '16px', fontWeight: '600', cursor: 'pointer',
            }}
          >
            🪄 Generate Template
          </button>

          <p style={{ textAlign: 'center', fontSize: '12px', color: '#9ca3af', marginTop: '12px' }}>
            Generation typically takes 15–25 seconds.
            Report text is used only to generate the template and is not stored.
          </p>
        </main>
      </div>
    );
  }

  // ─── STEP: GENERATING ───────────────────────────────────────────────────────
  if (step === 'generating') {
    return (
      <div style={{
        minHeight: '100vh', backgroundColor: '#f8fafc',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', padding: '24px',
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
            The AI is analysing your reports, identifying patterns, and selecting the best
            section types for your template…
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{
                width: '10px', height: '10px', borderRadius: '50%',
                backgroundColor: '#3b82f6',
                animation: 'pulse 1.2s ease-in-out infinite',
                animationDelay: `${i * 0.2}s`,
              }} />
            ))}
          </div>
          <style>{`
            @keyframes pulse {
              0%, 100% { opacity: 0.3; transform: scale(0.8); }
              50% { opacity: 1; transform: scale(1.2); }
            }
          `}</style>
          <p style={{ margin: '24px 0 0 0', fontSize: '12px', color: '#9ca3af' }}>
            This usually takes 15–25 seconds
          </p>
        </div>
      </div>
    );
  }

  // ─── STEP: PREVIEW ──────────────────────────────────────────────────────────
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
              <button
                onClick={() => setStep('input')}
                style={{
                  background: 'none', border: '1px solid #d1d5db', borderRadius: '6px',
                  padding: '8px 12px', cursor: 'pointer', color: '#374151', fontSize: '14px',
                }}
              >
                ← Regenerate
              </button>
              <div>
                <h1 style={{ margin: 0, fontSize: isMobile ? '16px' : '20px', fontWeight: '700', color: '#111827' }}>
                  ✅ Template Generated
                </h1>
                <p style={{ margin: 0, fontSize: '12px', color: '#6b7280' }}>
                  Review the sections below before saving
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={handleEditFirst}
                style={{
                  backgroundColor: '#f3f4f6', color: '#374151', padding: '10px 16px',
                  border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px',
                  fontWeight: '500', cursor: 'pointer',
                }}
              >
                Save & Edit
              </button>
              <button
                onClick={handleSave}
                style={{
                  backgroundColor: '#3b82f6', color: 'white', padding: '10px 16px',
                  border: 'none', borderRadius: '8px', fontSize: '14px',
                  fontWeight: '600', cursor: 'pointer',
                }}
              >
                Save Template
              </button>
            </div>
          </div>
        </header>

        <main style={{ maxWidth: '800px', margin: '0 auto', padding: isMobile ? '16px' : '32px 24px' }}>

          <div style={{
            backgroundColor: 'white', borderRadius: '10px',
            border: '1px solid #e5e7eb', padding: '20px', marginBottom: '16px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <div style={{ flex: 1 }}>
                <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>
                  TEMPLATE NAME
                </p>
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

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
            {generatedTemplate.sections.map((section, index) => (
              <div key={section.id} style={{
                backgroundColor: 'white', borderRadius: '10px',
                border: '1px solid #e5e7eb', padding: '16px',
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <span style={{
                    backgroundColor: '#f3f4f6', color: '#6b7280', fontSize: '11px',
                    fontWeight: '600', padding: '2px 6px', borderRadius: '4px',
                    flexShrink: 0, marginTop: '2px',
                  }}>
                    {index + 1}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                      <span style={{
                        backgroundColor: getSectionTypeColor(section.type),
                        color: 'white', fontSize: '11px', fontWeight: '600',
                        padding: '2px 8px', borderRadius: '4px',
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

          <div style={{
            backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0',
            borderRadius: '10px', padding: '16px', marginBottom: '24px',
          }}>
            <h3 style={{ margin: '0 0 6px 0', fontSize: '14px', fontWeight: '600', color: '#166534' }}>
              💡 What happens next?
            </h3>
            <p style={{ margin: 0, fontSize: '13px', color: '#15803d', lineHeight: '1.6' }}>
              <strong>Save Template</strong> — saves directly to your template library ready to use.<br />
              <strong>Save &amp; Edit</strong> — saves and opens in the template editor so you can
              fine-tune any sections or comments before using it.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={handleEditFirst}
              style={{
                flex: 1, backgroundColor: '#f3f4f6', color: '#374151',
                padding: '14px', border: '1px solid #d1d5db', borderRadius: '10px',
                fontSize: '15px', fontWeight: '500', cursor: 'pointer',
              }}
            >
              ✏️ Save & Edit
            </button>
            <button
              onClick={handleSave}
              style={{
                flex: 1, backgroundColor: '#3b82f6', color: 'white',
                padding: '14px', border: 'none', borderRadius: '10px',
                fontSize: '15px', fontWeight: '600', cursor: 'pointer',
              }}
            >
              ✅ Save Template
            </button>
          </div>
        </main>
      </div>
    );
  }

  // ─── STEP: SAVED ────────────────────────────────────────────────────────────
  if (step === 'saved') {
    return (
      <div style={{
        minHeight: '100vh', backgroundColor: '#f8fafc',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', padding: '24px',
      }}>
        <div style={{
          backgroundColor: 'white', borderRadius: '16px', padding: '48px 40px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)', textAlign: 'center', maxWidth: '400px',
        }}>
          <div style={{ fontSize: '56px', marginBottom: '16px' }}>🎉</div>
          <h2 style={{ margin: '0 0 8px 0', fontSize: '22px', fontWeight: '700', color: '#111827' }}>
            Template Saved!
          </h2>
          <p style={{ margin: '0 0 8px 0', color: '#374151', fontWeight: '600', fontSize: '16px' }}>
            {generatedTemplate?.name}
          </p>
          <p style={{ margin: '0 0 32px 0', color: '#6b7280', fontSize: '14px' }}>
            Your template is ready to use. You can edit it at any time from the Manage Templates page.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <Link to="/manage-templates" style={{ textDecoration: 'none' }}>
              <button style={{
                width: '100%', backgroundColor: '#3b82f6', color: 'white',
                padding: '14px', border: 'none', borderRadius: '10px',
                fontSize: '15px', fontWeight: '600', cursor: 'pointer',
              }}>
                Go to Templates
              </button>
            </Link>
            <button
              onClick={() => {
                setStep('input');
                setReportText('');
                setSubject('');
                setYearGroup('');
                setAdditionalContext('');
                setGeneratedTemplate(null);
              }}
              style={{
                width: '100%', backgroundColor: '#f3f4f6', color: '#374151',
                padding: '14px', border: '1px solid #d1d5db', borderRadius: '10px',
                fontSize: '15px', fontWeight: '500', cursor: 'pointer',
              }}
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