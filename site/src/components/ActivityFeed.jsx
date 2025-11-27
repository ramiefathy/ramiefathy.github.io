import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Activity type icons and colors
 */
const activityConfig = {
  publication: {
    icon: '📄',
    label: 'Publication',
    color: 'var(--primary-500, #3b82f6)',
    bgColor: 'rgba(59, 130, 246, 0.1)'
  },
  blog: {
    icon: '📝',
    label: 'Blog Post',
    color: 'var(--accent-500, #8b5cf6)',
    bgColor: 'rgba(139, 92, 246, 0.1)'
  },
  app: {
    icon: '🚀',
    label: 'App Update',
    color: 'var(--success, #10b981)',
    bgColor: 'rgba(16, 185, 129, 0.1)'
  },
  talk: {
    icon: '🎤',
    label: 'Talk/Presentation',
    color: 'var(--warning, #f59e0b)',
    bgColor: 'rgba(245, 158, 11, 0.1)'
  },
  award: {
    icon: '🏆',
    label: 'Award',
    color: '#ffd700',
    bgColor: 'rgba(255, 215, 0, 0.1)'
  }
};

/**
 * Format relative time (e.g., "2 weeks ago")
 */
function formatRelativeTime(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 14) return '1 week ago';
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 60) return '1 month ago';
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} year${Math.floor(diffDays / 365) > 1 ? 's' : ''} ago`;
}

/**
 * Activity Feed Component
 *
 * Displays a timeline of recent activities (publications, blog posts, app updates).
 * Feature-flagged via 'activityFeed' flag.
 */
export default function ActivityFeed({ activities, publications = [], blogs = [] }) {
  const [visibleCount, setVisibleCount] = useState(5);

  // Merge and sort all activities by date
  const allActivities = useMemo(() => {
    const merged = [];

    // Add explicit activities
    if (activities?.length) {
      merged.push(...activities.map(a => ({
        ...a,
        sortDate: new Date(a.date)
      })));
    }

    // Add publications (most recent 5)
    if (publications?.length) {
      const recentPubs = publications
        .filter(p => p.year >= 2023)
        .slice(0, 5)
        .map(p => ({
          id: `pub-${p.title.slice(0, 20)}`,
          type: 'publication',
          title: p.title,
          description: `Published in ${p.venue?.split('.')[0] || 'journal'}`,
          date: `${p.year}-01-01`,
          sortDate: new Date(`${p.year}-06-01`),
          url: p.url
        }));
      merged.push(...recentPubs);
    }

    // Add blog posts
    if (blogs?.length) {
      const recentBlogs = blogs.slice(0, 3).map(b => ({
        id: `blog-${b.title.slice(0, 20)}`,
        type: 'blog',
        title: b.title,
        description: b.summary?.slice(0, 100) + '...',
        date: b.date,
        sortDate: new Date(b.date),
        url: b.href
      }));
      merged.push(...recentBlogs);
    }

    // Sort by date descending
    return merged.sort((a, b) => b.sortDate - a.sortDate);
  }, [activities, publications, blogs]);

  const visibleActivities = allActivities.slice(0, visibleCount);
  const hasMore = visibleCount < allActivities.length;

  if (!allActivities.length) {
    return null;
  }

  return (
    <section className="activity-section" aria-label="Recent Activity">
      <div className="activity-container">
        <h2 className="activity-title">Recent Activity</h2>

        <div className="activity-timeline">
          <div className="timeline-line" aria-hidden="true" />

          <AnimatePresence mode="popLayout">
            {visibleActivities.map((activity, index) => {
              const config = activityConfig[activity.type] || activityConfig.publication;

              return (
                <motion.article
                  key={activity.id}
                  className="activity-item"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <div
                    className="activity-dot"
                    style={{ backgroundColor: config.color }}
                    aria-hidden="true"
                  >
                    <span className="activity-icon">{config.icon}</span>
                  </div>

                  <div className="activity-content">
                    <div className="activity-meta">
                      <span
                        className="activity-type"
                        style={{
                          color: config.color,
                          backgroundColor: config.bgColor
                        }}
                      >
                        {config.label}
                      </span>
                      <time className="activity-date" dateTime={activity.date}>
                        {formatRelativeTime(activity.date)}
                      </time>
                    </div>

                    <h3 className="activity-item-title">
                      {activity.url ? (
                        <a
                          href={activity.url}
                          target={activity.url.startsWith('http') ? '_blank' : undefined}
                          rel={activity.url.startsWith('http') ? 'noopener noreferrer' : undefined}
                        >
                          {activity.title}
                        </a>
                      ) : (
                        activity.title
                      )}
                    </h3>

                    {activity.description && (
                      <p className="activity-description">{activity.description}</p>
                    )}
                  </div>
                </motion.article>
              );
            })}
          </AnimatePresence>
        </div>

        {hasMore && (
          <button
            className="activity-more-btn"
            onClick={() => setVisibleCount(prev => prev + 5)}
          >
            Show more ({allActivities.length - visibleCount} remaining)
          </button>
        )}
      </div>

      <style>{`
        .activity-section {
          padding: 3rem 1.5rem;
        }

        .activity-container {
          max-width: 700px;
          margin: 0 auto;
        }

        .activity-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--secondary-900, #0f172a);
          margin-bottom: 2rem;
          text-align: center;
        }

        [data-theme='dark'] .activity-title {
          color: var(--secondary-100, #f1f5f9);
        }

        .activity-timeline {
          position: relative;
          padding-left: 2rem;
        }

        .timeline-line {
          position: absolute;
          left: 0.5rem;
          top: 0.5rem;
          bottom: 0.5rem;
          width: 2px;
          background: linear-gradient(
            to bottom,
            var(--primary-300, #93c5fd),
            var(--primary-500, #3b82f6),
            var(--primary-300, #93c5fd)
          );
          border-radius: 1px;
        }

        .activity-item {
          position: relative;
          padding-bottom: 1.5rem;
        }

        .activity-item:last-child {
          padding-bottom: 0;
        }

        .activity-dot {
          position: absolute;
          left: -2rem;
          top: 0.25rem;
          width: 1rem;
          height: 1rem;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transform: translateX(calc(0.5rem - 50%));
          z-index: 1;
        }

        .activity-icon {
          font-size: 0.75rem;
          display: none;
        }

        .activity-dot:hover .activity-icon {
          display: block;
        }

        .activity-content {
          background: white;
          border-radius: var(--radius-lg, 12px);
          padding: 1rem 1.25rem;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
          border: 1px solid rgba(148, 163, 184, 0.15);
        }

        [data-theme='dark'] .activity-content {
          background: rgba(30, 41, 59, 0.8);
          border-color: rgba(148, 163, 184, 0.2);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        }

        .activity-meta {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 0.5rem;
        }

        .activity-type {
          font-size: 0.7rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding: 0.2rem 0.5rem;
          border-radius: 4px;
        }

        .activity-date {
          font-size: 0.75rem;
          color: var(--secondary-500, #64748b);
        }

        .activity-item-title {
          font-size: 0.95rem;
          font-weight: 600;
          color: var(--secondary-800, #1e293b);
          margin: 0 0 0.25rem 0;
          line-height: 1.4;
        }

        [data-theme='dark'] .activity-item-title {
          color: var(--secondary-100, #f1f5f9);
        }

        .activity-item-title a {
          color: inherit;
          text-decoration: none;
        }

        .activity-item-title a:hover {
          color: var(--primary-600, #2563eb);
          text-decoration: underline;
        }

        [data-theme='dark'] .activity-item-title a:hover {
          color: var(--primary-400, #60a5fa);
        }

        .activity-description {
          font-size: 0.85rem;
          color: var(--secondary-600, #475569);
          margin: 0;
          line-height: 1.5;
        }

        [data-theme='dark'] .activity-description {
          color: var(--secondary-400, #94a3b8);
        }

        .activity-more-btn {
          display: block;
          width: 100%;
          margin-top: 1.5rem;
          padding: 0.75rem 1rem;
          background: transparent;
          border: 1px dashed var(--secondary-300, #cbd5e1);
          border-radius: var(--radius-md, 8px);
          color: var(--secondary-600, #475569);
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .activity-more-btn:hover {
          background: rgba(59, 130, 246, 0.05);
          border-color: var(--primary-400, #60a5fa);
          color: var(--primary-600, #2563eb);
        }

        [data-theme='dark'] .activity-more-btn {
          border-color: var(--secondary-600, #475569);
          color: var(--secondary-400, #94a3b8);
        }

        [data-theme='dark'] .activity-more-btn:hover {
          background: rgba(59, 130, 246, 0.1);
          border-color: var(--primary-500, #3b82f6);
          color: var(--primary-400, #60a5fa);
        }
      `}</style>
    </section>
  );
}
