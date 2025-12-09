/**
 * Clinic Scheduler Pro - Main Entry Point
 * Run `npm run clinic:scheduler:build` after editing.
 */

// React and core dependencies
import React from 'react';
import * as ReactDOMLegacy from 'react-dom';
import * as ReactDOMClient from 'react-dom/client';
import { motion, AnimatePresence } from 'framer-motion';
import * as dateFns from 'date-fns';
import * as Recharts from 'recharts';

// Firebase and styles
import { attachFirebaseGlobals } from './firebase';
import './index.css';

// Contexts
import { ToastProvider } from './contexts/ToastContext';
import { AppProvider } from './contexts/AppContext';

// Components
import { ErrorBoundary } from './components/errors/ErrorBoundary';
import App from './components/App';

// Setup ReactDOM
const ReactDOM = Object.assign({}, ReactDOMLegacy, ReactDOMClient);
if (!ReactDOM.createRoot && ReactDOMClient.createRoot) {
    ReactDOM.createRoot = ReactDOMClient.createRoot.bind(ReactDOMClient);
}

// Setup global scope for CDN compatibility
const globalScope = typeof window !== 'undefined' ? window : globalThis;
globalScope.React = React;
globalScope.ReactDOM = ReactDOM;
globalScope.Recharts = Recharts;
globalScope['date-fns'] = dateFns;
globalScope['framer-motion'] = { motion, AnimatePresence };
attachFirebaseGlobals(globalScope);

// ==================== Root Component ====================
const Root = () => {
    return (
        <ErrorBoundary>
            <ToastProvider>
                <AppProvider>
                    <ErrorBoundary
                        title="Application Error"
                        message="An error occurred while loading the application. Please try refreshing the page."
                    >
                        <App />
                    </ErrorBoundary>
                </AppProvider>
            </ToastProvider>
        </ErrorBoundary>
    );
};

// Render the app
ReactDOM.createRoot(document.getElementById('root')).render(<Root />);
