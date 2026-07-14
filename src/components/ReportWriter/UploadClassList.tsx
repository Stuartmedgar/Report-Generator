import React, { useState } from 'react';
import { parseClassListText, ParsedName } from '../../utils/parseClassList';

interface UploadClassListProps {
  onImport: (students: ParsedName[]) => void;
  onCancel: () => void;
}

// Same "paste your class list" UX as CreateClass.tsx, reused wherever pupils
// can be added inside the report writer (first-visit screen, student nav bar,
// mobile add-pupil flow).
export const UploadClassList: React.FC<UploadClassListProps> = ({ onImport, onCancel }) => {
  const [text, setText] = useState('');

  const handleImport = () => {
    if (!text.trim()) return;
    const parsed = parseClassListText(text);
    if (parsed.length === 0) {
      alert('No valid student names found. Please check the format and try again.');
      return;
    }
    onImport(parsed);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', textAlign: 'left' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>Paste Your Class List</label>
        <span style={{ fontSize: '11px', color: '#94a3b8' }}>one pupil per line</span>
      </div>
      <textarea
        placeholder={'John Smith\nSarah Johnson\nMichael Brown\nEmma Davis'}
        value={text}
        onChange={e => setText(e.target.value)}
        autoFocus
        style={{
          width: '100%', height: '120px', padding: '10px 14px',
          border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '14px',
          resize: 'none', fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none',
        }}
      />
      <div style={{ display: 'flex', gap: '10px' }}>
        <button
          onClick={handleImport}
          disabled={!text.trim()}
          style={{
            padding: '9px 20px',
            backgroundColor: text.trim() ? '#8b5cf6' : '#e2e8f0',
            color: text.trim() ? 'white' : '#94a3b8',
            border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600,
            cursor: text.trim() ? 'pointer' : 'not-allowed',
          }}
        >
          Import Pupils
        </button>
        <button
          onClick={onCancel}
          style={{ padding: '9px 20px', backgroundColor: 'white', color: '#374151', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default UploadClassList;
