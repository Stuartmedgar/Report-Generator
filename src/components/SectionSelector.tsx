import React, { useState, useEffect } from 'react';
import RatedCommentSelector from './RatedCommentSelector';
import StandardCommentSelector from './StandardCommentSelector';
import AssessmentCommentSelector from './AssessmentCommentSelector';
import PersonalisedCommentSelector from './PersonalisedCommentSelector';
import NextStepsCommentSelector from './NextStepsCommentSelector';
import QualitiesCommentSelector from './QualitiesCommentSelector';
import { RatedComment, StandardComment, AssessmentComment, PersonalisedComment, NextStepsComment, QualitiesComment } from '../types';

interface SectionSelectorProps {
  onSelectSection: (sectionType: string, data?: any) => void;
  onBack: () => void;
  isMobile?: boolean;
}

function SectionSelector({ onSelectSection, onBack, isMobile: propIsMobile }: SectionSelectorProps) {
  // Mobile detection
  const [isMobile, setIsMobile] = useState(propIsMobile || window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [showRatedCommentSelector, setShowRatedCommentSelector] = useState(false);
  const [showStandardCommentSelector, setShowStandardCommentSelector] = useState(false);
  const [showAssessmentCommentSelector, setShowAssessmentCommentSelector] = useState(false);
  const [showPersonalisedCommentSelector, setShowPersonalisedCommentSelector] = useState(false);
  const [showNextStepsCommentSelector, setShowNextStepsCommentSelector] = useState(false);
  const [showQualitiesCommentSelector, setShowQualitiesCommentSelector] = useState(false);

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
      type: 'qualities',
      title: 'Qualities',
      description: 'Character traits, personal strengths, and positive qualities',
      color: '#8b5cf6'
    },
    {
      type: 'new-line',
      title: 'New Line',
      description: 'Add spacing between sections for better formatting',
      color: '#6b7280'
    }
  ];

  const handleSectionClick = (sectionType: string) => {
    switch(sectionType) {
      case 'rated-comment':
        setShowRatedCommentSelector(true);
        break;
      case 'standard-comment':
        setShowStandardCommentSelector(true);
        break;
      case 'assessment-comment':
        setShowAssessmentCommentSelector(true);
        break;
      case 'personalised-comment':
        setShowPersonalisedCommentSelector(true);
        break;
      case 'next-steps':
        setShowNextStepsCommentSelector(true);
        break;
      case 'qualities':
        setShowQualitiesCommentSelector(true);
        break;
      case 'optional-additional-comment':
        onSelectSection(sectionType, { name: 'Optional Additional Comment' });
        break;
      case 'new-line':
        onSelectSection(sectionType, { name: 'New Line' });
        break;
      default:
        console.log('Unknown section type:', sectionType);
    }
  };

  const handleSelectRatedComment = (comment: RatedComment) => {
    console.log('Selected rated comment:', comment);
    onSelectSection('rated-comment', comment);
  };

  const handleSelectStandardComment = (comment: StandardComment) => {
    console.log('Selected standard comment:', comment);
    onSelectSection('standard-comment', comment);
  };

  const handleSelectAssessmentComment = (comment: AssessmentComment) => {
    console.log('Selected assessment comment:', comment);
    onSelectSection('assessment-comment', comment);
  };

  const handleSelectPersonalisedComment = (comment: PersonalisedComment) => {
    console.log('Selected personalised comment:', comment);
    onSelectSection('personalised-comment', comment);
  };

  const handleSelectNextStepsComment = (comment: NextStepsComment) => {
    console.log('Selected next steps comment:', comment);
    onSelectSection('next-steps', comment);
  };

  const handleSelectQualitiesComment = (comment: QualitiesComment) => {
    console.log('Selected qualities comment:', comment);
    onSelectSection('qualities', comment);
  };

  // CSS styles as JavaScript objects to avoid App.css conflicts
  const styles = {
    container: {
      minHeight: '100vh',
      backgroundColor: '#f9fafb',
    },
    header: {
      backgroundColor: 'white',
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
      padding: isMobile ? '16px' : '32px 24px',
      textAlign: 'center' as const,
      display: 'block', // Force display to override App.css
      position: 'static' as const, // Override any positioning
    },
    title: {
      fontSize: isMobile ? '20px' : '28px',
      fontWeight: '600',
      color: '#111827',
      margin: 0,
    },
    subtitle: {
      color: '#6b7280',
      margin: '8px 0 0 0',
      fontSize: isMobile ? '14px' : '16px',
    },
    main: {
      maxWidth: isMobile ? 'none' : '800px',
      margin: '0 auto',
      padding: isMobile ? '16px' : '32px 24px',
    },
    backButton: {
      backgroundColor: '#6b7280',
      color: 'white',
      padding: isMobile ? '10px 16px' : '12px 24px',
      border: 'none',
      borderRadius: '8px',
      fontSize: isMobile ? '14px' : '16px',
      fontWeight: '500',
      cursor: 'pointer',
      marginBottom: isMobile ? '16px' : '24px',
      width: isMobile ? '100%' : 'auto',
      minHeight: 'auto', // Override App.css button styles
      minWidth: 'auto', // Override App.css button styles
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(350px, 1fr))',
      gap: isMobile ? '12px' : '16px',
    },
    sectionButton: {
      backgroundColor: 'white',
      borderRadius: isMobile ? '8px' : '12px',
      padding: isMobile ? '16px' : '24px',
      textAlign: 'left' as const,
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
      width: '100%',
      minHeight: 'auto', // Override App.css
      minWidth: 'auto', // Override App.css
      display: 'block',
      position: 'relative' as const,
    },
    sectionTitle: {
      fontSize: isMobile ? '16px' : '18px',
      fontWeight: '600',
      margin: '0 0 8px 0',
      display: 'flex',
      alignItems: 'center',
      flexWrap: 'wrap' as const,
      gap: '8px',
    },
    configurableBadge: {
      fontSize: '12px',
      backgroundColor: '#10b981',
      color: 'white',
      padding: '2px 6px',
      borderRadius: '4px',
      fontWeight: '500',
    },
    sectionDescription: {
      fontSize: isMobile ? '13px' : '14px',
      margin: 0,
      opacity: 0.8,
      lineHeight: '1.4',
    },
    mobileHelp: {
      backgroundColor: '#f0f9ff',
      border: '2px solid #3b82f6',
      borderRadius: '8px',
      padding: '16px',
      marginTop: '24px',
      textAlign: 'center' as const,
    },
    helpTitle: {
      fontSize: '14px',
      fontWeight: '600',
      color: '#1e40af',
      margin: '0 0 8px 0',
    },
    helpText: {
      color: '#1e40af',
      fontSize: '13px',
      margin: 0,
      lineHeight: '1.4',
    },
  };

  // Show specific comment selectors
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

  if (showNextStepsCommentSelector) {
    return (
      <NextStepsCommentSelector
        onSelectComment={handleSelectNextStepsComment}
        onBack={() => setShowNextStepsCommentSelector(false)}
      />
    );
  }

  if (showQualitiesCommentSelector) {
    return (
      <QualitiesCommentSelector
        onSelectComment={handleSelectQualitiesComment}
        onBack={() => setShowQualitiesCommentSelector(false)}
      />
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Add Section</h1>
        <p style={styles.subtitle}>
          Choose the type of section to add to your template
        </p>
      </div>

      <div style={styles.main}>
        <button onClick={onBack} style={styles.backButton}>
          ← Back to Template Builder
        </button>

        {/* Section Options - Responsive Grid */}
        <div style={styles.grid}>
          {sections.map((section) => (
            <button
              key={section.type}
              onClick={() => handleSectionClick(section.type)}
              style={{
                ...styles.sectionButton,
                border: `2px solid ${section.color}`,
              }}
              onMouseEnter={(e) => {
                if (!isMobile) {
                  const target = e.currentTarget as HTMLButtonElement;
                  target.style.backgroundColor = section.color;
                  target.style.color = 'white';
                  target.style.transform = 'translateY(-2px)';
                  target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isMobile) {
                  const target = e.currentTarget as HTMLButtonElement;
                  target.style.backgroundColor = 'white';
                  target.style.color = '#111827';
                  target.style.transform = 'translateY(0)';
                  target.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
                }
              }}
              // Mobile touch feedback
              onTouchStart={(e) => {
                if (isMobile) {
                  const target = e.currentTarget as HTMLButtonElement;
                  target.style.backgroundColor = section.color;
                  target.style.color = 'white';
                }
              }}
              onTouchEnd={(e) => {
                if (isMobile) {
                  const target = e.currentTarget as HTMLButtonElement;
                  setTimeout(() => {
                    target.style.backgroundColor = 'white';
                    target.style.color = '#111827';
                  }, 150);
                }
              }}
            >
              <h3 style={styles.sectionTitle}>
                {section.title}
                {(section.type === 'rated-comment' || 
                  section.type === 'standard-comment' || 
                  section.type === 'assessment-comment' || 
                  section.type === 'personalised-comment' || 
                  section.type === 'next-steps' || 
                  section.type === 'qualities') && (
                  <span style={styles.configurableBadge}>Configurable</span>
                )}
              </h3>
              <p style={styles.sectionDescription}>{section.description}</p>
            </button>
          ))}
        </div>

        {/* Mobile Help Text */}
        {isMobile && (
          <div style={styles.mobileHelp}>
            <h3 style={styles.helpTitle}>💡 Tip</h3>
            <p style={styles.helpText}>
              Sections with "Configurable" badges can be customized with your own comments and options. Others are ready to use immediately.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default SectionSelector;