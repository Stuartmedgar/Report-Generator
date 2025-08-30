import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { AssessmentComment } from '../types';
import AssessmentCommentBuilder from './AssessmentCommentBuilder';

interface AssessmentCommentSelectorProps {
  onSelectComment: (comment: AssessmentComment) => void;
  onBack: () => void;
}

function AssessmentCommentSelector({ onSelectComment, onBack }: AssessmentCommentSelectorProps) {
  const { state, addAssessmentComment, deleteAssessmentComment } = useData();
  const [showBuilder, setShowBuilder] = useState(false);
  const [editingComment, setEditingComment] = useState<AssessmentComment | undefined>();

  // Default assessment comment
  const defaultAssessmentComment: AssessmentComment = {
    name: 'Default Assessment Comment',
    scoreType: 'outOf',
    maxScore: 100,
    comments: {
      excellent: [
        '[Name] achieved an excellent score of [Score] demonstrating outstanding understanding.',
        '[Name] scored [Score] which reflects exceptional performance and mastery of the subject.'
      ],
      good: [
        '[Name] achieved a good score of [Score] showing solid understanding of the material.',
        '[Name] scored [Score] demonstrating good progress and comprehension.'
      ],
      satisfactory: [
        '[Name] achieved a satisfactory score of [Score] meeting the expected standards.',
        '[Name] scored [Score] showing adequate understanding of the key concepts.'
      ],
      needsImprovement: [
        '[Name] scored [Score] which indicates areas requiring further development.',
        '[Name] achieved [Score] and would benefit from additional practice and support.'
      ],
      notCompleted: [
        '[Name] did not complete this assessment and will need to arrange a makeup opportunity.',
        'This assessment was not completed by [Name] and should be rescheduled.'
      ]
    }
  };

  const handleCreateNew = () => {
    setEditingComment(undefined);
    setShowBuilder(true);
  };

  const handleEdit = (comment: AssessmentComment) => {
    setEditingComment(comment);
    setShowBuilder(true);
  };

  const handleEditDefault = () => {
    setEditingComment(defaultAssessmentComment);
    setShowBuilder(true);
  };

  const handleSaveComment = (comment: AssessmentComment) => {
    // Check if comment name already exists
    const existingComment = state.savedAssessmentComments.find(ac => ac.name === comment.name);
    
    if (existingComment && !editingComment) {
      const shouldReplace = window.confirm(
        `An assessment comment named "${comment.name}" already exists. Do you want to replace it?`
      );
      if (!shouldReplace) return;
    }

    addAssessmentComment(comment);
    onSelectComment(comment);
    setShowBuilder(false);
  };

  const handleDeleteComment = (commentName: string) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete the assessment comment "${commentName}"? This action cannot be undone.`
    );
    if (confirmed) {
      deleteAssessmentComment(commentName);
    }
  };

  if (showBuilder) {
    return (
      <AssessmentCommentBuilder
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
          Assessment Comments
        </h1>
        <p style={{ 
          color: '#6b7280', 
          margin: '8px 0 0 0',
          fontSize: '16px'
        }}>
          Create, use default, or select from your saved assessment comments
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
              Create New Assessment Comment
            </button>
            <p style={{ 
              color: '#6b7280', 
              fontSize: '14px',
              margin: '8px 0 0 0',
              textAlign: 'center'
            }}>
              Build a new assessment comment from scratch
            </p>
          </div>

          {/* Default Assessment Comment */}
          <div style={{ marginBottom: '32px' }}>
            <h2 style={{ 
              fontSize: '20px', 
              fontWeight: '600', 
              color: '#111827',
              marginBottom: '16px'
            }}>
              Or select the Default Assessment Comment
            </h2>
            
            <div style={{
              border: '2px solid #8b5cf6',
              borderRadius: '8px',
              padding: '16px',
              backgroundColor: '#faf5ff',
              marginBottom: '16px'
            }}>
              <h3 style={{ 
                fontSize: '18px', 
                fontWeight: '600', 
                color: '#8b5cf6',
                margin: '0 0 8px 0'
              }}>
                Default Assessment Comment
              </h3>
              <p style={{
                color: '#6b7280',
                fontSize: '14px',
                margin: '0 0 12px 0'
              }}>
                Pre-built assessment comment with score out of 100 and standard feedback for all performance levels.
              </p>
              <div style={{ 
                display: 'flex', 
                gap: '8px' 
              }}>
                <button
                  onClick={() => onSelectComment(defaultAssessmentComment)}
                  style={{
                    backgroundColor: '#8b5cf6',
                    color: 'white',
                    padding: '8px 16px',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  Add Default to Template
                </button>
                
                <button
                  onClick={handleEditDefault}
                  style={{
                    backgroundColor: 'white',
                    color: '#8b5cf6',
                    border: '2px solid #8b5cf6',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  Edit Default
                </button>
              </div>
            </div>
          </div>

          {/* Saved Assessment Comments */}
          <h2 style={{ 
            fontSize: '20px', 
            fontWeight: '600', 
            color: '#111827',
            marginBottom: '16px'
          }}>
            Or select a saved assessment comment ({state.savedAssessmentComments.length})
          </h2>

          {state.savedAssessmentComments.length === 0 ? (
            <div style={{
              border: '2px dashed #d1d5db',
              borderRadius: '8px',
              padding: '48px',
              textAlign: 'center',
              color: '#9ca3af'
            }}>
              <p style={{ margin: '0 0 8px 0' }}>No saved assessment comments yet.</p>
              <p style={{ margin: 0 }}>Create your first assessment comment to see it here!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {state.savedAssessmentComments.map((comment) => (
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
                      <div style={{ 
                        display: 'flex', 
                        flexWrap: 'wrap', 
                        gap: '8px',
                        marginBottom: '8px'
                      }}>
                        <span style={{
                          backgroundColor: comment.scoreType === 'outOf' ? '#3b82f6' : '#10b981',
                          color: 'white',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: '500'
                        }}>
                          {comment.scoreType === 'outOf' ? `Out of ${comment.maxScore}` : 'Percentage'}
                        </span>
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
                        <span style={{
                          backgroundColor: '#6b7280',
                          color: 'white',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: '500'
                        }}>
                          {comment.comments.notCompleted.length} Not Completed
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

export default AssessmentCommentSelector;