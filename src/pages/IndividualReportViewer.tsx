import React, { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext';

export default function IndividualReportViewer() {
  const { classId, studentId } = useParams<{ classId: string; studentId: string }>();
  const navigate = useNavigate();
  const { state } = useData();
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState('');

  // Find the class, student, and report
  const classData = state.classes.find(c => c.id === classId);
  const student = classData?.students?.find(s => s.id === studentId);
  const report = state.reports.find(r => r.studentId === studentId && r.classId === classId);
  
  // Get all students for navigation
  const studentsWithReports = classData?.students?.filter(s => 
    state.reports.some(r => r.studentId === s.id && r.classId === classId)
  ) || [];
  
  const currentIndex = studentsWithReports.findIndex(s => s.id === studentId);

  if (!classData || !student || !report) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h1>Report not found</h1>
        <Link to="/view-reports">Back to View Reports</Link>
      </div>
    );
  }

  // Navigation functions
  const handlePrevious = () => {
    if (currentIndex > 0) {
      const prevStudent = studentsWithReports[currentIndex - 1];
      navigate(`/view-reports/${classId}/student/${prevStudent.id}`);
    }
  };

  const handleNext = () => {
    if (currentIndex < studentsWithReports.length - 1) {
      const nextStudent = studentsWithReports[currentIndex + 1];
      navigate(`/view-reports/${classId}/student/${nextStudent.id}`);
    }
  };

  // Edit functions
  const handleStartEdit = () => {
    setEditedContent(report.content);
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    // Update the report content
    // Note: You might want to add an updateReportContent function to your DataContext
    alert('Edit functionality would save changes here');
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedContent('');
  };

  // Export functions
  const handleCopyReport = () => {
    const reportText = `${student.firstName} ${student.lastName}\n\n${report.content}`;
    navigator.clipboard.writeText(reportText);
    alert('Report copied to clipboard!');
  };

  const handleDownloadReport = () => {
    const reportText = `${student.firstName} ${student.lastName}\n\n${report.content}`;
    const blob = new Blob([reportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${student.firstName}_${student.lastName}_Report.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ 
      padding: '20px', 
      maxWidth: '1200px', 
      margin: '0 auto',
      fontFamily: 'Arial, sans-serif'
    }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <div>
          <h1 style={{ 
            fontSize: '24px', 
            fontWeight: 'bold', 
            color: '#1f2937',
            margin: '0 0 4px 0'
          }}>
            {student.firstName} {student.lastName}
          </h1>
          <p style={{ 
            color: '#6b7280', 
            margin: 0,
            fontSize: '14px'
          }}>
            {classData.name} • Report {currentIndex + 1} of {studentsWithReports.length}
          </p>
        </div>
        <Link 
          to={`/view-reports/${classId}`}
          style={{
            backgroundColor: '#6b7280',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '6px',
            textDecoration: 'none',
            fontSize: '14px'
          }}
        >
          ← Back to Class Reports
        </Link>
      </div>

      <div style={{ display: 'flex', gap: '20px' }}>
        
        {/* Main Report Content */}
        <div style={{ flex: 1 }}>
          <div style={{
            backgroundColor: 'white',
            border: '2px solid #e5e7eb',
            borderRadius: '12px',
            padding: '32px',
            marginBottom: '20px'
          }}>
            {/* Report Header */}
            <div style={{
              borderBottom: '2px solid #e5e7eb',
              paddingBottom: '16px',
              marginBottom: '24px'
            }}>
              <h2 style={{
                fontSize: '20px',
                fontWeight: '600',
                color: '#111827',
                margin: '0 0 8px 0'
              }}>
                {student.firstName} {student.lastName}
              </h2>
              <div style={{
                display: 'flex',
                gap: '16px',
                fontSize: '14px',
                color: '#6b7280'
              }}>
                <span>📅 Created: {new Date(report.createdAt).toLocaleDateString()}</span>
                <span>✏️ Updated: {new Date(report.updatedAt).toLocaleDateString()}</span>
                <span>📄 {report.content.split(' ').length} words</span>
              </div>
            </div>

            {/* Report Content */}
            {isEditing ? (
              <div>
                <textarea
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  style={{
                    width: '100%',
                    minHeight: '400px',
                    padding: '16px',
                    border: '2px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '16px',
                    lineHeight: '1.6',
                    fontFamily: 'inherit',
                    resize: 'vertical',
                    outline: 'none'
                  }}
                />
                <div style={{
                  display: 'flex',
                  gap: '12px',
                  marginTop: '16px'
                }}>
                  <button
                    onClick={handleSaveEdit}
                    style={{
                      backgroundColor: '#10b981',
                      color: 'white',
                      padding: '8px 16px',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    Save Changes
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    style={{
                      backgroundColor: '#6b7280',
                      color: 'white',
                      padding: '8px 16px',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div style={{
                fontSize: '16px',
                lineHeight: '1.6',
                color: '#374151',
                whiteSpace: 'pre-wrap'
              }}>
                {report.content}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar - Actions & Navigation */}
        <div style={{ width: '300px' }}>
          
          {/* Actions Panel */}
          <div style={{
            backgroundColor: 'white',
            border: '2px solid #e5e7eb',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '20px'
          }}>
            <h3 style={{
              fontSize: '16px',
              fontWeight: '600',
              color: '#374151',
              margin: '0 0 16px 0'
            }}>
              Actions
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                onClick={isEditing ? handleCancelEdit : handleStartEdit}
                style={{
                  backgroundColor: isEditing ? '#6b7280' : '#3b82f6',
                  color: 'white',
                  padding: '10px 16px',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                {isEditing ? '❌ Cancel Edit' : '✏️ Edit Report'}
              </button>
              
              <button
                onClick={handleCopyReport}
                style={{
                  backgroundColor: '#10b981',
                  color: 'white',
                  padding: '10px 16px',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                📋 Copy Report
              </button>
              
              <button
                onClick={handleDownloadReport}
                style={{
                  backgroundColor: '#8b5cf6',
                  color: 'white',
                  padding: '10px 16px',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                💾 Download
              </button>
            </div>
          </div>

          {/* Navigation Panel */}
          <div style={{
            backgroundColor: 'white',
            border: '2px solid #e5e7eb',
            borderRadius: '12px',
            padding: '20px'
          }}>
            <h3 style={{
              fontSize: '16px',
              fontWeight: '600',
              color: '#374151',
              margin: '0 0 16px 0'
            }}>
              Navigate Reports
            </h3>
            
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '16px'
            }}>
              <button
                onClick={handlePrevious}
                disabled={currentIndex === 0}
                style={{
                  backgroundColor: currentIndex === 0 ? '#d1d5db' : '#6b7280',
                  color: 'white',
                  padding: '8px 16px',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: currentIndex === 0 ? 'not-allowed' : 'pointer'
                }}
              >
                ← Previous
              </button>
              
              <span style={{
                fontSize: '14px',
                color: '#6b7280',
                display: 'flex',
                alignItems: 'center'
              }}>
                {currentIndex + 1} of {studentsWithReports.length}
              </span>
              
              <button
                onClick={handleNext}
                disabled={currentIndex === studentsWithReports.length - 1}
                style={{
                  backgroundColor: currentIndex === studentsWithReports.length - 1 ? '#d1d5db' : '#6b7280',
                  color: 'white',
                  padding: '8px 16px',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: currentIndex === studentsWithReports.length - 1 ? 'not-allowed' : 'pointer'
                }}
              >
                Next →
              </button>
            </div>

            {/* Student List */}
            <div style={{
              maxHeight: '200px',
              overflow: 'auto',
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '6px',
              padding: '8px'
            }}>
              {studentsWithReports.map((s, index) => (
                <button
                  key={s.id}
                  onClick={() => navigate(`/view-reports/${classId}/student/${s.id}`)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '13px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    backgroundColor: s.id === studentId ? '#3b82f6' : 'transparent',
                    color: s.id === studentId ? 'white' : '#374151',
                    marginBottom: '4px'
                  }}
                >
                  {index + 1}. {s.firstName} {s.lastName}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}