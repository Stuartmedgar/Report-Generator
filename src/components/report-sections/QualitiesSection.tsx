import React, { useState, useEffect } from 'react';

interface QualitiesSectionProps {
  section: any;
  data: any;
  updateSectionData: (sectionId: string, data: any) => void;
  onTemplateAction?: (action: any) => void;
  onAddButton?: (sectionId: string, buttonName: string, firstOption: string) => void;
  onDuplicateSection?: (sectionId: string) => void;
}

const QualitiesSection: React.FC<QualitiesSectionProps> = ({
  section,
  data,
  updateSectionData,
  onTemplateAction,
  onAddButton,
  onDuplicateSection,
}) => {
  const [showEditQuality, setShowEditQuality] = useState(false);
  const [editableQuality, setEditableQuality] = useState('');

  // New button modal state
  const [showNewButtonModal, setShowNewButtonModal] = useState(false);
  const [newButtonName, setNewButtonName] = useState('');
  const [newButtonFirstOption, setNewButtonFirstOption] = useState('');

  // Add to new button modal (from edit panel)
  const [showAddToNewModal, setShowAddToNewModal] = useState(false);
  const [addToNewButtonName, setAddToNewButtonName] = useState('');

  useEffect(() => {
    if (data.selectedQuality) {
      setEditableQuality(data.customEditedQuality || data.selectedQuality);
    }
  }, [data.selectedQuality, data.customEditedQuality]);

  const handleQualityAreaChange = (qualityArea: string) => {
    if (qualityArea !== data.qualityArea && data.customEditedQuality && data.customEditedQuality !== data.selectedQuality) {
      const shouldContinue = window.confirm(
        'Changing the quality area will replace your custom edits. Continue?'
      );
      if (!shouldContinue) return;
    }
    updateSectionData(section.id, {
      qualityArea,
      customEditedQuality: undefined
    });
    setShowEditQuality(false);
  };

  const handleSaveEditedQuality = () => {
    updateSectionData(section.id, { customEditedQuality: editableQuality });
    setShowEditQuality(false);
  };

  const handleCancelEditQuality = () => {
    setEditableQuality(data.selectedQuality || '');
    setShowEditQuality(false);
  };

  // ─── TEMPLATE ACTIONS ─────────────────────────────────────────────────────

  const handleReplaceInTemplate = () => {
    if (!onTemplateAction || !data.qualityArea) return;
    onTemplateAction({
      type: 'replace',
      sectionId: section.id,
      commentText: editableQuality,
      buttonName: data.qualityArea,
    });
    updateSectionData(section.id, { customEditedQuality: editableQuality });
    setShowEditQuality(false);
  };

  const handleAddToButton = () => {
    if (!onTemplateAction || !data.qualityArea) return;
    onTemplateAction({
      type: 'add-to-button',
      sectionId: section.id,
      commentText: editableQuality,
      buttonName: data.qualityArea,
    });
    updateSectionData(section.id, { customEditedQuality: editableQuality });
    setShowEditQuality(false);
  };

  const handleConfirmAddToNewButton = () => {
    if (!onTemplateAction || !addToNewButtonName.trim()) return;
    onTemplateAction({
      type: 'add-to-new-button',
      sectionId: section.id,
      commentText: editableQuality,
      newButtonName: addToNewButtonName.trim(),
    });
    updateSectionData(section.id, { customEditedQuality: editableQuality });
    setShowAddToNewModal(false);
    setAddToNewButtonName('');
    setShowEditQuality(false);
  };

  const handleConfirmNewButton = () => {
    if (!onAddButton || !newButtonName.trim() || !newButtonFirstOption.trim()) return;
    onAddButton(section.id, newButtonName.trim(), newButtonFirstOption.trim());
    setNewButtonName('');
    setNewButtonFirstOption('');
    setShowNewButtonModal(false);
  };

  const qualityAreas = section.data?.headings || Object.keys(section.data?.comments || {});
  const hasSelectedQuality = data.selectedQuality && data.qualityArea;

  const actionBtnStyle = (color: string): React.CSSProperties => ({
    backgroundColor: color,
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    padding: '4px 8px',
    fontSize: '11px',
    cursor: 'pointer',
    fontWeight: '500',
    whiteSpace: 'nowrap',
  });

  return (
    <div style={{
      border: '2px solid #8b5cf6',
      borderRadius: '8px',
      padding: '16px',
      marginBottom: '16px',
      backgroundColor: '#f3e8ff'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#7c3aed', margin: 0 }}>
          {section.name || 'Qualities'}
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Duplicate button */}
          {onDuplicateSection && (
            <button
              onClick={() => onDuplicateSection(section.id)}
              title="Duplicate this section"
              style={{
                backgroundColor: '#e5e7eb',
                color: '#374151',
                border: 'none',
                borderRadius: '4px',
                padding: '3px 8px',
                fontSize: '11px',
                cursor: 'pointer',
                fontWeight: '500',
              }}
            >
              ⧉ Duplicate
            </button>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <input
              type="checkbox"
              checked={data.showHeader !== false}
              onChange={(e) => updateSectionData(section.id, { showHeader: e.target.checked })}
              style={{ width: '14px', height: '14px', cursor: 'pointer' }}
            />
            <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>Header</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <input
              type="checkbox"
              checked={data.exclude || false}
              onChange={(e) => updateSectionData(section.id, { exclude: e.target.checked })}
              style={{ width: '14px', height: '14px', cursor: 'pointer' }}
            />
            <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>Exclude</span>
          </div>
        </div>
      </div>

      {/* Pronoun selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
        <span style={{ fontSize: '11px', color: '#6b7280', fontWeight: '500' }}>Use:</span>
        {[{ value: '', label: 'Name' }, { value: 'he', label: 'He' }, { value: 'she', label: 'She' }, { value: 'they', label: 'They' }].map(opt => (
          <button
            key={opt.value}
            onClick={() => updateSectionData(section.id, { pronounOverride: opt.value })}
            style={{
              padding: '2px 8px',
              border: '1px solid #8b5cf6',
              borderRadius: '4px',
              fontSize: '11px',
              fontWeight: '600',
              cursor: 'pointer',
              backgroundColor: (data.pronounOverride || '') === opt.value ? '#8b5cf6' : 'white',
              color: (data.pronounOverride || '') === opt.value ? 'white' : '#8b5cf6',
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Quality buttons + add new button */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px', alignItems: 'center' }}>
        {qualityAreas.map((area: string) => (
          <button
            key={area}
            onClick={() => handleQualityAreaChange(area)}
            style={{
              backgroundColor: data.qualityArea === area ? '#8b5cf6' : 'white',
              color: data.qualityArea === area ? 'white' : '#8b5cf6',
              border: '2px solid #8b5cf6',
              borderRadius: '6px',
              padding: '6px 12px',
              fontSize: '12px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap'
            }}
          >
            {area}
          </button>
        ))}
        {/* + New button */}
        {onAddButton && (
          <button
            onClick={() => setShowNewButtonModal(true)}
            title="Add a new button to this section"
            style={{
              backgroundColor: 'white',
              color: '#8b5cf6',
              border: '2px dashed #8b5cf6',
              borderRadius: '6px',
              padding: '6px 10px',
              fontSize: '14px',
              fontWeight: '700',
              cursor: 'pointer',
              lineHeight: 1,
            }}
          >
            +
          </button>
        )}
      </div>

      {/* New button modal */}
      {showNewButtonModal && (
        <div style={{
          backgroundColor: 'white',
          border: '1px solid #d1d5db',
          borderRadius: '8px',
          padding: '12px',
          marginBottom: '12px',
        }}>
          <div style={{ fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
            Add new button
          </div>
          <input
            type="text"
            value={newButtonName}
            onChange={e => setNewButtonName(e.target.value)}
            placeholder="Button name (e.g. Leadership)..."
            style={{ width: '100%', padding: '6px 8px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '13px', marginBottom: '8px', boxSizing: 'border-box' }}
          />
          <textarea
            value={newButtonFirstOption}
            onChange={e => setNewButtonFirstOption(e.target.value)}
            placeholder="First comment option for this button... Use [Name] for pupil name."
            style={{ width: '100%', padding: '6px 8px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '13px', minHeight: '60px', resize: 'vertical', boxSizing: 'border-box', marginBottom: '8px' }}
          />
          <div style={{ display: 'flex', gap: '6px' }}>
            <button onClick={() => setShowNewButtonModal(false)} style={actionBtnStyle('#6b7280')}>Cancel</button>
            <button
              onClick={handleConfirmNewButton}
              disabled={!newButtonName.trim() || !newButtonFirstOption.trim()}
              style={{ ...actionBtnStyle('#8b5cf6'), opacity: (!newButtonName.trim() || !newButtonFirstOption.trim()) ? 0.4 : 1 }}
            >
              Add Button
            </button>
          </div>
        </div>
      )}

      {/* Edit toggle */}
      {hasSelectedQuality && (
        <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: showEditQuality ? '12px' : '0' }}>
          <button
            onClick={() => setShowEditQuality(!showEditQuality)}
            style={{
              backgroundColor: showEditQuality ? '#8b5cf6' : '#e5e7eb',
              color: showEditQuality ? 'white' : '#6b7280',
              border: 'none', borderRadius: '4px', padding: '4px 8px',
              fontSize: '12px', cursor: 'pointer', fontWeight: '500'
            }}
          >
            {showEditQuality ? '- Edit Quality' : '+ Edit Quality'}
          </button>
        </div>
      )}

      {/* Edit panel */}
      {showEditQuality && hasSelectedQuality && (
        <div style={{ backgroundColor: 'white', border: '1px solid #d1d5db', borderRadius: '6px', padding: '8px', marginBottom: '12px' }}>
          <textarea
            value={editableQuality}
            onChange={(e) => setEditableQuality(e.target.value)}
            placeholder="Edit the quality statement to better suit this student..."
            style={{ width: '100%', minHeight: '50px', padding: '6px', border: 'none', borderRadius: '4px', resize: 'vertical', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
          />
          <div style={{ fontSize: '11px', color: '#6b7280', fontStyle: 'italic', marginTop: '4px', marginBottom: '8px' }}>
            Edit the generated quality or add additional notes
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            <button onClick={handleCancelEditQuality} style={actionBtnStyle('#6b7280')}>Cancel</button>
            <button onClick={handleSaveEditedQuality} style={actionBtnStyle('#10b981')}>Save</button>
            {onTemplateAction && (
              <>
                <button onClick={handleReplaceInTemplate} style={actionBtnStyle('#8b5cf6')}>Replace in template</button>
                <button onClick={handleAddToButton} style={actionBtnStyle('#6366f1')}>Add to button</button>
                <button onClick={() => setShowAddToNewModal(true)} style={actionBtnStyle('#f59e0b')}>Add to new button</button>
              </>
            )}
          </div>

          {/* Add to new button sub-modal */}
          {showAddToNewModal && (
            <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#f9fafb', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
              <div style={{ fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
                New button name:
              </div>
              <input
                type="text"
                value={addToNewButtonName}
                onChange={e => setAddToNewButtonName(e.target.value)}
                placeholder="e.g. Resilience..."
                style={{ width: '100%', padding: '6px 8px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '13px', boxSizing: 'border-box', marginBottom: '8px' }}
              />
              <div style={{ display: 'flex', gap: '6px' }}>
                <button onClick={() => setShowAddToNewModal(false)} style={actionBtnStyle('#6b7280')}>Cancel</button>
                <button
                  onClick={handleConfirmAddToNewButton}
                  disabled={!addToNewButtonName.trim()}
                  style={{ ...actionBtnStyle('#f59e0b'), opacity: !addToNewButtonName.trim() ? 0.4 : 1 }}
                >
                  Confirm
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default QualitiesSection;