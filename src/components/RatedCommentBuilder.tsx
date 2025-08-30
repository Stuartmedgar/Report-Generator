import React, { useState } from 'react';
import { RatedComment } from '../types';

interface RatedCommentBuilderProps {
  onSave: (comment: RatedComment) => void;
  onCancel: () => void;
  existingComment?: RatedComment;
}

function RatedCommentBuilder({ onSave, onCancel, existingComment }: RatedCommentBuilderProps) {
  const [commentName, setCommentName] = useState(existingComment?.name || '');
  const [comments, setComments] = useState({
    excellent: existingComment?.comments.excellent || [''],
    good: existingComment?.comments.good || [''],
    satisfactory: existingComment?.comments.satisfactory || [''],
    needsImprovement: existingComment?.comments.needsImprovement || ['']
  });
  const [showBatchInput, setShowBatchInput] = useState<string | null>(null);
  const [batchText, setBatchText] = useState('');
  const [separator, setSeparator] = useState('double-line');

  const handleBatchPaste = (rating: keyof typeof comments) => {
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
          [rating]: shouldReplace ? newComments : [...prev[rating].filter(c => c.trim()), ...newComments]
        }));
      }
    }
    setShowBatchInput(null);
    setBatchText('');
  };

  const addCommentOption = (rating: keyof typeof comments) => {
    setComments(prev => ({
      ...prev,
      [rating]: [...prev[rating], '']
    }));
  };

  const removeCommentOption = (rating: keyof typeof comments, index: number) => {
    if (comments[rating].length > 1) {
      setComments(prev => ({
        ...prev,
        [rating]: prev[rating].filter((_, i) => i !== index)
      }));
    }
  };

  const updateCommentOption = (rating: keyof typeof comments, index: number, value: string) => {
    setComments(prev => ({
      ...prev,
      [rating]: prev[rating].map((comment, i) => i === index ? value : comment)
    }));
  };

  const handleSave = () => {
    if (!commentName.trim()) {
      alert('Please enter a name for this rated comment');
      return;
    }

    // Check if all ratings have at least one non-empty comment
    const hasEmptyRatings = Object.entries(comments).some(([_, commentList]) => 
      commentList.every(comment => !comment.trim())
    );

    if (hasEmptyRatings) {
      alert('Please add at least one comment for each rating level');
      return;
    }

    const ratedComment: RatedComment = {
      name: commentName.trim(),
      comments: {
        excellent: comments.excellent.filter(c => c.trim()),
        good: comments.good.filter(c => c.trim()),
        satisfactory: comments.satisfactory.filter(c => c.trim()),
        needsImprovement: comments.needsImprovement.filter(c => c.trim())
      }
    };

    onSave(ratedComment);
  };

  const ratingConfig = [
    { key: 'excellent' as const, label: 'Excellent', color: '#10b981' },
    { key: 'good' as const, label: 'Good', color: '#3b82f6' },
    { key: 'satisfactory' as const, label: 'Satisfactory', color: '#f59e0b' },
    { key: 'needsImprovement' as const, label: 'Needs Improvement', color: '#ef4444' }
  ];

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
          {existingComment ? 'Edit' : 'Create'} Rated Comment
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
              Comment Name
            </label>
            <input
              type="text"
              placeholder="e.g. Effort, Behavior, Participation..."
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
              • Example: "[Name] shows excellent effort in all activities"
            </p>
          </div>

          {/* Rating Sections */}
          {ratingConfig.map((rating) => (
            <div key={rating.key} style={{
              border: `2px solid ${rating.color}`,
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
                  color: rating.color,
                  margin: 0
                }}>
                  {rating.label}
                </h3>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => setShowBatchInput(rating.key)}
                    style={{
                      backgroundColor: 'white',
                      color: rating.color,
                      border: `2px solid ${rating.color}`,
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
                    onClick={() => addCommentOption(rating.key)}
                    style={{
                      backgroundColor: rating.color,
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
              {showBatchInput === rating.key && (
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
                    Paste Multiple Comments for {rating.label}
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

                  <p style={{ 
                    fontSize: '14px', 
                    color: '#1e40af',
                    margin: '0 0 12px 0'
                  }}>
                    {separator === 'double-line' && 'Paste your comments with double line breaks between them. This allows multi-line comments.'}
                    {separator === 'single-line' && 'Paste your comments with one comment per line.'}
                    {separator === 'semicolon' && 'Paste your comments separated by semicolons (;).'}
                    {separator === 'pipe' && 'Paste your comments separated by pipe symbols (|).'}
                    {separator === 'triple-dash' && 'Paste your comments separated by triple dashes (---).'}
                  </p>
                  
                  <textarea
                    placeholder={
                      separator === 'double-line' ? 
                        `[Name] demonstrates excellent effort in all activities and consistently strives to improve their performance.\n\n[Name] shows outstanding commitment to learning and actively participates in all classroom discussions.\n\n[Name] produces work of exceptional quality and takes pride in their achievements.` :
                      separator === 'single-line' ?
                        `[Name] demonstrates excellent effort in all activities\n[Name] shows outstanding commitment to learning\n[Name] produces work of exceptional quality` :
                      separator === 'semicolon' ?
                        `[Name] demonstrates excellent effort in all activities; [Name] shows outstanding commitment to learning; [Name] produces work of exceptional quality` :
                      separator === 'pipe' ?
                        `[Name] demonstrates excellent effort in all activities | [Name] shows outstanding commitment to learning | [Name] produces work of exceptional quality` :
                        `[Name] demonstrates excellent effort in all activities --- [Name] shows outstanding commitment to learning --- [Name] produces work of exceptional quality`
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
                      onClick={() => handleBatchPaste(rating.key)}
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
                {comments[rating.key].map((comment, index) => (
                  <div key={index} style={{ 
                    display: 'flex', 
                    gap: '8px',
                    marginBottom: '12px'
                  }}>
                    <textarea
                      placeholder={`Enter comment option ${index + 1} for ${rating.label.toLowerCase()}...`}
                      value={comment}
                      onChange={(e) => updateCommentOption(rating.key, index, e.target.value)}
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
                    {comments[rating.key].length > 1 && (
                      <button
                        onClick={() => removeCommentOption(rating.key, index)}
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
              Save Rated Comment
            </button>
          </div>

        </div>
      </main>
    </div>
  );
}

export default RatedCommentBuilder;