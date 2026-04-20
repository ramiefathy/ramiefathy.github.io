import { MeshGradient, ShaderMount } from '@paper-design/shaders-react';
import { defaultObjectSizing, ShaderFitOptions, getShaderColorFromString, meshGradientMeta } from '@paper-design/shaders';
import { memo, useCallback, useEffect, useRef, useState } from 'react';

// Atlas-tuned warm palette: bone + terracotta + gold + moss + ink-soft.
// The shader becomes a slow, low-contrast pigment swirl that sits under a bone overlay
// plate without competing with it.
const heroColors = ['#f4f0e8', '#e8d5c4', '#c2674a', '#a37b2a', '#5b7058'];

const hasWebGLSupport = () => {
  if (typeof window === 'undefined') return true;
  try {
    const canvas = document.createElement('canvas');
    return !!(canvas.getContext('webgl') || canvas.getContext('webgl2'));
  } catch {
    return false;
  }
};

const isMobileDevice = () => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < 768;
};

const GradientFallback = memo(({ style }) => (
  <div className="hero-gradient-fallback" aria-hidden="true" style={style}>
    <style dangerouslySetInnerHTML={{ __html: `
      .hero-gradient-fallback {
        position: absolute;
        inset: 0;
        background: linear-gradient(
          135deg,
          #f4f0e8 0%,
          #e8d5c4 30%,
          #c2674a 60%,
          #a37b2a 80%,
          #5b7058 100%
        );
        background-size: 320% 320%;
        animation: heroGradientShift 28s ease infinite;
      }

      @keyframes heroGradientShift {
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
    ` }} />
  </div>
));

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

const Hero = ({ profile }) => {
  const [ripple, setRipple] = useState({ x: 0.5, y: 0.5, strength: 0.12 });
  const [hasWebGL, setHasWebGL] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [webglVisible, setWebglVisible] = useState(false);
  const isServer = typeof window === 'undefined';
  const stageRef = useRef(null);
  const frameRef = useRef(0);
  const lastPointer = useRef({ x: 0.5, y: 0.5, time: typeof performance !== 'undefined' ? performance.now() : 0 });

  const [primaryCta, secondaryCta] = profile.callToActions.slice(0, 2);

  useEffect(() => {
    setHasWebGL(hasWebGLSupport());
    setIsMobile(isMobileDevice());

    const motionMedia = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleMotionChange = (event) => setPrefersReducedMotion(event.matches);
    setPrefersReducedMotion(motionMedia.matches);
    motionMedia.addEventListener('change', handleMotionChange);

    const handleResize = () => setIsMobile(isMobileDevice());
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      motionMedia.removeEventListener('change', handleMotionChange);
    };
  }, []);

  useEffect(() => {
    if (isServer) return undefined;
    if (!hasWebGL || isMobile || prefersReducedMotion) {
      setWebglVisible(false);
      return undefined;
    }

    let raf = requestAnimationFrame(() => {
      raf = requestAnimationFrame(() => setWebglVisible(true));
    });
    return () => cancelAnimationFrame(raf);
  }, [hasWebGL, isMobile, prefersReducedMotion, isServer]);

  const handleMouseMove = useCallback((event) => {
    if (frameRef.current || isMobile || prefersReducedMotion) return;

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
      const strength = Math.min(0.5, Math.max(0.10, velocity * 0.55));
      lastPointer.current = { x, y, time: now };
      setRipple({ x, y, strength });
    });
  }, [isMobile, prefersReducedMotion]);

  const handleMouseLeave = useCallback(() => {
    if (frameRef.current) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = 0;
    }
    lastPointer.current = { x: 0.5, y: 0.5, time: performance.now() };
    setRipple((prev) => ({ ...prev, x: 0.5, y: 0.5, strength: 0.12 }));
  }, []);

  useEffect(() => () => {
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
  }, []);

  // Shader settings tuned for slow, soft pigment swirl behind the overlay plate.
  const distortion = isMobile ? 0.6 : 0.85;
  const swirl = isMobile ? 0.12 : 0.18;
  const speed = isMobile ? 0.3 : 0.45;
  const rippleDistortion = isMobile ? 0.8 : 1.05;
  const rippleSwirl = isMobile ? 0.25 : 0.40;
  const rippleFrequency = isMobile ? 18 : 28;

  return (
    <section
      className="atlas-hero-stage"
      aria-labelledby="hero-title"
      ref={stageRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div className="atlas-hero-canvas">
        <GradientFallback
          style={{
            opacity: hasWebGL ? (webglVisible ? 0.4 : 1) : 1,
            transition: 'opacity 900ms ease'
          }}
        />

        {hasWebGL ? (
          <>
            <MeshGradient
              colors={heroColors}
              speed={speed}
              distortion={distortion}
              swirl={swirl}
              style={{ position: 'absolute', inset: 0, opacity: webglVisible ? 0.7 : 0, transition: 'opacity 700ms ease' }}
            />
            {!isMobile && (
              <RippleMeshGradient
                colors={heroColors}
                speed={1.05}
                distortion={rippleDistortion}
                swirl={rippleSwirl}
                rippleCenter={[ripple.x, ripple.y]}
                rippleStrength={ripple.strength}
                rippleFrequency={rippleFrequency}
                style={{ position: 'absolute', inset: 0, mixBlendMode: 'multiply', opacity: webglVisible ? 0.45 : 0, transition: 'opacity 700ms ease' }}
              />
            )}
          </>
        ) : null}

        {/* Soft scrim so display type stays legible regardless of pigment drift */}
        <div className="atlas-hero-scrim" />
      </div>

      <div className="atlas-hero-content">
        <div className="plate-stamp" style={{ position: 'static', left: 'auto', top: 'auto', marginBottom: '24px' }}>
          <b>Frontispiece</b>
          <span className="barcode" />
          <span>Vol. IV · 2026</span>
        </div>

        <div className="atlas-hero-plate">
          <div className="atlas-hero-plate-text">
            <span className="kicker">{profile.title}</span>
            <h1 id="hero-title" className="display1" style={{ marginTop: '14px' }}>
              {profile.name}<br />
              <em>— a working atlas.</em>
            </h1>
            <p className="lede" style={{ marginTop: '24px' }}>{profile.summary}</p>
            <div style={{ display: 'flex', gap: '32px', marginTop: '32px', flexWrap: 'wrap' }}>
              <a className="button button--primary" href={primaryCta?.href ?? '/apps'} target={primaryCta?.external ? '_blank' : undefined} rel={primaryCta?.external ? 'noreferrer' : undefined}>
                {primaryCta?.label ?? 'Open the catalog'} →
              </a>
              <a className="button button--secondary" href={secondaryCta?.href ?? '/about'} target={secondaryCta?.external ? '_blank' : undefined} rel={secondaryCta?.external ? 'noreferrer' : undefined}>
                {secondaryCta?.label ?? 'Read the bio'} →
              </a>
            </div>
          </div>
          <aside className="atlas-hero-plate-side">
            <span className="kicker" style={{ display: 'block', marginBottom: '10px' }}>In this volume</span>
            <a href="/apps" className="atlas-hero-side-row">
              <span className="l">Apps catalog · 9 instruments</span>
            </a>
            <a href="/research" className="atlas-hero-side-row">
              <span className="l">Research · 12 papers</span>
            </a>
            <a href="/blog" className="atlas-hero-side-row">
              <span className="l">Field notes & dispatches</span>
            </a>
          </aside>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .atlas-hero-stage {
          position: relative;
          width: 100%;
          min-height: 86vh;
          padding: 88px 48px 64px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bone);
          overflow: hidden;
          border-bottom: 1px solid var(--rule);
        }

        .atlas-hero-canvas {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 0;
        }

        .atlas-hero-scrim {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse at 50% 100%, rgba(244, 240, 232, 0.55), transparent 60%),
            linear-gradient(180deg, rgba(244, 240, 232, 0.0) 30%, rgba(244, 240, 232, 0.45) 100%);
          pointer-events: none;
        }

        .atlas-hero-content {
          position: relative;
          z-index: 1;
          width: 100%;
          max-width: 1320px;
        }

        .atlas-hero-plate {
          background: var(--plate-bg);
          border: 2px solid var(--ink);
          display: grid;
          grid-template-columns: 1.4fr 1fr;
          gap: 0;
          align-items: stretch;
          min-height: 56vh;
          box-shadow: 0 24px 60px rgba(10, 10, 10, 0.18);
        }

        .atlas-hero-plate-text {
          padding: 56px 48px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 16px;
          border-right: 2px solid var(--ink);
        }

        .atlas-hero-plate-side {
          padding: 40px 32px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          background: var(--bone-2);
        }

        .atlas-hero-side-row {
          display: grid;
          grid-template-columns: 80px 1fr;
          gap: 14px;
          padding: 14px 0;
          border-bottom: 1px solid var(--rule-soft);
          color: inherit;
          text-decoration: none;
          transition: padding-left 180ms ease, background 180ms ease;
        }

        .atlas-hero-side-row:last-child {
          border-bottom: 0;
        }

        .atlas-hero-side-row:hover {
          padding-left: 6px;
        }

        .atlas-hero-side-row:hover .l {
          color: var(--terracotta);
        }

        .atlas-hero-side-row .t {
          font-family: var(--font-mono);
          font-size: 10px;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: var(--terracotta);
          font-weight: 700;
        }

        .atlas-hero-side-row .l {
          font-family: var(--font-display);
          font-weight: 500;
          font-size: 16px;
          letter-spacing: -0.005em;
          line-height: 1.2;
          color: var(--ink);
          transition: color 180ms ease;
        }

        @media (max-width: 900px) {
          .atlas-hero-stage {
            padding: 64px 24px 48px;
            min-height: auto;
          }
          .atlas-hero-plate {
            grid-template-columns: 1fr;
          }
          .atlas-hero-plate-text {
            padding: 36px 28px;
            border-right: 0;
            border-bottom: 2px solid var(--ink);
          }
          .atlas-hero-plate-side {
            padding: 28px;
          }
        }
      ` }} />
    </section>
  );
};

export default Hero;
