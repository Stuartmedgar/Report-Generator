import React, { useState, useEffect } from 'react';

interface AssessmentCommentSectionProps {
  section: any;
  data: any;
  updateSectionData: (sectionId: string, data: any) => void;
  onTemplateAction?: (action: any) => void;
}

// Find all [Score N] placeholders in a comment string
function getScorePlaceholders(comment: string): string[] {
  const found: string[] = [];
  const seen = new Set<string>();
  // Numbered: [Score 1], [Score 2] etc
  const numbered = /\[Score (\d+)\]/gi;
  let match;
  while ((match = numbered.exec(comment)) !== null) {
    const key = `Score ${match[1]}`;
    if (!seen.has(key)) { seen.add(key); found.push(key); }
  }
  // Legacy single [Score] — only if no numbered ones found
  if (found.length === 0 && /\[Score\]/i.test(comment)) {
    found.push('Score');
  }
  return found;
}

const AssessmentCommentSection: React.FC<AssessmentCommentSectionProps> = ({
  section,
  data,
  updateSectionData,
  onTemplateAction,
}) => {
  const [showEditComment, setShowEditComment] = useState(false);
  const [editableComment, setEditableComment] = useState('');
  const [showAddToNewModal, setShowAddToNewModal] = useState(false);
  const [addToNewButtonName, setAddToNewButtonName] = useState('');

  useEffect(() => {
    if (data.selectedComment) {
      setEditableComment(data.customEditedComment || data.selectedComment);
    }
  }, [data.selectedComment, data.customEditedComment]);

  const handlePerformanceChange = (performance: string) => {
    if (performance !== data.performance && data.customEditedComment && data.customEditedComment !== data.selectedComment) {
      if (!window.confirm('Changing the performance level will replace your custom edits. Continue?')) return;
    }
    updateSectionData(section.id, { performance, customEditedComment: undefined });
    setShowEditComment(false);
  };

  const handleSaveEditedComment = () => { updateSectionData(section.id, { customEditedComment: editableComment }); setShowEditComment(false); };
  const handleCancelEditComment = () => { setEditableComment(data.selectedComment || ''); setShowEditComment(false); };

  const handleScoreTypeChange = (scoreType: 'outOf' | 'percentage') => {
    updateSectionData(section.id, {
      scoreType, score: undefined,
      maxScore: scoreType === 'outOf' ? (data.maxScore || section.data?.maxScore || 100) : undefined
    });
  };

  const handleScoreChange = (score: number) => updateSectionData(section.id, { score });
  const handleMaxScoreChange = (maxScore: number) => updateSectionData(section.id, { maxScore });

  // Item 5: handle individual score value changes for [Score N] placeholders
  const handleScoreValueChange = (key: string, value: string) => {
    const scoreValues = { ...(data.scoreValues || {}) };
    scoreValues[key] = value;
    updateSectionData(section.id, { scoreValues });
  };

  // Template actions
  const handleReplaceInTemplate = () => {
    if (!onTemplateAction || !data.performance) return;
    onTemplateAction({ type: 'replace', sectionId: section.id, commentText: editableComment, buttonName: data.performance });
    updateSectionData(section.id, { customEditedComment: editableComment });
    setShowEditComment(false);
  };

  const handleAddToButton = () => {
    if (!onTemplateAction || !data.performance) return;
    onTemplateAction({ type: 'add-to-button', sectionId: section.id, commentText: editableComment, buttonName: data.performance });
    updateSectionData(section.id, { customEditedComment: editableComment });
    setShowEditComment(false);
  };

  const handleConfirmAddToNewButton = () => {
    if (!onTemplateAction || !addToNewButtonName.trim()) return;
    onTemplateAction({ type: 'add-to-new-button', sectionId: section.id, commentText: editableComment, newButtonName: addToNewButtonName.trim() });
    updateSectionData(section.id, { customEditedComment: editableComment });
    setShowAddToNewModal(false);
    setAddToNewButtonName('');
    setShowEditComment(false);
  };

  const performances = [
    { value: 'excellent', label: 'Excellent', color: '#10b981' },
    { value: 'good', label: 'Good', color: '#3b82f6' },
    { value: 'satisfactory', label: 'Satisfactory', color: '#f59e0b' },
    { value: 'needsImprovement', label: 'Needs Improvement', color: '#ef4444' },
    { value: 'notCompleted', label: 'Not Completed', color: '#6b7280' }
  ];

  const hasSelectedComment = data.selectedComment && data.performance && data.performance !== 'no-comment';
  const currentScoreType = data.scoreType || section.data?.scoreType || 'outOf';
  const currentMaxScore = data.maxScore || section.data?.maxScore || 100;

  // Work out which score placeholders the current comment needs
  const currentComment = data.customEditedComment || data.selectedComment || '';
  const scorePlaceholders = hasSelectedComment ? getScorePlaceholders(currentComment) : [];
  const hasNumberedScores = scorePlaceholders.some(p => p !== 'Score');

  const actionBtnStyle = (color: string): React.CSSProperties => ({
    backgroundColor: color, color: 'white', border: 'none', borderRadius: '4px',
    padding: '4px 8px', fontSize: '11px', cursor: 'pointer', fontWeight: '500', whiteSpace: 'nowrap',
  });

  return (
    <div style={{ border: '2px solid #8b5cf6', borderRadius: '8px', padding: '16px', marginBottom: '16px', backgroundColor: '#f3e8ff' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#7c3aed', margin: 0 }}>
          {section.name || 'Assessment Comment'}
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <input type="checkbox" checked={data.showHeader !== false}
              onChange={(e) => updateSectionData(section.id, { showHeader: e.target.checked })}
              style={{ width: '14px', height: '14px', cursor: 'pointer' }} />
            <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>Header</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <input type="checkbox" checked={data.exclude || false}
              onChange={(e) => updateSectionData(section.id, { exclude: e.target.checked })}
              style={{ width: '14px', height: '14px', cursor: 'pointer' }} />
            <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>Exclude</span>
          </div>
        </div>
      </div>

      {/* Score inputs — item 5: show per-placeholder inputs if [Score N] detected, else legacy single score */}
      {hasSelectedComment && hasNumberedScores ? (
        // Multiple score inputs for [Score 1], [Score 2] etc
        <div style={{ marginBottom: '12px' }}>
          <div style={{ fontSize: '12px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
            Score values:
          </div>
          {scorePlaceholders.map(key => (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <label style={{ fontSize: '12px', color: '#374151', minWidth: '60px' }}>[{key}]:</label>
              <input
                type="text"
                value={(data.scoreValues || {})[key] || ''}
                onChange={e => handleScoreValueChange(key, e.target.value)}
                placeholder="e.g. 15 out of 20 or 75%"
                style={{ flex: 1, padding: '4px 8px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '12px', outline: 'none' }}
              />
            </div>
          ))}
          <div style={{ fontSize: '11px', color: '#6b7280', fontStyle: 'italic' }}>
            Use [Score 1], [Score 2] etc in your comment template to support multiple scores.
          </div>
        </div>
      ) : (
        // Legacy single score type + input
        <>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ fontSize: '12px', fontWeight: '500', color: '#374151', marginBottom: '6px', display: 'block' }}>Score Type:</label>
            <div style={{ display: 'flex', gap: '12px', marginBottom: '8px' }}>
              {[{ value: 'outOf', label: 'Out of (e.g. 15 out of 20)' }, { value: 'percentage', label: 'Percentage (e.g. 75%)' }].map(opt => (
                <label key={opt.value} style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '12px', color: '#374151' }}>
                  <input type="radio" name={`scoreType-${section.id}`} value={opt.value}
                    checked={currentScoreType === opt.value}
                    onChange={() => handleScoreTypeChange(opt.value as 'outOf' | 'percentage')}
                    style={{ transform: 'scale(0.9)' }} />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <label style={{ fontSize: '12px', fontWeight: '500', color: '#374151' }}>Score:</label>
            <input type="number" value={data.score || ''}
              onChange={(e) => handleScoreChange(parseFloat(e.target.value) || 0)}
              placeholder={currentScoreType === 'outOf' ? 'e.g. 15' : 'e.g. 75'}
              style={{ width: '60px', padding: '4px 6px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '12px', outline: 'none' }}
              min="0" max={currentScoreType === 'percentage' ? 100 : currentMaxScore} />
            {currentScoreType === 'outOf' && (
              <>
                <span style={{ fontSize: '12px', color: '#6b7280' }}>out of</span>
                <input type="number" value={currentMaxScore}
                  onChange={(e) => handleMaxScoreChange(parseFloat(e.target.value) || 100)}
                  style={{ width: '60px', padding: '4px 6px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '12px', outline: 'none' }}
                  min="1" />
              </>
            )}
            {currentScoreType === 'percentage' && <span style={{ fontSize: '12px', color: '#6b7280' }}>%</span>}
          </div>
        </>
      )}

      {/* Performance Buttons */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
        {performances.map((p) => (
          <button key={p.value} onClick={() => handlePerformanceChange(p.value)}
            style={{
              backgroundColor: data.performance === p.value ? p.color : 'white',
              color: data.performance === p.value ? 'white' : p.color,
              border: `2px solid ${p.color}`, borderRadius: '6px', padding: '6px 12px',
              fontSize: '12px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap'
            }}>
            {p.label}
          </button>
        ))}
      </div>

      {/* Edit toggle */}
      {hasSelectedComment && (
        <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: showEditComment ? '12px' : '0' }}>
          <button onClick={() => setShowEditComment(!showEditComment)}
            style={{ backgroundColor: showEditComment ? '#8b5cf6' : '#e5e7eb', color: showEditComment ? 'white' : '#6b7280', border: 'none', borderRadius: '4px', padding: '4px 8px', fontSize: '12px', cursor: 'pointer', fontWeight: '500' }}>
            {showEditComment ? '- Edit Comment' : '+ Edit Comment'}
          </button>
        </div>
      )}

      {/* Edit panel */}
      {showEditComment && hasSelectedComment && (
        <div style={{ backgroundColor: 'white', border: '1px solid #d1d5db', borderRadius: '6px', padding: '8px', marginBottom: '12px' }}>
          <textarea value={editableComment} onChange={(e) => setEditableComment(e.target.value)}
            placeholder="Edit the comment to better suit this student..."
            style={{ width: '100%', minHeight: '50px', padding: '6px', border: 'none', borderRadius: '4px', resize: 'vertical', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
          <div style={{ fontSize: '11px', color: '#6b7280', fontStyle: 'italic', marginTop: '4px', marginBottom: '4px' }}>
            Use [Score] for a single score, or [Score 1] [Score 2] for multiple scores.
          </div>
          <div style={{ marginBottom: '8px' }} />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            <button onClick={handleCancelEditComment} style={actionBtnStyle('#6b7280')}>Cancel</button>
            <button onClick={handleSaveEditedComment} style={actionBtnStyle('#10b981')}>Save</button>
            {onTemplateAction && (
              <>
                <button onClick={handleReplaceInTemplate} style={actionBtnStyle('#8b5cf6')}>Replace in template</button>
                <button onClick={handleAddToButton} style={actionBtnStyle('#6366f1')}>Add to button</button>
                <button onClick={() => setShowAddToNewModal(true)} style={actionBtnStyle('#f59e0b')}>Add to new button</button>
              </>
            )}
          </div>
          {showAddToNewModal && (
            <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#f9fafb', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
              <div style={{ fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>New button name:</div>
              <input type="text" value={addToNewButtonName} onChange={e => setAddToNewButtonName(e.target.value)}
                placeholder="e.g. Outstanding..."
                style={{ width: '100%', padding: '6px 8px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '13px', boxSizing: 'border-box', marginBottom: '8px' }} />
              <div style={{ display: 'flex', gap: '6px' }}>
                <button onClick={() => setShowAddToNewModal(false)} style={actionBtnStyle('#6b7280')}>Cancel</button>
                <button onClick={handleConfirmAddToNewButton} disabled={!addToNewButtonName.trim()}
                  style={{ ...actionBtnStyle('#f59e0b'), opacity: !addToNewButtonName.trim() ? 0.4 : 1 }}>Confirm</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AssessmentCommentSection;