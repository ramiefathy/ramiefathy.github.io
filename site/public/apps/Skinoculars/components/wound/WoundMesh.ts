/**
 * WoundMesh
 * V-cut wound geometry with morph targets for contraction animation
 */

import * as THREE from 'three';
import { WOUND_GEOMETRY, easeOutCubic } from '../../phases';

export interface WoundMeshOptions {
  width?: number;
  depth?: number;
  position?: THREE.Vector3;
  dermisTop?: number;
  dermisBottom?: number;
}

export class WoundMesh {
  public readonly group: THREE.Group;
  private woundCavityMesh: THREE.Mesh;
  private woundRimMesh: THREE.Mesh;
  private initialPositions: Float32Array;
  private contractedPositions: Float32Array;

  private options: Required<WoundMeshOptions>;

  constructor(options: WoundMeshOptions = {}) {
    this.options = {
      width: options.width ?? WOUND_GEOMETRY.initialWidth,
      depth: options.depth ?? WOUND_GEOMETRY.initialDepth,
      position: options.position ?? new THREE.Vector3(0, 0, 0),
      dermisTop: options.dermisTop ?? 1.5,
      dermisBottom: options.dermisBottom ?? -1.5
    };

    this.group = new THREE.Group();
    this.group.position.copy(this.options.position);

    // Create wound cavity
    const { cavityGeometry, rimGeometry, initialPositions, contractedPositions } =
      this.createWoundGeometry();

    this.initialPositions = initialPositions;
    this.contractedPositions = contractedPositions;

    // Wound cavity material (red/inflamed tissue)
    const cavityMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xcc3333,
      roughness: 0.8,
      metalness: 0,
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide
    });

    // Wound rim material (damaged epidermis edge)
    const rimMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xffaa88,
      roughness: 0.6,
      metalness: 0,
      side: THREE.DoubleSide
    });

    this.woundCavityMesh = new THREE.Mesh(cavityGeometry, cavityMaterial);
    this.woundCavityMesh.userData.type = 'wound_cavity';
    this.group.add(this.woundCavityMesh);

    this.woundRimMesh = new THREE.Mesh(rimGeometry, rimMaterial);
    this.woundRimMesh.userData.type = 'wound_rim';
    this.group.add(this.woundRimMesh);
  }

  private createWoundGeometry(): {
    cavityGeometry: THREE.BufferGeometry;
    rimGeometry: THREE.BufferGeometry;
    initialPositions: Float32Array;
    contractedPositions: Float32Array;
  } {
    const { width, depth, dermisTop, dermisBottom } = this.options;
    const halfWidth = width / 2;
    const woundLength = width * 1.5; // Wound is elongated
    const halfLength = woundLength / 2;

    // V-cut cross-section parameters
    const woundBottom = dermisTop - depth; // Wound goes into dermis
    const segments = 16; // Segments along the wound length
    const radialSegments = 8; // Segments around the V-cut

    // Create wound cavity geometry (the inner walls of the wound)
    const cavityVertices: number[] = [];
    const cavityIndices: number[] = [];
    const cavityUVs: number[] = [];

    // Create V-shaped cross-section at each segment along length
    for (let i = 0; i <= segments; i++) {
      const z = -halfLength + (i / segments) * woundLength;
      const zNormalized = i / segments;

      // Create V-cut profile (mirrored)
      for (let j = 0; j <= radialSegments; j++) {
        const angle = (j / radialSegments) * Math.PI; // 0 to PI (half circle, V-shape)
        const t = j / radialSegments; // 0 to 1 across the V

        // V-shape: starts at rim, goes down to point, comes back up
        let x: number;
        let y: number;

        if (t < 0.5) {
          // Left side of V
          x = -halfWidth + t * halfWidth;
          y = dermisTop - t * 2 * depth;
        } else {
          // Right side of V
          x = (t - 0.5) * halfWidth;
          y = woundBottom + (t - 0.5) * 2 * depth;
        }

        // Add some curve to the bottom (rounded V)
        const bottomCurve = Math.sin(t * Math.PI) * 0.2;
        y -= bottomCurve;

        cavityVertices.push(x, y, z);
        cavityUVs.push(t, zNormalized);
      }
    }

    // Create indices for cavity mesh
    for (let i = 0; i < segments; i++) {
      for (let j = 0; j < radialSegments; j++) {
        const a = i * (radialSegments + 1) + j;
        const b = a + 1;
        const c = (i + 1) * (radialSegments + 1) + j;
        const d = c + 1;

        cavityIndices.push(a, c, b);
        cavityIndices.push(b, c, d);
      }
    }

    const cavityGeometry = new THREE.BufferGeometry();
    cavityGeometry.setAttribute('position', new THREE.Float32BufferAttribute(cavityVertices, 3));
    cavityGeometry.setAttribute('uv', new THREE.Float32BufferAttribute(cavityUVs, 2));
    cavityGeometry.setIndex(cavityIndices);
    cavityGeometry.computeVertexNormals();

    // Create wound rim geometry (the edge at the top)
    const rimVertices: number[] = [];
    const rimIndices: number[] = [];
    const rimUVs: number[] = [];
    const rimWidth = 0.1; // Width of the rim

    for (let i = 0; i <= segments; i++) {
      const z = -halfLength + (i / segments) * woundLength;

      // Outer edge of rim
      rimVertices.push(-halfWidth - rimWidth, dermisTop, z);
      rimVertices.push(halfWidth + rimWidth, dermisTop, z);

      // Inner edge of rim (wound edge)
      rimVertices.push(-halfWidth, dermisTop, z);
      rimVertices.push(halfWidth, dermisTop, z);

      const t = i / segments;
      rimUVs.push(0, t);
      rimUVs.push(1, t);
      rimUVs.push(0.3, t);
      rimUVs.push(0.7, t);
    }

    // Create indices for rim mesh
    for (let i = 0; i < segments; i++) {
      const base = i * 4;

      // Left rim quad
      rimIndices.push(base, base + 4, base + 2);
      rimIndices.push(base + 2, base + 4, base + 6);

      // Right rim quad
      rimIndices.push(base + 3, base + 7, base + 1);
      rimIndices.push(base + 1, base + 7, base + 5);
    }

    const rimGeometry = new THREE.BufferGeometry();
    rimGeometry.setAttribute('position', new THREE.Float32BufferAttribute(rimVertices, 3));
    rimGeometry.setAttribute('uv', new THREE.Float32BufferAttribute(rimUVs, 2));
    rimGeometry.setIndex(rimIndices);
    rimGeometry.computeVertexNormals();

    // Store initial and contracted positions for morphing
    const initialPositions = new Float32Array(cavityVertices);

    // Calculate contracted positions using instance-specific ratios
    // Final dimensions are proportional to initial dimensions
    const contractedPositions = new Float32Array(cavityVertices.length);
    const finalWidth = width * (WOUND_GEOMETRY.finalWidth / WOUND_GEOMETRY.initialWidth);
    const finalDepth = depth * (WOUND_GEOMETRY.finalDepth / WOUND_GEOMETRY.initialDepth);
    const contractionRatio = finalWidth / width;
    const depthRatio = finalDepth / depth;

    for (let i = 0; i < cavityVertices.length; i += 3) {
      // Contract x coordinate toward center
      contractedPositions[i] = cavityVertices[i] * contractionRatio;

      // Raise y coordinate (wound becomes shallower)
      const originalY = cavityVertices[i + 1];
      const depthFromTop = dermisTop - originalY;
      const newDepthFromTop = depthFromTop * depthRatio;
      contractedPositions[i + 1] = dermisTop - newDepthFromTop;

      // Keep z the same (length stays)
      contractedPositions[i + 2] = cavityVertices[i + 2];
    }

    return { cavityGeometry, rimGeometry, initialPositions, contractedPositions };
  }

  /**
   * Update wound contraction based on timeline progress
   * @param t - Timeline progress (0-1)
   */
  updateContraction(t: number): void {
    // Contraction mostly happens from t=0.35 to t=0.65
    const contractionStart = 0.35;
    const contractionEnd = WOUND_GEOMETRY.contractionComplete;

    let contractionProgress = 0;
    if (t >= contractionStart) {
      contractionProgress = Math.min(
        (t - contractionStart) / (contractionEnd - contractionStart),
        1
      );
    }

    // Apply easing for smooth contraction
    const easedProgress = easeOutCubic(contractionProgress);

    // Interpolate between initial and contracted positions
    const positions = this.woundCavityMesh.geometry.attributes.position;
    const posArray = positions.array as Float32Array;

    for (let i = 0; i < posArray.length; i++) {
      posArray[i] =
        this.initialPositions[i] +
        (this.contractedPositions[i] - this.initialPositions[i]) * easedProgress;
    }

    positions.needsUpdate = true;
    this.woundCavityMesh.geometry.computeVertexNormals();

    // Also contract the rim
    this.updateRimContraction(easedProgress);

    // Update colors based on healing progress
    this.updateWoundColors(t);
  }

  private updateRimContraction(contractionProgress: number): void {
    const positions = this.woundRimMesh.geometry.attributes.position;
    const posArray = positions.array as Float32Array;
    // Instance-specific ratio so rim matches cavity for custom wound sizes
    const finalWidth = this.options.width * (WOUND_GEOMETRY.finalWidth / WOUND_GEOMETRY.initialWidth);
    const contractionRatio = finalWidth / this.options.width;

    for (let i = 0; i < posArray.length; i += 3) {
      const x = posArray[i];
      // Contract x toward center
      const targetX = x * contractionRatio;
      posArray[i] = x + (targetX - x) * contractionProgress;
    }

    positions.needsUpdate = true;
    this.woundRimMesh.geometry.computeVertexNormals();
  }

  private updateWoundColors(t: number): void {
    const cavityMat = this.woundCavityMesh.material as THREE.MeshPhysicalMaterial;
    const rimMat = this.woundRimMesh.material as THREE.MeshPhysicalMaterial;

    // Wound cavity: bright red -> dark red -> pink granulation -> scar color
    if (t < 0.1) {
      // Fresh wound: bright red
      cavityMat.color.setHex(0xcc3333);
    } else if (t < 0.33) {
      // Inflammatory: dark red/clotted
      const lerpT = (t - 0.1) / 0.23;
      cavityMat.color.lerpColors(
        new THREE.Color(0xcc3333),
        new THREE.Color(0x8b0000),
        lerpT
      );
    } else if (t < 0.66) {
      // Proliferative: pink granulation tissue
      const lerpT = (t - 0.33) / 0.33;
      cavityMat.color.lerpColors(
        new THREE.Color(0x8b0000),
        new THREE.Color(0xff9999),
        lerpT
      );
    } else {
      // Remodeling: transitioning to scar
      const lerpT = (t - 0.66) / 0.34;
      cavityMat.color.lerpColors(
        new THREE.Color(0xff9999),
        new THREE.Color(0xeeddcc),
        lerpT
      );
    }

    // Rim color follows similar pattern
    if (t < 0.5) {
      // Damaged rim
      rimMat.color.setHex(0xffaa88);
    } else {
      // Healing rim
      const lerpT = (t - 0.5) / 0.5;
      rimMat.color.lerpColors(
        new THREE.Color(0xffaa88),
        new THREE.Color(0xf97316),
        lerpT
      );
    }
  }

  /**
   * Get the wound bounds for particle spawning
   */
  getWoundBounds(): THREE.Box3 {
    const bounds = new THREE.Box3();
    bounds.setFromObject(this.group);
    return bounds;
  }

  /**
   * Get the wound center position
   */
  getWoundCenter(): THREE.Vector3 {
    const bounds = this.getWoundBounds();
    return bounds.getCenter(new THREE.Vector3());
  }

  /**
   * Get current wound width (for spawning calculations)
   * Uses instance-specific dimensions
   */
  getCurrentWidth(t: number): number {
    const contractionStart = 0.35;
    const contractionEnd = WOUND_GEOMETRY.contractionComplete;

    const initialWidth = this.options.width;
    const finalWidth = initialWidth * (WOUND_GEOMETRY.finalWidth / WOUND_GEOMETRY.initialWidth);

    if (t < contractionStart) return initialWidth;
    if (t > contractionEnd) return finalWidth;

    const progress = (t - contractionStart) / (contractionEnd - contractionStart);
    const easedProgress = easeOutCubic(progress);

    return initialWidth + (finalWidth - initialWidth) * easedProgress;
  }

  /**
   * Get current wound depth (for spawning calculations)
   * Uses instance-specific dimensions
   */
  getCurrentDepth(t: number): number {
    const contractionStart = 0.35;
    const contractionEnd = WOUND_GEOMETRY.contractionComplete;

    const initialDepth = this.options.depth;
    const finalDepth = initialDepth * (WOUND_GEOMETRY.finalDepth / WOUND_GEOMETRY.initialDepth);

    if (t < contractionStart) return initialDepth;
    if (t > contractionEnd) return finalDepth;

    const progress = (t - contractionStart) / (contractionEnd - contractionStart);
    const easedProgress = easeOutCubic(progress);

    return initialDepth + (finalDepth - initialDepth) * easedProgress;
  }

  /**
   * Get current wound spawn bounds based on timeline progress
   * Bounds shrink as wound contracts
   */
  getCurrentSpawnBounds(t: number): THREE.Box3 {
    const currentWidth = this.getCurrentWidth(t);
    const currentDepth = this.getCurrentDepth(t);
    const halfWidth = currentWidth / 2;
    const woundLength = this.options.width * 1.5; // Original length
    const halfLength = woundLength / 2;

    const center = this.options.position;
    const dermisTop = this.options.dermisTop;
    const woundBottom = dermisTop - currentDepth;

    return new THREE.Box3(
      new THREE.Vector3(center.x - halfWidth, woundBottom, center.z - halfLength),
      new THREE.Vector3(center.x + halfWidth, dermisTop, center.z + halfLength)
    );
  }

  /**
   * Set visibility
   */
  setVisible(visible: boolean): void {
    this.group.visible = visible;
  }

  /**
   * Apply clipping planes to wound materials
   */
  setClippingPlanes(planes: THREE.Plane[]): void {
    const cavityMat = this.woundCavityMesh.material as THREE.MeshPhysicalMaterial;
    const rimMat = this.woundRimMesh.material as THREE.MeshPhysicalMaterial;

    cavityMat.clippingPlanes = planes;
    cavityMat.clipShadows = true;

    rimMat.clippingPlanes = planes;
    rimMat.clipShadows = true;
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    this.woundCavityMesh.geometry.dispose();
    this.woundRimMesh.geometry.dispose();
    (this.woundCavityMesh.material as THREE.Material).dispose();
    (this.woundRimMesh.material as THREE.Material).dispose();

    if (this.group.parent) {
      this.group.parent.remove(this.group);
    }
  }
}

export default WoundMesh;
