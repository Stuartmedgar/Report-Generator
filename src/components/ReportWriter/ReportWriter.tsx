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
        const shouldContinue = window.confirm('You have unsaved changes. Continue anyway?');
        if (!shouldContinue) return;
      }
      setCurrentStudentIndex(prev => Math.max(0, prev - 1));
      reportLogic.setHasUnsavedChanges(false);
    },
    
    handleNextStudent: () => {
      if (reportLogic.hasUnsavedChanges) {
        const shouldContinue = window.confirm('You have unsaved changes. Continue anyway?');
        if (!shouldContinue) return;
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
  const handleSaveTemplateChanges = async () => {
    if (hasTemplateChanges) {
      const shouldSave = window.confirm('You have made changes to the template. Would you like to save them?');
      if (shouldSave) {
        try {
          const allSections = [...template.sections, ...dynamicSections];
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
        data: {}
      };
      setDynamicSections(prev => [...prev, newSection]);
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

  // Editing handlers
  const handleSaveEditedSection = (editedData: any) => {
    if (editingSection) {
      setHasTemplateChanges(true);
      const updatedSections = [...template.sections];
      updatedSections[editingSection.index] = {
        ...updatedSections[editingSection.index],
        ...editedData,
        data: { ...updatedSections[editingSection.index].data, ...editedData }
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
                onEditSection={(section: any, index: number) => {
                  setEditingSection({ section, index });
                  if (section.type === 'rated-comment') {
                    setShowRatedCommentBuilder(true);
                  } else if (section.type === 'assessment-comment') {
                    setShowAssessmentCommentBuilder(true);
                  } else if (section.type === 'personalised-comment') {
                    setShowPersonalisedCommentBuilder(true);
                  } else if (section.type === 'next-steps') {
                    setShowNextStepsCommentBuilder(true);
                  } else if (section.type === 'qualities') {
                    setShowQualitiesCommentBuilder(true);
                  }
                }}
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