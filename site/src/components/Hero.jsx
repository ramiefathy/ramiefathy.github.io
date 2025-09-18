import { MeshGradient, ShaderMount } from '@paper-design/shaders-react';
import { defaultObjectSizing, ShaderFitOptions, getShaderColorFromString, meshGradientMeta } from '@paper-design/shaders';
import { motion } from 'framer-motion';
import { memo, useEffect, useRef, useState } from 'react';
const heroColors = ['#041020', '#0b2750', '#123d78', '#1c5aa2'];

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

const Hero = ({ profile }) => {

  const [ripple, setRipple] = useState({ x: 0.5, y: 0.5, strength: 0.12 });
  const frameRef = useRef(0);
  const lastPointer = useRef({ x: 0.5, y: 0.5, time: performance.now() });

  const [primaryCta, secondaryCta] = profile.callToActions.slice(0, 2);
  const headline = `${profile.name}`;
  const emphasisWrapped = `<span class="hero-emphasis">${headline}</span>`;

  const handleMouseMove = (event) => {
    if (frameRef.current) return;

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
      const strength = Math.min(0.55, Math.max(0.12, velocity * 0.6));
      lastPointer.current = { x, y, time: now };
      setRipple({ x, y, strength });

    });
  };

  const handleMouseLeave = () => {
    if (frameRef.current) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = 0;
    }

    lastPointer.current = { x: 0.5, y: 0.5, time: performance.now() };
    setRipple({ x: 0.5, y: 0.5, strength: 0.12 });

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

          colors={heroColors}

          speed={0.6}
          distortion={1.15}
          swirl={0.24}
          style={{ position: 'absolute', inset: 0, opacity: 0.65 }}
        />

        <RippleMeshGradient
          colors={heroColors}
          speed={1.55}
          distortion={1.35}
          swirl={0.55}
          rippleCenter={[ripple.x, ripple.y]}
          rippleStrength={ripple.strength}
          rippleFrequency={32}
          style={{ position: 'absolute', inset: 0, mixBlendMode: 'screen', opacity: 0.45 }}

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
