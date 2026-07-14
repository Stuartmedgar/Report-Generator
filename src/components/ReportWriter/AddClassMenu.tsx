import React, { useState } from 'react';
import { Class } from '../../types';
import { parseClassListText, ParsedName } from '../../utils/parseClassList';

interface AddClassMenuProps {
  classes: Class[];
  onCreateNew: (name: string, students: ParsedName[]) => void;
  onLoadExisting: (classData: Class) => void;
}

// Button + dropdown next to the pupil-name box — lets a teacher start a new
// class (name + a pasted class list, same as CreateClass.tsx) or switch to a
// previously created one, without leaving the writer.
export const AddClassMenu: React.FC<AddClassMenuProps> = ({ classes, onCreateNew, onLoadExisting }) => {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'menu' | 'load' | 'create'>('menu');
  const [newClassName, setNewClassName] = useState('');
  const [pasteText, setPasteText] = useState('');

  const closeAndReset = () => {
    setOpen(false);
    setMode('menu');
    setNewClassName('');
    setPasteText('');
  };

  const handleCreate = () => {
    const parsed = parseClassListText(pasteText);
    if (!newClassName.trim() || parsed.length === 0) return;
    onCreateNew(newClassName.trim(), parsed);
    closeAndReset();
  };

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => { setOpen(o => !o); setMode('menu'); }}
        style={{ padding: '10px 16px', backgroundColor: '#8b5cf6', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
      >
        + Add Class
      </button>

      {open && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 98 }} onClick={() => closeAndReset()} />
          <div style={{
            position: 'absolute', top: 'calc(100% + 6px)', right: 0, backgroundColor: 'white',
            border: '1px solid #e5e7eb', borderRadius: '8px', boxShadow: '0 8px 20px rgba(0,0,0,0.12)',
            padding: mode === 'create' ? '16px' : '8px', width: mode === 'create' ? '320px' : '240px', zIndex: 99,
          }}>
            {mode === 'menu' && (
              <>
                <button
                  onClick={() => setMode('create')}
                  style={{ display: 'block', width: '100%', textAlign: 'left', padding: '10px 12px', border: 'none', borderRadius: '6px', background: 'none', fontSize: '13px', fontWeight: 600, cursor: 'pointer', color: '#1e293b' }}
                >
                  ➕ Create a new class
                </button>
                <button
                  onClick={() => setMode('load')}
                  style={{ display: 'block', width: '100%', textAlign: 'left', padding: '10px 12px', border: 'none', borderRadius: '6px', background: 'none', fontSize: '13px', fontWeight: 600, cursor: 'pointer', color: '#1e293b' }}
                >
                  📂 Load an existing class
                </button>
              </>
            )}

            {mode === 'load' && (
              <div style={{ maxHeight: '240px', overflowY: 'auto' }}>
                {classes.length === 0 ? (
                  <div style={{ padding: '10px 12px', fontSize: '13px', color: '#9ca3af' }}>No other saved classes yet.</div>
                ) : classes.map(cls => (
                  <button
                    key={cls.id}
                    onClick={() => { onLoadExisting(cls); closeAndReset(); }}
                    style={{ display: 'block', width: '100%', textAlign: 'left', padding: '10px 12px', border: 'none', borderRadius: '6px', background: 'none', fontSize: '13px', cursor: 'pointer', color: '#1e293b' }}
                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#f8fafc'; }}
                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                  >
                    {cls.name} <span style={{ color: '#9ca3af', fontWeight: 400 }}>· {cls.students.length} pupil{cls.students.length !== 1 ? 's' : ''}</span>
                  </button>
                ))}
                <button
                  onClick={() => setMode('menu')}
                  style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', border: 'none', background: 'none', fontSize: '12px', color: '#94a3b8', cursor: 'pointer' }}
                >
                  ← Back
                </button>
              </div>
            )}

            {mode === 'create' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', textAlign: 'left' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>Class Name</label>
                  <input
                    type="text"
                    placeholder="e.g., 8A English, Year 9 Science"
                    value={newClassName}
                    onChange={e => setNewClassName(e.target.value)}
                    autoFocus
                    style={{ width: '100%', padding: '9px 12px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '6px' }}>
                    <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>Paste Your Class List</label>
                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>one pupil per line</span>
                  </div>
                  <textarea
                    placeholder={'John Smith\nSarah Johnson\nMichael Brown\nEmma Davis'}
                    value={pasteText}
                    onChange={e => setPasteText(e.target.value)}
                    style={{
                      width: '100%', height: '110px', padding: '9px 12px', border: '2px solid #e5e7eb',
                      borderRadius: '8px', fontSize: '13px', resize: 'none', fontFamily: 'inherit',
                      boxSizing: 'border-box', outline: 'none',
                    }}
                  />
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>Surnames are shortened to 2 letters for privacy.</span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={handleCreate}
                    disabled={!newClassName.trim() || !pasteText.trim()}
                    style={{
                      flex: 1, padding: '9px 12px',
                      backgroundColor: newClassName.trim() && pasteText.trim() ? '#8b5cf6' : '#e2e8f0',
                      color: newClassName.trim() && pasteText.trim() ? 'white' : '#94a3b8',
                      border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600,
                      cursor: newClassName.trim() && pasteText.trim() ? 'pointer' : 'not-allowed',
                    }}
                  >
                    Create Class
                  </button>
                  <button
                    onClick={() => setMode('menu')}
                    style={{ padding: '9px 12px', backgroundColor: 'white', color: '#374151', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
                  >
                    ← Back
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default AddClassMenu;
