import React, { useState } from 'react';
import RatedCommentSelector from './RatedCommentSelector';
import StandardCommentSelector from './StandardCommentSelector';
import AssessmentCommentSelector from './AssessmentCommentSelector';
import PersonalisedCommentSelector from './PersonalisedCommentSelector';
import NextStepsCommentSelector from './NextStepsCommentSelector';
import { RatedComment, StandardComment, AssessmentComment, PersonalisedComment, NextStepsComment } from '../types';

interface SectionSelectorProps {
  onSelectSection: (sectionType: string, data?: any) => void;
  onBack: () => void;
}

function SectionSelector({ onSelectSection, onBack }: SectionSelectorProps) {
  const [showRatedCommentSelector, setShowRatedCommentSelector] = useState(false);
  const [showStandardCommentSelector, setShowStandardCommentSelector] = useState(false);
  const [showAssessmentCommentSelector, setShowAssessmentCommentSelector] = useState(false);
  const [showPersonalisedCommentSelector, setShowPersonalisedCommentSelector] = useState(false);
  const [showNextStepsCommentSelector, setShowNextStepsCommentSelector] = useState(false);

  const sections = [
    {
      type: 'rated-comment',
      title: 'Rated Comment',
      description: 'Comments with ratings (Excellent, Good, Satisfactory, Needs Improvement)',
      color: '#3b82f6'
    },
    {
      type: 'standard-comment',
      title: 'Standard Comment',
      description: 'Pre-written comment that appears in all reports',
      color: '#10b981'
    },
    {
      type: 'assessment-comment',
      title: 'Assessment Comment',
      description: 'Comments based on assessment scores and performance',
      color: '#8b5cf6'
    },
    {
      type: 'personalised-comment',
      title: 'Personalised Comment',
      description: 'Comments with customizable personal information',
      color: '#f59e0b'
    },
    {
      type: 'optional-additional-comment',
      title: 'Optional Additional Comment',
      description: 'Optional text box for extra personalized comments',
      color: '#ef4444'
    },
    {
      type: 'next-steps',
      title: 'Next Steps',
      description: 'Suggestions for student improvement and future goals',
      color: '#06b6d4'
    },
    {
      type: 'new-line',
      title: 'New Line',
      description: 'Add spacing between sections for better formatting',
      color: '#6b7280'
    }
  ];

  const handleSectionClick = (sectionType: string) => {
    if (sectionType === 'rated-comment') {
      setShowRatedCommentSelector(true);
    } else if (sectionType === 'standard-comment') {
      setShowStandardCommentSelector(true);
    } else if (sectionType === 'assessment-comment') {
      setShowAssessmentCommentSelector(true);
    } else if (sectionType === 'personalised-comment') {
      setShowPersonalisedCommentSelector(true);
    } else if (sectionType === 'next-steps') {
      setShowNextStepsCommentSelector(true);
    } else {
      // For now, other sections are added without configuration
      onSelectSection(sectionType);
    }
  };

  const handleSelectRatedComment = (ratedComment: RatedComment) => {
    onSelectSection('rated-comment', ratedComment);
    setShowRatedCommentSelector(false);
  };

  const handleSelectStandardComment = (standardComment: StandardComment) => {
    // Transform the standard comment data to match template builder expectations
    const sectionData = {
      name: standardComment.name,
      data: {
        content: standardComment.comment
      }
    };
    onSelectSection('standard-comment', sectionData);
    setShowStandardCommentSelector(false);
  };

  const handleSelectAssessmentComment = (assessmentComment: AssessmentComment) => {
    onSelectSection('assessment-comment', assessmentComment);
    setShowAssessmentCommentSelector(false);
  };

  const handleSelectPersonalisedComment = (personalisedComment: PersonalisedComment) => {
    // Transform the personalised comment data to match template builder expectations
    const sectionData = {
      name: personalisedComment.name,
      data: {
        instruction: personalisedComment.instruction,
        categories: personalisedComment.comments, // This maps headings->comments to categories
        headings: personalisedComment.headings
      }
    };
    onSelectSection('personalised-comment', sectionData);
    setShowPersonalisedCommentSelector(false);
  };

  const handleSelectNextStepsComment = (nextStepsComment: NextStepsComment) => {
    // Transform the next steps comment data to match template builder expectations
    const sectionData = {
      name: nextStepsComment.name,
      data: {
        focusAreas: nextStepsComment.comments, // This maps focus areas->comments to focusAreas
        headings: nextStepsComment.headings
      }
    };
    onSelectSection('next-steps', sectionData);
    setShowNextStepsCommentSelector(false);
  };

  // Fixed the conditional logic here
  if (showNextStepsCommentSelector) {
    return (
      <NextStepsCommentSelector
        onSelectComment={handleSelectNextStepsComment}
        onBack={() => setShowNextStepsCommentSelector(false)}
      />
    );
  }

  if (showRatedCommentSelector) {
    return (
      <RatedCommentSelector
        onSelectComment={handleSelectRatedComment}
        onBack={() => setShowRatedCommentSelector(false)}
      />
    );
  }

  if (showStandardCommentSelector) {
    return (
      <StandardCommentSelector
        onSelectComment={handleSelectStandardComment}
        onBack={() => setShowStandardCommentSelector(false)}
      />
    );
  }

  if (showAssessmentCommentSelector) {
    return (
      <AssessmentCommentSelector
        onSelectComment={handleSelectAssessmentComment}
        onBack={() => setShowAssessmentCommentSelector(false)}
      />
    );
  }

  if (showPersonalisedCommentSelector) {
    return (
      <PersonalisedCommentSelector
        onSelectComment={handleSelectPersonalisedComment}
        onBack={() => setShowPersonalisedCommentSelector(false)}
      />
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      <header style={{ 
        backgroundColor: 'white', 
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        padding: '32px 24px',
        textAlign: 'center'
      }}>
        <h1 style={{ 
          fontSize: '28px', 
          fontWeight: '600', 
          color: '#111827',
          margin: 0
        }}>
          Add Section
        </h1>
        <p style={{ 
          color: '#6b7280', 
          margin: '8px 0 0 0',
          fontSize: '16px'
        }}>
          Choose the type of section to add to your template
        </p>
      </header>

      <main style={{ 
        maxWidth: '800px', 
        margin: '0 auto', 
        padding: '32px 24px' 
      }}>
        
        <button 
          onClick={onBack}
          style={{
            backgroundColor: '#6b7280',
            color: 'white',
            padding: '12px 24px',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: '500',
            cursor: 'pointer',
            marginBottom: '24px'
          }}>
          ← Back to Template Builder
        </button>

        {/* Section Options */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', 
          gap: '16px' 
        }}>
          {sections.map((section) => (
            <button
              key={section.type}
              onClick={() => handleSectionClick(section.type)}
              style={{
                backgroundColor: 'white',
                border: `2px solid ${section.color}`,
                borderRadius: '12px',
                padding: '24px',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = section.color;
                e.currentTarget.style.color = 'white';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'white';
                e.currentTarget.style.color = '#111827';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
              }}
            >
              <h3 style={{ 
                fontSize: '18px', 
                fontWeight: '600', 
                margin: '0 0 8px 0'
              }}>
                {section.title}
                {(section.type === 'rated-comment' || section.type === 'standard-comment' || section.type === 'assessment-comment' || section.type === 'personalised-comment' || section.type === 'next-steps') && (
                  <span style={{ 
                    fontSize: '12px',
                    backgroundColor: '#10b981',
                    color: 'white',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    marginLeft: '8px'
                  }}>
                    Configurable
                  </span>
                )}
              </h3>
              <p style={{ 
                fontSize: '14px', 
                margin: 0,
                opacity: 0.8
              }}>
                {section.description}
              </p>
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}

export default SectionSelector;