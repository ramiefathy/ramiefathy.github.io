export const DATA_URL = '/data/dermoscopy-llm-eval.json';

export const PROVIDER_COLORS = {
  openai: {
    name: 'OpenAI',
    primary: '#2563eb',
    surface: 'rgba(37, 99, 235, 0.12)',
    border: 'rgba(37, 99, 235, 0.25)'
  },
  gemini: {
    name: 'Gemini',
    primary: '#0f766e',
    surface: 'rgba(15, 118, 110, 0.12)',
    border: 'rgba(15, 118, 110, 0.25)'
  }
};

export const ARM_NAMES = {
  1: 'Zero-shot (label list)',
  2: 'Few-shot (exemplars)',
  3: 'Primer board',
  4: 'Anti-anchoring',
  5: 'Zero-shot (free-form)',
  6: 'Few-shot (free-form)'
};

export const ARM_KEYS = [1, 2, 3, 4, 5, 6];

export const DIAG_KEYS = [
  'basal_cell_carcinoma',
  'melanoma',
  'squamous_cell_carcinoma',
  'seborrheic_keratosis',
  'melanocytic_nevus',
  'dermatofibroma',
  'verruca_vulgaris',
  'lichen_planus'
];

export const DIAG_LABELS = {
  basal_cell_carcinoma: 'BCC',
  melanoma: 'Melanoma',
  squamous_cell_carcinoma: 'SCC',
  seborrheic_keratosis: 'Seb. Keratosis',
  melanocytic_nevus: 'Nevus',
  dermatofibroma: 'Dermatofibroma',
  verruca_vulgaris: 'Verruca',
  lichen_planus: 'Lichen Planus',
  'basal cell carcinoma': 'BCC',
  'squamous cell carcinoma': 'SCC',
  'seborrheic keratosis': 'Seb. Keratosis',
  'melanocytic nevus': 'Nevus',
  'verruca vulgaris': 'Verruca',
  'lichen planus': 'Lichen Planus'
};

export const MODEL_SHORT_NAMES = {
  'gemini-3-pro-preview-low-thinking-media-high': 'G3P-LT-HiMed',
  'gemini-3-pro-preview-high-thinking-media-high': 'G3P-HT-HiMed',
  'gemini-3-pro-preview-high-thinking': 'G3P-HT',
  'gemini-3-pro-preview-low-thinking': 'G3P-LT',
  'gemini-3-pro-image-preview': 'G3P-Img',
  'gemini-2.5-pro': 'Gemini 2.5 Pro',
  'gemini-2.5-flash': 'Gemini 2.5 Flash',
  'gemini-2.5-flash-lite': 'Gemini 2.5 Flash-Lite',
  'gemini-2.0-flash': 'Gemini 2.0 Flash',
  'gemini-2.0-flash-lite': 'Gemini 2.0 Flash-Lite',
  'gpt-5': 'GPT-5',
  'gpt-5-mini': 'GPT-5 Mini',
  'gpt-5-nano': 'GPT-5 Nano',
  'gpt-4o': 'GPT-4o',
  'gpt-4.1': 'GPT-4.1 (Preview)',
  o3: 'o3',
  'o4-mini-2025-04-16': 'o4-mini'
};

export const ERROR_TYPE_META = {
  correct: {
    label: 'Correct',
    color: 'rgba(15,118,110,0.92)'
  },
  within_malignant: {
    label: 'Within malignant',
    color: 'rgba(245,158,11,0.92)'
  },
  malignant_to_benign: {
    label: 'False negative',
    color: 'rgba(220,38,38,0.92)'
  },
  benign_to_malignant: {
    label: 'False positive',
    color: 'rgba(14,165,233,0.92)'
  },
  within_benign: {
    label: 'Within benign',
    color: 'rgba(37,99,235,0.92)'
  },
  pred_other: {
    label: 'Non-diagnostic',
    color: 'rgba(100,116,139,0.92)'
  }
};

