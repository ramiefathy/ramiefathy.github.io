const DATA_PATTERN = /(<script id="dashboard-data" type="application\/json">)([\s\S]*?)(<\/script>)/;

const QUARANTINE_STATE = 'Source mismatch / Quarantined';
const QUARANTINE_COLOR = '#991b1b';

const STUDY_CORRECTIONS = {
  's064-phase-2-iberdomide-sle-trial': {
    trial: 'Iberdomide dose-ranging phase 2 SLE trial',
    administration: 'Oral iberdomide 0.15 mg, 0.30 mg, or 0.45 mg once daily versus placebo for 24 weeks.',
    regimenSummary: 'Oral iberdomide 0.15 mg, 0.30 mg, or 0.45 mg once daily versus placebo for 24 weeks.',
    regimenDetailStatus: 'registry-dose',
    sourceVerification: 'ClinicalTrials.gov NCT03161483 identifies the 0.15 mg, 0.30 mg, and 0.45 mg once-daily arms.',
  },
  's081-phase-2-skin-predominant-dm-trial': {
    trial: 'Lenabasum skin-predominant dermatomyositis phase 2 trial',
  },
  's082-resolve-1': {
    trial: 'DETERMINE',
    nct: 'NCT03813160',
    registryUrl: 'https://clinicaltrials.gov/study/NCT03813160',
    administration: 'Oral lenabasum 20 mg twice daily, 5 mg twice daily, or placebo twice daily; planned for 52 weeks and stopped after all participants completed week 28.',
    regimenSummary: 'Oral lenabasum 20 mg twice daily, 5 mg twice daily, or placebo twice daily; planned for 52 weeks and stopped after all participants completed week 28.',
    regimenDetailStatus: 'registry-dose',
    sourceVerification: 'Registry identity corrected to DETERMINE (NCT03813160). The previously listed NCT03398837 is RESOLVE-1 in diffuse cutaneous systemic sclerosis, not dermatomyositis.',
    notes: 'Registry identifier corrected from the unrelated SSc RESOLVE-1 record NCT03398837 to the dermatomyositis DETERMINE record NCT03813160.',
  },
  's085-phase-2-randomized-trial': {
    trial: 'Brepocitinib adult dermatomyositis phase 2 record — quarantined',
    displayTitle: 'Brepocitinib for adult dermatomyositis — quarantined source-mismatched record',
    administration: 'Dose not reportable: the cited registry does not describe brepocitinib or dermatomyositis.',
    regimenSummary: 'Dose not reportable: the cited registry does not describe brepocitinib or dermatomyositis.',
    regimenDetailStatus: 'source-mismatch',
    category: 'Unverified — source mismatch',
    grade: 'U',
    status: 'Quarantined pending a correct primary source; excluded from efficacy interpretation.',
    evidenceState: QUARANTINE_STATE,
    metrics: 'No verified phase 2 efficacy result is reported. The cited NCT04027101 is BACHELOR, a baricitinib trial in polymyalgia rheumatica. The verified brepocitinib dermatomyositis evidence is the separately listed VALOR phase 3 trial (NCT05437263).',
    finding: 'Source mismatch; no phase 2 efficacy inference is retained.',
    impact: 'None assigned. This record is quarantined until a matching primary source is supplied.',
    caveats: 'The prior registry identifier, disease, intervention, sample, dosing, and efficacy narrative did not resolve to the same study.',
    nct: '',
    doi: '',
    sourceUrl: '',
    registryUrl: '',
    citation: 'Quarantined dashboard record. Rejected identifier: NCT04027101 (BACHELOR; baricitinib in polymyalgia rheumatica). No matching brepocitinib dermatomyositis phase 2 primary source verified as of 2026-08-12.',
    citationType: 'Quarantined source-mismatch record',
    sourceVerification: 'Rejected NCT04027101: the registry describes baricitinib for polymyalgia rheumatica, not brepocitinib for dermatomyositis.',
    notes: 'Quarantined on 2026-08-12 after direct ClinicalTrials.gov identity reconciliation.',
  },
  's087-phase-2-proof-of-concept': {
    trial: 'Dazukibart phase 2 dermatomyositis trial',
    nct: 'NCT03181893',
    registryUrl: 'https://clinicaltrials.gov/study/NCT03181893',
    administration: 'Intravenous dazukibart 150 mg or 600 mg every 4 weeks for 3 doses versus placebo.',
    regimenSummary: 'Intravenous dazukibart 150 or 600 mg every 4 weeks for 3 doses versus placebo.',
    regimenDetailStatus: 'publication-dose',
    sourceVerification: 'Dose and schedule verified against the primary Lancet report, DOI 10.1016/S0140-6736(24)02071-3 (trial registration NCT03181893).',
  },
  's088-phase-3-program-open-label-extension': {
    trial: 'Dazukibart phase 3 IIM open-label extension',
    administration: 'Intravenous dazukibart every 4 weeks; the numeric dose is not disclosed in the public registry record.',
    regimenSummary: 'Intravenous dazukibart every 4 weeks; numeric dose not disclosed in the public registry record.',
    regimenDetailStatus: 'registry-schedule',
  },
  's066-willow-elowen-program': {
    nNumeric: 400,
  },
  's111-phase-2-and-resolve-1': {
    trial: 'Lenabasum SSc program: phase 2 and RESOLVE-1',
    administration: 'Oral lenabasum 5 mg or 20 mg twice daily versus placebo in RESOLVE-1.',
    regimenSummary: 'Oral lenabasum 5 mg or 20 mg twice daily versus placebo in RESOLVE-1.',
    regimenDetailStatus: 'registry-dose',
    nNumeric: 365,
  },
  's116-rapids-2': {
    administration: 'Oral bosentan 62.5 mg twice daily for 4 weeks, then 125 mg twice daily for 20 weeks, versus placebo.',
    regimenSummary: 'Oral bosentan 62.5 mg twice daily for 4 weeks, then 125 mg twice daily for 20 weeks, versus placebo.',
    regimenDetailStatus: 'publication-dose',
    nct: '',
    registryUrl: '',
    sourceVerification: 'Primary publication verified by DOI 10.1136/ard.2010.130658. The previously listed NCT00301795 is an unrelated follicular-lymphoma trial and was removed.',
    notes: 'Removed unrelated lymphoma registry NCT00301795; identity and regimen verified against the RAPIDS-2 primary publication.',
  },
  's148-blister': {
    nct: 'ISRCTN13704604',
    registryUrl: 'https://www.isrctn.com/ISRCTN13704604',
    sourceVerification: 'Registry identity corrected to ISRCTN13704604. The previously listed NCT02226146 is a bertilimumab bullous-pemphigoid study, not BLISTER.',
    notes: 'Registry identifier corrected from unrelated NCT02226146 to ISRCTN13704604.',
  },
  's187-thalidomide-rct': {
    trial: 'Thalidomide mucocutaneous Behçet randomized trial',
  },
  's189-phase-2-apremilast-trial': {
    trial: 'Apremilast Behçet oral-ulcer phase 2 trial',
  },
};

const GENERIC_TITLE = /^(?:phase\s*[123](?:a|b)?|randomi[sz]ed(?: controlled)? trial|open-label trial|prospective study)/i;
const DOSE_PATTERN = /(?:\b\d+(?:\.\d+)?\s*(?:mg|g|mcg|µg|ug|units?|iu|mL|ml|%)(?=\s|[),.;/]|$)|\b\d+(?:\.\d+)?\s*(?:mg|g|mcg|µg|ug)\s*\/\s*(?:kg|day|week|m2|m²)(?=\s|[),.;/]|$)|\b\d+(?:\.\d+)?\s*(?:J|mJ)\s*\/\s*cm(?:2|²)(?=\s|[),.;/]|$))/i;
const VARIABLE_REGIMEN_PATTERN = /(?:systematic review|meta-analysis|network meta-analysis|evidence synthesis|case series|cohort evidence|across .* trials|no single administration)/i;

export const EVIDENCE_DETAIL_RELEASE_EXPECTATIONS = Object.freeze({
  studies: 214,
  quarantined: 1,
  regimenDetailCounts: Object.freeze({
    'record-dose': 72,
    'registry-dose': 31,
    'publication-dose': 2,
    'variable-regimen': 18,
    'registry-schedule': 1,
    'dose-not-reported': 89,
    'source-mismatch': 1,
  }),
});

function lowerInitial(value) {
  if (!value) return '';
  return value[0].toLowerCase() + value.slice(1);
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function registryIdentifiers(value) {
  return String(value || '').match(/NCT\d{8}/g) || [];
}

function registryDoseDetails(record) {
  if (!record) return [];
  const arms = Array.isArray(record.arms) ? record.arms : [];
  const interventions = Array.isArray(record.interventions) ? record.interventions : [];
  return unique([...arms, ...interventions]
    .flatMap(item => [item.description, item.name])
    .map(value => String(value || '').replace(/\s+/g, ' ').trim())
    .filter(description => DOSE_PATTERN.test(description)));
}

export function buildDisplayTitle(study) {
  if (study.displayTitle) return study.displayTitle;
  const trial = String(study.trial || '').trim();
  const intervention = String(study.intervention || 'Intervention').trim();
  const condition = String(study.condition || 'the listed condition').trim();
  if (GENERIC_TITLE.test(trial)) {
    return `${intervention} for ${lowerInitial(condition)} — ${lowerInitial(trial)}`;
  }

  const normalizedTrial = trial.toLowerCase();
  const interventionKey = intervention.toLowerCase().split(/[\s/+(]/)[0];
  if (interventionKey.length > 3 && normalizedTrial.includes(interventionKey)) {
    return `${trial} — ${condition}`;
  }
  return `${trial} — ${intervention} for ${condition}`;
}

function regimenStatusLabel(status) {
  return ({
    'record-dose': 'Dose and schedule reported in the normalized record',
    'registry-dose': 'Dose detail reconciled to linked ClinicalTrials.gov arms',
    'publication-dose': 'Dose detail reconciled to the primary publication',
    'registry-schedule': 'Schedule reported; numeric dose absent from the public registry record',
    'variable-regimen': 'No single dose applies across the included evidence',
    'dose-not-reported': 'Numeric dose not reported in the current normalized record',
    'source-mismatch': 'Do not use: source identity mismatch',
  })[status] || 'Regimen detail status unknown';
}

export function applyEvidenceDetailCorrections(inputApp, registrySnapshot = { records: {} }) {
  const app = structuredClone(inputApp);
  app.evidenceColors ||= {};
  app.evidenceColors[QUARANTINE_STATE] = QUARANTINE_COLOR;
  const registryRecords = registrySnapshot.records || {};

  app.studies = (app.studies || []).map(original => {
    const study = { ...original, ...(STUDY_CORRECTIONS[original.id] || {}) };
    const ids = registryIdentifiers(study.nct);
    const records = ids.map(identifier => ({ identifier, record: registryRecords[identifier] })).filter(item => item.record);
    const doseDetails = unique(records.flatMap(item => registryDoseDetails(item.record)));

    study.regimenSources = records.map(({ identifier, record }) => ({
      identifier,
      title: record.briefTitle || record.officialTitle || identifier,
      checked: record.lastUpdatePostDate || registrySnapshot.retrievedAt || 'not recorded',
      url: `https://clinicaltrials.gov/study/${identifier}`,
    }));
    study.regimenDetails = doseDetails;

    if (!study.regimenSummary) {
      if (DOSE_PATTERN.test(study.administration || '')) {
        study.regimenSummary = study.administration;
        study.regimenDetailStatus = 'record-dose';
      } else if (doseDetails.length) {
        study.regimenSummary = doseDetails.join(' ');
        study.regimenDetailStatus = 'registry-dose';
      } else if (VARIABLE_REGIMEN_PATTERN.test(`${study.design || ''} ${study.administration || ''} ${study.trial || ''}`)) {
        study.regimenSummary = `${study.administration} No single dose applies across the included evidence.`;
        study.regimenDetailStatus = 'variable-regimen';
      } else {
        study.regimenSummary = `${study.administration || 'Administration not reported.'} Numeric dose is not reported in the current normalized record.`;
        study.regimenDetailStatus = 'dose-not-reported';
      }
    }

    study.regimenStatusLabel = regimenStatusLabel(study.regimenDetailStatus);
    study.sourceVerification ||= ids.length
      ? `Linked registry identifier${ids.length === 1 ? '' : 's'}: ${ids.join(', ')}.`
      : 'No ClinicalTrials.gov identifier is recorded; use the cited primary publication or source record.';
    study.displayTitle = buildDisplayTitle(study);
    study.originalRecordLabel = original.trial;
    study.searchText = [
      original.searchText,
      study.displayTitle,
      study.regimenSummary,
      study.regimenStatusLabel,
      study.sourceVerification,
      ...study.regimenDetails,
    ].filter(Boolean).join(' ').toLowerCase();
    return study;
  });

  const counts = {};
  for (const study of app.studies) counts[study.evidenceState] = (counts[study.evidenceState] || 0) + 1;
  app.stateCounts = { ...(app.stateCounts || {}), ...counts };
  for (const key of Object.keys(app.stateCounts)) {
    if (!counts[key]) app.stateCounts[key] = 0;
  }
  app.meta ||= {};
  app.meta.evidenceDetailRevision = '2026-08-12';
  app.meta.sourceMismatchQuarantined = counts[QUARANTINE_STATE] || 0;
  app.meta.regimenDetailCounts = app.studies.reduce((result, study) => {
    result[study.regimenDetailStatus] = (result[study.regimenDetailStatus] || 0) + 1;
    return result;
  }, {});
  return app;
}

export function validateEvidenceDetailRelease(app) {
  const expected = EVIDENCE_DETAIL_RELEASE_EXPECTATIONS;
  const studies = app.studies || [];
  if (studies.length !== expected.studies) {
    throw new Error(`Evidence-detail study denominator ${studies.length}; expected ${expected.studies}`);
  }

  const titles = studies.map(study => String(study.displayTitle || '').trim());
  if (titles.some(title => !title)) throw new Error('Evidence-detail release contains a blank display title');
  if (new Set(titles).size !== studies.length) {
    throw new Error('Evidence-detail release contains a duplicate display title');
  }
  if (titles.some(title => GENERIC_TITLE.test(title))) {
    throw new Error('Evidence-detail release contains a generic display title');
  }

  const actualCounts = app.meta?.regimenDetailCounts || {};
  for (const [status, expectedCount] of Object.entries(expected.regimenDetailCounts)) {
    if (actualCounts[status] !== expectedCount) {
      throw new Error(`Evidence-detail ${status} count ${actualCounts[status] ?? 0}; expected ${expectedCount}`);
    }
  }
  const unexpectedStatuses = Object.keys(actualCounts).filter(status => !(status in expected.regimenDetailCounts));
  if (unexpectedStatuses.length) {
    throw new Error(`Evidence-detail release contains unexpected regimen statuses: ${unexpectedStatuses.join(', ')}`);
  }
  const regimenDenominator = Object.values(actualCounts).reduce((sum, count) => sum + count, 0);
  if (regimenDenominator !== studies.length) {
    throw new Error(`Evidence-detail regimen denominator ${regimenDenominator}; expected ${studies.length}`);
  }
  if (app.meta?.sourceMismatchQuarantined !== expected.quarantined) {
    throw new Error(`Evidence-detail quarantine count ${app.meta?.sourceMismatchQuarantined ?? 0}; expected ${expected.quarantined}`);
  }

  const byId = new Map(studies.map(study => [study.id, study]));
  const correctedIdentityChecks = [
    ['s082-resolve-1', 'NCT03813160'],
    ['s087-phase-2-proof-of-concept', 'NCT03181893'],
    ['s116-rapids-2', ''],
    ['s148-blister', 'ISRCTN13704604'],
    ['s085-phase-2-randomized-trial', ''],
  ];
  for (const [id, expectedIdentifier] of correctedIdentityChecks) {
    const study = byId.get(id);
    if (!study || study.nct !== expectedIdentifier) {
      throw new Error(`Evidence-detail identity check failed for ${id}`);
    }
  }
  if (byId.get('s085-phase-2-randomized-trial')?.regimenDetailStatus !== 'source-mismatch') {
    throw new Error('Evidence-detail brepocitinib mismatch is not quarantined');
  }
  return app;
}

function replaceAllRequired(text, needle, replacement, label = needle) {
  if (!text.includes(needle)) throw new Error(`Dashboard evidence-detail transform could not find ${label}`);
  return text.split(needle).join(replacement);
}

export function enhanceDashboardHtml(sourceHtml, registrySnapshot = { records: {} }) {
  const match = sourceHtml.match(DATA_PATTERN);
  if (!match) throw new Error('Dashboard evidence-detail transform could not locate embedded data');
  const app = applyEvidenceDetailCorrections(JSON.parse(match[2]), registrySnapshot);
  let html = sourceHtml.replace(DATA_PATTERN, `$1${JSON.stringify(app)}$3`);

  const styles = `
.study-route { -webkit-line-clamp: 4; }
.study-regimen-label { display: block; margin-bottom: 3px; color: var(--muted-2); font-size: 9px; font-weight: 800; letter-spacing: .07em; text-transform: uppercase; }
.regimen-status { display: inline-flex; align-items: center; width: fit-content; margin-top: 7px; padding: 3px 7px; border: 1px solid var(--line); border-radius: 6px; background: var(--surface-2); color: var(--muted); font-size: 9px; font-weight: 700; }
.regimen-status.source-mismatch { border-color: #fecaca; background: #fef2f2; color: #991b1b; }
.regimen-detail-list { margin: 9px 0 0; padding-left: 18px; color: var(--muted); font-size: 11px; }
.source-verification-warning { color: #991b1b; font-weight: 700; }
`;
  html = replaceAllRequired(html, '</style>', `${styles}</style>`, 'closing style tag');

  html = replaceAllRequired(html, 'highlight(s.trial)', 'highlight(s.displayTitle)', 'highlighted trial labels');
  html = replaceAllRequired(html, 'escapeHtml(s.trial)', 'escapeHtml(s.displayTitle)', 'escaped trial labels');
  html = html.split('${s.trial}').join('${s.displayTitle}');
  html = replaceAllRequired(html, 'highlight(s.administration)', 'highlight(s.regimenSummary)', 'highlighted administration text');
  html = replaceAllRequired(html, 'escapeHtml(s.administration)', 'escapeHtml(s.regimenSummary)', 'escaped administration text');
  html = html.split('${s.administration}').join('${s.regimenSummary}');
  html = html.split('s=>s.administration').join('s=>s.regimenSummary');
  html = html.split("'Administration'").join("'Study regimen'");
  html = html.split('Administration:').join('Study regimen:');
  html = html.split('Intervention / route').join('Intervention / study regimen');

  const plainRegimen = '<div class="study-route">${highlight(s.regimenSummary)}</div>';
  if (html.includes(plainRegimen)) {
    html = html.split(plainRegimen).join('<div class="study-route"><span class="study-regimen-label">Study regimen</span>${highlight(s.regimenSummary)}</div><div class="regimen-status ${escapeHtml(s.regimenDetailStatus)}">${escapeHtml(s.regimenStatusLabel)}</div>');
  } else {
    html = html.replace(/<div class="study-route">\$\{highlight\(s\.regimenSummary\)\}<\/div>/g, '<div class="study-route"><span class="study-regimen-label">Study regimen</span>${highlight(s.regimenSummary)}</div><div class="regimen-status ${escapeHtml(s.regimenDetailStatus)}">${escapeHtml(s.regimenStatusLabel)}</div>');
  }

  const detailSection = '<section class="detail-section"><h3>Administration</h3><p>${escapeHtml(s.regimenSummary)}</p></section>';
  const renamedDetailSection = '<section class="detail-section"><h3>Study regimen</h3><p>${escapeHtml(s.regimenSummary)}<br><span class="regimen-status ${escapeHtml(s.regimenDetailStatus)}">${escapeHtml(s.regimenStatusLabel)}</span></p>${s.regimenDetails?.length?`<ul class="regimen-detail-list">${s.regimenDetails.map(detail=>`<li>${escapeHtml(detail)}</li>`).join(\'\')}</ul>`:\'\'}</section>';
  if (html.includes(detailSection)) html = html.replace(detailSection, renamedDetailSection);
  else {
    const alreadyRenamed = '<section class="detail-section"><h3>Study regimen</h3><p>${escapeHtml(s.regimenSummary)}</p></section>';
    if (html.includes(alreadyRenamed)) html = html.replace(alreadyRenamed, renamedDetailSection);
  }

  const notesMetadata = '<div class="metadata-key">Verification notes</div><div>${escapeHtml(s.notes||\'—\')}</div>';
  const verificationMetadata = '<div class="metadata-key">Original record label</div><div>${escapeHtml(s.originalRecordLabel||\'—\')}</div><div class="metadata-key">Source verification</div><div class="${s.regimenDetailStatus===\'source-mismatch\'?\'source-verification-warning\':\'\'}">${escapeHtml(s.sourceVerification||\'—\')}</div><div class="metadata-key">Regimen provenance</div><div>${escapeHtml(s.regimenStatusLabel||\'—\')}</div><div class="metadata-key">Verification notes</div><div>${escapeHtml(s.notes||\'—\')}</div>';
  if (html.includes(notesMetadata)) html = html.replace(notesMetadata, verificationMetadata);
  else if (html.includes('Verification notes')) html = html.replace('Verification notes', 'Source verification / notes');

  html = html.replace(
    "const order = ['Landmark / Pivotal','Comparative / Randomized','Emerging / Active','Observational / Supportive','Negative / Neutral','Critical / Retracted'];",
    "const order = ['Landmark / Pivotal','Comparative / Randomized','Emerging / Active','Observational / Supportive','Negative / Neutral','Critical / Retracted','Source mismatch / Quarantined'];",
  );
  html = html.replace(
    "const fields=['trial','year'",
    "const fields=['displayTitle','trial','year'",
  );
  html = html.replace(
    "'intervention','administration','target'",
    "'intervention','regimenSummary','regimenDetailStatus','administration','target'",
  );
  html = html.replace(
    "'citation','sourceUrl','registryUrl'",
    "'citation','sourceVerification','sourceUrl','registryUrl'",
  );

  if (!html.includes('regimenDetailStatus') || !html.includes('displayTitle') || !html.includes('Source verification')) {
    throw new Error('Dashboard evidence-detail transform failed its output contract');
  }
  return html;
}
