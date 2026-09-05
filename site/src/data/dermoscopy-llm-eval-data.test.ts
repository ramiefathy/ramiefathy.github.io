import { validateEvidence } from '../components/dermoscopy-dashboard/evidence-contract.js';
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
    const keys = Object.keys(data);
    const required = [
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
    ];

    expect(keys).toEqual(expect.arrayContaining(required));
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


describe('image-level evidence contract', () => {
  it('reconciles all paired image results to aggregate counts', () => { expect(validateEvidence(loadData())).toBe(true); });
  it.each([
    ['short', 'Invalid image-vector length.'],
    ['invalid', 'Non-binary image results.'],
    ['duplicate', 'Duplicate or unpaired image results.'],
    ['alias', 'Duplicate or unpaired image results.'],
    ['denominator', 'Invalid unique-image denominator.'],
    ['aggregate duplicate', 'Duplicate or unpaired aggregate row.'],
    ['aggregate orphan', 'Duplicate or unpaired aggregate row.'],
    ['aggregate missing', 'Image results disagree with aggregate counts.'],
    ['aggregate accuracy', 'Image results disagree with aggregate counts.'],
    ['model duplicate', 'Invalid model or arm inventory.'],
    ['arm duplicate', 'Invalid model or arm inventory.'],
    ['missing pair', 'Evaluation denominator mismatch.'],
    ['total', 'Evaluation denominator mismatch.']
  ])('fails closed on %s pairing with the intended error', (kind, message) => {
    const data = loadData();
    const rows = data.cases.correctByModelArm;
    if (kind === 'short') rows[0].correct_bits = rows[0].correct_bits.slice(1);
    if (kind === 'invalid') rows[0].correct_bits = 'x'.repeat(data.overallStats.uniqueImages);
    if (kind === 'duplicate') rows.push({ ...rows[0] });
    if (kind === 'alias') rows.push({ ...rows[0], arm: String(rows[0].arm).padStart(2, '0') });
    if (kind === 'denominator') data.overallStats.uniqueImages += 1;
    if (kind === 'aggregate duplicate') data.modelArmTradeoffs.push({ ...data.modelArmTradeoffs[0] });
    if (kind === 'aggregate orphan') data.modelArmTradeoffs.push({ ...data.modelArmTradeoffs[0], model: 'unknown' });
    if (kind === 'aggregate missing') data.modelArmTradeoffs.pop();
    if (kind === 'aggregate accuracy') data.modelArmTradeoffs[0].accuracy = -1;
    if (kind === 'model duplicate') data.modelSummary.push({ ...data.modelSummary[0] });
    if (kind === 'arm duplicate') data.armSummary.push({ ...data.armSummary[0] });
    if (kind === 'missing pair') rows.pop();
    if (kind === 'total') data.overallStats.totalTrials += 1;
    expect(() => validateEvidence(data)).toThrow(message);
  });
});
