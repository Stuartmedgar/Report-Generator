import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { Template } from '../types';

export default function ManageTemplates() {
  const navigate = useNavigate();
  const { state, deleteTemplate, addTemplate } = useData();
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Google Drive folder URL - Replace this with your actual folder URL
  const TEMPLATE_LIBRARY_URL = 'https://drive.google.com/drive/folders/1Kc0O9QSqpHCBUuDfcMcjk2gAfNtbPPnf?usp=drive_link';

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

  const handleBrowseTemplates = () => {
    window.open(TEMPLATE_LIBRARY_URL, '_blank', 'noopener,noreferrer');
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
              Manage Templates
            </h1>
            <p style={{ 
              color: '#6b7280', 
              margin: '8px 0 0 0',
              fontSize: '16px'
            }}>
              Edit, share, and organize your report templates
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
            
            <Link to="/create-template" style={{ textDecoration: 'none' }}>
              <button style={{
                backgroundColor: '#10b981',
                color: 'white',
                padding: '12px 20px',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer'
              }}>
                + Create Template
              </button>
            </Link>

            {/* NEW: Browse Templates Button */}
            <button
              onClick={handleBrowseTemplates}
              style={{
                backgroundColor: '#8b5cf6',
                color: 'white',
                padding: '12px 20px',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
              title="Browse our template library on Google Drive"
            >
              📚 Browse Templates
            </button>

            <button
              onClick={handleImportClick}
              disabled={isImporting}
              style={{
                backgroundColor: isImporting ? '#9ca3af' : '#3b82f6',
                color: 'white',
                padding: '12px 20px',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: isImporting ? 'not-allowed' : 'pointer'
              }}
            >
              Import Template
            </button>
          </div>
        </div>
      </header>

      <main style={{ 
        maxWidth: '1200px', 
        margin: '0 auto', 
        padding: '32px 24px' 
      }}>

        {/* Hidden file input for imports */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />

        {/* NEW: Template Library Info Section */}
        <div style={{
          backgroundColor: '#fefce8',
          border: '2px solid #facc15',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '24px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            flexWrap: 'wrap'
          }}>
            <div style={{ flex: 1, minWidth: '300px' }}>
              <h3 style={{ 
                fontSize: '18px', 
                fontWeight: '600', 
                color: '#92400e',
                margin: '0 0 8px 0',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                📚 Template Library
              </h3>
              <p style={{ 
                color: '#92400e', 
                fontSize: '14px',
                margin: '0 0 16px 0',
                lineHeight: '1.5'
              }}>
                Access our growing collection of ready-made templates for all subjects and year groups. 
                Find templates for Science, Maths, English, Languages, and more!
              </p>
            </div>
            <div>
              <button
                onClick={handleBrowseTemplates}
                style={{
                  backgroundColor: '#92400e',
                  color: 'white',
                  padding: '12px 24px',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  whiteSpace: 'nowrap'
                }}
              >
                🔗 Open Template Library
              </button>
            </div>
          </div>
        </div>

        {/* Templates List */}
        <div style={{
          backgroundColor: 'white',
          padding: '32px',
          borderRadius: '12px',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
        }}>
          <h2 style={{ 
            fontSize: '20px', 
            fontWeight: '600', 
            color: '#111827',
            marginBottom: '16px'
          }}>
            Your Templates ({state.templates.length})
          </h2>

          {state.templates.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '40px 20px',
              color: '#6b7280'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📝</div>
              <h3 style={{ 
                fontSize: '18px', 
                fontWeight: '600', 
                color: '#374151',
                marginBottom: '8px'
              }}>
                No templates yet
              </h3>
              <p style={{ marginBottom: '24px' }}>
                Get started by creating your first template or browsing our template library.
              </p>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <Link to="/create-template" style={{ textDecoration: 'none' }}>
                  <button style={{
                    backgroundColor: '#10b981',
                    color: 'white',
                    padding: '12px 24px',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}>
                    + Create Your First Template
                  </button>
                </Link>
                <button
                  onClick={handleBrowseTemplates}
                  style={{
                    backgroundColor: '#8b5cf6',
                    color: 'white',
                    padding: '12px 24px',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  Browse Template Library
                </button>
              </div>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gap: '16px'
            }}>
              {state.templates.map((template) => (
                <div
                  key={template.id}
                  style={{
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '24px',
                    backgroundColor: '#f9fafb'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: '16px',
                    flexWrap: 'wrap'
                  }}>
                    <div style={{ flex: 1, minWidth: '200px' }}>
                      <h3 style={{
                        fontSize: '18px',
                        fontWeight: '600',
                        color: '#111827',
                        marginBottom: '8px'
                      }}>
                        {template.name}
                      </h3>
                      <p style={{
                        color: '#6b7280',
                        fontSize: '14px',
                        marginBottom: '8px'
                      }}>
                        {template.sections.length} sections • Created {new Date(template.createdAt).toLocaleDateString()}
                      </p>
                      <div style={{
                        display: 'flex',
                        gap: '8px',
                        flexWrap: 'wrap'
                      }}>
                        {template.sections.slice(0, 3).map((section, index) => (
                          <span
                            key={index}
                            style={{
                              backgroundColor: '#e0e7ff',
                              color: '#3730a3',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              fontSize: '12px'
                            }}
                          >
                            {section.type.replace('-', ' ')}
                          </span>
                        ))}
                        {template.sections.length > 3 && (
                          <span style={{
                            color: '#6b7280',
                            fontSize: '12px'
                          }}>
                            +{template.sections.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                    
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
                        📤 Export
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
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Help Section */}
        <div style={{
          backgroundColor: '#f0f9ff',
          border: '2px solid #3b82f6',
          borderRadius: '12px',
          padding: '20px',
          textAlign: 'center',
          marginTop: '24px'
        }}>
          <h3 style={{ 
            fontSize: '18px', 
            fontWeight: '600', 
            color: '#1e40af',
            margin: '0 0 8px 0'
          }}>
            💡 Template Management Tips
          </h3>
          <p style={{ 
            color: '#1e40af', 
            fontSize: '14px',
            margin: '0 0 16px 0'
          }}>
            Edit templates to customize content, share them with colleagues, or duplicate them to create variations. 
            You can also import templates that others have shared with you.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/write-reports" style={{ textDecoration: 'none' }}>
              <button style={{
                backgroundColor: '#3b82f6',
                color: 'white',
                padding: '8px 16px',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer'
              }}>
                Start Writing Reports
              </button>
            </Link>
            <Link to="/class-management" style={{ textDecoration: 'none' }}>
              <button style={{
                backgroundColor: '#10b981',
                color: 'white',
                padding: '8px 16px',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer'
              }}>
                Manage Classes
              </button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}