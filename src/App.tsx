import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { DataProvider } from './contexts/DataContext';
import { SubscriptionProvider } from './contexts/SubscriptionContext';
import { AuthProvider } from './contexts/AuthContext';

// Import your existing pages
import WriteReports from './pages/WriteReports';
import CreateTemplate from './pages/CreateTemplate';
import ManageTemplates from './pages/ManageTemplates';
import ClassManagement from './pages/ClassManagement';
import ViewReports from './pages/ViewReports';
import ClassReports from './pages/ClassReports';
import IndividualReportViewer from './pages/IndividualReportViewer';
import AllReportsViewer from './pages/AllReportsViewer';

// Import subscription components
import { PricingPage, SubscriptionSuccess } from './components/subscription';

// Import auth components
import ProtectedRoute from './components/auth/ProtectedRoute';
import AuthHeader from './components/auth/AuthHeader';

import './App.css';

function Home() {
  return (
    <>
      <AuthHeader />
      <div style={{ 
        minHeight: 'calc(100vh - 73px)', 
        backgroundColor: '#f8fafc', 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        padding: '20px 20px 40px 20px'
      }}>
        <div style={{ 
          textAlign: 'center', 
          marginBottom: '60px', 
          maxWidth: '800px',
          marginTop: '20px'
        }}>
          <h1 style={{ 
            fontSize: '48px', 
            fontWeight: '800', 
            color: '#1e293b',
            marginBottom: '20px',
            lineHeight: '1.2'
          }}>
            Report Generator
          </h1>
          <p style={{
            fontSize: '20px',
            color: '#64748b',
            lineHeight: '1.6',
            marginBottom: '20px'
          }}>
            Streamline your report writing process with our powerful template system
          </p>
          <p style={{
            fontSize: '16px',
            color: '#94a3b8'
          }}>
            Generate professional reports in minutes, not hours
          </p>
        </div>

        {/* First Row - 3 buttons */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '20px',
          width: '100%',
          maxWidth: '1200px',
          marginBottom: '20px'
        }}>

          <Link 
            to="/write-reports"
            style={{
              backgroundColor: '#10b981',
              color: 'white',
              padding: '32px 24px',
              borderRadius: '12px',
              textDecoration: 'none',
              textAlign: 'center',
              fontSize: '18px',
              fontWeight: '600',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              transition: 'transform 0.2s, box-shadow 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 15px rgba(0, 0, 0, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
            }}
          >
            Write Reports
          </Link>

          <Link 
            to="/create-template"
            style={{
              backgroundColor: '#3b82f6',
              color: 'white',
              padding: '32px 24px',
              borderRadius: '12px',
              textDecoration: 'none',
              textAlign: 'center',
              fontSize: '18px',
              fontWeight: '600',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              transition: 'transform 0.2s, box-shadow 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 15px rgba(0, 0, 0, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
            }}
          >
            Create Template
          </Link>

          <Link 
            to="/manage-templates"
            style={{
              backgroundColor: '#f59e0b',
              color: 'white',
              padding: '32px 24px',
              borderRadius: '12px',
              textDecoration: 'none',
              textAlign: 'center',
              fontSize: '18px',
              fontWeight: '600',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              transition: 'transform 0.2s, box-shadow 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 15px rgba(0, 0, 0, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
            }}
          >
            Manage Templates
          </Link>

        </div>

        {/* Second Row - 2 buttons (Pricing button removed) */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '20px',
          width: '100%',
          maxWidth: '800px'
        }}>

          <Link 
            to="/class-management"
            style={{
              backgroundColor: '#8b5cf6',
              color: 'white',
              padding: '32px 24px',
              borderRadius: '12px',
              textDecoration: 'none',
              textAlign: 'center',
              fontSize: '18px',
              fontWeight: '600',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              transition: 'transform 0.2s, box-shadow 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 15px rgba(0, 0, 0, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
            }}
          >
            Class Management
          </Link>

          <Link 
            to="/view-reports"
            style={{
              backgroundColor: '#ef4444',
              color: 'white',
              padding: '32px 24px',
              borderRadius: '12px',
              textDecoration: 'none',
              textAlign: 'center',
              fontSize: '18px',
              fontWeight: '600',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              transition: 'transform 0.2s, box-shadow 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 15px rgba(0, 0, 0, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
            }}
          >
            View Reports
          </Link>

          {/* Pricing button is commented out - can be easily restored later */}
          {/*
          <Link 
            to="/pricing"
            style={{
              backgroundColor: '#06b6d4',
              color: 'white',
              padding: '32px 24px',
              borderRadius: '12px',
              textDecoration: 'none',
              textAlign: 'center',
              fontSize: '18px',
              fontWeight: '600',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              transition: 'transform 0.2s, box-shadow 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 15px rgba(0, 0, 0, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
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
                    <AuthHeader />
                    <WriteReports />
                  </ProtectedRoute>
                } />
                <Route path="/create-template" element={
                  <ProtectedRoute>
                    <AuthHeader />
                    <CreateTemplate />
                  </ProtectedRoute>
                } />
                <Route path="/manage-templates" element={
                  <ProtectedRoute>
                    <AuthHeader />
                    <ManageTemplates />
                  </ProtectedRoute>
                } />
                <Route path="/class-management" element={
                  <ProtectedRoute>
                    <AuthHeader />
                    <ClassManagement />
                  </ProtectedRoute>
                } />
                <Route path="/view-reports" element={
                  <ProtectedRoute>
                    <AuthHeader />
                    <ViewReports />
                  </ProtectedRoute>
                } />
                <Route path="/view-reports/:classId" element={
                  <ProtectedRoute>
                    <AuthHeader />
                    <ClassReports />
                  </ProtectedRoute>
                } />
                <Route path="/view-reports/:classId/student/:studentId" element={
                  <ProtectedRoute>
                    <AuthHeader />
                    <IndividualReportViewer />
                  </ProtectedRoute>
                } />
                <Route path="/view-reports/:classId/all" element={
                  <ProtectedRoute>
                    <AuthHeader />
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