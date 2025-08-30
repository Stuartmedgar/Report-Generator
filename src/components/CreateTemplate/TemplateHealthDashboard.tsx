import React from 'react';

interface TemplateHealthDashboardProps {
  sectionsCount: number;
  validationErrors: string[];
}

export const TemplateHealthDashboard: React.FC<TemplateHealthDashboardProps> = ({ 
  sectionsCount, 
  validationErrors 
}) => {
  const healthPercentage = Math.max(10, Math.min(100, ((sectionsCount - validationErrors.length) / Math.max(1, sectionsCount)) * 100));
  const isHealthy = validationErrors.length === 0;
  const hasMinorIssues = validationErrors.length < 3;
  
  return (
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
        color: '#111827',
        margin: '0 0 12px 0',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        {isHealthy ? '✅' : '⚠️'} Template Health
      </h3>
      
      <div style={{ marginBottom: '16px' }}>
        <div style={{
          fontSize: '14px',
          color: '#6b7280',
          marginBottom: '8px'
        }}>
          Status: {isHealthy ? 
            <span style={{ color: '#10b981', fontWeight: '600' }}>Ready to Use</span> :
            <span style={{ color: '#ef4444', fontWeight: '600' }}>Needs Attention</span>
          }
        </div>
        
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '12px',
          color: '#6b7280',
          marginBottom: '4px'
        }}>
          <span>Sections: {sectionsCount}</span>
          <span>Issues: {validationErrors.length}</span>
        </div>
        
        <div style={{
          width: '100%',
          height: '6px',
          backgroundColor: '#e5e7eb',
          borderRadius: '3px',
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${healthPercentage}%`,
            height: '100%',
            backgroundColor: isHealthy ? '#10b981' : 
                           hasMinorIssues ? '#f59e0b' : '#ef4444',
            transition: 'all 0.3s ease'
          }} />
        </div>
      </div>
      
      {validationErrors.length > 0 && (
        <div>
          <div style={{
            fontSize: '12px',
            color: '#dc2626',
            marginBottom: '8px'
          }}>
            Top Issues:
          </div>
          <ul style={{
            fontSize: '11px',
            color: '#dc2626',
            margin: 0,
            paddingLeft: '16px'
          }}>
            {validationErrors.slice(0, 3).map((error, index) => (
              <li key={index} style={{ marginBottom: '2px' }}>
                {error.length > 40 ? `${error.substring(0, 40)}...` : error}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};