import React, { useState, useEffect } from 'react';

interface AssessmentCommentSectionProps {
  section: any;
  data: any;
  updateSectionData: (sectionId: string, data: any) => void;
}

const AssessmentCommentSection: React.FC<AssessmentCommentSectionProps> = ({
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

  const handlePerformanceChange = (performance: string) => {
    // Warn about losing edits if they exist and performance is different
    if (performance !== data.performance && data.customEditedComment && data.customEditedComment !== data.selectedComment) {
      const shouldContinue = window.confirm(
        'Changing the performance level will replace your custom edits with a new generated comment. Continue?'
      );
      if (!shouldContinue) {
        return;
      }
    }

    // Just pass the performance - let useReportLogic handle comment selection
    updateSectionData(section.id, { 
      performance,
      customEditedComment: undefined // Clear custom edits when performance changes
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

  // Handle score type change
  const handleScoreTypeChange = (scoreType: 'outOf' | 'percentage') => {
    updateSectionData(section.id, { 
      scoreType,
      score: undefined, // Clear score when changing type
      maxScore: scoreType === 'outOf' ? (data.maxScore || section.data?.maxScore || 100) : undefined
    });
  };

  // Handle score input change
  const handleScoreChange = (score: number) => {
    updateSectionData(section.id, { score });
  };

  // Handle max score change (for outOf type)
  const handleMaxScoreChange = (maxScore: number) => {
    updateSectionData(section.id, { maxScore });
  };

  const performances = [
    { value: 'excellent', label: 'Excellent', color: '#10b981' },
    { value: 'good', label: 'Good', color: '#3b82f6' },
    { value: 'satisfactory', label: 'Satisfactory', color: '#f59e0b' },
    { value: 'needsImprovement', label: 'Needs Improvement', color: '#ef4444' },
    { value: 'notCompleted', label: 'Not Completed', color: '#6b7280' }
  ];

  const hasSelectedComment = data.selectedComment && data.performance && data.performance !== 'no-comment';

  // Get current score type - prioritize data.scoreType, then section.data.scoreType, default to 'outOf'
  const currentScoreType = data.scoreType || section.data?.scoreType || 'outOf';
  const currentMaxScore = data.maxScore || section.data?.maxScore || 100;

  return (
    <div style={{
      border: '2px solid #8b5cf6',
      borderRadius: '8px',
      padding: '16px',
      marginBottom: '16px',
      backgroundColor: '#f3e8ff'
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
          color: '#7c3aed',
          margin: 0
        }}>
          {section.name || 'Assessment Comment'}
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

      {/* Score Type Selection */}
      <div style={{
        marginBottom: '12px'
      }}>
        <label style={{
          fontSize: '12px',
          fontWeight: '500',
          color: '#374151',
          marginBottom: '6px',
          display: 'block'
        }}>
          Score Type:
        </label>
        <div style={{
          display: 'flex',
          gap: '12px',
          marginBottom: '8px'
        }}>
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            cursor: 'pointer',
            fontSize: '12px',
            color: '#374151'
          }}>
            <input
              type="radio"
              name={`scoreType-${section.id}`}
              value="outOf"
              checked={currentScoreType === 'outOf'}
              onChange={() => handleScoreTypeChange('outOf')}
              style={{
                transform: 'scale(0.9)'
              }}
            />
            Out of (e.g. 15 out of 20)
          </label>
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            cursor: 'pointer',
            fontSize: '12px',
            color: '#374151'
          }}>
            <input
              type="radio"
              name={`scoreType-${section.id}`}
              value="percentage"
              checked={currentScoreType === 'percentage'}
              onChange={() => handleScoreTypeChange('percentage')}
              style={{
                transform: 'scale(0.9)'
              }}
            />
            Percentage (e.g. 75%)
          </label>
        </div>
      </div>

      {/* Score Input */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '12px'
      }}>
        <label style={{
          fontSize: '12px',
          fontWeight: '500',
          color: '#374151'
        }}>
          Score:
        </label>
        <input
          type="number"
          value={data.score || ''}
          onChange={(e) => handleScoreChange(parseFloat(e.target.value) || 0)}
          placeholder={currentScoreType === 'outOf' ? `e.g. 15` : 'e.g. 75'}
          style={{
            width: '60px',
            padding: '4px 6px',
            border: '1px solid #d1d5db',
            borderRadius: '4px',
            fontSize: '12px',
            outline: 'none'
          }}
          min="0"
          max={currentScoreType === 'percentage' ? 100 : currentMaxScore}
        />
        
        {currentScoreType === 'outOf' && (
          <>
            <span style={{
              fontSize: '12px',
              color: '#6b7280'
            }}>
              out of
            </span>
            <input
              type="number"
              value={currentMaxScore}
              onChange={(e) => handleMaxScoreChange(parseFloat(e.target.value) || 100)}
              style={{
                width: '60px',
                padding: '4px 6px',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                fontSize: '12px',
                outline: 'none'
              }}
              min="1"
            />
          </>
        )}
        
        {currentScoreType === 'percentage' && (
          <span style={{
            fontSize: '12px',
            color: '#6b7280'
          }}>
            %
          </span>
        )}
      </div>

      {/* Performance Buttons */}
      <div style={{
        display: 'flex',
        gap: '8px',
        flexWrap: 'wrap',
        marginBottom: '8px'
      }}>
        {performances.map((performance) => (
          <button
            key={performance.value}
            onClick={() => handlePerformanceChange(performance.value)}
            style={{
              backgroundColor: data.performance === performance.value ? performance.color : 'white',
              color: data.performance === performance.value ? 'white' : performance.color,
              border: `2px solid ${performance.color}`,
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
            {performance.label}
          </button>
        ))}
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
              backgroundColor: showEditComment ? '#8b5cf6' : '#e5e7eb',
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
          
          {/* Action buttons */}
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

export default AssessmentCommentSection;