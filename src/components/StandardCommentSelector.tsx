import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { StandardComment } from '../types';

interface StandardCommentSelectorProps {
  onSelectComment: (comment: StandardComment) => void;
  onBack: () => void;
}

function StandardCommentSelector({ onSelectComment, onBack }: StandardCommentSelectorProps) {
  const { state, addStandardComment, deleteStandardComment } = useData();
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [commentName, setCommentName] = useState('');
  const [commentText, setCommentText] = useState('');

  const handleCreateNew = () => {
    setIsCreatingNew(true);
    setCommentName('');
    setCommentText('');
  };

  const handleSaveNew = () => {
    if (!commentName.trim() || !commentText.trim()) {
      alert('Please enter both a name and comment text');
      return;
    }

    // Check if comment name already exists
    const existingComment = state.savedStandardComments.find(sc => sc.name === commentName.trim());
    
    if (existingComment) {
      const shouldReplace = window.confirm(
        `A standard comment named "${commentName.trim()}" already exists. Do you want to replace it?`
      );
      if (!shouldReplace) return;
    }

    const newComment: StandardComment = {
      name: commentName.trim(),
      comment: commentText.trim()
    };

    addStandardComment(newComment);
    onSelectComment(newComment);
  };

  const handleDeleteComment = (commentName: string) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete the standard comment "${commentName}"? This action cannot be undone.`
    );
    if (confirmed) {
      deleteStandardComment(commentName);
    }
  };

  if (isCreatingNew) {
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
            Create Standard Comment
          </h1>
        </header>

        <main style={{ 
          maxWidth: '800px', 
          margin: '0 auto', 
          padding: '32px 24px' 
        }}>
          
          <button 
            onClick={() => setIsCreatingNew(false)}
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
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
          }}>
            
            {/* Comment Name */}
            <div style={{ marginBottom: '24px' }}>
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
                placeholder="e.g. Class Behavior, Course Introduction, General Performance..."
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
              marginBottom: '24px'
            }}>
              <h3 style={{ 
                fontSize: '16px', 
                fontWeight: '600', 
                color: '#1e40af',
                margin: '0 0 8px 0'
              }}>
                Standard Comment:
              </h3>
              <p style={{ 
                color: '#1e40af', 
                fontSize: '14px',
                margin: 0
              }}>
                This comment will appear in reports unchanged. Teachers can edit it when writing individual reports if needed.
              </p>
            </div>

            {/* Comment Text */}
            <div style={{ marginBottom: '32px' }}>
              <label style={{ 
                display: 'block',
                fontSize: '18px', 
                fontWeight: '600', 
                color: '#111827',
                marginBottom: '8px'
              }}>
                Comment Text
              </label>
              <textarea
                placeholder="Enter the standard comment that will appear in reports. Teachers can edit this when writing individual reports."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '16px',
                  minHeight: '120px',
                  resize: 'vertical',
                  fontFamily: 'inherit',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Save Button */}
            <div style={{ 
              display: 'flex', 
              gap: '16px', 
              justifyContent: 'flex-end' 
            }}>
              <button
                onClick={() => setIsCreatingNew(false)}
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
                onClick={handleSaveNew}
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
                Save Standard Comment
              </button>
            </div>

          </div>
        </main>
      </div>
    );
  }

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
          Standard Comments
        </h1>
        <p style={{ 
          color: '#6b7280', 
          margin: '8px 0 0 0',
          fontSize: '16px'
        }}>
          Create a new standard comment or select from your saved comments
        </p>
      </header>

      <main style={{ 
        maxWidth: '800px', 
        margin: '0 auto', 
        padding: '32px 24px' 
      }}>
        
        <button 
          onClick={onBack}
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
          ← Back to Add Section
        </button>

        <div style={{
          backgroundColor: 'white',
          padding: '32px',
          borderRadius: '12px',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
          marginBottom: '24px'
        }}>
          
          {/* Create New Button */}
          <div style={{ marginBottom: '32px' }}>
            <button
              onClick={handleCreateNew}
              style={{
                backgroundColor: '#10b981',
                color: 'white',
                padding: '16px 32px',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '500',
                cursor: 'pointer',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                width: '100%'
              }}
            >
              Create New Standard Comment
            </button>
            <p style={{ 
              color: '#6b7280', 
              fontSize: '14px',
              margin: '8px 0 0 0',
              textAlign: 'center'
            }}>
              Create a comment that will appear automatically in reports
            </p>
          </div>

          {/* Saved Comments */}
          <h2 style={{ 
            fontSize: '20px', 
            fontWeight: '600', 
            color: '#111827',
            marginBottom: '16px'
          }}>
            Or select a saved standard comment ({state.savedStandardComments.length})
          </h2>

          {state.savedStandardComments.length === 0 ? (
            <div style={{
              border: '2px dashed #d1d5db',
              borderRadius: '8px',
              padding: '48px',
              textAlign: 'center',
              color: '#9ca3af'
            }}>
              <p style={{ margin: '0 0 8px 0' }}>No saved standard comments yet.</p>
              <p style={{ margin: 0 }}>Create your first standard comment to see it here!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {state.savedStandardComments.map((comment) => (
                <div key={comment.name} style={{
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  padding: '16px',
                  backgroundColor: '#fafafa'
                }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'flex-start',
                    marginBottom: '12px'
                  }}>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ 
                        fontSize: '18px', 
                        fontWeight: '600', 
                        color: '#111827',
                        margin: '0 0 8px 0'
                      }}>
                        {comment.name}
                      </h3>
                      <p style={{
                        color: '#6b7280',
                        fontSize: '14px',
                        margin: 0,
                        lineHeight: '1.5'
                      }}>
                        {comment.comment}
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div style={{ 
                    display: 'flex', 
                    gap: '8px', 
                    flexWrap: 'wrap' 
                  }}>
                    <button
                      onClick={() => onSelectComment(comment)}
                      style={{
                        backgroundColor: '#3b82f6',
                        color: 'white',
                        padding: '8px 16px',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '14px',
                        fontWeight: '500',
                        cursor: 'pointer'
                      }}
                    >
                      Add to Template
                    </button>
                    
                    <button
                      onClick={() => handleDeleteComment(comment.name)}
                      style={{
                        backgroundColor: '#ef4444',
                        color: 'white',
                        padding: '8px 16px',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '14px',
                        fontWeight: '500',
                        cursor: 'pointer'
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default StandardCommentSelector;