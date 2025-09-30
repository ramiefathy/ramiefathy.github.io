/**
 * Shared UI components for clinic scheduler
 * Icon, Button, Card, Modal, Loading components
 */

import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { iconMap } from '../../utils/icons';

// ==================== Icon ====================
export const Icon = ({ name, size = 20, className = "" }) => {
    const IconComponent = iconMap[name];
    if (!IconComponent) {
        console.warn(`Icon "${name}" not found in iconMap`);
        return null;
    }
    return <IconComponent size={size} className={className} />;
};

// ==================== Button ====================
export const Button = ({ children, variant = 'primary', size = 'md', className = "", icon, loading = false, ...props }) => {
    const baseClasses = "inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 ease-in-out focus-ring transform";
    const variants = {
        primary: "bg-primary-600 text-white hover:bg-primary-700 hover:shadow-lg hover:shadow-primary-600/20 hover:-translate-y-0.5 active:scale-95 focus:ring-primary-500",
        secondary: "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:border-gray-400 hover:shadow-md hover:-translate-y-0.5 active:scale-95 focus:ring-primary-500",
        ghost: "text-gray-600 hover:bg-gray-100 hover:text-gray-900 hover:shadow-sm hover:-translate-y-0.5 active:scale-95 focus:ring-gray-500",
        danger: "bg-red-600 text-white hover:bg-red-700 hover:shadow-lg hover:shadow-red-600/20 hover:-translate-y-0.5 active:scale-95 focus:ring-red-500",
        success: "bg-green-600 text-white hover:bg-green-700 hover:shadow-lg hover:shadow-green-600/20 hover:-translate-y-0.5 active:scale-95 focus:ring-green-500"
    };
    const sizes = {
        sm: "px-3 py-1.5 text-sm gap-1.5",
        md: "px-4 py-2 text-sm gap-2",
        lg: "px-6 py-3 text-base gap-2"
    };

    return (
        <motion.button
            whileHover={{ scale: loading ? 1 : 1.02 }}
            whileTap={{ scale: loading ? 1 : 0.98 }}
            className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${loading ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''} ${className}`}
            disabled={loading}
            {...props}
        >
            {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
            ) : icon ? (
                <Icon name={icon} size={size === 'sm' ? 16 : size === 'lg' ? 20 : 18} />
            ) : null}
            {children}
        </motion.button>
    );
};

// ==================== Card ====================
export const Card = ({ children, className = "", padding = true, hover = false, ...motionProps }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={hover ? { scale: 1.02, y: -4 } : undefined}
        className={`bg-white rounded-xl card-shadow border border-gray-200 transition-all duration-200 ease-in-out ${
            hover ? 'hover:card-shadow-hover' : ''
        } ${padding ? 'p-6' : ''} ${className}`}
        {...motionProps}
    >
        {children}
    </motion.div>
);

// ==================== Loading Spinner ====================
export const LoadingSpinner = ({ size = 'md', className = "" }) => {
    const sizes = {
        sm: 'h-4 w-4',
        md: 'h-8 w-8',
        lg: 'h-12 w-12'
    };

    return (
        <div className={`flex justify-center py-8 ${className}`}>
            <div className={`animate-spin rounded-full border-b-2 border-primary-600 ${sizes[size]}`}></div>
        </div>
    );
};

// ==================== Skeleton Components ====================
export const SkeletonCard = ({ lines = 3, className = "" }) => (
    <Card className={`animate-pulse ${className}`}>
        <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded shimmer"></div>
            {Array.from({ length: lines - 1 }).map((_, i) => (
                <div key={i} className={`h-4 bg-gray-200 rounded shimmer ${i === lines - 2 ? 'w-3/4' : ''}`}></div>
            ))}
        </div>
    </Card>
);

export const SkeletonText = ({ lines = 2, className = "" }) => (
    <div className={`space-y-2 ${className}`}>
        {Array.from({ length: lines }).map((_, i) => (
            <div key={i} className={`h-4 bg-gray-200 rounded shimmer ${i === lines - 1 ? 'w-3/4' : ''}`}></div>
        ))}
    </div>
);

// ==================== Modal ====================
export const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
    const sizes = {
        sm: 'max-w-md',
        md: 'max-w-2xl',
        lg: 'max-w-4xl',
        xl: 'max-w-6xl'
    };

    const dialogRef = useRef(null);
    const previousFocusRef = useRef(null);
    const titleIdRef = useRef(`modal-title-${Math.random().toString(36).slice(2, 9)}`);

    useEffect(() => {
        if (!isOpen) return;

        previousFocusRef.current = document.activeElement;

        const focusFirstElement = () => {
            const node = dialogRef.current;
            if (!node) return;
            const focusableSelectors = [
                'a[href]',
                'button:not([disabled])',
                'textarea:not([disabled])',
                'input:not([disabled])',
                'select:not([disabled])',
                '[tabindex]:not([tabindex="-1"])'
            ];
            const focusable = node.querySelectorAll(focusableSelectors.join(','));
            if (focusable.length > 0) {
                focusable[0].focus();
            } else {
                node.focus();
            }
        };

        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                event.preventDefault();
                onClose?.();
                return;
            }

            if (event.key !== 'Tab') return;

            const node = dialogRef.current;
            if (!node) return;

            const focusableSelectors = [
                'a[href]',
                'button:not([disabled])',
                'textarea:not([disabled])',
                'input:not([disabled])',
                'select:not([disabled])',
                '[tabindex]:not([tabindex="-1"])'
            ];
            const focusable = node.querySelectorAll(focusableSelectors.join(','));
            if (focusable.length === 0) {
                event.preventDefault();
                node.focus();
                return;
            }

            const firstElement = focusable[0];
            const lastElement = focusable[focusable.length - 1];
            const activeElement = document.activeElement;

            if (event.shiftKey) {
                if (activeElement === firstElement || !node.contains(activeElement)) {
                    event.preventDefault();
                    lastElement.focus();
                }
            } else if (activeElement === lastElement) {
                event.preventDefault();
                firstElement.focus();
            }
        };

        focusFirstElement();
        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            if (previousFocusRef.current && typeof previousFocusRef.current.focus === 'function') {
                previousFocusRef.current.focus();
            }
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const modalRoot = document.getElementById('modal-root');
    if (!modalRoot) return null;

    return createPortal(
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 overflow-y-auto"
            >
                <div className="flex items-center justify-center min-h-screen p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={onClose}
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className={`relative bg-white rounded-2xl shadow-2xl ${sizes[size]} w-full max-h-[90vh] overflow-hidden`}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby={titleIdRef.current}
                        ref={dialogRef}
                        tabIndex={-1}
                    >
                        <div className="flex items-center justify-between p-6 border-b">
                            <h3 id={titleIdRef.current} className="text-xl font-semibold text-gray-900">{title}</h3>
                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={onClose}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                aria-label="Close dialog"
                            >
                                <Icon name="x" size={20} />
                            </motion.button>
                        </div>
                        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
                            {children}
                        </div>
                    </motion.div>
                </div>
            </motion.div>
        </AnimatePresence>,
        modalRoot
    );
};

export default {
    Icon,
    Button,
    Card,
    LoadingSpinner,
    SkeletonCard,
    SkeletonText,
    Modal
};
