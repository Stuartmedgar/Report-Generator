import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import CreateClass from '../components/CreateClass';
import ClassDetail from '../components/ClassDetail';
import MobileClassManagement from '../components/MobileClassManagement';
import PageNav from '../components/PageNav';

export default function ClassManagement() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { state, deleteClass } = useData();
  const [showCreateClass, setShowCreateClass] = useState(() => searchParams.get('create') === 'true');
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleCreateClassComplete = (newClassId?: string) => {
    setShowCreateClass(false);
    const classId = newClassId || (() => {
      const latest = [...state.classes].sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )[0];
      return latest?.id;
    })();
    if (classId) {
      sessionStorage.setItem('selectedClassId', classId);
      navigate('/start');
    }
  };

  const handleDeleteClass = (classId: string, className: string) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete the class "${className}"? This will also delete all reports for this class. This action cannot be undone.`
    );
    if (confirmed) {
      deleteClass(classId);
      alert(`Class "${className}" has been deleted.`);
    }
  };

  const handleViewClass = (classId: string) => setSelectedClassId(classId);
  const handleBackFromClassDetail = () => setSelectedClassId(null);

  const handleSelectClassForReports = (classId: string) => {
    sessionStorage.setItem('selectedClassId', classId);
    navigate('/start');
  };

  const handleContinueEditing = (classData: any) => {
    const classReports = state.reports.filter(report => report.classId === classData.id);
    if (classReports.length === 0) return;
    const mostRecentReport = classReports.reduce((latest, current) =>
      new Date(current.updatedAt) > new Date(latest.updatedAt) ? current : latest
    );
    const studentIndex = classData.students.findIndex(
      (student: any) => student.id === mostRecentReport.studentId
    );
    sessionStorage.setItem('continueEditing', JSON.stringify({
      classId: classData.id,
      templateId: mostRecentReport.templateId,
      studentIndex: studentIndex >= 0 ? studentIndex : 0
    }));
    navigate('/write-reports');
  };

  if (showCreateClass) {
    return (
      <CreateClass
        onComplete={handleCreateClassComplete}
        onCancel={() => setShowCreateClass(false)}
      />
    );
  }

  if (selectedClassId) {
    const selectedClass = state.classes.find(c => c.id === selectedClassId);
    if (selectedClass) {
      return (
        <ClassDetail
          classData={selectedClass}
          onBack={handleBackFromClassDetail}
        />
      );
    }
  }

  if (isMobile) {
    return (
      <MobileClassManagement
        onViewClass={handleViewClass}
        onCreateClass={() => setShowCreateClass(true)}
      />
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      <PageNav />

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px' }}>

        {/* Page title + action button */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '12px' }}>
          <h1 style={{ fontSize: '26px', fontWeight: '700', color: '#111827', margin: 0 }}>
            Your Classes
          </h1>
          <button
            onClick={() => setShowCreateClass(true)}
            style={{ backgroundColor: '#10b981', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}
          >
            + Create New Class
          </button>
        </div>

        {state.classes.length === 0 ? (
          <div style={{
            backgroundColor: 'white', borderRadius: '12px',
            border: '2px dashed #d1d5db', padding: '48px',
            textAlign: 'center', color: '#9ca3af'
          }}>
            <p style={{ margin: '0 0 8px 0' }}>No classes created yet.</p>
            <p style={{ margin: '0 0 16px 0' }}>Create your first class to start managing students!</p>
            <button
              onClick={() => setShowCreateClass(true)}
              style={{ backgroundColor: '#10b981', color: 'white', padding: '12px 24px', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: '500', cursor: 'pointer' }}
            >
              Create Your First Class
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {state.classes.map((classItem) => {
              const reportCount = state.reports.filter(r => r.classId === classItem.id).length;
              return (
                <div key={classItem.id} style={{
                  backgroundColor: 'white',
                  borderRadius: '12px',
                  border: '1px solid #e5e7eb',
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                }}>
                  {/* Class info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '4px' }}>
                      {classItem.name}
                    </div>
                    <div style={{ fontSize: '13px', color: '#6b7280', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                      <span>👥 {classItem.students.length} students</span>
                      <span>📅 {new Date(classItem.createdAt).toLocaleDateString()}</span>
                      {reportCount > 0 && <span>📝 {reportCount} reports written</span>}
                      {classItem.students.length > 0 && (
                        <span style={{ color: '#9ca3af' }}>
                          {classItem.students.sort((a, b) => a.lastName.localeCompare(b.lastName)).slice(0, 3).map(s => `${s.firstName} ${s.lastName}`).join(', ')}
                          {classItem.students.length > 3 && ` +${classItem.students.length - 3} more`}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action buttons — all on one line */}
                  <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                    <button
                      onClick={() => handleViewClass(classItem.id)}
                      style={{ backgroundColor: '#3b82f6', color: 'white', padding: '8px 14px', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '500', cursor: 'pointer', whiteSpace: 'nowrap' }}
                    >
                      👀 View Details
                    </button>
                    <button
                      onClick={() => navigate(`/view-reports/${classItem.id}`)}
                      style={{ backgroundColor: '#8b5cf6', color: 'white', padding: '8px 14px', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '500', cursor: 'pointer', whiteSpace: 'nowrap' }}
                    >
                      📊 Reports
                    </button>
                    <button
                      onClick={() => handleSelectClassForReports(classItem.id)}
                      style={{ backgroundColor: '#10b981', color: 'white', padding: '8px 14px', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '500', cursor: 'pointer', whiteSpace: 'nowrap' }}
                    >
                      ✏️ Write Reports
                    </button>
                    {reportCount > 0 && (
                      <button
                        onClick={() => handleContinueEditing(classItem)}
                        style={{ backgroundColor: '#f59e0b', color: 'white', padding: '8px 14px', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '500', cursor: 'pointer', whiteSpace: 'nowrap' }}
                      >
                        ↩ Continue
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteClass(classItem.id, classItem.name)}
                      style={{ backgroundColor: '#fee2e2', color: '#ef4444', padding: '8px 14px', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '500', cursor: 'pointer', whiteSpace: 'nowrap' }}
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </main>
    </div>
  );
}