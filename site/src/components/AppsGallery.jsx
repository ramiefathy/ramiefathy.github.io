import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { isEnabled } from '../lib/featureFlags.js';

const DEFAULT_ACCENT = ['#0ea5e9', '#8b5cf6'];

function isExternalLink(href) {
  return typeof href === 'string' && href.startsWith('http');
}

function getAccentForApp(app, collections) {
  if (Array.isArray(app?.accent) && app.accent.length > 0) {
    return [app.accent[0], app.accent[1] || app.accent[0]];
  }

  const matchingCollection = collections.find((collection) => collection.apps.includes(app.slug));
  if (matchingCollection?.color) {
    return [matchingCollection.color, matchingCollection.color];
  }

  return DEFAULT_ACCENT;
}

function truncateStack(stack, limit = 3) {
  if (!Array.isArray(stack)) return [];
  return stack.slice(0, limit);
}

export default function AppsGallery({ apps, collections }) {
  const prefersReducedMotion = useReducedMotion();
  const collectionsEnabled = isEnabled('appCollections');

  const activeApps = useMemo(
    () => apps.filter((app) => app.status === 'active' || app.status === 'beta'),
    [apps]
  );

  const [activeCollection, setActiveCollection] = useState('all');
  const filteredApps = useMemo(() => {
    if (activeCollection === 'all') return activeApps;
    const collection = collections.find((entry) => entry.id === activeCollection);
    if (!collection) return activeApps;
    return activeApps.filter((app) => collection.apps.includes(app.slug));
  }, [activeApps, activeCollection, collections]);

  const featuredApps = useMemo(() => filteredApps.filter((app) => app.featured), [filteredApps]);

  const initialSlug = useMemo(() => featuredApps[0]?.slug || filteredApps[0]?.slug || '', [featuredApps, filteredApps]);
  const [selectedSlug, setSelectedSlug] = useState(initialSlug);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const selectedSlugRef = useRef(selectedSlug);
  const selectionLockRef = useRef(0);
  useEffect(() => {
    selectedSlugRef.current = selectedSlug;
  }, [selectedSlug]);

  const activeApp = useMemo(() => {
    if (!filteredApps.length) return null;
    return filteredApps.find((app) => app.slug === selectedSlug) || filteredApps[0];
  }, [filteredApps, selectedSlug]);

  const activeIndex = useMemo(() => {
    if (!activeApp) return 0;
    const index = filteredApps.findIndex((app) => app.slug === activeApp.slug);
    return index === -1 ? 0 : index;
  }, [activeApp, filteredApps]);

  const spotlightRef = useRef(null);
  const railRef = useRef(null);
  const spotlightMediaRef = useRef(null);
  const primaryCtaRef = useRef(null);

  const [spotlightMediaLoaded, setSpotlightMediaLoaded] = useState(true);
  useEffect(() => {
    if (!activeApp) return;
    setDetailsOpen(false);
    setSpotlightMediaLoaded(!activeApp.previewImage);
  }, [activeApp?.slug]);

  // Ensure selected app is valid after filtering changes.
  useEffect(() => {
    if (!filteredApps.length) return;
    const stillPresent = filteredApps.some((app) => app.slug === selectedSlug);
    if (!stillPresent) {
      setSelectedSlug(initialSlug);
    }
  }, [filteredApps, initialSlug, selectedSlug]);

  const scrollToSpotlightIfMobile = useCallback(() => {
    const spotlight = spotlightRef.current;
    if (!spotlight) return;
    if (typeof window === 'undefined') return;
    const isMobile = window.matchMedia('(max-width: 900px)').matches;
    if (!isMobile) return;
    spotlight.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' });
  }, [prefersReducedMotion]);

  const selectApp = useCallback(
    (slug, { scrollSpotlight = false, scrollRailItem = false } = {}) => {
      setSelectedSlug(slug);
      setDetailsOpen(false);
      selectionLockRef.current = Date.now() + 900;

      if (scrollSpotlight) {
        scrollToSpotlightIfMobile();
      }

      if (scrollRailItem && railRef.current) {
        const item = railRef.current.querySelector(`[data-app-slug="${slug}"]`);
        if (item) {
          item.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'nearest' });
        }
      }
    },
    [prefersReducedMotion, scrollToSpotlightIfMobile]
  );

  // Scroll-synced selection: pick the rail item with the highest intersection ratio.
  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;
    const items = Array.from(rail.querySelectorAll('[data-app-rail-item]'));
    if (!items.length) return;

    const ratios = new Map();
    let frame = 0;

    const flush = () => {
      frame = 0;
      if (Date.now() < selectionLockRef.current) return;
      const currentRatio = ratios.get(selectedSlugRef.current);
      if (typeof currentRatio === 'number' && currentRatio >= 0.4) return;
      let bestSlug = null;
      let bestRatio = -1;
      for (const [slug, ratio] of ratios) {
        if (ratio > bestRatio) {
          bestRatio = ratio;
          bestSlug = slug;
        }
      }
      if (bestSlug && bestSlug !== selectedSlugRef.current) {
        setSelectedSlug(bestSlug);
      }
    };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const slug = entry.target.getAttribute('data-app-slug');
          if (!slug) continue;
          if (entry.isIntersecting) {
            ratios.set(slug, entry.intersectionRatio);
          } else {
            ratios.delete(slug);
          }
        }
        if (!frame) frame = requestAnimationFrame(flush);
      },
      {
        threshold: [0.25, 0.4, 0.55, 0.7, 0.85],
        rootMargin: '0px 0px -35% 0px'
      }
    );

    items.forEach((item) => observer.observe(item));

    return () => {
      observer.disconnect();
      if (frame) cancelAnimationFrame(frame);
    };
  }, [filteredApps]);

  // Spotlight media parallax.
  useEffect(() => {
    const el = spotlightMediaRef.current;
    if (!el) return;
    if (prefersReducedMotion) return;

    let frame = 0;
    const handleMove = (event) => {
      if (frame) return;
      const { clientX, clientY } = event;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const rect = el.getBoundingClientRect();
        const dx = (clientX - rect.left) / rect.width - 0.5;
        const dy = (clientY - rect.top) / rect.height - 0.5;
        el.style.setProperty('--parallax-x', `${(dx * 12).toFixed(2)}px`);
        el.style.setProperty('--parallax-y', `${(dy * 10).toFixed(2)}px`);
        el.style.setProperty('--glare-x', `${((dx + 0.5) * 100).toFixed(2)}%`);
        el.style.setProperty('--glare-y', `${((dy + 0.5) * 100).toFixed(2)}%`);
      });
    };

    const reset = () => {
      el.style.setProperty('--parallax-x', '0px');
      el.style.setProperty('--parallax-y', '0px');
      el.style.setProperty('--glare-x', '50%');
      el.style.setProperty('--glare-y', '50%');
    };

    el.addEventListener('pointermove', handleMove);
    el.addEventListener('pointerleave', reset);
    el.addEventListener('pointercancel', reset);
    reset();

    return () => {
      el.removeEventListener('pointermove', handleMove);
      el.removeEventListener('pointerleave', reset);
      el.removeEventListener('pointercancel', reset);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [prefersReducedMotion, activeApp?.slug]);

  // Magnetic primary CTA.
  useEffect(() => {
    const el = primaryCtaRef.current;
    if (!el) return;
    if (prefersReducedMotion) return;

    let frame = 0;
    const handleMove = (event) => {
      if (frame) return;
      const { clientX, clientY } = event;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const rect = el.getBoundingClientRect();
        const dx = (clientX - rect.left) / rect.width - 0.5;
        const dy = (clientY - rect.top) / rect.height - 0.5;
        el.style.setProperty('--magnet-x', `${(dx * 10).toFixed(2)}px`);
        el.style.setProperty('--magnet-y', `${(dy * 8).toFixed(2)}px`);
      });
    };

    const reset = () => {
      el.style.setProperty('--magnet-x', '0px');
      el.style.setProperty('--magnet-y', '0px');
    };

    el.addEventListener('pointermove', handleMove);
    el.addEventListener('pointerleave', reset);
    el.addEventListener('pointercancel', reset);
    reset();

    return () => {
      el.removeEventListener('pointermove', handleMove);
      el.removeEventListener('pointerleave', reset);
      el.removeEventListener('pointercancel', reset);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [prefersReducedMotion, activeApp?.slug]);

  const handleKeyDown = useCallback(
    (event) => {
      if (!activeApp || filteredApps.length === 0) return;
      if (event.defaultPrevented) return;

      const isDirectTarget = event.currentTarget === event.target;

      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        if (!isDirectTarget) return;
        event.preventDefault();
        const direction = event.key === 'ArrowDown' ? 1 : -1;
        const nextIndex = (activeIndex + direction + filteredApps.length) % filteredApps.length;
        selectApp(filteredApps[nextIndex].slug, { scrollRailItem: true });
        return;
      }

      if (event.key === 'Escape') {
        if (detailsOpen) {
          event.preventDefault();
          setDetailsOpen(false);
        }
        return;
      }

      if (event.key === 'Enter') {
        if (!isDirectTarget) return;
        event.preventDefault();
        if (!activeApp.href) return;
        if (isExternalLink(activeApp.href)) {
          window.open(activeApp.href, '_blank', 'noopener,noreferrer');
          return;
        }
        window.location.assign(activeApp.href);
      }
    },
    [activeApp, activeIndex, detailsOpen, filteredApps, selectApp]
  );

  const accent = activeApp ? getAccentForApp(activeApp, collections) : DEFAULT_ACCENT;
  const accentA = accent[0] || DEFAULT_ACCENT[0];
  const accentB = accent[1] || accentA;

  const spotlightAtmosphere = useMemo(() => {
    return {
      background: [
        `radial-gradient(circle at 18% 22%, ${accentA}33, transparent 55%)`,
        `radial-gradient(circle at 86% 30%, ${accentB}2b, transparent 58%)`,
        'linear-gradient(180deg, rgba(15, 23, 42, 0.04), rgba(15, 23, 42, 0))'
      ].join(',')
    };
  }, [accentA, accentB]);

  if (!activeApp) {
    return null;
  }

  const activeCollections = collections.filter((collection) => collection.apps.includes(activeApp.slug));
  const spotlightIsExternal = isExternalLink(activeApp.href);

  return (
    <section
      className="apps-gallery"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      style={{
        '--gallery-accent-1': accentA,
        '--gallery-accent-2': accentB
      }}
      aria-label="Applications gallery"
    >
      {collectionsEnabled && (
        <div className="collection-tabs" aria-label="App collections">
          <button
            className={`collection-tab ${activeCollection === 'all' ? 'is-active' : ''}`}
            onClick={() => setActiveCollection('all')}
            type="button"
          >
            <span className="collection-tab-icon" aria-hidden="true">◆</span>
            <span className="collection-tab-name">All Apps</span>
            <span className="collection-tab-count">{activeApps.length}</span>
          </button>

          {collections.map((collection) => {
            const count = activeApps.filter((app) => collection.apps.includes(app.slug)).length;
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
                type="button"
              >
                <span className="collection-tab-icon" aria-hidden="true">{collection.icon}</span>
                <span className="collection-tab-name">{collection.name}</span>
                <span className="collection-tab-count">{count}</span>
              </button>
            );
          })}
        </div>
      )}

      <div className="apps-gallery-layout">
        <div className="apps-gallery-spotlight" ref={spotlightRef}>
          <div className="apps-gallery-atmosphere" aria-hidden="true">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeApp.slug}
                className="apps-gallery-atmosphere__layer"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.55, ease: 'easeOut' }}
                style={spotlightAtmosphere}
              />
            </AnimatePresence>
          </div>

          <motion.article
            className="apps-gallery-spotlight-card"
            layout
            transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="apps-gallery-spotlight-media" ref={spotlightMediaRef}>
              <div className={`apps-gallery-spotlight-frame ${spotlightMediaLoaded ? '' : 'is-loading'}`}>
                <div className="apps-gallery-spotlight-frame__bar" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </div>

                <motion.div className="apps-gallery-spotlight-frame__media" layoutId={`app-media-${activeApp.slug}`}>
                  {activeApp.previewImage ? (
                    <img
                      src={activeApp.previewImage}
                      alt={`${activeApp.name} preview`}
                      onLoad={() => setSpotlightMediaLoaded(true)}
                      className="apps-gallery-preview-image"
                    />
                  ) : (
                    <div className="apps-gallery-preview-placeholder" aria-hidden="true">
                      <span>{activeApp.name.slice(0, 1)}</span>
                    </div>
                  )}
                </motion.div>

                <div className="apps-gallery-spotlight-glow" aria-hidden="true" />
                <div className="apps-gallery-spotlight-glare" aria-hidden="true" />
                {!spotlightMediaLoaded && <div className="apps-gallery-preview-skeleton" aria-hidden="true" />}
              </div>
            </div>

            <div className="apps-gallery-spotlight-body">
              <div className="apps-gallery-spotlight-meta">
                <span className={`app-status app-status--${activeApp.status}`}>
                  {activeApp.featured ? 'Featured' : activeApp.status === 'beta' ? 'In Beta' : 'Active'}
                </span>
                <span className="apps-gallery-spotlight-shortcut" aria-hidden="true">↑ / ↓ to browse</span>
              </div>

              <motion.h2 className="apps-gallery-spotlight-title" layoutId={`app-title-${activeApp.slug}`}>
                {activeApp.name}
              </motion.h2>
              <p className="apps-gallery-spotlight-description">{activeApp.description}</p>

              <div className="apps-gallery-spotlight-tags" aria-label="Tech stack">
                {activeApp.stack?.map((tag) => (
                  <span key={tag} className="tag">{tag}</span>
                ))}
              </div>

              <div className="apps-gallery-spotlight-actions">
                <a
                  className="button button--primary spotlight-primary-cta"
                  href={activeApp.href}
                  target={spotlightIsExternal ? '_blank' : undefined}
                  rel={spotlightIsExternal ? 'noreferrer' : undefined}
                  ref={primaryCtaRef}
                >
                  Visit the App
                </a>
                <button
                  className="button button--secondary spotlight-details-cta"
                  type="button"
                  onClick={() => setDetailsOpen((open) => !open)}
                  aria-expanded={detailsOpen}
                >
                  Details
                </button>
              </div>

              <AnimatePresence>
                {detailsOpen && (
                  <motion.div
                    className="apps-gallery-spotlight-details"
                    initial={prefersReducedMotion ? { opacity: 1, height: 'auto' } : { opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={prefersReducedMotion ? { opacity: 1, height: 'auto' } : { opacity: 0, height: 0 }}
                    transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.35, ease: 'easeOut' }}
                  >
                    {activeCollections.length > 0 && (
                      <div className="apps-gallery-detail-row">
                        <p className="apps-gallery-detail-label">Collections</p>
                        <div className="apps-gallery-detail-chips">
                          {activeCollections.map((collection) => (
                            <span
                              key={collection.id}
                              className="apps-gallery-detail-chip"
                              style={{ borderColor: `${collection.color}55` }}
                            >
                              <span aria-hidden="true">{collection.icon}</span> {collection.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="apps-gallery-detail-row">
                      <p className="apps-gallery-detail-label">Primary stack</p>
                      <p className="apps-gallery-detail-value">{truncateStack(activeApp.stack, 5).join(' · ') || '—'}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.article>
        </div>

        <div className="apps-gallery-rail" ref={railRef}>
          <div className="apps-gallery-rail-head">
            <p className="apps-gallery-rail-title">Catalog</p>
            <p className="apps-gallery-rail-subtitle">Click any app to preview. Press Enter to open.</p>
          </div>

          <nav className="apps-gallery-progress" aria-label="Catalog progress">
            {filteredApps.map((app, index) => (
              <button
                key={app.slug}
                type="button"
                className={`apps-gallery-progress-dot ${app.slug === activeApp.slug ? 'is-active' : ''}`}
                aria-label={`Select ${app.name}`}
                aria-current={app.slug === activeApp.slug ? 'true' : undefined}
                onClick={() => selectApp(app.slug, { scrollSpotlight: true, scrollRailItem: true })}
              >
                <span className="sr-only">{index + 1}</span>
              </button>
            ))}
          </nav>

          <div className="apps-gallery-list" role="list">
            {filteredApps.map((app) => {
              const isActive = app.slug === activeApp.slug;
              const accentPair = getAccentForApp(app, collections);
              const isItemExternal = isExternalLink(app.href);
              return (
                <motion.button
                  key={app.slug}
                  className={`app-showcase-card apps-gallery-card ${isActive ? 'is-active' : ''}`}
                  type="button"
                  onClick={() => selectApp(app.slug, { scrollSpotlight: true })}
                  data-app-rail-item
                  data-app-slug={app.slug}
                  aria-current={isActive ? 'true' : undefined}
                  whileHover={prefersReducedMotion ? undefined : { y: -4 }}
                  whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
                >
                  <motion.div className="apps-gallery-card-media" layoutId={`app-media-${app.slug}`}>
                    {app.previewImage ? (
                      <img
                        src={app.previewImage}
                        alt=""
                        className="apps-gallery-card-thumb"
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <div
                        className="apps-gallery-card-thumb-placeholder"
                        aria-hidden="true"
                        style={{
                          background: `linear-gradient(135deg, ${accentPair[0]}, ${accentPair[1] || accentPair[0]})`
                        }}
                      >
                        <span>{app.name.slice(0, 1)}</span>
                      </div>
                    )}
                  </motion.div>

                  <div className="apps-gallery-card-body">
                    <div className="apps-gallery-card-meta">
                      <span className={`app-status app-status--${app.status}`}>
                        {app.featured ? 'Featured' : app.status === 'beta' ? 'Beta' : 'Active'}
                      </span>
                      {isItemExternal && <span className="apps-gallery-card-external" aria-hidden="true">↗</span>}
                    </div>

                    <motion.h3 className="apps-gallery-card-title" layoutId={`app-title-${app.slug}`}>
                      {app.name}
                    </motion.h3>
                    <p className="apps-gallery-card-description">{app.description}</p>

                    <div className="apps-gallery-card-tags" aria-label={`${app.name} tech stack`}>
                      {truncateStack(app.stack, 3).map((tag) => (
                        <span key={tag} className="tag tag--muted">{tag}</span>
                      ))}
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>

      <style>{`
        .apps-gallery {
          --gallery-accent-1: ${DEFAULT_ACCENT[0]};
          --gallery-accent-2: ${DEFAULT_ACCENT[1]};
          outline: none;
        }

        .apps-gallery-layout {
          display: grid;
          grid-template-columns: minmax(280px, 420px) minmax(0, 1fr);
          grid-template-areas: 'rail spotlight';
          gap: clamp(1.5rem, 3vw, 2.75rem);
          align-items: start;
        }

        .apps-gallery-spotlight {
          grid-area: spotlight;
          position: sticky;
          top: 6rem;
          align-self: start;
        }

        .apps-gallery-rail {
          grid-area: rail;
        }

        @media (max-width: 900px) {
          .apps-gallery-layout {
            grid-template-columns: 1fr;
            grid-template-areas:
              'spotlight'
              'rail';
          }

          .apps-gallery-spotlight {
            position: relative;
            top: auto;
          }
        }

        .apps-gallery-atmosphere {
          position: absolute;
          inset: -1.5rem;
          border-radius: 28px;
          overflow: hidden;
          pointer-events: none;
          filter: blur(0px);
        }

        .apps-gallery-atmosphere__layer {
          position: absolute;
          inset: 0;
        }

        .apps-gallery-spotlight-card {
          position: relative;
          overflow: hidden;
          border-radius: 26px;
          background: rgba(255, 255, 255, 0.92);
          border: 1px solid rgba(148, 163, 184, 0.25);
          box-shadow: 0 40px 80px rgba(15, 23, 42, 0.15);
          backdrop-filter: blur(20px);
          display: grid;
          grid-template-rows: auto 1fr;
        }

        [data-theme='dark'] .apps-gallery-spotlight-card {
          background: rgba(15, 23, 42, 0.78);
          border-color: rgba(148, 163, 184, 0.18);
          box-shadow: 0 50px 90px rgba(0, 0, 0, 0.45);
        }

        .apps-gallery-spotlight-media {
          padding: 1.25rem 1.25rem 0.75rem;
        }

        .apps-gallery-spotlight-frame {
          position: relative;
          border-radius: 20px;
          overflow: hidden;
          border: 1px solid rgba(148, 163, 184, 0.25);
          background: linear-gradient(135deg, rgba(15, 23, 42, 0.06), rgba(15, 23, 42, 0));
          transform: translate3d(var(--parallax-x, 0px), var(--parallax-y, 0px), 0);
          transition: transform 180ms ease;
        }

        .apps-gallery-spotlight-frame__bar {
          display: flex;
          gap: 0.35rem;
          padding: 0.65rem 0.8rem;
          background: rgba(15, 23, 42, 0.06);
          border-bottom: 1px solid rgba(148, 163, 184, 0.18);
        }

        [data-theme='dark'] .apps-gallery-spotlight-frame__bar {
          background: rgba(15, 23, 42, 0.55);
          border-bottom-color: rgba(148, 163, 184, 0.2);
        }

        .apps-gallery-spotlight-frame__bar span {
          width: 10px;
          height: 10px;
          border-radius: 999px;
          background: rgba(148, 163, 184, 0.5);
        }

        .apps-gallery-spotlight-frame__media {
          position: relative;
          min-height: 220px;
          display: grid;
          place-items: center;
          padding: 1.35rem;
        }

        .apps-gallery-preview-image {
          width: 100%;
          height: auto;
          border-radius: 16px;
          object-fit: cover;
          box-shadow: 0 25px 50px rgba(15, 23, 42, 0.12);
          transform: translate3d(calc(var(--parallax-x, 0px) * -0.4), calc(var(--parallax-y, 0px) * -0.4), 0);
          transition: transform 180ms ease;
        }

        .apps-gallery-preview-placeholder {
          width: 100%;
          height: 100%;
          min-height: 240px;
          border-radius: 18px;
          display: grid;
          place-items: center;
          font-family: var(--font-display);
          font-size: clamp(2.25rem, 4vw, 3rem);
          letter-spacing: 0.06em;
          color: rgba(15, 23, 42, 0.75);
          background: linear-gradient(135deg, var(--gallery-accent-1), var(--gallery-accent-2));
        }

        [data-theme='dark'] .apps-gallery-preview-placeholder {
          color: rgba(255, 255, 255, 0.92);
        }

        .apps-gallery-spotlight-glow {
          position: absolute;
          inset: -40%;
          background: radial-gradient(circle at 30% 20%, var(--gallery-accent-1), transparent 60%),
            radial-gradient(circle at 78% 25%, var(--gallery-accent-2), transparent 62%);
          opacity: 0.2;
          filter: blur(40px);
          pointer-events: none;
          transform: translate3d(calc(var(--parallax-x, 0px) * 0.6), calc(var(--parallax-y, 0px) * 0.6), 0);
        }

        .apps-gallery-spotlight-glare {
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at var(--glare-x, 50%) var(--glare-y, 50%), rgba(255, 255, 255, 0.55), transparent 55%);
          opacity: 0;
          transition: opacity 200ms ease;
          pointer-events: none;
          mix-blend-mode: screen;
        }

        .apps-gallery-spotlight-frame:hover .apps-gallery-spotlight-glare {
          opacity: 0.75;
        }

        .apps-gallery-preview-skeleton {
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, rgba(148, 163, 184, 0.05), rgba(148, 163, 184, 0.22), rgba(148, 163, 184, 0.05));
          background-size: 220% 100%;
          animation: gallery-shimmer 1.3s linear infinite;
        }

        @keyframes gallery-shimmer {
          0% { background-position: 0% 0; }
          100% { background-position: 200% 0; }
        }

        .apps-gallery-spotlight-body {
          padding: 0.25rem 1.4rem 1.5rem;
        }

        .apps-gallery-spotlight-meta {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.75rem;
          margin-bottom: 0.75rem;
        }

        .apps-gallery-spotlight-shortcut {
          font-size: 0.78rem;
          color: rgba(100, 116, 139, 0.75);
        }

        [data-theme='dark'] .apps-gallery-spotlight-shortcut {
          color: rgba(203, 213, 225, 0.65);
        }

        .apps-gallery-spotlight-title {
          margin: 0 0 0.65rem;
          font-family: var(--font-display);
          font-size: clamp(1.6rem, 2.4vw, 2.15rem);
          color: var(--text-color);
          letter-spacing: 0.01em;
        }

        .apps-gallery-spotlight-description {
          margin: 0 0 1.2rem;
          color: var(--muted-text);
          line-height: 1.65;
        }

        .apps-gallery-spotlight-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 0.55rem;
          margin-bottom: 1.35rem;
        }

        .apps-gallery-spotlight-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 0.85rem;
          align-items: center;
        }

        .spotlight-primary-cta {
          --magnet-x: 0px;
          --magnet-y: 0px;
          transform: translate3d(var(--magnet-x), var(--magnet-y), 0);
        }

        .spotlight-primary-cta.button:hover {
          transform: translate3d(var(--magnet-x), calc(var(--magnet-y) - 2px), 0);
        }

        .apps-gallery-spotlight-details {
          margin-top: 1.1rem;
          overflow: hidden;
          border-radius: 16px;
          border: 1px solid rgba(148, 163, 184, 0.22);
          background: rgba(241, 245, 249, 0.6);
          padding: 1rem 1.1rem;
          display: grid;
          gap: 0.9rem;
        }

        [data-theme='dark'] .apps-gallery-spotlight-details {
          background: rgba(15, 23, 42, 0.4);
          border-color: rgba(148, 163, 184, 0.18);
        }

        .apps-gallery-detail-row {
          display: grid;
          gap: 0.55rem;
        }

        .apps-gallery-detail-label {
          margin: 0;
          font-size: 0.78rem;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: rgba(56, 189, 248, 0.9);
        }

        .apps-gallery-detail-value {
          margin: 0;
          color: var(--muted-text);
          line-height: 1.5;
        }

        .apps-gallery-detail-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 0.55rem;
        }

        .apps-gallery-detail-chip {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          padding: 0.45rem 0.65rem;
          border-radius: 999px;
          border: 1px solid rgba(148, 163, 184, 0.24);
          background: rgba(255, 255, 255, 0.85);
          font-size: 0.85rem;
          color: rgba(15, 23, 42, 0.75);
        }

        [data-theme='dark'] .apps-gallery-detail-chip {
          background: rgba(15, 23, 42, 0.6);
          color: rgba(226, 232, 240, 0.8);
        }

        .apps-gallery-rail {
          display: flex;
          flex-direction: column;
          gap: 1.35rem;
          min-width: 0;
        }

        .apps-gallery-rail-head {
          display: grid;
          gap: 0.35rem;
          padding: 0.25rem 0.25rem 0;
        }

        .apps-gallery-rail-title {
          margin: 0;
          font-size: 0.8rem;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          font-weight: 800;
          color: rgba(56, 189, 248, 0.85);
        }

        .apps-gallery-rail-subtitle {
          margin: 0;
          color: var(--muted-text);
          font-size: 0.95rem;
        }

        .apps-gallery-progress {
          display: flex;
          flex-wrap: wrap;
          gap: 0.55rem;
          padding: 0.4rem 0.25rem;
        }

        .apps-gallery-progress-dot {
          width: 12px;
          height: 12px;
          border-radius: 999px;
          border: 1px solid rgba(148, 163, 184, 0.55);
          background: rgba(148, 163, 184, 0.15);
          cursor: pointer;
          transition: transform 160ms ease, background 160ms ease, border-color 160ms ease;
        }

        .apps-gallery-progress-dot:hover {
          transform: scale(1.2);
          border-color: var(--gallery-accent-1);
        }

        .apps-gallery-progress-dot.is-active {
          background: linear-gradient(135deg, var(--gallery-accent-1), var(--gallery-accent-2));
          border-color: transparent;
          transform: scale(1.2);
        }

        .apps-gallery-list {
          display: grid;
          gap: 1rem;
        }

        .apps-gallery-card {
          text-align: left;
          padding: 1.1rem;
          border-radius: 18px;
          border: 1px solid rgba(148, 163, 184, 0.22);
          background: rgba(255, 255, 255, 0.85);
          box-shadow: 0 18px 40px rgba(15, 23, 42, 0.07);
          display: grid;
          grid-template-columns: 78px minmax(0, 1fr);
          gap: 1rem;
          cursor: pointer;
          transition: border-color 160ms ease, box-shadow 160ms ease, background 160ms ease;
        }

        [data-theme='dark'] .apps-gallery-card {
          background: rgba(15, 23, 42, 0.6);
          border-color: rgba(148, 163, 184, 0.18);
          box-shadow: 0 20px 45px rgba(0, 0, 0, 0.35);
        }

        .apps-gallery-card:hover {
          border-color: rgba(56, 189, 248, 0.5);
          box-shadow: 0 30px 65px rgba(15, 23, 42, 0.12);
        }

        .apps-gallery-card.is-active {
          border-color: var(--gallery-accent-1);
          box-shadow: 0 35px 70px rgba(15, 23, 42, 0.16);
          background: linear-gradient(180deg, rgba(56, 189, 248, 0.06), rgba(255, 255, 255, 0.9));
        }

        [data-theme='dark'] .apps-gallery-card.is-active {
          background: linear-gradient(180deg, rgba(56, 189, 248, 0.12), rgba(15, 23, 42, 0.72));
        }

        .apps-gallery-card-media {
          width: 78px;
          height: 78px;
          border-radius: 16px;
          overflow: hidden;
          border: 1px solid rgba(148, 163, 184, 0.25);
          background: rgba(15, 23, 42, 0.06);
        }

        .apps-gallery-card-thumb,
        .apps-gallery-card-thumb-placeholder {
          width: 100%;
          height: 100%;
          display: grid;
          place-items: center;
          object-fit: cover;
        }

        .apps-gallery-card-thumb-placeholder span {
          font-family: var(--font-display);
          font-size: 1.4rem;
          color: rgba(255, 255, 255, 0.9);
        }

        .apps-gallery-card-body {
          min-width: 0;
          display: grid;
          gap: 0.45rem;
        }

        .apps-gallery-card-meta {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.5rem;
        }

        .apps-gallery-card-external {
          color: rgba(100, 116, 139, 0.8);
          font-size: 0.85rem;
        }

        [data-theme='dark'] .apps-gallery-card-external {
          color: rgba(203, 213, 225, 0.7);
        }

        .apps-gallery-card-title {
          margin: 0;
          font-family: var(--font-display);
          font-size: 1.05rem;
          color: var(--text-color);
          line-height: 1.25;
        }

        .apps-gallery-card-description {
          margin: 0;
          color: var(--muted-text);
          line-height: 1.45;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .apps-gallery-card-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-top: 0.35rem;
        }

        .app-status {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          padding: 0.35rem 0.65rem;
          border-radius: 999px;
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: rgba(15, 23, 42, 0.78);
          background: rgba(226, 232, 240, 0.9);
          border: 1px solid rgba(148, 163, 184, 0.2);
        }

        [data-theme='dark'] .app-status {
          background: rgba(15, 23, 42, 0.5);
          color: rgba(226, 232, 240, 0.8);
          border-color: rgba(148, 163, 184, 0.18);
        }

        .app-status--beta {
          background: rgba(251, 191, 36, 0.16);
          border-color: rgba(251, 191, 36, 0.35);
          color: rgba(161, 98, 7, 0.92);
        }

        [data-theme='dark'] .app-status--beta {
          color: rgba(253, 230, 138, 0.9);
          background: rgba(251, 191, 36, 0.14);
        }

        @media (prefers-reduced-motion: reduce) {
          .apps-gallery-preview-skeleton {
            animation: none;
          }

          .apps-gallery-spotlight-frame {
            transition: none;
            transform: none;
          }

          .apps-gallery-preview-image {
            transition: none;
            transform: none;
          }

          .apps-gallery-progress-dot,
          .apps-gallery-card {
            transition: none;
          }
        }
      `}</style>
    </section>
  );
}
