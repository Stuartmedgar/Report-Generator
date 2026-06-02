import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageNav from '../components/PageNav';

interface OptionCardProps {
  icon: string;
  title: string;
  description: string;
  buttonLabel: string;
  buttonColor: string;
  onClick: () => void;
  recommended?: boolean;
}

function OptionCard({ icon, title, description, buttonLabel, buttonColor, onClick, recommended }: OptionCardProps) {
  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '16px',
      padding: '28px 24px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
      border: recommended ? `2px solid ${buttonColor}` : '2px solid transparent',
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      position: 'relative',
    }}>
      {recommended && (
        <div style={{
          position: 'absolute', top: '-12px', left: '24px',
          backgroundColor: buttonColor, color: 'white',
          fontSize: '11px', fontWeight: '700', padding: '3px 10px',
          borderRadius: '20px', letterSpacing: '0.05em',
          textTransform: 'uppercase'
        }}>
          Recommended
        </div>
      )}
      <div style={{ fontSize: '32px' }}>{icon}</div>
      <div style={{ fontSize: '17px', fontWeight: '700', color: '#1e293b' }}>{title}</div>
      <div style={{ fontSize: '14px', color: '#64748b', lineHeight: '1.6', flexGrow: 1 }}>{description}</div>
      <button
        onClick={onClick}
        style={{
          backgroundColor: buttonColor, color: 'white',
          padding: '11px 20px', border: 'none', borderRadius: '10px',
          fontSize: '14px', fontWeight: '600', cursor: 'pointer',
          marginTop: '4px', transition: 'opacity 0.15s'
        }}
        onMouseEnter={e => { e.currentTarget.style.opacity = '0.88'; }}
        onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
      >
        {buttonLabel}
      </button>
    </div>
  );
}

function GetTemplate() {
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', display: 'flex', flexDirection: 'column' }}>

      <PageNav />

      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: isMobile ? '32px 16px 40px' : '48px 40px 56px',
        overflowY: 'auto',
      }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '36px', maxWidth: '680px' }}>
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
          gap: '20px',
          width: '100%',
          maxWidth: '960px',
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
            title="Template Wizard"
            description="Answer a few questions and build your comment bank as you write reports. Perfect if you're starting from scratch."
            buttonLabel="Start Wizard"
            buttonColor="#3b82f6"
            onClick={() => navigate('/create-template', { state: { method: 'build-as-you-go', from: 'get-template' } })}
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
    </div>
  );
}

export default GetTemplate;