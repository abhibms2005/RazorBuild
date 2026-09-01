import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error boundary specifically for the /dashboard page.
 * Shows a visible, styled error panel instead of a blank page.
 */
export class DashboardErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("[DashboardErrorBoundary] Caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-void flex items-center justify-center p-8">
          <div className="max-w-lg w-full bg-void-light border border-red-500/30 rounded-xl p-8 shadow-2xl">
            {/* Header */}
            <div className="flex items-center gap-3 mb-5">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/15 border border-red-500/30">
                <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
              </span>
              <div>
                <h2 className="text-lg font-semibold text-chalk">Dashboard Error</h2>
                <p className="text-xs text-chalk-dim font-mono">Something went wrong rendering this page</p>
              </div>
            </div>

            {/* Error Details */}
            <div className="bg-void/60 rounded-lg border border-chalk-muted/10 p-4 mb-6">
              <p className="font-mono text-xs text-red-300 break-words">
                {this.state.error?.message || "An unexpected error occurred"}
              </p>
              {this.state.error?.stack && (
                <details className="mt-3">
                  <summary className="text-[10px] font-mono text-chalk-muted cursor-pointer hover:text-chalk-dim transition-colors">
                    Stack trace
                  </summary>
                  <pre className="mt-2 text-[9px] font-mono text-chalk-muted/60 overflow-x-auto whitespace-pre-wrap max-h-40 overflow-y-auto">
                    {this.state.error.stack}
                  </pre>
                </details>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => this.setState({ hasError: false, error: null })}
                className="flex-1 px-4 py-2.5 bg-ember/90 hover:bg-ember text-void font-mono text-xs font-semibold rounded-lg transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.reload()}
                className="flex-1 px-4 py-2.5 bg-void-soft border border-chalk-muted/20 hover:border-chalk-muted/40 text-chalk-dim hover:text-chalk font-mono text-xs font-semibold rounded-lg transition-colors"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
