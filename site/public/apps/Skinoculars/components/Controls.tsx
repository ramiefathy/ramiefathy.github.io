import React, { useState } from 'react';
import { SkinLayerVisibility, TimelineId } from '../types';

interface ControlsProps {
  explodeValue: number;
  onExplodeChange: (val: number) => void;
  visibility: SkinLayerVisibility;
  onToggleVisibility: (key: keyof SkinLayerVisibility['structures']) => void;
  collagenReduced: boolean;
  onCollagenDensityChange: (light: boolean) => void;
  onToggleLayer: (layer: 'epidermis' | 'dermis' | 'hypodermis') => void;
  clippingEnabled: boolean;
  clippingValue: number;
  onClippingToggle: () => void;
  onClippingChange: (val: number) => void;
  // Timeline controls
  timelineId?: TimelineId;
  onTimelineChange?: (id: TimelineId) => void;
  timelineT?: number;
  onTimelineTChange?: (t: number) => void;
  // Cutaway (cross-section view)
  cutawayEnabled?: boolean;
  onCutawayToggle?: () => void;
}

export const Controls: React.FC<ControlsProps> = ({
  explodeValue,
  onExplodeChange,
  visibility,
  onToggleVisibility,
  collagenReduced,
  onCollagenDensityChange,
  onToggleLayer,
  clippingEnabled,
  clippingValue,
  onClippingToggle,
  onClippingChange,
  timelineId,
  onTimelineChange,
  timelineT,
  onTimelineTChange,
  cutawayEnabled = false,
  onCutawayToggle
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className={`absolute bottom-4 left-4 bg-slate-900/90 border border-slate-700/70 rounded-2xl shadow-xl text-xs text-slate-100 pointer-events-auto transition-all duration-300 ${isCollapsed ? 'max-w-[52px]' : 'max-w-md'
      }`}>
      {/* Collapse toggle button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -top-2 -right-2 w-6 h-6 bg-slate-800 border border-slate-600 rounded-full text-slate-400 hover:text-slate-200 hover:bg-slate-700 transition-colors flex items-center justify-center text-[10px] z-10"
        title={isCollapsed ? 'Expand controls' : 'Collapse controls'}
        aria-expanded={!isCollapsed}
        aria-label={isCollapsed ? 'Expand controls' : 'Collapse controls'}
      >
        {isCollapsed ? '▶' : '◀'}
      </button>

      {isCollapsed ? (
        /* Collapsed state */
        <div className="p-3 flex flex-col items-center gap-2">
          <span className="text-[10px] text-slate-400 writing-mode-vertical" style={{ writingMode: 'vertical-rl' }}>
            Controls
          </span>
        </div>
      ) : (
        /* Expanded state */
        <div className="p-4">
          <h2 className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-2">
            View controls
          </h2>

          {/* Layer explosion */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] text-slate-300">Explode layers</span>
              <span className="text-[10px] text-slate-500">
                {explodeValue.toFixed(2)}
              </span>
            </div>
            <SliderWithTicks
              value={explodeValue}
              onChange={onExplodeChange}
              accentColor="blue"
              tickCount={5}
            />
          </div>

          {/* Layer visibility */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] text-slate-300">Layers</span>
            </div>
            <div className="flex flex-wrap gap-1">
              <ToggleButton
                label="Epidermis"
                active={visibility.epidermis}
                onClick={() => onToggleLayer('epidermis')}
              />
              <ToggleButton
                label="Dermis"
                active={visibility.dermis}
                onClick={() => onToggleLayer('dermis')}
              />
              <ToggleButton
                label="Hypodermis"
                active={visibility.hypodermis}
                onClick={() => onToggleLayer('hypodermis')}
              />
            </div>
          </div>

          {/* Structure visibility */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] text-slate-300">Structures</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <ToggleButton
                label="Hair"
                active={visibility.structures.hair}
                onClick={() => onToggleVisibility('hair')}
              />
              <ToggleButton
                label="Sweat"
                active={visibility.structures.sweat}
                onClick={() => onToggleVisibility('sweat')}
              />
              <ToggleButton
                label="Vessels"
                active={visibility.structures.vessels}
                onClick={() => onToggleVisibility('vessels')}
              />
              <ToggleButton
                label="Nerves"
                active={visibility.structures.nerves}
                onClick={() => onToggleVisibility('nerves')}
              />
              <ToggleButton
                label="Collagen"
                active={visibility.structures.collagen}
                onClick={() => onToggleVisibility('collagen')}
              />
            </div>
          </div>

          {/* Collagen density */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] text-slate-300">Collagen density</span>
              <button
                onClick={() => onCollagenDensityChange(!collagenReduced)}
                className={`relative w-11 h-6 rounded-full transition-colors ${collagenReduced ? 'bg-emerald-500' : 'bg-slate-700'}`}
                aria-label="Toggle lighter collagen"
              >
                <div
                  className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${collagenReduced ? 'left-6' : 'left-1'}`}
                />
              </button>
            </div>
            <p className="text-[10px] text-slate-500">
              Lighten collagen fibers to see deeper dermis structures
            </p>
          </div>

          {/* Clipping plane */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] text-slate-300">Slice view</span>
              <label className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                <input
                  type="checkbox"
                  checked={clippingEnabled}
                  onChange={onClippingToggle}
                  className="accent-blue-500"
                />
                <span>{clippingEnabled ? 'On' : 'Off'}</span>
              </label>
            </div>
            <SliderWithTicks
              value={clippingValue}
              onChange={onClippingChange}
              accentColor="emerald"
              tickCount={5}
              disabled={!clippingEnabled}
            />
          </div>

          {/* Timeline controls */}
          {onTimelineChange && onTimelineTChange && (
            <div className="mb-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] text-slate-300">Timeline</span>
              </div>
              <select
                value={timelineId || 'none'}
                onChange={e => onTimelineChange(e.target.value as TimelineId)}
                className="w-full mb-2 px-2 py-1.5 rounded bg-slate-800 border border-slate-600 text-[11px] text-slate-200 focus:outline-none focus:border-blue-500"
              >
                <option value="none">None</option>
                <option value="wound_healing">Wound Healing</option>
              </select>
              {timelineId && timelineId !== 'none' && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-slate-400">Progress</span>
                    <span className="text-[10px] text-slate-500">
                      {((timelineT || 0) * 100).toFixed(0)}%
                    </span>
                  </div>
                  <SliderWithTicks
                    value={timelineT || 0}
                    onChange={onTimelineTChange}
                    accentColor="blue"
                    tickCount={5}
                  />
                </div>
              )}
            </div>
          )}

          {/* Cross-section (Cutaway) view */}
          {onCutawayToggle && timelineId === 'wound_healing' && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] text-slate-300">Cross-section</span>
                <label className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                  <input
                    type="checkbox"
                    checked={cutawayEnabled}
                    onChange={onCutawayToggle}
                    className="accent-blue-500"
                  />
                  <span>{cutawayEnabled ? 'On' : 'Off'}</span>
                </label>
              </div>
              <p className="text-[10px] text-slate-500">
                View internal wound structure
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const SliderWithTicks = ({
  value,
  onChange,
  accentColor,
  tickCount,
  disabled = false
}: {
  value: number;
  onChange: (val: number) => void;
  accentColor: 'blue' | 'emerald';
  tickCount: number;
  disabled?: boolean;
}) => {
  const ticks = Array.from({ length: tickCount }, (_, i) => i / (tickCount - 1));
  const accentClass = accentColor === 'blue' ? 'accent-blue-500' : 'accent-emerald-500';

  return (
    <div className="relative">
      <input
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        disabled={disabled}
        className={`w-full ${accentClass} disabled:opacity-40 cursor-pointer opacity-100`}
      />
      {/* Tick marks */}
      <div className="absolute top-4 left-0 right-0 flex justify-between px-0.5 pointer-events-none">
        {ticks.map((tick, i) => (
          <div
            key={i}
            className={`w-0.5 h-1 rounded-full ${disabled ? 'bg-slate-700' : 'bg-slate-500'}`}
          />
        ))}
      </div>
    </div>
  );
};

const ToggleButton = ({
  label,
  active,
  onClick
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    aria-pressed={active}
    aria-label={`Toggle ${label} visibility`}
    className={`px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all duration-200 border
      ${active
        ? 'bg-blue-600/20 border-blue-500 text-blue-200 shadow-[0_0_10px_rgba(59,130,246,0.3)]'
        : 'bg-slate-800/50 border-slate-600 text-slate-500 hover:bg-slate-800 hover:text-slate-300'
      }
    `}
  >
    {label}
  </button>
);
