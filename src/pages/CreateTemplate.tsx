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

  // If a method was passed in from GetTemplate, use it to skip the method screen after naming
  const preselectedMethod = location.state?.method as 'build-as-you-go' | 'building' | 'quick-start' | undefined;

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [templateName, setTemplateName] = useState(editTemplate?.name || '');
  const [sections, setSections] = useState<TemplateSection[]>(editTemplate?.sections || []);
  const [sectionData, setSectionData] = useState<Record<string, any>>(editTemplate?.sectionData || {});

  // Step flow: 'naming' → 'method' → 'building' | 'build-as-you-go' | 'quick-start'
  const [step, setStep] = useState<'naming' | 'method' | 'building' | 'build-as-you-go' | 'quick-start'>(
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
  };

  const handleEditSection = (section: TemplateSection, index: number) => {
    setEditingSection({ section, index });
    switch (section.type) {
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

  const handleAddNewLine = () => {
    setSections(prev => [...prev, { id: `${Date.now()}`, type: 'new-line' as SectionType, name: 'New Line', data: {} }]);
  };

  const handleAddOptionalComment = () => {
    setSections(prev => [...prev, { id: `${Date.now()}`, type: 'optional-additional-comment' as SectionType, name: 'Additional Comments', data: {} }]);
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
      <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
    );
  }

  // ─── METHOD CHOICE STEP ───────────────────────────────────────────────────

  if (step === 'method') {
    const optionCard = (
      title: string,
      description: string,
      icon: string,
      onClick: () => void,
      highlight?: boolean,
      badgeText?: string,
      badgeColor?: string
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
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '17px', fontWeight: '700', color: '#111827', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              {title}
              {highlight && <span style={{ fontSize: '11px', backgroundColor: '#3b82f6', color: 'white', padding: '2px 8px', borderRadius: '10px', fontWeight: '600' }}>Recommended</span>}
              {badgeText && <span style={{ fontSize: '11px', backgroundColor: badgeColor || '#10b981', color: 'white', padding: '2px 8px', borderRadius: '10px', fontWeight: '600' }}>{badgeText}</span>}
            </div>
            <div style={{ fontSize: '14px', color: '#6b7280', lineHeight: '1.5' }}>{description}</div>
          </div>
        </div>
      </button>
    );

    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{ maxWidth: '600px', width: '100%', backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', padding: '48px' }}>
          <h1 style={{ fontSize: '26px', fontWeight: '700', color: '#111827', marginBottom: '8px' }}>
            How would you like to build "{templateName}"?
          </h1>
          <p style={{ color: '#6b7280', marginBottom: '32px', fontSize: '15px' }}>
            Choose the approach that suits you best.
          </p>

          {optionCard(
            'Quick Start Template',
            "Pick your subject and we'll instantly build a ready-to-use template pre-populated with generic comments. Fully editable.",
            '🚀',
            () => setStep('quick-start'),
            false,
            'New',
            '#10b981'
          )}

          {optionCard(
            'Build as you go',
            "Answer a few questions about your reports and we'll set up the structure. Then write reports and build up your comment bank as you go — perfect for starting fresh.",
            '🧱',
            () => setStep('build-as-you-go'),
            true
          )}

          {optionCard(
            'Import from existing reports',
            "Paste reports you've already written and we'll extract comments to build your template automatically.",
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
    );
  }

  // ─── QUICK START ─────────────────────────────────────────────────────────

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
        onCancel={() => setStep('method')}
      />
    );
  }

  // ─── BUILD AS YOU GO ──────────────────────────────────────────────────────

  if (step === 'build-as-you-go') {
    return (
      <BuildAsYouGo
        templateName={templateName}
        classId={location.state?.classId}
        onComplete={(completedSections) => {
          const newTemplateId = `template-${Date.now()}`;
          addTemplate({
            id: newTemplateId,
            name: templateName,
            sections: completedSections,
            createdAt: new Date().toISOString(),
          } as any);
          const classId = location.state?.classId;
          if (classId) {
            // Use sessionStorage handoff so WriteReports reads it synchronously
            // before first render — same pattern as rest of app
            sessionStorage.setItem('continueEditing', JSON.stringify({
              classId,
              templateId: newTemplateId,
              studentIndex: 0,
            }));
            navigate('/write-reports');
          } else {
            navigate('/manage-templates');
          }
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
                <div style={{ textAlign: 'center', padding: '48px', color: '#9ca3af' }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>📝</div>
                  <h3 style={{ fontSize: '16px', fontWeight: '600', margin: '0 0 8px 0' }}>No Sections Added Yet</h3>
                  <p style={{ margin: '0 0 24px 0', fontSize: '14px' }}>Start building your template by adding sections.</p>
                  <button
                    onClick={() => setShowSectionSelector(true)}
                    style={{ backgroundColor: '#3b82f6', color: 'white', padding: '12px 24px', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '500', cursor: 'pointer' }}
                  >
                    Add Your First Section
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {sections.map((section, index) => (
                    <div key={section.id} style={{ backgroundColor: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <span style={{ fontSize: '12px', fontWeight: '600', color: 'white', backgroundColor: '#6b7280', padding: '2px 8px', borderRadius: '4px' }}>
                            {section.type}
                          </span>
                          {section.name && (
                            <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#374151', margin: '6px 0 0 0' }}>{section.name}</h4>
                          )}
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
              )}

              {sections.length > 0 && (
                <div style={{ display: 'flex', gap: '12px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #e5e7eb' }}>
                  <button onClick={handleAddNewLine}
                    style={{ flex: 1, backgroundColor: '#f3f4f6', color: '#374151', padding: '8px', border: '1px dashed #d1d5db', borderRadius: '6px', fontSize: '13px', cursor: 'pointer' }}>
                    + New Line
                  </button>
                  <button onClick={handleAddOptionalComment}
                    style={{ flex: 1, backgroundColor: '#f3f4f6', color: '#374151', padding: '8px', border: '1px dashed #d1d5db', borderRadius: '6px', fontSize: '13px', cursor: 'pointer' }}>
                    + Optional Comments Box
                  </button>
                </div>
              )}
            </div>
          </div>

          <div style={{ backgroundColor: 'white', border: '2px solid #e5e7eb', borderRadius: '12px', padding: '24px', position: 'sticky', top: '80px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '12px' }}>About Section Types</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px', color: '#6b7280', lineHeight: '1.5' }}>
              <div><strong style={{ color: '#374151' }}>Rated Comment</strong> — teacher picks Excellent / Good / Satisfactory / Needs Improvement</div>
              <div><strong style={{ color: '#374151' }}>Qualities / Strengths</strong> — teacher picks from named comment buttons</div>
              <div><strong style={{ color: '#374151' }}>Next Steps</strong> — teacher picks from target/focus area buttons</div>
              <div><strong style={{ color: '#374151' }}>Standard Comment</strong> — fixed text included in every report</div>
              <div><strong style={{ color: '#374151' }}>Assessment Score</strong> — includes a score/grade with performance comments</div>
              <div><strong style={{ color: '#374151' }}>Personalised Comment</strong> — AI generates a unique sentence per pupil</div>
            </div>
          </div>
        </div>
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
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '24px' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '32px', maxWidth: '600px', width: '100%' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px' }}>Edit Standard Comment</h3>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '6px' }}>Section Name</label>
              <input value={standardCommentName} onChange={e => setStandardCommentName(e.target.value)}
                style={{ width: '100%', padding: '10px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }} />
            </div>
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '6px' }}>Comment Text</label>
              <textarea value={standardCommentContent} onChange={e => setStandardCommentContent(e.target.value)} rows={4}
                style={{ width: '100%', padding: '10px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '14px', resize: 'vertical', boxSizing: 'border-box' }} />
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button onClick={handleCancelEdit} style={{ backgroundColor: '#f3f4f6', color: '#374151', padding: '10px 20px', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleSaveStandardCommentEdit} style={{ backgroundColor: '#3b82f6', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateTemplate;