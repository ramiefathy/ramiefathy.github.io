import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import {
  DiseaseId,
  SkinLayerVisibility,
  TimelineId,
  ZoomLevelId
} from '../types';
import { DISEASE_PROFILES, DiseaseProfile } from '../diseaseProfiles';
import { ZOOM_LEVELS, CameraPose, getLODConfig, LODConfig } from '../zoomLevels';
import { TOURS } from '../tours';
import { useTouchGestures } from '../hooks/useTouchGestures';
import { DEFAULT_METRICS, SCALE_MM_TO_SCENE } from '../metrics';
import { PALETTES, PaletteId } from '../palettes';
import { PHOTOTYPES, DEFAULT_UV_STATE, TURNOVER_SIM_SECONDS, Phototype, UVState, DEFAULT_PH_STATE, PHState, LIFECYCLE_FRACTIONS } from '../behavior';
import { WOUND_GEOMETRY } from '../phases';
import {
  WoundMesh,
  ClotMesh,
  PlateletSystem,
  NeutrophilSystem,
  MacrophageSystem,
  VesselSystem
} from './wound';

export interface SkinSceneHandle {
  resetView: () => void;
  captureScreenshot: () => string | null;
  getRenderer: () => THREE.WebGLRenderer | null;
  setAnchorScale: (scale: number) => void;
  resetAnchor: () => void;
}

interface SkinSceneProps {
  explodeValue: number;
  visibility: SkinLayerVisibility;
  onSelectStructure: (id: string | null) => void;
  onHoverStructure?: (id: string | null, x: number, y: number) => void;
  diseaseId: DiseaseId;
  timelineId: TimelineId;
  timelineT: number;
  zoomLevelId: ZoomLevelId;
  activeTourId: string | null;
  activeTourStepIndex: number;
  clippingNormalized: number | null;
  autoRotate?: boolean;
  palette?: string;
  phototype?: Phototype;
  uvState?: UVState;
  hydration?: number;
  phValue?: number;
  collagenReduced: boolean;
  onLoadingChange?: (loading: boolean, progress: number) => void;
  cutawayEnabled?: boolean;
}

interface ModelParameters {
  epidermisThickness: number;
  papillaryHeight: number;
  dermisThickness: number;
  hypodermisThickness: number;
  flakeCount: number;
  keratinocyteCount: number;
  collagenFiberCount: number;
  adipocyteCount: number;
}

const BASE_PARAMS: ModelParameters = {
  epidermisThickness: DEFAULT_METRICS.epidermisThicknessMm * SCALE_MM_TO_SCENE,
  papillaryHeight: DEFAULT_METRICS.papillaryDermisHeightMm * SCALE_MM_TO_SCENE,
  dermisThickness: DEFAULT_METRICS.dermisThicknessMm * SCALE_MM_TO_SCENE,
  hypodermisThickness: DEFAULT_METRICS.hypodermisThicknessMm * SCALE_MM_TO_SCENE,
  flakeCount: 400,
  keratinocyteCount: 800,
  collagenFiberCount: 800,
  adipocyteCount: 200
};

function computeParameters(diseaseId: DiseaseId, lodConfig?: LODConfig, xrMultiplier: number = 1): ModelParameters {
  const profile: DiseaseProfile | undefined = DISEASE_PROFILES.find(p => p.id === diseaseId);
  const base = BASE_PARAMS;
  const p: ModelParameters = { ...base };

  // Apply LOD instance multiplier to all counts
  const instanceMultiplier = (lodConfig?.instanceMultiplier ?? 1.0) * xrMultiplier;
  p.flakeCount = Math.round(base.flakeCount * instanceMultiplier);
  p.keratinocyteCount = Math.round(base.keratinocyteCount * instanceMultiplier);
  p.collagenFiberCount = Math.round(base.collagenFiberCount * instanceMultiplier);
  p.adipocyteCount = Math.round(base.adipocyteCount * instanceMultiplier);

  if (!profile) return p;
  const o = profile.parameterOverrides;

  if (o.epidermisThicknessFactor !== undefined) {
    p.epidermisThickness = base.epidermisThickness * o.epidermisThicknessFactor;
  }
  if (o.stratumCorneumFlakeDensityFactor !== undefined) {
    p.flakeCount = Math.round(p.flakeCount * o.stratumCorneumFlakeDensityFactor);
  }
  if (o.keratinocyteSizeFactor !== undefined) {
    // approximate by changing count to reflect size/density changes
    p.keratinocyteCount = Math.round(p.keratinocyteCount * o.keratinocyteSizeFactor);
  }
  if (o.dermalCollagenDensityFactor !== undefined) {
    p.collagenFiberCount = Math.round(p.collagenFiberCount * o.dermalCollagenDensityFactor);
  }
  if (o.inflammationClusterDensity !== undefined) {
    // could be used later for inflammatory infiltrates
  }

  return p;
}

export const SkinScene = forwardRef<SkinSceneHandle, SkinSceneProps>(({
  explodeValue,
  visibility,
  onSelectStructure,
  onHoverStructure,
  diseaseId,
  timelineId,
  timelineT,
  zoomLevelId,
  activeTourId,
  activeTourStepIndex,
  clippingNormalized,
  autoRotate = false,
  palette = 'clinical',
  phototype = 3,
  uvState = DEFAULT_UV_STATE,
  hydration = 0.6,
  phValue = DEFAULT_PH_STATE.value,
  collagenReduced,
  onLoadingChange,
  cutawayEnabled = false
}, ref) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Notify parent of loading state changes
  useEffect(() => {
    onLoadingChange?.(isLoading, isLoading ? 50 : 100);
  }, [isLoading, onLoadingChange]);

  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const onHoverStructureRef = useRef(onHoverStructure);

  useEffect(() => {
    onHoverStructureRef.current = onHoverStructure;
  }, [onHoverStructure]);

  // Expose resetView and captureScreenshot to parent
  useImperativeHandle(ref, () => ({
    resetView: () => {
      const camera = cameraRef.current;
      const controls = controlsRef.current;
      if (!camera || !controls) return;

      const macro = ZOOM_LEVELS.find(z => z.id === 'macro');
      if (!macro) return;

      const targetPosition = new THREE.Vector3(...macro.camera.position);
      const targetLookAt = new THREE.Vector3(...macro.camera.target);
      const startPos = camera.position.clone();
      const startTarget = controls.target.clone();
      const duration = 600;
      const startTime = Date.now();

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const t = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - t, 3);
        camera.position.lerpVectors(startPos, targetPosition, eased);
        controls.target.lerpVectors(startTarget, targetLookAt, eased);
        controls.update();
        if (t < 1) requestAnimationFrame(animate);
      };
      animate();
    },
    captureScreenshot: () => {
      const renderer = rendererRef.current;
      const scene = sceneRef.current;
      const camera = cameraRef.current;
      if (!renderer || !scene || !camera) return null;

      // Render once to ensure latest frame
      renderer.render(scene, camera);
      return renderer.domElement.toDataURL('image/png');
    },
    getRenderer: () => rendererRef.current,
    setAnchorScale: (scale: number) => {
      const anchor = anchorGroupRef.current;
      if (!anchor) return;
      anchor.scale.setScalar(scale);
      anchor.updateMatrixWorld(true);
    },
    resetAnchor: () => {
      const anchor = anchorGroupRef.current;
      if (!anchor) return;
      anchor.position.set(0, 0, 0);
      anchor.quaternion.identity();
      anchor.updateMatrixWorld(true);
    }
  }), []);

  const epidermisGroupRef = useRef<THREE.Group | null>(null);
  const dermisGroupRef = useRef<THREE.Group | null>(null);
  const hypodermisGroupRef = useRef<THREE.Group | null>(null);

  const baseLayerPositionsRef = useRef<{ epidermis: number; dermis: number; hypodermis: number } | null>(null);

  const structuresRef = useRef<{
    hair: THREE.Group | null;
    sweat: THREE.Group | null;
    collagen: THREE.InstancedMesh | null;
    nerves: THREE.Group | null;
    vessels: THREE.Object3D[];
  }>({
    hair: null,
    sweat: null,
    collagen: null,
    nerves: null,
    vessels: []
  });
  const keratinocyteMeshRef = useRef<THREE.InstancedMesh | null>(null);
  const keratinocyteBaseRef = useRef<{
    positions: Float32Array;
    scales: Float32Array;      // visible scales (may start reduced near wound)
    fullScales: Float32Array;  // natural scales for restoration during healing
    count: number;
    epiHeight: number;
  } | null>(null);
  const stratumCorneumMatRef = useRef<THREE.MeshPhysicalMaterial | null>(null);
  const collagenBaseCountRef = useRef<number>(BASE_PARAMS.collagenFiberCount);
  const keratinocyteAgeRef = useRef<Float32Array | null>(null);
  const melanosomeMeshRef = useRef<THREE.InstancedMesh | null>(null);
  const melanocyteMeshRef = useRef<THREE.InstancedMesh | null>(null);

  const materialsRef = useRef<THREE.Material[]>([]);
  const paletteRef = useRef<PaletteId>('clinical');
  const clippingPlaneRef = useRef<THREE.Plane | null>(null);
  const cutawayPlaneRef = useRef<THREE.Plane | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const woundMeshRef = useRef<WoundMesh | null>(null);
  const epidermisMatRef = useRef<THREE.MeshPhysicalMaterial | null>(null);

  // Inflammatory system refs (Milestone 2)
  const clotMeshRef = useRef<ClotMesh | null>(null);
  const plateletSystemRef = useRef<PlateletSystem | null>(null);
  const neutrophilSystemRef = useRef<NeutrophilSystem | null>(null);
  const macrophageSystemRef = useRef<MacrophageSystem | null>(null);
  const vesselSystemRef = useRef<VesselSystem | null>(null);
  const keratinocyteFrontRef = useRef<THREE.Mesh | null>(null);
  const lastFrameTimeRef = useRef<number>(performance.now());
  const woundSystemsGroupRef = useRef<THREE.Group | null>(null);
  const anchorGroupRef = useRef<THREE.Group | null>(null);
  const isXrPresentingRef = useRef<boolean>(false);

  // WebXR hit-test state for AR placement
  const xrRefSpaceRef = useRef<XRReferenceSpace | null>(null);
  const viewerSpaceRef = useRef<XRReferenceSpace | null>(null);
  const hitTestSourceRef = useRef<XRHitTestSource | null>(null);
  const lastHitMatrixRef = useRef<THREE.Matrix4 | null>(null);
  const reticleRef = useRef<THREE.Mesh | null>(null);

  // Refs to access current props in animation loop without re-renders
  const timelineIdRef = useRef(timelineId);
  const timelineTRef = useRef(timelineT);
  const uvStateRef = useRef<UVState>(DEFAULT_UV_STATE);
  const phRef = useRef<PHState>(DEFAULT_PH_STATE);

  // Geometry dimension refs for access across functions
  const skinPatchWidthRef = useRef<number>(DEFAULT_METRICS.skinPatchWidthMm * SCALE_MM_TO_SCENE);
  const skinPatchDepthRef = useRef<number>(DEFAULT_METRICS.skinPatchDepthMm * SCALE_MM_TO_SCENE);

  // Keep timeline refs in sync with props for animation loop access
  useEffect(() => {
    timelineIdRef.current = timelineId;
    timelineTRef.current = timelineT;
  }, [timelineId, timelineT]);

  useEffect(() => {
    uvStateRef.current = uvState;
  }, [uvState]);

  useEffect(() => {
    phRef.current = { value: phValue };
  }, [phValue]);

  // Keep palette ref in sync and rebuild colors on change
  useEffect(() => {
    if (palette && paletteRef.current !== palette) {
      paletteRef.current = palette as PaletteId;
      // Rebuild anatomy with new palette
      const lodConfig = getLODConfig(zoomLevelId);
      const params = computeParameters(diseaseId, lodConfig, isXrPresentingRef.current ? 0.6 : 1);
      clearAnatomy();
      buildAnatomy(params);
      applyExplode(explodeValue);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [palette]);

  const structureRootsRef = useRef<Record<string, THREE.Object3D>>({});
  const hoveredIdRef = useRef<string | null>(null);
  const onSelectStructureRef = useRef(onSelectStructure);
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const mouseRef = useRef<THREE.Vector2>(new THREE.Vector2());

  useEffect(() => {
    onSelectStructureRef.current = onSelectStructure;
  }, [onSelectStructure]);

  // Raycasting helper for picking structures at screen coordinates
  const pickStructureAtCoords = useCallback((clientX: number, clientY: number): string | null => {
    if (!rendererRef.current || !cameraRef.current || !sceneRef.current) return null;
    const rect = rendererRef.current.domElement.getBoundingClientRect();
    mouseRef.current.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    mouseRef.current.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
    const intersects = raycasterRef.current.intersectObjects(sceneRef.current.children, true);
    for (const i of intersects) {
      const obj: any = i.object;
      const type =
        obj.userData?.type ||
        obj.userData?.parentType ||
        obj.parent?.userData?.type;
      if (type) {
        return type as string;
      }
    }
    return null;
  }, []);

  // Ray-based picking (for XR controllers/hands)
  const pickStructureFromRay = useCallback((origin: THREE.Vector3, direction: THREE.Vector3): string | null => {
    if (!sceneRef.current) return null;
    const raycaster = raycasterRef.current;
    raycaster.ray.origin.copy(origin);
    raycaster.ray.direction.copy(direction).normalize();
    const intersects = raycaster.intersectObjects(sceneRef.current.children, true);
    for (const i of intersects) {
      const obj: any = i.object;
      const type =
        obj.userData?.type ||
        obj.userData?.parentType ||
        obj.parent?.userData?.type;
      if (type) {
        return type as string;
      }
    }
    return null;
  }, []);

  // Touch gesture handlers
  const handleTouchTap = useCallback((x: number, y: number) => {
    const id = pickStructureAtCoords(x, y);
    onSelectStructureRef.current?.(id ?? null);
  }, [pickStructureAtCoords]);

  const handleDoubleTap = useCallback(() => {
    // Double tap resets the view
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!camera || !controls) return;

    const macro = ZOOM_LEVELS.find(z => z.id === 'macro');
    if (!macro) return;

    const targetPosition = new THREE.Vector3(...macro.camera.position);
    const targetLookAt = new THREE.Vector3(...macro.camera.target);
    const startPos = camera.position.clone();
    const startTarget = controls.target.clone();
    const duration = 600;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const t = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      camera.position.lerpVectors(startPos, targetPosition, eased);
      controls.target.lerpVectors(startTarget, targetLookAt, eased);
      controls.update();
      if (t < 1) requestAnimationFrame(animate);
    };
    animate();
  }, []);

  const handleLongPress = useCallback((x: number, y: number) => {
    // Long press shows hover info at the position
    const id = pickStructureAtCoords(x, y);
    if (id) {
      onHoverStructureRef.current?.(id, x, y);
      // Clear after 2 seconds
      setTimeout(() => {
        onHoverStructureRef.current?.(null, 0, 0);
      }, 2000);
    }
  }, [pickStructureAtCoords]);

  // Initialize touch gestures
  const touchHandlers = useTouchGestures({
    onTap: handleTouchTap,
    onDoubleTap: handleDoubleTap,
    onLongPress: handleLongPress
  });

  const applyClippingToMaterial = (mat: THREE.Material) => {
    const plane = clippingPlaneRef.current;
    if (plane) {
      (mat as any).clippingPlanes = [plane];
      (mat as any).clipShadows = true;
    }
    materialsRef.current.push(mat);
    return mat;
  };

  const applyCollagenDensity = useCallback((reduced: boolean, tId: TimelineId, tVal: number) => {
    const mesh = structuresRef.current.collagen;
    if (!mesh) return;
    const mat = mesh.material as THREE.MeshPhysicalMaterial;
    const baseCount = collagenBaseCountRef.current || (mesh as any).count || mesh.instanceMatrix.count;
    const clampedT = THREE.MathUtils.clamp(tVal, 0, 1);
    const woundOpacity = 0.15 + (clampedT * 0.2);

    if (reduced) {
      mesh.count = Math.max(50, Math.round(baseCount * 0.35));
      mat.opacity = tId === 'wound_healing' ? Math.min(woundOpacity, 0.25) : 0.35;
      mat.transparent = true;
    } else {
      mesh.count = baseCount;
      if (tId === 'wound_healing') {
        mat.opacity = woundOpacity;
        mat.transparent = true;
      } else {
        mat.opacity = 1.0;
        mat.transparent = false;
      }
    }
    mesh.instanceMatrix.needsUpdate = true;
  }, []);

  const updateEpidermalHealing = useCallback((t: number, melaninBoost: number, hydrationVal: number, dt: number) => {
    const mesh = keratinocyteMeshRef.current;
    const base = keratinocyteBaseRef.current;
    const ages = keratinocyteAgeRef.current;
    if (!mesh || !base) return;

    const { positions, scales, fullScales, count, epiHeight } = base;
    const halfWidth = woundMeshRef.current ? woundMeshRef.current.getCurrentWidth(t) / 2 : 0.75;
    const halfLength = halfWidth * 1.5;

    // Migration/proliferation timing
    const migrateStart = 0.25;
    const migrateEnd = 0.65;
    const sealStart = 0.45;
    const sealEnd = 0.85;
    const migration = THREE.MathUtils.clamp((t - migrateStart) / (migrateEnd - migrateStart), 0, 1);
    const sealing = THREE.MathUtils.clamp((t - sealStart) / (sealEnd - sealStart), 0, 1);

    const tmp = new THREE.Object3D();
    const agesArr = ages ?? new Float32Array(count);
    const phFactor = 1 + (phRef.current.value - 5.5) * 0.08; // alkaline speeds, acidic slows
    const turnoverSeconds = TURNOVER_SIM_SECONDS * (1 - 0.25 * (hydrationVal - 0.5)) / phFactor;
    const basalFrac = LIFECYCLE_FRACTIONS.basal;
    const spinousFrac = basalFrac + LIFECYCLE_FRACTIONS.spinous;
    const granularFrac = spinousFrac + LIFECYCLE_FRACTIONS.granular;

    for (let i = 0; i < count; i++) {
      // Advance age
      if (agesArr.length === count && turnoverSeconds > 0) {
        let nextAge = agesArr[i] + dt / turnoverSeconds;
        if (nextAge >= 1) {
          // Respawn as new basal cell
          nextAge = nextAge % 1;
          // Reset position near basal layer
          positions[i * 3] = (Math.random() - 0.5) * (skinPatchWidthRef.current * 0.9);
          positions[i * 3 + 1] = -epiHeight / 2 + Math.random() * (epiHeight * 0.15);
          positions[i * 3 + 2] = (Math.random() - 0.5) * (skinPatchDepthRef.current * 0.9);
        }
        agesArr[i] = nextAge;
      }
      const age = agesArr.length === count ? agesArr[i] : Math.random();
      const phase = age < basalFrac ? 0 : age < spinousFrac ? 1 : age < granularFrac ? 2 : 3;

      const bx = positions[i * 3];
      const by = positions[i * 3 + 1];
      const bz = positions[i * 3 + 2];
      const visibleBaseScale = scales[i];
      const naturalScale = fullScales[i];

      // Is this cell near the wound gap?
      const nx = bx / (halfWidth * 1.25);
      const nz = bz / (halfLength * 1.25);
      const nearGap = Math.abs(nx) <= 1 && Math.abs(nz) <= 1;

      let px = bx;
      let pz = bz;
      let py = by;
      let scale = visibleBaseScale;

      if (nearGap) {
        // Migrate toward center and slightly upward
        px = THREE.MathUtils.lerp(bx, 0, migration * 0.85);
        pz = THREE.MathUtils.lerp(bz, 0, migration * 0.85);
        py = THREE.MathUtils.lerp(by, epiHeight * 0.3, migration * 0.6);
        // Repopulate density as wound seals (start from reduced scale, restore to natural)
        scale = THREE.MathUtils.lerp(visibleBaseScale, naturalScale, sealing);
      }
      // Outside gap: allow mild maturation thickening over time
      scale = nearGap ? scale : naturalScale * (0.85 + 0.25 * sealing);

      // Lifecycle vertical drift: age drives slight upward offset
      const lifeOffset = age * epiHeight * 0.4;
      py = THREE.MathUtils.clamp(py + lifeOffset, -epiHeight / 2, epiHeight / 2);

      // Corneocyte thinning near end of cycle
      if (age > 0.8) {
        scale *= THREE.MathUtils.lerp(1, 0.6, (age - 0.8) / 0.2);
      }

      // Phase-specific tinting (subtle): granular slightly brighter, corneocyte slightly desaturated
      let phaseTint = 1;
      if (phase === 2) phaseTint = 1.05;
      if (phase === 3) phaseTint = 0.92;

      tmp.position.set(px, py, pz);
      tmp.rotation.set(0, 0, 0);
      // Apply melanin darkening as scale tint proxy (slightly increase size to hint density)
      const melaninScale = 1 + melaninBoost * 0.08;
      tmp.scale.set(scale * melaninScale * phaseTint, scale * melaninScale * phaseTint, scale * melaninScale * phaseTint);
      tmp.updateMatrix();
      mesh.setMatrixAt(i, tmp.matrix);
    }

    mesh.instanceMatrix.needsUpdate = true;

    if (keratinocyteAgeRef.current && keratinocyteAgeRef.current !== agesArr) {
      keratinocyteAgeRef.current = agesArr;
    }

    // Stratum corneum regeneration (global opacity)
    if (stratumCorneumMatRef.current) {
      const scOpacity = THREE.MathUtils.lerp(0.35, 0.9, sealing) * (0.9 - 0.2 * (1 - hydrationVal));
      stratumCorneumMatRef.current.opacity = scOpacity;
      stratumCorneumMatRef.current.transparent = true;
    }

    // Melanosome packet visibility scales with melanin boost
    if (melanosomeMeshRef.current) {
      const packetScale = THREE.MathUtils.clamp(melaninBoost * 0.6, 0.02, 0.6);
      const melDummy = new THREE.Object3D();
      const count = melanosomeMeshRef.current.count;
      for (let i = 0; i < count; i++) {
        melanosomeMeshRef.current.getMatrixAt(i, melDummy.matrix);
        melDummy.scale.setScalar(packetScale);
        melDummy.updateMatrix();
        melanosomeMeshRef.current.setMatrixAt(i, melDummy.matrix);
      }
      melanosomeMeshRef.current.instanceMatrix.needsUpdate = true;
    }
  }, []);

  const clearAnatomy = () => {
    const groups = [epidermisGroupRef.current, dermisGroupRef.current, hypodermisGroupRef.current];
    groups.forEach(group => {
      if (!group) return;
      group.traverse(child => {
        const mesh = child as any;
        if (mesh.isMesh || mesh.isInstancedMesh) {
          if (mesh.geometry) {
            mesh.geometry.dispose();
          }
          if (mesh.material) {
            if (Array.isArray(mesh.material)) {
              mesh.material.forEach((m: THREE.Material) => m.dispose());
            } else {
              (mesh.material as THREE.Material).dispose();
            }
          }
        }
      });
      while (group.children.length) {
        group.remove(group.children[0]);
      }
    });

    materialsRef.current = [];
    structuresRef.current = {
      hair: null,
      sweat: null,
      collagen: null,
      nerves: null,
      vessels: []
    };
    keratinocyteMeshRef.current = null;
    keratinocyteBaseRef.current = null;
    stratumCorneumMatRef.current = null;
    structureRootsRef.current = {};
  };

  const buildAnatomy = (params: ModelParameters) => {
    const epidermisGroup = epidermisGroupRef.current;
    const dermisGroup = dermisGroupRef.current;
    const hypodermisGroup = hypodermisGroupRef.current;
    if (!epidermisGroup || !dermisGroup || !hypodermisGroup) return;

    const width = DEFAULT_METRICS.skinPatchWidthMm * SCALE_MM_TO_SCENE;
    const depth = DEFAULT_METRICS.skinPatchDepthMm * SCALE_MM_TO_SCENE;

    const epiH = params.epidermisThickness;
    const papH = Math.min(params.papillaryHeight, params.dermisThickness * 0.5);
    const derH = params.dermisThickness;
    const hypoH = params.hypodermisThickness;

    // Base positions (before explosion)
    const dermisY = 0;
    const epidermisY = derH / 2 + epiH / 2;
    const hypodermisY = -derH / 2 - hypoH / 2;

    epidermisGroup.position.set(0, epidermisY, 0);
    dermisGroup.position.set(0, dermisY, 0);
    hypodermisGroup.position.set(0, hypodermisY, 0);

    baseLayerPositionsRef.current = {
      epidermis: epidermisY,
      dermis: dermisY,
      hypodermis: hypodermisY
    };

    // --- Epidermis base ---
    const paletteCfg = PALETTES[paletteRef.current];

    const epidermisMat = applyClippingToMaterial(
      new THREE.MeshPhysicalMaterial({
        color: paletteCfg.epidermis.color,
        roughness: paletteCfg.epidermis.roughness,
        metalness: paletteCfg.epidermis.metalness,
        transparent: true,
        opacity: paletteCfg.epidermis.opacity ?? 0.35,
        transmission: paletteCfg.epidermis.transmission ?? 0,
        thickness: paletteCfg.epidermis.thickness ?? 0.5,
        side: THREE.DoubleSide,
        depthWrite: false
      })
    );
    // Add dynamic wound cutout mask & epidermal micro-relief
    const woundUniforms = {
      woundCenter: { value: new THREE.Vector3(0, 0, 0) },
      woundHalfWidth: { value: 0.75 },
      woundHalfLength: { value: 0.6 },
      woundFalloff: { value: 0.1 },
      reliefScale: { value: 0.08 },
      reliefFreq: { value: 8.0 }
    };
    (epidermisMat as any).userData.woundUniforms = woundUniforms;
    epidermisMat.onBeforeCompile = shader => {
      shader.uniforms.woundCenter = woundUniforms.woundCenter;
      shader.uniforms.woundHalfWidth = woundUniforms.woundHalfWidth;
      shader.uniforms.woundHalfLength = woundUniforms.woundHalfLength;
      shader.uniforms.woundFalloff = woundUniforms.woundFalloff;
      shader.uniforms.reliefScale = woundUniforms.reliefScale;
      shader.uniforms.reliefFreq = woundUniforms.reliefFreq;
      shader.vertexShader = shader.vertexShader
        .replace(
          'varying vec3 vViewPosition;',
          'varying vec3 vViewPosition;\nvarying vec3 vWorldPosition;'
        )
        .replace(
          '#include <worldpos_vertex>',
          '#include <worldpos_vertex>\n  vWorldPosition = worldPosition.xyz;'
        );
      shader.fragmentShader = shader.fragmentShader
        .replace(
          'void main() {',
          `varying vec3 vWorldPosition;
           uniform vec3 woundCenter;
           uniform float woundHalfWidth;
           uniform float woundHalfLength;
           uniform float woundFalloff;
           uniform float reliefScale;
           uniform float reliefFreq;
           void main() {`
        )
        .replace(
          '#include <alphatest_fragment>',
          `
            vec2 d = vec2(
              (vWorldPosition.x - woundCenter.x) / woundHalfWidth,
              (vWorldPosition.z - woundCenter.z) / woundHalfLength
            );
            float r = length(d); // 0 center, 1 rim
            float hole = smoothstep(1.0 - woundFalloff, 1.0, r);
            // Micro-relief (simple sinusoidal along Langer-like direction X)
            float relief = sin(vWorldPosition.x * reliefFreq) * cos(vWorldPosition.z * reliefFreq) * reliefScale;
            // Slight normal perturbation via rough alpha adjustment
            float reliefMask = 1.0 + relief * 0.15;
            diffuseColor.a *= hole;
            diffuseColor.rgb *= reliefMask;
          #include <alphatest_fragment>`
        );
    };
    epidermisMat.needsUpdate = true;
    const epidermisGeo = new THREE.BoxGeometry(width, epiH, depth);
    const epidermisMesh = new THREE.Mesh(epidermisGeo, epidermisMat);
    epidermisMatRef.current = epidermisMat as THREE.MeshPhysicalMaterial;
    epidermisMesh.receiveShadow = true;
    epidermisMesh.castShadow = false;
    epidermisMesh.userData.type = 'epidermis';
    epidermisGroup.add(epidermisMesh);

    // Stratum corneum flakes
    const flakeGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.05, 6);
    const flakeMat = applyClippingToMaterial(
      new THREE.MeshPhysicalMaterial({
        color: 0xfef9c3,
        roughness: 0.6,
        metalness: 0,
        transparent: true,
        opacity: 0.9
      })
    );
    stratumCorneumMatRef.current = flakeMat as THREE.MeshPhysicalMaterial;
    const flakeMesh = new THREE.InstancedMesh(flakeGeo, flakeMat, params.flakeCount);
    flakeMesh.castShadow = false;
    flakeMesh.receiveShadow = false;
    flakeMesh.userData.type = 'stratum_corneum';
    structureRootsRef.current['stratum_corneum'] = flakeMesh;
    const dummy = new THREE.Object3D();
    for (let i = 0; i < params.flakeCount; i++) {
      dummy.position.set(
        (Math.random() - 0.5) * width,
        epiH / 2 * 0.9 + Math.random() * 0.2,
        (Math.random() - 0.5) * depth
      );
      dummy.rotation.set(0, Math.random() * Math.PI * 2, 0);
      const s = 0.7 + Math.random() * 0.5;
      dummy.scale.set(s, s, s);
      dummy.updateMatrix();
      flakeMesh.setMatrixAt(i, dummy.matrix);
    }
    flakeMesh.instanceMatrix.needsUpdate = true;
    epidermisGroup.add(flakeMesh);

    // Keratinocytes
    const cellGeo = new THREE.IcosahedronGeometry(0.25, 0);
    const cellMat = applyClippingToMaterial(
      new THREE.MeshPhysicalMaterial({
        color: 0xffcfb0,
        roughness: 0.4,
        metalness: 0,
        transmission: 0.2,
        thickness: 0.5
      })
    );
    const cellMesh = new THREE.InstancedMesh(cellGeo, cellMat, params.keratinocyteCount);
    cellMesh.castShadow = true;
    cellMesh.receiveShadow = true;
    cellMesh.userData.type = 'keratinocytes';
    structureRootsRef.current['keratinocytes'] = cellMesh;
    keratinocyteMeshRef.current = cellMesh;
    const kPositions = new Float32Array(params.keratinocyteCount * 3);
    const kScales = new Float32Array(params.keratinocyteCount);
    const kFullScales = new Float32Array(params.keratinocyteCount);
    const kAges = new Float32Array(params.keratinocyteCount);
    const kPhase = new Uint8Array(params.keratinocyteCount); // 0 basal,1 spinous,2 granular,3 corneocyte
    const gapHalfWidth = WOUND_GEOMETRY.initialWidth / 2; // 0.75 default
    const gapHalfLength = gapHalfWidth * 1.5;
    const dummy2 = new THREE.Object3D();
    for (let i = 0; i < params.keratinocyteCount; i++) {
      const layerRand = Math.random();
      const y = -epiH / 2 + layerRand * epiH * 0.9;
      const px = (Math.random() - 0.5) * (width * 0.9);
      const pz = (Math.random() - 0.5) * (depth * 0.9);
      dummy2.position.set(px, y, pz);
      const s = 0.7 + layerRand * 0.4;

      // If the cell sits over the wound area, start it smaller to accentuate the defect
      const inGap = Math.abs(px) < gapHalfWidth && Math.abs(pz) < gapHalfLength;
      const visibleScale = inGap ? s * (0.2 + Math.random() * 0.2) : s;

      dummy2.scale.set(visibleScale, visibleScale, visibleScale);
      dummy2.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );
      dummy2.updateMatrix();
      cellMesh.setMatrixAt(i, dummy2.matrix);
      kPositions[i * 3] = dummy2.position.x;
      kPositions[i * 3 + 1] = dummy2.position.y;
      kPositions[i * 3 + 2] = dummy2.position.z;
      kScales[i] = visibleScale;
      kFullScales[i] = s;
      kAges[i] = Math.random(); // spread across lifecycle
    }
    cellMesh.instanceMatrix.needsUpdate = true;
    keratinocyteBaseRef.current = {
      positions: kPositions,
      scales: kScales,
      fullScales: kFullScales,
      count: params.keratinocyteCount,
      epiHeight: epiH
    };
    keratinocyteAgeRef.current = kAges;
    epidermisGroup.add(cellMesh);

    // Melanocytes (basal layer, sparse)
    const melanocyteGeo = new THREE.SphereGeometry(0.18, 8, 6);
    const melanocyteMat = applyClippingToMaterial(
      new THREE.MeshPhysicalMaterial({
        color: 0x3b2f2f,
        roughness: 0.5,
        metalness: 0,
        transparent: true,
        opacity: 0.9
      })
    );
    const melanocyteCount = 80;
    const melanocyteMesh = new THREE.InstancedMesh(melanocyteGeo, melanocyteMat, melanocyteCount);
    const mDummy = new THREE.Object3D();
    for (let i = 0; i < melanocyteCount; i++) {
      mDummy.position.set(
        (Math.random() - 0.5) * (width * 0.85),
        -epiH / 2 + 0.05,
        (Math.random() - 0.5) * (depth * 0.85)
      );
      const s = 0.9 + Math.random() * 0.2;
      mDummy.scale.set(s, s, s);
      mDummy.updateMatrix();
      melanocyteMesh.setMatrixAt(i, mDummy.matrix);
    }
    melanocyteMesh.instanceMatrix.needsUpdate = true;
    melanocyteMeshRef.current = melanocyteMesh;
    epidermisGroup.add(melanocyteMesh);

    // Melanosomes (packets) - will animate scale based on melanin boost
    const melanosomeGeo = new THREE.SphereGeometry(0.08, 6, 4);
    const melanosomeMat = applyClippingToMaterial(
      new THREE.MeshPhysicalMaterial({
        color: 0x1e1b1b,
        roughness: 0.3,
        metalness: 0,
        transparent: true,
        opacity: 0.85
      })
    );
    const melanosomeCount = 200;
    const melanosomeMesh = new THREE.InstancedMesh(melanosomeGeo, melanosomeMat, melanosomeCount);
    const melDummy = new THREE.Object3D();
    for (let i = 0; i < melanosomeCount; i++) {
      melDummy.position.set(
        (Math.random() - 0.5) * (width * 0.7),
        -epiH / 2 + Math.random() * (epiH * 0.4),
        (Math.random() - 0.5) * (depth * 0.7)
      );
      melDummy.scale.setScalar(0.01); // start tiny
      melDummy.updateMatrix();
      melanosomeMesh.setMatrixAt(i, melDummy.matrix);
    }
    melanosomeMesh.instanceMatrix.needsUpdate = true;
    melanosomeMeshRef.current = melanosomeMesh;
    epidermisGroup.add(melanosomeMesh);

    // --- Dermis split: papillary + reticular ---
    // Papillary dermis (top): subtle relief via displaced top vertices
    const papillaryMat = applyClippingToMaterial(
      new THREE.MeshPhysicalMaterial({
        color: paletteCfg.papillary.color,
        roughness: paletteCfg.papillary.roughness,
        metalness: paletteCfg.papillary.metalness,
        transparent: true,
        opacity: paletteCfg.papillary.opacity ?? 0.28,
        side: THREE.DoubleSide,
        depthWrite: false
      })
    );
    const papillaryGeo = new THREE.BoxGeometry(width, papH, depth, 20, 1, 20);
    const papPos = papillaryGeo.attributes.position as THREE.BufferAttribute;
    const papArr = papPos.array as Float32Array;
    for (let i = 0; i < papArr.length; i += 3) {
      const y = papArr[i + 1];
      if (Math.abs(y - papH / 2) < 1e-4) {
        const nx = (papArr[i] / (width / 2));
        const nz = (papArr[i + 2] / (depth / 2));
        const noise = (Math.sin(nx * Math.PI * 2) * Math.cos(nz * Math.PI * 2) + Math.sin((nx + nz) * 3)) * 0.12;
        const ridge = Math.exp(-((nx * nx + nz * nz) * 0.8));
        papArr[i + 1] = y + papH * 0.35 * ridge + papH * 0.2 * noise;
      }
    }
    papPos.needsUpdate = true;
    papillaryGeo.computeVertexNormals();
    const papillaryMesh = new THREE.Mesh(papillaryGeo, papillaryMat);
    papillaryMesh.position.y = derH / 2 - papH / 2;
    papillaryMesh.receiveShadow = true;
    papillaryMesh.castShadow = false;
    papillaryMesh.userData.type = 'dermis_papillary';
    dermisGroup.add(papillaryMesh);

    // Reticular dermis (bulk)
    const reticularH = derH - papH;
    const reticularMat = applyClippingToMaterial(
      new THREE.MeshPhysicalMaterial({
        color: paletteCfg.reticular.color,
        roughness: paletteCfg.reticular.roughness,
        metalness: paletteCfg.reticular.metalness,
        transparent: true,
        opacity: paletteCfg.reticular.opacity ?? 0.25,
        side: THREE.DoubleSide,
        depthWrite: false
      })
    );
    const reticularGeo = new THREE.BoxGeometry(width, reticularH, depth);
    const reticularMesh = new THREE.Mesh(reticularGeo, reticularMat);
    reticularMesh.position.y = -papH / 2;
    reticularMesh.receiveShadow = true;
    reticularMesh.castShadow = false;
    reticularMesh.userData.type = 'dermis_reticular';
    dermisGroup.add(reticularMesh);

    // Collagen fibers
    const fiberGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.9, 6);
    const fiberMat = applyClippingToMaterial(
      new THREE.MeshPhysicalMaterial({
        color: paletteCfg.collagen.color,
        roughness: paletteCfg.collagen.roughness,
        metalness: paletteCfg.collagen.metalness
      })
    );
    collagenBaseCountRef.current = params.collagenFiberCount;
    const collagenMesh = new THREE.InstancedMesh(fiberGeo, fiberMat, params.collagenFiberCount);
    collagenMesh.castShadow = true;
    collagenMesh.receiveShadow = true;
    collagenMesh.userData.type = 'collagen';
    structureRootsRef.current['collagen'] = collagenMesh;
    structuresRef.current.collagen = collagenMesh;

    const dummyFiber = new THREE.Object3D();
    for (let i = 0; i < params.collagenFiberCount; i++) {
      const inPapillary = Math.random() < 0.25; // bias most fibers to reticular
      const yRange = inPapillary ? papH : derH - papH;
      const yCenter = inPapillary ? (derH / 2 - papH / 2) : (-papH / 2);
      dummyFiber.position.set(
        (Math.random() - 0.5) * width,
        yCenter + (Math.random() - 0.5) * yRange,
        (Math.random() - 0.5) * depth
      );
      // Orient reticular fibers more horizontally, papillary more vertical/oblique
      if (inPapillary) {
        dummyFiber.rotation.set(
          Math.random() * Math.PI * 0.25,
          Math.random() * Math.PI,
          Math.random() * Math.PI * 0.25
        );
      } else {
        dummyFiber.rotation.set(
          Math.random() * Math.PI * 0.15,
          Math.random() * Math.PI,
          Math.random() * Math.PI * 0.15
        );
      }
      const s = inPapillary ? (0.6 + Math.random() * 0.2) : (1.0 + Math.random() * 0.6);
      dummyFiber.scale.set(1, s, 1);
      dummyFiber.updateMatrix();
      collagenMesh.setMatrixAt(i, dummyFiber.matrix);
    }
    collagenMesh.instanceMatrix.needsUpdate = true;
    dermisGroup.add(collagenMesh);

    // Sweat glands
    const sweatGroup = new THREE.Group();
    sweatGroup.userData.type = 'sweat_gland';
    structureRootsRef.current['sweat_gland'] = sweatGroup;
    structuresRef.current.sweat = sweatGroup;

    const sweatMat = applyClippingToMaterial(
      new THREE.MeshPhysicalMaterial({
        color: paletteCfg.sweat.color,
        roughness: paletteCfg.sweat.roughness,
        metalness: paletteCfg.sweat.metalness,
        transparent: true,
        opacity: paletteCfg.sweat.opacity ?? 0.9
      })
    );

    const createSweatGland = (offsetX: number, offsetZ: number) => {
      const points: THREE.Vector3[] = [];
      for (let i = 0; i < 30; i++) {
        const t = i * 0.5;
        const x = Math.cos(t) * 0.3 + offsetX;
        const y = -derH / 2 + i * (derH / 60);
        const z = Math.sin(t) * 0.3 + offsetZ;
        points.push(new THREE.Vector3(x, y, z));
      }
      const last = points[points.length - 1];
      const ductEnd = new THREE.Vector3(last.x, derH / 2 + epiH * 0.2, last.z);
      points.push(
        new THREE.Vector3(last.x, last.y + 0.4, last.z),
        ductEnd
      );
      const curve = new THREE.CatmullRomCurve3(points);
      const tubeGeo = new THREE.TubeGeometry(curve, 80, 0.06, 8, false);
      const mesh = new THREE.Mesh(tubeGeo, sweatMat);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.userData.parentType = 'sweat_gland';
      sweatGroup.add(mesh);
    };

    createSweatGland(-1.2, -0.5);
    createSweatGland(1.0, 0.7);

    dermisGroup.add(sweatGroup);

    // Hair follicles
    const hairGroup = new THREE.Group();
    hairGroup.userData.type = 'hair_follicle';
    structureRootsRef.current['hair_follicle'] = hairGroup;
    structuresRef.current.hair = hairGroup;

    const hairMat = applyClippingToMaterial(
      new THREE.MeshPhysicalMaterial({
        color: paletteCfg.hair.color,
        roughness: paletteCfg.hair.roughness,
        metalness: paletteCfg.hair.metalness
      })
    );
    const hairBulbMat = applyClippingToMaterial(
      new THREE.MeshPhysicalMaterial({
        color: 0x0f172a,
        roughness: 0.5,
        metalness: 0.1
      })
    );
    const muscleMat = applyClippingToMaterial(
      new THREE.MeshPhysicalMaterial({
        color: 0x7f1d1d,
        roughness: 0.4,
        metalness: 0.1
      })
    );

    const createHairUnit = (x: number, z: number) => {
      const bulbY = -derH / 2 + 0.4;
      const bulbGeo = new THREE.SphereGeometry(0.25, 16, 16);
      const bulbMesh = new THREE.Mesh(bulbGeo, hairBulbMat);
      bulbMesh.position.set(x, bulbY, z);
      bulbMesh.castShadow = true;
      bulbMesh.receiveShadow = true;
      bulbMesh.userData.parentType = 'hair_follicle';
      hairGroup.add(bulbMesh);

      const path = new THREE.CatmullRomCurve3([
        new THREE.Vector3(x, bulbY, z),
        new THREE.Vector3(x + 0.1, 0, z),
        new THREE.Vector3(x + 0.1, derH / 2 + epiH, z)
      ]);
      const shaftGeo = new THREE.TubeGeometry(path, 60, 0.05, 8, false);
      const shaftMesh = new THREE.Mesh(shaftGeo, hairMat);
      shaftMesh.castShadow = true;
      shaftMesh.receiveShadow = true;
      shaftMesh.userData.parentType = 'hair_follicle';
      hairGroup.add(shaftMesh);

      const muscleGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.9, 8);
      const muscleMesh = new THREE.Mesh(muscleGeo, muscleMat);
      muscleMesh.position.set(x - 0.4, bulbY + 0.3, z);
      muscleMesh.rotation.z = -0.7;
      muscleMesh.castShadow = true;
      muscleMesh.receiveShadow = true;
      muscleMesh.userData.parentType = 'hair_follicle';
      hairGroup.add(muscleMesh);
    };

    createHairUnit(-0.8, -0.3);
    createHairUnit(0.2, 0.5);
    createHairUnit(1.2, -0.6);

    dermisGroup.add(hairGroup);

    // Blood vessels
    const vesselGroup = new THREE.Group();
    vesselGroup.userData.type = 'blood_vessels';

    const vesselMaterial = applyClippingToMaterial(
      new THREE.MeshPhysicalMaterial({
        color: 0x990f02,
        roughness: 0.6,
        metalness: 0.1,
        transparent: true,
        opacity: 0.9
      })
    );
    const vessels: THREE.Object3D[] = [];
    const makeVessel = (yOffset: number) => {
      const pts = [
        new THREE.Vector3(-width / 2, yOffset, -depth / 3),
        new THREE.Vector3(-width / 4, yOffset + 0.2, 0),
        new THREE.Vector3(width / 4, yOffset - 0.1, depth / 4),
        new THREE.Vector3(width / 2, yOffset, depth / 3)
      ];
      const curve = new THREE.CatmullRomCurve3(pts);
      const geo = new THREE.TubeGeometry(curve, 80, 0.08, 12, false);
      const mesh = new THREE.Mesh(geo, vesselMaterial);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.userData.parentType = 'blood_vessels';
      vesselGroup.add(mesh);
      vessels.push(mesh);
    };
    makeVessel(-0.6);
    makeVessel(0.3);
    dermisGroup.add(vesselGroup);
    structuresRef.current.vessels = vessels;
    structureRootsRef.current['blood_vessels'] = vesselGroup;

    // Nerve fibers
    const nerveGroup = new THREE.Group();
    nerveGroup.userData.type = 'nerves';
    structureRootsRef.current['nerves'] = nerveGroup;
    structuresRef.current.nerves = nerveGroup;

    const nerveMat = applyClippingToMaterial(
      new THREE.MeshPhysicalMaterial({
        color: 0xfbbf24, // Yellow/gold for nerves
        roughness: 0.3,
        metalness: 0.1,
        transparent: true,
        opacity: 0.85
      })
    );

    const createNerveFiber = (startX: number, startZ: number, endY: number) => {
      // Create branching nerve structure from hypodermis up through dermis
      const points: THREE.Vector3[] = [];
      const segments = 20;
      for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        const y = -derH / 2 - hypoH * 0.3 + t * (derH + hypoH * 0.3 + endY);
        const wobbleX = Math.sin(t * Math.PI * 3) * 0.1;
        const wobbleZ = Math.cos(t * Math.PI * 2) * 0.1;
        points.push(new THREE.Vector3(startX + wobbleX, y, startZ + wobbleZ));
      }
      const curve = new THREE.CatmullRomCurve3(points);
      const tubeGeo = new THREE.TubeGeometry(curve, 40, 0.03, 6, false);
      const mesh = new THREE.Mesh(tubeGeo, nerveMat);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.userData.parentType = 'nerves';
      nerveGroup.add(mesh);

      // Add small branches
      for (let b = 0; b < 3; b++) {
        const branchT = 0.4 + b * 0.2;
        const branchStart = curve.getPoint(branchT);
        const branchEnd = new THREE.Vector3(
          branchStart.x + (Math.random() - 0.5) * 0.8,
          branchStart.y + 0.3,
          branchStart.z + (Math.random() - 0.5) * 0.8
        );
        const branchCurve = new THREE.CatmullRomCurve3([branchStart, branchEnd]);
        const branchGeo = new THREE.TubeGeometry(branchCurve, 10, 0.015, 4, false);
        const branchMesh = new THREE.Mesh(branchGeo, nerveMat);
        branchMesh.userData.parentType = 'nerves';
        nerveGroup.add(branchMesh);
      }
    };

    // Create multiple nerve fiber bundles
    createNerveFiber(-1.5, 0, epiH * 0.3);
    createNerveFiber(0.5, -1.0, epiH * 0.2);
    createNerveFiber(1.5, 0.8, epiH * 0.4);

    dermisGroup.add(nerveGroup);

    // --- Hypodermis base ---
    const hypoMat = applyClippingToMaterial(
      new THREE.MeshPhysicalMaterial({
        color: 0xfff4c2,
        roughness: 0.4,
        metalness: 0,
        transparent: true,
        opacity: 0.4,
        side: THREE.DoubleSide,
        depthWrite: false
      })
    );
    const hypoGeo = new THREE.BoxGeometry(width, hypoH, depth);
    const hypoMesh = new THREE.Mesh(hypoGeo, hypoMat);
    hypoMesh.receiveShadow = true;
    hypoMesh.castShadow = false;
    hypoMesh.userData.type = 'hypodermis';
    hypodermisGroup.add(hypoMesh);

    // Adipose tissue
    const adiposeMat = applyClippingToMaterial(
      new THREE.MeshPhysicalMaterial({
        color: 0xffeb3b,
        roughness: 0.1,
        metalness: 0,
        clearcoat: 1.0,
        clearcoatRoughness: 0.2,
        transparent: true,
        opacity: 0.95
      })
    );
    const adiposeGeo = new THREE.SphereGeometry(0.35, 16, 16);
    const adiposeMesh = new THREE.InstancedMesh(adiposeGeo, adiposeMat, params.adipocyteCount);
    adiposeMesh.castShadow = true;
    adiposeMesh.receiveShadow = true;
    adiposeMesh.userData.type = 'adipose';
    structureRootsRef.current['adipose'] = adiposeMesh;
    const dummyFat = new THREE.Object3D();
    for (let i = 0; i < params.adipocyteCount; i++) {
      dummyFat.position.set(
        (Math.random() - 0.5) * width * 0.9,
        (Math.random() - 0.5) * hypoH * 0.8,
        (Math.random() - 0.5) * depth * 0.9
      );
      const s = 0.8 + Math.random() * 0.5;
      dummyFat.scale.set(s, s, s);
      dummyFat.updateMatrix();
      adiposeMesh.setMatrixAt(i, dummyFat.matrix);
    }
    adiposeMesh.instanceMatrix.needsUpdate = true;
    hypodermisGroup.add(adiposeMesh);
  };

  const applyExplode = (val: number) => {
    const base = baseLayerPositionsRef.current;
    if (!base) return;
    const epi = epidermisGroupRef.current;
    const derm = dermisGroupRef.current;
    const hypo = hypodermisGroupRef.current;
    const gap = val * 3.0;
    if (epi) epi.position.y = base.epidermis + gap;
    if (derm) derm.position.y = base.dermis;
    if (hypo) hypo.position.y = base.hypodermis - gap;
  };

  const applyHoverHighlight = (prevId: string | null, nextId: string | null) => {
    const roots = structureRootsRef.current;

    // Helper to process materials on an object or its children
    const processMaterials = (obj: THREE.Object3D, action: 'restore' | 'highlight') => {
      const processObject = (o: any) => {
        if (!o.material) return;
        const mats = Array.isArray(o.material) ? o.material : [o.material];
        mats.forEach((m: any) => {
          if (!m || !m.color) return;
          if (action === 'restore') {
            if (m.userData && m.userData.originalColor) {
              m.color.copy(m.userData.originalColor);
            }
          } else {
            if (!m.userData) m.userData = {};
            if (!m.userData.originalColor) {
              m.userData.originalColor = m.color.clone();
            }
            m.color.offsetHSL(0, 0.1, 0.15);
          }
        });
      };

      // Process the object itself
      processObject(obj);
      // Also process all children (for groups)
      obj.traverse((child) => {
        if (child !== obj) processObject(child);
      });
    };

    if (prevId && roots[prevId]) {
      processMaterials(roots[prevId], 'restore');
    }

    if (nextId && roots[nextId]) {
      processMaterials(roots[nextId], 'highlight');
    }
  };

  useEffect(() => {
    if (!mountRef.current || sceneRef.current) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f172a);
    scene.fog = new THREE.FogExp2(0x0f172a, 0.02);
    sceneRef.current = scene;

    // Anchor root for AR placement (wrap all anatomy)
    const anchorGroup = new THREE.Group();
    anchorGroup.name = 'AnchorGroup';
    scene.add(anchorGroup);
    anchorGroupRef.current = anchorGroup;

    const container = mountRef.current;
    const containerWidth = container.clientWidth || window.innerWidth;
    const containerHeight = container.clientHeight || window.innerHeight;

    const camera = new THREE.PerspectiveCamera(
      50,
      containerWidth / containerHeight,
      0.1,
      100
    );
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(containerWidth, containerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.localClippingEnabled = true;
    rendererRef.current = renderer;

    mountRef.current.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enablePan = true;
    controls.enableZoom = true;
    controls.enableRotate = true;
    controls.panSpeed = 1.0;
    controls.zoomSpeed = 1.2;
    controls.rotateSpeed = 0.8;
    controls.minDistance = 2;
    controls.maxDistance = 25;
    controls.maxPolarAngle = Math.PI / 1.5;
    controlsRef.current = controls;

    const macro = ZOOM_LEVELS.find(z => z.id === 'macro');
    if (macro) {
      camera.position.fromArray(macro.camera.position);
      controls.target.fromArray(macro.camera.target);
      controls.update();
    } else {
      camera.position.set(8, 6, 8);
      controls.target.set(0, 0, 0);
      controls.update();
    }

    const ambient = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambient);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.4);
    dirLight.position.set(6, 10, 4);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 30;
    dirLight.shadow.camera.left = -10;
    dirLight.shadow.camera.right = 10;
    dirLight.shadow.camera.top = 10;
    dirLight.shadow.camera.bottom = -10;
    scene.add(dirLight);

    const fill = new THREE.PointLight(0x60a5fa, 0.5);
    fill.position.set(-4, 4, -6);
    scene.add(fill);

    const clippingPlane = new THREE.Plane(new THREE.Vector3(0, -1, 0), 100);
    clippingPlaneRef.current = clippingPlane;

    // Cutaway plane for cross-section view (clips in Z direction)
    const cutawayPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    cutawayPlaneRef.current = cutawayPlane;

    const anchorGroupInstance = anchorGroupRef.current!;

    const epidermisGroup = new THREE.Group();
    epidermisGroupRef.current = epidermisGroup;
    anchorGroupInstance.add(epidermisGroup);

    const dermisGroup = new THREE.Group();
    dermisGroupRef.current = dermisGroup;
    anchorGroupInstance.add(dermisGroup);

    const hypodermisGroup = new THREE.Group();
    hypodermisGroupRef.current = hypodermisGroup;
    anchorGroupInstance.add(hypodermisGroup);

    // AR reticle
    const reticleGeo = new THREE.RingGeometry(0.08, 0.1, 32);
    const reticleMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.DoubleSide });
    const reticle = new THREE.Mesh(reticleGeo, reticleMat);
    reticle.rotation.x = -Math.PI / 2;
    reticle.visible = false;
    scene.add(reticle);
    reticleRef.current = reticle;

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const pickStructureId = (event: MouseEvent): string | null => {
      if (!rendererRef.current || !cameraRef.current || !sceneRef.current) return null;
      const rect = rendererRef.current.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, cameraRef.current);
      const intersects = raycaster.intersectObjects(sceneRef.current.children, true);
      for (const i of intersects) {
        const obj: any = i.object;
        const type =
          obj.userData?.type ||
          obj.userData?.parentType ||
          obj.parent?.userData?.type;
        if (type) {
          return type as string;
        }
      }
      return null;
    };

    const domElement = renderer.domElement;

    const handleClick = (event: MouseEvent) => {
      const id = pickStructureId(event);
      onSelectStructureRef.current?.(id ?? null);
    };

    // XR controller select → pick structure or place anchor
    const addControllerHandler = (index: number) => {
      const controller = renderer.xr.getController(index);
      controller.addEventListener('select', () => {
        // If we have a recent hit test pose, place the anchor; otherwise pick structures
      if (renderer.xr.isPresenting && lastHitMatrixRef.current && anchorGroupRef.current) {
        anchorGroupRef.current.matrix.copy(lastHitMatrixRef.current);
        anchorGroupRef.current.matrix.decompose(
          anchorGroupRef.current.position,
          anchorGroupRef.current.quaternion,
          anchorGroupRef.current.scale
        );
        anchorGroupRef.current.updateMatrixWorld(true);

        // Apply XR LOD rebuild once anchor is placed to ensure counts are reduced
        const lodConfig = getLODConfig(zoomLevelId);
        const params = computeParameters(diseaseId, lodConfig, 0.6);
        clearAnatomy();
        buildAnatomy(params);
        applyExplode(explodeValue);
      } else {
          const tempMatrix = new THREE.Matrix4();
          tempMatrix.identity().extractRotation(controller.matrixWorld);
          const direction = new THREE.Vector3(0, 0, -1).applyMatrix4(tempMatrix);
          const origin = new THREE.Vector3().setFromMatrixPosition(controller.matrixWorld);
          const id = pickStructureFromRay(origin, direction);
          if (id) {
            onSelectStructureRef.current?.(id);
          }
        }
      });
      scene.add(controller);
    };
    addControllerHandler(0);
    addControllerHandler(1);

    // Setup AR hit-test on session start
    const handleSessionStart = async () => {
      const session = renderer.xr.getSession();
      if (!session) return;
      xrRefSpaceRef.current = await session.requestReferenceSpace('local-floor').catch(() => null);
      viewerSpaceRef.current = await session.requestReferenceSpace('viewer').catch(() => null);
      if (viewerSpaceRef.current) {
        hitTestSourceRef.current = await (session as any).requestHitTestSource?.({ space: viewerSpaceRef.current }).catch(() => null);
      }
      session.addEventListener('end', () => {
        hitTestSourceRef.current?.cancel?.();
        hitTestSourceRef.current = null;
        viewerSpaceRef.current = null;
        xrRefSpaceRef.current = null;
        if (reticleRef.current) reticleRef.current.visible = false;
      });
    };
    renderer.xr.addEventListener('sessionstart', handleSessionStart);

    // Throttled mousemove for better performance
    let lastMoveTime = 0;
    const THROTTLE_MS = 50; // ~20 fps for hover detection
    const handleMove = (event: MouseEvent) => {
      const now = Date.now();
      if (now - lastMoveTime < THROTTLE_MS) return;
      lastMoveTime = now;

      const id = pickStructureId(event);
      if (id === hoveredIdRef.current) return;
      applyHoverHighlight(hoveredIdRef.current, id);
      hoveredIdRef.current = id;

      // Notify parent of hover state
      onHoverStructureRef.current?.(id, event.clientX, event.clientY);
    };

    domElement.addEventListener('click', handleClick);
    domElement.addEventListener('mousemove', handleMove);

    const handleResize = () => {
      if (!rendererRef.current || !cameraRef.current || !mountRef.current) return;
      const width = mountRef.current.clientWidth || window.innerWidth;
      const height = mountRef.current.clientHeight || window.innerHeight;
      rendererRef.current.setSize(width, height);
      cameraRef.current.aspect = width / height;
      cameraRef.current.updateProjectionMatrix();
    };
    window.addEventListener('resize', handleResize);

    // Also observe container size changes for comparison view
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(mountRef.current);

    const renderLoop = (_time: number, frame?: XRFrame) => {
      if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return;

      // Per-frame wound system updates - uses refs to access current values
      const now = performance.now();
      const dt = (now - lastFrameTimeRef.current) / 1000;
      lastFrameTimeRef.current = now;
      const clampedDt = Math.min(dt, 0.1); // Cap at 100ms to prevent huge jumps

      // AR hit-test reticle update
      isXrPresentingRef.current = rendererRef.current.xr.isPresenting;

      if (rendererRef.current.xr.isPresenting && frame && hitTestSourceRef.current) {
        const refSpace = xrRefSpaceRef.current ?? rendererRef.current.xr.getReferenceSpace();
        const results = frame.getHitTestResults(hitTestSourceRef.current);
        if (results.length > 0) {
          const pose = refSpace ? results[0].getPose(refSpace) : null;
          if (pose) {
            const mat = new THREE.Matrix4().fromArray(pose.transform.matrix as unknown as number[]);
            lastHitMatrixRef.current = mat;
            if (reticleRef.current) {
              reticleRef.current.visible = true;
              reticleRef.current.position.setFromMatrixPosition(mat);
              reticleRef.current.quaternion.setFromRotationMatrix(mat);
            }
          }
        } else if (reticleRef.current) {
          reticleRef.current.visible = false;
        }
      }

    if (timelineIdRef.current === 'wound_healing') {
      const t = THREE.MathUtils.clamp(timelineTRef.current, 0, 1);
      const woundBounds = woundMeshRef.current?.getCurrentSpawnBounds(t);
      const epidermisMat = epidermisMatRef.current as any;
      if (epidermisMat?.userData?.woundUniforms) {
        const u = epidermisMat.userData.woundUniforms;
        const currentHalfWidth = woundMeshRef.current
          ? woundMeshRef.current.getCurrentWidth(t) / 2
          : u.woundHalfWidth.value;
        const currentHalfLength = currentHalfWidth * 1.5; // length scales with width
        // Seal the epidermal gap as healing progresses
        const sealStart = 0.45;
        const sealEnd = 0.85;
        const sealProgress = THREE.MathUtils.clamp((t - sealStart) / (sealEnd - sealStart), 0, 1);
        const minGap = 0.02;
        u.woundCenter.value.copy(woundMeshRef.current?.getWoundCenter() ?? new THREE.Vector3(0, 0, 0));
        u.woundHalfWidth.value = Math.max(minGap, currentHalfWidth * (1 - 0.9 * sealProgress));
        u.woundHalfLength.value = Math.max(minGap * 1.5, currentHalfLength * (1 - 0.9 * sealProgress));
        u.woundFalloff.value = THREE.MathUtils.lerp(0.12, 0.04, sealProgress);
      }
      if (keratinocyteFrontRef.current) {
          const mat = keratinocyteFrontRef.current.material as THREE.ShaderMaterial;
          const halfWidth = woundMeshRef.current ? woundMeshRef.current.getCurrentWidth(t) / 2 : 0.75;
          const halfLength = halfWidth * 1.5;
          mat.uniforms.uHalfWidth.value = halfWidth;
          mat.uniforms.uHalfLength.value = halfLength;
          // Migration progress from edges (0 at t=0.33, 1 at t=0.65)
          const migStart = 0.33;
          const migEnd = 0.65;
          let progress = 0;
          if (t >= migStart) {
            progress = THREE.MathUtils.clamp((t - migStart) / (migEnd - migStart), 0, 1);
          }
          mat.uniforms.uProgress.value = progress;
          keratinocyteFrontRef.current.scale.set(halfWidth * 2, 1, halfLength * 2);
          keratinocyteFrontRef.current.position.y = (woundBounds?.min.y ?? -0.2) + 0.05;
        }

        if (woundMeshRef.current) {
          woundMeshRef.current.updateContraction(t);
        }
        // Re-epithelialization visuals
        const photoCfg = PHOTOTYPES[phototype as keyof typeof PHOTOTYPES] || PHOTOTYPES[3];
        // UV decay over time
        if (uvStateRef.current.dose > 0 && uvStateRef.current.decaySeconds > 0) {
          const decay = Math.exp(-clampedDt / uvStateRef.current.decaySeconds);
          uvStateRef.current = { ...uvStateRef.current, dose: uvStateRef.current.dose * decay };
        }
  const melaninBoost = photoCfg.melaninBase + uvStateRef.current.dose * photoCfg.melaninUVBoost;
  updateEpidermalHealing(t, melaninBoost, hydration, clampedDt);
        if (clotMeshRef.current) {
          clotMeshRef.current.update(t);
        }
        if (plateletSystemRef.current) {
          if (woundBounds) plateletSystemRef.current.setSpawnRegion(woundBounds);
          plateletSystemRef.current.update(t, clampedDt);
        }
        if (neutrophilSystemRef.current) {
          if (woundBounds) neutrophilSystemRef.current.setSpawnRegion(woundBounds);
          neutrophilSystemRef.current.update(t, clampedDt);
        }
        if (macrophageSystemRef.current) {
          if (woundBounds) macrophageSystemRef.current.setSpawnRegion(woundBounds);
          macrophageSystemRef.current.update(t, clampedDt);
        }
        if (vesselSystemRef.current) {
          vesselSystemRef.current.update(t);
        }
      }

      // Disable orbit controls when XR is presenting (headset controls pose)
      if (rendererRef.current.xr.isPresenting) {
        controlsRef.current && (controlsRef.current.enabled = false);
        // Transparent background and no fog for passthrough AR
        if (sceneRef.current) {
          sceneRef.current.background = null;
          sceneRef.current.fog = null as any;
        }
        // XR performance profile
        rendererRef.current.setPixelRatio(Math.min(window.devicePixelRatio, 1.25));
        rendererRef.current.shadowMap.enabled = false;
      } else {
        controlsRef.current && (controlsRef.current.enabled = true);
        controlsRef.current?.update();
        rendererRef.current.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        rendererRef.current.shadowMap.enabled = true;
        // Shadow map textures are managed internally by Three.js
      }

      rendererRef.current.render(sceneRef.current, cameraRef.current);
    };
    renderer.setAnimationLoop(renderLoop);

    const lodConfig = getLODConfig(zoomLevelId);
    const params = computeParameters(diseaseId, lodConfig, isXrPresentingRef.current ? 0.6 : 1);
    clearAnatomy();
    buildAnatomy(params);
    applyExplode(explodeValue);
    setIsLoading(false);

    // WebGL context loss handling
    const handleContextLost = (event: Event) => {
      event.preventDefault();
      console.warn('WebGL context lost');
      setIsLoading(true);
    };

    const handleContextRestored = () => {
      console.log('WebGL context restored');
      const restoredLodConfig = getLODConfig(zoomLevelId);
      const restoredParams = computeParameters(diseaseId, restoredLodConfig, isXrPresentingRef.current ? 0.6 : 1);
      clearAnatomy();
      buildAnatomy(restoredParams);
      applyExplode(explodeValue);
      setIsLoading(false);
    };

    renderer.domElement.addEventListener('webglcontextlost', handleContextLost);
    renderer.domElement.addEventListener('webglcontextrestored', handleContextRestored);

    return () => {
      renderer.xr.removeEventListener('sessionstart', handleSessionStart);
      renderer.domElement.removeEventListener('webglcontextlost', handleContextLost);
      renderer.domElement.removeEventListener('webglcontextrestored', handleContextRestored);
      renderer.setAnimationLoop(null);
      window.removeEventListener('resize', handleResize);
      resizeObserver.disconnect();
      domElement.removeEventListener('click', handleClick);
      domElement.removeEventListener('mousemove', handleMove);
      controlsRef.current?.dispose();

      if (sceneRef.current) {
        sceneRef.current.traverse(child => {
          const mesh = child as any;
          if (mesh.isMesh || mesh.isInstancedMesh) {
            if (mesh.geometry) mesh.geometry.dispose();
            if (mesh.material) {
              if (Array.isArray(mesh.material)) {
                mesh.material.forEach((m: THREE.Material) => m.dispose());
              } else {
                (mesh.material as THREE.Material).dispose();
              }
            }
          }
        });
      }

      if (rendererRef.current) {
        rendererRef.current.dispose();
        if (rendererRef.current.domElement.parentElement) {
          rendererRef.current.domElement.parentElement.removeChild(rendererRef.current.domElement);
        }
      }

      if (reticleRef.current && sceneRef.current) {
        sceneRef.current.remove(reticleRef.current);
        reticleRef.current.geometry.dispose();
        (reticleRef.current.material as THREE.Material).dispose();
        reticleRef.current = null;
      }

      sceneRef.current = null;
      cameraRef.current = null;
      rendererRef.current = null;
      controlsRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!sceneRef.current) return;
    const lodConfig = getLODConfig(zoomLevelId);
    const params = computeParameters(diseaseId, lodConfig, isXrPresentingRef.current ? 0.6 : 1);
    clearAnatomy();
    buildAnatomy(params);
    applyExplode(explodeValue);
    applyCollagenDensity(collagenReduced, timelineId, timelineT);
    if (timelineId === 'wound_healing') {
      updateEpidermalHealing(timelineT, 0, 0.6, 0);
    }
  }, [diseaseId, zoomLevelId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    applyExplode(explodeValue);
  }, [explodeValue]);

  useEffect(() => {
    const epi = epidermisGroupRef.current;
    const derm = dermisGroupRef.current;
    const hypo = hypodermisGroupRef.current;
    if (epi) epi.visible = visibility.epidermis;
    if (derm) derm.visible = visibility.dermis;
    if (hypo) hypo.visible = visibility.hypodermis;

    if (structuresRef.current.hair) {
      structuresRef.current.hair.visible = visibility.structures.hair;
    }
    if (structuresRef.current.sweat) {
      structuresRef.current.sweat.visible = visibility.structures.sweat;
    }
    if (structuresRef.current.collagen) {
      structuresRef.current.collagen.visible = visibility.structures.collagen;
    }
    if (structuresRef.current.nerves) {
      structuresRef.current.nerves.visible = visibility.structures.nerves;
    }
    if (structuresRef.current.vessels) {
      structuresRef.current.vessels.forEach(mesh => {
        mesh.visible = visibility.structures.vessels;
      });
    }
  }, [visibility]);

  useEffect(() => {
    const plane = clippingPlaneRef.current;
    if (!plane) return;
    if (clippingNormalized == null) {
      plane.constant = 100;
      return;
    }
    const minY = -4;
    const maxY = 4;
    const y = minY + (maxY - minY) * clippingNormalized;
    plane.constant = y;
  }, [clippingNormalized]);

  // Handle auto-rotate setting
  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;
    controls.autoRotate = autoRotate;
    controls.autoRotateSpeed = 0.5; // Slow rotation
  }, [autoRotate]);

  useEffect(() => {
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!camera || !controls) return;

    let targetPosition: THREE.Vector3;
    let targetLookAt: THREE.Vector3;

    if (activeTourId) {
      const tour = TOURS.find(t => t.id === activeTourId);
      if (!tour) return;
      const step = tour.steps[Math.min(Math.max(activeTourStepIndex, 0), tour.steps.length - 1)];
      targetPosition = new THREE.Vector3(...step.camera.position);
      targetLookAt = new THREE.Vector3(...step.camera.target);
    } else {
      const zoom = ZOOM_LEVELS.find(z => z.id === zoomLevelId);
      if (!zoom) return;
      targetPosition = new THREE.Vector3(...zoom.camera.position);
      targetLookAt = new THREE.Vector3(...zoom.camera.target);
    }

    // Smooth camera animation
    const startPos = camera.position.clone();
    const startTarget = controls.target.clone();
    const duration = 800; // ms
    const startTime = Date.now();

    const animateCamera = () => {
      const elapsed = Date.now() - startTime;
      const t = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic

      camera.position.lerpVectors(startPos, targetPosition, eased);
      controls.target.lerpVectors(startTarget, targetLookAt, eased);
      controls.update();

      if (t < 1) {
        requestAnimationFrame(animateCamera);
      }
    };

    animateCamera();
  }, [zoomLevelId, activeTourId, activeTourStepIndex]);

  useEffect(() => {
    const dermisGroup = dermisGroupRef.current;
    const epidermisGroup = epidermisGroupRef.current;
    if (!dermisGroup || !epidermisGroup) return;

    // Find all relevant meshes
    let dermisMesh: THREE.Mesh | null = null;
    let epidermisMesh: THREE.Mesh | null = null;

    dermisGroup.traverse(child => {
      const mesh = child as any;
      if (mesh.isMesh && mesh.userData.type === 'dermis') {
        dermisMesh = mesh;
      }
    });

    epidermisGroup.traverse(child => {
      const mesh = child as any;
      if (mesh.isMesh && mesh.userData.type === 'epidermis') {
        epidermisMesh = mesh;
      }
    });

    if (timelineId === 'wound_healing') {
      const t = THREE.MathUtils.clamp(timelineT, 0, 1);

      // Phase colors: 0% = acute injury (red), 50% = healing (pink), 100% = healed (normal)
      const inflamed = new THREE.Color(0xf97373);
      const healing = new THREE.Color(0xffb8a8);
      const baseline = new THREE.Color(0xffd1c1);

      // Dermis: red -> healing pink -> normal
      if (dermisMesh) {
        const dermisMat = dermisMesh.material as THREE.MeshPhysicalMaterial;
        if (t < 0.5) {
          dermisMat.color = inflamed.clone().lerp(healing, t * 2);
        } else {
          dermisMat.color = healing.clone().lerp(baseline, (t - 0.5) * 2);
        }
      }

      // Epidermis: disrupted (thin/red) -> regenerating -> normal
      if (epidermisMesh) {
        const epiMat = epidermisMesh.material as THREE.MeshPhysicalMaterial;
        const epiInflamed = new THREE.Color(0xffaa88);
        const epiNormal = new THREE.Color(0xf97316);
        epiMat.color = epiInflamed.clone().lerp(epiNormal, t);
        // Opacity increases as epidermis regenerates
        epiMat.opacity = 0.2 + (t * 0.15);
      }

      // Blood vessels: use palette oxy/deoxy with dilation tint
      if (structuresRef.current.vessels) {
        const oxy = new THREE.Color(PALETTES[paletteRef.current].vessels.oxy);
        const deoxy = new THREE.Color(PALETTES[paletteRef.current].vessels.deoxy);
        structuresRef.current.vessels.forEach(vessel => {
          const vesselMesh = vessel as THREE.Mesh;
          if (vesselMesh.material) {
            const vesselMat = vesselMesh.material as THREE.MeshPhysicalMaterial;
            vesselMat.color = oxy.clone().lerp(deoxy, t * 0.6);
          }
        });
      }

    } else {
      // Reset to baseline colors
      if (dermisMesh) {
        const dermisMat = dermisMesh.material as THREE.MeshPhysicalMaterial;
        dermisMat.color = new THREE.Color(0xffd1c1);
      }
      if (epidermisMesh) {
        const epiMat = epidermisMesh.material as THREE.MeshPhysicalMaterial;
        epiMat.color = new THREE.Color(0xf97316);
        epiMat.opacity = 0.35;
      }
      if (structuresRef.current.vessels) {
        const base = new THREE.Color(PALETTES[paletteRef.current].vessels.deoxy);
        structuresRef.current.vessels.forEach(vessel => {
          const vesselMesh = vessel as THREE.Mesh;
          if (vesselMesh.material) {
            const vesselMat = vesselMesh.material as THREE.MeshPhysicalMaterial;
            vesselMat.color = base;
          }
        });
      }
      // Disable wound cutout when not in wound mode
      if (epidermisMatRef.current && (epidermisMatRef.current as any).userData?.woundUniforms) {
        const u = (epidermisMatRef.current as any).userData.woundUniforms;
        u.woundHalfWidth.value = 1000;
        u.woundHalfLength.value = 1000;
      }
      if (stratumCorneumMatRef.current) {
        stratumCorneumMatRef.current.opacity = 0.9;
        stratumCorneumMatRef.current.transparent = true;
      }
    }
  }, [timelineId, timelineT]);

  useEffect(() => {
    applyCollagenDensity(collagenReduced, timelineId, timelineT);
  }, [collagenReduced, timelineId, timelineT, applyCollagenDensity]);

  // Wound healing systems creation and management
  useEffect(() => {
    const scene = sceneRef.current;
    const dermisGroup = dermisGroupRef.current;
    if (!scene || !dermisGroup) return;

    const woundCenter = new THREE.Vector3(0, 0, 0);

    // Helper to get clipping planes
    const getClippingPlanes = (): THREE.Plane[] => {
      const planes: THREE.Plane[] = [];
      if (clippingPlaneRef.current) planes.push(clippingPlaneRef.current);
      if (cutawayEnabled && cutawayPlaneRef.current) planes.push(cutawayPlaneRef.current);
      return planes;
    };

    if (timelineId === 'wound_healing') {
      // Create wound systems group if it doesn't exist
      if (!woundSystemsGroupRef.current) {
        const systemsGroup = new THREE.Group();
        systemsGroup.name = 'WoundHealingSystems';
        dermisGroup.add(systemsGroup);
        woundSystemsGroupRef.current = systemsGroup;
      }

      const systemsGroup = woundSystemsGroupRef.current;
      const planes = getClippingPlanes();

      // Create wound mesh if it doesn't exist
      if (!woundMeshRef.current) {
        const woundMesh = new WoundMesh({
          width: 2.2,
          depth: 2.6,
          position: woundCenter,
          dermisTop: 1.5,
          dermisBottom: -1.5
        });
        if (planes.length > 0) {
          woundMesh.setClippingPlanes(planes);
        }
        systemsGroup.add(woundMesh.group);
        woundMeshRef.current = woundMesh;
      }

      // Compute current spawn bounds from wound mesh (shrinks as wound contracts)
      const spawnBounds = woundMeshRef.current.getCurrentSpawnBounds(timelineTRef.current || 0);

      // Create clot mesh
      if (!clotMeshRef.current) {
        const clotMesh = new ClotMesh({
          woundWidth: woundMeshRef.current.getCurrentWidth(timelineTRef.current || 0),
          woundDepth: woundMeshRef.current.getCurrentDepth(timelineTRef.current || 0)
        });
        if (planes.length > 0) {
          clotMesh.setClippingPlanes(planes);
        }
        systemsGroup.add(clotMesh.group);
        clotMeshRef.current = clotMesh;
      }

      // Keratinocyte leading edge strip (visualizes migration)
      if (!keratinocyteFrontRef.current) {
        const frontGeo = new THREE.PlaneGeometry(1, 1, 1, 1);
        const frontMat = new THREE.ShaderMaterial({
          transparent: true,
          depthWrite: false,
          side: THREE.DoubleSide,
          uniforms: {
            uColor: { value: new THREE.Color(0xffc7a3) },
            uProgress: { value: 0 },
            uBand: { value: 0.18 },
            uHalfWidth: { value: woundMeshRef.current.getCurrentWidth(timelineTRef.current || 0) / 2 },
            uHalfLength: { value: (woundMeshRef.current.getCurrentWidth(timelineTRef.current || 0) / 2) * 1.5 }
          },
          vertexShader: `
            varying vec2 vPos;
            void main() {
              vec4 worldPos = modelMatrix * vec4(position, 1.0);
              vPos = worldPos.xz;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `,
          fragmentShader: `
            varying vec2 vPos;
            uniform vec3 uColor;
            uniform float uProgress;
            uniform float uBand;
            uniform float uHalfWidth;
            uniform float uHalfLength;
            void main() {
              vec2 n = vec2(vPos.x / uHalfWidth, vPos.y / uHalfLength);
              float r = length(n);           // 0 center, 1 edge
              float target = mix(1.0, 0.0, uProgress); // moves edge -> center
              float d = abs(r - target);
              float alpha = smoothstep(uBand, 0.0, d);
              if (alpha <= 0.001) discard;
              gl_FragColor = vec4(uColor, alpha * 0.9);
            }
          `
        });
        const frontMesh = new THREE.Mesh(frontGeo, frontMat);
        frontMesh.rotation.x = -Math.PI / 2;
        frontMesh.position.set(woundCenter.x, woundMeshRef.current.getWoundBounds().min.y + 0.05, woundCenter.z);
        frontMesh.name = 'KeratinocyteFront';
        systemsGroup.add(frontMesh);
        keratinocyteFrontRef.current = frontMesh;
      }

      // Create platelet system
      if (!plateletSystemRef.current) {
        const plateletSystem = new PlateletSystem(spawnBounds, woundCenter);
        if (planes.length > 0) {
          plateletSystem.setClippingPlanes(planes);
        }
        systemsGroup.add(plateletSystem.instancedMesh);
        plateletSystemRef.current = plateletSystem;
      }

      // Create neutrophil system
      if (!neutrophilSystemRef.current) {
        const neutrophilSystem = new NeutrophilSystem(spawnBounds, woundCenter);
        if (planes.length > 0) {
          neutrophilSystem.setClippingPlanes(planes);
        }
        systemsGroup.add(neutrophilSystem.instancedMesh);
        neutrophilSystemRef.current = neutrophilSystem;
      }

      // Create macrophage system
      if (!macrophageSystemRef.current) {
        const macrophageSystem = new MacrophageSystem(spawnBounds, woundCenter);
        if (planes.length > 0) {
          macrophageSystem.setClippingPlanes(planes);
        }
        systemsGroup.add(macrophageSystem.instancedMesh);
        macrophageSystemRef.current = macrophageSystem;
      }

      // Create vessel system
      if (!vesselSystemRef.current && structuresRef.current.vessels.length > 0) {
    const vesselSystem = new VesselSystem({
      woundCenter,
      woundRadius: 1.1
    });
        vesselSystem.registerVessels(structuresRef.current.vessels as THREE.Mesh[]);
        if (planes.length > 0) {
          vesselSystem.setClippingPlanes(planes);
        }
        systemsGroup.add(vesselSystem.getSproutGroup());
        vesselSystemRef.current = vesselSystem;
      }

    } else {
      // Remove all wound systems when not in wound healing mode
      if (woundMeshRef.current) {
        woundMeshRef.current.dispose();
        woundMeshRef.current = null;
      }
      if (clotMeshRef.current) {
        clotMeshRef.current.dispose();
        clotMeshRef.current = null;
      }
      if (plateletSystemRef.current) {
        plateletSystemRef.current.dispose();
        plateletSystemRef.current = null;
      }
      if (neutrophilSystemRef.current) {
        neutrophilSystemRef.current.dispose();
        neutrophilSystemRef.current = null;
      }
      if (macrophageSystemRef.current) {
        macrophageSystemRef.current.dispose();
        macrophageSystemRef.current = null;
      }
      if (vesselSystemRef.current) {
        vesselSystemRef.current.dispose();
        vesselSystemRef.current = null;
      }
      if (keratinocyteFrontRef.current) {
        keratinocyteFrontRef.current.geometry.dispose();
        (keratinocyteFrontRef.current.material as THREE.Material).dispose();
        woundSystemsGroupRef.current?.remove(keratinocyteFrontRef.current);
        keratinocyteFrontRef.current = null;
      }
      if (woundSystemsGroupRef.current && dermisGroup) {
        dermisGroup.remove(woundSystemsGroupRef.current);
        woundSystemsGroupRef.current = null;
      }
    }
  }, [timelineId, cutawayEnabled]);

  // NOTE: Wound system updates are now handled in the per-frame animation loop
  // to ensure smooth animation regardless of React re-render frequency

  // Cutaway plane toggle
  useEffect(() => {
    const cutawayPlane = cutawayPlaneRef.current;
    if (!cutawayPlane) return;

    // Helper to get current clipping planes
    const getPlanes = (): THREE.Plane[] => {
      const planes: THREE.Plane[] = [];
      if (clippingPlaneRef.current) planes.push(clippingPlaneRef.current);
      if (cutawayEnabled) planes.push(cutawayPlane);
      return planes;
    };

    const planes = getPlanes();

    // Update clipping planes on all materials
    materialsRef.current.forEach(mat => {
      (mat as any).clippingPlanes = planes.length > 0 ? planes : null;
    });

    // Update wound mesh clipping planes
    if (woundMeshRef.current) {
      woundMeshRef.current.setClippingPlanes(planes);
    }

    // Update inflammatory system clipping planes
    if (clotMeshRef.current) {
      clotMeshRef.current.setClippingPlanes(planes);
    }
    if (plateletSystemRef.current) {
      plateletSystemRef.current.setClippingPlanes(planes);
    }
    if (neutrophilSystemRef.current) {
      neutrophilSystemRef.current.setClippingPlanes(planes);
    }
    if (macrophageSystemRef.current) {
      macrophageSystemRef.current.setClippingPlanes(planes);
    }
    if (vesselSystemRef.current) {
      vesselSystemRef.current.setClippingPlanes(planes);
    }
    if (keratinocyteFrontRef.current) {
      (keratinocyteFrontRef.current.material as THREE.ShaderMaterial).clippingPlanes = planes.length > 0 ? planes : null;
    }
  }, [cutawayEnabled]);

  return (
    <>
      <div
        ref={mountRef}
        className="absolute inset-0 z-0 cursor-crosshair touch-none"
        {...touchHandlers}
      />
      {isLoading && (
        <div className="absolute inset-0 z-10 bg-slate-950 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-slate-400 text-sm">Loading 3D scene...</p>
          </div>
        </div>
      )}
    </>
  );
});

SkinScene.displayName = 'SkinScene';
