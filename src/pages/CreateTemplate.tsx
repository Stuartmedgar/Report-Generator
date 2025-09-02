import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { TemplateSection } from '../types';
import SectionSelector from '../components/SectionSelector';
import RatedCommentBuilder from '../components/RatedCommentBuilder';
import AssessmentCommentBuilder from '../components/AssessmentCommentBuilder';
import PersonalisedCommentBuilder from '../components/PersonalisedCommentBuilder';
import NextStepsCommentBuilder from '../components/NextStepsCommentBuilder';

// Import our new modular components
import { TemplateValidationPanel } from '../components/CreateTemplate/TemplateValidationPanel';
import { TemplateHealthDashboard } from '../components/CreateTemplate/TemplateHealthDashboard';
import { TemplateSectionList } from '../components/CreateTemplate/TemplateSectionList';
import { TemplatePreviewModal } from '../components/CreateTemplate/TemplatePreviewModal';
import { TemplateQuickActions } from '../components/CreateTemplate/TemplateQuickActions';

// Import utility functions
import { validateTemplate } from '../utils/templateValidation';
import { exportTemplateToText } from '../utils/templateExport';

export default function CreateTemplate() {
  const navigate = useNavigate();
  const location = useLocation();
  const { addTemplate, updateTemplate } = useData();
  
  // Check if we're editing an existing template
  const editTemplate = location.state?.editTemplate;
  const isEditing = !!editTemplate;

  const [templateName, setTemplateName] = useState(editTemplate?.name || '');
  const [sections, setSections] = useState<TemplateSection[]>(editTemplate?.sections || []);
  const [sectionData, setSectionData] = useState<Record<string, any>>({});
  const [showSectionSelector, setShowSectionSelector] = useState(false);
  const [showRatedCommentBuilder, setShowRatedCommentBuilder] = useState(false);
  const [showAssessmentCommentBuilder, setShowAssessmentCommentBuilder] = useState(false);
  const [showPersonalisedCommentBuilder, setShowPersonalisedCommentBuilder] = useState(false);
  const [showNextStepsCommentBuilder, setShowNextStepsCommentBuilder] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [editingSection, setEditingSection] = useState<{ section: TemplateSection; index: number } | null>(null);

  // Initialize section data from existing template if editing
  useEffect(() => {
    if (editTemplate && editTemplate.sections) {
      const initialSectionData: Record<string, any> = {};
      editTemplate.sections.forEach((section: TemplateSection) => {
        initialSectionData[section.id] = section.data || {};
      });
      setSectionData(initialSectionData);
    }
  }, [editTemplate]);

  // Validation - simple array approach
  const validationErrors: string[] = [];
  if (sections.length === 0) {
    validationErrors.push('Template must have at least one section');
  }
  // Add more validation as needed

  // Template name step
  if (!templateName.trim()) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
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
                {isEditing ? 'Edit Template' : 'Create New Template'}
              </h1>
              <p style={{ 
                color: '#6b7280', 
                margin: '8px 0 0 0',
                fontSize: '16px'
              }}>
                Start by giving your template a name
              </p>
            </div>
            
            <div style={{
              display: 'flex',
              gap: '12px',
              flexWrap: 'wrap'
            }}>
              <Link to="/" style={{ textDecoration: 'none' }}>
                <button style={{
                  backgroundColor: '#6b7280',
                  color: 'white',
                  padding: '12px 20px',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}>
                  ← Back to Home
                </button>
              </Link>
              
              <Link to="/manage-templates" style={{ textDecoration: 'none' }}>
                <button style={{
                  backgroundColor: '#8b5cf6',
                  color: 'white',
                  padding: '12px 20px',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}>
                  📋 Manage Templates
                </button>
              </Link>
            </div>
          </div>
        </header>

        <main style={{ 
          maxWidth: '800px', 
          margin: '0 auto', 
          padding: '32px 24px' 
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '48px 32px',
            borderRadius: '12px',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '48px',
              marginBottom: '16px'
            }}>
              
            </div>
            <h2 style={{
              fontSize: '24px',
              fontWeight: '600',
              color: '#111827',
              marginBottom: '8px'
            }}>
              {isEditing ? 'Edit Template Name' : 'Name Your Template'}
            </h2>
            <p style={{
              color: '#6b7280',
              fontSize: '16px',
              marginBottom: '32px'
            }}>
              Choose a descriptive name for your template that describes the type of report it will generate.
            </p>
            
            <input
              type="text"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="e.g., Math Progress Report, Science Assessment, Weekly Behaviour Report"
              autoFocus
              style={{
                width: '100%',
                maxWidth: '500px',
                padding: '16px',
                fontSize: '18px',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                marginBottom: '24px',
                textAlign: 'center'
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && templateName.trim()) {
                  // Auto-continue when Enter is pressed
                }
              }}
            />
            
            <button
              onClick={() => {/* Template name is set, continue to section building */}}
              disabled={!templateName.trim()}
              style={{
                backgroundColor: templateName.trim() ? '#3b82f6' : '#9ca3af',
                color: 'white',
                padding: '16px 32px',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: templateName.trim() ? 'pointer' : 'not-allowed',
                width: '100%',
                maxWidth: '300px'
              }}
            >
              Continue to Add Sections
            </button>
          </div>
        </main>
      </div>
    );
  }

  // Handle save template
  const handleSaveTemplate = () => {
    if (validationErrors.length > 0) {
      const proceed = window.confirm(
        `Your template has ${validationErrors.length} validation issue(s):\n\n${validationErrors.join('\n')}\n\nDo you want to save anyway?`
      );
      if (!proceed) return;
    }

    const templateData = {
      id: editTemplate?.id || `template-${Date.now()}`,
      name: templateName,
      sections: sections,
      createdAt: editTemplate?.createdAt || new Date().toISOString()
    };

    if (isEditing) {
      updateTemplate(templateData);
      alert('Template updated successfully!');
    } else {
      addTemplate(templateData);
      alert('Template created successfully!');
    }
    
    navigate('/manage-templates');
  };

  // Export template - simplified
  const handleExportTemplate = () => {
    const exportContent = `Template: ${templateName}\nSections: ${sections.length}\n\nValidation Issues: ${validationErrors.length > 0 ? validationErrors.join(', ') : 'None'}`;
    const blob = new Blob([exportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${templateName}_export.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Section management
  const handleAddSection = (sectionType: string, sectionData: any) => {
    const newSection: TemplateSection = {
      id: `section-${Date.now()}`,
      type: sectionType as any,
      name: sectionData.name,
      data: sectionData.data
    };
    
    setSections([...sections, newSection]);
    setSectionData(prev => ({
      ...prev,
      [newSection.id]: sectionData.data
    }));
    setShowSectionSelector(false);
  };

  const handleEditSection = (section: TemplateSection, index: number) => {
    setEditingSection({ section, index });
    
    // Show the appropriate builder
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
    }
  };

  const handleUpdateSection = (updatedSectionData: any) => {
    if (!editingSection) return;

    const updatedSection: TemplateSection = {
      ...editingSection.section,
      name: updatedSectionData.name,
      data: updatedSectionData.data
    };

    const newSections = [...sections];
    newSections[editingSection.index] = updatedSection;
    setSections(newSections);

    setSectionData(prev => ({
      ...prev,
      [updatedSection.id]: updatedSectionData.data
    }));

    setEditingSection(null);
    setShowRatedCommentBuilder(false);
    setShowAssessmentCommentBuilder(false);
    setShowPersonalisedCommentBuilder(false);
    setShowNextStepsCommentBuilder(false);
  };

  const handleRemoveSection = (index: number) => {
    const newSections = sections.filter((_, i) => i !== index);
    setSections(newSections);
  };

  const handleMoveSection = (fromIndex: number, toIndex: number) => {
    const newSections = [...sections];
    const [movedSection] = newSections.splice(fromIndex, 1);
    newSections.splice(toIndex, 0, movedSection);
    setSections(newSections);
  };

  const updateSectionData = (sectionId: string, data: any) => {
    setSectionData(prev => ({
      ...prev,
      [sectionId]: data
    }));
  };

  // Show builders - simplified to avoid complex prop interfaces
  if (showSectionSelector) {
    return (
      <SectionSelector
        onSelectSection={handleAddSection}
        onBack={() => setShowSectionSelector(false)}
      />
    );
  }

  // For now, just show message when trying to edit complex sections
  if (showRatedCommentBuilder || showAssessmentCommentBuilder || showPersonalisedCommentBuilder || showNextStepsCommentBuilder) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', padding: '50px', textAlign: 'center' }}>
        <h2>Section Editor</h2>
        <p>Advanced section editing will be available in the next update.</p>
        <button 
          onClick={() => {
            setShowRatedCommentBuilder(false);
            setShowAssessmentCommentBuilder(false);
            setShowPersonalisedCommentBuilder(false);
            setShowNextStepsCommentBuilder(false);
            setEditingSection(null);
          }}
          style={{ backgroundColor: '#3b82f6', color: 'white', padding: '12px 24px', border: 'none', borderRadius: '8px' }}
        >
          Back to Template
        </button>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      {/* Header with consistent layout */}
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
              {isEditing ? 'Edit Template' : 'Create Template'}: {templateName}
            </h1>
            <p style={{ 
              color: '#6b7280', 
              margin: '8px 0 0 0',
              fontSize: '16px'
            }}>
              {sections.length} section{sections.length !== 1 ? 's' : ''} added
              {validationErrors.length > 0 && (
                <span style={{ color: '#ef4444', marginLeft: '8px' }}>
                  • {validationErrors.length} issue{validationErrors.length !== 1 ? 's' : ''} found
                </span>
              )}
            </p>
          </div>
          
          <div style={{
            display: 'flex',
            gap: '12px',
            flexWrap: 'wrap'
          }}>
            <Link to="/" style={{ textDecoration: 'none' }}>
              <button style={{
                backgroundColor: '#6b7280',
                color: 'white',
                padding: '12px 20px',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer'
              }}>
                ← Back to Home
              </button>
            </Link>

            <button
              onClick={handleExportTemplate}
              disabled={sections.length === 0}
              style={{
                backgroundColor: sections.length > 0 ? '#8b5cf6' : '#9ca3af',
                color: 'white',
                padding: '12px 20px',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: sections.length > 0 ? 'pointer' : 'not-allowed'
              }}
            >
              📄 Export
            </button>
            
            <button
              onClick={() => setShowPreview(true)}
              disabled={sections.length === 0}
              style={{
                backgroundColor: sections.length > 0 ? '#06b6d4' : '#9ca3af',
                color: 'white',
                padding: '12px 20px',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: sections.length > 0 ? 'pointer' : 'not-allowed'
              }}
            >
              👀 Preview
            </button>
            
            <Link to="/manage-templates" style={{ textDecoration: 'none' }}>
              <button style={{
                backgroundColor: '#f59e0b',
                color: 'white',
                padding: '12px 20px',
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
              disabled={sections.length === 0}
              style={{
                backgroundColor: sections.length > 0 ? '#10b981' : '#9ca3af',
                color: 'white',
                padding: '12px 20px',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: sections.length > 0 ? 'pointer' : 'not-allowed'
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
        padding: '32px 24px',
        display: 'flex',
        gap: '24px'
      }}>
        
        {/* Left Column - Template Builder */}
        <div style={{ flex: '2' }}>
          {validationErrors.length > 0 && (
            <div style={{
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '16px'
            }}>
              <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#dc2626', margin: '0 0 8px 0' }}>
                Validation Issues ({validationErrors.length})
              </h4>
              <ul style={{ fontSize: '12px', color: '#dc2626', margin: 0, paddingLeft: '16px' }}>
                {validationErrors.map((error, i) => (
                  <li key={i}>{error}</li>
                ))}
              </ul>
            </div>
          )}
          
          <div style={{
            backgroundColor: 'white',
            padding: '24px',
            borderRadius: '12px',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
          }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>
              Template Sections ({sections.length})
            </h2>
            
            {sections.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px', color: '#9ca3af' }}>
                <p>No sections added yet.</p>
                <button
                  onClick={() => setShowSectionSelector(true)}
                  style={{
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    padding: '12px 24px',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '16px',
                    cursor: 'pointer'
                  }}
                >
                  Add Your First Section
                </button>
              </div>
            ) : (
              <div>
                {sections.map((section, index) => (
                  <div key={section.id} style={{
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '16px',
                    marginBottom: '8px',
                    backgroundColor: '#fafafa'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: '600' }}>
                          {section.name || section.type}
                        </h4>
                        <p style={{ margin: 0, fontSize: '12px', color: '#6b7280' }}>
                          Type: {section.type}
                        </p>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => handleEditSection(section, index)}
                          style={{
                            backgroundColor: '#3b82f6',
                            color: 'white',
                            padding: '4px 8px',
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: '12px',
                            cursor: 'pointer'
                          }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleRemoveSection(index)}
                          style={{
                            backgroundColor: '#ef4444',
                            color: 'white',
                            padding: '4px 8px',
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: '12px',
                            cursor: 'pointer'
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                <button
                  onClick={() => setShowSectionSelector(true)}
                  style={{
                    backgroundColor: '#10b981',
                    color: 'white',
                    padding: '12px 24px',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    cursor: 'pointer',
                    width: '100%',
                    marginTop: '16px'
                  }}
                >
                  + Add Another Section
                </button>
              </div>
            )}
          </div>
        </div>
        
        {/* Right Column - Quick Tools */}
        <div style={{ width: '300px' }}>
          <div style={{ position: 'sticky', top: '20px' }}>
            <div style={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '16px'
            }}>
              <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#374151', margin: '0 0 12px 0' }}>
                Template Health
              </h4>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>
                <div>Sections: {sections.length}</div>
                <div>Issues: {validationErrors.length}</div>
                <div style={{ color: validationErrors.length === 0 ? '#10b981' : '#ef4444' }}>
                  Status: {validationErrors.length === 0 ? 'Ready' : 'Needs attention'}
                </div>
              </div>
            </div>
            
            <div style={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '16px'
            }}>
              <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#374151', margin: '0 0 12px 0' }}>
                Quick Actions
              </h4>
              <button
                onClick={() => setShowSectionSelector(true)}
                style={{
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  padding: '8px 16px',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  cursor: 'pointer',
                  width: '100%',
                  marginBottom: '8px'
                }}
              >
                + Add Section
              </button>
              <button
                onClick={() => setShowPreview(true)}
                disabled={sections.length === 0}
                style={{
                  backgroundColor: sections.length > 0 ? '#06b6d4' : '#9ca3af',
                  color: 'white',
                  padding: '8px 16px',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  cursor: sections.length > 0 ? 'pointer' : 'not-allowed',
                  width: '100%',
                  marginBottom: '8px'
                }}
              >
                👀 Preview
              </button>
              <button
                onClick={handleExportTemplate}
                disabled={sections.length === 0}
                style={{
                  backgroundColor: sections.length > 0 ? '#8b5cf6' : '#9ca3af',
                  color: 'white',
                  padding: '8px 16px',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  cursor: sections.length > 0 ? 'pointer' : 'not-allowed',
                  width: '100%'
                }}
              >
                📄 Export
              </button>
            </div>
            
            {/* Template Tips */}
            <div style={{
              backgroundColor: '#f0f9ff',
              border: '1px solid #bfdbfe',
              borderRadius: '8px',
              padding: '16px',
              marginTop: '16px'
            }}>
              <h4 style={{
                fontSize: '14px',
                fontWeight: '600',
                color: '#1e40af',
                margin: '0 0 8px 0'
              }}>
                💡 Template Tips
              </h4>
              <ul style={{
                fontSize: '12px',
                color: '#1e40af',
                margin: 0,
                paddingLeft: '16px'
              }}>
                <li style={{ marginBottom: '4px' }}>Use the Export button to review all content in a text file</li>
                <li style={{ marginBottom: '4px' }}>Preview shows how reports will look to students/parents</li>
                <li style={{ marginBottom: '4px' }}>Fix all validation issues before using with classes</li>
                <li>Standard comments are great for consistent messaging</li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      {/* Preview Modal - simplified */}
      {showPreview && (
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
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '24px',
            borderRadius: '12px',
            maxWidth: '600px',
            maxHeight: '80vh',
            overflowY: 'auto'
          }}>
            <h3 style={{ margin: '0 0 16px 0' }}>Template Preview: {templateName}</h3>
            <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '16px' }}>
              This template has {sections.length} sections.
            </div>
            <button
              onClick={() => setShowPreview(false)}
              style={{
                backgroundColor: '#3b82f6',
                color: 'white',
                padding: '8px 16px',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              Close Preview
            </button>
          </div>
        </div>
      )}
    </div>
  );
}