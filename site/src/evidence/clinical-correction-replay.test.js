import { readFileSync } from 'node:fs';
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
it('preserves the recovered bounded edit ledger without blanket claim-validation passes', () => {
  const changes = read('../../public/clinical-source-review/corrections.json');
  expect(changes).toHaveLength(659); expect(new Set(changes.map(r => r.id)).size).toBe(659);
  const monographs = new Set(changes.filter(r => r.pointer.startsWith('/monographs/')).map(r => r.pointer.split('/')[2]));
  expect(monographs.size).toBe(17);
  expect(changes.every(r => ['CORRECTED','REVISED_SOURCE_GAP'].includes(r.disposition))).toBe(true);
});
