import React, { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext';

export default function ClassReports() {
  const { classId } = useParams<{ classId: string }>();
  const navigate = useNavigate();
  const { state } = useData();
  const [selectedStudentId, setSelectedStudentId] = useState('');

  // Find the class
  const classData = state.classes.find(c => c.id === classId);
  
  if (!classData) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h1>Class not found</h1>
        <Link to="/view-reports">Back to View Reports</Link>
      </div>
    );
  }

  // Get reports for this class
  const classReports = state.reports.filter(report => report.classId === classId);
  
  // Get students with/without reports
  const studentsWithReports = classData.students?.filter(student => 
    classReports.some(report => report.studentId === student.id)
  ) || [];
  
  const studentsWithoutReports = classData.students?.filter(student => 
    !classReports.some(report => report.studentId === student.id)
  ) || [];

  const handleViewIndividualReport = () => {
    if (!selectedStudentId) {
      alert('Please select a student first');
      return;
    }
    navigate(`/view-reports/${classId}/student/${selectedStudentId}`);
  };

  const handleViewAllReports = () => {
    navigate(`/view-reports/${classId}/all`);
  };

  // Mobile detection
  const isMobile = window.innerWidth <= 768;

  return (
    <div style={{ 
      padding: isMobile ? '16px' : '20px', 
      maxWidth: '1000px', 
      margin: '0 auto',
      fontFamily: 'Arial, sans-serif'
    }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '20px',
        flexDirection: isMobile ? 'column' : 'row',
        gap: isMobile ? '12px' : '0'
      }}>
        <div style={{ textAlign: isMobile ? 'center' : 'left' }}>
          <h1 style={{ 
            fontSize: isMobile ? '20px' : '24px', 
            fontWeight: 'bold', 
            color: '#1f2937',
            margin: '0 0 4px 0'
          }}>
            {classData.name} Reports
          </h1>
          <p style={{ 
            color: '#6b7280', 
            margin: 0,
            fontSize: '14px'
          }}>
            {classReports.length} of {classData.students?.length || 0} reports completed
          </p>
        </div>
        <Link 
          to="/view-reports" 
          style={{
            backgroundColor: '#6b7280',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '6px',
            textDecoration: 'none',
            fontSize: '14px'
          }}
        >
          ← Back to View Reports
        </Link>
      </div>

      {/* Report Options - RESPONSIVE: Horizontal on Desktop, Vertical Stack on Mobile */}
      <div style={{ 
        display: 'flex', 
        flexDirection: isMobile ? 'column' : 'row', // Stack vertically on mobile
        gap: isMobile ? '16px' : '24px', 
        marginBottom: '32px' 
      }}>
        
        {/* 1. ALL REPORTS OPTION - FIRST on mobile as requested */}
        <div style={{
          flex: isMobile ? 'none' : 1,
          backgroundColor: 'white',
          border: '2px solid #e5e7eb',
          borderRadius: '12px',
          padding: isMobile ? '20px' : '24px',
          order: isMobile ? 1 : 2 // First on mobile, second on desktop
        }}>
          <h3 style={{ 
            fontSize: '18px', 
            fontWeight: '600', 
            color: '#111827',
            margin: '0 0 12px 0'
          }}>
            📚 All Reports
          </h3>
          <p style={{ 
            color: '#6b7280', 
            fontSize: '14px',
            margin: '0 0 16px 0'
          }}>
            View all completed reports for this class in one document
          </p>

          <div style={{
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '6px',
            padding: '12px',
            marginBottom: '16px'
          }}>
            <div style={{ fontSize: '12px', color: '#6b7280' }}>
              <div>✅ Reports completed: {studentsWithReports.length}</div>
              <div>⌛ Reports missing: {studentsWithoutReports.length}</div>
              <div>📄 Total pages: ~{classReports.length * 2}</div>
            </div>
          </div>

          <button
            onClick={handleViewAllReports}
            disabled={classReports.length === 0}
            style={{
              backgroundColor: classReports.length === 0 ? '#d1d5db' : '#10b981',
              color: 'white',
              padding: '12px 24px',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: classReports.length === 0 ? 'not-allowed' : 'pointer',
              width: '100%'
            }}
          >
            View All Reports
          </button>
        </div>

        {/* 2. INDIVIDUAL REPORT OPTION - SECOND on mobile as requested */}
        <div style={{
          flex: isMobile ? 'none' : 1,
          backgroundColor: 'white',
          border: '2px solid #e5e7eb',
          borderRadius: '12px',
          padding: isMobile ? '20px' : '24px',
          order: isMobile ? 2 : 1 // Second on mobile, first on desktop
        }}>
          <h3 style={{ 
            fontSize: '18px', 
            fontWeight: '600', 
            color: '#111827',
            margin: '0 0 12px 0'
          }}>
            👤 Individual Report
          </h3>
          <p style={{ 
            color: '#6b7280', 
            fontSize: '14px',
            margin: '0 0 16px 0'
          }}>
            View, edit, copy or export a single student's report
          </p>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ 
              display: 'block', 
              fontSize: '14px', 
              fontWeight: '500', 
              color: '#374151',
              marginBottom: '6px'
            }}>
              Select Student:
            </label>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                backgroundColor: 'white'
              }}
            >
              <option value="">-- Select a student --</option>
              {studentsWithReports.map(student => (
                <option key={student.id} value={student.id}>
                  {student.firstName} {student.lastName}
                </option>
              ))}
            </select>
            {studentsWithReports.length === 0 && (
              <p style={{ 
                fontSize: '12px', 
                color: '#ef4444', 
                margin: '4px 0 0 0',
                fontStyle: 'italic'
              }}>
                No reports available to view
              </p>
            )}
          </div>

          <button
            onClick={handleViewIndividualReport}
            disabled={!selectedStudentId || !studentsWithReports.some(s => s.id === selectedStudentId)}
            style={{
              backgroundColor: (!selectedStudentId || !studentsWithReports.some(s => s.id === selectedStudentId)) ? '#d1d5db' : '#3b82f6',
              color: 'white',
              padding: '12px 24px',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: (!selectedStudentId || !studentsWithReports.some(s => s.id === selectedStudentId)) ? 'not-allowed' : 'pointer',
              width: '100%'
            }}
          >
            View Individual Report
          </button>
        </div>

        {/* 3. CLASS REPORT STATUS - THIRD on mobile as requested */}
        <div style={{
          flex: isMobile ? 'none' : 1,
          backgroundColor: 'white',
          border: '2px solid #e5e7eb',
          borderRadius: '12px',
          padding: isMobile ? '20px' : '24px',
          order: isMobile ? 3 : 3 // Third on both mobile and desktop
        }}>
          <h3 style={{ 
            fontSize: '18px', 
            fontWeight: '600', 
            color: '#111827',
            margin: '0 0 12px 0'
          }}>
            📊 Class Report Status
          </h3>
          <p style={{ 
            color: '#6b7280', 
            fontSize: '14px',
            margin: '0 0 16px 0'
          }}>
            Overview of completed and missing reports for this class
          </p>

          {/* Progress Bar */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '6px'
            }}>
              <span style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                Progress
              </span>
              <span style={{ fontSize: '14px', color: '#6b7280' }}>
                {Math.round((classReports.length / (classData.students?.length || 1)) * 100)}%
              </span>
            </div>
            <div style={{
              width: '100%',
              height: '8px',
              backgroundColor: '#e5e7eb',
              borderRadius: '4px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${(classReports.length / (classData.students?.length || 1)) * 100}%`,
                height: '100%',
                backgroundColor: '#10b981',
                transition: 'width 0.3s ease'
              }} />
            </div>
          </div>

          {/* Statistics */}
          <div style={{
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '6px',
            padding: '12px',
            fontSize: '14px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ color: '#10b981', fontWeight: '500' }}>
                ✅ Completed:
              </span>
              <span style={{ color: '#374151', fontWeight: '600' }}>
                {studentsWithReports.length}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ color: '#ef4444', fontWeight: '500' }}>
                ❌ Missing:
              </span>
              <span style={{ color: '#374151', fontWeight: '600' }}>
                {studentsWithoutReports.length}
              </span>
            </div>
            <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '8px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#6b7280', fontWeight: '500' }}>
                📝 Total Students:
              </span>
              <span style={{ color: '#374151', fontWeight: '600' }}>
                {classData.students?.length || 0}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Students Lists - Only show if there are missing reports */}
      {studentsWithoutReports.length > 0 && (
        <div style={{
          backgroundColor: '#fef3c7',
          border: '1px solid #f59e0b',
          borderRadius: '8px',
          padding: isMobile ? '16px' : '20px',
          marginBottom: '24px'
        }}>
          <h4 style={{ 
            fontSize: '16px', 
            fontWeight: '600', 
            color: '#92400e',
            margin: '0 0 12px 0'
          }}>
            ⚠️ Missing Reports ({studentsWithoutReports.length})
          </h4>
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '8px'
          }}>
            {studentsWithoutReports.map(student => (
              <div key={student.id} style={{
                fontSize: '14px',
                color: '#92400e',
                backgroundColor: '#fef3c7',
                padding: '6px 10px',
                borderRadius: '4px',
                border: '1px solid #f59e0b'
              }}>
                {student.firstName} {student.lastName}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div style={{
        backgroundColor: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        padding: '16px',
        textAlign: 'center'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-around',
          flexWrap: 'wrap',
          gap: isMobile ? '12px' : '24px',
          fontSize: '14px',
          color: '#6b7280'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ fontSize: isMobile ? '20px' : '24px', color: '#3b82f6' }}>📊</span>
            <span style={{ fontWeight: '600', color: '#374151' }}>{classReports.length}</span>
            <span>Reports</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ fontSize: isMobile ? '20px' : '24px', color: '#10b981' }}>✅</span>
            <span style={{ fontWeight: '600', color: '#374151' }}>{studentsWithReports.length}</span>
            <span>Completed</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ fontSize: isMobile ? '20px' : '24px', color: '#ef4444' }}>⏳</span>
            <span style={{ fontWeight: '600', color: '#374151' }}>{studentsWithoutReports.length}</span>
            <span>Remaining</span>
          </div>
        </div>
      </div>
    </div>
  );
}