import React, { useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { Template, Class } from '../../types';
import PageNav from '../PageNav';

interface DesktopClassSelectionProps {
  selectedTemplate: Template;
  onClassSelect: (classData: Class) => void;
  onCreateClass: (name: string) => void;
  onBack: () => void;
}

const cardStyle: React.CSSProperties = {
  backgroundColor: 'white',
  border: '1px solid #e5e7eb',
  borderRadius: '12px',
  padding: '16px 20px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  transition: 'border-color 0.15s, box-shadow 0.15s',
  marginBottom: '8px',
};

// Desktop counterpart to ClassSelection.tsx (mobile) — kept as a separate
// component rather than a responsive variant, per this repo's convention.
function DesktopClassSelection({ selectedTemplate, onClassSelect, onCreateClass, onBack }: DesktopClassSelectionProps) {
  const { state } = useData();
  const [showNewClass, setShowNewClass] = useState(false);
  const [newClassName, setNewClassName] = useState('');

  const handleCreateClass = () => {
    if (!newClassName.trim()) return;
    onCreateClass(newClassName.trim());
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <PageNav />

      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '40px 24px' }}>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px', gap: '12px' }}>
          <div>
            <h1 style={{ fontSize: '32px', fontWeight: '800', color: '#1e293b', margin: '0 0 6px 0' }}>
              Choose a Class
            </h1>
            <p style={{ fontSize: '15px', color: '#64748b', margin: 0 }}>
              Writing reports with <strong>{selectedTemplate.name}</strong>.
            </p>
          </div>
          {!showNewClass && (
            <button
              onClick={() => setShowNewClass(true)}
              style={{
                backgroundColor: '#8b5cf6', color: 'white',
                padding: '10px 16px', border: 'none', borderRadius: '8px',
                fontSize: '14px', fontWeight: '600', cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              + New Class
            </button>
          )}
        </div>

        {showNewClass ? (
          <div style={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '24px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
              Class Name
            </label>
            <input
              type="text"
              placeholder="e.g., 8A English, Year 9 Science"
              value={newClassName}
              onChange={e => setNewClassName(e.target.value)}
              autoFocus
              onKeyDown={e => { if (e.key === 'Enter') handleCreateClass(); }}
              style={{ width: '100%', padding: '10px 14px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '15px', outline: 'none', boxSizing: 'border-box', marginBottom: '16px' }}
            />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={handleCreateClass}
                disabled={!newClassName.trim()}
                style={{
                  backgroundColor: newClassName.trim() ? '#10b981' : '#e2e8f0',
                  color: newClassName.trim() ? 'white' : '#94a3b8',
                  padding: '12px 24px', border: 'none', borderRadius: '8px',
                  fontSize: '15px', fontWeight: '600', cursor: newClassName.trim() ? 'pointer' : 'not-allowed',
                }}
              >
                Create Class
              </button>
              <button
                onClick={() => { setShowNewClass(false); setNewClassName(''); }}
                style={{ padding: '12px 24px', backgroundColor: 'white', color: '#374151', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '15px', fontWeight: '600', cursor: 'pointer' }}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : state.classes.length === 0 ? (
          <div style={{ backgroundColor: 'white', border: '2px dashed #d1d5db', borderRadius: '12px', padding: '40px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>👥</div>
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b', margin: '0 0 8px 0' }}>No classes yet</h3>
            <p style={{ fontSize: '14px', color: '#64748b', margin: '0 0 20px 0' }}>
              Name your class to get started — you can add pupils next.
            </p>
            <button
              onClick={() => setShowNewClass(true)}
              style={{ backgroundColor: '#8b5cf6', color: 'white', padding: '12px 24px', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: '600', cursor: 'pointer' }}
            >
              + Add a Class
            </button>
          </div>
        ) : (
          <div>
            {state.classes.map((cls) => (
              <div
                key={cls.id}
                onClick={() => onClassSelect(cls)}
                style={cardStyle}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = '#8b5cf6';
                  (e.currentTarget as HTMLDivElement).style.boxShadow = '0 0 0 3px rgba(139,92,246,0.1)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = '#e5e7eb';
                  (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
                }}
              >
                <div>
                  <div style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b' }}>{cls.name}</div>
                  <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '2px' }}>
                    {cls.students.length} student{cls.students.length !== 1 ? 's' : ''}
                  </div>
                </div>
                <span style={{ color: '#cbd5e1', fontSize: '20px' }}>›</span>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={onBack}
          style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '13px', cursor: 'pointer', padding: '16px 0 0 0', display: 'block' }}
        >
          ← Change template
        </button>

      </div>
    </div>
  );
}

export default DesktopClassSelection;
