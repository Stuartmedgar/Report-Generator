import React from 'react';

interface HeaderStylePickerProps {
  showHeader: boolean;
  headerStyle: string;
  onChange: (showHeader: boolean, headerStyle: string) => void;
}

const STYLES = [
  { value: 'inline',       label: 'Aa:',  title: 'Inline — Name: comment' },
  { value: 'newline',      label: 'Aa↵',  title: 'New line — Name on its own line' },
  { value: 'caps',         label: 'AA:',  title: 'CAPS inline — NAME: comment' },
  { value: 'caps-newline', label: 'AA↵',  title: 'CAPS new line — NAME on its own line' },
];

const HeaderStylePicker: React.FC<HeaderStylePickerProps> = ({ showHeader, headerStyle, onChange }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
    <input
      type="checkbox"
      checked={showHeader}
      onChange={e => onChange(e.target.checked, headerStyle)}
      style={{ width: '14px', height: '14px', cursor: 'pointer' }}
    />
    <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>Header</span>
    {showHeader && STYLES.map(s => (
      <button
        key={s.value}
        onClick={() => onChange(true, s.value)}
        title={s.title}
        style={{
          padding: '1px 5px',
          fontSize: '10px',
          border: `1px solid ${headerStyle === s.value ? '#6366f1' : '#d1d5db'}`,
          borderRadius: '3px',
          backgroundColor: headerStyle === s.value ? '#6366f1' : 'white',
          color: headerStyle === s.value ? 'white' : '#6b7280',
          cursor: 'pointer',
          fontWeight: '600',
          lineHeight: '1.6',
        }}
      >{s.label}</button>
    ))}
  </div>
);

export default HeaderStylePicker;
