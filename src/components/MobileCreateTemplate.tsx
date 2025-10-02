import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { TemplateSection } from '../types';
import SectionSelector from '../components/SectionSelector';
import RatedCommentBuilder from '../components/RatedCommentBuilder';
import AssessmentCommentBuilder from '../components/AssessmentCommentBuilder';
import PersonalisedCommentBuilder from '../components/PersonalisedCommentBuilder';
import NextStepsCommentBuilder from '../components/NextStepsCommentBuilder';

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
  const [showStandardCommentEditor, setShowStandardCommentEditor] = useState(false);

  // Editing state
  const [editingSection, setEditingSection] = useState<{section: TemplateSection, index: number} | null>(null);

  // Standard comment editor state
  const [standardCommentName, setStandardCommentName] = useState('');
  const [standardCommentContent, setStandardCommentContent] = useState('');

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
        setStandardCommentName(section.name || '');
        setStandardCommentContent(section.data?.content || '');
        setShowStandardCommentEditor(true);
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
    updatedSections[editingSection.index] = {
      ...editingSection.section,
      name: updatedData.name || editingSection.section.name,
      data: updatedData
    };

    setSections(updatedSections);
    handleCancelEdit();
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
    setShowStandardCommentEditor(false);
    setStandardCommentName('');
    setStandardCommentContent('');
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

  // Naming step screen
  if (isNamingStep) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#f9fafb',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center'
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
                padding: '12px',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}>
            <button
              onClick={handleContinueFromNaming}
              disabled={!templateName.trim()}
              style={{
                padding: '14px 24px',
                backgroundColor: templateName.trim() ? '#3b82f6' : '#9ca3af',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '600',
                cursor: templateName.trim() ? 'pointer' : 'not-allowed',
                fontSize: '14px'
              }}
            >
              Continue to Add Sections
            </button>
            <Link
              to="/"
              style={{
                padding: '14px 24px',
                backgroundColor: '#6b7280',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '8px',
                fontWeight: '600',
                textAlign: 'center',
                fontSize: '14px'
              }}
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Main mobile template builder interface
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      {/* Mobile Header */}
      <header style={{ 
        backgroundColor: 'white', 
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        padding: '16px'
      }}>
        <div>
          <h1 style={{ 
            fontSize: '20px', 
            fontWeight: '600', 
            color: '#111827',
            margin: 0
          }}>
            {isEditing ? 'Edit Template' : 'Create Template'}
          </h1>
          <p style={{ 
            color: '#6b7280', 
            margin: '4px 0 16px 0',
            fontSize: '14px'
          }}>
            {templateName || 'Untitled Template'}
          </p>
          
          <div style={{ 
            display: 'flex', 
            gap: '8px'
          }}>
            <Link
              to="/manage-templates"
              style={{
                padding: '10px 16px',
                backgroundColor: '#f3f4f6',
                color: '#374151',
                textDecoration: 'none',
                borderRadius: '8px',
                fontWeight: '600',
                fontSize: '14px',
                flex: '1',
                textAlign: 'center'
              }}
            >
              Cancel
            </Link>
            
            <button
              onClick={handleSaveTemplate}
              style={{
                padding: '10px 16px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '600',
                cursor: 'pointer',
                fontSize: '14px',
                flex: '1'
              }}
            >
              {isEditing ? 'Update' : 'Save'}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ padding: '16px' }}>
        {/* Template Sections */}
        <div style={{
          backgroundColor: 'white',
          border: '2px solid #e5e7eb',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '24px'
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '20px',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <h2 style={{ 
              fontSize: '16px', 
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
                padding: '12px 24px',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                width: '100%',
                justifyContent: 'center'
              }}
            >
              + Add Section
            </button>
          </div>

          {sections.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '40px 20px',
              color: '#6b7280',
              backgroundColor: '#f9fafb',
              borderRadius: '8px',
              border: '2px dashed #d1d5db'
            }}>
              <p style={{ 
                fontSize: '14px', 
                margin: '0 0 16px 0' 
              }}>
                No sections added yet. Click "Add Section" to get started!
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {sections.map((section, index) => (
                <div 
                  key={section.id}
                  style={{
                    backgroundColor: '#f9fafb',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '12px'
                  }}
                >
                  <div style={{ marginBottom: '8px' }}>
                    <h3 style={{ 
                      fontSize: '14px', 
                      fontWeight: '600', 
                      color: '#111827',
                      margin: '0 0 4px 0'
                    }}>
                      {section.name}
                    </h3>
                    <p style={{ 
                      fontSize: '12px', 
                      color: '#6b7280',
                      margin: 0
                    }}>
                      {section.type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </p>
                  </div>

                  <div style={{
                    display: 'flex',
                    gap: '8px',
                    width: '100%'
                  }}>
                    {/* Edit button */}
                    {isSectionEditable(section.type) && (
                      <button
                        onClick={() => handleEditSection(section, index)}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: '#3b82f6',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          fontSize: '12px',
                          cursor: 'pointer',
                          flex: '1'
                        }}
                      >
                        Edit
                      </button>
                    )}

                    {/* Delete button */}
                    <button
                      onClick={() => handleDeleteSection(index)}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#ef4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '12px',
                        cursor: 'pointer',
                        flex: '1'
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
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '20px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <SectionSelector
              onSelectSection={handleAddSection}
              onBack={() => setShowSectionSelector(false)}
            />
          </div>
        </div>
      )}

      {/* Comment Builder Modals - FIXED: Added scrollable wrapper */}
      {showRatedCommentBuilder && editingSection && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 1000,
          overflow: 'auto'
        }}>
          <div style={{
            minHeight: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}>
            <div style={{ width: '100%', maxWidth: '900px' }}>
              <RatedCommentBuilder
                existingComment={editingSection.section.data}
                onSave={handleSaveEditedSection}
                onCancel={() => {
                  setEditingSection(null);
                  setShowRatedCommentBuilder(false);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {showAssessmentCommentBuilder && editingSection && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 1000,
          overflow: 'auto'
        }}>
          <div style={{
            minHeight: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}>
            <div style={{ width: '100%', maxWidth: '900px' }}>
              <AssessmentCommentBuilder
                existingComment={editingSection.section.data}
                onSave={handleSaveEditedSection}
                onCancel={() => {
                  setEditingSection(null);
                  setShowAssessmentCommentBuilder(false);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {showPersonalisedCommentBuilder && editingSection && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 1000,
          overflow: 'auto'
        }}>
          <div style={{
            minHeight: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}>
            <div style={{ width: '100%', maxWidth: '900px' }}>
              <PersonalisedCommentBuilder
                existingComment={editingSection.section.data}
                onSave={handleSaveEditedSection}
                onCancel={() => {
                  setEditingSection(null);
                  setShowPersonalisedCommentBuilder(false);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {showNextStepsCommentBuilder && editingSection && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 1000,
          overflow: 'auto'
        }}>
          <div style={{
            minHeight: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
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
        </div>
      )}

      {/* Standard Comment Editor Modal */}
      {showStandardCommentEditor && (
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
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '20px',
            width: '100%',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: '600',
              marginBottom: '20px',
              color: '#111827'
            }}>
              Edit Standard Comment
            </h3>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '6px'
              }}>
                Comment Name
              </label>
              <input
                type="text"
                value={standardCommentName}
                onChange={(e) => setStandardCommentName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
                placeholder="Enter comment name..."
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '6px'
              }}>
                Comment Content
              </label>
              <textarea
                value={standardCommentContent}
                onChange={(e) => setStandardCommentContent(e.target.value)}
                style={{
                  width: '100%',
                  height: '120px',
                  padding: '10px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  resize: 'vertical',
                  boxSizing: 'border-box'
                }}
                placeholder="Enter comment content..."
              />
            </div>

            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end',
              flexDirection: 'column'
            }}>
              <button
                onClick={() => {
                  if (standardCommentName.trim() && standardCommentContent.trim()) {
                    handleSaveEditedSection({
                      name: standardCommentName.trim(),
                      data: { content: standardCommentContent.trim() }
                    });
                  }
                }}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Save Changes
              </button>
              <button
                onClick={() => {
                  setEditingSection(null);
                  setShowStandardCommentEditor(false);
                }}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#f3f4f6',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileCreateTemplate;