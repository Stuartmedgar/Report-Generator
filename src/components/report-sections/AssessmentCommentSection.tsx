import React, { useState, useEffect } from 'react';
import InlineEditableTitle from './InlineEditableTitle';
import HeaderStylePicker from './HeaderStylePicker';

interface AssessmentCommentSectionProps {
  section: any;
  data: any;
  updateSectionData: (sectionId: string, data: any) => void;
  onTemplateAction?: (action: any) => void;
  onAddButton?: (sectionId: string, buttonName: string, firstOption: string) => void;
  onRenameSection?: (sectionId: string, newName: string) => void;
  globalPronoun?: string;
}

function getScorePlaceholders(comment: string): string[] {
  const found: string[] = [];
  const seen = new Set<string>();
  const numbered = /\[Score (\d+)\]/gi;
  let match;
  while ((match = numbered.exec(comment)) !== null) {
    const key = `Score ${match[1]}`;
    if (!seen.has(key)) { seen.add(key); found.push(key); }
  }
  // Treat bare [Score] as [Score 1] for backward compatibility
  if (found.length === 0 && /\[Score\]/i.test(comment)) {
    found.push('Score 1');
  }
  return found;
}

const AssessmentCommentSection: React.FC<AssessmentCommentSectionProps> = ({
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

  useEffect(() => {
    if (data.selectedComment) {
      setEditableComment(data.customEditedComment || data.selectedComment);
    }
  }, [data.selectedComment, data.customEditedComment]);

  // Performance buttons — now free-form (teacher's own names from section.data.comments keys)
  // Falls back to legacy fixed names if template was built the old way
  const performanceButtons = Object.keys(section.data?.comments || {});

  const handlePerformanceChange = (performance: string) => {
    if (editingButtons) return;
    if (performance !== data.performance && data.customEditedComment && data.customEditedComment !== data.selectedComment) {
      if (!window.confirm('Changing the performance level will replace your custom edits. Continue?')) return;
    }
    updateSectionData(section.id, { performance, customEditedComment: undefined });
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

  const handleScoreTypeChange = (scoreType: 'outOf' | 'percentage') => {
    updateSectionData(section.id, {
      scoreType, score: undefined,
      maxScore: scoreType === 'outOf' ? (data.maxScore || section.data?.maxScore || 100) : undefined
    });
  };

  const handleScoreChange = (score: number) => updateSectionData(section.id, { score });
  const handleMaxScoreChange = (maxScore: number) => updateSectionData(section.id, { maxScore });

  const handleScoreValueChange = (key: string, value: string) => {
    const scoreValues = { ...(data.scoreValues || {}) };
    scoreValues[key] = value;
    updateSectionData(section.id, { scoreValues });
  };

  // Template actions
  const handleReplaceInTemplate = () => {
    if (!onTemplateAction || !data.performance) return;
    onTemplateAction({ type: 'replace', sectionId: section.id, commentText: editableComment, buttonName: data.performance });
    updateSectionData(section.id, { customEditedComment: editableComment });
    setShowEditComment(false);
  };

  const handleAddToButton = () => {
    if (!onTemplateAction || !data.performance) return;
    onTemplateAction({ type: 'add-to-button', sectionId: section.id, commentText: editableComment, buttonName: data.performance });
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

  const handleRenameButton = (oldName: string) => {
    if (!renameValue.trim() || renameValue.trim() === oldName) { setRenamingButton(null); return; }
    if (!onTemplateAction) return;
    const comments = { ...(section.data?.comments || {}) };
    const options = comments[oldName] || [];
    delete comments[oldName];
    comments[renameValue.trim()] = options;
    onTemplateAction({ type: 'rename-button' as any, sectionId: section.id, oldButtonName: oldName, newButtonName: renameValue.trim(), updatedComments: comments });
    if (data.performance === oldName) updateSectionData(section.id, { performance: renameValue.trim() });
    setRenamingButton(null);
    setMoveAllTarget('');
  };

  const handleDeleteButton = (buttonName: string) => {
    if (!window.confirm(`Delete the "${buttonName}" button and all its statements?`)) return;
    const comments = { ...(section.data?.comments || {}) };
    delete comments[buttonName];
    onTemplateAction?.({ type: 'delete-button' as any, sectionId: section.id, buttonName, updatedComments: comments });
    if (data.performance === buttonName) updateSectionData(section.id, { performance: undefined, selectedComment: undefined });
  };

  const handleMoveStatement = () => {
    if (!moveToArea || !data.performance || !editableComment || !onTemplateAction) return;
    onTemplateAction({ type: 'move-statement' as any, sectionId: section.id, fromButton: data.performance, toButton: moveToArea, statement: editableComment });
    updateSectionData(section.id, { performance: moveToArea, selectedComment: editableComment, customEditedComment: editableComment });
    setMoveToArea('');
    setShowEditComment(false);
  };

  const handleMoveAllStatements = (fromButton: string) => {
    if (!moveAllTarget || !onTemplateAction) return;
    if (!window.confirm(`Move all statements from "${fromButton}" to "${moveAllTarget}"? "${fromButton}" will be deleted.`)) return;
    const comments = { ...(section.data?.comments || {}) };
    const fromStatements = comments[fromButton] || [];
    comments[moveAllTarget] = [...(comments[moveAllTarget] || []), ...fromStatements];
    delete comments[fromButton];
    onTemplateAction({ type: 'delete-button' as any, sectionId: section.id, buttonName: fromButton, updatedComments: comments });
    if (data.performance === fromButton) updateSectionData(section.id, { performance: moveAllTarget, selectedComment: undefined, customEditedComment: undefined });
    setRenamingButton(null);
    setMoveAllTarget('');
  };

  const hasSelectedComment = data.selectedComment && data.performance && data.performance !== 'no-comment';
  const currentScoreType = data.scoreType || section.data?.scoreType || 'outOf';
  const currentMaxScore = data.maxScore || section.data?.maxScore || 100;
  const currentComment = data.customEditedComment || data.selectedComment || '';
  const scorePlaceholders = hasSelectedComment ? getScorePlaceholders(currentComment) : [];
  const hasNumberedScores = scorePlaceholders.some(p => p !== 'Score');

  // Button colour — cycle through a few purples/blues for free buttons
  const BUTTON_COLORS = ['#7c3aed', '#6d28d9', '#5b21b6', '#4c1d95', '#3730a3'];
  const getButtonColor = (idx: number) => BUTTON_COLORS[idx % BUTTON_COLORS.length];

  const actionBtnStyle = (color: string): React.CSSProperties => ({
    backgroundColor: color, color: 'white', border: 'none', borderRadius: '4px',
    padding: '4px 8px', fontSize: '11px', cursor: 'pointer', fontWeight: '500', whiteSpace: 'nowrap',
  });

  return (
    <div style={{ border: '2px solid #8b5cf6', borderRadius: '8px', padding: '16px', marginBottom: '16px', backgroundColor: '#f3e8ff' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <InlineEditableTitle name={section.name} defaultName="Assessment Comment" color="#7c3aed" onRename={onRenameSection ? (n) => onRenameSection(section.id, n) : undefined} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {onAddButton && (
            <button onClick={() => setEditingButtons(b => !b)}
              style={{ backgroundColor: editingButtons ? '#8b5cf6' : '#e5e7eb', color: editingButtons ? 'white' : '#374151', border: 'none', borderRadius: '4px', padding: '3px 8px', fontSize: '11px', cursor: 'pointer', fontWeight: '500' }}>
              {editingButtons ? '✓ Done' : '✏ Edit Buttons'}
            </button>
          )}
          <HeaderStylePicker showHeader={data.showHeader !== false} headerStyle={data.headerStyle || section.data?.headerStyle || 'inline'} onChange={(show, style) => updateSectionData(section.id, { showHeader: show, headerStyle: style })} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <input type="checkbox" checked={data.exclude || false}
              onChange={(e) => updateSectionData(section.id, { exclude: e.target.checked })}
              style={{ width: '14px', height: '14px', cursor: 'pointer' }} />
            <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>Exclude</span>
          </div>
        </div>
      </div>

      {/* Pronoun selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
        <span style={{ fontSize: '11px', color: '#6b7280', fontWeight: '500' }}>Use:</span>
        {[{ value: '', label: 'Name' }, { value: globalPronoun || 'he', label: 'Pronoun' }].map(opt => (
          <button key={opt.value} onClick={() => updateSectionData(section.id, { pronounOverride: opt.value })}
            style={{
              padding: '2px 8px', border: '1px solid #8b5cf6', borderRadius: '4px',
              fontSize: '11px', fontWeight: '600', cursor: 'pointer',
              backgroundColor: (data.pronounOverride || '') === opt.value ? '#8b5cf6' : 'white',
              color: (data.pronounOverride || '') === opt.value ? 'white' : '#8b5cf6',
            }}>
            {opt.label}
          </button>
        ))}
      </div>

      {/* Fix 7: instruction reminder */}
      {section.data?.instruction && (
        <div style={{ fontSize: '13px', color: '#6d28d9', marginBottom: '12px', padding: '8px 12px', backgroundColor: 'rgba(139,92,246,0.08)', borderRadius: '6px', border: '1px solid rgba(139,92,246,0.2)', textAlign: 'left' }}>
          <strong>Score reminder:</strong> {section.data.instruction}
        </div>
      )}

      {/* Score inputs */}
      {hasSelectedComment && hasNumberedScores ? (
        <div style={{ marginBottom: '12px' }}>
          <div style={{ fontSize: '12px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>Score values:</div>
          {scorePlaceholders.map(key => (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <label style={{ fontSize: '12px', color: '#374151', minWidth: '60px' }}>[{key}]:</label>
              <input type="text" value={(data.scoreValues || {})[key] || ''} onChange={e => handleScoreValueChange(key, e.target.value)}
                placeholder="e.g. 15 out of 20 or 75%"
                style={{ flex: 1, padding: '4px 8px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '12px', outline: 'none' }} />
            </div>
          ))}
          <div style={{ fontSize: '11px', color: '#6b7280', fontStyle: 'italic' }}>
            Use [Score 1], [Score 2] etc in your comments to support multiple scores.
          </div>
        </div>
      ) : (
        <>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ fontSize: '12px', fontWeight: '500', color: '#374151', marginBottom: '6px', display: 'block' }}>Score Type:</label>
            <div style={{ display: 'flex', gap: '12px', marginBottom: '8px' }}>
              {[{ value: 'outOf', label: 'Out of (e.g. 15 out of 20)' }, { value: 'percentage', label: 'Percentage (e.g. 75%)' }].map(opt => (
                <label key={opt.value} style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '12px', color: '#374151' }}>
                  <input type="radio" name={`scoreType-${section.id}`} value={opt.value}
                    checked={currentScoreType === opt.value}
                    onChange={() => handleScoreTypeChange(opt.value as 'outOf' | 'percentage')}
                    style={{ transform: 'scale(0.9)' }} />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <label style={{ fontSize: '12px', fontWeight: '500', color: '#374151' }}>Score:</label>
            <input type="number" value={data.score || ''}
              onChange={(e) => handleScoreChange(parseFloat(e.target.value) || 0)}
              placeholder={currentScoreType === 'outOf' ? 'e.g. 15' : 'e.g. 75'}
              style={{ width: '60px', padding: '4px 6px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '12px', outline: 'none' }}
              min="0" max={currentScoreType === 'percentage' ? 100 : currentMaxScore} />
            {currentScoreType === 'outOf' && (
              <>
                <span style={{ fontSize: '12px', color: '#6b7280' }}>out of</span>
                <input type="number" value={currentMaxScore} onChange={(e) => handleMaxScoreChange(parseFloat(e.target.value) || 100)}
                  style={{ width: '60px', padding: '4px 6px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '12px', outline: 'none' }} min="1" />
              </>
            )}
            {currentScoreType === 'percentage' && <span style={{ fontSize: '12px', color: '#6b7280' }}>%</span>}
          </div>
        </>
      )}

      {/* Score placeholder hint */}
      <div style={{ fontSize: '11px', color: '#7c3aed', marginBottom: '12px', fontStyle: 'italic', textAlign: 'left' }}>
        Use <strong>[Score 1]</strong> in comments for a single score, or <strong>[Score 1]</strong> <strong>[Score 2]</strong> for multiple scores.
      </div>

      {/* Performance buttons — now teacher's own names */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '8px', alignItems: 'center' }}>
        {performanceButtons.map((btn, idx) => (
          renamingButton === btn ? (
            <div key={btn} style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <input autoFocus value={renameValue} onChange={e => setRenameValue(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleRenameButton(btn); if (e.key === 'Escape') { setRenamingButton(null); setMoveAllTarget(''); } }}
                  style={{ padding: '4px 8px', border: `2px solid ${getButtonColor(idx)}`, borderRadius: '4px', fontSize: '12px', width: '140px', outline: 'none' }} />
                <button onClick={() => handleRenameButton(btn)} style={{ backgroundColor: getButtonColor(idx), color: 'white', border: 'none', borderRadius: '4px', padding: '4px 8px', fontSize: '11px', cursor: 'pointer' }}>✓ Rename</button>
                <button onClick={() => { setRenamingButton(null); setMoveAllTarget(''); }} style={{ backgroundColor: '#9ca3af', color: 'white', border: 'none', borderRadius: '4px', padding: '4px 8px', fontSize: '11px', cursor: 'pointer' }}>✕</button>
              </div>
              {performanceButtons.filter(b => b !== btn).length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', paddingLeft: '2px' }}>
                  <span style={{ fontSize: '11px', color: '#6b7280' }}>Move all to:</span>
                  <select value={moveAllTarget} onChange={e => setMoveAllTarget(e.target.value)}
                    style={{ fontSize: '11px', padding: '2px 4px', borderRadius: '4px', border: '1px solid #d1d5db' }}>
                    <option value="">— choose —</option>
                    {performanceButtons.filter(b => b !== btn).map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                  <button onClick={() => handleMoveAllStatements(btn)} disabled={!moveAllTarget}
                    style={{ backgroundColor: '#06b6d4', color: 'white', border: 'none', borderRadius: '4px', padding: '2px 8px', fontSize: '11px', cursor: 'pointer', opacity: !moveAllTarget ? 0.4 : 1 }}>
                    Move
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div key={btn} style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
              <button onClick={() => handlePerformanceChange(btn)}
                style={{
                  backgroundColor: data.performance === btn ? getButtonColor(idx) : 'white',
                  color: data.performance === btn ? 'white' : getButtonColor(idx),
                  border: `2px solid ${getButtonColor(idx)}`,
                  borderRadius: editingButtons ? '6px 0 0 6px' : '6px', padding: '6px 12px',
                  fontSize: '12px', fontWeight: '600', cursor: editingButtons ? 'default' : 'pointer', whiteSpace: 'nowrap'
                }}>
                {btn}
              </button>
              {editingButtons && (
                <>
                  <button onClick={() => { setRenamingButton(btn); setRenameValue(btn); setMoveAllTarget(''); }} title="Rename button"
                    style={{ backgroundColor: '#f3e8ff', color: getButtonColor(idx), border: `2px solid ${getButtonColor(idx)}`, borderLeft: 'none', padding: '6px 5px', fontSize: '10px', cursor: 'pointer' }}>✏</button>
                  <button onClick={() => handleDeleteButton(btn)} title="Delete button"
                    style={{ backgroundColor: '#fee2e2', color: '#dc2626', border: `2px solid ${getButtonColor(idx)}`, borderLeft: 'none', borderRadius: '0 6px 6px 0', padding: '6px 5px', fontSize: '10px', cursor: 'pointer' }}>✕</button>
                </>
              )}
            </div>
          )
        ))}
        {/* No comment option */}
        {!editingButtons && (
          <button onClick={() => handlePerformanceChange('no-comment')}
            style={{
              backgroundColor: data.performance === 'no-comment' ? '#6b7280' : 'white',
              color: data.performance === 'no-comment' ? 'white' : '#6b7280',
              border: '2px solid #6b7280', borderRadius: '6px', padding: '6px 12px',
              fontSize: '12px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap'
            }}>
            No Comment
          </button>
        )}
        {onAddButton && (
          <button onClick={() => setShowNewButtonModal(true)} title="Add a new performance button"
            style={{ backgroundColor: 'white', color: '#7c3aed', border: '2px dashed #7c3aed', borderRadius: '6px', padding: '6px 10px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', lineHeight: 1 }}>
            +
          </button>
        )}
      </div>

      {/* New button modal */}
      {showNewButtonModal && (
        <div style={{ backgroundColor: 'white', border: '1px solid #d1d5db', borderRadius: '8px', padding: '12px', marginBottom: '12px' }}>
          <div style={{ fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>Add new performance button</div>
          <input type="text" value={newButtonName} onChange={e => setNewButtonName(e.target.value)}
            placeholder="Button name (e.g. Outstanding)..."
            style={{ width: '100%', padding: '6px 8px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '13px', marginBottom: '8px', boxSizing: 'border-box' }} />
          <textarea value={newButtonFirstOption} onChange={e => setNewButtonFirstOption(e.target.value)}
            placeholder="First comment option... Use [Name] for pupil name and [Score 1] for the score."
            style={{ width: '100%', padding: '6px 8px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '13px', minHeight: '60px', resize: 'vertical', boxSizing: 'border-box', marginBottom: '8px' }} />
          <div style={{ display: 'flex', gap: '6px' }}>
            <button onClick={() => setShowNewButtonModal(false)} style={actionBtnStyle('#6b7280')}>Cancel</button>
            <button onClick={handleConfirmNewButton} disabled={!newButtonName.trim() || !newButtonFirstOption.trim()}
              style={{ ...actionBtnStyle('#7c3aed'), opacity: (!newButtonName.trim() || !newButtonFirstOption.trim()) ? 0.4 : 1 }}>
              Add Button
            </button>
          </div>
        </div>
      )}

      {/* Edit toggle */}
      {hasSelectedComment && !editingButtons && (
        <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: showEditComment ? '12px' : '0' }}>
          <button onClick={() => setShowEditComment(!showEditComment)}
            style={{ backgroundColor: showEditComment ? '#8b5cf6' : '#e5e7eb', color: showEditComment ? 'white' : '#6b7280', border: 'none', borderRadius: '4px', padding: '4px 8px', fontSize: '12px', cursor: 'pointer', fontWeight: '500' }}>
            {showEditComment ? '- Edit Comment' : '+ Edit Comment'}
          </button>
        </div>
      )}

      {/* Edit panel */}
      {showEditComment && hasSelectedComment && !editingButtons && (
        <div style={{ backgroundColor: 'white', border: '1px solid #d1d5db', borderRadius: '6px', padding: '8px', marginBottom: '12px' }}>
          <textarea value={editableComment} onChange={(e) => setEditableComment(e.target.value)}
            placeholder="Edit the comment to better suit this student..."
            style={{ width: '100%', minHeight: '50px', padding: '6px', border: 'none', borderRadius: '4px', resize: 'vertical', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
          <div style={{ fontSize: '11px', color: '#6b7280', fontStyle: 'italic', marginTop: '4px', marginBottom: '8px' }}>
            Use [Score] or [Score 1] [Score 2] for score placeholders.
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            <button onClick={handleCancelEditComment} style={actionBtnStyle('#6b7280')}>Cancel</button>
            <button onClick={handleSaveEditedComment} style={actionBtnStyle('#10b981')}>Save</button>
            {onTemplateAction && (
              <>
                <button onClick={handleReplaceInTemplate} style={actionBtnStyle('#8b5cf6')}>Replace in template</button>
                <button onClick={handleAddToButton} style={actionBtnStyle('#6366f1')}>Add to button</button>
                <button onClick={() => setShowAddToNewModal(true)} style={actionBtnStyle('#f59e0b')}>Add to new button</button>
              </>
            )}
          </div>

          {/* Move statement to another button */}
          {onTemplateAction && performanceButtons.filter(b => b !== data.performance).length > 0 && (
            <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '11px', color: '#6b7280' }}>Move to:</span>
              <select value={moveToArea} onChange={e => setMoveToArea(e.target.value)}
                style={{ padding: '3px 6px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '12px', flex: 1, minWidth: 0 }}>
                <option value="">— choose button —</option>
                {performanceButtons.filter(b => b !== data.performance).map(b => <option key={b} value={b}>{b}</option>)}
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
                  style={{ ...actionBtnStyle('#f59e0b'), opacity: !addToNewButtonName.trim() ? 0.4 : 1 }}>Confirm</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AssessmentCommentSection;