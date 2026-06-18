import React, { useState, useEffect } from 'react';
import InlineEditableTitle from './InlineEditableTitle';
import HeaderStylePicker from './HeaderStylePicker';

interface PersonalisedCommentSectionProps {
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

function getInfoPlaceholders(comment: string): string[] {
  const found: string[] = [];
  const regex = /\[Info (\d+)\]/gi;
  let match;
  const seen = new Set<string>();
  while ((match = regex.exec(comment)) !== null) {
    const key = `Info ${match[1]}`;
    if (!seen.has(key)) { seen.add(key); found.push(key); }
  }
  if (found.length === 0 && /\[(personalised information|personal information|information)\]/i.test(comment)) {
    found.push('Info 1');
  }
  return found;
}

const PersonalisedCommentSection: React.FC<PersonalisedCommentSectionProps> = ({
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
  const [showEditComment, setShowEditComment] = useState(false);
  const [editableComment, setEditableComment] = useState('');
  const [showNewButtonModal, setShowNewButtonModal] = useState(false);
  const [newButtonName, setNewButtonName] = useState('');
  const [newButtonFirstOption, setNewButtonFirstOption] = useState('');
  const [showAddToNewModal, setShowAddToNewModal] = useState(false);
  const [addToNewButtonName, setAddToNewButtonName] = useState('');
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [mergeTargetId, setMergeTargetId] = useState('');

  useEffect(() => {
    if (data.selectedComment) {
      setEditableComment(data.customEditedComment || data.selectedComment);
    }
  }, [data.selectedComment, data.customEditedComment]);

  const handleCategoryChange = (category: string) => {
    if (category !== data.category && data.customEditedComment && data.customEditedComment !== data.selectedComment) {
      const shouldContinue = window.confirm('Changing the category will replace your custom edits. Continue?');
      if (!shouldContinue) return;
    }
    updateSectionData(section.id, { category, customEditedComment: undefined });
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

  const handleInfoChange = (key: string, value: string) => {
    const infoValues = { ...(data.infoValues || {}) };
    infoValues[key] = value;
    updateSectionData(section.id, { infoValues });
  };

  // ─── TEMPLATE ACTIONS ─────────────────────────────────────────────────────

  const handleReplaceInTemplate = () => {
    if (!onTemplateAction || !data.category) return;
    onTemplateAction({ type: 'replace', sectionId: section.id, commentText: editableComment, buttonName: data.category });
    updateSectionData(section.id, { customEditedComment: editableComment });
    setShowEditComment(false);
  };

  const handleAddToButton = () => {
    if (!onTemplateAction || !data.category) return;
    onTemplateAction({ type: 'add-to-button', sectionId: section.id, commentText: editableComment, buttonName: data.category });
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

  const handleConfirmMerge = () => {
    if (!onMergeSections || !mergeTargetId) return;
    if (!window.confirm('This will merge all buttons from this section into the target section, then remove this section. Continue?')) return;
    onMergeSections(section.id, mergeTargetId);
    setShowMergeModal(false);
  };

  const mergeTargets = (workingTemplateSections || []).filter(
    (s: any) => s.type === 'personalised-comment' && s.id !== section.id
  );

  const categories = section.data?.headings || Object.keys(section.data?.categories || section.data?.comments || {});
  const hasSelectedComment = data.selectedComment && data.category;
  const selectedComment = data.customEditedComment || data.selectedComment || '';
  const placeholders = getInfoPlaceholders(selectedComment);

  const actionBtnStyle = (color: string): React.CSSProperties => ({
    backgroundColor: color, color: 'white', border: 'none', borderRadius: '4px',
    padding: '4px 8px', fontSize: '11px', cursor: 'pointer', fontWeight: '500', whiteSpace: 'nowrap',
  });

  return (
    <div style={{ border: '2px solid #f59e0b', borderRadius: '8px', padding: '16px', marginBottom: '16px', backgroundColor: '#fffbeb' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <InlineEditableTitle name={section.name} defaultName="Personalised Comment" color="#d97706" onRename={onRenameSection ? (n) => onRenameSection(section.id, n) : undefined} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {onDuplicateSection && (
            <button onClick={() => onDuplicateSection(section.id)} title="Duplicate this section"
              style={{ backgroundColor: '#e5e7eb', color: '#374151', border: 'none', borderRadius: '4px', padding: '3px 8px', fontSize: '11px', cursor: 'pointer', fontWeight: '500' }}>
              ⧉ Duplicate
            </button>
          )}
          {onMergeSections && mergeTargets.length > 0 && (
            <button onClick={() => setShowMergeModal(true)} title="Merge buttons from this section into another"
              style={{ backgroundColor: '#fef3c7', color: '#d97706', border: 'none', borderRadius: '4px', padding: '3px 8px', fontSize: '11px', cursor: 'pointer', fontWeight: '500' }}>
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
        <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fbbf24', borderRadius: '8px', padding: '12px', marginBottom: '12px' }}>
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
              style={{ ...actionBtnStyle('#d97706'), opacity: !mergeTargetId ? 0.4 : 1 }}>Merge</button>
          </div>
        </div>
      )}

      {/* Pronoun selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
        <span style={{ fontSize: '11px', color: '#6b7280', fontWeight: '500' }}>Use:</span>
        {[{ value: '', label: 'Name' }, { value: globalPronoun || 'he', label: globalPronoun === 'she' ? 'She / Her' : globalPronoun === 'they' ? 'They / Them' : 'He / His' }].map(opt => (
          <button key={opt.value} onClick={() => updateSectionData(section.id, { pronounOverride: opt.value })}
            style={{
              padding: '2px 8px', border: '1px solid #f59e0b', borderRadius: '4px',
              fontSize: '11px', fontWeight: '600', cursor: 'pointer',
              backgroundColor: (data.pronounOverride || '') === opt.value ? '#f59e0b' : 'white',
              color: (data.pronounOverride || '') === opt.value ? 'white' : '#f59e0b',
            }}>
            {opt.label}
          </button>
        ))}
      </div>

      {/* Instruction */}
      {section.data?.instruction && (
        <div style={{ fontSize: '13px', color: '#92400e', marginBottom: '12px', padding: '8px', backgroundColor: 'rgba(245,158,11,0.1)', borderRadius: '4px', border: '1px solid rgba(245,158,11,0.2)' }}>
          <strong>Instructions:</strong> {section.data.instruction}
        </div>
      )}

      {/* Info placeholders */}
      {hasSelectedComment && placeholders.length > 0 ? (
        <div style={{ marginBottom: '12px' }}>
          {placeholders.map((key) => (
            <div key={key} style={{ marginBottom: '10px' }}>
              <label style={{ fontSize: '14px', fontWeight: '500', color: '#d97706', marginBottom: '6px', display: 'block' }}>{key}:</label>
              <input type="text" value={(data.infoValues || {})[key] || ''} onChange={e => handleInfoChange(key, e.target.value)}
                placeholder={`Enter ${key.toLowerCase()}...`}
                style={{ width: '100%', padding: '8px 12px', border: '2px solid #fbbf24', borderRadius: '6px', fontSize: '14px', outline: 'none', backgroundColor: 'white', boxSizing: 'border-box' }} />
            </div>
          ))}
          <div style={{ fontSize: '12px', color: '#92400e', fontStyle: 'italic' }}>This will replace the [Info] placeholders in the preview</div>
        </div>
      ) : !hasSelectedComment && (
        <div style={{ marginBottom: '12px' }}>
          <label style={{ fontSize: '14px', fontWeight: '500', color: '#d97706', marginBottom: '6px', display: 'block' }}>
            {section.data?.instruction || 'Enter personalised information:'}
          </label>
          <input type="text" disabled placeholder="Select a category below first..."
            style={{ width: '100%', padding: '8px 12px', border: '2px solid #fbbf24', borderRadius: '6px', fontSize: '14px', outline: 'none', backgroundColor: '#fef9ec', boxSizing: 'border-box', cursor: 'not-allowed', color: '#9ca3af' }} />
          <div style={{ fontSize: '12px', color: '#92400e', marginTop: '4px', fontStyle: 'italic' }}>This will replace the [Info] placeholders in the preview</div>
        </div>
      )}

      {/* Category buttons + add new */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px', alignItems: 'center' }}>
        {categories.map((category: string) => (
          <button key={category} onClick={() => handleCategoryChange(category)}
            style={{
              backgroundColor: data.category === category ? '#f59e0b' : 'white',
              color: data.category === category ? 'white' : '#f59e0b',
              border: '2px solid #f59e0b', borderRadius: '6px', padding: '6px 12px',
              fontSize: '12px', fontWeight: '600', cursor: 'pointer',
              transition: 'all 0.2s ease', whiteSpace: 'nowrap'
            }}>
            {category}
          </button>
        ))}
        {onAddButton && (
          <button onClick={() => setShowNewButtonModal(true)} title="Add a new button to this section"
            style={{ backgroundColor: 'white', color: '#f59e0b', border: '2px dashed #f59e0b', borderRadius: '6px', padding: '6px 10px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', lineHeight: 1 }}>
            +
          </button>
        )}
      </div>

      {/* New button modal */}
      {showNewButtonModal && (
        <div style={{ backgroundColor: 'white', border: '1px solid #d1d5db', borderRadius: '8px', padding: '12px', marginBottom: '12px' }}>
          <div style={{ fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>Add new button</div>
          <input type="text" value={newButtonName} onChange={e => setNewButtonName(e.target.value)}
            placeholder="Button name (e.g. Sport, Music)..."
            style={{ width: '100%', padding: '6px 8px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '13px', marginBottom: '8px', boxSizing: 'border-box' }} />
          <textarea value={newButtonFirstOption} onChange={e => setNewButtonFirstOption(e.target.value)}
            placeholder="First comment option... Use [Name] for pupil name."
            style={{ width: '100%', padding: '6px 8px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '13px', minHeight: '60px', resize: 'vertical', boxSizing: 'border-box', marginBottom: '8px' }} />
          <div style={{ display: 'flex', gap: '6px' }}>
            <button onClick={() => setShowNewButtonModal(false)} style={actionBtnStyle('#6b7280')}>Cancel</button>
            <button onClick={handleConfirmNewButton} disabled={!newButtonName.trim() || !newButtonFirstOption.trim()}
              style={{ ...actionBtnStyle('#f59e0b'), opacity: (!newButtonName.trim() || !newButtonFirstOption.trim()) ? 0.4 : 1 }}>
              Add Button
            </button>
          </div>
        </div>
      )}

      {/* Edit toggle */}
      {hasSelectedComment && (
        <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: showEditComment ? '12px' : '0' }}>
          <button onClick={() => setShowEditComment(!showEditComment)}
            style={{ backgroundColor: showEditComment ? '#f59e0b' : '#e5e7eb', color: showEditComment ? 'white' : '#6b7280', border: 'none', borderRadius: '4px', padding: '4px 8px', fontSize: '12px', cursor: 'pointer', fontWeight: '500' }}>
            {showEditComment ? '- Edit Comment' : '+ Edit Comment'}
          </button>
        </div>
      )}

      {/* Edit panel */}
      {showEditComment && hasSelectedComment && (
        <div style={{ backgroundColor: 'white', border: '1px solid #d1d5db', borderRadius: '6px', padding: '8px', marginBottom: '12px' }}>
          <textarea value={editableComment} onChange={(e) => setEditableComment(e.target.value)}
            placeholder="Edit the comment to better suit this student..."
            style={{ width: '100%', minHeight: '50px', padding: '6px', border: 'none', borderRadius: '4px', resize: 'vertical', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
          <div style={{ fontSize: '11px', color: '#6b7280', fontStyle: 'italic', marginTop: '4px', marginBottom: '8px' }}>
            Edit the generated comment or add additional notes
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
          {showAddToNewModal && (
            <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#f9fafb', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
              <div style={{ fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>New button name:</div>
              <input type="text" value={addToNewButtonName} onChange={e => setAddToNewButtonName(e.target.value)}
                placeholder="e.g. Athletics..."
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

export default PersonalisedCommentSection;