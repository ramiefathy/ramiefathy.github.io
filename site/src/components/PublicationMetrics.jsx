import { useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';

/**
 * Publication Metrics Component
 *
 * Displays h-index, citation counts, and visualizations of scholarly impact.
 */
export default function PublicationMetrics({ data }) {
  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { once: true, margin: '-50px' });
  const [hoveredBar, setHoveredBar] = useState(null);

  if (!data?.metrics) return null;

  const { metrics, citationsByYear, publicationsByType, topPublications, profile, lastUpdated } = data;

  // Calculate max for chart scaling
  const maxCitations = Math.max(...(citationsByYear?.map(y => y.citations) || [1]));
  const maxTypeCount = Math.max(...(publicationsByType?.map(t => t.count) || [1]));

  return (
    <section className="metrics-section" aria-label="Publication Metrics">
      <div ref={containerRef} className="metrics-container">
        {/* Key metrics cards */}
        <div className="metrics-cards">
          <motion.div
            className="metric-card metric-card--primary"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.4 }}
          >
            <span className="metric-value">{metrics.citations}</span>
            <span className="metric-label">Total Citations</span>
          </motion.div>

          <motion.div
            className="metric-card"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <span className="metric-value">{metrics.hIndex}</span>
            <span className="metric-label">h-index</span>
          </motion.div>

          <motion.div
            className="metric-card"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <span className="metric-value">{metrics.i10Index}</span>
            <span className="metric-label">i10-index</span>
          </motion.div>
        </div>

        {/* Charts row */}
        <div className="metrics-charts">
          {/* Citations by year bar chart */}
          {citationsByYear?.length > 0 && (
            <motion.div
              className="chart-container"
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <h4 className="chart-title">Citations by Year</h4>
              <div className="bar-chart">
                {citationsByYear.map((item, index) => (
                  <div
                    key={item.year}
                    className="bar-group"
                    onMouseEnter={() => setHoveredBar(`year-${index}`)}
                    onMouseLeave={() => setHoveredBar(null)}
                  >
                    <motion.div
                      className="bar"
                      style={{ backgroundColor: '#3b82f6' }}
                      initial={{ height: 0 }}
                      animate={isInView ? { height: `${(item.citations / maxCitations) * 100}%` } : { height: 0 }}
                      transition={{ duration: 0.6, delay: 0.4 + index * 0.1 }}
                    />
                    <span className="bar-label">{item.year}</span>
                    {hoveredBar === `year-${index}` && (
                      <div className="bar-tooltip">
                        {item.citations} citations
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Publications by type */}
          {publicationsByType?.length > 0 && (
            <motion.div
              className="chart-container"
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <h4 className="chart-title">Publications by Type</h4>
              <div className="type-bars">
                {publicationsByType.map((item, index) => (
                  <div key={item.type} className="type-bar-row">
                    <span className="type-label">{item.type}</span>
                    <div className="type-bar-bg">
                      <motion.div
                        className="type-bar-fill"
                        style={{ backgroundColor: item.color }}
                        initial={{ width: 0 }}
                        animate={isInView ? { width: `${(item.count / maxTypeCount) * 100}%` } : { width: 0 }}
                        transition={{ duration: 0.6, delay: 0.5 + index * 0.1 }}
                      />
                    </div>
                    <span className="type-count">{item.count}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>

        {/* Scholar link */}
        <div className="metrics-footer">
          {profile?.scholarUrl && (
            <a
              href={profile.scholarUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="scholar-link"
            >
              View full profile on Google Scholar →
            </a>
          )}
          {lastUpdated && (
            <p className="metrics-updated">
              Last updated: {new Date(lastUpdated).toLocaleDateString('en-US', {
                month: 'long',
                year: 'numeric'
              })}
            </p>
          )}
        </div>
      </div>

      <style>{`
        .metrics-section {
          padding: 2rem 1rem;
        }

        .metrics-container {
          max-width: 800px;
          margin: 0 auto;
        }

        /* Metric cards */
        .metrics-cards {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .metric-card {
          background: white;
          border-radius: var(--radius-lg, 12px);
          padding: 1.25rem 1rem;
          text-align: center;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
          border: 1px solid rgba(148, 163, 184, 0.15);
        }

        [data-theme='dark'] .metric-card {
          background: var(--secondary-800, #1e293b);
          border-color: rgba(148, 163, 184, 0.2);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }

        .metric-card--primary {
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
          color: white;
          border: none;
        }

        .metric-value {
          display: block;
          font-size: clamp(1.75rem, 4vw, 2.5rem);
          font-weight: 700;
          line-height: 1.1;
          margin-bottom: 0.25rem;
        }

        .metric-card:not(.metric-card--primary) .metric-value {
          background: linear-gradient(135deg, var(--primary-600, #2563eb), var(--primary-400, #60a5fa));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .metric-label {
          font-size: 0.75rem;
          font-weight: 500;
          color: var(--secondary-500, #64748b);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .metric-card--primary .metric-label {
          color: rgba(255, 255, 255, 0.85);
        }

        [data-theme='dark'] .metric-label {
          color: var(--secondary-400, #94a3b8);
        }

        /* Charts */
        .metrics-charts {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 1.5rem;
          margin-bottom: 1.5rem;
        }

        .chart-container {
          background: white;
          border-radius: var(--radius-lg, 12px);
          padding: 1.25rem;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
          border: 1px solid rgba(148, 163, 184, 0.15);
        }

        [data-theme='dark'] .chart-container {
          background: var(--secondary-800, #1e293b);
          border-color: rgba(148, 163, 184, 0.2);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }

        .chart-title {
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--secondary-700, #334155);
          margin: 0 0 1rem 0;
        }

        [data-theme='dark'] .chart-title {
          color: var(--secondary-300, #cbd5e1);
        }

        /* Bar chart */
        .bar-chart {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          height: 120px;
          gap: 0.5rem;
        }

        .bar-group {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          height: 100%;
          position: relative;
        }

        .bar {
          width: 100%;
          max-width: 40px;
          border-radius: 4px 4px 0 0;
          margin-top: auto;
          transition: opacity 0.2s;
        }

        .bar-group:hover .bar {
          opacity: 0.8;
        }

        .bar-label {
          font-size: 0.7rem;
          color: var(--secondary-500, #64748b);
          margin-top: 0.35rem;
        }

        .bar-tooltip {
          position: absolute;
          top: -1.5rem;
          left: 50%;
          transform: translateX(-50%);
          background: var(--secondary-900, #0f172a);
          color: white;
          font-size: 0.7rem;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          white-space: nowrap;
          z-index: 10;
        }

        /* Type bars */
        .type-bars {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .type-bar-row {
          display: grid;
          grid-template-columns: 100px 1fr 30px;
          align-items: center;
          gap: 0.75rem;
        }

        .type-label {
          font-size: 0.75rem;
          color: var(--secondary-600, #475569);
          text-align: right;
        }

        [data-theme='dark'] .type-label {
          color: var(--secondary-400, #94a3b8);
        }

        .type-bar-bg {
          height: 10px;
          background: var(--secondary-100, #f1f5f9);
          border-radius: 5px;
          overflow: hidden;
        }

        [data-theme='dark'] .type-bar-bg {
          background: var(--secondary-700, #334155);
        }

        .type-bar-fill {
          height: 100%;
          border-radius: 5px;
        }

        .type-count {
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--secondary-700, #334155);
          text-align: left;
        }

        [data-theme='dark'] .type-count {
          color: var(--secondary-300, #cbd5e1);
        }

        /* Footer */
        .metrics-footer {
          text-align: center;
        }

        .scholar-link {
          display: inline-block;
          font-size: 0.875rem;
          color: var(--primary-600, #2563eb);
          text-decoration: none;
          margin-bottom: 0.5rem;
        }

        .scholar-link:hover {
          text-decoration: underline;
        }

        [data-theme='dark'] .scholar-link {
          color: var(--primary-400, #60a5fa);
        }

        .metrics-updated {
          font-size: 0.75rem;
          color: var(--secondary-400, #94a3b8);
          margin: 0;
        }

        @media (max-width: 480px) {
          .metrics-cards {
            grid-template-columns: 1fr;
          }

          .type-bar-row {
            grid-template-columns: 80px 1fr 25px;
          }
        }
      `}</style>
    </section>
  );
}
