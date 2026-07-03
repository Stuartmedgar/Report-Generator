import React, { useState, useEffect } from 'react';

interface InlineEditableTitleProps {
  name: string | undefined;
  defaultName: string;
  color: string;
  onRename?: (newName: string) => void;
}

const InlineEditableTitle: React.FC<InlineEditableTitleProps> = ({ name, defaultName, color, onRename }) => {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(name || defaultName);

  useEffect(() => {
    setValue(name || defaultName);
  }, [name, defaultName]);

  if (editing && onRename) {
    return (
      <input
        autoFocus
        value={value}
        onChange={e => setValue(e.target.value)}
        onBlur={() => { onRename(value || defaultName); setEditing(false); }}
        onKeyDown={e => {
          if (e.key === 'Enter') { onRename(value || defaultName); setEditing(false); }
          if (e.key === 'Escape') { setValue(name || defaultName); setEditing(false); }
        }}
        style={{
          fontSize: '16px', fontWeight: '600', color, border: 'none',
          borderBottom: `2px solid ${color}`, background: 'transparent',
          outline: 'none', width: '200px', padding: '0 0 1px 0',
        }}
      />
    );
  }

  return (
    <h3
      data-tour="section-title"
      onClick={onRename ? () => setEditing(true) : undefined}
      title={onRename ? 'Click to rename' : undefined}
      style={{ fontSize: '16px', fontWeight: '600', color, margin: 0, cursor: onRename ? 'text' : 'default' }}
    >
      {name || defaultName}
    </h3>
  );
};

export default InlineEditableTitle;
