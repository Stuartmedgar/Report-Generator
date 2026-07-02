import React, { useState, useEffect } from 'react';
import InlineEditableTitle from './InlineEditableTitle';
import HeaderStylePicker from './HeaderStylePicker';

interface RatedCommentSectionProps {
  section: any;
  data: any;
  updateSectionData: (sectionId: string, data: any) => void;
  onTemplateAction?: (action: any) => void;
  onRenameSection?: (sectionId: string, newName: string) => void;
  globalPronoun?: string;
}

const RatedCommentSection: React.FC<RatedCommentSectionProps> = ({
  section,
  data,
  updateSectionData,
  onTemplateAction,
  onRenameSection,
  globalPronoun,
}) => {
  const [showEditComment, setShowEditComment] = useState(false);
  const [editableComment, setEditableComment] = useState('');
  const [showAddToNewModal, setShowAddToNewModal] = useState(false);
  const [addToNewButtonName, setAddToNewButtonName] = useState('');

  useEffect(() => {
    if (data.selectedComment) {
      setEditableComment(data.customEditedComment || data.selectedComment);
    }
  }, [data.selectedComment, data.customEditedComment]);

  const handleRatingChange = (rating: string) => {
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

  const ratings = [
    { value: 'excellent', label: 'Excellent', color: '#10b981' },
    { value: 'good', label: 'Good', color: '#3b82f6' },
    { value: 'satisfactory', label: 'Satisfactory', color: '#f59e0b' },
    { value: 'needsImprovement', label: 'Needs Improvement', color: '#ef4444' }
  ];

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
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
        {ratings.map((rating) => (
          <button key={rating.value} onClick={() => handleRatingChange(rating.value)}
            style={{
              backgroundColor: data.rating === rating.value ? rating.color : 'white',
              color: data.rating === rating.value ? 'white' : rating.color,
              border: `2px solid ${rating.color}`,
              borderRadius: '6px', padding: '6px 12px', fontSize: '12px',
              fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s ease', whiteSpace: 'nowrap'
            }}>
            {rating.label}
          </button>
        ))}
        <button onClick={() => handleRatingChange('no-comment')}
          style={{
            backgroundColor: data.rating === 'no-comment' ? '#6b7280' : 'white',
            color: data.rating === 'no-comment' ? 'white' : '#6b7280',
            border: '2px solid #6b7280', borderRadius: '6px', padding: '6px 12px',
            fontSize: '12px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap'
          }}>
          No Comment
        </button>
      </div>

      {/* Edit toggle */}
      {hasSelectedComment && (
        <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: showEditComment ? '12px' : '0' }}>
          <button onClick={() => setShowEditComment(!showEditComment)}
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
      {showEditComment && hasSelectedComment && (
        <div style={{ backgroundColor: 'white', border: '1px solid #d1d5db', borderRadius: '6px', padding: '8px' }}>
          <textarea value={editableComment} onChange={(e) => setEditableComment(e.target.value)}
            placeholder="Edit the comment to better suit this student..."
            style={{ width: '100%', minHeight: '50px', padding: '6px', border: 'none', borderRadius: '4px', resize: 'vertical', fontSize: '14px', outline: 'none' }} />
          <div style={{ fontSize: '11px', color: '#6b7280', fontStyle: 'italic', marginTop: '4px', marginBottom: '8px' }}>
            Edit the generated comment or add additional notes
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            <button onClick={handleCancelEditComment} style={actionBtnStyle('#6b7280')}>Cancel</button>
            <button onClick={handleSaveEditedComment} style={actionBtnStyle('#3b82f6')}>Save</button>
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