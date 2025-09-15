// Scheduled Function: Harvest OA dermatology articles from Europe PMC
import { createClient } from '@netlify/blobs';

export const config = { schedule: '30 3 * * *' }; // 03:30 UTC daily

const USER_AGENT = 'ramiefathy.github.io/ingest-europepmc (contact: site owner)';
const BLOB_BUCKET = 'research';

export async function handler() {
  try {
    const query = encodeURIComponent('(DERMATOLOGY) OPEN_ACCESS:y');
    const url = `https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=${query}&resultType=lite&pageSize=100&format=json`;
    const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
    if (!res.ok) throw new Error(`EuropePMC error: ${res.status}`);
    const data = await res.json();
    const recs = (data.resultList?.result || []).map((r) => ({
      source: 'europepmc',
      id: r.id,
      title: r.title,
      journal: r.journalTitle,
      year: Number(r.pubYear) || undefined,
      doi: r.doi,
      url: r.doi ? `https://doi.org/${r.doi}` : (r.fullTextUrlList?.fullTextUrl?.[0]?.url || r.pageInfo || ''),
      authors: (r.authorString || '').split(',').map((s) => s.trim()).filter(Boolean),
      createdAt: new Date().toISOString()
    }));

    const blobs = createClient();
    const latest = await readLatest(blobs);
    const merged = mergeUnique(latest, recs);
    await blobs.setJSON(`${BLOB_BUCKET}/latest.json`, merged, { addRandomSuffix: false });
    return ok({ added: merged.length - latest.length, total: merged.length });
  } catch (e) {
    return err(e);
  }
}

async function readLatest(blobs) {
  try {
    const val = await blobs.get(`${BLOB_BUCKET}/latest.json`);
    if (!val) return [];
    const text = await val.text();
    return JSON.parse(text);
  } catch { return []; }
}

function mergeUnique(oldArr, newArr) {
  const seen = new Set(oldArr.map((r) => r.source + ':' + (r.doi || r.id)));
  const merged = [...oldArr];
  for (const r of newArr) {
    const key = r.source + ':' + (r.doi || r.id);
    if (!seen.has(key)) { seen.add(key); merged.push(r); }
  }
  return merged.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
}

function ok(body) { return { statusCode: 200, headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }; }
function err(e) { return { statusCode: 500, headers: { 'content-type': 'application/json' }, body: JSON.stringify({ error: e?.message || String(e) }) }; }

