/** Validate the shipped image-level pairing contract, not generalizability to patients. */
export function validateEvidence(payload) {
  const count = payload?.overallStats?.uniqueImages;
  if (!Number.isSafeInteger(count) || count < 1 || payload?.cases?.count !== count) throw new Error('Invalid unique-image denominator.');
  if (!Array.isArray(payload.modelSummary) || !Array.isArray(payload.armSummary) || !Array.isArray(payload.modelArmTradeoffs) || !Array.isArray(payload.cases.correctByModelArm)) throw new Error('Incomplete evaluation data.');
  const models = new Set(payload.modelSummary.map((row) => row.model));
  const arms = new Set(payload.armSummary.map((row) => Number(row.arm)));
  const rows = payload.cases.correctByModelArm;
  const seen = new Set();
  for (const row of rows) {
    const key = `${row.model}:${row.arm}`;
    const aggregate = payload.modelArmTradeoffs.find((item) => item.model === row.model && Number(item.arm) === Number(row.arm));
    if (seen.has(key) || !models.has(row.model) || !arms.has(Number(row.arm)) || typeof row.correct_bits !== 'string' || row.correct_bits.length !== count || !/^[01]+$/.test(row.correct_bits)) throw new Error('Invalid image-pairing data.');
    const correct = [...row.correct_bits].filter((bit) => bit === '1').length;
    if (!aggregate || aggregate.n_trials !== count || aggregate.correct !== correct) throw new Error('Image results disagree with aggregate counts.');
    seen.add(key);
  }
  if (seen.size !== models.size * arms.size || payload.overallStats.totalTrials !== count * seen.size) throw new Error('Evaluation denominator mismatch.');
  return true;
}
