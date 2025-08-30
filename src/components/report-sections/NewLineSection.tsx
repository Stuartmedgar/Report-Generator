import React from 'react';
import { TemplateSection } from '../../types';

interface NewLineSectionProps {
  section: TemplateSection;
  data: any;
  updateSectionData: (sectionId: string, data: any) => void;
}

const NewLineSection: React.FC<NewLineSectionProps> = ({
  section,
  data,
  updateSectionData
}) => {
  return (
    <div style={{
      border: '2px solid #6b7280',
      borderRadius: '8px',
      padding: '12px',
      marginBottom: '16px',
      backgroundColor: '#f3f4f6'
    }}>
      {/* Ultra Compact Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <h3 style={{
            fontSize: '14px',
            fontWeight: '600',
            color: '#4b5563',
            margin: 0
          }}>
            {section.name || 'Paragraph Break'}
          </h3>
          
          {/* Visual indicator */}
          <div style={{
            fontSize: '12px',
            color: '#6b7280',
            fontFamily: 'monospace',
            backgroundColor: 'white',
            padding: '2px 6px',
            borderRadius: '3px',
            border: '1px solid #d1d5db'
          }}>
            ⏎ ⏎
          </div>
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
        </div>
      </div>
      
      {/* Description */}
      <div style={{
        fontSize: '11px',
        color: '#6b7280',
        fontStyle: 'italic',
        marginTop: '4px'
      }}>
        Creates a paragraph break in the report for better formatting
      </div>
    </div>
  );
};

export default NewLineSection;