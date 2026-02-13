import { useState, useRef, useEffect } from 'react';
import { motion, useInView, AnimatePresence, useReducedMotion } from 'framer-motion';

/**
 * Interactive Career Timeline Component
 *
 * Displays career milestones in a responsive timeline layout.
 * - Horizontal scrollable on mobile
 * - Vertical on desktop
 * - Interactive nodes with expand-on-click details
 */
export default function Timeline({ data }) {
  const [selectedId, setSelectedId] = useState(null);
  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { once: true, margin: '-50px' });
  const prefersReducedMotion = useReducedMotion();

  if (!data?.milestones?.length) {
    return null;
  }

  const { milestones, typeConfig } = data;

  // Sort milestones by year
  const sortedMilestones = [...milestones].sort((a, b) => a.year - b.year);

  const handleSelect = (id) => {
    setSelectedId(selectedId === id ? null : id);
  };

  return (
    <section className="timeline-section" aria-label="Career Timeline">
      <div ref={containerRef} className="timeline-container">
        {/* Timeline track */}
        <div className="timeline-track" aria-hidden="true" />

        {/* Milestones */}
        <div className="timeline-milestones">
          {sortedMilestones.map((milestone, index) => {
            const config = typeConfig?.[milestone.type] || {
              color: '#64748b',
              bgColor: 'rgba(100, 116, 139, 0.1)',
              icon: '📍'
            };
            const isSelected = selectedId === milestone.id;
            const yearLabel = milestone.endYear
              ? `${milestone.year}–${milestone.endYear}`
              : milestone.year.toString();

            return (
              <motion.article
                key={milestone.id}
                className={`timeline-item ${isSelected ? 'is-selected' : ''}`}
                initial={prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.5, delay: index * 0.1 }}
              >
                {/* Year marker */}
                <div className="timeline-year">
                  <span>{yearLabel}</span>
                </div>

                {/* Node */}
                <button
                  className="timeline-node"
                  onClick={() => handleSelect(milestone.id)}
                  aria-expanded={isSelected}
                  aria-controls={`timeline-details-${milestone.id}`}
                  style={{
                    backgroundColor: config.color,
                    boxShadow: isSelected ? `0 0 0 4px ${config.bgColor}` : undefined
                  }}
                >
                  <span className="timeline-icon" aria-hidden="true">{config.icon}</span>
                </button>

                {/* Card */}
                <div
                  className="timeline-card"
                  style={{ borderLeftColor: config.color }}
                >
                  <div className="timeline-card-header">
                    <span
                      className="timeline-type"
                      style={{ color: config.color, backgroundColor: config.bgColor }}
                    >
                      {milestone.type}
                    </span>
                    <h3 className="timeline-title">{milestone.title}</h3>
                    <p className="timeline-subtitle">{milestone.subtitle}</p>
                  </div>

                  {/* Expanded details */}
                  <AnimatePresence>
                    {isSelected && (
                      <motion.div
                        id={`timeline-details-${milestone.id}`}
                        className="timeline-details"
                        initial={prefersReducedMotion ? { opacity: 1, height: 'auto' } : { opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={prefersReducedMotion ? { opacity: 1, height: 'auto' } : { opacity: 0, height: 0 }}
                        transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.3 }}
                      >
                        <p className="timeline-description">{milestone.description}</p>
                        {milestone.highlights?.length > 0 && (
                          <div className="timeline-highlights">
                            {milestone.highlights.map((highlight, i) => (
                              <span key={i} className="timeline-highlight">
                                {highlight}
                              </span>
                            ))}
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Click hint */}
                  <button
                    className="timeline-expand-hint"
                    onClick={() => handleSelect(milestone.id)}
                    aria-hidden="true"
                    tabIndex={-1}
                  >
                    {isSelected ? 'Show less' : 'Learn more'}
                  </button>
                </div>
              </motion.article>
            );
          })}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .timeline-section {
          padding: 2rem 1rem;
        }

        .timeline-container {
          position: relative;
          max-width: 800px;
          margin: 0 auto;
        }

        /* Vertical timeline track */
        .timeline-track {
          position: absolute;
          left: 50%;
          top: 0;
          bottom: 0;
          width: 3px;
          background: linear-gradient(
            to bottom,
            var(--primary-200, #bfdbfe),
            var(--primary-400, #60a5fa),
            var(--primary-200, #bfdbfe)
          );
          transform: translateX(-50%);
          border-radius: 2px;
        }

        .timeline-milestones {
          display: flex;
          flex-direction: column;
          gap: 2rem;
          position: relative;
          z-index: 1;
        }

        .timeline-item {
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          align-items: start;
          gap: 1rem;
        }

        .timeline-item:nth-child(even) {
          direction: rtl;
        }

        .timeline-item:nth-child(even) > * {
          direction: ltr;
        }

        /* Year label */
        .timeline-year {
          text-align: right;
          padding-top: 0.5rem;
        }

        .timeline-item:nth-child(even) .timeline-year {
          text-align: left;
        }

        .timeline-year span {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--secondary-500, #64748b);
          background: var(--secondary-100, #f1f5f9);
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
        }

        [data-theme='dark'] .timeline-year span {
          background: var(--secondary-800, #1e293b);
          color: var(--secondary-400, #94a3b8);
        }

        /* Node button */
        .timeline-node {
          width: 2.5rem;
          height: 2.5rem;
          border-radius: 50%;
          border: 3px solid white;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
          position: relative;
          z-index: 2;
        }

        [data-theme='dark'] .timeline-node {
          border-color: var(--secondary-900, #0f172a);
        }

        .timeline-node:hover {
          transform: scale(1.1);
        }

        .timeline-node:focus {
          outline: none;
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.3);
        }

        .timeline-icon {
          font-size: 1rem;
        }

        /* Card */
        .timeline-card {
          background: white;
          border-radius: var(--radius-lg, 12px);
          padding: 1rem 1.25rem;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
          border: 1px solid rgba(148, 163, 184, 0.15);
          border-left: 4px solid;
          max-width: 320px;
          transition: all 0.2s ease;
        }

        [data-theme='dark'] .timeline-card {
          background: var(--secondary-800, #1e293b);
          border-color: rgba(148, 163, 184, 0.2);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }

        .timeline-item.is-selected .timeline-card {
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
        }

        .timeline-card-header {
          margin-bottom: 0.5rem;
        }

        .timeline-type {
          display: inline-block;
          font-size: 0.65rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding: 0.15rem 0.4rem;
          border-radius: 3px;
          margin-bottom: 0.5rem;
        }

        .timeline-title {
          font-size: 1rem;
          font-weight: 700;
          color: var(--secondary-900, #0f172a);
          margin: 0 0 0.25rem 0;
        }

        [data-theme='dark'] .timeline-title {
          color: var(--secondary-100, #f1f5f9);
        }

        .timeline-subtitle {
          font-size: 0.85rem;
          color: var(--secondary-600, #475569);
          margin: 0;
        }

        [data-theme='dark'] .timeline-subtitle {
          color: var(--secondary-400, #94a3b8);
        }

        /* Expanded details */
        .timeline-details {
          overflow: hidden;
          margin-top: 0.75rem;
          padding-top: 0.75rem;
          border-top: 1px solid rgba(148, 163, 184, 0.2);
        }

        .timeline-description {
          font-size: 0.85rem;
          color: var(--secondary-600, #475569);
          margin: 0 0 0.75rem 0;
          line-height: 1.5;
        }

        [data-theme='dark'] .timeline-description {
          color: var(--secondary-400, #94a3b8);
        }

        .timeline-highlights {
          display: flex;
          flex-wrap: wrap;
          gap: 0.35rem;
        }

        .timeline-highlight {
          font-size: 0.7rem;
          background: var(--primary-50, #eff6ff);
          color: var(--primary-700, #1d4ed8);
          padding: 0.2rem 0.5rem;
          border-radius: 4px;
        }

        [data-theme='dark'] .timeline-highlight {
          background: rgba(59, 130, 246, 0.2);
          color: var(--primary-300, #93c5fd);
        }

        /* Expand hint */
        .timeline-expand-hint {
          display: block;
          width: 100%;
          margin-top: 0.75rem;
          padding: 0;
          background: none;
          border: none;
          font-size: 0.75rem;
          color: var(--primary-600, #2563eb);
          cursor: pointer;
          text-align: left;
        }

        .timeline-expand-hint:hover {
          text-decoration: underline;
        }

        [data-theme='dark'] .timeline-expand-hint {
          color: var(--primary-400, #60a5fa);
        }

        /* Mobile: horizontal scroll layout */
        @media (max-width: 767px) {
          .timeline-container {
            overflow-x: auto;
            padding-bottom: 1rem;
            -webkit-overflow-scrolling: touch;
          }

          .timeline-track {
            left: 0;
            right: 0;
            top: 50%;
            bottom: auto;
            width: auto;
            height: 3px;
            transform: translateY(-50%);
            background: linear-gradient(
              to right,
              var(--primary-200, #bfdbfe),
              var(--primary-400, #60a5fa),
              var(--primary-200, #bfdbfe)
            );
          }

          .timeline-milestones {
            flex-direction: row;
            min-width: max-content;
            padding: 0 1rem;
          }

          .timeline-item,
          .timeline-item:nth-child(even) {
            grid-template-columns: 1fr;
            grid-template-rows: auto auto auto;
            gap: 0.5rem;
            direction: ltr;
            min-width: 200px;
          }

          .timeline-year {
            text-align: center;
            order: 1;
          }

          .timeline-node {
            order: 2;
            margin: 0 auto;
          }

          .timeline-card {
            order: 3;
            max-width: none;
            border-left: none;
            border-top: 4px solid;
          }
        }
      ` }} />
    </section>
  );
}
