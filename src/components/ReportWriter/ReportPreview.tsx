import React from 'react';

interface ReportPreviewProps {
  generateReportContent: () => string;
  isPreviewEditing: boolean;
  editableReportContent: string;
  setEditableReportContent: (content: string) => void;
  onPreviewEdit: () => void;
  onSavePreviewEdit: () => void;
  onRefreshPreviewWithNewContent?: () => void;
  hasManuallyEditedContent?: boolean;
  manuallyEditedContent?: string;
  hideEditButton?: boolean;
}

export const ReportPreview: React.FC<ReportPreviewProps> = ({
  generateReportContent,
  isPreviewEditing,
  editableReportContent,
  setEditableReportContent,
  onPreviewEdit,
  onSavePreviewEdit,
  onRefreshPreviewWithNewContent,
  hasManuallyEditedContent = false,
  manuallyEditedContent = '',
  hideEditButton = false
}) => {
  
  // Detect mobile screen
  const isMobile = window.innerWidth <= 768;

  // Always show current generated content when not editing
  const getDisplayContent = () => {
    if (isPreviewEditing) {
      return editableReportContent;
    } else {
      return generateReportContent();
    }
  };

  // Mobile Tab Layout
  if (isMobile) {
    return (
      <div style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column'
      }}>
        
        {/* Mobile Header - Simplified */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px',
          flexWrap: 'wrap',
          gap: '8px'
        }}>
          <h3 style={{
            fontSize: '18px',
            fontWeight: '600',
            color: '#374151',
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            📄 Report Preview
            {hasManuallyEditedContent && !isPreviewEditing && (
              <span style={{
                fontSize: '12px',
                backgroundColor: '#10b981',
                color: 'white',
                padding: '4px 8px',
                borderRadius: '4px',
                fontWeight: '500'
              }}>
                EDITED
              </span>
            )}
          </h3>
        </div>

        {/* Preview Content - Full Mobile Height */}
        <div style={{
          backgroundColor: 'white',
          border: '1px solid #d1d5db',
          borderRadius: '12px',
          padding: '16px',
          flex: 1,
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          userSelect: 'text',
          WebkitUserSelect: 'text'
        }}>
          {isPreviewEditing ? (
            <textarea
              value={editableReportContent}
              onChange={(e) => setEditableReportContent(e.target.value)}
              placeholder="Edit your report content here..."
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                resize: 'none',
                fontSize: '16px',
                lineHeight: '1.6',
                padding: 0,
                outline: 'none',
                fontFamily: 'inherit',
                boxSizing: 'border-box',
                backgroundColor: 'transparent'
              }}
              autoCapitalize="sentences"
              autoCorrect="on"
              spellCheck="true"
            />
          ) : (
            <div style={{
              fontSize: '16px',
              lineHeight: '1.7',
              color: '#374151',
              whiteSpace: 'pre-wrap',
              wordWrap: 'break-word',
              overflowWrap: 'break-word',
              height: '100%'
            }}>
              {getDisplayContent() || (
                <div style={{
                  color: '#9ca3af',
                  fontStyle: 'italic',
                  textAlign: 'left',
                  padding: '40px 20px',
                  fontSize: '14px'
                }}>
                  Complete the sections to see the report preview...
                  <br />
                  <br />
                  👈 Switch to "Sections" tab to add content
                </div>
              )}
            </div>
          )}
        </div>

        {/* Mobile Helper Text */}
        {isPreviewEditing && (
          <div style={{
            fontSize: '12px',
            color: '#6b7280',
            textAlign: 'center',
            marginTop: '8px',
            fontStyle: 'italic'
          }}>
            Tap Save when finished editing
          </div>
        )}
      </div>
    );
  }

  // Desktop Layout
  return (
    <div style={{
      backgroundColor: '#f9fafb',
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      padding: '20px',
      height: '100%',
      display: 'flex',
      flexDirection: 'column'
    }}>
      
      {/* Header - Desktop */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px'
      }}>
        <h3 style={{
          fontSize: '18px',
          fontWeight: '600',
          color: '#374151',
          margin: 0,
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          📄 Report Preview
          {hasManuallyEditedContent && !isPreviewEditing && (
            <span style={{
              fontSize: '12px',
              backgroundColor: '#10b981',
              color: 'white',
              padding: '4px 8px',
              borderRadius: '4px',
              fontWeight: '500'
            }}>
              EDITED
            </span>
          )}
        </h3>
      </div>

      {/* Preview Content - Desktop */}
      <div style={{
        backgroundColor: 'white',
        border: '1px solid #d1d5db',
        borderRadius: '6px',
        padding: '16px',
        minHeight: '200px',
        maxHeight: '400px',
        overflowY: 'auto'
      }}>
        {isPreviewEditing ? (
          <textarea
            value={editableReportContent}
            onChange={(e) => setEditableReportContent(e.target.value)}
            style={{
              width: '100%',
              height: '300px',
              border: 'none',
              resize: 'vertical',
              fontSize: '14px',
              lineHeight: '1.5',
              padding: 0,
              outline: 'none'
            }}
          />
        ) : (
          <div style={{
            fontSize: '14px',
            lineHeight: '1.6',
            color: '#374151',
            whiteSpace: 'pre-wrap'
          }}>
            {getDisplayContent() || 'Complete the sections to see the report preview...'}
          </div>
        )}
      </div>
    </div>
  );
};