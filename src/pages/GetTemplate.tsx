import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function GetTemplate() {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const navigate = useNavigate();

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const OptionCard = ({
    icon,
    title,
    description,
    buttonLabel,
    buttonColor,
    onClick,
    recommended,
  }: {
    icon: string;
    title: string;
    description: string;
    buttonLabel: string;
    buttonColor: string;
    onClick: () => void;
    recommended?: boolean;
  }) => (
    <div
      style={{
        backgroundColor: 'white',
        border: recommended ? '2px solid #8b5cf6' : '1px solid #e5e7eb',
        borderRadius: '14px',
        padding: isMobile ? '20px' : '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        boxShadow: recommended ? '0 4px 12px rgba(139,92,246,0.12)' : '0 1px 4px rgba(0,0,0,0.05)',
        position: 'relative',
      }}
    >
      {recommended && (
        <div style={{
          position: 'absolute', top: '-12px', left: '20px',
          backgroundColor: '#8b5cf6', color: 'white',
          fontSize: '11px', fontWeight: '700', padding: '3px 10px',
          borderRadius: '10px', letterSpacing: '0.04em'
        }}>
          RECOMMENDED
        </div>
      )}
      <div style={{ fontSize: '32px' }}>{icon}</div>
      <div>
        <div style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b', marginBottom: '6px' }}>
          {title}
        </div>
        <div style={{ fontSize: '13px', color: '#64748b', lineHeight: '1.6' }}>
          {description}
        </div>
      </div>
      <button
        onClick={onClick}
        style={{
          backgroundColor: buttonColor,
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          padding: '10px 18px',
          fontSize: '14px',
          fontWeight: '600',
          cursor: 'pointer',
          alignSelf: 'flex-start',
          marginTop: 'auto',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.88'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; }}
      >
        {buttonLabel}
      </button>
    </div>
  );

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: isMobile ? '40px 16px' : '60px 24px',
    }}>

      {/* Back */}
      <div style={{ width: '100%', maxWidth: '780px', marginBottom: '32px' }}>
        <button
          onClick={() => navigate(-1)}
          style={{ background: 'none', border: 'none', color: '#6b7280', fontSize: '14px', cursor: 'pointer', padding: 0 }}
        >
          ← Back
        </button>
      </div>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '40px', maxWidth: '600px' }}>
        <h1 style={{
          fontSize: isMobile ? '28px' : '36px', fontWeight: '800',
          color: '#1e293b', margin: '0 0 12px 0', lineHeight: '1.2'
        }}>
          Get a Template
        </h1>
        <p style={{ fontSize: '16px', color: '#64748b', margin: 0, lineHeight: '1.6' }}>
          Choose how you'd like to create or import your template.
        </p>
      </div>

      {/* Options grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
        gap: '20px',
        width: '100%',
        maxWidth: '780px',
      }}>

        <OptionCard
          icon="⚡"
          title="AI Quick Build"
          description="Paste your existing reports and AI will build a full template in about 2 minutes. The fastest way to get started."
          buttonLabel="Quick Build"
          buttonColor="#8b5cf6"
          onClick={() => navigate('/import-template', { state: { mode: 'quick' } })}
          recommended
        />

        <OptionCard
          icon="🧱"
          title="Build as You Go"
          description="Answer a few questions and build your comment bank as you write reports. Perfect if you're starting from scratch."
          buttonLabel="Start Building"
          buttonColor="#3b82f6"
          onClick={() => navigate('/create-template')}
        />

        <OptionCard
          icon="🪄"
          title="Guided Wizard"
          description="Paste your reports and highlight sections one by one to build a template at your own pace. Great for precise control."
          buttonLabel="Start Wizard"
          buttonColor="#10b981"
          onClick={() => navigate('/import-template', { state: { mode: 'wizard' } })}
        />

        <OptionCard
          icon="📚"
          title="Import from Library"
          description="Browse and import a ready-made template from the library. Coming soon."
          buttonLabel="Browse Library"
          buttonColor="#94a3b8"
          onClick={() => alert('Template library coming soon!')}
        />

        <OptionCard
          icon="⚙️"
          title="Manual Build"
          description="Add and configure each section yourself using the full template builder. Best if you know exactly what you want."
          buttonLabel="Build Manually"
          buttonColor="#f59e0b"
          onClick={() => navigate('/create-template')}
        />

        <OptionCard
          icon="📂"
          title="Import from File"
          description="Got a .json template file from a colleague? Import it directly and you'll be ready to write reports straight away."
          buttonLabel="Import File"
          buttonColor="#64748b"
          onClick={() => navigate('/manage-templates')}
        />

      </div>
    </div>
  );
}

export default GetTemplate;