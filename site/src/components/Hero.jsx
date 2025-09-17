import { MeshGradient } from '@paper-design/shaders-react';
import { motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
const colors = ['#041020', '#0b2750', '#123d78', '#1c5aa2'];

const Hero = ({ profile }) => {
  const [ripple, setRipple] = useState({ x: 50, y: 50, token: 0 });
  const frameRef = useRef(0);
  const [primaryCta, secondaryCta] = profile.callToActions.slice(0, 2);
  const headline = `${profile.name}`;
  const emphasisWord = profile.name.split(' ')[0];
  const emphasisWrapped = headline.replace(
    emphasisWord,
    `<span class="hero-emphasis">${emphasisWord}</span>`
  );

  const handleMouseMove = (event) => {
    if (frameRef.current) return;

    frameRef.current = requestAnimationFrame(() => {
      frameRef.current = 0;
      const { clientX, clientY, currentTarget } = event;
      const rect = currentTarget.getBoundingClientRect();
      const x = ((clientX - rect.left) / rect.width) * 100;
      const y = ((clientY - rect.top) / rect.height) * 100;
      setRipple({ x, y, token: performance.now() });
    });
  };

  const handleMouseLeave = () => {
    if (frameRef.current) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = 0;
    }
    setRipple({ x: 50, y: 50, token: performance.now() });
  };

  useEffect(() => () => {
    if (frameRef.current) {
      cancelAnimationFrame(frameRef.current);
    }
  }, []);

  return (
    <section
      className="hero-stage"
      aria-labelledby="hero-title"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div className="hero-background">
        <MeshGradient
          colors={colors}
          speed={0.6}
          distortion={1.15}
          swirl={0.24}
          style={{ position: 'absolute', inset: 0, opacity: 0.65 }}
        />
        <MeshGradient
          colors={colors}
          speed={0.35}
          distortion={0.9}
          swirl={0.52}
          style={{ position: 'absolute', inset: 0, mixBlendMode: 'screen', opacity: 0.28 }}
        />
        <span
          key={ripple.token}
          className="hero-ripple"
          style={{ '--ripple-x': `${ripple.x}%`, '--ripple-y': `${ripple.y}%` }}
        />
        <div className="hero-gradient-overlay" />
      </div>
      <div className="hero-content">
        <motion.div
          className="hero-copy scroll-fade"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: 'easeOut' }}
          data-scroll-fade
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
