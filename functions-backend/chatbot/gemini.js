const { VertexAI } = require('@google-cloud/vertexai');
const { ACTIONS, INTENT_SCHEMAS } = require('./intents');
const { SYSTEM_PROMPT, ACTION_DESCRIPTIONS } = require('./prompts');

const PROJECT_ID = process.env.GCLOUD_PROJECT;
const LOCATION = process.env.GEMINI_LOCATION || 'us-central1';
const MODEL_NAME = process.env.GEMINI_MODEL || 'gemini-1.5-flash';

const vertexAI = new VertexAI({ project: PROJECT_ID, location: LOCATION });
const generativeModel = vertexAI.getGenerativeModel({
  model: MODEL_NAME,
  generationConfig: {
    temperature: 0.2,
    maxOutputTokens: 2048
  }
});

const pickPrimaryType = (type) => {
  if (Array.isArray(type)) {
    const nonNull = type.find(t => t !== 'null');
    return (nonNull || 'string').toUpperCase();
  }
  return (type || 'string').toUpperCase();
};

const toVertexSchema = (schema) => {
  const properties = {};
  if (schema.properties) {
    for (const [key, value] of Object.entries(schema.properties)) {
      properties[key] = {
        type: pickPrimaryType(value.type),
        description: value.description || undefined,
        enum: value.enum,
        items: value.items ? { type: pickPrimaryType(value.items.type) } : undefined,
        properties: value.properties ? toVertexSchema({ properties: value.properties }).properties : undefined
      };
    }
  }
  return {
    type: 'OBJECT',
    properties,
    required: schema.required || []
  };
};

const buildToolDeclarations = () => {
  return Object.entries(INTENT_SCHEMAS).map(([action, schema]) => ({
    name: action,
    description: ACTION_DESCRIPTIONS[action] || schema.description,
    parameters: toVertexSchema(schema)
  }));
};

const mapMessages = (history = [], latest) => {
  const contents = [];
  history.forEach(msg => {
    if (!msg || !msg.role || !msg.content) return;
    contents.push({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    });
  });
  if (latest) {
    contents.push({
      role: 'user',
      parts: [{ text: latest }]
    });
  }
  return contents;
};

async function callGemini({ history, message }) {
  const contents = mapMessages(history, message);
  const request = {
    contents,
    systemInstruction: {
      role: 'system',
      parts: [{ text: SYSTEM_PROMPT }]
    },
    tools: [{ functionDeclarations: buildToolDeclarations() }],
    safetySettings: []
  };

  const result = await generativeModel.generateContent(request);
  const candidate = result.response?.candidates?.[0];
  if (!candidate) {
    throw new Error('Gemini did not return a candidate response');
  }

  const parts = candidate.content?.parts || [];
  for (const part of parts) {
    if (part.functionCall) {
      const { name, args } = part.functionCall;
      let parsedArgs = {};
      if (typeof args === 'string' && args.trim()) {
        try {
          parsedArgs = JSON.parse(args);
        } catch (err) {
          throw new Error(`Failed to parse arguments for ${name}: ${err.message}`);
        }
      } else if (typeof args === 'object' && args !== null) {
        parsedArgs = args;
      }
      return { type: 'function', name, args: parsedArgs };
    }
    if (part.text) {
      return { type: 'text', text: part.text };
    }
  }

  const fallbackText =
    candidate.content?.parts
      ?.map(part => part.text)
      .filter(Boolean)
      .join('\n') || 'I was unable to process that request.';

  return { type: 'text', text: fallbackText };
}

module.exports = {
  callGemini,
  ACTIONS
};
