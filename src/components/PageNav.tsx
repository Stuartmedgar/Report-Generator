import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function PageNav() {
  const navigate = useNavigate();

  const linkStyle: React.CSSProperties = {
    color: '#94a3b8',
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 0,
    fontFamily: 'inherit',
    transition: 'color 0.15s',
  };

  const hoverColor = '#475569';

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '10px 24px',
      borderBottom: '1px solid #f1f5f9',
      backgroundColor: 'white',
    }}>
      <button
        onClick={() => navigate(-1)}
        style={linkStyle}
        onMouseEnter={e => { e.currentTarget.style.color = hoverColor; }}
        onMouseLeave={e => { e.currentTarget.style.color = '#94a3b8'; }}
      >
        ← Back
      </button>

      <Link
        to="/"
        style={linkStyle}
        onMouseEnter={e => { e.currentTarget.style.color = hoverColor; }}
        onMouseLeave={e => { e.currentTarget.style.color = '#94a3b8'; }}
      >
        ⌂ Home
      </Link>
    </div>
  );
}