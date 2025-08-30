import React, { useState, useEffect } from 'react';

interface NextStepsSectionProps {
  section: any;
  data: any;
  updateSectionData: (sectionId: string, data: any) => void;
}

const NextStepsSection: React.FC<NextStepsSectionProps> = ({
  section,
  data,
  updateSectionData
}) => {
  const [showEditSuggestion, setShowEditSuggestion] = useState(false);
  const [editableSuggestion, setEditableSuggestion] = useState('');

  // Update editable suggestion when selected suggestion changes
  useEffect(() => {
    if (data.selectedSuggestion) {
      setEditableSuggestion(data.customEditedSuggestion || data.selectedSuggestion);
    }
  }, [data.selectedSuggestion, data.customEditedSuggestion]);

  const handleFocusAreaChange = (focusArea: string) => {
    // Warn about losing edits if they exist and focus area is different
    if (focusArea !== data.focusArea && data.customEditedSuggestion && data.customEditedSuggestion !== data.selectedSuggestion) {
      const shouldContinue = window.confirm(
        'Changing the focus area will replace your custom edits with a new generated suggestion. Continue?'
      );
      if (!shouldContinue) {
        return;
      }
    }

    // Just pass the focusArea - let useReportLogic handle suggestion selection
    updateSectionData(section.id, { 
      focusArea,
      customEditedSuggestion: undefined // Clear custom edits when focus area changes
    });
    
    // Close edit box if open
    setShowEditSuggestion(false);
  };

  const handleSaveEditedSuggestion = () => {
    updateSectionData(section.id, { 
      customEditedSuggestion: editableSuggestion 
    });
    setShowEditSuggestion(false);
  };

  const handleCancelEditSuggestion = () => {
    // Reset to original selected suggestion
    setEditableSuggestion(data.selectedSuggestion || '');
    setShowEditSuggestion(false);
  };

  const focusAreas = section.data?.headings || Object.keys(section.data?.focusAreas || section.data?.comments || {});
  const hasSelectedSuggestion = data.selectedSuggestion && data.focusArea;

  return (
    <div style={{
      border: '2px solid #06b6d4',
      borderRadius: '8px',
      padding: '16px',
      marginBottom: '16px',
      backgroundColor: '#ecfeff'
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
          color: '#0891b2',
          margin: 0
        }}>
          {section.name || 'Next Steps'}
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

      {/* Focus Area Buttons */}
      <div style={{
        display: 'flex',
        gap: '8px',
        flexWrap: 'wrap',
        marginBottom: '8px'
      }}>
        {focusAreas.map((focusArea: string) => (
          <button
            key={focusArea}
            onClick={() => handleFocusAreaChange(focusArea)}
            style={{
              backgroundColor: data.focusArea === focusArea ? '#06b6d4' : 'white',
              color: data.focusArea === focusArea ? 'white' : '#06b6d4',
              border: '2px solid #06b6d4',
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
            {focusArea}
          </button>
        ))}
      </div>

      {/* Edit Suggestion Toggle - Only show if there's a selected suggestion */}
      {hasSelectedSuggestion && (
        <div style={{
          display: 'flex',
          justifyContent: 'flex-start',
          marginBottom: showEditSuggestion ? '12px' : '0'
        }}>
          <button
            onClick={() => setShowEditSuggestion(!showEditSuggestion)}
            style={{
              backgroundColor: showEditSuggestion ? '#06b6d4' : '#e5e7eb',
              color: showEditSuggestion ? 'white' : '#6b7280',
              border: 'none',
              borderRadius: '4px',
              padding: '4px 8px',
              fontSize: '12px',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            {showEditSuggestion ? '- Edit Suggestion' : '+ Edit Suggestion'}
          </button>
        </div>
      )}

      {/* Collapsible Suggestion Editor */}
      {showEditSuggestion && hasSelectedSuggestion && (
        <div style={{
          backgroundColor: 'white',
          border: '1px solid #d1d5db',
          borderRadius: '6px',
          padding: '8px'
        }}>
          <textarea
            value={editableSuggestion}
            onChange={(e) => setEditableSuggestion(e.target.value)}
            placeholder="Edit the suggestion to better suit this student..."
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
            Edit the generated suggestion or add additional notes
          </div>
          
          {/* Action buttons on the left */}
          <div style={{
            display: 'flex',
            justifyContent: 'flex-start',
            gap: '6px'
          }}>
            <button
              onClick={handleCancelEditSuggestion}
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
              onClick={handleSaveEditedSuggestion}
              style={{
                backgroundColor: '#06b6d4',
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

      {/* REMOVED: Custom Suggestion Input section */}
      
    </div>
  );
};

export default NextStepsSection;