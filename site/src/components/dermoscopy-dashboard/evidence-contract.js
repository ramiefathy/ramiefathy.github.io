/** Validate the shipped image-level pairing contract, not generalizability to patients. */
export function validateEvidence(payload) {
  const count = payload?.overallStats?.uniqueImages;
  if (!Number.isSafeInteger(count) || count < 1 || payload?.cases?.count !== count) throw new Error('Invalid unique-image denominator.');
  if (!Array.isArray(payload.modelSummary) || !Array.isArray(payload.armSummary) || !Array.isArray(payload.modelArmTradeoffs) || !Array.isArray(payload.cases.correctByModelArm)) throw new Error('Incomplete evaluation data.');
  const modelIds = payload.modelSummary.map((row) => row?.model);
  const armIds = payload.armSummary.map((row) => Number(row?.arm));
  const models = new Set(modelIds);
  const arms = new Set(armIds);
  if (!models.size || !arms.size || models.size !== modelIds.length || arms.size !== armIds.length ||
      modelIds.some((model) => typeof model !== 'string' || !model.trim()) ||
      armIds.some((arm) => !Number.isSafeInteger(arm) || arm < 1) ||
      payload.overallStats.uniqueModels !== models.size || payload.overallStats.promptingArms !== arms.size) {
    throw new Error('Invalid model or arm inventory.');
  }
  // Canonical keys prevent numeric/string arm aliases from concealing duplicate pairs.
  const keyOf = (row) => JSON.stringify([row.model, Number(row.arm)]);
  const knownPair = (row) => row && models.has(row.model) && arms.has(Number(row.arm));
  const aggregates = new Map();
  for (const aggregate of payload.modelArmTradeoffs) {
    if (!knownPair(aggregate) || aggregates.has(keyOf(aggregate))) throw new Error('Duplicate or unpaired aggregate row.');
    aggregates.set(keyOf(aggregate), aggregate);
  }
  const seen = new Set();
  for (const row of payload.cases.correctByModelArm) {
    if (!knownPair(row) || seen.has(keyOf(row))) throw new Error('Duplicate or unpaired image results.');
    if (typeof row.correct_bits !== 'string' || row.correct_bits.length !== count) throw new Error('Invalid image-vector length.');
    if (!/^[01]+$/.test(row.correct_bits)) throw new Error('Non-binary image results.');
    const aggregate = aggregates.get(keyOf(row));
    const correct = [...row.correct_bits].filter((bit) => bit === '1').length;
    if (!aggregate || aggregate.n_trials !== count || aggregate.correct !== correct ||
        typeof aggregate.accuracy !== 'number' || !Number.isFinite(aggregate.accuracy) ||
        Math.abs(aggregate.accuracy - correct / count) > 0.000001) {
      throw new Error('Image results disagree with aggregate counts.');
    }
    seen.add(keyOf(row));
  }
  if (seen.size !== models.size * arms.size || aggregates.size !== seen.size ||
      payload.overallStats.totalTrials !== count * seen.size) throw new Error('Evaluation denominator mismatch.');
  return true;
}
