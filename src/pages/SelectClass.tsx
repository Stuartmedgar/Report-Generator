import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { Class } from '../types';

function SelectClass() {
  const { state } = useData();
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleClassSelect = (classData: Class) => {
    sessionStorage.setItem('selectedClassId', classData.id);
    navigate('/step2');
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: isMobile ? '40px 16px' : '60px 40px',
    }}>

      {/* Back */}
      <div style={{ width: '100%', maxWidth: '860px', marginBottom: '32px' }}>
        <Link to="/start" style={{ color: '#6b7280', textDecoration: 'none', fontSize: '14px' }}>
          ← Back
        </Link>
      </div>

      {/* Step indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '36px' }}>
        <div style={{
          width: '36px', height: '36px', borderRadius: '50%',
          backgroundColor: '#8b5cf6', color: 'white',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '15px', fontWeight: '700'
        }}>1</div>
        <div style={{ width: '60px', height: '3px', backgroundColor: '#e2e8f0', borderRadius: '2px' }} />
        <div style={{
          width: '36px', height: '36px', borderRadius: '50%',
          backgroundColor: '#e2e8f0', color: '#94a3b8',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '15px', fontWeight: '700'
        }}>2</div>
      </div>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '40px', maxWidth: '680px', width: '100%' }}>
        <p style={{
          fontSize: '13px', fontWeight: '600', color: '#8b5cf6',
          textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 10px 0'
        }}>
          Step 1 — Select a Class
        </p>
        <h1 style={{
          fontSize: isMobile ? '30px' : '40px', fontWeight: '800',
          color: '#1e293b', margin: '0 0 12px 0', lineHeight: '1.2'
        }}>
          Choose Your Class
        </h1>
        <p style={{ fontSize: '16px', color: '#64748b', margin: 0 }}>
          Select the class you want to write reports for.
        </p>
      </div>

      {/* Class list */}
      <div style={{ width: '100%', maxWidth: '860px' }}>

        {state.classes.length === 0 ? (
          <div style={{
            backgroundColor: 'white', borderRadius: '16px',
            padding: '56px 32px', textAlign: 'center',
            boxShadow: '0 1px 4px rgba(0,0,0,0.06)'
          }}>
            <div style={{ fontSize: '52px', marginBottom: '16px' }}>👥</div>
            <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#1e293b', marginBottom: '8px' }}>
              No classes yet
            </h3>
            <p style={{ fontSize: '15px', color: '#64748b', marginBottom: '28px' }}>
              You haven't created any classes yet.
            </p>
            <Link to="/class-management?create=true" style={{ textDecoration: 'none' }}>
              <button style={{
                backgroundColor: '#8b5cf6', color: 'white',
                padding: '13px 32px', border: 'none', borderRadius: '10px',
                fontSize: '15px', fontWeight: '600', cursor: 'pointer'
              }}>
                Create a Class
              </button>
            </Link>
          </div>
        ) : (
          <>
            <div style={{
              backgroundColor: 'white', borderRadius: '16px',
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden'
            }}>
              {state.classes.map((classItem, index) => (
                <div
                  key={classItem.id}
                  onClick={() => handleClassSelect(classItem)}
                  style={{
                    padding: isMobile ? '18px 20px' : '22px 32px',
                    borderBottom: index < state.classes.length - 1 ? '1px solid #f1f5f9' : 'none',
                    cursor: 'pointer',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    gap: '16px',
                    transition: 'background-color 0.15s'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#f8fafc'; }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                >
                  <div>
                    <div style={{ fontSize: '17px', fontWeight: '600', color: '#1e293b', marginBottom: '4px' }}>
                      {classItem.name}
                    </div>
                    <div style={{ fontSize: '13px', color: '#64748b' }}>
                      {classItem.students.length} {classItem.students.length === 1 ? 'pupil' : 'pupils'}
                    </div>
                  </div>
                  <div style={{ fontSize: '20px', color: '#8b5cf6', flexShrink: 0 }}>→</div>
                </div>
              ))}
            </div>

            <div style={{ textAlign: 'center', marginTop: '20px' }}>
              <Link to="/class-management?create=true" style={{
                color: '#8b5cf6', textDecoration: 'none', fontSize: '14px', fontWeight: '500'
              }}>
                + Create a new class instead
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default SelectClass;