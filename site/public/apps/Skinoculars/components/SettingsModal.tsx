/**
 * Settings Modal Component
 * Comprehensive settings panel with multiple categories
 */

import React, { useState } from 'react';
import { LangCode } from '../types';

interface SettingsModalProps {
  onClose: () => void;
  lang: LangCode;
  onLangChange: (lang: LangCode) => void;
  autoRotate: boolean;
  tooltipsEnabled: boolean;
  highContrast: boolean;
  onAutoRotateChange: (value: boolean) => void;
  onTooltipsChange: (value: boolean) => void;
  onHighContrastChange: (value: boolean) => void;
  phototype: number;
  onPhototypeChange: (value: number) => void;
  hydration: number;
  onHydrationChange: (value: number) => void;
  phValue: number;
  onPhChange: (value: number) => void;
  palette: string;
  onPaletteChange: (value: string) => void;
  collagenReduced: boolean;
  onCollagenChange: (value: boolean) => void;
}

type SettingsTab = 'general' | 'display' | 'accessibility' | 'about';

export const SettingsModal: React.FC<SettingsModalProps> = ({
  onClose,
  lang,
  onLangChange,
  autoRotate,
  tooltipsEnabled,
  highContrast,
  onAutoRotateChange,
  onTooltipsChange,
  onHighContrastChange,
  phototype,
  onPhototypeChange,
  hydration,
  onHydrationChange,
  phValue,
  onPhChange,
  palette,
  onPaletteChange,
  collagenReduced,
  onCollagenChange
}) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [reducedMotion, setReducedMotion] = useState(() =>
    localStorage.getItem('dermoviz-reduced-motion') === 'true'
  );

  const handleAutoRotateChange = (value: boolean) => {
    onAutoRotateChange(value);
  };

  const handleReducedMotionChange = (value: boolean) => {
    setReducedMotion(value);
    localStorage.setItem('dermoviz-reduced-motion', String(value));
  };

  const handleHighContrastChange = (value: boolean) => {
    onHighContrastChange(value);
  };

  const handleTooltipsChange = (value: boolean) => {
    onTooltipsChange(value);
  };

  const tabs: { id: SettingsTab; label: string; icon: string }[] = [
    { id: 'general', label: 'General', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' },
    { id: 'display', label: 'Display', icon: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
    { id: 'accessibility', label: 'Accessibility', icon: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z' },
    { id: 'about', label: 'About', icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return (
          <div className="space-y-6">
            {/* Language */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Language
              </label>
              <select
                value={lang}
                onChange={e => onLangChange(e.target.value as LangCode)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
              >
                <option value="en">English</option>
                <option value="es">Español</option>
                <option value="ar">العربية</option>
              </select>
              <p className="text-xs text-slate-500 mt-1">
                Choose the language for structure labels and descriptions
              </p>
            </div>

            {/* Tooltips */}
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-medium text-slate-300">
                  Hover Tooltips
                </label>
                <p className="text-xs text-slate-500">
                  Show structure names on hover
                </p>
              </div>
              <button
                onClick={() => handleTooltipsChange(!tooltipsEnabled)}
                className={`
                  relative w-11 h-6 rounded-full transition-colors
                  ${tooltipsEnabled ? 'bg-blue-600' : 'bg-slate-700'}
                `}
              >
                <div
                  className={`
                    absolute top-1 w-4 h-4 rounded-full bg-white transition-transform
                    ${tooltipsEnabled ? 'left-6' : 'left-1'}
                  `}
                />
              </button>
            </div>

            {/* Phototype */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Skin Phototype (I–VI)
              </label>
              <select
                value={phototype}
                onChange={e => onPhototypeChange(Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
              >
                {[1,2,3,4,5,6].map(v => (
                  <option key={v} value={v}>{`Type ${v}`}</option>
                ))}
              </select>
              <p className="text-xs text-slate-500 mt-1">
                Adjust melanin baseline and UV response for realism
              </p>
            </div>

            {/* Hydration */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Stratum Corneum Hydration
              </label>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={hydration}
                onChange={e => onHydrationChange(parseFloat(e.target.value))}
                className="w-full accent-blue-500"
              />
              <p className="text-xs text-slate-500 mt-1">
                Higher hydration slightly speeds turnover and increases translucency
              </p>
            </div>

            {/* Surface pH */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Surface pH (4.0 – 8.0)
              </label>
              <input
                type="range"
                min={4}
                max={8}
                step={0.1}
                value={phValue}
                onChange={e => onPhChange(parseFloat(e.target.value))}
                className="w-full accent-emerald-500"
              />
              <p className="text-xs text-slate-500 mt-1">
                Higher pH weakens barrier and speeds desquamation; lower pH strengthens it
              </p>
            </div>
          </div>
        );

      case 'display':
        return (
          <div className="space-y-6">
            {/* Auto-rotate */}
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-medium text-slate-300">
                  Auto-rotate Model
                </label>
                <p className="text-xs text-slate-500">
                  Slowly rotate the 3D model when idle
                </p>
              </div>
              <button
                onClick={() => handleAutoRotateChange(!autoRotate)}
                className={`
                  relative w-11 h-6 rounded-full transition-colors
                  ${autoRotate ? 'bg-blue-600' : 'bg-slate-700'}
                `}
              >
                <div
                  className={`
                    absolute top-1 w-4 h-4 rounded-full bg-white transition-transform
                    ${autoRotate ? 'left-6' : 'left-1'}
                  `}
                />
              </button>
            </div>

            {/* Palette */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Color Palette
              </label>
              <select
                value={palette}
                onChange={e => onPaletteChange(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
              >
                <option value="clinical">Clinical (natural)</option>
                <option value="he">H&E stain</option>
                <option value="masson">Masson trichrome</option>
              </select>
              <p className="text-xs text-slate-500 mt-1">
                Swap materials to clinical or histology-inspired palettes.
              </p>
            </div>

            {/* Collagen density */}
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-medium text-slate-300">
                  Collagen Density
                </label>
                <p className="text-xs text-slate-500">
                  Reduce collagen instances for clarity or performance.
                </p>
              </div>
              <button
                onClick={() => onCollagenChange(!collagenReduced)}
                className={`
                  relative w-11 h-6 rounded-full transition-colors
                  ${collagenReduced ? 'bg-blue-600' : 'bg-slate-700'}
                `}
              >
                <div
                  className={`
                    absolute top-1 w-4 h-4 rounded-full bg-white transition-transform
                    ${collagenReduced ? 'left-6' : 'left-1'}
                  `}
                />
              </button>
            </div>

            {/* Quality settings info */}
            <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm font-medium text-slate-300">Graphics Quality</span>
              </div>
              <p className="text-xs text-slate-500">
                Graphics quality automatically adjusts based on your device capabilities for optimal performance.
              </p>
            </div>
          </div>
        );

      case 'accessibility':
        return (
          <div className="space-y-6">
            {/* Reduced motion */}
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-medium text-slate-300">
                  Reduced Motion
                </label>
                <p className="text-xs text-slate-500">
                  Minimize animations and transitions
                </p>
              </div>
              <button
                onClick={() => handleReducedMotionChange(!reducedMotion)}
                className={`
                  relative w-11 h-6 rounded-full transition-colors
                  ${reducedMotion ? 'bg-blue-600' : 'bg-slate-700'}
                `}
              >
                <div
                  className={`
                    absolute top-1 w-4 h-4 rounded-full bg-white transition-transform
                    ${reducedMotion ? 'left-6' : 'left-1'}
                  `}
                />
              </button>
            </div>

            {/* High contrast */}
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-medium text-slate-300">
                  High Contrast
                </label>
                <p className="text-xs text-slate-500">
                  Increase contrast for better visibility
                </p>
              </div>
              <button
                onClick={() => handleHighContrastChange(!highContrast)}
                className={`
                  relative w-11 h-6 rounded-full transition-colors
                  ${highContrast ? 'bg-blue-600' : 'bg-slate-700'}
                `}
              >
                <div
                  className={`
                    absolute top-1 w-4 h-4 rounded-full bg-white transition-transform
                    ${highContrast ? 'left-6' : 'left-1'}
                  `}
                />
              </button>
            </div>

            {/* Keyboard shortcuts */}
            <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700">
              <h4 className="text-sm font-medium text-slate-300 mb-3">Keyboard Shortcuts</h4>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Study Mode</span>
                  <kbd className="bg-slate-700 px-1.5 py-0.5 rounded">S</kbd>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Quiz Mode</span>
                  <kbd className="bg-slate-700 px-1.5 py-0.5 rounded">Q</kbd>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Compare Mode</span>
                  <kbd className="bg-slate-700 px-1.5 py-0.5 rounded">C</kbd>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Reset View</span>
                  <kbd className="bg-slate-700 px-1.5 py-0.5 rounded">R</kbd>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Fullscreen</span>
                  <kbd className="bg-slate-700 px-1.5 py-0.5 rounded">F</kbd>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Help</span>
                  <kbd className="bg-slate-700 px-1.5 py-0.5 rounded">H</kbd>
                </div>
              </div>
            </div>
          </div>
        );

      case 'about':
        return (
          <div className="space-y-6">
            {/* App info */}
            <div className="text-center py-4">
              <div className="text-4xl mb-3">🔬</div>
              <h3 className="text-lg font-semibold text-slate-100">Skinoculars</h3>
              <p className="text-sm text-slate-400">Interactive Skin Anatomy</p>
              <p className="text-xs text-slate-500 mt-1">Version 1.0.0</p>
            </div>

            {/* Description */}
            <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
              <p className="text-sm text-slate-400 leading-relaxed">
                An interactive 3D visualization tool for learning skin anatomy.
                Designed for medical students, dermatology residents, and healthcare professionals
                preparing for board examinations.
              </p>
            </div>

            {/* Features */}
            <div>
              <h4 className="text-sm font-medium text-slate-300 mb-3">Features</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Interactive 3D skin model with multiple zoom levels
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Disease pathology visualization
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Quiz mode with board-style questions
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Side-by-side condition comparison
                </li>
              </ul>
            </div>

            {/* Credits */}
            <div className="text-center text-xs text-slate-500 pt-4 border-t border-slate-700">
              <p>Built with React, Three.js, and Tailwind CSS</p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-lg mx-4 shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/70">
          <h2 className="text-lg font-semibold text-slate-100">Settings</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-700/70">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex-1 px-4 py-3 text-sm font-medium transition-colors
                flex items-center justify-center gap-2
                ${activeTab === tab.id
                  ? 'text-blue-400 border-b-2 border-blue-400 bg-slate-800/50'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
                }
              `}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
              </svg>
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {renderTabContent()}
        </div>

        {/* Footer */}
        <div className="flex justify-end px-6 py-4 border-t border-slate-700/70 bg-slate-900/50">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
