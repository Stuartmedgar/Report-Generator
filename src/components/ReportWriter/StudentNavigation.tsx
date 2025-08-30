import React from 'react';

interface StudentNavigationProps {
  currentStudentIndex: number;
  studentsLength: number;
  hasUnsavedChanges: boolean;
  onSaveReport: () => void;
  onPreviousStudent: () => void;
  onNextStudent: () => void;
  onFinish: () => void;
  onViewAllReports: () => void; // New prop for viewing all reports
}

export const StudentNavigation: React.FC<StudentNavigationProps> = ({
  currentStudentIndex,
  studentsLength,
  hasUnsavedChanges,
  onSaveReport,
  onPreviousStudent,
  onNextStudent,
  onFinish,
  onViewAllReports
}) => {
  return (
    <div>
      {/* Action Buttons */}
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '8px',
        marginBottom: '16px'
      }}>
        <div style={{ 
          display: 'flex', 
          gap: '8px' 
        }}>
          <button
            onClick={onSaveReport}
            style={{
              flex: 1,
              backgroundColor: '#10b981',
              color: 'white',
              padding: '12px 16px',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            💾 Save Report
          </button>

          <button
            onClick={onViewAllReports}
            style={{
              flex: 1,
              backgroundColor: '#6366f1',
              color: 'white',
              padding: '12px 16px',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            📋 View All Reports
          </button>
        </div>

        <div style={{ 
          display: 'flex', 
          gap: '8px' 
        }}>
          <button
            onClick={onPreviousStudent}
            disabled={currentStudentIndex === 0}
            style={{
              flex: 1,
              backgroundColor: currentStudentIndex === 0 ? '#9ca3af' : '#6b7280',
              color: 'white',
              padding: '10px 16px',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              cursor: currentStudentIndex === 0 ? 'not-allowed' : 'pointer',
              fontWeight: '600'
            }}
          >
            ← Previous
          </button>

          <button
            onClick={currentStudentIndex === studentsLength - 1 ? onFinish : onNextStudent}
            style={{
              flex: 1,
              backgroundColor: currentStudentIndex === studentsLength - 1 ? '#ef4444' : '#3b82f6',
              color: 'white',
              padding: '10px 16px',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            {currentStudentIndex === studentsLength - 1 ? 'Finish' : 'Next →'}
          </button>
        </div>
      </div>

      {/* Progress Indicator */}
      <div style={{ 
        padding: '12px',
        backgroundColor: '#f3f4f6',
        borderRadius: '6px',
        marginBottom: hasUnsavedChanges ? '12px' : '0'
      }}>
        <div style={{
          fontSize: '12px',
          color: '#6b7280',
          marginBottom: '6px',
          fontWeight: '500'
        }}>
          Progress: {currentStudentIndex + 1} of {studentsLength}
        </div>
        <div style={{
          width: '100%',
          height: '6px',
          backgroundColor: '#e5e7eb',
          borderRadius: '3px',
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${((currentStudentIndex + 1) / studentsLength) * 100}%`,
            height: '100%',
            backgroundColor: '#3b82f6',
            transition: 'width 0.3s ease'
          }} />
        </div>
      </div>

      {/* Unsaved Changes Warning */}
      {hasUnsavedChanges && (
        <div style={{
          padding: '8px 12px',
          backgroundColor: '#fef3c7',
          border: '1px solid #f59e0b',
          borderRadius: '6px',
          fontSize: '12px',
          color: '#92400e'
        }}>
          ⚠️ You have unsaved changes
        </div>
      )}
    </div>
  );
};