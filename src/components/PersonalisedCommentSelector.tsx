import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { PersonalisedComment } from '../types';
import PersonalisedCommentBuilder from './PersonalisedCommentBuilder';

interface PersonalisedCommentSelectorProps {
  onSelectComment: (comment: PersonalisedComment) => void;
  onBack: () => void;
}

function PersonalisedCommentSelector({ onSelectComment, onBack }: PersonalisedCommentSelectorProps) {
  const { state, addPersonalisedComment, updatePersonalisedComment, deletePersonalisedComment } = useData();
  const [showBuilder, setShowBuilder] = useState(false);
  const [editingComment, setEditingComment] = useState<PersonalisedComment | undefined>();

  const handleCreateNew = () => {
    setEditingComment(undefined);
    setShowBuilder(true);
  };

  const handleEdit = (comment: PersonalisedComment) => {
    setEditingComment(comment);
    setShowBuilder(true);
  };

  const handleSaveComment = (comment: PersonalisedComment) => {
    // Check if we're editing an existing comment
    if (editingComment) {
      // We're editing - use updatePersonalisedComment
      updatePersonalisedComment(comment);
    } else {
      // Check if comment name already exists
      const existingComment = state.savedPersonalisedComments.find(pc => pc.name === comment.name);
      
      if (existingComment) {
        const shouldReplace = window.confirm(
          `A personalised comment named "${comment.name}" already exists. Do you want to replace it?`
        );
        if (!shouldReplace) return;
        
        // Replace existing - use updatePersonalisedComment
        updatePersonalisedComment(comment);
      } else {
        // Add new - use addPersonalisedComment  
        addPersonalisedComment(comment);
      }
    }
    
    onSelectComment(comment);
    setShowBuilder(false);
  };

  const handleDeleteComment = (commentName: string) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete the personalised comment "${commentName}"? This action cannot be undone.`
    );
    if (confirmed) {
      deletePersonalisedComment(commentName);
    }
  };

  if (showBuilder) {
    return (
      <PersonalisedCommentBuilder
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
          Personalised Comments
        </h1>
        <p style={{ 
          color: '#6b7280', 
          margin: '8px 0 0 0',
          fontSize: '16px'
        }}>
          Create a new personalised comment or select from your saved comments
        </p>
      </header>

      <main style={{ 
        maxWidth: '900px', 
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
            marginBottom: '32px'
          }}>
          ← Back
        </button>

        <div style={{ marginBottom: '32px' }}>
          <button
            onClick={handleCreateNew}
            style={{
              backgroundColor: '#f59e0b',
              color: 'white',
              padding: '16px 32px',
              border: 'none',
              borderRadius: '12px',
              fontSize: '18px',
              fontWeight: '600',
              cursor: 'pointer',
              width: '100%',
              boxShadow: '0 2px 4px 0 rgba(0, 0, 0, 0.1)'
            }}
          >
            + Create New Personalised Comment
          </button>
        </div>

        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
          overflow: 'hidden'
        }}>
          {state.savedPersonalisedComments.length === 0 ? (
            <div style={{ 
              padding: '48px 24px',
              textAlign: 'center'
            }}>
              <h3 style={{ 
                fontSize: '18px', 
                color: '#6b7280',
                margin: '0 0 8px 0'
              }}>
                No Personalised Comments Yet
              </h3>
              <p style={{ 
                color: '#9ca3af',
                margin: 0
              }}>
                Create your first personalised comment to get started
              </p>
            </div>
          ) : (
            <div style={{ padding: '24px' }}>
              <h3 style={{ 
                fontSize: '18px', 
                fontWeight: '600', 
                color: '#111827',
                margin: '0 0 16px 0'
              }}>
                Saved Personalised Comments ({state.savedPersonalisedComments.length})
              </h3>
              
              {state.savedPersonalisedComments.map((comment, index) => (
                <div 
                  key={index}
                  style={{
                    border: '2px solid #e5e7eb',
                    borderRadius: '12px',
                    padding: '20px',
                    marginBottom: '16px',
                    backgroundColor: '#f9fafb'
                  }}
                >
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'flex-start',
                    marginBottom: '12px'
                  }}>
                    <div style={{ flex: 1 }}>
                      <h4 style={{ 
                        fontSize: '16px', 
                        fontWeight: '600', 
                        color: '#111827',
                        margin: '0 0 8px 0'
                      }}>
                        {comment.name}
                      </h4>
                      
                      <div style={{ marginBottom: '12px' }}>
                        <h5 style={{ 
                          fontSize: '14px', 
                          fontWeight: '500', 
                          color: '#6b7280',
                          margin: '0 0 4px 0'
                        }}>
                          Instruction:
                        </h5>
                        <p style={{ 
                          fontSize: '13px',
                          color: '#374151',
                          margin: '0 0 8px 0',
                          fontStyle: 'italic'
                        }}>
                          {comment.instruction || 'No instruction provided'}
                        </p>
                      </div>

                      {comment.headings && comment.headings.length > 0 && (
                        <div style={{ marginBottom: '12px' }}>
                          <h5 style={{ 
                            fontSize: '14px', 
                            fontWeight: '500', 
                            color: '#6b7280',
                            margin: '0 0 4px 0'
                          }}>
                            Categories:
                          </h5>
                          <div style={{ 
                            display: 'flex', 
                            flexWrap: 'wrap', 
                            gap: '6px',
                            marginBottom: '8px'
                          }}>
                            {comment.headings.map((heading, i) => (
                              <span 
                                key={i}
                                style={{
                                  backgroundColor: '#f59e0b',
                                  color: 'white',
                                  padding: '4px 8px',
                                  borderRadius: '4px',
                                  fontSize: '12px',
                                  fontWeight: '500'
                                }}
                              >
                                {heading}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      <div>
                        <h5 style={{ 
                          fontSize: '14px', 
                          fontWeight: '500', 
                          color: '#6b7280',
                          margin: '0 0 4px 0'
                        }}>
                          Sample Comments:
                        </h5>
                        {Object.entries(comment.comments).slice(0, 2).map(([category, comments], i) => (
                          <div key={i} style={{ marginBottom: '4px' }}>
                            <span style={{ 
                              fontWeight: '500',
                              fontSize: '13px',
                              color: '#374151'
                            }}>
                              {category}:
                            </span>
                            <span style={{ 
                              marginLeft: '6px',
                              fontSize: '13px',
                              color: '#6b7280'
                            }}>
                              {(comments as string[])[0] || 'No comments added'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ 
                    display: 'flex', 
                    gap: '8px',
                    justifyContent: 'flex-end'
                  }}>
                    <button
                      onClick={() => onSelectComment(comment)}
                      style={{
                        backgroundColor: '#f59e0b',
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

export default PersonalisedCommentSelector;