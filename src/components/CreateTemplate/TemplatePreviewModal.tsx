import React from 'react';
import { TemplateSection } from '../../types';
import { generateSampleReport } from '../../utils/templateExport';

interface TemplatePreviewModalProps {
  templateName: string;
  sections: TemplateSection[];
  onClose: () => void;
}

export const TemplatePreviewModal: React.FC<TemplatePreviewModalProps> = ({
  templateName,
  sections,
  onClose
}) => {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', padding: '20px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#111827', margin: 0 }}>
            Template Preview: {templateName}
          </h2>
          <button
            onClick={onClose}
            style={{
              backgroundColor: '#6b7280',
              color: 'white',
              padding: '8px 16px',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            ← Back to Template
          </button>
        </div>
        
        <div style={{
          backgroundColor: 'white',
          border: '2px solid #e5e7eb',
          borderRadius: '12px',
          padding: '32px',
          whiteSpace: 'pre-wrap',
          lineHeight: '1.6',
          fontFamily: 'Georgia, serif'
        }}>
          <h3 style={{ 
            fontSize: '18px', 
            fontWeight: '600', 
            marginBottom: '16px',
            color: '#111827'
          }}>
            Sample Report Output:
          </h3>
          <div style={{ color: '#374151' }}>
            {generateSampleReport(sections) || 'No content sections added yet.'}
          </div>
        </div>
      </div>
    </div>
  );
};