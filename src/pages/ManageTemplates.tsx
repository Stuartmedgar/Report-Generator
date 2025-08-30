import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { Template } from '../types';

export default function ManageTemplates() {
  const navigate = useNavigate();
  const { state, deleteTemplate, addTemplate } = useData();
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleEdit = (template: Template) => {
    // For now, navigate to create template - you might want to add an edit mode
    navigate('/create-template', { state: { editTemplate: template } });
  };

  const handleDuplicate = (template: Template) => {
    const duplicatedTemplate = {
      ...template,
      name: `${template.name} (Copy)`,
      id: undefined, // Remove ID so a new one is generated
      createdAt: undefined // Remove createdAt so a new one is generated
    };
    
    // Remove the old ID and createdAt from the object
    const { id, createdAt, ...templateData } = duplicatedTemplate;
    addTemplate(templateData);
    alert(`Template "${template.name}" has been duplicated as "${duplicatedTemplate.name}"`);
  };

  const handleDelete = (template: Template) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete the template "${template.name}"? This action cannot be undone.`
    );
    if (confirmed) {
      deleteTemplate(template.id);
      alert(`Template "${template.name}" has been deleted.`);
    }
  };

  const handleShare = (template: Template) => {
    // Create export data
    const exportData = {
      template: template,
      exportedAt: new Date().toISOString(),
      exportedBy: 'Report Writing App',
      version: '1.0'
    };

    // Convert to JSON
    const jsonString = JSON.stringify(exportData, null, 2);
    
    // Create downloadable file
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${template.name.replace(/[^a-z0-9]/gi, '_')}_template.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    alert(`Template "${template.name}" has been exported! Share the downloaded file with others.`);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file type
    if (!file.name.endsWith('.json')) {
      alert('Please select a valid template file (.json)');
      return;
    }

    // Read file
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const result = e.target?.result as string;
        const importData = JSON.parse(result);
        
        // Validate import data structure
        if (!importData.template || !importData.template.name || !importData.template.sections) {
          throw new Error('Invalid template file format');
        }

        const importedTemplate = importData.template;
        
        // Check if template with same name already exists
        const existingTemplate = state.templates.find(t => t.name === importedTemplate.name);
        
        let templateName = importedTemplate.name;
        if (existingTemplate) {
          const shouldReplace = window.confirm(
            `A template named "${importedTemplate.name}" already exists. Do you want to replace it (OK) or import as a copy (Cancel)?`
          );
          
          if (shouldReplace) {
            // Delete existing template
            deleteTemplate(existingTemplate.id);
          } else {
            // Create a copy with modified name
            templateName = `${importedTemplate.name} (Imported)`;
          }
        }

        // Create template data without ID and createdAt (will be auto-generated)
        const { id, createdAt, ...templateData } = importedTemplate;
        const newTemplateData = {
          ...templateData,
          name: templateName
        };

        // Add the imported template
        addTemplate(newTemplateData);
        
        alert(`Template "${templateName}" has been imported successfully!`);
        
      } catch (error) {
        console.error('Import error:', error);
        alert('Error importing template. Please check that you selected a valid template file.');
      } finally {
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        setIsImporting(false);
      }
    };
    
    reader.onerror = () => {
      alert('Error reading file. Please try again.');
      setIsImporting(false);
    };
    
    setIsImporting(true);
    reader.readAsText(file);
  };

  return (
    <div style={{ 
      padding: '20px', 
      maxWidth: '1000px', 
      margin: '0 auto',
      fontFamily: 'Arial, sans-serif'
    }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <h1 style={{ 
          fontSize: '24px', 
          fontWeight: 'bold', 
          color: '#1f2937',
          margin: 0 
        }}>
          Manage Templates
        </h1>
        <Link 
          to="/" 
          style={{
            backgroundColor: '#6b7280',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '6px',
            textDecoration: 'none',
            fontSize: '14px'
          }}
        >
          Back to Home
        </Link>
      </div>

      {/* Import Template Section */}
      <div style={{
        backgroundColor: '#f0f9ff',
        border: '2px solid #3b82f6',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '24px'
      }}>
        <h3 style={{ 
          fontSize: '18px', 
          fontWeight: '600', 
          color: '#1e40af',
          margin: '0 0 8px 0'
        }}>
          📥 Import Template
        </h3>
        <p style={{ 
          color: '#1e40af', 
          fontSize: '14px',
          margin: '0 0 16px 0'
        }}>
          Import a template file that was shared by someone else. Templates are saved as .json files.
        </p>
        
        <button
          onClick={handleImportClick}
          disabled={isImporting}
          style={{
            backgroundColor: isImporting ? '#9ca3af' : '#3b82f6',
            color: 'white',
            padding: '12px 24px',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: isImporting ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          {isImporting ? '⏳ Importing...' : '📁 Select Template File'}
        </button>
        
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
      </div>

      {/* Templates List */}
      <div style={{
        backgroundColor: 'white',
        border: '2px solid #e5e7eb',
        borderRadius: '12px',
        padding: '24px'
      }}>
        <h2 style={{ 
          fontSize: '20px', 
          fontWeight: '600', 
          color: '#111827',
          marginBottom: '20px'
        }}>
          Your Templates ({state.templates.length})
        </h2>

        {state.templates.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '48px',
            color: '#9ca3af'
          }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>📋</div>
            <h3 style={{ fontSize: '18px', fontWeight: '600', margin: '0 0 8px 0' }}>
              No Templates Yet
            </h3>
            <p style={{ margin: '0 0 24px 0' }}>
              Create your first template to get started, or import one from a colleague.
            </p>
            <Link 
              to="/create-template"
              style={{
                backgroundColor: '#10b981',
                color: 'white',
                padding: '12px 24px',
                borderRadius: '8px',
                textDecoration: 'none',
                fontSize: '16px',
                fontWeight: '600'
              }}
            >
              📝 Create Your First Template
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {state.templates.map((template) => (
              <div key={template.id} style={{
                border: '2px solid #e5e7eb',
                borderRadius: '12px',
                padding: '20px',
                backgroundColor: '#fafafa'
              }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'flex-start',
                  marginBottom: '12px'
                }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ 
                      fontSize: '20px', 
                      fontWeight: '600', 
                      color: '#111827',
                      margin: '0 0 8px 0'
                    }}>
                      {template.name}
                    </h3>
                    <div style={{
                      display: 'flex',
                      gap: '16px',
                      fontSize: '14px',
                      color: '#6b7280',
                      marginBottom: '8px'
                    }}>
                      <span>📋 {template.sections.length} sections</span>
                      <span>📅 Created: {new Date(template.createdAt).toLocaleDateString()}</span>
                    </div>
                    
                    {/* Section types preview */}
                    <div style={{ 
                      display: 'flex', 
                      flexWrap: 'wrap', 
                      gap: '6px'
                    }}>
                      {template.sections.map((section, index) => (
                        <span key={index} style={{
                          backgroundColor: getSectionColor(section.type),
                          color: 'white',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: '500'
                        }}>
                          {getSectionDisplayName(section.type)}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div style={{ 
                  display: 'flex', 
                  gap: '8px', 
                  flexWrap: 'wrap' 
                }}>
                  <button
                    onClick={() => handleEdit(template)}
                    style={{
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
                    ✏️ Edit
                  </button>
                  
                  <button
                    onClick={() => handleShare(template)}
                    style={{
                      backgroundColor: '#10b981',
                      color: 'white',
                      padding: '8px 16px',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer'
                    }}
                  >
                    📤 Share
                  </button>
                  
                  <button
                    onClick={() => handleDuplicate(template)}
                    style={{
                      backgroundColor: '#f59e0b',
                      color: 'white',
                      padding: '8px 16px',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer'
                    }}
                  >
                    📋 Duplicate
                  </button>
                  
                  <button
                    onClick={() => handleDelete(template)}
                    style={{
                      backgroundColor: '#ef4444',
                      color: 'white',
                      padding: '8px 16px',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer'
                    }}
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Helper functions for section styling
function getSectionColor(type: string) {
  const colors = {
    'rated-comment': '#3b82f6',
    'standard-comment': '#10b981',
    'assessment-comment': '#f59e0b',
    'personalised-comment': '#8b5cf6',
    'optional-additional-comment': '#ef4444',
    'next-steps': '#06b6d4',
    'new-line': '#6b7280'
  };
  return colors[type as keyof typeof colors] || '#6b7280';
}

function getSectionDisplayName(type: string) {
  const names = {
    'rated-comment': 'Rated',
    'standard-comment': 'Standard',
    'assessment-comment': 'Assessment',
    'personalised-comment': 'Personalised',
    'optional-additional-comment': 'Optional',
    'next-steps': 'Next Steps',
    'new-line': 'Line Break'
  };
  return names[type as keyof typeof names] || type;
}