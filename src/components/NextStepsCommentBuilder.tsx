import React, { useState } from 'react';
import { NextStepsComment } from '../types';

interface NextStepsCommentBuilderProps {
  onSave: (comment: NextStepsComment) => void;
  onCancel: () => void;
  existingComment?: NextStepsComment;
}

function NextStepsCommentBuilder({ onSave, onCancel, existingComment }: NextStepsCommentBuilderProps) {
  const [commentName, setCommentName] = useState(existingComment?.name || '');
  const [headings, setHeadings] = useState<string[]>(existingComment?.headings || ['Focus Areas']);
  const [comments, setComments] = useState<{ [heading: string]: string[] }>(
    existingComment?.comments || { 'Focus Areas': [''] }
  );
  const [showBatchInput, setShowBatchInput] = useState<string | null>(null);
  const [batchText, setBatchText] = useState('');
  const [separator, setSeparator] = useState('double-line');

  const handleBatchPaste = (heading: string) => {
    if (batchText.trim()) {
      let newComments: string[] = [];
      
      // Split based on selected separator
      switch (separator) {
        case 'double-line':
          newComments = batchText.split('\n\n');
          break;
        case 'single-line':
          newComments = batchText.split('\n');
          break;
        case 'semicolon':
          newComments = batchText.split(';');
          break;
        case 'pipe':
          newComments = batchText.split('|');
          break;
        case 'triple-dash':
          newComments = batchText.split('---');
          break;
      }

      // Clean up comments - trim whitespace and filter out empty ones
      newComments = newComments
        .map(comment => comment.trim())
        .filter(comment => comment.length > 0);

      if (newComments.length > 0) {
        // Replace existing comments with new ones, or add to existing
        const shouldReplace = window.confirm(
          `This will add ${newComments.length} new comments. Do you want to replace existing comments (OK) or add to them (Cancel)?`
        );

        setComments(prev => ({
          ...prev,
          [heading]: shouldReplace ? newComments : [...(prev[heading] || []).filter(c => c.trim()), ...newComments]
        }));
      }
    }
    setShowBatchInput(null);
    setBatchText('');
  };

  const addHeading = () => {
    const newHeading = `Focus Area ${headings.length + 1}`;
    setHeadings([...headings, newHeading]);
    setComments(prev => ({ ...prev, [newHeading]: [''] }));
  };

  const removeHeading = (index: number) => {
    const headingToRemove = headings[index];
    const newHeadings = headings.filter((_, i) => i !== index);
    const newComments = { ...comments };
    delete newComments[headingToRemove];
    setHeadings(newHeadings);
    setComments(newComments);
  };

  const updateHeading = (index: number, value: string) => {
    const oldHeading = headings[index];
    const newHeadings = [...headings];
    newHeadings[index] = value;
    
    const newComments = { ...comments };
    if (oldHeading !== value) {
      newComments[value] = comments[oldHeading] || [''];
      delete newComments[oldHeading];
    }
    
    setHeadings(newHeadings);
    setComments(newComments);
  };

  const addCommentOption = (heading: string) => {
    setComments(prev => ({
      ...prev,
      [heading]: [...(prev[heading] || []), '']
    }));
  };

  const removeCommentOption = (heading: string, index: number) => {
    if ((comments[heading] || []).length > 1) {
      setComments(prev => ({
        ...prev,
        [heading]: (prev[heading] || []).filter((_, i) => i !== index)
      }));
    }
  };

  const updateCommentOption = (heading: string, index: number, value: string) => {
    setComments(prev => ({
      ...prev,
      [heading]: (prev[heading] || []).map((comment, i) => i === index ? value : comment)
    }));
  };

  const handleSave = () => {
    if (!commentName.trim()) {
      alert('Please enter a name for this next steps comment');
      return;
    }

    // Check they all have at least one comment
    const hasEmptyHeadings = headings.some(heading => 
      !comments[heading] || comments[heading].every(comment => !comment.trim())
    );

    if (hasEmptyHeadings) {
      alert('Please add at least one next step for each focus area, or remove empty focus areas');
      return;
    }

    const nextStepsComment: NextStepsComment = {
      name: commentName.trim(),
      headings: headings.filter(h => h.trim()),
      comments: Object.fromEntries(
        Object.entries(comments).map(([heading, commentList]) => [
          heading,
          commentList.filter(c => c.trim())
        ]).filter(([_, commentList]) => commentList.length > 0)
      )
    };

    onSave(nextStepsComment);
  };

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
          {existingComment ? 'Edit' : 'Create'} Next Steps Comment
        </h1>
      </header>

      <main style={{ 
        maxWidth: '900px', 
        margin: '0 auto', 
        padding: '32px 24px' 
      }}>
        
        <button 
          onClick={onCancel}
          style={{
            backgroundColor: '#6b7280',
            color: 'white',
            padding: '12px 24px',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: '500',
            cursor: 'pointer',
            marginBottom: '24px'
          }}>
          ← Back
        </button>

        <div style={{
          backgroundColor: 'white',
          padding: '32px',
          borderRadius: '12px',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
          marginBottom: '24px'
        }}>
          
          {/* Comment Name */}
          <div style={{ marginBottom: '32px' }}>
            <label style={{ 
              display: 'block',
              fontSize: '18px', 
              fontWeight: '600', 
              color: '#111827',
              marginBottom: '8px'
            }}>
              Next Steps Comment Name
            </label>
            <input
              type="text"
              placeholder="e.g. Mathematics Next Steps, Reading Development Steps"
              value={commentName}
              onChange={(e) => setCommentName(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '16px',
                fontFamily: 'inherit'
              }}
            />
          </div>

          {/* Focus Areas */}
          {headings.map((heading, headingIndex) => (
            <div key={headingIndex} style={{ 
              marginBottom: '40px',
              padding: '24px',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              backgroundColor: '#f9fafb'
            }}>
              
              {/* Heading Input */}
              <div style={{ 
                display: 'flex', 
                gap: '8px',
                marginBottom: '20px'
              }}>
                <input
                  type="text"
                  value={heading}
                  onChange={(e) => updateHeading(headingIndex, e.target.value)}
                  style={{
                    flex: 1,
                    padding: '10px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '16px',
                    fontWeight: '600',
                    fontFamily: 'inherit'
                  }}
                />
                {headings.length > 1 && (
                  <button
                    onClick={() => removeHeading(headingIndex)}
                    style={{
                      backgroundColor: '#ef4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '8px 16px',
                      fontSize: '14px',
                      cursor: 'pointer'
                    }}
                  >
                    Remove Focus Area
                  </button>
                )}
              </div>

              {/* Batch Input Button */}
              <div style={{ marginBottom: '16px' }}>
                <button
                  onClick={() => setShowBatchInput(heading)}
                  style={{
                    backgroundColor: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '8px 16px',
                    fontSize: '14px',
                    cursor: 'pointer',
                    marginRight: '12px'
                  }}
                >
                  📋 Batch Add Comments
                </button>
                <button
                  onClick={() => addCommentOption(heading)}
                  style={{
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '8px 16px',
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}
                >
                  + Add Single Comment
                </button>
              </div>

              {/* Batch Input Modal */}
              {showBatchInput === heading && (
                <div style={{
                  marginBottom: '20px',
                  padding: '20px',
                  border: '2px solid #10b981',
                  borderRadius: '8px',
                  backgroundColor: 'white'
                }}>
                  <h4 style={{ margin: '0 0 12px 0', color: '#10b981' }}>
                    Batch Add Next Steps for "{heading}"
                  </h4>
                  
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ 
                      display: 'block', 
                      marginBottom: '8px',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}>
                      Separator:
                    </label>
                    <select
                      value={separator}
                      onChange={(e) => setSeparator(e.target.value)}
                      style={{
                        padding: '8px',
                        border: '1px solid #d1d5db',
                        borderRadius: '4px',
                        fontSize: '14px'
                      }}
                    >
                      <option value="double-line">Double Line Break</option>
                      <option value="single-line">Single Line Break</option>
                      <option value="semicolon">Semicolon (;)</option>
                      <option value="pipe">Pipe (|)</option>
                      <option value="triple-dash">Triple Dash (---)</option>
                    </select>
                  </div>
                  
                  <textarea
                    placeholder={`Paste your next steps here. They will be split by ${separator === 'double-line' ? 'double line breaks' : separator === 'single-line' ? 'single line breaks' : separator === 'semicolon' ? 'semicolons' : separator === 'pipe' ? 'pipes' : 'triple dashes'}.\n\nExample:\nContinue practicing times tables\n\nWork on division problems\n\nReview fractions concept`}
                    value={batchText}
                    onChange={(e) => setBatchText(e.target.value)}
                    style={{
                      width: '100%',
                      minHeight: '120px',
                      padding: '12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontFamily: 'inherit',
                      resize: 'vertical'
                    }}
                  />
                  
                  <div style={{ 
                    display: 'flex', 
                    gap: '8px', 
                    marginTop: '12px' 
                  }}>
                    <button
                      onClick={() => setShowBatchInput(null)}
                      style={{
                        backgroundColor: '#6b7280',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '8px 16px',
                        fontSize: '14px',
                        cursor: 'pointer'
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleBatchPaste(heading)}
                      disabled={!batchText.trim()}
                      style={{
                        backgroundColor: batchText.trim() ? '#3b82f6' : '#d1d5db',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '8px 16px',
                        fontSize: '14px',
                        cursor: batchText.trim() ? 'pointer' : 'not-allowed'
                      }}
                    >
                      Add Next Steps
                    </button>
                  </div>
                </div>
              )}

              <div>
                {(comments[heading] || ['']).map((comment, index) => (
                  <div key={index} style={{ 
                    display: 'flex', 
                    gap: '8px',
                    marginBottom: '12px'
                  }}>
                    <textarea
                      placeholder={`Enter next step suggestion ${index + 1}... Use [Name] for student name.`}
                      value={comment}
                      onChange={(e) => updateCommentOption(heading, index, e.target.value)}
                      style={{
                        flex: 1,
                        padding: '12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '14px',
                        minHeight: '60px',
                        resize: 'vertical',
                        fontFamily: 'inherit'
                      }}
                    />
                    {(comments[heading] || []).length > 1 && (
                      <button
                        onClick={() => removeCommentOption(heading, index)}
                        style={{
                          backgroundColor: '#ef4444',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '8px 12px',
                          fontSize: '12px',
                          cursor: 'pointer',
                          height: 'fit-content'
                        }}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Add New Focus Area */}
          <div style={{ marginBottom: '32px', textAlign: 'center' }}>
            <button
              onClick={addHeading}
              style={{
                backgroundColor: '#8b5cf6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '12px 24px',
                fontSize: '16px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              + Add Another Focus Area
            </button>
          </div>

          {/* Save Button */}
          <div style={{ 
            display: 'flex', 
            gap: '16px', 
            justifyContent: 'flex-end' 
          }}>
            <button
              onClick={onCancel}
              style={{
                backgroundColor: '#6b7280',
                color: 'white',
                padding: '16px 32px',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              style={{
                backgroundColor: '#06b6d4',
                color: 'white',
                padding: '16px 32px',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              Save Next Steps Comment
            </button>
          </div>

        </div>
      </main>
    </div>
  );
}

export default NextStepsCommentBuilder;