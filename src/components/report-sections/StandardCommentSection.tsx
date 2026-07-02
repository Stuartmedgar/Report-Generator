import React, { useState } from 'react';
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
  const [isExpanded, setIsExpanded] = useState(false);
  const [replaceConfirmed, setReplaceConfirmed] = useState(false);

  const currentComment = data.comment || section.data?.content || '';

  const handleReplaceInTemplate = () => {
    if (!onTemplateAction || !currentComment.trim()) return;
    onTemplateAction({
      type: 'replace',
      sectionId: section.id,
      commentText: currentComment,
    });
    setReplaceConfirmed(true);
    setTimeout(() => setReplaceConfirmed(false), 2000);
  };

  return (
    <div style={{
      border: '2px solid #10b981',
      borderRadius: '8px',
      padding: '16px',
      marginBottom: '16px',
      backgroundColor: '#ecfdf5'
    }}>
      {/* Compact Header with Preview */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: isExpanded ? '12px' : '0'
      }}>
        <div style={{ flex: 1 }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '4px'
          }}>
            <InlineEditableTitle name={section.name} defaultName="Standard Comment" color="#047857" onRename={onRenameSection ? (n) => onRenameSection(section.id, n) : undefined} />

            {/* Header Options */}
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

              <button
                onClick={() => setIsExpanded(!isExpanded)}
                style={{
                  backgroundColor: isExpanded ? '#10b981' : '#e5e7eb',
                  color: isExpanded ? 'white' : '#6b7280',
                  border: 'none', borderRadius: '4px', padding: '4px 8px',
                  fontSize: '12px', cursor: 'pointer', fontWeight: '500'
                }}
              >
                {isExpanded ? 'Collapse' : 'Edit'}
              </button>
            </div>
          </div>

          {/* Compact Preview */}
          {!isExpanded && (
            <div style={{
              fontSize: '12px', color: '#6b7280', fontStyle: 'italic',
              backgroundColor: 'white', padding: '6px 8px',
              borderRadius: '4px', border: '1px solid #d1d5db'
            }}>
              {(section.data?.content || 'Click Edit to add template content...').substring(0, 80)}
              {(section.data?.content || '').length > 80 ? '...' : ''}
            </div>
          )}
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

      {/* Expandable Edit Area */}
      {isExpanded && (
        <div>
          <textarea
            value={currentComment}
            onChange={(e) => updateSectionData(section.id, { comment: e.target.value })}
            placeholder="Enter standard comment (use [Name] for student name)..."
            style={{
              width: '100%', minHeight: '60px', padding: '8px',
              border: '1px solid #d1d5db', borderRadius: '6px',
              resize: 'vertical', fontSize: '14px', outline: 'none',
              boxSizing: 'border-box',
            }}
          />
          <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px', fontStyle: 'italic', marginBottom: '8px' }}>
            Tip: Use [Name] to insert student's name automatically
          </div>

          {/* Replace in template */}
          {onTemplateAction && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={handleReplaceInTemplate}
                style={{
                  backgroundColor: replaceConfirmed ? '#10b981' : '#8b5cf6',
                  color: 'white', border: 'none', borderRadius: '4px',
                  padding: '4px 10px', fontSize: '11px', cursor: 'pointer', fontWeight: '500',
                }}
              >
                {replaceConfirmed ? '✓ Saved to template' : 'Replace in template'}
              </button>
              <span style={{ fontSize: '11px', color: '#6b7280', fontStyle: 'italic' }}>
                Updates this comment for all future students in this session
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StandardCommentSection;