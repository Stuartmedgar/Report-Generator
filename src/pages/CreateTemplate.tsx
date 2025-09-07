import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { TemplateSection } from '../types';
import SectionSelector from '../components/SectionSelector';
import RatedCommentBuilder from '../components/RatedCommentBuilder';
import AssessmentCommentBuilder from '../components/AssessmentCommentBuilder';
import PersonalisedCommentBuilder from '../components/PersonalisedCommentBuilder';
import NextStepsCommentBuilder from '../components/NextStepsCommentBuilder';
import { TemplateValidationPanel } from '../components/CreateTemplate/TemplateValidationPanel';
import { TemplateHealthDashboard } from '../components/CreateTemplate/TemplateHealthDashboard';
import { validateTemplate } from '../utils/templateValidation';

const CreateTemplate: React.FC = () => {
  const { state, addTemplate, updateTemplate } = useData();
  const navigate = useNavigate();
  const location = useLocation();
  const editTemplate = location.state?.editTemplate;  // FIXED: was .template, should be .editTemplate
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
  const [showStandardCommentEditor, setShowStandardCommentEditor] = useState(false);

  // Editing state
  const [editingSection, setEditingSection] = useState<{section: TemplateSection, index: number} | null>(null);

  // Standard comment editor state
  const [standardCommentName, setStandardCommentName] = useState('');
  const [standardCommentContent, setStandardCommentContent] = useState('');

  // Debug state
  const [showDebug, setShowDebug] = useState(false);

  // Get validation errors - THIS IS THE KEY FIX
  const validationResult = validateTemplate(templateName, sections);
  const validationErrors = validationResult.errors;

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
    console.log('EDIT CLICKED:', section.type, section);
    
    setEditingSection({ section, index });

    // Handle different section types
    switch (section.type) {
      case 'rated-comment':
        console.log('Opening rated comment builder');
        setShowRatedCommentBuilder(true);
        break;
      case 'assessment-comment':
        console.log('Opening assessment comment builder');
        setShowAssessmentCommentBuilder(true);
        break;
      case 'personalised-comment':
        console.log('Opening personalised comment builder');
        setShowPersonalisedCommentBuilder(true);
        break;
      case 'next-steps':
        console.log('Opening next steps comment builder');
        setShowNextStepsCommentBuilder(true);
        break;
      case 'standard-comment':
        console.log('Opening standard comment editor');
        setStandardCommentName(section.name || '');
        setStandardCommentContent(section.data?.content || '');
        setShowStandardCommentEditor(true);
        break;
      default:
        console.log('Section type not editable:', section.type);
        alert(`Editing for ${section.type} sections is not yet implemented.`);
    }
  };

  // Handle adding new sections
  const handleAddSection = (sectionType: string, sectionDataInput?: any) => {
    const sectionId = Date.now().toString();
    let newSection: TemplateSection;

    if (sectionType === 'new-line') {
      newSection = {
        id: sectionId,
        type: 'new-line',
        name: '',
        data: {}
      };
    } else if (sectionDataInput) {
      newSection = {
        id: sectionId,
        type: sectionType as any,
        name: sectionDataInput.name || '',
        data: sectionDataInput.data || sectionDataInput
      };
    } else {
      newSection = {
        id: sectionId,
        type: sectionType as any,
        name: '',
        data: {}
      };
    }

    setSections(prev => [...prev, newSection]);
    setShowSectionSelector(false);
  };

  // Handle standard comment editor save
  const handleSaveStandardComment = () => {
    if (!editingSection) return;

    const updatedSection: TemplateSection = {
      ...editingSection.section,
      name: standardCommentName,
      data: {
        content: standardCommentContent
      }
    };

    const newSections = [...sections];
    newSections[editingSection.index] = updatedSection;
    setSections(newSections);

    // Close editor and clear editing state
    setShowStandardCommentEditor(false);
    setEditingSection(null);
    setStandardCommentName('');
    setStandardCommentContent('');
  };

  // Handle builder saves (for rated, assessment, personalised, next-steps)
  const handleBuilderSave = (updatedSectionData: any) => {
    if (!editingSection) return;

    const updatedSection: TemplateSection = {
      ...editingSection.section,
      name: updatedSectionData.name,
      data: updatedSectionData.data || updatedSectionData
    };

    const newSections = [...sections];
    newSections[editingSection.index] = updatedSection;
    setSections(newSections);

    setSectionData(prev => ({
      ...prev,
      [updatedSection.id]: updatedSectionData.data || updatedSectionData
    }));

    // Close all builders and clear editing state
    setEditingSection(null);
    setShowRatedCommentBuilder(false);
    setShowAssessmentCommentBuilder(false);
    setShowPersonalisedCommentBuilder(false);
    setShowNextStepsCommentBuilder(false);
  };

  // Handle canceling edits
  const handleCancelEdit = () => {
    setEditingSection(null);
    setShowRatedCommentBuilder(false);
    setShowAssessmentCommentBuilder(false);
    setShowPersonalisedCommentBuilder(false);
    setShowNextStepsCommentBuilder(false);
    setShowStandardCommentEditor(false);
    setStandardCommentName('');
    setStandardCommentContent('');
  };

  // Handle removing sections
  const handleRemoveSection = (index: number) => {
    const newSections = sections.filter((_, i) => i !== index);
    setSections(newSections);
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

  // Get section display name
  const getSectionDisplayName = (type: string): string => {
    const nameMap: Record<string, string> = {
      'rated-comment': 'Rated Comment',
      'standard-comment': 'Standard Comment',
      'assessment-comment': 'Assessment Comment',
      'personalised-comment': 'Personalised Comment',
      'next-steps': 'Next Steps',
      'new-line': 'New Line'
    };
    return nameMap[type] || type;
  };

  // Get section color
  const getSectionColor = (type: string): string => {
    const colorMap: Record<string, string> = {
      'rated-comment': '#3b82f6',
      'standard-comment': '#10b981',
      'assessment-comment': '#8b5cf6',
      'personalised-comment': '#f59e0b',
      'next-steps': '#06b6d4',
      'new-line': '#6b7280'
    };
    return colorMap[type] || '#6b7280';
  };

  // Show section selector
  if (showSectionSelector) {
    return (
      <SectionSelector
        onSelectSection={handleAddSection}
        onBack={() => setShowSectionSelector(false)}
      />
    );
  }

  // Show standard comment editor
  if (showStandardCommentEditor) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', padding: '24px' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '32px', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)' }}>
            <div style={{ marginBottom: '32px' }}>
              <h1 style={{ fontSize: '28px', fontWeight: '600', color: '#111827', margin: '0 0 8px 0' }}>
                Edit Standard Comment
              </h1>
              <p style={{ color: '#6b7280', margin: 0 }}>
                Update the section name and content
              </p>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                Section Name
              </label>
              <input
                type="text"
                value={standardCommentName}
                onChange={(e) => setStandardCommentName(e.target.value)}
                placeholder="Enter section name..."
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '16px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ marginBottom: '32px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                Content
              </label>
              <textarea
                value={standardCommentContent}
                onChange={(e) => setStandardCommentContent(e.target.value)}
                placeholder="Enter the comment content..."
                rows={8}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '16px',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit',
                  resize: 'vertical'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={handleCancelEdit}
                style={{
                  padding: '12px 24px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '600',
                  background: 'white',
                  color: '#374151',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveStandardComment}
                disabled={!standardCommentName.trim() || !standardCommentContent.trim()}
                style={{
                  padding: '12px 24px',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '600',
                  background: standardCommentName.trim() && standardCommentContent.trim() ? '#3b82f6' : '#9ca3af',
                  color: 'white',
                  cursor: standardCommentName.trim() && standardCommentContent.trim() ? 'pointer' : 'not-allowed'
                }}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show builders (existing ones with proper data)
  if (showRatedCommentBuilder) {
    return (
      <RatedCommentBuilder
        onSave={handleBuilderSave}
        onCancel={handleCancelEdit}
        existingComment={editingSection?.section.data}
      />
    );
  }

  if (showAssessmentCommentBuilder) {
    return (
      <AssessmentCommentBuilder
        onSave={handleBuilderSave}
        onCancel={handleCancelEdit}
        existingComment={editingSection?.section.data}
      />
    );
  }

  if (showPersonalisedCommentBuilder) {
    return (
      <PersonalisedCommentBuilder
        onSave={handleBuilderSave}
        onCancel={handleCancelEdit}
        existingComment={editingSection?.section.data}
      />
    );
  }

  if (showNextStepsCommentBuilder) {
    return (
      <NextStepsCommentBuilder
        onSave={handleBuilderSave}
        onCancel={handleCancelEdit}
        existingComment={editingSection?.section.data}
      />
    );
  }

  // Show naming step for new templates
  if (isNamingStep) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{
          backgroundColor: 'white',
          padding: '48px',
          borderRadius: '12px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          maxWidth: '600px',
          width: '100%',
          textAlign: 'center'
        }}>
          <h1 style={{ fontSize: '32px', fontWeight: '700', color: '#111827', marginBottom: '16px' }}>
            Create New Template
          </h1>
          <p style={{ fontSize: '16px', color: '#6b7280', marginBottom: '32px' }}>
            Give your template a name to get started
          </p>
          
          <div style={{ marginBottom: '32px' }}>
            <input
              type="text"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              onKeyPress={handleNamingKeyPress}
              placeholder="Enter template name..."
              style={{
                width: '100%',
                padding: '16px',
                fontSize: '18px',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                textAlign: 'center',
                boxSizing: 'border-box'
              }}
              autoFocus
            />
          </div>
          
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
            <Link
              to="/manage-templates"
              style={{
                padding: '16px 32px',
                backgroundColor: '#f3f4f6',
                color: '#374151',
                textDecoration: 'none',
                borderRadius: '8px',
                fontWeight: '600'
              }}
            >
              Cancel
            </Link>
            <button
              onClick={handleContinueFromNaming}
              disabled={!templateName.trim()}
              style={{
                padding: '16px 32px',
                backgroundColor: templateName.trim() ? '#3b82f6' : '#9ca3af',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '600',
                cursor: templateName.trim() ? 'pointer' : 'not-allowed'
              }}
            >
              Continue to Add Sections
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main template builder interface
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      {/* Header */}
      <header style={{ 
        backgroundColor: 'white', 
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        padding: '32px 24px'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div>
            <h1 style={{ 
              fontSize: '28px', 
              fontWeight: '600', 
              color: '#111827',
              margin: 0
            }}>
              {isEditing ? 'Edit Template' : 'Create Template'}
            </h1>
            <p style={{ color: '#6b7280', margin: '4px 0 0 0' }}>
              {templateName || 'Untitled Template'}
            </p>
          </div>
          
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => setShowDebug(!showDebug)}
              style={{
                padding: '8px 16px',
                backgroundColor: '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              {showDebug ? 'Hide Debug' : 'Debug'}
            </button>
            
            <Link
              to="/manage-templates"
              style={{
                padding: '12px 24px',
                backgroundColor: '#f3f4f6',
                color: '#374151',
                textDecoration: 'none',
                borderRadius: '8px',
                fontWeight: '600'
              }}
            >
              Cancel
            </Link>
            
            <button
              onClick={handleSaveTemplate}
              style={{
                padding: '12px 24px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              {isEditing ? 'Update Template' : 'Save Template'}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '32px 24px'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 300px',
          gap: '24px',
          alignItems: 'start'
        }}>
          {/* Template Sections */}
          <div style={{
            backgroundColor: 'white',
            border: '2px solid #e5e7eb',
            borderRadius: '12px',
            padding: '24px'
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <h2 style={{ 
                fontSize: '18px', 
                fontWeight: '600', 
                color: '#111827',
                margin: 0
              }}>
                Template Sections
              </h2>
              
              <button
                onClick={() => setShowSectionSelector(true)}
                style={{
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  padding: '8px 16px',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                + Add Section
              </button>
            </div>

            {sections.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '48px',
                color: '#9ca3af'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>📝</div>
                <h3 style={{ fontSize: '16px', fontWeight: '600', margin: '0 0 8px 0' }}>
                  No Sections Added Yet
                </h3>
                <p style={{ margin: '0 0 24px 0', fontSize: '14px' }}>
                  Start building your template by adding sections like comments, ratings, or next steps.
                </p>
                <button
                  onClick={() => setShowSectionSelector(true)}
                  style={{
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    padding: '12px 24px',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  Add Your First Section
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {sections.map((section, index) => (
                  <div key={section.id} style={{
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '16px'
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '12px'
                    }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '8px',
                          marginBottom: '4px'
                        }}>
                          <span style={{
                            backgroundColor: getSectionColor(section.type),
                            color: 'white',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: '600'
                          }}>
                            {getSectionDisplayName(section.type)}
                          </span>
                          <span style={{
                            backgroundColor: '#e5e7eb',
                            color: '#6b7280',
                            padding: '1px 6px',
                            borderRadius: '3px',
                            fontSize: '11px'
                          }}>
                            #{index + 1}
                          </span>
                        </div>
                        
                        {section.name && section.type !== 'new-line' && (
                          <h4 style={{
                            fontSize: '14px',
                            fontWeight: '600',
                            color: '#374151',
                            margin: '0 0 4px 0'
                          }}>
                            {section.name}
                          </h4>
                        )}
                        
                        {/* Show section summary */}
                        <div style={{
                          fontSize: '12px',
                          color: '#6b7280'
                        }}>
                          {section.type === 'rated-comment' && (
                            <span>
                              {section.data?.comments ? Object.values(section.data.comments).flat().length : 0} total comments
                            </span>
                          )}
                          {section.type === 'assessment-comment' && (
                            <span>
                              {section.data?.comments ? Object.values(section.data.comments).flat().length : 0} total comments
                            </span>
                          )}
                          {section.type === 'personalised-comment' && (
                            <span>
                              {section.data?.categories ? Object.keys(section.data.categories).length : 0} categories
                            </span>
                          )}
                          {section.type === 'next-steps' && (
                            <span>
                              {section.data?.focusAreas ? Object.keys(section.data.focusAreas).length : 0} focus areas
                            </span>
                          )}
                          {section.type === 'standard-comment' && (
                            <span>
                              {section.data?.content ? 'Has content' : 'No content'}
                            </span>
                          )}
                          {section.type === 'new-line' && (
                            <span>Spacing element</span>
                          )}
                        </div>

                        {/* Debug info */}
                        {showDebug && (
                          <div style={{
                            marginTop: '8px',
                            padding: '8px',
                            backgroundColor: '#f3f4f6',
                            borderRadius: '4px',
                            fontSize: '10px',
                            fontFamily: 'monospace'
                          }}>
                            <div><strong>Type:</strong> {section.type}</div>
                            <div><strong>ID:</strong> {section.id}</div>
                            <div><strong>Editable:</strong> {isSectionEditable(section.type) ? 'Yes' : 'No'}</div>
                            <div><strong>Data:</strong> {JSON.stringify(section.data, null, 1).substring(0, 100)}...</div>
                          </div>
                        )}
                      </div>
                      
                      <div style={{ display: 'flex', gap: '8px', marginLeft: '16px' }}>
                        {isSectionEditable(section.type) ? (
                          <button
                            onClick={() => handleEditSection(section, index)}
                            style={{
                              padding: '4px 8px',
                              backgroundColor: '#3b82f6',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              fontSize: '12px',
                              cursor: 'pointer'
                            }}
                          >
                            Edit
                          </button>
                        ) : (
                          <button
                            onClick={() => alert(`Editing for ${section.type} sections is not yet available`)}
                            style={{
                              padding: '4px 8px',
                              backgroundColor: '#9ca3af',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              fontSize: '12px',
                              cursor: 'not-allowed'
                            }}
                          >
                            Edit?
                          </button>
                        )}
                        
                        <button
                          onClick={() => handleRemoveSection(index)}
                          style={{
                            padding: '4px 8px',
                            backgroundColor: '#ef4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: '12px',
                            cursor: 'pointer'
                          }}
                        >
                          X
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <TemplateHealthDashboard
              sectionsCount={sections.length}
              validationErrors={validationErrors}
            />
            
            <TemplateValidationPanel
              validationErrors={validationErrors}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default CreateTemplate;