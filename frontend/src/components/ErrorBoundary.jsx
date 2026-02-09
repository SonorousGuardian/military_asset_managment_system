import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ error, errorInfo });
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', backgroundColor: '#1a1a1a', color: '#ff5555', height: '100vh', fontFamily: 'monospace' }}>
          <h1>Something went wrong.</h1>
          <details style={{ whiteSpace: 'pre-wrap' }}>
            {this.state.error && this.state.error.toString()}
            <br />
            {this.state.errorInfo && this.state.errorInfo.componentStack}
          </details>
          <button 
            onClick={() => {
                localStorage.clear(); 
                window.location.reload();
            }}
            style={{ marginTop: '20px', padding: '10px', cursor: 'pointer' }}
          >
            Clear Cache & Reload
          </button>
        </div>
      );
    }

    return this.props.children; 
  }
}

export default ErrorBoundary;
