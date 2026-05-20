import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import AppDemoModal from './AppDemoModal.jsx';
import { isEnabled } from '../lib/featureFlags.js';

/**
 * Apps Showcase Component
 *
 * App catalog with collection filtering and a quick-demo modal.
 */
export default function AppsShowcase({ apps, collections }) {
  const [activeCollection, setActiveCollection] = useState('all');
  const [demoApp, setDemoApp] = useState(null);
  const [visibleCount, setVisibleCount] = useState(8);
  const loadMoreRef = useRef(null);

  // Filter active/beta apps
  const activeApps = useMemo(() =>
    apps.filter(app => app.status === 'active' || app.status === 'beta'),
    [apps]
  );

  // Filter apps by collection
  const filteredApps = useMemo(() => {
    if (activeCollection === 'all') return activeApps;
    const collection = collections.find(c => c.id === activeCollection);
    if (!collection) return activeApps;
    return activeApps.filter(app => collection.apps.includes(app.slug));
  }, [activeApps, activeCollection, collections]);

  // Reset windowed view when filter changes
  useEffect(() => {
    setVisibleCount(8);
  }, [activeCollection, filteredApps.length]);

  useEffect(() => {
    const node = loadMoreRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleCount((count) => count + 6);
          }
        });
      },
      { rootMargin: '250px' }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [filteredApps.length]);

  // Get collection for an app
  const getAppCollections = useCallback((slug) => {
    return collections.filter(c => c.apps.includes(slug));
  }, [collections]);

  const handleDemoOpen = useCallback((app) => {
    setDemoApp(app);
  }, []);

  const handleDemoClose = useCallback(() => {
    setDemoApp(null);
  }, []);

  // Check if collections feature is enabled
  const collectionsEnabled = isEnabled('appCollections');
  const demoModalEnabled = isEnabled('demoModal');
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className="apps-showcase-wrapper">
      {/* Collection Tabs */}
      {collectionsEnabled && (
        <div className="collection-tabs">
          <button
            className={`collection-tab ${activeCollection === 'all' ? 'is-active' : ''}`}
            onClick={() => setActiveCollection('all')}
          >
            <span className="collection-tab-icon">🎯</span>
            <span className="collection-tab-name">All Apps</span>
            <span className="collection-tab-count">{activeApps.length}</span>
          </button>

          {collections.map(collection => {
            const count = activeApps.filter(app => collection.apps.includes(app.slug)).length;
            if (count === 0) return null;

            return (
              <button
                key={collection.id}
                className={`collection-tab ${activeCollection === collection.id ? 'is-active' : ''}`}
                onClick={() => setActiveCollection(collection.id)}
                style={{
                  '--collection-color': collection.color,
                  '--collection-bg': collection.bgColor
                }}
              >
                <span className="collection-tab-icon">{collection.icon}</span>
                <span className="collection-tab-name">{collection.name}</span>
                <span className="collection-tab-count">{count}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Active Collection Description */}
      {collectionsEnabled && activeCollection !== 'all' && (
        <motion.div
          className="collection-description"
          initial={prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: -10 }}
        >
          {collections.find(c => c.id === activeCollection)?.description}
        </motion.div>
      )}

      {/* Apps Grid */}
      <div className="app-showcase">
        <AnimatePresence mode="popLayout">
          {filteredApps.slice(0, visibleCount).map((app, index) => {
            const isExternal = app.href?.startsWith('http');
            const appCollections = getAppCollections(app.slug);

            return (
              <motion.div
                key={app.slug}
                className="app-showcase-card"
                layout
                initial={prefersReducedMotion ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={prefersReducedMotion ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }}
                transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.3 }}
                data-app-tilt
              >
                <div
                  className={`app-showcase-row ${index % 2 === 1 ? 'app-showcase-row--reverse' : ''}`}
                  data-app-tilt-target
                >
                  <div className="app-showcase-media">
                    {app.previewImage ? (
                      <img src={app.previewImage} alt={`${app.name} preview`} className="app-preview-image" />
                    ) : (
                      <div className="app-preview-placeholder" style={{
                        background: app.accent
                          ? `linear-gradient(135deg, ${app.accent[0]}, ${app.accent[1] || app.accent[0]})`
                          : 'linear-gradient(135deg, #3b82f6, #8b5cf6)'
                      }}>
                        <span className="app-preview-icon">
                          {app.name.charAt(0)}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="app-showcase-body">
                    {/* Collection badges */}
                    {collectionsEnabled && appCollections.length > 0 && (
                      <div className="app-collection-badges">
                        {appCollections.slice(0, 2).map(col => (
                          <span
                            key={col.id}
                            className="app-collection-badge"
                            style={{ backgroundColor: col.bgColor, color: col.color }}
                          >
                            {col.icon} {col.name.split(' ')[0]}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="app-showcase-header">
                      <span className={`app-showcase-badge app-showcase-badge--${app.status}`}>
                        {app.status === 'beta' ? 'In Beta' : 'Active'}
                      </span>
                    </div>

                    <h2 className="app-showcase-title">{app.name}</h2>
                    <p className="app-showcase-description">{app.description}</p>

                    <div className="app-showcase-tags">
                      {app.stack?.map(tag => (
                        <span key={tag} className="tag">{tag}</span>
                      ))}
                    </div>

                    <div className="app-showcase-actions">
                      <a
                        className="button button--primary"
                        href={app.href}
                        target={isExternal ? '_blank' : undefined}
                        rel={isExternal ? 'noreferrer' : undefined}
                      >
                        Open
                      </a>

                      {demoModalEnabled && app.preview && (
                        <button
                          className="button button--secondary demo-button"
                          onClick={() => handleDemoOpen(app)}
                        >
                          Quick Demo
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                <span className="app-showcase-glare" aria-hidden="true" />
              </motion.div>
            );
          })}
          {visibleCount < filteredApps.length && (
            <div className="app-load-more" ref={loadMoreRef} aria-live="polite">
              Loading more applications…
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Demo Modal */}
      {demoModalEnabled && (
        <AppDemoModal
          app={demoApp}
          isOpen={!!demoApp}
          onClose={handleDemoClose}
        />
      )}

      <style>{`
        .apps-showcase-wrapper {
          width: 100%;
        }

        /* Collection Tabs */
        .collection-tabs {
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem;
          margin-bottom: 2rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid rgba(148, 163, 184, 0.2);
        }

        .collection-tab {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.6rem 1rem;
          background: white;
          border: 1px solid rgba(148, 163, 184, 0.25);
          border-radius: 9999px;
          font-size: 0.85rem;
          font-weight: 500;
          color: var(--secondary-600, #475569);
          cursor: pointer;
          transition: all 0.2s ease;
        }

        [data-theme='dark'] .collection-tab {
          background: var(--secondary-800, #1e293b);
          border-color: rgba(148, 163, 184, 0.2);
          color: var(--secondary-300, #cbd5e1);
        }

        .collection-tab:hover {
          border-color: var(--collection-color, #3b82f6);
          background: var(--collection-bg, rgba(59, 130, 246, 0.05));
        }

        .collection-tab.is-active {
          background: var(--collection-bg, rgba(59, 130, 246, 0.1));
          border-color: var(--collection-color, #3b82f6);
          color: var(--collection-color, #3b82f6);
        }

        .collection-tab-icon {
          font-size: 1rem;
        }

        .collection-tab-count {
          background: rgba(148, 163, 184, 0.2);
          padding: 0.15rem 0.5rem;
          border-radius: 9999px;
          font-size: 0.75rem;
        }

        .collection-tab.is-active .collection-tab-count {
          background: var(--collection-color, #3b82f6);
          color: white;
        }

        /* Collection Description */
        .collection-description {
          font-size: 0.9rem;
          color: var(--secondary-600, #475569);
          margin-bottom: 1.5rem;
          padding: 0.75rem 1rem;
          background: var(--secondary-50, #f8fafc);
          border-radius: 8px;
          border-left: 3px solid var(--collection-color, #3b82f6);
        }

        [data-theme='dark'] .collection-description {
          background: var(--secondary-800, #1e293b);
          color: var(--secondary-400, #94a3b8);
        }

        /* App Cards */
        .app-showcase {
          display: flex;
          flex-direction: column;
          gap: 3.5rem;
        }

        .app-load-more {
          text-align: center;
          padding: 1rem;
          color: var(--secondary-500, #64748b);
        }

        .app-showcase-card {
          --tilt-x: 0deg;
          --tilt-y: 0deg;
          --glare-x: 50%;
          --glare-y: 50%;
          position: relative;
          border-radius: calc(var(--radius-xl, 16px) + 1.25rem);
          padding: clamp(1.4rem, 3vw, 2rem);
          background:
            radial-gradient(circle at 20% 20%, rgba(56, 189, 248, 0.12), transparent 55%),
            radial-gradient(circle at 80% 10%, rgba(16, 185, 129, 0.14), transparent 50%),
            rgba(255, 255, 255, 0.78);
          border: 1px solid rgba(148, 163, 184, 0.22);
          box-shadow: 0 32px 60px rgba(15, 23, 42, 0.18);
          transform: perspective(1200px) rotateX(var(--tilt-y)) rotateY(var(--tilt-x));
          transform-style: preserve-3d;
          transition: transform 180ms ease, box-shadow 220ms ease, border-color 220ms ease;
          will-change: transform;
        }

        [data-theme='dark'] .app-showcase-card {
          background:
            radial-gradient(circle at 20% 20%, rgba(56, 189, 248, 0.08), transparent 55%),
            radial-gradient(circle at 80% 10%, rgba(16, 185, 129, 0.1), transparent 50%),
            rgba(30, 41, 59, 0.9);
        }

        .app-showcase-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 2.5rem;
          align-items: center;
          position: relative;
          z-index: 1;
        }

        .app-showcase-row--reverse {
          direction: rtl;
        }

        .app-showcase-row--reverse > * {
          direction: ltr;
        }

        .app-showcase-glare {
          position: absolute;
          inset: 0;
          border-radius: inherit;
          pointer-events: none;
          background:
            radial-gradient(circle at var(--glare-x) var(--glare-y), rgba(255, 255, 255, 0.55) 0%, rgba(94, 234, 212, 0.25) 35%, rgba(14, 165, 233, 0.12) 55%, transparent 75%);
          opacity: 0;
          transition: opacity 220ms ease;
        }

        /* Media preview */
        .app-showcase-media {
          position: relative;
        }

        .app-preview-image {
          width: 100%;
          height: auto;
          border-radius: 12px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
        }

        .app-preview-placeholder {
          width: 100%;
          aspect-ratio: 16/10;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
        }

        .app-preview-icon {
          font-size: 3rem;
          font-weight: 700;
          color: white;
          text-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        }

        /* Body content */
        .app-showcase-body {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .app-showcase-header {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 0.5rem;
        }

        .app-collection-badges {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-bottom: 0.25rem;
        }

        .app-collection-badge {
          font-size: 0.7rem;
          padding: 0.2rem 0.5rem;
          border-radius: 4px;
          font-weight: 500;
        }

        .app-showcase-badge {
          display: inline-block;
          width: fit-content;
          font-size: 0.7rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding: 0.2rem 0.6rem;
          border-radius: 4px;
        }

        .app-showcase-badge--active {
          background: rgba(16, 185, 129, 0.15);
          color: #059669;
        }

        .app-showcase-badge--beta {
          background: rgba(245, 158, 11, 0.15);
          color: #d97706;
        }

        [data-theme='dark'] .app-showcase-badge--active {
          background: rgba(16, 185, 129, 0.2);
          color: #34d399;
        }

        [data-theme='dark'] .app-showcase-badge--beta {
          background: rgba(245, 158, 11, 0.2);
          color: #fbbf24;
        }

        .app-showcase-title {
          font-size: 1.35rem;
          font-weight: 700;
          color: var(--secondary-900, #0f172a);
          margin: 0;
          line-height: 1.3;
        }

        [data-theme='dark'] .app-showcase-title {
          color: var(--secondary-100, #f1f5f9);
        }

        .app-showcase-description {
          font-size: 0.95rem;
          color: var(--secondary-600, #475569);
          line-height: 1.6;
          margin: 0;
        }

        [data-theme='dark'] .app-showcase-description {
          color: var(--secondary-400, #94a3b8);
        }

        .app-showcase-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .tag {
          font-size: 0.75rem;
          padding: 0.25rem 0.6rem;
          background: var(--secondary-100, #f1f5f9);
          color: var(--secondary-700, #334155);
          border-radius: 4px;
          font-weight: 500;
        }

        [data-theme='dark'] .tag {
          background: var(--secondary-700, #334155);
          color: var(--secondary-300, #cbd5e1);
        }

        .app-showcase-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem;
          margin-top: 0.5rem;
        }

        .button {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.65rem 1.25rem;
          border-radius: 8px;
          font-size: 0.9rem;
          font-weight: 600;
          text-decoration: none;
          border: none;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .button--primary {
          background: linear-gradient(135deg, #3b82f6, #2563eb);
          color: white;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        }

        .button--primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(59, 130, 246, 0.4);
        }

        .button--secondary {
          background: white;
          color: var(--secondary-700, #334155);
          border: 1px solid rgba(148, 163, 184, 0.3);
        }

        [data-theme='dark'] .button--secondary {
          background: var(--secondary-700, #334155);
          color: var(--secondary-200, #e2e8f0);
          border-color: rgba(148, 163, 184, 0.2);
        }

        .button--secondary:hover {
          border-color: var(--primary-400, #60a5fa);
          color: var(--primary-600, #2563eb);
        }

        @media (max-width: 640px) {
          .collection-tabs {
            flex-wrap: nowrap;
            overflow-x: auto;
            padding-bottom: 0.75rem;
            -webkit-overflow-scrolling: touch;
          }

          .collection-tab {
            white-space: nowrap;
          }

          .collection-tab-name {
            display: none;
          }

          .app-showcase-actions {
            flex-direction: column;
          }

          .button {
            width: 100%;
            justify-content: center;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .app-showcase-card {
            transform: none !important;
            transition: none;
          }
        }
      `}</style>
    </div>
  );
}
