import { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';

/**
 * Easing function for smooth count-up animation
 */
function easeOutExpo(t) {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

/**
 * Animated counter that counts up from 0 to target value
 */
function AnimatedNumber({ value, suffix = '', duration = 2000 }) {
  const [displayValue, setDisplayValue] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = (event) => setPrefersReducedMotion(event.matches);
    setPrefersReducedMotion(media.matches);
    media.addEventListener('change', handleChange);
    return () => media.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    if (!isInView || hasAnimated) return;

    if (prefersReducedMotion) {
      setDisplayValue(value);
      setHasAnimated(true);
      return;
    }

    setHasAnimated(true);
    const startTime = performance.now();

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutExpo(progress);

      setDisplayValue(Math.round(easedProgress * value));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [isInView, value, duration, hasAnimated, prefersReducedMotion]);

  return (
    <span ref={ref} className="stats-number" aria-live="polite">
      {displayValue.toLocaleString()}{suffix}
    </span>
  );
}

/**
 * Stats Counter Component
 *
 * Displays animated statistics with count-up effect on scroll into view.
 * Feature-flagged via 'statsCounter' flag.
 */
export default function StatsCounter({ stats }) {
  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { once: true, margin: '-100px' });

  if (!stats?.metrics?.length) {
    return null;
  }

  return (
    <section className="stats-section" aria-label="Statistics">
      <div ref={containerRef} className="stats-container">
        {stats.metrics.map((metric, index) => (
          <motion.div
            key={metric.id}
            className="stats-card"
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{
              duration: 0.6,
              delay: index * 0.1,
              ease: 'easeOut'
            }}
          >
            <div className="stats-value">
              <AnimatedNumber
                value={metric.value}
                suffix={metric.suffix}
                duration={2000 + index * 200}
              />
            </div>
            <div className="stats-label">{metric.label}</div>
            {metric.description && (
              <div className="stats-description">{metric.description}</div>
            )}
          </motion.div>
        ))}
      </div>
      {stats.lastUpdated && (
        <p className="stats-updated">
          Last updated: {new Date(stats.lastUpdated).toLocaleDateString('en-US', {
            month: 'long',
            year: 'numeric'
          })}
        </p>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .stats-section {
          padding: 3rem 1.5rem;
          background: linear-gradient(180deg, rgba(239, 246, 255, 0.6), rgba(255, 255, 255, 0.9));
        }

        [data-theme='dark'] .stats-section {
          background: linear-gradient(180deg, rgba(15, 23, 42, 0.8), rgba(30, 41, 59, 0.9));
        }

        .stats-container {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.5rem;
          max-width: 900px;
          margin: 0 auto;
        }

        @media (min-width: 768px) {
          .stats-container {
            grid-template-columns: repeat(4, 1fr);
            gap: 2rem;
          }
        }

        .stats-card {
          text-align: center;
          padding: 1.5rem 1rem;
          background: white;
          border-radius: var(--radius-lg, 12px);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
          border: 1px solid rgba(148, 163, 184, 0.15);
        }

        [data-theme='dark'] .stats-card {
          background: rgba(30, 41, 59, 0.8);
          border-color: rgba(148, 163, 184, 0.2);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        }

        .stats-value {
          margin-bottom: 0.5rem;
        }

        .stats-number {
          font-size: clamp(2rem, 5vw, 3rem);
          font-weight: 700;
          background: linear-gradient(135deg, var(--primary-600, #2563eb), var(--primary-400, #60a5fa));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          line-height: 1.1;
        }

        [data-theme='dark'] .stats-number {
          background: linear-gradient(135deg, var(--primary-400, #60a5fa), var(--primary-300, #93c5fd));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .stats-label {
          font-size: 1rem;
          font-weight: 600;
          color: var(--secondary-800, #1e293b);
          margin-bottom: 0.25rem;
        }

        [data-theme='dark'] .stats-label {
          color: var(--secondary-200, #e2e8f0);
        }

        .stats-description {
          font-size: 0.75rem;
          color: var(--secondary-500, #64748b);
          line-height: 1.4;
        }

        [data-theme='dark'] .stats-description {
          color: var(--secondary-400, #94a3b8);
        }

        .stats-updated {
          text-align: center;
          margin-top: 1.5rem;
          font-size: 0.75rem;
          color: var(--secondary-400, #94a3b8);
        }

        @media (prefers-reduced-motion: reduce) {
          .stats-number {
            transition: none;
          }
        }
      ` }} />
    </section>
  );
}
