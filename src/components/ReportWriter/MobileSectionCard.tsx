import React from 'react';

interface MobileSectionCardProps {
  section: any;
  sectionData: any;
  updateSectionData: (sectionId: string, data: any) => void;
}

const MobileSectionCard: React.FC<MobileSectionCardProps> = ({ section, sectionData, updateSectionData }) => {
  const data = sectionData[section.id] || {};

  // State for all editing functionality - moved to component level
  const [showEditComment, setShowEditComment] = React.useState(false);
  const [editableComment, setEditableComment] = React.useState('');
  const [showEditSuggestion, setShowEditSuggestion] = React.useState(false);
  const [editableSuggestion, setEditableSuggestion] = React.useState('');
  const [showOptionalComment, setShowOptionalComment] = React.useState(!!data.comment);

  // Effect to sync editable content when data changes
  React.useEffect(() => {
    if (data.selectedComment) {
      setEditableComment(data.customEditedComment || data.selectedComment);
    }
    if (data.selectedSuggestion) {
      setEditableSuggestion(data.customEditedSuggestion || data.selectedSuggestion);
    }
    // Update optional comment state when data changes
    setShowOptionalComment(!!data.comment);
  }, [data.selectedComment, data.customEditedComment, data.selectedSuggestion, data.customEditedSuggestion, data.comment]);

  const getSectionColor = (type: string) => {
    switch (type) {
      case 'rated-comment': return { bg: '#f0f9ff', border: '#0ea5e9', text: '#0369a1' };
      case 'assessment-comment': return { bg: '#f0fdf4', border: '#10b981', text: '#059669' };
      case 'personalised-comment': return { bg: '#fffbeb', border: '#f59e0b', text: '#d97706' };
      case 'next-steps': return { bg: '#ecfeff', border: '#06b6d4', text: '#0891b2' };
      case 'standard-comment': return { bg: '#f8fafc', border: '#64748b', text: '#475569' };
      case 'optional-additional-comment': return { bg: '#fdf4ff', border: '#a855f7', text: '#9333ea' };
      default: return { bg: '#f8fafc', border: '#64748b', text: '#475569' };
    }
  };

  const colors = getSectionColor(section.type);

  const handleSaveEditedComment = () => {
    updateSectionData(section.id, { customEditedComment: editableComment });
    setShowEditComment(false);
  };

  const handleCancelEditComment = () => {
    setEditableComment(data.selectedComment || '');
    setShowEditComment(false);
  };

  const handleSaveEditedSuggestion = () => {
    updateSectionData(section.id, { customEditedSuggestion: editableSuggestion });
    setShowEditSuggestion(false);
  };

  const handleCancelEditSuggestion = () => {
    setEditableSuggestion(data.selectedSuggestion || '');
    setShowEditSuggestion(false);
  };

  const renderEditableCommentBox = (editButtonColor: string) => {
    const comment = data.customEditedComment || data.selectedComment;

    if (!showEditComment) {
      return (
        <div style={{
          backgroundColor: '#f8fafc',
          padding: '6px',
          borderRadius: '4px',
          border: '1px solid #e5e7eb',
          marginTop: '6px',
          textAlign: 'center'
        }}>
          <button
            onClick={() => {
              setEditableComment(comment || '');
              setShowEditComment(true);
            }}
            style={{
              backgroundColor: editButtonColor,
              color: 'white',
              border: 'none',
              padding: '4px 8px',
              borderRadius: '3px',
              fontSize: '10px',
              cursor: 'pointer'
            }}
          >
            {comment ? 'View & Edit Comment' : 'Add Comment'}
          </button>
        </div>
      );
    }

    return (
      <div style={{
        backgroundColor: '#f8fafc',
        padding: '8px',
        borderRadius: '4px',
        border: '1px solid #e5e7eb',
        marginTop: '6px'
      }}>
        <textarea
          value={editableComment}
          onChange={(e) => setEditableComment(e.target.value)}
          style={{
            width: '100%',
            minHeight: '80px',
            padding: '6px',
            border: '1px solid #d1d5db',
            borderRadius: '3px',
            fontSize: '11px',
            fontFamily: 'inherit',
            resize: 'vertical',
            marginBottom: '6px',
            textAlign: 'left'
          }}
        />
        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            onClick={handleSaveEditedComment}
            style={{
              backgroundColor: '#10b981',
              color: 'white',
              border: 'none',
              padding: '3px 6px',
              borderRadius: '3px',
              fontSize: '9px',
              cursor: 'pointer'
            }}
          >
            Save
          </button>
          <button
            onClick={handleCancelEditComment}
            style={{
              backgroundColor: '#6b7280',
              color: 'white',
              border: 'none',
              padding: '3px 6px',
              borderRadius: '3px',
              fontSize: '9px',
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    );
  };

  const renderEditableSuggestionBox = () => {
    const suggestion = data.customEditedSuggestion || data.selectedSuggestion;

    if (!showEditSuggestion) {
      return (
        <div style={{
          backgroundColor: '#f8fafc',
          padding: '6px',
          borderRadius: '4px',
          border: '1px solid #e5e7eb',
          marginTop: '6px',
          textAlign: 'center'
        }}>
          <button
            onClick={() => {
              setEditableSuggestion(suggestion || '');
              setShowEditSuggestion(true);
            }}
            style={{
              backgroundColor: '#06b6d4',
              color: 'white',
              border: 'none',
              padding: '4px 8px',
              borderRadius: '3px',
              fontSize: '10px',
              cursor: 'pointer'
            }}
          >
            {suggestion ? 'View & Edit Suggestion' : 'Add Suggestion'}
          </button>
        </div>
      );
    }

    return (
      <div style={{
        backgroundColor: '#f8fafc',
        padding: '8px',
        borderRadius: '4px',
        border: '1px solid #e5e7eb',
        marginTop: '6px'
      }}>
        <textarea
          value={editableSuggestion}
          onChange={(e) => setEditableSuggestion(e.target.value)}
          style={{
            width: '100%',
            minHeight: '80px',
            padding: '6px',
            border: '1px solid #d1d5db',
            borderRadius: '3px',
            fontSize: '11px',
            fontFamily: 'inherit',
            resize: 'vertical',
            marginBottom: '6px',
            textAlign: 'left'
          }}
        />
        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            onClick={handleSaveEditedSuggestion}
            style={{
              backgroundColor: '#10b981',
              color: 'white',
              border: 'none',
              padding: '3px 6px',
              borderRadius: '3px',
              fontSize: '9px',
              cursor: 'pointer'
            }}
          >
            Save
          </button>
          <button
            onClick={handleCancelEditSuggestion}
            style={{
              backgroundColor: '#6b7280',
              color: 'white',
              border: 'none',
              padding: '3px 6px',
              borderRadius: '3px',
              fontSize: '9px',
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    );
  };

  const renderRatedComment = () => {
    const ratings = [
      { value: 'excellent', label: 'Excellent', color: '#10b981' },
      { value: 'good', label: 'Good', color: '#3b82f6' },
      { value: 'satisfactory', label: 'Satisfactory', color: '#f59e0b' },
      { value: 'needsImprovement', label: 'Needs Improvement', color: '#ef4444' }
    ];

    return (
      <div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '6px' }}>
          {ratings.map((rating) => (
            <button
              key={rating.value}
              onClick={() => updateSectionData(section.id, { rating: rating.value })}
              style={{
                backgroundColor: data.rating === rating.value ? rating.color : 'white',
                color: data.rating === rating.value ? 'white' : rating.color,
                border: `1px solid ${rating.color}`,
                padding: '6px 8px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: '600',
                cursor: 'pointer',
                flex: '1 1 calc(50% - 2px)',
                minWidth: '80px',
                textAlign: 'center'
              }}
            >
              {rating.label}
            </button>
          ))}
        </div>
        
        {/* Only show comment box if rating is selected and not excluded */}
        {data.rating && data.rating !== 'no-comment' && data.selectedComment && 
          renderEditableCommentBox('#3b82f6')
        }
      </div>
    );
  };

  const renderAssessmentComment = () => {
    const performances = [
      { value: 'excellent', label: 'Excellent', color: '#10b981' },
      { value: 'good', label: 'Good', color: '#3b82f6' },
      { value: 'satisfactory', label: 'Satisfactory', color: '#f59e0b' },
      { value: 'needsImprovement', label: 'Needs Improvement', color: '#ef4444' }
    ];

    return (
      <div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '6px' }}>
          {performances.map((performance) => (
            <button
              key={performance.value}
              onClick={() => updateSectionData(section.id, { performance: performance.value })}
              style={{
                backgroundColor: data.performance === performance.value ? performance.color : 'white',
                color: data.performance === performance.value ? 'white' : performance.color,
                border: `1px solid ${performance.color}`,
                padding: '6px 8px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: '600',
                cursor: 'pointer',
                flex: '1 1 calc(50% - 2px)',
                minWidth: '80px',
                textAlign: 'center'
              }}
            >
              {performance.label}
            </button>
          ))}
        </div>
        
        {/* Only show comment box if performance is selected and not excluded */}
        {data.performance && data.performance !== 'no-comment' && data.selectedComment && 
          renderEditableCommentBox('#10b981')
        }
      </div>
    );
  };

  const renderPersonalisedComment = () => {
    const categories = section.data?.headings || Object.keys(section.data?.categories || section.data?.comments || {});
    
    return (
      <div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '6px' }}>
          {categories.map((category: string) => (
            <button
              key={category}
              onClick={() => updateSectionData(section.id, { category })}
              style={{
                backgroundColor: data.category === category ? '#f59e0b' : 'white',
                color: data.category === category ? 'white' : '#f59e0b',
                border: '1px solid #f59e0b',
                padding: '6px 8px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: '600',
                cursor: 'pointer',
                flex: '1 1 auto',
                textAlign: 'center'
              }}
            >
              {category}
            </button>
          ))}
        </div>
        
        {/* Only show comment box if category is selected and not excluded */}
        {data.category && data.selectedComment && 
          renderEditableCommentBox('#f59e0b')
        }
      </div>
    );
  };

  const renderNextSteps = () => {
    const focusAreas = section.data?.headings || Object.keys(section.data?.focusAreas || section.data?.comments || {});
    
    return (
      <div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '6px' }}>
          {focusAreas.map((area: string) => (
            <button
              key={area}
              onClick={() => updateSectionData(section.id, { focusArea: area })}
              style={{
                backgroundColor: data.focusArea === area ? '#06b6d4' : 'white',
                color: data.focusArea === area ? 'white' : '#06b6d4',
                border: '1px solid #06b6d4',
                padding: '6px 8px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: '600',
                cursor: 'pointer',
                flex: '1 1 auto',
                textAlign: 'center'
              }}
            >
              {area}
            </button>
          ))}
        </div>
        
        {/* Only show suggestion box if focus area is selected and not excluded */}
        {data.focusArea && data.selectedSuggestion && 
          renderEditableSuggestionBox()
        }
      </div>
    );
  };

  const renderStandardComment = () => {
    const content = data.content || section.data?.content || '';
    const displayContent = content.replace(/\[Name\]/g, 'Student');
    
    // Show first 60 characters as preview
    const previewText = displayContent.length > 60 
      ? displayContent.substring(0, 60) + '...' 
      : displayContent;
    
    if (!showEditComment) {
      return (
        <div style={{
          backgroundColor: '#f8fafc',
          padding: '8px',
          borderRadius: '4px',
          fontSize: '11px',
          color: '#374151',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ 
            marginBottom: '6px',
            textAlign: 'left',
            lineHeight: '1.3'
          }}>
            {previewText || 'No content set'}
          </div>
          <button
            onClick={() => {
              setEditableComment(content);
              setShowEditComment(true);
            }}
            style={{
              backgroundColor: '#64748b',
              color: 'white',
              border: 'none',
              padding: '3px 6px',
              borderRadius: '3px',
              fontSize: '9px',
              cursor: 'pointer'
            }}
          >
            {content ? '📖 View & Edit' : '✏️ Add Content'}
          </button>
        </div>
      );
    }

    return (
      <div style={{
        backgroundColor: '#f8fafc',
        padding: '8px',
        borderRadius: '4px',
        border: '1px solid #e5e7eb'
      }}>
        <textarea
          value={editableComment}
          onChange={(e) => setEditableComment(e.target.value)}
          placeholder="Enter the standard comment content here..."
          style={{
            width: '100%',
            minHeight: '100px',
            padding: '6px',
            border: '1px solid #d1d5db',
            borderRadius: '3px',
            fontSize: '11px',
            fontFamily: 'inherit',
            resize: 'vertical',
            marginBottom: '6px',
            textAlign: 'left'
          }}
        />
        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            onClick={() => {
              updateSectionData(section.id, { content: editableComment });
              setShowEditComment(false);
            }}
            style={{
              backgroundColor: '#10b981',
              color: 'white',
              border: 'none',
              padding: '3px 6px',
              borderRadius: '3px',
              fontSize: '9px',
              cursor: 'pointer'
            }}
          >
            ✓ Save
          </button>
          <button
            onClick={() => {
              setEditableComment(content);
              setShowEditComment(false);
            }}
            style={{
              backgroundColor: '#6b7280',
              color: 'white',
              border: 'none',
              padding: '3px 6px',
              borderRadius: '3px',
              fontSize: '9px',
              cursor: 'pointer'
            }}
          >
            ✗ Cancel
          </button>
        </div>
      </div>
    );
  };

  const renderOptionalComment = () => {
    return (
      <div>
        {/* Section header - same style as other sections but without Header/Exclude checkboxes */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          marginBottom: '6px',
          justifyContent: 'space-between'
        }}>
          <h3 style={{
            fontSize: '11px',
            fontWeight: '600',
            color: '#dc2626', // Red color for optional additional comment
            margin: 0,
            textAlign: 'left'
          }}>
            Optional Additional Comment
          </h3>
          
          {/* Checkbox to show/hide the comment area */}
          <label style={{
            display: 'flex',
            alignItems: 'center',
            fontSize: '8px',
            color: '#dc2626',
            cursor: 'pointer'
          }}>
            <input
              type="checkbox"
              checked={showOptionalComment}
              onChange={(e) => {
                setShowOptionalComment(e.target.checked);
                if (!e.target.checked) {
                  updateSectionData(section.id, { comment: '' });
                }
              }}
              style={{ marginRight: '2px', transform: 'scale(0.6)' }}
            />
            Add
          </label>
        </div>

        {/* Show textarea only when checkbox is selected - red/pink theme */}
        {showOptionalComment && (
          <div style={{
            backgroundColor: '#fef2f2', // Light red/pink background
            padding: '8px',
            borderRadius: '4px',
            border: '1px solid #f87171' // Red/pink border
          }}>
            <textarea
              value={data.comment || ''}
              onChange={(e) => updateSectionData(section.id, { comment: e.target.value })}
              placeholder="Add your optional additional comment here..."
              style={{
                width: '100%',
                minHeight: '80px',
                padding: '8px',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                fontSize: '11px',
                fontFamily: 'inherit',
                resize: 'vertical',
                textAlign: 'left'
              }}
            />
          </div>
        )}
      </div>
    );
  };

  const renderSectionContent = () => {
    switch (section.type) {
      case 'rated-comment': return renderRatedComment();
      case 'assessment-comment': return renderAssessmentComment();
      case 'personalised-comment': return renderPersonalisedComment();
      case 'next-steps': return renderNextSteps();
      case 'standard-comment': return renderStandardComment();
      case 'optional-additional-comment': return renderOptionalComment();
      case 'new-line': return (
        <div style={{
          padding: '8px',
          textAlign: 'center',
          fontSize: '12px',
          color: '#6b7280',
          fontStyle: 'italic'
        }}>
          ↵ Line Break
        </div>
      );
      default: return <div style={{ color: '#6b7280' }}>Unknown section type</div>;
    }
  };

  if (section.type === 'new-line') {
    return (
      <div style={{
        margin: '8px 0',
        padding: '12px',
        backgroundColor: '#f8fafc',
        borderRadius: '8px',
        border: '1px solid #e2e8f0',
        textAlign: 'center'
      }}>
        {renderSectionContent()}
      </div>
    );
  }

  return (
    <div style={{
      backgroundColor: colors.bg,
      border: `1px solid ${colors.border}`,
      borderRadius: '6px',
      padding: '8px',
      marginBottom: '6px'
    }}>
      {/* Section Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        marginBottom: '6px',
        justifyContent: 'space-between'
      }}>
        <h3 style={{
          fontSize: '11px',
          fontWeight: '600',
          color: colors.text,
          margin: 0,
          textAlign: 'left'
        }}>
          {section.name}
        </h3>
        
        {/* Only show Header and Exclude toggles for non-optional sections */}
        {section.type !== 'optional-additional-comment' && (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              fontSize: '8px',
              color: colors.text,
              cursor: 'pointer'
            }}>
              <input
                type="checkbox"
                checked={data.showHeader !== false}
                onChange={(e) => updateSectionData(section.id, { showHeader: e.target.checked })}
                style={{ marginRight: '2px', transform: 'scale(0.6)' }}
              />
              Header
            </label>
            
            <label style={{
              display: 'flex',
              alignItems: 'center',
              fontSize: '8px',
              color: '#6b7280',
              cursor: 'pointer'
            }}>
              <input
                type="checkbox"
                checked={
                  (section.type === 'rated-comment' && data.rating === 'no-comment') ||
                  (section.type === 'assessment-comment' && data.performance === 'no-comment') ||
                  (section.type === 'personalised-comment' && data.category === null) ||
                  (section.type === 'next-steps' && data.focusArea === null)
                }
                onChange={(e) => {
                  if (section.type === 'rated-comment') {
                    updateSectionData(section.id, { rating: e.target.checked ? 'no-comment' : null });
                  } else if (section.type === 'assessment-comment') {
                    updateSectionData(section.id, { performance: e.target.checked ? 'no-comment' : null });
                  } else if (section.type === 'personalised-comment') {
                    const firstCategory = Object.keys(section.data?.categories || section.data?.comments || {})[0];
                    updateSectionData(section.id, { category: e.target.checked ? null : firstCategory });
                  } else if (section.type === 'next-steps') {
                    const firstArea = Object.keys(section.data?.focusAreas || section.data?.comments || {})[0];
                    updateSectionData(section.id, { focusArea: e.target.checked ? null : firstArea });
                  }
                }}
                style={{ marginRight: '2px', transform: 'scale(0.6)' }}
              />
              Exclude
            </label>
          </div>
        )}
      </div>

      {/* Section Content */}
      {renderSectionContent()}
    </div>
  );
};

export default MobileSectionCard;