import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

function Step2Template() {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'flex-start',
      padding: isMobile ? '40px 16px' : '80px 20px',
    }}>

      {/* Back */}
      <div style={{ width: '100%', maxWidth: '640px', marginBottom: '32px' }}>
        <Link to="/start" style={{ color: '#6b7280', textDecoration: 'none', fontSize: '14px' }}>
          ← Back
        </Link>
      </div>

      {/* Step indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '32px' }}>
        <div style={{
          width: '32px', height: '32px', borderRadius: '50%',
          backgroundColor: '#10b981', color: 'white',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '16px', fontWeight: '700'
        }}>✓</div>
        <div style={{ width: '48px', height: '3px', backgroundColor: '#10b981', borderRadius: '2px' }} />
        <div style={{
          width: '32px', height: '32px', borderRadius: '50%',
          backgroundColor: '#8b5cf6', color: 'white',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '14px', fontWeight: '700'
        }}>2</div>
      </div>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '48px', maxWidth: '580px' }}>
        <p style={{
          fontSize: '13px', fontWeight: '600', color: '#8b5cf6',
          textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 10px 0'
        }}>
          Step 2
        </p>
        <h1 style={{
          fontSize: isMobile ? '30px' : '38px', fontWeight: '800',
          color: '#1e293b', margin: '0 0 14px 0', lineHeight: '1.15'
        }}>
          Create or Select a Template
        </h1>
        <p style={{ fontSize: isMobile ? '15px' : '16px', color: '#64748b', margin: 0, lineHeight: '1.6' }}>
          To write reports you need a template where all of your comments are stored.
        </p>
      </div>

      {/* Buttons */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
        gap: '20px',
        width: '100%',
        maxWidth: '580px'
      }}>

        {/* Need a Template → get-template choice page */}
        <Link to="/get-template" style={{ textDecoration: 'none' }}>
          <div
            style={{
              backgroundColor: '#8b5cf6', color: 'white',
              borderRadius: '16px',
              padding: isMobile ? '40px 24px' : '48px 28px',
              textAlign: 'center', cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(139,92,246,0.3)',
              transition: 'transform 0.2s, box-shadow 0.2s',
              boxSizing: 'border-box'
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)';
              (e.currentTarget as HTMLDivElement).style.boxShadow = '0 10px 24px rgba(139,92,246,0.4)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
              (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 14px rgba(139,92,246,0.3)';
            }}
          >
            <div style={{ fontSize: '38px', marginBottom: '14px' }}>✨</div>
            <div style={{ fontSize: isMobile ? '18px' : '20px', fontWeight: '700', marginBottom: '8px' }}>
              Need a Template
            </div>
            <div style={{ fontSize: '13px', opacity: 0.88, lineHeight: '1.5' }}>
              Create one using AI or build it yourself
            </div>
          </div>
        </Link>

        {/* Got a Template → pick from saved templates */}
        <Link to="/pick-template" style={{ textDecoration: 'none' }}>
          <div
            style={{
              backgroundColor: '#10b981', color: 'white',
              borderRadius: '16px',
              padding: isMobile ? '40px 24px' : '48px 28px',
              textAlign: 'center', cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(16,185,129,0.3)',
              transition: 'transform 0.2s, box-shadow 0.2s',
              boxSizing: 'border-box'
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)';
              (e.currentTarget as HTMLDivElement).style.boxShadow = '0 10px 24px rgba(16,185,129,0.4)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
              (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 14px rgba(16,185,129,0.3)';
            }}
          >
            <div style={{ fontSize: '38px', marginBottom: '14px' }}>📋</div>
            <div style={{ fontSize: isMobile ? '18px' : '20px', fontWeight: '700', marginBottom: '8px' }}>
              Got a Template
            </div>
            <div style={{ fontSize: '13px', opacity: 0.88, lineHeight: '1.5' }}>
              Pick from your saved templates
            </div>
          </div>
        </Link>

      </div>
    </div>
  );
}

export default Step2Template;