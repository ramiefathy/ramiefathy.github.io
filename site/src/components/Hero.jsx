import { MeshGradient } from '@paper-design/shaders-react';
import { motion } from 'framer-motion';

const colors = ['#000000', '#6d28d9', '#a855f7', '#ffffff'];

const Hero = ({ profile }) => {
  const headline = 'Beautiful Shader Experiences';
  const emphasisWord = 'Beautiful';
  const emphasisWrapped = headline.replace(
    emphasisWord,
    `<span class="hero-emphasis">${emphasisWord}</span>`
  );

  return (
    <section className="hero-stage" aria-labelledby="hero-title">
      <div className="hero-background">
        <MeshGradient
          colors={colors}
          speed={0.3}
          distortion={1.05}
          swirl={0.25}
          style={{ position: 'absolute', inset: 0, opacity: 0.75 }}
        />
        <MeshGradient
          colors={colors}
          speed={0.2}
          distortion={0.6}
          swirl={0.4}
          style={{ position: 'absolute', inset: 0, mixBlendMode: 'screen', opacity: 0.45 }}
        />
        <div className="hero-gradient-overlay" />
      </div>
      <div className="hero-content">
        <motion.div
          className="hero-copy"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          <p className="hero-kicker">Dermatology × AI Craft</p>
          <h1
            id="hero-title"
            className="hero-title"
            dangerouslySetInnerHTML={{ __html: emphasisWrapped }}
          />
          <p className="hero-subtitle">{profile.summary}</p>
          <ul className="hero-list">
            {profile.about.highlights.slice(0, 3).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <div className="hero-cta">
            <a className="button button--primary" href="#apps">Get Started</a>
            <a className="button button--secondary" href="https://ramiefathy.netlify.app/#pricing" target="_blank" rel="noreferrer">Pricing</a>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
