import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { DataProvider, useData } from './contexts/DataContext';
import WriteReports from './pages/WriteReports';
import CreateTemplate from './pages/CreateTemplate';
import ManageTemplates from './pages/ManageTemplates';
import ClassManagement from './pages/ClassManagement';
import ViewReports from './pages/ViewReports';
import ClassReports from './pages/ClassReports';
import IndividualReportViewer from './pages/IndividualReportViewer';
import AllReportsViewer from './pages/AllReportsViewer';

function Home() {
  const { createTestData } = useData();

  return (
    <div style={{ 
      minHeight: '100vh',
      backgroundColor: '#f9fafb',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      fontFamily: 'Arial, sans-serif'
    }}>
      {/* Test Data Button */}
      <button
        onClick={createTestData}
        style={{
          backgroundColor: '#8b5cf6',
          color: 'white',
          padding: '12px 24px',
          border: 'none',
          borderRadius: '8px',
          fontSize: '16px',
          cursor: 'pointer',
          margin: '0 0 32px 0',
          fontWeight: '600',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
        }}
      >
        🧪 Create Test Data
      </button>

      <h1 style={{ 
        fontSize: '32px', 
        fontWeight: 'bold', 
        color: '#111827',
        marginBottom: '48px',
        textAlign: 'center'
      }}>
        Report Writing App
      </h1>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
        gap: '24px',
        maxWidth: '800px',
        width: '100%',
        padding: '0 20px'
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
          📝 Write Reports
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
          📋 Create Report Template
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
      </div>
    </div>
  );
}

function App() {
  return (
    <DataProvider>
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
          </Routes>
        </div>
      </Router>
    </DataProvider>
  );
}

export default App;