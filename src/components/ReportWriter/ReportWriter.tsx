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

  const reportLogic = useReportLogic({
    template,
    classData,
    currentStudent,
    dynamicSections,
    setDynamicSections
  });

  const currentSectionData = reportLogic.sectionData;

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ─── PRONOUN HANDLER ──────────────────────────────────────────────────────
  // Pronoun is stored per-student in sectionData under a special '__student__' key

  const currentPronoun = currentSectionData['__student__']?.pronounOverride || '';

  const handlePronounChange = (pronoun: string) => {
    reportLogic.setSectionData((prev: any) => ({
      ...prev,
      '__student__': { ...prev['__student__'], pronounOverride: pronoun }
    }));
    reportLogic.setHasUnsavedChanges(true);
  };

  // ─── END-OF-SESSION TEMPLATE SAVE ─────────────────────────────────────────

  const promptSaveTemplate = async () => {
    if (!reportLogic.hasTemplateChanges) return;
    const shouldSave = window.confirm(
      'You made changes to the template during this session.\n\nWould you like to save these changes? They will replace the current template.'
    );
    if (shouldSave) {
      const success = await reportLogic.handleSaveWorkingTemplate();
      if (success) {
        alert('Template saved successfully.');
      } else {
        alert('There was a problem saving the template. Please try again.');
      }
    }
  };

  // Navigation handlers
  const navigationHandlers = {
    handlePreviousStudent: () => {
      if (reportLogic.hasUnsavedChanges) reportLogic.handleSaveReport();
      setCurrentStudentIndex(prev => Math.max(0, prev - 1));
      reportLogic.setHasUnsavedChanges(false);
    },

    handleNextStudent: () => {
      if (reportLogic.hasUnsavedChanges) reportLogic.handleSaveReport();
      setCurrentStudentIndex(prev => Math.min(students.length - 1, prev + 1));
      reportLogic.setHasUnsavedChanges(false);
    },

    handleSaveReport: reportLogic.handleSaveReport,

    handleHome: () => navigate('/'),

    handleFinish: async () => {
      if (reportLogic.hasUnsavedChanges) {
        const shouldSave = window.confirm('You have unsaved changes. Would you like to save before finishing?');
        if (shouldSave) reportLogic.handleSaveReport();
      }
      await promptSaveTemplate();
      navigate('/view-reports');
    },

    handleViewAllReports: async () => {
      if (reportLogic.hasUnsavedChanges) {
        const shouldSave = window.confirm('You have unsaved changes. Would you like to save before viewing reports?');
        if (shouldSave) reportLogic.handleSaveReport();
      }
      await promptSaveTemplate();
      navigate('/view-reports');
    },

    handleSaveAsNewTemplate: reportLogic.handleSaveAsNewTemplate
  };

  // Touch handlers
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
      if (deltaX > 0) navigationHandlers.handleNextStudent();
      else navigationHandlers.handlePreviousStudent();
    }
    setTouchStartX(null);
    setTouchStartY(null);
  };

  const touchHandlers = { onTouchStart: handleTouchStart, onTouchEnd: handleTouchEnd };

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

  // ─── EDIT SECTION HANDLERS ────────────────────────────────────────────────

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

  const handleSaveEditedSection = (editedData: any) => {
    if (editingSection) {
      const updatedSections = [...reportLogic.workingTemplate.sections];
      const original = updatedSections[editingSection.index];
      let newData: any;

      if (original.type === 'rated-comment') {
        newData = { comments: editedData.comments };
      } else if (original.type === 'assessment-comment') {
        newData = { comments: editedData.comments, scoreType: editedData.scoreType, maxScore: editedData.maxScore };
      } else if (original.type === 'qualities') {
        newData = { comments: editedData.comments };
      } else if (original.type === 'next-steps') {
        newData = { focusAreas: editedData.comments };
      } else if (original.type === 'personalised-comment') {
        newData = { instruction: editedData.instruction, categories: editedData.comments };
      } else {
        newData = { ...original.data, ...editedData };
      }

      // Update via workingTemplate rather than saved template
      reportLogic.handleTemplateAction({
        type: 'replace',
        sectionId: original.id,
        commentText: '',  // not used for full-section edit
        buttonName: '__full_section_replace__',
      });

      // Direct working template update for full section replace from builder
      // We call updateTemplate on workingTemplate shallowly — handled in useReportLogic
      updateTemplate({ ...reportLogic.workingTemplate, sections: updatedSections.map((s, i) =>
        i === editingSection.index ? { ...s, name: editedData.name || s.name, data: newData } : s
      )});
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
        hasTemplateChanges={reportLogic.hasTemplateChanges}
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <button
              onClick={onBack}
              style={{ backgroundColor: '#6b7280', color: 'white', padding: '8px 16px', border: 'none', borderRadius: '6px', fontSize: '14px', fontWeight: '500', cursor: 'pointer' }}
            >
              ← Back
            </button>

            {reportLogic.hasTemplateChanges && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '12px', color: '#6b7280', fontStyle: 'italic' }}>
                  Template has unsaved changes
                </span>
                <button
                  onClick={async () => {
                    const success = await reportLogic.handleSaveWorkingTemplate();
                    if (success) alert('Template saved.');
                  }}
                  style={{ backgroundColor: '#8b5cf6', color: 'white', padding: '8px 16px', border: 'none', borderRadius: '6px', fontSize: '14px', fontWeight: '500', cursor: 'pointer' }}
                >
                  💾 Save Template Now
                </button>
              </div>
            )}
          </div>

          <h1 style={{ fontSize: '20px', fontWeight: '600', margin: 0, color: '#111827' }}>
            {template.name} — {currentStudent?.firstName} {currentStudent?.lastName}
          </h1>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ maxWidth: '1200px', margin: '20px auto', padding: '0 20px', display: 'flex', gap: '20px' }}>

        {/* Left Column - Sections */}
        <div style={{ flex: 1 }}>
          {(() => {
            let templateIndex = -1;
            return reportLogic.getAllSections().map((section: any, index: number) => {
              const isDynamic = section.id?.startsWith('dynamic-');
              if (!isDynamic) templateIndex++;
              const indexForAdd = templateIndex;
              return (
                <div key={section.id || index} style={{ marginBottom: '20px' }}>
                  <EditableSection
                    section={section}
                    sectionIndex={indexForAdd}
                    sectionData={currentSectionData}
                    updateSectionData={reportLogic.updateSectionData}
                    onEditSection={handleOpenEditSection}
                    showSectionOptions={showSectionOptions}
                    setShowSectionOptions={setShowSectionOptions}
                    onAddDynamicSection={dynamicSectionHandlers.handleAddDynamicSection}
                    dynamicSections={dynamicSections}
                    onRemoveDynamicSection={dynamicSectionHandlers.handleRemoveDynamicSection}
                    onTemplateAction={reportLogic.handleTemplateAction}
                    onAddButton={reportLogic.handleAddButton}
                    onDuplicateSection={reportLogic.handleDuplicateSection}
                  />
                </div>
              );
            });
          })()}
        </div>

        {/* Right Column */}
        <div style={{ width: '400px', position: 'sticky', top: '20px', height: 'fit-content' }}>
          <ReportPreview
            generateReportContent={reportLogic.generateReportContent}
            isPreviewEditing={reportLogic.isPreviewEditing}
            editableReportContent={reportLogic.editableReportContent}
            setEditableReportContent={reportLogic.setEditableReportContent}
            onPreviewEdit={reportLogic.handlePreviewEdit}
            onSavePreviewEdit={reportLogic.handleSavePreviewEdit}
            hideEditButton={true}
          />

          <StudentNavigation
            currentStudentIndex={currentStudentIndex}
            studentsLength={students.length}
            hasUnsavedChanges={reportLogic.hasUnsavedChanges}
            onSaveReport={navigationHandlers.handleSaveReport}
            onPreviousStudent={navigationHandlers.handlePreviousStudent}
            onNextStudent={navigationHandlers.handleNextStudent}
            onFinish={navigationHandlers.handleFinish}
            onViewAllReports={navigationHandlers.handleViewAllReports}
            pronounOverride={currentPronoun}
            onPronounChange={handlePronounChange}
          />
        </div>
      </div>

      {/* Comment Builders */}
      {showRatedCommentBuilder && editingSection && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '8px', maxWidth: '90vw', maxHeight: '90vh', overflow: 'auto' }}>
            <RatedCommentBuilder existingComment={editingSection.section.data} onSave={handleSaveEditedSection}
              onCancel={() => { setEditingSection(null); setShowRatedCommentBuilder(false); }} />
          </div>
        </div>
      )}

      {showAssessmentCommentBuilder && editingSection && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '8px', maxWidth: '90vw', maxHeight: '90vh', overflow: 'auto' }}>
            <AssessmentCommentBuilder existingComment={editingSection.section.data} onSave={handleSaveEditedSection}
              onCancel={() => { setEditingSection(null); setShowAssessmentCommentBuilder(false); }} />
          </div>
        </div>
      )}

      {showPersonalisedCommentBuilder && editingSection && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '8px', maxWidth: '90vw', maxHeight: '90vh', overflow: 'auto' }}>
            <PersonalisedCommentBuilder existingComment={editingSection.section.data} onSave={handleSaveEditedSection}
              onCancel={() => { setEditingSection(null); setShowPersonalisedCommentBuilder(false); }} />
          </div>
        </div>
      )}

      {showNextStepsCommentBuilder && editingSection && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '8px', maxWidth: '90vw', maxHeight: '90vh', overflow: 'auto' }}>
            <NextStepsCommentBuilder existingComment={editingSection.section.data} onSave={handleSaveEditedSection}
              onCancel={() => { setEditingSection(null); setShowNextStepsCommentBuilder(false); }} />
          </div>
        </div>
      )}

      {showQualitiesCommentBuilder && editingSection && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '8px', maxWidth: '90vw', maxHeight: '90vh', overflow: 'auto' }}>
            <QualitiesCommentBuilder existingComment={editingSection.section.data} onSave={handleSaveEditedSection}
              onCancel={() => { setEditingSection(null); setShowQualitiesCommentBuilder(false); }} />
          </div>
        </div>
      )}
    </div>
  );
}

export default ReportWriter;