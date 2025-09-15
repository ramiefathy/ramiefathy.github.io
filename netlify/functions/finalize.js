// Netlify Function (v1): finalize clinical note from transcript using Gemini
// Requires env: GEMINI_API_KEY, optional GEMINI_DEFAULT_MODEL
import { GoogleGenerativeAI } from 'google-generativeai';

const MODEL = process.env.GEMINI_DEFAULT_MODEL || 'models/gemini-2.0-flash-exp';

export async function handler(event) {
  try {
    if (event.httpMethod !== 'POST') return resp(405, 'Method Not Allowed', 'text/plain');
    const body = event.body ? JSON.parse(event.body) : {};
    const { transcript } = body;
    if (!transcript || typeof transcript !== 'string' || !transcript.trim()) {
      return resp(400, { error: 'Missing transcript' });
    }
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return resp(500, { error: 'Missing GEMINI_API_KEY' });

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: MODEL });

    const prompt = `You are a clinical documentation assistant for dermatology.
Transcript (verbatim):\n\n${transcript}\n\n
Return a strict JSON object with fields:\n{"note": string, "analysis": string}.\n
Guidelines for note:\n- First-person clinician tone.\n- Sections: HPI, Exam, Assessment, Plan.\n- Be concise and factual; no hallucinations.\n- If info is missing, omit rather than invent.\n
Guidelines for analysis:\n- Key differentials and reasoning.\n- Red flags, suggested questions/exam points.\n- Keep under 200 words.`;

    const result = await model.generateContent({ contents: [{ role: 'user', parts: [{ text: prompt }] }] });
    const text = result?.response?.text?.() || '';
    let json;
    try { json = JSON.parse(text); }
    catch {
      const match = text.match(/\{[\s\S]*\}/);
      if (!match) throw new Error('Model did not return JSON');
      json = JSON.parse(match[0]);
    }
    if (typeof json !== 'object' || !json.note) throw new Error('Invalid model response');
    return resp(200, { note: json.note, analysis: json.analysis || '' });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return resp(500, { error: message });
  }
}

function resp(statusCode, body, contentType = 'application/json') {
  return {
    statusCode,
    headers: { 'content-type': contentType },
    body: contentType === 'application/json' ? JSON.stringify(body) : String(body)
  };
}
