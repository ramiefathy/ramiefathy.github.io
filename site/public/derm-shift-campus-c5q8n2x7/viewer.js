import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

const MODEL_URL = './campus-lod.dsc.gz';
const FACE_COUNT = 75083;
const CAMPUS_BOUNDS = new THREE.Box3(
  new THREE.Vector3(-117, -4.46, -78),
  new THREE.Vector3(114, 41.28, 103),
);

const PRESETS = {
  overview: { label: 'Campus overview', position: [165, 105, 175], target: [-2, 16, 12], cut: 44 },
  academic: { label: 'Academic medical center', position: [78, 52, 82], target: [0, 17, 0], cut: 44 },
  lobby: { label: 'Main lobby', position: [0, 2.1, 48], target: [0, 2.1, 22], cut: 8 },
  ed: { label: 'Emergency department', position: [0, 6.2, 48], target: [0, 5.5, 17], cut: 10 },
  icu: { label: 'Intensive care unit', position: [0, 18.4, 47], target: [0, 17.2, 3], cut: 21 },
  inpatient: { label: 'Inpatient wards', position: [0, 24.0, 48], target: [0, 22.5, 0], cut: 28 },
  'derm-floor': { label: 'Hospital dermatology floor', position: [0, 32.0, 47], target: [0, 30.5, 0], cut: 35 },
  rooftop: { label: 'Rooftop / helipad', position: [38, 51, 46], target: [0, 39.5, 0], cut: 44 },
  dermpath: { label: 'Dermatopathology laboratory', position: [127, 24, 26], target: [83, 2.5, -28], cut: 9 },
  mohs: { label: 'Derm surgery / Mohs center', position: [-132, 24, 27], target: [-84, 2.5, -25], cut: 9 },
  specialty: { label: 'Specialty dermatology clinic', position: [24, 30, 126], target: [-28, 4.8, 78], cut: 14 },
};

const canvas = document.querySelector('#viewport');
const loading = document.querySelector('#loading');
const loadingCopy = document.querySelector('#loading-copy');
const progressBar = document.querySelector('#progress-bar');
const progressLabel = document.querySelector('#progress-label');
const presetSelect = document.querySelector('#preset');
const orbitButton = document.querySelector('#orbit-mode');
const walkButton = document.querySelector('#walk-mode');
const resetButton = document.querySelector('#reset-view');
const fullscreenButton = document.querySelector('#fullscreen');
const enterFlight = document.querySelector('#enter-flight');
const cutHeight = document.querySelector('#cut-height');
const cutHeightLabel = document.querySelector('#cut-height-label');
const faceCount = document.querySelector('#face-count');
const positionLabel = document.querySelector('#position');
const locationTitle = document.querySelector('#location-title');
const modeLabel = document.querySelector('#mode-label');
const controlsPanel = document.querySelector('#controls-panel');
const collapseButton = document.querySelector('#collapse');

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
renderer.setSize(window.innerWidth, window.innerHeight, false);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.02;
renderer.localClippingEnabled = true;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111820);
scene.fog = new THREE.FogExp2(0x111820, 0.0017);

const camera = new THREE.PerspectiveCamera(52, window.innerWidth / window.innerHeight, 0.08, 1200);
const orbit = new OrbitControls(camera, canvas);
orbit.enableDamping = true;
orbit.dampingFactor = 0.075;
orbit.screenSpacePanning = true;
orbit.minDistance = 1;
orbit.maxDistance = 520;
orbit.maxPolarAngle = Math.PI * 0.495;

const pointer = new PointerLockControls(camera, document.body);
pointer.pointerSpeed = 0.75;

scene.add(new THREE.HemisphereLight(0xe6f2ff, 0x33404a, 2.5));
const keyLight = new THREE.DirectionalLight(0xfff1dc, 3.2);
keyLight.position.set(90, 130, 70);
scene.add(keyLight);
const fillLight = new THREE.DirectionalLight(0x8cb8d8, 1.4);
fillLight.position.set(-90, 55, -110);
scene.add(fillLight);

const grid = new THREE.GridHelper(300, 60, 0x3a4650, 0x242d35);
grid.position.y = -4.45;
grid.material.opacity = 0.22;
grid.material.transparent = true;
scene.add(grid);

const clippingPlane = new THREE.Plane(new THREE.Vector3(0, -1, 0), 44);
const modelRoot = new THREE.Group();
modelRoot.name = 'DermShiftCampusWebLOD';
scene.add(modelRoot);

const clock = new THREE.Clock();
const keys = new Set();
let mode = 'orbit';
let currentPreset = 'overview';
let meshesLoaded = 0;
let loadBytes = 0;

function setProgress(value, copy) {
  const pct = Math.max(0, Math.min(100, value));
  progressBar.style.width = `${pct}%`;
  progressLabel.textContent = `${Math.round(pct)}%`;
  if (copy) loadingCopy.textContent = copy;
}

async function fetchWithProgress(url) {
  const response = await fetch(url, { cache: 'force-cache' });
  if (!response.ok) throw new Error(`Model request failed (${response.status})`);
  const total = Number(response.headers.get('content-length')) || 0;
  if (!response.body) return response.arrayBuffer();
  const reader = response.body.getReader();
  const chunks = [];
  let received = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    received += value.byteLength;
    loadBytes = received;
    setProgress(total ? (received / total) * 55 : Math.min(55, received / 10000), 'Downloading campus geometry…');
  }
  const packed = new Uint8Array(received);
  let offset = 0;
  for (const chunk of chunks) { packed.set(chunk, offset); offset += chunk.byteLength; }
  return packed.buffer;
}

async function gunzip(buffer) {
  setProgress(60, 'Decompressing the spatial model…');
  if ('DecompressionStream' in window) {
    const stream = new Blob([buffer]).stream().pipeThrough(new DecompressionStream('gzip'));
    return new Response(stream).arrayBuffer();
  }
  const { ungzip } = await import('https://cdn.jsdelivr.net/npm/pako@2.1.0/+esm');
  return ungzip(new Uint8Array(buffer)).buffer;
}

function readString(view, state, length) {
  const bytes = new Uint8Array(view.buffer, view.byteOffset + state.offset, length);
  state.offset += length;
  return new TextDecoder().decode(bytes);
}

function readU16Array(view, state, length) {
  const out = new Uint16Array(length);
  for (let i = 0; i < length; i += 1) { out[i] = view.getUint16(state.offset, true); state.offset += 2; }
  return out;
}

function readU32Array(view, state, length) {
  const out = new Uint32Array(length);
  for (let i = 0; i < length; i += 1) { out[i] = view.getUint32(state.offset, true); state.offset += 4; }
  return out;
}

function parseCampus(buffer) {
  const view = new DataView(buffer);
  const state = { offset: 0 };
  const magic = readString(view, state, 4);
  if (magic !== 'DSC1') throw new Error('Unrecognized campus geometry format.');
  const meshCount = view.getUint32(state.offset, true); state.offset += 4;

  for (let meshIndex = 0; meshIndex < meshCount; meshIndex += 1) {
    const nameLength = view.getUint8(state.offset); state.offset += 1;
    const name = readString(view, state, nameLength);
    const lo = new THREE.Vector3(view.getFloat32(state.offset, true), view.getFloat32(state.offset + 4, true), view.getFloat32(state.offset + 8, true)); state.offset += 12;
    const hi = new THREE.Vector3(view.getFloat32(state.offset, true), view.getFloat32(state.offset + 4, true), view.getFloat32(state.offset + 8, true)); state.offset += 12;
    const vertexCount = view.getUint32(state.offset, true); state.offset += 4;
    const indexCount = view.getUint32(state.offset, true); state.offset += 4;
    const color = new THREE.Color(view.getFloat32(state.offset, true), view.getFloat32(state.offset + 4, true), view.getFloat32(state.offset + 8, true));
    const alpha = view.getFloat32(state.offset + 12, true); state.offset += 16;
    const metalness = view.getFloat32(state.offset, true); const roughness = view.getFloat32(state.offset + 4, true); state.offset += 8;
    const doubleSided = view.getUint8(state.offset) === 1; state.offset += 1;
    const blend = view.getUint8(state.offset) === 1; state.offset += 1;

    const quantized = readU16Array(view, state, vertexCount * 3);
    const indices = readU32Array(view, state, indexCount);
    const positions = new Float32Array(vertexCount * 3);
    const sx = (hi.x - lo.x) / 65535; const sy = (hi.y - lo.y) / 65535; const sz = (hi.z - lo.z) / 65535;
    for (let i = 0; i < vertexCount; i += 1) {
      const p = i * 3;
      positions[p] = lo.x + quantized[p] * sx;
      positions[p + 1] = lo.y + quantized[p + 1] * sy;
      positions[p + 2] = lo.z + quantized[p + 2] * sz;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setIndex(new THREE.BufferAttribute(indices, 1));
    geometry.computeVertexNormals();
    geometry.computeBoundingSphere();

    const material = new THREE.MeshStandardMaterial({
      color,
      metalness: Math.min(1, metalness),
      roughness: Math.max(0.18, Math.min(1, roughness)),
      transparent: blend || alpha < 0.999,
      opacity: alpha,
      side: doubleSided ? THREE.DoubleSide : THREE.FrontSide,
      clippingPlanes: [clippingPlane],
      clipShadows: false,
    });
    if (material.transparent) { material.depthWrite = alpha > 0.72; material.alphaToCoverage = true; }

    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = name;
    mesh.frustumCulled = true;
    modelRoot.add(mesh);
    meshesLoaded += 1;
    setProgress(64 + (meshIndex / meshCount) * 32, `Building scene ${meshIndex + 1} of ${meshCount}…`);
  }
}

function applyCutHeight(value) {
  const height = Number(value);
  clippingPlane.constant = height;
  cutHeightLabel.textContent = height >= 44 ? 'All floors' : `${height.toFixed(1)} m`;
}

function applyPreset(id, immediate = false) {
  const preset = PRESETS[id] || PRESETS.overview;
  currentPreset = id;
  locationTitle.textContent = preset.label;
  presetSelect.value = id;
  cutHeight.value = String(preset.cut);
  applyCutHeight(preset.cut);

  const startPosition = camera.position.clone();
  const startTarget = orbit.target.clone();
  const endPosition = new THREE.Vector3(...preset.position);
  const endTarget = new THREE.Vector3(...preset.target);

  if (immediate || mode === 'flight') {
    camera.position.copy(endPosition);
    camera.lookAt(endTarget);
    orbit.target.copy(endTarget);
    orbit.update();
    return;
  }

  const start = performance.now();
  const duration = 850;
  const animate = (now) => {
    const t = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - t, 3);
    camera.position.lerpVectors(startPosition, endPosition, eased);
    orbit.target.lerpVectors(startTarget, endTarget, eased);
    orbit.update();
    if (t < 1) requestAnimationFrame(animate);
  };
  requestAnimationFrame(animate);
}

function setMode(nextMode) {
  mode = nextMode;
  const isFlight = mode === 'flight';
  orbit.enabled = !isFlight;
  orbitButton.classList.toggle('is-active', !isFlight);
  walkButton.classList.toggle('is-active', isFlight);
  enterFlight.hidden = !isFlight || pointer.isLocked;
  modeLabel.textContent = isFlight ? 'Free-flight navigation' : 'Orbit navigation';
  if (!isFlight && pointer.isLocked) pointer.unlock();
}

function updateFlight(dt) {
  if (mode !== 'flight' || !pointer.isLocked) return;
  const boost = keys.has('ShiftLeft') || keys.has('ShiftRight');
  const speed = (boost ? 38 : 13) * dt;
  const forward = Number(keys.has('KeyW')) - Number(keys.has('KeyS'));
  const strafe = Number(keys.has('KeyD')) - Number(keys.has('KeyA'));
  const vertical = Number(keys.has('Space')) - Number(keys.has('KeyC'));
  if (forward) pointer.moveForward(forward * speed);
  if (strafe) pointer.moveRight(strafe * speed);
  camera.position.y += vertical * speed;
  camera.position.x = THREE.MathUtils.clamp(camera.position.x, CAMPUS_BOUNDS.min.x - 20, CAMPUS_BOUNDS.max.x + 20);
  camera.position.y = THREE.MathUtils.clamp(camera.position.y, -2, 75);
  camera.position.z = THREE.MathUtils.clamp(camera.position.z, CAMPUS_BOUNDS.min.z - 20, CAMPUS_BOUNDS.max.z + 20);
}

function resize() {
  const width = window.innerWidth; const height = window.innerHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, width < 800 ? 1.35 : 1.75));
  renderer.setSize(width, height, false);
}

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);
  updateFlight(dt);
  if (mode === 'orbit') orbit.update();
  const p = camera.position;
  positionLabel.textContent = `${p.x.toFixed(1)}, ${p.y.toFixed(1)}, ${p.z.toFixed(1)} m`;
  renderer.render(scene, camera);
}

presetSelect.addEventListener('change', () => applyPreset(presetSelect.value));
orbitButton.addEventListener('click', () => setMode('orbit'));
walkButton.addEventListener('click', () => setMode('flight'));
resetButton.addEventListener('click', () => applyPreset(currentPreset, true));
enterFlight.addEventListener('click', () => pointer.lock());
canvas.addEventListener('dblclick', () => { if (mode === 'flight') pointer.lock(); });
pointer.addEventListener('lock', () => { document.body.classList.add('is-flight'); enterFlight.hidden = true; });
pointer.addEventListener('unlock', () => { document.body.classList.remove('is-flight'); enterFlight.hidden = mode !== 'flight'; });
cutHeight.addEventListener('input', () => applyCutHeight(cutHeight.value));
fullscreenButton.addEventListener('click', async () => {
  if (!document.fullscreenElement) await document.documentElement.requestFullscreen?.();
  else await document.exitFullscreen?.();
});
collapseButton.addEventListener('click', () => {
  const collapsed = controlsPanel.classList.toggle('is-collapsed');
  collapseButton.textContent = collapsed ? '+' : '—';
  collapseButton.setAttribute('aria-expanded', String(!collapsed));
  collapseButton.setAttribute('aria-label', collapsed ? 'Expand controls' : 'Collapse controls');
});
window.addEventListener('keydown', (event) => { keys.add(event.code); if (['Space','ArrowUp','ArrowDown'].includes(event.code)) event.preventDefault(); });
window.addEventListener('keyup', (event) => keys.delete(event.code));
window.addEventListener('blur', () => keys.clear());
window.addEventListener('resize', resize);

async function init() {
  try {
    faceCount.textContent = `${FACE_COUNT.toLocaleString()} faces`;
    applyPreset('overview', true);
    const packed = await fetchWithProgress(MODEL_URL);
    const raw = await gunzip(packed);
    parseCampus(raw);
    setProgress(100, 'Campus ready.');
    setTimeout(() => loading.classList.add('is-complete'), 280);
  } catch (error) {
    console.error(error);
    loadingCopy.textContent = 'The campus model could not be loaded.';
    progressLabel.textContent = error instanceof Error ? error.message : String(error);
    progressBar.style.background = '#ff6b4a';
  }
  animate();
}

init();
