// Analyze dermatology image with Gemini vision prompt
import { GoogleGenerativeAI } from 'google-generativeai';

const MODEL = process.env.GEMINI_VISION_MODEL || 'models/gemini-2.0-flash-exp';

export async function handler(event) {
  try {
    if (event.httpMethod !== 'POST') return resp(405, 'Method Not Allowed', 'text/plain');
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return resp(500, { error: 'Missing GEMINI_API_KEY' });
    const body = event.body ? JSON.parse(event.body) : {};
    const { imageBase64, mimeType = 'image/png' } = body;
    if (!imageBase64) return resp(400, { error: 'Missing imageBase64' });

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: MODEL });
    const prompt = 'Provide a concise dermatology image description (morphology, distribution). Avoid diagnosis.';
    const result = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
            { inlineData: { mimeType, data: imageBase64 } }
          ]
        }
      ]
    });
    const text = result?.response?.text?.() || '';
    return resp(200, { description: text.trim() });
  } catch (e) {
    return resp(500, { error: e instanceof Error ? e.message : 'Unknown error' });
  }
}

function resp(statusCode, body, contentType = 'application/json') {
  return {
    statusCode,
    headers: { 'content-type': contentType },
    body: contentType === 'application/json' ? JSON.stringify(body) : String(body)
  };
}

