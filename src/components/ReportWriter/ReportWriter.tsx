import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../../contexts/DataContext';
import { Template, Student } from '../../types';
import { useReportLogic } from './hooks/useReportLogic';
import { MobileReportWriter } from './MobileReportWriter';
import { EditableSection } from './EditableSection';
import { ReportPreview } from './ReportPreview';
import { StudentNavigation } from './StudentNavigation';
import RatedCommentBuilder from '../RatedCommentBuilder';
import AssessmentCommentBuilder from '../AssessmentCommentBuilder';
import PersonalisedCommentBuilder from '../PersonalisedCommentBuilder';
import NextStepsCommentBuilder from '../NextStepsCommentBuilder';
import QualitiesCommentBuilder from '../QualitiesCommentBuilder';

interface ReportWriterProps {
  template: Template;
  classData: any;
  students: Student[];
  onBack: () => void;
  startStudentIndex?: number;
}

// ─── DATA SHAPERS ─────────────────────────────────────────────────────────────
// Each builder expects a specific shape for existingComment.
// Template section.data uses different key names, so we reshape before opening.

function shapeForRatedBuilder(section: any) {
  return {
    name: section.name || '',
    comments: {
      excellent: section.data?.comments?.excellent || [],
      good: section.data?.comments?.good || [],
      satisfactory: section.data?.comments?.satisfactory || [],
      needsImprovement: section.data?.comments?.needsImprovement || [],
    },
  };
}

function shapeForAssessmentBuilder(section: any) {
  return {
    name: section.name || '',
    scoreType: section.data?.scoreType || 'outOf',
    maxScore: section.data?.maxScore,
    comments: {
      excellent: section.data?.comments?.excellent || [],
      good: section.data?.comments?.good || [],
      satisfactory: section.data?.comments?.satisfactory || [],
      needsImprovement: section.data?.comments?.needsImprovement || [],
      notCompleted: section.data?.comments?.notCompleted || [],
    },
  };
}

function shapeForQualitiesBuilder(section: any) {
  const commentsObj = section.data?.comments || {};
  return {
    name: section.name || '',
    headings: Object.keys(commentsObj),
    comments: commentsObj,
  };
}

function shapeForNextStepsBuilder(section: any) {
  // NextStepsCommentBuilder uses existingComment.comments (not focusAreas)
  const focusAreas = section.data?.focusAreas || section.data?.comments || {};
  return {
    name: section.name || '',
    headings: Object.keys(focusAreas),
    comments: focusAreas,
  };
}

function shapeForPersonalisedBuilder(section: any) {
  const categories = section.data?.categories || section.data?.comments || {};
  return {
    name: section.name || '',
    instruction: section.data?.instruction || '',
    headings: Object.keys(categories),
    comments: categories,
  };
}

// ─── COMPONENT ────────────────────────────────────────────────────────────────

function ReportWriter({ template, classData, students, onBack, startStudentIndex = 0 }: ReportWriterProps) {
  const navigate = useNavigate();
  const { updateTemplate } = useData();
  const [currentStudentIndex, setCurrentStudentIndex] = useState(startStudentIndex);
  const [showSectionOptions, setShowSectionOptions] = useState<number | null>(null);
  
  // Mobile state
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [activeTab, setActiveTab] = useState<'sections' | 'preview'>('sections');
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [hasTemplateChanges, setHasTemplateChanges] = useState(false);
  
  // Editing state
  const [editingSection, setEditingSection] = useState<{ section: any; index: number } | null>(null);
  const [showRatedCommentBuilder, setShowRatedCommentBuilder] = useState(false);
  const [showAssessmentCommentBuilder, setShowAssessmentCommentBuilder] = useState(false);
  const [showPersonalisedCommentBuilder, setShowPersonalisedCommentBuilder] = useState(false);
  const [showNextStepsCommentBuilder, setShowNextStepsCommentBuilder] = useState(false);
  const [showQualitiesCommentBuilder, setShowQualitiesCommentBuilder] = useState(false);

  // Dynamic sections state
  const [dynamicSections, setDynamicSections] = useState<any[]>([]);

  const currentStudent = students[currentStudentIndex];
  
  // Use the report logic hook
  const reportLogic = useReportLogic({
    template,
    classData,
    currentStudent,
    dynamicSections,
    setDynamicSections
  });

  const currentSectionData = reportLogic.sectionData;

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Navigation handlers
  const navigationHandlers = {
    handlePreviousStudent: () => {
      if (reportLogic.hasUnsavedChanges) {
        reportLogic.handleSaveReport();
      }
      setCurrentStudentIndex(prev => Math.max(0, prev - 1));
      reportLogic.setHasUnsavedChanges(false);
    },
    
    handleNextStudent: () => {
      if (reportLogic.hasUnsavedChanges) {
        reportLogic.handleSaveReport();
      }
      setCurrentStudentIndex(prev => Math.min(students.length - 1, prev + 1));
      reportLogic.setHasUnsavedChanges(false);
    },

    handleSaveReport: reportLogic.handleSaveReport,

    handleHome: () => navigate('/'),

    handleFinish: () => {
      if (reportLogic.hasUnsavedChanges) {
        const shouldSave = window.confirm('You have unsaved changes. Would you like to save before finishing?');
        if (shouldSave) {
          reportLogic.handleSaveReport();
        }
      }
      navigate('/view-reports');
    },

    handleViewAllReports: () => {
      if (reportLogic.hasUnsavedChanges) {
        const shouldSave = window.confirm('You have unsaved changes. Would you like to save before viewing reports?');
        if (shouldSave) {
          reportLogic.handleSaveReport();
        }
      }
      navigate('/view-reports');
    },

    handleSaveAsNewTemplate: reportLogic.handleSaveAsNewTemplate
  };

  // Touch handlers for mobile swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
    setTouchStartY(e.touches[0].clientY);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartX || !touchStartY) return;
    
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    
    const deltaX = touchStartX - touchEndX;
    const deltaY = Math.abs(touchStartY - touchEndY);
    
    if (Math.abs(deltaX) > 50 && deltaY < 50) {
      if (deltaX > 0) {
        navigationHandlers.handleNextStudent();
      } else {
        navigationHandlers.handlePreviousStudent();
      }
    }
    
    setTouchStartX(null);
    setTouchStartY(null);
  };

  // Handle saving template changes
  // FIX: Use reportLogic.getAllSections() so dynamic sections are interleaved
  // at the correct positions, not just appended to the end.
  const handleSaveTemplateChanges = async () => {
    if (hasTemplateChanges) {
      const shouldSave = window.confirm('You have made changes to the template. Would you like to save them?');
      if (shouldSave) {
        try {
          const allSections = reportLogic.getAllSections();
          await updateTemplate({ ...template, sections: allSections });
          alert('Template saved successfully!');
          setHasTemplateChanges(false);
        } catch (error) {
          alert('Error saving template. Please try again.');
        }
      }
    }
  };

  // Touch handlers object for mobile
  const touchHandlers = {
    onTouchStart: handleTouchStart,
    onTouchEnd: handleTouchEnd
  };

  // Dynamic section handlers
  const dynamicSectionHandlers = {
    handleAddDynamicSection: (sectionType: string, afterIndex: number) => {
      const newSection = {
        id: `dynamic-${Date.now()}`,
        type: sectionType,
        name: `New ${sectionType}`,
        data: {},
        insertAfter: afterIndex
      };
      setDynamicSections(prev => {
        const insertAt = prev.filter(s => s.insertAfter <= afterIndex).length;
        const updated = [...prev];
        updated.splice(insertAt, 0, newSection);
        return updated;
      });
      reportLogic.setSectionData((prev: any) => ({
        ...prev,
        [newSection.id]: { ...newSection.data }
      }));
      reportLogic.setHasUnsavedChanges(true);
    },
    handleRemoveDynamicSection: (sectionId: string) => {
      setDynamicSections(prev => prev.filter(section => section.id !== sectionId));
      reportLogic.setSectionData((prev: any) => {
        const updated = { ...prev };
        delete updated[sectionId];
        return updated;
      });
      reportLogic.setHasUnsavedChanges(true);
    },
    dynamicSections
  };

  // ─── EDIT SECTION HANDLER ──────────────────────────────────────────────────
  // FIX: Reshape section.data into what each builder actually expects before
  // storing as editingSection. Previously all builders received raw section.data
  // which caused empty builders because key names didn't match builder expectations.

  const handleOpenEditSection = (section: any, index: number) => {
    if (section.type === 'rated-comment') {
      setEditingSection({ section: { ...section, data: shapeForRatedBuilder(section) }, index });
      setShowRatedCommentBuilder(true);
    } else if (section.type === 'assessment-comment') {
      setEditingSection({ section: { ...section, data: shapeForAssessmentBuilder(section) }, index });
      setShowAssessmentCommentBuilder(true);
    } else if (section.type === 'personalised-comment') {
      setEditingSection({ section: { ...section, data: shapeForPersonalisedBuilder(section) }, index });
      setShowPersonalisedCommentBuilder(true);
    } else if (section.type === 'next-steps') {
      setEditingSection({ section: { ...section, data: shapeForNextStepsBuilder(section) }, index });
      setShowNextStepsCommentBuilder(true);
    } else if (section.type === 'qualities') {
      setEditingSection({ section: { ...section, data: shapeForQualitiesBuilder(section) }, index });
      setShowQualitiesCommentBuilder(true);
    }
  };

  // ─── SAVE EDITED SECTION ───────────────────────────────────────────────────
  // FIX: Write the builder's output back to the template in the correct shape
  // per section type. Previously it merged editedData directly onto data which
  // produced the wrong structure and corrupted the section.

  const handleSaveEditedSection = (editedData: any) => {
    if (editingSection) {
      setHasTemplateChanges(true);
      const updatedSections = [...template.sections];
      const original = updatedSections[editingSection.index];

      let newData: any;

      if (original.type === 'rated-comment') {
        newData = {
          comments: editedData.comments,
        };
      } else if (original.type === 'assessment-comment') {
        newData = {
          comments: editedData.comments,
          scoreType: editedData.scoreType,
          maxScore: editedData.maxScore,
        };
      } else if (original.type === 'qualities') {
        // Builder returns { headings, comments } — store as { comments }
        newData = {
          comments: editedData.comments,
        };
      } else if (original.type === 'next-steps') {
        // Builder returns { headings, comments } — store back as { focusAreas }
        newData = {
          focusAreas: editedData.comments,
        };
      } else if (original.type === 'personalised-comment') {
        newData = {
          instruction: editedData.instruction,
          categories: editedData.comments,
        };
      } else {
        // Fallback — preserve existing data shape
        newData = { ...original.data, ...editedData };
      }

      updatedSections[editingSection.index] = {
        ...original,
        name: editedData.name || original.name,
        data: newData,
      };

      updateTemplate({ ...template, sections: updatedSections });
    }
    
    setEditingSection(null);
    setShowRatedCommentBuilder(false);
    setShowAssessmentCommentBuilder(false);
    setShowPersonalisedCommentBuilder(false);
    setShowNextStepsCommentBuilder(false);
    setShowQualitiesCommentBuilder(false);
  };

  const editingState = {
    editingSection,
    setEditingSection,
    showRatedCommentBuilder,
    setShowRatedCommentBuilder,
    showAssessmentCommentBuilder,
    setShowAssessmentCommentBuilder,
    showPersonalisedCommentBuilder,
    setShowPersonalisedCommentBuilder,
    showNextStepsCommentBuilder,
    setShowNextStepsCommentBuilder,
    showQualitiesCommentBuilder,
    setShowQualitiesCommentBuilder,
    handleSaveEditedSection
  };

  // Mobile layout
  if (isMobile) {
    return (
      <MobileReportWriter
        template={template}
        classData={classData}
        students={students}
        currentStudentIndex={currentStudentIndex}
        currentStudent={currentStudent}
        currentSectionData={currentSectionData}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        touchHandlers={touchHandlers}
        navigationHandlers={navigationHandlers}
        reportLogic={{
          setSectionData: reportLogic.setSectionData,
          setHasUnsavedChanges: reportLogic.setHasUnsavedChanges,
          hasUnsavedChanges: reportLogic.hasUnsavedChanges,
          isPreviewEditing: reportLogic.isPreviewEditing,
          setIsPreviewEditing: reportLogic.setIsPreviewEditing,
          editableReportContent: reportLogic.editableReportContent,
          setEditableReportContent: reportLogic.setEditableReportContent,
          generateReportContent: reportLogic.generateReportContent,
          getAllSections: reportLogic.getAllSections,
          updateSectionData: reportLogic.updateSectionData
        }}
        dynamicSectionHandlers={dynamicSectionHandlers}
        editingState={editingState}
        showSectionOptions={showSectionOptions}
        setShowSectionOptions={setShowSectionOptions}
        hasTemplateChanges={hasTemplateChanges}
      />
    );
  }

  // Desktop layout
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      {/* Header */}
      <div style={{
        backgroundColor: 'white',
        borderBottom: '1px solid #e5e7eb',
        padding: '16px 20px',
        position: 'sticky',
        top: 0,
        zIndex: 10
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '8px'
          }}>
            <button
              onClick={onBack}
              style={{
                backgroundColor: '#6b7280',
                color: 'white',
                padding: '8px 16px',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              ← Back
            </button>

            {hasTemplateChanges && (
              <button
                onClick={handleSaveTemplateChanges}
                style={{
                  backgroundColor: '#8b5cf6',
                  color: 'white',
                  padding: '8px 16px',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                💾 Save as New Template
              </button>
            )}
          </div>
          
          <h1 style={{
            fontSize: '20px',
            fontWeight: '600',
            margin: 0,
            color: '#111827'
          }}>
            {template.name} - {currentStudent?.firstName} {currentStudent?.lastName}
          </h1>
        </div>
      </div>

      {/* Main Content */}
      <div style={{
        maxWidth: '1200px',
        margin: '20px auto',
        padding: '0 20px',
        display: 'flex',
        gap: '20px'
      }}>
        
        {/* Left Column - Sections */}
        <div style={{ flex: 1 }}>
          {reportLogic.getAllSections().map((section: any, index: number) => (
            <div key={section.id || index} style={{ marginBottom: '20px' }}>
              <EditableSection
                section={section}
                sectionIndex={index}
                sectionData={currentSectionData}
                updateSectionData={reportLogic.updateSectionData}
                onEditSection={handleOpenEditSection}
                showSectionOptions={showSectionOptions}
                setShowSectionOptions={setShowSectionOptions}
                onAddDynamicSection={dynamicSectionHandlers.handleAddDynamicSection}
                dynamicSections={dynamicSections}
                onRemoveDynamicSection={dynamicSectionHandlers.handleRemoveDynamicSection}
              />
            </div>
          ))}
        </div>

        {/* Right Column - Preview and Navigation (moves with scroll) */}
        <div style={{
          width: '400px',
          position: 'sticky',
          top: '20px',
          height: 'fit-content'
        }}>
          {/* Preview */}
          <ReportPreview
            generateReportContent={reportLogic.generateReportContent}
            isPreviewEditing={reportLogic.isPreviewEditing}
            editableReportContent={reportLogic.editableReportContent}
            setEditableReportContent={reportLogic.setEditableReportContent}
            onPreviewEdit={reportLogic.handlePreviewEdit}
            onSavePreviewEdit={reportLogic.handleSavePreviewEdit}
            hideEditButton={true}
          />

          {/* StudentNavigation - moves with preview */}
          <StudentNavigation
            currentStudentIndex={currentStudentIndex}
            studentsLength={students.length}
            hasUnsavedChanges={reportLogic.hasUnsavedChanges}
            onSaveReport={navigationHandlers.handleSaveReport}
            onPreviousStudent={navigationHandlers.handlePreviousStudent}
            onNextStudent={navigationHandlers.handleNextStudent}
            onFinish={navigationHandlers.handleFinish}
            onViewAllReports={navigationHandlers.handleViewAllReports}
          />
        </div>
      </div>

      {/* Comment Builders (shown as overlays when editing) */}
      {showRatedCommentBuilder && editingSection && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            maxWidth: '90vw',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <RatedCommentBuilder
              existingComment={editingSection.section.data}
              onSave={handleSaveEditedSection}
              onCancel={() => {
                setEditingSection(null);
                setShowRatedCommentBuilder(false);
              }}
            />
          </div>
        </div>
      )}

      {showAssessmentCommentBuilder && editingSection && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            maxWidth: '90vw',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <AssessmentCommentBuilder
              existingComment={editingSection.section.data}
              onSave={handleSaveEditedSection}
              onCancel={() => {
                setEditingSection(null);
                setShowAssessmentCommentBuilder(false);
              }}
            />
          </div>
        </div>
      )}

      {showPersonalisedCommentBuilder && editingSection && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            maxWidth: '90vw',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <PersonalisedCommentBuilder
              existingComment={editingSection.section.data}
              onSave={handleSaveEditedSection}
              onCancel={() => {
                setEditingSection(null);
                setShowPersonalisedCommentBuilder(false);
              }}
            />
          </div>
        </div>
      )}

      {showNextStepsCommentBuilder && editingSection && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            maxWidth: '90vw',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <NextStepsCommentBuilder
              existingComment={editingSection.section.data}
              onSave={handleSaveEditedSection}
              onCancel={() => {
                setEditingSection(null);
                setShowNextStepsCommentBuilder(false);
              }}
            />
          </div>
        </div>
      )}

      {showQualitiesCommentBuilder && editingSection && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            maxWidth: '90vw',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <QualitiesCommentBuilder
              existingComment={editingSection.section.data}
              onSave={handleSaveEditedSection}
              onCancel={() => {
                setEditingSection(null);
                setShowQualitiesCommentBuilder(false);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default ReportWriter;