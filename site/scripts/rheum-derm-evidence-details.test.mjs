import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  applyEvidenceDetailCorrections,
  buildDisplayTitle,
  enhanceDashboardHtml,
} from './rheum-derm-evidence-details.mjs';

const baseStudy = {
  id: 'generic-phase-2',
  domain: 'Dermatomyositis',
  condition: 'Adult dermatomyositis',
  intervention: 'Examplemab',
  administration: 'Intravenous infusions.',
  trial: 'Phase 2 randomized trial',
  design: 'Phase 2 randomized placebo-controlled trial',
  nct: 'NCT00000001',
  evidenceState: 'Emerging / Active',
  searchText: 'phase 2 randomized trial examplemab dermatomyositis',
};

test('generic study labels become identifiable from the listing', () => {
  assert.equal(
    buildDisplayTitle(baseStudy),
    'Examplemab for adult dermatomyositis — phase 2 randomized trial',
  );
});

test('linked registry arm dosing is promoted into the study regimen with provenance', () => {
  const app = {
    evidenceColors: {},
    stateCounts: { 'Emerging / Active': 1 },
    studies: [{ ...baseStudy }],
  };
  const registry = {
    records: {
      NCT00000001: {
        briefTitle: 'Examplemab in Dermatomyositis',
        lastUpdatePostDate: '2026-08-01',
        arms: [
          {
            label: 'Examplemab',
            type: 'EXPERIMENTAL',
            description: 'Examplemab 600 mg intravenously every 4 weeks for 3 doses.',
          },
        ],
      },
    },
  };

  const enhanced = applyEvidenceDetailCorrections(app, registry);
  const study = enhanced.studies[0];
  assert.equal(study.regimenDetailStatus, 'registry-dose');
  assert.equal(
    study.regimenSummary,
    'Examplemab 600 mg intravenously every 4 weeks for 3 doses.',
  );
  assert.deepEqual(study.regimenSources, [
    {
      identifier: 'NCT00000001',
      title: 'Examplemab in Dermatomyositis',
      checked: '2026-08-01',
      url: 'https://clinicaltrials.gov/study/NCT00000001',
    },
  ]);
});

test('the source-mismatched brepocitinib row is quarantined instead of relabeled as efficacy evidence', () => {
  const app = {
    evidenceColors: { 'Observational / Supportive': '#64748b' },
    stateCounts: { 'Observational / Supportive': 1 },
    studies: [{
      ...baseStudy,
      id: 's085-phase-2-randomized-trial',
      intervention: 'Brepocitinib',
      nct: 'NCT04027101',
    }],
  };

  const enhanced = applyEvidenceDetailCorrections(app, { records: {} });
  const study = enhanced.studies[0];
  assert.equal(study.evidenceState, 'Source mismatch / Quarantined');
  assert.equal(study.grade, 'U');
  assert.match(study.displayTitle, /quarantined/i);
  assert.match(study.metrics, /No verified phase 2 efficacy result/i);
  assert.match(study.sourceVerification, /NCT04027101.*polymyalgia rheumatica/i);
  assert.equal(enhanced.stateCounts['Observational / Supportive'], 0);
  assert.equal(enhanced.stateCounts['Source mismatch / Quarantined'], 1);
});

test('known registry identity defects and high-value dosing omissions are corrected', () => {
  const studies = [
    { ...baseStudy, id: 's082-resolve-1', trial: 'RESOLVE-1', intervention: 'Lenabasum', nct: 'NCT03398837' },
    { ...baseStudy, id: 's087-phase-2-proof-of-concept', trial: 'Phase 2 proof-of-concept', intervention: 'Dazukibart', nct: '' },
    { ...baseStudy, id: 's116-rapids-2', trial: 'RAPIDS-2', intervention: 'Bosentan', condition: 'SSc digital-ulcer disease', nct: 'NCT00301795' },
    { ...baseStudy, id: 's148-blister', trial: 'BLISTER', intervention: 'Doxycycline-initiated strategy', condition: 'Bullous pemphigoid', nct: 'NCT02226146' },
  ];
  const app = {
    evidenceColors: {},
    stateCounts: { 'Emerging / Active': studies.length },
    studies,
  };

  const enhanced = applyEvidenceDetailCorrections(app, { records: {} });
  const byId = new Map(enhanced.studies.map(study => [study.id, study]));

  assert.equal(byId.get('s082-resolve-1').trial, 'DETERMINE');
  assert.equal(byId.get('s082-resolve-1').nct, 'NCT03813160');
  assert.match(byId.get('s082-resolve-1').regimenSummary, /20 mg twice daily/i);

  assert.match(byId.get('s087-phase-2-proof-of-concept').regimenSummary, /150 or 600 mg.*every 4 weeks.*3 doses/i);
  assert.equal(byId.get('s087-phase-2-proof-of-concept').regimenDetailStatus, 'publication-dose');

  assert.equal(byId.get('s116-rapids-2').nct, '');
  assert.match(byId.get('s116-rapids-2').regimenSummary, /62\.5 mg twice daily.*125 mg twice daily/i);
  assert.match(byId.get('s116-rapids-2').notes, /unrelated lymphoma registry/i);

  assert.equal(byId.get('s148-blister').nct, 'ISRCTN13704604');
  assert.equal(byId.get('s148-blister').registryUrl, 'https://www.isrctn.com/ISRCTN13704604');
});

test('dashboard HTML exposes identifiable titles, regimen status, and source verification', () => {
  const app = {
    evidenceColors: { 'Emerging / Active': '#7c3aed' },
    stateCounts: { 'Emerging / Active': 1 },
    studies: [{ ...baseStudy }],
  };
  const fixture = `<!doctype html><style>.study-route { color: gray; }</style><script id="dashboard-data" type="application/json">${JSON.stringify(app)}</script><script>
const studies = APP.studies;
const order = ['Landmark / Pivotal','Comparative / Randomized','Emerging / Active','Observational / Supportive','Negative / Neutral','Critical / Retracted'];
function cardHtml(s) { return \`<button>\${highlight(s.trial)}</button><div class="study-route">\${highlight(s.administration)}</div>\`; }
function tableHtml(rows) { return \`<div>\${highlight(s.trial)} \${highlight(s.administration)}</div>\`; }
function renderCompareTray(){ return escapeHtml(s.trial); }
function openDetail(){ return \`<h2>\${escapeHtml(s.trial)}</h2><section class="detail-section"><h3>Administration</h3><p>\${escapeHtml(s.administration)}</p></section><div class="metadata-key">Verification notes</div><div>\${escapeHtml(s.notes||'—')}</div>\`; }
function studySummary(s){return \`\${s.trial}\nAdministration: \${s.administration}\`;}
function openCompare(){ const rows=[['Administration',s=>s.administration]]; return escapeHtml(s.trial); }
function exportCsv(){const fields=['trial','administration'];}
</script>`;

  const output = enhanceDashboardHtml(fixture, { records: {} });
  assert.match(output, /Study regimen/);
  assert.match(output, /regimenDetailStatus/);
  assert.match(output, /displayTitle/);
  assert.match(output, /Source verification/);
  assert.doesNotMatch(output, /\$\{highlight\(s\.trial\)\}/);
});
