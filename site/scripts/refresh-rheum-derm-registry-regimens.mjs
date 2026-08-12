import { gunzipSync } from 'node:zlib';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { applyEvidenceDetailCorrections } from './rheum-derm-evidence-details.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SITE_ROOT = path.resolve(HERE, '..');
const DASHBOARD_DIR = path.join(SITE_ROOT, 'public', 'apps', 'rheum-derm-clinical-trials');
const OUTPUT = path.join(DASHBOARD_DIR, 'registry-regimens.json');
const SHARD_FILES = [
  'dashboard.00.b64',
  'dashboard.01.b64',
  'dashboard.02.b64',
  'dashboard.03.b64',
  'dashboard.04.b64',
  'dashboard.05.b64',
  'dashboard.06.b64',
  'dashboard.07.b64',
  'dashboard.08a.b64',
  'dashboard.08b.b64',
  'dashboard.09.b64',
  'dashboard.10.b64',
];

function dashboardData(html) {
  const match = html.match(/<script id="dashboard-data" type="application\/json">([\s\S]*?)<\/script>/);
  if (!match) throw new Error('Could not locate dashboard data');
  return JSON.parse(match[1]);
}

function identifiers(studies) {
  return [...new Set(studies.flatMap(study => String(study.nct || '').match(/NCT\d{8}/g) || []))].sort();
}

function compactRecord(identifier, payload) {
  const protocol = payload.protocolSection || {};
  const identification = protocol.identificationModule || {};
  const status = protocol.statusModule || {};
  const arms = protocol.armsInterventionsModule || {};
  return {
    identifier,
    briefTitle: identification.briefTitle || '',
    officialTitle: identification.officialTitle || '',
    overallStatus: status.overallStatus || '',
    lastUpdatePostDate: status.lastUpdatePostDateStruct?.date || '',
    conditions: protocol.conditionsModule?.conditions || [],
    interventions: (arms.interventions || []).map(intervention => ({
      type: intervention.type || '',
      name: intervention.name || '',
      description: String(intervention.description || '').replace(/\s+/g, ' ').trim(),
    })),
    arms: (arms.armGroups || []).map(arm => ({
      label: arm.label || '',
      type: arm.type || '',
      description: String(arm.description || '').replace(/\s+/g, ' ').trim(),
    })),
  };
}

async function fetchRecord(identifier) {
  const response = await fetch(`https://clinicaltrials.gov/api/v2/studies/${identifier}`);
  if (!response.ok) throw new Error(`${identifier}: ClinicalTrials.gov returned HTTP ${response.status}`);
  return compactRecord(identifier, await response.json());
}

async function main() {
  const encoded = (await Promise.all(SHARD_FILES.map(name => fs.readFile(path.join(DASHBOARD_DIR, name), 'utf8'))))
    .join('')
    .replace(/\s+/g, '');
  const sourceHtml = gunzipSync(Buffer.from(encoded, 'base64')).toString('utf8');
  const corrected = applyEvidenceDetailCorrections(dashboardData(sourceHtml), { records: {} });
  const requested = identifiers(corrected.studies);
  const records = {};
  let cursor = 0;

  async function worker() {
    while (cursor < requested.length) {
      const identifier = requested[cursor++];
      records[identifier] = await fetchRecord(identifier);
    }
  }

  await Promise.all(Array.from({ length: 8 }, worker));
  const orderedRecords = Object.fromEntries(Object.entries(records).sort(([a], [b]) => a.localeCompare(b)));
  const snapshot = {
    schemaVersion: 1,
    retrievedAt: new Date().toISOString().slice(0, 10),
    source: 'https://clinicaltrials.gov/api/v2/studies/{NCT_ID}',
    recordCount: Object.keys(orderedRecords).length,
    records: orderedRecords,
  };
  await fs.writeFile(OUTPUT, `${JSON.stringify(snapshot, null, 2)}\n`);
  console.log(`Wrote ${snapshot.recordCount} registry regimen records to ${OUTPUT}`);
}

await main();
