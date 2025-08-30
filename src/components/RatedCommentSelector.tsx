import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { RatedComment } from '../types';
import RatedCommentBuilder from './RatedCommentBuilder';

interface RatedCommentSelectorProps {
  onSelectComment: (comment: RatedComment) => void;
  onBack: () => void;
}

function RatedCommentSelector({ onSelectComment, onBack }: RatedCommentSelectorProps) {
  const { state, addRatedComment, deleteRatedComment } = useData();
  const [showBuilder, setShowBuilder] = useState(false);
  const [editingComment, setEditingComment] = useState<RatedComment | undefined>();

  const handleCreateNew = () => {
    setEditingComment(undefined);
    setShowBuilder(true);
  };

  const handleEdit = (comment: RatedComment) => {
    setEditingComment(comment);
    setShowBuilder(true);
  };

  const handleSaveComment = (comment: RatedComment) => {
    // Check if comment name already exists
    const existingComment = state.savedRatedComments.find(rc => rc.name === comment.name);
    
    if (existingComment && !editingComment) {
      const shouldReplace = window.confirm(
        `A rated comment named "${comment.name}" already exists. Do you want to replace it?`
      );
      if (!shouldReplace) return;
    }

    addRatedComment(comment);
    onSelectComment(comment);
    setShowBuilder(false);
  };

  const handleDeleteComment = (commentName: string) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete the rated comment "${commentName}"? This action cannot be undone.`
    );
    if (confirmed) {
      deleteRatedComment(commentName);
    }
  };

  if (showBuilder) {
    return (
      <RatedCommentBuilder
        onSave={handleSaveComment}
        onCancel={() => setShowBuilder(false)}
        existingComment={editingComment}
      />
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
          Rated Comments
        </h1>
        <p style={{ 
          color: '#6b7280', 
          margin: '8px 0 0 0',
          fontSize: '16px'
        }}>
          Create a new rated comment or select from your saved comments
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
              Create New Rated Comment
            </button>
            <p style={{ 
              color: '#6b7280', 
              fontSize: '14px',
              margin: '8px 0 0 0',
              textAlign: 'center'
            }}>
              Build a new rated comment from scratch
            </p>
          </div>

          {/* Saved Comments */}
          <h2 style={{ 
            fontSize: '20px', 
            fontWeight: '600', 
            color: '#111827',
            marginBottom: '16px'
          }}>
            Or select a saved rated comment ({state.savedRatedComments.length})
          </h2>

          {state.savedRatedComments.length === 0 ? (
            <div style={{
              border: '2px dashed #d1d5db',
              borderRadius: '8px',
              padding: '48px',
              textAlign: 'center',
              color: '#9ca3af'
            }}>
              <p style={{ margin: '0 0 8px 0' }}>No saved rated comments yet.</p>
              <p style={{ margin: 0 }}>Create your first rated comment to see it here!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {state.savedRatedComments.map((comment) => (
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
                    <div>
                      <h3 style={{ 
                        fontSize: '18px', 
                        fontWeight: '600', 
                        color: '#111827',
                        margin: '0 0 8px 0'
                      }}>
                        {comment.name}
                      </h3>
                      <div style={{ 
                        display: 'flex', 
                        flexWrap: 'wrap', 
                        gap: '8px' 
                      }}>
                        <span style={{
                          backgroundColor: '#10b981',
                          color: 'white',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: '500'
                        }}>
                          {comment.comments.excellent.length} Excellent
                        </span>
                        <span style={{
                          backgroundColor: '#3b82f6',
                          color: 'white',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: '500'
                        }}>
                          {comment.comments.good.length} Good
                        </span>
                        <span style={{
                          backgroundColor: '#f59e0b',
                          color: 'white',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: '500'
                        }}>
                          {comment.comments.satisfactory.length} Satisfactory
                        </span>
                        <span style={{
                          backgroundColor: '#ef4444',
                          color: 'white',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: '500'
                        }}>
                          {comment.comments.needsImprovement.length} Needs Improvement
                        </span>
                      </div>
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
                      onClick={() => handleEdit(comment)}
                      style={{
                        backgroundColor: '#10b981',
                        color: 'white',
                        padding: '8px 16px',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '14px',
                        fontWeight: '500',
                        cursor: 'pointer'
                      }}
                    >
                      Edit
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

export default RatedCommentSelector;