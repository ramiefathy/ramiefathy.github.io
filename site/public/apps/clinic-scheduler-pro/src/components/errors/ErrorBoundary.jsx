/**
 * Error boundary components for clinic scheduler
 * Catches React errors and provides fallback UI
 */

import React from 'react';

// Main error boundary - catches all errors
export class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        console.error('Error caught by boundary:', error, errorInfo);
        this.setState({
            error: error,
            errorInfo: errorInfo
        });

        // Log to Firebase Analytics if available
        if (window.firebaseApp) {
            try {
                console.log('Logging error to Firebase:', error.toString());
            } catch (logError) {
                console.error('Failed to log error to Firebase:', logError);
            }
        }
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null, errorInfo: null });
        if (this.props.onReset) {
            this.props.onReset();
        }
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100 p-4">
                    <div className="max-w-2xl w-full bg-white rounded-xl shadow-xl p-8">
                        <div className="flex items-center justify-center w-16 h-16 bg-red-100 rounded-xl mb-6">
                            <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-3">
                            {this.props.title || 'Something went wrong'}
                        </h2>
                        <p className="text-gray-600 mb-6">
                            {this.props.message || 'An unexpected error occurred. The application has recovered, but you may need to refresh the page.'}
                        </p>

                        {/* Error details (only in development) */}
                        {window.location.hostname === 'localhost' && this.state.error && (
                            <details className="mb-6 p-4 bg-gray-50 rounded-lg">
                                <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
                                    Error Details (Development Only)
                                </summary>
                                <pre className="mt-3 text-xs text-gray-600 overflow-auto">
                                    {this.state.error.toString()}
                                    {this.state.errorInfo && this.state.errorInfo.componentStack}
                                </pre>
                            </details>
                        )}

                        <div className="flex gap-3">
                            <button
                                onClick={this.handleReset}
                                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                            >
                                Try Again
                            </button>
                            <button
                                onClick={() => window.location.reload()}
                                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                            >
                                Refresh Page
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

// Route-level error boundary with more specific error handling
export class RouteErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        console.error(`Error in ${this.props.routeName || 'route'}:`, error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <h3 className="text-lg font-semibold text-yellow-900 mb-2">
                        Unable to load {this.props.routeName || 'this section'}
                    </h3>
                    <p className="text-yellow-700 mb-4">
                        There was a problem loading this section. Please try refreshing the page.
                    </p>
                    <button
                        onClick={() => this.setState({ hasError: false })}
                        className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
                    >
                        Retry
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
