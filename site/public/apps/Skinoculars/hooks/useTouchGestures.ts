/**
 * useTouchGestures Hook
 * Touch gesture detection for mobile 3D interactions
 */

import React, { useCallback, useRef } from 'react';

export interface TouchGestureHandlers {
  onTap?: (x: number, y: number) => void;
  onDoubleTap?: (x: number, y: number) => void;
  onLongPress?: (x: number, y: number) => void;
  onPinch?: (scale: number, centerX: number, centerY: number) => void;
  onPan?: (deltaX: number, deltaY: number) => void;
}

interface TouchState {
  startTime: number;
  startX: number;
  startY: number;
  lastTapTime: number;
  lastTapX: number;
  lastTapY: number;
  initialPinchDistance: number | null;
  longPressTimer: NodeJS.Timeout | null;
}

const TAP_THRESHOLD = 10; // Max movement for tap
const TAP_DURATION = 300; // Max duration for tap (ms)
const DOUBLE_TAP_DELAY = 300; // Max time between taps
const DOUBLE_TAP_DISTANCE = 30; // Max distance between taps
const LONG_PRESS_DURATION = 500; // Duration for long press

export function useTouchGestures(handlers: TouchGestureHandlers) {
  const touchState = useRef<TouchState>({
    startTime: 0,
    startX: 0,
    startY: 0,
    lastTapTime: 0,
    lastTapX: 0,
    lastTapY: 0,
    initialPinchDistance: null,
    longPressTimer: null
  });

  const getDistance = useCallback((touch1: React.Touch, touch2: React.Touch) => {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }, []);

  const getCenter = useCallback((touch1: React.Touch, touch2: React.Touch) => {
    return {
      x: (touch1.clientX + touch2.clientX) / 2,
      y: (touch1.clientY + touch2.clientY) / 2
    };
  }, []);

  const clearLongPressTimer = useCallback(() => {
    if (touchState.current.longPressTimer) {
      clearTimeout(touchState.current.longPressTimer);
      touchState.current.longPressTimer = null;
    }
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const state = touchState.current;
    clearLongPressTimer();

    if (e.touches.length === 1) {
      const touch = e.touches[0];
      state.startTime = Date.now();
      state.startX = touch.clientX;
      state.startY = touch.clientY;

      // Set up long press detection
      if (handlers.onLongPress) {
        state.longPressTimer = setTimeout(() => {
          handlers.onLongPress?.(touch.clientX, touch.clientY);
        }, LONG_PRESS_DURATION);
      }
    } else if (e.touches.length === 2) {
      // Initialize pinch
      state.initialPinchDistance = getDistance(e.touches[0], e.touches[1]);
    }
  }, [handlers, clearLongPressTimer, getDistance]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const state = touchState.current;
    clearLongPressTimer();

    if (e.touches.length === 1) {
      const touch = e.touches[0];
      const deltaX = touch.clientX - state.startX;
      const deltaY = touch.clientY - state.startY;

      // Check if movement exceeds tap threshold
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      if (distance > TAP_THRESHOLD) {
        handlers.onPan?.(deltaX, deltaY);
        state.startX = touch.clientX;
        state.startY = touch.clientY;
      }
    } else if (e.touches.length === 2 && state.initialPinchDistance !== null) {
      const currentDistance = getDistance(e.touches[0], e.touches[1]);
      const scale = currentDistance / state.initialPinchDistance;
      const center = getCenter(e.touches[0], e.touches[1]);

      handlers.onPinch?.(scale, center.x, center.y);
      state.initialPinchDistance = currentDistance;
    }
  }, [handlers, clearLongPressTimer, getDistance, getCenter]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const state = touchState.current;
    clearLongPressTimer();

    // Reset pinch state
    if (e.touches.length < 2) {
      state.initialPinchDistance = null;
    }

    // Check for tap
    if (e.changedTouches.length === 1 && e.touches.length === 0) {
      const touch = e.changedTouches[0];
      const duration = Date.now() - state.startTime;
      const deltaX = touch.clientX - state.startX;
      const deltaY = touch.clientY - state.startY;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      if (duration < TAP_DURATION && distance < TAP_THRESHOLD) {
        // It's a tap - check for double tap
        const timeSinceLastTap = Date.now() - state.lastTapTime;
        const distanceFromLastTap = Math.sqrt(
          Math.pow(touch.clientX - state.lastTapX, 2) +
          Math.pow(touch.clientY - state.lastTapY, 2)
        );

        if (timeSinceLastTap < DOUBLE_TAP_DELAY && distanceFromLastTap < DOUBLE_TAP_DISTANCE) {
          // Double tap
          handlers.onDoubleTap?.(touch.clientX, touch.clientY);
          state.lastTapTime = 0;
        } else {
          // Single tap (delayed to allow for double tap detection)
          state.lastTapTime = Date.now();
          state.lastTapX = touch.clientX;
          state.lastTapY = touch.clientY;

          // Fire single tap after delay if no second tap
          setTimeout(() => {
            if (Date.now() - state.lastTapTime >= DOUBLE_TAP_DELAY - 10) {
              handlers.onTap?.(touch.clientX, touch.clientY);
            }
          }, DOUBLE_TAP_DELAY);
        }
      }
    }
  }, [handlers, clearLongPressTimer]);

  return {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd
  };
}

export default useTouchGestures;
