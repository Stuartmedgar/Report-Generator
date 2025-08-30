import React from 'react';
import { Template, Student } from '../../types';
import { EditableSection } from './EditableSection';
import { ReportPreview } from './ReportPreview';
import RatedCommentBuilder from '../RatedCommentBuilder';
import AssessmentCommentBuilder from '../AssessmentCommentBuilder';
import PersonalisedCommentBuilder from '../PersonalisedCommentBuilder';
import NextStepsCommentBuilder from '../NextStepsCommentBuilder';

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
    updateSectionData: (sectionId: string, data: any) => void; // ADDED: The key function we need!
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
  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#f3f4f6'
    }}>
      
      {/* Compact Header - NO TAB BUTTONS */}
      <div style={{
        backgroundColor: 'white',
        borderBottom: '1px solid #e5e7eb',
        padding: '8px 16px', // Reduced padding for smaller header
        position: 'sticky',
        top: 0,
        zIndex: 10,
        boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '4px' // Small gap before swipe instruction
        }}>
          <h1 style={{
            fontSize: '16px', // Slightly smaller
            fontWeight: '600',
            margin: 0,
            color: '#111827',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            flex: 1
          }}>
            {currentStudent?.firstName} {currentStudent?.lastName}
          </h1>
          
          {hasTemplateChanges && (
            <button
              onClick={navigationHandlers.handleSaveAsNewTemplate}
              style={{
                backgroundColor: '#8b5cf6',
                color: 'white',
                padding: '4px 8px', // Smaller button
                border: 'none',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: '500',
                cursor: 'pointer',
                marginLeft: '8px'
              }}
            >
              💾 Save Template
            </button>
          )}
        </div>
        
        {/* ONLY SWIPE INSTRUCTION - NO TAB BUTTONS */}
        <div style={{
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: '11px',
            color: '#9ca3af',
            fontWeight: '400'
          }}>
            {activeTab === 'sections' ? '← Swipe for preview' : 'Swipe for sections →'}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div 
        style={{
          flex: 1,
          overflow: 'hidden',
          position: 'relative'
        }}
        onTouchStart={touchHandlers.onTouchStart}
        onTouchEnd={touchHandlers.onTouchEnd}
      >
        {/* Sections Tab */}
        <div style={{
          display: activeTab === 'sections' ? 'block' : 'none',
          height: '100%',
          overflowY: 'auto',
          padding: '16px',
          paddingBottom: '120px', // Reduced space for compact footer
          backgroundColor: '#f3f4f6'
        }}>
          <div style={{ maxWidth: '600px', margin: '0 auto' }}>
            {reportLogic.getAllSections().map((section: any, index: number) => (
              <div key={section.id || index}>
                <EditableSection
                  section={section}
                  sectionIndex={index}
                  sectionData={currentSectionData}
                  updateSectionData={reportLogic.updateSectionData} // FIXED: Use the actual updateSectionData function!
                  onEditSection={(section: any, index: number) => {
                    editingState.setEditingSection({ section, index });
                    
                    if (section.type === 'rated-comment') {
                      editingState.setShowRatedCommentBuilder(true);
                    } else if (section.type === 'assessment-comment') {
                      editingState.setShowAssessmentCommentBuilder(true);
                    } else if (section.type === 'personalised-comment') {
                      editingState.setShowPersonalisedCommentBuilder(true);
                    } else if (section.type === 'next-steps') {
                      editingState.setShowNextStepsCommentBuilder(true);
                    }
                  }}
                  showSectionOptions={showSectionOptions}
                  setShowSectionOptions={setShowSectionOptions}
                  onAddDynamicSection={dynamicSectionHandlers.handleAddDynamicSection}
                  dynamicSections={dynamicSectionHandlers.dynamicSections}
                  onRemoveDynamicSection={dynamicSectionHandlers.handleRemoveDynamicSection}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Preview Tab */}
        <div style={{
          display: activeTab === 'preview' ? 'block' : 'none',
          height: '100%',
          overflowY: 'auto',
          padding: '16px',
          paddingBottom: '120px', // Reduced space for compact footer
          backgroundColor: '#f3f4f6'
        }}>
          <div style={{ maxWidth: '600px', margin: '0 auto' }}>
            <ReportPreview
              generateReportContent={reportLogic.generateReportContent}
              isPreviewEditing={reportLogic.isPreviewEditing}
              editableReportContent={reportLogic.editableReportContent}
              setEditableReportContent={reportLogic.setEditableReportContent}
              onPreviewEdit={() => reportLogic.setIsPreviewEditing(!reportLogic.isPreviewEditing)}
              onSavePreviewEdit={() => reportLogic.setIsPreviewEditing(false)}
              hideEditButton={true}
            />
          </div>
        </div>
      </div>

      {/* FOOTER CONTAINER - Both primary and secondary - COMPACT */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'white',
        borderTop: '1px solid #e5e7eb',
        boxShadow: '0 -1px 2px rgba(0,0,0,0.05)',
        zIndex: 100
      }}>
        
        {/* PRIMARY FOOTER - Previous/Save/Next - COMPACT */}
        <div style={{
          padding: '8px 16px',
          borderBottom: '1px solid #f3f4f6'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr auto 1fr',
            gap: '6px',
            alignItems: 'center'
          }}>
            <button
              onClick={navigationHandlers.handlePreviousStudent}
              disabled={currentStudentIndex === 0}
              style={{
                backgroundColor: currentStudentIndex === 0 ? '#e5e7eb' : '#f59e0b',
                color: currentStudentIndex === 0 ? '#9ca3af' : 'white',
                padding: '10px',
                border: 'none',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: '500',
                cursor: currentStudentIndex === 0 ? 'not-allowed' : 'pointer'
              }}
            >
              ⬅️ Previous
            </button>
                     
            <button
              onClick={navigationHandlers.handleSaveReport}
              style={{
                backgroundColor: reportLogic.hasUnsavedChanges ? '#ef4444' : '#10b981',
                color: 'white',
                padding: '10px 14px',
                border: 'none',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              💾 Save
            </button>
                     
            <button
              onClick={navigationHandlers.handleNextStudent}
              disabled={currentStudentIndex === students.length - 1}
              style={{
                backgroundColor: currentStudentIndex === students.length - 1 ? '#e5e7eb' : '#f59e0b',
                color: currentStudentIndex === students.length - 1 ? '#9ca3af' : 'white',
                padding: '10px',
                border: 'none',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: '500',
                cursor: currentStudentIndex === students.length - 1 ? 'not-allowed' : 'pointer'
              }}
            >
              Next ➡️
            </button>
          </div>
        </div>

        {/* SECONDARY FOOTER - Back/Home/View Reports - COMPACT */}
        <div style={{
          padding: '6px 16px'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: '6px'
          }}>
            <button
              onClick={navigationHandlers.handleFinish}
              style={{
                backgroundColor: '#6b7280',
                color: 'white',
                padding: '8px',
                border: 'none',
                borderRadius: '5px',
                fontSize: '11px',
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
                padding: '8px',
                border: 'none',
                borderRadius: '5px',
                fontSize: '11px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              🏠 Home
            </button>
            <button
              onClick={navigationHandlers.handleViewAllReports}
              style={{
                backgroundColor: '#10b981',
                color: 'white',
                padding: '8px',
                border: 'none',
                borderRadius: '5px',
                fontSize: '11px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              📊 View Reports
            </button>
          </div>
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