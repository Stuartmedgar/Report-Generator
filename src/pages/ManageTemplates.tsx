import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { Template } from '../types';
import MobileManageTemplates from '../components/MobileManageTemplates';

export default function ManageTemplates() {
  const navigate = useNavigate();
  const { state, deleteTemplate, addTemplate } = useData();
  const [isImporting, setIsImporting] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [pronounModal, setPronounModal] = useState<{ template: Template } | null>(null);
  const [pronounTarget, setPronounTarget] = useState<'he/his' | 'she/her' | 'they/their'>('she/her');
  const [isDuplicatingPronoun, setIsDuplicatingPronoun] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Google Drive folder URL - Replace this with your actual folder URL
  const TEMPLATE_LIBRARY_URL = 'https://drive.google.com/drive/folders/1Kc0O9QSqpHCBUuDfcMcjk2gAfNtbPPnf?usp=drive_link';

  // Mobile detection
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  // If mobile, render the dedicated mobile component
  if (isMobile) {
    return <MobileManageTemplates />;
  }

  const handleEdit = (template: Template) => {
    // For now, navigate to create template - you might want to add an edit mode
    navigate('/create-template', { state: { editTemplate: template } });
  };

  const handleReview = (template: Template) => {
    navigate('/template-review', { state: { template: { name: template.name, sections: template.sections }, isEditing: true, templateId: template.id } });
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

  const handlePronounDuplicate = async (template: Template, targetPronoun: 'he/his' | 'she/her' | 'they/their') => {
    setIsDuplicatingPronoun(true);
    const pronounMap: Record<string, Record<string, string>> = {
      'he/his':    { he: 'he', him: 'him', his: 'his', himself: 'himself', He: 'He', Him: 'Him', His: 'His', Himself: 'Himself' },
      'she/her':   { he: 'she', him: 'her', his: 'her', himself: 'herself', He: 'She', Him: 'Her', His: 'Her', Himself: 'Herself' },
      'they/their':{ he: 'they', him: 'them', his: 'their', himself: 'themselves', He: 'They', Him: 'Them', His: 'Their', Himself: 'Themselves' },
    };
    const map = pronounMap[targetPronoun];

    const replacePronouns = (text: string): string => {
      let t = text;
      // Order matters — longer words first to avoid partial replacement
      Object.entries(map).forEach(([from, to]) => {
        t = t.replace(new RegExp(`\\b${from}\\b`, 'g'), to);
      });
      return t;
    };

    const rewriteSections = (sections: any[]): any[] => {
      return sections.map(section => {
        if (section.type === 'qualities' || section.type === 'rated-comment') {
          const comments: Record<string, string[]> = {};
          Object.entries(section.data?.comments || {}).forEach(([heading, options]) => {
            comments[replacePronouns(heading)] = (options as string[]).map(replacePronouns);
          });
          return { ...section, data: { ...section.data, comments } };
        }
        if (section.type === 'next-steps') {
          const focusAreas: Record<string, string[]> = {};
          Object.entries(section.data?.focusAreas || {}).forEach(([heading, options]) => {
            focusAreas[replacePronouns(heading)] = (options as string[]).map(replacePronouns);
          });
          return { ...section, data: { ...section.data, focusAreas } };
        }
        if (section.type === 'assessment-comment') {
          const comments: Record<string, string[]> = {};
          Object.entries(section.data?.comments || {}).forEach(([level, options]) => {
            comments[level] = (options as string[]).map(replacePronouns);
          });
          return { ...section, data: { ...section.data, comments } };
        }
        if (section.type === 'personalised-comment') {
          const categories: Record<string, string[]> = {};
          Object.entries(section.data?.categories || {}).forEach(([cat, options]) => {
            categories[cat] = (options as string[]).map(replacePronouns);
          });
          return { ...section, data: { ...section.data, categories } };
        }
        if (section.type === 'standard-comment') {
          return { ...section, data: { ...section.data, content: replacePronouns(section.data?.content || '') } };
        }
        return section;
      });
    };

    const pronounLabel = targetPronoun === 'he/his' ? 'He/His' : targetPronoun === 'she/her' ? 'She/Her' : 'They/Their';
    const heLed = targetPronoun === 'he/his' ? 'He-led' : targetPronoun === 'she/her' ? 'She-led' : 'They-led';
    const newName = template.name.replace(/He\/His|She\/Her|They\/Their|He|She|They/i, '').trim() + ` — ${pronounLabel}`;
    const renameSection = (name: string): string =>
      name.replace(/— He-led/g, `— ${heLed}`).replace(/— She-led/g, `— ${heLed}`).replace(/— They-led/g, `— ${heLed}`);
    const renamedSections = rewriteSections(template.sections).map((s: any) => ({ ...s, name: renameSection(s.name || '') }));
    const { id, createdAt, ...templateData } = template;
    addTemplate({ ...templateData, name: newName, sections: renamedSections });
    setIsDuplicatingPronoun(false);
    setPronounModal(null);
    alert(`Template duplicated as "${newName}" with ${pronounLabel} pronouns.`);
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

            {/* NEW: Import from Reports button */}
            <Link to="/import-template" style={{ textDecoration: 'none' }}>
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
                🪄 Import from Reports
              </button>
            </Link>

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
              Browse Templates
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

        {/* Pronoun Duplicate Modal */}
      {pronounModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '28px', maxWidth: '460px', width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 6px 0', fontSize: '18px', fontWeight: '700', color: '#111827' }}>🔄 Duplicate with Different Pronouns</h3>
            <p style={{ margin: '0 0 20px 0', fontSize: '13px', color: '#6b7280', lineHeight: '1.5' }}>
              Creates a copy of <strong>"{pronounModal.template.name}"</strong> with all pronouns changed. Every he/his/him/himself will be replaced throughout.
            </p>
            <div style={{ marginBottom: '20px' }}>
              <p style={{ margin: '0 0 10px 0', fontSize: '13px', fontWeight: '600', color: '#374151' }}>Target pronoun set:</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {(['he/his', 'she/her', 'they/their'] as const).map(p => (
                  <button key={p} onClick={() => setPronounTarget(p)}
                    style={{ padding: '12px 16px', border: pronounTarget === p ? '2px solid #ec4899' : '2px solid #e5e7eb', borderRadius: '8px', backgroundColor: pronounTarget === p ? '#fdf2f8' : 'white', cursor: 'pointer', textAlign: 'left' }}>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: pronounTarget === p ? '#be185d' : '#111827' }}>
                      {p === 'he/his' ? 'He / His / Him' : p === 'she/her' ? 'She / Her' : 'They / Their / Them'}
                    </div>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px', fontStyle: 'italic' }}>
                      {p === 'he/his' ? 'He works hard. His effort is excellent.' : p === 'she/her' ? 'She works hard. Her effort is excellent.' : 'They work hard. Their effort is excellent.'}
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setPronounModal(null)} style={{ flex: 1, padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px', backgroundColor: '#f3f4f6', color: '#374151', fontSize: '14px', fontWeight: '500', cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={() => handlePronounDuplicate(pronounModal.template, pronounTarget)} disabled={isDuplicatingPronoun}
                style={{ flex: 1, padding: '12px', border: 'none', borderRadius: '8px', backgroundColor: isDuplicatingPronoun ? '#9ca3af' : '#ec4899', color: 'white', fontSize: '14px', fontWeight: '600', cursor: isDuplicatingPronoun ? 'not-allowed' : 'pointer' }}>
                {isDuplicatingPronoun ? 'Duplicating...' : '🔄 Create Copy'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden file input for imports */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />

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
                Get started by creating your first template or browse our template library.
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
                        onClick={() => handleReview(template)}
                        style={{
                          backgroundColor: '#8b5cf6',
                          color: 'white',
                          padding: '8px 16px',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '14px',
                          fontWeight: '500',
                          cursor: 'pointer'
                        }}
                      >
                        👁 Review & Edit
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
                        onClick={() => { setPronounModal({ template }); setPronounTarget('she/her'); }}
                        style={{
                          backgroundColor: '#ec4899',
                          color: 'white',
                          padding: '8px 16px',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '14px',
                          fontWeight: '500',
                          cursor: 'pointer'
                        }}
                      >
                        🔄 Change Pronouns
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
            <Link to="/create-template" style={{ textDecoration: 'none' }}>
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
                Create New Template
              </button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}