import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

/**
 * Skills Visualization Component
 *
 * Displays grouped skills with name + short description.
 * No percentages — self-rated proficiency bars were intentionally removed.
 */
export default function SkillsVisualization({ data }) {
  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { once: true, margin: '-50px' });

  if (!data) return null;

  const categories = Object.entries(data);

  const categoryColors = {
    clinical: '#10b981',
    technical: '#3b82f6',
    research: '#8b5cf6'
  };

  return (
    <section className="skills-section" aria-label="Skills and Expertise">
      <div ref={containerRef} className="skills-container">
        {categories.map(([key, category], categoryIndex) => {
          const accent = categoryColors[key] || '#64748b';

          return (
            <motion.div
              key={key}
              className="skills-category"
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.5, delay: categoryIndex * 0.15 }}
              style={{ borderTopColor: accent }}
            >
              <h3 className="skills-category-title" style={{ color: accent }}>
                {category.title}
              </h3>

              <ul className="skills-list">
                {category.skills.map((skill) => (
                  <li key={skill.name} className="skill-item">
                    <span className="skill-name">{skill.name}</span>
                    {skill.description && (
                      <span className="skill-description">{skill.description}</span>
                    )}
                  </li>
                ))}
              </ul>
            </motion.div>
          );
        })}
      </div>

      <style>{`
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
          border: 1px solid rgba(148, 163, 184, 0.18);
          border-top: 3px solid;
          padding: 1.5rem;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
        }

        [data-theme='dark'] .skills-category {
          background: var(--secondary-800, #1e293b);
          border-color: rgba(148, 163, 184, 0.2);
        }

        .skills-category-title {
          margin: 0 0 1rem 0;
          font-size: 1rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }

        .skills-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 0.85rem;
        }

        .skill-item {
          display: flex;
          flex-direction: column;
          gap: 0.15rem;
        }

        .skill-name {
          font-size: 0.95rem;
          font-weight: 600;
          color: var(--secondary-800, #1e293b);
        }

        [data-theme='dark'] .skill-name {
          color: var(--secondary-100, #f1f5f9);
        }

        .skill-description {
          font-size: 0.82rem;
          color: var(--secondary-500, #64748b);
          line-height: 1.45;
        }

        [data-theme='dark'] .skill-description {
          color: var(--secondary-400, #94a3b8);
        }
      `}</style>
    </section>
  );
}
