/**
 * VesselSystem - Blood vessel dynamics during wound healing
 *
 * Implements:
 * - Vasodilation: Vessels enlarge during inflammatory phase
 * - Color changes: Brighter red when dilated
 * - (Milestone 3) Angiogenesis: New vessel sprouts
 * - (Milestone 4) Regression: Vessel density reduction
 */

import * as THREE from 'three';
import { easeOutCubic, easeInOutCubic } from '../../phases';

export interface VesselSystemOptions {
  woundCenter: THREE.Vector3;
  woundRadius: number;
}

interface VesselData {
  mesh: THREE.Mesh;
  baseScale: THREE.Vector3; // Original scale preserved
  baseColor: THREE.Color;
  distanceFromWound: number;
  isNearWound: boolean;
}

/**
 * System to manage blood vessel behavior during wound healing
 */
export class VesselSystem {
  private vessels: VesselData[] = [];
  private woundCenter: THREE.Vector3;
  private woundRadius: number;

  // Colors
  private normalVesselColor = new THREE.Color(0x990f02);
  private dilatedVesselColor = new THREE.Color(0xff3333);

  // Angiogenesis sprouts (Milestone 3)
  private sprouts: THREE.Mesh[] = [];
  private sproutGroup: THREE.Group;

  constructor(options: VesselSystemOptions) {
    this.woundCenter = options.woundCenter;
    this.woundRadius = options.woundRadius;
    this.sproutGroup = new THREE.Group();
    this.sproutGroup.name = 'AngiogenesisSprouts';
  }

  /**
   * Register existing vessel meshes to be affected by wound healing
   * @param vessels Array of vessel mesh objects
   */
  registerVessels(vessels: THREE.Mesh[]): void {
    this.vessels = vessels.map(mesh => {
      // Get the center of the vessel for distance calculation
      const boundingBox = new THREE.Box3().setFromObject(mesh);
      const center = new THREE.Vector3();
      boundingBox.getCenter(center);

      const distanceFromWound = center.distanceTo(this.woundCenter);
      const isNearWound = distanceFromWound < this.woundRadius * 3;

      // Store base color if material exists
      const material = mesh.material as THREE.MeshPhysicalMaterial;
      const baseColor = material.color ? material.color.clone() : this.normalVesselColor.clone();

      // Store original scale to preserve mesh proportions
      const baseScale = mesh.scale.clone();

      return {
        mesh,
        baseScale,
        baseColor,
        distanceFromWound,
        isNearWound
      };
    });
  }

  /**
   * Update vessel system based on timeline progress
   * @param t Timeline progress 0-1
   */
  update(t: number): void {
    this.updateVasodilation(t);
    this.updateAngiogenesis(t);
    this.updateRegression(t);
  }

  /**
   * Vasodilation: Vessels near wound enlarge during inflammatory phase
   */
  private updateVasodilation(t: number): void {
    // Vasodilation timing
    // t=0: Normal
    // t=0.05-0.30: Dilated (1.5x radius)
    // t=0.30+: Return to normal

    let dilationFactor = 1.0;

    if (t < 0.05) {
      // Rapid onset of dilation
      dilationFactor = 1.0 + easeOutCubic(t / 0.05) * 0.5;
    } else if (t < 0.30) {
      // Peak dilation maintained
      dilationFactor = 1.5;
    } else if (t < 0.50) {
      // Gradual return to normal
      const normalizeProgress = (t - 0.30) / 0.20;
      dilationFactor = 1.5 - easeInOutCubic(normalizeProgress) * 0.5;
    } else {
      dilationFactor = 1.0;
    }

    // Calculate vessel color based on dilation
    const vesselColor = new THREE.Color();
    const colorBlend = Math.max(0, (dilationFactor - 1.0) / 0.5);
    vesselColor.lerpColors(this.normalVesselColor, this.dilatedVesselColor, colorBlend);

    // Apply to each vessel
    this.vessels.forEach(vessel => {
      if (!vessel.isNearWound) return;

      // Distance-based falloff: vessels closer to wound dilate more
      const proximityFactor = 1 - (vessel.distanceFromWound / (this.woundRadius * 3));
      const effectiveDilation = 1 + (dilationFactor - 1) * proximityFactor;

      // Scale vessels - multiply by base scale to preserve original proportions
      vessel.mesh.scale.set(
        vessel.baseScale.x * effectiveDilation,
        vessel.baseScale.y * effectiveDilation,
        vessel.baseScale.z // Keep z (length) unchanged
      );

      // Update color
      const material = vessel.mesh.material as THREE.MeshPhysicalMaterial;
      if (material.color) {
        material.color.copy(vessel.baseColor).lerp(vesselColor, proximityFactor * colorBlend);
      }
    });
  }

  /**
   * Angiogenesis: New vessel sprouts during proliferative phase
   * (To be expanded in Milestone 3)
   */
  private updateAngiogenesis(t: number): void {
    // Angiogenesis starts at t=0.30, peaks at t=0.55
    if (t < 0.30) {
      this.sproutGroup.visible = false;
      return;
    }

    this.sproutGroup.visible = true;

    // Sprout growth progress
    const angiogenesisProgress = Math.min((t - 0.30) / 0.25, 1);

    // Create sprouts if needed (will be expanded in Milestone 3)
    if (this.sprouts.length === 0 && angiogenesisProgress > 0) {
      this.createVesselSprouts();
    }

    // Update sprout visibility and growth
    this.sprouts.forEach((sprout, index) => {
      const sproutDelay = index * 0.05;
      const sproutProgress = Math.max(0, angiogenesisProgress - sproutDelay);

      if (sproutProgress > 0) {
        sprout.visible = true;
        // Grow along z-axis (length)
        sprout.scale.z = easeOutCubic(Math.min(sproutProgress * 3, 1));
        // Subtle pulsing for growth effect
        const pulse = 1 + Math.sin(t * 10 + index) * 0.05;
        sprout.scale.x = sprout.scale.y = pulse;
      } else {
        sprout.visible = false;
      }
    });
  }

  /**
   * Create initial vessel sprouts for angiogenesis
   */
  private createVesselSprouts(): void {
    const sproutCount = 6;
    const sproutMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xff3333,
      roughness: 0.5,
      transparent: true,
      opacity: 0.8
    });

    for (let i = 0; i < sproutCount; i++) {
      const angle = (i / sproutCount) * Math.PI * 2;
      const radius = this.woundRadius * 0.8;

      // Create curved tube toward wound center
      const startPoint = new THREE.Vector3(
        this.woundCenter.x + Math.cos(angle) * radius,
        this.woundCenter.y - 0.5,
        this.woundCenter.z + Math.sin(angle) * radius
      );

      const midPoint = new THREE.Vector3(
        this.woundCenter.x + Math.cos(angle) * radius * 0.5,
        this.woundCenter.y - 0.3,
        this.woundCenter.z + Math.sin(angle) * radius * 0.5
      );

      const endPoint = new THREE.Vector3(
        this.woundCenter.x,
        this.woundCenter.y - 0.1,
        this.woundCenter.z
      );

      const curve = new THREE.CatmullRomCurve3([startPoint, midPoint, endPoint]);
      const geometry = new THREE.TubeGeometry(curve, 12, 0.02, 6, false);

      const sprout = new THREE.Mesh(geometry, sproutMaterial.clone());
      sprout.name = `VesselSprout_${i}`;
      sprout.visible = false;

      this.sprouts.push(sprout);
      this.sproutGroup.add(sprout);
    }
  }

  /**
   * Vessel regression during remodeling phase
   * (To be expanded in Milestone 4)
   */
  private updateRegression(t: number): void {
    // Reset sprouts to visible state when scrubbing backward
    if (t < 0.66) {
      this.sprouts.forEach(sprout => {
        const material = sprout.material as THREE.MeshPhysicalMaterial;
        material.opacity = 0.8;
        // Scale will be set by updateAngiogenesis
      });
      return;
    }

    // Vessels regress: fewer new vessels, sprouts fade
    const regressionProgress = Math.min((t - 0.66) / 0.25, 1);

    // Fade out angiogenesis sprouts using absolute scale values
    this.sprouts.forEach((sprout, i) => {
      const fadeDelay = i * 0.02;
      const fadeProgress = Math.max(0, regressionProgress - fadeDelay);

      const material = sprout.material as THREE.MeshPhysicalMaterial;
      // Use absolute opacity value (0.8 is the base opacity from creation)
      material.opacity = Math.max(0, 0.8 * (1 - fadeProgress));

      // Use absolute scale - sprout starts at scale 1 from angiogenesis growth
      // The x/y scale have a pulse effect, so we preserve that and just shrink overall
      const shrinkFactor = Math.max(0, 1 - fadeProgress);
      const pulse = 1 + Math.sin(t * 10 + i) * 0.05;
      sprout.scale.set(
        pulse * shrinkFactor,
        pulse * shrinkFactor,
        easeOutCubic(1) * shrinkFactor // z was set to full growth
      );
    });
  }

  /**
   * Get the sprout group to add to scene
   */
  getSproutGroup(): THREE.Group {
    return this.sproutGroup;
  }

  /**
   * Set clipping planes for cutaway view
   */
  setClippingPlanes(planes: THREE.Plane[]): void {
    this.vessels.forEach(vessel => {
      const material = vessel.mesh.material as THREE.MeshPhysicalMaterial;
      material.clippingPlanes = planes;
    });

    this.sprouts.forEach(sprout => {
      const material = sprout.material as THREE.MeshPhysicalMaterial;
      material.clippingPlanes = planes;
    });
  }

  /**
   * Dispose of resources
   */
  dispose(): void {
    this.sprouts.forEach(sprout => {
      sprout.geometry.dispose();
      (sprout.material as THREE.Material).dispose();
    });
    this.sprouts = [];
    this.vessels = [];
  }
}
