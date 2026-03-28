import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-theme-bg">
          <div className="max-w-md w-full bg-theme-surface rounded-3xl p-8 shadow-2xl border border-theme-border text-center space-y-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-theme-danger/10 text-theme-danger">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-theme-text">Something went wrong</h2>
              <p className="text-theme-text-secondary">
                An unexpected error occurred. We've logged the details and are working to fix it.
              </p>
            </div>
            {this.state.error && (
              <div className="p-4 bg-theme-bg rounded-xl border border-theme-border text-left overflow-auto max-h-32">
                <code className="text-xs text-theme-danger font-mono">{this.state.error.toString()}</code>
              </div>
            )}
            <button
              onClick={() => window.location.reload()}
              className="w-full py-4 bg-theme-accent1 hover:opacity-90 text-white rounded-2xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-theme-accent1/20"
            >
              <RefreshCw className="w-5 h-5" />
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
