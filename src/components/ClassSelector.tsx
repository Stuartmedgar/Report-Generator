import React from 'react';
import { Link } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { Template, Class } from '../types';

interface ClassSelectorProps {
  template: Template;
  onSelectClass: (classData: Class) => void;
  onBack: () => void;
}

function ClassSelector({ template, onSelectClass, onBack }: ClassSelectorProps) {
  const { state } = useData();

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      <header style={{ 
        backgroundColor: 'white', 
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        padding: '32px 24px',
        textAlign: 'center'
      }}>
        <h1 style={{ 
          fontSize: '28px', 
          fontWeight: '600', 
          color: '#111827',
          margin: 0
        }}>
          Select Class
        </h1>
        <p style={{ 
          color: '#6b7280', 
          margin: '8px 0 0 0',
          fontSize: '16px'
        }}>
          Using template: {template.name}
        </p>
      </header>

      <main style={{ 
        maxWidth: '800px', 
        margin: '0 auto', 
        padding: '32px 24px' 
      }}>
        
        <button 
          onClick={onBack}
          style={{
            backgroundColor: '#6b7280',
            color: 'white',
            padding: '12px 24px',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: '500',
            cursor: 'pointer',
            marginBottom: '24px'
          }}>
          ← Back to Template Selection
        </button>

        <div style={{
          backgroundColor: 'white',
          padding: '32px',
          borderRadius: '12px',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
          marginBottom: '24px'
        }}>

          {/* Create Class Button */}
          <div style={{ marginBottom: '32px' }}>
            <Link to="/class-management" style={{ textDecoration: 'none' }}>
              <button style={{
                backgroundColor: '#10b981',
                color: 'white',
                padding: '16px 32px',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '500',
                cursor: 'pointer',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                width: '100%'
              }}>
                Create New Class
              </button>
            </Link>
            <p style={{ 
              color: '#6b7280', 
              fontSize: '14px',
              margin: '8px 0 0 0',
              textAlign: 'center'
            }}>
              Add a new class with student list
            </p>
          </div>

          {/* Available Classes */}
          <h2 style={{ 
            fontSize: '20px', 
            fontWeight: '600', 
            color: '#111827',
            marginBottom: '16px'
          }}>
            Select a Class ({state.classes.length})
          </h2>

          {state.classes.length === 0 ? (
            <div style={{
              border: '2px dashed #d1d5db',
              borderRadius: '8px',
              padding: '48px',
              textAlign: 'center',
              color: '#9ca3af'
            }}>
              <p style={{ margin: '0 0 8px 0' }}>No classes available yet.</p>
              <p style={{ margin: '0 0 16px 0' }}>Create your first class to start writing reports!</p>
              <Link to="/class-management" style={{ textDecoration: 'none' }}>
                <button style={{
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  padding: '12px 24px',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}>
                  Create Class
                </button>
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {state.classes.map((classItem) => (
                <div key={classItem.id} style={{
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  padding: '16px',
                  backgroundColor: '#fafafa',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#10b981';
                  e.currentTarget.style.backgroundColor = '#f0fdf4';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#e5e7eb';
                  e.currentTarget.style.backgroundColor = '#fafafa';
                }}>
                  
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'flex-start',
                    marginBottom: '12px'
                  }}>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ 
                        fontSize: '18px', 
                        fontWeight: '600', 
                        color: '#111827',
                        margin: '0 0 8px 0'
                      }}>
                        {classItem.name}
                      </h3>
                      <div style={{
                        display: 'flex',
                        gap: '16px',
                        fontSize: '14px',
                        color: '#6b7280',
                        marginBottom: '8px'
                      }}>
                        <span>{classItem.students.length} students</span>
                        <span>Created: {new Date(classItem.createdAt).toLocaleDateString()}</span>
                      </div>
                      
                      {/* Show first few student names */}
                      {classItem.students.length > 0 && (
                        <div style={{
                          fontSize: '12px',
                          color: '#6b7280'
                        }}>
                          Students: {classItem.students
                            .sort((a, b) => a.lastName.localeCompare(b.lastName))
                            .slice(0, 3)
                            .map(s => `${s.firstName} ${s.lastName}`)
                            .join(', ')}
                          {classItem.students.length > 3 && ` +${classItem.students.length - 3} more`}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Select Button */}
                  <button
                    onClick={() => onSelectClass(classItem)}
                    disabled={classItem.students.length === 0}
                    style={{
                      backgroundColor: classItem.students.length === 0 ? '#d1d5db' : '#10b981',
                      color: 'white',
                      padding: '12px 24px',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: classItem.students.length === 0 ? 'not-allowed' : 'pointer',
                      width: '100%'
                    }}
                  >
                    {classItem.students.length === 0 
                      ? 'No Students in Class' 
                      : `Select This Class (${classItem.students.length} students)`
                    }
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default ClassSelector;