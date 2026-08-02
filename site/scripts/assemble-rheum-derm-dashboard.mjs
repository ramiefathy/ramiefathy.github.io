import { createHash } from 'node:crypto';
import { gunzipSync } from 'node:zlib';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SITE_ROOT = path.resolve(HERE, '..');
const DASHBOARD_DIR = path.join(SITE_ROOT, 'public', 'apps', 'rheum-derm-clinical-trials');
const OUTPUT = path.join(DASHBOARD_DIR, 'index.html');
const EXPECTED_SHA256 = '7da4751bb81838b1dfd7be71a4209d0b90fbcea0c0235b07d6e1da2f4f4e86dc';

function permutations(values) {
  if (values.length <= 1) return [values];
  const result = [];
  for (let i = 0; i < values.length; i += 1) {
    const head = values[i];
    const rest = [...values.slice(0, i), ...values.slice(i + 1)];
    for (const tail of permutations(rest)) result.push([head, ...tail]);
  }
  return result;
}

function nonEmptyOrderedSelections(values) {
  const result = [];
  const count = 1 << values.length;
  for (let mask = 1; mask < count; mask += 1) {
    const selected = values.filter((_, index) => mask & (1 << index));
    result.push(...permutations(selected));
  }
  return result;
}

function hash(buffer) {
  return createHash('sha256').update(buffer).digest('hex');
}

function validateDashboard(dashboard, sourceLabel) {
  const actualHash = hash(dashboard);
  if (actualHash !== EXPECTED_SHA256) {
    throw new Error(
      `${sourceLabel} decoded to sha256 ${actualHash}; expected ${EXPECTED_SHA256}`
    );
  }

  const text = dashboard.toString('utf8');
  if (!text.includes('214') || !text.includes('Rheum') || !text.includes('<!doctype html')) {
    throw new Error(`${sourceLabel} failed dashboard content sanity checks`);
  }

  return actualHash;
}

function decodeGzipBase64(encoded, sourceLabel) {
  const compressed = Buffer.from(encoded.replace(/\s+/g, ''), 'base64');
  if (compressed.length < 2 || compressed[0] !== 0x1f || compressed[1] !== 0x8b) {
    throw new Error(`${sourceLabel} is not a gzip payload`);
  }
  return gunzipSync(compressed);
}

async function acceptDashboard(dashboard, sourceLabel) {
  const actualHash = validateDashboard(dashboard, sourceLabel);
  await fs.writeFile(OUTPUT, dashboard);
  console.log(`Assembled verified dashboard: ${dashboard.length} bytes, sha256 ${actualHash}`);
  console.log(`Payload source: ${sourceLabel}`);
}

async function tryCommittedOutput() {
  try {
    const dashboard = await fs.readFile(OUTPUT);
    validateDashboard(dashboard, 'committed index.html');
    console.log(
      `Verified committed dashboard: ${dashboard.length} bytes, sha256 ${EXPECTED_SHA256}`
    );
    return true;
  } catch (error) {
    if (error?.code !== 'ENOENT') {
      console.warn(`Committed dashboard was not accepted: ${error.message}`);
    }
    return false;
  }
}

async function tryCanonicalShards(allFiles) {
  const shardFiles = allFiles
    .filter((name) => /^dashboard\.\d+[a-z]?\.b64$/i.test(name))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  if (!shardFiles.length) return false;

  try {
    const encoded = (
      await Promise.all(
        shardFiles.map((name) => fs.readFile(path.join(DASHBOARD_DIR, name), 'utf8'))
      )
    ).join('');
    const dashboard = decodeGzipBase64(encoded, shardFiles.join(', '));
    await acceptDashboard(dashboard, shardFiles.join(', '));
    return true;
  } catch (error) {
    console.warn(`Canonical dashboard shards were not accepted: ${error.message}`);
    return false;
  }
}

async function main() {
  const allFiles = await fs.readdir(DASHBOARD_DIR);

  // The checked-in HTML is itself an immutable, hash-pinned artifact. Accept it
  // first when it matches the verified release denominator. This prevents an
  // unrelated legacy-fragment defect from blocking every site build.
  if (await tryCommittedOutput()) return;

  // Prefer the canonical numbered base64 shards. They are deterministic and do
  // not require guessing among historical fragment variants.
  if (await tryCanonicalShards(allFiles)) return;

  // Retain the historical fragment-recovery path as a final compatibility
  // fallback, but continue to fail closed on the pinned SHA-256.
  const partFiles = allFiles.filter((name) => /^part-[0-9]+[a-z]?\.txt$/i.test(name));
  if (!partFiles.length) throw new Error(`No dashboard payload parts found in ${DASHBOARD_DIR}`);

  const contents = new Map();
  for (const name of partFiles) {
    const value = (await fs.readFile(path.join(DASHBOARD_DIR, name), 'utf8')).replace(/\s+/g, '');
    if (!value) throw new Error(`Payload part ${name} is empty`);
    contents.set(name, value);
  }

  const fixedPrefix = ['part-00.txt', 'part-01.txt', 'part-02.txt', 'part-03.txt', 'part-04.txt', 'part-05.txt']
    .filter((name) => contents.has(name));
  const group06 = ['part-06.txt', 'part-06a.txt', 'part-06b.txt'].filter((name) => contents.has(name));
  const group07 = ['part-07.txt', 'part-07a.txt', 'part-07b.txt'].filter((name) => contents.has(name));
  const group08 = ['part-08.txt', 'part-08a.txt', 'part-08b.txt'].filter((name) => contents.has(name));
  const fixedSuffix = ['part-09.txt', 'part-10.txt', 'part-11.txt', 'part-12.txt']
    .filter((name) => contents.has(name));

  const candidates = [];
  const natural = [...partFiles].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  candidates.push(natural);

  const sixOrders = group06.length ? nonEmptyOrderedSelections(group06) : [[]];
  const sevenOrders = group07.length ? nonEmptyOrderedSelections(group07) : [[]];
  const eightOrders = group08.length ? nonEmptyOrderedSelections(group08) : [[]];
  for (const six of sixOrders) {
    for (const seven of sevenOrders) {
      for (const eight of eightOrders) {
        candidates.push([...fixedPrefix, ...six, ...seven, ...eight, ...fixedSuffix]);
      }
    }
  }

  const seen = new Set();
  const diagnostics = [];
  for (const candidate of candidates) {
    const key = candidate.join('|');
    if (seen.has(key)) continue;
    seen.add(key);
    try {
      const encoded = candidate.map((name) => contents.get(name)).join('');
      const dashboard = decodeGzipBase64(encoded, candidate.join(', '));
      const actualHash = hash(dashboard);
      diagnostics.push(`${actualHash} <= ${candidate.join(', ')}`);
      if (actualHash !== EXPECTED_SHA256) continue;
      await acceptDashboard(dashboard, candidate.join(', '));
      return;
    } catch (error) {
      if (diagnostics.length < 20) diagnostics.push(`FAILED <= ${candidate.join(', ')}: ${error.message}`);
    }
  }

  throw new Error(
    `Could not reconstruct the verified dashboard from ${partFiles.length} payload files. ` +
    `Expected sha256 ${EXPECTED_SHA256}. Diagnostics:\n${diagnostics.slice(0, 20).join('\n')}`
  );
}

await main();
