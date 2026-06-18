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

  const moveCommentToHeading = (fromHeading: string, fromIndex: number, toHeading: string) => {
    const statement = (comments[fromHeading] || [])[fromIndex];
    if (!statement) return;
    setComments(prev => ({
      ...prev,
      [fromHeading]: (prev[fromHeading] || []).filter((_, i) => i !== fromIndex),
      [toHeading]: [...(prev[toHeading] || []), statement],
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
              placeholder="e.g. Grade 5 Next Steps, Writing Development, Math Focus Areas..."
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

          {/* Focus Area Sections */}
          {headings.map((heading, index) => (
            <div key={index} style={{
              border: '2px solid #06b6d4',
              borderRadius: '12px',
              padding: '24px',
              marginBottom: '24px'
            }}>
              <div style={{ marginBottom: '16px' }}>
                <input
                  type="text"
                  value={heading}
                  onChange={(e) => updateHeading(index, e.target.value)}
                  style={{
                    fontSize: '18px',
                    fontWeight: '600',
                    color: '#06b6d4',
                    border: 'none',
                    backgroundColor: 'transparent',
                    padding: '4px',
                    borderBottom: '2px dashed #06b6d4',
                    marginBottom: '8px',
                    width: '100%'
                  }}
                  placeholder="Focus Area Name"
                />
                {headings.length > 1 && (
                  <button
                    onClick={() => removeHeading(index)}
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
                    backgroundColor: 'white',
                    color: '#06b6d4',
                    border: '2px solid #06b6d4',
                    borderRadius: '6px',
                    padding: '8px 16px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    marginRight: '12px'
                  }}
                >
                  📋 Paste Multiple
                </button>
                <button
                  onClick={() => addCommentOption(heading)}
                  style={{
                    backgroundColor: '#06b6d4',
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
                    Paste Multiple Comments for {heading}
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
                    placeholder="Paste your next steps comments here..."
                    value={batchText}
                    onChange={(e) => setBatchText(e.target.value)}
                    style={{
                      width: '100%',
                      height: '120px',
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
                      Add Next Steps
                    </button>
                  </div>
                </div>
              )}

              <div>
                {(comments[heading] || ['']).map((comment, index) => (
                  <div key={index} style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                    <textarea
                      placeholder={`Enter next step suggestion ${index + 1}... Use [Name] for student name.`}
                      value={comment}
                      onChange={(e) => updateCommentOption(heading, index, e.target.value)}
                      style={{
                        flex: 1, padding: '12px', border: '1px solid #d1d5db',
                        borderRadius: '6px', fontSize: '14px', minHeight: '60px',
                        resize: 'vertical', fontFamily: 'inherit'
                      }}
                    />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {(comments[heading] || []).length > 1 && (
                        <button
                          onClick={() => removeCommentOption(heading, index)}
                          style={{ backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', padding: '8px 12px', fontSize: '12px', cursor: 'pointer' }}
                        >
                          Remove
                        </button>
                      )}
                      {headings.length > 1 && (
                        <select
                          onChange={e => { if (e.target.value) { moveCommentToHeading(heading, index, e.target.value); (e.target as HTMLSelectElement).value = ''; } }}
                          style={{ fontSize: '11px', padding: '4px 6px', borderRadius: '4px', border: '1px solid #06b6d4', cursor: 'pointer', color: '#0891b2', backgroundColor: 'white' }}
                        >
                          <option value="">Move to →</option>
                          {headings.filter(h => h !== heading).map(h => <option key={h} value={h}>{h}</option>)}
                        </select>
                      )}
                    </div>
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