// Returns the latest harvested research list from Netlify Blobs
import { createClient } from '@netlify/blobs';

export async function handler() {
  try {
    const blobs = createClient();
    const val = await blobs.get('research/latest.json');
    if (!val) return ok({ items: [] });
    const text = await val.text();
    const items = JSON.parse(text);
    return ok({ items });
  } catch (e) {
    return err(e);
  }
}

function ok(body) { return { statusCode: 200, headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }; }
function err(e) { return { statusCode: 500, headers: { 'content-type': 'application/json' }, body: JSON.stringify({ error: e?.message || String(e) }) }; }

