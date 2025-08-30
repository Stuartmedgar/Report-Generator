import React, { useState, useEffect } from 'react';

interface RatedCommentSectionProps {
  section: any;
  data: any;
  updateSectionData: (sectionId: string, data: any) => void;
}

const RatedCommentSection: React.FC<RatedCommentSectionProps> = ({
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

  const handleRatingChange = (rating: string) => {
    // Warn about losing edits if they exist and rating is different
    if (rating !== data.rating && data.customEditedComment) {
      const shouldContinue = window.confirm(
        'Changing the rating will replace your custom edits with a new generated comment. Continue?'
      );
      if (!shouldContinue) {
        return;
      }
    }

    // ONLY pass the rating - your useReportLogic will handle comment selection automatically
    // Don't try to select the comment here - let useReportLogic do it
    updateSectionData(section.id, { 
      rating,
      customEditedComment: undefined // Clear custom edits when rating changes
    });
    
    // Close edit box if open
    setShowEditComment(false);
  };

  const handleSaveEditedComment = () => {
    updateSectionData(section.id, { 
      customEditedComment: editableComment 
    });
    setShowEditComment(false);
  };

  const handleCancelEditComment = () => {
    // Reset to original selected comment
    setEditableComment(data.selectedComment || '');
    setShowEditComment(false);
  };

  const ratings = [
    { value: 'excellent', label: 'Excellent', color: '#10b981' },
    { value: 'good', label: 'Good', color: '#3b82f6' },
    { value: 'satisfactory', label: 'Satisfactory', color: '#f59e0b' },
    { value: 'needsImprovement', label: 'Needs Improvement', color: '#ef4444' }
  ];

  const hasSelectedComment = data.selectedComment && data.rating && data.rating !== 'no-comment';

  return (
    <div style={{
      border: '2px solid #3b82f6',
      borderRadius: '8px',
      padding: '16px',
      marginBottom: '16px',
      backgroundColor: '#eff6ff'
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
          color: '#1e40af',
          margin: 0
        }}>
          {section.name || 'Rated Comment'}
        </h3>
        
        {/* Header Options */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <input
              type="checkbox"
              checked={data.showHeader !== false}
              onChange={(e) => updateSectionData(section.id, { showHeader: e.target.checked })}
              style={{
                width: '14px',
                height: '14px',
                cursor: 'pointer'
              }}
            />
            <span style={{
              fontSize: '12px',
              color: '#6b7280',
              fontWeight: '500'
            }}>
              Header
            </span>
          </div>
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <input
              type="checkbox"
              checked={data.exclude || false}
              onChange={(e) => updateSectionData(section.id, { exclude: e.target.checked })}
              style={{
                width: '14px',
                height: '14px',
                cursor: 'pointer'
              }}
            />
            <span style={{
              fontSize: '12px',
              color: '#6b7280',
              fontWeight: '500'
            }}>
              Exclude
            </span>
          </div>
        </div>
      </div>

      {/* Rating Buttons */}
      <div style={{
        display: 'flex',
        gap: '8px',
        flexWrap: 'wrap',
        marginBottom: '8px'
      }}>
        {ratings.map((rating) => (
          <button
            key={rating.value}
            onClick={() => handleRatingChange(rating.value)}
            style={{
              backgroundColor: data.rating === rating.value ? rating.color : 'white',
              color: data.rating === rating.value ? 'white' : rating.color,
              border: `2px solid ${rating.color}`,
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
            {rating.label}
          </button>
        ))}
        
        {/* No Comment Button */}
        <button
          onClick={() => handleRatingChange('no-comment')}
          style={{
            backgroundColor: data.rating === 'no-comment' ? '#6b7280' : 'white',
            color: data.rating === 'no-comment' ? 'white' : '#6b7280',
            border: '2px solid #6b7280',
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
          No Comment
        </button>
      </div>

      {/* Edit Comment Toggle - Only show if there's a selected comment */}
      {hasSelectedComment && (
        <div style={{
          display: 'flex',
          justifyContent: 'flex-start',
          marginBottom: showEditComment ? '12px' : '0'
        }}>
          <button
            onClick={() => setShowEditComment(!showEditComment)}
            style={{
              backgroundColor: showEditComment ? '#10b981' : '#e5e7eb',
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
          padding: '8px'
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
              outline: 'none'
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
          
          {/* Action buttons on the left */}
          <div style={{
            display: 'flex',
            justifyContent: 'flex-start',
            gap: '6px'
          }}>
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
                backgroundColor: '#3b82f6',
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

export default RatedCommentSection;