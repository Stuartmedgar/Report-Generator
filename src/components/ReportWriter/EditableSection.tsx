import React, { useRef, useState } from 'react';
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
  onAddTemplateSection: (sectionType: string, afterIndex: number) => void;
  dynamicSections: any[];
  onRemoveDynamicSection: (sectionId: string) => void;
  onTemplateAction?: (action: any) => void;
  onAddButton?: (sectionId: string, buttonName: string, firstOption: string) => void;
  onDuplicateSection?: (sectionId: string) => void;
  onMergeSections?: (sourceId: string, targetId: string) => void;
  workingTemplateSections?: any[];
  onRenameSection?: (sectionId: string, newName: string) => void;
  onDeleteSection?: (sectionId: string) => void;
  globalPronoun?: string;
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
  onAddTemplateSection,
  onTemplateAction,
  onAddButton,
  onDuplicateSection,
  onMergeSections,
  workingTemplateSections,
  onRenameSection,
  onDeleteSection,
  globalPronoun,
}) => {
  const plusButtonRef = useRef<HTMLButtonElement>(null);
  const [menuAbove, setMenuAbove] = useState(true);

  const isSectionEditable = (type: string) =>
    ['rated-comment', 'assessment-comment', 'personalised-comment', 'next-steps', 'qualities'].includes(type);

  const handleAddSection = (sectionType: string) => {
    onAddDynamicSection(sectionType, sectionIndex);
    setShowSectionOptions(null);
  };

  const handleToggleMenu = () => {
    if (showSectionOptions === sectionIndex) {
      setShowSectionOptions(null);
    } else {
      // Determine if menu should open above or below based on viewport position
      const rect = plusButtonRef.current?.getBoundingClientRect();
      setMenuAbove(!rect || rect.top > 300);
      setShowSectionOptions(sectionIndex);
    }
  };

  return (
    <div data-tour="section" style={{ position: 'relative' }}>
      <div style={{ position: 'relative' }}>
        <SectionRenderer
          section={section}
          sectionData={sectionData}
          updateSectionData={updateSectionData}
          onTemplateAction={onTemplateAction}
          onAddButton={onAddButton}
          onDuplicateSection={onDuplicateSection}
          onMergeSections={onMergeSections}
          workingTemplateSections={workingTemplateSections}
          onRenameSection={onRenameSection}
          globalPronoun={globalPronoun}
        />
      </div>

      {/* Bottom Right Corner - Plus Button and Edit Button */}
      <div data-tour="section-actions" style={{ position: 'absolute', bottom: '8px', right: '8px', display: 'flex', gap: '8px', alignItems: 'center' }}>
        {onDeleteSection && (
          <button
            onClick={() => onDeleteSection(section.id)}
            style={{
              backgroundColor: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5',
              borderRadius: '50%', width: '28px', height: '28px', fontSize: '13px',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)', transition: 'all 0.2s ease'
            }}
            title="Delete this section from template"
          >🗑</button>
        )}
        {isSectionEditable(section.type) && (
          <button
            onClick={() => onEditSection(section, sectionIndex)}
            style={{
              backgroundColor: '#f59e0b', color: 'white', border: 'none',
              borderRadius: '50%', width: '28px', height: '28px', fontSize: '12px',
              cursor: 'pointer', fontWeight: '500', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)', transition: 'all 0.2s ease'
            }}
            title="Edit section comment bank"
          >✏️</button>
        )}

        <button
          data-tour="add-section"
          ref={plusButtonRef}
          onClick={handleToggleMenu}
          style={{
            backgroundColor: showSectionOptions === sectionIndex ? '#ef4444' : '#e5e7eb',
            color: showSectionOptions === sectionIndex ? 'white' : '#6b7280',
            border: 'none', borderRadius: '50%', width: '28px', height: '28px',
            fontSize: showSectionOptions === sectionIndex ? '16px' : '14px',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: '600', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', transition: 'all 0.2s ease'
          }}
          title={showSectionOptions === sectionIndex ? 'Close' : 'Add section after this one'}
        >
          {showSectionOptions === sectionIndex ? '×' : '+'}
        </button>

        {showSectionOptions === sectionIndex && (
          <div style={{
            position: 'absolute',
            ...(menuAbove
              ? { bottom: '35px' }
              : { top: '35px' }),
            right: '36px',
            backgroundColor: 'white', border: '1px solid #d1d5db',
            borderRadius: '6px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            padding: '8px', minWidth: '220px', zIndex: 20
          }}>
            <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Add to template (permanent)
            </div>
            {[
              { type: 'rated-comment', label: '🏆 Rated Comment' },
              { type: 'qualities', label: '⭐ Qualities / Strengths' },
              { type: 'next-steps', label: '🎯 Next Steps' },
              { type: 'assessment-comment', label: '📊 Assessment Score' },
              { type: 'personalised-comment', label: '💬 Personalised Comment' },
              { type: 'standard-comment', label: '📌 Standard Comment (fixed text)' },
              { type: 'new-line', label: '⏎ Line Break' },
              { type: 'optional-additional-comment', label: '📝 Optional Comment Box' },
            ].map(opt => (
              <button key={opt.type} onClick={() => { onAddTemplateSection(opt.type, sectionIndex); setShowSectionOptions(null); }}
                style={{ width: '100%', textAlign: 'left', padding: '6px 8px', border: 'none', backgroundColor: 'transparent', borderRadius: '4px', fontSize: '12px', cursor: 'pointer', marginBottom: '2px' }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
              >{opt.label}</button>
            ))}
            <div style={{ borderTop: '1px solid #e5e7eb', margin: '6px 0' }} />
            <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Add for this student only
            </div>
            {[
              { type: 'optional-additional-comment', label: '📝 Additional Comment Box' },
              { type: 'new-line', label: '⏎ Line Break' },
            ].map(opt => (
              <button key={opt.type} onClick={() => handleAddSection(opt.type)}
                style={{ width: '100%', textAlign: 'left', padding: '6px 8px', border: 'none', backgroundColor: 'transparent', borderRadius: '4px', fontSize: '12px', cursor: 'pointer', marginBottom: '2px' }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
              >{opt.label}</button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
