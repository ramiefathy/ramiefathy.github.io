import { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * App Demo Modal Component
 *
 * Displays an app in a full-screen modal iframe for quick preview.
 * Includes loading state, error handling, and keyboard accessibility.
 */
export default function AppDemoModal({ app, isOpen, onClose }) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const prefersReducedMotion = typeof window !== 'undefined'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  const handleIframeLoad = useCallback(() => {
    setIsLoading(false);
    setHasError(false);
  }, []);

  const handleIframeError = useCallback(() => {
    setIsLoading(false);
    setHasError(true);
  }, []);

  // Reset state when app changes
  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      setHasError(false);
    }
  }, [app?.slug, isOpen]);

  // Track demo opens in localStorage
  useEffect(() => {
    if (isOpen && app?.slug) {
      try {
        const key = `demo_views_${app.slug}`;
        const currentViews = parseInt(localStorage.getItem(key) || '0', 10);
        localStorage.setItem(key, String(currentViews + 1));
      } catch {
        // Ignore localStorage errors
      }
    }
  }, [isOpen, app?.slug]);

  if (!app) return null;

  const previewUrl = app.preview || app.href;
  const isExternal = previewUrl?.startsWith('http');

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="demo-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.2 }}
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-labelledby="demo-modal-title"
        >
          <motion.div
            className="demo-modal"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.25, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <header className="demo-modal-header">
              <div className="demo-modal-title-group">
                <h2 id="demo-modal-title" className="demo-modal-title">
                  {app.name}
                </h2>
                <div className="demo-modal-tags">
                  {app.stack?.slice(0, 3).map((tag) => (
                    <span key={tag} className="demo-tag">{tag}</span>
                  ))}
                </div>
              </div>

              <div className="demo-modal-actions">
                <a
                  href={app.href}
                  target={isExternal ? '_blank' : undefined}
                  rel={isExternal ? 'noopener noreferrer' : undefined}
                  className="demo-open-btn"
                >
                  Open Full App →
                </a>
                <button
                  className="demo-close-btn"
                  onClick={onClose}
                  aria-label="Close demo"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </header>

            {/* Content */}
            <div className="demo-modal-content">
              {isLoading && (
                <div className="demo-loading" role="status" aria-live="polite">
                  <div className="demo-spinner" />
                  <p>Loading preview...</p>
                </div>
              )}

              {hasError && (
                <div className="demo-error" role="status" aria-live="assertive">
                  <p>Unable to load preview</p>
                  <a
                    href={app.href}
                    target={isExternal ? '_blank' : undefined}
                    rel={isExternal ? 'noopener noreferrer' : undefined}
                    className="demo-error-link"
                  >
                    Open app directly →
                  </a>
                </div>
              )}

              <iframe
                src={previewUrl}
                title={`${app.name} preview`}
                className={`demo-iframe ${isLoading ? 'is-loading' : ''}`}
                onLoad={handleIframeLoad}
                onError={handleIframeError}
                sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
              />
            </div>

            {/* Footer hint */}
            <footer className="demo-modal-footer">
              <span className="demo-hint">Press ESC to close</span>
            </footer>
          </motion.div>

          <style dangerouslySetInnerHTML={{ __html: `
            .demo-modal-backdrop {
              position: fixed;
              inset: 0;
              background: rgba(0, 0, 0, 0.75);
              backdrop-filter: blur(4px);
              z-index: 9999;
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 1rem;
            }

            .demo-modal {
              width: 100%;
              max-width: 1200px;
              height: 90vh;
              max-height: 800px;
              background: white;
              border-radius: 16px;
              display: flex;
              flex-direction: column;
              overflow: hidden;
              box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
            }

            [data-theme='dark'] .demo-modal {
              background: var(--secondary-900, #0f172a);
            }

            .demo-modal-header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding: 1rem 1.25rem;
              border-bottom: 1px solid rgba(148, 163, 184, 0.2);
              background: var(--secondary-50, #f8fafc);
            }

            [data-theme='dark'] .demo-modal-header {
              background: var(--secondary-800, #1e293b);
            }

            .demo-modal-title-group {
              display: flex;
              flex-direction: column;
              gap: 0.35rem;
            }

            .demo-modal-title {
              font-size: 1.125rem;
              font-weight: 600;
              color: var(--secondary-900, #0f172a);
              margin: 0;
            }

            [data-theme='dark'] .demo-modal-title {
              color: var(--secondary-100, #f1f5f9);
            }

            .demo-modal-tags {
              display: flex;
              gap: 0.35rem;
            }

            .demo-tag {
              font-size: 0.65rem;
              padding: 0.15rem 0.4rem;
              background: var(--primary-100, #dbeafe);
              color: var(--primary-700, #1d4ed8);
              border-radius: 4px;
              font-weight: 500;
            }

            [data-theme='dark'] .demo-tag {
              background: rgba(59, 130, 246, 0.2);
              color: var(--primary-300, #93c5fd);
            }

            .demo-modal-actions {
              display: flex;
              align-items: center;
              gap: 0.75rem;
            }

            .demo-open-btn {
              font-size: 0.85rem;
              color: var(--primary-600, #2563eb);
              text-decoration: none;
              font-weight: 500;
              padding: 0.5rem 1rem;
              border-radius: 6px;
              transition: background 0.2s;
            }

            .demo-open-btn:hover {
              background: var(--primary-50, #eff6ff);
            }

            [data-theme='dark'] .demo-open-btn {
              color: var(--primary-400, #60a5fa);
            }

            [data-theme='dark'] .demo-open-btn:hover {
              background: rgba(59, 130, 246, 0.1);
            }

            .demo-close-btn {
              width: 2.5rem;
              height: 2.5rem;
              display: flex;
              align-items: center;
              justify-content: center;
              border: none;
              background: transparent;
              color: var(--secondary-500, #64748b);
              cursor: pointer;
              border-radius: 8px;
              transition: all 0.2s;
            }

            .demo-close-btn:hover {
              background: var(--secondary-100, #f1f5f9);
              color: var(--secondary-700, #334155);
            }

            [data-theme='dark'] .demo-close-btn:hover {
              background: var(--secondary-700, #334155);
              color: var(--secondary-200, #e2e8f0);
            }

            .demo-modal-content {
              flex: 1;
              position: relative;
              background: var(--secondary-100, #f1f5f9);
            }

            [data-theme='dark'] .demo-modal-content {
              background: var(--secondary-950, #020617);
            }

            .demo-iframe {
              width: 100%;
              height: 100%;
              border: none;
              transition: opacity 0.3s;
            }

            .demo-iframe.is-loading {
              opacity: 0;
            }

            .demo-loading,
            .demo-error {
              position: absolute;
              inset: 0;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              gap: 1rem;
              color: var(--secondary-500, #64748b);
            }

            .demo-spinner {
              width: 40px;
              height: 40px;
              border: 3px solid var(--secondary-200, #e2e8f0);
              border-top-color: var(--primary-500, #3b82f6);
              border-radius: 50%;
              animation: spin 1s linear infinite;
            }

            @keyframes spin {
              to { transform: rotate(360deg); }
            }

            .demo-error-link {
              color: var(--primary-600, #2563eb);
              text-decoration: none;
            }

            .demo-error-link:hover {
              text-decoration: underline;
            }

            .demo-modal-footer {
              padding: 0.5rem 1rem;
              text-align: center;
              border-top: 1px solid rgba(148, 163, 184, 0.2);
              background: var(--secondary-50, #f8fafc);
            }

            [data-theme='dark'] .demo-modal-footer {
              background: var(--secondary-800, #1e293b);
            }

            .demo-hint {
              font-size: 0.75rem;
              color: var(--secondary-400, #94a3b8);
            }

            @media (max-width: 640px) {
              .demo-modal-backdrop {
                padding: 0;
              }

              .demo-modal {
                height: 100vh;
                max-height: none;
                border-radius: 0;
              }

              .demo-modal-header {
                flex-direction: column;
                align-items: flex-start;
                gap: 0.75rem;
              }

              .demo-modal-actions {
                width: 100%;
                justify-content: space-between;
              }
            }
          ` }} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
