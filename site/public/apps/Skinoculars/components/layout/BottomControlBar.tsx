/**
 * Bottom Control Bar
 * 3D visualization controls positioned at bottom of screen
 * With responsive mobile support
 */

import React, { useState } from 'react';
import { DiseaseId, ZoomLevelId } from '../../types';
import { DISEASE_PROFILES } from '../../diseaseProfiles';
import { ZOOM_LEVELS } from '../../zoomLevels';

interface BottomControlBarProps {
  // Explode
  explodeValue: number;
  onExplodeChange: (value: number) => void;

  // Zoom
  zoomLevel: ZoomLevelId;
  onZoomChange: (level: ZoomLevelId) => void;

  // Disease/Condition
  diseaseId: DiseaseId;
  onDiseaseChange: (id: DiseaseId) => void;

  // Clipping
  clippingEnabled: boolean;
  clippingValue: number;
  onClippingToggle: () => void;
  onClippingChange: (value: number) => void;

  // Reset
  onResetView: () => void;

  // Layout
  leftOffset: number; // accounts for left nav width
  isMobile?: boolean;
}

export const BottomControlBar: React.FC<BottomControlBarProps> = ({
  explodeValue,
  onExplodeChange,
  zoomLevel,
  onZoomChange,
  diseaseId,
  onDiseaseChange,
  clippingEnabled,
  clippingValue,
  onClippingToggle,
  onClippingChange,
  onResetView,
  leftOffset,
  isMobile = false
}) => {
  const [showMoreControls, setShowMoreControls] = useState(false);

  // Mobile layout - compact with expandable controls
  if (isMobile) {
    return (
      <>
        <div
          className="
            fixed bottom-0 left-0 right-0 h-[60px] z-30
            bg-slate-900/95 border-t border-slate-700/70
            flex items-center justify-between px-3
            backdrop-blur-sm
          "
        >
          {/* Zoom buttons - compact */}
          <div className="flex gap-1">
            {ZOOM_LEVELS.map((z) => (
              <button
                key={z.id}
                onClick={() => onZoomChange(z.id)}
                aria-pressed={zoomLevel === z.id}
                className={`
                  w-10 h-10 rounded-lg text-[10px] font-medium
                  transition-colors duration-150 flex items-center justify-center
                  ${zoomLevel === z.id
                    ? 'bg-blue-600/60 border border-blue-400 text-white'
                    : 'bg-slate-800/80 border border-slate-700 text-slate-400'
                  }
                `}
              >
                {z.id === 'macro' ? '1x' : z.id === 'meso' ? '10x' : '100x'}
              </button>
            ))}
          </div>

          {/* Center: Explode slider (compact) */}
          <div className="flex items-center gap-2 flex-1 mx-3">
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={explodeValue}
              onChange={(e) => onExplodeChange(parseFloat(e.target.value))}
              className="flex-1 accent-blue-500"
              aria-label="Explode layers"
            />
          </div>

          {/* More controls button */}
          <button
            onClick={() => setShowMoreControls(!showMoreControls)}
            className={`
              w-10 h-10 rounded-lg text-[11px]
              flex items-center justify-center
              transition-colors
              ${showMoreControls
                ? 'bg-blue-600/60 border border-blue-400 text-white'
                : 'bg-slate-800/80 border border-slate-700 text-slate-400'
              }
            `}
            aria-label="More controls"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
          </button>

          {/* Reset button */}
          <button
            onClick={onResetView}
            className="
              w-10 h-10 ml-1 rounded-lg text-[11px]
              bg-slate-800/80 border border-slate-700
              text-slate-400 flex items-center justify-center
              transition-colors
            "
            title="Reset view"
            aria-label="Reset view"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>

        {/* Expanded controls panel */}
        {showMoreControls && (
          <div
            className="
              fixed bottom-[60px] left-0 right-0 z-30
              bg-slate-900/95 border-t border-slate-700/70
              p-4 space-y-4 backdrop-blur-sm
            "
          >
            {/* Condition selector */}
            <div className="flex items-center justify-between">
              <label className="text-[12px] text-slate-400">Condition</label>
              <select
                value={diseaseId}
                onChange={(e) => onDiseaseChange(e.target.value as DiseaseId)}
                className="
                  bg-slate-800/90 border border-slate-700
                  rounded px-3 py-2 text-[12px] text-slate-200
                  focus:outline-none focus:border-blue-500
                  flex-1 ml-4
                "
              >
                {DISEASE_PROFILES.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Clipping control */}
            <div className="flex items-center justify-between">
              <label className="inline-flex items-center gap-2 text-[12px] text-slate-400">
                <input
                  type="checkbox"
                  checked={clippingEnabled}
                  onChange={onClippingToggle}
                  className="accent-blue-500 w-4 h-4"
                />
                Cross-section
              </label>
              {clippingEnabled && (
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={clippingValue}
                  onChange={(e) => onClippingChange(parseFloat(e.target.value))}
                  className="flex-1 ml-4 accent-blue-500"
                  aria-label="Clipping plane position"
                />
              )}
            </div>

            {/* Explode with label */}
            <div className="flex items-center justify-between">
              <label className="text-[12px] text-slate-400">
                Explode: {Math.round(explodeValue * 100)}%
              </label>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={explodeValue}
                onChange={(e) => onExplodeChange(parseFloat(e.target.value))}
                className="flex-1 ml-4 accent-blue-500"
                aria-label="Explode layers"
              />
            </div>
          </div>
        )}
      </>
    );
  }

  // Desktop layout - full controls
  return (
    <div
      className="
        fixed bottom-0 right-0 h-[70px] z-30
        bg-slate-900/95 border-t border-slate-700/70
        flex items-center justify-between gap-4 px-4
        backdrop-blur-sm
      "
      style={{ left: leftOffset }}
    >
      {/* Left section: Explode and Clipping */}
      <div className="flex items-center gap-6">
        {/* Explode control */}
        <div className="flex items-center gap-2">
          <label className="text-[11px] text-slate-400 whitespace-nowrap">
            Explode
          </label>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={explodeValue}
            onChange={(e) => onExplodeChange(parseFloat(e.target.value))}
            className="w-24 accent-blue-500"
            aria-label="Explode layers"
          />
          <span className="text-[10px] text-slate-500 w-8">
            {Math.round(explodeValue * 100)}%
          </span>
        </div>

        {/* Clipping control */}
        <div className="flex items-center gap-2">
          <label className="inline-flex items-center gap-1.5 text-[11px] text-slate-400">
            <input
              type="checkbox"
              checked={clippingEnabled}
              onChange={onClippingToggle}
              className="accent-blue-500"
            />
            Clip
          </label>
          {clippingEnabled && (
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={clippingValue}
              onChange={(e) => onClippingChange(parseFloat(e.target.value))}
              className="w-20 accent-blue-500"
              aria-label="Clipping plane position"
            />
          )}
        </div>
      </div>

      {/* Center section: Zoom levels */}
      <div className="flex items-center gap-2">
        <span className="text-[11px] text-slate-400">Zoom</span>
        <div className="flex gap-1">
          {ZOOM_LEVELS.map((z) => (
            <button
              key={z.id}
              onClick={() => onZoomChange(z.id)}
              aria-pressed={zoomLevel === z.id}
              className={`
                px-3 py-1.5 rounded-md text-[11px] font-medium
                transition-colors duration-150
                ${zoomLevel === z.id
                  ? 'bg-blue-600/60 border border-blue-400 text-white'
                  : 'bg-slate-800/80 border border-slate-700 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                }
              `}
            >
              {z.label}
            </button>
          ))}
        </div>
      </div>

      {/* Right section: Condition and Reset */}
      <div className="flex items-center gap-4">
        {/* Condition selector */}
        <div className="flex items-center gap-2">
          <label className="text-[11px] text-slate-400">Condition</label>
          <select
            value={diseaseId}
            onChange={(e) => onDiseaseChange(e.target.value as DiseaseId)}
            className="
              bg-slate-800/90 border border-slate-700
              rounded px-2 py-1.5 text-[11px] text-slate-200
              focus:outline-none focus:border-blue-500
            "
          >
            {DISEASE_PROFILES.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </div>

        {/* Reset button */}
        <button
          onClick={onResetView}
          className="
            px-3 py-1.5 rounded-md text-[11px]
            bg-slate-800/80 border border-slate-700
            text-slate-400 hover:bg-slate-700 hover:text-slate-200
            transition-colors
          "
          title="Reset view (R)"
        >
          ↺ Reset
        </button>
      </div>
    </div>
  );
};

export default BottomControlBar;
