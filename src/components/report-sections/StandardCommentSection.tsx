import React, { useState, useEffect } from 'react';
import { TemplateSection } from '../../types';
import InlineEditableTitle from './InlineEditableTitle';
import HeaderStylePicker from './HeaderStylePicker';

interface StandardCommentSectionProps {
  section: TemplateSection;
  data: any;
  updateSectionData: (sectionId: string, data: any) => void;
  onTemplateAction?: (action: any) => void;
  onRenameSection?: (sectionId: string, newName: string) => void;
  globalPronoun?: string;
}

const StandardCommentSection: React.FC<StandardCommentSectionProps> = ({
  section,
  data,
  updateSectionData,
  onTemplateAction,
  onRenameSection,
  globalPronoun,
}) => {
  const [showEditComment, setShowEditComment] = useState(false);
  const [editableComment, setEditableComment] = useState('');

  useEffect(() => {
    setEditableComment(data.comment || section.data?.content || '');
  }, [data.comment, section.data?.content]);

  const actionBtnStyle = (color: string): React.CSSProperties => ({
    backgroundColor: color, color: 'white', border: 'none', borderRadius: '4px',
    padding: '4px 8px', fontSize: '11px', cursor: 'pointer', fontWeight: '500', whiteSpace: 'nowrap',
  });

  const handleSaveEditedComment = () => {
    updateSectionData(section.id, { comment: editableComment });
    setShowEditComment(false);
  };

  const handleCancelEditComment = () => {
    setEditableComment(data.comment || section.data?.content || '');
    setShowEditComment(false);
  };

  const handleReplaceInTemplate = () => {
    if (!onTemplateAction) return;
    onTemplateAction({ type: 'replace', sectionId: section.id, commentText: editableComment });
    updateSectionData(section.id, { comment: editableComment });
    setShowEditComment(false);
  };

  return (
    <div style={{
      border: '2px solid #10b981',
      borderRadius: '8px',
      padding: '16px',
      marginBottom: '16px',
      backgroundColor: '#ecfdf5'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <InlineEditableTitle name={section.name} defaultName="Standard Comment" color="#047857" onRename={onRenameSection ? (n) => onRenameSection(section.id, n) : undefined} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <HeaderStylePicker showHeader={data.showHeader !== false} headerStyle={data.headerStyle || section.data?.headerStyle || 'inline'} onChange={(show, style) => updateSectionData(section.id, { showHeader: show, headerStyle: style })} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <input
              type="checkbox"
              checked={data.exclude || false}
              onChange={(e) => updateSectionData(section.id, { exclude: e.target.checked })}
              style={{ width: '14px', height: '14px', cursor: 'pointer' }}
            />
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
              padding: '2px 8px', border: '1px solid #10b981', borderRadius: '4px',
              fontSize: '11px', fontWeight: '600', cursor: 'pointer',
              backgroundColor: (data.pronounOverride || '') === opt.value ? '#10b981' : 'white',
              color: (data.pronounOverride || '') === opt.value ? 'white' : '#10b981',
            }}>
            {opt.label}
          </button>
        ))}
      </div>

      {/* Edit toggle — always visible since this statement is always on the report */}
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

      {/* Edit panel */}
      {showEditComment && (
        <div style={{ backgroundColor: 'white', border: '1px solid #d1d5db', borderRadius: '6px', padding: '8px' }}>
          <textarea value={editableComment} onChange={(e) => setEditableComment(e.target.value)}
            placeholder="Edit the comment to better suit this student..."
            style={{ width: '100%', minHeight: '60px', padding: '6px', border: 'none', borderRadius: '4px', resize: 'vertical', fontSize: '14px', outline: 'none' }} />
          <div style={{ fontSize: '11px', color: '#6b7280', fontStyle: 'italic', marginTop: '4px', marginBottom: '8px' }}>
            Tip: Use [Name] to insert the student's name automatically
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            <button onClick={handleCancelEditComment} style={actionBtnStyle('#6b7280')}>Cancel</button>
            <button onClick={handleSaveEditedComment} style={actionBtnStyle('#3b82f6')}>Save</button>
            {onTemplateAction && (
              <button onClick={handleReplaceInTemplate} style={actionBtnStyle('#8b5cf6')}>Replace in template</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default StandardCommentSection;
