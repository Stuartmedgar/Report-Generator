import React, { useState } from 'react';
import { PersonalisedComment } from '../types';

interface PersonalisedCommentBuilderProps {
  onSave: (comment: PersonalisedComment) => void;
  onCancel: () => void;
  existingComment?: PersonalisedComment;
}

function PersonalisedCommentBuilder({ onSave, onCancel, existingComment }: PersonalisedCommentBuilderProps) {
  const [commentName, setCommentName] = useState(existingComment?.name || '');
  const [instruction, setInstruction] = useState(existingComment?.instruction || '');
  const [headings, setHeadings] = useState<string[]>(existingComment?.headings || []);
  const [comments, setComments] = useState<{ [heading: string]: string[] }>(
    existingComment?.comments || {}
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
    const newHeading = `Heading ${headings.length + 1}`;
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
    const currentComments = comments[heading] || [];
    if (currentComments.length > 1) {
      setComments(prev => ({
        ...prev,
        [heading]: (prev[heading] || []).filter((_, i) => i !== index)
      }));
    }
  };

  const updateCommentOption = (heading: string, index: number, value: string) => {
    setComments(prev => {
      const currentComments = prev[heading] || [''];
      const newComments = [...currentComments];
      newComments[index] = value;
      return {
        ...prev,
        [heading]: newComments
      };
    });
  };

  const handleSave = () => {
    if (!commentName.trim()) {
      alert('Please enter a name for this personalised comment');
      return;
    }

    if (!instruction.trim()) {
      alert('Please enter an instruction for what personalised information to enter');
      return;
    }

    // If there are headings, check they all have at least one comment
    if (headings.length > 0) {
      const hasEmptyHeadings = headings.some(heading => 
        !comments[heading] || comments[heading].every(comment => !comment.trim())
      );

      if (hasEmptyHeadings) {
        alert('Please add at least one comment for each heading, or remove empty headings');
        return;
      }
    } else {
      // If no headings, we need at least one comment in the default category
      const defaultComments = comments['default'] || comments[''] || [];
      if (defaultComments.length === 0 || defaultComments.every(c => !c.trim())) {
        // Add a default comment section if none exists
        setComments(prev => ({ ...prev, 'default': [''] }));
        alert('Please add at least one comment option');
        return;
      }
    }

    const personalisedComment: PersonalisedComment = {
      name: commentName.trim(),
      instruction: instruction.trim(),
      headings: headings.length > 0 ? headings.filter(h => h.trim()) : undefined,
      comments: Object.fromEntries(
        Object.entries(comments).map(([heading, commentList]) => [
          heading,
          commentList.filter(c => c.trim())
        ]).filter(([_, commentList]) => commentList.length > 0)
      )
    };

    onSave(personalisedComment);
  };

  // If no headings exist, create a default section
  const displayHeadings = headings.length > 0 ? headings : ['default'];

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
          {existingComment ? 'Edit' : 'Create'} Personalised Comment
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
              Personalised Comment Name
            </label>
            <input
              type="text"
              placeholder="e.g. Target Grade, Extracurricular Activities, Personal Goals..."
              value={commentName}
              onChange={(e) => setCommentName(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '16px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Instruction Sentence */}
          <div style={{ marginBottom: '32px' }}>
            <label style={{ 
              display: 'block',
              fontSize: '18px', 
              fontWeight: '600', 
              color: '#111827',
              marginBottom: '8px'
            }}>
              Instruction for Teacher
            </label>
            <p style={{ 
              color: '#6b7280', 
              fontSize: '14px',
              margin: '0 0 8px 0'
            }}>
              Write a sentence telling the teacher what personalised information to enter (this won't be editable when writing reports):
            </p>
            <input
              type="text"
              placeholder="e.g. Add pupil target grade, Enter student's extracurricular activity, Add personal learning goal..."
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '16px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Headings Management */}
          <div style={{ marginBottom: '32px' }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '16px'
            }}>
              <div>
                <h3 style={{ 
                  fontSize: '18px', 
                  fontWeight: '600', 
                  color: '#111827',
                  margin: '0 0 4px 0'
                }}>
                  Optional Headings
                </h3>
                <p style={{ 
                  color: '#6b7280', 
                  fontSize: '14px',
                  margin: 0
                }}>
                  Choose headings that differentiate your statements
                </p>
              </div>
              <button
                onClick={addHeading}
                style={{
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '8px 16px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                + Add Heading
              </button>
            </div>

            {headings.map((heading, index) => (
              <div key={index} style={{
                display: 'flex',
                gap: '8px',
                marginBottom: '8px',
                alignItems: 'center'
              }}>
                <input
                  type="text"
                  value={heading}
                  onChange={(e) => updateHeading(index, e.target.value)}
                  placeholder="Enter heading name..."
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
                <button
                  onClick={() => removeHeading(index)}
                  style={{
                    backgroundColor: '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          {/* Instructions */}
          <div style={{
            backgroundColor: '#eff6ff',
            border: '1px solid #bfdbfe',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '32px'
          }}>
            <h3 style={{ 
              fontSize: '16px', 
              fontWeight: '600', 
              color: '#1e40af',
              margin: '0 0 8px 0'
            }}>
              How to use placeholders:
            </h3>
            <p style={{ 
              color: '#1e40af', 
              fontSize: '14px',
              margin: '0 0 8px 0'
            }}>
              • Use [Name] to insert the student's name
            </p>
            <p style={{ 
              color: '#1e40af', 
              fontSize: '14px',
              margin: 0
            }}>
              • Use [personalised information] to insert the custom information the teacher enters
            </p>
          </div>

          {/* Comment Sections */}
          {displayHeadings.map((heading) => (
            <div key={heading} style={{
              border: `2px solid #f59e0b`,
              borderRadius: '12px',
              padding: '24px',
              marginBottom: '24px'
            }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '16px'
              }}>
                <h3 style={{ 
                  fontSize: '18px', 
                  fontWeight: '600', 
                  color: '#f59e0b',
                  margin: 0
                }}>
                  {heading === 'default' ? 'Comment Options' : heading}
                  {heading === 'default' && headings.length === 0 && (
                    <span style={{ 
                      fontSize: '14px',
                      fontWeight: '400',
                      color: '#6b7280',
                      marginLeft: '8px'
                    }}>
                      (No headings - teacher won't choose, random comment will be selected)
                    </span>
                  )}
                </h3>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => setShowBatchInput(heading)}
                    style={{
                      backgroundColor: 'white',
                      color: '#f59e0b',
                      border: `2px solid #f59e0b`,
                      borderRadius: '6px',
                      padding: '8px 16px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer'
                    }}
                  >
                    📋 Paste Multiple
                  </button>
                  <button
                    onClick={() => addCommentOption(heading)}
                    style={{
                      backgroundColor: '#f59e0b',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '8px 16px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer'
                    }}
                  >
                    + Add Option
                  </button>
                </div>
              </div>

              {/* Batch Input Modal */}
              {showBatchInput === heading && (
                <div style={{
                  backgroundColor: '#f0f9ff',
                  border: '2px solid #3b82f6',
                  borderRadius: '8px',
                  padding: '16px',
                  marginBottom: '16px'
                }}>
                  <h4 style={{ 
                    fontSize: '16px', 
                    fontWeight: '600', 
                    color: '#1e40af',
                    margin: '0 0 8px 0'
                  }}>
                    Paste Multiple Comments for {heading === 'default' ? 'Comment Options' : heading}
                  </h4>
                  
                  {/* Separator Selection */}
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ 
                      display: 'block',
                      fontSize: '14px', 
                      fontWeight: '500', 
                      color: '#1e40af',
                      marginBottom: '8px'
                    }}>
                      How are your comments separated?
                    </label>
                    <select
                      value={separator}
                      onChange={(e) => setSeparator(e.target.value)}
                      style={{
                        padding: '8px 12px',
                        border: '2px solid #bfdbfe',
                        borderRadius: '6px',
                        fontSize: '14px',
                        backgroundColor: 'white',
                        color: '#1e40af',
                        fontWeight: '500'
                      }}
                    >
                      <option value="double-line">Double line break (press Enter twice)</option>
                      <option value="single-line">Single line break (one per line)</option>
                      <option value="semicolon">Semicolon (;)</option>
                      <option value="pipe">Pipe symbol (|)</option>
                      <option value="triple-dash">Triple dash (---)</option>
                    </select>
                  </div>

                  <textarea
                    placeholder={
                      separator === 'double-line' ? 
                        `[Name] has set a target of achieving a [personalised information] for Higher PE this year.\n\n[Name] aims to achieve [personalised information] which shows their commitment to excellence.\n\n[Name] has chosen [personalised information] as their goal for this course.` :
                      separator === 'single-line' ?
                        `[Name] has set a target of achieving a [personalised information] for Higher PE this year\n[Name] aims to achieve [personalised information] which shows commitment\n[Name] has chosen [personalised information] as their goal` :
                      separator === 'semicolon' ?
                        `[Name] has set a target of achieving a [personalised information]; [Name] aims to achieve [personalised information]; [Name] has chosen [personalised information] as their goal` :
                      separator === 'pipe' ?
                        `[Name] has set a target of achieving a [personalised information] | [Name] aims to achieve [personalised information] | [Name] has chosen [personalised information] as their goal` :
                        `[Name] has set a target of achieving a [personalised information] --- [Name] aims to achieve [personalised information] --- [Name] has chosen [personalised information] as their goal`
                    }
                    value={batchText}
                    onChange={(e) => setBatchText(e.target.value)}
                    style={{
                      width: '100%',
                      height: '200px',
                      padding: '12px',
                      border: '2px solid #bfdbfe',
                      borderRadius: '6px',
                      fontSize: '14px',
                      resize: 'vertical',
                      fontFamily: 'inherit',
                      boxSizing: 'border-box',
                      marginBottom: '12px'
                    }}
                  />
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <button
                      onClick={() => {
                        setShowBatchInput(null);
                        setBatchText('');
                      }}
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
                      Add Comments
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
                      placeholder={`Enter comment option ${index + 1}... Use [Name] and [personalised information] placeholders.`}
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
                backgroundColor: '#10b981',
                color: 'white',
                padding: '16px 32px',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              Save Personalised Comment
            </button>
          </div>

        </div>
      </main>
    </div>
  );
}

export default PersonalisedCommentBuilder;