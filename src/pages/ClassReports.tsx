import React, { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import PageNav from '../components/PageNav';

export default function ClassReports() {
  const { classId } = useParams<{ classId: string }>();
  const navigate = useNavigate();
  const { state } = useData();
  const [selectedStudentId, setSelectedStudentId] = useState('');

  const classData = state.classes.find(c => c.id === classId);

  if (!classData) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h1>Class not found</h1>
        <Link to="/view-reports">Back to View Reports</Link>
      </div>
    );
  }

  const classReports = state.reports.filter(report => report.classId === classId);

  const studentsWithReports = classData.students?.filter(student =>
    classReports.some(report => report.studentId === student.id)
  ) || [];

  const studentsWithoutReports = classData.students?.filter(student =>
    !classReports.some(report => report.studentId === student.id)
  ) || [];

  const handleViewIndividualReport = () => {
    if (!selectedStudentId) { alert('Please select a student first'); return; }
    navigate(`/view-reports/${classId}/student/${selectedStudentId}`);
  };

  const handleViewAllReports = () => {
    navigate(`/view-reports/${classId}/all`);
  };

  const isMobile = window.innerWidth <= 768;
  const progressPct = Math.round((classReports.length / (classData.students?.length || 1)) * 100);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', display: 'flex', flexDirection: 'column' }}>
      <PageNav />

      <main style={{
        maxWidth: '1000px', margin: '0 auto',
        padding: isMobile ? '16px' : '24px 20px',
        flex: 1, display: 'flex', flexDirection: 'column', gap: '16px'
      }}>

        {/* Page title */}
        <div>
          <h1 style={{ fontSize: isMobile ? '22px' : '26px', fontWeight: '700', color: '#111827', margin: '0 0 4px 0' }}>
            {classData.name} Reports
          </h1>
          <p style={{ color: '#6b7280', margin: 0, fontSize: '14px' }}>
            {classReports.length} of {classData.students?.length || 0} reports completed
          </p>
        </div>

        {/* Three cards */}
        <div style={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          gap: '16px',
        }}>

          {/* Individual Report */}
          <div style={{
            flex: 1, backgroundColor: 'white', border: '1px solid #e5e7eb',
            borderRadius: '12px', padding: '20px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', margin: '0 0 8px 0' }}>
              👤 Individual Report
            </h3>
            <p style={{ color: '#6b7280', fontSize: '13px', margin: '0 0 14px 0' }}>
              View, copy or export a single student's report
            </p>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              style={{
                width: '100%', padding: '8px 10px',
                border: '1px solid #d1d5db', borderRadius: '6px',
                fontSize: '14px', backgroundColor: 'white', marginBottom: '10px'
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
              <p style={{ fontSize: '12px', color: '#ef4444', margin: '0 0 10px 0', fontStyle: 'italic' }}>
                No reports available yet
              </p>
            )}
            <button
              onClick={handleViewIndividualReport}
              disabled={!selectedStudentId}
              style={{
                backgroundColor: !selectedStudentId ? '#e5e7eb' : '#3b82f6',
                color: !selectedStudentId ? '#9ca3af' : 'white',
                padding: '10px 16px', border: 'none', borderRadius: '6px',
                fontSize: '14px', fontWeight: '600',
                cursor: !selectedStudentId ? 'not-allowed' : 'pointer',
                width: '100%'
              }}
            >
              View Report
            </button>
          </div>

          {/* All Reports */}
          <div style={{
            flex: 1, backgroundColor: 'white', border: '1px solid #e5e7eb',
            borderRadius: '12px', padding: '20px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', margin: '0 0 8px 0' }}>
              📚 All Reports
            </h3>
            <p style={{ color: '#6b7280', fontSize: '13px', margin: '0 0 14px 0' }}>
              View all completed reports for this class in one document
            </p>
            <div style={{
              backgroundColor: '#f8fafc', border: '1px solid #e2e8f0',
              borderRadius: '6px', padding: '10px', marginBottom: '14px',
              fontSize: '13px', color: '#6b7280'
            }}>
              <div>✅ Completed: {studentsWithReports.length}</div>
              <div>⌛ Missing: {studentsWithoutReports.length}</div>
            </div>
            <button
              onClick={handleViewAllReports}
              disabled={classReports.length === 0}
              style={{
                backgroundColor: classReports.length === 0 ? '#e5e7eb' : '#10b981',
                color: classReports.length === 0 ? '#9ca3af' : 'white',
                padding: '10px 16px', border: 'none', borderRadius: '6px',
                fontSize: '14px', fontWeight: '600',
                cursor: classReports.length === 0 ? 'not-allowed' : 'pointer',
                width: '100%'
              }}
            >
              View All Reports
            </button>
          </div>

          {/* Progress */}
          <div style={{
            flex: 1, backgroundColor: 'white', border: '1px solid #e5e7eb',
            borderRadius: '12px', padding: '20px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', margin: '0 0 8px 0' }}>
              📊 Progress
            </h3>
            <p style={{ color: '#6b7280', fontSize: '13px', margin: '0 0 14px 0' }}>
              Overview of completed and missing reports
            </p>
            <div style={{ marginBottom: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '13px', color: '#374151' }}>Completion</span>
                <span style={{ fontSize: '13px', color: '#6b7280' }}>{progressPct}%</span>
              </div>
              <div style={{ width: '100%', height: '8px', backgroundColor: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${progressPct}%`, height: '100%', backgroundColor: '#10b981', transition: 'width 0.3s ease' }} />
              </div>
            </div>
            <div style={{ fontSize: '13px', color: '#6b7280', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>✅ Completed</span>
                <span style={{ fontWeight: '600', color: '#374151' }}>{studentsWithReports.length}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>⏳ Remaining</span>
                <span style={{ fontWeight: '600', color: '#374151' }}>{studentsWithoutReports.length}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #e5e7eb', paddingTop: '6px' }}>
                <span>Total students</span>
                <span style={{ fontWeight: '600', color: '#374151' }}>{classData.students?.length || 0}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Missing reports warning — only shown if needed */}
        {studentsWithoutReports.length > 0 && (
          <div style={{
            backgroundColor: '#fef3c7', border: '1px solid #f59e0b',
            borderRadius: '8px', padding: '14px 16px'
          }}>
            <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#92400e', margin: '0 0 8px 0' }}>
              ⚠️ Missing Reports ({studentsWithoutReports.length})
            </h4>
            <div style={{
              display: 'flex', flexWrap: 'wrap', gap: '6px'
            }}>
              {studentsWithoutReports.map(student => (
                <span key={student.id} style={{
                  fontSize: '13px', color: '#92400e',
                  backgroundColor: '#fef9c3', padding: '3px 8px',
                  borderRadius: '4px', border: '1px solid #f59e0b'
                }}>
                  {student.firstName} {student.lastName}
                </span>
              ))}
            </div>
          </div>
        )}

      </main>
    </div>
  );
}