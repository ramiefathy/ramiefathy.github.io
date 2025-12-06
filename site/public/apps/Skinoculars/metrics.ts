export const SCALE_MM_TO_SCENE = 1; // 1 scene unit = 1 mm for readability

export const DEFAULT_METRICS = {
  epidermisThicknessMm: 0.12,   // 120 µm
  papillaryDermisHeightMm: 0.3, // peaks of dermal papillae
  dermisThicknessMm: 2.5,
  hypodermisThicknessMm: 4.0,
  skinPatchWidthMm: 6.0,
  skinPatchDepthMm: 6.0,
  follicleDepthMm: 4.0,
  vesselSuperficialRadiusMm: 0.05,
  vesselDeepRadiusMm: 0.12
};

export type SkinSitePreset = 'forearm' | 'scalp' | 'palm';

export const SITE_METRICS: Record<SkinSitePreset, typeof DEFAULT_METRICS> = {
  forearm: DEFAULT_METRICS,
  scalp: {
    ...DEFAULT_METRICS,
    epidermisThicknessMm: 0.08,
    dermisThicknessMm: 2.0,
    hypodermisThicknessMm: 6.0,
    follicleDepthMm: 5.0
  },
  palm: {
    ...DEFAULT_METRICS,
    epidermisThicknessMm: 0.4,
    papillaryDermisHeightMm: 0.5,
    dermisThicknessMm: 3.0,
    skinPatchWidthMm: 5.0,
    skinPatchDepthMm: 5.0
  }
};
