import React, { useEffect, useState } from 'react';
import { checkWebXRSupport, WebXRCapabilities, XRSessionMode } from '../utils/webxr';
import * as THREE from 'three';

interface XRButtonProps {
  renderer: THREE.WebGLRenderer | null;
  mode?: XRSessionMode;
  onSessionStart?: () => void;
  onSessionEnd?: () => void;
  className?: string;
  domOverlayRoot?: HTMLElement | null;
}

export const XRButton: React.FC<XRButtonProps> = ({
  renderer,
  mode = 'immersive-vr',
  onSessionStart,
  onSessionEnd,
  className,
  domOverlayRoot
}) => {
  const [capabilities, setCapabilities] = useState<WebXRCapabilities | null>(null);
  const [isPresenting, setIsPresenting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentSession, setCurrentSession] = useState<XRSession | null>(null);

  // Check WebXR support on mount
  useEffect(() => {
    checkWebXRSupport().then(setCapabilities);
  }, []);

  // Clean up session on unmount
  useEffect(() => {
    return () => {
      if (currentSession) {
        currentSession.end().catch(console.warn);
      }
    };
  }, [currentSession]);

  const isSupported = capabilities
    ? mode === 'immersive-ar'
      ? capabilities.supportsAR
      : capabilities.supportsVR
    : false;

  const handleClick = async () => {
    if (!renderer) return;

    if (currentSession) {
      // End session
      try {
        await currentSession.end();
      } catch (err) {
        console.warn('Error ending session:', err);
      }
      return;
    }

    // Start new session
    setIsLoading(true);
    setError(null);

    try {
      const xr = (navigator as any).xr as XRSystem;

      const sessionInit: XRSessionInit = {
        optionalFeatures: ['local-floor', 'bounded-floor', 'hand-tracking']
      };

      if (mode === 'immersive-ar') {
        sessionInit.optionalFeatures?.push('hit-test', 'dom-overlay', 'light-estimation');
        if (domOverlayRoot) {
          (sessionInit as any).domOverlay = { root: domOverlayRoot };
        }
      }

      const session = await xr.requestSession(mode, sessionInit);

      // Enable XR on renderer
      renderer.xr.enabled = true;
      await renderer.xr.setSession(session);

      setCurrentSession(session);
      setIsPresenting(true);
      onSessionStart?.();

      // Handle session end
      session.addEventListener('end', () => {
        setCurrentSession(null);
        setIsPresenting(false);
        onSessionEnd?.();
      });
    } catch (err) {
      console.error('Failed to start XR session:', err);
      setError(err instanceof Error ? err.message : 'Failed to start XR');
      setTimeout(() => setError(null), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  // Don't render if capabilities haven't loaded
  if (!capabilities) {
    return (
      <button
        disabled
        className={`px-4 py-2 rounded-lg bg-slate-700/50 text-slate-500 text-sm flex items-center gap-2 ${className}`}
      >
        <span className="w-4 h-4 border-2 border-slate-500 border-t-transparent rounded-full animate-spin" />
        Checking XR...
      </button>
    );
  }

  // Show not supported state
  if (!isSupported) {
    return (
      <button
        disabled
        className={`px-4 py-2 rounded-lg bg-slate-800/50 text-slate-500 text-sm cursor-not-allowed flex items-center gap-2 ${className}`}
        title={`${mode === 'immersive-ar' ? 'AR' : 'VR'} is not supported on this device`}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
        </svg>
        {mode === 'immersive-ar' ? 'AR' : 'VR'} Not Available
      </button>
    );
  }

  // Show error state
  if (error) {
    return (
      <button
        disabled
        className={`px-4 py-2 rounded-lg bg-red-900/50 text-red-300 text-sm cursor-not-allowed flex items-center gap-2 ${className}`}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        {error}
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={isLoading || !renderer}
      className={`
        px-4 py-2 rounded-lg text-sm font-medium transition-all
        flex items-center gap-2
        ${isPresenting
          ? 'bg-red-600 hover:bg-red-500 text-white'
          : 'bg-blue-600 hover:bg-blue-500 text-white'
        }
        ${isLoading ? 'opacity-70 cursor-wait' : ''}
        ${!renderer ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
    >
      {isLoading ? (
        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
      ) : mode === 'immersive-ar' ? (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ) : (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      )}
      {isLoading
        ? 'Starting...'
        : isPresenting
          ? `Exit ${mode === 'immersive-ar' ? 'AR' : 'VR'}`
          : `Enter ${mode === 'immersive-ar' ? 'AR' : 'VR'}`
      }
    </button>
  );
};

/**
 * Combined VR/AR button that shows both options
 */
export const XRModeSelector: React.FC<{
  renderer: THREE.WebGLRenderer | null;
  onSessionStart?: () => void;
  onSessionEnd?: () => void;
  className?: string;
  domOverlayRoot?: HTMLElement | null;
}> = ({ renderer, onSessionStart, onSessionEnd, className, domOverlayRoot }) => {
  const [capabilities, setCapabilities] = useState<WebXRCapabilities | null>(null);

  useEffect(() => {
    checkWebXRSupport().then(setCapabilities);
  }, []);

  if (!capabilities) {
    return null;
  }

  if (!capabilities.isSupported) {
    return null; // Don't show anything if XR isn't supported
  }

  return (
    <div className={`flex gap-2 ${className}`}>
      {capabilities.supportsVR && (
        <XRButton
          renderer={renderer}
          mode="immersive-vr"
          onSessionStart={onSessionStart}
          onSessionEnd={onSessionEnd}
        />
      )}
      {capabilities.supportsAR && (
        <XRButton
          renderer={renderer}
          mode="immersive-ar"
          onSessionStart={onSessionStart}
          onSessionEnd={onSessionEnd}
        />
      )}
    </div>
  );
};

export default XRButton;
