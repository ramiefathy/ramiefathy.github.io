import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import profile from '../data/profile.json';
import timeline from '../data/timeline.json';
import { getProfileCity, getTimelineRows, type TimelineMilestone } from './profilePresentation';

const milestoneSchema = z.object({
  id: z.string().min(1),
  year: z.number().int(),
  endYear: z.number().int().nullable(),
  title: z.string().min(1),
  role: z.string().min(1),
  tag: z.string().min(1),
  type: z.enum(['education', 'training', 'fellowship', 'leadership', 'research'])
}).refine((item) => item.endYear === null || item.endYear >= item.year, {
  message: 'An end year cannot precede its start year'
});

const fixture = (overrides: Partial<TimelineMilestone> = {}): TimelineMilestone => ({
  id: 'fixture', year: 2020, endYear: 2022, title: 'Fixture institution',
  role: 'Fixture role', tag: 'Completed', type: 'training', ...overrides
});

describe('structured profile and CV presentation', () => {
  it.each([
    ['Boston, Massachusetts', 'Boston'],
    ['  Honolulu , Hawaii ', 'Honolulu'],
    ['London', 'London'],
    ['Mexico City, CDMX, Mexico', 'Mexico City']
  ])('derives the display city from %s', (location, expected) => {
    expect(getProfileCity(location)).toBe(expected);
  });

  it('validates the published content and its explicit clock timezone', () => {
    expect(() => milestoneSchema.array().parse(timeline.milestones)).not.toThrow();
    expect(new Set(timeline.milestones.map((item) => item.id)).size).toBe(timeline.milestones.length);
    expect(profile.affiliation.trim()).not.toBe('');
    expect(getProfileCity(profile.location)).not.toBe('');
    expect(profile.timeZone.trim()).not.toBe('');
    expect(() => new Intl.DateTimeFormat('en-US', { timeZone: profile.timeZone })).not.toThrow();
  });

  it.each([
    [null, '2020—'], [2020, '2020'], [2022, '2020—2022']
  ])('formats endYear=%s without guessing dates or status', (endYear, expected) => {
    expect(getTimelineRows([fixture({ endYear })], ['training'])[0].y).toBe(expected);
  });

  it('filters, sorts newest first, and never mutates the supplied data', () => {
    const items = Object.freeze([
      Object.freeze(fixture({ id: 'older', year: 2019 })),
      Object.freeze(fixture({ id: 'service', type: 'leadership' })),
      Object.freeze(fixture({ id: 'newer', year: 2022 }))
    ]);
    expect(getTimelineRows(items, ['training']).map((row) => row.id)).toEqual(['newer', 'older']);
    expect(items.map((item) => item.id)).toEqual(['older', 'service', 'newer']);
    expect(getTimelineRows(items, ['research'])).toEqual([]);
  });

  it('projects changed source fields rather than returning a hardcoded CV', () => {
    const source = fixture({ title: 'Changed institution', role: 'Changed role', tag: 'Changed tag' });
    expect(getTimelineRows([source], ['training'])).toEqual([{
      id: 'fixture', y: '2020—2022', what: source.title, role: source.role, tag: source.tag
    }]);
  });

  it('keeps service records separate from training without losing their roles', () => {
    const service = getTimelineRows(timeline.milestones, ['leadership']);
    expect(service.map((row) => row.id)).toEqual([
      'aad-council', 'hopkins-house-staff', 'covid-response', 'penn-curriculum'
    ]);
    expect(service.find((row) => row.id === 'hopkins-house-staff')).toMatchObject({
      y: '2024—2026', role: 'Vice President, Resident Affairs', tag: 'Completed'
    });
    expect(timeline.milestones.find((item) => item.id === 'hopkins-residency')?.description)
      .not.toMatch(/House Staff Council|Vice President/);
    expect(getTimelineRows(timeline.milestones, ['education', 'training', 'fellowship'])
      .map((row) => row.id)).toEqual(['mgb-fellowship', 'hopkins-residency', 'penn-med', 'princeton']);
  });
});
