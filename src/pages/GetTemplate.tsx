// src/pages/GetTemplate.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function GetTemplate() {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const navigate = useNavigate();

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const OptionCard = ({
    icon, title, description, buttonLabel, buttonColor, onClick, recommended, badge,
  }: {
    icon: string; title: string; description: string;
    buttonLabel: string; buttonColor: string;
    onClick: () => void; recommended?: boolean; badge?: string;
  }) => (
    <div style={{
      backgroundColor: 'white',
      border: recommended ? '2px solid #8b5cf6' : '1px solid #e5e7eb',
      borderRadius: '16px',
      padding: isMobile ? '24px' : '32px',
      display: 'flex', flexDirection: 'column', gap: '14px',
      boxShadow: recommended ? '0 4px 12px rgba(139,92,246,0.12)' : '0 1px 4px rgba(0,0,0,0.05)',
      position: 'relative',
    }}>
      {(recommended || badge) && (
        <div style={{
          position: 'absolute', top: '-12px', left: '24px',
          backgroundColor: recommended ? '#8b5cf6' : '#10b981',
          color: 'white',
          fontSize: '11px', fontWeight: '700', padding: '3px 12px',
          borderRadius: '10px', letterSpacing: '0.04em'
        }}>
          {badge || 'RECOMMENDED'}
        </div>
      )}
      <div style={{ fontSize: '36px' }}>{icon}</div>
      <div>
        <div style={{ fontSize: isMobile ? '17px' : '19px', fontWeight: '700', color: '#1e293b', marginBottom: '8px' }}>
          {title}
        </div>
        <div style={{ fontSize: '14px', color: '#64748b', lineHeight: '1.6' }}>
          {description}
        </div>
      </div>
      <button
        onClick={onClick}
        style={{
          backgroundColor: buttonColor, color: 'white',
          border: 'none', borderRadius: '10px',
          padding: '12px 22px', fontSize: '15px', fontWeight: '600',
          cursor: 'pointer', alignSelf: 'flex-start', marginTop: 'auto',
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
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: isMobile ? '40px 16px' : '60px 40px',
    }}>

      {/* Back */}
      <div style={{ width: '100%', maxWidth: '960px', marginBottom: '32px' }}>
        <button
          onClick={() => navigate(-1)}
          style={{ background: 'none', border: 'none', color: '#6b7280', fontSize: '14px', cursor: 'pointer', padding: 0 }}
        >
          ← Back
        </button>
      </div>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '44px', maxWidth: '680px' }}>
        <h1 style={{
          fontSize: isMobile ? '30px' : '44px', fontWeight: '800',
          color: '#1e293b', margin: '0 0 12px 0', lineHeight: '1.2'
        }}>
          Get a Template
        </h1>
        <p style={{ fontSize: '17px', color: '#64748b', margin: 0, lineHeight: '1.6' }}>
          Choose how you'd like to create or import your template.
        </p>
      </div>

      {/* Options grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
        gap: '24px',
        width: '100%',
        maxWidth: '960px',
      }}>
        <OptionCard
          icon="⚡"
          title="AI Quick Build"
          description="Paste your existing reports and AI will build a full template in about 2 minutes. The fastest way to get started if you have previous reports."
          buttonLabel="Quick Build"
          buttonColor="#8b5cf6"
          onClick={() => navigate('/import-template', { state: { mode: 'quick' } })}
          recommended
        />
        <OptionCard
          icon="🚀"
          title="Quick Start Template"
          description="Pick your subject and we'll instantly build a ready-to-use template pre-populated with generic comments covering progress, effort, behaviour, strengths and next steps. Fully editable."
          buttonLabel="Quick Start"
          buttonColor="#10b981"
          onClick={() => navigate('/create-template', { state: { method: 'quick-start' } })}
          badge="NEW"
        />
        <OptionCard
          icon="🧱"
          title="Build as You Go"
          description="Answer a few questions and build your comment bank as you write reports. Perfect if you're starting from scratch."
          buttonLabel="Start Building"
          buttonColor="#3b82f6"
          onClick={() => navigate('/create-template', { state: { method: 'build-as-you-go' } })}
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
          onClick={() => navigate('/create-template', { state: { method: 'building' } })}
        />
      </div>
    </div>
  );
}

export default GetTemplate;