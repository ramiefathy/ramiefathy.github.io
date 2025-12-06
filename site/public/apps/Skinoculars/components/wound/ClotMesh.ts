/**
 * ClotMesh - Blood clot and scab visualization
 *
 * Renders a fibrin-textured clot that:
 * - Forms at wound surface during hemostasis
 * - Transitions from bright red → dark red → brown/black scab
 * - Shrinks and lifts as healing progresses
 */

import * as THREE from 'three';
import { WOUND_GEOMETRY, easeOutCubic } from '../../phases';

export interface ClotMeshOptions {
  woundWidth?: number;
  woundDepth?: number;
  textureSize?: number;
}

export class ClotMesh {
  public readonly group: THREE.Group;
  private clotMesh: THREE.Mesh;
  private material: THREE.MeshPhysicalMaterial;
  private fibrinTexture: THREE.DataTexture;

  constructor(options: ClotMeshOptions = {}) {
    const {
      woundWidth = WOUND_GEOMETRY.initialWidth,
      woundDepth = WOUND_GEOMETRY.initialDepth,
      textureSize = 128
    } = options;

    this.group = new THREE.Group();
    this.group.name = 'ClotMesh';

    // Generate fibrin noise texture
    this.fibrinTexture = this.generateFibrinTexture(textureSize);

    // Create clot material with fibrin texture
    this.material = new THREE.MeshPhysicalMaterial({
      map: this.fibrinTexture,
      color: 0xcc0000, // Bright red initially
      roughness: 0.8,
      metalness: 0.1,
      transparent: true,
      alphaTest: 0.3, // Alpha-tested for performance
      side: THREE.DoubleSide,
      depthWrite: true
    });

    // Create clot geometry - slightly domed disc at wound opening
    const clotGeometry = this.createClotGeometry(woundWidth, woundDepth);
    this.clotMesh = new THREE.Mesh(clotGeometry, this.material);
    this.clotMesh.name = 'ClotSurface';
    this.clotMesh.position.y = 0.05; // Slightly above wound surface

    this.group.add(this.clotMesh);

    // Initially invisible - appears after t=0.02
    this.group.visible = false;
  }

  /**
   * Generate procedural fibrin mesh texture
   * Creates interconnected strand pattern with gaps
   */
  private generateFibrinTexture(size: number): THREE.DataTexture {
    const data = new Uint8Array(size * size * 4);

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const i = (y * size + x) * 4;

        // Multiple layers of noise for fibrin appearance
        const nx = x / size;
        const ny = y / size;

        // Base noise for strand pattern
        const noise1 = this.fractalNoise(nx * 8, ny * 8, 4);
        const noise2 = this.fractalNoise(nx * 12 + 100, ny * 12 + 100, 3);

        // Strand pattern - elongated structures
        const strandX = Math.sin(nx * Math.PI * 6 + noise1 * 2) * 0.5 + 0.5;
        const strandY = Math.sin(ny * Math.PI * 8 + noise2 * 2) * 0.5 + 0.5;
        const strands = (strandX + strandY) * 0.5;

        // Combine for fibrin mesh look
        const combined = strands * 0.6 + noise1 * 0.4;

        // Create holes in the mesh (gaps between fibrin strands)
        const alpha = combined > 0.35 ? 1.0 : 0.0;

        // Color variation within the clot
        const colorVar = 0.8 + noise2 * 0.2;

        data[i] = Math.floor(255 * colorVar); // R
        data[i + 1] = Math.floor(50 * colorVar); // G
        data[i + 2] = Math.floor(50 * colorVar); // B
        data[i + 3] = Math.floor(255 * alpha); // A
      }
    }

    const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.needsUpdate = true;
    return texture;
  }

  /**
   * Simple fractal noise for texture generation
   */
  private fractalNoise(x: number, y: number, octaves: number): number {
    let value = 0;
    let amplitude = 1;
    let frequency = 1;
    let maxValue = 0;

    for (let i = 0; i < octaves; i++) {
      value += this.noise2D(x * frequency, y * frequency) * amplitude;
      maxValue += amplitude;
      amplitude *= 0.5;
      frequency *= 2;
    }

    return value / maxValue;
  }

  /**
   * Simple 2D noise function
   */
  private noise2D(x: number, y: number): number {
    const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
    return n - Math.floor(n);
  }

  /**
   * Create clot geometry - properly domed elliptical disc using concentric rings
   */
  private createClotGeometry(woundWidth: number, woundDepth: number): THREE.BufferGeometry {
    const radiusX = woundWidth * 0.5;
    const radiusZ = woundDepth * 0.35;
    const radialSegments = 32; // Segments around the perimeter
    const ringCount = 8; // Concentric rings from center to edge
    const domeHeight = 0.15;

    const vertices: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];

    // Center vertex (top of dome)
    vertices.push(0, domeHeight, 0);
    uvs.push(0.5, 0.5);

    // Create concentric rings from center outward
    for (let ring = 1; ring <= ringCount; ring++) {
      const ringRadius = ring / ringCount; // 0 to 1

      for (let seg = 0; seg < radialSegments; seg++) {
        const angle = (seg / radialSegments) * Math.PI * 2;

        // Elliptical position
        const x = Math.cos(angle) * radiusX * ringRadius;
        const z = Math.sin(angle) * radiusZ * ringRadius;

        // Dome height - smooth falloff from center
        const domeProfile = Math.sqrt(Math.max(0, 1 - ringRadius * ringRadius));
        const y = domeProfile * domeHeight;

        vertices.push(x, y, z);

        // UV mapping
        const u = (Math.cos(angle) * ringRadius + 1) / 2;
        const v = (Math.sin(angle) * ringRadius + 1) / 2;
        uvs.push(u, v);
      }
    }

    // Create triangles
    // First ring: triangles from center to first ring
    for (let seg = 0; seg < radialSegments; seg++) {
      const nextSeg = (seg + 1) % radialSegments;
      indices.push(
        0, // center
        1 + seg, // current segment on first ring
        1 + nextSeg // next segment on first ring
      );
    }

    // Subsequent rings: quads between rings
    for (let ring = 1; ring < ringCount; ring++) {
      const ringStart = 1 + (ring - 1) * radialSegments;
      const nextRingStart = 1 + ring * radialSegments;

      for (let seg = 0; seg < radialSegments; seg++) {
        const nextSeg = (seg + 1) % radialSegments;

        const a = ringStart + seg;
        const b = ringStart + nextSeg;
        const c = nextRingStart + seg;
        const d = nextRingStart + nextSeg;

        // Two triangles per quad
        indices.push(a, c, b);
        indices.push(b, c, d);
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();

    return geometry;
  }

  /**
   * Update clot appearance based on timeline progress
   * @param t Progress 0-1
   */
  update(t: number): void {
    // Clot formation starts at t=0.02, visible by t=0.05
    if (t < 0.02) {
      this.group.visible = false;
      return;
    }

    this.group.visible = true;

    // Formation animation (t=0.02 to t=0.08)
    if (t < 0.08) {
      const formationProgress = (t - 0.02) / 0.06;
      this.clotMesh.scale.setScalar(easeOutCubic(formationProgress));
      this.material.opacity = easeOutCubic(formationProgress);
    } else {
      this.clotMesh.scale.setScalar(1.0);
      this.material.opacity = 1.0;
    }

    // Color transition
    this.updateClotColor(t);

    // Scab shrinking and lifting (t > 0.50)
    this.updateScabRegression(t);
  }

  /**
   * Update clot color through phases
   * Bright red → Dark red → Brown/black scab
   */
  private updateClotColor(t: number): void {
    const color = new THREE.Color();

    if (t < 0.08) {
      // Fresh blood - bright red
      color.setHex(0xcc0000);
    } else if (t < 0.15) {
      // Coagulating - darkening
      const progress = (t - 0.08) / 0.07;
      color.lerpColors(
        new THREE.Color(0xcc0000),
        new THREE.Color(0x8b0000),
        progress
      );
    } else if (t < 0.30) {
      // Clot maturing - dark red to maroon
      const progress = (t - 0.15) / 0.15;
      color.lerpColors(
        new THREE.Color(0x8b0000),
        new THREE.Color(0x4a0000),
        progress
      );
    } else {
      // Scab - brown/black
      const progress = Math.min((t - 0.30) / 0.20, 1);
      color.lerpColors(
        new THREE.Color(0x4a0000),
        new THREE.Color(0x2a1a0a),
        progress
      );
    }

    this.material.color = color;
  }

  /**
   * Animate scab shrinking and lifting as re-epithelialization progresses
   */
  private updateScabRegression(t: number): void {
    if (t < 0.50) {
      this.clotMesh.position.y = 0.05;
      return;
    }

    // Scab shrinks from edges
    const regressionProgress = (t - 0.50) / 0.30;
    const scabScale = Math.max(0, 1.0 - regressionProgress * 1.2);
    this.clotMesh.scale.setScalar(scabScale);

    // Scab lifts up slightly as it detaches
    this.clotMesh.position.y = 0.05 + regressionProgress * 0.2;

    // Fade out completely by t=0.75
    if (t > 0.65) {
      const fadeProgress = (t - 0.65) / 0.10;
      this.material.opacity = Math.max(0, 1.0 - fadeProgress);
    }

    // Hide completely once gone
    if (t > 0.75) {
      this.group.visible = false;
    }
  }

  /**
   * Set clipping planes for cutaway view
   */
  setClippingPlanes(planes: THREE.Plane[]): void {
    this.material.clippingPlanes = planes;
    this.material.clipShadows = true;
  }

  /**
   * Dispose of resources
   */
  dispose(): void {
    this.fibrinTexture.dispose();
    this.material.dispose();
    this.clotMesh.geometry.dispose();
  }
}
