import React from 'react';

interface TemplateValidationPanelProps {
  validationErrors: string[];
}

export const TemplateValidationPanel: React.FC<TemplateValidationPanelProps> = ({ 
  validationErrors 
}) => {
  if (validationErrors.length === 0) {
    return null;
  }

  return (
    <div style={{
      backgroundColor: '#fef2f2',
      border: '1px solid #fecaca',
      borderRadius: '8px',
      padding: '16px',
      marginBottom: '24px'
    }}>
      <h3 style={{ 
        fontSize: '16px', 
        fontWeight: '600', 
        color: '#dc2626',
        margin: '0 0 12px 0',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        ⚠️ Template Issues Found ({validationErrors.length})
      </h3>
      <ul style={{ 
        margin: 0, 
        paddingLeft: '16px',
        color: '#dc2626',
        fontSize: '14px'
      }}>
        {validationErrors.slice(0, 5).map((error, index) => (
          <li key={index} style={{ marginBottom: '4px' }}>{error}</li>
        ))}
        {validationErrors.length > 5 && (
          <li style={{ fontStyle: 'italic' }}>
            ...and {validationErrors.length - 5} more issues
          </li>
        )}
      </ul>
    </div>
  );
};