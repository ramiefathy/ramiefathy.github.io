import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { HERO_BACKGROUNDS, readHeroOverride, resolveHeroBackground } from '../lib/heroBackgrounds.js';

/**
 * Field Console hero.
 *
 * One of eight interactive backgrounds (see `lib/heroBackgrounds.js`) is drawn
 * beneath the display name on every visit, picked at random on the client, with
 * the streaming activity console docked at the foot of the stage.
 *
 * Design notes:
 *  - All styling lives in `global.css` under "FIELD CONSOLE PRIMITIVES". This
 *    island ships no inline style tag at all: `react-inline-style-hydration`
 *    forbids template-literal style tags in islands, and keeping the CSS in one
 *    place means the SSR pass already paints the hero before hydration.
 *  - The heading and copy are real SSR markup (never opacity:0), so the hero is
 *    legible with JS disabled and there is no hidden-content flash.
 *  - The variant is chosen after hydration, so the server markup is identical
 *    for every visit (no hydration mismatch); the canvas is appended to
 *    `.field-hero__stage` by the chosen variant and the hint pill updates to
 *    match it.
 *  - `prefers-reduced-motion` renders `settleFrames` frames of the variant as a
 *    single still texture and pins the console to its first phrase.
 *  - A variant that cannot get its canvas context (no WebGL) falls back to the
 *    flow field, which only needs 2D.
 *  - QA: `/?hero=<id>` or `localStorage.setItem('ff_heroVariant', '<id>')`.
 */

const DEFAULT_HINT = 'The field responds to your cursor';

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const FieldHero = ({ profile }) => {
  const stageRef = useRef(null);
  const hostRef = useRef(null);
  const pointerRef = useRef({ x: -1e4, y: -1e4, vx: 0, vy: 0, active: false, tap: false });
  const [hint, setHint] = useState(DEFAULT_HINT);
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
    const host = hostRef.current;
    if (!host) return undefined;

    const pointer = pointerRef.current;
    const override = readHeroOverride({ search: window.location.search, storage: window.localStorage });
    let variant = resolveHeroBackground({ override });
    let fx = variant.create(pointer);
    if (!fx && variant.id !== 'flow') {
      variant = HERO_BACKGROUNDS.find((v) => v.id === 'flow');
      fx = variant.create(pointer);
    }
    if (!fx) return undefined;

    host.appendChild(fx.canvas);
    setHint(variant.hint);
    fx.resize();

    const reduce = prefersReducedMotion();
    let raf = 0;
    let visible = true;
    let last = performance.now();
    const t0 = last;

    const endFrame = () => { pointer.vx = 0; pointer.vy = 0; pointer.tap = false; };

    if (reduce) {
      // One settled still frame — same atmosphere, zero animation.
      const settle = () => { for (let i = 0; i < variant.settleFrames; i += 1) { fx.frame(i / 60, 1 / 60); endFrame(); } };
      settle();
      const onResizeStill = () => { fx.resize(); settle(); };
      window.addEventListener('resize', onResizeStill);
      return () => {
        window.removeEventListener('resize', onResizeStill);
        fx.dispose();
        fx.canvas.remove();
      };
    }

    const loop = (now) => {
      if (visible) {
        const dt = Math.min(0.05, (now - last) / 1000);
        fx.frame((now - t0) / 1000, dt);
        endFrame();
      }
      last = now;
      raf = window.requestAnimationFrame(loop);
    };
    raf = window.requestAnimationFrame(loop);

    const onResize = () => fx.resize();
    window.addEventListener('resize', onResize);

    // Don't burn frames once the hero scrolls away.
    let observer;
    if ('IntersectionObserver' in window) {
      observer = new IntersectionObserver(
        (entries) => { visible = entries[0].isIntersecting; },
        { threshold: 0.02 }
      );
      observer.observe(fx.canvas);
    }

    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      if (observer) observer.disconnect();
      fx.dispose();
      fx.canvas.remove();
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
  const pointerAt = (event) => {
    const host = hostRef.current;
    if (!host) return null;
    const rect = host.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };

  const handlePointerMove = useCallback((event) => {
    const next = pointerAt(event);
    if (!next) return;
    const p = pointerRef.current;
    if (p.active) { p.vx += next.x - p.x; p.vy += next.y - p.y; }
    p.x = next.x; p.y = next.y; p.active = true;
  }, []);

  const handlePointerDown = useCallback((event) => {
    const next = pointerAt(event);
    if (!next) return;
    const p = pointerRef.current;
    p.x = next.x; p.y = next.y; p.active = true; p.tap = true;
  }, []);

  const handlePointerLeave = useCallback(() => {
    // Mutate in place: the active variant holds a reference to this object.
    Object.assign(pointerRef.current, { x: -1e4, y: -1e4, vx: 0, vy: 0, active: false, tap: false });
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
      onPointerDown={handlePointerDown}
      onPointerLeave={handlePointerLeave}
      onPointerCancel={handlePointerLeave}
    >
      <div className="field-hero__stage" ref={hostRef} aria-hidden="true" />

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
        <span className="field-hero__hint">{hint}</span>
      </div>
    </section>
  );
};

export default FieldHero;
