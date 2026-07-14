import React, { useState } from 'react';
import { Class } from '../../types';

interface AddClassMenuProps {
  classes: Class[];
  onCreateNew: () => void;
  onLoadExisting: (classData: Class) => void;
}

// Button + dropdown next to the pupil-name box — lets a teacher start a new
// class or switch to a previously created one without leaving the writer.
export const AddClassMenu: React.FC<AddClassMenuProps> = ({ classes, onCreateNew, onLoadExisting }) => {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'menu' | 'load'>('menu');

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
          <div style={{ position: 'fixed', inset: 0, zIndex: 98 }} onClick={() => setOpen(false)} />
          <div style={{ position: 'absolute', top: 'calc(100% + 6px)', right: 0, backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', boxShadow: '0 8px 20px rgba(0,0,0,0.12)', padding: '8px', minWidth: '240px', zIndex: 99 }}>
            {mode === 'menu' ? (
              <>
                <button
                  onClick={() => { onCreateNew(); setOpen(false); }}
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
            ) : (
              <div style={{ maxHeight: '240px', overflowY: 'auto' }}>
                {classes.length === 0 ? (
                  <div style={{ padding: '10px 12px', fontSize: '13px', color: '#9ca3af' }}>No other saved classes yet.</div>
                ) : classes.map(cls => (
                  <button
                    key={cls.id}
                    onClick={() => { onLoadExisting(cls); setOpen(false); setMode('menu'); }}
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
          </div>
        </>
      )}
    </div>
  );
};

export default AddClassMenu;
