import React from 'react';
import { TemplateSection } from '../../types';
import RatedCommentSection from './RatedCommentSection';
import StandardCommentSection from './StandardCommentSection';
import OptionalAdditionalCommentSection from './OptionalAdditionalCommentSection';
import AssessmentCommentSection from './AssessmentCommentSection';
import PersonalisedCommentSection from './PersonalisedCommentSection';
import NextStepsSection from './NextStepsSection';
import NewLineSection from './NewLineSection';
import QualitiesSection from './QualitiesSection';

interface TemplateActionPayload {
  type: 'replace' | 'add-to-button' | 'add-to-new-button';
  sectionId: string;
  commentText: string;
  buttonName?: string;
  newButtonName?: string;
}

interface SectionRendererProps {
  section: TemplateSection;
  sectionData: Record<string, any>;
  updateSectionData: (sectionId: string, data: any) => void;
  onTemplateAction?: (action: TemplateActionPayload) => void;
  onAddButton?: (sectionId: string, buttonName: string, firstOption: string) => void;
  onDuplicateSection?: (sectionId: string) => void;
  onMergeSections?: (sourceId: string, targetId: string) => void;
  workingTemplateSections?: any[];
  onRenameSection?: (sectionId: string, newName: string) => void;
  globalPronoun?: string;
}

const SectionRenderer: React.FC<SectionRendererProps> = ({
  section,
  sectionData,
  updateSectionData,
  onTemplateAction,
  onAddButton,
  onDuplicateSection,
  onMergeSections,
  workingTemplateSections,
  onRenameSection,
  globalPronoun,
}) => {
  const data = sectionData[section.id] || {};

  const enhancedUpdateSectionData = (sectionId: string, newData: any) => {
    updateSectionData(sectionId, newData);
  };

  switch (section.type) {
    case 'rated-comment':
      return (
        <RatedCommentSection
          section={section} data={data}
          updateSectionData={enhancedUpdateSectionData}
          onTemplateAction={onTemplateAction}
          onAddButton={onAddButton}
          onRenameSection={onRenameSection}
          globalPronoun={globalPronoun}
        />
      );

    case 'standard-comment':
      return (
        <StandardCommentSection
          section={section} data={data}
          updateSectionData={enhancedUpdateSectionData}
          onTemplateAction={onTemplateAction}
          onRenameSection={onRenameSection}
          globalPronoun={globalPronoun}
        />
      );

    case 'optional-additional-comment':
      return (
        <OptionalAdditionalCommentSection
          section={section} data={data}
          updateSectionData={enhancedUpdateSectionData}
        />
      );

    case 'assessment-comment':
      return (
        <AssessmentCommentSection
          section={section} data={data}
          updateSectionData={enhancedUpdateSectionData}
          onTemplateAction={onTemplateAction}
          onAddButton={onAddButton}
          onRenameSection={onRenameSection}
          globalPronoun={globalPronoun}
        />
      );

    case 'personalised-comment':
      return (
        <PersonalisedCommentSection
          section={section} data={data}
          updateSectionData={enhancedUpdateSectionData}
          onTemplateAction={onTemplateAction}
          onAddButton={onAddButton}
          onDuplicateSection={onDuplicateSection}
          onMergeSections={onMergeSections}
          workingTemplateSections={workingTemplateSections}
          onRenameSection={onRenameSection}
          globalPronoun={globalPronoun}
        />
      );

    case 'next-steps':
      return (
        <NextStepsSection
          section={section} data={data}
          updateSectionData={enhancedUpdateSectionData}
          onTemplateAction={onTemplateAction}
          onAddButton={onAddButton}
          onDuplicateSection={onDuplicateSection}
          onMergeSections={onMergeSections}
          workingTemplateSections={workingTemplateSections}
          onRenameSection={onRenameSection}
          globalPronoun={globalPronoun}
        />
      );

    case 'qualities':
      return (
        <QualitiesSection
          section={section} data={data}
          updateSectionData={enhancedUpdateSectionData}
          onTemplateAction={onTemplateAction}
          onAddButton={onAddButton}
          onDuplicateSection={onDuplicateSection}
          onMergeSections={onMergeSections}
          workingTemplateSections={workingTemplateSections}
          onRenameSection={onRenameSection}
          globalPronoun={globalPronoun}
        />
      );

    case 'new-line':
      return (
        <NewLineSection section={section} data={data} updateSectionData={updateSectionData} />
      );

    default:
      return (
        <div style={{ border: '2px solid #fbbf24', borderRadius: '8px', padding: '20px', marginBottom: '16px', backgroundColor: '#fef3c7' }}>
          <p style={{ margin: 0, color: '#92400e' }}>Unknown section type: {section.type}</p>
        </div>
      );
  }
};

export default SectionRenderer;