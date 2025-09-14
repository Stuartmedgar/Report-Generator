import React from 'react';

interface MobileSectionCardProps {
  section: any;
  sectionData: any;
  updateSectionData: (sectionId: string, data: any) => void;
}

const MobileSectionCard: React.FC<MobileSectionCardProps> = ({ section, sectionData, updateSectionData }) => {
  const data = sectionData[section.id] || {};

  // State for all editing functionality - moved to component level
  const [showEditComment, setShowEditComment] = React.useState(false);
  const [editableComment, setEditableComment] = React.useState('');
  const [showEditSuggestion, setShowEditSuggestion] = React.useState(false);
  const [editableSuggestion, setEditableSuggestion] = React.useState('');

  // Effect to sync editable content when data changes
  React.useEffect(() => {
    if (data.selectedComment) {
      setEditableComment(data.customEditedComment || data.selectedComment);
    }
    if (data.selectedSuggestion) {
      setEditableSuggestion(data.customEditedSuggestion || data.selectedSuggestion);
    }
  }, [data.selectedComment, data.customEditedComment, data.selectedSuggestion, data.customEditedSuggestion]);

  const getSectionColor = (type: string) => {
    switch (type) {
      case 'rated-comment': return { bg: '#f0f9ff', border: '#0ea5e9', text: '#0369a1' };
      case 'assessment-comment': return { bg: '#f0fdf4', border: '#10b981', text: '#059669' };
      case 'personalised-comment': return { bg: '#fffbeb', border: '#f59e0b', text: '#d97706' };
      case 'next-steps': return { bg: '#ecfeff', border: '#06b6d4', text: '#0891b2' };
      case 'standard-comment': return { bg: '#f8fafc', border: '#64748b', text: '#475569' };
      case 'optional-additional-comment': return { bg: '#fdf4ff', border: '#a855f7', text: '#9333ea' };
      default: return { bg: '#f8fafc', border: '#64748b', text: '#475569' };
    }
  };

  const colors = getSectionColor(section.type);

  const handleSaveEditedComment = () => {
    updateSectionData(section.id, { customEditedComment: editableComment });
    setShowEditComment(false);
  };

  const handleCancelEditComment = () => {
    setEditableComment(data.selectedComment || '');
    setShowEditComment(false);
  };

  const handleSaveEditedSuggestion = () => {
    updateSectionData(section.id, { customEditedSuggestion: editableSuggestion });
    setShowEditSuggestion(false);
  };

  const handleCancelEditSuggestion = () => {
    setEditableSuggestion(data.selectedSuggestion || '');
    setShowEditSuggestion(false);
  };

  const renderEditableCommentBox = (editButtonColor: string) => {
    if (!showEditComment) {
      return (
        <div style={{ padding: '10px' }}>
          <div style={{ 
            fontSize: '12px', 
            color: '#374151', 
            lineHeight: '1.4',
            marginBottom: '8px'
          }}>
            {data.customEditedComment || data.selectedComment.replace(/\[Name\]/g, 'Student')}
          </div>
          <button
            onClick={() => setShowEditComment(true)}
            style={{
              backgroundColor: editButtonColor,
              color: 'white',
              border: 'none',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '10px',
              cursor: 'pointer'
            }}
          >
            ✏️ Edit
          </button>
        </div>
      );
    }

    return (
      <div style={{ padding: '10px' }}>
        <textarea
          value={editableComment}
          onChange={(e) => setEditableComment(e.target.value)}
          style={{
            width: '100%',
            minHeight: '80px',
            padding: '8px',
            border: '1px solid #d1d5db',
            borderRadius: '4px',
            fontSize: '12px',
            fontFamily: 'inherit',
            resize: 'vertical',
            marginBottom: '8px'
          }}
        />
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            onClick={handleSaveEditedComment}
            style={{
              backgroundColor: '#10b981',
              color: 'white',
              border: 'none',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '10px',
              cursor: 'pointer'
            }}
          >
            ✓ Save
          </button>
          <button
            onClick={handleCancelEditComment}
            style={{
              backgroundColor: '#6b7280',
              color: 'white',
              border: 'none',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '10px',
              cursor: 'pointer'
            }}
          >
            ✗ Cancel
          </button>
        </div>
      </div>
    );
  };

  const renderEditableSuggestionBox = () => {
    if (!showEditSuggestion) {
      return (
        <div style={{ padding: '10px' }}>
          <div style={{ 
            fontSize: '12px', 
            color: '#374151', 
            lineHeight: '1.4',
            marginBottom: '8px'
          }}>
            {data.customEditedSuggestion || data.selectedSuggestion.replace(/\[Name\]/g, 'Student')}
          </div>
          <button
            onClick={() => setShowEditSuggestion(true)}
            style={{
              backgroundColor: '#06b6d4',
              color: 'white',
              border: 'none',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '10px',
              cursor: 'pointer'
            }}
          >
            ✏️ Edit
          </button>
        </div>
      );
    }

    return (
      <div style={{ padding: '10px' }}>
        <textarea
          value={editableSuggestion}
          onChange={(e) => setEditableSuggestion(e.target.value)}
          style={{
            width: '100%',
            minHeight: '80px',
            padding: '8px',
            border: '1px solid #d1d5db',
            borderRadius: '4px',
            fontSize: '12px',
            fontFamily: 'inherit',
            resize: 'vertical',
            marginBottom: '8px'
          }}
        />
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            onClick={handleSaveEditedSuggestion}
            style={{
              backgroundColor: '#10b981',
              color: 'white',
              border: 'none',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '10px',
              cursor: 'pointer'
            }}
          >
            ✓ Save
          </button>
          <button
            onClick={handleCancelEditSuggestion}
            style={{
              backgroundColor: '#6b7280',
              color: 'white',
              border: 'none',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '10px',
              cursor: 'pointer'
            }}
          >
            ✗ Cancel
          </button>
        </div>
      </div>
    );
  };

  const renderRatedComment = () => {
    const ratings = [
      { value: 'excellent', label: 'Excellent', color: '#10b981' },
      { value: 'good', label: 'Good', color: '#3b82f6' },
      { value: 'satisfactory', label: 'Satisfactory', color: '#f59e0b' },
      { value: 'needsImprovement', label: 'Needs Improvement', color: '#ef4444' }
    ];

    return (
      <div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
          {ratings.map((rating) => (
            <button
              key={rating.value}
              onClick={() => updateSectionData(section.id, { rating: rating.value })}
              style={{
                backgroundColor: data.rating === rating.value ? rating.color : 'white',
                color: data.rating === rating.value ? 'white' : rating.color,
                border: `2px solid ${rating.color}`,
                padding: '6px 8px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: '600',
                cursor: 'pointer',
                flex: '1 1 calc(50% - 3px)',
                minWidth: '100px',
                textAlign: 'center'
              }}
            >
              {rating.label}
            </button>
          ))}
          
          <button
            onClick={() => updateSectionData(section.id, { rating: 'no-comment' })}
            style={{
              backgroundColor: data.rating === 'no-comment' ? '#6b7280' : 'white',
              color: data.rating === 'no-comment' ? 'white' : '#6b7280',
              border: '2px solid #6b7280',
              padding: '6px 8px',
              borderRadius: '4px',
              fontSize: '11px',
              fontWeight: '600',
              cursor: 'pointer',
              flex: '1 1 100%',
              textAlign: 'center'
            }}
          >
            ✗ Exclude from Report
          </button>
        </div>
        
        {data.rating && data.rating !== 'no-comment' && data.selectedComment && (
          <div style={{
            backgroundColor: '#f8fafc',
            border: '1px solid #e5e7eb',
            borderRadius: '4px',
            marginTop: '6px'
          }}>
            {renderEditableCommentBox('#3b82f6')}
          </div>
        )}
      </div>
    );
  };

  const renderAssessmentComment = () => {
    const performances = [
      { value: 'excellent', label: 'Excellent', color: '#10b981' },
      { value: 'good', label: 'Good', color: '#3b82f6' },
      { value: 'satisfactory', label: 'Satisfactory', color: '#f59e0b' },
      { value: 'needsImprovement', label: 'Needs Improvement', color: '#ef4444' }
    ];

    return (
      <div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
          {performances.map((performance) => (
            <button
              key={performance.value}
              onClick={() => updateSectionData(section.id, { performance: performance.value })}
              style={{
                backgroundColor: data.performance === performance.value ? performance.color : 'white',
                color: data.performance === performance.value ? 'white' : performance.color,
                border: `2px solid ${performance.color}`,
                padding: '6px 8px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: '600',
                cursor: 'pointer',
                flex: '1 1 calc(50% - 3px)',
                minWidth: '100px',
                textAlign: 'center'
              }}
            >
              {performance.label}
            </button>
          ))}
          
          <button
            onClick={() => updateSectionData(section.id, { performance: 'no-comment' })}
            style={{
              backgroundColor: data.performance === 'no-comment' ? '#6b7280' : 'white',
              color: data.performance === 'no-comment' ? 'white' : '#6b7280',
              border: '2px solid #6b7280',
              padding: '6px 8px',
              borderRadius: '4px',
              fontSize: '11px',
              fontWeight: '600',
              cursor: 'pointer',
              flex: '1 1 100%',
              textAlign: 'center'
            }}
          >
            ✗ Exclude from Report
          </button>
        </div>
        
        {data.selectedComment && data.performance !== 'no-comment' && (
          <div style={{
            backgroundColor: '#f8fafc',
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
            marginTop: '8px'
          }}>
            {renderEditableCommentBox('#10b981')}
          </div>
        )}
      </div>
    );
  };

  const renderPersonalisedComment = () => {
    const categories = section.data?.headings || Object.keys(section.data?.categories || section.data?.comments || {});
    
    return (
      <div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
          {categories.map((category: string) => (
            <button
              key={category}
              onClick={() => updateSectionData(section.id, { category })}
              style={{
                backgroundColor: data.category === category ? '#f59e0b' : 'white',
                color: data.category === category ? 'white' : '#f59e0b',
                border: '2px solid #f59e0b',
                padding: '6px 8px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: '600',
                cursor: 'pointer',
                flex: '1 1 auto',
                textAlign: 'center'
              }}
            >
              {category}
            </button>
          ))}
          
          <button
            onClick={() => updateSectionData(section.id, { category: null })}
            style={{
              backgroundColor: !data.category ? '#6b7280' : 'white',
              color: !data.category ? 'white' : '#6b7280',
              border: '2px solid #6b7280',
              padding: '6px 8px',
              borderRadius: '4px',
              fontSize: '11px',
              fontWeight: '600',
              cursor: 'pointer',
              flex: '1 1 100%',
              textAlign: 'center'
            }}
          >
            ✗ Exclude from Report
          </button>
        </div>
        
        {data.selectedComment && data.category && (
          <div style={{
            backgroundColor: '#f8fafc',
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
            marginTop: '8px'
          }}>
            {renderEditableCommentBox('#f59e0b')}
          </div>
        )}
      </div>
    );
  };

  const renderNextSteps = () => {
    const focusAreas = section.data?.headings || Object.keys(section.data?.focusAreas || section.data?.comments || {});
    
    return (
      <div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
          {focusAreas.map((area: string) => (
            <button
              key={area}
              onClick={() => updateSectionData(section.id, { focusArea: area })}
              style={{
                backgroundColor: data.focusArea === area ? '#06b6d4' : 'white',
                color: data.focusArea === area ? 'white' : '#06b6d4',
                border: '2px solid #06b6d4',
                padding: '6px 8px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: '600',
                cursor: 'pointer',
                flex: '1 1 auto',
                textAlign: 'center'
              }}
            >
              {area}
            </button>
          ))}
          
          <button
            onClick={() => updateSectionData(section.id, { focusArea: null })}
            style={{
              backgroundColor: !data.focusArea ? '#6b7280' : 'white',
              color: !data.focusArea ? 'white' : '#6b7280',
              border: '2px solid #6b7280',
              padding: '6px 8px',
              borderRadius: '4px',
              fontSize: '11px',
              fontWeight: '600',
              cursor: 'pointer',
              flex: '1 1 100%',
              textAlign: 'center'
            }}
          >
            ✗ Exclude from Report
          </button>
        </div>
        
        {data.selectedSuggestion && data.focusArea && (
          <div style={{
            backgroundColor: '#f8fafc',
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
            marginTop: '8px'
          }}>
            {renderEditableSuggestionBox()}
          </div>
        )}
      </div>
    );
  };

  const renderStandardComment = () => {
    const content = data.content || section.data?.content || '';
    
    return (
      <div style={{
        backgroundColor: '#f8fafc',
        padding: '12px',
        borderRadius: '6px',
        fontSize: '13px',
        color: '#374151',
        border: '1px solid #e5e7eb'
      }}>
        {content ? content.replace(/\[Name\]/g, 'Student') : 'No content set'}
      </div>
    );
  };

  const renderOptionalComment = () => {
    return (
      <div>
        <textarea
          value={data.comment || ''}
          onChange={(e) => updateSectionData(section.id, { comment: e.target.value })}
          placeholder="Add your comment here..."
          style={{
            width: '100%',
            minHeight: '80px',
            padding: '10px',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '14px',
            fontFamily: 'inherit',
            resize: 'vertical'
          }}
        />
      </div>
    );
  };

  const renderSectionContent = () => {
    switch (section.type) {
      case 'rated-comment': return renderRatedComment();
      case 'assessment-comment': return renderAssessmentComment();
      case 'personalised-comment': return renderPersonalisedComment();
      case 'next-steps': return renderNextSteps();
      case 'standard-comment': return renderStandardComment();
      case 'optional-additional-comment': return renderOptionalComment();
      case 'new-line': return (
        <div style={{
          padding: '8px',
          textAlign: 'center',
          fontSize: '12px',
          color: '#6b7280',
          fontStyle: 'italic'
        }}>
          ↵ Line Break
        </div>
      );
      default: return <div style={{ color: '#6b7280' }}>Unknown section type</div>;
    }
  };

  if (section.type === 'new-line') {
    return (
      <div style={{
        margin: '8px 0',
        padding: '12px',
        backgroundColor: '#f8fafc',
        borderRadius: '8px',
        border: '1px solid #e2e8f0',
        textAlign: 'center'
      }}>
        {renderSectionContent()}
      </div>
    );
  }

  return (
    <div style={{
      backgroundColor: colors.bg,
      border: `1px solid ${colors.border}`,
      borderRadius: '8px',
      padding: '12px',
      marginBottom: '8px'
    }}>
      {/* Section Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        marginBottom: '8px'
      }}>
        <h3 style={{
          fontSize: '14px',
          fontWeight: '600',
          color: colors.text,
          margin: 0,
          flex: 1
        }}>
          {section.name}
        </h3>
        
        {/* Header toggle - simplified for mobile */}
        <label style={{
          display: 'flex',
          alignItems: 'center',
          fontSize: '10px',
          color: colors.text,
          cursor: 'pointer'
        }}>
          <input
            type="checkbox"
            checked={data.showHeader !== false}
            onChange={(e) => updateSectionData(section.id, { showHeader: e.target.checked })}
            style={{ marginRight: '3px', transform: 'scale(0.7)' }}
          />
          Header
        </label>
      </div>

      {/* Section Content */}
      {renderSectionContent()}
    </div>
  );
};

export default MobileSectionCard;