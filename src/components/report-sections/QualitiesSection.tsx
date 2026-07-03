import React, { useState, useEffect } from 'react';
import InlineEditableTitle from './InlineEditableTitle';
import HeaderStylePicker from './HeaderStylePicker';

interface QualitiesSectionProps {
  section: any;
  data: any;
  updateSectionData: (sectionId: string, data: any) => void;
  onTemplateAction?: (action: any) => void;
  onAddButton?: (sectionId: string, buttonName: string, firstOption: string) => void;
  onDuplicateSection?: (sectionId: string) => void;
  onMergeSections?: (sourceId: string, targetId: string) => void;
  workingTemplateSections?: any[];
  onRenameSection?: (sectionId: string, newName: string) => void;
  globalPronoun?: string;
}

const QualitiesSection: React.FC<QualitiesSectionProps> = ({
  section,
  data,
  updateSectionData,
  onTemplateAction,
  onAddButton,
  onDuplicateSection,
  onMergeSections,
  workingTemplateSections,
  onRenameSection,
  globalPronoun,
}) => {
  const [showEditQuality, setShowEditQuality] = useState(false);
  const [editableQuality, setEditableQuality] = useState('');
  const [showNewButtonModal, setShowNewButtonModal] = useState(false);
  const [newButtonName, setNewButtonName] = useState('');
  const [newButtonFirstOption, setNewButtonFirstOption] = useState('');
  const [showAddToNewModal, setShowAddToNewModal] = useState(false);
  const [addToNewButtonName, setAddToNewButtonName] = useState('');
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [mergeTargetId, setMergeTargetId] = useState('');
  const [renamingButton, setRenamingButton] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [moveToArea, setMoveToArea] = useState('');
  const [editingButtons, setEditingButtons] = useState(false);
  const [moveAllTarget, setMoveAllTarget] = useState('');

  useEffect(() => {
    if (data.selectedQuality) {
      setEditableQuality(data.customEditedQuality || data.selectedQuality);
    }
  }, [data.selectedQuality, data.customEditedQuality]);

  const handleQualityAreaChange = (qualityArea: string) => {
    if (editingButtons) return;
    if (qualityArea !== data.qualityArea && data.customEditedQuality && data.customEditedQuality !== data.selectedQuality) {
      if (!window.confirm('Changing the quality area will replace your custom edits. Continue?')) return;
    }
    updateSectionData(section.id, { qualityArea, customEditedQuality: undefined });
    setShowEditQuality(false);
  };

  const handleSaveEditedQuality = () => { updateSectionData(section.id, { customEditedQuality: editableQuality }); setShowEditQuality(false); };
  const handleCancelEditQuality = () => { setEditableQuality(data.selectedQuality || ''); setShowEditQuality(false); };

  const handleReplaceInTemplate = () => {
    if (!onTemplateAction || !data.qualityArea) return;
    onTemplateAction({ type: 'replace', sectionId: section.id, commentText: editableQuality, buttonName: data.qualityArea });
    updateSectionData(section.id, { customEditedQuality: editableQuality });
    setShowEditQuality(false);
  };

  const handleAddToButton = () => {
    if (!onTemplateAction || !data.qualityArea) return;
    onTemplateAction({ type: 'add-to-button', sectionId: section.id, commentText: editableQuality, buttonName: data.qualityArea });
    updateSectionData(section.id, { customEditedQuality: editableQuality });
    setShowEditQuality(false);
  };

  const handleConfirmAddToNewButton = () => {
    if (!onTemplateAction || !addToNewButtonName.trim()) return;
    onTemplateAction({ type: 'add-to-new-button', sectionId: section.id, commentText: editableQuality, newButtonName: addToNewButtonName.trim() });
    updateSectionData(section.id, { customEditedQuality: editableQuality });
    setShowAddToNewModal(false);
    setAddToNewButtonName('');
    setShowEditQuality(false);
  };

  const handleConfirmNewButton = () => {
    if (!onAddButton || !newButtonName.trim() || !newButtonFirstOption.trim()) return;
    onAddButton(section.id, newButtonName.trim(), newButtonFirstOption.trim());
    setNewButtonName(''); setNewButtonFirstOption(''); setShowNewButtonModal(false);
  };

  const handleConfirmMerge = () => {
    if (!onMergeSections || !mergeTargetId) return;
    if (!window.confirm(`This will merge all buttons from this section into the target section, then remove this section. Continue?`)) return;
    onMergeSections(section.id, mergeTargetId);
    setShowMergeModal(false);
  };

  const handleRenameButton = (oldName: string) => {
    if (!renameValue.trim() || renameValue.trim() === oldName) { setRenamingButton(null); return; }
    if (!onTemplateAction) return;
    const comments = { ...(section.data?.comments || {}) };
    const options = comments[oldName] || [];
    delete comments[oldName];
    comments[renameValue.trim()] = options;
    onTemplateAction({ type: 'rename-button' as any, sectionId: section.id, oldButtonName: oldName, newButtonName: renameValue.trim(), updatedComments: comments });
    if (data.qualityArea === oldName) updateSectionData(section.id, { qualityArea: renameValue.trim() });
    setRenamingButton(null);
    setMoveAllTarget('');
  };

  const handleDeleteButton = (buttonName: string) => {
    if (!window.confirm(`Delete the "${buttonName}" button and all its statements?`)) return;
    const comments = { ...(section.data?.comments || {}) };
    delete comments[buttonName];
    onTemplateAction?.({ type: 'delete-button' as any, sectionId: section.id, buttonName, updatedComments: comments });
    if (data.qualityArea === buttonName) updateSectionData(section.id, { qualityArea: undefined, selectedQuality: undefined });
  };

  const handleMoveStatement = () => {
    if (!moveToArea || !data.qualityArea || !editableQuality || !onTemplateAction) return;
    onTemplateAction({ type: 'move-statement' as any, sectionId: section.id, fromButton: data.qualityArea, toButton: moveToArea, statement: editableQuality });
    updateSectionData(section.id, { qualityArea: moveToArea, selectedQuality: editableQuality, customEditedQuality: editableQuality });
    setMoveToArea('');
    setShowEditQuality(false);
  };

  const handleMoveAllStatements = (fromButton: string) => {
    if (!moveAllTarget || !onTemplateAction) return;
    if (!window.confirm(`Move all statements from "${fromButton}" to "${moveAllTarget}"? "${fromButton}" will be deleted.`)) return;
    const comments = { ...(section.data?.comments || {}) };
    const fromStatements = comments[fromButton] || [];
    comments[moveAllTarget] = [...(comments[moveAllTarget] || []), ...fromStatements];
    delete comments[fromButton];
    onTemplateAction({ type: 'delete-button' as any, sectionId: section.id, buttonName: fromButton, updatedComments: comments });
    if (data.qualityArea === fromButton) updateSectionData(section.id, { qualityArea: moveAllTarget, selectedQuality: undefined, customEditedQuality: undefined });
    setRenamingButton(null);
    setMoveAllTarget('');
  };

  const mergeTargets = (workingTemplateSections || []).filter(
    (s: any) => s.type === 'qualities' && s.id !== section.id
  );

  const qualityAreas = section.data?.headings || Object.keys(section.data?.comments || {});
  const hasSelectedQuality = data.selectedQuality && data.qualityArea;

  const actionBtnStyle = (color: string): React.CSSProperties => ({
    backgroundColor: color, color: 'white', border: 'none', borderRadius: '4px',
    padding: '4px 8px', fontSize: '11px', cursor: 'pointer', fontWeight: '500', whiteSpace: 'nowrap',
  });

  return (
    <div style={{ border: '2px solid #8b5cf6', borderRadius: '8px', padding: '16px', marginBottom: '16px', backgroundColor: '#f3e8ff' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <InlineEditableTitle name={section.name} defaultName="Qualities" color="#7c3aed" onRename={onRenameSection ? (n) => onRenameSection(section.id, n) : undefined} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {onDuplicateSection && (
            <button data-tour="duplicate" onClick={() => onDuplicateSection(section.id)} title="Duplicate this section"
              style={{ backgroundColor: '#e5e7eb', color: '#374151', border: 'none', borderRadius: '4px', padding: '3px 8px', fontSize: '11px', cursor: 'pointer', fontWeight: '500' }}>
              ⧉ Duplicate
            </button>
          )}
          {onAddButton && (
            <button onClick={() => setEditingButtons(b => !b)}
              style={{ backgroundColor: editingButtons ? '#8b5cf6' : '#e5e7eb', color: editingButtons ? 'white' : '#374151', border: 'none', borderRadius: '4px', padding: '3px 8px', fontSize: '11px', cursor: 'pointer', fontWeight: '500' }}>
              {editingButtons ? '✓ Done' : '✏ Edit Buttons'}
            </button>
          )}
          {onMergeSections && mergeTargets.length > 0 && (
            <button data-tour="merge" onClick={() => setShowMergeModal(true)} title="Merge buttons from this section into another"
              style={{ backgroundColor: '#ddd6fe', color: '#7c3aed', border: 'none', borderRadius: '4px', padding: '3px 8px', fontSize: '11px', cursor: 'pointer', fontWeight: '500' }}>
              ⇥ Merge into…
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

      {/* Merge modal */}
      {showMergeModal && (
        <div style={{ backgroundColor: '#fdf4ff', border: '1px solid #d8b4fe', borderRadius: '8px', padding: '12px', marginBottom: '12px' }}>
          <div style={{ fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
            Merge all buttons from this section into:
          </div>
          <select value={mergeTargetId} onChange={e => setMergeTargetId(e.target.value)}
            style={{ width: '100%', padding: '6px 8px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '13px', marginBottom: '8px', boxSizing: 'border-box' }}>
            <option value="">— Choose a section —</option>
            {mergeTargets.map((s: any) => (
              <option key={s.id} value={s.id}>{s.name || 'Untitled'}</option>
            ))}
          </select>
          <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '8px', fontStyle: 'italic' }}>
            This section will be removed after merging. Duplicate button names will be combined.
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button onClick={() => setShowMergeModal(false)} style={actionBtnStyle('#6b7280')}>Cancel</button>
            <button onClick={handleConfirmMerge} disabled={!mergeTargetId}
              style={{ ...actionBtnStyle('#7c3aed'), opacity: !mergeTargetId ? 0.4 : 1 }}>
              Merge
            </button>
          </div>
        </div>
      )}

      {/* Pronoun selector — Name or global pronoun */}
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

      {/* Quality buttons + add new */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px', alignItems: 'center' }}>
        {qualityAreas.map((area: string) => (
          renamingButton === area ? (
            <div key={area} style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <input autoFocus value={renameValue} onChange={e => setRenameValue(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleRenameButton(area); if (e.key === 'Escape') { setRenamingButton(null); setMoveAllTarget(''); } }}
                  style={{ padding: '4px 8px', border: '2px solid #8b5cf6', borderRadius: '4px', fontSize: '12px', width: '140px', outline: 'none' }} />
                <button onClick={() => handleRenameButton(area)} style={{ backgroundColor: '#8b5cf6', color: 'white', border: 'none', borderRadius: '4px', padding: '4px 8px', fontSize: '11px', cursor: 'pointer' }}>✓ Rename</button>
                <button onClick={() => { setRenamingButton(null); setMoveAllTarget(''); }} style={{ backgroundColor: '#9ca3af', color: 'white', border: 'none', borderRadius: '4px', padding: '4px 8px', fontSize: '11px', cursor: 'pointer' }}>✕</button>
              </div>
              {qualityAreas.filter((a: string) => a !== area).length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', paddingLeft: '2px' }}>
                  <span style={{ fontSize: '11px', color: '#6b7280' }}>Move all to:</span>
                  <select value={moveAllTarget} onChange={e => setMoveAllTarget(e.target.value)}
                    style={{ fontSize: '11px', padding: '2px 4px', borderRadius: '4px', border: '1px solid #d1d5db' }}>
                    <option value="">— choose —</option>
                    {qualityAreas.filter((a: string) => a !== area).map((a: string) => <option key={a} value={a}>{a}</option>)}
                  </select>
                  <button onClick={() => handleMoveAllStatements(area)} disabled={!moveAllTarget}
                    style={{ backgroundColor: '#06b6d4', color: 'white', border: 'none', borderRadius: '4px', padding: '2px 8px', fontSize: '11px', cursor: 'pointer', opacity: !moveAllTarget ? 0.4 : 1 }}>
                    Move
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div key={area} style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
              <button onClick={() => handleQualityAreaChange(area)}
                style={{
                  backgroundColor: data.qualityArea === area ? '#8b5cf6' : 'white',
                  color: data.qualityArea === area ? 'white' : '#8b5cf6',
                  border: '2px solid #8b5cf6',
                  borderRadius: editingButtons ? '6px 0 0 6px' : '6px',
                  padding: '6px 10px',
                  fontSize: '12px', fontWeight: '600', cursor: editingButtons ? 'default' : 'pointer', whiteSpace: 'nowrap'
                }}>
                {area}
              </button>
              {editingButtons && (
                <>
                  <button onClick={() => { setRenamingButton(area); setRenameValue(area); setMoveAllTarget(''); }} title="Rename button"
                    style={{ backgroundColor: '#ede9fe', color: '#7c3aed', border: '2px solid #8b5cf6', borderLeft: 'none', padding: '6px 5px', fontSize: '10px', cursor: 'pointer' }}>✏</button>
                  <button onClick={() => handleDeleteButton(area)} title="Delete button"
                    style={{ backgroundColor: '#fee2e2', color: '#dc2626', border: '2px solid #8b5cf6', borderLeft: 'none', borderRadius: '0 6px 6px 0', padding: '6px 5px', fontSize: '10px', cursor: 'pointer' }}>✕</button>
                </>
              )}
            </div>
          )
        ))}
        {onAddButton && (
          <button onClick={() => setShowNewButtonModal(true)} title="Add a new button"
            style={{ backgroundColor: 'white', color: '#8b5cf6', border: '2px dashed #8b5cf6', borderRadius: '6px', padding: '6px 10px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', lineHeight: 1 }}>
            +
          </button>
        )}
      </div>

      {/* New button modal */}
      {showNewButtonModal && (
        <div style={{ backgroundColor: 'white', border: '1px solid #d1d5db', borderRadius: '8px', padding: '12px', marginBottom: '12px' }}>
          <div style={{ fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>Add new button</div>
          <input type="text" value={newButtonName} onChange={e => setNewButtonName(e.target.value)}
            placeholder="Button name (e.g. Leadership)..."
            style={{ width: '100%', padding: '6px 8px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '13px', marginBottom: '8px', boxSizing: 'border-box' }} />
          <textarea value={newButtonFirstOption} onChange={e => setNewButtonFirstOption(e.target.value)}
            placeholder="First comment option... Use [Name] for pupil name."
            style={{ width: '100%', padding: '6px 8px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '13px', minHeight: '60px', resize: 'vertical', boxSizing: 'border-box', marginBottom: '8px' }} />
          <div style={{ display: 'flex', gap: '6px' }}>
            <button onClick={() => setShowNewButtonModal(false)} style={actionBtnStyle('#6b7280')}>Cancel</button>
            <button onClick={handleConfirmNewButton} disabled={!newButtonName.trim() || !newButtonFirstOption.trim()}
              style={{ ...actionBtnStyle('#8b5cf6'), opacity: (!newButtonName.trim() || !newButtonFirstOption.trim()) ? 0.4 : 1 }}>
              Add Button
            </button>
          </div>
        </div>
      )}

      {/* Edit toggle */}
      {hasSelectedQuality && !editingButtons && (
        <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: showEditQuality ? '12px' : '0' }}>
          <button onClick={() => setShowEditQuality(!showEditQuality)}
            style={{ backgroundColor: showEditQuality ? '#8b5cf6' : '#e5e7eb', color: showEditQuality ? 'white' : '#6b7280', border: 'none', borderRadius: '4px', padding: '4px 8px', fontSize: '12px', cursor: 'pointer', fontWeight: '500' }}>
            {showEditQuality ? '- Edit Quality' : '+ Edit Quality'}
          </button>
        </div>
      )}

      {/* Edit panel */}
      {showEditQuality && hasSelectedQuality && !editingButtons && (
        <div style={{ backgroundColor: 'white', border: '1px solid #d1d5db', borderRadius: '6px', padding: '8px', marginBottom: '12px' }}>
          <textarea value={editableQuality} onChange={(e) => setEditableQuality(e.target.value)}
            placeholder="Edit the quality statement to better suit this student..."
            style={{ width: '100%', minHeight: '50px', padding: '6px', border: 'none', borderRadius: '4px', resize: 'vertical', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
          <div style={{ fontSize: '11px', color: '#6b7280', fontStyle: 'italic', marginTop: '4px', marginBottom: '8px' }}>
            Edit the generated quality or add additional notes
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            <button onClick={handleCancelEditQuality} style={actionBtnStyle('#6b7280')}>Cancel</button>
            <button onClick={handleSaveEditedQuality} style={actionBtnStyle('#10b981')}>Save</button>
            {onTemplateAction && (
              <>
                <button onClick={handleReplaceInTemplate} style={actionBtnStyle('#8b5cf6')}>Replace in template</button>
                <button onClick={handleAddToButton} style={actionBtnStyle('#6366f1')}>Add to button</button>
                <button onClick={() => setShowAddToNewModal(true)} style={actionBtnStyle('#f59e0b')}>Add to new button</button>
              </>
            )}
          </div>
          {/* Move statement to another button */}
          {onTemplateAction && qualityAreas.filter((a: string) => a !== data.qualityArea).length > 0 && (
            <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '11px', color: '#6b7280' }}>Move to:</span>
              <select value={moveToArea} onChange={e => setMoveToArea(e.target.value)}
                style={{ padding: '3px 6px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '12px', flex: 1, minWidth: 0 }}>
                <option value="">— choose button —</option>
                {qualityAreas.filter((a: string) => a !== data.qualityArea).map((a: string) => <option key={a} value={a}>{a}</option>)}
              </select>
              <button onClick={handleMoveStatement} disabled={!moveToArea}
                style={{ ...actionBtnStyle('#06b6d4'), opacity: !moveToArea ? 0.4 : 1 }}>Move</button>
            </div>
          )}
          {showAddToNewModal && (
            <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#f9fafb', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
              <div style={{ fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>New button name:</div>
              <input type="text" value={addToNewButtonName} onChange={e => setAddToNewButtonName(e.target.value)}
                placeholder="e.g. Resilience..."
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

export default QualitiesSection;
