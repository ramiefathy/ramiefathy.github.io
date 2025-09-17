import { MeshGradient } from '@paper-design/shaders-react';
import { motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
const colors = ['#041020', '#0b2750', '#123d78', '#1c5aa2'];

const Hero = ({ profile }) => {
  const [parallax, setParallax] = useState({ x: 0, y: 0 });
  const animationFrame = useRef(0);
  const [primaryCta, secondaryCta] = profile.callToActions.slice(0, 2);
  const headline = `${profile.name}`;
  const emphasisWord = profile.name.split(' ')[0];
  const emphasisWrapped = headline.replace(
    emphasisWord,
    `<span class="hero-emphasis">${emphasisWord}</span>`
  );

  const handleMouseMove = (event) => {
    if (animationFrame.current) {
      return;
    }

    const { clientX, clientY, currentTarget } = event;
    const rect = currentTarget.getBoundingClientRect();
    const relativeX = (clientX - rect.left) / rect.width - 0.5;
    const relativeY = (clientY - rect.top) / rect.height - 0.5;
    const nextParallax = { x: relativeX * 35, y: relativeY * 35 };

    animationFrame.current = requestAnimationFrame(() => {
      animationFrame.current = 0;
      setParallax(nextParallax);
    });
  };

  const handleMouseLeave = () => {
    if (animationFrame.current) {
      cancelAnimationFrame(animationFrame.current);
      animationFrame.current = 0;
    }
    setParallax({ x: 0, y: 0 });
  };

  useEffect(() => () => {
    if (animationFrame.current) {
      cancelAnimationFrame(animationFrame.current);
    }
  }, []);

  return (
    <section
      className="hero-stage"
      aria-labelledby="hero-title"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div
        className="hero-background"
        style={{ transform: `translate3d(${parallax.x}px, ${parallax.y}px, 0)` }}
      >
        <MeshGradient
          colors={colors}
          speed={0.25}
          distortion={1.15}
          swirl={0.22}
          style={{ position: 'absolute', inset: 0, opacity: 0.65 }}
        />
        <MeshGradient
          colors={colors}
          speed={0.18}
          distortion={0.7}
          swirl={0.4}
          style={{ position: 'absolute', inset: 0, mixBlendMode: 'screen', opacity: 0.28 }}
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
