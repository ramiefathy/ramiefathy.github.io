/** Pure, offline evidence contracts. A database association is not a treatment claim. */
export const ASSOCIATION_STATES = Object.freeze({
  DIRECT_ASSOCIATION_RETURNED: 'Direct association returned',
  NOT_RETURNED_BY_EXACT_QUERY: 'Not returned by this exact query',
  IDENTITY_UNRESOLVED: 'Identity unresolved or conflicting',
});

export function validateAssociationSnapshot(snapshot, targets) {
  if (!snapshot || snapshot.schema_version !== 1 || !Array.isArray(snapshot.pairs) ||
      !Array.isArray(targets) || snapshot.pairs.length !== targets.length ||
      typeof snapshot.source_version !== 'string' || !snapshot.source_version.trim() ||
      typeof snapshot.retrieved_at !== 'string' || !Number.isFinite(Date.parse(snapshot.retrieved_at)) ||
      !/^[a-f0-9]{64}$/.test(snapshot.historical_targets_sha256 || '') || snapshot.enable_indirect !== false) {
    throw new Error('Incomplete association snapshot; independent evidence is unavailable.');
  }
  const expected = new Map(targets.map(t => [JSON.stringify([t.disease_key, t.gene]), t]));
  if (expected.size !== targets.length) throw new Error('Duplicate historical target identity.');
  const seen = new Set();
  const counts = Object.fromEntries(Object.keys(ASSOCIATION_STATES).map(key => [key, 0]));
  for (const row of snapshot.pairs) {
    if (!row || typeof row !== 'object') throw new Error('Invalid association row.');
    const key = JSON.stringify([row.disease_key, row.gene]);
    const historical = expected.get(key);
    if (!historical || seen.has(key) || !Object.hasOwn(ASSOCIATION_STATES, row.status) ||
        row.historical_target_id !== historical.target_id || row.historical_disease_id !== historical.disease_id ||
        row.clinically_validated !== false || row.therapeutic_direction !== 'NOT_ESTABLISHED' ||
        !Array.isArray(row.sources) || !row.sources.length || typeof row.note !== 'string' || !row.note.trim() ||
        row.disease_name !== historical.disease_name || !Array.isArray(row.datasource_scores)) {
      throw new Error('Invalid or duplicate association identity.');
    }
    seen.add(key);
    counts[row.status] += 1;
    if (row.status === 'IDENTITY_UNRESOLVED') {
      if (row.target_id !== null || row.identity_method !== 'UNRESOLVED_OR_CONFLICT') {
        throw new Error('Unresolved identity must remain unassigned.');
      }
    } else if (!/^ENSG\d{11}$/.test(row.target_id || '') ||
               !/^(MONDO|EFO|Orphanet)_\d+$/.test(row.disease_id || '') ||
               row.identity_method !== 'EXACT_SYMBOL_GRCH38') {
      throw new Error('Resolved evidence requires confirmed identifiers.');
    }
    if (row.status === 'DIRECT_ASSOCIATION_RETURNED') {
      if (!/^ENSG\d{11}$/.test(row.target_id || '') || !/^(MONDO|EFO|Orphanet)_\d+$/.test(row.disease_id || '') ||
          !Number.isFinite(row.score) || row.score < 0 || row.score > 1 || !Array.isArray(row.datasource_scores) ||
          row.datasource_scores.some(x => !x || typeof x.id !== 'string' || !x.id.trim() || !Number.isFinite(x.score) || x.score < 0 || x.score > 1) ||
          new Set(row.datasource_scores.map(x => x.id)).size !== row.datasource_scores.length) {
        throw new Error('Invalid direct association score or source.');
      }
    } else if (row.score !== null || row.datasource_scores.length !== 0) {
      throw new Error('Missing or unresolved evidence must not have a numerical score.');
    }
    for (const source of row.sources) {
      if (typeof source !== 'string' || !/^source-evidence\/[a-z0-9_-]+\/[a-z0-9_-]+(?:-request|-response)?\.json$/.test(source)) {
        throw new Error('Unsafe evidence source path.');
      }
    }
  }
  if (!snapshot.counts || typeof snapshot.counts !== 'object' ||
      Object.keys(snapshot.counts).length !== Object.keys(counts).length ||
      Object.entries(counts).some(([key, value]) => snapshot.counts[key] !== value)) {
    throw new Error('Association summary counts disagree with the actual records.');
  }
  return snapshot;
}

const dimensionNames = ['genes', 'targets', 'drugs', 'drug_types', 'stages', 'cand_stages', 'diseases'];
const validatedCandidates = new WeakSet();
/** Reject corrupt columnar data, including out-of-range dictionary indexes. */
export function validateDrugCandidates(col) {
  if (col && validatedCandidates.has(col)) return col;
  if (!col || !Number.isSafeInteger(col.n) || col.n < 0 || col.n > 1000000 ||
      !col.dims || !col.cols || !Array.isArray(col.report_count) || col.report_count.length !== col.n) {
    throw new Error('Invalid drug-candidate dimensions.');
  }
  for (const name of dimensionNames) {
    if (!Array.isArray(col.dims[name]) || !Array.isArray(col.cols[name]) || col.cols[name].length !== col.n ||
        col.dims[name].some(v => typeof v !== 'string') ||
        col.cols[name].some(v => !Number.isSafeInteger(v) || v < 0 || v >= col.dims[name].length)) {
      throw new Error(`Invalid drug-candidate column: ${name}.`);
    }
  }
  if (col.report_count.some(v => !Number.isSafeInteger(v) || v < 0)) throw new Error('Invalid report count.');
  // A cached validation is sound only while the validated payload is immutable.
  for (const name of dimensionNames) { Object.freeze(col.dims[name]); Object.freeze(col.cols[name]); }
  Object.freeze(col.report_count); Object.freeze(col.dims); Object.freeze(col.cols); Object.freeze(col);
  validatedCandidates.add(col);
  return col;
}

/** Collapse byte-equivalent logical rows only; do not pool reports or indications. */
export function uniqueDrugRowIds(col) {
  validateDrugCandidates(col);
  const seen = new Set(), ids = [];
  for (let i = 0; i < col.n; i++) {
    const key = JSON.stringify([...dimensionNames.map(d => col.dims[d][col.cols[d][i]]), col.report_count[i]]);
    if (!seen.has(key)) { seen.add(key); ids.push(i); }
  }
  return ids;
}

export function reconstructDrug(col, i) {
  if (!Number.isSafeInteger(i) || i < 0 || i >= col.n) throw new Error('Invalid candidate row.');
  const fields = ['gene_symbol', 'target_name', 'drug_name', 'drug_type', 'drug_maximum_clinical_stage', 'candidate_max_stage', 'disease_name'];
  const result = Object.fromEntries(dimensionNames.map((d, k) => [fields[k], col.dims[d][col.cols[d][i]]]));
  result.clinical_report_count = col.report_count[i];
  return result;
}

/** No substring matching: a parent/sibling disease cannot silently inherit evidence. */
export function sameIndication(a, b) {
  const normalize = s => String(s ?? '').trim().normalize('NFKC').toLowerCase().replace(/\s+/g, ' ');
  return Boolean(normalize(a)) && normalize(a) === normalize(b);
}

export function csvText(rows) {
  if (!rows.length) return '';
  const keys = [...new Set(rows.flatMap(r => Object.keys(r)))];
  const quote = value => {
    const numeric = typeof value === 'number' && Number.isFinite(value);
    let text = value == null ? '' : typeof value === 'object' ? JSON.stringify(value) : String(value);
    if (!numeric && /^[\s\u0000-\u001f]*[=+\-@]/u.test(text)) text = "'" + text;
    return '"' + text.replace(/"/g, '""') + '"';
  };
  return [keys.map(quote).join(','), ...rows.map(r => keys.map(k => quote(r[k])).join(','))].join('\r\n');
}
