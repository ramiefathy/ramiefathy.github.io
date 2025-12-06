/**
 * Wound Healing Visualization Components
 * Exports all wound-related modules
 */

export { TimelineController, useTimelineController } from './TimelineController';
export type { UseTimelineControllerReturn } from './TimelineController';

export { WoundMesh } from './WoundMesh';
export type { WoundMeshOptions } from './WoundMesh';

// Milestone 2: Inflammatory components
export { ClotMesh } from './ClotMesh';
export type { ClotMeshOptions } from './ClotMesh';

export {
  CellParticleSystem,
  PlateletSystem,
  NeutrophilSystem,
  MacrophageSystem,
  FibroblastSystem,
  MyofibroblastSystem
} from './ParticleSystems';

export { VesselSystem } from './VesselSystem';
export type { VesselSystemOptions } from './VesselSystem';

// Re-export phase configuration types and utilities
export {
  WOUND_PHASES,
  WOUND_EVENTS,
  CELL_CONFIGS,
  WOUND_GEOMETRY,
  PARTICLE_CAPS,
  LOD_THRESHOLDS,
  getPhaseAtProgress,
  getDayLabel,
  getCellCountAtProgress,
  getEventsUpToProgress,
  easeOutCubic,
  easeInOutCubic
} from '../../phases';

export type {
  WoundPhase,
  WoundEvent,
  WoundEventId,
  CellConfig
} from '../../phases';
