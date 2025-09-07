import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { QualitiesComment } from '../types';
import QualitiesCommentBuilder from './QualitiesCommentBuilder';

interface QualitiesCommentSelectorProps {
  onSelectComment: (comment: QualitiesComment) => void;
  onBack: () => void;
}

function QualitiesCommentSelector({ onSelectComment, onBack }: QualitiesCommentSelectorProps) {
  const { state, addQualitiesComment, updateQualitiesComment, deleteQualitiesComment } = useData();
  const [showBuilder, setShowBuilder] = useState(false);
  const [editingComment, setEditingComment] = useState<QualitiesComment | undefined>(undefined);

  const handleCreateNew = () => {
    setEditingComment(undefined);
    setShowBuilder(true);
  };

  const handleEditComment = (comment: QualitiesComment) => {
    setEditingComment(comment);
    setShowBuilder(true);
  };

  const handleSaveComment = (comment: QualitiesComment) => {
    if (editingComment) {
      // Check if name changed, if so confirm replacement
      if (editingComment.name !== comment.name) {
        const existingWithNewName = state.savedQualitiesComments.find((c: QualitiesComment) => c.name === comment.name);
        const shouldReplace = existingWithNewName ? window.confirm(
          `A qualities comment named "${comment.name}" already exists. Do you want to replace it?`
        ) : true;
        if (!shouldReplace) return;
        
        // Replace existing - use updateQualitiesComment
        updateQualitiesComment(comment);
      } else {
        // Update existing
        updateQualitiesComment(comment);
      }
    } else {
      // Add new - use addQualitiesComment  
      addQualitiesComment(comment);
    }
    
    onSelectComment(comment);
    setShowBuilder(false);
  };

  const handleDeleteComment = (commentName: string) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete the qualities comment "${commentName}"? This action cannot be undone.`
    );
    if (confirmed) {
      deleteQualitiesComment(commentName);
    }
  };

  if (showBuilder) {
    return (
      <QualitiesCommentBuilder
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
          Qualities Comments
        </h1>
        <p style={{ 
          color: '#6b7280', 
          margin: '8px 0 0 0',
          fontSize: '16px'
        }}>
          Create a new qualities comment or select from your saved comments
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
              backgroundColor: '#8b5cf6',
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
            + Create New Qualities Comment
          </button>
        </div>

        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
          overflow: 'hidden'
        }}>
          {state.savedQualitiesComments.length === 0 ? (
            <div style={{
              padding: '48px',
              textAlign: 'center',
              color: '#9ca3af'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>✨</div>
              <h3 style={{ fontSize: '18px', fontWeight: '600', margin: '0 0 8px 0' }}>
                No Qualities Comments Yet
              </h3>
              <p style={{ margin: '0 0 24px 0' }}>
                Create your first qualities comment to get started. Perfect for highlighting character traits and personal strengths.
              </p>
              <button
                onClick={handleCreateNew}
                style={{
                  backgroundColor: '#8b5cf6',
                  color: 'white',
                  padding: '12px 24px',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                Create Your First Qualities Comment
              </button>
            </div>
          ) : (
            <div>
              {state.savedQualitiesComments.map((comment: QualitiesComment, index: number) => (
                <div 
                  key={comment.name}
                  style={{
                    padding: '24px',
                    borderBottom: index < state.savedQualitiesComments.length - 1 ? '1px solid #e5e7eb' : 'none',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s',
                    backgroundColor: 'white'
                  }}
                  onClick={() => onSelectComment(comment)}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ 
                        fontSize: '18px', 
                        fontWeight: '600', 
                        color: '#8b5cf6',
                        margin: '0 0 8px 0'
                      }}>
                        {comment.name}
                      </h3>
                      <div style={{ 
                        fontSize: '14px', 
                        color: '#6b7280',
                        marginBottom: '12px'
                      }}>
                        {comment.headings.length} quality area{comment.headings.length !== 1 ? 's' : ''} • {
                          Object.values(comment.comments).reduce((total: number, arr: string[]) => total + arr.length, 0)
                        } total quality statements
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {comment.headings.slice(0, 3).map((heading: string, i: number) => (
                          <span key={i} style={{
                            backgroundColor: '#ede9fe',
                            color: '#7c3aed',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: '500'
                          }}>
                            {heading}
                          </span>
                        ))}
                        {comment.headings.length > 3 && (
                          <span style={{
                            backgroundColor: '#f3f4f6',
                            color: '#6b7280',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontSize: '12px'
                          }}>
                            +{comment.headings.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', marginLeft: '16px' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditComment(comment);
                        }}
                        style={{
                          backgroundColor: '#8b5cf6',
                          color: 'white',
                          padding: '6px 12px',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '14px',
                          cursor: 'pointer'
                        }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteComment(comment.name);
                        }}
                        style={{
                          backgroundColor: '#ef4444',
                          color: 'white',
                          padding: '6px 12px',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '14px',
                          cursor: 'pointer'
                        }}
                      >
                        Delete
                      </button>
                    </div>
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

export default QualitiesCommentSelector;