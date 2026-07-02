import React, { useState } from 'react';
import { RatedComment } from '../types';

interface RatedCommentBuilderProps {
  onSave: (comment: RatedComment) => void;
  onCancel: () => void;
  existingComment?: RatedComment;
}

const smallBtn = (c: string): React.CSSProperties => ({ backgroundColor: c, color: 'white', border: 'none', borderRadius: '6px', padding: '5px 12px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' });
const cancelBtn: React.CSSProperties = { backgroundColor: '#f3f4f6', color: '#374151', border: 'none', borderRadius: '6px', padding: '5px 12px', fontSize: '12px', fontWeight: '500', cursor: 'pointer' };

const ratingConfig = [
  { key: 'excellent' as const, label: 'Excellent', color: '#10b981' },
  { key: 'good' as const, label: 'Good', color: '#3b82f6' },
  { key: 'satisfactory' as const, label: 'Satisfactory', color: '#f59e0b' },
  { key: 'needsImprovement' as const, label: 'Needs Improvement', color: '#ef4444' },
];

type RatingKey = 'excellent' | 'good' | 'satisfactory' | 'needsImprovement';

function RatedCommentBuilder({ onSave, onCancel, existingComment }: RatedCommentBuilderProps) {
  const [commentName, setCommentName] = useState(existingComment?.name || '');
  const [comments, setComments] = useState<{ [key in RatingKey]: string[] }>({
    excellent: existingComment?.comments.excellent || [],
    good: existingComment?.comments.good || [],
    satisfactory: existingComment?.comments.satisfactory || [],
    needsImprovement: existingComment?.comments.needsImprovement || [],
  });
  const [showBatchInput, setShowBatchInput] = useState<string | null>(null);
  const [batchText, setBatchText] = useState('');
  const [separator, setSeparator] = useState('double-line');

  const [editingKey, setEditingKey] = useState<{ group: string; idx: number } | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const [movingKey, setMovingKey] = useState<{ group: string; idx: number } | null>(null);
  const [splittingKey, setSplittingKey] = useState<{ group: string; idx: number } | null>(null);
  const [splitSelectedText, setSplitSelectedText] = useState('');

  const handleBatchPaste = (rating: RatingKey) => {
    if (batchText.trim()) {
      let newComments: string[] = [];
      switch (separator) {
        case 'double-line': newComments = batchText.split('\n\n'); break;
        case 'single-line': newComments = batchText.split('\n'); break;
        case 'semicolon': newComments = batchText.split(';'); break;
        case 'pipe': newComments = batchText.split('|'); break;
        case 'triple-dash': newComments = batchText.split('---'); break;
      }
      newComments = newComments.map(c => c.trim()).filter(c => c.length > 0);
      if (newComments.length > 0) {
        const shouldReplace = window.confirm(`This will add ${newComments.length} new comments. Do you want to replace existing comments (OK) or add to them (Cancel)?`);
        setComments(prev => ({ ...prev, [rating]: shouldReplace ? newComments : [...prev[rating].filter(c => c.trim()), ...newComments] }));
      }
    }
    setShowBatchInput(null); setBatchText('');
  };

  const addCommentOption = (group: string) => {
    const idx = (comments[group as RatingKey] || []).length;
    setComments(prev => ({ ...prev, [group]: [...(prev[group as RatingKey] || []), ''] }));
    setEditingKey({ group, idx }); setEditingValue('');
  };

  const removeCommentOption = (group: string, idx: number) => {
    setComments(prev => ({ ...prev, [group]: (prev[group as RatingKey] || []).filter((_, i) => i !== idx) }));
  };

  const handleSaveEdit = () => {
    if (!editingKey) return;
    const { group, idx } = editingKey;
    if (!editingValue.trim()) {
      setComments(prev => ({ ...prev, [group]: (prev[group as RatingKey] || []).filter((_, i) => i !== idx) }));
    } else {
      setComments(prev => { const s = [...(prev[group as RatingKey] || [])]; s[idx] = editingValue.trim(); return { ...prev, [group]: s }; });
    }
    setEditingKey(null); setEditingValue('');
  };

  const handleMoveComment = (fromGroup: string, fromIdx: number, toGroup: string) => {
    const stmt = (comments[fromGroup as RatingKey] || [])[fromIdx];
    if (!stmt) return;
    setComments(prev => ({ ...prev, [fromGroup]: (prev[fromGroup as RatingKey] || []).filter((_, i) => i !== fromIdx), [toGroup]: [...(prev[toGroup as RatingKey] || []), stmt] }));
    setMovingKey(null);
  };

  const handleSplitComment = () => {
    if (!splittingKey || !splitSelectedText) return;
    const { group, idx } = splittingKey;
    const original = (comments[group as RatingKey] || [])[idx];
    if (!original) return;
    const charIdx = original.indexOf(splitSelectedText);
    if (charIdx === -1) return;
    const before = original.slice(0, charIdx).trim();
    const after = original.slice(charIdx + splitSelectedText.length).trim();
    const remaining = [before, after].filter(Boolean).join(' ');
    setComments(prev => {
      const s = [...(prev[group as RatingKey] || [])];
      if (remaining) { s[idx] = remaining; s.splice(idx + 1, 0, splitSelectedText); }
      else { s[idx] = splitSelectedText; }
      return { ...prev, [group]: s };
    });
    setSplittingKey(null); setSplitSelectedText('');
  };

  const handleSave = () => {
    if (!commentName.trim()) { alert('Please enter a name for this rated comment'); return; }
    const hasEmptyRatings = Object.entries(comments).some(([_, list]) => list.every(c => !c.trim()));
    if (hasEmptyRatings) { alert('Please add at least one comment for each rating level'); return; }
    const ratedComment: RatedComment = {
      name: commentName.trim(),
      comments: {
        excellent: comments.excellent.filter(c => c.trim()),
        good: comments.good.filter(c => c.trim()),
        satisfactory: comments.satisfactory.filter(c => c.trim()),
        needsImprovement: comments.needsImprovement.filter(c => c.trim()),
      }
    };
    onSave(ratedComment);
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      <header style={{ backgroundColor: 'white', boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)', padding: '32px 24px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '600', color: '#111827', margin: 0 }}>{existingComment ? 'Edit' : 'Create'} Rated Comment</h1>
      </header>
      <main style={{ maxWidth: '900px', margin: '0 auto', padding: '32px 24px' }}>
        <button onClick={onCancel} style={{ backgroundColor: '#6b7280', color: 'white', padding: '12px 24px', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: '500', cursor: 'pointer', marginBottom: '24px' }}>← Back</button>
        <div style={{ backgroundColor: 'white', padding: '32px', borderRadius: '12px', boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)', marginBottom: '24px' }}>
          <div style={{ marginBottom: '32px' }}>
            <label style={{ display: 'block', fontSize: '18px', fontWeight: '600', color: '#111827', marginBottom: '8px' }}>Comment Name</label>
            <input type="text" placeholder="e.g. Effort, Behavior, Participation..." value={commentName} onChange={e => setCommentName(e.target.value)} style={{ width: '100%', padding: '12px 16px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '16px', boxSizing: 'border-box' }} />
          </div>

          <div style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '16px', marginBottom: '32px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1e40af', margin: '0 0 8px 0' }}>How to use placeholders:</h3>
            <p style={{ color: '#1e40af', fontSize: '14px', margin: '0 0 8px 0' }}>• Use [Name] to insert the student's name</p>
            <p style={{ color: '#1e40af', fontSize: '14px', margin: 0 }}>• Example: "[Name] shows excellent effort in all activities"</p>
          </div>

          {ratingConfig.map(rating => {
            const ratingComments = comments[rating.key] || [];
            const otherRatings = ratingConfig.filter(r => r.key !== rating.key);
            return (
              <div key={rating.key} style={{ border: `2px solid ${rating.color}`, borderRadius: '12px', padding: '24px', marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: '600', color: rating.color, margin: 0 }}>{rating.label}</h3>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => setShowBatchInput(rating.key)} style={{ backgroundColor: 'white', color: rating.color, border: `2px solid ${rating.color}`, borderRadius: '6px', padding: '8px 16px', fontSize: '14px', fontWeight: '500', cursor: 'pointer' }}>📋 Paste Multiple</button>
                    <button onClick={() => addCommentOption(rating.key)} style={{ backgroundColor: rating.color, color: 'white', border: 'none', borderRadius: '6px', padding: '8px 16px', fontSize: '14px', fontWeight: '500', cursor: 'pointer' }}>+ Add Option</button>
                  </div>
                </div>

                {showBatchInput === rating.key && (
                  <div style={{ backgroundColor: '#f0f9ff', border: '2px solid #3b82f6', borderRadius: '8px', padding: '16px', marginBottom: '16px' }}>
                    <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#1e40af', margin: '0 0 8px 0' }}>Paste Multiple Comments for {rating.label}</h4>
                    <div style={{ marginBottom: '16px' }}>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#1e40af', marginBottom: '8px' }}>How are your comments separated?</label>
                      <select value={separator} onChange={e => setSeparator(e.target.value)} style={{ padding: '8px 12px', border: '2px solid #bfdbfe', borderRadius: '6px', fontSize: '14px', backgroundColor: 'white', color: '#1e40af', fontWeight: '500' }}>
                        <option value="double-line">Double line break (press Enter twice)</option>
                        <option value="single-line">Single line break (one per line)</option>
                        <option value="semicolon">Semicolon (;)</option>
                        <option value="pipe">Pipe symbol (|)</option>
                        <option value="triple-dash">Triple dash (---)</option>
                      </select>
                    </div>
                    <p style={{ fontSize: '14px', color: '#1e40af', margin: '0 0 12px 0' }}>
                      {separator === 'double-line' && 'Paste your comments with double line breaks between them. This allows multi-line comments.'}
                      {separator === 'single-line' && 'Paste your comments with one comment per line.'}
                      {separator === 'semicolon' && 'Paste your comments separated by semicolons (;).'}
                      {separator === 'pipe' && 'Paste your comments separated by pipe symbols (|).'}
                      {separator === 'triple-dash' && 'Paste your comments separated by triple dashes (---).'}
                    </p>
                    <textarea value={batchText} onChange={e => setBatchText(e.target.value)} style={{ width: '100%', height: '200px', padding: '12px', border: '2px solid #bfdbfe', borderRadius: '6px', fontSize: '14px', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box', marginBottom: '12px' }} />
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button onClick={() => { setShowBatchInput(null); setBatchText(''); }} style={{ backgroundColor: '#6b7280', color: 'white', border: 'none', borderRadius: '6px', padding: '8px 16px', fontSize: '14px', cursor: 'pointer' }}>Cancel</button>
                      <button onClick={() => handleBatchPaste(rating.key)} disabled={!batchText.trim()} style={{ backgroundColor: batchText.trim() ? '#3b82f6' : '#d1d5db', color: 'white', border: 'none', borderRadius: '6px', padding: '8px 16px', fontSize: '14px', cursor: batchText.trim() ? 'pointer' : 'not-allowed' }}>Add Comments</button>
                    </div>
                  </div>
                )}

                <div>
                  {ratingComments.map((comment, idx) => {
                    const isEd = editingKey?.group === rating.key && editingKey?.idx === idx;
                    const isMv = movingKey?.group === rating.key && movingKey?.idx === idx;
                    const isSp = splittingKey?.group === rating.key && splittingKey?.idx === idx;
                    return (
                      <div key={idx} style={{ backgroundColor: 'white', border: `1px solid ${isEd || isSp ? rating.color : '#e5e7eb'}`, borderRadius: '6px', marginBottom: '6px', overflow: 'hidden' }}>
                        {isEd ? (
                          <div style={{ padding: '8px' }}>
                            <textarea value={editingValue} onChange={e => setEditingValue(e.target.value)} autoFocus style={{ width: '100%', padding: '8px 10px', border: `1px solid ${rating.color}`, borderRadius: '4px', fontSize: '13px', minHeight: '60px', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' as const, marginBottom: '6px' }} />
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button onClick={() => { setEditingKey(null); setEditingValue(''); if (!comment.trim()) removeCommentOption(rating.key, idx); }} style={cancelBtn}>Cancel</button>
                              <button onClick={handleSaveEdit} style={smallBtn(rating.color)}>Save</button>
                            </div>
                          </div>
                        ) : isMv ? (
                          <div style={{ padding: '8px' }}>
                            <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '6px' }}>Move to:</div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '6px' }}>
                              {otherRatings.map(r => <button key={r.key} onClick={() => handleMoveComment(rating.key, idx, r.key)} style={smallBtn(r.color)}>{r.label}</button>)}
                            </div>
                            <button onClick={() => setMovingKey(null)} style={cancelBtn}>Cancel</button>
                          </div>
                        ) : isSp ? (
                          <div style={{ padding: '8px' }}>
                            <div style={{ fontSize: '12px', color: '#92400e', fontWeight: '600', marginBottom: '6px' }}>Select the part to split into a new statement</div>
                            <div style={{ fontSize: '13px', color: '#374151', lineHeight: '1.5', backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '4px', padding: '8px', cursor: 'text', userSelect: 'text' as const, marginBottom: '8px' }} onMouseUp={() => { const s = window.getSelection(); const t = s?.toString().trim() || ''; if (t.length > 0) setSplitSelectedText(t); }}>{comment}</div>
                            {splitSelectedText && <div style={{ fontSize: '12px', color: '#374151', backgroundColor: '#fef9c3', border: '1px solid #fde68a', borderRadius: '4px', padding: '6px 8px', marginBottom: '8px' }}>Split out: "<em>{splitSelectedText}</em>"</div>}
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button onClick={() => { setSplittingKey(null); setSplitSelectedText(''); }} style={cancelBtn}>Cancel</button>
                              {splitSelectedText && <button onClick={handleSplitComment} style={smallBtn(rating.color)}>Split</button>}
                            </div>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '8px 10px' }}>
                            <span style={{ flex: 1, fontSize: '13px', color: comment.trim() ? '#374151' : '#9ca3af', lineHeight: '1.5', textAlign: 'left' as const, fontStyle: comment.trim() ? 'normal' : 'italic' }}>{comment.trim() || 'Empty — click ✏️ to edit'}</span>
                            <div style={{ display: 'flex', gap: '2px', flexShrink: 0 }}>
                              <button onClick={() => { setEditingKey({ group: rating.key, idx }); setEditingValue(comment); }} title="Edit" style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: '13px', padding: '2px 4px' }}>✏️</button>
                              <button onClick={() => setMovingKey({ group: rating.key, idx })} title="Move" style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: '13px', padding: '2px 4px' }}>↔</button>
                              <button onClick={() => { setSplittingKey({ group: rating.key, idx }); setSplitSelectedText(''); }} title="Split" style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: '13px', padding: '2px 4px' }}>✂</button>
                              <button onClick={() => removeCommentOption(rating.key, idx)} title="Delete" style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '14px', padding: '2px 4px' }}>✕</button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          <div style={{ display: 'flex', gap: '16px', justifyContent: 'flex-end' }}>
            <button onClick={onCancel} style={{ backgroundColor: '#6b7280', color: 'white', padding: '16px 32px', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: '500', cursor: 'pointer' }}>Cancel</button>
            <button onClick={handleSave} style={{ backgroundColor: '#10b981', color: 'white', padding: '16px 32px', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: '500', cursor: 'pointer' }}>Save Rated Comment</button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default RatedCommentBuilder;
