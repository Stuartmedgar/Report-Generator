import React, { useState, useEffect } from 'react';

interface StandardCommentBuilderProps {
  existingComment?: {
    name?: string;
    content?: string;
  };
  onSave: (comment: { name: string; data: { content: string } }) => void;
  onCancel: () => void;
}

function StandardCommentBuilder({ existingComment, onSave, onCancel }: StandardCommentBuilderProps) {
  const [commentName, setCommentName] = useState(existingComment?.name || '');
  const [commentContent, setCommentContent] = useState(existingComment?.content || '');

  // Update fields when existingComment changes
  useEffect(() => {
    if (existingComment) {
      setCommentName(existingComment.name || '');
      setCommentContent(existingComment.content || '');
    }
  }, [existingComment]);

  const handleSave = () => {
    if (!commentName.trim()) {
      alert('Please enter a name for this section');
      return;
    }
    if (!commentContent.trim()) {
      alert('Please enter content for this section');
      return;
    }

    onSave({
      name: commentName.trim(),
      data: { content: commentContent.trim() }
    });
  };

  return (
    <div style={{ 
      backgroundColor: 'white', 
      borderRadius: '12px', 
      padding: '32px',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      maxWidth: '800px',
      margin: '0 auto'
    }}>
      <h2 style={{ 
        fontSize: '24px', 
        fontWeight: '600', 
        color: '#111827', 
        marginBottom: '24px' 
      }}>
        {existingComment ? 'Edit' : 'Create'} Standard Comment
      </h2>

      <div style={{ marginBottom: '20px' }}>
        <label style={{ 
          display: 'block', 
          fontSize: '14px', 
          fontWeight: '500', 
          color: '#374151', 
          marginBottom: '8px' 
        }}>
          Section Name
        </label>
        <input
          type="text"
          value={commentName}
          onChange={(e) => setCommentName(e.target.value)}
          placeholder="e.g., Attendance, Homework, Participation..."
          style={{
            width: '100%',
            padding: '12px 16px',
            border: '2px solid #e5e7eb',
            borderRadius: '8px',
            fontSize: '16px',
            boxSizing: 'border-box',
            outline: 'none',
            transition: 'border-color 0.2s'
          }}
          onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
          onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
        />
      </div>

      <div style={{ marginBottom: '24px' }}>
        <label style={{ 
          display: 'block', 
          fontSize: '14px', 
          fontWeight: '500', 
          color: '#374151', 
          marginBottom: '8px' 
        }}>
          Comment Content
        </label>
        <textarea
          value={commentContent}
          onChange={(e) => setCommentContent(e.target.value)}
          placeholder="Enter your comment here. Use [Name] to insert the student's name..."
          style={{
            width: '100%',
            minHeight: '200px',
            padding: '12px 16px',
            border: '2px solid #e5e7eb',
            borderRadius: '8px',
            fontSize: '16px',
            resize: 'vertical',
            boxSizing: 'border-box',
            fontFamily: 'inherit',
            outline: 'none',
            transition: 'border-color 0.2s'
          }}
          onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
          onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
        />
        <p style={{ 
          fontSize: '12px', 
          color: '#6b7280', 
          marginTop: '8px', 
          fontStyle: 'italic' 
        }}>
          Tip: Use [Name] to automatically insert the student's name
        </p>
      </div>

      <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
        <button
          onClick={onCancel}
          style={{
            backgroundColor: '#f3f4f6',
            color: '#374151',
            padding: '12px 24px',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e5e7eb'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          style={{
            backgroundColor: '#3b82f6',
            color: 'white',
            padding: '12px 24px',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#3b82f6'}
        >
          Save Changes
        </button>
      </div>
    </div>
  );
}

export default StandardCommentBuilder;