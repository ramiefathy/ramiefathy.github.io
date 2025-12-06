/**
 * Application Layout Component
 * Orchestrates the overall page structure with header, navigation, content areas
 * Now with responsive mobile support
 */

import React, { ReactNode, useCallback, useEffect, useState } from 'react';
import { Header } from './Header';
import { LeftNavigation } from './LeftNavigation';
import { BottomControlBar } from './BottomControlBar';
import { Controls } from '../Controls';
import { AppMode } from '../../types/quiz';
import { DiseaseId, ZoomLevelId, SkinLayerVisibility, TimelineId } from '../../types';
import { useMediaQuery } from '../../hooks/useMediaQuery';

interface AppLayoutProps {
  // Mode
  mode: AppMode;
  onModeChange: (mode: AppMode) => void;

  // Navigation
  leftNavCollapsed: boolean;
  onToggleLeftNav: () => void;

  // Visualization controls
  explodeValue: number;
  onExplodeChange: (value: number) => void;
  zoomLevel: ZoomLevelId;
  onZoomChange: (level: ZoomLevelId) => void;
  diseaseId: DiseaseId;
  onDiseaseChange: (id: DiseaseId) => void;
  palette?: string;
  phototype?: number;
  hydration?: number;
  phValue?: number;
  clippingEnabled: boolean;
  clippingValue: number;
  onClippingToggle: () => void;
  onClippingChange: (value: number) => void;
  onResetView: () => void;

  // Visibility controls
  visibility: SkinLayerVisibility;
  onToggleVisibility: (key: keyof SkinLayerVisibility['structures']) => void;
  collagenReduced: boolean;
  onCollagenDensityChange: (light: boolean) => void;
  onToggleLayer: (layer: 'epidermis' | 'dermis' | 'hypodermis') => void;

  // Timeline controls
  timelineId: TimelineId;
  onTimelineChange: (id: TimelineId) => void;
  timelineT: number;
  onTimelineTChange: (t: number) => void;

  // UI callbacks
  onSettingsClick: () => void;
  onHelpClick: () => void;

  // Accessibility
  highContrast?: boolean;
  isXrPresenting?: boolean;
  onAnchorRecenter?: () => void;
  anchorScale?: number;
  onAnchorScaleChange?: (value: number) => void;
  onPaletteCycle?: () => void;

  // Cutaway (cross-section view)
  cutawayEnabled?: boolean;
  onCutawayToggle?: () => void;

  // Content
  children: ReactNode; // 3D scene
  infoPanel?: ReactNode; // Right side info panel
  modeOverlay?: ReactNode; // Quiz mode, etc.
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  mode,
  onModeChange,
  leftNavCollapsed,
  onToggleLeftNav,
  explodeValue,
  onExplodeChange,
  zoomLevel,
  onZoomChange,
  diseaseId,
  onDiseaseChange,
  palette,
  phototype,
  hydration,
  phValue,
  clippingEnabled,
  clippingValue,
  onClippingToggle,
  onClippingChange,
  onResetView,
  visibility,
  onToggleVisibility,
  collagenReduced,
  onCollagenDensityChange,
  onToggleLayer,
  timelineId,
  onTimelineChange,
  timelineT,
  onTimelineTChange,
  onSettingsClick,
  highContrast = false,
  isXrPresenting = false,
  onAnchorRecenter,
  anchorScale = 0.35,
  onAnchorScaleChange,
  onPaletteCycle,
  onHelpClick,
  cutawayEnabled = false,
  onCutawayToggle,
  children,
  infoPanel,
  modeOverlay
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileInfoOpen, setMobileInfoOpen] = useState(false);
  const { isMobile, isTablet } = useMediaQuery();

  // Calculate left nav width based on screen size
  const leftNavWidth = isMobile ? 0 : (leftNavCollapsed ? 60 : 180);

  // Bottom bar height
  const bottomBarHeight = isMobile ? 60 : 70;

  // Header height
  const headerHeight = isMobile ? 44 : 50;

  // Info panel width
  const infoPanelWidth = isMobile ? '100%' : isTablet ? 280 : 320;

  // Fullscreen toggle
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(() => {});
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      }).catch(() => {});
    }
  }, []);

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Close mobile panels when switching away from mobile
  useEffect(() => {
    if (!isMobile) {
      setMobileMenuOpen(false);
      setMobileInfoOpen(false);
    }
  }, [isMobile]);

  // Auto-show info panel on mobile when it exists
  useEffect(() => {
    if (isMobile && infoPanel) {
      setMobileInfoOpen(true);
    }
  }, [isMobile, infoPanel]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case 's':
          if (!e.ctrlKey && !e.metaKey) {
            onModeChange('study');
          }
          break;
        case 'q':
          onModeChange('quiz');
          break;
        case 'c':
          if (!e.ctrlKey && !e.metaKey) {
            onModeChange('compare');
          }
          break;
        case 't':
          onModeChange('tours');
          break;
        case 'r':
          onResetView();
          break;
        case 'h':
        case '?':
          onHelpClick();
          break;
        case 'f':
          toggleFullscreen();
          break;
        case 'escape':
          setMobileMenuOpen(false);
          setMobileInfoOpen(false);
          break;
        case '1':
          onZoomChange('macro');
          break;
        case '2':
          onZoomChange('meso');
          break;
        case '3':
          onZoomChange('micro');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onModeChange, onResetView, onHelpClick, toggleFullscreen, onZoomChange]);

  return (
    <div
      className={`w-screen h-screen bg-slate-950 text-slate-50 overflow-hidden ${highContrast ? 'high-contrast' : ''}`}
      data-high-contrast={highContrast}
    >
      {/* Header */}
      <Header
        onSettingsClick={onSettingsClick}
        onHelpClick={onHelpClick}
        onFullscreenClick={toggleFullscreen}
        isFullscreen={isFullscreen}
        isMobile={isMobile}
        onMenuClick={() => setMobileMenuOpen(!mobileMenuOpen)}
      />

      {/* Left Navigation - Desktop */}
      {!isMobile && (
        <LeftNavigation
          activeMode={mode}
          onModeChange={onModeChange}
          collapsed={leftNavCollapsed}
          onToggleCollapse={onToggleLeftNav}
        />
      )}

      {/* Mobile Menu Overlay */}
      {isMobile && mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            className="
              absolute left-0 top-0 bottom-0 w-64
              bg-slate-900 border-r border-slate-700
              shadow-xl
            "
            onClick={e => e.stopPropagation()}
          >
            {/* Mobile nav content */}
            <div className="p-4 pt-16">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                Mode
              </h3>
              {(['study', 'quiz', 'compare', 'tours'] as AppMode[]).map(m => (
                <button
                  key={m}
                  onClick={() => {
                    onModeChange(m);
                    setMobileMenuOpen(false);
                  }}
                  className={`
                    w-full text-left px-4 py-3 rounded-lg mb-1 text-sm font-medium
                    ${mode === m
                      ? 'bg-blue-600/20 text-blue-300 border border-blue-500/50'
                      : 'text-slate-300 hover:bg-slate-800'
                    }
                  `}
                >
                  {m.charAt(0).toUpperCase() + m.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main content area */}
      <main
        className="fixed transition-all duration-300"
        style={{
          top: headerHeight,
          left: leftNavWidth,
          right: (!isMobile && infoPanel) ? infoPanelWidth : 0,
          bottom: bottomBarHeight
        }}
      >
        {/* 3D Scene */}
        <div className="w-full h-full">
          {children}
        </div>

        {/* Layer/Structure Visibility Controls - Desktop only */}
        {!isMobile && (
            <Controls
              explodeValue={explodeValue}
              onExplodeChange={onExplodeChange}
              visibility={visibility}
              onToggleVisibility={onToggleVisibility}
              collagenReduced={collagenReduced}
              onCollagenDensityChange={onCollagenDensityChange}
              onToggleLayer={onToggleLayer}
              clippingEnabled={clippingEnabled}
              clippingValue={clippingValue}
              onClippingToggle={onClippingToggle}
            onClippingChange={onClippingChange}
            timelineId={timelineId}
            onTimelineChange={onTimelineChange}
            timelineT={timelineT}
            onTimelineTChange={onTimelineTChange}
            cutawayEnabled={cutawayEnabled}
            onCutawayToggle={onCutawayToggle}
          />
        )}

        {/* Mode overlay (Quiz, Tours, etc.) */}
        {modeOverlay && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="pointer-events-auto">
              {modeOverlay}
            </div>
          </div>
        )}
      </main>

      {/* Info Panel - Desktop */}
      {!isMobile && infoPanel && (
        <aside
          className="
            fixed right-0
            bg-slate-900/95 border-l border-slate-700/70
            overflow-y-auto
            transition-all duration-300
          "
          style={{
            top: headerHeight,
            bottom: bottomBarHeight,
            width: infoPanelWidth
          }}
        >
          {infoPanel}
        </aside>
      )}

      {/* Info Panel - Mobile (Bottom Sheet) */}
      {isMobile && infoPanel && (
        <>
          {/* Toggle button */}
          <button
            onClick={() => setMobileInfoOpen(!mobileInfoOpen)}
            className="
              fixed right-4 z-30
              bg-blue-600 text-white
              w-12 h-12 rounded-full
              flex items-center justify-center
              shadow-lg
            "
            style={{ bottom: bottomBarHeight + 16 }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>

          {/* Bottom sheet */}
          {mobileInfoOpen && (
            <div
              className="fixed inset-0 z-40"
              onClick={() => setMobileInfoOpen(false)}
            >
              <div className="absolute inset-0 bg-black/40" />
              <div
                className="
                  absolute left-0 right-0 bottom-0
                  bg-slate-900 border-t border-slate-700
                  rounded-t-2xl
                  max-h-[70vh] overflow-hidden
                "
                onClick={e => e.stopPropagation()}
              >
                {/* Handle */}
                <div className="flex justify-center py-3">
                  <div className="w-10 h-1 rounded-full bg-slate-600" />
                </div>
                {/* Content */}
                <div className="overflow-y-auto max-h-[calc(70vh-40px)]">
                  {infoPanel}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Bottom Control Bar */}
      <BottomControlBar
        explodeValue={explodeValue}
        onExplodeChange={onExplodeChange}
        zoomLevel={zoomLevel}
        onZoomChange={onZoomChange}
        diseaseId={diseaseId}
        onDiseaseChange={onDiseaseChange}
        clippingEnabled={clippingEnabled}
        clippingValue={clippingValue}
        onClippingToggle={onClippingToggle}
        onClippingChange={onClippingChange}
        onResetView={onResetView}
        leftOffset={leftNavWidth}
        isMobile={isMobile}
      />

      {/* Zoom breadcrumb - Hidden on mobile */}
      {!isMobile && (
        <nav
          className="
            fixed left-1/2 -translate-x-1/2
            bg-slate-900/80 border border-slate-700
            rounded-lg px-3 py-1.5 text-[11px] text-slate-300
            z-20
          "
          style={{ bottom: bottomBarHeight + 15 }}
          aria-label="Zoom breadcrumb"
        >
          <div className="flex items-center gap-1">
            <button
              onClick={() => onZoomChange('macro')}
              className={`hover:text-slate-100 transition-colors ${zoomLevel === 'macro' ? 'text-blue-400' : ''}`}
            >
              Skin
            </button>
            <span className="text-slate-500">›</span>
            <button
              onClick={() => onZoomChange('meso')}
              className={`hover:text-slate-100 transition-colors ${zoomLevel === 'meso' ? 'text-blue-400' : ''}`}
            >
              Follicle
            </button>
            <span className="text-slate-500">›</span>
            <button
              onClick={() => onZoomChange('micro')}
              className={`hover:text-slate-100 transition-colors ${zoomLevel === 'micro' ? 'text-blue-400' : ''}`}
            >
              Cells
            </button>
          </div>
        </nav>
      )}

      {/* Cellular zoom indicator */}
      {zoomLevel === 'micro' && (
        <div
          className={`
            fixed left-1/2 -translate-x-1/2
            bg-amber-900/80 border border-amber-600
            rounded-lg px-3 py-1.5 text-amber-100
            z-20 flex items-center gap-2
            ${isMobile ? 'text-[10px]' : 'text-[11px]'}
          `}
          style={{ top: headerHeight + 10 }}
        >
          <span className="text-amber-400">🔬</span>
          <span>{isMobile ? 'Cellular view' : 'Viewing cellular level - Keratinocytes in epidermis'}</span>
        </div>
      )}
    </div>
  );
};

export default AppLayout;
