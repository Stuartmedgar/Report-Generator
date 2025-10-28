import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Link, Navigate } from 'react-router-dom';
import './App.css';

// Context Providers
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';
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

// Home Component with Original Styling
function Home() {
  const { user, signOut } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
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
        
        {/* Dropdown menu */}
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
              onClick={() => {
                alert('Account details coming soon!');
                setShowMenu(false);
              }}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: 'none',
                backgroundColor: 'transparent',
                textAlign: 'left',
                cursor: 'pointer',
                fontSize: '14px',
                borderBottom: '1px solid #f3f4f6'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f9fafb';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              👤 Account
            </button>
            <button
              onClick={() => {
                alert('Settings coming soon!');
                setShowMenu(false);
              }}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: 'none',
                backgroundColor: 'transparent',
                textAlign: 'left',
                cursor: 'pointer',
                fontSize: '14px',
                borderBottom: '1px solid #f3f4f6'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f9fafb';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              ⚙️ Settings
            </button>
            <button
              onClick={() => {
                handleLogout();
                setShowMenu(false);
              }}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: 'none',
                backgroundColor: 'transparent',
                textAlign: 'left',
                cursor: 'pointer',
                fontSize: '14px',
                color: '#ef4444'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#fef2f2';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
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
        
        {/* Title - Inline with hamburger on mobile */}
        <div style={{ 
          textAlign: 'center',
          marginBottom: isMobile ? '40px' : '60px', 
          maxWidth: isMobile ? '100%' : '800px',
          marginTop: isMobile ? '0' : '20px',
          width: isMobile ? '100%' : 'auto',
          paddingRight: '0'
        }}>
          <h1 style={{ 
            fontSize: isMobile ? '24px' : '48px', 
            fontWeight: '800', 
            color: '#1e293b',
            marginBottom: isMobile ? '0' : '20px',
            lineHeight: '1.2',
            margin: isMobile ? '0' : '0 0 20px 0'
          }}>
            Report Generator
          </h1>
          
          {/* Only show subtitle and description on desktop */}
          {!isMobile && (
            <>
              <p style={{
                fontSize: '20px',
                color: '#64748b',
                lineHeight: '1.6',
                marginBottom: '20px'
              }}>
                
              </p>
              <p style={{
                fontSize: '16px',
                color: '#94a3b8'
              }}>
                
              </p>
            </>
          )}
        </div>

        {/* First Row - 3 buttons on desktop, stacked on mobile */}
        <div style={{
          display: isMobile ? 'flex' : 'grid',
          flexDirection: isMobile ? 'column' : undefined,
          gridTemplateColumns: isMobile ? undefined : 'repeat(3, 1fr)',
          gap: isMobile ? '16px' : '20px',
          width: isMobile ? 'calc(100% - 32px)' : '100%',
          maxWidth: isMobile ? 'none' : '800px',
          marginBottom: isMobile ? '0' : '20px'
        }}>

          <Link 
            to="/write-reports"
            style={{
              backgroundColor: '#10b981',
              color: 'white',
              padding: isMobile ? '64px 24px' : '32px 24px',
              borderRadius: isMobile ? '8px' : '12px',
              textDecoration: 'none',
              textAlign: 'center',
              fontSize: '18px',
              fontWeight: '600',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              transition: 'transform 0.2s, box-shadow 0.2s',
              width: isMobile ? '100%' : 'auto',
              boxSizing: 'border-box',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onMouseEnter={(e) => {
              if (!isMobile) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 15px rgba(0, 0, 0, 0.15)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isMobile) {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
              }
            }}
          >
            Write Reports
          </Link>

          <Link 
            to="/create-template"
            style={{
              backgroundColor: '#3b82f6',
              color: 'white',
              padding: isMobile ? '64px 24px' : '32px 24px',
              borderRadius: isMobile ? '8px' : '12px',
              textDecoration: 'none',
              textAlign: 'center',
              fontSize: '18px',
              fontWeight: '600',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              transition: 'transform 0.2s, box-shadow 0.2s',
              width: isMobile ? '100%' : 'auto',
              boxSizing: 'border-box',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onMouseEnter={(e) => {
              if (!isMobile) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 15px rgba(0, 0, 0, 0.15)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isMobile) {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
              }
            }}
          >
            Create Template
          </Link>

          <Link 
            to="/manage-templates"
            style={{
              backgroundColor: '#f59e0b',
              color: 'white',
              padding: isMobile ? '64px 24px' : '32px 24px',
              borderRadius: isMobile ? '8px' : '12px',
              textDecoration: 'none',
              textAlign: 'center',
              fontSize: '18px',
              fontWeight: '600',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              transition: 'transform 0.2s, box-shadow 0.2s',
              width: isMobile ? '100%' : 'auto',
              boxSizing: 'border-box',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onMouseEnter={(e) => {
              if (!isMobile) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 15px rgba(0, 0, 0, 0.15)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isMobile) {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
              }
            }}
          >
            Manage Templates
          </Link>
        </div>

        {/* Second Row - 2 buttons on desktop, continues stacking on mobile */}
        <div style={{
          display: isMobile ? 'flex' : 'grid',
          flexDirection: isMobile ? 'column' : undefined,
          gridTemplateColumns: isMobile ? undefined : 'repeat(2, 1fr)',
          gap: isMobile ? '16px' : '20px',
          width: isMobile ? 'calc(100% - 32px)' : '100%',
          maxWidth: isMobile ? 'none' : '800px'
        }}>

          <Link 
            to="/class-management"
            style={{
              backgroundColor: '#8b5cf6',
              color: 'white',
              padding: isMobile ? '64px 24px' : '32px 24px',
              borderRadius: isMobile ? '8px' : '12px',
              textDecoration: 'none',
              textAlign: 'center',
              fontSize: '18px',
              fontWeight: '600',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              transition: 'transform 0.2s, box-shadow 0.2s',
              width: isMobile ? '100%' : 'auto',
              boxSizing: 'border-box',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onMouseEnter={(e) => {
              if (!isMobile) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 15px rgba(0, 0, 0, 0.15)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isMobile) {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
              }
            }}
          >
            Class Management
          </Link>

          <Link 
            to="/view-reports"
            style={{
              backgroundColor: '#ef4444',
              color: 'white',
              padding: isMobile ? '64px 24px' : '32px 24px',
              borderRadius: isMobile ? '8px' : '12px',
              textDecoration: 'none',
              textAlign: 'center',
              fontSize: '18px',
              fontWeight: '600',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              transition: 'transform 0.2s, box-shadow 0.2s',
              width: isMobile ? '100%' : 'auto',
              boxSizing: 'border-box',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onMouseEnter={(e) => {
              if (!isMobile) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 15px rgba(0, 0, 0, 0.15)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isMobile) {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
              }
            }}
          >
            View Reports
          </Link>

          {/* Uncomment this if you want to add a Pricing page button
          <Link 
            to="/pricing"
            style={{
              backgroundColor: '#06b6d4',
              color: 'white',
              padding: isMobile ? '64px 24px' : '32px 24px',
              borderRadius: isMobile ? '8px' : '12px',
              textDecoration: 'none',
              textAlign: 'center',
              fontSize: '18px',
              fontWeight: '600',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              transition: 'transform 0.2s, box-shadow 0.2s',
              width: isMobile ? '100%' : 'auto',
              boxSizing: 'border-box',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onMouseEnter={(e) => {
              if (!isMobile) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 15px rgba(0, 0, 0, 0.15)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isMobile) {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
              }
            }}
          >
            Pricing
          </Link>
          */}

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