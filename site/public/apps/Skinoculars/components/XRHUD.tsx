import React from 'react';

interface XRHUDProps {
  isPresenting: boolean;
  onRecenter: () => void;
  scale: number;
  onScaleChange: (value: number) => void;
  onPaletteCycle: () => void;
  collagenReduced: boolean;
  onCollagenToggle: () => void;
}

const XRHUD: React.FC<XRHUDProps> = ({
  isPresenting,
  onRecenter,
  scale,
  onScaleChange,
  onPaletteCycle,
  collagenReduced,
  onCollagenToggle
}) => {
  if (!isPresenting) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-40 pointer-events-auto bg-slate-900/80 border border-slate-700 rounded-xl px-4 py-3 shadow-lg backdrop-blur">
      <div className="flex items-center gap-4 text-sm text-slate-100">
        <button
          onClick={onRecenter}
          className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold"
        >
          Recenter
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-300">Scale</span>
          <input
            type="range"
            min={0.25}
            max={0.7}
            step={0.01}
            value={scale}
            onChange={e => onScaleChange(parseFloat(e.target.value))}
            className="w-28 accent-blue-400"
          />
          <span className="text-xs text-slate-400 w-10 text-right">{scale.toFixed(2)}m</span>
        </div>

        <button
          onClick={onPaletteCycle}
          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-100 border border-slate-600"
        >
          Palette
        </button>

        <button
          onClick={onCollagenToggle}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${collagenReduced ? 'bg-amber-600/80 border-amber-400 text-white' : 'bg-slate-800 border-slate-600 text-slate-100'}`}
        >
          {collagenReduced ? 'Collagen: Low' : 'Collagen: Full'}
        </button>
      </div>
    </div>
  );
};

export default XRHUD;
