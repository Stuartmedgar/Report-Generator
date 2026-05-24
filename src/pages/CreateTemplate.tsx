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
import PageNav from '../components/PageNav';

const CreateTemplate: React.FC = () => {
  const { state, addTemplate, updateTemplate } = useData();
  const navigate = useNavigate();
  const location = useLocation();
  const editTemplate = location.state?.editTemplate;
  const isEditing = !!editTemplate;

  const preselectedMethod = location.state?.method as 'build-as-you-go' | 'building' | undefined;

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [templateName, setTemplateName] = useState(editTemplate?.name || '');
  const [sections, setSections] = useState<TemplateSection[]>(editTemplate?.sections || []);
  const [sectionData, setSectionData] = useState<Record<string, any>>(editTemplate?.sectionData || {});

  const [step, setStep] = useState<'naming' | 'method' | 'building' | 'build-as-you-go'>(
    !isEditing ? 'naming' : 'building'
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
    if (showSectionSelector || showRatedCommentBuilder || showAssessmentCommentBuilder ||
        showPersonalisedCommentBuilder || showNextStepsCommentBuilder || showStandardCommentEditor ||
        showQualitiesCommentBuilder) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [showSectionSelector, showRatedCommentBuilder, showAssessmentCommentBuilder,
      showPersonalisedCommentBuilder, showNextStepsCommentBuilder, showStandardCommentEditor,
      showQualitiesCommentBuilder]);

  if (isMobile) return <MobileCreateTemplate />;

  const handleAddSection = (type: string, data: any) => {
    const newSection: TemplateSection = {
      id: `${Date.now()}-${Math.random()}`,
      type: type as SectionType,
      name: data.name,
      data
    };
    setSections(prev => [...prev, newSection]);
    setSectionData(prev => ({ ...prev, [newSection.id]: data }));
    setShowSectionSelector(false);
    setShowRatedCommentBuilder(false);
    setShowAssessmentCommentBuilder(false);
    setShowPersonalisedCommentBuilder(false);
    setShowNextStepsCommentBuilder(false);
    setShowStandardCommentEditor(false);
    setShowQualitiesCommentBuilder(false);
  };

  const handleEditSection = (section: TemplateSection, index: number) => {
    setEditingSection({ section, index });
    switch(section.type) {
      case 'rated-comment': setShowRatedCommentBuilder(true); break;
      case 'assessment-comment': setShowAssessmentCommentBuilder(true); break;
      case 'personalised-comment': setShowPersonalisedCommentBuilder(true); break;
      case 'next-steps': setShowNextStepsCommentBuilder(true); break;
      case 'qualities': setShowQualitiesCommentBuilder(true); break;
      case 'standard-comment':
        setStandardCommentName(section.name || '');
        setStandardCommentContent(section.data?.comment || section.data?.content || '');
        setShowStandardCommentEditor(true);
        break;
    }
  };

  const handleSaveEditedSection = (updatedData: any) => {
    if (!editingSection) return;
    const updatedSections = [...sections];
    const newData = updatedData.name && updatedData.data ? updatedData.data : updatedData;
    updatedSections[editingSection.index] = {
      ...editingSection.section,
      name: updatedData.name || editingSection.section.name,
      data: newData
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

  // ─── NAMING STEP ──────────────────────────────────────────────────────────

  if (step === 'naming') {
    const handleContinue = () => {
      if (preselectedMethod) {
        setStep(preselectedMethod);
      } else {
        setStep('method');
      }
    };

    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', display: 'flex', flexDirection: 'column' }}>
        <PageNav />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
          <div style={{ maxWidth: '600px', width: '100%', backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', padding: '48px' }}>
            <h1 style={{ fontSize: '32px', fontWeight: '700', color: '#111827', marginBottom: '12px', textAlign: 'center' }}>
              Name Your Template
            </h1>
            <p style={{ color: '#6b7280', marginBottom: '32px', fontSize: '16px', textAlign: 'center' }}>
              Choose a descriptive name for your report template
            </p>
            <div style={{ marginBottom: '32px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                Template Name
              </label>
              <input
                type="text"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && templateName.trim()) handleContinue(); }}
                placeholder="e.g., S3 PE Report, Primary Mathematics"
                style={{ width: '100%', padding: '12px 16px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '16px', outline: 'none', boxSizing: 'border-box' }}
                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                autoFocus
              />
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <Link to="/manage-templates" style={{ textDecoration: 'none' }}>
                <button style={{ backgroundColor: '#f3f4f6', color: '#374151', padding: '12px 24px', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: '500', cursor: 'pointer' }}>
                  Cancel
                </button>
              </Link>
              <button
                onClick={handleContinue}
                disabled={!templateName.trim()}
                style={{ backgroundColor: templateName.trim() ? '#3b82f6' : '#e5e7eb', color: templateName.trim() ? 'white' : '#9ca3af', padding: '12px 24px', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: '500', cursor: templateName.trim() ? 'pointer' : 'not-allowed' }}
              >
                Continue →
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── METHOD CHOICE STEP ───────────────────────────────────────────────────

  if (step === 'method') {
    const optionCard = (
      title: string,
      description: string,
      icon: string,
      onClick: () => void,
      highlight?: boolean
    ) => (
      <button
        onClick={onClick}
        style={{
          width: '100%',
          textAlign: 'left',
          backgroundColor: highlight ? '#eff6ff' : 'white',
          border: highlight ? '2px solid #3b82f6' : '2px solid #e5e7eb',
          borderRadius: '12px',
          padding: '24px',
          cursor: 'pointer',
          marginBottom: '12px',
          transition: 'all 0.15s ease',
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.backgroundColor = '#eff6ff'; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = highlight ? '#3b82f6' : '#e5e7eb'; e.currentTarget.style.backgroundColor = highlight ? '#eff6ff' : 'white'; }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
          <div style={{ fontSize: '32px', flexShrink: 0 }}>{icon}</div>
          <div>
            <div style={{ fontSize: '17px', fontWeight: '700', color: '#111827', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              {title}
              {highlight && <span style={{ fontSize: '11px', backgroundColor: '#3b82f6', color: 'white', padding: '2px 8px', borderRadius: '10px', fontWeight: '600' }}>Recommended</span>}
            </div>
            <div style={{ fontSize: '14px', color: '#6b7280', lineHeight: '1.5' }}>{description}</div>
          </div>
        </div>
      </button>
    );

    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', display: 'flex', flexDirection: 'column' }}>
        <PageNav />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div style={{ maxWidth: '600px', width: '100%', backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', padding: '48px' }}>
            <h1 style={{ fontSize: '26px', fontWeight: '700', color: '#111827', marginBottom: '8px' }}>
              How would you like to build "{templateName}"?
            </h1>
            <p style={{ color: '#6b7280', marginBottom: '32px', fontSize: '15px' }}>
              Choose the approach that suits you best.
            </p>

            {optionCard(
              'Build as you go',
              'Answer a few questions about your reports and we\'ll set up the structure. Then write reports and build up your comment bank as you go — perfect for starting fresh.',
              '🧱',
              () => setStep('build-as-you-go'),
              true
            )}

            {optionCard(
              'Import from existing reports',
              'Paste reports you\'ve already written and we\'ll extract comments to build your template automatically.',
              '📥',
              () => navigate('/import-template'),
            )}

            {optionCard(
              'Build manually',
              'Add and configure sections yourself using the full template builder. Best if you know exactly what you want.',
              '⚙️',
              () => setStep('building'),
            )}

            <div style={{ marginTop: '16px' }}>
              <button onClick={() => setStep('naming')}
                style={{ background: 'none', border: 'none', color: '#9ca3af', fontSize: '13px', cursor: 'pointer', padding: 0 }}>
                ← Change template name
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── BUILD AS YOU GO ──────────────────────────────────────────────────────

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
        onCancel={() => setStep('method')}
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
              {isEditing ? 'Edit Template' : 'Create Template'}
            </h1>
            <p style={{ color: '#6b7280', margin: '8px 0 0 0', fontSize: '16px' }}>
              {templateName || 'Untitled Template'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <Link to="/manage-templates" style={{ textDecoration: 'none' }}>
              <button style={{ backgroundColor: '#f3f4f6', color: '#374151', padding: '12px 24px', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '500', cursor: 'pointer' }}>
                Cancel
              </button>
            </Link>
            <button onClick={handleSaveTemplate}
              style={{ backgroundColor: '#3b82f6', color: 'white', padding: '12px 24px', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '500', cursor: 'pointer' }}>
              {isEditing ? 'Save Changes' : 'Save Template'}
            </button>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px' }}>
        {sections.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', backgroundColor: 'white', borderRadius: '12px', border: '2px dashed #d1d5db' }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>📝</div>
            <h2 style={{ fontSize: '24px', fontWeight: '600', color: '#111827', marginBottom: '12px' }}>
              Start Building Your Template
            </h2>
            <p style={{ color: '#6b7280', marginBottom: '32px', fontSize: '16px' }}>
              Add sections to define the structure of your report
            </p>
            <button onClick={() => setShowSectionSelector(true)}
              style={{ backgroundColor: '#10b981', color: 'white', padding: '16px 32px', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: '500', cursor: 'pointer' }}>
              + Add Your First Section
            </button>
          </div>
        ) : (
          <div>
            <div style={{ marginBottom: '24px' }}>
              <button onClick={() => setShowSectionSelector(true)}
                style={{ backgroundColor: '#10b981', color: 'white', padding: '12px 24px', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '500', cursor: 'pointer' }}>
                + Add Section
              </button>
            </div>

            <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>
                Template Sections ({sections.length})
              </h2>
              {sections.map((section, index) => (
                <div key={section.id} style={{ padding: '16px', backgroundColor: '#f9fafb', borderRadius: '8px', marginBottom: '12px', border: '1px solid #e5e7eb' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', margin: '0 0 4px 0' }}>
                        {section.name || section.type}
                      </h3>
                      <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>Type: {section.type}</p>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => handleMoveSection(index, 'up')} disabled={index === 0}
                        style={{ padding: '6px 12px', backgroundColor: index === 0 ? '#f3f4f6' : '#e5e7eb', color: index === 0 ? '#9ca3af' : '#374151', border: 'none', borderRadius: '4px', cursor: index === 0 ? 'not-allowed' : 'pointer', fontSize: '12px' }}>↑</button>
                      <button onClick={() => handleMoveSection(index, 'down')} disabled={index === sections.length - 1}
                        style={{ padding: '6px 12px', backgroundColor: index === sections.length - 1 ? '#f3f4f6' : '#e5e7eb', color: index === sections.length - 1 ? '#9ca3af' : '#374151', border: 'none', borderRadius: '4px', cursor: index === sections.length - 1 ? 'not-allowed' : 'pointer', fontSize: '12px' }}>↓</button>
                      {isSectionEditable(section.type) && (
                        <button onClick={() => handleEditSection(section, index)}
                          style={{ padding: '6px 12px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', fontSize: '12px', cursor: 'pointer' }}>Edit</button>
                      )}
                      <button onClick={() => handleDeleteSection(index)}
                        style={{ padding: '6px 12px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', fontSize: '12px', cursor: 'pointer' }}>Delete</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Section Selector */}
      {showSectionSelector && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'white', zIndex: 1000, overflow: 'auto' }}>
          <SectionSelector onSelectSection={handleAddSection} onBack={() => setShowSectionSelector(false)} />
        </div>
      )}

      {/* Comment Builder Modals */}
      {showRatedCommentBuilder && editingSection && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, overflow: 'auto', padding: '20px' }}>
          <div style={{ minHeight: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: '100%', maxWidth: '900px', margin: '0 auto' }}>
              <RatedCommentBuilder existingComment={editingSection.section.data} onSave={handleSaveEditedSection} onCancel={handleCancelEdit} />
            </div>
          </div>
        </div>
      )}

      {showAssessmentCommentBuilder && editingSection && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, overflow: 'auto', padding: '20px' }}>
          <div style={{ minHeight: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: '100%', maxWidth: '900px', margin: '0 auto' }}>
              <AssessmentCommentBuilder existingComment={editingSection.section.data} onSave={handleSaveEditedSection} onCancel={handleCancelEdit} />
            </div>
          </div>
        </div>
      )}

      {showPersonalisedCommentBuilder && editingSection && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, overflow: 'auto', padding: '20px' }}>
          <div style={{ minHeight: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: '100%', maxWidth: '900px', margin: '0 auto' }}>
              <PersonalisedCommentBuilder existingComment={editingSection.section.data} onSave={handleSaveEditedSection} onCancel={handleCancelEdit} />
            </div>
          </div>
        </div>
      )}

      {showNextStepsCommentBuilder && editingSection && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, overflow: 'auto', padding: '20px' }}>
          <div style={{ minHeight: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: '100%', maxWidth: '900px', margin: '0 auto' }}>
              <NextStepsCommentBuilder existingComment={editingSection.section.data} onSave={handleSaveEditedSection} onCancel={handleCancelEdit} />
            </div>
          </div>
        </div>
      )}

      {showQualitiesCommentBuilder && editingSection && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, overflow: 'auto', padding: '20px' }}>
          <div style={{ minHeight: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: '100%', maxWidth: '900px', margin: '0 auto' }}>
              <QualitiesCommentBuilder existingComment={editingSection.section.data} onSave={handleSaveEditedSection} onCancel={handleCancelEdit} />
            </div>
          </div>
        </div>
      )}

      {showStandardCommentEditor && editingSection && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '32px', maxWidth: '600px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '24px' }}>Edit Standard Comment</h2>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>Comment Name</label>
              <input type="text" value={standardCommentName} onChange={(e) => setStandardCommentName(e.target.value)}
                style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }} />
            </div>
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>Comment Content</label>
              <textarea value={standardCommentContent} onChange={(e) => setStandardCommentContent(e.target.value)} rows={6}
                style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box' }} />
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button onClick={handleCancelEdit}
                style={{ padding: '12px 24px', backgroundColor: '#f3f4f6', color: '#374151', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '500', cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={handleSaveStandardCommentEdit}
                style={{ padding: '12px 24px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '500', cursor: 'pointer' }}>
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