// src/pages/CreateTemplate.tsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { TemplateSection, SectionType } from '../types';
import SectionSelector from '../components/SectionSelector';
import RatedCommentBuilder from '../components/RatedCommentBuilder';
import AssessmentCommentBuilder from '../components/AssessmentCommentBuilder';
import PersonalisedCommentBuilder from '../components/PersonalisedCommentBuilder';
import NextStepsCommentBuilder from '../components/NextStepsCommentBuilder';
import QualitiesCommentBuilder from '../components/QualitiesCommentBuilder';
import MobileCreateTemplate from '../components/MobileCreateTemplate';
import BuildAsYouGo from '../components/BuildAsYouGo';
import QuickStartWizard from '../components/QuickStartWizard';

const CreateTemplate: React.FC = () => {
  const { state, addTemplate, updateTemplate } = useData();
  const navigate = useNavigate();
  const location = useLocation();
  const editTemplate = location.state?.editTemplate;
  const isEditing = !!editTemplate;

  // Method passed in via navigation state — determines which flow to start
  const preselectedMethod = location.state?.method as 'build-as-you-go' | 'building' | 'quick-start' | undefined;

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [templateName, setTemplateName] = useState(editTemplate?.name || '');
  const [sections, setSections] = useState<TemplateSection[]>(editTemplate?.sections || []);
  const [sectionData, setSectionData] = useState<Record<string, any>>(editTemplate?.sectionData || {});

  // When editing, go straight to manual builder.
  // When creating with a preselected method, go to that method.
  // When creating without a method (e.g. direct /create-template nav), go to quick-start as default.
  const [step, setStep] = useState<'building' | 'build-as-you-go' | 'quick-start'>(
    isEditing ? 'building' : (preselectedMethod === 'building' ? 'building' : preselectedMethod === 'build-as-you-go' ? 'build-as-you-go' : 'quick-start')
  );

  const [showSectionSelector, setShowSectionSelector] = useState(false);
  const [showRatedCommentBuilder, setShowRatedCommentBuilder] = useState(false);
  const [showAssessmentCommentBuilder, setShowAssessmentCommentBuilder] = useState(false);
  const [showPersonalisedCommentBuilder, setShowPersonalisedCommentBuilder] = useState(false);
  const [showNextStepsCommentBuilder, setShowNextStepsCommentBuilder] = useState(false);
  const [showStandardCommentEditor, setShowStandardCommentEditor] = useState(false);
  const [showQualitiesCommentBuilder, setShowQualitiesCommentBuilder] = useState(false);
  const [editingSection, setEditingSection] = useState<{section: TemplateSection, index: number} | null>(null);
  const [standardCommentName, setStandardCommentName] = useState('');
  const [standardCommentContent, setStandardCommentContent] = useState('');

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (editTemplate) {
      setTemplateName(editTemplate.name);
      setSections(editTemplate.sections || []);
      setSectionData(editTemplate.sectionData || {});
    }
  }, [editTemplate]);

  if (isMobile && !isEditing) {
    return <MobileCreateTemplate />;
  }

  // ─── SECTION MANAGEMENT ───────────────────────────────────────────────────

  const handleSectionAdded = (newSection: TemplateSection) => {
    setSections([...sections, newSection]);
    setShowSectionSelector(false);
  };

  const handleAddNewLine = () => {
    const newLineSection: TemplateSection = {
      id: Date.now().toString(),
      type: 'new-line' as SectionType,
      name: 'New Line',
      data: {}
    };
    setSections([...sections, newLineSection]);
  };

  const handleAddOptionalComment = () => {
    const optionalSection: TemplateSection = {
      id: Date.now().toString(),
      type: 'optional-additional-comment' as SectionType,
      name: 'Additional Comments',
      data: {}
    };
    setSections([...sections, optionalSection]);
  };

  const handleEditSection = (section: TemplateSection, index: number) => {
    if (section.type !== 'qualities') setEditingSection({ section, index });
    if (section.type === 'rated-comment') setShowRatedCommentBuilder(true);
    else if (section.type === 'assessment-comment') setShowAssessmentCommentBuilder(true);
    else if (section.type === 'personalised-comment') setShowPersonalisedCommentBuilder(true);
    else if (section.type === 'next-steps') setShowNextStepsCommentBuilder(true);
    else if (section.type === 'standard-comment') {
      setStandardCommentName(section.name);
      setStandardCommentContent(section.data?.comment || '');
      setShowStandardCommentEditor(true);
    } else if (section.type === 'qualities') {
      const shapedData = {
        ...section.data,
        comments: section.data?.comments || {}
      };
      setEditingSection({ section: { ...section, data: shapedData }, index });
      setShowQualitiesCommentBuilder(true);
    }
  };

  const handleSaveSection = (updatedData: any) => {
    if (!editingSection) return;
    const updatedSections = [...sections];
    let newData = updatedData;
    if (editingSection.section.type === 'qualities') {
      newData = updatedData.data ? updatedData.data : updatedData;
    }
    const _newData = newData;
    updatedSections[editingSection.index] = {
      ...editingSection.section,
      name: updatedData.name || editingSection.section.name,
      data: _newData
    };
    setSections(updatedSections);
    setEditingSection(null);
    setShowRatedCommentBuilder(false);
    setShowAssessmentCommentBuilder(false);
    setShowPersonalisedCommentBuilder(false);
    setShowNextStepsCommentBuilder(false);
    setShowStandardCommentEditor(false);
    setShowQualitiesCommentBuilder(false);
  };

  const handleCancelEdit = () => {
    setEditingSection(null);
    setShowRatedCommentBuilder(false);
    setShowAssessmentCommentBuilder(false);
    setShowPersonalisedCommentBuilder(false);
    setShowNextStepsCommentBuilder(false);
    setShowStandardCommentEditor(false);
    setShowQualitiesCommentBuilder(false);
  };

  const handleSaveStandardCommentEdit = () => {
    if (!editingSection) return;
    const updatedSections = [...sections];
    updatedSections[editingSection.index] = {
      ...editingSection.section,
      name: standardCommentName,
      data: { comment: standardCommentContent }
    };
    setSections(updatedSections);
    setEditingSection(null);
    setShowStandardCommentEditor(false);
    setStandardCommentName('');
    setStandardCommentContent('');
  };

  const handleDeleteSection = (index: number) => {
    setSections(sections.filter((_, i) => i !== index));
  };

  const handleMoveSection = (index: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === sections.length - 1)) return;
    const newSections = [...sections];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newSections[index], newSections[targetIndex]] = [newSections[targetIndex], newSections[index]];
    setSections(newSections);
  };

  const isSectionEditable = (type: string): boolean =>
    ['rated-comment', 'assessment-comment', 'personalised-comment', 'next-steps', 'qualities', 'standard-comment'].includes(type);

  const handleSaveTemplate = () => {
    if (!templateName.trim()) { alert('Please enter a template name'); return; }
    if (sections.length === 0) { alert('Please add at least one section to your template'); return; }
    const template = { name: templateName, sections, sectionData };
    if (isEditing && editTemplate) {
      updateTemplate({ ...editTemplate, ...template });
      alert(`Template "${templateName}" has been updated successfully!`);
    } else {
      addTemplate(template);
      alert(`Template "${templateName}" has been created successfully!`);
    }
    navigate('/manage-templates');
  };

  // ─── QUICK START ──────────────────────────────────────────────────────────

  if (step === 'quick-start') {
    return (
      <QuickStartWizard
        templateName={templateName}
        onComplete={(builtTemplate) => {
          navigate('/template-review', {
            state: {
              template: builtTemplate,
              isEditing: false,
            },
          });
        }}
        onCancel={() => navigate(-1)}
      />
    );
  }

  // ─── BUILD AS YOU GO (Template Wizard) ────────────────────────────────────

  if (step === 'build-as-you-go') {
    return (
      <BuildAsYouGo
        templateName={templateName}
        classId={location.state?.classId}
        onComplete={(completedSections) => {
          const template = {
            name: templateName,
            sections: completedSections,
            sectionData: {},
          };
          addTemplate(template);
          navigate('/write-reports', {
            state: { preselectedClassId: location.state?.classId }
          });
        }}
        onCancel={() => navigate(-1)}
      />
    );
  }

  // ─── MANUAL BUILDER ───────────────────────────────────────────────────────

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      <header style={{ backgroundColor: 'white', boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)', padding: '24px 32px', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: '600', color: '#111827', margin: 0 }}>
              {isEditing ? `Edit Template: ${templateName}` : `Building: ${templateName}`}
            </h1>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <Link to="/manage-templates" style={{ textDecoration: 'none' }}>
              <button style={{ backgroundColor: '#f3f4f6', color: '#374151', padding: '8px 16px', border: 'none', borderRadius: '6px', fontSize: '14px', cursor: 'pointer' }}>
                Cancel
              </button>
            </Link>
            <button
              onClick={handleSaveTemplate}
              style={{ backgroundColor: '#3b82f6', color: 'white', padding: '8px 20px', border: 'none', borderRadius: '6px', fontSize: '14px', fontWeight: '500', cursor: 'pointer' }}
            >
              {isEditing ? 'Update Template' : 'Save Template'}
            </button>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '32px', alignItems: 'start' }}>

          {/* Section List */}
          <div>
            <div style={{ backgroundColor: 'white', border: '2px solid #e5e7eb', borderRadius: '12px', padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', margin: 0 }}>Template Sections</h2>
                <button
                  onClick={() => setShowSectionSelector(true)}
                  style={{ backgroundColor: '#3b82f6', color: 'white', padding: '8px 16px', border: 'none', borderRadius: '6px', fontSize: '14px', fontWeight: '500', cursor: 'pointer' }}
                >
                  ➕ Add Section
                </button>
              </div>

              {sections.length === 0 ? (
                <div style={{ border: '2px dashed #d1d5db', borderRadius: '8px', padding: '48px', textAlign: 'center', color: '#9ca3af' }}>
                  <p style={{ margin: 0 }}>No sections yet. Add your first section to get started.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {sections.map((section, index) => (
                    <div
                      key={section.id}
                      style={{
                        backgroundColor: '#f9fafb',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        padding: '16px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: '500', color: '#111827', fontSize: '14px' }}>
                          {section.type === 'new-line' ? '— Line Break —' :
                           section.type === 'optional-additional-comment' ? '[ Optional Comment Box ]' :
                           section.name}
                        </div>
                        <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>{section.type}</div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => handleMoveSection(index, 'up')}
                          disabled={index === 0}
                          style={{ backgroundColor: '#f3f4f6', color: '#374151', padding: '4px 8px', border: 'none', borderRadius: '4px', fontSize: '12px', cursor: index === 0 ? 'not-allowed' : 'pointer', opacity: index === 0 ? 0.4 : 1 }}
                        >↑</button>
                        <button
                          onClick={() => handleMoveSection(index, 'down')}
                          disabled={index === sections.length - 1}
                          style={{ backgroundColor: '#f3f4f6', color: '#374151', padding: '4px 8px', border: 'none', borderRadius: '4px', fontSize: '12px', cursor: index === sections.length - 1 ? 'not-allowed' : 'pointer', opacity: index === sections.length - 1 ? 0.4 : 1 }}
                        >↓</button>
                        {isSectionEditable(section.type) && (
                          <button
                            onClick={() => handleEditSection(section, index)}
                            style={{ backgroundColor: '#eff6ff', color: '#3b82f6', padding: '4px 8px', border: 'none', borderRadius: '4px', fontSize: '12px', cursor: 'pointer' }}
                          >Edit</button>
                        )}
                        <button
                          onClick={() => handleDeleteSection(index)}
                          style={{ backgroundColor: '#fef2f2', color: '#ef4444', padding: '4px 8px', border: 'none', borderRadius: '4px', fontSize: '12px', cursor: 'pointer' }}
                        >✕</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
                <button
                  onClick={handleAddNewLine}
                  style={{ backgroundColor: '#f9fafb', color: '#6b7280', padding: '8px 16px', border: '1px dashed #d1d5db', borderRadius: '6px', fontSize: '13px', cursor: 'pointer' }}
                >
                  + Line Break
                </button>
                <button
                  onClick={handleAddOptionalComment}
                  style={{ backgroundColor: '#f9fafb', color: '#6b7280', padding: '8px 16px', border: '1px dashed #d1d5db', borderRadius: '6px', fontSize: '13px', cursor: 'pointer' }}
                >
                  + Optional Comment Box
                </button>
              </div>
            </div>
          </div>

          {/* Template Settings Panel */}
          <div style={{ position: 'sticky', top: '100px' }}>
            <div style={{ backgroundColor: 'white', border: '2px solid #e5e7eb', borderRadius: '12px', padding: '24px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', margin: '0 0 20px 0' }}>Template Settings</h2>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                  Template Name
                </label>
                <input
                  type="text"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="Enter template name..."
                  style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ fontSize: '13px', color: '#6b7280' }}>
                <p style={{ margin: '0 0 8px 0' }}>Sections: {sections.filter(s => s.type !== 'new-line' && s.type !== 'optional-additional-comment').length}</p>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* Section Selector Modal */}
      {showSectionSelector && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <SectionSelector
            onSelectSection={(type, data) => {
              const newSection: TemplateSection = { id: Date.now().toString(), type: type as SectionType, name: data?.name || type, data: data || {} };
              handleSectionAdded(newSection);
            }}
            onCancel={() => setShowSectionSelector(false)}
          />
        </div>
      )}

      {/* Section Edit Modals */}
      {showRatedCommentBuilder && editingSection && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'white', zIndex: 1000, overflow: 'auto' }}>
          <RatedCommentBuilder existingComment={editingSection.section.data} onSave={handleSaveSection} onCancel={handleCancelEdit} />
        </div>
      )}
      {showAssessmentCommentBuilder && editingSection && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'white', zIndex: 1000, overflow: 'auto' }}>
          <AssessmentCommentBuilder existingComment={editingSection.section.data} onSave={handleSaveSection} onCancel={handleCancelEdit} />
        </div>
      )}
      {showPersonalisedCommentBuilder && editingSection && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'white', zIndex: 1000, overflow: 'auto' }}>
          <PersonalisedCommentBuilder existingComment={editingSection.section.data} onSave={handleSaveSection} onCancel={handleCancelEdit} />
        </div>
      )}
      {showNextStepsCommentBuilder && editingSection && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'white', zIndex: 1000, overflow: 'auto' }}>
          <NextStepsCommentBuilder existingComment={editingSection.section.data} onSave={handleSaveSection} onCancel={handleCancelEdit} />
        </div>
      )}
      {showQualitiesCommentBuilder && editingSection && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'white', zIndex: 1000, overflow: 'auto' }}>
          <QualitiesCommentBuilder existingComment={editingSection.section.data} onSave={handleSaveSection} onCancel={handleCancelEdit} />
        </div>
      )}
      {showStandardCommentEditor && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '32px', maxWidth: '500px', width: '100%' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', margin: '0 0 20px 0' }}>Edit Standard Comment</h3>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>Section Name</label>
              <input type="text" value={standardCommentName} onChange={e => setStandardCommentName(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }} />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>Content</label>
              <textarea value={standardCommentContent} onChange={e => setStandardCommentContent(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', minHeight: '120px', resize: 'vertical', boxSizing: 'border-box' }} />
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button onClick={handleCancelEdit} style={{ backgroundColor: '#f3f4f6', color: '#374151', padding: '8px 16px', border: 'none', borderRadius: '6px', fontSize: '14px', cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleSaveStandardCommentEdit} style={{ backgroundColor: '#3b82f6', color: 'white', padding: '8px 16px', border: 'none', borderRadius: '6px', fontSize: '14px', cursor: 'pointer' }}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateTemplate;