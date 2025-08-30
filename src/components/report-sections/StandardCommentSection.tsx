import React, { useState } from 'react';
import { TemplateSection } from '../../types';

interface StandardCommentSectionProps {
  section: TemplateSection;
  data: any;
  updateSectionData: (sectionId: string, data: any) => void;
}

const StandardCommentSection: React.FC<StandardCommentSectionProps> = ({
  section,
  data,
  updateSectionData
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

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
            <h3 style={{
              fontSize: '16px',
              fontWeight: '600',
              color: '#047857',
              margin: 0
            }}>
              {section.name || 'Standard Comment'}
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
              
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                style={{
                  backgroundColor: isExpanded ? '#10b981' : '#e5e7eb',
                  color: isExpanded ? 'white' : '#6b7280',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '4px 8px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                {isExpanded ? 'Collapse' : 'Edit'}
              </button>
            </div>
          </div>
          
          {/* Compact Preview - Show template creator's content */}
          {!isExpanded && (
            <div style={{
              fontSize: '12px',
              color: '#6b7280',
              fontStyle: 'italic',
              backgroundColor: 'white',
              padding: '6px 8px',
              borderRadius: '4px',
              border: '1px solid #d1d5db'
            }}>
              {(section.data?.content || 'Click Edit to add template content...').substring(0, 80)}
              {(section.data?.content || '').length > 80 ? '...' : ''}
            </div>
          )}
        </div>
      </div>

      {/* Expandable Edit Area */}
      {isExpanded && (
        <div>
          <textarea
            value={data.comment || section.data?.content || ''}
            onChange={(e) => updateSectionData(section.id, { comment: e.target.value })}
            placeholder="Enter standard comment (use [Name] for student name)..."
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
            Tip: Use [Name] to insert student's name automatically
          </div>
        </div>
      )}
    </div>
  );
};

export default StandardCommentSection;