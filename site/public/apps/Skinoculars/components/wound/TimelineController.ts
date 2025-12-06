/**
 * TimelineController
 * Event emitter that manages wound healing timeline state and emits events at milestones
 */

import {
  WOUND_PHASES,
  WOUND_EVENTS,
  WoundPhase,
  WoundEvent,
  WoundEventId,
  getPhaseAtProgress,
  getDayLabel
} from '../../phases';

type EventCallback = (t: number, event?: WoundEvent) => void;

interface EventSubscription {
  event: string;
  callback: EventCallback;
}

export class TimelineController {
  private t: number = 0;
  private lastEmittedEvents: Set<WoundEventId> = new Set();
  private subscriptions: EventSubscription[] = [];
  private currentPhase: WoundPhase;

  constructor() {
    this.currentPhase = WOUND_PHASES[0];
  }

  /**
   * Subscribe to timeline events
   * @param event - Event name ('progressUpdate', 'phaseChange', or specific event ID)
   * @param callback - Function to call when event fires
   * @returns Unsubscribe function
   */
  on(event: string, callback: EventCallback): () => void {
    const subscription: EventSubscription = { event, callback };
    this.subscriptions.push(subscription);

    return () => {
      const index = this.subscriptions.indexOf(subscription);
      if (index > -1) {
        this.subscriptions.splice(index, 1);
      }
    };
  }

  /**
   * Emit an event to all subscribers
   */
  private emit(event: string, t: number, woundEvent?: WoundEvent): void {
    this.subscriptions
      .filter(sub => sub.event === event || sub.event === '*')
      .forEach(sub => sub.callback(t, woundEvent));
  }

  /**
   * Set the timeline progress and emit relevant events
   * @param t - Progress value (0-1)
   */
  setProgress(t: number): void {
    const clampedT = Math.max(0, Math.min(1, t));
    const previousT = this.t;
    this.t = clampedT;

    // Emit progress update
    this.emit('progressUpdate', clampedT);

    // Check for phase change
    const newPhase = getPhaseAtProgress(clampedT);
    if (newPhase.id !== this.currentPhase.id) {
      this.currentPhase = newPhase;
      this.emit('phaseChange', clampedT);
    }

    // Handle scrubbing backwards - reset events that are now in the future
    if (clampedT < previousT) {
      WOUND_EVENTS.forEach(event => {
        if (event.t > clampedT) {
          this.lastEmittedEvents.delete(event.id);
        }
      });
    }

    // Emit milestone events that have been crossed
    WOUND_EVENTS.forEach(event => {
      if (clampedT >= event.t && !this.lastEmittedEvents.has(event.id)) {
        this.lastEmittedEvents.add(event.id);
        this.emit(event.id, clampedT, event);
        this.emit('milestone', clampedT, event);
      }
    });
  }

  /**
   * Get current progress value
   */
  getProgress(): number {
    return this.t;
  }

  /**
   * Get current wound phase
   */
  getCurrentPhase(): WoundPhase {
    return this.currentPhase;
  }

  /**
   * Get human-readable day label
   */
  getDayLabel(): string {
    return getDayLabel(this.t);
  }

  /**
   * Get all events with their fired status
   */
  getEventsWithStatus(): Array<WoundEvent & { fired: boolean }> {
    return WOUND_EVENTS.map(event => ({
      ...event,
      fired: this.lastEmittedEvents.has(event.id)
    }));
  }

  /**
   * Get events that have been fired
   */
  getFiredEvents(): WoundEvent[] {
    return WOUND_EVENTS.filter(event => this.lastEmittedEvents.has(event.id));
  }

  /**
   * Get the next upcoming event
   */
  getNextEvent(): WoundEvent | null {
    return WOUND_EVENTS.find(event => !this.lastEmittedEvents.has(event.id)) || null;
  }

  /**
   * Reset the controller state
   */
  reset(): void {
    this.t = 0;
    this.lastEmittedEvents.clear();
    this.currentPhase = WOUND_PHASES[0];
    this.emit('reset', 0);
  }

  /**
   * Check if a specific event has been reached
   */
  hasReachedEvent(eventId: WoundEventId): boolean {
    return this.lastEmittedEvents.has(eventId);
  }

  /**
   * Get phase progress (0-1 within current phase)
   */
  getPhaseProgress(): number {
    const phase = this.currentPhase;
    if (phase.tEnd === phase.tStart) return 0;
    return (this.t - phase.tStart) / (phase.tEnd - phase.tStart);
  }

  /**
   * Clean up subscriptions
   */
  dispose(): void {
    this.subscriptions = [];
    this.lastEmittedEvents.clear();
  }
}

// React hook for using the timeline controller
import { useRef, useCallback, useEffect, useState } from 'react';

export interface UseTimelineControllerReturn {
  controller: TimelineController;
  progress: number;
  setProgress: (t: number) => void;
  currentPhase: WoundPhase;
  dayLabel: string;
  events: Array<WoundEvent & { fired: boolean }>;
  reset: () => void;
}

export function useTimelineController(
  initialProgress: number = 0,
  onProgressChange?: (t: number) => void
): UseTimelineControllerReturn {
  const controllerRef = useRef<TimelineController | null>(null);

  // Initialize controller once
  if (!controllerRef.current) {
    controllerRef.current = new TimelineController();
  }

  const [progress, setProgressState] = useState(initialProgress);
  const [currentPhase, setCurrentPhase] = useState(WOUND_PHASES[0]);
  const [dayLabel, setDayLabel] = useState('Hours after injury');
  const [events, setEvents] = useState<Array<WoundEvent & { fired: boolean }>>(
    WOUND_EVENTS.map(e => ({ ...e, fired: false }))
  );

  const setProgress = useCallback((t: number) => {
    const controller = controllerRef.current;
    if (!controller) return;

    controller.setProgress(t);
    setProgressState(controller.getProgress());
    setCurrentPhase(controller.getCurrentPhase());
    setDayLabel(controller.getDayLabel());
    setEvents(controller.getEventsWithStatus());
    onProgressChange?.(t);
  }, [onProgressChange]);

  const reset = useCallback(() => {
    const controller = controllerRef.current;
    if (!controller) return;

    controller.reset();
    setProgressState(0);
    setCurrentPhase(WOUND_PHASES[0]);
    setDayLabel('Hours after injury');
    setEvents(WOUND_EVENTS.map(e => ({ ...e, fired: false })));
  }, []);

  // Set initial progress
  useEffect(() => {
    setProgress(initialProgress);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Cleanup
  useEffect(() => {
    return () => {
      controllerRef.current?.dispose();
    };
  }, []);

  return {
    controller: controllerRef.current,
    progress,
    setProgress,
    currentPhase,
    dayLabel,
    events,
    reset
  };
}

export default TimelineController;
