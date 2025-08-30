import React, { useState } from 'react';
import { TemplateSection } from '../../types';

interface OptionalAdditionalCommentSectionProps {
  section: TemplateSection;
  data: any;
  updateSectionData: (sectionId: string, data: any) => void;
}

const OptionalAdditionalCommentSection: React.FC<OptionalAdditionalCommentSectionProps> = ({
  section,
  data,
  updateSectionData
}) => {
  const [isExpanded, setIsExpanded] = useState(data.include || false);

  const handleToggle = (include: boolean) => {
    updateSectionData(section.id, { include });
    setIsExpanded(include);
  };

  return (
    <div style={{
      border: '2px solid #ef4444',
      borderRadius: '8px',
      padding: '16px',
      marginBottom: '16px',
      backgroundColor: '#fef2f2'
    }}>
      {/* Compact Header with Checkbox */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: isExpanded ? '12px' : '0'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          flex: 1
        }}>
          <input
            type="checkbox"
            checked={data.include || false}
            onChange={(e) => handleToggle(e.target.checked)}
            style={{
              width: '16px',
              height: '16px',
              cursor: 'pointer'
            }}
          />
          <h3 style={{
            fontSize: '16px',
            fontWeight: '600',
            color: '#dc2626',
            margin: 0
          }}>
            {section.name || 'Optional Additional Comment'}
          </h3>
        </div>

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

          {/* Character count when expanded */}
          {isExpanded && data.comment && (
            <span style={{
              fontSize: '11px',
              color: '#6b7280',
              fontStyle: 'italic'
            }}>
              {data.comment.length} chars
            </span>
          )}
        </div>
      </div>

      {/* Expandable Comment Area */}
      {isExpanded && (
        <div>
          <textarea
            value={data.comment || ''}
            onChange={(e) => updateSectionData(section.id, { comment: e.target.value })}
            placeholder="Enter additional comment about the student..."
            style={{
              width: '100%',
              minHeight: '60px',
              padding: '8px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              resize: 'vertical',
              fontSize: '14px',
              outline: 'none'
            }}
          />
          <div style={{
            fontSize: '11px',
            color: '#6b7280',
            marginTop: '4px',
            fontStyle: 'italic'
          }}>
            This section will only appear in the report if you check the box and add text
          </div>
        </div>
      )}
    </div>
  );
};

export default OptionalAdditionalCommentSection;