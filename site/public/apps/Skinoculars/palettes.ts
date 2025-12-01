export type PaletteId = 'clinical' | 'he' | 'masson';

export interface LayerMaterialConfig {
  color: number;
  roughness: number;
  metalness: number;
  opacity?: number;
  transmission?: number;
  thickness?: number;
  sssStrength?: number;
}

export interface Palette {
  epidermis: LayerMaterialConfig;
  papillary: LayerMaterialConfig;
  reticular: LayerMaterialConfig;
  hypodermis: LayerMaterialConfig;
  collagen: LayerMaterialConfig;
  vessels: { oxy: number; deoxy: number; roughness: number; metalness: number };
  sweat: LayerMaterialConfig;
  hair: LayerMaterialConfig;
}

export const PALETTES: Record<PaletteId, Palette> = {
  clinical: {
    epidermis: { color: 0xfaa365, roughness: 0.55, metalness: 0, opacity: 0.35, transmission: 0.05, thickness: 0.4 },
    papillary: { color: 0xffd8cb, roughness: 0.8, metalness: 0, opacity: 0.28 },
    reticular: { color: 0xffc9b6, roughness: 0.85, metalness: 0, opacity: 0.25 },
    hypodermis: { color: 0xfff0d6, roughness: 0.9, metalness: 0, opacity: 0.8 },
    collagen: { color: 0xfef3c7, roughness: 0.5, metalness: 0 },
    vessels: { oxy: 0xcc3344, deoxy: 0x8b1a1a, roughness: 0.4, metalness: 0 },
    sweat: { color: 0x38bdf8, roughness: 0.4, metalness: 0, opacity: 0.9 },
    hair: { color: 0x111827, roughness: 0.6, metalness: 0.2 }
  },
  he: {
    epidermis: { color: 0xf0b4c9, roughness: 0.6, metalness: 0, opacity: 0.38 },
    papillary: { color: 0xdcc7eb, roughness: 0.7, metalness: 0, opacity: 0.32 },
    reticular: { color: 0xc5b3e0, roughness: 0.75, metalness: 0, opacity: 0.28 },
    hypodermis: { color: 0xf7e6c7, roughness: 0.9, metalness: 0, opacity: 0.85 },
    collagen: { color: 0xb1a5de, roughness: 0.55, metalness: 0 },
    vessels: { oxy: 0x7c2d44, deoxy: 0x4a1a2c, roughness: 0.45, metalness: 0 },
    sweat: { color: 0x8cc6ff, roughness: 0.45, metalness: 0, opacity: 0.9 },
    hair: { color: 0x0d0b14, roughness: 0.65, metalness: 0.15 }
  },
  masson: {
    epidermis: { color: 0xf6c8b1, roughness: 0.55, metalness: 0, opacity: 0.36 },
    papillary: { color: 0x9fb7ff, roughness: 0.75, metalness: 0, opacity: 0.3 },
    reticular: { color: 0x7c9cff, roughness: 0.8, metalness: 0, opacity: 0.26 },
    hypodermis: { color: 0xf8edd9, roughness: 0.9, metalness: 0, opacity: 0.85 },
    collagen: { color: 0x5f8bff, roughness: 0.6, metalness: 0 },
    vessels: { oxy: 0xb32020, deoxy: 0x701010, roughness: 0.4, metalness: 0 },
    sweat: { color: 0x5ac8ff, roughness: 0.45, metalness: 0, opacity: 0.9 },
    hair: { color: 0x0a0a12, roughness: 0.6, metalness: 0.15 }
  }
};
