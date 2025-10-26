import React from 'react';
import { TemplateSection } from '../../types';
import SectionRenderer from '../report-sections/SectionRenderer';
import { getSectionColor, getSectionDisplayName } from '../../utils/templateValidation';

interface TemplateSectionListProps {
  sections: TemplateSection[];
  sectionData: Record<string, any>;
  onMoveSection: (index: number, direction: 'up' | 'down') => void;
  onEditSection: (section: TemplateSection, index: number) => void;
  onRemoveSection: (id: string) => void;
  onUpdateSectionData: (sectionId: string, data: any) => void;
  onAddSection: () => void;
}

export const TemplateSectionList: React.FC<TemplateSectionListProps> = ({
  sections,
  sectionData,
  onMoveSection,
  onEditSection,
  onRemoveSection,
  onUpdateSectionData,
  onAddSection
}) => {
  const isSectionEditable = (type: string) => {
    return ['rated-comment', 'assessment-comment', 'personalised-comment', 'next-steps', 'qualities'].includes(type);
  };

  return (
    <div style={{
      backgroundColor: 'white',
      border: '2px solid #e5e7eb',
      borderRadius: '12px',
      padding: '24px'
    }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <h2 style={{ 
          fontSize: '18px', 
          fontWeight: '600', 
          color: '#111827',
          margin: 0
        }}>
          Template Sections
        </h2>
        
        <button
          onClick={onAddSection}
          style={{
            backgroundColor: '#3b82f6',
            color: 'white',
            padding: '8px 16px',
            border: 'none',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          ➕ Add Section
        </button>
      </div>

      {sections.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '48px',
          color: '#9ca3af'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📝</div>
          <h3 style={{ fontSize: '16px', fontWeight: '600', margin: '0 0 8px 0' }}>
            No Sections Added Yet
          </h3>
          <p style={{ margin: '0 0 24px 0', fontSize: '14px' }}>
            Start building your template by adding sections like comments, ratings, or next steps.
          </p>
          <button
            onClick={onAddSection}
            style={{
              backgroundColor: '#3b82f6',
              color: 'white',
              padding: '12px 24px',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            Add Your First Section
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {sections.map((section, index) => (
            <div key={section.id} style={{
              backgroundColor: '#f8fafc',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '16px'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '12px'
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px',
                    marginBottom: '4px'
                  }}>
                    <span style={{
                      backgroundColor: getSectionColor(section.type),
                      color: 'white',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: '600'
                    }}>
                      {getSectionDisplayName(section.type)}
                    </span>
                    <span style={{
                      backgroundColor: '#e5e7eb',
                      color: '#6b7280',
                      padding: '1px 6px',
                      borderRadius: '3px',
                      fontSize: '11px'
                    }}>
                      #{index + 1}
                    </span>
                  </div>
                  
                  {section.name && section.type !== 'new-line' && (
                    <h4 style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#374151',
                      margin: '0 0 4px 0'
                    }}>
                      {section.name}
                    </h4>
                  )}
                  
                  {/* Show section summary */}
                  <div style={{
                    fontSize: '12px',
                    color: '#6b7280'
                  }}>
                    {section.type === 'rated-comment' && (
                      <span>
                        {section.data?.comments ? 
                          `${Object.keys(section.data.comments).length} rating levels` : 
                          'No ratings configured'
                        }
                      </span>
                    )}
                    {section.type === 'assessment-comment' && (
                      <span>
                        {section.data?.comments ? 
                          `${Object.keys(section.data.comments).length} assessment levels` : 
                          'No assessments configured'
                        }
                      </span>
                    )}
                    {section.type === 'personalised-comment' && (
                      <span>
                        {section.data?.categories ? 
                          `${Object.keys(section.data.categories).length} categories` : 
                          'No categories configured'
                        }
                      </span>
                    )}
                    {section.type === 'next-steps' && (
                      <span>
                        {section.data?.focusAreas ? 
                          `${Object.keys(section.data.focusAreas).length} focus areas` : 
                          'No focus areas configured'
                        }
                      </span>
                    )}
                    {section.type === 'standard-comment' && (
                      <span>
                        {section.data?.content ? 
                          `${section.data.content.substring(0, 50)}${section.data.content.length > 50 ? '...' : ''}` : 
                          'No content'
                        }
                      </span>
                    )}
                    {section.type === 'new-line' && (
                      <span>Creates spacing in report</span>
                    )}
                  </div>
                </div>
                
                <div style={{ 
                  display: 'flex', 
                  gap: '4px',
                  flexShrink: 0,
                  marginLeft: '12px'
                }}>
                  {/* Move buttons */}
                  <button
                    onClick={() => onMoveSection(index, 'up')}
                    disabled={index === 0}
                    style={{
                      backgroundColor: index === 0 ? '#f3f4f6' : '#e5e7eb',
                      color: index === 0 ? '#9ca3af' : '#6b7280',
                      border: 'none',
                      borderRadius: '4px',
                      width: '24px',
                      height: '24px',
                      cursor: index === 0 ? 'not-allowed' : 'pointer',
                      fontSize: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    title="Move up"
                  >
                    ↑
                  </button>
                  
                  <button
                    onClick={() => onMoveSection(index, 'down')}
                    disabled={index === sections.length - 1}
                    style={{
                      backgroundColor: index === sections.length - 1 ? '#f3f4f6' : '#e5e7eb',
                      color: index === sections.length - 1 ? '#9ca3af' : '#6b7280',
                      border: 'none',
                      borderRadius: '4px',
                      width: '24px',
                      height: '24px',
                      cursor: index === sections.length - 1 ? 'not-allowed' : 'pointer',
                      fontSize: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    title="Move down"
                  >
                    ↓
                  </button>
                  
                  {/* Edit button */}
                  {isSectionEditable(section.type) && (
                    <button
                      onClick={() => onEditSection(section, index)}
                      style={{
                        backgroundColor: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        width: '24px',
                        height: '24px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      title="Edit section"
                    >
                      ✏️
                    </button>
                  )}
                  
                  {/* Remove button */}
                  <button
                    onClick={() => onRemoveSection(section.id)}
                    style={{
                      backgroundColor: '#ef4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      width: '24px',
                      height: '24px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    title="Remove section"
                  >
                    ×
                  </button>
                </div>
              </div>
              
              {/* Section content preview */}
              <SectionRenderer
                section={section}
                sectionData={sectionData}
                updateSectionData={onUpdateSectionData}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};