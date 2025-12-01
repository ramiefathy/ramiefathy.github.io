/**
 * PhaseHUD Component
 * Displays wound healing phase indicator, timeline scrubber, and event markers
 */

import React, { useCallback, useMemo, useState } from 'react';
import { WOUND_PHASES, WoundPhase, WoundEvent } from '../../phases';

interface PhaseHUDProps {
  currentPhase: WoundPhase;
  dayLabel: string;
  t: number;
  onScrub: (t: number) => void;
  events: Array<WoundEvent & { fired: boolean }>;
  isActive?: boolean;
  compact?: boolean;
}

export const PhaseHUD: React.FC<PhaseHUDProps> = ({
  currentPhase,
  dayLabel,
  t,
  onScrub,
  events,
  isActive = true,
  compact = false
}) => {
  const [hoveredEvent, setHoveredEvent] = useState<(WoundEvent & { fired: boolean }) | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleSliderChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onScrub(parseFloat(e.target.value));
    },
    [onScrub]
  );

  const handleMouseDown = useCallback(() => {
    setIsDragging(true);
  }, []);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Calculate phase segment positions for visual indicator
  const phaseSegments = useMemo(() => {
    return WOUND_PHASES.map(phase => ({
      ...phase,
      widthPercent: (phase.tEnd - phase.tStart) * 100,
      leftPercent: phase.tStart * 100
    }));
  }, []);

  // Get phase colors
  const getPhaseColor = (phase: WoundPhase, isActive: boolean) => {
    const colors = {
      inflammatory: isActive ? 'bg-red-500' : 'bg-red-900/50',
      proliferative: isActive ? 'bg-amber-500' : 'bg-amber-900/50',
      remodeling: isActive ? 'bg-green-500' : 'bg-green-900/50'
    };
    return colors[phase.id];
  };

  const getPhaseTextColor = (phase: WoundPhase, isActive: boolean) => {
    const colors = {
      inflammatory: isActive ? 'text-red-300' : 'text-red-500/50',
      proliferative: isActive ? 'text-amber-300' : 'text-amber-500/50',
      remodeling: isActive ? 'text-green-300' : 'text-green-500/50'
    };
    return colors[phase.id];
  };

  if (!isActive) return null;

  if (compact) {
    return (
      <div className="bg-slate-900/90 border border-slate-700 rounded-lg px-3 py-2 backdrop-blur-sm">
        {/* Compact: Just phase pill and progress */}
        <div className="flex items-center gap-3">
          <div
            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${getPhaseColor(
              currentPhase,
              true
            )} text-white`}
          >
            {currentPhase.label}
          </div>
          <span className="text-[10px] text-slate-400">{dayLabel}</span>
          <span className="text-[10px] text-slate-500">
            {Math.round(t * 100)}%
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/95 border border-slate-700/70 rounded-xl p-4 min-w-[380px] max-w-[480px] backdrop-blur-sm shadow-2xl">
      {/* Phase indicator pills */}
      <div className="flex gap-2 mb-4">
        {WOUND_PHASES.map(phase => {
          const isCurrentPhase = phase.id === currentPhase.id;
          return (
            <button
              key={phase.id}
              onClick={() => onScrub(phase.tStart + 0.01)}
              className={`
                px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-300
                ${
                  isCurrentPhase
                    ? `${getPhaseColor(phase, true)} text-white shadow-lg scale-105`
                    : `bg-slate-800 ${getPhaseTextColor(
                        phase,
                        false
                      )} hover:bg-slate-700`
                }
              `}
              title={phase.description}
            >
              {phase.label}
            </button>
          );
        })}
      </div>

      {/* Phase progress bar (visual background) */}
      <div className="relative h-2 mb-3 rounded-full overflow-hidden bg-slate-800">
        {phaseSegments.map(segment => (
          <div
            key={segment.id}
            className={`absolute top-0 h-full transition-opacity duration-300 ${getPhaseColor(
              segment,
              t >= segment.tStart && t < segment.tEnd
            )}`}
            style={{
              left: `${segment.leftPercent}%`,
              width: `${segment.widthPercent}%`,
              opacity: t >= segment.tStart ? (t < segment.tEnd ? 0.8 : 0.4) : 0.2
            }}
          />
        ))}
        {/* Progress indicator */}
        <div
          className="absolute top-0 h-full bg-white/30 transition-all duration-150"
          style={{ width: `${t * 100}%` }}
        />
      </div>

      {/* Timeline scrubber with event markers */}
      <div className="relative mb-2">
        <input
          type="range"
          min={0}
          max={1}
          step={0.005}
          value={t}
          onChange={handleSliderChange}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onTouchStart={handleMouseDown}
          onTouchEnd={handleMouseUp}
          className="w-full h-2 appearance-none bg-transparent cursor-pointer relative z-10
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:w-4
            [&::-webkit-slider-thumb]:h-4
            [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:bg-blue-500
            [&::-webkit-slider-thumb]:border-2
            [&::-webkit-slider-thumb]:border-white
            [&::-webkit-slider-thumb]:shadow-lg
            [&::-webkit-slider-thumb]:cursor-grab
            [&::-webkit-slider-thumb]:hover:bg-blue-400
            [&::-webkit-slider-thumb]:active:cursor-grabbing
            [&::-moz-range-thumb]:w-4
            [&::-moz-range-thumb]:h-4
            [&::-moz-range-thumb]:rounded-full
            [&::-moz-range-thumb]:bg-blue-500
            [&::-moz-range-thumb]:border-2
            [&::-moz-range-thumb]:border-white
            [&::-moz-range-thumb]:cursor-grab
          "
        />

        {/* Event markers */}
        <div className="absolute top-0 left-0 right-0 h-2 pointer-events-none">
          {events.map(event => (
            <div
              key={event.id}
              className={`
                absolute w-2.5 h-2.5 rounded-full -top-0.5 transform -translate-x-1/2
                transition-all duration-300 cursor-pointer pointer-events-auto
                ${
                  event.fired
                    ? 'bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.6)]'
                    : 'bg-slate-500 hover:bg-slate-400'
                }
              `}
              style={{ left: `${event.t * 100}%` }}
              onMouseEnter={() => setHoveredEvent(event)}
              onMouseLeave={() => setHoveredEvent(null)}
              onClick={() => onScrub(event.t)}
              title={event.label}
            />
          ))}
        </div>
      </div>

      {/* Day label and progress */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-200">{dayLabel}</span>
          {isDragging && (
            <span className="text-xs text-blue-400 animate-pulse">Scrubbing...</span>
          )}
        </div>
        <span className="text-sm text-slate-400 tabular-nums">
          {Math.round(t * 100)}% complete
        </span>
      </div>

      {/* Hovered event tooltip */}
      {hoveredEvent && (
        <div className="mt-3 pt-3 border-t border-slate-700/50">
          <div className="flex items-start gap-2">
            <div
              className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                hoveredEvent.fired ? 'bg-green-400' : 'bg-slate-500'
              }`}
            />
            <div>
              <div className="text-sm font-medium text-slate-200">
                {hoveredEvent.label}
              </div>
              <div className="text-xs text-slate-400 mt-0.5">
                {hoveredEvent.description}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Current phase description */}
      <div className="mt-3 pt-3 border-t border-slate-700/50">
        <div className="flex items-start gap-2">
          <div
            className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${getPhaseColor(
              currentPhase,
              true
            )}`}
          />
          <div>
            <div className="text-xs text-slate-400">{currentPhase.description}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Minimal version for mobile or embedded use
export const PhaseIndicator: React.FC<{
  currentPhase: WoundPhase;
  dayLabel: string;
  progress: number;
}> = ({ currentPhase, dayLabel, progress }) => {
  const phaseColor = {
    inflammatory: 'bg-red-500',
    proliferative: 'bg-amber-500',
    remodeling: 'bg-green-500'
  }[currentPhase.id];

  return (
    <div className="flex items-center gap-2 bg-slate-900/80 rounded-lg px-3 py-1.5 border border-slate-700/50">
      <div className={`w-2 h-2 rounded-full ${phaseColor}`} />
      <span className="text-xs font-medium text-slate-200">{currentPhase.label}</span>
      <span className="text-xs text-slate-500">|</span>
      <span className="text-xs text-slate-400">{dayLabel}</span>
      <span className="text-xs text-slate-500 ml-auto tabular-nums">
        {Math.round(progress * 100)}%
      </span>
    </div>
  );
};

export default PhaseHUD;
