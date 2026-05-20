import { MeshGradient } from '@paper-design/shaders-react';
import { motion } from 'framer-motion';
import { memo, useEffect, useState } from 'react';

const heroColors = ['#041020', '#0b2750', '#123d78', '#1c5aa2'];

const TAGLINE = 'Dermatology · AI in medicine · Clinical software';

// Check for WebGL support
const hasWebGLSupport = () => {
  if (typeof window === 'undefined') return true;
  try {
    const canvas = document.createElement('canvas');
    return !!(canvas.getContext('webgl') || canvas.getContext('webgl2'));
  } catch {
    return false;
  }
};

// Check if mobile device
const isMobileDevice = () => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < 768;
};

// CSS-only animated gradient fallback for non-WebGL browsers
const GradientFallback = memo(() => (
  <div className="hero-gradient-fallback" aria-hidden="true">
    <style>{`
      .hero-gradient-fallback {
        position: absolute;
        inset: 0;
        background: linear-gradient(
          135deg,
          #041020 0%,
          #0b2750 25%,
          #123d78 50%,
          #1c5aa2 75%,
          #0b2750 100%
        );
        background-size: 400% 400%;
        animation: gradientShift 20s ease infinite;
      }

      @keyframes gradientShift {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
      }

      @media (prefers-reduced-motion: reduce) {
        .hero-gradient-fallback {
          animation: none;
          background-position: 50% 50%;
        }
      }
    `}</style>
  </div>
));

const Hero = ({ profile }) => {
  const [hasWebGL, setHasWebGL] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  const [primaryCta, secondaryCta] = profile.callToActions.slice(0, 2);
  const headline = `${profile.name}`;
  const emphasisWrapped = `<span class="hero-emphasis">${headline}</span>`;

  useEffect(() => {
    setHasWebGL(hasWebGLSupport());
    setIsMobile(isMobileDevice());

    const handleResize = () => setIsMobile(isMobileDevice());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Lighter shader settings on mobile
  const distortion = isMobile ? 0.8 : 1.15;
  const swirl = isMobile ? 0.15 : 0.24;
  const speed = isMobile ? 0.4 : 0.6;

  return (
    <section
      className="hero-stage"
      aria-labelledby="hero-title"
    >
      <div className="hero-background">
        {hasWebGL ? (
          <MeshGradient
            colors={heroColors}
            speed={speed}
            distortion={distortion}
            swirl={swirl}
            style={{ position: 'absolute', inset: 0, opacity: 0.7 }}
          />
        ) : (
          <GradientFallback />
        )}
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
          <p className="hero-role">{TAGLINE}</p>
          <p className="hero-subtitle">{profile.summary}</p>
          <div className="hero-cta">
            <a
              className="button button--primary"
              href={primaryCta?.href ?? '/apps'}
              target={primaryCta?.external ? '_blank' : undefined}
              rel={primaryCta?.external ? 'noreferrer' : undefined}
            >
              {primaryCta?.label ?? 'View Applications'}
            </a>
            <a
              className="button button--secondary"
              href={secondaryCta?.href ?? '/about'}
              target={secondaryCta?.external ? '_blank' : undefined}
              rel={secondaryCta?.external ? 'noreferrer' : undefined}
            >
              {secondaryCta?.label ?? 'View CV'}
            </a>
          </div>
        </motion.div>
      </div>

      <style>{`
        .hero-role {
          font-size: clamp(1rem, 2.5vw, 1.2rem);
          color: rgba(255, 255, 255, 0.82);
          margin-bottom: 1rem;
          font-weight: 500;
          letter-spacing: 0.01em;
        }
      `}</style>
    </section>
  );
};

export default Hero;
