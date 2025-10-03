import React, { useState, useEffect } from 'react';

interface QualitiesSectionProps {
  section: any;
  data: any;
  updateSectionData: (sectionId: string, data: any) => void;
}

const QualitiesSection: React.FC<QualitiesSectionProps> = ({
  section,
  data,
  updateSectionData
}) => {
  const [showEditQuality, setShowEditQuality] = useState(false);
  const [editableQuality, setEditableQuality] = useState('');

  // Update editable quality when selected quality changes
  useEffect(() => {
    if (data.selectedQuality) {
      setEditableQuality(data.customEditedQuality || data.selectedQuality);
    }
  }, [data.selectedQuality, data.customEditedQuality]);

  const handleQualityAreaChange = (qualityArea: string) => {
    // Warn about losing edits if they exist and quality area is different
    if (qualityArea !== data.qualityArea && data.customEditedQuality && data.customEditedQuality !== data.selectedQuality) {
      const shouldContinue = window.confirm(
        'Changing the quality area will replace your custom edits with a new generated quality. Continue?'
      );
      if (!shouldContinue) {
        return;
      }
    }

    // Just pass the qualityArea - let useReportLogic handle quality selection
    updateSectionData(section.id, { 
      qualityArea,
      customEditedQuality: undefined // Clear custom edits when quality area changes
    });
    
    // Close edit box if open
    setShowEditQuality(false);
  };

  const handleSaveEditedQuality = () => {
    updateSectionData(section.id, { 
      customEditedQuality: editableQuality 
    });
    setShowEditQuality(false);
  };

  const handleCancelEditQuality = () => {
    // Reset to original selected quality
    setEditableQuality(data.selectedQuality || '');
    setShowEditQuality(false);
  };

  const qualityAreas = section.data?.headings || Object.keys(section.data?.comments || {});
  const hasSelectedQuality = data.selectedQuality && data.qualityArea;

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
          {section.name || 'Qualities'}
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

      {/* Quality Area Selection */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '6px',
        marginBottom: '12px'
      }}>
        {qualityAreas.map((area: string) => (
          <button
            key={area}
            onClick={() => handleQualityAreaChange(area)}
            style={{
              backgroundColor: data.qualityArea === area ? '#8b5cf6' : 'white',
              color: data.qualityArea === area ? 'white' : '#8b5cf6',
              border: '2px solid #8b5cf6',
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
            {area}
          </button>
        ))}
      </div>

      {/* Edit Quality Toggle - Only show if there's a selected quality */}
      {hasSelectedQuality && (
        <div style={{
          display: 'flex',
          justifyContent: 'flex-start',
          marginBottom: showEditQuality ? '12px' : '0'
        }}>
          <button
            onClick={() => setShowEditQuality(!showEditQuality)}
            style={{
              backgroundColor: showEditQuality ? '#8b5cf6' : '#e5e7eb',
              color: showEditQuality ? 'white' : '#6b7280',
              border: 'none',
              borderRadius: '4px',
              padding: '4px 8px',
              fontSize: '12px',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            {showEditQuality ? '- Edit Quality' : '+ Edit Quality'}
          </button>
        </div>
      )}

      {/* Collapsible Quality Editor */}
      {showEditQuality && hasSelectedQuality && (
        <div style={{
          backgroundColor: 'white',
          border: '1px solid #d1d5db',
          borderRadius: '6px',
          padding: '8px',
          marginBottom: '12px'
        }}>
          <textarea
            value={editableQuality}
            onChange={(e) => setEditableQuality(e.target.value)}
            placeholder="Edit the quality statement to better suit this student..."
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
            Edit the generated quality or add additional notes
          </div>
          
          {/* Action buttons on the left */}
          <div style={{
            display: 'flex',
            justifyContent: 'flex-start',
            gap: '6px'
          }}>
            <button
              onClick={handleCancelEditQuality}
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
              onClick={handleSaveEditedQuality}
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

export default QualitiesSection;