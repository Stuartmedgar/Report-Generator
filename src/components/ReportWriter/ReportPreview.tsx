import React, { useRef } from 'react';

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

  // Track previous content to highlight newly added text
  const prevContentRef = useRef<string>('');
  const highlightRangeRef = useRef<{ start: number; end: number } | null>(null);

  // Always show current generated content when not editing
  const getDisplayContent = () => {
    if (isPreviewEditing) {
      return editableReportContent;
    } else {
      return generateReportContent();
    }
  };

  const currentContent = getDisplayContent();

  if (currentContent !== prevContentRef.current) {
    const prev = prevContentRef.current;
    if (prev && currentContent.length > prev.length) {
      let prefixLen = 0;
      const minLen = Math.min(prev.length, currentContent.length);
      while (prefixLen < minLen && prev[prefixLen] === currentContent[prefixLen]) prefixLen++;
      let suffixLen = 0;
      while (
        suffixLen < prev.length - prefixLen &&
        suffixLen < currentContent.length - prefixLen &&
        prev[prev.length - 1 - suffixLen] === currentContent[currentContent.length - 1 - suffixLen]
      ) suffixLen++;
      const changedEnd = currentContent.length - suffixLen;
      const changedLen = changedEnd - prefixLen;
      highlightRangeRef.current = (changedLen > 0 && changedLen < 500)
        ? { start: prefixLen, end: changedEnd }
        : null;
    } else {
      highlightRangeRef.current = null;
    }
    prevContentRef.current = currentContent;
  }

  const highlightRange = isPreviewEditing ? null : highlightRangeRef.current;

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
                backgroundColor: 'transparent',
                textAlign: 'left'
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
              height: '100%',
              textAlign: 'left'
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
        maxHeight: '520px',
        overflowY: 'auto',
      }}>
        {isPreviewEditing ? (
          <textarea
            value={editableReportContent}
            onChange={(e) => setEditableReportContent(e.target.value)}
            style={{
              width: '100%',
              minHeight: '300px',
              border: 'none',
              resize: 'vertical',
              fontSize: '14px',
              lineHeight: '1.5',
              padding: 0,
              outline: 'none',
              textAlign: 'left'
            }}
          />
        ) : (
          <div style={{
            fontSize: '14px',
            lineHeight: '1.6',
            color: '#374151',
            whiteSpace: 'pre-wrap',
            textAlign: 'left'
          }}>
            {!currentContent
              ? 'Complete the sections to see the report preview...'
              : !highlightRange
                ? currentContent
                : <>
                    {currentContent.slice(0, highlightRange.start)}
                    <span style={{ color: '#1d4ed8', fontWeight: '500' }}>
                      {currentContent.slice(highlightRange.start, highlightRange.end)}
                    </span>
                    {currentContent.slice(highlightRange.end)}
                  </>
            }
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportPreview;