import React, { ReactNode } from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export default function ProtectedRoute({ children, fallback }: ProtectedRouteProps): React.ReactElement {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#f8fafc',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '40px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          textAlign: 'center',
          maxWidth: '400px'
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            border: '3px solid #e2e8f0',
            borderTop: '3px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px auto'
          }}></div>
          <h2 style={{
            fontSize: '20px',
            fontWeight: '600',
            color: '#1e293b',
            marginBottom: '8px'
          }}>
            Loading Report Generator
          </h2>
          <p style={{
            color: '#64748b',
            fontSize: '16px'
          }}>
            Please wait while we set up your workspace...
          </p>
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (!user) {
    return (
      <div>
        {fallback || <LoginRequired />}
      </div>
    );
  }

  return <>{children}</>;
}

function LoginRequired(): React.ReactElement {
  const { signIn } = useAuth();

  const handleLogin = () => {
    signIn('', ''); // This will open the Netlify Identity modal
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        padding: '40px',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
        textAlign: 'center',
        maxWidth: '500px',
        width: '100%'
      }}>
        <div style={{
          width: '64px',
          height: '64px',
          backgroundColor: '#3b82f6',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 24px auto'
        }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <rect x="3" y="11" width="18" height="10" rx="2" ry="2"/>
            <circle cx="12" cy="16" r="1"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </div>
        
        <h1 style={{
          fontSize: '28px',
          fontWeight: '700',
          color: '#1e293b',
          marginBottom: '12px'
        }}>
          Welcome to Report Generator
        </h1>
        
        <p style={{
          fontSize: '18px',
          color: '#64748b',
          marginBottom: '8px',
          lineHeight: '1.5'
        }}>
          Please sign in to access your reports and templates
        </p>
        
        <p style={{
          fontSize: '14px',
          color: '#94a3b8',
          marginBottom: '32px'
        }}>
          Your data will be securely synced across all your devices
        </p>
        
        <button
          onClick={handleLogin}
          style={{
            backgroundColor: '#3b82f6',
            color: 'white',
            padding: '16px 32px',
            borderRadius: '12px',
            border: 'none',
            fontSize: '18px',
            fontWeight: '600',
            cursor: 'pointer',
            width: '100%',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#2563eb';
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 8px 15px rgba(0, 0, 0, 0.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#3b82f6';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
          }}
        >
          Sign In / Create Account
        </button>
        
        <div style={{
          marginTop: '24px',
          padding: '20px',
          backgroundColor: '#f8fafc',
          borderRadius: '8px',
          textAlign: 'left'
        }}>
          <h3 style={{
            fontSize: '16px',
            fontWeight: '600',
            color: '#1e293b',
            marginBottom: '12px'
          }}>
            Why do I need to sign in?
          </h3>
          <ul style={{
            fontSize: '14px',
            color: '#64748b',
            lineHeight: '1.6',
            paddingLeft: '20px'
          }}>
            <li>Access your reports from any device</li>
            <li>Secure cloud backup of all your work</li>
            <li>Never lose your templates and classes</li>
            <li>Enhanced privacy and data protection</li>
          </ul>
        </div>
      </div>
    </div>
  );
}