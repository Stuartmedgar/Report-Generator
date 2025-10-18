import React from 'react';

interface MobileSectionCardProps {
  section: any;
  sectionData: any;
  updateSectionData: (sectionId: string, data: any) => void;
  isFirstSection?: boolean;
  isLastSection?: boolean;
  navigationHandlers?: {
    handlePreviousStudent: () => void;
    handleNextStudent: () => void;
    handleSaveReport: () => void;
    handleHome: () => void;
    handleFinish: () => void;
  };
  currentStudentIndex?: number;
  studentsLength?: number;
}

const MobileSectionCard: React.FC<MobileSectionCardProps> = ({ 
  section, 
  sectionData, 
  updateSectionData,
  isFirstSection = false,
  isLastSection = false,
  navigationHandlers,
  currentStudentIndex = 0,
  studentsLength = 1
}) => {
  const data = sectionData[section.id] || {};

  // State for all editing functionality
  const [showEditComment, setShowEditComment] = React.useState(false);
  const [editableComment, setEditableComment] = React.useState('');
  const [showEditSuggestion, setShowEditSuggestion] = React.useState(false);
  const [editableSuggestion, setEditableSuggestion] = React.useState('');
  const [showEditQuality, setShowEditQuality] = React.useState(false);
  const [editableQuality, setEditableQuality] = React.useState('');
  const [showOptionalComment, setShowOptionalComment] = React.useState(!!data.comment);

  // Effect to sync editable content when data changes
  React.useEffect(() => {
    if (data.selectedComment) {
      setEditableComment(data.customEditedComment || data.selectedComment);
    }
    if (data.selectedSuggestion) {
      setEditableSuggestion(data.customEditedSuggestion || data.selectedSuggestion);
    }
    if (data.selectedQuality) {
      setEditableQuality(data.customEditedQuality || data.selectedQuality);
    }
    setShowOptionalComment(!!data.comment);
  }, [data.selectedComment, data.customEditedComment, data.selectedSuggestion, data.customEditedSuggestion, data.selectedQuality, data.customEditedQuality, data.comment]);

  const renderTopNavigationButtons = () => {
    if (!isFirstSection || !navigationHandlers) return null;
    
    return (
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '12px'
      }}>
        <button
          onClick={navigationHandlers.handleHome}
          style={{
            flex: 1,
            backgroundColor: '#6b7280',
            color: 'white',
            padding: '12px 16px',
            border: 'none',
            borderRadius: '6px',
            fontSize: '14px',
            cursor: 'pointer',
            fontWeight: '600'
          }}
        >
          🏠 Home
        </button>
        <button
          onClick={navigationHandlers.handleSaveReport}
          style={{
            flex: 2,
            backgroundColor: '#10b981',
            color: 'white',
            padding: '12px 16px',
            border: 'none',
            borderRadius: '6px',
            fontSize: '14px',
            cursor: 'pointer',
            fontWeight: '600'
          }}
        >
          💾 Save Report
        </button>
      </div>
    );
  };

  const renderBottomNavigationButtons = () => {
    if (!isLastSection || !navigationHandlers) return null;

    return (
      <div style={{
        display: 'flex',
        gap: '8px',
        marginTop: '12px'
      }}>
        <button
          disabled={currentStudentIndex === 0}
          onClick={navigationHandlers.handlePreviousStudent}
          style={{
            flex: 1,
            backgroundColor: currentStudentIndex === 0 ? '#d1d5db' : '#6b7280',
            color: 'white',
            padding: '12px 16px',
            border: 'none',
            borderRadius: '6px',
            fontSize: '14px',
            cursor: currentStudentIndex === 0 ? 'not-allowed' : 'pointer',
            fontWeight: '600'
          }}
        >
          ← Previous
        </button>
        <button
          onClick={currentStudentIndex === studentsLength - 1 ? navigationHandlers.handleFinish : navigationHandlers.handleNextStudent}
          style={{
            flex: 1,
            backgroundColor: currentStudentIndex === studentsLength - 1 ? '#ef4444' : '#3b82f6',
            color: 'white',
            padding: '12px 16px',
            border: 'none',
            borderRadius: '6px',
            fontSize: '14px',
            cursor: 'pointer',
            fontWeight: '600'
          }}
        >
          {currentStudentIndex === studentsLength - 1 ? '✅ Finish' : 'Next →'}
        </button>
      </div>
    );
  };

  const getSectionColor = (type: string) => {
    switch (type) {
      case 'rated-comment': return { bg: '#f0f9ff', border: '#0ea5e9', text: '#0369a1' };
      case 'assessment-comment': return { bg: '#f0fdf4', border: '#10b981', text: '#059669' };
      case 'personalised-comment': return { bg: '#fffbeb', border: '#f59e0b', text: '#d97706' };
      case 'next-steps': return { bg: '#ecfeff', border: '#06b6d4', text: '#0891b2' };
      case 'qualities': return { bg: '#f3e8ff', border: '#8b5cf6', text: '#7c3aed' };
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

  const handleSaveEditedQuality = () => {
    updateSectionData(section.id, { customEditedQuality: editableQuality });
    setShowEditQuality(false);
  };

  const handleCancelEditQuality = () => {
    setEditableQuality(data.selectedQuality || '');
    setShowEditQuality(false);
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
            {comment ? '✏️ Edit Comment' : '+ Add Custom Comment'}
          </button>
        </div>
      );
    }

    return (
      <div style={{
        backgroundColor: 'white',
        padding: '6px',
        border: '1px solid #d1d5db',
        borderRadius: '4px',
        marginTop: '6px'
      }}>
        <textarea
          value={editableComment}
          onChange={(e) => setEditableComment(e.target.value)}
          placeholder="Edit the comment..."
          style={{
            width: '100%',
            minHeight: '50px',
            padding: '6px',
            marginBottom: '4px',
            border: '1px solid #d1d5db',
            borderRadius: '4px',
            fontSize: '11px',
            fontFamily: 'inherit',
            resize: 'vertical',
            textAlign: 'left'
          }}
        />
        <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-start' }}>
          <button
            onClick={handleCancelEditComment}
            style={{
              backgroundColor: '#6b7280',
              color: 'white',
              border: 'none',
              padding: '4px 8px',
              borderRadius: '3px',
              fontSize: '10px',
              cursor: 'pointer'
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
              padding: '4px 8px',
              borderRadius: '3px',
              fontSize: '10px',
              cursor: 'pointer'
            }}
          >
            Save
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
            {suggestion ? '✏️ Edit Suggestion' : '+ Add Custom Suggestion'}
          </button>
        </div>
      );
    }

    return (
      <div style={{
        backgroundColor: 'white',
        padding: '6px',
        border: '1px solid #d1d5db',
        borderRadius: '4px',
        marginTop: '6px'
      }}>
        <textarea
          value={editableSuggestion}
          onChange={(e) => setEditableSuggestion(e.target.value)}
          placeholder="Edit the suggestion..."
          style={{
            width: '100%',
            minHeight: '50px',
            padding: '6px',
            marginBottom: '4px',
            border: '1px solid #d1d5db',
            borderRadius: '4px',
            fontSize: '11px',
            fontFamily: 'inherit',
            resize: 'vertical',
            textAlign: 'left'
          }}
        />
        <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-start' }}>
          <button
            onClick={handleCancelEditSuggestion}
            style={{
              backgroundColor: '#6b7280',
              color: 'white',
              border: 'none',
              padding: '4px 8px',
              borderRadius: '3px',
              fontSize: '10px',
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSaveEditedSuggestion}
            style={{
              backgroundColor: '#10b981',
              color: 'white',
              border: 'none',
              padding: '4px 8px',
              borderRadius: '3px',
              fontSize: '10px',
              cursor: 'pointer'
            }}
          >
            Save
          </button>
        </div>
      </div>
    );
  };

  const renderEditableQualityBox = () => {
    const quality = data.customEditedQuality || data.selectedQuality;

    if (!showEditQuality) {
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
              setEditableQuality(quality || '');
              setShowEditQuality(true);
            }}
            style={{
              backgroundColor: '#8b5cf6',
              color: 'white',
              border: 'none',
              padding: '4px 8px',
              borderRadius: '3px',
              fontSize: '10px',
              cursor: 'pointer'
            }}
          >
            {quality ? '✏️ Edit Quality' : '+ Add Custom Quality'}
          </button>
        </div>
      );
    }

    return (
      <div style={{
        backgroundColor: 'white',
        padding: '6px',
        border: '1px solid #d1d5db',
        borderRadius: '4px',
        marginTop: '6px'
      }}>
        <textarea
          value={editableQuality}
          onChange={(e) => setEditableQuality(e.target.value)}
          placeholder="Edit the quality..."
          style={{
            width: '100%',
            minHeight: '50px',
            padding: '6px',
            marginBottom: '4px',
            border: '1px solid #d1d5db',
            borderRadius: '4px',
            fontSize: '11px',
            fontFamily: 'inherit',
            resize: 'vertical',
            textAlign: 'left'
          }}
        />
        <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-start' }}>
          <button
            onClick={handleCancelEditQuality}
            style={{
              backgroundColor: '#6b7280',
              color: 'white',
              border: 'none',
              padding: '4px 8px',
              borderRadius: '3px',
              fontSize: '10px',
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSaveEditedQuality}
            style={{
              backgroundColor: '#10b981',
              color: 'white',
              border: 'none',
              padding: '4px 8px',
              borderRadius: '3px',
              fontSize: '10px',
              cursor: 'pointer'
            }}
          >
            Save
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
        
        {data.rating && data.rating !== 'no-comment' && data.selectedComment && 
          renderEditableCommentBox('#0ea5e9')
        }
      </div>
    );
  };

  const renderAssessmentComment = () => {
    const performances = [
      { value: 'excellent', label: 'Excellent', color: '#10b981' },
      { value: 'good', label: 'Good', color: '#3b82f6' },
      { value: 'satisfactory', label: 'Satisfactory', color: '#f59e0b' },
      { value: 'needsImprovement', label: 'Needs Improvement', color: '#ef4444' },
      { value: 'notCompleted', label: 'Not Completed', color: '#6b7280' }
    ];

    return (
      <div>
        {/* Score Input - Always First */}
        <div style={{
          backgroundColor: '#f0fdf4',
          padding: '6px',
          borderRadius: '4px',
          border: '1px solid #10b981',
          marginBottom: '6px'
        }}>
          <label style={{
            display: 'block',
            fontSize: '10px',
            fontWeight: '600',
            color: '#059669',
            marginBottom: '4px'
          }}>
            Score:
          </label>
          <input
            type="number"
            value={data.score !== undefined ? data.score : ''}
            onChange={(e) => updateSectionData(section.id, { score: e.target.value ? Number(e.target.value) : undefined })}
            placeholder="Enter score..."
            style={{
              width: '100%',
              padding: '4px 6px',
              border: '1px solid #d1d5db',
              borderRadius: '3px',
              fontSize: '11px',
              boxSizing: 'border-box'
            }}
          />
        </div>

        {/* Performance Buttons - Now Second */}
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
        
        {data.performance && data.performance !== 'no-comment' && data.selectedComment && 
          renderEditableCommentBox('#10b981')
        }
      </div>
    );
  };

  const renderPersonalisedComment = () => {
    const categories = section.data?.headings || Object.keys(section.data?.categories || section.data?.comments || {});
    const instruction = section.data?.instruction || '';
    
    return (
      <div>
        {/* Display instruction */}
        {instruction && (
          <div style={{
            backgroundColor: '#fef3c7',
            padding: '6px',
            borderRadius: '4px',
            marginBottom: '6px',
            border: '1px solid #f59e0b'
          }}>
            <div style={{
              fontSize: '10px',
              fontWeight: '600',
              color: '#92400e',
              marginBottom: '2px'
            }}>
              Instructions:
            </div>
            <div style={{
              fontSize: '10px',
              color: '#78350f',
              fontStyle: 'italic',
              lineHeight: '1.3'
            }}>
              {instruction}
            </div>
          </div>
        )}

        {/* Personalised Information Input - Now FIRST */}
        <div style={{
          backgroundColor: '#fffbeb',
          padding: '6px',
          borderRadius: '4px',
          border: '1px solid #f59e0b',
          marginBottom: '6px'
        }}>
          <label style={{
            display: 'block',
            fontSize: '10px',
            fontWeight: '600',
            color: '#d97706',
            marginBottom: '4px'
          }}>
            Personalised Information:
          </label>
          <input
            type="text"
            value={data.personalisedInfo || ''}
            onChange={(e) => updateSectionData(section.id, { personalisedInfo: e.target.value })}
            placeholder="Enter specific information..."
            style={{
              width: '100%',
              padding: '4px 6px',
              border: '1px solid #d1d5db',
              borderRadius: '3px',
              fontSize: '11px',
              boxSizing: 'border-box'
            }}
          />
          <div style={{
            fontSize: '9px',
            color: '#78350f',
            fontStyle: 'italic',
            marginTop: '2px'
          }}>
            This will replace [Personal Information] in the comment
          </div>
        </div>

        {/* Category Buttons - Now SECOND */}
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
                flex: '1 1 calc(50% - 2px)',
                minWidth: '80px',
                textAlign: 'center'
              }}
            >
              {category}
            </button>
          ))}
        </div>
          
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
                flex: '1 1 calc(50% - 2px)',
                minWidth: '80px',
                textAlign: 'center'
              }}
            >
              {area}
            </button>
          ))}
        </div>
          
        {data.focusArea && data.selectedSuggestion && 
          renderEditableSuggestionBox()
        }
      </div>
    );
  };

  const renderQualities = () => {
    const qualityAreas = section.data?.headings || Object.keys(section.data?.comments || {});
    
    return (
      <div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '6px' }}>
          {qualityAreas.map((area: string) => (
            <button
              key={area}
              onClick={() => updateSectionData(section.id, { qualityArea: area })}
              style={{
                backgroundColor: data.qualityArea === area ? '#8b5cf6' : 'white',
                color: data.qualityArea === area ? 'white' : '#8b5cf6',
                border: '1px solid #8b5cf6',
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
              {area}
            </button>
          ))}
        </div>
          
        {data.qualityArea && data.selectedQuality && 
          renderEditableQualityBox()
        }
      </div>
    );
  };

  const renderStandardComment = () => {
    return (
      <div style={{
        padding: '8px',
        backgroundColor: '#f8fafc',
        borderRadius: '4px',
        fontSize: '11px',
        color: '#64748b',
        fontStyle: 'italic',
        textAlign: 'center'
      }}>
        Standard comment - will appear in all reports
      </div>
    );
  };

  const renderOptionalComment = () => {
    return (
      <div>
        {!showOptionalComment ? (
          <div style={{ textAlign: 'center', padding: '8px' }}>
            <button
              onClick={() => setShowOptionalComment(true)}
              style={{
                backgroundColor: '#a855f7',
                color: 'white',
                border: 'none',
                padding: '6px 12px',
                borderRadius: '4px',
                fontSize: '11px',
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              + Add Comment
            </button>
          </div>
        ) : (
          <div>
            <textarea
              value={data.comment || ''}
              onChange={(e) => updateSectionData(section.id, { comment: e.target.value })}
              placeholder="Enter your optional comment here..."
              style={{
                width: '100%',
                minHeight: '60px',
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
      case 'qualities': return renderQualities();
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
    <div>
      {renderTopNavigationButtons()}

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
          {section.type !== 'optional-additional-comment' && section.type !== 'new-line' && (
            <div style={{
              display: 'flex',
              gap: '8px',
              fontSize: '10px'
            }}>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                color: colors.text,
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}>
                <input
                  type="checkbox"
                  checked={data.showHeader || false}
                  onChange={(e) => updateSectionData(section.id, { showHeader: e.target.checked })}
                  style={{ marginRight: '2px', transform: 'scale(0.6)' }}
                />
                Header
              </label>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                color: colors.text,
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}>
                <input
                  type="checkbox"
                  checked={!data.rating && !data.performance && !data.category && !data.focusArea && !data.qualityArea}
                  onChange={(e) => {
                    if (section.type === 'rated-comment') {
                      const firstRating = Object.keys(section.data?.comments || section.data?.ratings || {})[0];
                      updateSectionData(section.id, { rating: e.target.checked ? null : firstRating });
                    } else if (section.type === 'assessment-comment') {
                      const firstPerformance = Object.keys(section.data?.comments || {})[0];
                      updateSectionData(section.id, { performance: e.target.checked ? null : firstPerformance });
                    } else if (section.type === 'personalised-comment') {
                      const firstCategory = section.data?.headings?.[0] || Object.keys(section.data?.categories || section.data?.comments || {})[0];
                      updateSectionData(section.id, { category: e.target.checked ? null : firstCategory });
                    } else if (section.type === 'next-steps') {
                      const firstArea = Object.keys(section.data?.focusAreas || section.data?.comments || {})[0];
                      updateSectionData(section.id, { focusArea: e.target.checked ? null : firstArea });
                    } else if (section.type === 'qualities') {
                      const firstArea = Object.keys(section.data?.comments || {})[0];
                      updateSectionData(section.id, { qualityArea: e.target.checked ? null : firstArea });
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

      {renderBottomNavigationButtons()}
    </div>
  );
};

export default MobileSectionCard;