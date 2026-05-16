import React from 'react';
import SectionRenderer from '../report-sections/SectionRenderer';

interface EditableSectionProps {
  section: any;
  sectionIndex: number;
  sectionData: Record<string, any>;
  updateSectionData: (sectionId: string, data: any) => void;
  onEditSection: (section: any, index: number) => void;
  showSectionOptions: number | null;
  setShowSectionOptions: (index: number | null) => void;
  onAddDynamicSection: (sectionType: string, afterIndex: number) => void;
  dynamicSections: any[];
  onRemoveDynamicSection: (sectionId: string) => void;
  onTemplateAction?: (action: any) => void;
  onAddButton?: (sectionId: string, buttonName: string, firstOption: string) => void;
  onDuplicateSection?: (sectionId: string) => void;
}

export const EditableSection: React.FC<EditableSectionProps> = ({
  section,
  sectionIndex,
  sectionData,
  updateSectionData,
  onEditSection,
  showSectionOptions,
  setShowSectionOptions,
  onAddDynamicSection,
  onTemplateAction,
  onAddButton,
  onDuplicateSection,
}) => {
  const isSectionEditable = (type: string) => {
    return ['rated-comment', 'assessment-comment', 'personalised-comment', 'next-steps', 'qualities'].includes(type);
  };

  const handleAddSection = (sectionType: string) => {
    onAddDynamicSection(sectionType, sectionIndex);
    setShowSectionOptions(null);
  };

  return (
    <div style={{ position: 'relative' }}>
      {/* Main Section */}
      <div style={{ position: 'relative' }}>
        <SectionRenderer
          section={section}
          sectionData={sectionData}
          updateSectionData={updateSectionData}
          onTemplateAction={onTemplateAction}
          onAddButton={onAddButton}
          onDuplicateSection={onDuplicateSection}
        />
      </div>

      {/* Bottom Right Corner - Plus Button and Edit Button */}
      <div style={{
        position: 'absolute',
        bottom: '8px',
        right: '8px',
        display: 'flex',
        gap: '8px',
        alignItems: 'center'
      }}>
        {/* Edit Button */}
        {isSectionEditable(section.type) && (
          <button
            onClick={() => onEditSection(section, sectionIndex)}
            style={{
              backgroundColor: '#f59e0b',
              color: 'white',
              border: 'none',
              borderRadius: '50%',
              width: '28px',
              height: '28px',
              fontSize: '12px',
              cursor: 'pointer',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              transition: 'all 0.2s ease'
            }}
            title="Edit section comment bank"
          >
            ✏️
          </button>
        )}

        {/* Plus Button */}
        <button
          onClick={() => setShowSectionOptions(showSectionOptions === sectionIndex ? null : sectionIndex)}
          style={{
            backgroundColor: showSectionOptions === sectionIndex ? '#ef4444' : '#e5e7eb',
            color: showSectionOptions === sectionIndex ? 'white' : '#6b7280',
            border: 'none',
            borderRadius: '50%',
            width: '28px',
            height: '28px',
            fontSize: showSectionOptions === sectionIndex ? '16px' : '14px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: '600',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            transition: 'all 0.2s ease'
          }}
          title={showSectionOptions === sectionIndex ? 'Close' : 'Add section after this one'}
        >
          {showSectionOptions === sectionIndex ? '×' : '+'}
        </button>

        {/* Section Type Options */}
        {showSectionOptions === sectionIndex && (
          <div style={{
            position: 'absolute',
            bottom: '35px',
            right: '36px',
            backgroundColor: 'white',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            padding: '8px',
            minWidth: '200px',
            zIndex: 20
          }}>
            <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '6px', fontWeight: '600' }}>
              Add section after "{section.name}"
            </div>
            <button
              onClick={() => handleAddSection('optional-additional-comment')}
              style={{ width: '100%', textAlign: 'left', padding: '6px 8px', border: 'none', backgroundColor: 'transparent', borderRadius: '4px', fontSize: '12px', cursor: 'pointer', marginBottom: '4px' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              📝 Additional Comment
            </button>
            <button
              onClick={() => handleAddSection('standard-comment')}
              style={{ width: '100%', textAlign: 'left', padding: '6px 8px', border: 'none', backgroundColor: 'transparent', borderRadius: '4px', fontSize: '12px', cursor: 'pointer', marginBottom: '4px' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              💬 Standard Comment
            </button>
            <button
              onClick={() => handleAddSection('new-line')}
              style={{ width: '100%', textAlign: 'left', padding: '6px 8px', border: 'none', backgroundColor: 'transparent', borderRadius: '4px', fontSize: '12px', cursor: 'pointer' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              ⏎ Line Break
            </button>
          </div>
        )}
      </div>
    </div>
  );
};