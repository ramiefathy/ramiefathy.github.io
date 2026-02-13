import fs from 'node:fs/promises';
import path from 'node:path';
import { test, expect } from '@playwright/test';

test.describe('Clinisched', () => {
  test('apps catalog points Clinisched to canonical external URL only', async () => {
    const appsCatalogPath = path.resolve(process.cwd(), 'src/data/apps.json');
    const raw = await fs.readFile(appsCatalogPath, 'utf8');
    const apps = JSON.parse(raw);

    const clinisched = apps.find((entry: { slug: string }) => entry.slug === 'scheduler-pro');
    const legacyScheduler = apps.find((entry: { slug: string }) => entry.slug === 'scheduler-legacy');

    expect(clinisched).toBeDefined();
    expect(clinisched?.href).toBe('https://clinisched.ramiefathy.com/');
    expect(clinisched?.preview).toBe('https://clinisched.ramiefathy.com/');
    expect(legacyScheduler).toBeUndefined();
  });
});
