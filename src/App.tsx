import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Link, Navigate, useNavigate } from 'react-router-dom';
import './App.css';

// Context Providers
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DataProvider, useData } from './contexts/DataContext';
import { SubscriptionProvider, useSubscription } from './contexts/SubscriptionContext';

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
import StartReports from './pages/StartReports';

// Import subscription components
import { PricingPage, SubscriptionSuccess } from './components/subscription';

// Protected Route Component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        fontSize: '18px',
        color: '#64748b'
      }}>
        Loading...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

// ─── HOME COMPONENT ───────────────────────────────────────────────────────────

function Home() {
  const { user, signOut, promoRedemption, clearPromoRedemption } = useAuth();
  const { state } = useData();
  const { currentPlan, subscription } = useSubscription();
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to logout?')) {
      try {
        await signOut();
      } catch (error) {
        console.error('Error signing out:', error);
      }
    }
  };

  // ─── A class counts as "unfinished" when at least one report has been
  //     started for it but not every student in the class has one yet.
  const hasUnfinishedClass = state.classes.some(classData => {
    const reportCount = state.reports.filter(r => r.classId === classData.id).length;
    return reportCount > 0 && reportCount < classData.students.length;
  });

  // ─── Find the most recently updated report across ALL classes,
  //     set sessionStorage the same way ClassManagement's orange button does,
  //     then navigate straight into the report writer.
  const handleContinueWriting = () => {
    if (state.reports.length === 0) {
      navigate('/no-reports');
      return;
    }

    // Find most recent report
    const mostRecentReport = state.reports.reduce((latest, current) =>
      new Date(current.updatedAt || current.createdAt) > new Date(latest.updatedAt || latest.createdAt)
        ? current : latest
    );

    const classId = mostRecentReport.classId;
    const classData = state.classes.find(c => c.id === classId);
    if (!classData) { navigate('/no-reports'); return; }

    const studentIndex = classData.students.findIndex(s => s.id === mostRecentReport.studentId);
    sessionStorage.setItem('continueEditing', JSON.stringify({
      classId,
      templateId: mostRecentReport.templateId,
      studentIndex: studentIndex >= 0 ? studentIndex : 0
    }));
    navigate('/write-reports');
  };

  return (
    <>
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#f8fafc',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: isMobile ? '40px 20px' : '60px 40px',
        position: 'relative',
      }}>

        {promoRedemption && (
          <div style={{
            position: 'fixed',
            top: '16px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 200,
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            backgroundColor: promoRedemption.type === 'success' ? '#eff6ff' : '#fee2e2',
            border: `1px solid ${promoRedemption.type === 'success' ? '#bfdbfe' : '#fecaca'}`,
            color: promoRedemption.type === 'success' ? '#1e40af' : '#991b1b',
            borderRadius: '10px',
            padding: '12px 16px',
            fontSize: '14px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
            maxWidth: '90vw'
          }}>
            <span>{promoRedemption.message}</span>
            <button
              onClick={clearPromoRedemption}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontSize: '16px', lineHeight: 1 }}
            >
              ×
            </button>
          </div>
        )}

        {/* Menu button */}
        <div style={{ position: 'absolute', top: isMobile ? '16px' : '24px', right: isMobile ? '16px' : '24px' }}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            style={{
              background: 'none', border: '1px solid #e2e8f0', borderRadius: '8px',
              padding: '8px 12px', cursor: 'pointer', fontSize: '20px',
              color: '#64748b', backgroundColor: 'white'
            }}
          >
            ☰
          </button>
          {showMenu && (
            <div style={{
              position: 'absolute', top: '44px', right: 0,
              backgroundColor: 'white', border: '1px solid #e2e8f0',
              borderRadius: '10px', boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
              padding: '8px', minWidth: '180px', zIndex: 100
            }}>
              {user ? (
                <>
                  <div style={{ padding: '6px 14px 10px' }}>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: subscription.planId === 'teacher_pro_annual' ? '#1d4ed8' : '#1e293b' }}>
                      {currentPlan.name}
                    </div>
                    {user.app_metadata?.proExpiresAt && (
                      <div style={{ fontSize: '12px', color: '#64748b' }}>
                        Until {new Date(user.app_metadata.proExpiresAt).toLocaleDateString()}
                      </div>
                    )}
                    <Link to="/pricing" style={{ fontSize: '12px', color: '#3b82f6', textDecoration: 'none' }}>
                      {subscription.planId === 'teacher_pro_annual' ? 'Manage plan' : 'Upgrade or enter a promo code'}
                    </Link>
                  </div>
                  <div style={{ borderTop: '1px solid #f1f5f9', margin: '6px 0' }} />
                  <Link to="/manage-templates" style={{ display: 'block', padding: '10px 14px', color: '#374151', textDecoration: 'none', fontSize: '14px', borderRadius: '6px' }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f8fafc'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                  >📝 Manage Templates</Link>
                  <Link to="/class-management" style={{ display: 'block', padding: '10px 14px', color: '#374151', textDecoration: 'none', fontSize: '14px', borderRadius: '6px' }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f8fafc'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                  >👥 Your Classes</Link>
                  <Link to="/view-reports" style={{ display: 'block', padding: '10px 14px', color: '#374151', textDecoration: 'none', fontSize: '14px', borderRadius: '6px' }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f8fafc'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                  >📋 View Reports</Link>
                  <div style={{ borderTop: '1px solid #f1f5f9', margin: '6px 0' }} />
                  <button
                    onClick={handleLogout}
                    style={{ display: 'block', width: '100%', padding: '10px 14px', color: '#ef4444', background: 'none', border: 'none', textAlign: 'left', fontSize: '14px', cursor: 'pointer', borderRadius: '6px' }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#fff5f5'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                  >Sign Out</button>
                </>
              ) : (
                <>
                  <Link to="/login" style={{ display: 'block', padding: '10px 14px', color: '#374151', textDecoration: 'none', fontSize: '14px', borderRadius: '6px' }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f8fafc'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                  >Log In</Link>
                  <Link to="/signup" style={{ display: 'block', padding: '10px 14px', color: '#374151', textDecoration: 'none', fontSize: '14px', borderRadius: '6px' }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f8fafc'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                  >Sign Up Free</Link>
                </>
              )}
            </div>
          )}
        </div>

        {/* Logo / Title */}
        <div style={{ textAlign: 'center', marginBottom: isMobile ? '40px' : '52px' }}>
          <h1 style={{
            fontSize: isMobile ? '38px' : '58px',
            fontWeight: '800',
            color: '#1e293b',
            lineHeight: '1.1',
            margin: '0 0 12px 0'
          }}>
            Ready to Report
          </h1>
          <p style={{
            fontSize: isMobile ? '15px' : '17px',
            color: '#64748b',
            margin: '0 0 6px 0',
            fontWeight: '400'
          }}>
            Helping teachers write high quality reports quickly
          </p>
          <p style={{
            fontSize: isMobile ? '14px' : '16px',
            color: '#94a3b8',
            margin: 0,
            fontStyle: 'italic'
          }}>
            Your Reports. Your Words.
          </p>
        </div>

        {/* Free-tier explainer — only shown to logged-out visitors, so the
            AI sign-up prompt they'll hit later isn't a surprise */}
        {!user && (
          <div style={{
            maxWidth: '480px',
            margin: `0 0 ${isMobile ? '28px' : '36px'} 0`,
            padding: '14px 18px',
            backgroundColor: '#f0f9ff',
            border: '1px solid #bae6fd',
            borderRadius: '10px',
            fontSize: isMobile ? '13px' : '14px',
            color: '#075985',
            textAlign: 'center',
            lineHeight: 1.6
          }}>
            No account needed to build templates by hand or write your first 5 reports.
            Free sign-up only kicks in if you want AI to help build a template from your existing reports.
          </div>
        )}

        {/* Main buttons */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: hasUnfinishedClass && !isMobile ? '1fr 1fr' : '1fr',
          gap: isMobile ? '16px' : '24px',
          width: '100%',
          maxWidth: hasUnfinishedClass ? (isMobile ? '400px' : '700px') : '340px'
        }}>

          {/* Start New Reports */}
          <Link
            to="/start"
            style={{
              backgroundColor: '#8b5cf6',
              color: 'white',
              padding: isMobile ? '44px 24px' : '56px 28px',
              borderRadius: isMobile ? '12px' : '16px',
              textDecoration: 'none',
              textAlign: 'center',
              boxShadow: '0 4px 14px rgba(139,92,246,0.35)',
              transition: 'transform 0.2s, box-shadow 0.2s',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxSizing: 'border-box'
            }}
            onMouseEnter={e => {
              if (!isMobile) {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = '0 10px 24px rgba(139,92,246,0.45)';
              }
            }}
            onMouseLeave={e => {
              if (!isMobile) {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 14px rgba(139,92,246,0.35)';
              }
            }}
          >
            <span style={{ fontSize: isMobile ? '20px' : '24px', fontWeight: '800' }}>
              Start New Reports
            </span>
            <span style={{ fontSize: isMobile ? '13px' : '14px', fontWeight: '500', opacity: 0.88 }}>
              Set up a class and template
            </span>
          </Link>

          {/* Continue Writing — only shown when a class has unfinished reports */}
          {hasUnfinishedClass && (
            <button
              onClick={handleContinueWriting}
              style={{
                backgroundColor: '#10b981',
                color: 'white',
                padding: isMobile ? '44px 24px' : '56px 28px',
                borderRadius: isMobile ? '12px' : '16px',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'center',
                boxShadow: '0 4px 14px rgba(16,185,129,0.35)',
                transition: 'transform 0.2s, box-shadow 0.2s',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                width: '100%',
                boxSizing: 'border-box'
              }}
              onMouseEnter={e => {
                if (!isMobile) {
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.boxShadow = '0 10px 24px rgba(16,185,129,0.45)';
                }
              }}
              onMouseLeave={e => {
                if (!isMobile) {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 14px rgba(16,185,129,0.35)';
                }
              }}
            >
              <span style={{ fontSize: isMobile ? '20px' : '24px', fontWeight: '800' }}>
                Continue Writing
              </span>
              <span style={{ fontSize: isMobile ? '13px' : '14px', fontWeight: '500', opacity: 0.88 }}>
                Pick up where you left off
              </span>
            </button>
          )}
        </div>

        {/* Secondary nav links */}
        <div style={{
          display: 'flex',
          gap: isMobile ? '20px' : '32px',
          marginTop: isMobile ? '32px' : '44px',
          flexWrap: 'wrap',
          justifyContent: 'center'
        }}>
          <Link to="/manage-templates" style={{
            color: '#94a3b8', textDecoration: 'none',
            fontSize: isMobile ? '13px' : '14px', fontWeight: '500'
          }}
            onMouseEnter={e => { e.currentTarget.style.color = '#64748b'; }}
            onMouseLeave={e => { e.currentTarget.style.color = '#94a3b8'; }}
          >
            Report Templates
          </Link>
          <Link to="/view-reports" style={{
            color: '#94a3b8', textDecoration: 'none',
            fontSize: isMobile ? '13px' : '14px', fontWeight: '500'
          }}
            onMouseEnter={e => { e.currentTarget.style.color = '#64748b'; }}
            onMouseLeave={e => { e.currentTarget.style.color = '#94a3b8'; }}
          >
            View Saved Reports
          </Link>
          <Link to="/class-management" style={{
            color: '#94a3b8', textDecoration: 'none',
            fontSize: isMobile ? '13px' : '14px', fontWeight: '500'
          }}
            onMouseEnter={e => { e.currentTarget.style.color = '#64748b'; }}
            onMouseLeave={e => { e.currentTarget.style.color = '#94a3b8'; }}
          >
            Your Classes
          </Link>
        </div>

      </div>
    </>
  );
}

// ─── NO REPORTS PAGE ──────────────────────────────────────────────────────────

function NoReports() {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div style={{
      minHeight: '100vh', backgroundColor: '#f8fafc',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: isMobile ? '40px 16px' : '60px 20px'
    }}>
      <div style={{
        backgroundColor: 'white', borderRadius: '20px',
        padding: isMobile ? '40px 24px' : '56px 48px',
        textAlign: 'center', maxWidth: '520px', width: '100%',
        boxShadow: '0 4px 20px rgba(0,0,0,0.06)'
      }}>
        <div style={{ fontSize: '52px', marginBottom: '20px' }}>📭</div>
        <h2 style={{
          fontSize: isMobile ? '22px' : '26px', fontWeight: '800',
          color: '#1e293b', margin: '0 0 14px 0'
        }}>
          No previous reports found
        </h2>
        <p style={{
          fontSize: '15px', color: '#64748b',
          lineHeight: '1.7', margin: '0 0 10px 0'
        }}>
          Classes and reports are stored locally on this device.
        </p>
        <p style={{
          fontSize: '14px', color: '#94a3b8',
          lineHeight: '1.7', margin: '0 0 32px 0'
        }}>
          If you're on a different computer you won't be able to access your previous classes — they're saved only on the device you used to create them.
        </p>
        <Link to="/start" style={{ textDecoration: 'none' }}>
          <button style={{
            backgroundColor: '#8b5cf6', color: 'white',
            padding: '14px 32px', border: 'none', borderRadius: '10px',
            fontSize: '16px', fontWeight: '700', cursor: 'pointer',
            width: '100%', marginBottom: '12px'
          }}>
            Start New Reports
          </button>
        </Link>
        <Link to="/" style={{ textDecoration: 'none' }}>
          <button style={{
            backgroundColor: 'transparent', color: '#64748b',
            padding: '10px 24px', border: '1px solid #e2e8f0', borderRadius: '10px',
            fontSize: '14px', fontWeight: '500', cursor: 'pointer', width: '100%'
          }}>
            Back to Home
          </button>
        </Link>
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
                <Route path="/admin" element={
                  <ProtectedRoute>
                    <AdminDashboard />
                  </ProtectedRoute>
                } />

                {/* Public Routes */}
                <Route path="/pricing" element={<PricingPage />} />
                <Route path="/subscription/success" element={<SubscriptionSuccess />} />

                {/* Home — public route */}
                <Route path="/" element={<Home />} />

                {/*
                  Free tier requires no account at all: manual template building,
                  writing up to 5 reports, and managing classes/templates/reports
                  all work anonymously off localStorage. Only the AI-powered
                  actions (Quick Build, wizard AI extraction, etc.) require an
                  account — gated inline at the point of use, not at the route.
                */}

                {/* Single onboarding entry point — replaces /select-class, /step2, /get-template, /select-template, /pick-template */}
                <Route path="/start" element={<StartReports />} />

                <Route path="/no-reports" element={<NoReports />} />

                {/* Core app routes */}
                <Route path="/write-reports" element={<WriteReports />} />
                <Route path="/create-template" element={<CreateTemplate />} />
                <Route path="/manage-templates" element={<ManageTemplates />} />
                <Route path="/import-template" element={<ImportTemplate />} />
                <Route path="/template-review" element={<TemplateReview />} />
                <Route path="/class-management" element={<ClassManagement />} />
                <Route path="/view-reports" element={<ViewReports />} />
                <Route path="/view-reports/:classId" element={<ClassReports />} />
                <Route path="/view-reports/:classId/student/:studentId" element={<IndividualReportViewer />} />
                <Route path="/view-reports/:classId/all" element={<AllReportsViewer />} />
              </Routes>
            </div>
          </Router>
        </SubscriptionProvider>
      </DataProvider>
    </AuthProvider>
  );
}

export default App;