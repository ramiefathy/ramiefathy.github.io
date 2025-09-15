// Server-Sent Events for short, actionable suggestions based on transcript
import { GoogleGenerativeAI } from 'google-generativeai';

const MODEL = process.env.GEMINI_SUGGESTION_MODEL || process.env.GEMINI_DEFAULT_MODEL || 'models/gemini-2.0-flash-exp';

export async function handler(event) {
  try {
    if (event.httpMethod !== 'GET') return sse(405, 'event: error\ndata: Method Not Allowed\n\n');
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return sse(500, 'event: error\ndata: Missing GEMINI_API_KEY\n\n');
    const qs = event.queryStringParameters || {};
    const transcript = (qs.transcript || '').toString();
    if (!transcript.trim()) return sse(400, 'event: error\ndata: Missing transcript\n\n');

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: MODEL });
    const prompt = `Provide 2 concise, actionable physician prompts (one per line) based strictly on this dermatology consultation transcript. No preamble, no numbering, <= 18 words each.\n\n${transcript}`;
    const result = await model.generateContent({ contents: [{ role: 'user', parts: [{ text: prompt }] }] });
    const text = result?.response?.text?.() || '';
    const lines = text
      .split(/\r?\n/) 
      .map((s) => s.replace(/^[-*\d.\s]+/, '').trim())
      .filter(Boolean)
      .slice(0, 3);

    let body = '';
    for (const line of lines) body += `data: ${escapeForSSE(line)}\n\n`;
    body += 'event: end\ndata: done\n\n';
    return sse(200, body);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return sse(500, `event: error\ndata: ${escapeForSSE(msg)}\n\n`);
  }
}

function sse(statusCode, body) {
  return {
    statusCode,
    headers: {
      'content-type': 'text/event-stream',
      'cache-control': 'no-cache, no-transform',
      connection: 'keep-alive'
    },
    body
  };
}

function escapeForSSE(s) {
  return s.replace(/\r?\n/g, ' ').replace(/\u0000/g, '');
}

