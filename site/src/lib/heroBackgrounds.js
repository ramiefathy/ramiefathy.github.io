/**
 * Landing-hero background variants.
 *
 * Each visit to `/` draws one of these at random (see `resolveHeroBackground`)
 * beneath the hero copy in `FieldHero.jsx`. Every variant is a self-contained
 * factory with the same shape:
 *
 *   create(pointer) → { canvas, resize(), frame(t, dt), dispose() } | null
 *
 * `pointer` is a mutable object owned by the hero (`{x, y, vx, vy, active, tap}`,
 * in CSS pixels relative to the canvas); the hero zeroes `vx`/`vy`/`tap` after
 * every frame. `null` means the browser refused the canvas context (no 2D or
 * no WebGL) and the caller should fall back to another variant.
 *
 * Design contract: ground #0b0e13, text #f2f4f6, coral #ff6b4a as the only
 * accent hue; steel (#d6e2eb) is a neutral. No second hue, ever.
 *
 * QA override: `/?hero=<id>` or `localStorage.setItem('ff_heroVariant', '<id>')`.
 */

const GROUND = [11, 14, 19];
const GROUND_CSS = '#0b0e13';
const coral = (a) => `rgba(255,107,74,${a})`;
const steel = (a) => `rgba(214,226,235,${a})`;
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const smoothstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

/* ------------------------------------------------------------------ noise */
const hash3 = (x, y, z) => { const s = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453; return s - Math.floor(s); };
const fade = (t) => t * t * (3 - 2 * t);

/** Cheap 3-D value noise in [0, 1]. Exported for tests. */
export function noise3(x, y, z) {
  const ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z);
  const fx = fade(x - ix), fy = fade(y - iy), fz = fade(z - iz);
  const n000 = hash3(ix, iy, iz), n100 = hash3(ix + 1, iy, iz), n010 = hash3(ix, iy + 1, iz), n110 = hash3(ix + 1, iy + 1, iz);
  const n001 = hash3(ix, iy, iz + 1), n101 = hash3(ix + 1, iy, iz + 1), n011 = hash3(ix, iy + 1, iz + 1), n111 = hash3(ix + 1, iy + 1, iz + 1);
  const x00 = lerp(n000, n100, fx), x10 = lerp(n010, n110, fx), x01 = lerp(n001, n101, fx), x11 = lerp(n011, n111, fx);
  return lerp(lerp(x00, x10, fy), lerp(x01, x11, fy), fz);
}

/* --------------------------------------------------------- canvas helpers */
function makeCanvas() {
  const canvas = document.createElement('canvas');
  canvas.className = 'field-hero__canvas';
  canvas.setAttribute('aria-hidden', 'true');
  return canvas;
}

function make2d(maxDpr = 2) {
  const canvas = makeCanvas();
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  const size = { w: 0, h: 0, dpr: 1 };
  const resize = () => {
    size.dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
    const r = canvas.getBoundingClientRect();
    size.w = r.width; size.h = r.height;
    canvas.width = Math.max(1, Math.round(size.w * size.dpr));
    canvas.height = Math.max(1, Math.round(size.h * size.dpr));
    ctx.setTransform(size.dpr, 0, 0, size.dpr, 0, 0);
  };
  return { canvas, ctx, size, resize };
}

function makeGl(frag, pointer, maxDpr = 1.5) {
  const canvas = makeCanvas();
  let gl = null;
  try { gl = canvas.getContext('webgl', { antialias: false, alpha: false, premultipliedAlpha: false }); } catch { gl = null; }
  if (!gl) return null;
  const compile = (type, src) => {
    const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) return null;
    return s;
  };
  const vs = compile(gl.VERTEX_SHADER, 'attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}');
  const fs = compile(gl.FRAGMENT_SHADER, frag);
  if (!vs || !fs) return null;
  const prog = gl.createProgram(); gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
  gl.useProgram(prog);
  const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'a'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const u = {
    res: gl.getUniformLocation(prog, 'u_res'),
    time: gl.getUniformLocation(prog, 'u_time'),
    pointer: gl.getUniformLocation(prog, 'u_pointer'),
    pstr: gl.getUniformLocation(prog, 'u_pstr'),
    pvel: gl.getUniformLocation(prog, 'u_pvel')
  };
  const size = { w: 0, h: 0, dpr: 1 };
  const resize = () => {
    size.dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
    const r = canvas.getBoundingClientRect();
    size.w = r.width; size.h = r.height;
    canvas.width = Math.max(1, Math.round(size.w * size.dpr));
    canvas.height = Math.max(1, Math.round(size.h * size.dpr));
    gl.viewport(0, 0, canvas.width, canvas.height);
  };
  let pstr = 0, pvx = 0, pvy = 0;
  const frame = (t) => {
    pstr = lerp(pstr, pointer.active ? 1 : 0, 0.08);
    pvx = lerp(pvx, pointer.vx, 0.25); pvy = lerp(pvy, pointer.vy, 0.25);
    gl.uniform2f(u.res, canvas.width, canvas.height);
    gl.uniform1f(u.time, t);
    gl.uniform2f(u.pointer, pointer.x * size.dpr, (size.h - pointer.y) * size.dpr);
    gl.uniform1f(u.pstr, pstr);
    gl.uniform2f(u.pvel, pvx, -pvy);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };
  const dispose = () => { const ext = gl.getExtension('WEBGL_lose_context'); if (ext) ext.loseContext(); };
  return { canvas, resize, frame, dispose };
}

const GL_COMMON = `
  precision highp float;
  uniform vec2 u_res; uniform float u_time; uniform vec2 u_pointer; uniform float u_pstr; uniform vec2 u_pvel;
  const vec3 GROUND = vec3(11.,14.,19.)/255.; const vec3 STEEL = vec3(214.,226.,235.)/255.; const vec3 CORAL = vec3(255.,107.,74.)/255.;
  float hash(vec2 p){ p = fract(p*vec2(123.34,456.21)); p += dot(p, p+45.32); return fract(p.x*p.y); }
  vec2 hash2(vec2 p){ p = vec2(dot(p,vec2(127.1,311.7)), dot(p,vec2(269.5,183.3))); return fract(sin(p)*43758.5453); }
  float noise(vec2 p){ vec2 i = floor(p), f = fract(p); vec2 u = f*f*(3.-2.*f);
    return mix(mix(hash(i), hash(i+vec2(1.,0.)), u.x), mix(hash(i+vec2(0.,1.)), hash(i+1.), u.x), u.y); }
  float fbm(vec2 p){ float v = 0., a = .5; mat2 m = mat2(1.6,1.2,-1.2,1.6); for(int i=0;i<5;i++){ v += a*noise(p); p = m*p; a *= .5; } return v; }
`;

/* ================================================================ variants */

/** 1. Sinusoidal flow field with a cursor vortex (the original hero). */
function createFlow(pointer) {
  const g = make2d(); if (!g) return null;
  const { canvas, ctx, size, resize: base } = g;
  const N = 820, R = 170; const ps = []; let time = Math.random() * 100;
  const seed = () => { ps.length = 0; for (let i = 0; i < N; i += 1) ps.push({ x: Math.random() * size.w, y: Math.random() * size.h, px: 0, py: 0, coral: Math.random() < 0.08 }); };
  const resize = () => { base(); ctx.fillStyle = GROUND_CSS; ctx.fillRect(0, 0, size.w, size.h); seed(); };
  const field = (x, y) => { const s = 0.0016; return Math.sin(y * s * 2.1 + time * 0.7) + Math.cos(x * s * 1.7 - time * 0.4) + Math.sin((x + y) * s * 0.8 + time * 0.23); };
  const frame = () => {
    time += 0.004;
    ctx.fillStyle = 'rgba(11,14,19,0.045)'; ctx.fillRect(0, 0, size.w, size.h);
    const mx = pointer.x, my = pointer.y, W = size.w, H = size.h;
    ctx.lineWidth = 1.1;
    for (const p of ps) {
      const a = field(p.x, p.y) * Math.PI; let vx = Math.cos(a), vy = Math.sin(a);
      const dx = mx - p.x, dy = my - p.y, d2 = dx * dx + dy * dy;
      if (d2 < R * R) { const d = Math.sqrt(d2) || 1; const f = (1 - d / R) * 1.7; vx += (-dy / d) * f * 2 + (dx / d) * f * 0.35; vy += (dx / d) * f * 2 + (dy / d) * f * 0.35; }
      p.px = p.x; p.py = p.y; p.x += vx * 1.55; p.y += vy * 1.55;
      if (p.x < -6) { p.x = W + 6; p.px = p.x; } if (p.x > W + 6) { p.x = -6; p.px = p.x; }
      if (p.y < -6) { p.y = H + 6; p.py = p.y; } if (p.y > H + 6) { p.y = -6; p.py = p.y; }
      if (Math.abs(p.x - p.px) < 22 && Math.abs(p.y - p.py) < 22) { ctx.strokeStyle = p.coral ? coral(0.85) : steel(0.32); ctx.beginPath(); ctx.moveTo(p.px, p.py); ctx.lineTo(p.x, p.y); ctx.stroke(); }
    }
  };
  return { canvas, resize, frame, dispose() {} };
}

/** 2. Stable-fluids solver (Stam); ambient steel currents, coral dye from the cursor. */
function createFluid(pointer) {
  const g = make2d(1.5); if (!g) return null;
  const { canvas, ctx, size, resize: base } = g;
  let W = 0, H = 0, S = 0, u, v, u0, v0, dA, dA0, dB, dB0, p, div, off, offCtx, img;
  const IX = (i, j) => i + (W + 2) * j;
  const emitters = [0, 1, 2].map((k) => ({ ph: k * 2.1, a: 0.37 + k * 0.11, b: 0.29 + k * 0.07 }));
  const alloc = () => {
    S = (W + 2) * (H + 2);
    u = new Float32Array(S); v = new Float32Array(S); u0 = new Float32Array(S); v0 = new Float32Array(S);
    dA = new Float32Array(S); dA0 = new Float32Array(S); dB = new Float32Array(S); dB0 = new Float32Array(S);
    p = new Float32Array(S); div = new Float32Array(S);
    off = document.createElement('canvas'); off.width = W; off.height = H; offCtx = off.getContext('2d'); img = offCtx.createImageData(W, H);
  };
  const resize = () => { base(); W = 180; H = clamp(Math.round(180 * size.h / Math.max(1, size.w)), 40, 140); alloc(); };
  const setBnd = (b, x) => {
    for (let i = 1; i <= W; i += 1) { x[IX(i, 0)] = b === 2 ? -x[IX(i, 1)] : x[IX(i, 1)]; x[IX(i, H + 1)] = b === 2 ? -x[IX(i, H)] : x[IX(i, H)]; }
    for (let j = 1; j <= H; j += 1) { x[IX(0, j)] = b === 1 ? -x[IX(1, j)] : x[IX(1, j)]; x[IX(W + 1, j)] = b === 1 ? -x[IX(W, j)] : x[IX(W, j)]; }
    x[IX(0, 0)] = 0.5 * (x[IX(1, 0)] + x[IX(0, 1)]); x[IX(0, H + 1)] = 0.5 * (x[IX(1, H + 1)] + x[IX(0, H)]);
    x[IX(W + 1, 0)] = 0.5 * (x[IX(W, 0)] + x[IX(W + 1, 1)]); x[IX(W + 1, H + 1)] = 0.5 * (x[IX(W, H + 1)] + x[IX(W + 1, H)]);
  };
  const linSolve = (b, x, x0, a, c, iter) => {
    const inv = 1 / c, stride = W + 2;
    for (let k = 0; k < iter; k += 1) {
      for (let j = 1; j <= H; j += 1) { let idx = IX(1, j); for (let i = 1; i <= W; i += 1, idx += 1) x[idx] = (x0[idx] + a * (x[idx - 1] + x[idx + 1] + x[idx - stride] + x[idx + stride])) * inv; }
      setBnd(b, x);
    }
  };
  const advect = (b, d, d0, uu, vv, dt) => {
    for (let j = 1; j <= H; j += 1) for (let i = 1; i <= W; i += 1) {
      const idx = IX(i, j);
      let x = i - dt * uu[idx], y = j - dt * vv[idx];
      if (x < 0.5) x = 0.5; if (x > W + 0.5) x = W + 0.5; if (y < 0.5) y = 0.5; if (y > H + 0.5) y = H + 0.5;
      const i0 = Math.floor(x), i1 = i0 + 1, j0 = Math.floor(y), j1 = j0 + 1;
      const s1 = x - i0, s0 = 1 - s1, t1 = y - j0, t0 = 1 - t1;
      d[idx] = s0 * (t0 * d0[IX(i0, j0)] + t1 * d0[IX(i0, j1)]) + s1 * (t0 * d0[IX(i1, j0)] + t1 * d0[IX(i1, j1)]);
    }
    setBnd(b, d);
  };
  const project = () => {
    const stride = W + 2;
    for (let j = 1; j <= H; j += 1) for (let i = 1; i <= W; i += 1) { const idx = IX(i, j); div[idx] = -0.5 * (u[idx + 1] - u[idx - 1] + v[idx + stride] - v[idx - stride]); p[idx] = 0; }
    setBnd(0, div); setBnd(0, p); linSolve(0, p, div, 1, 4, 14);
    for (let j = 1; j <= H; j += 1) for (let i = 1; i <= W; i += 1) { const idx = IX(i, j); u[idx] -= 0.5 * (p[idx + 1] - p[idx - 1]); v[idx] -= 0.5 * (p[idx + stride] - p[idx - stride]); }
    setBnd(1, u); setBnd(2, v);
  };
  const splat = (cx, cy, r, fx, fy, da, db) => {
    const i0 = clamp(Math.floor(cx - r), 1, W), i1 = clamp(Math.ceil(cx + r), 1, W), j0 = clamp(Math.floor(cy - r), 1, H), j1 = clamp(Math.ceil(cy + r), 1, H);
    for (let j = j0; j <= j1; j += 1) for (let i = i0; i <= i1; i += 1) { const dx = i - cx, dy = j - cy; const w = Math.exp(-(dx * dx + dy * dy) / (r * r * 0.5)); const idx = IX(i, j); u[idx] += fx * w; v[idx] += fy * w; dA[idx] += da * w; dB[idx] += db * w; }
  };
  const frame = (t) => {
    for (const e of emitters) {
      const ex = (0.5 + 0.42 * Math.sin(t * 0.11 * e.a + e.ph)) * W, ey = (0.5 + 0.38 * Math.cos(t * 0.13 * e.b + e.ph * 1.3)) * H;
      const tx = Math.cos(t * 0.11 * e.a + e.ph) * 0.42 * W * 0.11 * e.a, ty = -Math.sin(t * 0.13 * e.b + e.ph * 1.3) * 0.38 * H * 0.13 * e.b;
      const m = Math.hypot(tx, ty) || 1;
      splat(ex, ey, 4.5, (tx / m) * 0.3, (ty / m) * 0.3, 0, 0.09);
    }
    if (pointer.active) {
      const cx = pointer.x / size.w * W, cy = pointer.y / size.h * H;
      const fx = clamp(pointer.vx / size.w * W * 0.7, -6, 6), fy = clamp(pointer.vy / size.h * H * 0.7, -6, 6);
      const sp = Math.hypot(fx, fy);
      splat(cx, cy, 3.6, fx, fy, 0.12 + sp * 0.22, 0);
    }
    u0.set(u); v0.set(v);
    advect(1, u, u0, u0, v0, 1); advect(2, v, v0, u0, v0, 1);
    project();
    for (let i = 0; i < S; i += 1) { u[i] *= 0.992; v[i] *= 0.992; }
    dA0.set(dA); dB0.set(dB);
    advect(0, dA, dA0, u, v, 1); advect(0, dB, dB0, u, v, 1);
    for (let i = 0; i < S; i += 1) { dA[i] *= 0.988; dB[i] *= 0.99; }
    const d = img.data; let o = 0;
    for (let j = 1; j <= H; j += 1) for (let i = 1; i <= W; i += 1) {
      const idx = IX(i, j); const a = Math.min(1.2, dA[idx]), b = Math.min(1, dB[idx]);
      d[o++] = Math.min(255, GROUND[0] + a * 244 + b * 100);
      d[o++] = Math.min(255, GROUND[1] + a * 93 + b * 104);
      d[o++] = Math.min(255, GROUND[2] + a * 55 + b * 108);
      d[o++] = 255;
    }
    offCtx.putImageData(img, 0, 0);
    ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(off, 0, 0, size.w, size.h);
  };
  return { canvas, resize, frame, dispose() {} };
}

/** 3. Wave equation on an 18px dot lattice; cursor motion drops ripples. */
function createRipple(pointer) {
  const g = make2d(); if (!g) return null;
  const { canvas, ctx, size, resize: base } = g;
  const SP = 18; let cols = 0, rows = 0, h, hp, hn, nextDrop = 0;
  const resize = () => { base(); cols = Math.ceil(size.w / SP) + 2; rows = Math.ceil(size.h / SP) + 2; h = new Float32Array(cols * rows); hp = new Float32Array(cols * rows); hn = new Float32Array(cols * rows); };
  const drop = (cx, cy, amp, r) => { for (let j = -r; j <= r; j += 1) for (let i = -r; i <= r; i += 1) { const x = cx + i, y = cy + j; if (x < 1 || y < 1 || x >= cols - 1 || y >= rows - 1) continue; const w = Math.exp(-(i * i + j * j) / (r * 0.6 + 0.2)); h[x + cols * y] -= amp * w; } };
  const frame = (t) => {
    if (pointer.active) {
      const sp = Math.hypot(pointer.vx, pointer.vy);
      if (sp > 0.8 || pointer.tap) drop(Math.round(pointer.x / SP) + 1, Math.round(pointer.y / SP) + 1, clamp(sp * 0.035, 0.15, 0.9) + (pointer.tap ? 1.4 : 0), 2);
    }
    if (t > nextDrop) { nextDrop = t + 1.4 + Math.random() * 2.2; drop(2 + Math.floor(Math.random() * (cols - 4)), 2 + Math.floor(Math.random() * (rows - 4)), 1.3, 2); }
    for (let j = 1; j < rows - 1; j += 1) for (let i = 1; i < cols - 1; i += 1) {
      const c = i + cols * j; const lap = h[c - 1] + h[c + 1] + h[c - cols] + h[c + cols] - 4 * h[c];
      hn[c] = (2 * h[c] - hp[c] + 0.28 * lap) * 0.99;
    }
    const tmp = hp; hp = h; h = hn; hn = tmp;
    ctx.fillStyle = GROUND_CSS; ctx.fillRect(0, 0, size.w, size.h);
    for (let j = 1; j < rows - 1; j += 1) for (let i = 1; i < cols - 1; i += 1) {
      const c = i + cols * j; const val = h[c]; const mag = Math.abs(val);
      const gx = (h[c + 1] - h[c - 1]) * 5, gy = (h[c + cols] - h[c - cols]) * 5;
      const x = (i - 1) * SP + gx, y = (j - 1) * SP + gy;
      const r = 1.1 + Math.min(3.2, mag * 2.4);
      ctx.fillStyle = val > 0.28 ? coral(Math.min(1, 0.35 + val * 0.9)) : steel(0.14 + Math.min(0.7, mag * 0.8));
      ctx.beginPath(); ctx.arc(x, y, r, 0, 6.2832); ctx.fill();
    }
  };
  return { canvas, resize, frame, dispose() {} };
}

/** 4. Drifting node graph with coral pulses routed hop by hop; the cursor joins as a node. */
function createGraph(pointer) {
  const g = make2d(); if (!g) return null;
  const { canvas, ctx, size, resize: base } = g;
  const N = 150, R = 150, RC = 190, CURSOR = -1; const nodes = []; const pulses = []; let edges = []; let nextPulse = 0, nextCursorPulse = 0;
  const resize = () => { base(); nodes.length = 0; for (let i = 0; i < N; i += 1) nodes.push({ x: Math.random() * size.w, y: Math.random() * size.h, vx: (Math.random() - 0.5) * 0.25, vy: (Math.random() - 0.5) * 0.25, glow: 0 }); };
  const pos = (k) => (k === CURSOR ? pointer : nodes[k]);
  const neighbours = (k) => { const out = []; const a = pos(k); const rr = k === CURSOR ? RC : R; for (let i = 0; i < N; i += 1) { if (i === k) continue; const b = nodes[i]; if (Math.hypot(a.x - b.x, a.y - b.y) < rr) out.push(i); } return out; };
  const spawn = (from, hops) => { const nb = neighbours(from); if (!nb.length) return; pulses.push({ a: from, b: nb[Math.floor(Math.random() * nb.length)], t: 0, hops, speed: 0.016 + Math.random() * 0.012 }); };
  const frame = (t) => {
    const W = size.w, H = size.h;
    for (const n of nodes) {
      n.x += n.vx; n.y += n.vy;
      if (n.x < 0 || n.x > W) n.vx *= -1; if (n.y < 0 || n.y > H) n.vy *= -1;
      if (pointer.active) { const dx = pointer.x - n.x, dy = pointer.y - n.y, d = Math.hypot(dx, dy); if (d < RC && d > 40) { n.x += dx / d * 0.35 * (1 - d / RC); n.y += dy / d * 0.35 * (1 - d / RC); } }
      n.glow *= 0.94;
    }
    edges = [];
    for (let i = 0; i < N; i += 1) for (let j = i + 1; j < N; j += 1) { const a = nodes[i], b = nodes[j]; const dx = a.x - b.x, dy = a.y - b.y; const d2 = dx * dx + dy * dy; if (d2 < R * R) edges.push(i, j, Math.sqrt(d2)); }
    if (t > nextPulse) { nextPulse = t + 0.35; spawn(Math.floor(Math.random() * N), 4 + Math.floor(Math.random() * 5)); }
    if (pointer.active && t > nextCursorPulse) { nextCursorPulse = t + 0.22; spawn(CURSOR, 5); }
    ctx.fillStyle = GROUND_CSS; ctx.fillRect(0, 0, W, H);
    ctx.lineWidth = 1;
    for (let e = 0; e < edges.length; e += 3) { const a = nodes[edges[e]], b = nodes[edges[e + 1]]; ctx.strokeStyle = steel((1 - edges[e + 2] / R) * 0.32); ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }
    if (pointer.active) { for (const i of neighbours(CURSOR)) { const b = nodes[i]; const d = Math.hypot(pointer.x - b.x, pointer.y - b.y); ctx.strokeStyle = coral((1 - d / RC) * 0.55); ctx.beginPath(); ctx.moveTo(pointer.x, pointer.y); ctx.lineTo(b.x, b.y); ctx.stroke(); } }
    for (let k = pulses.length - 1; k >= 0; k -= 1) {
      const pl = pulses[k]; const a = pos(pl.a), b = pos(pl.b);
      if ((pl.a === CURSOR || pl.b === CURSOR) && !pointer.active) { pulses.splice(k, 1); continue; }
      pl.t += pl.speed;
      const x = lerp(a.x, b.x, pl.t), y = lerp(a.y, b.y, pl.t);
      ctx.strokeStyle = coral(0.7); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(lerp(a.x, b.x, Math.max(0, pl.t - 0.35)), lerp(a.y, b.y, Math.max(0, pl.t - 0.35))); ctx.lineTo(x, y); ctx.stroke();
      ctx.fillStyle = coral(0.12); ctx.beginPath(); ctx.arc(x, y, 9, 0, 6.2832); ctx.fill();
      ctx.fillStyle = coral(1); ctx.beginPath(); ctx.arc(x, y, 2.4, 0, 6.2832); ctx.fill();
      if (pl.t >= 1) { if (pl.b !== CURSOR) nodes[pl.b].glow = 1; const nb = neighbours(pl.b).filter((i) => i !== pl.a); if (pl.hops > 0 && nb.length) { pl.a = pl.b; pl.b = nb[Math.floor(Math.random() * nb.length)]; pl.t = 0; pl.hops -= 1; } else pulses.splice(k, 1); }
    }
    for (const n of nodes) { ctx.fillStyle = n.glow > 0.05 ? coral(0.4 + n.glow * 0.6) : steel(0.55); ctx.beginPath(); ctx.arc(n.x, n.y, 1.6 + n.glow * 2, 0, 6.2832); ctx.fill(); }
    if (pointer.active) { ctx.strokeStyle = coral(0.8); ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(pointer.x, pointer.y, 5 + Math.sin(t * 4) * 1.5, 0, 6.2832); ctx.stroke(); }
  };
  return { canvas, resize, frame, dispose() {} };
}

/** 5. Boids murmuration that streams around the cursor. */
function createBoids(pointer) {
  const g = make2d(); if (!g) return null;
  const { canvas, ctx, size, resize: base } = g;
  const N = 650, CELL = 48, PER = 46, SEP = 16, FLEE = 160;
  const bx = new Float32Array(N), by = new Float32Array(N), bvx = new Float32Array(N), bvy = new Float32Array(N); const isCoral = new Uint8Array(N);
  let gcols = 0, grows = 0, heads, next;
  const resize = () => {
    base(); gcols = Math.ceil(size.w / CELL) + 1; grows = Math.ceil(size.h / CELL) + 1; heads = new Int32Array(gcols * grows); next = new Int32Array(N);
    for (let i = 0; i < N; i += 1) { bx[i] = Math.random() * size.w; by[i] = Math.random() * size.h; const a = Math.random() * 6.28; bvx[i] = Math.cos(a) * 2; bvy[i] = Math.sin(a) * 2; isCoral[i] = Math.random() < 0.07 ? 1 : 0; }
    ctx.fillStyle = GROUND_CSS; ctx.fillRect(0, 0, size.w, size.h);
  };
  const frame = (t) => {
    const W = size.w, H = size.h;
    const gx = W * (0.5 + 0.36 * Math.sin(t * 0.17)), gy = H * (0.5 + 0.3 * Math.cos(t * 0.23));
    heads.fill(-1);
    for (let i = 0; i < N; i += 1) { const c = clamp(Math.floor(bx[i] / CELL), 0, gcols - 1) + gcols * clamp(Math.floor(by[i] / CELL), 0, grows - 1); next[i] = heads[c]; heads[c] = i; }
    for (let i = 0; i < N; i += 1) {
      let ax = 0, ay = 0, cx = 0, cy = 0, sx = 0, sy = 0, n = 0;
      const ci = clamp(Math.floor(bx[i] / CELL), 0, gcols - 1), cj = clamp(Math.floor(by[i] / CELL), 0, grows - 1);
      for (let jj = -1; jj <= 1; jj += 1) for (let ii = -1; ii <= 1; ii += 1) {
        const ccx = ci + ii, ccy = cj + jj; if (ccx < 0 || ccy < 0 || ccx >= gcols || ccy >= grows) continue;
        for (let k = heads[ccx + gcols * ccy]; k !== -1; k = next[k]) {
          if (k === i) continue; const dx = bx[k] - bx[i], dy = by[k] - by[i]; const d2 = dx * dx + dy * dy; if (d2 > PER * PER) continue;
          ax += bvx[k]; ay += bvy[k]; cx += bx[k]; cy += by[k]; n += 1;
          if (d2 < SEP * SEP) { const d = Math.sqrt(d2) + 0.01; sx -= dx / d * (SEP - d); sy -= dy / d * (SEP - d); }
        }
      }
      let vx = bvx[i], vy = bvy[i];
      if (n) { vx += (ax / n - vx) * 0.06 + (cx / n - bx[i]) * 0.004; vy += (ay / n - vy) * 0.06 + (cy / n - by[i]) * 0.004; }
      vx += sx * 0.05; vy += sy * 0.05;
      vx += (gx - bx[i]) * 0.00035; vy += (gy - by[i]) * 0.00035;
      if (pointer.active) { const dx = bx[i] - pointer.x, dy = by[i] - pointer.y; const d = Math.hypot(dx, dy); if (d < FLEE && d > 0) { const f = (1 - d / FLEE) * 1.4; vx += dx / d * f; vy += dy / d * f; } }
      if (bx[i] < 60) vx += 0.08; if (bx[i] > W - 60) vx -= 0.08; if (by[i] < 60) vy += 0.08; if (by[i] > H - 60) vy -= 0.08;
      const sp = Math.hypot(vx, vy) || 1; const target = clamp(sp, 1.4, 3.1); vx = vx / sp * target; vy = vy / sp * target;
      bvx[i] = vx; bvy[i] = vy;
    }
    ctx.fillStyle = 'rgba(11,14,19,0.32)'; ctx.fillRect(0, 0, W, H);
    ctx.lineWidth = 1.3;
    for (let i = 0; i < N; i += 1) {
      bx[i] += bvx[i]; by[i] += bvy[i];
      ctx.strokeStyle = isCoral[i] ? coral(0.95) : steel(0.68); ctx.beginPath(); ctx.moveTo(bx[i] - bvx[i] * 2.4, by[i] - bvy[i] * 2.4); ctx.lineTo(bx[i] + bvx[i] * 1.2, by[i] + bvy[i] * 1.2); ctx.stroke();
    }
  };
  return { canvas, resize, frame, dispose() {} };
}

/** 6. Marching-squares isolines over morphing 3-D noise; the cursor raises a peak. */
function createContour(pointer) {
  const g = make2d(); if (!g) return null;
  const { canvas, ctx, size, resize: base } = g;
  const CELL = 12, LEVELS = 11; let cols = 0, rows = 0, f; let peak = 0;
  const resize = () => { base(); cols = Math.ceil(size.w / CELL) + 1; rows = Math.ceil(size.h / CELL) + 1; f = new Float32Array(cols * rows); };
  // Edge table (0 top, 1 right, 2 bottom, 3 left); cases k and 15-k share edges, 5/10 are saddles.
  const T = []; T[1] = [[3, 2]]; T[2] = [[2, 1]]; T[3] = [[3, 1]]; T[4] = [[0, 1]]; T[5] = [[0, 3], [2, 1]]; T[6] = [[0, 2]]; T[7] = [[0, 3]];
  for (let k = 8; k < 15; k += 1) T[k] = T[15 - k]; T[10] = [[0, 1], [3, 2]];
  const frame = (t) => {
    peak = lerp(peak, pointer.active ? 1 : 0, 0.06);
    const z = t * 0.12, s = 0.0024;
    for (let j = 0; j < rows; j += 1) for (let i = 0; i < cols; i += 1) {
      const x = i * CELL, y = j * CELL;
      let v = noise3(x * s, y * s, z) * 0.6 + noise3(x * s * 2.1 + 7, y * s * 2.1, z * 1.3) * 0.28 + noise3(x * s * 4.3, y * s * 4.3 + 3, z * 1.7) * 0.12;
      if (peak > 0.01) { const dx = x - pointer.x, dy = y - pointer.y; v += peak * 0.9 * Math.exp(-(dx * dx + dy * dy) / (2 * 120 * 120)); }
      f[i + cols * j] = v;
    }
    ctx.fillStyle = GROUND_CSS; ctx.fillRect(0, 0, size.w, size.h);
    for (let L = 0; L < LEVELS; L += 1) {
      const lv = 0.3 + L * 0.04; const isCoral = L === 5;
      ctx.strokeStyle = isCoral ? coral(0.9) : steel(0.2 + (L % 5 === 0 ? 0.22 : 0));
      ctx.lineWidth = isCoral ? 1.3 : 1;
      ctx.beginPath();
      for (let j = 0; j < rows - 1; j += 1) for (let i = 0; i < cols - 1; i += 1) {
        const a = f[i + cols * j], b = f[i + 1 + cols * j], c = f[i + 1 + cols * (j + 1)], d = f[i + cols * (j + 1)];
        const idx = (a > lv ? 8 : 0) | (b > lv ? 4 : 0) | (c > lv ? 2 : 0) | (d > lv ? 1 : 0);
        if (idx === 0 || idx === 15) continue;
        const x0 = i * CELL, y0 = j * CELL;
        const pt = (e) => {
          switch (e) {
            case 0: return [x0 + CELL * (lv - a) / (b - a), y0];
            case 1: return [x0 + CELL, y0 + CELL * (lv - b) / (c - b)];
            case 2: return [x0 + CELL * (lv - d) / (c - d), y0 + CELL];
            default: return [x0, y0 + CELL * (lv - a) / (d - a)];
          }
        };
        for (const seg of T[idx]) { const p = pt(seg[0]), q = pt(seg[1]); ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); }
      }
      ctx.stroke();
    }
  };
  return { canvas, resize, frame, dispose() {} };
}

/** 7. Domain-warped fbm "ink smoke" (WebGL). */
function createInk(pointer) {
  return makeGl(GL_COMMON + `
    void main(){
      float asp = u_res.x/u_res.y;
      vec2 uv = gl_FragCoord.xy/u_res; vec2 p = vec2(uv.x*asp, uv.y)*2.4;
      vec2 pp = vec2(u_pointer.x/u_res.x*asp, u_pointer.y/u_res.y)*2.4;
      vec2 d = p - pp; float r = length(d);
      float infl = exp(-r*r*3.5)*u_pstr;
      vec2 vel = u_pvel/u_res.y*2.4;
      p += vec2(-d.y, d.x)*0.55*infl - vel*infl*0.25;
      float t = u_time*0.07;
      vec2 q = vec2(fbm(p+vec2(0.,t)), fbm(p+vec2(5.2,1.3)-t*0.8));
      vec2 r2 = vec2(fbm(p+4.*q+vec2(1.7,9.2)+0.15*t), fbm(p+4.*q+vec2(8.3,2.8)+0.126*t));
      float f = fbm(p+3.6*r2);
      vec3 col = GROUND;
      col = mix(col, STEEL*0.26, smoothstep(0.36, 0.80, f)*(0.5+0.5*q.x));
      float ridge = smoothstep(0.535,0.565,f)*(1.-smoothstep(0.565,0.60,f));
      col = mix(col, CORAL*0.9, ridge*(0.2+0.8*length(r2))*(0.45+0.7*infl));
      col += CORAL*infl*0.035;
      gl_FragColor = vec4(col, 1.);
    }`, pointer);
}

/** 8. Animated Voronoi epithelium with a dermoscope-style magnifier (WebGL). */
function createCells(pointer) {
  return makeGl(GL_COMMON + `
    vec3 voronoi(vec2 x, float t){
      vec2 n = floor(x), f = fract(x); vec2 mg = vec2(0.), mr = vec2(0.); float md = 8., id = 0.;
      for(int j=-1;j<=1;j++) for(int i=-1;i<=1;i++){ vec2 g = vec2(float(i),float(j)); vec2 o = hash2(n+g); o = 0.5+0.45*sin(t+6.2831*o); vec2 r = g+o-f; float d = dot(r,r); if(d<md){ md=d; mr=r; mg=g; id=o.x; } }
      md = 8.;
      for(int j=-2;j<=2;j++) for(int i=-2;i<=2;i++){ vec2 g = mg+vec2(float(i),float(j)); vec2 o = hash2(n+g); o = 0.5+0.45*sin(t+6.2831*o); vec2 r = g+o-f; if(dot(mr-r,mr-r)>1e-5) md = min(md, dot(0.5*(mr+r), normalize(r-mr))); }
      return vec3(md, length(mr), id);
    }
    void main(){
      float asp = u_res.x/u_res.y;
      vec2 uv = gl_FragCoord.xy/u_res; vec2 a = vec2(uv.x*asp, uv.y);
      vec2 pp = vec2(u_pointer.x/u_res.x*asp, u_pointer.y/u_res.y);
      vec2 d = a - pp; float r = length(d);
      float lensR = 0.21*u_pstr + 0.001;
      float inside = (1.-smoothstep(lensR-0.015, lensR, r))*u_pstr;
      float zoom = 2.4; float scale = 13.0;
      vec2 p = a*scale;
      vec2 pm = pp*scale + d*scale/zoom;
      vec2 pc = mix(p, pm, inside);
      float t = u_time*0.35;
      vec3 v = voronoi(pc, t);
      float ew = mix(0.028, 0.028/zoom*1.4, inside);
      float edge = 1.-smoothstep(0.0, ew, v.x);
      float nuc = 1.-smoothstep(0.0, 0.07, v.y);
      vec3 col = GROUND + STEEL*0.03*v.z;
      col = mix(col, STEEL*0.38, edge*0.5);
      col = mix(col, GROUND + STEEL*0.07 + STEEL*0.05*v.z, inside*(1.-edge));
      col = mix(col, CORAL, edge*inside*0.9);
      col = mix(col, CORAL*0.7, nuc*inside*0.75);
      float ring = smoothstep(lensR-0.004, lensR, r)*(1.-smoothstep(lensR, lensR+0.003, r));
      col = mix(col, CORAL, ring*0.9*u_pstr);
      gl_FragColor = vec4(col,1.);
    }`, pointer);
}

/* ================================================================ registry */

/**
 * `settleFrames` is how many frames to run before freezing under
 * `prefers-reduced-motion`, so the still frame carries the variant's texture
 * instead of an empty ground (trail-based effects need ~140 to accumulate).
 */
export const HERO_BACKGROUNDS = Object.freeze([
  { id: 'flow', name: 'Flow field', hint: 'The field responds to your cursor', settleFrames: 140, create: createFlow },
  { id: 'fluid', name: 'Fluid ink', hint: 'Drag through the field to stir it', settleFrames: 160, create: createFluid },
  { id: 'ripple', name: 'Ripple lattice', hint: 'Move to drop ripples', settleFrames: 90, create: createRipple },
  { id: 'graph', name: 'Signal graph', hint: 'Your cursor joins the network', settleFrames: 2, create: createGraph },
  { id: 'boids', name: 'Murmuration', hint: 'The flock avoids your cursor', settleFrames: 140, create: createBoids },
  { id: 'contour', name: 'Isolines', hint: 'Your cursor raises the terrain', settleFrames: 1, create: createContour },
  { id: 'ink', name: 'Ink smoke', hint: 'The ink folds around your cursor', settleFrames: 1, create: createInk },
  { id: 'cells', name: 'Cell lens', hint: 'Your cursor is the lens', settleFrames: 1, create: createCells }
]);

export const HERO_BACKGROUND_IDS = Object.freeze(HERO_BACKGROUNDS.map((v) => v.id));

const OVERRIDE_STORAGE_KEY = 'ff_heroVariant';

/**
 * QA override: `?hero=<id>` wins, then the `ff_heroVariant` localStorage flag.
 * Pure given its inputs; returns null when neither is set or storage throws.
 */
export function readHeroOverride({ search, storage } = {}) {
  if (typeof search === 'string' && search.length > 1) {
    const fromQuery = new URLSearchParams(search).get('hero');
    if (fromQuery) return fromQuery;
  }
  if (storage && typeof storage.getItem === 'function') {
    try {
      const stored = storage.getItem(OVERRIDE_STORAGE_KEY);
      if (stored) return stored;
    } catch {
      /* private mode / blocked storage: no override */
    }
  }
  return null;
}

/**
 * Pick the variant for this visit. A valid `override` id wins; otherwise one
 * is drawn uniformly from the registry using `random` (defaults to Math.random).
 */
export function resolveHeroBackground({ random = Math.random, override = null } = {}) {
  if (override) {
    const match = HERO_BACKGROUNDS.find((v) => v.id === override);
    if (match) return match;
  }
  const r = Number(random());
  const unit = Number.isFinite(r) ? clamp(r, 0, 0.999999) : 0;
  return HERO_BACKGROUNDS[Math.floor(unit * HERO_BACKGROUNDS.length)];
}
