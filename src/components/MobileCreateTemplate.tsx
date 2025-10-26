import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { TemplateSection } from '../types';
import SectionSelector from '../components/SectionSelector';
import RatedCommentBuilder from '../components/RatedCommentBuilder';
import AssessmentCommentBuilder from '../components/AssessmentCommentBuilder';
import PersonalisedCommentBuilder from '../components/PersonalisedCommentBuilder';
import NextStepsCommentBuilder from '../components/NextStepsCommentBuilder';
import StandardCommentBuilder from '../components/StandardCommentBuilder';
import StandardCommentSelector from '../components/StandardCommentSelector';

const MobileCreateTemplate: React.FC = () => {
  const { state, addTemplate, updateTemplate } = useData();
  const navigate = useNavigate();
  const location = useLocation();
  const editTemplate = location.state?.editTemplate;
  const isEditing = !!editTemplate;

  // Basic template state
  const [templateName, setTemplateName] = useState(editTemplate?.name || '');
  const [sections, setSections] = useState<TemplateSection[]>(editTemplate?.sections || []);
  const [sectionData, setSectionData] = useState<Record<string, any>>(editTemplate?.sectionData || {});

  // Naming step state
  const [isNamingStep, setIsNamingStep] = useState(!isEditing && !templateName.trim());

  // Section builder states
  const [showSectionSelector, setShowSectionSelector] = useState(false);
  const [showRatedCommentBuilder, setShowRatedCommentBuilder] = useState(false);
  const [showAssessmentCommentBuilder, setShowAssessmentCommentBuilder] = useState(false);
  const [showPersonalisedCommentBuilder, setShowPersonalisedCommentBuilder] = useState(false);
  const [showNextStepsCommentBuilder, setShowNextStepsCommentBuilder] = useState(false);
  const [showStandardCommentSelector, setShowStandardCommentSelector] = useState(false);
  const [showStandardCommentBuilder, setShowStandardCommentBuilder] = useState(false);

  // Editing state
  const [editingSection, setEditingSection] = useState<{section: TemplateSection, index: number} | null>(null);

  // Handle naming step
  const handleContinueFromNaming = () => {
    if (templateName.trim()) {
      setIsNamingStep(false);
    }
  };

  const handleNamingKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleContinueFromNaming();
    }
  };

  // Check if a section type is editable
  const isSectionEditable = (type: string) => {
    return ['rated-comment', 'assessment-comment', 'personalised-comment', 'next-steps', 'standard-comment'].includes(type);
  };

  // Handle section editing
  const handleEditSection = (section: TemplateSection, index: number) => {
    setEditingSection({ section, index });

    switch (section.type) {
      case 'rated-comment':
        setShowRatedCommentBuilder(true);
        break;
      case 'assessment-comment':
        setShowAssessmentCommentBuilder(true);
        break;
      case 'personalised-comment':
        setShowPersonalisedCommentBuilder(true);
        break;
      case 'next-steps':
        setShowNextStepsCommentBuilder(true);
        break;
      case 'standard-comment':
        setShowStandardCommentBuilder(true);
        break;
      default:
        alert(`Editing for ${section.type} sections is not yet implemented.`);
    }
  };

  // Handle adding new sections
  const handleAddSection = (sectionType: string, sectionDataInput: any) => {
    const newSection: TemplateSection = {
      id: `section-${Date.now()}`,
      type: sectionType as any,
      name: sectionDataInput.name || `New ${sectionType.replace('-', ' ')}`,
      data: sectionDataInput
    };

    setSections(prev => [...prev, newSection]);
    setShowSectionSelector(false);
  };

  // Handle saving edited sections
  const handleSaveEditedSection = (updatedData: any) => {
    if (!editingSection) return;

    const updatedSections = [...sections];
    
    // Check if updatedData has a 'data' property (for standard comments)
    // or if it's the data itself (for builders)
    const newData = updatedData.data !== undefined ? updatedData.data : updatedData;
    
    updatedSections[editingSection.index] = {
      ...editingSection.section,
      name: updatedData.name || editingSection.section.name,
      data: newData
    };

    setSections(updatedSections);
    handleCancelEdit();
  };

  // Handle standard comment selection (when adding new section from selector)
  const handleSelectStandardComment = (comment: any) => {
    handleAddSection('standard-comment', {
      name: comment.name,
      content: comment.comment
    });
    setShowStandardCommentSelector(false);
  };

  // Handle deleting sections
  const handleDeleteSection = (index: number) => {
    if (window.confirm('Are you sure you want to delete this section?')) {
      const newSections = sections.filter((_, i) => i !== index);
      setSections(newSections);
    }
  };

  // Handle canceling edits
  const handleCancelEdit = () => {
    setEditingSection(null);
    setShowRatedCommentBuilder(false);
    setShowAssessmentCommentBuilder(false);
    setShowPersonalisedCommentBuilder(false);
    setShowNextStepsCommentBuilder(false);
    setShowStandardCommentSelector(false);
    setShowStandardCommentBuilder(false);
  };

  // Handle saving template
  const handleSaveTemplate = () => {
    if (!templateName.trim()) {
      alert('Please enter a template name');
      return;
    }

    const templateData = {
      id: editTemplate?.id || Date.now().toString(),
      name: templateName,
      sections,
      sectionData,
      createdAt: editTemplate?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (isEditing) {
      updateTemplate(templateData);
      alert('Template updated successfully!');
    } else {
      addTemplate(templateData);
      alert('Template saved successfully!');
    }

    navigate('/manage-templates');
  };

  // Move section up or down
  const handleMoveSection = (index: number, direction: 'up' | 'down') => {
    const newSections = [...sections];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    if (targetIndex >= 0 && targetIndex < newSections.length) {
      [newSections[index], newSections[targetIndex]] = [newSections[targetIndex], newSections[index]];
      setSections(newSections);
    }
  };

  // Helper functions
  const getSectionColor = (type: string): string => {
    const colorMap: Record<string, string> = {
      'rated-comment': '#3b82f6',
      'standard-comment': '#10b981',
      'assessment-comment': '#8b5cf6',
      'personalised-comment': '#f59e0b',
      'optional-additional-comment': '#ef4444',
      'next-steps': '#06b6d4',
      'new-line': '#6b7280'
    };
    return colorMap[type] || '#6b7280';
  };

  const getSectionDisplayName = (type: string): string => {
    const nameMap: Record<string, string> = {
      'rated-comment': 'Rated Comment',
      'standard-comment': 'Standard Comment',
      'assessment-comment': 'Assessment Comment',
      'personalised-comment': 'Personalised Comment',
      'optional-additional-comment': 'Optional Comment',
      'next-steps': 'Next Steps',
      'new-line': 'New Line'
    };
    return nameMap[type] || type;
  };

  const getSectionPreview = (section: TemplateSection): string => {
    switch (section.type) {
      case 'rated-comment':
        return 'Teachers can select from Excellent, Good, Satisfactory, or Needs Improvement';
      case 'standard-comment':
        const content = section.data?.content || '';
        return content.substring(0, 60) + (content.length > 60 ? '...' : '');
      case 'assessment-comment':
        return `Score-based comments (${section.data?.scoreType || 'score'})`;
      case 'personalised-comment':
        return section.data?.instruction || 'AI-generated personalised comment';
      case 'next-steps':
        const areas = section.data?.headings || [];
        return `Focus areas: ${areas.join(', ')}`;
      case 'optional-additional-comment':
        return 'Optional field for additional comments';
      case 'new-line':
        return 'Adds a blank line in the report';
      default:
        return '';
    }
  };

  // Naming step screen
  if (isNamingStep) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        backgroundColor: '#f9fafb', 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '20px' 
      }}>
        <div style={{ 
          backgroundColor: 'white', 
          borderRadius: '12px', 
          padding: '24px', 
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)' 
        }}>
          <h1 style={{ 
            fontSize: '24px', 
            fontWeight: '600', 
            color: '#111827', 
            marginBottom: '8px', 
            textAlign: 'center' 
          }}>
            Create New Template
          </h1>
          <p style={{ 
            fontSize: '14px', 
            color: '#6b7280', 
            marginBottom: '24px', 
            textAlign: 'center' 
          }}>
            Let's start by giving your template a name
          </p>
          
          <div style={{ marginBottom: '20px' }}>
            <label style={{ 
              display: 'block', 
              fontSize: '14px', 
              fontWeight: '500', 
              color: '#374151', 
              marginBottom: '6px' 
            }}>
              Template Name
            </label>
            <input
              type="text"
              placeholder="e.g., Year 3 End of Term Report"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              onKeyPress={handleNamingKeyPress}
              autoFocus
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', flexDirection: 'column' }}>
            <button
              onClick={handleContinueFromNaming}
              disabled={!templateName.trim()}
              style={{
                width: '100%',
                backgroundColor: templateName.trim() ? '#3b82f6' : '#d1d5db',
                color: 'white',
                padding: '10px 20px',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: templateName.trim() ? 'pointer' : 'not-allowed'
              }}
            >
              Continue
            </button>
            
            <Link to="/manage-templates" style={{ textDecoration: 'none' }}>
              <button style={{
                width: '100%',
                backgroundColor: '#f3f4f6',
                color: '#374151',
                padding: '10px 20px',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer'
              }}>
                Cancel
              </button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Main template builder screen
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      {/* Header */}
      <header style={{ 
        backgroundColor: 'white', 
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        padding: '16px',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{ textAlign: 'center', marginBottom: '12px' }}>
          <h1 style={{ fontSize: '20px', fontWeight: '600', color: '#111827', margin: '0 0 4px 0' }}>
            {isEditing ? 'Edit Template' : 'Create Template'}
          </h1>
          <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>
            {templateName || 'Untitled Template'}
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '8px' }}>
          <Link to="/manage-templates" style={{ flex: 1, textDecoration: 'none' }}>
            <button style={{
              width: '100%',
              backgroundColor: '#f3f4f6',
              color: '#374151',
              padding: '8px 16px',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer'
            }}>
              Cancel
            </button>
          </Link>
          <button
            onClick={handleSaveTemplate}
            style={{
              flex: 1,
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
            {isEditing ? 'Update' : 'Save'}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ padding: '16px' }}>
        {/* Template Name Editor */}
        <div style={{ 
          backgroundColor: 'white', 
          padding: '16px', 
          borderRadius: '8px', 
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
          marginBottom: '16px'
        }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
            Template Name
          </label>
          <input
            type="text"
            placeholder="Enter template name..."
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              boxSizing: 'border-box'
            }}
          />
        </div>

        {/* Sections List */}
        <div style={{ 
          backgroundColor: 'white', 
          padding: '16px', 
          borderRadius: '8px', 
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
          marginBottom: '16px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', margin: 0 }}>
              Sections ({sections.length})
            </h2>
            <button
              onClick={() => setShowSectionSelector(true)}
              style={{
                backgroundColor: '#3b82f6',
                color: 'white',
                padding: '8px 16px',
                border: 'none',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              + Add
            </button>
          </div>

          {sections.length === 0 ? (
            <div style={{
              border: '2px dashed #d1d5db',
              borderRadius: '8px',
              padding: '32px 16px',
              textAlign: 'center',
              color: '#9ca3af'
            }}>
              <p style={{ margin: 0, fontSize: '14px' }}>No sections yet. Tap "Add" to get started.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {sections.map((section, index) => (
                <div key={section.id} style={{
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  padding: '12px',
                  backgroundColor: '#fafafa'
                }}>
                  <div style={{ marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '2px 8px',
                        backgroundColor: getSectionColor(section.type),
                        color: 'white',
                        borderRadius: '4px',
                        fontSize: '10px',
                        fontWeight: '500'
                      }}>
                        {getSectionDisplayName(section.type)}
                      </span>
                      <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#111827', margin: 0, flex: 1 }}>
                        {section.name || 'Untitled'}
                      </h3>
                    </div>
                    <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>
                      {getSectionPreview(section)}
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {isSectionEditable(section.type) && (
                      <button
                        onClick={() => handleEditSection(section, index)}
                        style={{
                          backgroundColor: '#3b82f6',
                          color: 'white',
                          padding: '6px 12px',
                          border: 'none',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: '500',
                          cursor: 'pointer'
                        }}
                      >
                        Edit
                      </button>
                    )}
                    <button
                      onClick={() => handleMoveSection(index, 'up')}
                      disabled={index === 0}
                      style={{
                        backgroundColor: index === 0 ? '#f3f4f6' : 'white',
                        color: index === 0 ? '#9ca3af' : '#374151',
                        padding: '6px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: '500',
                        cursor: index === 0 ? 'not-allowed' : 'pointer'
                      }}
                    >
                      ↑
                    </button>
                    <button
                      onClick={() => handleMoveSection(index, 'down')}
                      disabled={index === sections.length - 1}
                      style={{
                        backgroundColor: index === sections.length - 1 ? '#f3f4f6' : 'white',
                        color: index === sections.length - 1 ? '#9ca3af' : '#374151',
                        padding: '6px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: '500',
                        cursor: index === sections.length - 1 ? 'not-allowed' : 'pointer'
                      }}
                    >
                      ↓
                    </button>
                    <button
                      onClick={() => handleDeleteSection(index)}
                      style={{
                        backgroundColor: '#ef4444',
                        color: 'white',
                        padding: '6px 12px',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '11px',
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

      {/* Section Selector Modal */}
      {showSectionSelector && (
        <SectionSelector 
          onSelectSection={handleAddSection}
          onBack={() => setShowSectionSelector(false)}
          isMobile={true}
        />
      )}

      {/* Rated Comment Builder Modal */}
      {showRatedCommentBuilder && editingSection && (
        <div style={{ width: '100%', maxWidth: '900px' }}>
          <RatedCommentBuilder
            existingComment={editingSection.section.data}
            onSave={handleSaveEditedSection}
            onCancel={handleCancelEdit}
          />
        </div>
      )}

      {/* Assessment Comment Builder Modal */}
      {showAssessmentCommentBuilder && editingSection && (
        <div style={{ width: '100%', maxWidth: '900px' }}>
          <AssessmentCommentBuilder
            existingComment={editingSection.section.data}
            onSave={handleSaveEditedSection}
            onCancel={handleCancelEdit}
          />
        </div>
      )}

      {/* Personalised Comment Builder Modal */}
      {showPersonalisedCommentBuilder && editingSection && (
        <div style={{ width: '100%', maxWidth: '900px' }}>
          <PersonalisedCommentBuilder
            existingComment={editingSection.section.data}
            onSave={handleSaveEditedSection}
            onCancel={handleCancelEdit}
          />
        </div>
      )}

      {/* Next Steps Comment Builder Modal */}
      {showNextStepsCommentBuilder && editingSection && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{ width: '100%', maxWidth: '900px' }}>
            <NextStepsCommentBuilder
              existingComment={editingSection.section.data}
              onSave={handleSaveEditedSection}
              onCancel={() => {
                setEditingSection(null);
                setShowNextStepsCommentBuilder(false);
              }}
            />
          </div>
        </div>
      )}

      {/* Standard Comment Builder Modal - For EDITING */}
      {showStandardCommentBuilder && editingSection && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{ width: '100%', maxWidth: '600px' }}>
            <StandardCommentBuilder
              existingComment={{
                name: editingSection.section.name,
                content: editingSection.section.data?.content
              }}
              onSave={handleSaveEditedSection}
              onCancel={handleCancelEdit}
            />
          </div>
        </div>
      )}

      {/* Standard Comment Selector Modal - For ADDING */}
      {showStandardCommentSelector && !editingSection && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 1000,
          overflow: 'auto',
          padding: '20px'
        }}>
          <div style={{
            minHeight: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <div style={{ width: '100%', maxWidth: '600px' }}>
              <StandardCommentSelector
                onSelectComment={handleSelectStandardComment}
                onBack={() => setShowStandardCommentSelector(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileCreateTemplate;