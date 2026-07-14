import React, { useState } from 'react';
import { Template, Student } from '../../types';
import { ReportPreview } from './ReportPreview';
import RatedCommentBuilder from '../RatedCommentBuilder';
import AssessmentCommentBuilder from '../AssessmentCommentBuilder';
import PersonalisedCommentBuilder from '../PersonalisedCommentBuilder';
import NextStepsCommentBuilder from '../NextStepsCommentBuilder';
import MobileSectionCard from './MobileSectionCard';
import { UploadClassList } from './UploadClassList';
import { ParsedName } from '../../utils/parseClassList';

interface MobileReportWriterProps {
  template: Template;
  classData: any;
  students: Student[];
  currentStudentIndex: number;
  currentStudent: Student;
  currentSectionData: any;
  activeTab: 'sections' | 'preview';
  setActiveTab: (tab: 'sections' | 'preview') => void;
  touchHandlers: {
    onTouchStart: (e: React.TouchEvent) => void;
    onTouchEnd: (e: React.TouchEvent) => void;
  };
  navigationHandlers: {
    handlePreviousStudent: () => void;
    handleNextStudent: () => void;
    handleSaveReport: () => void;
    handleHome: () => void;
    handleFinish: () => void;
    handleViewAllReports: () => void;
    handleSaveAsNewTemplate: () => void;
    handleAddStudent: (firstName: string) => void;
    handleAddStudents: (students: ParsedName[]) => void;
  };
  reportLogic: {
    setSectionData: any;
    setHasUnsavedChanges: any;
    hasUnsavedChanges: boolean;
    isPreviewEditing: boolean;
    setIsPreviewEditing: any;
    editableReportContent: string;
    setEditableReportContent: any;
    generateReportContent: () => string;
    getAllSections: () => any[];
    updateSectionData: (sectionId: string, data: any) => void;
  };
  editingState: {
    editingSection: any;
    setEditingSection: any;
    showRatedCommentBuilder: boolean;
    setShowRatedCommentBuilder: any;
    showAssessmentCommentBuilder: boolean;
    setShowAssessmentCommentBuilder: any;
    showPersonalisedCommentBuilder: boolean;
    setShowPersonalisedCommentBuilder: any;
    showNextStepsCommentBuilder: boolean;
    setShowNextStepsCommentBuilder: any;
    handleSaveEditedSection: (data: any) => void;
  };
  dynamicSectionHandlers: {
    handleAddDynamicSection: any;
    handleRemoveDynamicSection: any;
    dynamicSections: any[];
  };
  showSectionOptions: number | null;
  setShowSectionOptions: any;
  hasTemplateChanges: boolean;
}

export const MobileReportWriter: React.FC<MobileReportWriterProps> = ({
  classData,
  students,
  currentStudentIndex,
  currentStudent,
  currentSectionData,
  activeTab,
  setActiveTab,
  touchHandlers,
  navigationHandlers,
  reportLogic,
  editingState,
  dynamicSectionHandlers,
  showSectionOptions,
  setShowSectionOptions,
  hasTemplateChanges
}) => {
  const [showUploadList, setShowUploadList] = useState(false);

  return (
    <div 
      data-mobile-writer
      style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#f3f4f6'
      }}
    >
      
      {/* Main Content Area - No Header */}
      <div 
        style={{
          flex: 1,
          overflow: 'hidden',
          position: 'relative'
        }}
        onTouchStart={touchHandlers.onTouchStart}
        onTouchEnd={touchHandlers.onTouchEnd}
      >
        {/* Sections Tab - Clean Mobile Display */}
        <div style={{
          display: activeTab === 'sections' ? 'block' : 'none',
          height: '100%',
          overflowY: 'auto',
          padding: '12px',
          WebkitOverflowScrolling: 'touch'
        }}>
          {/* Student Info Bar */}
          <div style={{
            backgroundColor: 'white',
            padding: '12px 16px',
            borderRadius: '12px',
            marginBottom: '16px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            textAlign: 'center'
          }}>
            <h2 style={{
              fontSize: '16px',
              fontWeight: '600',
              margin: 0,
              color: '#111827'
            }}>
              {currentStudent?.firstName} {currentStudent?.lastName}
            </h2>
            <p style={{
              fontSize: '12px',
              color: '#6b7280',
              margin: '2px 0 0 0'
            }}>
              Student {currentStudentIndex + 1} of {students.length} • Swipe for preview →
            </p>
            {showUploadList ? (
              <div style={{ marginTop: '10px', textAlign: 'left' }}>
                <UploadClassList
                  onImport={(newStudents) => { navigationHandlers.handleAddStudents(newStudents); setShowUploadList(false); }}
                  onCancel={() => setShowUploadList(false)}
                />
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '8px' }}>
                <button
                  onClick={() => {
                    const firstName = window.prompt("New pupil's first name:");
                    if (!firstName || !firstName.trim()) return;
                    navigationHandlers.handleAddStudent(firstName);
                  }}
                  style={{ padding: '6px 12px', backgroundColor: '#f8fafc', color: '#374151', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                >
                  + Add Pupil
                </button>
                <button
                  onClick={() => setShowUploadList(true)}
                  style={{ padding: '6px 12px', backgroundColor: '#f8fafc', color: '#374151', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                >
                  Upload List
                </button>
              </div>
            )}
          </div>

          {/* Clean Section Cards */}
          <div style={{ maxWidth: '100%' }}>
            {reportLogic.getAllSections().map((section: any, index: number) => (
              <MobileSectionCard
                key={section.id || index}
                section={section}
                sectionData={currentSectionData}
                updateSectionData={reportLogic.updateSectionData}
                isFirstSection={index === 0}
                isLastSection={index === reportLogic.getAllSections().length - 1}
                navigationHandlers={navigationHandlers}
                currentStudentIndex={currentStudentIndex}
                studentsLength={students.length}
              />
            ))}
          </div>

          {/* Bottom spacing for safe scrolling */}
          <div style={{ height: '80px' }} />
        </div>

        {/* Preview Tab */}
        <div style={{
          display: activeTab === 'preview' ? 'block' : 'none',
          height: '100%',
          padding: '12px',
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch'
        }}>
          {/* Preview Header */}
          <div style={{
            backgroundColor: 'white',
            padding: '12px 16px',
            borderRadius: '12px',
            marginBottom: '16px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            textAlign: 'center'
          }}>
            <h2 style={{
              fontSize: '16px',
              fontWeight: '600',
              margin: 0,
              color: '#111827'
            }}>
              Report Preview
            </h2>
            <p style={{
              fontSize: '12px',
              color: '#6b7280',
              margin: '2px 0 0 0'
            }}>
              {currentStudent?.firstName} {currentStudent?.lastName} • ← Swipe for sections
            </p>
          </div>

          <ReportPreview
            generateReportContent={reportLogic.generateReportContent}
            isPreviewEditing={reportLogic.isPreviewEditing}
            editableReportContent={reportLogic.editableReportContent}
            setEditableReportContent={reportLogic.setEditableReportContent}
            onPreviewEdit={() => {
              reportLogic.setIsPreviewEditing(true);
              reportLogic.setEditableReportContent(reportLogic.generateReportContent());
            }}
            onSavePreviewEdit={() => {
              reportLogic.setIsPreviewEditing(false);
              reportLogic.setHasUnsavedChanges(true);
            }}
            hideEditButton={true}
          />

          {/* Bottom spacing */}
          <div style={{ height: '80px' }} />
        </div>
      </div>

      {/* Comment Builders - Mobile Full Screen Overlays */}
      {editingState.showRatedCommentBuilder && editingState.editingSection && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'white',
          zIndex: 1000,
          overflow: 'auto'
        }}>
          <RatedCommentBuilder
            existingComment={editingState.editingSection.section.data}
            onSave={editingState.handleSaveEditedSection}
            onCancel={() => {
              editingState.setEditingSection(null);
              editingState.setShowRatedCommentBuilder(false);
            }}
          />
        </div>
      )}

      {editingState.showAssessmentCommentBuilder && editingState.editingSection && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'white',
          zIndex: 1000,
          overflow: 'auto'
        }}>
          <AssessmentCommentBuilder
            existingComment={editingState.editingSection.section.data}
            onSave={editingState.handleSaveEditedSection}
            onCancel={() => {
              editingState.setEditingSection(null);
              editingState.setShowAssessmentCommentBuilder(false);
            }}
          />
        </div>
      )}

      {editingState.showPersonalisedCommentBuilder && editingState.editingSection && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'white',
          zIndex: 1000,
          overflow: 'auto'
        }}>
          <PersonalisedCommentBuilder
            existingComment={editingState.editingSection.section.data}
            onSave={editingState.handleSaveEditedSection}
            onCancel={() => {
              editingState.setEditingSection(null);
              editingState.setShowPersonalisedCommentBuilder(false);
            }}
          />
        </div>
      )}

      {editingState.showNextStepsCommentBuilder && editingState.editingSection && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'white',
          zIndex: 1000,
          overflow: 'auto'
        }}>
          <NextStepsCommentBuilder
            existingComment={editingState.editingSection.section.data}
            onSave={editingState.handleSaveEditedSection}
            onCancel={() => {
              editingState.setEditingSection(null);
              editingState.setShowNextStepsCommentBuilder(false);
            }}
          />
        </div>
      )}
    </div>
  );
};