/**
 * Wound Healing Phases Configuration
 * Central configuration for all wound healing visualization parameters
 */

export interface WoundPhase {
  id: 'inflammatory' | 'proliferative' | 'remodeling';
  tStart: number;  // 0-1 normalized
  tEnd: number;
  dayStart: number;
  dayEnd: number;
  label: string;
  description: string;
  color: number;
}

export interface CellConfig {
  type: 'platelet' | 'neutrophil' | 'macrophage' | 'fibroblast' | 'keratinocyte' | 'myofibroblast';
  arrivalT: number;
  peakT: number;
  declineT: number;
  maxCount: number;
  color: number;
  size: number;
  sprite?: string;
}

export type WoundEventId =
  | 'clotFormation'
  | 'neutrophilPeak'
  | 'macrophageArrival'
  | 'granulationStart'
  | 'angiogenesisStart'
  | 'reepithelialization50'
  | 'woundContraction'
  | 'reepithelialization100'
  | 'collagenRemodeling'
  | 'scarMaturation';

export interface WoundEvent {
  id: WoundEventId;
  t: number;
  label: string;
  description: string;
}

// Phase definitions with biological timing
export const WOUND_PHASES: WoundPhase[] = [
  {
    id: 'inflammatory',
    tStart: 0,
    tEnd: 0.33,
    dayStart: 0,
    dayEnd: 4,
    label: 'Inflammatory',
    description: 'Hemostasis and inflammation - blood clotting, neutrophil and macrophage recruitment',
    color: 0xff6b6b
  },
  {
    id: 'proliferative',
    tStart: 0.33,
    tEnd: 0.66,
    dayStart: 5,
    dayEnd: 21,
    label: 'Proliferative',
    description: 'Granulation tissue formation, angiogenesis, re-epithelialization, wound contraction',
    color: 0xffd93d
  },
  {
    id: 'remodeling',
    tStart: 0.66,
    tEnd: 1.0,
    dayStart: 21,
    dayEnd: 365,
    label: 'Remodeling',
    description: 'Collagen reorganization, scar maturation, tensile strength recovery',
    color: 0x6bcb77
  }
];

// Cell type configurations with arrival/peak/decline curves
export const CELL_CONFIGS: CellConfig[] = [
  {
    type: 'platelet',
    arrivalT: 0,
    peakT: 0.05,
    declineT: 0.15,
    maxCount: 50,
    color: 0xff6b6b,
    size: 0.03
  },
  {
    type: 'neutrophil',
    arrivalT: 0.02,
    peakT: 0.12,
    declineT: 0.25,
    maxCount: 80,
    color: 0x74b9ff,
    size: 0.06
  },
  {
    type: 'macrophage',
    arrivalT: 0.08,
    peakT: 0.20,
    declineT: 0.50,
    maxCount: 60,
    color: 0x00b894,
    size: 0.08
  },
  {
    type: 'fibroblast',
    arrivalT: 0.15,
    peakT: 0.45,
    declineT: 0.75,
    maxCount: 100,
    color: 0xfdcb6e,
    size: 0.05
  },
  {
    type: 'keratinocyte',
    arrivalT: 0.30,
    peakT: 0.55,
    declineT: 0.70,
    maxCount: 40,
    color: 0xe17055,
    size: 0.04
  },
  {
    type: 'myofibroblast',
    arrivalT: 0.35,
    peakT: 0.50,
    declineT: 0.65,
    maxCount: 30,
    color: 0xd63031,
    size: 0.06
  }
];

// Wound event milestones
export const WOUND_EVENTS: WoundEvent[] = [
  {
    id: 'clotFormation',
    t: 0.05,
    label: 'Clot Formation',
    description: 'Blood clot forms, platelets aggregate'
  },
  {
    id: 'neutrophilPeak',
    t: 0.12,
    label: 'Neutrophil Peak',
    description: 'Neutrophils peak - clearing debris and pathogens'
  },
  {
    id: 'macrophageArrival',
    t: 0.15,
    label: 'Macrophage Arrival',
    description: 'Macrophages arrive - orchestrating healing response'
  },
  {
    id: 'granulationStart',
    t: 0.25,
    label: 'Granulation Begins',
    description: 'Granulation tissue forming at wound base'
  },
  {
    id: 'angiogenesisStart',
    t: 0.30,
    label: 'Angiogenesis Start',
    description: 'New blood vessels sprouting toward wound'
  },
  {
    id: 'reepithelialization50',
    t: 0.45,
    label: 'Epidermis 50% Closed',
    description: 'Keratinocytes have covered half the wound surface'
  },
  {
    id: 'woundContraction',
    t: 0.50,
    label: 'Wound Contraction',
    description: 'Myofibroblasts contracting wound edges'
  },
  {
    id: 'reepithelialization100',
    t: 0.65,
    label: 'Epidermis Closed',
    description: 'Wound surface fully re-epithelialized'
  },
  {
    id: 'collagenRemodeling',
    t: 0.70,
    label: 'Collagen Remodeling',
    description: 'Type III collagen being replaced by Type I'
  },
  {
    id: 'scarMaturation',
    t: 0.90,
    label: 'Scar Maturation',
    description: 'Scar tissue maturing and strengthening'
  }
];

// Helper functions
export function getPhaseAtProgress(t: number): WoundPhase {
  const phase = WOUND_PHASES.find(p => t >= p.tStart && t < p.tEnd);
  return phase || WOUND_PHASES[WOUND_PHASES.length - 1];
}

export function getDayLabel(t: number): string {
  const phase = getPhaseAtProgress(t);
  const phaseProgress = (t - phase.tStart) / (phase.tEnd - phase.tStart);
  const day = phase.dayStart + phaseProgress * (phase.dayEnd - phase.dayStart);

  if (day < 1) return 'Hours after injury';
  if (day < 7) return `Day ${Math.floor(day)}`;
  if (day < 30) return `Week ${Math.floor(day / 7)}`;
  if (day < 365) return `Month ${Math.floor(day / 30)}`;
  return `Year ${Math.floor(day / 365)}`;
}

export function getCellCountAtProgress(config: CellConfig, t: number): number {
  if (t < config.arrivalT) return 0;

  // Arrival phase: ramp up
  if (t < config.peakT) {
    const arrivalProgress = (t - config.arrivalT) / (config.peakT - config.arrivalT);
    return Math.floor(config.maxCount * easeOutQuad(arrivalProgress));
  }

  // Peak to decline
  if (t < config.declineT) {
    return config.maxCount;
  }

  // Decline phase: ramp down
  const declineProgress = (t - config.declineT) / (1 - config.declineT);
  return Math.floor(config.maxCount * (1 - easeInQuad(Math.min(declineProgress, 1))));
}

export function getEventsUpToProgress(t: number): WoundEvent[] {
  return WOUND_EVENTS.filter(e => e.t <= t);
}

// Easing functions
function easeOutQuad(t: number): number {
  return t * (2 - t);
}

function easeInQuad(t: number): number {
  return t * t;
}

export function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export function easeInOutCubic(t: number): number {
  return t < 0.5
    ? 4 * t * t * t
    : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// Wound geometry constants
export const WOUND_GEOMETRY = {
  initialWidth: 1.5,
  initialDepth: 2.0,
  finalWidth: 0.3,  // 80% contraction
  finalDepth: 0.5,  // Scar is shallower
  contractionComplete: 0.65  // Contraction mostly done by t=0.65
};

// Performance caps
export const PARTICLE_CAPS = {
  platelets: 50,
  neutrophils: 80,
  macrophages: 60,
  fibroblasts: 100,
  keratinocytes: 40,
  myofibroblasts: 30
};

// LOD thresholds
export const LOD_THRESHOLDS = {
  particles3D: 15,  // Switch to billboards beyond this camera distance
  detailedGeometry: 20
};
