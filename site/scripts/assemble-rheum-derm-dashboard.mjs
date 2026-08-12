import { createHash } from 'node:crypto';
import { gunzipSync } from 'node:zlib';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  enhanceDashboardHtml,
  validateEvidenceDetailRelease,
} from './rheum-derm-evidence-details.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SITE_ROOT = path.resolve(HERE, '..');
const DASHBOARD_DIR = path.join(SITE_ROOT, 'public', 'apps', 'rheum-derm-clinical-trials');
const OUTPUT = path.join(DASHBOARD_DIR, 'index.html');
const REGISTRY_SNAPSHOT = path.join(DASHBOARD_DIR, 'registry-regimens.json');

// Immutable release payload. The order and membership are explicit so stray
// historical fragments cannot enter the gzip stream through filename globbing.
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

const EXPECTED_BASE64_CHARS = 216104;
const EXPECTED_ARCHIVE_BYTES = 162078;
const EXPECTED_ARCHIVE_SHA256 = 'cc0fef45addb8c8bc97a72cc2f4de237c98878b1149bda4bf5843799bd31504d';
const EXPECTED_HTML_BYTES = 864417;
const EXPECTED_HTML_SHA256 = '7da4751bb81838b1dfd7be71a4209d0b90fbcea0c0235b07d6e1da2f4f4e86dc';
const EXPECTED_REGISTRY_BYTES = 287865;
const EXPECTED_REGISTRY_SHA256 = '0744c5d276c2122e0e4a28de39425e7878747ef57d8025c814b00f83f93df8fb';
const EXPECTED_ENHANCED_BYTES = 1237210;
const EXPECTED_ENHANCED_SHA256 = '5648daf1a29433105d1a4ec7b83b1bcdf3fdab201b05dbf49ee36d37e076d5a7';

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function assertExactArtifact(value, expectedBytes, expectedSha256, label) {
  if (value.length !== expectedBytes) {
    throw new Error(`${label} byte count ${value.length}; expected ${expectedBytes}`);
  }

  const actualSha256 = sha256(value);
  if (actualSha256 !== expectedSha256) {
    throw new Error(`${label} sha256 ${actualSha256}; expected ${expectedSha256}`);
  }

  return actualSha256;
}

async function main() {
  const parts = await Promise.all(
    SHARD_FILES.map(async (name) => {
      const value = (await fs.readFile(path.join(DASHBOARD_DIR, name), 'utf8'))
        .replace(/\s+/g, '');
      if (!value) throw new Error(`Dashboard payload shard ${name} is empty`);
      return value;
    })
  );

  const encoded = parts.join('');
  if (encoded.length !== EXPECTED_BASE64_CHARS) {
    throw new Error(
      `Dashboard payload base64 length ${encoded.length}; expected ${EXPECTED_BASE64_CHARS}`
    );
  }
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(encoded)) {
    throw new Error('Dashboard payload is not canonical base64');
  }

  const archive = Buffer.from(encoded, 'base64');
  const archiveSha256 = assertExactArtifact(
    archive,
    EXPECTED_ARCHIVE_BYTES,
    EXPECTED_ARCHIVE_SHA256,
    'Dashboard gzip archive'
  );
  if (archive[0] !== 0x1f || archive[1] !== 0x8b) {
    throw new Error('Dashboard payload is not a gzip stream');
  }

  const sourceDashboard = gunzipSync(archive);
  const sourceDashboardSha256 = assertExactArtifact(
    sourceDashboard,
    EXPECTED_HTML_BYTES,
    EXPECTED_HTML_SHA256,
    'Decoded source dashboard'
  );

  const text = sourceDashboard.toString('utf8');
  if (
    !text.startsWith('<!doctype html>') ||
    !text.includes('Rheum') ||
    !text.includes('214')
  ) {
    throw new Error('Decoded dashboard failed content sanity checks');
  }

  const registryBytes = await fs.readFile(REGISTRY_SNAPSHOT);
  const registrySha256 = assertExactArtifact(
    registryBytes,
    EXPECTED_REGISTRY_BYTES,
    EXPECTED_REGISTRY_SHA256,
    'Registry regimen snapshot'
  );
  const registrySnapshot = JSON.parse(registryBytes.toString('utf8'));
  if (
    registrySnapshot.schemaVersion !== 1 ||
    registrySnapshot.recordCount !== Object.keys(registrySnapshot.records || {}).length ||
    registrySnapshot.recordCount !== 142
  ) {
    throw new Error('Registry regimen snapshot failed denominator checks');
  }

  const dashboard = Buffer.from(enhanceDashboardHtml(text, registrySnapshot));
  const enhancedMatch = dashboard.toString('utf8').match(
    /<script id="dashboard-data" type="application\/json">([\s\S]*?)<\/script>/
  );
  if (!enhancedMatch) throw new Error('Enhanced dashboard is missing its embedded evidence data');
  validateEvidenceDetailRelease(JSON.parse(enhancedMatch[1]));
  const dashboardSha256 = assertExactArtifact(
    dashboard,
    EXPECTED_ENHANCED_BYTES,
    EXPECTED_ENHANCED_SHA256,
    'Enhanced evidence-detail dashboard'
  );
  await fs.writeFile(OUTPUT, dashboard);
  console.log(
    `Assembled evidence-detail dashboard: ${dashboard.length} bytes, sha256 ${dashboardSha256}`
  );
  console.log(
    `Verified archive: ${archive.length} bytes, sha256 ${archiveSha256}`
  );
  console.log(
    `Verified immutable source dashboard: ${sourceDashboard.length} bytes, sha256 ${sourceDashboardSha256}`
  );
  console.log(
    `Verified registry snapshot: ${registryBytes.length} bytes, sha256 ${registrySha256}`
  );
  console.log(`Payload source: ${SHARD_FILES.join(', ')}`);
}

await main();
