/**
 * Toast notification context
 * Provides toast.success(), toast.error(), toast.warning() across the app
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

const ToastDispatchContext = createContext(null);
const ToastStateContext = createContext([]);

let externalToastDispatch = null;

export const toast = {
    success: (message) => externalToastDispatch?.({ type: 'success', message }),
    error: (message) => externalToastDispatch?.({ type: 'error', message }),
    warning: (message) => externalToastDispatch?.({ type: 'warning', message })
};

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const removeToast = useCallback((id) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, []);

    const publish = useCallback(({ type, message }) => {
        if (!message) return;
        const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        setToasts((prev) => [...prev, { id, type, message }]);
    }, []);

    useEffect(() => {
        externalToastDispatch = publish;
        return () => {
            if (externalToastDispatch === publish) {
                externalToastDispatch = null;
            }
        };
    }, [publish]);

    return (
        <ToastDispatchContext.Provider value={removeToast}>
            <ToastStateContext.Provider value={toasts}>
                {children}
                <ToastViewport />
            </ToastStateContext.Provider>
        </ToastDispatchContext.Provider>
    );
};

const ToastViewport = () => {
    const toasts = useContext(ToastStateContext);
    const dismiss = useContext(ToastDispatchContext);

    return (
        <div
            role="status"
            aria-live="polite"
            style={{
                position: 'fixed',
                bottom: '1.5rem',
                right: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                zIndex: 9999,
                maxWidth: '20rem'
            }}
        >
            {toasts.map((toast) => (
                <ToastItem key={toast.id} toast={toast} onDismiss={dismiss} />
            ))}
        </div>
    );
};

const ToastItem = ({ toast, onDismiss }) => {
    useEffect(() => {
        const timer = setTimeout(() => onDismiss(toast.id), 3500);
        return () => clearTimeout(timer);
    }, [toast.id, onDismiss]);

    const paletteMap = {
        success: { bg: '#dcfce7', border: '#86efac', text: '#065f46' },
        error: { bg: '#fee2e2', border: '#fca5a5', text: '#991b1b' },
        warning: { bg: '#fef3c7', border: '#fcd34d', text: '#92400e' }
    };

    const palette = paletteMap[toast.type] || paletteMap.success;

    return (
        <div
            role="alert"
            onClick={() => onDismiss(toast.id)}
            style={{
                borderRadius: '1rem',
                padding: '0.85rem 1rem',
                background: palette.bg,
                border: `1px solid ${palette.border}`,
                color: palette.text,
                fontWeight: 600,
                boxShadow: '0 12px 30px rgba(15, 23, 42, 0.15)',
                cursor: 'pointer'
            }}
        >
            {toast.message}
        </div>
    );
};

// For compatibility with existing code that imports Toaster
export const Toaster = () => null;

export default ToastProvider;
