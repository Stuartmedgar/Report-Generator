import React, { useState } from 'react';
import { TemplateSection, SectionType } from '../types';

interface BuildAsYouGoProps {
  templateName: string;
  onComplete: (sections: TemplateSection[]) => void;
  onCancel: () => void;
}

interface Question {
  id: string;
  question: string;
  description: string;
  sectionType: SectionType;
  namePlaceholder: string;
  defaultName: string;
  allowMultiple: boolean;
  noName?: boolean; // for new-line and optional-additional-comment
}

const QUESTIONS: Question[] = [
  {
    id: 'standard-comment',
    question: 'Do your reports contain fixed statements that all pupils receive?',
    description: 'For example, an introduction sentence or a closing remark that is the same for every pupil.',
    sectionType: 'standard-comment',
    namePlaceholder: 'e.g. Introduction, Closing Statement',
    defaultName: 'Introduction',
    allowMultiple: true,
  },
  {
    id: 'qualities',
    question: 'Do your reports comment on pupil qualities or strengths?',
    description: 'Comments picked from a set of options — for example effort, attitude, teamwork. No performance rating involved.',
    sectionType: 'qualities',
    namePlaceholder: 'e.g. Character Qualities, Strengths',
    defaultName: 'Character Qualities',
    allowMultiple: true,
  },
  {
    id: 'rated-comment',
    question: 'Do your reports rate pupils on their performance?',
    description: 'Comments tied to a rating — Excellent, Good, Satisfactory, Needs Improvement.',
    sectionType: 'rated-comment',
    namePlaceholder: 'e.g. Performance, Effort Rating',
    defaultName: 'Performance',
    allowMultiple: true,
  },
  {
    id: 'assessment-comment',
    question: 'Do your reports include assessment results with a score?',
    description: 'Comments linked to a score or percentage — for example a test result.',
    sectionType: 'assessment-comment',
    namePlaceholder: 'e.g. Assessment Result, Test Score',
    defaultName: 'Assessment',
    allowMultiple: true,
  },
  {
    id: 'personalised-comment',
    question: 'Do your reports mention specific pupil achievements or activities?',
    description: 'Comments that include personalised information — for example a sport, instrument, or club the pupil is involved in.',
    sectionType: 'personalised-comment',
    namePlaceholder: 'e.g. Personal Achievement, Activity',
    defaultName: 'Personal Achievement',
    allowMultiple: true,
  },
  {
    id: 'next-steps',
    question: 'Do your reports include targets or next steps for the pupil?',
    description: 'Suggestions for what the pupil should focus on to improve.',
    sectionType: 'next-steps',
    namePlaceholder: 'e.g. Next Steps, Targets, Areas for Development',
    defaultName: 'Next Steps',
    allowMultiple: true,
  },
  {
    id: 'optional-additional-comment',
    question: 'Do you want space to add individual notes for specific pupils?',
    description: 'An optional free-text box that only appears in the report if you fill it in.',
    sectionType: 'optional-additional-comment',
    namePlaceholder: '',
    defaultName: 'Additional Comments',
    allowMultiple: false,
    noName: true,
  },
  {
    id: 'new-line',
    question: 'Do you want paragraph breaks between sections?',
    description: 'Adds spacing between sections to make the report easier to read.',
    sectionType: 'new-line',
    namePlaceholder: '',
    defaultName: '',
    allowMultiple: false,
    noName: true,
  },
];

interface AddedSection {
  id: string;
  type: SectionType;
  name: string;
}

const makeId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

const BuildAsYouGo: React.FC<BuildAsYouGoProps> = ({ templateName, onComplete, onCancel }) => {
  const [currentStep, setCurrentStep] = useState(0); // index into QUESTIONS
  const [addedSections, setAddedSections] = useState<AddedSection[]>([]);
  const [showSummary, setShowSummary] = useState(false);

  // Per-question state
  const [answered, setAnswered] = useState(false);
  const [sectionName, setSectionName] = useState('');
  const [addAnother, setAddAnother] = useState(false);

  const question = QUESTIONS[currentStep];
  const isLastQuestion = currentStep === QUESTIONS.length - 1;

  const resetQuestionState = () => {
    setAnswered(false);
    setSectionName('');
    setAddAnother(false);
  };

  const handleYes = () => {
    setAnswered(true);
    setSectionName(question.defaultName);
  };

  const handleNo = () => {
    if (isLastQuestion) {
      setShowSummary(true);
    } else {
      setCurrentStep(s => s + 1);
      resetQuestionState();
    }
  };

  const handleAddThisSection = () => {
    const name = question.noName ? question.defaultName : sectionName.trim() || question.defaultName;
    setAddedSections(prev => [...prev, {
      id: makeId(),
      type: question.sectionType,
      name,
    }]);

    if (question.allowMultiple) {
      setAddAnother(true);
      setSectionName(question.defaultName);
    } else {
      if (isLastQuestion) {
        setShowSummary(true);
      } else {
        setCurrentStep(s => s + 1);
        resetQuestionState();
      }
    }
  };

  const handleAddAnother = () => {
    setAddAnother(false);
    setSectionName(question.defaultName);
  };

  const handleDoneWithThisSection = () => {
    if (isLastQuestion) {
      setShowSummary(true);
    } else {
      setCurrentStep(s => s + 1);
      resetQuestionState();
    }
  };

  const handleMoveSection = (index: number, direction: 'up' | 'down') => {
    const next = [...addedSections];
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setAddedSections(next);
  };

  const handleRemoveSection = (id: string) => {
    setAddedSections(prev => prev.filter(s => s.id !== id));
  };

  const handleComplete = () => {
    if (addedSections.length === 0) {
      alert('Please add at least one section to your template.');
      return;
    }
    const sections: TemplateSection[] = addedSections.map(s => ({
      id: s.id,
      type: s.type,
      name: s.name,
      data: s.type === 'standard-comment' ? { content: '' } :
            s.type === 'qualities' ? { comments: {} } :
            s.type === 'rated-comment' ? { comments: { excellent: [], good: [], satisfactory: [], needsImprovement: [] } } :
            s.type === 'assessment-comment' ? { comments: { excellent: [], good: [], satisfactory: [], needsImprovement: [], notCompleted: [] } } :
            s.type === 'personalised-comment' ? { categories: {}, instruction: '' } :
            s.type === 'next-steps' ? { focusAreas: {} } :
            {},
    }));
    onComplete(sections);
  };

  const SECTION_COLORS: Record<string, string> = {
    'standard-comment': '#10b981',
    'qualities': '#8b5cf6',
    'rated-comment': '#3b82f6',
    'assessment-comment': '#8b5cf6',
    'personalised-comment': '#f59e0b',
    'next-steps': '#06b6d4',
    'optional-additional-comment': '#ef4444',
    'new-line': '#9ca3af',
  };

  const SECTION_LABELS: Record<string, string> = {
    'standard-comment': 'Fixed Statement',
    'qualities': 'Qualities / Strengths',
    'rated-comment': 'Rated Comment',
    'assessment-comment': 'Assessment Score',
    'personalised-comment': 'Personalised Comment',
    'next-steps': 'Next Steps / Targets',
    'optional-additional-comment': 'Optional Notes Box',
    'new-line': 'Paragraph Break',
  };

  const cardStyle: React.CSSProperties = {
    maxWidth: '640px',
    width: '100%',
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 4px 24px rgba(0,0,0,0.1)',
    padding: '40px',
  };

  const primaryBtn: React.CSSProperties = {
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    padding: '12px 28px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
  };

  const secondaryBtn: React.CSSProperties = {
    backgroundColor: '#f3f4f6',
    color: '#374151',
    border: 'none',
    borderRadius: '8px',
    padding: '12px 28px',
    fontSize: '15px',
    fontWeight: '500',
    cursor: 'pointer',
  };

  // ─── SUMMARY SCREEN ───────────────────────────────────────────────────────

  if (showSummary) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{ ...cardStyle, maxWidth: '700px' }}>
          <h1 style={{ fontSize: '26px', fontWeight: '700', color: '#111827', marginBottom: '8px' }}>
            Your template structure
          </h1>
          <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '24px' }}>
            Reorder or remove sections, then continue to start writing reports.
          </p>

          {addedSections.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px', color: '#9ca3af', border: '2px dashed #e5e7eb', borderRadius: '8px', marginBottom: '24px' }}>
              No sections added yet. Go back and answer Yes to at least one question.
            </div>
          ) : (
            <div style={{ marginBottom: '24px' }}>
              {addedSections.map((s, index) => (
                <div key={s.id} style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '12px 14px',
                  backgroundColor: '#f9fafb',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  marginBottom: '8px',
                }}>
                  <div style={{
                    width: '10px', height: '10px', borderRadius: '50%',
                    backgroundColor: SECTION_COLORS[s.type] || '#9ca3af',
                    flexShrink: 0,
                  }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>
                      {s.name || SECTION_LABELS[s.type]}
                    </div>
                    <div style={{ fontSize: '11px', color: '#9ca3af' }}>{SECTION_LABELS[s.type]}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button onClick={() => handleMoveSection(index, 'up')} disabled={index === 0}
                      style={{ ...secondaryBtn, padding: '4px 10px', fontSize: '12px', opacity: index === 0 ? 0.4 : 1 }}>▲</button>
                    <button onClick={() => handleMoveSection(index, 'down')} disabled={index === addedSections.length - 1}
                      style={{ ...secondaryBtn, padding: '4px 10px', fontSize: '12px', opacity: index === addedSections.length - 1 ? 0.4 : 1 }}>▼</button>
                    <button onClick={() => handleRemoveSection(s.id)}
                      style={{ backgroundColor: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '6px', padding: '4px 10px', fontSize: '12px', cursor: 'pointer' }}>✕</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button onClick={() => { setShowSummary(false); setCurrentStep(0); resetQuestionState(); }} style={secondaryBtn}>
              ← Start again
            </button>
            <button onClick={handleComplete} disabled={addedSections.length === 0}
              style={{ ...primaryBtn, opacity: addedSections.length === 0 ? 0.4 : 1, cursor: addedSections.length === 0 ? 'not-allowed' : 'pointer' }}>
              Continue to report writer →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── QUESTION SCREEN ──────────────────────────────────────────────────────

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={cardStyle}>

        {/* Progress */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>
              {templateName}
            </span>
            <span style={{ fontSize: '12px', color: '#6b7280' }}>
              {currentStep + 1} of {QUESTIONS.length}
            </span>
          </div>
          <div style={{ width: '100%', height: '4px', backgroundColor: '#e5e7eb', borderRadius: '2px' }}>
            <div style={{
              width: `${((currentStep + 1) / QUESTIONS.length) * 100}%`,
              height: '100%', backgroundColor: '#3b82f6', borderRadius: '2px',
              transition: 'width 0.3s ease',
            }} />
          </div>
        </div>

        {/* Section type badge */}
        <div style={{
          display: 'inline-block',
          backgroundColor: SECTION_COLORS[question.sectionType] + '20',
          color: SECTION_COLORS[question.sectionType],
          border: `1px solid ${SECTION_COLORS[question.sectionType]}40`,
          borderRadius: '20px',
          padding: '4px 12px',
          fontSize: '12px',
          fontWeight: '600',
          marginBottom: '16px',
        }}>
          {SECTION_LABELS[question.sectionType]}
        </div>

        {/* Question */}
        <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#111827', marginBottom: '10px', lineHeight: '1.3' }}>
          {question.question}
        </h2>
        <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '28px', lineHeight: '1.6' }}>
          {question.description}
        </p>

        {/* Not yet answered — show Yes/No */}
        {!answered && !addAnother && (
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={handleYes} style={{ ...primaryBtn, flex: 1 }}>Yes</button>
            <button onClick={handleNo} style={{ ...secondaryBtn, flex: 1 }}>No</button>
          </div>
        )}

        {/* Answered yes — show name input */}
        {answered && !addAnother && (
          <div>
            {!question.noName && (
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                  What would you like to call this section?
                </label>
                <input
                  type="text"
                  value={sectionName}
                  onChange={e => setSectionName(e.target.value)}
                  placeholder={question.namePlaceholder}
                  autoFocus
                  style={{
                    width: '100%', padding: '10px 14px',
                    border: '2px solid #3b82f6', borderRadius: '8px',
                    fontSize: '15px', outline: 'none', boxSizing: 'border-box',
                  }}
                />
              </div>
            )}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => { setAnswered(false); setSectionName(''); }} style={secondaryBtn}>← Back</button>
              <button onClick={handleAddThisSection} style={primaryBtn}>
                Add this section
              </button>
            </div>
          </div>
        )}

        {/* Added one — offer to add another or move on */}
        {addAnother && (
          <div>
            <div style={{
              backgroundColor: '#d1fae5', color: '#065f46',
              borderRadius: '8px', padding: '12px 16px',
              fontSize: '13px', fontWeight: '600', marginBottom: '20px',
            }}>
              ✓ Section added
            </div>
            <p style={{ fontSize: '14px', color: '#374151', marginBottom: '16px' }}>
              Would you like to add another {SECTION_LABELS[question.sectionType].toLowerCase()} section?
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={handleDoneWithThisSection} style={secondaryBtn}>
                No, continue →
              </button>
              <button onClick={handleAddAnother} style={primaryBtn}>
                Yes, add another
              </button>
            </div>
          </div>
        )}

        {/* Cancel */}
        <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid #f3f4f6' }}>
          <button onClick={onCancel}
            style={{ background: 'none', border: 'none', color: '#9ca3af', fontSize: '13px', cursor: 'pointer', padding: 0 }}>
            ← Back to template options
          </button>
        </div>
      </div>
    </div>
  );
};

export default BuildAsYouGo;