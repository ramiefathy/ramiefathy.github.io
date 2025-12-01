/**
 * Global Application Context for DermoViz 3D
 * Centralizes state management for the entire application
 */

import React, { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react';
import {
  DiseaseId,
  LangCode,
  SkinLayerVisibility,
  StructureData,
  TimelineId,
  ZoomLevelId
} from '../types';
import { AppMode, QuizState, INITIAL_QUIZ_STATE } from '../types/quiz';
import { STRUCTURE_CONTENT } from '../constants';

// Visualization state
interface VisualizationState {
  explodeValue: number;
  visibility: SkinLayerVisibility;
  diseaseId: DiseaseId;
  timelineId: TimelineId;
  timelineT: number;
  zoomLevelId: ZoomLevelId;
  clippingEnabled: boolean;
  clippingValue: number;
}

// Selection state
interface SelectionState {
  selectedStructure: StructureData | null;
  hoveredStructure: { id: string; x: number; y: number } | null;
}

// App context value type
interface AppContextValue {
  // Mode
  mode: AppMode;
  setMode: (mode: AppMode) => void;

  // Language
  lang: LangCode;
  setLang: (lang: LangCode) => void;

  // Visualization
  visualization: VisualizationState;
  setExplodeValue: (value: number) => void;
  setVisibility: (visibility: SkinLayerVisibility) => void;
  toggleStructureVisibility: (key: keyof SkinLayerVisibility['structures']) => void;
  toggleLayerVisibility: (layer: 'epidermis' | 'dermis' | 'hypodermis') => void;
  setDiseaseId: (id: DiseaseId) => void;
  setTimelineId: (id: TimelineId) => void;
  setTimelineT: (t: number) => void;
  setZoomLevelId: (id: ZoomLevelId) => void;
  setClippingEnabled: (enabled: boolean) => void;
  setClippingValue: (value: number) => void;

  // Selection
  selection: SelectionState;
  selectStructure: (id: string | null) => void;
  setHoveredStructure: (structure: { id: string; x: number; y: number } | null) => void;

  // Tours
  activeTourId: string | null;
  setActiveTourId: (id: string | null) => void;
  activeTourStepIndex: number;
  setActiveTourStepIndex: (index: number) => void;

  // Quiz state
  quizState: QuizState;
  setQuizState: React.Dispatch<React.SetStateAction<QuizState>>;

  // UI state
  showHelp: boolean;
  setShowHelp: (show: boolean) => void;
  showSettings: boolean;
  setShowSettings: (show: boolean) => void;
  showComparison: boolean;
  setShowComparison: (show: boolean) => void;
  leftNavCollapsed: boolean;
  setLeftNavCollapsed: (collapsed: boolean) => void;

  // Actions
  resetView: () => void;
}

// Default visibility
const DEFAULT_VISIBILITY: SkinLayerVisibility = {
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
};

// Create context
const AppContext = createContext<AppContextValue | null>(null);

// Provider props
interface AppProviderProps {
  children: ReactNode;
}

// Provider component
export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  // Mode state
  const [mode, setMode] = useState<AppMode>('study');

  // Language state
  const [lang, setLang] = useState<LangCode>('en');

  // Visualization state
  const [explodeValue, setExplodeValue] = useState(0);
  const [visibility, setVisibility] = useState<SkinLayerVisibility>(DEFAULT_VISIBILITY);
  const [diseaseId, setDiseaseId] = useState<DiseaseId>('normal');
  const [timelineId, setTimelineId] = useState<TimelineId>('none');
  const [timelineT, setTimelineT] = useState(0);
  const [zoomLevelId, setZoomLevelId] = useState<ZoomLevelId>('macro');
  const [clippingEnabled, setClippingEnabled] = useState(false);
  const [clippingValue, setClippingValue] = useState(0.5);

  // Selection state
  const [selectedStructure, setSelectedStructure] = useState<StructureData | null>(null);
  const [hoveredStructure, setHoveredStructure] = useState<{ id: string; x: number; y: number } | null>(null);

  // Tour state
  const [activeTourId, setActiveTourId] = useState<string | null>(null);
  const [activeTourStepIndex, setActiveTourStepIndex] = useState(0);

  // Quiz state
  const [quizState, setQuizState] = useState<QuizState>(INITIAL_QUIZ_STATE);

  // UI state
  const [showHelp, setShowHelp] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [leftNavCollapsed, setLeftNavCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('dermoviz-nav-collapsed') === 'true';
    }
    return false;
  });

  // Toggle structure visibility
  const toggleStructureVisibility = useCallback((key: keyof SkinLayerVisibility['structures']) => {
    setVisibility(prev => ({
      ...prev,
      structures: { ...prev.structures, [key]: !prev.structures[key] }
    }));
  }, []);

  // Toggle layer visibility
  const toggleLayerVisibility = useCallback((layer: 'epidermis' | 'dermis' | 'hypodermis') => {
    setVisibility(prev => ({
      ...prev,
      [layer]: !prev[layer]
    }));
  }, []);

  // Select structure by ID
  const selectStructure = useCallback((id: string | null) => {
    if (!id) {
      setSelectedStructure(null);
      return;
    }
    const data = STRUCTURE_CONTENT[id];
    if (data) {
      setSelectedStructure(data);
    }
  }, []);

  // Reset view
  const resetView = useCallback(() => {
    setZoomLevelId('macro');
    setExplodeValue(0);
    setClippingEnabled(false);
    setClippingValue(0.5);
  }, []);

  // Handle left nav collapse with persistence
  const handleSetLeftNavCollapsed = useCallback((collapsed: boolean) => {
    setLeftNavCollapsed(collapsed);
    if (typeof window !== 'undefined') {
      localStorage.setItem('dermoviz-nav-collapsed', String(collapsed));
    }
  }, []);

  // Handle mode change
  const handleSetMode = useCallback((newMode: AppMode) => {
    setMode(newMode);
    // Reset quiz state when leaving quiz mode
    if (newMode !== 'quiz') {
      setQuizState(INITIAL_QUIZ_STATE);
    }
    // Close tours when changing mode
    if (newMode !== 'tours') {
      setActiveTourId(null);
      setActiveTourStepIndex(0);
    }
  }, []);

  // Memoized visualization object
  const visualization = useMemo<VisualizationState>(() => ({
    explodeValue,
    visibility,
    diseaseId,
    timelineId,
    timelineT,
    zoomLevelId,
    clippingEnabled,
    clippingValue
  }), [explodeValue, visibility, diseaseId, timelineId, timelineT, zoomLevelId, clippingEnabled, clippingValue]);

  // Memoized selection object
  const selection = useMemo<SelectionState>(() => ({
    selectedStructure,
    hoveredStructure
  }), [selectedStructure, hoveredStructure]);

  // Context value
  const value = useMemo<AppContextValue>(() => ({
    mode,
    setMode: handleSetMode,
    lang,
    setLang,
    visualization,
    setExplodeValue,
    setVisibility,
    toggleStructureVisibility,
    toggleLayerVisibility,
    setDiseaseId,
    setTimelineId,
    setTimelineT,
    setZoomLevelId,
    setClippingEnabled,
    setClippingValue,
    selection,
    selectStructure,
    setHoveredStructure,
    activeTourId,
    setActiveTourId,
    activeTourStepIndex,
    setActiveTourStepIndex,
    quizState,
    setQuizState,
    showHelp,
    setShowHelp,
    showSettings,
    setShowSettings,
    showComparison,
    setShowComparison,
    leftNavCollapsed,
    setLeftNavCollapsed: handleSetLeftNavCollapsed,
    resetView
  }), [
    mode, handleSetMode, lang, visualization, toggleStructureVisibility, toggleLayerVisibility,
    selection, selectStructure, activeTourId, activeTourStepIndex, quizState,
    showHelp, showSettings, showComparison, leftNavCollapsed, handleSetLeftNavCollapsed, resetView
  ]);

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

// Custom hook to use app context
export const useAppContext = (): AppContextValue => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

// Convenience hooks for specific parts of context
export const useAppMode = () => {
  const { mode, setMode } = useAppContext();
  return { mode, setMode };
};

export const useVisualization = () => {
  const ctx = useAppContext();
  return {
    ...ctx.visualization,
    setExplodeValue: ctx.setExplodeValue,
    setVisibility: ctx.setVisibility,
    toggleStructureVisibility: ctx.toggleStructureVisibility,
    toggleLayerVisibility: ctx.toggleLayerVisibility,
    setDiseaseId: ctx.setDiseaseId,
    setTimelineId: ctx.setTimelineId,
    setTimelineT: ctx.setTimelineT,
    setZoomLevelId: ctx.setZoomLevelId,
    setClippingEnabled: ctx.setClippingEnabled,
    setClippingValue: ctx.setClippingValue,
    resetView: ctx.resetView
  };
};

export const useSelection = () => {
  const ctx = useAppContext();
  return {
    ...ctx.selection,
    selectStructure: ctx.selectStructure,
    setHoveredStructure: ctx.setHoveredStructure
  };
};

export const useQuiz = () => {
  const { quizState, setQuizState } = useAppContext();
  return { quizState, setQuizState };
};
