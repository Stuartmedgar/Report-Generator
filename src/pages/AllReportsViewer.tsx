import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { useData } from '../contexts/DataContext';

export default function AllReportsViewer() {
  const { classId } = useParams<{ classId: string }>();
  const { state } = useData();

  // Find the class and reports
  const classData = state.classes.find(c => c.id === classId);
  const classReports = state.reports.filter(r => r.classId === classId);
  
  if (!classData) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h1>Class not found</h1>
        <Link to="/view-reports">Back to View Reports</Link>
      </div>
    );
  }

  // Get students with reports, sorted by last name
  const studentsWithReports = classData.students?.filter(student => 
    classReports.some(report => report.studentId === student.id)
  ).sort((a, b) => a.lastName.localeCompare(b.lastName)) || [];

  // Get reports with student info
  const reportsWithStudents = studentsWithReports.map(student => {
    const report = classReports.find(r => r.studentId === student.id);
    return { student, report };
  }).filter(item => item.report);

  // Export functions
  const handleCopyAllReports = () => {
    const allReportsText = reportsWithStudents.map(({ student, report }) => 
      `${student.firstName} ${student.lastName}\n\n${report!.content}\n\n`
    ).join('\n');
    
    navigator.clipboard.writeText(allReportsText);
    alert('All reports copied to clipboard!');
  };

  const handleDownloadAllReports = () => {
    const allReportsText = reportsWithStudents.map(({ student, report }) => 
      `${student.firstName} ${student.lastName}\n\n${report!.content}\n\n`
    ).join('\n');
    
    const blob = new Blob([allReportsText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${classData.name}_All_Reports.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Calculate stats
  const totalWords = reportsWithStudents.reduce((total, { report }) => 
    total + (report!.content.split(' ').length), 0
  );

  // Mobile detection
  const isMobile = window.innerWidth <= 768;

  return (
    <div style={{ 
      padding: isMobile ? '12px' : '20px', 
      maxWidth: isMobile ? '100%' : '1200px', // MOBILE: Full width on mobile
      margin: '0 auto',
      fontFamily: 'Arial, sans-serif'
    }}>
      {/* Header - MOBILE OPTIMIZED */}
      <div style={{ 
        display: 'flex', 
        flexDirection: isMobile ? 'column' : 'row',
        justifyContent: 'space-between', 
        alignItems: isMobile ? 'stretch' : 'center',
        marginBottom: isMobile ? '16px' : '20px',
        gap: isMobile ? '12px' : '0'
      }}>
        <div style={{ textAlign: isMobile ? 'center' : 'left' }}>
          <h1 style={{ 
            fontSize: isMobile ? '20px' : '24px', 
            fontWeight: 'bold', 
            color: '#1f2937',
            margin: '0 0 4px 0'
          }}>
            All Reports - {classData.name}
          </h1>
          <p style={{ 
            color: '#6b7280', 
            margin: 0,
            fontSize: isMobile ? '13px' : '14px'
          }}>
            {reportsWithStudents.length} reports • {totalWords} total words
          </p>
        </div>
        <Link 
          to={`/view-reports/${classId}`}
          style={{
            backgroundColor: '#6b7280',
            color: 'white',
            padding: isMobile ? '12px 16px' : '8px 16px',
            borderRadius: '6px',
            textDecoration: 'none',
            fontSize: '14px',
            textAlign: 'center',
            alignSelf: isMobile ? 'stretch' : 'auto'
          }}
        >
          ← Back to Class Reports
        </Link>
      </div>

      {/* Actions Bar - MOBILE OPTIMIZED */}
      <div style={{
        backgroundColor: 'white',
        border: '2px solid #e5e7eb',
        borderRadius: isMobile ? '8px' : '12px',
        padding: isMobile ? '12px' : '16px',
        marginBottom: isMobile ? '16px' : '24px',
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row', // Stack on mobile
        justifyContent: 'space-between',
        alignItems: isMobile ? 'stretch' : 'center',
        gap: isMobile ? '12px' : '0'
      }}>
        <div style={{ textAlign: isMobile ? 'center' : 'left' }}>
          <h3 style={{
            fontSize: isMobile ? '14px' : '16px',
            fontWeight: '600',
            color: '#374151',
            margin: '0 0 4px 0'
          }}>
            Export All Reports
          </h3>
          <p style={{
            fontSize: isMobile ? '12px' : '14px',
            color: '#6b7280',
            margin: 0
          }}>
            Copy or download all {reportsWithStudents.length} reports in one document
          </p>
        </div>
        
        {/* MOBILE FRIENDLY BUTTONS - Stack vertically on mobile */}
        <div style={{ 
          display: 'flex', 
          flexDirection: isMobile ? 'column' : 'row',
          gap: isMobile ? '8px' : '12px',
          width: isMobile ? '100%' : 'auto'
        }}>
          <button
            onClick={handleCopyAllReports}
            style={{
              backgroundColor: '#10b981',
              color: 'white',
              padding: isMobile ? '12px 16px' : '10px 20px',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              minHeight: isMobile ? '44px' : 'auto' // Touch-friendly height
            }}
          >
            📋 Copy All
          </button>
          
          <button
            onClick={handleDownloadAllReports}
            style={{
              backgroundColor: '#8b5cf6',
              color: 'white',
              padding: isMobile ? '12px 16px' : '10px 20px',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              minHeight: isMobile ? '44px' : 'auto' // Touch-friendly height
            }}
          >
            💾 Download All
          </button>
        </div>
      </div>

      {/* All Reports Display - MOBILE OPTIMIZED */}
      <div style={{
        backgroundColor: 'white',
        border: '2px solid #e5e7eb',
        borderRadius: isMobile ? '8px' : '12px',
        padding: isMobile ? '16px' : '32px' // Less padding on mobile for more content space
      }}>
        {reportsWithStudents.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px', color: '#9ca3af' }}>
              📄
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#374151', margin: '0 0 8px 0' }}>
              No Reports Available
            </h3>
            <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>
              There are no completed reports for this class yet.
            </p>
          </div>
        ) : (
          <div>
            {reportsWithStudents.map(({ student, report }, index) => (
              <div 
                key={student.id} 
                style={{ 
                  marginBottom: index < reportsWithStudents.length - 1 ? (isMobile ? '24px' : '32px') : '0',
                  paddingBottom: index < reportsWithStudents.length - 1 ? (isMobile ? '24px' : '32px') : '0',
                  borderBottom: index < reportsWithStudents.length - 1 ? '1px solid #e5e7eb' : 'none'
                }}
              >
                {/* SIMPLIFIED STUDENT NAME HEADING - As requested */}
                <h2 style={{
                  fontSize: isMobile ? '18px' : '20px',
                  fontWeight: '600',
                  color: '#111827',
                  margin: `0 0 ${isMobile ? '12px' : '16px'} 0`,
                  paddingBottom: isMobile ? '8px' : '12px',
                  borderBottom: '2px solid #e5e7eb'
                }}>
                  {student.firstName} {student.lastName}
                </h2>

                {/* Report Content - FULL WIDTH on mobile */}
                <div style={{
                  fontSize: isMobile ? '14px' : '16px',
                  lineHeight: isMobile ? '1.5' : '1.6',
                  color: '#374151',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word', // Prevent text overflow on mobile
                  maxWidth: '100%', // Ensure full width usage
                  padding: 0 // No padding to maximize content space
                }}>
                  {report!.content}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Mobile-friendly summary stats */}
      {reportsWithStudents.length > 0 && (
        <div style={{
          backgroundColor: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: isMobile ? '8px' : '12px',
          padding: isMobile ? '12px' : '16px',
          marginTop: isMobile ? '16px' : '24px',
          textAlign: 'center'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-around',
            flexWrap: 'wrap',
            gap: isMobile ? '16px' : '24px',
            fontSize: isMobile ? '13px' : '14px',
            color: '#6b7280'
          }}>
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center',
              minWidth: isMobile ? '70px' : 'auto'
            }}>
              <span style={{ fontSize: isMobile ? '20px' : '24px', color: '#3b82f6' }}>📊</span>
              <span style={{ fontWeight: '600', color: '#374151', fontSize: isMobile ? '16px' : '18px' }}>
                {reportsWithStudents.length}
              </span>
              <span>Reports</span>
            </div>
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center',
              minWidth: isMobile ? '70px' : 'auto'
            }}>
              <span style={{ fontSize: isMobile ? '20px' : '24px', color: '#10b981' }}>📝</span>
              <span style={{ fontWeight: '600', color: '#374151', fontSize: isMobile ? '16px' : '18px' }}>
                {totalWords}
              </span>
              <span>Words</span>
            </div>
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center',
              minWidth: isMobile ? '70px' : 'auto'
            }}>
              <span style={{ fontSize: isMobile ? '20px' : '24px', color: '#8b5cf6' }}>📄</span>
              <span style={{ fontWeight: '600', color: '#374151', fontSize: isMobile ? '16px' : '18px' }}>
                ~{reportsWithStudents.length * 2}
              </span>
              <span>Pages</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}