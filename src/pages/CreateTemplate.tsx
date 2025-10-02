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

  const handleSaveStandardComment = () => {
    if (!standardCommentName.trim()) {
      alert('Please enter a name for this section');
      return;
    }
    if (!standardCommentContent.trim()) {
      alert('Please enter content for this section');
      return;
    }

    const standardCommentData = {
      name: standardCommentName.trim(),
      content: standardCommentContent.trim()
    };

    handleSaveEditedSection(standardCommentData);
  };

  // Naming step screen
  if (isNamingStep) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{ maxWidth: '500px', width: '100%', backgroundColor: 'white', borderRadius: '12px', padding: '48px', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)' }}>
          <h1 style={{ fontSize: '28px', fontWeight: '600', color: '#111827', marginBottom: '12px', textAlign: 'center' }}>
            Create New Template
          </h1>
          <p style={{ fontSize: '16px', color: '#6b7280', marginBottom: '32px', textAlign: 'center' }}>
            Let's start by giving your template a name
          </p>
          
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
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
                padding: '12px 16px',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '16px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <Link to="/manage-templates" style={{ flex: 1, textDecoration: 'none' }}>
              <button style={{
                width: '100%',
                backgroundColor: '#f3f4f6',
                color: '#374151',
                padding: '12px 24px',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '500',
                cursor: 'pointer'
              }}>
                Cancel
              </button>
            </Link>
            
            <button
              onClick={handleContinueFromNaming}
              disabled={!templateName.trim()}
              style={{
                flex: 1,
                backgroundColor: templateName.trim() ? '#3b82f6' : '#e5e7eb',
                color: templateName.trim() ? 'white' : '#9ca3af',
                padding: '12px 24px',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '500',
                cursor: templateName.trim() ? 'pointer' : 'not-allowed'
              }}
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      <header style={{ 
        backgroundColor: 'white', 
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        padding: '24px 32px',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{ 
          maxWidth: '1200px', 
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h1 style={{ 
              fontSize: '24px', 
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
              padding: '48px 24px',
              color: '#9ca3af',
              border: '2px dashed #e5e7eb',
              borderRadius: '8px'
            }}>
              <p style={{ fontSize: '18px', margin: '0 0 8px 0' }}>No sections yet</p>
              <p style={{ fontSize: '14px', margin: 0 }}>Click "Add Section" to get started</p>
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
                    padding: '16px'
                  }}
                >
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    marginBottom: '8px'
                  }}>
                    <div>
                      <h3 style={{ 
                        fontSize: '16px', 
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

                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      {/* Move Up button */}
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

                      {/* Move Down button */}
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
          overflow: 'auto',
          padding: '20px'
        }}>
          <div style={{
            minHeight: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <div style={{
              width: '100%',
              maxWidth: '900px',
              margin: '0 auto'
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
          overflow: 'auto',
          padding: '20px'
        }}>
          <div style={{
            minHeight: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <div style={{
              width: '100%',
              maxWidth: '900px',
              margin: '0 auto'
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
          overflow: 'auto',
          padding: '20px'
        }}>
          <div style={{
            minHeight: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <div style={{
              width: '100%',
              maxWidth: '900px',
              margin: '0 auto'
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
          overflow: 'auto',
          padding: '20px'
        }}>
          <div style={{
            minHeight: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <div style={{
              width: '100%',
              maxWidth: '900px',
              margin: '0 auto'
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
          </div>
        </div>
      )}

      {/* Standard Comment Editor Modal */}
      {showStandardCommentEditor && editingSection && (
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
            maxWidth: '600px',
            width: '100%',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <h2 style={{ fontSize: '24px', fontWeight: '600', color: '#111827', marginBottom: '24px' }}>
              Edit Standard Comment
            </h2>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                Section Name
              </label>
              <input
                type="text"
                value={standardCommentName}
                onChange={(e) => setStandardCommentName(e.target.value)}
                placeholder="e.g., Attendance, Homework, Participation..."
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '16px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                Comment Content
              </label>
              <textarea
                value={standardCommentContent}
                onChange={(e) => setStandardCommentContent(e.target.value)}
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
                  fontFamily: 'inherit'
                }}
              />
              <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '8px', fontStyle: 'italic' }}>
                Tip: Use [Name] to automatically insert the student's name
              </p>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={handleCancelEdit}
                style={{
                  backgroundColor: '#f3f4f6',
                  color: '#374151',
                  padding: '12px 24px',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveStandardComment}
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