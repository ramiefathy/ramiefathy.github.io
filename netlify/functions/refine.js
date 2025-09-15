import { GoogleGenerativeAI } from 'google-generativeai';

const MODEL = process.env.GEMINI_DEFAULT_MODEL || 'models/gemini-2.0-flash-exp';

export async function handler(event) {
  try {
    if (event.httpMethod !== 'POST') return resp(405, 'Method Not Allowed', 'text/plain');
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return resp(500, { error: 'Missing GEMINI_API_KEY' });
    const { note = '', analysis = '', instruction = '' } = event.body ? JSON.parse(event.body) : {};
    if (!instruction) return resp(400, { error: 'Missing instruction' });

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: MODEL });
    const prompt = `You will refine a dermatology clinical note and analysis. \n\nNOTE:\n${note}\n\nANALYSIS:\n${analysis}\n\nINSTRUCTION:\n${instruction}\n\nReturn strict JSON {"note": string, "analysis": string}.`;
    const result = await model.generateContent({ contents: [{ role: 'user', parts: [{ text: prompt }] }] });
    const text = result?.response?.text?.() || '';
    const obj = pickJson(text);
    if (!obj.note) throw new Error('Invalid model response');
    return resp(200, obj);
  } catch (e) {
    return resp(500, { error: e instanceof Error ? e.message : 'Unknown error' });
  }
}

function pickJson(s) {
  try { return JSON.parse(s); } catch {}
  const m = s.match(/\{[\s\S]*\}/);
  if (!m) return {};
  try { return JSON.parse(m[0]); } catch { return {}; }
}

function resp(statusCode, body, contentType = 'application/json') {
  return { statusCode, headers: { 'content-type': contentType }, body: contentType === 'application/json' ? JSON.stringify(body) : String(body) };
}

