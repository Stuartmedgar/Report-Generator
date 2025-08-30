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
  const [isNameSaved, setIsNameSaved] = useState(isEditing);
  const [showSectionSelector, setShowSectionSelector] = useState(false);
  const [sectionData, setSectionData] = useState<Record<string, any>>({});
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  
  // States for editing sections
  const [editingSection, setEditingSection] = useState<{ section: TemplateSection; index: number } | null>(null);
  const [showRatedCommentBuilder, setShowRatedCommentBuilder] = useState(false);
  const [showAssessmentCommentBuilder, setShowAssessmentCommentBuilder] = useState(false);
  const [showPersonalisedCommentBuilder, setShowPersonalisedCommentBuilder] = useState(false);
  const [showNextStepsCommentBuilder, setShowNextStepsCommentBuilder] = useState(false);

  // Initialize section data from existing template if editing
  useEffect(() => {
    if (isEditing && editTemplate) {
      const initialSectionData: Record<string, any> = {};
      editTemplate.sections.forEach((section: any) => {
        initialSectionData[section.id] = section.data || {};
      });
      setSectionData(initialSectionData);
    }
  }, [isEditing, editTemplate]);

  // Run validation whenever sections change
  useEffect(() => {
    const validation = validateTemplate(templateName, sections);
    setValidationErrors(validation.errors);
  }, [sections, templateName]);

  const handleSaveName = () => {
    if (templateName.trim()) {
      setIsNameSaved(true);
    }
  };

  const handleSelectSection = (sectionType: string, data?: any) => {
    const newSection: TemplateSection = {
      id: Date.now().toString(),
      type: sectionType as any,
      name: data?.name || '',
      data: data?.data || data || {}
    };
    setSections([...sections, newSection]);
    setShowSectionSelector(false);
  };

  const updateSectionData = (sectionId: string, data: any) => {
    setSectionData(prev => ({
      ...prev,
      [sectionId]: { ...prev[sectionId], ...data }
    }));
  };

  const handleRemoveSection = (id: string) => {
    setSections(sections.filter(section => section.id !== id));
  };

  const handleMoveSection = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index > 0) {
      const newSections = [...sections];
      [newSections[index - 1], newSections[index]] = [newSections[index], newSections[index - 1]];
      setSections(newSections);
    } else if (direction === 'down' && index < sections.length - 1) {
      const newSections = [...sections];
      [newSections[index], newSections[index + 1]] = [newSections[index + 1], newSections[index]];
      setSections(newSections);
    }
  };

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
      default:
        alert(`Edit functionality for ${section.type} sections is not yet implemented. You can remove and re-add this section to make changes.`);
        break;
    }
  };

  const handleSaveEditedSection = (editedData: any) => {
    if (editingSection) {
      let transformedData = editedData;
      
      if (editingSection.section.type === 'next-steps') {
        transformedData = {
          name: editedData.name,
          focusAreas: editedData.comments,
          headings: editedData.headings
        };
      } else if (editingSection.section.type === 'personalised-comment') {
        transformedData = {
          name: editedData.name,
          instruction: editedData.instruction,
          categories: editedData.comments,
          headings: editedData.headings
        };
      }

      const updatedSections = [...sections];
      updatedSections[editingSection.index] = {
        ...editingSection.section,
        name: transformedData.name,
        data: transformedData
      };
      
      setSections(updatedSections);
      handleCancelEditSection();
      alert('Section updated! Click "Update Template" to save changes permanently.');
    }
  };

  const handleCancelEditSection = () => {
    setShowRatedCommentBuilder(false);
    setShowAssessmentCommentBuilder(false);
    setShowPersonalisedCommentBuilder(false);
    setShowNextStepsCommentBuilder(false);
    setEditingSection(null);
  };

  const handleExportTemplate = () => {
    exportTemplateToText(templateName, sections, validationErrors);
    alert('Template exported successfully! Check your downloads folder.');
  };

  const handleSaveTemplate = () => {
    if (!templateName.trim()) {
      alert('Please enter a template name');
      return;
    }

    if (sections.length === 0) {
      alert('Please add at least one section to your template');
      return;
    }

    const sectionsWithData = sections.map(section => {
      const currentSectionData = sectionData[section.id] || {};
      const finalData = {
        ...section.data,
        ...currentSectionData
      };
      
      return {
        ...section,
        data: finalData
      };
    });

    if (isEditing) {
      const updatedTemplate = {
        ...editTemplate,
        name: templateName,
        sections: sectionsWithData
      };
      updateTemplate(updatedTemplate);
      alert('Template updated successfully!');
    } else {
      const newTemplate = {
        name: templateName,
        sections: sectionsWithData
      };
      addTemplate(newTemplate);
      alert('Template saved successfully!');
    }

    navigate('/manage-templates');
  };

  // If we're showing a section builder, render that instead
  if (showRatedCommentBuilder && editingSection) {
    return (
      <RatedCommentBuilder
        existingComment={editingSection.section.data}
        onSave={handleSaveEditedSection}
        onCancel={handleCancelEditSection}
      />
    );
  }

  if (showAssessmentCommentBuilder && editingSection) {
    return (
      <AssessmentCommentBuilder
        existingComment={editingSection.section.data}
        onSave={handleSaveEditedSection}
        onCancel={handleCancelEditSection}
      />
    );
  }

  if (showPersonalisedCommentBuilder && editingSection) {
    const sectionData = editingSection.section.data;
    const existingComment = sectionData ? {
      name: sectionData.name || editingSection.section.name || '',
      instruction: sectionData.instruction || '',
      headings: sectionData.headings || [],
      comments: sectionData.categories || {}
    } : undefined;

    return (
      <PersonalisedCommentBuilder
        existingComment={existingComment}
        onSave={handleSaveEditedSection}
        onCancel={handleCancelEditSection}
      />
    );
  }

  if (showNextStepsCommentBuilder && editingSection) {
    const sectionData = editingSection.section.data;
    const existingComment = sectionData ? {
      name: sectionData.name || editingSection.section.name || '',
      headings: sectionData.headings || [],
      comments: sectionData.focusAreas || {}
    } : undefined;

    return (
      <NextStepsCommentBuilder
        existingComment={existingComment}
        onSave={handleSaveEditedSection}
        onCancel={handleCancelEditSection}
      />
    );
  }

  if (showSectionSelector) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', padding: '20px' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <button
            onClick={() => setShowSectionSelector(false)}
            style={{
              backgroundColor: '#6b7280',
              color: 'white',
              padding: '8px 16px',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              marginBottom: '20px',
              cursor: 'pointer'
            }}
          >
            ← Back to Template
          </button>
          <SectionSelector 
            onSelectSection={handleSelectSection}
            onBack={() => setShowSectionSelector(false)}
          />
        </div>
      </div>
    );
  }

  if (showPreview) {
    return (
      <TemplatePreviewModal
        templateName={templateName}
        sections={sections}
        onClose={() => setShowPreview(false)}
      />
    );
  }

  // If we haven't saved the name yet, show name input screen
  if (!isNameSaved) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
        <main style={{ 
          maxWidth: '600px', 
          margin: '0 auto', 
          padding: '40px 20px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          minHeight: '100vh'
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '48px',
            borderRadius: '16px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            textAlign: 'center'
          }}>
            <h1 style={{ 
              fontSize: '28px', 
              fontWeight: 'bold', 
              color: '#1f2937',
              marginBottom: '8px'
            }}>
              Create New Template
            </h1>
            <p style={{ 
              color: '#6b7280', 
              marginBottom: '32px',
              fontSize: '16px'
            }}>
              Start by giving your template a descriptive name
            </p>

            <div style={{ marginBottom: '24px' }}>
              <input
                type="text"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="Enter template name (e.g., 'Year 3 Reading Report')"
                style={{
                  width: '100%',
                  padding: '16px',
                  fontSize: '16px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && templateName.trim()) {
                    handleSaveName();
                  }
                }}
                autoFocus
              />
            </div>

            <button
              onClick={handleSaveName}
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
                width: '100%'
              }}
            >
              Continue to Add Sections
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      {/* Header */}
      <div style={{ 
        backgroundColor: 'white', 
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        padding: '16px 24px'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          <div>
            <h1 style={{ 
              fontSize: '20px', 
              fontWeight: '600', 
              color: '#111827',
              margin: '0 0 4px 0'
            }}>
              {isEditing ? 'Edit Template' : 'Create Template'}: {templateName}
            </h1>
            <p style={{ 
              color: '#6b7280', 
              margin: 0,
              fontSize: '14px'
            }}>
              {sections.length} section{sections.length !== 1 ? 's' : ''} added
              {validationErrors.length > 0 && (
                <span style={{ color: '#ef4444', marginLeft: '8px' }}>
                  • {validationErrors.length} issue{validationErrors.length !== 1 ? 's' : ''} found
                </span>
              )}
            </p>
          </div>
          
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
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
                fontWeight: '500',
                cursor: sections.length > 0 ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
              title="Export template structure to text file for review"
            >
              📄 Export Template
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
                fontWeight: '500',
                cursor: sections.length > 0 ? 'pointer' : 'not-allowed'
              }}
              title="Preview what reports will look like"
            >
              👀 Preview
            </button>
            
            <Link 
              to="/manage-templates"
              style={{
                backgroundColor: '#6b7280',
                color: 'white',
                padding: '8px 16px',
                borderRadius: '6px',
                textDecoration: 'none',
                fontSize: '14px'
              }}
            >
              Cancel
            </Link>
            
            <button
              onClick={handleSaveTemplate}
              disabled={sections.length === 0}
              style={{
                backgroundColor: sections.length > 0 ? '#10b981' : '#9ca3af',
                color: 'white',
                padding: '8px 16px',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: sections.length > 0 ? 'pointer' : 'not-allowed'
              }}
            >
              {isEditing ? 'Update Template' : 'Save Template'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto', 
        padding: '24px',
        display: 'flex',
        gap: '24px'
      }}>
        
        {/* Left Column - Template Builder */}
        <div style={{ flex: '2' }}>
          <TemplateValidationPanel validationErrors={validationErrors} />
          
          <TemplateSectionList
            sections={sections}
            sectionData={sectionData}
            onMoveSection={handleMoveSection}
            onEditSection={handleEditSection}
            onRemoveSection={handleRemoveSection}
            onUpdateSectionData={updateSectionData}
            onAddSection={() => setShowSectionSelector(true)}
          />
        </div>
        
        {/* Right Column - Quick Tools */}
        <div style={{ width: '300px' }}>
          <div style={{ position: 'sticky', top: '20px' }}>
            <TemplateHealthDashboard 
              sectionsCount={sections.length}
              validationErrors={validationErrors}
            />
            
            <TemplateQuickActions
              sectionsCount={sections.length}
              onAddSection={() => setShowSectionSelector(true)}
              onShowPreview={() => setShowPreview(true)}
              onExportTemplate={handleExportTemplate}
            />
            
            {/* Template Tips */}
            <div style={{
              backgroundColor: '#f0f9ff',
              border: '1px solid #bfdbfe',
              borderRadius: '8px',
              padding: '16px'
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
      </div>
    </div>
  );
}