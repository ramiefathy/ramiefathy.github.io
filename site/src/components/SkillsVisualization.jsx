import { useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';

/**
 * Skills Visualization Component
 *
 * Displays skills in multiple categories with animated progress bars.
 * Animates on scroll into view.
 */
export default function SkillsVisualization({ data }) {
  const [activeCategory, setActiveCategory] = useState(null);
  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { once: true, margin: '-50px' });

  if (!data) return null;

  const categories = Object.entries(data);

  // Colors for different categories
  const categoryColors = {
    clinical: { primary: '#10b981', secondary: '#d1fae5' },
    technical: { primary: '#3b82f6', secondary: '#dbeafe' },
    research: { primary: '#8b5cf6', secondary: '#ede9fe' }
  };

  return (
    <section className="skills-section" aria-label="Skills and Expertise">
      <div ref={containerRef} className="skills-container">
        {categories.map(([key, category], categoryIndex) => {
          const colors = categoryColors[key] || { primary: '#64748b', secondary: '#f1f5f9' };

          return (
            <motion.div
              key={key}
              className="skills-category"
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.5, delay: categoryIndex * 0.15 }}
            >
              <h3 className="skills-category-title" style={{ color: colors.primary }}>
                {category.title}
              </h3>

              <div className="skills-list">
                {category.skills.map((skill, skillIndex) => (
                  <div
                    key={skill.name}
                    className="skill-item"
                    onMouseEnter={() => setActiveCategory(`${key}-${skillIndex}`)}
                    onMouseLeave={() => setActiveCategory(null)}
                  >
                    <div className="skill-header">
                      <span className="skill-name">{skill.name}</span>
                      <span className="skill-level">{skill.level}%</span>
                    </div>

                    <div className="skill-bar-bg" style={{ backgroundColor: colors.secondary }}>
                      <motion.div
                        className="skill-bar-fill"
                        style={{ backgroundColor: colors.primary }}
                        initial={{ width: 0 }}
                        animate={isInView ? { width: `${skill.level}%` } : { width: 0 }}
                        transition={{
                          duration: 1,
                          delay: categoryIndex * 0.15 + skillIndex * 0.1,
                          ease: 'easeOut'
                        }}
                      />
                    </div>

                    {/* Description tooltip on hover */}
                    {activeCategory === `${key}-${skillIndex}` && skill.description && (
                      <motion.p
                        className="skill-description"
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        {skill.description}
                      </motion.p>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .skills-section {
          padding: 2rem 1rem;
        }

        .skills-container {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 2rem;
          max-width: 1000px;
          margin: 0 auto;
        }

        .skills-category {
          background: white;
          border-radius: var(--radius-lg, 12px);
          padding: 1.5rem;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
          border: 1px solid rgba(148, 163, 184, 0.15);
        }

        [data-theme='dark'] .skills-category {
          background: var(--secondary-800, #1e293b);
          border-color: rgba(148, 163, 184, 0.2);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }

        .skills-category-title {
          font-size: 1rem;
          font-weight: 700;
          margin: 0 0 1.25rem 0;
          padding-bottom: 0.75rem;
          border-bottom: 2px solid currentColor;
          opacity: 0.9;
        }

        .skills-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .skill-item {
          position: relative;
        }

        .skill-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.35rem;
        }

        .skill-name {
          font-size: 0.85rem;
          font-weight: 500;
          color: var(--secondary-800, #1e293b);
        }

        [data-theme='dark'] .skill-name {
          color: var(--secondary-200, #e2e8f0);
        }

        .skill-level {
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--secondary-500, #64748b);
        }

        [data-theme='dark'] .skill-level {
          color: var(--secondary-400, #94a3b8);
        }

        .skill-bar-bg {
          height: 8px;
          border-radius: 4px;
          overflow: hidden;
        }

        .skill-bar-fill {
          height: 100%;
          border-radius: 4px;
          position: relative;
        }

        /* Shine effect on bar */
        .skill-bar-fill::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(255, 255, 255, 0.3) 50%,
            transparent 100%
          );
          animation: shine 2s ease-in-out infinite;
          opacity: 0;
        }

        .skill-item:hover .skill-bar-fill::after {
          opacity: 1;
        }

        @keyframes shine {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }

        .skill-description {
          font-size: 0.75rem;
          color: var(--secondary-500, #64748b);
          margin: 0.35rem 0 0 0;
          line-height: 1.4;
          padding-left: 0.25rem;
        }

        [data-theme='dark'] .skill-description {
          color: var(--secondary-400, #94a3b8);
        }

        /* Reduced motion */
        @media (prefers-reduced-motion: reduce) {
          .skill-bar-fill::after {
            animation: none;
          }
        }
      ` }} />
    </section>
  );
}
