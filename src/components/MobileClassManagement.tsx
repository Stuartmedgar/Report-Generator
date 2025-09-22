import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext';

interface MobileClassManagementProps {
  onViewClass: (classId: string) => void;
  onCreateClass: () => void;
}

export default function MobileClassManagement({ onViewClass, onCreateClass }: MobileClassManagementProps) {
  const navigate = useNavigate();
  const { state } = useData();

  const getReportCount = (classId: string) => {
    return state.reports.filter(r => r.classId === classId).length;
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      
      {/* Isolated CSS for this component */}
      <style>{`
        .mobile-class-isolated * {
          box-sizing: border-box !important;
        }
        .mobile-class-isolated .nav-btn {
          background: #6b7280 !important;
          color: white !important;
          padding: 8px 6px !important;
          margin: 0 !important;
          border: none !important;
          border-radius: 4px !important;
          font-size: 11px !important;
          font-weight: 500 !important;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
          text-decoration: none !important;
          text-align: center !important;
          display: block !important;
          width: 100% !important;
          height: 32px !important;
          line-height: 16px !important;
          cursor: pointer !important;
          min-height: auto !important;
          min-width: auto !important;
          box-shadow: none !important;
          outline: none !important;
        }
        .mobile-class-isolated .nav-btn.home { background: #6b7280 !important; }
        .mobile-class-isolated .nav-btn.create { background: #10b981 !important; }
        
        .mobile-class-isolated .action-btn {
          color: white !important;
          padding: 6px 8px !important;
          margin: 0 !important;
          border: none !important;
          border-radius: 4px !important;
          font-size: 11px !important;
          font-weight: 500 !important;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
          text-decoration: none !important;
          text-align: center !important;
          display: block !important;
          width: 100% !important;
          cursor: pointer !important;
          min-height: auto !important;
          min-width: auto !important;
          box-shadow: none !important;
          outline: none !important;
        }
        .mobile-class-isolated .action-btn.view { background: #3b82f6 !important; }
        .mobile-class-isolated .action-btn.edit { background: #f59e0b !important; }
        .mobile-class-isolated .action-btn.reports { background: #10b981 !important; }
      `}</style>

      <div className="mobile-class-isolated">
        {/* Header */}
        <div style={{ backgroundColor: '#fff', padding: '16px', textAlign: 'center', borderBottom: '1px solid #e5e7eb' }}>
          <h1 style={{ fontSize: '20px', fontWeight: '600', color: '#111827', margin: '0 0 4px 0' }}>
            Class Management
          </h1>
          <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
            Manage your classes and students
          </p>
        </div>

        {/* Navigation */}
        <div style={{ padding: '16px', backgroundColor: '#fff', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <Link to="/" className="nav-btn home">
            Back to Home
          </Link>
          <button onClick={onCreateClass} className="nav-btn create">
            Add Class
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '16px' }}>
          <div style={{ backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)', overflow: 'hidden' }}>
            <div style={{ padding: '16px', borderBottom: '1px solid #e5e7eb', backgroundColor: '#f9fafb' }}>
              <h2 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', margin: 0 }}>
                Your Classes ({state.classes.length})
              </h2>
            </div>

            {state.classes.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 16px', color: '#6b7280' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>👥</div>
                <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                  No classes yet
                </h3>
                <p style={{ fontSize: '14px', marginBottom: '20px' }}>
                  Create your first class to start managing students!
                </p>
                <button
                  onClick={onCreateClass}
                  style={{
                    backgroundColor: '#10b981',
                    color: '#fff',
                    padding: '12px 20px',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    width: '100%',
                    maxWidth: '200px'
                  }}
                >
                  Create Your First Class
                </button>
              </div>
            ) : (
              <div>
                {state.classes.map((classItem, index) => (
                  <div
                    key={classItem.id}
                    style={{
                      padding: '16px',
                      borderBottom: index < state.classes.length - 1 ? '1px solid #f3f4f6' : 'none'
                    }}
                  >
                    <div style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '4px' }}>
                      {classItem.name}
                    </div>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '12px' }}>
                      {classItem.students.length} students • {getReportCount(classItem.id)} reports
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '4px' }}>
                      <button
                        onClick={() => onViewClass(classItem.id)}
                        className="action-btn view"
                      >
                        View
                      </button>
                      <button
                        onClick={() => onViewClass(classItem.id)}
                        className="action-btn edit"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => navigate('/view-reports', { state: { classId: classItem.id } })}
                        className="action-btn reports"
                      >
                        Reports
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}