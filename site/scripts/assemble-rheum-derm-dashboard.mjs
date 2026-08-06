import { createHash } from 'node:crypto';
import { gunzipSync } from 'node:zlib';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SITE_ROOT = path.resolve(HERE, '..');
const DASHBOARD_DIR = path.join(SITE_ROOT, 'public', 'apps', 'rheum-derm-clinical-trials');
const OUTPUT = path.join(DASHBOARD_DIR, 'index.html');
const SOURCE_MANIFEST = path.join(DASHBOARD_DIR, 'source-manifest.json');
const RELEASE_MANIFEST = path.join(DASHBOARD_DIR, 'release-manifest.json');
const FALLBACK = path.join(DASHBOARD_DIR, 'fallback.html');

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
const RECORD_COUNT_CLAIM = 214;

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

function validateSourceManifest(manifest) {
  const failures = [];
  if (manifest?.schemaVersion !== 1) failures.push('schemaVersion must equal 1');
  if (manifest?.recordCountClaim !== RECORD_COUNT_CLAIM) failures.push(`recordCountClaim must equal ${RECORD_COUNT_CLAIM}`);
  if (manifest?.classification !== 'research evidence dashboard') failures.push('classification must remain research evidence dashboard');
  if (manifest?.clinicalUse !== 'research only') failures.push('clinicalUse must remain research only');
  if (manifest?.normalizedSourceRecords?.status !== 'not-yet-published') failures.push('normalized source-record status must remain explicit');
  if (manifest?.verifiedPayload?.gzipSha256 !== EXPECTED_ARCHIVE_SHA256) failures.push('gzipSha256 does not match pinned artifact');
  if (manifest?.verifiedPayload?.decodedHtmlSha256 !== EXPECTED_HTML_SHA256) failures.push('decodedHtmlSha256 does not match pinned artifact');
  if (!Array.isArray(manifest?.interpretiveBoundaries) || manifest.interpretiveBoundaries.length < 3) failures.push('interpretive boundaries are incomplete');
  if (failures.length) throw new Error(`Invalid trials source manifest: ${failures.join('; ')}`);
}

function instrumentDashboard(sourceHtml) {
  if (!/<\/head>/i.test(sourceHtml) || !/<body(?:\s[^>]*)?>/i.test(sourceHtml)) {
    throw new Error('Decoded dashboard is missing head/body insertion points');
  }
  if (sourceHtml.includes('id="rheum-derm-trials-research-boundary"')) {
    throw new Error('Decoded source unexpectedly already contains the release boundary');
  }

  const style = `
<style id="rheum-derm-trials-boundary-style">
  #rheum-derm-trials-research-boundary{position:relative;z-index:2147483000;display:grid;grid-template-columns:minmax(12rem,auto) minmax(18rem,1fr);gap:.35rem 1rem;padding:.9rem 1rem;border-bottom:1px solid #9a6a22;border-left:5px solid #9a6a22;background:#fff8e8;color:#241b0f;font:14px/1.45 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
  #rheum-derm-trials-research-boundary strong{grid-row:1/span 2;align-self:start;color:#7a4d0c;font-size:12px;letter-spacing:.08em;text-transform:uppercase}
  #rheum-derm-trials-research-boundary span{font-weight:650}
  #rheum-derm-trials-research-boundary small{font-size:12px;color:#5f5547}
  #rheum-derm-trials-research-boundary a{color:#68400a;text-decoration:underline;text-underline-offset:2px}
  @media(max-width:720px){#rheum-derm-trials-research-boundary{grid-template-columns:1fr}#rheum-derm-trials-research-boundary strong{grid-row:auto}}
</style>`;

  const boundary = `<aside id="rheum-derm-trials-research-boundary" role="note" aria-label="Research evidence dashboard boundary"><strong>Research evidence dashboard</strong><span>${RECORD_COUNT_CLAIM} embedded study and program records · not patient-specific clinical guidance</span><small>A registered study is not evidence of positive efficacy. Registration, posted results, publication interpretation, and regulatory status must remain distinct. Normalized source records are not yet published for this release. <a href="./source-manifest.json">Source status</a> · <a href="./release-manifest.json">Release integrity</a> · <a href="./fallback.html">Accessible fallback</a></small></aside>`;

  return sourceHtml
    .replace(/<\/head>/i, `${style}\n</head>`)
    .replace(/<body(?:\s[^>]*)?>/i, (match) => `${match}\n${boundary}`);
}

function createFallbackHtml() {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex">
<title>Rheum–Derm Clinical Trials Dashboard — accessible fallback</title>
<style>body{margin:0;background:#f5f4ef;color:#17324d;font:16px/1.6 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}main{width:min(820px,calc(100% - 32px));margin:0 auto;padding:48px 0}h1{font-size:clamp(32px,6vw,58px);line-height:1;margin:.2em 0}.boundary{border-left:5px solid #9a6a22;background:#fff8e8;padding:16px 18px;margin:24px 0}a{color:#155e75}code{word-break:break-all}</style>
</head>
<body><main><p>Research evidence dashboard · fallback</p><h1>Rheum–Derm Clinical Trials Evidence Dashboard</h1><div class="boundary"><strong>${RECORD_COUNT_CLAIM} embedded study and program records.</strong><p>This release is a research artifact, not clinical guidance. A registered study is not evidence of positive efficacy. Normalized record-level source data are not yet published, so this fallback does not reproduce the interactive records.</p></div><h2>Available release evidence</h2><ul><li><a href="./source-manifest.json">Source-status manifest</a></li><li><a href="./release-manifest.json">Release-integrity manifest</a></li><li><a href="./">Return to the interactive dashboard</a></li></ul><h2>Required next release</h2><p>Publish normalized records, a data dictionary, deterministic registry/publication update diffs, adjudication status, and a searchable non-JavaScript table before this application can be classified as a reviewed reference.</p></main></body></html>`;
}

async function main() {
  const sourceManifest = JSON.parse(await fs.readFile(SOURCE_MANIFEST, 'utf8'));
  validateSourceManifest(sourceManifest);

  const parts = await Promise.all(
    SHARD_FILES.map(async (name) => {
      const value = (await fs.readFile(path.join(DASHBOARD_DIR, name), 'utf8')).replace(/\s+/g, '');
      if (!value) throw new Error(`Dashboard payload shard ${name} is empty`);
      return value;
    })
  );

  const encoded = parts.join('');
  if (encoded.length !== EXPECTED_BASE64_CHARS) {
    throw new Error(`Dashboard payload base64 length ${encoded.length}; expected ${EXPECTED_BASE64_CHARS}`);
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
    'Decoded dashboard source artifact'
  );

  const sourceText = dashboard.toString('utf8');
  if (!sourceText.startsWith('<!doctype html>') || !sourceText.includes('Rheum') || !sourceText.includes(String(RECORD_COUNT_CLAIM))) {
    throw new Error('Decoded dashboard failed content sanity checks');
  }

  const deployedText = instrumentDashboard(sourceText);
  const deployed = Buffer.from(deployedText, 'utf8');
  const deployedSha256 = sha256(deployed);
  const fallback = createFallbackHtml();

  const releaseManifest = {
    schemaVersion: 1,
    classification: 'research evidence dashboard',
    clinicalUse: 'research only',
    recordCountClaim: RECORD_COUNT_CLAIM,
    normalizedSourceStatus: sourceManifest.normalizedSourceRecords.status,
    sourceArtifact: {
      bytes: dashboard.length,
      sha256: dashboardSha256,
      gzipBytes: archive.length,
      gzipSha256: archiveSha256,
      shardFiles: SHARD_FILES
    },
    deployedArtifact: {
      bytes: deployed.length,
      sha256: deployedSha256,
      instrumentation: 'research-boundary-v1'
    },
    files: ['index.html', 'source-manifest.json', 'release-manifest.json', 'fallback.html']
  };

  await Promise.all([
    fs.writeFile(OUTPUT, deployed),
    fs.writeFile(RELEASE_MANIFEST, `${JSON.stringify(releaseManifest, null, 2)}\n`),
    fs.writeFile(FALLBACK, fallback)
  ]);

  console.log(`Verified source dashboard: ${dashboard.length} bytes, sha256 ${dashboardSha256}`);
  console.log(`Instrumented deployed dashboard: ${deployed.length} bytes, sha256 ${deployedSha256}`);
  console.log(`Verified archive: ${archive.length} bytes, sha256 ${archiveSha256}`);
  console.log(`Payload source: ${SHARD_FILES.join(', ')}`);
}

await main();
