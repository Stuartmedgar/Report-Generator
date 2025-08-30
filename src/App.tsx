import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { DataProvider } from './contexts/DataContext';
import { SubscriptionProvider } from './contexts/SubscriptionContext';

// Import your existing pages
import WriteReports from './pages/WriteReports';
import CreateTemplate from './pages/CreateTemplate';
import ManageTemplates from './pages/ManageTemplates';
import ClassManagement from './pages/ClassManagement';
import ViewReports from './pages/ViewReports';
import ClassReports from './pages/ClassReports';
import IndividualReportViewer from './pages/IndividualReportViewer';
import AllReportsViewer from './pages/AllReportsViewer';

// Import new subscription components
import { PricingPage, SubscriptionSuccess } from './components/subscription';

import './App.css';

function Home() {
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
      <div style={{ textAlign: 'center', marginBottom: '60px', maxWidth: '800px' }}>
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
          color: '#94a3b8',
          lineHeight: '1.5'
        }}>
          Create templates, manage classes, and generate professional reports in minutes
        </p>
      </div>

      <div style={{ 
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '24px',
        width: '100%',
        maxWidth: '1000px'
      }}>
        <Link 
          to="/write-reports"
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
          ✍️ Write Reports
        </Link>

        <Link 
          to="/create-template"
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
          📋 Create Template
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
          🗂️ Manage Templates
        </Link>

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
          👥 Class Management
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
          👁️ View Reports
        </Link>

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
          💳 Pricing
        </Link>
      </div>
    </div>
  );
}

function App() {
  return (
    <DataProvider>
      <SubscriptionProvider>
        <Router>
          <div>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/write-reports" element={<WriteReports />} />
              <Route path="/create-template" element={<CreateTemplate />} />
              <Route path="/manage-templates" element={<ManageTemplates />} />
              <Route path="/class-management" element={<ClassManagement />} />
              <Route path="/view-reports" element={<ViewReports />} />
              <Route path="/view-reports/:classId" element={<ClassReports />} />
              <Route path="/view-reports/:classId/student/:studentId" element={<IndividualReportViewer />} />
              <Route path="/view-reports/:classId/all" element={<AllReportsViewer />} />
              
              {/* New subscription routes */}
              <Route path="/pricing" element={<PricingPage />} />
              <Route path="/subscription-success" element={<SubscriptionSuccess />} />
            </Routes>
          </div>
        </Router>
      </SubscriptionProvider>
    </DataProvider>
  );
}

export default App;
