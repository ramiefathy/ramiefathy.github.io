import { ZoomLevelId } from './types';

export interface CameraPose {
  position: [number, number, number];
  target: [number, number, number];
}

export interface LODConfig {
  instanceMultiplier: number;  // 0.5 = half instances at macro, 1.5 = more at micro
  curveSegments: number;       // TubeGeometry segments for sweat/hair/vessels
  sphereSegments: number;      // SphereGeometry segments for adipocytes/cells
}

export interface ZoomLevel {
  id: ZoomLevelId;
  label: string;
  camera: CameraPose;
  lod: LODConfig;
}

export const ZOOM_LEVELS: ZoomLevel[] = [
  {
    id: 'macro',
    label: 'Layers',
    camera: {
      position: [9, 7, 11],
      target: [0, 0, 0]
    },
    lod: {
      instanceMultiplier: 0.5,
      curveSegments: 40,
      sphereSegments: 8
    }
  },
  {
    id: 'meso',
    label: 'Follicle',
    camera: {
      position: [5, 4, 4],
      target: [0, -0.5, 0]
    },
    lod: {
      instanceMultiplier: 1.0,
      curveSegments: 60,
      sphereSegments: 16
    }
  },
  {
    id: 'micro',
    label: 'Cells',
    camera: {
      position: [2.5, 2.5, 1.5],
      target: [0, 0.7, 0]
    },
    lod: {
      instanceMultiplier: 1.5,
      curveSegments: 80,
      sphereSegments: 24
    }
  }
];

// Helper to get LOD config for a zoom level
export function getLODConfig(zoomLevelId: ZoomLevelId): LODConfig {
  const level = ZOOM_LEVELS.find(z => z.id === zoomLevelId);
  return level?.lod ?? ZOOM_LEVELS[1].lod; // Default to meso LOD
}
