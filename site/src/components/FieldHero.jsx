import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

/**
 * Field Console hero.
 *
 * A cursor-reactive flow field (plain 2D canvas — no WebGL, no shader deps)
 * beneath the display name, with the streaming activity console docked at the
 * foot of the stage.
 *
 * Design notes:
 *  - All styling lives in `global.css` under "FIELD CONSOLE PRIMITIVES". This
 *    island ships no inline style tag at all: `react-inline-style-hydration`
 *    forbids template-literal style tags in islands, and keeping the CSS in one
 *    place means the SSR pass already paints the hero before hydration.
 *  - The heading and copy are real SSR markup (never opacity:0), so the hero is
 *    legible with JS disabled and there is no hidden-content flash.
 *  - `prefers-reduced-motion` renders the field as a single still texture and
 *    pins the console to its first phrase.
 */

const PARTICLE_COUNT = 820;
const CURSOR_RADIUS = 170;
const CORAL = 'rgba(255, 107, 74, 0.85)';
const STEEL = 'rgba(214, 226, 235, 0.32)';
const GROUND = '#0b0e13';
const TRAIL_FADE = 'rgba(11, 14, 19, 0.045)';

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const FieldHero = ({ profile }) => {
  const canvasRef = useRef(null);
  const stageRef = useRef(null);
  const pointerRef = useRef({ x: -1e4, y: -1e4 });
  const [primaryCta, secondaryCta] = (profile.callToActions || []).slice(0, 2);

  // Memoized so the fallback branch doesn't allocate a new array (and thus
  // restart the typewriter effect below) on every render when `activity` is
  // absent; filtered so a missing/blank entry can't hand the typewriter an
  // undefined phrase to slice.
  const phrases = useMemo(() => {
    const list = profile.activity && profile.activity.length ? profile.activity : [profile.summary];
    return list.filter((entry) => typeof entry === 'string' && entry.length > 0);
  }, [profile.activity, profile.summary]);

  // Server render (and the reduced-motion path) shows the first phrase in full
  // so the console is never an empty box.
  const [typed, setTyped] = useState(phrases[0] || '');

  /* ---------------------------------------------------------------- canvas */
  useEffect(() => {
    const canvas = canvasRef.current;
    const stage = stageRef.current;
    if (!canvas || !stage) return undefined;

    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;

    const reduce = prefersReducedMotion();
    let width = 0;
    let height = 0;
    let raf = 0;
    let visible = true;
    let time = Math.random() * 100;

    const particles = [];

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = GROUND;
      ctx.fillRect(0, 0, width, height);
    };

    const seed = () => {
      particles.length = 0;
      for (let i = 0; i < PARTICLE_COUNT; i += 1) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          px: 0,
          py: 0,
          coral: Math.random() < 0.08
        });
      }
    };

    resize();
    seed();

    // Three summed sinusoids: cheap, smooth, and never repeats visibly.
    const field = (x, y) => {
      const s = 0.0016;
      return (
        Math.sin(y * s * 2.1 + time * 0.7) +
        Math.cos(x * s * 1.7 - time * 0.4) +
        Math.sin((x + y) * s * 0.8 + time * 0.23)
      );
    };

    const step = (draw) => {
      time += 0.004;
      const { x: mx, y: my } = pointerRef.current;

      for (const p of particles) {
        const angle = field(p.x, p.y) * Math.PI;
        let vx = Math.cos(angle);
        let vy = Math.sin(angle);

        // Cursor vortex: mostly tangential swirl, a little inward pull.
        const dx = mx - p.x;
        const dy = my - p.y;
        const distSq = dx * dx + dy * dy;
        if (distSq < CURSOR_RADIUS * CURSOR_RADIUS) {
          const dist = Math.sqrt(distSq) || 1;
          const force = (1 - dist / CURSOR_RADIUS) * 1.7;
          vx += (-dy / dist) * force * 2 + (dx / dist) * force * 0.35;
          vy += (dx / dist) * force * 2 + (dy / dist) * force * 0.35;
        }

        p.px = p.x;
        p.py = p.y;
        p.x += vx * 1.55;
        p.y += vy * 1.55;

        // Wrap, resetting the trail origin so no streak crosses the canvas.
        if (p.x < -6) { p.x = width + 6; p.px = p.x; }
        if (p.x > width + 6) { p.x = -6; p.px = p.x; }
        if (p.y < -6) { p.y = height + 6; p.py = p.y; }
        if (p.y > height + 6) { p.y = -6; p.py = p.y; }

        if (draw && Math.abs(p.x - p.px) < 22 && Math.abs(p.y - p.py) < 22) {
          ctx.strokeStyle = p.coral ? CORAL : STEEL;
          ctx.lineWidth = 1.1;
          ctx.beginPath();
          ctx.moveTo(p.px, p.py);
          ctx.lineTo(p.x, p.y);
          ctx.stroke();
        }
      }
    };

    if (reduce) {
      // One settled still frame — same atmosphere, zero animation.
      for (let i = 0; i < 140; i += 1) step(i > 20);
      const onResizeStill = () => { resize(); seed(); for (let i = 0; i < 140; i += 1) step(i > 20); };
      window.addEventListener('resize', onResizeStill);
      return () => window.removeEventListener('resize', onResizeStill);
    }

    const loop = () => {
      if (visible) {
        ctx.fillStyle = TRAIL_FADE;
        ctx.fillRect(0, 0, width, height);
        step(true);
      }
      raf = window.requestAnimationFrame(loop);
    };
    raf = window.requestAnimationFrame(loop);

    const onResize = () => { resize(); seed(); };
    window.addEventListener('resize', onResize);

    // Don't burn frames once the hero scrolls away.
    let observer;
    if ('IntersectionObserver' in window) {
      observer = new IntersectionObserver(
        (entries) => { visible = entries[0].isIntersecting; },
        { threshold: 0.02 }
      );
      observer.observe(canvas);
    }

    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      if (observer) observer.disconnect();
    };
  }, []);

  /* ------------------------------------------------------------ typewriter */
  useEffect(() => {
    if (prefersReducedMotion() || phrases.length === 0) return undefined;

    let phraseIndex = 0;
    let charIndex = 0;
    let deleting = false;
    let timer = 0;
    let cancelled = false;

    const tick = () => {
      if (cancelled) return;
      const phrase = phrases[phraseIndex];
      setTyped(phrase.slice(0, charIndex));

      let wait = deleting ? 26 : 52;
      if (!deleting && charIndex === phrase.length) {
        wait = 2100;
        deleting = true;
      } else if (deleting && charIndex === 0) {
        deleting = false;
        phraseIndex = (phraseIndex + 1) % phrases.length;
        wait = 420;
      } else {
        charIndex += deleting ? -1 : 1;
      }
      timer = window.setTimeout(tick, wait);
    };

    // Start from empty so the first phrase types itself in.
    charIndex = 0;
    timer = window.setTimeout(tick, 600);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [phrases]);

  /* --------------------------------------------------------------- pointer */
  const handlePointerMove = useCallback((event) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    pointerRef.current = { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }, []);

  const handlePointerLeave = useCallback(() => {
    pointerRef.current = { x: -1e4, y: -1e4 };
  }, []);

  const [firstName, ...restName] = (profile.name || '').replace(/,\s*MD$/, '').split(' ');
  const lastName = restName.join(' ');

  // Kicker and sub-copy read from profile.json rather than being hard-coded,
  // so editing the source data is enough to update the hero.
  const kicker = (profile.title || '').split(',').map((part) => part.trim()).filter(Boolean).join(' · ');
  const summary = profile.summary || '';
  const sentenceBreak = summary.indexOf('. ');
  const [leadSentence, restOfSummary] = sentenceBreak === -1
    ? [summary, '']
    : [summary.slice(0, sentenceBreak + 1), summary.slice(sentenceBreak + 1)];

  return (
    <section
      className="field-hero"
      aria-labelledby="hero-title"
      ref={stageRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      <canvas className="field-hero__canvas" ref={canvasRef} aria-hidden="true" />

      <div className="field-hero__body">
        <p className="field-hero__kicker">{kicker}</p>
        <h1 className="field-hero__name" id="hero-title">
          {firstName} <em>{lastName}</em>
          <span className="field-hero__degree">, MD</span>
        </h1>
        <p className="field-hero__sub">
          <strong>{leadSentence}</strong>{restOfSummary}
        </p>
        <div className="field-hero__cta">
          {primaryCta ? (
            <a className="button button--primary" href={primaryCta.href}>
              {primaryCta.label}
            </a>
          ) : null}
          {secondaryCta ? (
            <a className="button button--secondary" href={secondaryCta.href}>
              {secondaryCta.label}
            </a>
          ) : null}
        </div>
      </div>

      <div className="field-hero__console">
        <div className="f-console">
          <div className="f-console__head">
            <span>Activity</span>
            <span className="f-console__live">Live</span>
          </div>
          <p className="f-console__line">
            <span className="f-console__prompt">›</span>{' '}
            {profile.consoleIntro || profile.summary}
          </p>
          <p className="f-console__line">
            <span className="f-console__prompt">›</span>{' '}
            <span className="f-console__typed">{typed}</span>
            <span className="f-console__caret" aria-hidden="true" />
          </p>
        </div>
        <span className="field-hero__hint">The field responds to your cursor</span>
      </div>
    </section>
  );
};

export default FieldHero;
