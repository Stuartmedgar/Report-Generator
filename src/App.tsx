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
import SelectTemplate from './pages/SelectTemplate';
import StartReports from './pages/StartReports';
import SelectClass from './pages/SelectClass';
import Step2Template from './pages/Step2Template';
import PickTemplate from './pages/PickTemplate';

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
  const { user, signOut } = useAuth();
  const { state } = useData();
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

  const handleContinueWriting = () => {
    const reportsExist = state.reports && state.reports.length > 0;
    if (reportsExist) {
      navigate('/write-reports');
    } else {
      navigate('/no-reports');
    }
  };

  return (
    <>
      {/* Hamburger Menu */}
      <div style={{
        position: isMobile ? 'fixed' : 'absolute',
        top: isMobile ? '16px' : '20px',
        right: isMobile ? '16px' : '20px',
        zIndex: 1000
      }}>
        <button
          onClick={() => setShowMenu(!showMenu)}
          style={{
            width: '40px', height: '40px',
            border: '2px solid #e5e7eb', borderRadius: '8px',
            backgroundColor: 'white', cursor: 'pointer',
            fontSize: '20px', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            transition: 'all 0.2s'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.backgroundColor = '#f9fafb';
            e.currentTarget.style.borderColor = '#d1d5db';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.backgroundColor = 'white';
            e.currentTarget.style.borderColor = '#e5e7eb';
          }}
        >
          ☰
        </button>

        {showMenu && (
          <div style={{
            position: 'absolute', top: '45px', right: '0',
            backgroundColor: 'white', border: '2px solid #e5e7eb',
            borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            minWidth: '150px', overflow: 'hidden'
          }}>
            <button
              onClick={() => { alert('Account details coming soon!'); setShowMenu(false); }}
              style={{ width: '100%', padding: '12px 16px', border: 'none', backgroundColor: 'transparent', textAlign: 'left', cursor: 'pointer', fontSize: '14px', borderBottom: '1px solid #f3f4f6' }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#f9fafb'; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              👤 Account
            </button>
            <button
              onClick={() => { alert('Settings coming soon!'); setShowMenu(false); }}
              style={{ width: '100%', padding: '12px 16px', border: 'none', backgroundColor: 'transparent', textAlign: 'left', cursor: 'pointer', fontSize: '14px', borderBottom: '1px solid #f3f4f6' }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#f9fafb'; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              ⚙️ Settings
            </button>
            <button
              onClick={() => { handleLogout(); setShowMenu(false); }}
              style={{ width: '100%', padding: '12px 16px', border: 'none', backgroundColor: 'transparent', textAlign: 'left', cursor: 'pointer', fontSize: '14px', color: '#ef4444' }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#fef2f2'; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              🚪 Logout
            </button>
          </div>
        )}
      </div>

      {/* Main content */}
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#f8fafc',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: isMobile ? '60px 16px 40px 16px' : '60px 20px 40px 20px'
      }}>

        {/* Title block */}
        <div style={{
          textAlign: 'center',
          marginBottom: isMobile ? '40px' : '56px',
          maxWidth: '640px',
          width: '100%'
        }}>
          <p style={{
            fontSize: isMobile ? '14px' : '16px',
            fontWeight: '500',
            color: '#64748b',
            margin: '0 0 8px 0',
            letterSpacing: '0.01em'
          }}>
            Welcome to
          </p>
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

        {/* Two main buttons */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
          gap: isMobile ? '16px' : '24px',
          width: '100%',
          maxWidth: isMobile ? '400px' : '700px'
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

          {/* Continue Writing */}
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
              boxSizing: 'border-box',
              fontFamily: 'inherit'
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

        </div>

        {/* Subtle footer links */}
        <div style={{
          marginTop: isMobile ? '36px' : '48px',
          display: 'flex',
          gap: isMobile ? '20px' : '32px',
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

                {/* Protected Routes */}
                <Route path="/" element={
                  <ProtectedRoute>
                    <Home />
                  </ProtectedRoute>
                } />

                {/* Onboarding flow */}
                <Route path="/start" element={
                  <ProtectedRoute>
                    <StartReports />
                  </ProtectedRoute>
                } />
                <Route path="/select-class" element={
                  <ProtectedRoute>
                    <SelectClass />
                  </ProtectedRoute>
                } />
                <Route path="/step2" element={
                  <ProtectedRoute>
                    <Step2Template />
                  </ProtectedRoute>
                } />
                <Route path="/select-template" element={
                  <ProtectedRoute>
                    <SelectTemplate />
                  </ProtectedRoute>
                } />
                <Route path="/pick-template" element={
                  <ProtectedRoute>
                    <PickTemplate />
                  </ProtectedRoute>
                } />
                <Route path="/no-reports" element={
                  <ProtectedRoute>
                    <NoReports />
                  </ProtectedRoute>
                } />

                {/* Existing routes — unchanged */}
                <Route path="/write-reports" element={
                  <ProtectedRoute>
                    <WriteReports />
                  </ProtectedRoute>
                } />
                <Route path="/create-template" element={
                  <ProtectedRoute>
                    <CreateTemplate />
                  </ProtectedRoute>
                } />
                <Route path="/manage-templates" element={
                  <ProtectedRoute>
                    <ManageTemplates />
                  </ProtectedRoute>
                } />
                <Route path="/import-template" element={
                  <ProtectedRoute>
                    <ImportTemplate />
                  </ProtectedRoute>
                } />
                <Route path="/template-review" element={
                  <ProtectedRoute>
                    <TemplateReview />
                  </ProtectedRoute>
                } />
                <Route path="/class-management" element={
                  <ProtectedRoute>
                    <ClassManagement />
                  </ProtectedRoute>
                } />
                <Route path="/view-reports" element={
                  <ProtectedRoute>
                    <ViewReports />
                  </ProtectedRoute>
                } />
                <Route path="/view-reports/:classId" element={
                  <ProtectedRoute>
                    <ClassReports />
                  </ProtectedRoute>
                } />
                <Route path="/view-reports/:classId/student/:studentId" element={
                  <ProtectedRoute>
                    <IndividualReportViewer />
                  </ProtectedRoute>
                } />
                <Route path="/view-reports/:classId/all" element={
                  <ProtectedRoute>
                    <AllReportsViewer />
                  </ProtectedRoute>
                } />
              </Routes>
            </div>
          </Router>
        </SubscriptionProvider>
      </DataProvider>
    </AuthProvider>
  );
}

export default App;