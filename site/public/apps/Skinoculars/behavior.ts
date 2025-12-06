export const TURNOVER_DAYS = 28;
// Sim time: ~4 minutes for a full 28-day cycle
export const TURNOVER_SIM_SECONDS = 240; // compressed turnover duration

// Lifecycle fractions (sum to 1)
export const LIFECYCLE_FRACTIONS = {
  basal: 0.18,
  spinous: 0.28,
  granular: 0.24,
  corneocyte: 0.30
};

export const LIFECYCLE_PHASES = {
  basal: { duration: 5 },
  spinous: { duration: 7 },
  granular: { duration: 7 },
  corneocyte: { duration: 9 }
};

export type Phototype = 1 | 2 | 3 | 4 | 5 | 6;

export interface PhototypeParams {
  melaninBase: number; // baseline melanin load
  melaninUVBoost: number; // how much UV increases melanin
  transmissionLoss: number; // how much to darken keratinocyte transmission
}

export const PHOTOTYPES: Record<Phototype, PhototypeParams> = {
  1: { melaninBase: 0.05, melaninUVBoost: 0.15, transmissionLoss: 0.05 },
  2: { melaninBase: 0.08, melaninUVBoost: 0.18, transmissionLoss: 0.07 },
  3: { melaninBase: 0.12, melaninUVBoost: 0.2, transmissionLoss: 0.09 },
  4: { melaninBase: 0.18, melaninUVBoost: 0.22, transmissionLoss: 0.12 },
  5: { melaninBase: 0.25, melaninUVBoost: 0.24, transmissionLoss: 0.15 },
  6: { melaninBase: 0.32, melaninUVBoost: 0.26, transmissionLoss: 0.18 }
};

export interface UVState {
  dose: number; // 0-1 normalized recent UV exposure
  decaySeconds: number;
}

export const DEFAULT_UV_STATE: UVState = { dose: 0, decaySeconds: 120 }; // 2 minutes decay window for demo

export interface PHState {
  value: number; // 4.0 - 8.0
}

export const DEFAULT_PH_STATE: PHState = { value: 5.5 };
