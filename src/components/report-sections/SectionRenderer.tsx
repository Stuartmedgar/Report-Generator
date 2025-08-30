import React from 'react';
import { TemplateSection } from '../../types';
import RatedCommentSection from './RatedCommentSection';
import StandardCommentSection from './StandardCommentSection';
import OptionalAdditionalCommentSection from './OptionalAdditionalCommentSection';
import AssessmentCommentSection from './AssessmentCommentSection';
import PersonalisedCommentSection from './PersonalisedCommentSection';
import NextStepsSection from './NextStepsSection';
import NewLineSection from './NewLineSection';

interface SectionRendererProps {
  section: TemplateSection;
  sectionData: Record<string, any>;
  updateSectionData: (sectionId: string, data: any) => void;
}

const SectionRenderer: React.FC<SectionRendererProps> = ({
  section,
  sectionData,
  updateSectionData
}) => {
  const data = sectionData[section.id] || {};

  // HEADER FIX: Enhanced updateSectionData that includes header default
  const enhancedUpdateSectionData = (sectionId: string, newData: any) => {
    // If showHeader is not set in newData, use template default or true
    if (newData.showHeader === undefined) {
      const headerDefault = section.data?.showHeader !== undefined ? section.data.showHeader : true;
      newData.showHeader = headerDefault;
    }
    updateSectionData(sectionId, newData);
  };

  switch (section.type) {
    case 'rated-comment':
      return (
        <RatedCommentSection
          section={section}
          data={data}
          updateSectionData={enhancedUpdateSectionData}
        />
      );

    case 'standard-comment':
      return (
        <StandardCommentSection
          section={section}
          data={data}
          updateSectionData={enhancedUpdateSectionData}
        />
      );

    case 'optional-additional-comment':
      return (
        <OptionalAdditionalCommentSection
          section={section}
          data={data}
          updateSectionData={enhancedUpdateSectionData}
        />
      );

    case 'assessment-comment':
      return (
        <AssessmentCommentSection
          section={section}
          data={data}
          updateSectionData={enhancedUpdateSectionData}
        />
      );

    case 'personalised-comment':
      return (
        <PersonalisedCommentSection
          section={section}
          data={data}
          updateSectionData={enhancedUpdateSectionData}
        />
      );

    case 'next-steps':
      return (
        <NextStepsSection
          section={section}
          data={data}
          updateSectionData={enhancedUpdateSectionData}
        />
      );

    case 'new-line':
      return (
        <NewLineSection
          section={section}
          data={data}
          updateSectionData={updateSectionData}
        />
      );

    default:
      return (
        <div style={{
          border: '2px solid #fbbf24',
          borderRadius: '8px',
          padding: '20px',
          marginBottom: '16px',
          backgroundColor: '#fef3c7'
        }}>
          <p style={{ margin: 0, color: '#92400e' }}>
            Unknown section type: {section.type}
          </p>
        </div>
      );
  }
};

export default SectionRenderer;