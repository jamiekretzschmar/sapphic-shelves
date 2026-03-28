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
        <div className="min-h-screen flex items-center justify-center p-6 bg-slate-950">
          <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-2xl border border-slate-200 dark:border-white/10 text-center space-y-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-rose-500/10 text-rose-500">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-slate-100 dark:text-white">Something went wrong</h2>
              <p className="text-slate-600 dark:text-slate-400">
                An unexpected error occurred. We've logged the details and are working to fix it.
              </p>
            </div>
            {this.state.error && (
              <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-white/5 text-left overflow-auto max-h-32">
                <code className="text-xs text-rose-500 font-mono">{this.state.error.toString()}</code>
              </div>
            )}
            <button
              onClick={() => window.location.reload()}
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-slate-100 dark:text-white rounded-2xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20"
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
