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
      navigate('/step2');
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
    navigate('/step2');
  };

  const getLastStudentWorkedOn = (classData: any) => {
    const classReports = state.reports.filter(report => report.classId === classData.id);
    if (classReports.length === 0) return null;
    const mostRecentReport = classReports.reduce((latest, current) =>
      new Date(current.updatedAt) > new Date(latest.updatedAt) ? current : latest
    );
    const studentIndex = classData.students.findIndex(
      (student: any) => student.id === mostRecentReport.studentId
    );
    return {
      studentIndex: studentIndex >= 0 ? studentIndex : 0,
      templateId: mostRecentReport.templateId,
      student: classData.students[studentIndex >= 0 ? studentIndex : 0]
    };
  };

  const handleContinueEditing = (classData: any) => {
    const lastWorked = getLastStudentWorkedOn(classData);
    if (!lastWorked) return;
    sessionStorage.setItem('continueEditing', JSON.stringify({
      classId: classData.id,
      templateId: lastWorked.templateId,
      studentIndex: lastWorked.studentIndex
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

  const btnStyle = (bg: string): React.CSSProperties => ({
    backgroundColor: bg, color: 'white', padding: '8px 16px',
    border: 'none', borderRadius: '6px', fontSize: '14px',
    fontWeight: '500', cursor: 'pointer'
  });

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

        {/* Classes list */}
        <div style={{ backgroundColor: 'white', padding: '28px', borderRadius: '12px', boxShadow: '0 1px 3px 0 rgba(0,0,0,0.08)' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 16px 0' }}>
            {state.classes.length} {state.classes.length === 1 ? 'Class' : 'Classes'}
          </h2>

          {state.classes.length === 0 ? (
            <div style={{ border: '2px dashed #d1d5db', borderRadius: '8px', padding: '48px', textAlign: 'center', color: '#9ca3af' }}>
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '16px' }}>
              {state.classes.map((classItem) => {
                const reportCount = state.reports.filter(r => r.classId === classItem.id).length;
                return (
                  <div key={classItem.id} style={{ border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px', backgroundColor: '#f9fafb' }}>
                    <div style={{ marginBottom: '16px' }}>
                      <h3 style={{ fontSize: '17px', fontWeight: '600', color: '#111827', margin: '0 0 6px 0' }}>{classItem.name}</h3>
                      <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: '#6b7280', marginBottom: '6px' }}>
                        <span>👥 {classItem.students.length} students</span>
                        <span>📅 {new Date(classItem.createdAt).toLocaleDateString()}</span>
                      </div>
                      {reportCount > 0 && (
                        <div style={{ backgroundColor: '#fef3c7', color: '#92400e', padding: '3px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: '500', display: 'inline-block' }}>
                          📝 {reportCount} reports written
                        </div>
                      )}
                      {classItem.students.length > 0 && (
                        <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '6px' }}>
                          {classItem.students.sort((a, b) => a.lastName.localeCompare(b.lastName)).slice(0, 3).map(s => `${s.firstName} ${s.lastName}`).join(', ')}
                          {classItem.students.length > 3 && ` +${classItem.students.length - 3} more`}
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginBottom: '8px' }}>
                      <button onClick={() => handleViewClass(classItem.id)} style={btnStyle('#3b82f6')}>👀 View Details</button>
                      <button onClick={() => navigate(`/view-reports/${classItem.id}`)} style={btnStyle('#8b5cf6')}>📊 View Reports</button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: reportCount > 0 ? 'repeat(3, 1fr)' : 'repeat(2, 1fr)', gap: '8px' }}>
                      <button onClick={() => handleSelectClassForReports(classItem.id)} style={btnStyle('#10b981')}>
                        ✏️ Write Reports
                      </button>
                      {reportCount > 0 && (
                        <button onClick={() => handleContinueEditing(classItem)} style={btnStyle('#f59e0b')}>
                          ↩ Continue
                        </button>
                      )}
                      <button onClick={() => handleDeleteClass(classItem.id, classItem.name)} style={btnStyle('#ef4444')}>
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </main>
    </div>
  );
}