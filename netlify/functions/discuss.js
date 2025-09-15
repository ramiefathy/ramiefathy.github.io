import { GoogleGenerativeAI } from 'google-generativeai';

const MODEL = process.env.GEMINI_DEFAULT_MODEL || 'models/gemini-2.0-flash-exp';

export async function handler(event) {
  try {
    if (event.httpMethod !== 'POST') return resp(405, 'Method Not Allowed', 'text/plain');
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return resp(500, { error: 'Missing GEMINI_API_KEY' });
    const { transcript = '', question = '', note = '', analysis = '' } = event.body ? JSON.parse(event.body) : {};
    if (!question) return resp(400, { error: 'Missing question' });

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: MODEL });
    const prompt = `You are assisting a dermatologist. Provide a concise answer (<=120 words).\n\nTRANSCRIPT:\n${transcript}\n\nCURRENT NOTE:\n${note}\n\nCURRENT ANALYSIS:\n${analysis}\n\nPHYSICIAN QUESTION:\n${question}`;
    const result = await model.generateContent({ contents: [{ role: 'user', parts: [{ text: prompt }] }] });
    const text = result?.response?.text?.() || '';
    return resp(200, { answer: text.trim() });
  } catch (e) {
    return resp(500, { error: e instanceof Error ? e.message : 'Unknown error' });
  }
}

function resp(statusCode, body, contentType = 'application/json') {
  return { statusCode, headers: { 'content-type': contentType }, body: contentType === 'application/json' ? JSON.stringify(body) : String(body) };
}

