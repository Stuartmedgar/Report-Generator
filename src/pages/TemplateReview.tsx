// src/pages/TemplateReview.tsx
import React, { useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { TemplateSection } from '../types';
import PageNav from '../components/PageNav';

interface ReviewTemplate {
  name: string;
  sections: TemplateSection[];
}

const SECTION_COLORS: Record<string, string> = {
  'standard-comment': '#10b981', 'qualities': '#8b5cf6', 'rated-comment': '#3b82f6',
  'assessment-comment': '#8b5cf6', 'personalised-comment': '#f59e0b', 'next-steps': '#06b6d4',
  'optional-additional-comment': '#ef4444', 'new-line': '#9ca3af',
};

const SECTION_LABELS: Record<string, string> = {
  'standard-comment': 'Fixed Statement', 'qualities': 'Qualities / Strengths',
  'rated-comment': 'Rated Comment', 'assessment-comment': 'Assessment Score',
  'personalised-comment': 'Personalised Comment', 'next-steps': 'Next Steps / Targets',
  'optional-additional-comment': 'Optional Notes Box', 'new-line': 'Line Break',
};

function countStatements(section: TemplateSection): number {
  if (section.type === 'standard-comment') return section.data?.content ? 1 : 0;
  if (section.type === 'qualities') return Object.values(section.data?.comments || {}).reduce((n: number, v: any) => n + (v?.length || 0), 0);
  if (section.type === 'next-steps') return Object.values(section.data?.focusAreas || {}).reduce((n: number, v: any) => n + (v?.length || 0), 0);
  if (section.type === 'rated-comment') return Object.values(section.data?.comments || {}).reduce((n: number, v: any) => n + (v?.length || 0), 0);
  if (section.type === 'assessment-comment') return Object.values(section.data?.comments || {}).reduce((n: number, v: any) => n + (v?.length || 0), 0);
  if (section.type === 'personalised-comment') return Object.values(section.data?.categories || {}).reduce((n: number, v: any) => n + (v?.length || 0), 0);
  return 0;
}

function generatePreview(sections: TemplateSection[]): string {
  const parts: string[] = [];
  for (const s of sections) {
    if (s.type === 'new-line') { parts.push('\n\n'); continue; }
    if (s.data?.showHeader && s.name) parts.push(`${s.name.toUpperCase()}\n`);
    if (s.type === 'standard-comment') { if (s.data?.content) parts.push(s.data.content.replace(/\[Name\]/g, 'Alex')); }
    else if (s.type === 'optional-additional-comment') { parts.push('[Optional comment — teacher types here]'); }
    else if (s.type === 'qualities') { const first = Object.values(s.data?.comments || {})[0] as string[] | undefined; if (first?.[0]) parts.push(first[0].replace(/\[Name\]/g, 'Alex')); }
    else if (s.type === 'next-steps') { const first = Object.values(s.data?.focusAreas || {})[0] as string[] | undefined; if (first?.[0]) parts.push(first[0].replace(/\[Name\]/g, 'Alex')); }
    else if (s.type === 'rated-comment') { const good = s.data?.comments?.good; if (good?.[0]) parts.push(good[0].replace(/\[Name\]/g, 'Alex')); }
    else if (s.type === 'assessment-comment') { const good = s.data?.comments?.good; if (good?.[0]) parts.push(good[0].replace(/\[Name\]/g, 'Alex').replace(/\[Score\]/g, '78%')); }
    else if (s.type === 'personalised-comment') { const first = Object.values(s.data?.categories || {})[0] as string[] | undefined; if (first?.[0]) parts.push(first[0].replace(/\[Name\]/g, 'Alex').replace(/\[Info 1\]/g, 'football')); }
  }
  return parts.join(' ').replace(/ {2,}/g, ' ').replace(/\n /g, '\n').trim();
}

function makeId() { return `s_${Date.now()}_${Math.random().toString(36).slice(2)}`; }

export default function TemplateReview() {
  const location = useLocation();
  const navigate = useNavigate();
  const { addTemplate, updateTemplate } = useData();

  const incoming = location.state?.template as ReviewTemplate | undefined;
  const isEditing = location.state?.isEditing as boolean | undefined;
  const existingId = location.state?.templateId as string | undefined;

  const [template, setTemplate] = useState<ReviewTemplate>(
    incoming || { name: 'Untitled Template', sections: [] }
  );
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reviewViewMode, setReviewViewMode] = useState<'sections' | 'preview'>('sections');
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const dragSourceIndex = React.useRef<number | null>(null);

  const updateSections = useCallback((fn: (s: TemplateSection[]) => TemplateSection[]) => {
    setTemplate(t => ({ ...t, sections: fn(t.sections) }));
    setSaved(false);
  }, []);

  const handleDragStart = (i: number) => { dragSourceIndex.current = i; };
  const handleDragOver = (e: React.DragEvent, i: number) => { e.preventDefault(); setDragOverIndex(i); };
  const handleDrop = (e: React.DragEvent, ti: number) => {
    e.preventDefault();
    const src = dragSourceIndex.current;
    if (src === null || src === ti) { setDragOverIndex(null); return; }
    updateSections(prev => { const u = [...prev]; const [m] = u.splice(src, 1); u.splice(ti, 0, m); return u; });
    dragSourceIndex.current = null; setDragOverIndex(null);
  };
  const handleDragEnd = () => { dragSourceIndex.current = null; setDragOverIndex(null); };

  const handleToggleHeader = (id: string) => {
    updateSections(prev => prev.map(s => s.id === id
      ? { ...s, data: { ...s.data, showHeader: !s.data?.showHeader } }
      : s
    ));
  };

  const handleRemoveSection = (id: string) => {
    updateSections(prev => prev.filter(s => s.id !== id));
  };

  const handleAddSpecialSection = (type: 'new-line' | 'optional-additional-comment', afterIndex: number) => {
    updateSections(prev => {
      const u = [...prev];
      u.splice(afterIndex + 1, 0, {
        id: makeId(), type, name: type === 'new-line' ? '' : 'Additional Comments',
        data: { showHeader: false }
      });
      return u;
    });
  };

  const handleSave = () => {
    if (!template.name.trim()) { setError('Please enter a template name.'); return; }
    if (isEditing && existingId) {
      updateTemplate({ id: existingId, name: template.name, sections: template.sections, createdAt: new Date().toISOString() });
    } else {
      addTemplate({ name: template.name, sections: template.sections });
    }
    setSaved(true); setError(null);
  };

  const handleSaveAndClose = () => {
    handleSave();
    setTimeout(() => navigate('/manage-templates'), 300);
  };

  const handleStartWriting = () => {
    if (!template.name.trim()) { setError('Please enter a template name.'); return; }
    const classId = sessionStorage.getItem('selectedClassId');
    const templateId = isEditing && existingId ? existingId : `template-${Date.now()}`;
    if (isEditing && existingId) {
      updateTemplate({ id: existingId, name: template.name, sections: template.sections, createdAt: new Date().toISOString() });
    } else {
      addTemplate({ name: template.name, sections: template.sections });
    }
    setSaved(true); setError(null);
    if (!classId) { setTimeout(() => navigate('/start'), 300); return; }
    sessionStorage.setItem('continueEditing', JSON.stringify({ classId, templateId, studentIndex: 0 }));
    navigate('/write-reports');
  };

  const previewText = generatePreview(template.sections);

  const btnStyle = (bg: string, color: string = 'white', border?: string): React.CSSProperties => ({
    backgroundColor: bg, color, padding: '9px 18px', border: border || 'none',
    borderRadius: '7px', fontSize: '13px', fontWeight: '600', cursor: 'pointer',
  });

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', display: 'flex', flexDirection: 'column' }}>

      <PageNav />

      <header style={{ backgroundColor: 'white', borderBottom: '1px solid #e5e7eb', padding: '12px 24px', position: 'sticky', top: 0, zIndex: 10, flexShrink: 0 }}>
        <div style={{ maxWidth: '860px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <input
              type="text"
              value={template.name}
              onChange={e => { setTemplate(t => ({ ...t, name: e.target.value })); setSaved(false); }}
              style={{ fontSize: '17px', fontWeight: '700', color: '#111827', border: 'none', outline: 'none', background: 'transparent', width: '100%', fontFamily: 'inherit' }}
              placeholder="Template name..."
            />
            <p style={{ margin: 0, fontSize: '12px', color: '#6b7280' }}>
              {template.sections.filter(s => s.type !== 'new-line').length} sections
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
            {saved
              ? <button style={btnStyle('#10b981')}>✅ Saved</button>
              : <button onClick={handleSave} style={btnStyle('#3b82f6')}>💾 Save</button>
            }
            <button onClick={handleSaveAndClose} style={btnStyle('#10b981')}>Save & Close</button>
            <button onClick={handleStartWriting} style={btnStyle('#8b5cf6')}>✏️ Start Writing</button>
          </div>
        </div>
      </header>

      {error && (
        <div style={{ maxWidth: '860px', margin: '12px auto 0', padding: '0 24px', width: '100%', boxSizing: 'border-box' }}>
          <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', color: '#b91c1c' }}>⚠️ {error}</div>
        </div>
      )}

      <div style={{ maxWidth: '860px', margin: '16px auto 0', padding: '0 24px', width: '100%', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden', width: 'fit-content' }}>
          {(['sections', 'preview'] as const).map(mode => (
            <button key={mode} onClick={() => setReviewViewMode(mode)} style={{ padding: '8px 20px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: reviewViewMode === mode ? '600' : '400', color: reviewViewMode === mode ? '#111827' : '#9ca3af', backgroundColor: reviewViewMode === mode ? '#f8fafc' : 'white', borderBottom: reviewViewMode === mode ? '2px solid #3b82f6' : '2px solid transparent' }}>
              {mode === 'sections' ? '📋 Sections' : '👁 Preview'}
            </button>
          ))}
        </div>
      </div>

      <main style={{ flex: 1, maxWidth: '860px', margin: '16px auto', padding: '0 24px 40px', width: '100%', boxSizing: 'border-box' }}>

        {reviewViewMode === 'preview' ? (
          <div style={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '28px 32px' }}>
            <p style={{ fontSize: '12px', color: '#9ca3af', margin: '0 0 16px 0' }}>
              Sample report using the first statement from each section. Pupil shown as "Alex".
            </p>
            <div style={{ fontSize: '14px', color: '#374151', lineHeight: '1.9', whiteSpace: 'pre-wrap', textAlign: 'left' }}>
              {previewText || <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>Add sections with statements to see a preview here.</span>}
            </div>
          </div>
        ) : (
          <div>
            <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', fontSize: '12px', color: '#78350f', lineHeight: '1.6' }}>
              <strong>Drag</strong> to reorder · <strong>Toggle heading</strong> to show/hide section label in the report writer · Add <strong>line breaks</strong> or <strong>optional comment boxes</strong> after any section.
            </div>

            {template.sections.length === 0 && (
              <div style={{ textAlign: 'center', padding: '48px', color: '#9ca3af', backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
                <div style={{ fontSize: '40px', marginBottom: '12px' }}>📝</div>
                <p style={{ margin: 0 }}>No sections yet.</p>
              </div>
            )}

            {template.sections.map((s, index) => {
              const isSpecial = s.type === 'new-line' || s.type === 'optional-additional-comment';
              const isDragOver = dragOverIndex === index;
              const stmtCount = countStatements(s);
              const showHeader = s.data?.showHeader;

              return (
                <div key={s.id}>
                  <div
                    style={{ height: isDragOver ? '36px' : '4px', backgroundColor: isDragOver ? '#dbeafe' : 'transparent', border: isDragOver ? '2px dashed #3b82f6' : 'none', borderRadius: '6px', transition: 'all 0.15s', marginBottom: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    onDragOver={e => handleDragOver(e, index)}
                    onDrop={e => handleDrop(e, index)}
                  >
                    {isDragOver && <span style={{ fontSize: '12px', color: '#3b82f6' }}>Drop here</span>}
                  </div>

                  <div
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragEnd={handleDragEnd}
                    style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: isSpecial ? '8px 14px' : '12px 14px', backgroundColor: isSpecial ? '#f9fafb' : 'white', border: `1px solid ${isSpecial ? '#f3f4f6' : '#e5e7eb'}`, borderRadius: '8px', marginBottom: '4px', cursor: 'grab' }}
                  >
                    <div style={{ fontSize: '16px', color: '#d1d5db', flexShrink: 0 }}>⠿</div>

                    {!isSpecial && (
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: SECTION_COLORS[s.type] || '#9ca3af', flexShrink: 0 }} />
                    )}

                    <div style={{ flex: 1, minWidth: 0 }}>
                      {isSpecial ? (
                        <div style={{ fontSize: '12px', color: '#9ca3af', fontStyle: 'italic' }}>
                          {s.type === 'new-line' ? '— Line break —' : '[ Optional comment box ]'}
                        </div>
                      ) : (
                        <>
                          <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>{s.name}</div>
                          <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '1px' }}>
                            {SECTION_LABELS[s.type]}
                            {stmtCount > 0 && ` · ${stmtCount} statement${stmtCount !== 1 ? 's' : ''}`}
                          </div>
                        </>
                      )}
                    </div>

                    {!isSpecial && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                        <span style={{ fontSize: '11px', color: '#9ca3af' }}>Heading</span>
                        <button
                          onClick={() => handleToggleHeader(s.id)}
                          style={{ width: '36px', height: '20px', borderRadius: '10px', border: 'none', cursor: 'pointer', backgroundColor: showHeader ? '#3b82f6' : '#d1d5db', position: 'relative', transition: 'background-color 0.2s', flexShrink: 0 }}
                        >
                          <div style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: 'white', position: 'absolute', top: '2px', left: showHeader ? '18px' : '2px', transition: 'left 0.2s' }} />
                        </button>
                      </div>
                    )}

                    <button
                      onClick={() => handleRemoveSection(s.id)}
                      style={{ backgroundColor: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '6px', padding: '4px 10px', fontSize: '12px', cursor: 'pointer', flexShrink: 0 }}
                    >✕</button>
                  </div>

                  <div style={{ display: 'flex', gap: '6px', marginBottom: '8px', paddingLeft: '28px' }}>
                    <button onClick={() => handleAddSpecialSection('new-line', index)} style={{ background: 'none', border: '1px dashed #d1d5db', borderRadius: '4px', padding: '2px 8px', fontSize: '11px', color: '#9ca3af', cursor: 'pointer' }}>+ line break</button>
                    <button onClick={() => handleAddSpecialSection('optional-additional-comment', index)} style={{ background: 'none', border: '1px dashed #d1d5db', borderRadius: '4px', padding: '2px 8px', fontSize: '11px', color: '#9ca3af', cursor: 'pointer' }}>+ optional comment box</button>
                  </div>
                </div>
              );
            })}

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '16px' }}>
              <button onClick={handleSaveAndClose} style={btnStyle('#10b981')}>Save & Close</button>
              <button onClick={handleStartWriting} style={btnStyle('#8b5cf6')}>✏️ Start Writing →</button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}