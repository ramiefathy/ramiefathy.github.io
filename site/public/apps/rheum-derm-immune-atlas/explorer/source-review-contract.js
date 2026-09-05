/* A synchronous gate: quarantine runs before any index, quiz, chart, or graph is built. */
(function (root) {
  'use strict';
  const applied = new WeakSet();
  function apply(data) {
    if (!data || !Array.isArray(data.effects) || !Array.isArray(data.references) || !Array.isArray(data.manifestationLinks)) {
      throw new Error('The Atlas source-review contract cannot be established.');
    }
    if (applied.has(data)) return data.sourceReview;
    const references = new Map(data.references.map(r => [r.id, r]));
    if (references.size !== data.references.length) throw new Error('Duplicate source identity.');
    const active = [], archived = [];
    data.effects.forEach((record, index) => {
      if (!record || !record.med || !record.condition || !Array.isArray(record.refs) ||
          record.refs.some(id => !references.has(id)) ||
          (record.quarantined !== undefined && typeof record.quarantined !== 'boolean')) {
        throw new Error('Malformed clinical-effect record.');
      }
      const retracted = record.refs.some(id => /RETRACTED/.test(references.get(id).evidenceStatus || ''));
      const entry = { ...record, sourceRecordId: `effect-${String(index).padStart(3, '0')}` };
      if (record.quarantined === true || retracted) {
        archived.push({ ...entry, quarantined: true, reviewStatus: 'QUARANTINED',
          quarantineReason: record.sourceReview || 'A cited source is retracted; the archived benefit value is not usable efficacy evidence.' });
      } else {
        active.push({ ...entry, reviewStatus: record.sourceReview ? 'TARGETED_REVIEW_ONLY' : 'CLAIM_ADJUDICATION_PENDING' });
      }
    });
    // Archive preserves original values; never convert unavailable efficacy into a numerical zero.
    data.quarantinedEffects = archived;
    data.effects = active;
    data.manifestationLinks = data.manifestationLinks.map(row => ({ ...row, reviewStatus: 'DERIVED_NOT_INDEPENDENTLY_VALIDATED' }));
    // Retain the complete historical denominator before optional inference layers filter it.
    data.sourceManifestationLinks = JSON.parse(JSON.stringify(data.manifestationLinks));
    data.sourceReview = {
      reviewedAt: '2026-09-05', scope: 'Targeted source corrections, not exhaustive claim validation',
      originalEffectCount: active.length + archived.length, activeEffectCount: active.length,
      quarantinedEffectCount: archived.length, derivedMappingCount: data.manifestationLinks.length,
      clinicalValidationComplete: false, sourceFile: '/clinical-source-review/corrections.json',
      rules: 'Mechanism is not efficacy. Derived relationships are not independently source-validated. Missing evidence is not a zero effect.'
    };
    applied.add(data);
    return data.sourceReview;
  }
  function csv(rows) {
    if (!Array.isArray(rows) || !rows.length) return '';
    const keys = [...new Set(rows.flatMap(r => Object.keys(r)))];
    const quote = value => {
      let text = value == null ? '' : typeof value === 'object' ? JSON.stringify(value) : String(value);
      if (typeof value !== 'number' && /^[\s\u0000-\u001f]*[=+\-@]/u.test(text)) text = "'" + text;
      return '"' + text.replace(/"/g, '""') + '"';
    };
    return [keys.map(quote).join(','), ...rows.map(r => keys.map(k => quote(r[k])).join(','))].join('\r\n');
  }
  root.AtlasSourceReview = Object.freeze({ apply, csv });
})(globalThis);
