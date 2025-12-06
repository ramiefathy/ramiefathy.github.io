import { MeshGradient, ShaderMount } from '@paper-design/shaders-react';
import { defaultObjectSizing, ShaderFitOptions, getShaderColorFromString, meshGradientMeta } from '@paper-design/shaders';
import { motion, AnimatePresence } from 'framer-motion';
import { memo, useCallback, useEffect, useRef, useState } from 'react';

const heroColors = ['#041020', '#0b2750', '#123d78', '#1c5aa2'];

// Subtitles for typing animation
const TYPING_SUBTITLES = [
  'PGY-4 Dermatology Resident',
  'AI & Medicine Researcher',
  'Clinical Tool Developer',
  'Incoming Rheum-Derm Fellow'
];

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
        animation: gradientShift 15s ease infinite;
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

// Typing animation hook
const useTypingAnimation = (texts, typingSpeed = 50, deletingSpeed = 30, pauseDuration = 2000) => {
  const [displayText, setDisplayText] = useState('');
  const [textIndex, setTextIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    // Check for reduced motion preference
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDisplayText(texts[0]);
      return;
    }

    const currentText = texts[textIndex];

    if (isPaused) {
      const pauseTimer = setTimeout(() => {
        setIsPaused(false);
        setIsDeleting(true);
      }, pauseDuration);
      return () => clearTimeout(pauseTimer);
    }

    if (isDeleting) {
      if (displayText.length === 0) {
        setIsDeleting(false);
        setTextIndex((prev) => (prev + 1) % texts.length);
      } else {
        const deleteTimer = setTimeout(() => {
          setDisplayText(currentText.slice(0, displayText.length - 1));
        }, deletingSpeed);
        return () => clearTimeout(deleteTimer);
      }
    } else {
      if (displayText === currentText) {
        setIsPaused(true);
      } else {
        const typeTimer = setTimeout(() => {
          setDisplayText(currentText.slice(0, displayText.length + 1));
        }, typingSpeed);
        return () => clearTimeout(typeTimer);
      }
    }
  }, [displayText, textIndex, isDeleting, isPaused, texts, typingSpeed, deletingSpeed, pauseDuration]);

  return displayText;
};

const MAX_COLORS = meshGradientMeta.maxColorCount;

const rippleMeshGradientFragmentShader = `#version 300 es
precision mediump float;

uniform float u_time;
uniform vec2 u_rippleCenter;
uniform float u_rippleStrength;
uniform float u_rippleFrequency;

uniform vec4 u_colors[${MAX_COLORS}];
uniform float u_colorsCount;

uniform float u_distortion;
uniform float u_swirl;

uniform float u_originX;
uniform float u_originY;
uniform float u_worldWidth;
uniform float u_worldHeight;
uniform float u_fit;
uniform float u_scale;
uniform float u_rotation;
uniform float u_offsetX;
uniform float u_offsetY;

in vec2 v_objectUV;

out vec4 fragColor;

const float PI = 3.14159265358979323846;

mat2 rotate(float a) {
  float s = sin(a);
  float c = cos(a);
  return mat2(c, s, -s, c);
}

vec2 getPosition(int i, float t) {
  float a = float(i) * .37;
  float b = .6 + mod(float(i), 3.) * .3;
  float c = .8 + mod(float(i + 1), 4.) * 0.25;

  float x = sin(t * b + a);
  float y = cos(t * c + a * 1.5);

  return .5 + .5 * vec2(x, y);
}

void main() {
  vec2 shape_uv = v_objectUV;
  shape_uv += .5;

  vec2 rippleVector = shape_uv - u_rippleCenter;
  float rippleDistance = length(rippleVector);
  vec2 rippleDirection = rippleDistance > 0.0001 ? rippleVector / rippleDistance : vec2(0.0);
  float rippleEnvelope = exp(-7.5 * rippleDistance);
  float rippleWave = u_rippleStrength * rippleEnvelope * sin(u_rippleFrequency * rippleDistance - u_time * 1.6);
  shape_uv += rippleDirection * rippleWave;

  float t = .5 * u_time;

  float radius = smoothstep(0., 1., length(shape_uv - .5));
  float center = 1. - radius;
  for (float i = 1.; i <= 2.; i++) {
    shape_uv.x += u_distortion * center / i * sin(t + i * .4 * smoothstep(.0, 1., shape_uv.y)) * cos(.2 * t + i * 2.4 * smoothstep(.0, 1., shape_uv.y));
    shape_uv.y += u_distortion * center / i * cos(t + i * 2. * smoothstep(.0, 1., shape_uv.x));
  }

  vec2 uvRotated = shape_uv;
  uvRotated -= vec2(.5);
  float angle = 3. * u_swirl * radius;
  uvRotated = rotate(-angle) * uvRotated;
  uvRotated += vec2(.5);

  vec3 color = vec3(0.);
  float opacity = 0.;
  float totalWeight = 0.;

  for (int i = 0; i < ${MAX_COLORS}; i++) {
    if (i >= int(u_colorsCount)) break;

    vec2 pos = getPosition(i, t);
    vec3 colorFraction = u_colors[i].rgb * u_colors[i].a;
    float opacityFraction = u_colors[i].a;

    float dist = length(uvRotated - pos);

    dist = pow(dist, 3.5);
    float weight = 1. / (dist + 1e-3);
    color += colorFraction * weight;
    opacity += opacityFraction * weight;
    totalWeight += weight;
  }

  color /= totalWeight;
  opacity /= totalWeight;

  fragColor = vec4(color, opacity);
}
`;

const RippleMeshGradient = memo(
  ({
    colors = heroColors,
    distortion = 1,
    swirl = 0.3,
    rippleCenter = [0.5, 0.5],
    rippleStrength = 0.22,
    rippleFrequency = 25,
    speed = 1.2,
    frame = 0,
    fit = defaultObjectSizing.fit,
    rotation = defaultObjectSizing.rotation,
    scale = defaultObjectSizing.scale,
    originX = defaultObjectSizing.originX,
    originY = defaultObjectSizing.originY,
    offsetX = defaultObjectSizing.offsetX,
    offsetY = defaultObjectSizing.offsetY,
    worldWidth = defaultObjectSizing.worldWidth,
    worldHeight = defaultObjectSizing.worldHeight,
    ...props
  }) => {
    const uniforms = {
      u_colors: colors.map(getShaderColorFromString),
      u_colorsCount: colors.length,
      u_distortion: distortion,
      u_swirl: swirl,
      u_fit: ShaderFitOptions[fit],
      u_rotation: rotation,
      u_scale: scale,
      u_offsetX: offsetX,
      u_offsetY: offsetY,
      u_originX: originX,
      u_originY: originY,
      u_worldWidth: worldWidth,
      u_worldHeight: worldHeight,
      u_rippleCenter: rippleCenter,
      u_rippleStrength: rippleStrength,
      u_rippleFrequency: rippleFrequency
    };

    return (
      <ShaderMount
        {...props}
        speed={speed}
        frame={frame}
        fragmentShader={rippleMeshGradientFragmentShader}
        uniforms={uniforms}
      />
    );
  }
);

const Hero = ({ profile, enableTypingAnimation = true }) => {
  const [ripple, setRipple] = useState({ x: 0.5, y: 0.5, strength: 0.12 });
  const [hasWebGL, setHasWebGL] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const frameRef = useRef(0);
  const lastPointer = useRef({ x: 0.5, y: 0.5, time: typeof performance !== 'undefined' ? performance.now() : 0 });

  // Typing animation for role text
  const typedRole = useTypingAnimation(TYPING_SUBTITLES, 50, 30, 2500);

  const [primaryCta, secondaryCta] = profile.callToActions.slice(0, 2);
  const headline = `${profile.name}`;
  const emphasisWrapped = `<span class="hero-emphasis">${headline}</span>`;

  // Check WebGL and mobile on mount
  useEffect(() => {
    setHasWebGL(hasWebGLSupport());
    setIsMobile(isMobileDevice());

    const motionMedia = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleMotionChange = (event) => setPrefersReducedMotion(event.matches);
    setPrefersReducedMotion(motionMedia.matches);
    motionMedia.addEventListener('change', handleMotionChange);

    const handleResize = () => {
      setIsMobile(isMobileDevice());
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      motionMedia.removeEventListener('change', handleMotionChange);
    };
  }, []);

  // Optimized mouse handler - reduced effect on mobile
  const handleMouseMove = useCallback((event) => {
    if (frameRef.current || isMobile) return;

    frameRef.current = requestAnimationFrame(() => {
      frameRef.current = 0;
      const { clientX, clientY, currentTarget } = event;
      const rect = currentTarget.getBoundingClientRect();

      const x = (clientX - rect.left) / rect.width;
      const y = (clientY - rect.top) / rect.height;
      const now = performance.now();
      const { x: px, y: py, time } = lastPointer.current;
      const dt = Math.max(now - time, 16);
      const dx = x - px;
      const dy = y - py;
      const velocity = Math.sqrt(dx * dx + dy * dy) / (dt / 16.0);
      // Reduce ripple effect intensity on mobile
      const maxStrength = isMobile ? 0.35 : 0.55;
      const strength = Math.min(maxStrength, Math.max(0.12, velocity * 0.6));
      lastPointer.current = { x, y, time: now };
      setRipple({ x, y, strength });
    });
  }, [isMobile]);

  const handleMouseLeave = useCallback(() => {
    if (frameRef.current) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = 0;
    }

    lastPointer.current = { x: 0.5, y: 0.5, time: performance.now() };
    setRipple({ x: 0.5, y: 0.5, strength: 0.12 });
  }, []);

  useEffect(() => () => {
    if (frameRef.current) {
      cancelAnimationFrame(frameRef.current);
    }
  }, []);

  // Mobile-optimized shader settings
  const mobileDistortion = isMobile ? 0.8 : 1.15;
  const mobileSwirl = isMobile ? 0.15 : 0.24;
  const mobileSpeed = isMobile ? 0.4 : 0.6;
  const rippleDistortion = isMobile ? 1.0 : 1.35;
  const rippleSwirl = isMobile ? 0.35 : 0.55;
  const rippleFrequency = isMobile ? 20 : 32;

  return (
    <section
      className="hero-stage"
      aria-labelledby="hero-title"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div className="hero-background">
        {hasWebGL ? (
          <>
            <MeshGradient
              colors={heroColors}
              speed={mobileSpeed}
              distortion={mobileDistortion}
              swirl={mobileSwirl}
              style={{ position: 'absolute', inset: 0, opacity: 0.65 }}
            />

            {/* Only render ripple layer on non-mobile or if explicitly enabled */}
            {!isMobile && (
              <RippleMeshGradient
                colors={heroColors}
                speed={1.55}
                distortion={rippleDistortion}
                swirl={rippleSwirl}
                rippleCenter={[ripple.x, ripple.y]}
                rippleStrength={ripple.strength}
                rippleFrequency={rippleFrequency}
                style={{ position: 'absolute', inset: 0, mixBlendMode: 'screen', opacity: 0.45 }}
              />
            )}
          </>
        ) : (
          <GradientFallback />
        )}

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

          {/* Typing animation subtitle */}
          {enableTypingAnimation ? (
            <p className="hero-role" aria-live="polite">
              <span className="hero-role-text">{prefersReducedMotion ? TYPING_SUBTITLES[0] : typedRole}</span>
              {!prefersReducedMotion && <span className="hero-cursor" aria-hidden="true">|</span>}
            </p>
          ) : null}

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

      {/* Additional styles for typing animation */}
      <style>{`
        .hero-role {
          font-size: clamp(1rem, 2.5vw, 1.25rem);
          color: rgba(255, 255, 255, 0.85);
          margin-bottom: 1rem;
          min-height: 1.5em;
          font-weight: 500;
        }

        .hero-role-text {
          display: inline;
        }

        .hero-cursor {
          display: inline-block;
          margin-left: 2px;
          animation: blink 1s step-end infinite;
          color: var(--primary-400, #60a5fa);
        }

        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }

        @media (prefers-reduced-motion: reduce) {
          .hero-cursor {
            animation: none;
            opacity: 1;
          }
        }
      `}</style>
    </section>
  );
};

export default Hero;
