import React from 'react';

interface TemplateQuickActionsProps {
  sectionsCount: number;
  onAddSection: () => void;
  onShowPreview: () => void;
  onExportTemplate: () => void;
}

export const TemplateQuickActions: React.FC<TemplateQuickActionsProps> = ({
  sectionsCount,
  onAddSection,
  onShowPreview,
  onExportTemplate
}) => {
  return (
    <div style={{
      backgroundColor: 'white',
      border: '2px solid #e5e7eb',
      borderRadius: '12px',
      padding: '20px',
      marginBottom: '20px'
    }}>
      <h3 style={{
        fontSize: '16px',
        fontWeight: '600',
        color: '#111827',
        margin: '0 0 16px 0'
      }}>
        Quick Actions
      </h3>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <button
          onClick={onAddSection}
          style={{
            backgroundColor: '#3b82f6',
            color: 'white',
            padding: '10px 16px',
            border: 'none',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            textAlign: 'left'
          }}
        >
          ➕ Add Section
        </button>
        
        <button
          onClick={onShowPreview}
          disabled={sectionsCount === 0}
          style={{
            backgroundColor: sectionsCount > 0 ? '#06b6d4' : '#9ca3af',
            color: 'white',
            padding: '10px 16px',
            border: 'none',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: sectionsCount > 0 ? 'pointer' : 'not-allowed',
            textAlign: 'left'
          }}
        >
          👀 Preview Report
        </button>
        
        <button
          onClick={onExportTemplate}
          disabled={sectionsCount === 0}
          style={{
            backgroundColor: sectionsCount > 0 ? '#8b5cf6' : '#9ca3af',
            color: 'white',
            padding: '10px 16px',
            border: 'none',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: sectionsCount > 0 ? 'pointer' : 'not-allowed',
            textAlign: 'left'
          }}
        >
          📄 Export for Review
        </button>
      </div>
    </div>
  );
};