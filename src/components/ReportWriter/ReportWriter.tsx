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
import StandardCommentBuilder from '../StandardCommentBuilder';
import { ReportWriterTour } from './ReportWriterTour';

interface ReportWriterProps {
  template: Template;
  classData: any;
  students: Student[];
  onBack: () => void;
  startStudentIndex?: number;
  tourSource?: 'ai-builder' | 'wizard';
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
  return { name: section.name || '', headings: Object.keys(commentsObj), comments: commentsObj };
}

function shapeForNextStepsBuilder(section: any) {
  const focusAreas = section.data?.focusAreas || section.data?.comments || {};
  return { name: section.name || '', headings: Object.keys(focusAreas), comments: focusAreas };
}

function shapeForPersonalisedBuilder(section: any) {
  const categories = section.data?.categories || section.data?.comments || {};
  return { name: section.name || '', instruction: section.data?.instruction || '', headings: Object.keys(categories), comments: categories };
}

// ─── BUILDER OVERLAY ─────────────────────────────────────────────────────────

const BuilderOverlay: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{
    position: 'fixed', inset: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 1000,
    display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
    padding: '20px',
    overflowY: 'auto',
  }}>
    <div style={{
      backgroundColor: 'white',
      borderRadius: '8px',
      width: '100%',
      maxWidth: '1100px',
      minHeight: 'min-content',
    }}>
      {children}
    </div>
  </div>
);

// ─── COMPONENT ────────────────────────────────────────────────────────────────

function ReportWriter({ template, classData, students, onBack, startStudentIndex = 0, tourSource }: ReportWriterProps) {
  const navigate = useNavigate();
  const { updateTemplate } = useData();
  const [currentStudentIndex, setCurrentStudentIndex] = useState(startStudentIndex);
  const [showSectionOptions, setShowSectionOptions] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [activeTab, setActiveTab] = useState<'sections' | 'preview'>('sections');
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [editingSection, setEditingSection] = useState<{ section: any; index: number } | null>(null);
  const [showRatedCommentBuilder, setShowRatedCommentBuilder] = useState(false);
  const [showAssessmentCommentBuilder, setShowAssessmentCommentBuilder] = useState(false);
  const [showPersonalisedCommentBuilder, setShowPersonalisedCommentBuilder] = useState(false);
  const [showNextStepsCommentBuilder, setShowNextStepsCommentBuilder] = useState(false);
  const [showQualitiesCommentBuilder, setShowQualitiesCommentBuilder] = useState(false);
  const [showStandardCommentBuilder, setShowStandardCommentBuilder] = useState(false);
  const [addingSectionAfterIndex, setAddingSectionAfterIndex] = useState<number | null>(null);
  const [addingSectionType, setAddingSectionType] = useState<string | null>(null);
  const [dynamicSections, setDynamicSections] = useState<any[]>([]);
  const [activeTour, setActiveTour] = useState<'writing' | 'editing' | 'ai-builder' | 'wizard' | null>(null);
  const [helpMenuOpen, setHelpMenuOpen] = useState(false);

  const currentStudent = students[currentStudentIndex];

  const reportLogic = useReportLogic({ template, classData, currentStudent, dynamicSections, setDynamicSections });
  const currentSectionData = reportLogic.sectionData;

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (tourSource === 'ai-builder') {
      setActiveTour('ai-builder');
    } else if (tourSource === 'wizard') {
      setActiveTour('wizard');
    } else if (!tourSource && !localStorage.getItem('erg_rwTourSeen')) {
      setActiveTour('writing');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDismissTour = () => {
    if (activeTour === 'writing') localStorage.setItem('erg_rwTourSeen', 'true');
    setActiveTour(null);
  };

  // ─── PRONOUN ──────────────────────────────────────────────────────────────

  const currentPronoun = currentSectionData['__student__']?.pronounOverride || '';

  const handlePronounChange = (pronoun: string) => {
    reportLogic.setSectionData((prev: any) => ({
      ...prev,
      '__student__': { ...prev['__student__'], pronounOverride: pronoun },
    }));
    reportLogic.setHasUnsavedChanges(true);
  };

  // ─── END-OF-SESSION TEMPLATE SAVE ─────────────────────────────────────────

  const promptSaveTemplate = async () => {
    if (!reportLogic.hasTemplateChanges) return;
    const shouldSave = window.confirm(
      'You made changes to the template during this session.\n\nSave these changes? They will replace the current template.'
    );
    if (shouldSave) {
      const ok = await reportLogic.handleSaveWorkingTemplate();
      alert(ok ? 'Template saved successfully.' : 'Problem saving template. Please try again.');
    }
  };

  // ─── NAVIGATION ───────────────────────────────────────────────────────────

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
    const deltaX = touchStartX - e.changedTouches[0].clientX;
    const deltaY = Math.abs(touchStartY - e.changedTouches[0].clientY);
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
      const newSection = { id: `dynamic-${Date.now()}`, type: sectionType, name: `New ${sectionType}`, data: {}, insertAfter: afterIndex };
      setDynamicSections(prev => {
        const insertAt = prev.filter(s => s.insertAfter <= afterIndex).length;
        const updated = [...prev];
        updated.splice(insertAt, 0, newSection);
        return updated;
      });
      reportLogic.setSectionData((prev: any) => ({ ...prev, [newSection.id]: { ...newSection.data } }));
      reportLogic.setHasUnsavedChanges(true);
    },
    handleRemoveDynamicSection: (sectionId: string) => {
      setDynamicSections(prev => prev.filter(section => section.id !== sectionId));
      reportLogic.setSectionData((prev: any) => { const updated = { ...prev }; delete updated[sectionId]; return updated; });
      reportLogic.setHasUnsavedChanges(true);
    },
    dynamicSections
  };

  // ─── EDIT SECTION HANDLERS ────────────────────────────────────────────────

  const handleOpenEditSection = (section: any, index: number) => {
    if (section.type === 'rated-comment') { setEditingSection({ section: { ...section, data: shapeForRatedBuilder(section) }, index }); setShowRatedCommentBuilder(true); }
    else if (section.type === 'assessment-comment') { setEditingSection({ section: { ...section, data: shapeForAssessmentBuilder(section) }, index }); setShowAssessmentCommentBuilder(true); }
    else if (section.type === 'personalised-comment') { setEditingSection({ section: { ...section, data: shapeForPersonalisedBuilder(section) }, index }); setShowPersonalisedCommentBuilder(true); }
    else if (section.type === 'next-steps') { setEditingSection({ section: { ...section, data: shapeForNextStepsBuilder(section) }, index }); setShowNextStepsCommentBuilder(true); }
    else if (section.type === 'qualities') { setEditingSection({ section: { ...section, data: shapeForQualitiesBuilder(section) }, index }); setShowQualitiesCommentBuilder(true); }
  };

  const closeAllBuilders = () => {
    setEditingSection(null);
    setAddingSectionAfterIndex(null);
    setAddingSectionType(null);
    setShowRatedCommentBuilder(false);
    setShowAssessmentCommentBuilder(false);
    setShowPersonalisedCommentBuilder(false);
    setShowNextStepsCommentBuilder(false);
    setShowQualitiesCommentBuilder(false);
    setShowStandardCommentBuilder(false);
  };

  const handleSaveEditedSection = (editedData: any) => {
    if (editingSection) {
      const original = reportLogic.workingTemplate.sections[editingSection.index];
      let newData: any;
      if (original.type === 'rated-comment') newData = { ...original.data, comments: editedData.comments };
      else if (original.type === 'assessment-comment') newData = { ...original.data, comments: editedData.comments, scoreType: editedData.scoreType, maxScore: editedData.maxScore };
      else if (original.type === 'next-steps') newData = { ...original.data, focusAreas: editedData.comments };
      else if (original.type === 'personalised-comment') newData = { ...original.data, instruction: editedData.instruction, categories: editedData.comments };
      else if (original.type === 'qualities') newData = { ...original.data, comments: editedData.comments };
      else newData = { ...original.data, ...editedData };
      const updatedSection = { ...original, name: editedData.name || original.name, data: newData };
      reportLogic.handleUpdateWorkingSection(editingSection.index, updatedSection);
    }
    closeAllBuilders();
  };

  const handleDeleteSection = (sectionId: string) => {
    if (window.confirm('Remove this section from the template?')) {
      reportLogic.handleDeleteSection(sectionId);
    }
  };

  const handleAddTemplateSection = (sectionType: string, afterIndex: number) => {
    // new-line and optional-additional-comment need no builder — insert directly
    if (sectionType === 'new-line' || sectionType === 'optional-additional-comment') {
      const newSection = {
        id: `section-${Date.now()}`,
        type: sectionType,
        name: sectionType === 'new-line' ? 'Line Break' : 'Optional Comment',
        data: {},
      };
      reportLogic.handleInsertSection(newSection, afterIndex);
      return;
    }
    setAddingSectionAfterIndex(afterIndex);
    setAddingSectionType(sectionType);
    if (sectionType === 'rated-comment') setShowRatedCommentBuilder(true);
    else if (sectionType === 'assessment-comment') setShowAssessmentCommentBuilder(true);
    else if (sectionType === 'personalised-comment') setShowPersonalisedCommentBuilder(true);
    else if (sectionType === 'next-steps') setShowNextStepsCommentBuilder(true);
    else if (sectionType === 'qualities') setShowQualitiesCommentBuilder(true);
    else if (sectionType === 'standard-comment') setShowStandardCommentBuilder(true);
  };

  const handleSaveNewSection = (editedData: any) => {
    if (addingSectionAfterIndex === null || !addingSectionType) return;
    let data: any;
    if (addingSectionType === 'rated-comment') data = { comments: editedData.comments };
    else if (addingSectionType === 'assessment-comment') data = { comments: editedData.comments, scoreType: editedData.scoreType, maxScore: editedData.maxScore };
    else if (addingSectionType === 'next-steps') data = { focusAreas: editedData.comments };
    else if (addingSectionType === 'personalised-comment') data = { instruction: editedData.instruction, categories: editedData.comments };
    else if (addingSectionType === 'qualities') data = { comments: editedData.comments };
    else if (addingSectionType === 'standard-comment') data = editedData.data;
    else data = editedData;
    const newSection = {
      id: `section-${Date.now()}`,
      type: addingSectionType,
      name: editedData.name || addingSectionType,
      data,
    };
    reportLogic.handleInsertSection(newSection, addingSectionAfterIndex);
    closeAllBuilders();
  };

  const editingState = {
    editingSection, setEditingSection,
    showRatedCommentBuilder, setShowRatedCommentBuilder,
    showAssessmentCommentBuilder, setShowAssessmentCommentBuilder,
    showPersonalisedCommentBuilder, setShowPersonalisedCommentBuilder,
    showNextStepsCommentBuilder, setShowNextStepsCommentBuilder,
    showQualitiesCommentBuilder, setShowQualitiesCommentBuilder,
    handleSaveEditedSection
  };

  // Mobile layout
  if (isMobile) {
    return (
      <MobileReportWriter
        template={template} classData={classData} students={students}
        currentStudentIndex={currentStudentIndex} currentStudent={currentStudent}
        currentSectionData={currentSectionData} activeTab={activeTab} setActiveTab={setActiveTab}
        touchHandlers={touchHandlers} navigationHandlers={navigationHandlers}
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
        dynamicSectionHandlers={dynamicSectionHandlers} editingState={editingState}
        showSectionOptions={showSectionOptions} setShowSectionOptions={setShowSectionOptions}
        hasTemplateChanges={reportLogic.hasTemplateChanges}
      />
    );
  }

  // Desktop layout
  const allSections = reportLogic.getAllSections();
  const templateSectionIds = new Set(reportLogic.workingTemplate.sections.map((s: any) => s.id));

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      {/* Header */}
      <div style={{ backgroundColor: 'white', borderBottom: '1px solid #e5e7eb', padding: '16px 20px', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button onClick={onBack}
                style={{
                  background: 'none', border: 'none', color: '#9ca3af',
                  fontSize: '13px', cursor: 'pointer', padding: 0
                }}>
                ⌂ Exit to Home
              </button>
              <div style={{ position: 'relative' }}>
                <button onClick={() => setHelpMenuOpen(o => !o)}
                  title="Show feature tour"
                  style={{ background: 'none', border: '1px solid #e5e7eb', color: '#6b7280', fontSize: '12px', cursor: 'pointer', padding: '4px 10px', borderRadius: '6px' }}>
                  ? Help
                </button>
                {helpMenuOpen && (
                  <>
                    <div style={{ position: 'fixed', inset: 0, zIndex: 98 }} onClick={() => setHelpMenuOpen(false)} />
                    <div style={{
                      position: 'absolute', top: 'calc(100% + 4px)', left: 0,
                      backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.12)', padding: '4px', minWidth: '200px',
                      zIndex: 99,
                    }}>
                      <button
                        onClick={() => { setActiveTour('writing'); setHelpMenuOpen(false); }}
                        style={{ display: 'block', width: '100%', textAlign: 'left', padding: '10px 12px', border: 'none', background: 'none', fontSize: '13px', cursor: 'pointer', borderRadius: '4px', color: '#374151' }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = '#eff6ff'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                      >📝 Writing reports</button>
                      <button
                        onClick={() => { setActiveTour('editing'); setHelpMenuOpen(false); }}
                        style={{ display: 'block', width: '100%', textAlign: 'left', padding: '10px 12px', border: 'none', background: 'none', fontSize: '13px', cursor: 'pointer', borderRadius: '4px', color: '#374151' }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f5f3ff'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                      >🔧 Editing templates</button>
                    </div>
                  </>
                )}
              </div>
            </div>

            {reportLogic.hasTemplateChanges && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '12px', color: '#6b7280', fontStyle: 'italic' }}>Template has unsaved changes</span>
                <button
                  data-tour="save-template"
                  onClick={async () => { const ok = await reportLogic.handleSaveWorkingTemplate(); if (ok) alert('Template saved.'); }}
                  style={{ backgroundColor: '#8b5cf6', color: 'white', padding: '8px 16px', border: 'none', borderRadius: '6px', fontSize: '14px', fontWeight: '500', cursor: 'pointer' }}>
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
          {/* Global pronoun selector above first section */}
          <div data-tour="pronoun" style={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '13px', fontWeight: '600', color: '#374151' }}>Pronoun for this student:</span>
            {[{ value: 'he', label: 'He / His' }, { value: 'she', label: 'She / Her' }, { value: 'they', label: 'They / Them' }].map(opt => (
              <button key={opt.value} onClick={() => handlePronounChange(opt.value)}
                style={{ padding: '5px 14px', border: '2px solid #3b82f6', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', backgroundColor: currentPronoun === opt.value ? '#3b82f6' : 'white', color: currentPronoun === opt.value ? 'white' : '#3b82f6', transition: 'all 0.15s' }}>
                {opt.label}
              </button>
            ))}
            {currentPronoun === 'they' && <span style={{ fontSize: '11px', color: '#92400e', backgroundColor: '#fef3c7', padding: '3px 8px', borderRadius: '4px' }}>⚠️ Some verb forms may need manual adjustment</span>}
          </div>

          {(() => {
            let templateIndex = -1;
            return allSections.map((section: any, index: number) => {
              const isDynamic = section.id?.startsWith('dynamic-');
              if (!isDynamic) templateIndex++;
              const indexForAdd = templateIndex;
              const isTemplateSec = templateSectionIds.has(section.id);
              const templateSecIndex = reportLogic.workingTemplate.sections.findIndex((s: any) => s.id === section.id);

              return (
                <div key={section.id || index} style={{ marginBottom: '20px', position: 'relative' }}>
                  {isTemplateSec && (
                    <div data-tour="reorder" style={{
                      position: 'absolute', top: '8px', left: '-36px',
                      display: 'flex', flexDirection: 'column', gap: '2px', zIndex: 5,
                    }}>
                      <button
                        onClick={() => reportLogic.handleReorderSection(section.id, 'up')}
                        disabled={templateSecIndex === 0}
                        title="Move section up"
                        style={{
                          width: '28px', height: '24px', border: 'none',
                          borderRadius: '4px', fontSize: '11px', cursor: templateSecIndex === 0 ? 'default' : 'pointer',
                          backgroundColor: templateSecIndex === 0 ? '#f3f4f6' : '#e5e7eb',
                          color: templateSecIndex === 0 ? '#d1d5db' : '#374151',
                        }}
                      >▲</button>
                      <button
                        onClick={() => reportLogic.handleReorderSection(section.id, 'down')}
                        disabled={templateSecIndex === reportLogic.workingTemplate.sections.length - 1}
                        title="Move section down"
                        style={{
                          width: '28px', height: '24px', border: 'none',
                          borderRadius: '4px', fontSize: '11px',
                          cursor: templateSecIndex === reportLogic.workingTemplate.sections.length - 1 ? 'default' : 'pointer',
                          backgroundColor: templateSecIndex === reportLogic.workingTemplate.sections.length - 1 ? '#f3f4f6' : '#e5e7eb',
                          color: templateSecIndex === reportLogic.workingTemplate.sections.length - 1 ? '#d1d5db' : '#374151',
                        }}
                      >▼</button>
                    </div>
                  )}

                  <EditableSection
                    section={section}
                    sectionIndex={indexForAdd}
                    sectionData={currentSectionData}
                    updateSectionData={reportLogic.updateSectionData}
                    onEditSection={handleOpenEditSection}
                    showSectionOptions={showSectionOptions}
                    setShowSectionOptions={setShowSectionOptions}
                    onAddDynamicSection={dynamicSectionHandlers.handleAddDynamicSection}
                    onAddTemplateSection={handleAddTemplateSection}
                    dynamicSections={dynamicSections}
                    onRemoveDynamicSection={dynamicSectionHandlers.handleRemoveDynamicSection}
                    onTemplateAction={reportLogic.handleTemplateAction}
                    onAddButton={reportLogic.handleAddButton}
                    onDuplicateSection={reportLogic.handleDuplicateSection}
                    onMergeSections={reportLogic.handleMergeSections}
                    workingTemplateSections={reportLogic.workingTemplate.sections}
                    onRenameSection={reportLogic.handleRenameSection}
                    onDeleteSection={isTemplateSec ? handleDeleteSection : undefined}
                    globalPronoun={currentPronoun}
                  />
                </div>
              );
            });
          })()}
        </div>

        {/* Right Column */}
        <div style={{ width: '400px', position: 'sticky', top: '20px', height: 'fit-content' }}>
          <div data-tour="preview">
            <ReportPreview
              generateReportContent={reportLogic.generateReportContent}
              isPreviewEditing={reportLogic.isPreviewEditing}
              editableReportContent={reportLogic.editableReportContent}
              setEditableReportContent={reportLogic.setEditableReportContent}
              onPreviewEdit={reportLogic.handlePreviewEdit}
              onSavePreviewEdit={reportLogic.handleSavePreviewEdit}
              hideEditButton={true}
            />
          </div>
          <div data-tour="navigation">
            <StudentNavigation
              currentStudentIndex={currentStudentIndex}
              studentsLength={students.length}
              hasUnsavedChanges={reportLogic.hasUnsavedChanges}
              onSaveReport={navigationHandlers.handleSaveReport}
              onPreviousStudent={navigationHandlers.handlePreviousStudent}
              onNextStudent={navigationHandlers.handleNextStudent}
              onFinish={navigationHandlers.handleFinish}
              onViewAllReports={navigationHandlers.handleViewAllReports}
              pronounOverride={undefined}
              onPronounChange={undefined}
            />
          </div>
        </div>
      </div>

      {activeTour && <ReportWriterTour tourType={activeTour} onDismiss={handleDismissTour} />}

      {/* Comment Builders */}
      {showRatedCommentBuilder && (editingSection || addingSectionType === 'rated-comment') && (
        <BuilderOverlay>
          <RatedCommentBuilder existingComment={editingSection ? editingSection.section.data : { name: '', comments: { excellent: [], good: [], satisfactory: [], needsImprovement: [] } }} onSave={addingSectionType ? handleSaveNewSection : handleSaveEditedSection} onCancel={closeAllBuilders} />
        </BuilderOverlay>
      )}
      {showAssessmentCommentBuilder && (editingSection || addingSectionType === 'assessment-comment') && (
        <BuilderOverlay>
          <AssessmentCommentBuilder existingComment={editingSection ? editingSection.section.data : { name: '', scoreType: 'outOf', comments: { excellent: [], good: [], satisfactory: [], needsImprovement: [], notCompleted: [] } }} onSave={addingSectionType ? handleSaveNewSection : handleSaveEditedSection} onCancel={closeAllBuilders} />
        </BuilderOverlay>
      )}
      {showPersonalisedCommentBuilder && (editingSection || addingSectionType === 'personalised-comment') && (
        <BuilderOverlay>
          <PersonalisedCommentBuilder existingComment={editingSection ? editingSection.section.data : { name: '', instruction: '', headings: [], comments: {} }} onSave={addingSectionType ? handleSaveNewSection : handleSaveEditedSection} onCancel={closeAllBuilders} />
        </BuilderOverlay>
      )}
      {showNextStepsCommentBuilder && (editingSection || addingSectionType === 'next-steps') && (
        <BuilderOverlay>
          <NextStepsCommentBuilder existingComment={editingSection ? editingSection.section.data : { name: '', headings: [], comments: {} }} onSave={addingSectionType ? handleSaveNewSection : handleSaveEditedSection} onCancel={closeAllBuilders} />
        </BuilderOverlay>
      )}
      {showQualitiesCommentBuilder && (editingSection || addingSectionType === 'qualities') && (
        <BuilderOverlay>
          <QualitiesCommentBuilder existingComment={editingSection ? editingSection.section.data : { name: '', headings: [], comments: {} }} onSave={addingSectionType ? handleSaveNewSection : handleSaveEditedSection} onCancel={closeAllBuilders} />
        </BuilderOverlay>
      )}
      {showStandardCommentBuilder && addingSectionType === 'standard-comment' && (
        <BuilderOverlay>
          <StandardCommentBuilder existingComment={{ name: '', content: '' }} onSave={handleSaveNewSection} onCancel={closeAllBuilders} />
        </BuilderOverlay>
      )}
    </div>
  );
}

export default ReportWriter;