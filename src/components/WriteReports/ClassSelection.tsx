import React from 'react';
import { Link } from 'react-router-dom';
import { useData } from '../../contexts/DataContext';
import { Template, Class } from '../../types';

interface ClassSelectionProps {
  selectedTemplate: Template;
  onClassSelect: (classData: Class) => void;
  onBack: () => void;
}

function ClassSelection({ selectedTemplate, onClassSelect, onBack }: ClassSelectionProps) {
  const { state } = useData();

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      
      {/* Mobile Header */}
      <header style={{ 
        backgroundColor: 'white', 
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        padding: '12px 16px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <h1 style={{ 
              fontSize: '18px', 
              fontWeight: '600', 
              color: '#111827',
              margin: 0
            }}>
              Select Class
            </h1>
            <span style={{
              fontSize: '12px',
              backgroundColor: '#e0f2fe',
              color: '#0277bd',
              padding: '4px 8px',
              borderRadius: '12px',
              fontWeight: '500'
            }}>
              Step 2 of 3
            </span>
          </div>
          
          <Link to="/" style={{ textDecoration: 'none' }}>
            <button style={{
              backgroundColor: '#3b82f6',
              color: 'white',
              padding: '6px',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              cursor: 'pointer',
              minWidth: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              🏠
            </button>
          </Link>
        </div>
      </header>

      <main style={{ 
        padding: '16px' 
      }}>
        
        {/* Selected Template Info */}
        <div style={{
          backgroundColor: '#eff6ff',
          border: '2px solid #3b82f6',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '20px',
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: '14px',
            color: '#1e40af',
            fontWeight: '600',
            marginBottom: '4px'
          }}>
            ✓ Template Selected
          </div>
          <div style={{
            fontSize: '16px',
            color: '#111827',
            fontWeight: '600'
          }}>
            {selectedTemplate.name}
          </div>
          <div style={{
            fontSize: '12px',
            color: '#6b7280'
          }}>
            {selectedTemplate.sections.length} sections
          </div>
        </div>

{/* Back Button and Home Button - Same Line */}
<div style={{
  display: 'flex',
  gap: '8px',
  marginBottom: '16px'
}}>
  <button 
    onClick={onBack}
    style={{
      backgroundColor: '#6b7280',
      color: 'white',
      padding: '12px 16px',
      border: 'none',
      borderRadius: '8px',
      fontSize: '14px',
      fontWeight: '500',
      cursor: 'pointer',
      flex: 1
    }}
  >
    ← Back
  </button>
  
  <Link to="/" style={{ textDecoration: 'none', flex: 1 }}>
    <button style={{
      backgroundColor: '#3b82f6',
      color: 'white',
      padding: '12px 16px',
      border: 'none',
      borderRadius: '8px',
      fontSize: '14px',
      fontWeight: '500',
      cursor: 'pointer',
      width: '100%'
    }}>
      Home
    </button>
  </Link>
</div>

        {/* Classes List */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
          overflow: 'hidden'
        }}>
          <div style={{
            padding: '16px',
            borderBottom: '1px solid #e5e7eb',
            backgroundColor: '#f9fafb'
          }}>
            <h3 style={{
              fontSize: '16px',
              fontWeight: '600',
              color: '#111827',
              margin: 0
            }}>
              Select a Class for your reports 
            </h3>
          </div>
          
          {state.classes.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '32px 16px'
            }}>
              <p style={{ 
                color: '#6b7280', 
                marginBottom: '16px',
                fontSize: '14px'
              }}>
                No classes found
              </p>
              <Link to="/class-management" style={{ textDecoration: 'none' }}>
                <button style={{
                  backgroundColor: '#10b981',
                  color: 'white',
                  padding: '12px 20px',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}>
                  Create Your First Class
                </button>
              </Link>
            </div>
          ) : (
            state.classes.map((classData, index) => (
              <div
                key={classData.id}
                onClick={() => onClassSelect(classData)}
                style={{
                  padding: '16px',
                  borderBottom: index < state.classes.length - 1 ? '1px solid #f3f4f6' : 'none',
                  cursor: 'pointer',
                  backgroundColor: 'white',
                  transition: 'background-color 0.2s'
                }}

              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      color: '#111827',
                      marginBottom: '4px'
                    }}>
                      {classData.name}
                    </div>
                    <div style={{
                      fontSize: '13px',
                      color: '#6b7280',
                      marginBottom: '2px'
                    }}>
                      {classData.students.length} students
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: '#9ca3af'
                    }}>
                      {new Date(classData.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div style={{
                    fontSize: '18px',
                    color: '#10b981'
                  }}>
                    →
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Need Help Section */}
<div style={{
  backgroundColor: '#f0fdf4',
  border: '2px solid #10b981',
  borderRadius: '8px',
  padding: '16px',
  textAlign: 'center',
  marginTop: '20px'
}}>
  <h3 style={{ 
    fontSize: '16px', 
    fontWeight: '600', 
    color: '#059669',
    margin: '0 0 8px 0'
  }}>
    Need Help?
  </h3>
  <p style={{ 
    color: '#059669', 
    fontSize: '14px',
    margin: '0 0 16px 0'
  }}>
    Don't see your class above? Create a new class to get started.
  </p>
  <div style={{
    display: 'flex',
    gap: '8px',
    justifyContent: 'center',
    flexWrap: 'wrap'
  }}>
    <Link to="/class-management" style={{ textDecoration: 'none' }}>
      <button style={{
        backgroundColor: '#10b981',
        color: 'white',
        padding: '8px 12px',
        border: 'none',
        borderRadius: '6px',
        fontSize: '12px',
        fontWeight: '500',
        cursor: 'pointer'
      }}>
        Create Class
      </button>
    </Link>
  </div>
</div>
      </main>
    </div>
  );
}

export default ClassSelection;