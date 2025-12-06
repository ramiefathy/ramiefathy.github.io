/**
 * Skinoculars - Main Application Component
 * Refactored to use new layout system
 */

import React, { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import * as THREE from 'three';
import { SkinScene, SkinSceneHandle } from './components/SkinScene';
import { InfoPanel } from './components/InfoPanel';
import { ComparisonView } from './components/ComparisonView';
import { AppLayout } from './components/layout';
import { QuizMode } from './components/quiz';
import { SettingsModal } from './components/SettingsModal';
import { LoadingScreen } from './components/LoadingScreen';
import { PhaseHUD } from './components/ui/PhaseHUD';
import { useMediaQuery } from './hooks/useMediaQuery';
import { useTimelineController } from './components/wound/TimelineController';
import {
  DiseaseId,
  LangCode,
  SkinLayerVisibility,
  StructureData,
  TimelineId,
  ZoomLevelId
} from './types';
import { AppMode } from './types/quiz';
import { STRUCTURE_CONTENT } from './constants';
import { TOURS } from './tours';
import { DEFAULT_METRICS } from './metrics';
import { PaletteId } from './palettes';
import { Phototype, PHOTOTYPES, DEFAULT_UV_STATE, UVState, DEFAULT_PH_STATE, PHState } from './behavior';
import { XRModeSelector } from './components/XRButton';
import XRHUD from './components/XRHUD';

// Help Modal Component
const HelpModal: React.FC<{ onClose: () => void }> = ({ onClose }) => (
  <div
    className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
    onClick={onClose}
  >
    <div
      className="bg-slate-900 border border-slate-700 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl"
      onClick={e => e.stopPropagation()}
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-100">Skinoculars Help</h2>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-200 text-xl"
        >
          ×
        </button>
      </div>

      <div className="space-y-4 text-[12px] text-slate-300">
        <section>
          <h3 className="font-semibold text-slate-200 mb-1">Navigation</h3>
          <ul className="space-y-1 ml-2">
            <li>• <strong>Rotate:</strong> Click and drag</li>
            <li>• <strong>Zoom:</strong> Scroll wheel / pinch</li>
            <li>• <strong>Pan:</strong> Right-click and drag</li>
          </ul>
        </section>

        <section>
          <h3 className="font-semibold text-slate-200 mb-1">Keyboard Shortcuts</h3>
          <ul className="space-y-1 ml-2">
            <li>• <kbd className="bg-slate-800 px-1.5 py-0.5 rounded text-[10px]">S</kbd> Study mode</li>
            <li>• <kbd className="bg-slate-800 px-1.5 py-0.5 rounded text-[10px]">Q</kbd> Quiz mode</li>
            <li>• <kbd className="bg-slate-800 px-1.5 py-0.5 rounded text-[10px]">C</kbd> Compare mode</li>
            <li>• <kbd className="bg-slate-800 px-1.5 py-0.5 rounded text-[10px]">T</kbd> Tours mode</li>
            <li>• <kbd className="bg-slate-800 px-1.5 py-0.5 rounded text-[10px]">R</kbd> Reset view</li>
            <li>• <kbd className="bg-slate-800 px-1.5 py-0.5 rounded text-[10px]">H</kbd> Toggle help</li>
            <li>• <kbd className="bg-slate-800 px-1.5 py-0.5 rounded text-[10px]">F</kbd> Fullscreen</li>
            <li>• <kbd className="bg-slate-800 px-1.5 py-0.5 rounded text-[10px]">1</kbd> <kbd className="bg-slate-800 px-1.5 py-0.5 rounded text-[10px]">2</kbd> <kbd className="bg-slate-800 px-1.5 py-0.5 rounded text-[10px]">3</kbd> Zoom levels</li>
          </ul>
        </section>

        <section>
          <h3 className="font-semibold text-slate-200 mb-1">Features</h3>
          <ul className="space-y-1 ml-2">
            <li>• Click structures to learn about them</li>
            <li>• Use "Explode" slider to separate layers</li>
            <li>• Toggle layers on/off in controls panel</li>
            <li>• Try disease presets to see pathology</li>
            <li>• Take the Quiz to test your knowledge</li>
          </ul>
        </section>
      </div>

      <button
        onClick={onClose}
        className="mt-6 w-full bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-lg text-[12px] font-medium transition-colors"
      >
        Got it!
      </button>
    </div>
  </div>
);


const App: React.FC = () => {
  const sceneRef = useRef<SkinSceneHandle>(null);
  const { isMobile } = useMediaQuery();
  const [xrRenderer, setXrRenderer] = useState<THREE.WebGLRenderer | null>(null);
  const [isXrPresenting, setIsXrPresenting] = useState(false);
  const [anchorScale, setAnchorScale] = useState(0.35);

  // Poll once for renderer availability (set by SkinScene)
  useEffect(() => {
    let cancelled = false;
    const poll = () => {
      if (cancelled) return;
      const r = sceneRef.current?.getRenderer() ?? null;
      if (r) {
        setXrRenderer(r);
      } else {
        requestAnimationFrame(poll);
      }
    };
    poll();
    return () => { cancelled = true; };
  }, []);

  // Track XR presenting state
  useEffect(() => {
    if (!xrRenderer) return;
    const onStart = () => setIsXrPresenting(true);
    const onEnd = () => setIsXrPresenting(false);
    xrRenderer.xr.addEventListener('sessionstart', onStart);
    xrRenderer.xr.addEventListener('sessionend', onEnd);
    // initialize if already presenting
    setIsXrPresenting(xrRenderer.xr.isPresenting);
    return () => {
      xrRenderer.xr.removeEventListener('sessionstart', onStart);
      xrRenderer.xr.removeEventListener('sessionend', onEnd);
    };
  }, [xrRenderer]);

  // App mode
  const [mode, setMode] = useState<AppMode>('study');

  // Language
  const [lang, setLang] = useState<LangCode>('en');

  // Visualization state
  const [explodeValue, setExplodeValue] = useState(0);
  const [visibility, setVisibility] = useState<SkinLayerVisibility>({
    epidermis: true,
    dermis: true,
    hypodermis: true,
    structures: {
      hair: true,
      sweat: true,
      collagen: true,
      nerves: true,
      vessels: true
    }
  });
  const [diseaseId, setDiseaseId] = useState<DiseaseId>('normal');
  const [timelineId, setTimelineId] = useState<TimelineId>('none');
  const [timelineT, setTimelineT] = useState(0);
  const [zoomLevelId, setZoomLevelId] = useState<ZoomLevelId>('macro');
  const [clippingEnabled, setClippingEnabled] = useState(false);
  const [clippingValue, setClippingValue] = useState(0.5);
  const [cutawayEnabled, setCutawayEnabled] = useState(false);

  // Wound healing timeline controller
  const {
    currentPhase,
    dayLabel,
    events: woundEvents,
    setProgress: setWoundProgress
  } = useTimelineController(timelineT, setTimelineT);

  // Selection state
  const [selectedStructure, setSelectedStructure] = useState<StructureData | null>(null);
  const [hoveredStructure, setHoveredStructure] = useState<{ id: string; x: number; y: number } | null>(null);

  // Tour state
  const [activeTourId, setActiveTourId] = useState<string | null>(null);
  const [activeTourStepIndex, setActiveTourStepIndex] = useState(0);

  // UI state
  const [showHelp, setShowHelp] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [showQuizPanel, setShowQuizPanel] = useState(false);
  const [showScience, setShowScience] = useState(false);
  const [palette, setPalette] = useState<PaletteId>('clinical');
  const [phototype, setPhototype] = useState<Phototype>(3);
  const [uvState, setUvState] = useState<UVState>(DEFAULT_UV_STATE);
  const [hydration, setHydration] = useState(0.6); // 0-1
  const [phState, setPhState] = useState<PHState>(DEFAULT_PH_STATE);

  const handleUVPulse = useCallback(() => {
    setUvState(prev => ({ ...prev, dose: 1 }));
    setTimeout(() => setUvState(prev => ({ ...prev, dose: 0 })), 2000);
  }, []);

  // Settings state (read from localStorage)
  const [tooltipsEnabled, setTooltipsEnabled] = useState(() =>
    typeof window !== 'undefined' ? localStorage.getItem('dermoviz-tooltips') !== 'false' : true
  );
  const [autoRotate, setAutoRotate] = useState(() =>
    typeof window !== 'undefined' ? localStorage.getItem('dermoviz-auto-rotate') === 'true' : false
  );
  const [highContrast, setHighContrast] = useState(() =>
    typeof window !== 'undefined' ? localStorage.getItem('dermoviz-high-contrast') === 'true' : false
  );
  const [collagenReduced, setCollagenReduced] = useState(() =>
    typeof window !== 'undefined' ? localStorage.getItem('dermoviz-collagen-reduced') === 'true' : false
  );

  const handleTooltipsChange = useCallback((value: boolean) => {
    setTooltipsEnabled(value);
    if (typeof window !== 'undefined') {
      localStorage.setItem('dermoviz-tooltips', String(value));
    }
  }, []);

  const handleAutoRotateChange = useCallback((value: boolean) => {
    setAutoRotate(value);
    if (typeof window !== 'undefined') {
      localStorage.setItem('dermoviz-auto-rotate', String(value));
    }
  }, []);

  const handleHighContrastChange = useCallback((value: boolean) => {
    setHighContrast(value);
    if (typeof window !== 'undefined') {
      localStorage.setItem('dermoviz-high-contrast', String(value));
    }
  }, []);

  const handleCollagenDensityChange = useCallback((reduced: boolean) => {
    setCollagenReduced(reduced);
    if (typeof window !== 'undefined') {
      localStorage.setItem('dermoviz-collagen-reduced', String(reduced));
    }
  }, []);

  const handlePaletteCycle = useCallback(() => {
    const order: PaletteId[] = ['clinical', 'he', 'masson'];
    const idx = order.indexOf(palette);
    const next = order[(idx + 1) % order.length];
    setPalette(next);
  }, [palette]);

  const handleAnchorScaleChange = useCallback((value: number) => {
    setAnchorScale(value);
    sceneRef.current?.setAnchorScale(value);
  }, []);

  const handleAnchorRecenter = useCallback(() => {
    sceneRef.current?.resetAnchor();
  }, []);

  // Listen for settings changes (when modal updates localStorage)
  React.useEffect(() => {
    const handleStorageChange = () => {
      setTooltipsEnabled(localStorage.getItem('dermoviz-tooltips') !== 'false');
      setAutoRotate(localStorage.getItem('dermoviz-auto-rotate') === 'true');
      setHighContrast(localStorage.getItem('dermoviz-high-contrast') === 'true');
      setCollagenReduced(localStorage.getItem('dermoviz-collagen-reduced') === 'true');
    };

    // Sync settings when another tab updates localStorage
    window.addEventListener('storage', handleStorageChange);

    // Check on modal close (re-read values)
    if (!showSettings) {
      handleStorageChange();
    }

    return () => window.removeEventListener('storage', handleStorageChange);
  }, [showSettings]);

  // Loading state
  const [sceneLoading, setSceneLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);

  const handleLoadingChange = useCallback((loading: boolean, progress: number) => {
    setSceneLoading(loading);
    setLoadingProgress(progress);
  }, []);

  // Quiz click mode state
  const [quizClickMode, setQuizClickMode] = useState(false);
  const [quizClickedStructure, setQuizClickedStructure] = useState<string | null>(null);
  const [leftNavCollapsed, setLeftNavCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('dermoviz-nav-collapsed') === 'true';
    }
    return false;
  });

  // Current tour
  const currentTour = useMemo(
    () => (activeTourId ? TOURS.find(t => t.id === activeTourId) ?? null : null),
    [activeTourId]
  );

  // Handlers
  const handleSelectStructure = useCallback((id: string | null) => {
    // If in quiz click mode, route the click to the quiz instead
    if (quizClickMode && id) {
      setQuizClickedStructure(id);
      // Clear after a short delay to allow re-clicking
      setTimeout(() => setQuizClickedStructure(null), 100);
      return;
    }

    if (!id) {
      setSelectedStructure(null);
      return;
    }
    const data = STRUCTURE_CONTENT[id];
    if (data) {
      setSelectedStructure(data);
    }
  }, [quizClickMode]);

  // Handle quiz click mode request
  const handleQuizClickModeRequest = useCallback((enabled: boolean) => {
    setQuizClickMode(enabled);
    if (!enabled) {
      setQuizClickedStructure(null);
    }
  }, []);

  const handleHover = useCallback((id: string | null, x: number, y: number) => {
    if (id) {
      setHoveredStructure({ id, x, y });
    } else {
      setHoveredStructure(null);
    }
  }, []);

  const handleResetView = useCallback(() => {
    sceneRef.current?.resetView();
    setZoomLevelId('macro');
    setExplodeValue(0);
    setClippingEnabled(false);
  }, []);

  const handleToggleLeftNav = useCallback(() => {
    setLeftNavCollapsed(prev => {
      const newValue = !prev;
      localStorage.setItem('dermoviz-nav-collapsed', String(newValue));
      return newValue;
    });
  }, []);

  const handleModeChange = useCallback((newMode: AppMode) => {
    setMode(newMode);

    // Handle mode-specific logic
    if (newMode === 'compare') {
      setShowComparison(true);
      setShowQuizPanel(false);
    } else if (newMode === 'quiz') {
      setShowQuizPanel(true);
      setShowComparison(false);
    } else {
      setShowComparison(false);
      setShowQuizPanel(false);
    }

    if (newMode === 'tours') {
      // Could auto-start first tour
    } else {
      setActiveTourId(null);
      setActiveTourStepIndex(0);
    }
  }, []);

  // Visibility handlers
  const handleToggleVisibility = useCallback((key: keyof SkinLayerVisibility['structures']) => {
    setVisibility(prev => ({
      ...prev,
      structures: {
        ...prev.structures,
        [key]: !prev.structures[key]
      }
    }));
  }, []);

  const handleToggleLayer = useCallback((layer: 'epidermis' | 'dermis' | 'hypodermis') => {
    setVisibility(prev => ({
      ...prev,
      [layer]: !prev[layer]
    }));
  }, []);

  // Clipping value for scene
  const clippingNormalized = clippingEnabled ? clippingValue : null;

  // Get structure name for hover tooltip
  const getStructureName = (id: string) => {
    const names: Record<string, string> = {
      epidermis: 'Epidermis',
      dermis: 'Dermis',
      hypodermis: 'Hypodermis',
      stratum_corneum: 'Stratum Corneum',
      keratinocytes: 'Keratinocytes',
      collagen: 'Collagen Matrix',
      sweat_gland: 'Sweat Gland',
      hair_follicle: 'Hair Follicle',
      blood_vessels: 'Blood Vessels',
      nerves: 'Nerve Fibers',
      adipose: 'Adipose Tissue',
      arrector_pili: 'Arrector Pili Muscle'
    };
    return names[id] || id;
  };

  // Render mode overlay content
  const renderModeOverlay = () => {
    // Quiz mode is handled by the QuizMode panel, not as an overlay
    if (mode === 'quiz') {
      return null;
    }

    if (mode === 'tours' && currentTour && currentTour.steps[activeTourStepIndex]) {
      return (
        <div className="absolute bottom-4 right-4 max-w-sm bg-slate-900/95 border border-slate-700 rounded-xl shadow-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-slate-100">
              {currentTour.steps[activeTourStepIndex].title}
            </span>
            <button
              onClick={() => { setActiveTourId(null); setActiveTourStepIndex(0); setMode('study'); }}
              className="text-slate-400 hover:text-slate-200"
            >
              ×
            </button>
          </div>
          <p className="text-sm text-slate-300 mb-3">
            {currentTour.steps[activeTourStepIndex].narrative}
          </p>
          <div className="flex items-center justify-between">
            <div className="flex gap-1">
              {currentTour.steps.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveTourStepIndex(idx)}
                  className={`w-2 h-2 rounded-full transition-colors ${idx === activeTourStepIndex ? 'bg-blue-500' : 'bg-slate-600 hover:bg-slate-500'
                    }`}
                />
              ))}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTourStepIndex(i => Math.max(0, i - 1))}
                disabled={activeTourStepIndex === 0}
                className="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-sm disabled:opacity-50"
              >
                Prev
              </button>
              <button
                onClick={() => setActiveTourStepIndex(i => Math.min(currentTour.steps.length - 1, i + 1))}
                disabled={activeTourStepIndex === currentTour.steps.length - 1}
                className="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-sm disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      );
    }

    // Show tour selection list if in tours mode but no active tour
    if (mode === 'tours' && !activeTourId) {
      return (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="max-w-4xl w-full">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-slate-100 mb-2">Guided Tours</h2>
              <p className="text-slate-400">Select a topic to begin an interactive guided tour of the skin.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {TOURS.map(tour => (
                <button
                  key={tour.id}
                  onClick={() => {
                    setActiveTourId(tour.id);
                    setActiveTourStepIndex(0);
                  }}
                  className="bg-slate-900 border border-slate-700 hover:border-blue-500 hover:bg-slate-800 rounded-xl p-5 text-left transition-all group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-slate-200 group-hover:text-blue-400 transition-colors">
                      {tour.label}
                    </h3>
                    <span className="text-xs bg-slate-800 px-2 py-1 rounded text-slate-400 border border-slate-700">
                      {tour.steps.length} steps
                    </span>
                  </div>
                  <p className="text-sm text-slate-400 line-clamp-2">
                    {tour.steps[0]?.narrative || 'Start this tour to learn more.'}
                  </p>
                  <div className="mt-4 flex items-center text-blue-500 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    Start Tour <span>→</span>
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-8 text-center">
              <button
                onClick={() => setMode('study')}
                className="text-slate-400 hover:text-slate-200 text-sm underline underline-offset-4"
              >
                Return to Study Mode
              </button>
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <>
      <AppLayout
        mode={mode}
        onModeChange={handleModeChange}
        leftNavCollapsed={leftNavCollapsed}
        onToggleLeftNav={handleToggleLeftNav}
        explodeValue={explodeValue}
        onExplodeChange={setExplodeValue}
        zoomLevel={zoomLevelId}
        onZoomChange={setZoomLevelId}
        diseaseId={diseaseId}
        onDiseaseChange={setDiseaseId}
        palette={palette}
        phototype={phototype}
        hydration={hydration}
        phValue={phState.value}
        clippingEnabled={clippingEnabled}
        clippingValue={clippingValue}
        onClippingToggle={() => setClippingEnabled(v => !v)}
        onClippingChange={setClippingValue}
        onResetView={handleResetView}
        visibility={visibility}
        onToggleVisibility={handleToggleVisibility}
        collagenReduced={collagenReduced}
        onCollagenDensityChange={handleCollagenDensityChange}
        onToggleLayer={handleToggleLayer}
        timelineId={timelineId}
        onTimelineChange={setTimelineId}
        timelineT={timelineT}
        onTimelineTChange={setTimelineT}
        onSettingsClick={() => setShowSettings(true)}
        onHelpClick={() => setShowHelp(true)}
        highContrast={highContrast}
        isXrPresenting={isXrPresenting}
        onAnchorRecenter={handleAnchorRecenter}
        anchorScale={anchorScale}
        onAnchorScaleChange={handleAnchorScaleChange}
        onPaletteCycle={handlePaletteCycle}
        cutawayEnabled={cutawayEnabled}
        onCutawayToggle={() => setCutawayEnabled(v => !v)}
        infoPanel={
          selectedStructure && mode === 'study' ? (
            <InfoPanel
              data={selectedStructure}
              onClose={() => setSelectedStructure(null)}
              lang={lang}
            />
          ) : undefined
        }
        modeOverlay={renderModeOverlay()}
      >
        {/* 3D Scene */}
        <SkinScene
          ref={sceneRef}
          explodeValue={explodeValue}
          visibility={visibility}
          onSelectStructure={handleSelectStructure}
          onHoverStructure={handleHover}
          diseaseId={diseaseId}
        timelineId={timelineId}
        timelineT={timelineT}
        zoomLevelId={zoomLevelId}
        activeTourId={activeTourId}
        activeTourStepIndex={activeTourStepIndex}
        clippingNormalized={clippingNormalized}
        autoRotate={autoRotate}
        palette={palette}
        phototype={phototype}
        uvState={uvState}
        hydration={hydration}
        phValue={phState.value}
        collagenReduced={collagenReduced}
        onLoadingChange={handleLoadingChange}
        cutawayEnabled={cutawayEnabled}
      />

        {/* Phase HUD for wound healing timeline */}
        {timelineId === 'wound_healing' && !isMobile && (
          <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-20 pointer-events-auto">
            <PhaseHUD
              currentPhase={currentPhase}
              dayLabel={dayLabel}
              t={timelineT}
              onScrub={setWoundProgress}
              events={woundEvents}
              isActive={true}
            />
          </div>
        )}
      </AppLayout>

      {/* Hover tooltip - respects settings */}
      {tooltipsEnabled && hoveredStructure && (
        <div
          className={`fixed bg-slate-800/95 border border-slate-600 rounded px-2 py-1 text-[11px] text-slate-100 pointer-events-none z-50 shadow-lg ${highContrast ? 'border-white text-white' : ''}`}
          style={{
            left: hoveredStructure.x + 12,
            top: hoveredStructure.y - 8,
            transform: 'translateY(-100%)'
          }}
        >
          {getStructureName(hoveredStructure.id)}
        </div>
      )}

      {/* Help modal */}
      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}

      {/* Science overlay toggle & HUD */}
      <button
        className="fixed top-4 right-4 z-40 px-3 py-2 rounded-md bg-slate-800/80 border border-slate-700 text-xs text-slate-200 hover:bg-slate-700"
        onClick={() => setShowScience(v => !v)}
      >
        {showScience ? 'Hide' : 'Show'} Science HUD
      </button>

      {/* UV pulse button */}
      <button
        className="fixed top-4 right-48 z-40 px-3 py-2 rounded-md bg-amber-700/90 border border-amber-500 text-xs text-amber-100 hover:bg-amber-600"
        onClick={handleUVPulse}
      >
        UV Pulse
      </button>

      {showScience && (
        <div className="fixed top-14 right-4 z-30 bg-slate-900/90 border border-slate-700 rounded-lg shadow-lg p-3 text-xs text-slate-200 w-60">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-slate-100">Scale HUD</span>
            <span className="text-[10px] text-slate-500">1 unit = 1 mm</span>
          </div>
          <div className="h-1.5 bg-slate-700 rounded relative mb-2">
            <div className="absolute left-0 top-0 h-1.5 bg-blue-500" style={{ width: '50%' }} />
            <span className="absolute right-0 -top-4 text-[10px] text-slate-400">1 mm</span>
          </div>
          <ul className="space-y-1 text-slate-300">
            <li>Epidermis: {DEFAULT_METRICS.epidermisThicknessMm.toFixed(2)} mm</li>
            <li>Papillary dermis: {DEFAULT_METRICS.papillaryDermisHeightMm.toFixed(2)} mm</li>
            <li>Reticular dermis: {(DEFAULT_METRICS.dermisThicknessMm - DEFAULT_METRICS.papillaryDermisHeightMm).toFixed(2)} mm</li>
            <li>Hypodermis: {DEFAULT_METRICS.hypodermisThicknessMm.toFixed(2)} mm</li>
          </ul>
        </div>
      )}

      {/* Settings modal */}
      {showSettings && (
        <SettingsModal
          onClose={() => setShowSettings(false)}
          lang={lang}
          onLangChange={setLang}
          autoRotate={autoRotate}
          tooltipsEnabled={tooltipsEnabled}
          highContrast={highContrast}
          onAutoRotateChange={handleAutoRotateChange}
          onTooltipsChange={handleTooltipsChange}
          onHighContrastChange={handleHighContrastChange}
          phototype={phototype}
          onPhototypeChange={v => setPhototype(v as any)}
          hydration={hydration}
          onHydrationChange={setHydration}
          phValue={phState.value}
          onPhChange={v => setPhState({ value: v })}
          palette={palette}
          onPaletteChange={(value: string) => setPalette(value as PaletteId)}
          collagenReduced={collagenReduced}
          onCollagenChange={handleCollagenDensityChange}
        />
      )}

      {/* XR mode selector */}
      <div className="fixed bottom-4 left-4 z-40 pointer-events-auto">
        <XRModeSelector
          renderer={xrRenderer}
          domOverlayRoot={document.getElementById('xr-overlay')}
        />
      </div>

      {/* XR DOM overlay root */}
      <div id="xr-overlay" className="fixed inset-0 pointer-events-none z-30" />

      {/* XR HUD overlay */}
      <XRHUD
        isPresenting={isXrPresenting}
        onRecenter={handleAnchorRecenter}
        scale={anchorScale}
        onScaleChange={handleAnchorScaleChange}
        onPaletteCycle={handlePaletteCycle}
        collagenReduced={collagenReduced}
        onCollagenToggle={() => handleCollagenDensityChange(!collagenReduced)}
      />

      {/* Comparison View */}
      {showComparison && (
        <ComparisonView
          visibility={visibility}
          onSelectStructure={handleSelectStructure}
          onHoverStructure={handleHover}
          zoomLevelId={zoomLevelId}
          explodeValue={explodeValue}
          clippingNormalized={clippingNormalized}
          onClose={() => { setShowComparison(false); setMode('study'); }}
        />
      )}

      {/* Quiz Panel */}
      {showQuizPanel && (
        <aside
          className={`
            fixed z-40 transition-all duration-300
            ${isMobile
              ? 'inset-0 bg-slate-900/95'
              : 'right-0 w-[400px]'
            }
          `}
          style={isMobile ? {} : { top: 50, bottom: 70 }}
        >
          <QuizMode
            onExit={() => {
              setShowQuizPanel(false);
              setQuizClickMode(false);
              setMode('study');
            }}
            onRequestClickMode={handleQuizClickModeRequest}
            clickedStructureId={quizClickedStructure}
            isMobile={isMobile}
          />
        </aside>
      )}

      {/* Screen reader announcements */}
      <div aria-live="polite" className="sr-only">
        {selectedStructure && `Selected: ${typeof selectedStructure.title === 'string' ? selectedStructure.title : selectedStructure.title[lang] || selectedStructure.title['en']}`}
        {zoomLevelId === 'micro' && 'Now viewing cellular level'}
      </div>

      {/* Loading screen overlay */}
      {sceneLoading && (
        <LoadingScreen
          progress={loadingProgress}
          message="Loading 3D model..."
        />
      )}
    </>
  );
};

export default App;
