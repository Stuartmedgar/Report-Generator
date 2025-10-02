import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { TemplateSection } from '../types';
import SectionSelector from '../components/SectionSelector';
import RatedCommentBuilder from '../components/RatedCommentBuilder';
import AssessmentCommentBuilder from '../components/AssessmentCommentBuilder';
import PersonalisedCommentBuilder from '../components/PersonalisedCommentBuilder';
import NextStepsCommentBuilder from '../components/NextStepsCommentBuilder';
import MobileCreateTemplate from '../components/MobileCreateTemplate';

const CreateTemplate: React.FC = () => {
  const { state, addTemplate, updateTemplate } = useData();
  const navigate = useNavigate();
  const location = useLocation();
  const editTemplate = location.state?.editTemplate;
  const isEditing = !!editTemplate;

  // Mobile detection
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  // ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS
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

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // SCROLL FIX: Ensure body can scroll when editing template
  useEffect(() => {
    document.body.style.overflow = 'auto';
    document.documentElement.style.overflow = 'auto';
    
    return () => {
      document.body.style.overflow = 'auto';
      document.documentElement.style.overflow = 'auto';
    };
  }, []);

  // If mobile, use mobile component - AFTER all hooks are called
  if (isMobile) {
    return <MobileCreateTemplate />;
  }

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
  const handleAddSection = (sectionType: string, sectionDataInput?: any) => {
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

  // Handle move section up/down
  const handleMoveSection = (index: number, direction: 'up' | 'down') => {
    const newSections = [...sections];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    if (targetIndex >= 0 && targetIndex < newSections.length) {
      [newSections[index], newSections[targetIndex]] = [newSections[targetIndex], newSections[index]];
      setSections(newSections);
    }
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

  // Show naming step if needed
  if (isNamingStep) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', display: 'flex', alignItems: 'center', padding: '24px' }}>
        <div style={{ 
          maxWidth: '600px', 
          margin: '0 auto', 
          backgroundColor: 'white', 
          padding: '48px', 
          borderRadius: '12px', 
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' 
        }}>
          <h1 style={{ 
            textAlign: 'center', 
            fontSize: '32px', 
            fontWeight: '600', 
            color: '#111827', 
            marginBottom: '8px' 
          }}>
            Create New Template
          </h1>
          <p style={{ 
            textAlign: 'center', 
            color: '#6b7280', 
            marginBottom: '32px',
            fontSize: '16px'
          }}>
            Start by giving your template a name
          </p>
          
          <div style={{ marginBottom: '24px' }}>
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
          
          <div style={{ 
            display: 'flex', 
            gap: '16px', 
            justifyContent: 'center'
          }}>
            <Link
              to="/"
              style={{
                padding: '16px 32px',
                backgroundColor: '#6b7280',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '8px',
                fontWeight: '600',
                textAlign: 'center',
                fontSize: '16px'
              }}
            >
              ← Back to Home
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
                cursor: templateName.trim() ? 'pointer' : 'not-allowed',
                fontSize: '16px'
              }}
            >
              Continue to Add Sections
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main desktop template builder interface
  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#f9fafb',
      height: '100vh',
      overflowY: 'auto',
      position: 'relative'
    }}>
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
            <p style={{ 
              color: '#6b7280', 
              margin: '8px 0 0 0',
              fontSize: '16px'
            }}>
              {templateName || 'Untitled Template'}
            </p>
          </div>
          
          <div style={{ display: 'flex', gap: '12px' }}>
            <Link to="/manage-templates" style={{ textDecoration: 'none' }}>
              <button style={{
                backgroundColor: '#f3f4f6',
                color: '#374151',
                padding: '12px 24px',
                border: 'none',
                borderRadius: '8px',
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
              {isEditing ? 'Update Template' : 'Save Template'}
            </button>
          </div>
        </div>
      </header>

      <main style={{ 
        maxWidth: '1200px', 
        margin: '0 auto', 
        padding: '32px 24px',
        paddingBottom: '100px',
        width: '100%',
        boxSizing: 'border-box'
      }}>
        {/* Template Sections */}
        <div style={{
          backgroundColor: 'white',
          border: '2px solid #e5e7eb',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '24px'
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
              padding: '48px 20px',
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
                    padding: '16px',
                    border: `2px solid ${getSectionColor(section.type)}`,
                    borderRadius: '8px',
                    backgroundColor: 'white',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#111827',
                      marginBottom: '4px'
                    }}>
                      {section.name || getSectionDisplayName(section.type)}
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: '#6b7280'
                    }}>
                      {getSectionDisplayName(section.type)}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {/* Move up button */}
                    <button
                      onClick={() => handleMoveSection(index, 'up')}
                      disabled={index === 0}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: index === 0 ? '#f3f4f6' : '#e5e7eb',
                        color: index === 0 ? '#9ca3af' : '#374151',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: index === 0 ? 'not-allowed' : 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      ↑
                    </button>

                    {/* Move down button */}
                    <button
                      onClick={() => handleMoveSection(index, 'down')}
                      disabled={index === sections.length - 1}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: index === sections.length - 1 ? '#f3f4f6' : '#e5e7eb',
                        color: index === sections.length - 1 ? '#9ca3af' : '#374151',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: index === sections.length - 1 ? 'not-allowed' : 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      ↓
                    </button>

                    {/* Edit button */}
                    {isSectionEditable(section.type) && (
                      <button
                        onClick={() => handleEditSection(section, index)}
                        style={{
                          padding: '6px 12px',
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
                    )}

                    {/* Delete button */}
                    <button
                      onClick={() => handleDeleteSection(index)}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#ef4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '12px',
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

      {/* Section Selector Modal - FIXED: Much larger modal */}
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
            padding: '32px',
            maxWidth: '1200px',
            width: '95%',
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

      {/* Comment Builder Modals */}
      {showRatedCommentBuilder && editingSection && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 1000
        }}>
          <RatedCommentBuilder
            existingComment={editingSection.section.data}
            onSave={handleSaveEditedSection}
            onCancel={() => {
              setEditingSection(null);
              setShowRatedCommentBuilder(false);
            }}
          />
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
          zIndex: 1000
        }}>
          <AssessmentCommentBuilder
            existingComment={editingSection.section.data}
            onSave={handleSaveEditedSection}
            onCancel={() => {
              setEditingSection(null);
              setShowAssessmentCommentBuilder(false);
            }}
          />
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
          zIndex: 1000
        }}>
          <PersonalisedCommentBuilder
            existingComment={editingSection.section.data}
            onSave={handleSaveEditedSection}
            onCancel={() => {
              setEditingSection(null);
              setShowPersonalisedCommentBuilder(false);
            }}
          />
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
          zIndex: 1000
        }}>
          <NextStepsCommentBuilder
            existingComment={editingSection.section.data}
            onSave={handleSaveEditedSection}
            onCancel={() => {
              setEditingSection(null);
              setShowNextStepsCommentBuilder(false);
            }}
          />
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
          padding: '40px'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '32px',
            maxWidth: '600px',
            width: '100%'
          }}>
            <h3 style={{
              fontSize: '20px',
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
                  padding: '10px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  minHeight: '120px',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit',
                  resize: 'vertical'
                }}
                placeholder="Enter the comment text..."
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={handleCancelEdit}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#f3f4f6',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handleSaveEditedSection({
                    name: standardCommentName,
                    content: standardCommentContent
                  });
                }}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateTemplate;