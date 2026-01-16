import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataPath = resolve(__dirname, '../../public/data/dermoscopy-llm-eval.json');

const loadData = () => JSON.parse(readFileSync(dataPath, 'utf8'));

describe('dermoscopy-llm-eval.json', () => {
  it('parses as valid JSON and includes expected top-level keys', () => {
    const data = loadData();
    expect(Object.keys(data).sort()).toEqual(
      [
        'armSummary',
        'confusionMatrix',
        'costPerformance',
        'diagnoses',
        'diagnosisSummary',
        'errorDistribution',
        'latencyData',
        'modelArmMatrix',
        'modelDiagMatrix',
        'modelSummary',
        'overallStats'
      ].sort()
    );
  });

  it('has internally consistent trial counts', () => {
    const data = loadData();
    const totalTrials = data.overallStats?.totalTrials;
    expect(typeof totalTrials).toBe('number');

    const errorTotal = data.errorDistribution.reduce((sum: number, row: { count: number }) => sum + row.count, 0);
    expect(errorTotal).toBe(totalTrials);

    const modelTotal = data.modelSummary.reduce((sum: number, row: { n_trials: number }) => sum + row.n_trials, 0);
    expect(modelTotal).toBe(totalTrials);

    const armTotal = data.armSummary.reduce((sum: number, row: { n_trials: number }) => sum + row.n_trials, 0);
    expect(armTotal).toBe(totalTrials);
  });

  it('matches summary counts for models and arms', () => {
    const data = loadData();
    expect(data.modelSummary.length).toBe(data.overallStats.uniqueModels);
    expect(data.armSummary.length).toBe(data.overallStats.promptingArms);
  });

  it('includes one latency + cost entry per model', () => {
    const data = loadData();
    const models = new Set(data.modelSummary.map((row: { model: string }) => row.model));

    const latencyModels = new Set(data.latencyData.map((row: { model: string }) => row.model));
    const costModels = new Set(data.costPerformance.map((row: { model: string }) => row.model));

    const sorted = (set: Set<string>) => Array.from(set).sort();
    expect(sorted(latencyModels)).toEqual(sorted(models));
    expect(sorted(costModels)).toEqual(sorted(models));
  });
});
