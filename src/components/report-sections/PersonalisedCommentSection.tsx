import React, { useState, useEffect } from 'react';

interface PersonalisedCommentSectionProps {
  section: any;
  data: any;
  updateSectionData: (sectionId: string, data: any) => void;
}

// Helper to find numbered [Info N] placeholders in a comment string
function getInfoPlaceholders(comment: string): string[] {
  const found: string[] = [];
  const regex = /\[Info (\d+)\]/gi;
  let match;
  const seen = new Set<string>();
  while ((match = regex.exec(comment)) !== null) {
    const key = `Info ${match[1]}`;
    if (!seen.has(key)) {
      seen.add(key);
      found.push(key);
    }
  }
  // Legacy fallback — old single placeholder format
  if (found.length === 0 && /\[(personalised information|personal information|information)\]/i.test(comment)) {
    found.push('Info 1');
  }
  return found;
}

const PersonalisedCommentSection: React.FC<PersonalisedCommentSectionProps> = ({
  section,
  data,
  updateSectionData
}) => {
  const [showEditComment, setShowEditComment] = useState(false);
  const [editableComment, setEditableComment] = useState('');

  // Update editable comment when selected comment changes
  useEffect(() => {
    if (data.selectedComment) {
      setEditableComment(data.customEditedComment || data.selectedComment);
    }
  }, [data.selectedComment, data.customEditedComment]);

  const handleCategoryChange = (category: string) => {
    // Warn about losing edits if they exist and category is different
    if (category !== data.category && data.customEditedComment && data.customEditedComment !== data.selectedComment) {
      const shouldContinue = window.confirm(
        'Changing the category will replace your custom edits with a new generated comment. Continue?'
      );
      if (!shouldContinue) return;
    }
    updateSectionData(section.id, {
      category,
      customEditedComment: undefined
    });
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

  const categories = section.data?.headings || Object.keys(section.data?.categories || section.data?.comments || {});
  const hasSelectedComment = data.selectedComment && data.category;

  // Work out which placeholders the currently selected comment needs
  const selectedComment = data.customEditedComment || data.selectedComment || '';
  const placeholders = getInfoPlaceholders(selectedComment);

  return (
    <div style={{
      border: '2px solid #f59e0b',
      borderRadius: '8px',
      padding: '16px',
      marginBottom: '16px',
      backgroundColor: '#fffbeb'
    }}>
      {/* Compact Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '12px'
      }}>
        <h3 style={{
          fontSize: '16px',
          fontWeight: '600',
          color: '#d97706',
          margin: 0
        }}>
          {section.name}
        </h3>

        {/* Header / Exclude Options */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <input
              type="checkbox"
              checked={data.showHeader !== false}
              onChange={(e) => updateSectionData(section.id, { showHeader: e.target.checked })}
              style={{ width: '14px', height: '14px', cursor: 'pointer' }}
            />
            <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>Header</span>
          </div>
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

      {/* Instruction */}
      {section.data?.instruction && (
        <div style={{
          fontSize: '13px',
          color: '#92400e',
          marginBottom: '12px',
          padding: '8px',
          backgroundColor: 'rgba(245, 158, 11, 0.1)',
          borderRadius: '4px',
          border: '1px solid rgba(245, 158, 11, 0.2)'
        }}>
          <strong>Instructions:</strong> {section.data.instruction}
        </div>
      )}

      {/* Dynamic Info Input Fields */}
      {hasSelectedComment && placeholders.length > 0 ? (
        <div style={{ marginBottom: '12px' }}>
          {placeholders.map((key) => (
            <div key={key} style={{ marginBottom: '10px' }}>
              <label style={{
                fontSize: '14px',
                fontWeight: '500',
                color: '#d97706',
                marginBottom: '6px',
                display: 'block'
              }}>
                {key}:
              </label>
              <input
                type="text"
                value={(data.infoValues || {})[key] || ''}
                onChange={e => handleInfoChange(key, e.target.value)}
                placeholder={`Enter ${key.toLowerCase()}...`}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '2px solid #fbbf24',
                  borderRadius: '6px',
                  fontSize: '14px',
                  outline: 'none',
                  backgroundColor: 'white',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          ))}
          <div style={{ fontSize: '12px', color: '#92400e', fontStyle: 'italic' }}>
            This will replace the [Info] placeholders in the preview
          </div>
        </div>
      ) : !hasSelectedComment && (
        // Before a comment is selected, show the instruction label and a disabled input
        // so the teacher knows a field will appear once they pick a category
        <div style={{ marginBottom: '12px' }}>
          <label style={{
            fontSize: '14px',
            fontWeight: '500',
            color: '#d97706',
            marginBottom: '6px',
            display: 'block'
          }}>
            {section.data?.instruction || 'Enter personalised information:'}
          </label>
          <input
            type="text"
            disabled
            placeholder="Select a category below first..."
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '2px solid #fbbf24',
              borderRadius: '6px',
              fontSize: '14px',
              outline: 'none',
              backgroundColor: '#fef9ec',
              boxSizing: 'border-box',
              cursor: 'not-allowed',
              color: '#9ca3af'
            }}
          />
          <div style={{ fontSize: '12px', color: '#92400e', marginTop: '4px', fontStyle: 'italic' }}>
            This will replace the [Info] placeholders in the preview
          </div>
        </div>
      )}

      {/* Category Selection */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
        {categories.map((category: string) => (
          <button
            key={category}
            onClick={() => handleCategoryChange(category)}
            style={{
              backgroundColor: data.category === category ? '#f59e0b' : 'white',
              color: data.category === category ? 'white' : '#f59e0b',
              border: '2px solid #f59e0b',
              borderRadius: '6px',
              padding: '6px 12px',
              fontSize: '12px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              minWidth: 'auto',
              whiteSpace: 'nowrap'
            }}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Edit Comment Toggle - only show if there's a selected comment */}
      {hasSelectedComment && (
        <div style={{
          display: 'flex',
          justifyContent: 'flex-start',
          marginBottom: showEditComment ? '12px' : '0'
        }}>
          <button
            onClick={() => setShowEditComment(!showEditComment)}
            style={{
              backgroundColor: showEditComment ? '#f59e0b' : '#e5e7eb',
              color: showEditComment ? 'white' : '#6b7280',
              border: 'none',
              borderRadius: '4px',
              padding: '4px 8px',
              fontSize: '12px',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            {showEditComment ? '- Edit Comment' : '+ Edit Comment'}
          </button>
        </div>
      )}

      {/* Collapsible Comment Editor */}
      {showEditComment && hasSelectedComment && (
        <div style={{
          backgroundColor: 'white',
          border: '1px solid #d1d5db',
          borderRadius: '6px',
          padding: '8px',
          marginBottom: '12px'
        }}>
          <textarea
            value={editableComment}
            onChange={(e) => setEditableComment(e.target.value)}
            placeholder="Edit the comment to better suit this student..."
            style={{
              width: '100%',
              minHeight: '50px',
              padding: '6px',
              border: 'none',
              borderRadius: '4px',
              resize: 'vertical',
              fontSize: '14px',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
          <div style={{
            fontSize: '11px',
            color: '#6b7280',
            fontStyle: 'italic',
            marginTop: '4px',
            marginBottom: '8px'
          }}>
            Edit the generated comment or add additional notes
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-start', gap: '6px' }}>
            <button
              onClick={handleCancelEditComment}
              style={{
                backgroundColor: '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                padding: '4px 8px',
                fontSize: '11px',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSaveEditedComment}
              style={{
                backgroundColor: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                padding: '4px 8px',
                fontSize: '11px',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PersonalisedCommentSection;