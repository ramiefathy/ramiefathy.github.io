import { DiseaseId } from './types';

export interface ModelParameterOverrides {
  // Structural parameters
  epidermisThicknessFactor?: number;
  stratumCorneumFlakeDensityFactor?: number;
  keratinocyteSizeFactor?: number;
  dermalCollagenDensityFactor?: number;
  dermalThicknessFactor?: number;
  hypodermisThicknessFactor?: number;

  // Pigmentation and melanocyte parameters
  pigmentationFactor?: number;
  melanocyteDensityFactor?: number;
  melaninDistribution?: 'normal' | 'patchy' | 'absent' | 'irregular';

  // Vascular parameters
  vascularDilationFactor?: number;
  vascularDensityFactor?: number;
  erythemaIntensity?: number;

  // Inflammatory parameters
  inflammationClusterDensity?: number;
  mastCellDegranulationFactor?: number;
  edemaFactor?: number;

  // Neoplastic parameters (for tumors)
  tumorPresent?: boolean;
  tumorDepth?: 'superficial' | 'invasive' | 'deep';
  tumorMorphology?: 'nodular' | 'diffuse' | 'ulcerated';
  atypicalCellDensity?: number;
}

export interface DiseaseProfile {
  id: DiseaseId;
  label: string;
  description: string;
  category: 'inflammatory' | 'neoplastic' | 'pigmentary' | 'allergic' | 'aging' | 'normal';
  icdCode?: string;
  parameterOverrides: ModelParameterOverrides;
  clinicalFeatures?: string[];
  affectedStructures?: string[];
}

export const DISEASE_PROFILES: DiseaseProfile[] = [
  // ============================================================================
  // NORMAL
  // ============================================================================
  {
    id: 'normal',
    label: 'Normal skin',
    description: 'Baseline healthy skin without major inflammatory or structural changes.',
    category: 'normal',
    parameterOverrides: {},
    affectedStructures: []
  },

  // ============================================================================
  // INFLAMMATORY CONDITIONS
  // ============================================================================
  {
    id: 'psoriasis',
    label: 'Psoriasis',
    description: 'Chronic autoimmune condition with epidermal hyperplasia, accelerated keratinocyte turnover (3-5 days vs 28 days), and neutrophilic inflammation. Characterized by well-demarcated erythematous plaques with silvery scale.',
    category: 'inflammatory',
    icdCode: 'L40.0',
    parameterOverrides: {
      epidermisThicknessFactor: 1.8,
      stratumCorneumFlakeDensityFactor: 2.0,
      keratinocyteSizeFactor: 1.1,
      dermalCollagenDensityFactor: 0.9,
      inflammationClusterDensity: 1.5,
      vascularDilationFactor: 1.4,
      erythemaIntensity: 1.3
    },
    clinicalFeatures: ['Silvery scale', 'Auspitz sign', 'Koebner phenomenon', 'Nail pitting'],
    affectedStructures: ['epidermis', 'keratinocytes', 'stratum_corneum', 'blood_vessels']
  },
  {
    id: 'eczema',
    label: 'Atopic Dermatitis',
    description: 'Chronic inflammatory skin disease with impaired epidermal barrier function due to filaggrin deficiency. Features spongiotic dermatitis with intense pruritus and characteristic distribution patterns.',
    category: 'inflammatory',
    icdCode: 'L20.9',
    parameterOverrides: {
      epidermisThicknessFactor: 1.3,
      stratumCorneumFlakeDensityFactor: 1.3,
      keratinocyteSizeFactor: 0.95,
      inflammationClusterDensity: 1.8,
      edemaFactor: 1.4,
      mastCellDegranulationFactor: 1.5
    },
    clinicalFeatures: ['Pruritus', 'Xerosis', 'Lichenification', 'Flexural distribution'],
    affectedStructures: ['epidermis', 'stratum_corneum', 'dermis', 'nerves']
  },
  {
    id: 'acne',
    label: 'Acne Vulgaris',
    description: 'Chronic inflammatory disease of the pilosebaceous unit involving follicular hyperkeratinization, sebaceous hyperplasia, Cutibacterium acnes colonization, and inflammation.',
    category: 'inflammatory',
    icdCode: 'L70.0',
    parameterOverrides: {
      epidermisThicknessFactor: 1.15,
      stratumCorneumFlakeDensityFactor: 1.4,
      keratinocyteSizeFactor: 1.05,
      inflammationClusterDensity: 2.0,
      vascularDilationFactor: 1.2
    },
    clinicalFeatures: ['Comedones', 'Papules', 'Pustules', 'Nodules', 'Scarring'],
    affectedStructures: ['hair_follicle', 'epidermis', 'dermis']
  },
  {
    id: 'rosacea',
    label: 'Rosacea',
    description: 'Chronic neurovascular disorder with centrofacial erythema, telangiectasias, and flushing. May progress to papulopustular or phymatous subtypes.',
    category: 'inflammatory',
    icdCode: 'L71.9',
    parameterOverrides: {
      epidermisThicknessFactor: 0.95,
      dermalCollagenDensityFactor: 0.85,
      inflammationClusterDensity: 1.3,
      vascularDilationFactor: 1.8,
      vascularDensityFactor: 1.3,
      erythemaIntensity: 1.6
    },
    clinicalFeatures: ['Flushing', 'Telangiectasia', 'Centrofacial erythema', 'Papules/pustules'],
    affectedStructures: ['blood_vessels', 'dermis', 'nerves']
  },

  // ============================================================================
  // ALLERGIC/HYPERSENSITIVITY CONDITIONS
  // ============================================================================
  {
    id: 'urticaria',
    label: 'Urticaria (Hives)',
    description: 'IgE-mediated mast cell degranulation causing dermal edema and wheals. Characterized by transient, pruritic, erythematous plaques that resolve within 24 hours.',
    category: 'allergic',
    icdCode: 'L50.9',
    parameterOverrides: {
      epidermisThicknessFactor: 1.0,
      dermalThicknessFactor: 1.3,
      edemaFactor: 2.0,
      mastCellDegranulationFactor: 2.5,
      vascularDilationFactor: 1.6,
      erythemaIntensity: 1.5,
      inflammationClusterDensity: 0.8
    },
    clinicalFeatures: ['Wheals', 'Pruritus', 'Dermal edema', 'Transient lesions (<24h)'],
    affectedStructures: ['dermis', 'blood_vessels']
  },
  {
    id: 'contact_dermatitis',
    label: 'Contact Dermatitis',
    description: 'Inflammatory reaction to external allergen (allergic) or irritant (irritant). Type IV hypersensitivity with spongiotic dermatitis, vesicles, and eczematous changes at contact sites.',
    category: 'allergic',
    icdCode: 'L25.9',
    parameterOverrides: {
      epidermisThicknessFactor: 1.25,
      stratumCorneumFlakeDensityFactor: 1.2,
      inflammationClusterDensity: 2.2,
      edemaFactor: 1.6,
      mastCellDegranulationFactor: 1.3,
      vascularDilationFactor: 1.3,
      erythemaIntensity: 1.4
    },
    clinicalFeatures: ['Eczematous patches', 'Geometric distribution', 'Vesicles', 'Pruritus'],
    affectedStructures: ['epidermis', 'dermis', 'stratum_corneum']
  },

  // ============================================================================
  // PIGMENTARY DISORDERS
  // ============================================================================
  {
    id: 'vitiligo',
    label: 'Vitiligo',
    description: 'Autoimmune destruction of melanocytes causing depigmented patches. T-cell mediated attack on melanocytes results in progressive loss of pigmentation.',
    category: 'pigmentary',
    icdCode: 'L80',
    parameterOverrides: {
      epidermisThicknessFactor: 1.0,
      pigmentationFactor: 0.1,
      melanocyteDensityFactor: 0.05,
      melaninDistribution: 'absent',
      inflammationClusterDensity: 0.5
    },
    clinicalFeatures: ['Depigmented macules/patches', 'Well-demarcated borders', 'Wood\'s lamp accentuation', 'Koebner phenomenon'],
    affectedStructures: ['epidermis']
  },

  // ============================================================================
  // NEOPLASTIC CONDITIONS
  // ============================================================================
  {
    id: 'melanoma',
    label: 'Melanoma',
    description: 'Malignant neoplasm of melanocytes. Most dangerous skin cancer with potential for metastasis. Features asymmetry, border irregularity, color variation, and diameter >6mm (ABCDE criteria).',
    category: 'neoplastic',
    icdCode: 'C43.9',
    parameterOverrides: {
      epidermisThicknessFactor: 1.3,
      pigmentationFactor: 1.8,
      melanocyteDensityFactor: 3.0,
      melaninDistribution: 'irregular',
      dermalCollagenDensityFactor: 0.7,
      atypicalCellDensity: 2.5,
      tumorPresent: true,
      tumorDepth: 'invasive',
      tumorMorphology: 'diffuse',
      vascularDensityFactor: 1.4
    },
    clinicalFeatures: ['Asymmetry', 'Border irregularity', 'Color variation', 'Diameter >6mm', 'Evolution'],
    affectedStructures: ['epidermis', 'dermis', 'hypodermis']
  },
  {
    id: 'bcc',
    label: 'Basal Cell Carcinoma',
    description: 'Most common skin cancer arising from basal keratinocytes. Slow-growing, locally invasive but rarely metastasizes. Classic pearly papule with telangiectasias and rolled borders.',
    category: 'neoplastic',
    icdCode: 'C44.91',
    parameterOverrides: {
      epidermisThicknessFactor: 1.4,
      keratinocyteSizeFactor: 1.2,
      dermalCollagenDensityFactor: 0.75,
      atypicalCellDensity: 1.8,
      tumorPresent: true,
      tumorDepth: 'superficial',
      tumorMorphology: 'nodular',
      vascularDensityFactor: 1.5,
      vascularDilationFactor: 1.3
    },
    clinicalFeatures: ['Pearly papule', 'Telangiectasias', 'Rolled borders', 'Central ulceration'],
    affectedStructures: ['epidermis', 'dermis', 'keratinocytes']
  },

  // ============================================================================
  // AGING
  // ============================================================================
  {
    id: 'photoaging',
    label: 'Photoaging',
    description: 'Chronic UV damage causing solar elastosis, collagen degradation by MMP upregulation, and epidermal changes. Manifests as wrinkles, dyspigmentation, and leathery texture.',
    category: 'aging',
    icdCode: 'L57.8',
    parameterOverrides: {
      epidermisThicknessFactor: 0.85,
      dermalCollagenDensityFactor: 0.6,
      dermalThicknessFactor: 0.8,
      pigmentationFactor: 1.2,
      melaninDistribution: 'patchy',
      vascularDilationFactor: 1.1
    },
    clinicalFeatures: ['Wrinkles', 'Solar lentigines', 'Telangiectasias', 'Leathery texture', 'Actinic keratoses'],
    affectedStructures: ['collagen', 'dermis', 'epidermis']
  }
];

// Helper functions
export function getDiseaseById(id: DiseaseId): DiseaseProfile | undefined {
  return DISEASE_PROFILES.find(p => p.id === id);
}

export function getDiseasesByCategory(category: DiseaseProfile['category']): DiseaseProfile[] {
  return DISEASE_PROFILES.filter(p => p.category === category);
}

export function getDiseasesAffectingStructure(structureId: string): DiseaseProfile[] {
  return DISEASE_PROFILES.filter(p => p.affectedStructures?.includes(structureId));
}
