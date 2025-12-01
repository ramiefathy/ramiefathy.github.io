import React, { useRef, useState } from 'react';
import { SkinScene, SkinSceneHandle } from './SkinScene';
import {
  DiseaseId,
  SkinLayerVisibility,
  TimelineId,
  ZoomLevelId
} from '../types';
import { DISEASE_PROFILES } from '../diseaseProfiles';

interface ComparisonViewProps {
  visibility: SkinLayerVisibility;
  onSelectStructure: (id: string | null) => void;
  onHoverStructure?: (id: string | null, x: number, y: number) => void;
  zoomLevelId: ZoomLevelId;
  explodeValue: number;
  clippingNormalized: number | null;
  onClose: () => void;
}

export const ComparisonView: React.FC<ComparisonViewProps> = ({
  visibility,
  onSelectStructure,
  onHoverStructure,
  zoomLevelId,
  explodeValue,
  clippingNormalized,
  onClose
}) => {
  const leftSceneRef = useRef<SkinSceneHandle>(null);
  const rightSceneRef = useRef<SkinSceneHandle>(null);

  const [leftDiseaseId, setLeftDiseaseId] = useState<DiseaseId>('normal');
  const [rightDiseaseId, setRightDiseaseId] = useState<DiseaseId>('psoriasis');

  return (
    <div className="fixed inset-0 z-50 bg-slate-950">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-slate-900/90 border-b border-slate-700 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-sm font-semibold text-slate-100">Comparison View</h2>
          <span className="text-[10px] text-slate-400">Side-by-side disease comparison</span>
        </div>
        <button
          onClick={onClose}
          className="px-3 py-1 rounded-md bg-slate-800 border border-slate-600 text-slate-300 hover:bg-slate-700 text-[11px] transition-colors"
        >
          Exit Comparison
        </button>
      </div>

      {/* Split view container */}
      <div className="absolute top-12 bottom-0 left-0 right-0 flex">
        {/* Left panel */}
        <div className="relative w-1/2 border-r border-slate-700 overflow-hidden">
          {/* Left disease selector */}
          <div className="absolute top-2 left-2 z-10 bg-slate-900/90 border border-slate-700 rounded-lg px-3 py-1.5">
            <div className="flex items-center gap-2 text-[11px]">
              <span className="text-slate-400">Left:</span>
              <select
                value={leftDiseaseId}
                onChange={e => setLeftDiseaseId(e.target.value as DiseaseId)}
                className="bg-slate-800 border border-slate-600 rounded px-2 py-0.5 text-slate-200 text-[11px]"
              >
                {DISEASE_PROFILES.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Left 3D scene */}
          <SkinScene
            ref={leftSceneRef}
            explodeValue={explodeValue}
            visibility={visibility}
            onSelectStructure={onSelectStructure}
            onHoverStructure={onHoverStructure}
            diseaseId={leftDiseaseId}
            timelineId="none"
            timelineT={0}
            zoomLevelId={zoomLevelId}
            activeTourId={null}
            activeTourStepIndex={0}
            clippingNormalized={clippingNormalized}
            collagenReduced={false}
          />

          {/* Left label */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-slate-900/90 border border-slate-700 rounded-lg px-3 py-1 text-[11px] text-slate-300">
            {DISEASE_PROFILES.find(p => p.id === leftDiseaseId)?.label || 'Normal'}
          </div>
        </div>

        {/* Right panel */}
        <div className="relative w-1/2 overflow-hidden">
          {/* Right disease selector */}
          <div className="absolute top-2 right-2 z-10 bg-slate-900/90 border border-slate-700 rounded-lg px-3 py-1.5">
            <div className="flex items-center gap-2 text-[11px]">
              <span className="text-slate-400">Right:</span>
              <select
                value={rightDiseaseId}
                onChange={e => setRightDiseaseId(e.target.value as DiseaseId)}
                className="bg-slate-800 border border-slate-600 rounded px-2 py-0.5 text-slate-200 text-[11px]"
              >
                {DISEASE_PROFILES.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Right 3D scene */}
          <SkinScene
            ref={rightSceneRef}
            explodeValue={explodeValue}
            visibility={visibility}
            onSelectStructure={onSelectStructure}
            onHoverStructure={onHoverStructure}
            diseaseId={rightDiseaseId}
            timelineId="none"
            timelineT={0}
            zoomLevelId={zoomLevelId}
            activeTourId={null}
            activeTourStepIndex={0}
            clippingNormalized={clippingNormalized}
            collagenReduced={false}
          />

          {/* Right label */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-slate-900/90 border border-slate-700 rounded-lg px-3 py-1 text-[11px] text-slate-300">
            {DISEASE_PROFILES.find(p => p.id === rightDiseaseId)?.label || 'Normal'}
          </div>
        </div>

        {/* Center divider indicator */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-px h-8 bg-slate-500"></div>
      </div>
    </div>
  );
};
