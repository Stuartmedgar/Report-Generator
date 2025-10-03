import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { QualitiesComment } from '../types';
import QualitiesCommentBuilder from './QualitiesCommentBuilder';

interface QualitiesCommentSelectorProps {
  onSelectComment: (comment: QualitiesComment) => void;
  onBack: () => void;
}

function QualitiesCommentSelector({ onSelectComment, onBack }: QualitiesCommentSelectorProps) {
  const { state, addQualitiesComment, deleteQualitiesComment } = useData();
  const [showBuilder, setShowBuilder] = useState(false);
  const [editingComment, setEditingComment] = useState<QualitiesComment | undefined>();

  // Default qualities comment
  const defaultQualitiesComment: QualitiesComment = {
    name: 'Default Qualities Comment',
    headings: ['Character Qualities', 'Work Ethic', 'Social Skills'],
    comments: {
      'Character Qualities': [
        '[Name] demonstrates exceptional leadership qualities and serves as a positive role model.',
        '[Name] shows great kindness, empathy, and respect towards peers and adults.',
        '[Name] displays honesty, integrity, and takes responsibility for their actions.'
      ],
      'Work Ethic': [
        '[Name] consistently shows dedication and perseverance in all tasks.',
        '[Name] demonstrates excellent organizational skills and time management.',
        '[Name] takes initiative and shows a strong commitment to learning.'
      ],
      'Social Skills': [
        '[Name] works collaboratively and contributes positively to group activities.',
        '[Name] communicates effectively and listens attentively to others.',
        '[Name] shows maturity in resolving conflicts and building friendships.'
      ]
    }
  };

  const handleCreateNew = () => {
    setEditingComment(undefined);
    setShowBuilder(true);
  };

  const handleEdit = (comment: QualitiesComment) => {
    setEditingComment(comment);
    setShowBuilder(true);
  };

  const handleEditDefault = () => {
    setEditingComment(defaultQualitiesComment);
    setShowBuilder(true);
  };

  const handleSaveComment = (comment: QualitiesComment) => {
    const existingComment = state.savedQualitiesComments?.find(qc => qc.name === comment.name);
    
    if (existingComment && !editingComment) {
      const shouldReplace = window.confirm(
        `A qualities comment named "${comment.name}" already exists. Do you want to replace it?`
      );
      if (!shouldReplace) return;
    }

    addQualitiesComment(comment);
    onSelectComment(comment);
    setShowBuilder(false);
  };

  const handleDeleteComment = (commentName: string) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete the qualities comment "${commentName}"?`
    );
    if (confirmed) {
      deleteQualitiesComment(commentName);
    }
  };

  if (showBuilder) {
    return (
      <QualitiesCommentBuilder
        onSave={handleSaveComment}
        onCancel={() => {
          setShowBuilder(false);
          setEditingComment(undefined);
        }}
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
          fontSize: '16px',
          margin: '8px 0 0 0'
        }}>
          Highlight student character, work ethic, and personal strengths
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
            marginBottom: '24px'
          }}>
          ← Back
        </button>

        {/* Create New Button */}
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ 
            fontSize: '20px', 
            fontWeight: '600', 
            color: '#111827',
            marginBottom: '16px'
          }}>
            Create New Qualities Comment
          </h2>
          <button
            onClick={handleCreateNew}
            style={{
              backgroundColor: '#8b5cf6',
              color: 'white',
              padding: '16px 24px',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '500',
              cursor: 'pointer',
              width: '100%'
            }}
          >
            + Create Custom Qualities Comment
          </button>
          <p style={{
            color: '#6b7280',
            fontSize: '14px',
            margin: '8px 0 0 0',
            textAlign: 'center'
          }}>
            Build a new qualities comment from scratch
          </p>
        </div>

        {/* Default Qualities Comment */}
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ 
            fontSize: '20px', 
            fontWeight: '600', 
            color: '#111827',
            marginBottom: '16px'
          }}>
            Or select the Default Qualities Comment
          </h2>
          
          <div style={{
            border: '2px solid #8b5cf6',
            borderRadius: '8px',
            padding: '16px',
            backgroundColor: '#f3e8ff',
            marginBottom: '16px'
          }}>
            <h3 style={{ 
              fontSize: '18px', 
              fontWeight: '600', 
              color: '#8b5cf6',
              margin: '0 0 8px 0'
            }}>
              Default Qualities Comment
            </h3>
            <p style={{
              color: '#6b7280',
              fontSize: '14px',
              margin: '0 0 12px 0'
            }}>
              Pre-built qualities comment with character traits, work ethic, and social skills.
            </p>
            <div style={{ 
              display: 'flex', 
              gap: '8px' 
            }}>
              <button
                onClick={() => onSelectComment(defaultQualitiesComment)}
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

        {/* Saved Qualities Comments */}
        <h2 style={{ 
          fontSize: '20px', 
          fontWeight: '600', 
          color: '#111827',
          marginBottom: '16px'
        }}>
          Or select a saved qualities comment ({state.savedQualitiesComments?.length || 0})
        </h2>

        {(!state.savedQualitiesComments || state.savedQualitiesComments.length === 0) ? (
          <div style={{
            border: '2px dashed #d1d5db',
            borderRadius: '8px',
            padding: '48px',
            textAlign: 'center',
            color: '#9ca3af'
          }}>
            <p style={{ margin: '0 0 8px 0' }}>No saved qualities comments yet.</p>
            <p style={{ margin: 0 }}>Create your first qualities comment to see it here!</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {state.savedQualitiesComments.map((comment) => (
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
                     {comment.headings.map((heading: string, index: number) => (
                        <span key={index} style={{
                          backgroundColor: '#8b5cf6',
                          color: 'white',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: '500'
                        }}>
                          {heading}: {comment.comments[heading]?.length || 0} qualities
                        </span>
                      ))}
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
                    Add to Template
                  </button>
                  
                  <button
                    onClick={() => handleEdit(comment)}
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
                    Edit
                  </button>
                  
                  <button
                    onClick={() => handleDeleteComment(comment.name)}
                    style={{
                      backgroundColor: 'white',
                      color: '#ef4444',
                      border: '2px solid #ef4444',
                      padding: '8px 16px',
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
      </main>
    </div>
  );
}

export default QualitiesCommentSelector;