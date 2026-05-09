import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Link, Navigate } from 'react-router-dom';
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

// Home Component
function Home() {
  const { user, signOut } = useAuth();
  const { state } = useData();
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

  const isNewUser = state.templates.length === 0 && state.classes.length === 0;

  const hoverOn = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!isMobile) {
      e.currentTarget.style.transform = 'translateY(-2px)';
      e.currentTarget.style.boxShadow = '0 8px 15px rgba(0, 0, 0, 0.15)';
    }
  };

  const hoverOff = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!isMobile) {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
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
            width: '40px',
            height: '40px',
            border: '2px solid #e5e7eb',
            borderRadius: '8px',
            backgroundColor: 'white',
            cursor: 'pointer',
            fontSize: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#f9fafb';
            e.currentTarget.style.borderColor = '#d1d5db';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'white';
            e.currentTarget.style.borderColor = '#e5e7eb';
          }}
        >
          ☰
        </button>

        {showMenu && (
          <div style={{
            position: 'absolute',
            top: '45px',
            right: '0',
            backgroundColor: 'white',
            border: '2px solid #e5e7eb',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            minWidth: '150px',
            overflow: 'hidden'
          }}>
            <button
              onClick={() => { alert('Account details coming soon!'); setShowMenu(false); }}
              style={{ width: '100%', padding: '12px 16px', border: 'none', backgroundColor: 'transparent', textAlign: 'left', cursor: 'pointer', fontSize: '14px', borderBottom: '1px solid #f3f4f6' }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f9fafb'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              👤 Account
            </button>
            <button
              onClick={() => { alert('Settings coming soon!'); setShowMenu(false); }}
              style={{ width: '100%', padding: '12px 16px', border: 'none', backgroundColor: 'transparent', textAlign: 'left', cursor: 'pointer', fontSize: '14px', borderBottom: '1px solid #f3f4f6' }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f9fafb'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              ⚙️ Settings
            </button>
            <button
              onClick={() => { handleLogout(); setShowMenu(false); }}
              style={{ width: '100%', padding: '12px 16px', border: 'none', backgroundColor: 'transparent', textAlign: 'left', cursor: 'pointer', fontSize: '14px', color: '#ef4444' }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#fef2f2'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              🚪 Logout
            </button>
          </div>
        )}
      </div>

      <div style={{
        minHeight: '100vh',
        backgroundColor: '#f8fafc',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        padding: isMobile ? '20px 16px 40px 16px' : '60px 20px 40px 20px'
      }}>

        {/* Title */}
        <div style={{
          textAlign: 'center',
          marginBottom: isMobile ? '32px' : '48px',
          maxWidth: isMobile ? '100%' : '800px',
          marginTop: isMobile ? '0' : '20px',
          width: isMobile ? '100%' : 'auto'
        }}>
          <h1 style={{
            fontSize: isMobile ? '24px' : '48px',
            fontWeight: '800',
            color: '#1e293b',
            lineHeight: '1.2',
            margin: isMobile ? '0' : '0 0 20px 0'
          }}>
            Report Generator
          </h1>
        </div>

        {/* Buttons */}
        <div style={{
          width: isMobile ? 'calc(100% - 32px)' : '100%',
          maxWidth: isMobile ? 'none' : '800px',
          display: 'flex',
          flexDirection: 'column',
          gap: isMobile ? '16px' : '20px'
        }}>

          {/* New user prompt — sits above the top row, aligned to left half on desktop */}
          {isNewUser && (
            <div style={{
              display: 'flex',
              flexDirection: isMobile ? 'row' : 'row',
              alignItems: 'center',
              gap: '8px',
              // On desktop align it over the left button (Write Reports)
              width: isMobile ? '100%' : 'calc(50% - 10px)',
              backgroundColor: '#fefce8',
              border: '1.5px dashed #f59e0b',
              borderRadius: '8px',
              padding: '10px 14px'
            }}>
              <span style={{
                fontSize: isMobile ? '13px' : '14px',
                fontWeight: '600',
                color: '#92400e'
              }}>
                👋 New here? Start with this button
              </span>
              <span style={{
                fontSize: isMobile ? '18px' : '20px',
                lineHeight: 1,
                // On mobile point down, on desktop point down too since button is below
                display: 'inline-block',
                marginLeft: 'auto'
              }}>
                ↓
              </span>
            </div>
          )}

          {/* Row 1 — Write Reports + Report Templates side by side */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
            gap: isMobile ? '16px' : '20px'
          }}>

            {/* Write Reports — Get Started! */}
            <Link
              to="/write-reports"
              style={{
                backgroundColor: '#10b981',
                color: 'white',
                padding: isMobile ? '56px 24px' : '52px 24px',
                borderRadius: isMobile ? '8px' : '12px',
                textDecoration: 'none',
                textAlign: 'center',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                transition: 'transform 0.2s, box-shadow 0.2s',
                width: '100%',
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
              onMouseEnter={hoverOn}
              onMouseLeave={hoverOff}
            >
              <span style={{ fontSize: isMobile ? '18px' : '22px', fontWeight: '700' }}>
                Write Reports
              </span>
              <span style={{ fontSize: isMobile ? '13px' : '14px', fontWeight: '500', opacity: 0.9 }}>
                Get Started!
              </span>
            </Link>

            {/* Report Templates */}
            <Link
              to="/manage-templates"
              style={{
                backgroundColor: '#3b82f6',
                color: 'white',
                padding: isMobile ? '56px 24px' : '52px 24px',
                borderRadius: isMobile ? '8px' : '12px',
                textDecoration: 'none',
                textAlign: 'center',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                transition: 'transform 0.2s, box-shadow 0.2s',
                width: '100%',
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
              onMouseEnter={hoverOn}
              onMouseLeave={hoverOff}
            >
              <span style={{ fontSize: isMobile ? '18px' : '22px', fontWeight: '700' }}>
                Report Templates
              </span>
              <span style={{ fontSize: isMobile ? '13px' : '14px', fontWeight: '500', opacity: 0.9 }}>
                Create, Manage &amp; Import
              </span>
            </Link>
          </div>

          {/* Row 2 — Your Classes full width, shorter */}
          <Link
            to="/class-management"
            style={{
              backgroundColor: '#8b5cf6',
              color: 'white',
              padding: isMobile ? '24px' : '26px 24px',
              borderRadius: isMobile ? '8px' : '12px',
              textDecoration: 'none',
              textAlign: 'center',
              fontSize: isMobile ? '16px' : '18px',
              fontWeight: '600',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              transition: 'transform 0.2s, box-shadow 0.2s',
              width: '100%',
              boxSizing: 'border-box',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
            onMouseEnter={hoverOn}
            onMouseLeave={hoverOff}
          >
            Your Classes
            {state.classes.length > 0 && (
              <span style={{ fontSize: isMobile ? '13px' : '14px', fontWeight: '400', opacity: 0.85 }}>
                — {state.classes.length} {state.classes.length === 1 ? 'class' : 'classes'}
              </span>
            )}
          </Link>

        </div>
      </div>
    </>
  );
}

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