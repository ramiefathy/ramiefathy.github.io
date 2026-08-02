import { createHash } from 'node:crypto';
import { gunzipSync } from 'node:zlib';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SITE_ROOT = path.resolve(HERE, '..');
const DASHBOARD_DIR = path.join(SITE_ROOT, 'public', 'apps', 'rheum-derm-clinical-trials');
const OUTPUT = path.join(DASHBOARD_DIR, 'index.html');

// These are the seven payload shards referenced by the checked-in dashboard
// loader. Their order is part of the release contract; do not discover or sort
// similarly named historical files at build time.
const SHARD_FILES = Array.from({ length: 7 }, (_, index) => `dashboard.${index}.b64`);

const EXPECTED_HTML_BYTES = 864417;
const EXPECTED_HTML_SHA256 = '7da4751bb81838b1dfd7be71a4209d0b90fbcea0c0235b07d6e1da2f4f4e86dc';

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function validateDashboard(dashboard) {
  if (dashboard.length !== EXPECTED_HTML_BYTES) {
    throw new Error(
      `Decoded dashboard byte count ${dashboard.length}; expected ${EXPECTED_HTML_BYTES}`
    );
  }

  const actualSha256 = sha256(dashboard);
  if (actualSha256 !== EXPECTED_HTML_SHA256) {
    throw new Error(
      `Decoded dashboard sha256 ${actualSha256}; expected ${EXPECTED_HTML_SHA256}`
    );
  }

  const text = dashboard.toString('utf8');
  if (
    !text.startsWith('<!doctype html>') ||
    !text.includes('Rheum') ||
    !text.includes('214')
  ) {
    throw new Error('Decoded dashboard failed content sanity checks');
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
  if (encoded.length % 4 !== 0 || !/^[A-Za-z0-9+/]*={0,2}$/.test(encoded)) {
    throw new Error('Dashboard payload is not canonical base64');
  }

  const compressed = Buffer.from(encoded, 'base64');
  if (compressed.length < 2 || compressed[0] !== 0x1f || compressed[1] !== 0x8b) {
    throw new Error('Dashboard payload is not a gzip stream');
  }

  const dashboard = gunzipSync(compressed);
  const dashboardSha256 = validateDashboard(dashboard);
  await fs.writeFile(OUTPUT, dashboard);

  console.log(
    `Assembled verified dashboard: ${dashboard.length} bytes, sha256 ${dashboardSha256}`
  );
  console.log(`Payload source: ${SHARD_FILES.join(', ')}`);
  console.log(`Compressed payload: ${compressed.length} bytes`);
}

await main();
