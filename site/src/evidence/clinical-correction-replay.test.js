import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
const read = path => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'));
const tree = read('../data/mindmaps/ctcl/diagrams/staging-decision-tree.json');
const steps = new Map(tree.data.steps.map(row => [row.id, row]));
function walk(t, n, m, b, complete = true) {
  const branch = { complete: complete ? 0 : 1, viscera: m ? 0 : 1, nodes: n === 3 ? 0 : 1,
    blood: b === 2 ? 0 : 1, erythroderma: t === 4 ? 0 : 1, 't4-blood': b,
    tumor: t === 3 ? 0 : 1, 'early-nodes': n > 0 ? 0 : 1, extent: t - 1 };
  let row = steps.get(tree.data.start); const visited = new Set();
  while (row.type !== 'terminal') {
    if (visited.has(row.id)) throw new Error('Cycle'); visited.add(row.id);
    row = steps.get(row.branches[branch[row.id]].nextStepId);
    if (!row) throw new Error('Missing stage route');
  }
  return row.id;
}
describe('CTCL stage-group source correction', () => {
  // Reference stage groups: NCI PDQ, Mycosis Fungoides and Other Cutaneous T-Cell Lymphomas.
  // Each tuple is an independent allowed stage-group set, not the application's tree traversal.
  const group = (t, n, m, b) => {
    const groups = [
      ['ivb', [1,2,3,4], [0,1,2,3], [1], [0,1,2]],
      ['iva2', [1,2,3,4], [3], [0], [0,1,2]],
      ['iva1', [1,2,3,4], [0,1,2], [0], [2]],
      ['iiib', [4], [0,1,2], [0], [1]], ['iiia', [4], [0,1,2], [0], [0]],
      ['iib', [3], [0,1,2], [0], [0,1]], ['iia', [1,2], [1,2], [0], [0,1]],
      ['ib', [2], [0], [0], [0,1]], ['ia', [1], [0], [0], [0,1]]
    ];
    const matches = groups.filter(([, ts, ns, ms, bs]) => ts.includes(t) && ns.includes(n) && ms.includes(m) && bs.includes(b));
    expect(matches).toHaveLength(1); return 'stage-' + matches[0][0];
  };
  for (const t of [1,2,3,4]) for (const n of [0,1,2,3]) for (const m of [0,1]) for (const b of [0,1,2]) {
    it(`T${t} N${n} M${m} B${b}`, () => expect(walk(t,n,m,b)).toBe(group(t,n,m,b)));
  }
  it('does not assign a stage when a compartment is unassessed', () => expect(walk(null,null,null,null,false)).toBe('incomplete'));
});
// Ledger identity. Recompute after any ledger append with:
//   node -e "const c=require('crypto');const f=require('fs');process.stdout.write(c.createHash('sha256').update(f.readFileSync('site/public/clinical-source-review/corrections.json')).digest('hex'))"
// (run from the repository root) and set LEDGER_RECORDS to the array length printed by
//   python3 scripts/build-clinical-review-status.py --check
const LEDGER_RECORDS = 687;
const LEDGER_SHA256 = '84f6ff087db8b83b70c18f40a3883083e43a35e64b98b1e7b428b42828be83ed';
const ledgerPath = new URL('../../public/clinical-source-review/corrections.json', import.meta.url);
const ledgerBytes = readFileSync(ledgerPath);
const changes = JSON.parse(ledgerBytes.toString('utf8'));
const repoRoot = new URL('../../../', import.meta.url);

it('preserves the recovered bounded edit ledger without blanket claim-validation passes', () => {
  expect(changes).toHaveLength(LEDGER_RECORDS); expect(new Set(changes.map(r => r.id)).size).toBe(LEDGER_RECORDS);
  expect(changes.map(r => r.id)).toEqual(changes.map((_, i) => `C${String(i + 1).padStart(4, '0')}`));
  expect(createHash('sha256').update(ledgerBytes).digest('hex')).toBe(LEDGER_SHA256);
  const monographs = new Set(changes.filter(r => r.pointer.startsWith('/monographs/')).map(r => r.pointer.split('/')[2]));
  expect(monographs.size).toBe(17);
  expect(changes.every(r => ['CORRECTED','REVISED_SOURCE_GAP'].includes(r.disposition))).toBe(true);
});

const canonical = value => JSON.stringify(sortKeys(value));
function sortKeys(value) {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map(k => [k, sortKeys(value[k])]));
  return value;
}
it('binds every ledger value hash to the canonical compact serialization', () => {
  for (const row of changes) {
    expect(createHash('sha256').update(canonical(row.before), 'utf8').digest('hex')).toBe(row.before_sha256);
    expect(createHash('sha256').update(canonical(row.after), 'utf8').digest('hex')).toBe(row.after_sha256);
  }
});

function resolvePointer(doc, pointer) {
  let node = doc;
  for (const part of pointer.split('/').slice(1)) {
    if (node === undefined || node === null) return undefined;
    node = Array.isArray(node) ? node[Number(part)] : node[part];
  }
  return node;
}
function leaves(value, out = []) {
  if (typeof value === 'string') out.push(value);
  else if (Array.isArray(value)) value.forEach(v => leaves(v, out));
  else if (value && typeof value === 'object') Object.values(value).forEach(v => leaves(v, out));
  return out;
}
const embeddedJson = (text, declaration) => {
  const start = text.indexOf(declaration);
  if (start < 0) return null;
  const from = start + declaration.length;
  const end = text.indexOf(';\n', from);
  return JSON.parse(text.slice(from, end));
};
describe('Ledger replay against current files', () => {
  // A later record on the same path supersedes an earlier one when its pointer is the same, an ancestor
  // or a descendant of the earlier pointer (for example C0092 → C0106 on one cell, or a later
  // /tooltip/markdown edit after an earlier whole-/tooltip replacement).
  const overlaps = (a, b) => a === b || a.startsWith(b + '/') || b.startsWith(a + '/');
  const latest = new Map();
  for (const row of changes) {
    for (const [key, earlier] of latest) if (earlier.path === row.path && overlaps(earlier.pointer, row.pointer)) latest.delete(key);
    latest.set(row.id, row);
  }
  // "/additions" is a virtual pointer: the record appends each listed item to the parent array.
  const replays = (doc, pointer, after) => {
    if (pointer.endsWith('/additions') && Array.isArray(after)) {
      const parent = resolvePointer(doc, pointer.slice(0, -'/additions'.length));
      return Array.isArray(parent) && after.every(item => parent.some(existing => canonical(existing) === canonical(item)));
    }
    const actual = resolvePointer(doc, pointer);
    return after === null ? actual === undefined : canonical(actual) === canonical(after);
  };
  const fileText = new Map();
  const text = path => { if (!fileText.has(path)) fileText.set(path, readFileSync(new URL(path, repoRoot), 'utf8')); return fileText.get(path); };
  const embedded = new Map();
  const embeddedDoc = (path, name) => {
    const key = `${path}:${name}`;
    if (!embedded.has(key)) embedded.set(key, embeddedJson(text(path), `const ${name} = `) ?? embeddedJson(text(path), `const ${name}=`));
    return embedded.get(key);
  };
  const byPath = [...latest.values()].reduce((out, row) => { (out[row.path] ||= []).push(row); return out; }, {});
  for (const [path, rows] of Object.entries(byPath)) {
    it(`replays ${rows.length} final record(s) into ${path}`, () => {
      const failures = [];
      for (const row of rows) {
        if (path.endsWith('.json')) {
          if (!replays(JSON.parse(text(path)), row.pointer, row.after)) failures.push(`${row.id} ${row.pointer}`);
          continue;
        }
        const [, root] = row.pointer.split('/');
        const doc = path.endsWith('.html') && ['DATA', 'JAK_ROUTES'].includes(root) ? embeddedDoc(path, root) : null;
        if (doc) {
          if (!replays(doc, row.pointer.slice(root.length + 1), row.after)) failures.push(`${row.id} ${row.pointer}`);
          continue;
        }
        const source = text(path);
        const missing = leaves(row.after).filter(leaf => !source.includes(leaf) && !source.includes(JSON.stringify(leaf).slice(1, -1)));
        if (missing.length) failures.push(`${row.id} ${row.pointer}: ${missing.map(m => m.slice(0, 40)).join(' | ')}`);
      }
      expect(failures).toEqual([]);
    });
  }
});
