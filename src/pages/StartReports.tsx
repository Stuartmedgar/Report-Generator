import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

function StartReports() {
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
      justifyContent: 'center',
      padding: isMobile ? '40px 16px' : '60px 40px',
    }}>

      {/* Back to Home */}
      <div style={{ width: '100%', maxWidth: '860px', marginBottom: '32px' }}>
        <Link to="/" style={{ color: '#6b7280', textDecoration: 'none', fontSize: '14px' }}>
          ← Back to Home
        </Link>
      </div>

      {/* Step indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '36px' }}>
        <div style={{
          width: '36px', height: '36px', borderRadius: '50%',
          backgroundColor: '#8b5cf6', color: 'white',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '15px', fontWeight: '700'
        }}>1</div>
        <div style={{ width: '60px', height: '3px', backgroundColor: '#e2e8f0', borderRadius: '2px' }} />
        <div style={{
          width: '36px', height: '36px', borderRadius: '50%',
          backgroundColor: '#e2e8f0', color: '#94a3b8',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '15px', fontWeight: '700'
        }}>2</div>
      </div>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '48px', maxWidth: '680px', width: '100%' }}>
        <p style={{
          fontSize: '13px', fontWeight: '600', color: '#8b5cf6',
          textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 10px 0'
        }}>
          Step 1
        </p>
        <h1 style={{
          fontSize: isMobile ? '32px' : '44px', fontWeight: '800',
          color: '#1e293b', margin: '0 0 14px 0', lineHeight: '1.15'
        }}>
          Upload a Class
        </h1>
        <p style={{ fontSize: isMobile ? '15px' : '17px', color: '#64748b', margin: 0, lineHeight: '1.6' }}>
          To start writing reports you need to input your pupils.
        </p>
      </div>

      {/* Buttons */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
        gap: '24px',
        width: '100%',
        maxWidth: '860px'
      }}>

        {/* Create a Class */}
        <Link to="/class-management?create=true" style={{ textDecoration: 'none' }}>
          <div
            style={{
              backgroundColor: '#8b5cf6', color: 'white',
              borderRadius: '16px',
              padding: isMobile ? '40px 28px' : '56px 40px',
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
            <div style={{ fontSize: '44px', marginBottom: '16px' }}>➕</div>
            <div style={{ fontSize: isMobile ? '20px' : '24px', fontWeight: '700', marginBottom: '10px' }}>
              Create a Class
            </div>
            <div style={{ fontSize: '14px', opacity: 0.88, lineHeight: '1.5' }}>
              Add a new class and enter your pupils
            </div>
          </div>
        </Link>

        {/* Already created */}
        <Link to="/select-class" style={{ textDecoration: 'none' }}>
          <div
            style={{
              backgroundColor: '#10b981', color: 'white',
              borderRadius: '16px',
              padding: isMobile ? '40px 28px' : '56px 40px',
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
            <div style={{ fontSize: '44px', marginBottom: '16px' }}>👥</div>
            <div style={{ fontSize: isMobile ? '20px' : '24px', fontWeight: '700', marginBottom: '10px' }}>
              Already Created
            </div>
            <div style={{ fontSize: '14px', opacity: 0.88, lineHeight: '1.5' }}>
              Select here to pick an existing class
            </div>
          </div>
        </Link>

      </div>
    </div>
  );
}

export default StartReports;