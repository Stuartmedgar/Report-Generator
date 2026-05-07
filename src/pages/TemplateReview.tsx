// src/pages/TemplateReview.tsx
import React, { useState, useCallback } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { TemplateSection } from '../types';

// ─── TYPES ────────────────────────────────────────────────────────────────────

interface ReviewTemplate {
  name: string;
  sections: TemplateSection[];
}

type EditMode =
  | null
  | 'rename-template'
  | 'rename-section'
  | 'add-option'
  | 'add-heading'
  | 'add-newline'
  | 'add-optional'
  | 'add-standard'
  | 'add-qualities'
  | 'add-nextsteps';

// ─── HELPERS ──────────────────────────────────────────────────────────────────

const getSectionTypeColor = (type: string) => ({
  'standard-comment': '#10b981',
  'assessment-comment': '#8b5cf6',
  'personalised-comment': '#f59e0b',
  'next-steps': '#06b6d4',
  'qualities': '#f59e0b',
  'rated-comment': '#3b82f6',
  'new-line': '#e5e7eb',
  'optional-additional-comment': '#ef4444',
}[type] || '#6b7280');

const getSectionTypeLabel = (type: string) => ({
  'standard-comment': 'Standard Comment',
  'assessment-comment': 'Assessment',
  'personalised-comment': 'Score Entry',
  'next-steps': 'Next Steps',
  'qualities': 'Choice Comment',
  'rated-comment': 'Rated Comment',
  'new-line': 'Line Break',
  'optional-additional-comment': 'Optional Comment',
}[type] || type);

function getHeadings(section: TemplateSection): string[] {
  if (section.type === 'qualities') return Object.keys(section.data?.comments || {});
  if (section.type === 'next-steps') return Object.keys(section.data?.focusAreas || {});
  if (section.type === 'rated-comment') return ['excellent', 'good', 'satisfactory', 'needsImprovement'];
  if (section.type === 'assessment-comment') return ['excellent', 'good', 'satisfactory', 'needsImprovement', 'notCompleted'];
  if (section.type === 'personalised-comment') return Object.keys(section.data?.categories || {});
  return [];
}

function getOptions(section: TemplateSection, heading: string): string[] {
  if (section.type === 'qualities') return section.data?.comments?.[heading] || [];
  if (section.type === 'next-steps') return section.data?.focusAreas?.[heading] || [];
  if (section.type === 'rated-comment') return section.data?.comments?.[heading] || [];
  if (section.type === 'assessment-comment') return section.data?.comments?.[heading] || [];
  if (section.type === 'personalised-comment') return section.data?.categories?.[heading] || [];
  return [];
}

function makeId() { return `s_${Date.now()}_${Math.random().toString(36).slice(2)}`; }

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export default function TemplateReview() {
  const location = useLocation();
  const navigate = useNavigate();
  const { addTemplate, updateTemplate } = useData();
  const [isMobile] = useState(window.innerWidth <= 768);

  // Get template from navigation state
  const incoming = location.state?.template as ReviewTemplate | undefined;
  const isEditing = location.state?.isEditing as boolean | undefined;
  const existingId = location.state?.templateId as string | undefined;

  const [template, setTemplate] = useState<ReviewTemplate>(
    incoming || { name: 'Untitled Template', sections: [] }
  );

  // Preview state — one selected option per section
  const [previewSelections, setPreviewSelections] = useState<Record<string, string>>({});
  const [showPreview, setShowPreview] = useState(false);

  // Edit state
  const [editMode, setEditMode] = useState<EditMode>(null);
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [editingHeading, setEditingHeading] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [editValue2, setEditValue2] = useState('');
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  // ─── STYLES ────────────────────────────────────────────────────────────────

  const card: React.CSSProperties = { backgroundColor: 'white', borderRadius: '10px', border: '1px solid #e5e7eb', padding: '16px', marginBottom: '10px' };
  const btn = (color: string, bg: string, border?: string): React.CSSProperties => ({ backgroundColor: bg, color, padding: '8px 14px', border: border || 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' });
  const inp: React.CSSProperties = { width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' };
  const txa: React.CSSProperties = { width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', resize: 'vertical' };

  // ─── TEMPLATE MUTATIONS ────────────────────────────────────────────────────

  const updateSections = useCallback((fn: (sections: TemplateSection[]) => TemplateSection[]) => {
    setTemplate(t => ({ ...t, sections: fn(t.sections) }));
    setSaved(false);
  }, []);

  const moveSection = (index: number, direction: 'up' | 'down') => {
    updateSections(sections => {
      const next = [...sections];
      const target = direction === 'up' ? index - 1 : index + 1;
      if (target < 0 || target >= next.length) return next;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const deleteSection = (id: string) => {
    updateSections(sections => sections.filter(s => s.id !== id));
  };

  const insertNewLine = (afterIndex: number) => {
    updateSections(sections => {
      const next = [...sections];
      next.splice(afterIndex + 1, 0, { id: makeId(), type: 'new-line', name: '', data: {} });
      return next;
    });
  };

  const insertOptional = (afterIndex: number) => {
    updateSections(sections => {
      const next = [...sections];
      next.splice(afterIndex + 1, 0, { id: makeId(), type: 'optional-additional-comment', name: 'Additional Comments', data: {} });
      return next;
    });
  };

  const renameSectionInTemplate = (id: string, newName: string) => {
    updateSections(sections => sections.map(s => s.id === id ? { ...s, name: newName } : s));
  };

  const addOptionToHeading = (sectionId: string, heading: string, option: string) => {
    updateSections(sections => sections.map(s => {
      if (s.id !== sectionId) return s;
      if (s.type === 'qualities') {
        const comments = { ...s.data.comments };
        comments[heading] = [...(comments[heading] || []), option];
        return { ...s, data: { ...s.data, comments } };
      }
      if (s.type === 'next-steps') {
        const focusAreas = { ...s.data.focusAreas };
        focusAreas[heading] = [...(focusAreas[heading] || []), option];
        return { ...s, data: { ...s.data, focusAreas } };
      }
      if (s.type === 'rated-comment' || s.type === 'assessment-comment') {
        const comments = { ...s.data.comments };
        comments[heading] = [...(comments[heading] || []), option];
        return { ...s, data: { ...s.data, comments } };
      }
      if (s.type === 'personalised-comment') {
        const categories = { ...s.data.categories };
        categories[heading] = [...(categories[heading] || []), option];
        return { ...s, data: { ...s.data, categories } };
      }
      return s;
    }));
  };

  const addHeadingToSection = (sectionId: string, heading: string, firstOption: string) => {
    updateSections(sections => sections.map(s => {
      if (s.id !== sectionId) return s;
      if (s.type === 'qualities') {
        const comments = { ...s.data.comments, [heading]: [firstOption] };
        return { ...s, data: { ...s.data, comments } };
      }
      if (s.type === 'next-steps') {
        const focusAreas = { ...s.data.focusAreas, [heading]: [firstOption] };
        return { ...s, data: { ...s.data, focusAreas } };
      }
      if (s.type === 'personalised-comment') {
        const categories = { ...s.data.categories, [heading]: [firstOption] };
        return { ...s, data: { ...s.data, categories } };
      }
      return s;
    }));
  };

  const deleteOption = (sectionId: string, heading: string, optionIndex: number) => {
    updateSections(sections => sections.map(s => {
      if (s.id !== sectionId) return s;
      if (s.type === 'qualities') {
        const comments = { ...s.data.comments };
        comments[heading] = comments[heading].filter((_: string, i: number) => i !== optionIndex);
        return { ...s, data: { ...s.data, comments } };
      }
      if (s.type === 'next-steps') {
        const focusAreas = { ...s.data.focusAreas };
        focusAreas[heading] = focusAreas[heading].filter((_: string, i: number) => i !== optionIndex);
        return { ...s, data: { ...s.data, focusAreas } };
      }
      if (s.type === 'rated-comment' || s.type === 'assessment-comment') {
        const comments = { ...s.data.comments };
        comments[heading] = comments[heading].filter((_: string, i: number) => i !== optionIndex);
        return { ...s, data: { ...s.data, comments } };
      }
      if (s.type === 'personalised-comment') {
        const categories = { ...s.data.categories };
        categories[heading] = categories[heading].filter((_: string, i: number) => i !== optionIndex);
        return { ...s, data: { ...s.data, categories } };
      }
      return s;
    }));
  };

  const deleteHeading = (sectionId: string, heading: string) => {
    updateSections(sections => sections.map(s => {
      if (s.id !== sectionId) return s;
      if (s.type === 'qualities') {
        const { [heading]: _, ...rest } = s.data.comments;
        return { ...s, data: { ...s.data, comments: rest } };
      }
      if (s.type === 'next-steps') {
        const { [heading]: _, ...rest } = s.data.focusAreas;
        return { ...s, data: { ...s.data, focusAreas: rest } };
      }
      if (s.type === 'personalised-comment') {
        const { [heading]: _, ...rest } = s.data.categories;
        return { ...s, data: { ...s.data, categories: rest } };
      }
      return s;
    }));
  };

  const addNewStandardSection = (afterIndex: number, name: string, content: string) => {
    updateSections(sections => {
      const next = [...sections];
      next.splice(afterIndex + 1, 0, { id: makeId(), type: 'standard-comment', name, data: { content } });
      return next;
    });
  };

  const addNewQualitiesSection = (afterIndex: number, name: string, heading: string, firstOption: string) => {
    updateSections(sections => {
      const next = [...sections];
      next.splice(afterIndex + 1, 0, { id: makeId(), type: 'qualities', name, data: { comments: { [heading]: [firstOption] } } });
      return next;
    });
  };

  const addNewNextStepsSection = (afterIndex: number, name: string, heading: string, firstOption: string) => {
    updateSections(sections => {
      const next = [...sections];
      next.splice(afterIndex + 1, 0, { id: makeId(), type: 'next-steps', name, data: { focusAreas: { [heading]: [firstOption] } } });
      return next;
    });
  };

  // ─── SAVE ───────────────────────────────────────────────────────────────────

  const handleSave = () => {
    if (!template.name.trim()) { setError('Please enter a template name.'); return; }
    if (isEditing && existingId) {
      updateTemplate({ id: existingId, name: template.name, sections: template.sections, createdAt: new Date().toISOString() });
    } else {
      addTemplate({ name: template.name, sections: template.sections });
    }
    setSaved(true);
    setError(null);
  };

  const handleSaveAndGo = () => {
    handleSave();
    setTimeout(() => navigate('/manage-templates'), 300);
  };

  // ─── PREVIEW ────────────────────────────────────────────────────────────────

  const buildPreviewText = () => {
    return template.sections.map(section => {
      if (section.type === 'new-line') return '\n';
      if (section.type === 'optional-additional-comment') return '[Optional: ' + (previewSelections[section.id] || 'Additional comment...') + ']';
      if (section.type === 'standard-comment') return section.data?.content || '';
      const sel = previewSelections[section.id];
      if (sel) return sel;
      // Default to first option of first heading
      const headings = getHeadings(section);
      if (headings.length > 0) {
        const opts = getOptions(section, headings[0]);
        if (opts.length > 0) return opts[0];
      }
      return `[${section.name || section.type}]`;
    }).join(' ').replace(/ \n /g, '\n').replace(/\n +/g, '\n').trim();
  };

  const toggleExpand = (id: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const closeEdit = () => { setEditMode(null); setEditingSectionId(null); setEditingHeading(null); setEditValue(''); setEditValue2(''); };

  // ─── SECTION CARD ───────────────────────────────────────────────────────────

  const SectionCard = ({ section, index }: { section: TemplateSection; index: number }) => {
    const isExpanded = expandedSections.has(section.id);
    const headings = getHeadings(section);
    const isNewLine = section.type === 'new-line';
    const isOptional = section.type === 'optional-additional-comment';
    const isStandard = section.type === 'standard-comment';

    if (isNewLine) return (
      <div key={section.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
        <div style={{ flex: 1, height: '2px', backgroundColor: '#e5e7eb', borderRadius: '1px' }} />
        <span style={{ fontSize: '11px', color: '#9ca3af', whiteSpace: 'nowrap' }}>Line Break</span>
        <div style={{ flex: 1, height: '2px', backgroundColor: '#e5e7eb', borderRadius: '1px' }} />
        <button onClick={() => deleteSection(section.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '16px', padding: '0 4px' }}>×</button>
        <button onClick={() => moveSection(index, 'up')} disabled={index === 0} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: index === 0 ? 'not-allowed' : 'pointer', fontSize: '14px' }}>↑</button>
        <button onClick={() => moveSection(index, 'down')} disabled={index === template.sections.length - 1} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: index === template.sections.length - 1 ? 'not-allowed' : 'pointer', fontSize: '14px' }}>↓</button>
      </div>
    );

    return (
      <div style={{ ...card, border: '1px solid #e5e7eb' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
              <span style={{ backgroundColor: getSectionTypeColor(section.type), color: section.type === 'new-line' ? '#6b7280' : 'white', fontSize: '11px', fontWeight: '600', padding: '2px 8px', borderRadius: '4px' }}>
                {getSectionTypeLabel(section.type)}
              </span>
              <span style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>{section.name}</span>
              {!isNewLine && !isOptional && (
                <button onClick={() => { setEditMode('rename-section'); setEditingSectionId(section.id); setEditValue(section.name || ''); }}
                  style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: '12px', padding: '0' }}>✏️</button>
              )}
            </div>
            {isStandard && <p style={{ margin: 0, fontSize: '12px', color: '#6b7280', lineHeight: '1.5' }}>{(section.data?.content || '').substring(0, 120)}{(section.data?.content || '').length > 120 ? '...' : ''}</p>}
            {isOptional && <p style={{ margin: 0, fontSize: '12px', color: '#6b7280' }}>Free text box for teacher</p>}
            {section.type === 'personalised-comment' && <p style={{ margin: 0, fontSize: '12px', color: '#6b7280' }}>📝 Teacher types: {section.data?.instruction || 'score or information'} — shown as [personalised information] when writing</p>}
            {!isStandard && !isOptional && headings.length > 0 && (
              <p style={{ margin: 0, fontSize: '12px', color: '#6b7280' }}>{headings.length} heading{headings.length !== 1 ? 's' : ''}: {headings.slice(0, 3).join(', ')}{headings.length > 3 ? '...' : ''}</p>
            )}
          </div>
          <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
            {!isStandard && !isOptional && headings.length > 0 && (
              <button onClick={() => toggleExpand(section.id)} style={{ ...btn('#374151', '#f3f4f6', '1px solid #d1d5db'), padding: '4px 8px', fontSize: '12px' }}>
                {isExpanded ? '▲ Less' : '▼ More'}
              </button>
            )}
            <button onClick={() => moveSection(index, 'up')} disabled={index === 0} style={{ background: 'none', border: 'none', color: index === 0 ? '#d1d5db' : '#6b7280', cursor: index === 0 ? 'not-allowed' : 'pointer', fontSize: '16px' }}>↑</button>
            <button onClick={() => moveSection(index, 'down')} disabled={index === template.sections.length - 1} style={{ background: 'none', border: 'none', color: index === template.sections.length - 1 ? '#d1d5db' : '#6b7280', cursor: index === template.sections.length - 1 ? 'not-allowed' : 'pointer', fontSize: '16px' }}>↓</button>
            <button onClick={() => { if (window.confirm('Delete this section?')) deleteSection(section.id); }} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '18px' }}>×</button>
          </div>
        </div>

        {/* Expanded content */}
        {isExpanded && headings.length > 0 && (
          <div style={{ marginTop: '12px', borderTop: '1px solid #f3f4f6', paddingTop: '12px' }}>
            {headings.map(heading => (
              <div key={heading} style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: '#374151', backgroundColor: '#f9fafb', padding: '2px 8px', borderRadius: '4px', border: '1px solid #e5e7eb' }}>{heading}</span>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button onClick={() => { setEditMode('add-option'); setEditingSectionId(section.id); setEditingHeading(heading); setEditValue(''); }}
                      style={{ ...btn('white', '#3b82f6'), padding: '3px 8px', fontSize: '12px' }}>+ Option</button>
                    {section.type !== 'rated-comment' && section.type !== 'assessment-comment' && (
                      <button onClick={() => { if (window.confirm(`Delete heading "${heading}" and all its options?`)) deleteHeading(section.id, heading); }}
                        style={{ ...btn('#ef4444', 'white', '1px solid #fecaca'), padding: '3px 8px', fontSize: '12px' }}>Delete</button>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {getOptions(section, heading).map((opt, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', backgroundColor: previewSelections[section.id] === opt ? '#eff6ff' : '#f9fafb', border: previewSelections[section.id] === opt ? '1px solid #bfdbfe' : '1px solid #f3f4f6', borderRadius: '6px', padding: '6px 8px' }}>
                      <button onClick={() => setPreviewSelections(prev => ({ ...prev, [section.id]: opt }))}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: previewSelections[section.id] === opt ? '#1d4ed8' : '#9ca3af', fontSize: '14px', flexShrink: 0, padding: '0' }}>
                        {previewSelections[section.id] === opt ? '●' : '○'}
                      </button>
                      <span style={{ flex: 1, fontSize: '12px', color: '#374151', lineHeight: '1.5' }}>{opt}</span>
                      <button onClick={() => { if (window.confirm('Delete this option?')) deleteOption(section.id, heading, i); }}
                        style={{ background: 'none', border: 'none', color: '#d1d5db', cursor: 'pointer', fontSize: '14px', flexShrink: 0, padding: '0' }}>×</button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {/* Add heading button for editable section types */}
            {(section.type === 'qualities' || section.type === 'next-steps' || section.type === 'personalised-comment') && (
              <button onClick={() => { setEditMode('add-heading'); setEditingSectionId(section.id); setEditValue(''); setEditValue2(''); }}
                style={{ ...btn('#374151', '#f3f4f6', '1px solid #d1d5db'), width: '100%', marginTop: '4px', textAlign: 'center' }}>+ Add Heading</button>
            )}
          </div>
        )}

        {/* Insert between buttons */}
        <div style={{ display: 'flex', gap: '6px', marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #f9fafb' }}>
          <span style={{ fontSize: '11px', color: '#9ca3af', alignSelf: 'center' }}>Insert after:</span>
          <button onClick={() => insertNewLine(index)} style={{ ...btn('#374151', '#f9fafb', '1px solid #e5e7eb'), padding: '3px 8px', fontSize: '11px' }}>↵ Line Break</button>
          <button onClick={() => insertOptional(index)} style={{ ...btn('#ef4444', '#fff5f5', '1px solid #fecaca'), padding: '3px 8px', fontSize: '11px' }}>✏️ Optional Box</button>
          <button onClick={() => { setEditMode('add-standard'); setEditingSectionId(`after:${index}`); setEditValue(''); setEditValue2(''); }}
            style={{ ...btn('#10b981', '#f0fdf4', '1px solid #bbf7d0'), padding: '3px 8px', fontSize: '11px' }}>📌 Standard</button>
          <button onClick={() => { setEditMode('add-qualities'); setEditingSectionId(`after:${index}`); setEditValue(''); setEditValue2(''); }}
            style={{ ...btn('#f59e0b', '#fffbeb', '1px solid #fde68a'), padding: '3px 8px', fontSize: '11px' }}>🎯 Choice</button>
          <button onClick={() => { setEditMode('add-nextsteps'); setEditingSectionId(`after:${index}`); setEditValue(''); setEditValue2(''); }}
            style={{ ...btn('#06b6d4', '#f0fdfa', '1px solid #a7f3d0'), padding: '3px 8px', fontSize: '11px' }}>🚀 Next Steps</button>
        </div>
      </div>
    );
  };

  // ─── EDIT MODAL ─────────────────────────────────────────────────────────────

  const EditModal = () => {
    if (!editMode) return null;

    const titles: Record<string, string> = {
      'rename-template': 'Rename Template',
      'rename-section': 'Rename Section',
      'add-option': `Add Option to "${editingHeading}"`,
      'add-heading': 'Add New Heading',
      'add-newline': 'Add Line Break',
      'add-optional': 'Add Optional Comment Box',
      'add-standard': 'Add Standard Comment',
      'add-qualities': 'Add Choice Comment Section',
      'add-nextsteps': 'Add Next Steps Section',
    };
    const getTitle = () => (editMode ? titles[editMode] || '' : '');

    const handleConfirm = () => {
      if (!editValue.trim()) { setError('Please enter some text.'); return; }
      setError(null);

      if (editMode === 'rename-template') {
        setTemplate(t => ({ ...t, name: editValue.trim() }));
        setSaved(false);
      } else if (editMode === 'rename-section' && editingSectionId) {
        renameSectionInTemplate(editingSectionId, editValue.trim());
      } else if (editMode === 'add-option' && editingSectionId && editingHeading) {
        addOptionToHeading(editingSectionId, editingHeading, editValue.trim());
      } else if (editMode === 'add-heading' && editingSectionId) {
        if (!editValue2.trim()) { setError('Please enter the first option text.'); return; }
        addHeadingToSection(editingSectionId, editValue.trim(), editValue2.trim());
      } else if (editMode === 'add-standard' && editingSectionId) {
        if (!editValue2.trim()) { setError('Please enter the text content.'); return; }
        const afterIndex = parseInt(editingSectionId.split(':')[1]);
        addNewStandardSection(afterIndex, editValue.trim(), editValue2.trim());
      } else if (editMode === 'add-qualities' && editingSectionId) {
        if (!editValue2.trim()) { setError('Please enter a heading name and first option.'); return; }
        const parts = editValue2.split('\n');
        const heading = parts[0]?.trim() || 'Option';
        const firstOpt = parts[1]?.trim() || editValue2.trim();
        const afterIndex = parseInt(editingSectionId.split(':')[1]);
        addNewQualitiesSection(afterIndex, editValue.trim(), heading, firstOpt);
      } else if (editMode === 'add-nextsteps' && editingSectionId) {
        if (!editValue2.trim()) { setError('Please enter a focus area name and first option.'); return; }
        const parts = editValue2.split('\n');
        const heading = parts[0]?.trim() || 'Focus Area';
        const firstOpt = parts[1]?.trim() || editValue2.trim();
        const afterIndex = parseInt(editingSectionId.split(':')[1]);
        addNewNextStepsSection(afterIndex, editValue.trim(), heading, firstOpt);
      }
      closeEdit();
    };

    const needsSecondField = ['add-heading', 'add-standard', 'add-qualities', 'add-nextsteps'].includes(editMode);

    return (
      <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', maxWidth: '500px', width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '700', color: '#111827' }}>{getTitle()}</h3>
          {error && <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', padding: '8px 12px', marginBottom: '12px', color: '#b91c1c', fontSize: '13px' }}>⚠️ {error}</div>}

          <div style={{ marginBottom: needsSecondField ? '12px' : '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
              {editMode === 'rename-template' ? 'Template name' :
               editMode === 'rename-section' ? 'Section name' :
               editMode === 'add-option' ? 'Option text' :
               editMode === 'add-heading' ? 'Heading name' :
               editMode === 'add-standard' ? 'Section name' :
               editMode === 'add-qualities' ? 'Section name' :
               editMode === 'add-nextsteps' ? 'Section name' : 'Text'}
            </label>
            {editMode === 'add-option' || editMode === 'rename-section' || editMode === 'rename-template' ? (
              <textarea value={editValue} onChange={e => setEditValue(e.target.value)} style={{ ...txa, minHeight: editMode === 'add-option' ? '80px' : '40px' }} autoFocus />
            ) : (
              <input type="text" value={editValue} onChange={e => setEditValue(e.target.value)} style={inp} autoFocus />
            )}
          </div>

          {needsSecondField && (
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                {editMode === 'add-heading' ? 'First option text' :
                 editMode === 'add-standard' ? 'Text content (use [Name] for pupil name)' :
                 editMode === 'add-qualities' ? 'First heading name (line 1) then first option (line 2)' :
                 editMode === 'add-nextsteps' ? 'First focus area name (line 1) then first option (line 2)' : 'Content'}
              </label>
              <textarea value={editValue2} onChange={e => setEditValue2(e.target.value)} style={{ ...txa, minHeight: '80px' }} />
            </div>
          )}

          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button onClick={closeEdit} style={{ ...btn('#374151', '#f3f4f6', '1px solid #d1d5db') }}>Cancel</button>
            <button onClick={handleConfirm} style={{ ...btn('white', '#3b82f6') }}>Save</button>
          </div>
        </div>
      </div>
    );
  };

  // ─── RENDER ─────────────────────────────────────────────────────────────────

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      {/* Header */}
      <header style={{ backgroundColor: 'white', borderBottom: '1px solid #e5e7eb', padding: isMobile ? '16px' : '16px 24px', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <Link to="/manage-templates" style={{ textDecoration: 'none' }}>
            <button style={{ ...btn('#374151', '#f3f4f6', '1px solid #d1d5db') }}>← Back</button>
          </Link>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ margin: 0, fontSize: isMobile ? '16px' : '20px', fontWeight: '700', color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{template.name}</h1>
              <button onClick={() => { setEditMode('rename-template'); setEditValue(template.name); }} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: '14px', flexShrink: 0 }}>✏️</button>
            </div>
            <p style={{ margin: 0, fontSize: '12px', color: '#6b7280' }}>{template.sections.filter(s => s.type !== 'new-line').length} sections</p>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
            <button onClick={() => setShowPreview(p => !p)} style={{ ...btn('#374151', showPreview ? '#f3f4f6' : 'white', '1px solid #d1d5db') }}>
              {showPreview ? '📝 Edit' : '👁 Preview'}
            </button>
            {saved ? (
              <button style={{ ...btn('white', '#10b981') }}>✅ Saved</button>
            ) : (
              <button onClick={handleSave} style={{ ...btn('white', '#3b82f6') }}>💾 Save</button>
            )}
            <button onClick={handleSaveAndGo} style={{ ...btn('white', '#10b981') }}>Save & Close</button>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: '900px', margin: '0 auto', padding: isMobile ? '16px' : '24px', display: showPreview ? 'grid' : 'block', gridTemplateColumns: showPreview ? '1fr 1fr' : undefined, gap: '24px' }}>

        {/* Edit panel */}
        <div>
          {!showPreview && (
            <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '10px', padding: '14px', marginBottom: '20px' }}>
              <p style={{ margin: 0, fontSize: '13px', color: '#78350f', lineHeight: '1.6' }}>
                <strong>💡 How to use this page:</strong> Expand any section to see its options. Click ○ next to any option to select it for the preview. Use ↑↓ to reorder sections. Use the insert buttons to add new sections. Click 👁 Preview to see what a report will look like.
              </p>
            </div>
          )}

          <div>
            {template.sections.map((section, index) => (
              <SectionCard key={section.id} section={section} index={index} />
            ))}
          </div>

          {template.sections.length === 0 && (
            <div style={{ textAlign: 'center', padding: '48px', color: '#9ca3af' }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>📝</div>
              <p>No sections yet. Use the Import wizard to build your template.</p>
            </div>
          )}
        </div>

        {/* Preview panel */}
        {showPreview && (
          <div style={{ position: isMobile ? 'static' : 'sticky', top: '80px', alignSelf: 'start' }}>
            <div style={{ backgroundColor: 'white', border: '2px solid #3b82f6', borderRadius: '10px', padding: '20px' }}>
              <h3 style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: '700', color: '#111827' }}>👁 Report Preview</h3>
              <p style={{ margin: '0 0 16px 0', fontSize: '12px', color: '#6b7280' }}>Select options on the left to see how the report reads. Unselected sections show their first option.</p>
              <div style={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '16px', fontSize: '13px', color: '#374151', lineHeight: '1.8', whiteSpace: 'pre-wrap', minHeight: '200px', textAlign: 'left' }}>
                {buildPreviewText() || 'Select options from the sections on the left to build a preview report.'}
              </div>
              <button onClick={() => setPreviewSelections({})} style={{ ...btn('#374151', '#f3f4f6', '1px solid #d1d5db'), marginTop: '12px', width: '100%' }}>
                Clear Selections
              </button>
            </div>
          </div>
        )}
      </main>

      <EditModal />
    </div>
  );
}