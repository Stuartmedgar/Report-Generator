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

  // Dynamic sections state
  const [dynamicSections, setDynamicSections] = useState<any[]>([]);

  const currentStudent = students[currentStudentIndex];
  
  // Initialize report logic
  const reportLogic = useReportLogic({
    template,
    classData,
    currentStudent,
    dynamicSections,
    setDynamicSections
  });

  const currentSectionData = reportLogic.sectionData;

  // Window resize handler for mobile detection
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Touch handlers for mobile swiping
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
    setTouchStartY(e.touches[0].clientY);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartX || !touchStartY) return;

    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const diffX = touchStartX - touchEndX;
    const diffY = touchStartY - touchEndY;

    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
      if (diffX > 0) {
        setActiveTab('preview');
      } else {
        setActiveTab('sections');
      }
    }
  };

  // Navigation handlers - FIXED: Use correct function names to match MobileReportWriter props
  const navigationHandlers = {
    handlePreviousStudent: () => {
      if (currentStudentIndex > 0) {
        setCurrentStudentIndex(prev => prev - 1);
      }
    },
    handleNextStudent: () => {
      if (currentStudentIndex < students.length - 1) {
        setCurrentStudentIndex(prev => prev + 1);
      }
    },
    handleSaveReport: reportLogic.handleSaveReport, // FIXED: Use the correct function name
    handleBack: onBack,
    handleHome: () => navigate('/'),
    handleFinish: onBack, // FIXED: Add handleFinish that MobileReportWriter expects
    handleViewAllReports: () => {
      navigate('/view-reports', { 
        state: { 
          template, 
          classData, 
          students,
          returnTo: 'write-reports'
        } 
      });
    },
    handleSaveAsNewTemplate: () => {
      const templateName = prompt('Enter a name for the new template:');
      if (templateName) {
        const newTemplate = {
          ...template,
          id: `template-${Date.now()}`,
          name: templateName,
          createdAt: new Date().toISOString()
        };
        
        try {
          updateTemplate(newTemplate);
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
          updateSectionData: reportLogic.updateSectionData // FIXED: Pass the actual updateSectionData function!
        }}
        editingState={editingState}
        dynamicSectionHandlers={dynamicSectionHandlers}
        showSectionOptions={showSectionOptions}
        setShowSectionOptions={setShowSectionOptions}
        hasTemplateChanges={hasTemplateChanges}
      />
    );
  }

  // Desktop layout with correct original features
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6' }}>
      
      {/* Header with Back/Home buttons */}
      <div style={{
        backgroundColor: 'white',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        padding: '16px 24px',
        borderBottom: '1px solid #e5e7eb'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
          }}>
            <button
              onClick={navigationHandlers.handleBack}
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
              ⬅️ Back
            </button>
            <button
              onClick={navigationHandlers.handleHome}
              style={{
                backgroundColor: '#3b82f6',
                color: 'white',
                padding: '8px 16px',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              🏠 Home
            </button>
            {hasTemplateChanges && (
              <button
                onClick={navigationHandlers.handleSaveAsNewTemplate}
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
                updateSectionData={reportLogic.updateSectionData} // FIXED: Use the actual updateSectionData function
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
            onPreviewEdit={reportLogic.handlePreviewEdit} // FIXED: Use correct function name
            onSavePreviewEdit={reportLogic.handleSavePreviewEdit} // FIXED: Use correct function name
            hideEditButton={true}
          />

          {/* StudentNavigation - moves with preview */}
          <StudentNavigation
            currentStudentIndex={currentStudentIndex}
            studentsLength={students.length} // FIXED: Use studentsLength instead of students
            hasUnsavedChanges={reportLogic.hasUnsavedChanges}
            onSaveReport={navigationHandlers.handleSaveReport}
            onPreviousStudent={navigationHandlers.handlePreviousStudent} // FIXED: Correct prop name
            onNextStudent={navigationHandlers.handleNextStudent} // FIXED: Correct prop name
            onFinish={navigationHandlers.handleFinish} // FIXED: Add required onFinish prop
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
    </div>
  );
}

export default ReportWriter;