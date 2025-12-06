import { TimelineId } from './types';

export interface TimelineDefinition {
  id: TimelineId;
  label: string;
  description: string;
}

export const TIMELINES: TimelineDefinition[] = [
  {
    id: 'none',
    label: 'No process',
    description: 'Static anatomy without a process animation.'
  },
  {
    id: 'wound_healing',
    label: 'Wound healing',
    description: 'From acute epidermal injury with erythema to re-epithelialization and scar maturation.'
  }
];
