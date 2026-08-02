import { createHash } from 'node:crypto';
import { gunzipSync } from 'node:zlib';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SITE_ROOT = path.resolve(HERE, '..');
const DASHBOARD_DIR = path.join(SITE_ROOT, 'public', 'apps', 'rheum-derm-clinical-trials');
const OUTPUT = path.join(DASHBOARD_DIR, 'index.html');

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

  const dashboard = gunzipSync(archive);
  const dashboardSha256 = assertExactArtifact(
    dashboard,
    EXPECTED_HTML_BYTES,
    EXPECTED_HTML_SHA256,
    'Decoded dashboard'
  );

  const text = dashboard.toString('utf8');
  if (
    !text.startsWith('<!doctype html>') ||
    !text.includes('Rheum') ||
    !text.includes('214')
  ) {
    throw new Error('Decoded dashboard failed content sanity checks');
  }

  await fs.writeFile(OUTPUT, dashboard);
  console.log(
    `Assembled verified dashboard: ${dashboard.length} bytes, sha256 ${dashboardSha256}`
  );
  console.log(
    `Verified archive: ${archive.length} bytes, sha256 ${archiveSha256}`
  );
  console.log(`Payload source: ${SHARD_FILES.join(', ')}`);
}

await main();
