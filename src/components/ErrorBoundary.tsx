import React from 'react';

// Catches any unexpected error while rendering so teachers see a way back
// instead of a blank white page. Saved reports, classes and templates live in
// localStorage, so reloading or going home doesn't lose them.
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Unexpected error:', error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    const buttonStyle: React.CSSProperties = {
      padding: '10px 20px', border: 'none', borderRadius: '6px',
      fontSize: '15px', fontWeight: 600, cursor: 'pointer', color: 'white',
    };

    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backgroundColor: '#f9fafb' }}>
        <div style={{ maxWidth: '460px', textAlign: 'center', backgroundColor: 'white', padding: '32px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
          <h2 style={{ margin: '0 0 12px', color: '#111827' }}>Something went wrong</h2>
          <p style={{ margin: '0 0 24px', color: '#4b5563', lineHeight: 1.5 }}>
            Sorry, the page hit an unexpected problem. Your saved reports, classes and templates are still stored in this browser.
            Any changes to the report you were writing that hadn't been saved may need to be redone.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => window.location.reload()} style={{ ...buttonStyle, backgroundColor: '#3b82f6' }}>Reload page</button>
            <button onClick={() => { window.location.href = '/'; }} style={{ ...buttonStyle, backgroundColor: '#6b7280' }}>Go to home</button>
          </div>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
