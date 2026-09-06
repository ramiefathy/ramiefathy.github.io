/* Source-oriented inspection. Uses text nodes for all record and reference content. */
(function () {
  'use strict';
  const node = (tag, text, attrs = {}) => {
    const item = document.createElement(tag);
    if (text !== undefined) item.textContent = String(text);
    for (const [key, value] of Object.entries(attrs)) item.setAttribute(key, value);
    return item;
  };
  const section = document.getElementById('atlas-source-review');
  const states = { ACTIVE: 'Active synthesis (not fully validated)', QUARANTINED: 'Quarantined evidence', DERIVED: 'Derived manifestation mappings', SCOPED_CLAIMS: 'Primary-source study assertions', PUBLICATION_HOLDS: 'Publication correction review pending' };
  const title = node('h3', 'Source-review workbench');
  const boundary = node('p', 'Targeted corrections do not validate every clinical claim. Quarantined efficacy is excluded before all runtime indexes are built; archived numerical values must not be reused. Mechanism, organ-specific outcomes, regulatory status, and therapeutic inference are distinct.');
  const stats = DATA.sourceReview;
  const denominator = node('p', `${stats.activeEffectCount} active + ${stats.quarantinedEffectCount} quarantined = ${stats.originalEffectCount} original clinical-effect records; ${stats.derivedMappingCount} derived manifestation mappings remain independently unvalidated.`, { class: 'review-denominator' });
  const controls = node('div', undefined, { class: 'review-controls' });
  const search = node('input', undefined, { type: 'search', 'aria-label': 'Search Atlas source records', placeholder: 'Drug, condition, outcome, or source…' });
  const state = node('select', undefined, { 'aria-label': 'Atlas source record category' });
  Object.entries(states).forEach(([value, label]) => state.append(node('option', label, { value })));
  const count = node('p', '', { role: 'status', 'aria-live': 'polite' });
  const exportButton = node('button', 'Export filtered evidence (CSV)', { type: 'button', class: 'btn' });
  const results = node('div', undefined, { class: 'review-records' });
  const all = [
    ...(DATA.publicationReviewHolds || []).map(row => ({ ...row, category: 'PUBLICATION_HOLDS' })),
    ...DATA.scopedClaims.map(row => ({ ...row, category: 'SCOPED_CLAIMS' })),
    ...DATA.effects.map(row => ({ ...row, category: 'ACTIVE' })),
    ...DATA.quarantinedEffects.map(row => ({ ...row, category: 'QUARANTINED' })),
    ...(DATA.sourceManifestationLinks || DATA.manifestationLinks).map(row => ({ ...row, category: 'DERIVED' }))
  ];
  let selected = [];
  function sourceLink(id) {
    const reference = DATA.references.find(r => r.id === id);
    if (!reference) return node('span', `${id}: source unresolved`);
    try {
      const url = new URL(reference.url);
      if (url.protocol !== 'https:') throw new Error('Unsupported source URL');
      return node('a', `${id}: ${reference.title}`, { href: url.href, target: '_blank', rel: 'noopener' });
    } catch (_) { return node('span', `${id}: source locator unavailable`); }
  }
  function render() {
    const q = search.value.trim().toLowerCase();
    // Only two held publications: expose full correction context, not a nested clipped panel.
    results.style.maxHeight = state.value === 'PUBLICATION_HOLDS' ? 'none' : '';
    results.style.overflow = state.value === 'PUBLICATION_HOLDS' ? 'visible' : '';
    selected = all.filter(row => row.category === state.value && (!q || JSON.stringify({ ...row,
      medicationName: DATA.medications.find(m => m.id === row.med)?.name,
      conditionName: DATA.conditions.find(c => c.id === row.condition)?.name
    }).toLowerCase().includes(q)));
    count.textContent = `${selected.length} of ${all.filter(r => r.category === state.value).length} records in this category.`;
    exportButton.disabled = !selected.length;
    results.replaceChildren();
    if (!selected.length) { results.append(node('p', 'No records match. Clear the search or choose another category.')); return; }
    selected.forEach(row => {
      const condition = DATA.conditions.find(c => c.id === row.condition)?.name || row.condition;
      const med = DATA.medications.find(m => m.id === row.med)?.name || row.med;
      const detail = node('details');
      detail.append(node('summary', `${condition} — ${med || row.trial || row.pathway || row.id} — ${row.claim || row.manifestations || row.manifestation}`));
      if (row.category === 'SCOPED_CLAIMS') {
        detail.append(node('p', `${row.disposition}: ${row.studyDesign}. AI-assisted source adjudication, not human sign-off or clinical validation.`));
        for (const key of ['evidenceAccess', 'primaryOutcome', 'population', 'comparison', 'endpoint', 'result']) {
          if (row[key]) detail.append(node('p', `${key[0].toUpperCase() + key.slice(1)}: ${row[key]}`));
        }
        detail.append(node('blockquote', row.quote));
        detail.append(node('p', `Locator: ${row.locator}`));
        detail.append(node('p', row.limitations, { class: 'disclaimer' }));
      }
      detail.append(node('p', `Review status: ${row.reviewStatus}. Source grade ${row.grade || 'not recorded'} is inherited from the synthesis, not a new independent grade.`));
      if (row.category === 'QUARANTINED') detail.append(node('p', row.quarantineReason, { class: 'disclaimer' }));
      else if (row.category === 'DERIVED') detail.append(node('p', 'This relationship is a derived mapping. A parent citation or a treatment response does not independently establish this pathway–manifestation claim.', { class: 'disclaimer' }));
      else if (row.category !== 'SCOPED_CLAIMS') detail.append(node('p', row.sourceReview || 'Complete claim-by-claim source adjudication remains pending.'));
      const holds = (DATA.publicationReviewHolds || []).filter(hold => hold.refs.some(id => (row.refs || []).includes(id)));
      for (const hold of holds) {
        detail.append(node('p', 'Publication correction review pending. The existing synthesis is not newly source-validated.', { class: 'disclaimer' }));
        for (const notice of hold.correctionNotices) {
          const p = node('p'); p.append(node('a', `Indexed correction: PMID ${notice.pmid}`, { href: notice.url, target: '_blank', rel: 'noopener' })); detail.append(p);
          detail.append(node('p', `Notice review: ${notice.reviewStatus}. ${notice.summary}`));
          if (notice.reviewStatus === 'NOTICE_CONTENT_EXAMINED') {
            detail.append(node('blockquote', notice.quote));
            const source = node('p'); source.append(node('a', notice.locator, { href: notice.sourceUrl, target: '_blank', rel: 'noopener' })); detail.append(source);
            detail.append(node('p', 'Examining this notice does not resolve other notices or release the trial from source-review hold.', { class: 'disclaimer' }));
          }
        }
      }
      for (const key of ['summary', 'caveat', 'basis', 'rationale']) if (row[key]) detail.append(node('p', `${key}: ${row[key]}`));
      const links = node('div'); (row.refs || []).forEach(id => { const p = node('p'); p.append(sourceLink(id)); links.append(p); }); detail.append(links);
      results.append(detail);
    });
  }
  controls.append(search, state, exportButton); section.append(title, boundary, denominator, controls, count, results);
  const ledger = node('p'); ledger.append(node('a', 'Download the complete 659-edit clinical correction ledger (JSON)', { href: '/clinical-source-review/corrections.json', download: 'clinical-corrections.json' })); section.append(ledger);
  search.addEventListener('input', render); state.addEventListener('change', render);
  exportButton.addEventListener('click', () => {
    const content = AtlasSourceReview.csv(selected.map(row => ({ ...row, publication_review_holds: (DATA.publicationReviewHolds || []).filter(h => h.refs.some(id => (row.refs || []).includes(id))), review_date: row.reviewedAt || stats.reviewedAt, clinically_validated: false })));
    saveBlob(content, 'atlas_source_review.csv', 'text/csv;charset=utf-8');
  }); render();
})();
