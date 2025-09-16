import { MeshGradient } from '@paper-design/shaders-react';
import { motion } from 'framer-motion';

const colors = ['#e6f7ff', '#c6f4ed', '#a5def5', '#ffffff'];

const Hero = ({ profile }) => {
  const [primaryCta, secondaryCta] = profile.callToActions.slice(0, 2);
  const headline = `${profile.name}`;
  const emphasisWord = profile.name.split(' ')[0];
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
          distortion={0.85}
          swirl={0.18}
          style={{ position: 'absolute', inset: 0, opacity: 0.7 }}
        />
        <MeshGradient
          colors={colors}
          speed={0.2}
          distortion={0.4}
          swirl={0.32}
          style={{ position: 'absolute', inset: 0, mixBlendMode: 'screen', opacity: 0.35 }}
        />
        <div className="hero-gradient-overlay" />
      </div>
      <div className="hero-content">
        <motion.div
          className="hero-copy"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: 'easeOut' }}
        >
          <h1
            id="hero-title"
            className="hero-title"
            dangerouslySetInnerHTML={{ __html: emphasisWrapped }}
          />
          <p className="hero-subtitle">{profile.summary}</p>
          <div className="hero-cta">
            <a className="button button--primary" href={primaryCta?.href ?? '/apps'} target={primaryCta?.external ? '_blank' : undefined} rel={primaryCta?.external ? 'noreferrer' : undefined}>
              {primaryCta?.label ?? 'View Applications'}
            </a>
            <a className="button button--secondary" href={secondaryCta?.href ?? '/legacy'} target={secondaryCta?.external ? '_blank' : undefined} rel={secondaryCta?.external ? 'noreferrer' : undefined}>
              {secondaryCta?.label ?? 'Download CV'}
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
