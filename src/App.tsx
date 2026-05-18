import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Link, Navigate, useNavigate } from 'react-router-dom';
import './App.css';

// Context Providers
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DataProvider, useData } from './contexts/DataContext';
import { SubscriptionProvider } from './contexts/SubscriptionContext';

// Import pages (not components!)
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

// ─── HAMBURGER MENU (shared) ──────────────────────────────────────────────────

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
        style={{ width: '40px', height: '40px', border: '2px solid #e5e7eb', borderRadius: '8px', backgroundColor: 'white', cursor: 'pointer', fontSize: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', transition: 'all 0.2s' }}
        onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#f9fafb'; }}
        onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'white'; }}>
        ☰
      </button>
      {showMenu && (
        <div style={{ position: 'absolute', top: '45px', right: '0', backgroundColor: 'white', border: '2px solid #e5e7eb', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', minWidth: '150px', overflow: 'hidden' }}>
          <button onClick={() => { alert('Account details coming soon!'); setShowMenu(false); }}
            style={menuItemStyle}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#f9fafb'; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}>
            👤 Account
          </button>
          <button onClick={() => { alert('Settings coming soon!'); setShowMenu(false); }}
            style={menuItemStyle}
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

// ─── HOME COMPONENT ───────────────────────────────────────────────────────────
// Always the starting point. "Which class are you writing reports for?"
// Class first — it anchors the session and gives the teacher immediate ownership.

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
  const hasTemplates = state.templates.length > 0;

  const hoverOn = (e: React.MouseEvent<HTMLElement>) => {
    if (!isMobile) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 15px rgba(0,0,0,0.15)'; }
  };
  const hoverOff = (e: React.MouseEvent<HTMLElement>) => {
    if (!isMobile) { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)'; }
  };

  const cardBtn = (bg: string): React.CSSProperties => ({
    backgroundColor: bg, color: 'white',
    padding: isMobile ? '28px 24px' : '32px 28px',
    borderRadius: isMobile ? '8px' : '12px',
    textDecoration: 'none', textAlign: 'center',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    transition: 'transform 0.2s, box-shadow 0.2s',
    width: '100%', boxSizing: 'border-box' as const,
    display: 'flex', flexDirection: 'column' as const,
    alignItems: 'center', justifyContent: 'center', gap: '6px',
    cursor: 'pointer', border: 'none',
  });

  return (
    <>
      <HamburgerMenu isMobile={isMobile} />

      <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', padding: isMobile ? '40px 16px' : '60px 20px 40px' }}>

        {/* Title */}
        <div style={{ textAlign: 'center', marginBottom: isMobile ? '8px' : '12px' }}>
          <h1 style={{ fontSize: isMobile ? '26px' : '42px', fontWeight: '800', color: '#1e293b', margin: '0 0 10px 0', lineHeight: 1.2 }}>
            Ready to Report
          </h1>
          <p style={{ fontSize: isMobile ? '14px' : '16px', color: '#64748b', margin: 0, maxWidth: '480px' }}>
            High quality, error-free reports — in your own words, quickly.
          </p>
        </div>

        <div style={{ width: '100%', maxWidth: isMobile ? 'none' : '760px', display: 'flex', flexDirection: 'column', gap: isMobile ? '14px' : '18px', marginTop: isMobile ? '28px' : '40px' }}>

          {/* ── CLASS SECTION ── */}
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: isMobile ? '20px' : '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', border: '1px solid #e5e7eb' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: hasClasses ? '14px' : '0' }}>
              <div>
                <div style={{ fontSize: isMobile ? '16px' : '18px', fontWeight: '700', color: '#1e293b' }}>
                  👥 Your Classes
                </div>
                <div style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
                  {hasClasses
                    ? `${state.classes.length} ${state.classes.length === 1 ? 'class' : 'classes'} saved`
                    : 'Add your class to get started'}
                </div>
              </div>
              <Link to="/class-management"
                style={{ backgroundColor: '#8b5cf6', color: 'white', padding: '8px 16px', borderRadius: '8px', textDecoration: 'none', fontSize: '13px', fontWeight: '600', whiteSpace: 'nowrap' }}>
                {hasClasses ? 'Manage' : '+ Add Class'}
              </Link>
            </div>

            {/* Class list — click to go straight to write reports */}
            {hasClasses && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {state.classes.map(cls => (
                  <button key={cls.id} onClick={() => navigate('/write-reports', { state: { preselectedClassId: cls.id } })}
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s', width: '100%' }}
                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#f0fdf4'; e.currentTarget.style.borderColor = '#10b981'; }}
                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#f9fafb'; e.currentTarget.style.borderColor = '#e5e7eb'; }}>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>{cls.name}</div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>{cls.students.length} pupils</div>
                    </div>
                    <div style={{ fontSize: '13px', color: '#10b981', fontWeight: '600' }}>Write reports →</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── TEMPLATE SECTION ── */}
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: isMobile ? '20px' : '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', border: '1px solid #e5e7eb' }}>
            <div style={{ fontSize: isMobile ? '16px' : '18px', fontWeight: '700', color: '#1e293b', marginBottom: '6px' }}>
              📋 Report Templates
            </div>
            <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>
              {hasTemplates
                ? `${state.templates.length} ${state.templates.length === 1 ? 'template' : 'templates'} saved`
                : 'You need a template before you can write reports'}
            </div>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' as const }}>
              {/* Need a template */}
              <button onClick={() => navigate('/get-template')}
                style={{ ...cardBtn('#3b82f6'), flex: '1 1 200px', padding: isMobile ? '20px 16px' : '22px 20px' }}
                onMouseEnter={hoverOn} onMouseLeave={hoverOff}>
                <span style={{ fontSize: isMobile ? '15px' : '17px', fontWeight: '700' }}>
                  {hasTemplates ? '+ New Template' : 'Need a template?'}
                </span>
                <span style={{ fontSize: '12px', opacity: 0.9 }}>Choose how to create one</span>
              </button>

              {/* Got one saved */}
              {hasTemplates && (
                <button onClick={() => navigate('/manage-templates')}
                  style={{ ...cardBtn('#10b981'), flex: '1 1 200px', padding: isMobile ? '20px 16px' : '22px 20px' }}
                  onMouseEnter={hoverOn} onMouseLeave={hoverOff}>
                  <span style={{ fontSize: isMobile ? '15px' : '17px', fontWeight: '700' }}>Manage Templates</span>
                  <span style={{ fontSize: '12px', opacity: 0.9 }}>Edit, import or delete</span>
                </button>
              )}

              {/* No templates yet — second option */}
              {!hasTemplates && (
                <button onClick={() => navigate('/manage-templates')}
                  style={{ ...cardBtn('#6b7280'), flex: '1 1 200px', padding: isMobile ? '20px 16px' : '22px 20px' }}
                  onMouseEnter={hoverOn} onMouseLeave={hoverOff}>
                  <span style={{ fontSize: isMobile ? '15px' : '17px', fontWeight: '700' }}>Got one saved?</span>
                  <span style={{ fontSize: '12px', opacity: 0.9 }}>Import a file or restore a template</span>
                </button>
              )}
            </div>
          </div>

          {/* ── VIEW REPORTS ── smaller, bottom ── */}
          {state.reports && state.reports.length > 0 && (
            <Link to="/view-reports"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: isMobile ? '14px 18px' : '16px 22px', backgroundColor: 'white', borderRadius: '10px', textDecoration: 'none', border: '1px solid #e5e7eb', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', transition: 'all 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#6366f1'; e.currentTarget.style.backgroundColor = '#f8f7ff'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.backgroundColor = 'white'; }}>
              <div>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>📄 View Saved Reports</div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>{state.reports.length} report{state.reports.length !== 1 ? 's' : ''} saved</div>
              </div>
              <div style={{ fontSize: '13px', color: '#6366f1', fontWeight: '600' }}>View →</div>
            </Link>
          )}

        </div>
      </div>
    </>
  );
}

// ─── GET TEMPLATE PAGE ────────────────────────────────────────────────────────
// The four template creation methods, presented clearly with honest descriptions.

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
    },
    {
      icon: '📚',
      title: 'Import from Library',
      badge: 'Coming soon',
      badgeColor: '#9ca3af',
      description: 'Choose from our growing library of ready-made templates, then edit on the go to suit your subject and school.',
      action: () => alert('Template library coming soon!'),
      borderColor: '#d1d5db',
      bgColor: '#f9fafb',
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
    },
  ];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', padding: isMobile ? '24px 16px' : '48px 24px' }}>
      <div style={{ maxWidth: '720px', margin: '0 auto' }}>

        {/* Back */}
        <button onClick={() => navigate('/')}
          style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '14px', cursor: 'pointer', padding: '0 0 24px 0', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '500' }}>
          ← Back
        </button>

        <h1 style={{ fontSize: isMobile ? '24px' : '32px', fontWeight: '800', color: '#1e293b', marginBottom: '8px' }}>
          Get a Template
        </h1>
        <p style={{ fontSize: '15px', color: '#64748b', marginBottom: '32px', lineHeight: '1.6' }}>
          Choose how you'd like to create your report template. You can always switch approach or create more templates later.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {options.map((opt, i) => (
            <button key={i} onClick={opt.action}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: '18px',
                backgroundColor: opt.bgColor,
                border: `2px solid ${opt.borderColor}`,
                borderRadius: '12px', padding: isMobile ? '20px 18px' : '24px 22px',
                cursor: opt.title === 'Import from Library' ? 'default' : 'pointer',
                textAlign: 'left', transition: 'all 0.15s', width: '100%',
                opacity: opt.title === 'Import from Library' ? 0.7 : 1,
              }}
              onMouseEnter={e => {
                if (opt.title !== 'Import from Library') {
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
              {opt.title !== 'Import from Library' && (
                <div style={{ fontSize: '18px', color: opt.borderColor, flexShrink: 0, alignSelf: 'center' }}>→</div>
              )}
            </button>
          ))}
        </div>

        {/* Already have a saved template */}
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
                {/* Auth Routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />

                {/* Admin Route */}
                <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />

                {/* Public Routes */}
                <Route path="/pricing" element={<PricingPage />} />
                <Route path="/subscription/success" element={<SubscriptionSuccess />} />

                {/* Protected Routes */}
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