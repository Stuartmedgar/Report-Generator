import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Link, Navigate, useNavigate } from 'react-router-dom';
import './App.css';

// Context Providers
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DataProvider, useData } from './contexts/DataContext';
import { SubscriptionProvider } from './contexts/SubscriptionContext';

// Import pages
import WriteReports from './pages/WriteReports';
import CreateTemplate from './pages/CreateTemplate';
import ManageTemplates from './pages/ManageTemplates';
import ClassManagement from './pages/ClassManagement';
import ViewReports from './pages/ViewReports';
import ClassReports from './pages/ClassReports';
import IndividualReportViewer from './pages/IndividualReportViewer';
import AllReportsViewer from './pages/AllReportsViewer';
import Login from './pages/Login';
import Signup from './pages/Signup';
import AdminDashboard from './pages/AdminDashboard';
import ImportTemplate from './pages/ImportTemplate';
import TemplateReview from './pages/TemplateReview';

// Import subscription components
import { PricingPage, SubscriptionSuccess } from './components/subscription';

// ─── PROTECTED ROUTE ──────────────────────────────────────────────────────────

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', fontSize: '18px', color: '#64748b' }}>
        Loading...
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

// ─── HAMBURGER MENU ───────────────────────────────────────────────────────────

function HamburgerMenu({ isMobile }: { isMobile: boolean }) {
  const { signOut } = useAuth();
  const [showMenu, setShowMenu] = useState(false);

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to logout?')) {
      try { await signOut(); } catch (error) { console.error('Error signing out:', error); }
    }
  };

  const menuItemStyle: React.CSSProperties = {
    width: '100%', padding: '12px 16px', border: 'none',
    backgroundColor: 'transparent', textAlign: 'left',
    cursor: 'pointer', fontSize: '14px', borderBottom: '1px solid #f3f4f6',
  };

  return (
    <div style={{ position: isMobile ? 'fixed' : 'absolute', top: isMobile ? '16px' : '20px', right: isMobile ? '16px' : '20px', zIndex: 1000 }}>
      <button onClick={() => setShowMenu(!showMenu)}
        style={{ width: '40px', height: '40px', border: '2px solid #e5e7eb', borderRadius: '8px', backgroundColor: 'white', cursor: 'pointer', fontSize: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
        onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#f9fafb'; }}
        onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'white'; }}>
        ☰
      </button>
      {showMenu && (
        <div style={{ position: 'absolute', top: '45px', right: '0', backgroundColor: 'white', border: '2px solid #e5e7eb', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', minWidth: '150px', overflow: 'hidden' }}>
          <button onClick={() => { alert('Account details coming soon!'); setShowMenu(false); }} style={menuItemStyle}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#f9fafb'; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}>
            👤 Account
          </button>
          <button onClick={() => { alert('Settings coming soon!'); setShowMenu(false); }} style={menuItemStyle}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#f9fafb'; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}>
            ⚙️ Settings
          </button>
          <button onClick={() => { handleLogout(); setShowMenu(false); }}
            style={{ ...menuItemStyle, borderBottom: 'none', color: '#ef4444' }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#fef2f2'; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}>
            🚪 Logout
          </button>
        </div>
      )}
    </div>
  );
}

// ─── HOME ─────────────────────────────────────────────────────────────────────

function Home() {
  const { state } = useData();
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const hasClasses = state.classes.length > 0;

  const hoverOn = (e: React.MouseEvent<HTMLElement>) => {
    if (!isMobile) {
      e.currentTarget.style.transform = 'translateY(-2px)';
      e.currentTarget.style.boxShadow = '0 8px 15px rgba(0,0,0,0.15)';
    }
  };
  const hoverOff = (e: React.MouseEvent<HTMLElement>) => {
    if (!isMobile) {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
    }
  };

  const bigBtn = (bg: string): React.CSSProperties => ({
    backgroundColor: bg,
    color: 'white',
    padding: isMobile ? '36px 24px' : '44px 32px',
    borderRadius: isMobile ? '8px' : '12px',
    border: 'none',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    transition: 'transform 0.2s, box-shadow 0.2s',
    cursor: 'pointer',
    width: '100%',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    boxSizing: 'border-box' as const,
  });

  return (
    <>
      <HamburgerMenu isMobile={isMobile} />

      <div style={{
        minHeight: '100vh',
        backgroundColor: '#f8fafc',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: isMobile ? '60px 16px 40px' : '60px 20px 40px',
      }}>
        {/* Title */}
        <div style={{ textAlign: 'center', marginBottom: isMobile ? '36px' : '48px', maxWidth: '600px' }}>
          <h1 style={{ fontSize: isMobile ? '28px' : '48px', fontWeight: '800', color: '#1e293b', margin: '0 0 12px 0', lineHeight: 1.2 }}>
            Ready to Report
          </h1>
          <p style={{ fontSize: isMobile ? '15px' : '18px', color: '#64748b', margin: 0, lineHeight: 1.6 }}>
            Let's get you started. Select the class you want to write reports for.
          </p>
        </div>

        {/* Two big buttons */}
        <div style={{
          width: '100%',
          maxWidth: isMobile ? 'none' : '680px',
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
          gap: isMobile ? '16px' : '20px',
        }}>

          {/* Create a class */}
          <button onClick={() => navigate('/class-management')}
            style={bigBtn('#8b5cf6')}
            onMouseEnter={hoverOn}
            onMouseLeave={hoverOff}>
            <span style={{ fontSize: '32px', lineHeight: 1 }}>➕</span>
            <span style={{ fontSize: isMobile ? '18px' : '21px', fontWeight: '700' }}>Create a Class</span>
            <span style={{ fontSize: '13px', opacity: 0.9, fontWeight: '400' }}>Add your pupils to get started</span>
          </button>

          {/* Your current classes */}
          <button onClick={() => navigate('/write-reports')}
            style={bigBtn('#10b981')}
            onMouseEnter={hoverOn}
            onMouseLeave={hoverOff}>
            <span style={{ fontSize: '32px', lineHeight: 1 }}>📋</span>
            <span style={{ fontSize: isMobile ? '18px' : '21px', fontWeight: '700' }}>Your Classes</span>
            <span style={{ fontSize: '13px', opacity: 0.9, fontWeight: '400' }}>
              {hasClasses
                ? `${state.classes.length} ${state.classes.length === 1 ? 'class' : 'classes'} saved`
                : 'Select and write reports'}
            </span>
          </button>

        </div>

        {/* Subtle links for returning users */}
        <div style={{
          display: 'flex',
          gap: '24px',
          marginTop: '32px',
          flexWrap: 'wrap' as const,
          justifyContent: 'center',
        }}>
          {[
            { label: 'Report Templates', to: '/manage-templates' },
            { label: 'View Saved Reports', to: '/view-reports' },
          ].map(link => (
            <Link key={link.to} to={link.to}
              style={{ fontSize: '14px', color: '#94a3b8', textDecoration: 'none', fontWeight: '500', transition: 'color 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.color = '#64748b'; }}
              onMouseLeave={e => { e.currentTarget.style.color = '#94a3b8'; }}>
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}

// ─── GET TEMPLATE PAGE ────────────────────────────────────────────────────────

function GetTemplate() {
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const options = [
    {
      icon: '⚡',
      title: 'AI Quick Start',
      badge: 'Fastest',
      badgeColor: '#10b981',
      description: 'Upload a set of your existing reports and we\'ll build your template using your own words and phrases. When you start writing, use the live editing tools to refine it further.',
      action: () => navigate('/import-template'),
      borderColor: '#10b981',
      bgColor: '#f0fdf4',
      disabled: false,
    },
    {
      icon: '🧱',
      title: 'Build as You Go',
      badge: 'Recommended',
      badgeColor: '#3b82f6',
      description: 'Answer a few questions about your reports, add a handful of comments to get started, then write reports and build your template as you go. Most teachers are writing within minutes.',
      action: () => navigate('/create-template', { state: { method: 'build-as-you-go' } }),
      borderColor: '#3b82f6',
      bgColor: '#eff6ff',
      disabled: false,
    },
    {
      icon: '🪄',
      title: 'Template Wizard',
      badge: null,
      badgeColor: '',
      description: 'We guide you through creating your template step by step with AI assistance. Can be used with or without existing reports. Most teachers are writing within 20 minutes.',
      action: () => navigate('/import-template'),
      borderColor: '#8b5cf6',
      bgColor: '#f5f3ff',
      disabled: false,
    },
    {
      icon: '📚',
      title: 'Import from Library',
      badge: 'Coming soon',
      badgeColor: '#9ca3af',
      description: 'Choose from our growing library of ready-made templates, then edit on the go to suit your subject and school.',
      action: () => {},
      borderColor: '#d1d5db',
      bgColor: '#f9fafb',
      disabled: true,
    },
    {
      icon: '⚙️',
      title: 'Free Build',
      badge: null,
      badgeColor: '',
      description: 'Start with a blank canvas and build your template section by section. The slowest way to start but gives you complete control from the beginning.',
      action: () => navigate('/create-template', { state: { method: 'manual' } }),
      borderColor: '#d1d5db',
      bgColor: '#f9fafb',
      disabled: false,
    },
  ];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', padding: isMobile ? '24px 16px' : '48px 24px' }}>
      <div style={{ maxWidth: '720px', margin: '0 auto' }}>

        <button onClick={() => navigate('/')}
          style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '14px', cursor: 'pointer', padding: '0 0 24px 0', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '500' }}>
          ← Back
        </button>

        <h1 style={{ fontSize: isMobile ? '24px' : '32px', fontWeight: '800', color: '#1e293b', marginBottom: '8px' }}>
          Get a Template
        </h1>
        <p style={{ fontSize: '15px', color: '#64748b', marginBottom: '32px', lineHeight: '1.6' }}>
          Choose how you'd like to create your report template. You can always create more later.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {options.map((opt, i) => (
            <button key={i} onClick={opt.disabled ? undefined : opt.action}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: '18px',
                backgroundColor: opt.bgColor,
                border: `2px solid ${opt.borderColor}`,
                borderRadius: '12px',
                padding: isMobile ? '20px 18px' : '24px 22px',
                cursor: opt.disabled ? 'default' : 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s',
                width: '100%',
                opacity: opt.disabled ? 0.6 : 1,
              }}
              onMouseEnter={e => {
                if (!opt.disabled) {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                }
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}>
              <div style={{ fontSize: '28px', flexShrink: 0, lineHeight: 1, paddingTop: '2px' }}>{opt.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' as const }}>
                  <span style={{ fontSize: isMobile ? '16px' : '18px', fontWeight: '700', color: '#1e293b' }}>{opt.title}</span>
                  {opt.badge && (
                    <span style={{ fontSize: '11px', backgroundColor: opt.badgeColor, color: 'white', padding: '2px 8px', borderRadius: '10px', fontWeight: '600' }}>
                      {opt.badge}
                    </span>
                  )}
                </div>
                <p style={{ fontSize: isMobile ? '13px' : '14px', color: '#4b5563', margin: 0, lineHeight: '1.6' }}>
                  {opt.description}
                </p>
              </div>
              {!opt.disabled && (
                <div style={{ fontSize: '18px', color: opt.borderColor, flexShrink: 0, alignSelf: 'center' }}>→</div>
              )}
            </button>
          ))}
        </div>

        {/* Already have one saved */}
        <div style={{ marginTop: '24px', padding: '18px 22px', backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' as const, gap: '12px' }}>
          <div>
            <div style={{ fontSize: '15px', fontWeight: '600', color: '#111827' }}>Already have a saved template?</div>
            <div style={{ fontSize: '13px', color: '#6b7280' }}>Import from a file or select one you've already created.</div>
          </div>
          <button onClick={() => navigate('/manage-templates')}
            style={{ backgroundColor: '#1e293b', color: 'white', border: 'none', borderRadius: '8px', padding: '10px 18px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap' as const }}>
            Go to Templates →
          </button>
        </div>

      </div>
    </div>
  );
}

// ─── APP ──────────────────────────────────────────────────────────────────────

function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <SubscriptionProvider>
          <Router>
            <div className="App">
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
                <Route path="/pricing" element={<PricingPage />} />
                <Route path="/subscription/success" element={<SubscriptionSuccess />} />
                <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
                <Route path="/get-template" element={<ProtectedRoute><GetTemplate /></ProtectedRoute>} />
                <Route path="/write-reports" element={<ProtectedRoute><WriteReports /></ProtectedRoute>} />
                <Route path="/create-template" element={<ProtectedRoute><CreateTemplate /></ProtectedRoute>} />
                <Route path="/manage-templates" element={<ProtectedRoute><ManageTemplates /></ProtectedRoute>} />
                <Route path="/import-template" element={<ProtectedRoute><ImportTemplate /></ProtectedRoute>} />
                <Route path="/template-review" element={<ProtectedRoute><TemplateReview /></ProtectedRoute>} />
                <Route path="/class-management" element={<ProtectedRoute><ClassManagement /></ProtectedRoute>} />
                <Route path="/view-reports" element={<ProtectedRoute><ViewReports /></ProtectedRoute>} />
                <Route path="/view-reports/:classId" element={<ProtectedRoute><ClassReports /></ProtectedRoute>} />
                <Route path="/view-reports/:classId/student/:studentId" element={<ProtectedRoute><IndividualReportViewer /></ProtectedRoute>} />
                <Route path="/view-reports/:classId/all" element={<ProtectedRoute><AllReportsViewer /></ProtectedRoute>} />
              </Routes>
            </div>
          </Router>
        </SubscriptionProvider>
      </DataProvider>
    </AuthProvider>
  );
}

export default App;