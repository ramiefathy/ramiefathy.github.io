import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const roadmap = readFileSync(new URL('../../../docs/platform-roadmap-2026-09.md', import.meta.url), 'utf8');
const about = readFileSync(new URL('../pages/about.astro', import.meta.url), 'utf8');
const layout = readFileSync(new URL('../layouts/MainLayout.astro', import.meta.url), 'utf8');

describe('PR 185 roadmap and content contracts', () => {
  it.each(['vlm-bench', 'mcq'])('keeps every %s API reference versioned or an explicit mutable pointer', (dataset) => {
    const paths = [...roadmap.matchAll(new RegExp('`(/api/v1/' + dataset + '/[^`]*)`', 'g'))]
      .map((match) => match[1]);
    expect(paths.length).toBeGreaterThan(3);
    for (const route of paths) {
      expect(route).toMatch(new RegExp('^/api/v1/' + dataset + '/(?:v<semver>/(?:[^/]+\\.json)?|(?:latest|status)\\.json)$'));
    }
    expect(paths).toContain(`/api/v1/${dataset}/v<semver>/schema.json`);
    expect(paths).toContain(`/api/v1/${dataset}/latest.json`);
  });

  it('leaves Workstream 7 unscheduled after v1', () => {
    const section = roadmap.split('## Workstream 7 (')[1]?.split('## Workstream 8 (')[0];
    expect(section).toBeTruthy();
    expect(section).toContain('post-v1 Phase 1');
    expect(section).not.toMatch(/\bweeks?\s+\d/i);
    expect(section).not.toContain('plan v1 around');
  });

  it('uses the data-driven projections in the About page and footer', () => {
    expect(about).toContain("import timeline from '../data/timeline.json'");
    expect(about).toContain('getTimelineRows(timeline.milestones,');
    expect(about).not.toMatch(/const\s+(?:clinicalTraining|leadership)\s*=\s*\[/);
    expect(about).not.toContain('Active and incoming positions');
    expect(about).toContain('Training and degrees, in reverse chronological order.');
    expect(layout).toContain('getProfileCity(profile.location)');
    expect(layout).toContain('Dermatology · Clinical AI · {city}.');
  });
});
