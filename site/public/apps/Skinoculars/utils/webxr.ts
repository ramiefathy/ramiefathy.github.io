/**
 * WebXR Foundation Module
 *
 * Provides VR/AR support for Skinoculars using the WebXR Device API.
 * This module handles session management, controller input, and XR rendering.
 */

import * as THREE from 'three';

export type XRSessionMode = 'immersive-vr' | 'immersive-ar' | 'inline';
export type XRSessionState = 'idle' | 'requesting' | 'active' | 'ending' | 'error';

export interface XRSessionInfo {
  mode: XRSessionMode;
  state: XRSessionState;
  isPresenting: boolean;
  hasControllers: boolean;
  error?: string;
}

export interface WebXRCapabilities {
  isSupported: boolean;
  supportsVR: boolean;
  supportsAR: boolean;
  supportsInline: boolean;
}

/**
 * Check if WebXR is supported and what modes are available
 */
export async function checkWebXRSupport(): Promise<WebXRCapabilities> {
  const capabilities: WebXRCapabilities = {
    isSupported: false,
    supportsVR: false,
    supportsAR: false,
    supportsInline: false
  };

  if (!('xr' in navigator)) {
    return capabilities;
  }

  try {
    const xr = (navigator as any).xr as XRSystem;

    capabilities.supportsVR = await xr.isSessionSupported('immersive-vr').catch(() => false);
    capabilities.supportsAR = await xr.isSessionSupported('immersive-ar').catch(() => false);
    capabilities.supportsInline = await xr.isSessionSupported('inline').catch(() => false);
    capabilities.isSupported = capabilities.supportsVR || capabilities.supportsAR;

    return capabilities;
  } catch (error) {
    console.warn('Error checking WebXR support:', error);
    return capabilities;
  }
}

/**
 * WebXR Manager class for handling XR sessions
 */
export class WebXRManager {
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;

  private xrSession: XRSession | null = null;
  private xrReferenceSpace: XRReferenceSpace | null = null;
  private xrControllers: THREE.Group[] = [];
  private xrControllerGrips: THREE.Group[] = [];

  private sessionInfo: XRSessionInfo = {
    mode: 'immersive-vr',
    state: 'idle',
    isPresenting: false,
    hasControllers: false
  };

  private onSessionStartCallbacks: ((info: XRSessionInfo) => void)[] = [];
  private onSessionEndCallbacks: ((info: XRSessionInfo) => void)[] = [];
  private onSelectCallbacks: ((controller: THREE.Group, event: XRInputSourceEvent) => void)[] = [];

  constructor(
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera
  ) {
    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;

    // Enable XR on renderer
    this.renderer.xr.enabled = true;
  }

  /**
   * Get current session info
   */
  getSessionInfo(): XRSessionInfo {
    return { ...this.sessionInfo };
  }

  /**
   * Check if currently in XR session
   */
  isPresenting(): boolean {
    return this.sessionInfo.isPresenting;
  }

  /**
   * Request an XR session
   */
  async requestSession(mode: XRSessionMode = 'immersive-vr'): Promise<boolean> {
    if (this.sessionInfo.state !== 'idle') {
      console.warn('XR session already active or in transition');
      return false;
    }

    if (!('xr' in navigator)) {
      this.sessionInfo.error = 'WebXR not supported';
      this.sessionInfo.state = 'error';
      return false;
    }

    try {
      this.sessionInfo.state = 'requesting';
      this.sessionInfo.mode = mode;

      const xr = (navigator as any).xr as XRSystem;

      // Check if mode is supported
      const isSupported = await xr.isSessionSupported(mode);
      if (!isSupported) {
        throw new Error(`Session mode "${mode}" is not supported`);
      }

      // Request session with appropriate features
      const sessionInit: XRSessionInit = {
        optionalFeatures: ['local-floor', 'bounded-floor', 'hand-tracking', 'layers']
      };

      if (mode === 'immersive-ar') {
        sessionInit.optionalFeatures?.push('hit-test', 'dom-overlay', 'light-estimation');
      }

      const session = await xr.requestSession(mode, sessionInit);
      this.xrSession = session;

      // Set up session
      await this.setupSession(session);

      this.sessionInfo.state = 'active';
      this.sessionInfo.isPresenting = true;

      // Notify listeners
      this.onSessionStartCallbacks.forEach(cb => cb(this.getSessionInfo()));

      return true;
    } catch (error) {
      console.error('Failed to start XR session:', error);
      this.sessionInfo.state = 'error';
      this.sessionInfo.error = error instanceof Error ? error.message : 'Unknown error';
      return false;
    }
  }

  /**
   * End the current XR session
   */
  async endSession(): Promise<void> {
    if (!this.xrSession) return;

    this.sessionInfo.state = 'ending';

    try {
      await this.xrSession.end();
    } catch (error) {
      console.warn('Error ending XR session:', error);
    }

    this.cleanup();
    this.sessionInfo.state = 'idle';
    this.sessionInfo.isPresenting = false;

    this.onSessionEndCallbacks.forEach(cb => cb(this.getSessionInfo()));
  }

  /**
   * Register callback for session start
   */
  onSessionStart(callback: (info: XRSessionInfo) => void): () => void {
    this.onSessionStartCallbacks.push(callback);
    return () => {
      const idx = this.onSessionStartCallbacks.indexOf(callback);
      if (idx > -1) this.onSessionStartCallbacks.splice(idx, 1);
    };
  }

  /**
   * Register callback for session end
   */
  onSessionEnd(callback: (info: XRSessionInfo) => void): () => void {
    this.onSessionEndCallbacks.push(callback);
    return () => {
      const idx = this.onSessionEndCallbacks.indexOf(callback);
      if (idx > -1) this.onSessionEndCallbacks.splice(idx, 1);
    };
  }

  /**
   * Register callback for select events (controller trigger)
   */
  onSelect(callback: (controller: THREE.Group, event: XRInputSourceEvent) => void): () => void {
    this.onSelectCallbacks.push(callback);
    return () => {
      const idx = this.onSelectCallbacks.indexOf(callback);
      if (idx > -1) this.onSelectCallbacks.splice(idx, 1);
    };
  }

  /**
   * Get XR controllers
   */
  getControllers(): THREE.Group[] {
    return this.xrControllers;
  }

  /**
   * Get XR controller grips (for hand models)
   */
  getControllerGrips(): THREE.Group[] {
    return this.xrControllerGrips;
  }

  /**
   * Set up XR session
   */
  private async setupSession(session: XRSession): Promise<void> {
    // Set session on renderer
    await this.renderer.xr.setSession(session);

    // Get reference space
    this.xrReferenceSpace = await session.requestReferenceSpace('local-floor')
      .catch(() => session.requestReferenceSpace('local'));

    // Set up controllers
    this.setupControllers();

    // Handle session end
    session.addEventListener('end', () => {
      this.cleanup();
      this.sessionInfo.state = 'idle';
      this.sessionInfo.isPresenting = false;
      this.onSessionEndCallbacks.forEach(cb => cb(this.getSessionInfo()));
    });
  }

  /**
   * Set up XR controllers
   */
  private setupControllers(): void {
    // Create two controllers (left and right)
    for (let i = 0; i < 2; i++) {
      // Controller ray/pointer
      const controller = this.renderer.xr.getController(i);
      controller.name = `controller-${i}`;

      // Add visual ray for pointing
      const rayGeometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, 0, -3)
      ]);
      const rayMaterial = new THREE.LineBasicMaterial({
        color: 0x60a5fa,
        transparent: true,
        opacity: 0.6
      });
      const ray = new THREE.Line(rayGeometry, rayMaterial);
      ray.name = 'pointer-ray';
      controller.add(ray);

      // Handle select events
      controller.addEventListener('selectstart', (event: any) => {
        this.onSelectCallbacks.forEach(cb => cb(controller, event));
      });

      this.scene.add(controller);
      this.xrControllers.push(controller);

      // Controller grip (for hand/controller model)
      const controllerGrip = this.renderer.xr.getControllerGrip(i);
      controllerGrip.name = `controller-grip-${i}`;

      // Add simple controller visualization
      const gripGeometry = new THREE.BoxGeometry(0.02, 0.02, 0.08);
      const gripMaterial = new THREE.MeshStandardMaterial({
        color: 0x334155,
        roughness: 0.5,
        metalness: 0.5
      });
      const gripMesh = new THREE.Mesh(gripGeometry, gripMaterial);
      controllerGrip.add(gripMesh);

      this.scene.add(controllerGrip);
      this.xrControllerGrips.push(controllerGrip);
    }

    this.sessionInfo.hasControllers = true;
  }

  /**
   * Clean up XR resources
   */
  private cleanup(): void {
    // Remove controllers from scene
    this.xrControllers.forEach(controller => {
      controller.traverse(child => {
        const mesh = child as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
        if (mesh.material) {
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach(m => m.dispose());
          } else {
            mesh.material.dispose();
          }
        }
      });
      this.scene.remove(controller);
    });

    this.xrControllerGrips.forEach(grip => {
      grip.traverse(child => {
        const mesh = child as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
        if (mesh.material) {
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach(m => m.dispose());
          } else {
            mesh.material.dispose();
          }
        }
      });
      this.scene.remove(grip);
    });

    this.xrControllers = [];
    this.xrControllerGrips = [];
    this.xrSession = null;
    this.xrReferenceSpace = null;
    this.sessionInfo.hasControllers = false;
  }

  /**
   * Dispose of all resources
   */
  dispose(): void {
    this.endSession();
    this.onSessionStartCallbacks = [];
    this.onSessionEndCallbacks = [];
    this.onSelectCallbacks = [];
  }
}

/**
 * Create a WebXR button component (returns DOM element)
 */
export function createXRButton(
  renderer: THREE.WebGLRenderer,
  mode: XRSessionMode = 'immersive-vr',
  options?: {
    onSessionStarted?: () => void;
    onSessionEnded?: () => void;
    buttonStyle?: Partial<CSSStyleDeclaration>;
  }
): HTMLButtonElement {
  const button = document.createElement('button');
  button.id = 'xr-button';

  const baseStyle = {
    position: 'absolute' as const,
    bottom: '20px',
    padding: '12px 24px',
    border: 'none',
    borderRadius: '8px',
    background: 'rgba(59, 130, 246, 0.8)',
    color: 'white',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    zIndex: '1000',
    ...options?.buttonStyle
  };

  Object.assign(button.style, baseStyle);

  button.textContent = mode === 'immersive-ar' ? 'Enter AR' : 'Enter VR';
  button.disabled = true;

  // Check support and enable button
  checkWebXRSupport().then(capabilities => {
    const isSupported = mode === 'immersive-ar' ? capabilities.supportsAR : capabilities.supportsVR;

    if (isSupported) {
      button.disabled = false;
      button.style.background = 'rgba(59, 130, 246, 0.9)';

      button.addEventListener('mouseenter', () => {
        button.style.background = 'rgba(59, 130, 246, 1)';
        button.style.transform = 'scale(1.05)';
      });

      button.addEventListener('mouseleave', () => {
        button.style.background = 'rgba(59, 130, 246, 0.9)';
        button.style.transform = 'scale(1)';
      });
    } else {
      button.textContent = mode === 'immersive-ar' ? 'AR Not Supported' : 'VR Not Supported';
      button.style.background = 'rgba(100, 116, 139, 0.6)';
      button.style.cursor = 'not-allowed';
    }
  });

  let currentSession: XRSession | null = null;

  button.addEventListener('click', async () => {
    if (currentSession) {
      await currentSession.end();
      return;
    }

    try {
      const xr = (navigator as any).xr as XRSystem;
      const session = await xr.requestSession(mode, {
        optionalFeatures: ['local-floor', 'bounded-floor']
      });

      currentSession = session;
      renderer.xr.setSession(session);

      button.textContent = mode === 'immersive-ar' ? 'Exit AR' : 'Exit VR';
      options?.onSessionStarted?.();

      session.addEventListener('end', () => {
        currentSession = null;
        button.textContent = mode === 'immersive-ar' ? 'Enter AR' : 'Enter VR';
        options?.onSessionEnded?.();
      });
    } catch (error) {
      console.error('Failed to start XR session:', error);
      button.textContent = 'XR Error';
      setTimeout(() => {
        button.textContent = mode === 'immersive-ar' ? 'Enter AR' : 'Enter VR';
      }, 2000);
    }
  });

  return button;
}

// Type declarations for WebXR (if not included in project's types)
declare global {
  interface Navigator {
    xr?: XRSystem;
  }
}
