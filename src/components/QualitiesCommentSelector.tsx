import React, { useState } from 'react';

// Temporary stub interface to prevent build errors
interface QualitiesComment {
  name: string;
  headings: string[];
  comments: { [heading: string]: string[] };
}

interface QualitiesCommentSelectorProps {
  onSelectComment: (comment: QualitiesComment) => void;
  onBack: () => void;
}

function QualitiesCommentSelector({ onSelectComment, onBack }: QualitiesCommentSelectorProps) {
  // Temporary stub - just show message and back button
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      <header style={{ 
        backgroundColor: 'white', 
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        padding: '32px 24px',
        textAlign: 'center'
      }}>
        <h1 style={{ 
          fontSize: '28px', 
          fontWeight: '600', 
          color: '#111827',
          margin: 0
        }}>
          Qualities Comments
        </h1>
        <p style={{ 
          color: '#6b7280', 
          fontSize: '16px',
          margin: '8px 0 0 0'
        }}>
          This feature is temporarily disabled
        </p>
      </header>

      <main style={{ 
        maxWidth: '800px', 
        margin: '0 auto', 
        padding: '24px' 
      }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '48px',
          textAlign: 'center',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{
            fontSize: '48px',
            marginBottom: '24px'
          }}>
            🚧
          </div>
          <h2 style={{
            fontSize: '24px',
            fontWeight: '600',
            color: '#111827',
            marginBottom: '16px'
          }}>
            Feature Under Development
          </h2>
          <p style={{
            color: '#6b7280',
            fontSize: '16px',
            lineHeight: '1.6',
            marginBottom: '32px'
          }}>
            The Qualities Comments feature is currently being developed. 
            Please use other comment types for now, or check back in a future update.
          </p>
          
          <button
            onClick={onBack}
            style={{
              backgroundColor: '#8b5cf6',
              color: 'white',
              padding: '12px 32px',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#7c3aed'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#8b5cf6'}
          >
            ← Back to Section Types
          </button>
        </div>
      </main>
    </div>
  );
}

export default QualitiesCommentSelector;