import React, { useState, useEffect } from 'react';
import InlineEditableTitle from './InlineEditableTitle';
import HeaderStylePicker from './HeaderStylePicker';

interface RatedCommentSectionProps {
  section: any;
  data: any;
  updateSectionData: (sectionId: string, data: any) => void;
  onTemplateAction?: (action: any) => void;
  onAddButton?: (sectionId: string, buttonName: string, firstOption: string) => void;
  onRenameSection?: (sectionId: string, newName: string) => void;
  globalPronoun?: string;
}

const DEFAULT_RATED_LABELS: Record<string, string> = {
  excellent: 'Excellent',
  good: 'Good',
  satisfactory: 'Satisfactory',
  needsImprovement: 'Needs Improvement',
};
const KNOWN_RATED_COLORS: Record<string, string> = {
  Excellent: '#10b981',
  Good: '#3b82f6',
  Satisfactory: '#f59e0b',
  'Needs Improvement': '#ef4444',
};
const EXTRA_RATED_COLORS = ['#8b5cf6', '#6366f1', '#ec4899', '#14b8a6', '#f97316'];

const RatedCommentSection: React.FC<RatedCommentSectionProps> = ({
  section,
  data,
  updateSectionData,
  onTemplateAction,
  onAddButton,
  onRenameSection,
  globalPronoun,
}) => {
  const [showEditComment, setShowEditComment] = useState(false);
  const [editableComment, setEditableComment] = useState('');
  const [showAddToNewModal, setShowAddToNewModal] = useState(false);
  const [addToNewButtonName, setAddToNewButtonName] = useState('');
  const [showNewButtonModal, setShowNewButtonModal] = useState(false);
  const [newButtonName, setNewButtonName] = useState('');
  const [newButtonFirstOption, setNewButtonFirstOption] = useState('');
  const [renamingButton, setRenamingButton] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [moveToArea, setMoveToArea] = useState('');
  const [editingButtons, setEditingButtons] = useState(false);
  const [moveAllTarget, setMoveAllTarget] = useState('');
  const [draggedKey, setDraggedKey] = useState<string | null>(null);
  const [dragOverKey, setDragOverKey] = useState<string | null>(null);

  useEffect(() => {
    if (data.selectedComment) {
      setEditableComment(data.customEditedComment || data.selectedComment);
    }
  }, [data.selectedComment, data.customEditedComment]);

  const ratingKeys: string[] = section.data?.headings || Object.keys(section.data?.comments || {});
  const getColor = (label: string, idx: number) => KNOWN_RATED_COLORS[label] || EXTRA_RATED_COLORS[idx % EXTRA_RATED_COLORS.length];
  const getLabel = (key: string) => (data.labels || section.data?.labels)?.[key] || DEFAULT_RATED_LABELS[key] || key;
  const ratings = ratingKeys.map((key, idx) => { const label = getLabel(key); return { value: key, label, color: getColor(label, idx) }; });

  const handleRatingChange = (rating: string) => {
    if (editingButtons) return;
    if (rating !== data.rating && data.customEditedComment) {
      const shouldContinue = window.confirm(
        'Changing the rating will replace your custom edits with a new generated comment. Continue?'
      );
      if (!shouldContinue) return;
    }
    updateSectionData(section.id, { rating, customEditedComment: undefined });
    setShowEditComment(false);
  };

  const handleSaveEditedComment = () => {
    updateSectionData(section.id, { customEditedComment: editableComment });
    setShowEditComment(false);
  };

  const handleCancelEditComment = () => {
    setEditableComment(data.selectedComment || '');
    setShowEditComment(false);
  };

  // ─── TEMPLATE ACTIONS ─────────────────────────────────────────────────────

  const handleReplaceInTemplate = () => {
    if (!onTemplateAction || !data.rating) return;
    onTemplateAction({ type: 'replace', sectionId: section.id, commentText: editableComment, buttonName: data.rating });
    updateSectionData(section.id, { customEditedComment: editableComment });
    setShowEditComment(false);
  };

  const handleAddToButton = () => {
    if (!onTemplateAction || !data.rating) return;
    onTemplateAction({ type: 'add-to-button', sectionId: section.id, commentText: editableComment, buttonName: data.rating });
    updateSectionData(section.id, { customEditedComment: editableComment });
    setShowEditComment(false);
  };

  const handleConfirmAddToNewButton = () => {
    if (!onTemplateAction || !addToNewButtonName.trim()) return;
    onTemplateAction({ type: 'add-to-new-button', sectionId: section.id, commentText: editableComment, newButtonName: addToNewButtonName.trim() });
    updateSectionData(section.id, { customEditedComment: editableComment });
    setShowAddToNewModal(false);
    setAddToNewButtonName('');
    setShowEditComment(false);
  };

  const handleConfirmNewButton = () => {
    if (!onAddButton || !newButtonName.trim() || !newButtonFirstOption.trim()) return;
    onAddButton(section.id, newButtonName.trim(), newButtonFirstOption.trim());
    setNewButtonName(''); setNewButtonFirstOption(''); setShowNewButtonModal(false);
  };

  const handleRenameButton = (oldKey: string) => {
    if (!renameValue.trim() || renameValue.trim() === oldKey) { setRenamingButton(null); return; }
    if (!onTemplateAction) return;
    const comments = { ...(section.data?.comments || {}) };
    const options = comments[oldKey] || [];
    delete comments[oldKey];
    comments[renameValue.trim()] = options;
    onTemplateAction({ type: 'rename-button' as any, sectionId: section.id, oldButtonName: oldKey, newButtonName: renameValue.trim(), updatedComments: comments });
    if (data.rating === oldKey) updateSectionData(section.id, { rating: renameValue.trim() });
    setRenamingButton(null);
    setMoveAllTarget('');
  };

  const handleDeleteButton = (key: string) => {
    if (!window.confirm(`Delete the "${getLabel(key)}" button and all its statements?`)) return;
    const comments = { ...(section.data?.comments || {}) };
    delete comments[key];
    onTemplateAction?.({ type: 'delete-button' as any, sectionId: section.id, buttonName: key, oldButtonName: key, updatedComments: comments });
    if (data.rating === key) updateSectionData(section.id, { rating: undefined, selectedComment: undefined });
  };

  const handleMoveStatement = () => {
    if (!moveToArea || !data.rating || !editableComment || !onTemplateAction) return;
    onTemplateAction({ type: 'move-statement' as any, sectionId: section.id, fromButton: data.rating, toButton: moveToArea, statement: editableComment });
    updateSectionData(section.id, { rating: moveToArea, selectedComment: editableComment, customEditedComment: editableComment });
    setMoveToArea('');
    setShowEditComment(false);
  };

  const handleMoveAllStatements = (fromButton: string) => {
    if (!moveAllTarget || !onTemplateAction) return;
    if (!window.confirm(`Move all statements from "${getLabel(fromButton)}" to "${getLabel(moveAllTarget)}"? "${getLabel(fromButton)}" will be deleted.`)) return;
    const comments = { ...(section.data?.comments || {}) };
    const fromStatements = comments[fromButton] || [];
    comments[moveAllTarget] = [...(comments[moveAllTarget] || []), ...fromStatements];
    delete comments[fromButton];
    onTemplateAction({ type: 'delete-button' as any, sectionId: section.id, buttonName: fromButton, oldButtonName: fromButton, updatedComments: comments });
    if (data.rating === fromButton) updateSectionData(section.id, { rating: moveAllTarget, selectedComment: undefined, customEditedComment: undefined });
    setRenamingButton(null);
    setMoveAllTarget('');
  };

  const handleDropReorder = (targetKey: string) => {
    if (!onTemplateAction || !draggedKey || draggedKey === targetKey) { setDraggedKey(null); setDragOverKey(null); return; }
    const reordered = [...ratingKeys];
    const fromIndex = reordered.indexOf(draggedKey);
    const toIndex = reordered.indexOf(targetKey);
    if (fromIndex === -1 || toIndex === -1) { setDraggedKey(null); setDragOverKey(null); return; }
    reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, draggedKey);
    onTemplateAction({ type: 'reorder-button' as any, sectionId: section.id, orderedButtons: reordered });
    setDraggedKey(null);
    setDragOverKey(null);
  };

  const hasSelectedComment = data.selectedComment && data.rating && data.rating !== 'no-comment';

  const actionBtnStyle = (color: string): React.CSSProperties => ({
    backgroundColor: color, color: 'white', border: 'none', borderRadius: '4px',
    padding: '4px 8px', fontSize: '11px', cursor: 'pointer', fontWeight: '500', whiteSpace: 'nowrap',
  });

  return (
    <div style={{
      border: '2px solid #3b82f6',
      borderRadius: '8px',
      padding: '16px',
      marginBottom: '16px',
      backgroundColor: '#eff6ff'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <InlineEditableTitle name={section.name} defaultName="Rated Comment" color="#1e40af" onRename={onRenameSection ? (n) => onRenameSection(section.id, n) : undefined} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {onAddButton && (
            <button onClick={() => setEditingButtons(b => !b)}
              style={{ backgroundColor: editingButtons ? '#3b82f6' : '#e5e7eb', color: editingButtons ? 'white' : '#374151', border: 'none', borderRadius: '4px', padding: '3px 8px', fontSize: '11px', cursor: 'pointer', fontWeight: '500' }}>
              {editingButtons ? '✓ Done' : '✏ Edit Buttons'}
            </button>
          )}
          <HeaderStylePicker showHeader={data.showHeader !== false} headerStyle={data.headerStyle || section.data?.headerStyle || 'inline'} onChange={(show, style) => updateSectionData(section.id, { showHeader: show, headerStyle: style })} />
          <div data-tour="exclude" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <input type="checkbox" checked={data.exclude || false}
              onChange={(e) => updateSectionData(section.id, { exclude: e.target.checked })}
              style={{ width: '14px', height: '14px', cursor: 'pointer' }} />
            <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>Exclude</span>
          </div>
        </div>
      </div>

      {/* Pronoun selector */}
      <div data-tour="name-or-pronoun" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
        <span style={{ fontSize: '11px', color: '#6b7280', fontWeight: '500' }}>Use:</span>
        {[{ value: '', label: 'Name' }, { value: globalPronoun || 'he', label: 'Pronoun' }].map(opt => (
          <button key={opt.value} onClick={() => updateSectionData(section.id, { pronounOverride: opt.value })}
            style={{
              padding: '2px 8px', border: '1px solid #3b82f6', borderRadius: '4px',
              fontSize: '11px', fontWeight: '600', cursor: 'pointer',
              backgroundColor: (data.pronounOverride || '') === opt.value ? '#3b82f6' : 'white',
              color: (data.pronounOverride || '') === opt.value ? 'white' : '#3b82f6',
            }}>
            {opt.label}
          </button>
        ))}
      </div>

      {/* Rating Buttons */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '8px', alignItems: 'center' }}>
        {ratings.map((rating) => (
          renamingButton === rating.value ? (
            <div key={rating.value} style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <input autoFocus value={renameValue} onChange={e => setRenameValue(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleRenameButton(rating.value); if (e.key === 'Escape') { setRenamingButton(null); setMoveAllTarget(''); } }}
                  style={{ padding: '4px 8px', border: `2px solid ${rating.color}`, borderRadius: '4px', fontSize: '12px', width: '140px', outline: 'none' }} />
                <button onClick={() => handleRenameButton(rating.value)} style={{ backgroundColor: rating.color, color: 'white', border: 'none', borderRadius: '4px', padding: '4px 8px', fontSize: '11px', cursor: 'pointer' }}>✓ Rename</button>
                <button onClick={() => { setRenamingButton(null); setMoveAllTarget(''); }} style={{ backgroundColor: '#9ca3af', color: 'white', border: 'none', borderRadius: '4px', padding: '4px 8px', fontSize: '11px', cursor: 'pointer' }}>✕</button>
              </div>
              {ratings.filter(r => r.value !== rating.value).length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', paddingLeft: '2px' }}>
                  <span style={{ fontSize: '11px', color: '#6b7280' }}>Move all to:</span>
                  <select value={moveAllTarget} onChange={e => setMoveAllTarget(e.target.value)}
                    style={{ fontSize: '11px', padding: '2px 4px', borderRadius: '4px', border: '1px solid #d1d5db' }}>
                    <option value="">— choose —</option>
                    {ratings.filter(r => r.value !== rating.value).map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                  <button onClick={() => handleMoveAllStatements(rating.value)} disabled={!moveAllTarget}
                    style={{ backgroundColor: '#06b6d4', color: 'white', border: 'none', borderRadius: '4px', padding: '2px 8px', fontSize: '11px', cursor: 'pointer', opacity: !moveAllTarget ? 0.4 : 1 }}>
                    Move
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div key={rating.value}
              draggable={editingButtons}
              onDragStart={() => setDraggedKey(rating.value)}
              onDragOver={e => { if (editingButtons) { e.preventDefault(); setDragOverKey(rating.value); } }}
              onDragLeave={() => setDragOverKey(prev => prev === rating.value ? null : prev)}
              onDrop={e => { e.preventDefault(); handleDropReorder(rating.value); }}
              onDragEnd={() => { setDraggedKey(null); setDragOverKey(null); }}
              style={{
                display: 'flex', alignItems: 'center', gap: '2px', borderRadius: '6px',
                opacity: draggedKey === rating.value ? 0.4 : 1,
                outline: dragOverKey === rating.value && draggedKey && draggedKey !== rating.value ? `2px dashed ${rating.color}` : 'none',
                outlineOffset: '2px',
              }}>
              {editingButtons && <span title="Drag to reorder" style={{ cursor: 'grab', color: rating.color, fontSize: '12px', padding: '0 3px' }}>⠿</span>}
              <button onClick={() => handleRatingChange(rating.value)}
                style={{
                  backgroundColor: data.rating === rating.value ? rating.color : 'white',
                  color: data.rating === rating.value ? 'white' : rating.color,
                  border: `2px solid ${rating.color}`,
                  borderRadius: editingButtons ? '6px 0 0 6px' : '6px', padding: '6px 12px', fontSize: '12px',
                  fontWeight: '600', cursor: editingButtons ? 'grab' : 'pointer', transition: 'all 0.2s ease', whiteSpace: 'nowrap'
                }}>
                {rating.label}
              </button>
              {editingButtons && (
                <>
                  <button onClick={() => { setRenamingButton(rating.value); setRenameValue(rating.label); setMoveAllTarget(''); }} title="Rename button"
                    style={{ backgroundColor: '#eff6ff', color: rating.color, border: `2px solid ${rating.color}`, borderLeft: 'none', padding: '6px 5px', fontSize: '10px', cursor: 'pointer' }}>✏</button>
                  <button onClick={() => handleDeleteButton(rating.value)} title="Delete button"
                    style={{ backgroundColor: '#fee2e2', color: '#dc2626', border: `2px solid ${rating.color}`, borderLeft: 'none', borderRadius: '0 6px 6px 0', padding: '6px 5px', fontSize: '10px', cursor: 'pointer' }}>✕</button>
                </>
              )}
            </div>
          )
        ))}
        {!editingButtons && (
          <button onClick={() => handleRatingChange('no-comment')}
            style={{
              backgroundColor: data.rating === 'no-comment' ? '#6b7280' : 'white',
              color: data.rating === 'no-comment' ? 'white' : '#6b7280',
              border: '2px solid #6b7280', borderRadius: '6px', padding: '6px 12px',
              fontSize: '12px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap'
            }}>
            No Comment
          </button>
        )}
        {onAddButton && (
          <button onClick={() => setShowNewButtonModal(true)} title="Add a new rating level"
            style={{ backgroundColor: 'white', color: '#3b82f6', border: '2px dashed #3b82f6', borderRadius: '6px', padding: '6px 10px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', lineHeight: 1 }}>
            +
          </button>
        )}
      </div>

      {/* New button modal */}
      {showNewButtonModal && (
        <div style={{ backgroundColor: 'white', border: '1px solid #d1d5db', borderRadius: '8px', padding: '12px', marginBottom: '12px' }}>
          <div style={{ fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>Add new rating level</div>
          <input type="text" value={newButtonName} onChange={e => setNewButtonName(e.target.value)}
            placeholder="Level name (e.g. Outstanding)..."
            style={{ width: '100%', padding: '6px 8px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '13px', marginBottom: '8px', boxSizing: 'border-box' }} />
          <textarea value={newButtonFirstOption} onChange={e => setNewButtonFirstOption(e.target.value)}
            placeholder="First comment option... Use [Name] for pupil name."
            style={{ width: '100%', padding: '6px 8px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '13px', minHeight: '60px', resize: 'vertical', boxSizing: 'border-box', marginBottom: '8px' }} />
          <div style={{ display: 'flex', gap: '6px' }}>
            <button onClick={() => setShowNewButtonModal(false)} style={actionBtnStyle('#6b7280')}>Cancel</button>
            <button onClick={handleConfirmNewButton} disabled={!newButtonName.trim() || !newButtonFirstOption.trim()}
              style={{ ...actionBtnStyle('#3b82f6'), opacity: (!newButtonName.trim() || !newButtonFirstOption.trim()) ? 0.4 : 1 }}>
              Add Level
            </button>
          </div>
        </div>
      )}

      {/* Edit toggle */}
      {hasSelectedComment && !editingButtons && (
        <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: showEditComment ? '12px' : '0' }}>
          <button data-tour="edit-comment" onClick={() => setShowEditComment(!showEditComment)}
            style={{
              backgroundColor: showEditComment ? '#10b981' : '#e5e7eb',
              color: showEditComment ? 'white' : '#6b7280',
              border: 'none', borderRadius: '4px', padding: '4px 8px',
              fontSize: '12px', cursor: 'pointer', fontWeight: '500'
            }}>
            {showEditComment ? '- Edit Comment' : '+ Edit Comment'}
          </button>
        </div>
      )}

      {/* Edit panel */}
      {showEditComment && hasSelectedComment && !editingButtons && (
        <div style={{ backgroundColor: 'white', border: '1px solid #d1d5db', borderRadius: '6px', padding: '8px' }}>
          <textarea value={editableComment} onChange={(e) => setEditableComment(e.target.value)}
            placeholder="Edit the comment to better suit this student..."
            style={{ width: '100%', minHeight: '50px', padding: '6px', border: 'none', borderRadius: '4px', resize: 'vertical', fontSize: '14px', outline: 'none' }} />
          <div style={{ fontSize: '11px', color: '#6b7280', fontStyle: 'italic', marginTop: '4px', marginBottom: '8px' }}>
            Edit the generated comment or add additional notes
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            <button onClick={handleCancelEditComment} style={actionBtnStyle('#6b7280')}>Cancel</button>
            <button data-tour="save-comment" onClick={handleSaveEditedComment} style={actionBtnStyle('#3b82f6')}>Save</button>
            {onTemplateAction && (
              <>
                <button data-tour="replace-in-template" onClick={handleReplaceInTemplate} style={actionBtnStyle('#8b5cf6')}>Replace in template</button>
                <button data-tour="add-to-button" onClick={handleAddToButton} style={actionBtnStyle('#6366f1')}>Add to button</button>
                <button data-tour="add-to-new-button" onClick={() => setShowAddToNewModal(true)} style={actionBtnStyle('#f59e0b')}>Add to new button</button>
              </>
            )}
          </div>

          {/* Move statement to another rating */}
          {onTemplateAction && ratings.filter(r => r.value !== data.rating).length > 0 && (
            <div data-tour="move-to" style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '11px', color: '#6b7280' }}>Move to:</span>
              <select value={moveToArea} onChange={e => setMoveToArea(e.target.value)}
                style={{ padding: '3px 6px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '12px', flex: 1, minWidth: 0 }}>
                <option value="">— choose button —</option>
                {ratings.filter(r => r.value !== data.rating).map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
              <button onClick={handleMoveStatement} disabled={!moveToArea}
                style={{ ...actionBtnStyle('#06b6d4'), opacity: !moveToArea ? 0.4 : 1 }}>Move</button>
            </div>
          )}

          {showAddToNewModal && (
            <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#f9fafb', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
              <div style={{ fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>New button name:</div>
              <input type="text" value={addToNewButtonName} onChange={e => setAddToNewButtonName(e.target.value)}
                placeholder="e.g. Outstanding..."
                style={{ width: '100%', padding: '6px 8px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '13px', boxSizing: 'border-box', marginBottom: '8px' }} />
              <div style={{ display: 'flex', gap: '6px' }}>
                <button onClick={() => setShowAddToNewModal(false)} style={actionBtnStyle('#6b7280')}>Cancel</button>
                <button onClick={handleConfirmAddToNewButton} disabled={!addToNewButtonName.trim()}
                  style={{ ...actionBtnStyle('#f59e0b'), opacity: !addToNewButtonName.trim() ? 0.4 : 1 }}>
                  Confirm
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RatedCommentSection;
