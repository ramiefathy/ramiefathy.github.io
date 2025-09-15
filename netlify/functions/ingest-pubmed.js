// Scheduled Function: Harvest recent dermatology articles from PubMed E-utilities
// Stores normalized records in Netlify Blobs at research/latest.json
import { createClient } from '@netlify/blobs';

export const config = { schedule: '0 3 * * *' }; // 03:00 UTC daily

const USER_AGENT = 'ramiefathy.github.io/ingest-pubmed (contact: site owner)';
const BLOB_BUCKET = 'research';

export async function handler() {
  try {
    const sinceDays = 2; // small window to avoid duplicates
    const today = new Date();
    const since = new Date(today.getTime() - sinceDays * 24 * 60 * 60 * 1000);
    const mindate = since.toISOString().slice(0, 10);
    const maxdate = today.toISOString().slice(0, 10);
    const term = encodeURIComponent('dermatology[Journal] OR dermatology[Title/Abstract]');
    const esearch = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&retmode=json&retmax=100&term=${term}&mindate=${mindate}&maxdate=${maxdate}`;

    const sres = await fetch(esearch, { headers: { 'User-Agent': USER_AGENT } });
    if (!sres.ok) throw new Error(`PubMed esearch error: ${sres.status}`);
    const sid = await sres.json();
    const ids = sid?.esearchresult?.idlist || [];
    if (!ids.length) return ok({ message: 'No new PubMed IDs' });

    const idParam = ids.join(',');
    const esummary = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&retmode=json&id=${idParam}`;
    const eres = await fetch(esummary, { headers: { 'User-Agent': USER_AGENT } });
    if (!eres.ok) throw new Error(`PubMed esummary error: ${eres.status}`);
    const ej = await eres.json();

    const recs = Object.values(ej.result || {})
      .filter((r) => r?.uid)
      .map((r) => ({
        source: 'pubmed',
        id: r.uid,
        title: r.title,
        journal: r.fulljournalname || r.source,
        year: Number(r.pubdate?.slice(0, 4)) || undefined,
        doi: (r.articleids || []).find((a) => a.idtype === 'doi')?.value,
        url: r.elocationid?.includes('doi') && (r.articleids || []).find((a) => a.idtype === 'doi')?.value
          ? `https://doi.org/${(r.articleids || []).find((a) => a.idtype === 'doi')?.value}`
          : `https://pubmed.ncbi.nlm.nih.gov/${r.uid}/`,
        authors: (r.authors || []).map((a) => a.name).filter(Boolean),
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

