/**
 * ParticleSystems - GPU-instanced cell particle systems for wound healing
 *
 * Implements:
 * - PlateletSystem: Aggregation at wound rim
 * - NeutrophilSystem: Chemotaxis from surrounding tissue
 * - MacrophageSystem: Debris clearing, larger and longer-lived
 * - FibroblastSystem: ECM production (Milestone 3)
 * - MyofibroblastSystem: Wound contraction (Milestone 3)
 */

import * as THREE from 'three';
import { CELL_CONFIGS, PARTICLE_CAPS, getCellCountAtProgress, easeOutCubic, easeInOutCubic } from '../../phases';

export interface ParticleSystemConfig {
  maxParticles: number;
  particleSize: number;
  color: THREE.Color;
  arrivalT: number;
  peakT: number;
  declineT: number;
  spawnRegion: THREE.Box3;
}

interface ParticleData {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
  active: boolean;
  targetPosition: THREE.Vector3;
  phase: 'spawning' | 'active' | 'fading';
}

/**
 * Base class for GPU-instanced cell particle systems
 */
export abstract class CellParticleSystem {
  public readonly instancedMesh: THREE.InstancedMesh;
  protected particles: ParticleData[];
  protected config: ParticleSystemConfig;
  protected activeCount: number = 0;
  protected dummy: THREE.Object3D;
  protected woundCenter: THREE.Vector3;

  constructor(config: ParticleSystemConfig, woundCenter: THREE.Vector3) {
    this.config = config;
    this.woundCenter = woundCenter;
    this.particles = [];
    this.dummy = new THREE.Object3D();

    // Create instanced mesh with spherical geometry
    const geometry = this.createParticleGeometry();
    const material = new THREE.MeshPhysicalMaterial({
      color: config.color,
      roughness: 0.4,
      metalness: 0.1,
      transparent: true,
      opacity: 0.9
    });

    this.instancedMesh = new THREE.InstancedMesh(geometry, material, config.maxParticles);
    this.instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.instancedMesh.frustumCulled = false;

    // Initialize particle pool
    for (let i = 0; i < config.maxParticles; i++) {
      this.particles.push({
        position: new THREE.Vector3(),
        velocity: new THREE.Vector3(),
        life: 0,
        maxLife: 1,
        active: false,
        targetPosition: new THREE.Vector3(),
        phase: 'spawning'
      });

      // Initialize all instances at origin with zero scale
      this.dummy.position.set(0, 0, 0);
      this.dummy.scale.setScalar(0);
      this.dummy.updateMatrix();
      this.instancedMesh.setMatrixAt(i, this.dummy.matrix);
    }

    this.instancedMesh.instanceMatrix.needsUpdate = true;
  }

  protected createParticleGeometry(): THREE.BufferGeometry {
    return new THREE.SphereGeometry(this.config.particleSize, 8, 6);
  }

  /**
   * Get a random position within the spawn region
   */
  protected getSpawnPosition(): THREE.Vector3 {
    const box = this.config.spawnRegion;
    return new THREE.Vector3(
      box.min.x + Math.random() * (box.max.x - box.min.x),
      box.min.y + Math.random() * (box.max.y - box.min.y),
      box.min.z + Math.random() * (box.max.z - box.min.z)
    );
  }

  /**
   * Spawn a new particle if pool is not exhausted
   */
  protected spawnParticle(): number | null {
    for (let i = 0; i < this.particles.length; i++) {
      if (!this.particles[i].active) {
        const p = this.particles[i];
        p.active = true;
        p.position.copy(this.getSpawnPosition());
        p.velocity.set(
          (Math.random() - 0.5) * 0.02,
          (Math.random() - 0.5) * 0.02,
          (Math.random() - 0.5) * 0.02
        );
        p.life = 0;
        p.maxLife = 0.8 + Math.random() * 0.4;
        p.phase = 'spawning';
        p.targetPosition.copy(this.woundCenter);
        this.activeCount++;
        return i;
      }
    }
    return null;
  }

  /**
   * Deactivate a particle and return to pool
   */
  protected despawnParticle(index: number): void {
    if (this.particles[index].active) {
      this.particles[index].active = false;
      this.activeCount--;

      // Hide by scaling to zero
      this.dummy.position.set(0, 0, 0);
      this.dummy.scale.setScalar(0);
      this.dummy.updateMatrix();
      this.instancedMesh.setMatrixAt(index, this.dummy.matrix);
    }
  }

  /**
   * Get target count based on timeline progress
   */
  protected getTargetCount(t: number): number {
    const { arrivalT, peakT, declineT, maxParticles } = this.config;

    if (t < arrivalT) {
      return 0;
    }

    if (t < peakT) {
      // Ramping up
      const progress = (t - arrivalT) / (peakT - arrivalT);
      return Math.floor(maxParticles * easeOutCubic(progress));
    }

    if (t < declineT) {
      // At peak
      return maxParticles;
    }

    // Declining
    const declineProgress = (t - declineT) / (1.0 - declineT);
    return Math.floor(maxParticles * (1 - easeInOutCubic(Math.min(declineProgress * 2, 1))));
  }

  /**
   * Update particle system
   * @param t Timeline progress 0-1
   * @param dt Delta time in seconds
   */
  update(t: number, dt: number): void {
    const targetCount = this.getTargetCount(t);

    // Spawn new particles if under target
    while (this.activeCount < targetCount) {
      const idx = this.spawnParticle();
      if (idx === null) break; // Pool exhausted
    }

    // Despawn particles if over target
    if (this.activeCount > targetCount) {
      let toRemove = this.activeCount - targetCount;
      for (let i = this.particles.length - 1; i >= 0 && toRemove > 0; i--) {
        if (this.particles[i].active) {
          this.particles[i].phase = 'fading';
          toRemove--;
        }
      }
    }

    // Update all particles
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      if (!p.active) continue;

      // Update life
      p.life += dt;

      // Update particle behavior
      this.updateParticleBehavior(p, t, dt);

      // Check for death
      if (p.phase === 'fading' && p.life > p.maxLife * 0.2) {
        this.despawnParticle(i);
        continue;
      }

      // Update instance matrix
      this.dummy.position.copy(p.position);

      // Scale based on phase
      let scale = 1.0;
      if (p.phase === 'spawning') {
        scale = Math.min(p.life / 0.3, 1.0);
        if (scale >= 1.0) p.phase = 'active';
      } else if (p.phase === 'fading') {
        scale = 1.0 - (p.life / (p.maxLife * 0.2));
      }
      this.dummy.scale.setScalar(scale);
      this.dummy.updateMatrix();
      this.instancedMesh.setMatrixAt(i, this.dummy.matrix);
    }

    this.instancedMesh.instanceMatrix.needsUpdate = true;
  }

  /**
   * Override in subclasses for specific cell behaviors
   */
  protected abstract updateParticleBehavior(particle: ParticleData, t: number, dt: number): void;

  /**
   * Get current active particle count
   */
  getActiveCount(): number {
    return this.activeCount;
  }

  /**
   * Set clipping planes for cutaway view
   */
  setClippingPlanes(planes: THREE.Plane[]): void {
    (this.instancedMesh.material as THREE.MeshPhysicalMaterial).clippingPlanes = planes;
  }

  /**
   * Update the spawn region (supports dynamic wound contraction)
   */
  setSpawnRegion(region: THREE.Box3): void {
    this.config.spawnRegion = region.clone();
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    this.instancedMesh.geometry.dispose();
    (this.instancedMesh.material as THREE.Material).dispose();
  }
}

/**
 * PlateletSystem - Aggregation at wound rim
 * First responders, form initial clot
 */
export class PlateletSystem extends CellParticleSystem {
  constructor(woundBounds: THREE.Box3, woundCenter: THREE.Vector3) {
    const cellConfig = CELL_CONFIGS.find(c => c.type === 'platelet')!;

    super({
      maxParticles: PARTICLE_CAPS.platelets,
      particleSize: cellConfig.size,
      color: new THREE.Color(cellConfig.color),
      arrivalT: cellConfig.arrivalT,
      peakT: cellConfig.peakT,
      declineT: cellConfig.declineT,
      spawnRegion: woundBounds.clone()
    }, woundCenter);

    this.instancedMesh.name = 'PlateletSystem';
  }

  protected createParticleGeometry(): THREE.BufferGeometry {
    // Platelets are disc-shaped
    const geometry = new THREE.CylinderGeometry(
      this.config.particleSize,
      this.config.particleSize,
      this.config.particleSize * 0.3,
      8
    );
    geometry.rotateX(Math.random() * Math.PI);
    return geometry;
  }

  protected updateParticleBehavior(particle: ParticleData, t: number, dt: number): void {
    // Platelets aggregate toward wound rim (not center)
    // They cluster together

    // Move toward rim position
    const rimRadius = 0.4;
    const angle = Math.atan2(
      particle.position.z - this.woundCenter.z,
      particle.position.x - this.woundCenter.x
    );

    const targetX = this.woundCenter.x + Math.cos(angle) * rimRadius;
    const targetZ = this.woundCenter.z + Math.sin(angle) * rimRadius;
    const targetY = this.woundCenter.y + 0.1;

    // Gentle movement toward aggregation point
    particle.velocity.x += (targetX - particle.position.x) * 0.02 * dt;
    particle.velocity.z += (targetZ - particle.position.z) * 0.02 * dt;
    particle.velocity.y += (targetY - particle.position.y) * 0.03 * dt;

    // Add slight randomness for organic feel
    particle.velocity.x += (Math.random() - 0.5) * 0.001;
    particle.velocity.z += (Math.random() - 0.5) * 0.001;

    // Damping
    particle.velocity.multiplyScalar(0.98);

    // Apply velocity
    particle.position.add(particle.velocity);
  }
}

/**
 * NeutrophilSystem - First immune cells, chemotaxis toward wound
 * Arrive from surrounding tissue via blood vessels
 */
export class NeutrophilSystem extends CellParticleSystem {
  constructor(woundBounds: THREE.Box3, woundCenter: THREE.Vector3) {
    const cellConfig = CELL_CONFIGS.find(c => c.type === 'neutrophil')!;

    // Neutrophils arrive from outside the wound (expanded spawn region)
    const expandedBounds = woundBounds.clone().expandByScalar(1.5);

    super({
      maxParticles: PARTICLE_CAPS.neutrophils,
      particleSize: cellConfig.size,
      color: new THREE.Color(cellConfig.color),
      arrivalT: cellConfig.arrivalT,
      peakT: cellConfig.peakT,
      declineT: cellConfig.declineT,
      spawnRegion: expandedBounds
    }, woundCenter);

    this.instancedMesh.name = 'NeutrophilSystem';
  }

  protected getSpawnPosition(): THREE.Vector3 {
    // Spawn at wound periphery (simulating arrival from blood vessels)
    const angle = Math.random() * Math.PI * 2;
    const radius = 1.2 + Math.random() * 0.5;
    const height = -0.5 + Math.random() * 0.8;

    return new THREE.Vector3(
      this.woundCenter.x + Math.cos(angle) * radius,
      this.woundCenter.y + height,
      this.woundCenter.z + Math.sin(angle) * radius
    );
  }

  protected updateParticleBehavior(particle: ParticleData, t: number, dt: number): void {
    // Chemotaxis: actively move toward wound center
    const toCenter = new THREE.Vector3()
      .subVectors(this.woundCenter, particle.position);
    const distance = toCenter.length();

    if (distance > 0.1) {
      toCenter.normalize();

      // Strong directional movement with some randomness
      particle.velocity.add(toCenter.multiplyScalar(0.03 * dt));

      // Random walk component (searching behavior)
      particle.velocity.x += (Math.random() - 0.5) * 0.02 * dt;
      particle.velocity.z += (Math.random() - 0.5) * 0.02 * dt;
      particle.velocity.y += (Math.random() - 0.5) * 0.01 * dt;
    } else {
      // At wound center - patrol behavior
      particle.velocity.x += (Math.random() - 0.5) * 0.03 * dt;
      particle.velocity.z += (Math.random() - 0.5) * 0.03 * dt;
    }

    // Damping
    particle.velocity.multiplyScalar(0.95);

    // Apply velocity with speed limit
    const maxSpeed = 0.015;
    if (particle.velocity.length() > maxSpeed) {
      particle.velocity.normalize().multiplyScalar(maxSpeed);
    }

    particle.position.add(particle.velocity);

    // Keep within wound bounds vertically
    particle.position.y = Math.max(
      this.woundCenter.y - 1.5,
      Math.min(this.woundCenter.y + 0.3, particle.position.y)
    );
  }
}

/**
 * MacrophageSystem - Debris clearing, orchestrate healing
 * Larger, arrive later, persist longer
 */
export class MacrophageSystem extends CellParticleSystem {
  private phagocytosisTargets: Map<number, THREE.Vector3> = new Map();

  constructor(woundBounds: THREE.Box3, woundCenter: THREE.Vector3) {
    const cellConfig = CELL_CONFIGS.find(c => c.type === 'macrophage')!;

    const expandedBounds = woundBounds.clone().expandByScalar(1.0);

    super({
      maxParticles: PARTICLE_CAPS.macrophages,
      particleSize: cellConfig.size,
      color: new THREE.Color(cellConfig.color),
      arrivalT: cellConfig.arrivalT,
      peakT: cellConfig.peakT,
      declineT: cellConfig.declineT,
      spawnRegion: expandedBounds
    }, woundCenter);

    this.instancedMesh.name = 'MacrophageSystem';
  }

  protected getSpawnPosition(): THREE.Vector3 {
    // Spawn from tissue edges
    const angle = Math.random() * Math.PI * 2;
    const radius = 1.0 + Math.random() * 0.3;
    const height = -0.8 + Math.random() * 0.6;

    return new THREE.Vector3(
      this.woundCenter.x + Math.cos(angle) * radius,
      this.woundCenter.y + height,
      this.woundCenter.z + Math.sin(angle) * radius
    );
  }

  protected updateParticleBehavior(particle: ParticleData, t: number, dt: number): void {
    // Macrophages have more deliberate, slower movement
    // They patrol and "clean up"

    // Get or assign a phagocytosis target
    const particleIndex = this.particles.indexOf(particle);
    if (!this.phagocytosisTargets.has(particleIndex)) {
      // Random position within wound for patrol
      this.phagocytosisTargets.set(particleIndex, new THREE.Vector3(
        this.woundCenter.x + (Math.random() - 0.5) * 0.8,
        this.woundCenter.y - 0.3 - Math.random() * 0.5,
        this.woundCenter.z + (Math.random() - 0.5) * 0.8
      ));
    }

    const target = this.phagocytosisTargets.get(particleIndex)!;
    const toTarget = new THREE.Vector3().subVectors(target, particle.position);
    const distance = toTarget.length();

    if (distance < 0.1) {
      // Reached target, pick new one (simulating "eating" debris)
      this.phagocytosisTargets.set(particleIndex, new THREE.Vector3(
        this.woundCenter.x + (Math.random() - 0.5) * 0.8,
        this.woundCenter.y - 0.3 - Math.random() * 0.5,
        this.woundCenter.z + (Math.random() - 0.5) * 0.8
      ));
    } else {
      // Move toward target
      toTarget.normalize();
      particle.velocity.add(toTarget.multiplyScalar(0.015 * dt));
    }

    // Slight oscillation for "crawling" effect
    particle.velocity.y += Math.sin(particle.life * 8) * 0.001;

    // Damping
    particle.velocity.multiplyScalar(0.92);

    // Apply velocity
    const maxSpeed = 0.008;
    if (particle.velocity.length() > maxSpeed) {
      particle.velocity.normalize().multiplyScalar(maxSpeed);
    }

    particle.position.add(particle.velocity);
  }
}

/**
 * FibroblastSystem - ECM production (Proliferative phase)
 * Move along collagen scaffolds, produce matrix
 */
export class FibroblastSystem extends CellParticleSystem {
  constructor(woundBounds: THREE.Box3, woundCenter: THREE.Vector3) {
    const cellConfig = CELL_CONFIGS.find(c => c.type === 'fibroblast')!;

    super({
      maxParticles: PARTICLE_CAPS.fibroblasts,
      particleSize: cellConfig.size,
      color: new THREE.Color(cellConfig.color),
      arrivalT: cellConfig.arrivalT,
      peakT: cellConfig.peakT,
      declineT: cellConfig.declineT,
      spawnRegion: woundBounds.clone().expandByScalar(0.5)
    }, woundCenter);

    this.instancedMesh.name = 'FibroblastSystem';
  }

  protected createParticleGeometry(): THREE.BufferGeometry {
    // Fibroblasts are elongated/spindle-shaped
    const geometry = new THREE.CapsuleGeometry(
      this.config.particleSize * 0.5,
      this.config.particleSize * 2,
      4,
      8
    );
    return geometry;
  }

  protected updateParticleBehavior(particle: ParticleData, t: number, dt: number): void {
    // Fibroblasts move in streams through the wound bed
    // Align with scaffold and produce matrix

    // Stream movement - follow general direction
    const streamDir = new THREE.Vector3(
      Math.sin(particle.position.z * 3),
      0,
      Math.cos(particle.position.x * 3)
    ).normalize();

    particle.velocity.add(streamDir.multiplyScalar(0.005 * dt));

    // Slight attraction to wound center
    const toCenter = new THREE.Vector3()
      .subVectors(this.woundCenter, particle.position)
      .normalize();
    particle.velocity.add(toCenter.multiplyScalar(0.002 * dt));

    // Damping
    particle.velocity.multiplyScalar(0.94);

    // Apply velocity
    particle.position.add(particle.velocity);

    // Keep in wound bed
    const maxDist = 1.0;
    const distFromCenter = particle.position.distanceTo(this.woundCenter);
    if (distFromCenter > maxDist) {
      particle.position.sub(
        new THREE.Vector3()
          .subVectors(particle.position, this.woundCenter)
          .normalize()
          .multiplyScalar(distFromCenter - maxDist)
      );
    }
  }
}

/**
 * MyofibroblastSystem - Wound contraction (late Proliferative)
 * Differentiated fibroblasts with contractile properties
 */
export class MyofibroblastSystem extends CellParticleSystem {
  constructor(woundBounds: THREE.Box3, woundCenter: THREE.Vector3) {
    const cellConfig = CELL_CONFIGS.find(c => c.type === 'myofibroblast')!;

    super({
      maxParticles: PARTICLE_CAPS.myofibroblasts,
      particleSize: cellConfig.size,
      color: new THREE.Color(cellConfig.color),
      arrivalT: cellConfig.arrivalT,
      peakT: cellConfig.peakT,
      declineT: cellConfig.declineT,
      spawnRegion: woundBounds.clone()
    }, woundCenter);

    this.instancedMesh.name = 'MyofibroblastSystem';
  }

  protected updateParticleBehavior(particle: ParticleData, t: number, dt: number): void {
    // Myofibroblasts anchor at wound margins and contract
    // They don't move much but "pull" (visual effect)

    // Radial alignment - face center
    const toCenterHoriz = new THREE.Vector3(
      this.woundCenter.x - particle.position.x,
      0,
      this.woundCenter.z - particle.position.z
    ).normalize();

    // Small oscillation for "pulling" effect
    const pull = Math.sin(particle.life * 4 + particle.position.x * 10) * 0.002;
    particle.position.add(toCenterHoriz.multiplyScalar(pull));

    // Very slow inward drift during contraction phase
    if (t > 0.40 && t < 0.65) {
      particle.position.add(toCenterHoriz.multiplyScalar(0.0005 * dt));
    }
  }
}
