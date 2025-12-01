/**
 * Educational Content for DermoViz 3D
 * USMLE-aligned learning objectives, clinical correlations, and board-style content
 */

import { DiseaseId, LangCode, LocalizedString } from './types';

// USMLE Step Classification
export type USMLEStep = 1 | 2 | 3;

// Content Categories
export type ContentCategory =
  | 'anatomy'
  | 'physiology'
  | 'pathology'
  | 'pharmacology'
  | 'microbiology'
  | 'histology';

// Difficulty Levels for Quiz
export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced' | 'board_prep';

// Quiz Question Types
export type QuizQuestionType =
  | 'structure_identification'    // Click on named structure
  | 'clinical_correlation'        // Match presentation to pathology
  | 'board_style'                 // USMLE vignette format
  | 'pathology_recognition';      // Identify disease from model

/**
 * USMLE Learning Objective
 */
export interface USMLEObjective {
  step: USMLEStep;
  category: ContentCategory;
  topic: string;
  objective: string;
  keyPoints: string[];
  highYieldFacts: string[];
}

/**
 * Clinical Correlation for a structure or disease
 */
export interface ClinicalCorrelation {
  id: string;
  structureId?: string;
  diseaseId?: DiseaseId;
  question: string;
  answer: string;
  pathophysiology: string;
  clinicalImplication: string;
  relatedStructures?: string[];
}

/**
 * Histology Reference Image
 */
export interface HistologyReference {
  id: string;
  structureId?: string;
  diseaseId?: DiseaseId;
  imagePath: string;
  thumbnailPath?: string;
  title: string;
  stain: string;  // 'H&E', 'PAS', 'Fontana-Masson', etc.
  magnification: string;  // '4x', '10x', '40x', '100x'
  description: string;
  keyFeatures: string[];
  annotations: HistologyAnnotation[];
}

export interface HistologyAnnotation {
  id: string;
  x: number;  // Percentage 0-100
  y: number;  // Percentage 0-100
  label: string;
  description: string;
  modelStructureId?: string;  // Link to 3D model structure
}

/**
 * Board-Style Quiz Question
 */
export interface BoardStyleQuestion {
  id: string;
  type: QuizQuestionType;
  difficulty: DifficultyLevel;
  stem: string;
  leadIn: string;
  options: QuizOption[];
  correctAnswer: string;
  explanation: string;
  educationalObjective: string;
  topic: string;
  relatedStructureIds?: string[];
  relatedDiseaseId?: DiseaseId;
  timeLimit?: number;  // Seconds
}

export interface QuizOption {
  letter: string;  // A, B, C, D, E
  text: string;
  isCorrect: boolean;
  feedback: string;  // Shown when selected
}

/**
 * Complete educational content for a structure
 */
export interface StructureEducationalContent {
  structureId: string;
  usmleObjectives: USMLEObjective[];
  clinicalPearls: string[];
  boardStyleQuestions: BoardStyleQuestion[];
  histologyReferences?: HistologyReference[];
  differentialDiagnosis?: string[];
}

// ============================================================================
// STRUCTURE EDUCATIONAL CONTENT
// ============================================================================

export const STRUCTURE_EDUCATIONAL_CONTENT: Record<string, StructureEducationalContent> = {
  // ---------------------------------------------------------------------------
  // EPIDERMIS
  // ---------------------------------------------------------------------------
  epidermis: {
    structureId: 'epidermis',
    usmleObjectives: [
      {
        step: 1,
        category: 'anatomy',
        topic: 'Epidermal Structure',
        objective: 'Describe the layers of the epidermis and their functions',
        keyPoints: [
          'Stratified squamous keratinizing epithelium',
          '5 layers: basale, spinosum, granulosum, lucidum (thick skin only), corneum',
          'Avascular - relies on diffusion from dermis',
          'Renews every 28-30 days through keratinocyte differentiation'
        ],
        highYieldFacts: [
          'Stem cells reside in stratum basale',
          'Desmosomes connect keratinocytes (target in pemphigus)',
          'Hemidesmosomes anchor basal cells to basement membrane (target in bullous pemphigoid)'
        ]
      },
      {
        step: 1,
        category: 'physiology',
        topic: 'Epidermal Barrier Function',
        objective: 'Explain the mechanisms of epidermal barrier function',
        keyPoints: [
          'Stratum corneum provides primary barrier',
          'Lipid bilayers between corneocytes prevent water loss',
          'Ceramides, cholesterol, and fatty acids form barrier lipids',
          'Filaggrin aggregates keratin filaments'
        ],
        highYieldFacts: [
          'Filaggrin mutations cause ichthyosis vulgaris and predispose to atopic dermatitis',
          'Transepidermal water loss (TEWL) indicates barrier damage'
        ]
      },
      {
        step: 2,
        category: 'pathology',
        topic: 'Epidermal Disorders',
        objective: 'Recognize and diagnose common epidermal pathologies',
        keyPoints: [
          'Psoriasis: accelerated turnover, Munro microabscesses',
          'Eczema: spongiosis, barrier dysfunction',
          'SCC: keratinocyte malignancy with keratin pearls',
          'Blistering diseases: level of split determines diagnosis'
        ],
        highYieldFacts: [
          'Intraepidermal split = pemphigus; subepidermal = bullous pemphigoid',
          'Nikolsky sign positive in pemphigus, negative in pemphigoid',
          'Actinic keratosis is precursor to SCC'
        ]
      },
      {
        step: 3,
        category: 'pharmacology',
        topic: 'Epidermal Therapeutics',
        objective: 'Apply pharmacologic principles to epidermal diseases',
        keyPoints: [
          'Topical steroids: anti-inflammatory, reduce turnover',
          'Retinoids: normalize keratinization, induce apoptosis',
          'Calcineurin inhibitors: spare atrophy vs steroids',
          'Biologics for psoriasis: anti-IL-17, anti-IL-23, anti-TNF'
        ],
        highYieldFacts: [
          'Potent steroids on face/folds cause atrophy, striae',
          'Dupilumab (anti-IL-4R) for moderate-severe atopic dermatitis',
          '5-FU topical for actinic keratoses targets rapidly dividing cells'
        ]
      }
    ],
    clinicalPearls: [
      'Epidermal thickness varies by body site: palms/soles are thickest',
      'Psoriasis shows accelerated epidermal turnover (3-5 days vs 28 days)',
      'UV damage primarily affects basal layer stem cells'
    ],
    boardStyleQuestions: []
  },

  // ---------------------------------------------------------------------------
  // DERMIS
  // ---------------------------------------------------------------------------
  dermis: {
    structureId: 'dermis',
    usmleObjectives: [
      {
        step: 1,
        category: 'anatomy',
        topic: 'Dermal Structure',
        objective: 'Describe the organization and components of the dermis',
        keyPoints: [
          'Papillary dermis: loose connective tissue, contains capillaries',
          'Reticular dermis: dense irregular connective tissue, contains larger vessels',
          'Primarily composed of type I collagen (80-85%)',
          'Also contains type III collagen, elastic fibers, ground substance'
        ],
        highYieldFacts: [
          'Dermal-epidermal junction flattens with age',
          'Collagen synthesis decreases ~1% per year after age 30',
          'Solar elastosis = elastin degeneration from UV damage'
        ]
      },
      {
        step: 1,
        category: 'physiology',
        topic: 'Dermal Functions',
        objective: 'Explain the mechanical and sensory functions of the dermis',
        keyPoints: [
          'Provides structural support and elasticity',
          'Contains sensory nerve endings and receptors',
          'Houses blood vessels for temperature regulation',
          'Contains immune cells (mast cells, macrophages, lymphocytes)'
        ],
        highYieldFacts: [
          'Mast cells release histamine in urticaria',
          'Dermal fibroblasts produce collagen and elastin',
          'Wound healing requires fibroblast migration and collagen deposition'
        ]
      },
      {
        step: 2,
        category: 'pathology',
        topic: 'Dermal Pathology',
        objective: 'Recognize dermal changes in connective tissue diseases',
        keyPoints: [
          'Scleroderma: dermal fibrosis, loss of appendages',
          'Morphea: localized scleroderma variant',
          'Dermatomyositis: interface dermatitis with dermal mucin',
          'Granuloma annulare: palisading granulomas in dermis'
        ],
        highYieldFacts: [
          'Scl-70 antibody associated with diffuse scleroderma',
          'Anti-centromere antibody in limited scleroderma (CREST)',
          'Dermal elastosis in pseudoxanthoma elasticum (PXE)'
        ]
      },
      {
        step: 3,
        category: 'pharmacology',
        topic: 'Dermal Therapeutics',
        objective: 'Apply treatments targeting dermal pathology',
        keyPoints: [
          'Intralesional steroids for keloids, hypertrophic scars',
          'Collagenase injections for Dupuytren contracture',
          'Immunosuppressants for scleroderma (methotrexate, MMF)',
          'Fillers and lasers for dermal rejuvenation'
        ],
        highYieldFacts: [
          'Triamcinolone intralesional dose: 10-40 mg/mL for keloids',
          'Nintedanib/pirfenidone: antifibrotic agents (used in IPF, studied in scleroderma)',
          'Fractional CO2 laser stimulates dermal collagen remodeling'
        ]
      }
    ],
    clinicalPearls: [
      'Dermis is 10-40x thicker than epidermis depending on location',
      'Scleroderma involves excessive collagen deposition in dermis',
      'Ehlers-Danlos syndrome results from defective collagen synthesis'
    ],
    boardStyleQuestions: []
  },

  // ---------------------------------------------------------------------------
  // HYPODERMIS
  // ---------------------------------------------------------------------------
  hypodermis: {
    structureId: 'hypodermis',
    usmleObjectives: [
      {
        step: 1,
        category: 'anatomy',
        topic: 'Subcutaneous Tissue',
        objective: 'Describe the structure and composition of the hypodermis',
        keyPoints: [
          'Also called subcutis or subcutaneous fat',
          'Composed of adipocytes organized into lobules',
          'Separated by fibrous septa containing vessels and nerves',
          'Thickness varies greatly by body site and individual'
        ],
        highYieldFacts: [
          'Primary site for subcutaneous drug injection',
          'Contains deep vascular plexus',
          'Panniculitis = inflammation of subcutaneous fat'
        ]
      },
      {
        step: 2,
        category: 'pathology',
        topic: 'Panniculitis',
        objective: 'Diagnose and classify panniculitis disorders',
        keyPoints: [
          'Septal panniculitis: erythema nodosum (most common)',
          'Lobular panniculitis: erythema induratum, pancreatic fat necrosis',
          'Mixed: lupus panniculitis, alpha-1 antitrypsin deficiency',
          'Cold panniculitis: popsicle panniculitis in children'
        ],
        highYieldFacts: [
          'Erythema nodosum: painful nodules on shins, self-limited',
          'EN triggers: strep, sarcoidosis, IBD, drugs, pregnancy',
          'Lipodermatosclerosis: chronic venous insufficiency changes'
        ]
      },
      {
        step: 3,
        category: 'pharmacology',
        topic: 'Subcutaneous Drug Delivery',
        objective: 'Understand subcutaneous injection pharmacokinetics',
        keyPoints: [
          'Slower absorption than IM, faster than transdermal',
          'Depot injections: sustained release over time',
          'Biologics often administered SC (adalimumab, dupilumab)',
          'Lipoatrophy/lipohypertrophy: injection site reactions'
        ],
        highYieldFacts: [
          'Insulin injection sites: rotate to prevent lipohypertrophy',
          'SC methotrexate: better bioavailability than oral at higher doses',
          'Epinephrine auto-injector: anterolateral thigh preferred site'
        ]
      }
    ],
    clinicalPearls: [
      'Subcutaneous fat provides thermal insulation and mechanical cushioning',
      'Lipodystrophy syndromes involve abnormal fat distribution',
      'Erythema nodosum presents as tender subcutaneous nodules'
    ],
    boardStyleQuestions: []
  },

  // ---------------------------------------------------------------------------
  // STRATUM CORNEUM
  // ---------------------------------------------------------------------------
  stratum_corneum: {
    structureId: 'stratum_corneum',
    usmleObjectives: [
      {
        step: 1,
        category: 'anatomy',
        topic: 'Stratum Corneum',
        objective: 'Describe the structure and function of the stratum corneum',
        keyPoints: [
          'Outermost layer - dead, anucleate cells (corneocytes)',
          '15-20 cell layers thick (varies by site)',
          'Corneocytes surrounded by lipid bilayers',
          'Brick and mortar model: cells = bricks, lipids = mortar'
        ],
        highYieldFacts: [
          'Parakeratosis = retained nuclei in stratum corneum (seen in psoriasis)',
          'Hyperkeratosis = thickening of stratum corneum',
          'Natural moisturizing factors (NMF) maintain hydration'
        ]
      },
      {
        step: 2,
        category: 'pathology',
        topic: 'Stratum Corneum Disorders',
        objective: 'Diagnose disorders of keratinization',
        keyPoints: [
          'Ichthyosis: scaling from abnormal desquamation',
          'Ichthyosis vulgaris: filaggrin mutation, fine scales',
          'X-linked ichthyosis: steroid sulfatase deficiency',
          'Lamellar ichthyosis: collodion baby, severe scaling'
        ],
        highYieldFacts: [
          'Ichthyosis vulgaris associated with atopic dermatitis',
          'X-linked ichthyosis: corneal opacities, cryptorchidism',
          'Harlequin ichthyosis: ABCA12 mutation, often fatal'
        ]
      },
      {
        step: 3,
        category: 'pharmacology',
        topic: 'Topical Drug Penetration',
        objective: 'Optimize topical drug delivery through stratum corneum',
        keyPoints: [
          'Occlusion enhances penetration (hydrates SC)',
          'Keratolytics: salicylic acid, urea, lactic acid',
          'Vehicle selection affects drug delivery',
          'Penetration enhancers: DMSO, propylene glycol'
        ],
        highYieldFacts: [
          'Ointments > creams > lotions for drug penetration',
          'Salicylic acid: keratolytic, comedolytic (acne, warts)',
          'Ammonium lactate 12%: for ichthyosis and xerosis'
        ]
      }
    ],
    clinicalPearls: [
      'Most topical medications must penetrate stratum corneum',
      'Occlusion increases drug penetration by hydrating stratum corneum',
      'Desquamation abnormalities cause scaling disorders'
    ],
    boardStyleQuestions: []
  },

  // ---------------------------------------------------------------------------
  // KERATINOCYTES
  // ---------------------------------------------------------------------------
  keratinocytes: {
    structureId: 'keratinocytes',
    usmleObjectives: [
      {
        step: 1,
        category: 'anatomy',
        topic: 'Keratinocyte Biology',
        objective: 'Describe keratinocyte differentiation and keratinization',
        keyPoints: [
          'Primary cell type of epidermis (90%)',
          'Originate from stem cells in stratum basale',
          'Differentiate as they move toward surface',
          'Produce keratins (intermediate filaments) and lipids'
        ],
        highYieldFacts: [
          'K5/K14 keratins in basal layer (mutations cause EBS)',
          'K1/K10 keratins in suprabasal layers',
          'Terminal differentiation involves enucleation and cornification'
        ]
      },
      {
        step: 1,
        category: 'pathology',
        topic: 'Keratinocyte Disorders',
        objective: 'Recognize keratinocyte abnormalities in skin disease',
        keyPoints: [
          'Hyperkeratosis: increased stratum corneum thickness',
          'Parakeratosis: retained nuclei in stratum corneum',
          'Acanthosis: thickening of stratum spinosum',
          'Spongiosis: intercellular edema (eczema)'
        ],
        highYieldFacts: [
          'Acantholysis = loss of intercellular connections (pemphigus)',
          'Dyskeratosis = premature keratinization',
          'Koilocytes = keratinocytes with HPV changes'
        ]
      },
      {
        step: 2,
        category: 'pathology',
        topic: 'Keratinocyte Malignancies',
        objective: 'Diagnose and stage keratinocyte carcinomas',
        keyPoints: [
          'SCC: arises from keratinocytes, keratin pearls on histology',
          'BCC: arises from basal cells, peripheral palisading',
          'Actinic keratosis: SCC precursor, atypical keratinocytes',
          'Bowen disease: SCC in situ, full-thickness atypia'
        ],
        highYieldFacts: [
          'SCC risk factors: UV, immunosuppression, HPV (esp. genital)',
          'BCC rarely metastasizes; SCC can metastasize',
          'Field cancerization: multiple AKs indicate widespread UV damage'
        ]
      },
      {
        step: 3,
        category: 'pharmacology',
        topic: 'Keratinocyte Cancer Treatment',
        objective: 'Apply treatments for keratinocyte carcinomas and precancers',
        keyPoints: [
          'Surgical excision with margins: standard for SCC/BCC',
          'Mohs micrographic surgery: margin-controlled, tissue-sparing',
          '5-FU topical: field treatment for AKs',
          'Hedgehog inhibitors (vismodegib): advanced BCC'
        ],
        highYieldFacts: [
          'Imiquimod: TLR7 agonist, induces interferon for AKs and superficial BCC',
          'Cemiplimab: PD-1 inhibitor for advanced cutaneous SCC',
          'Photodynamic therapy: ALA + light for AKs and thin BCCs'
        ]
      }
    ],
    clinicalPearls: [
      'Keratinocytes produce antimicrobial peptides (defensins, cathelicidins)',
      'UVB primarily damages keratinocyte DNA',
      'Squamous cell carcinoma arises from keratinocytes'
    ],
    boardStyleQuestions: []
  },

  // ---------------------------------------------------------------------------
  // HAIR FOLLICLE
  // ---------------------------------------------------------------------------
  hair_follicle: {
    structureId: 'hair_follicle',
    usmleObjectives: [
      {
        step: 1,
        category: 'anatomy',
        topic: 'Hair Follicle Structure',
        objective: 'Describe the anatomy of the pilosebaceous unit',
        keyPoints: [
          'Extends from epidermis deep into dermis/hypodermis',
          'Components: bulb, papilla, matrix, sheaths, arrector pili',
          'Bulge region contains stem cells',
          'Sebaceous gland attached to follicle (pilosebaceous unit)'
        ],
        highYieldFacts: [
          'Hair growth cycles: anagen (growth), catagen (regression), telogen (rest)',
          'Scalp: 85% anagen, 15% telogen',
          'Telogen effluvium = synchronized shedding after stress'
        ]
      },
      {
        step: 1,
        category: 'physiology',
        topic: 'Hair Growth',
        objective: 'Explain the hair growth cycle and its regulation',
        keyPoints: [
          'Anagen: active growth phase (2-7 years on scalp)',
          'Catagen: regression phase (2-3 weeks)',
          'Telogen: resting phase (3 months)',
          'Exogen: shedding phase'
        ],
        highYieldFacts: [
          'Androgens stimulate terminal hair on face, chest; inhibit scalp hair',
          '5-alpha reductase converts testosterone to DHT',
          'Minoxidil prolongs anagen phase'
        ]
      },
      {
        step: 2,
        category: 'pathology',
        topic: 'Hair Disorders',
        objective: 'Diagnose and classify alopecia and hair diseases',
        keyPoints: [
          'Alopecia areata: autoimmune, exclamation point hairs',
          'Androgenetic alopecia: miniaturization, male/female patterns',
          'Telogen effluvium: diffuse shedding after stress/illness',
          'Scarring vs non-scarring: presence of follicular ostia'
        ],
        highYieldFacts: [
          'Pull test positive in active telogen effluvium (>6 hairs)',
          'Trichoscopy: yellow dots in alopecia areata',
          'CCCA (central centrifugal cicatricial alopecia) common in Black women'
        ]
      },
      {
        step: 3,
        category: 'pharmacology',
        topic: 'Hair Loss Treatment',
        objective: 'Apply pharmacotherapy for hair disorders',
        keyPoints: [
          'Minoxidil: vasodilator, prolongs anagen (2% women, 5% men)',
          'Finasteride: 5-AR inhibitor, blocks DHT (1mg daily)',
          'Intralesional steroids for alopecia areata',
          'JAK inhibitors: baricitinib FDA-approved for alopecia areata'
        ],
        highYieldFacts: [
          'Finasteride contraindicated in women of childbearing potential (teratogenic)',
          'Minoxidil initial shedding is normal (telogen release)',
          'Spironolactone used off-label for female pattern hair loss'
        ]
      }
    ],
    clinicalPearls: [
      'Alopecia areata involves autoimmune attack on hair bulb',
      'Folliculitis is infection of the hair follicle',
      'Hair follicle stem cells are important for wound healing'
    ],
    boardStyleQuestions: []
  },

  // ---------------------------------------------------------------------------
  // SWEAT GLAND
  // ---------------------------------------------------------------------------
  sweat_gland: {
    structureId: 'sweat_gland',
    usmleObjectives: [
      {
        step: 1,
        category: 'anatomy',
        topic: 'Eccrine Sweat Glands',
        objective: 'Describe eccrine gland structure and distribution',
        keyPoints: [
          'Coiled tubular glands in dermis',
          'Duct opens directly to skin surface (not to follicle)',
          '2-4 million glands on body surface',
          'Highest density on palms, soles, forehead'
        ],
        highYieldFacts: [
          'Eccrine glands present from birth, functional in infants',
          'Apocrine glands: develop at puberty, open to hair follicle',
          'Apocrine glands in axilla, groin produce odor (bacterial metabolism)'
        ]
      },
      {
        step: 1,
        category: 'physiology',
        topic: 'Thermoregulation',
        objective: 'Explain the role of sweating in temperature regulation',
        keyPoints: [
          'Sweat is hypotonic (dilute NaCl, urea, lactate)',
          'Evaporation provides cooling',
          'Innervated by sympathetic cholinergic fibers',
          'Can produce up to 10L sweat per day'
        ],
        highYieldFacts: [
          'Cystic fibrosis: elevated sweat chloride (>60 mEq/L)',
          'Hyperhidrosis: excessive sweating',
          'Anhidrosis: absent sweating (heat stroke risk)'
        ]
      },
      {
        step: 2,
        category: 'pathology',
        topic: 'Sweat Gland Disorders',
        objective: 'Recognize and diagnose sweat gland pathology',
        keyPoints: [
          'Hidradenitis suppurativa: apocrine gland occlusion, tunnels',
          'Miliaria: eccrine duct obstruction (rubra, crystallina, profunda)',
          'Hyperhidrosis: primary (focal) vs secondary (systemic)',
          'Bromhidrosis: malodorous sweat (apocrine + bacteria)'
        ],
        highYieldFacts: [
          'HS associated with smoking, obesity, metabolic syndrome',
          'Hurley staging for hidradenitis (I-III based on tunnel/scarring)',
          'Eccrine poroma: benign sweat gland tumor on palms/soles'
        ]
      },
      {
        step: 3,
        category: 'pharmacology',
        topic: 'Sweat Gland Therapeutics',
        objective: 'Apply treatments for hyperhidrosis and hidradenitis',
        keyPoints: [
          'Aluminum chloride: antiperspirant, blocks sweat ducts',
          'Botulinum toxin: blocks ACh release (lasts 6-12 months)',
          'Adalimumab: FDA-approved biologic for moderate-severe HS',
          'Glycopyrrolate: oral anticholinergic for hyperhidrosis'
        ],
        highYieldFacts: [
          'Botox for hyperhidrosis: 50 units per axilla, intradermal',
          'Iontophoresis: electrical current for palmoplantar hyperhidrosis',
          'miraDry: microwave device destroys sweat glands permanently'
        ]
      }
    ],
    clinicalPearls: [
      'Sweat chloride test is gold standard for CF diagnosis',
      'Botulinum toxin treats hyperhidrosis by blocking acetylcholine release',
      'Miliaria (heat rash) results from blocked sweat ducts'
    ],
    boardStyleQuestions: []
  },

  // ---------------------------------------------------------------------------
  // BLOOD VESSELS
  // ---------------------------------------------------------------------------
  blood_vessels: {
    structureId: 'blood_vessels',
    usmleObjectives: [
      {
        step: 1,
        category: 'anatomy',
        topic: 'Cutaneous Vasculature',
        objective: 'Describe the organization of skin blood supply',
        keyPoints: [
          'Two horizontal plexuses: superficial (papillary) and deep (reticular)',
          'Arterioles, venules, capillaries, and AVAs (arteriovenous anastomoses)',
          'Capillary loops extend into dermal papillae',
          'Skin receives ~5% of cardiac output'
        ],
        highYieldFacts: [
          'AVAs bypass capillaries for rapid temperature regulation',
          'Raynaud phenomenon: vasospasm of digital arteries',
          'Venous stasis leads to hyperpigmentation (hemosiderin)'
        ]
      },
      {
        step: 1,
        category: 'physiology',
        topic: 'Cutaneous Blood Flow',
        objective: 'Explain the regulation of skin blood flow',
        keyPoints: [
          'Sympathetic adrenergic vasoconstriction (cold, stress)',
          'Active vasodilation with heat (mechanism not fully understood)',
          'Histamine causes vasodilation and increased permeability',
          'Critical for thermoregulation'
        ],
        highYieldFacts: [
          'Wheal and flare: histamine release causes edema and erythema',
          'Dermographism: urticaria from stroking skin',
          'Vasculitis: inflammation of blood vessel walls'
        ]
      },
      {
        step: 2,
        category: 'pathology',
        topic: 'Cutaneous Vascular Disorders',
        objective: 'Diagnose vascular skin diseases and vasculitis',
        keyPoints: [
          'Leukocytoclastic vasculitis: palpable purpura, fibrinoid necrosis',
          'Raynaud phenomenon: digital vasospasm (white → blue → red)',
          'Livedo reticularis: reticulated mottling (antiphospholipid, PAN)',
          'Venous stasis: hyperpigmentation, lipodermatosclerosis, ulcers'
        ],
        highYieldFacts: [
          'Palpable purpura = vasculitis until proven otherwise',
          'IgA vasculitis (HSP): palpable purpura + arthritis + GI + renal',
          'ANCA-associated vasculitis: GPA (c-ANCA), MPA/EGPA (p-ANCA)'
        ]
      },
      {
        step: 3,
        category: 'pharmacology',
        topic: 'Vascular Disease Management',
        objective: 'Apply treatments for cutaneous vascular disorders',
        keyPoints: [
          'CCBs (nifedipine): first-line for Raynaud',
          'Compression therapy: cornerstone of venous stasis management',
          'Systemic steroids + immunosuppressants for severe vasculitis',
          'Laser therapy (PDL) for telangiectasias, port-wine stains'
        ],
        highYieldFacts: [
          'Pentoxifylline: improves blood flow in venous stasis ulcers',
          'Rituximab for refractory ANCA vasculitis',
          'Pulsed dye laser targets oxyhemoglobin (585-595nm)'
        ]
      }
    ],
    clinicalPearls: [
      'Petechiae, purpura, ecchymoses indicate vascular fragility or coagulopathy',
      'Livedo reticularis: mottled discoloration from vascular spasm',
      'Cherry angiomas are benign capillary proliferations'
    ],
    boardStyleQuestions: []
  },

  // ---------------------------------------------------------------------------
  // COLLAGEN
  // ---------------------------------------------------------------------------
  collagen: {
    structureId: 'collagen',
    usmleObjectives: [
      {
        step: 1,
        category: 'anatomy',
        topic: 'Collagen Types in Skin',
        objective: 'Identify the major collagen types in skin and their functions',
        keyPoints: [
          'Type I: 80-85% of dermal collagen, provides tensile strength',
          'Type III: 10-15%, found with type I, more in fetal skin',
          'Type IV: basement membrane collagen',
          'Type VII: anchoring fibrils at DEJ'
        ],
        highYieldFacts: [
          'Type I collagen defects cause osteogenesis imperfecta',
          'Type III collagen defects cause vascular EDS',
          'Type VII collagen mutations cause dystrophic epidermolysis bullosa'
        ]
      },
      {
        step: 1,
        category: 'physiology',
        topic: 'Collagen Synthesis',
        objective: 'Describe collagen biosynthesis and degradation',
        keyPoints: [
          'Procollagen synthesized by fibroblasts',
          'Hydroxylation of proline/lysine requires vitamin C',
          'Cross-linking requires copper (lysyl oxidase)',
          'MMPs (matrix metalloproteinases) degrade collagen'
        ],
        highYieldFacts: [
          'Scurvy: vitamin C deficiency impairs collagen synthesis',
          'UV induces MMP expression, accelerating photoaging',
          'TGF-beta stimulates collagen production'
        ]
      },
      {
        step: 2,
        category: 'pathology',
        topic: 'Collagen Disorders',
        objective: 'Diagnose hereditary and acquired collagen diseases',
        keyPoints: [
          'Ehlers-Danlos syndrome: collagen defects, hypermobility',
          'Osteogenesis imperfecta: type I collagen mutation, fragile bones',
          'Keloids: excessive collagen deposition beyond wound margins',
          'Morphea/scleroderma: collagen overproduction and fibrosis'
        ],
        highYieldFacts: [
          'Vascular EDS (type IV): COL3A1 mutation, arterial/organ rupture',
          'Keloids more common in darker skin types (Fitzpatrick IV-VI)',
          'Dystrophic epidermolysis bullosa: type VII collagen (anchoring fibrils)'
        ]
      },
      {
        step: 3,
        category: 'pharmacology',
        topic: 'Collagen-Targeted Therapies',
        objective: 'Apply treatments for collagen disorders and cosmetic enhancement',
        keyPoints: [
          'Intralesional steroids/5-FU for keloids',
          'Collagen fillers for wrinkles and volume loss',
          'Retinoids: stimulate collagen synthesis (anti-aging)',
          'Collagenase clostridium: enzymatic debridement, Dupuytren'
        ],
        highYieldFacts: [
          'Tretinoin: evidence-based for photoaging, increases collagen',
          'Silicone sheets: first-line prevention for keloids',
          'Botox: relaxes muscles, indirectly reduces dynamic wrinkles'
        ]
      }
    ],
    clinicalPearls: [
      'Striae (stretch marks) represent dermal collagen disruption',
      'Keloids and hypertrophic scars involve excessive collagen deposition',
      'Retinoids stimulate collagen synthesis'
    ],
    boardStyleQuestions: []
  },

  // ---------------------------------------------------------------------------
  // NERVES
  // ---------------------------------------------------------------------------
  nerves: {
    structureId: 'nerves',
    usmleObjectives: [
      {
        step: 1,
        category: 'anatomy',
        topic: 'Cutaneous Innervation',
        objective: 'Describe the types of sensory receptors in skin',
        keyPoints: [
          'Free nerve endings: pain, temperature, itch',
          'Meissner corpuscles: light touch (glabrous skin)',
          'Pacinian corpuscles: pressure/vibration (deep dermis)',
          'Merkel cells: sustained touch (hair follicles, fingertips)'
        ],
        highYieldFacts: [
          'A-delta fibers: fast pain, sharp',
          'C fibers: slow pain, dull/burning, itch',
          'Dermatomes follow segmental pattern'
        ]
      },
      {
        step: 1,
        category: 'physiology',
        topic: 'Sensory Transduction',
        objective: 'Explain mechanisms of touch and pain sensation',
        keyPoints: [
          'Mechanoreceptors transduce mechanical stimuli',
          'Thermoreceptors: TRP channels (TRPV1 for heat)',
          'Nociceptors: respond to tissue damage',
          'Itch transmitted via histamine H1 receptors and PAR2'
        ],
        highYieldFacts: [
          'Capsaicin activates TRPV1, causing burning sensation',
          'Substance P released by sensory nerves causes neurogenic inflammation',
          'Postherpetic neuralgia results from nerve damage by VZV'
        ]
      },
      {
        step: 2,
        category: 'pathology',
        topic: 'Cutaneous Neuropathy',
        objective: 'Recognize neurological skin diseases and sensory disorders',
        keyPoints: [
          'Postherpetic neuralgia: persistent pain after shingles',
          'Notalgia paresthetica: mid-back pruritus (T2-T6)',
          'Small fiber neuropathy: burning pain, normal EMG',
          'Complex regional pain syndrome: pain + autonomic changes'
        ],
        highYieldFacts: [
          'PHN risk increases with age; antivirals reduce risk if started <72h',
          'Diabetic neuropathy: stocking-glove distribution',
          'Brachioradial pruritus: sun-exposed forearm itch (cervical spine related)'
        ]
      },
      {
        step: 3,
        category: 'pharmacology',
        topic: 'Neuropathic Pain Management',
        objective: 'Apply pharmacotherapy for cutaneous neuropathic conditions',
        keyPoints: [
          'Gabapentinoids: first-line for neuropathic pain (gabapentin, pregabalin)',
          'TCAs: amitriptyline, nortriptyline for chronic pain',
          'Topical lidocaine 5% patch for localized neuropathic pain',
          'Capsaicin 8% patch: depletes substance P'
        ],
        highYieldFacts: [
          'Gabapentin dosing: start 100-300mg TID, titrate to effect',
          'Duloxetine (SNRI): FDA-approved for diabetic neuropathy',
          'Shingrix vaccine: >90% effective preventing herpes zoster'
        ]
      }
    ],
    clinicalPearls: [
      'Two-point discrimination tests Meissner corpuscle function',
      'Diabetic neuropathy affects sensory nerves, leading to foot ulcers',
      'Pruritus (itch) can indicate systemic disease (cholestasis, uremia)'
    ],
    boardStyleQuestions: []
  },

  // ---------------------------------------------------------------------------
  // ADIPOSE
  // ---------------------------------------------------------------------------
  adipose: {
    structureId: 'adipose',
    usmleObjectives: [
      {
        step: 1,
        category: 'anatomy',
        topic: 'Adipose Tissue Structure',
        objective: 'Describe adipocyte organization in subcutaneous tissue',
        keyPoints: [
          'White adipose tissue (WAT): energy storage, insulation',
          'Adipocytes organized into lobules',
          'Lobules separated by fibrous septa',
          'Contains blood vessels and nerves'
        ],
        highYieldFacts: [
          'Adipocytes can expand 1000x in volume',
          'Subcutaneous injection sites: abdomen, thigh, arm',
          'Brown adipose tissue (BAT): thermogenesis (minimal in adults)'
        ]
      },
      {
        step: 1,
        category: 'physiology',
        topic: 'Adipose as Endocrine Organ',
        objective: 'Explain the endocrine functions of adipose tissue',
        keyPoints: [
          'Secretes leptin (satiety hormone)',
          'Produces adiponectin (insulin sensitizer)',
          'Produces inflammatory cytokines (IL-6, TNF-alpha)',
          'Aromatase converts androgens to estrogens'
        ],
        highYieldFacts: [
          'Leptin deficiency causes severe obesity',
          'Adiponectin is decreased in obesity',
          'Visceral fat more metabolically active than subcutaneous'
        ]
      },
      {
        step: 2,
        category: 'pathology',
        topic: 'Adipose Tumors and Disorders',
        objective: 'Diagnose adipose tissue neoplasms and lipodystrophies',
        keyPoints: [
          'Lipoma: benign, soft, mobile, most common soft tissue tumor',
          'Angiolipoma: lipoma variant with vascular component, painful',
          'Liposarcoma: malignant, deep-seated, retroperitoneal common',
          'Lipodystrophy: localized or generalized fat loss'
        ],
        highYieldFacts: [
          'Well-differentiated liposarcoma vs lipoma: size >10cm, deep, rapid growth',
          'HIV lipodystrophy: facial wasting + central adiposity from HAART',
          'Dercum disease: painful lipomas, obesity, usually in postmenopausal women'
        ]
      },
      {
        step: 3,
        category: 'pharmacology',
        topic: 'Adipose-Related Therapeutics',
        objective: 'Apply treatments for adipose disorders and cosmetic procedures',
        keyPoints: [
          'Deoxycholic acid (Kybella): injectable fat destruction for submental',
          'Cryolipolysis (CoolSculpting): non-invasive fat reduction',
          'Liposuction: surgical fat removal',
          'Tesamorelin: reduces HIV-associated lipodystrophy'
        ],
        highYieldFacts: [
          'Kybella causes adipocyte lysis, requires multiple treatments',
          'Paradoxical adipose hyperplasia: rare CoolSculpting complication',
          'Fat grafting: autologous fat transfer for volume restoration'
        ]
      }
    ],
    clinicalPearls: [
      'Lipomas are benign adipose tumors',
      'Liposarcoma is malignant adipose tumor',
      'Lipodystrophy syndromes involve abnormal fat distribution'
    ],
    boardStyleQuestions: []
  },

  // ---------------------------------------------------------------------------
  // ARRECTOR PILI MUSCLE
  // ---------------------------------------------------------------------------
  arrector_pili: {
    structureId: 'arrector_pili',
    usmleObjectives: [
      // STEP 1: Basic anatomy and physiology
      {
        step: 1,
        category: 'anatomy',
        topic: 'Arrector Pili Muscle Anatomy',
        objective: 'Describe the structure and attachments of the arrector pili muscle',
        keyPoints: [
          'Smooth muscle bundle attached to hair follicle bulge',
          'Extends obliquely to papillary dermis',
          'Innervated by sympathetic adrenergic fibers',
          'Absent in hair of axilla, pubic area, eyelashes'
        ],
        highYieldFacts: [
          'Contraction causes piloerection (goosebumps)',
          'Compresses sebaceous gland during contraction',
          'Bulge region attachment site contains hair follicle stem cells'
        ]
      },
      {
        step: 1,
        category: 'physiology',
        topic: 'Arrector Pili Function',
        objective: 'Explain the physiological roles of the arrector pili muscle',
        keyPoints: [
          'Thermoregulation: traps air layer for insulation (vestigial in humans)',
          'Emotional response: fear/cold triggers sympathetic activation',
          'Sebum expression: helps empty sebaceous gland',
          'Stem cell niche: maintains bulge region microenvironment'
        ],
        highYieldFacts: [
          'Horripilation = piloerection = goosebumps',
          'Alpha-1 adrenergic receptors mediate contraction',
          'Loss of arrector pili in scarring alopecia (helpful diagnostic clue)'
        ]
      },
      // STEP 2: Clinical applications
      {
        step: 2,
        category: 'pathology',
        topic: 'Arrector Pili in Hair Disorders',
        objective: 'Recognize arrector pili changes in hair and skin diseases',
        keyPoints: [
          'Preserved in non-scarring alopecia (alopecia areata)',
          'Destroyed in scarring alopecia (lichen planopilaris, CCCA)',
          'Hypertrophy in keratosis pilaris',
          'Atrophy with aging and photodamage'
        ],
        highYieldFacts: [
          'Trichoscopy: absent arrector pili insertion = scarring alopecia',
          'Perifollicular fibrosis and muscle destruction in lichen planopilaris',
          'Vertical biopsy essential to assess arrector pili status'
        ]
      },
      // STEP 3: Management considerations
      {
        step: 3,
        category: 'pharmacology',
        topic: 'Arrector Pili Pharmacology',
        objective: 'Understand pharmacological effects on arrector pili',
        keyPoints: [
          'Alpha-blockers prevent piloerection',
          'Sympathomimetics can trigger goosebumps',
          'Botulinum toxin injections do not affect arrector pili (wrong nerve type)',
          'No approved therapies specifically target arrector pili'
        ],
        highYieldFacts: [
          'Sympathetic cholinergic fibers innervate sweat glands (not arrector pili)',
          'Drug-induced piloerection seen with opioid withdrawal',
          'Cocaine/amphetamines cause sympathetic activation and goosebumps'
        ]
      }
    ],
    clinicalPearls: [
      'Arrector pili preservation vs. destruction distinguishes scarring from non-scarring alopecia',
      'Perifollicular erythema + absent arrector pili = early cicatricial alopecia',
      '"Goosebumps" are a vestigial thermoregulatory response more effective in furred mammals',
      'Vertical scalp biopsy needed to properly evaluate arrector pili muscle'
    ],
    boardStyleQuestions: [],
    histologyReferences: [
      {
        id: 'arrector_pili_normal',
        structureId: 'arrector_pili',
        imagePath: '/histology/arrector_pili_40x.jpg',
        title: 'Arrector Pili Muscle - Normal',
        stain: 'H&E',
        magnification: '40x',
        description: 'Smooth muscle fibers extending from hair follicle bulge to papillary dermis.',
        keyFeatures: [
          'Elongated smooth muscle cells with central nuclei',
          'Oblique orientation relative to follicle',
          'Attachment to follicle at bulge level',
          'Surrounded by loose connective tissue'
        ],
        annotations: [
          { id: 'ap1', x: 40, y: 50, label: 'Smooth muscle fibers', description: 'Eosinophilic spindle cells', modelStructureId: 'arrector_pili' },
          { id: 'ap2', x: 60, y: 30, label: 'Hair follicle', description: 'Outer root sheath at bulge', modelStructureId: 'hair_follicle' }
        ]
      }
    ]
  }
};

// ============================================================================
// CLINICAL CORRELATIONS
// ============================================================================

export const CLINICAL_CORRELATIONS: ClinicalCorrelation[] = [
  {
    id: 'psoriasis_itch',
    diseaseId: 'psoriasis',
    question: 'Why does psoriasis cause itching?',
    answer: 'Psoriasis causes itching through cytokine-mediated nerve sensitization and barrier disruption.',
    pathophysiology: `
1. IL-31 released by Th2 cells directly activates itch-sensing nerve fibers
2. IL-17 and TNF-alpha from Th17/Th1 cells cause neurogenic inflammation
3. Nerve growth factor (NGF) is upregulated, increasing nerve fiber density
4. Barrier dysfunction exposes nerve endings to irritants
5. Substance P release perpetuates the itch-scratch cycle
    `.trim(),
    clinicalImplication: 'Biologics targeting IL-17 or IL-23 reduce pruritus. Emollients help by restoring barrier function.',
    relatedStructures: ['epidermis', 'nerves', 'stratum_corneum']
  },
  {
    id: 'photoaging_wrinkles',
    diseaseId: 'photoaging',
    question: 'Why does sun exposure cause wrinkles?',
    answer: 'UV radiation degrades collagen and elastin through oxidative stress and MMP activation.',
    pathophysiology: `
1. UVA penetrates deep into dermis, generating reactive oxygen species (ROS)
2. ROS activate AP-1 transcription factor
3. AP-1 induces matrix metalloproteinases (MMPs) that degrade collagen
4. UV also inhibits TGF-beta, reducing new collagen synthesis
5. Elastin fibers become fragmented and clumped (solar elastosis)
6. Glycosaminoglycans decrease, reducing dermal hydration
    `.trim(),
    clinicalImplication: 'Retinoids stimulate collagen synthesis and inhibit MMPs. Sunscreen prevents UV damage.',
    relatedStructures: ['dermis', 'collagen']
  },
  {
    id: 'eczema_barrier',
    diseaseId: 'eczema',
    question: 'Why does eczema cause dry, itchy skin?',
    answer: 'Eczema involves both barrier defects and immune dysregulation leading to inflammation and dryness.',
    pathophysiology: `
1. Filaggrin mutations reduce barrier lipids and NMF
2. Impaired barrier increases transepidermal water loss (TEWL)
3. Allergens and irritants penetrate more easily
4. Th2 cytokines (IL-4, IL-13) further suppress barrier protein expression
5. IL-31 causes intense pruritus
6. Scratching causes more barrier damage (itch-scratch cycle)
    `.trim(),
    clinicalImplication: 'Treatment includes emollients for barrier repair, topical steroids for inflammation, and dupilumab (anti-IL-4Rα) for severe cases.',
    relatedStructures: ['epidermis', 'stratum_corneum', 'keratinocytes']
  },
  {
    id: 'acne_pathogenesis',
    diseaseId: 'acne',
    question: 'What causes acne lesions to form?',
    answer: 'Acne results from follicular hyperkeratinization, sebum overproduction, bacterial colonization, and inflammation.',
    pathophysiology: `
1. Androgens stimulate sebaceous gland activity
2. Excess sebum accumulates in follicle
3. Keratinocyte hyperproliferation blocks follicle opening
4. Plugged follicle becomes microcomedo
5. Cutibacterium acnes (P. acnes) proliferates in anaerobic environment
6. Bacterial products trigger inflammatory response
7. Follicle rupture leads to nodular acne
    `.trim(),
    clinicalImplication: 'Treatment targets each factor: retinoids (keratinization), antibiotics (bacteria), benzoyl peroxide (bacteria/keratin), isotretinoin (all factors).',
    relatedStructures: ['hair_follicle', 'epidermis']
  },
  {
    id: 'rosacea_flushing',
    diseaseId: 'rosacea',
    question: 'Why does rosacea cause facial flushing and redness?',
    answer: 'Rosacea involves neurovascular dysregulation and innate immune activation.',
    pathophysiology: `
1. Abnormal cathelicidin (LL-37) processing by kallikrein 5
2. LL-37 fragments trigger inflammation and angiogenesis
3. Vascular instability causes easy flushing
4. TRPV1 channels are sensitized to triggers (heat, spice, alcohol)
5. Chronic inflammation leads to persistent erythema
6. Angiogenesis causes telangiectasias
    `.trim(),
    clinicalImplication: 'Topical brimonidine (α-agonist) reduces erythema. Laser therapy treats telangiectasias. Avoidance of triggers is key.',
    relatedStructures: ['blood_vessels', 'dermis']
  }
];

// ============================================================================
// BOARD-STYLE QUIZ QUESTIONS
// ============================================================================

export const BOARD_STYLE_QUESTIONS: BoardStyleQuestion[] = [
  // Structure Identification Questions
  {
    id: 'identify_stratum_corneum',
    type: 'structure_identification',
    difficulty: 'beginner',
    stem: 'A histology slide shows the outermost layer of the epidermis, consisting of flat, anucleate cells arranged in a "basket-weave" pattern.',
    leadIn: 'Which structure is being described?',
    options: [
      { letter: 'A', text: 'Stratum basale', isCorrect: false, feedback: 'Stratum basale is the deepest layer with cuboidal/columnar nucleated cells.' },
      { letter: 'B', text: 'Stratum spinosum', isCorrect: false, feedback: 'Stratum spinosum has polyhedral cells with prominent desmosomes.' },
      { letter: 'C', text: 'Stratum granulosum', isCorrect: false, feedback: 'Stratum granulosum has flattened cells with basophilic keratohyalin granules.' },
      { letter: 'D', text: 'Stratum corneum', isCorrect: true, feedback: 'Correct! The stratum corneum has dead, anucleate corneocytes in a basket-weave pattern.' },
      { letter: 'E', text: 'Stratum lucidum', isCorrect: false, feedback: 'Stratum lucidum is a thin, clear layer found only in thick skin.' }
    ],
    correctAnswer: 'D',
    explanation: 'The stratum corneum is composed of corneocytes - terminally differentiated keratinocytes that have lost their nuclei and organelles. The cells are surrounded by lipid bilayers in a "brick and mortar" arrangement that provides the primary barrier function of the epidermis.',
    educationalObjective: 'Identify the stratum corneum by its histological appearance',
    topic: 'Epidermal Layers',
    relatedStructureIds: ['stratum_corneum', 'epidermis']
  },

  // Clinical Correlation Questions
  {
    id: 'pemphigus_target',
    type: 'clinical_correlation',
    difficulty: 'intermediate',
    stem: 'A 55-year-old woman presents with painful oral erosions followed by flaccid blisters on her trunk. Biopsy shows intraepidermal acantholysis. Direct immunofluorescence shows IgG deposits in an intercellular pattern.',
    leadIn: 'Autoantibodies in this condition target which of the following structures?',
    options: [
      { letter: 'A', text: 'Type IV collagen', isCorrect: false, feedback: 'Type IV collagen is in the basement membrane, targeted in Goodpasture syndrome.' },
      { letter: 'B', text: 'Desmoglein', isCorrect: true, feedback: 'Correct! Pemphigus vulgaris antibodies target desmoglein 3 (mucosal) and desmoglein 1 (cutaneous).' },
      { letter: 'C', text: 'BP180 and BP230', isCorrect: false, feedback: 'BP180/BP230 are hemidesmosmal proteins targeted in bullous pemphigoid (subepidermal).' },
      { letter: 'D', text: 'Type VII collagen', isCorrect: false, feedback: 'Type VII collagen is in anchoring fibrils, targeted in epidermolysis bullosa acquisita.' },
      { letter: 'E', text: 'Laminin-332', isCorrect: false, feedback: 'Laminin is in the lamina lucida, targeted in mucous membrane pemphigoid.' }
    ],
    correctAnswer: 'B',
    explanation: 'Pemphigus vulgaris is an autoimmune blistering disease caused by antibodies against desmogleins, which are desmosomal cadherins that connect keratinocytes. Loss of cell-cell adhesion causes acantholysis and intraepidermal blister formation. Mucosal-dominant disease targets desmoglein 3; mucocutaneous disease targets both desmoglein 1 and 3.',
    educationalObjective: 'Recognize the target antigen in pemphigus vulgaris',
    topic: 'Autoimmune Blistering Diseases',
    relatedStructureIds: ['keratinocytes', 'epidermis']
  },

  // Board-Style Vignette
  {
    id: 'melanoma_management',
    type: 'board_style',
    difficulty: 'board_prep',
    stem: 'A 52-year-old man has a biopsy of an irregularly pigmented 8mm lesion on his back. Pathology shows melanoma with Breslow depth of 1.4mm, no ulceration, and mitotic rate of 2/mm². Sentinel lymph node biopsy is negative.',
    leadIn: 'According to AJCC staging, what is the T classification and recommended treatment?',
    options: [
      { letter: 'A', text: 'T1b; wide local excision with 1cm margins', isCorrect: false, feedback: 'T1 is ≤1.0mm. This lesion is >1.0mm.' },
      { letter: 'B', text: 'T2a; wide local excision with 1-2cm margins', isCorrect: true, feedback: 'Correct! T2a is 1.01-2.0mm without ulceration. Guidelines recommend 1-2cm margins for T2 melanoma.' },
      { letter: 'C', text: 'T2b; wide local excision with 2cm margins plus adjuvant immunotherapy', isCorrect: false, feedback: 'T2b would require ulceration. Adjuvant therapy is for stage III (node positive).' },
      { letter: 'D', text: 'T3a; wide local excision with 2cm margins plus adjuvant immunotherapy', isCorrect: false, feedback: 'T3 is >2.0-4.0mm. This lesion is 1.4mm.' },
      { letter: 'E', text: 'T4a; wide local excision with 2cm margins plus radiation', isCorrect: false, feedback: 'T4 is >4.0mm. This lesion is 1.4mm.' }
    ],
    correctAnswer: 'B',
    explanation: 'AJCC 8th edition T staging for melanoma: T1 (≤1.0mm), T2 (>1.0-2.0mm), T3 (>2.0-4.0mm), T4 (>4.0mm). Subclassification "a" is without ulceration, "b" is with ulceration. For T2 melanoma, recommended margins are 1-2cm. With negative sentinel node, this is Stage IB (T2aN0M0), and surgical excision alone is the standard treatment.',
    educationalObjective: 'Apply AJCC staging criteria to melanoma management',
    topic: 'Melanoma Staging and Treatment',
    relatedDiseaseId: 'melanoma' as DiseaseId
  },

  // Pathology Recognition
  {
    id: 'psoriasis_histology',
    type: 'pathology_recognition',
    difficulty: 'intermediate',
    stem: 'A skin biopsy shows regular elongation of rete ridges, thinning of the suprapapillary plate, dilated capillaries in dermal papillae, and parakeratosis with neutrophils in the stratum corneum.',
    leadIn: 'Which condition is most consistent with these histological findings?',
    options: [
      { letter: 'A', text: 'Atopic dermatitis', isCorrect: false, feedback: 'Atopic dermatitis shows spongiosis and irregular acanthosis, not regular rete elongation.' },
      { letter: 'B', text: 'Psoriasis', isCorrect: true, feedback: 'Correct! These are classic histological features of psoriasis.' },
      { letter: 'C', text: 'Lichen planus', isCorrect: false, feedback: 'Lichen planus shows saw-tooth rete ridges, interface dermatitis, and Civatte bodies.' },
      { letter: 'D', text: 'Seborrheic dermatitis', isCorrect: false, feedback: 'Seborrheic dermatitis shows spongiosis with parakeratosis around follicular ostia.' },
      { letter: 'E', text: 'Pityriasis rosea', isCorrect: false, feedback: 'Pityriasis rosea shows mound-shaped parakeratosis and extravasated RBCs.' }
    ],
    correctAnswer: 'B',
    explanation: 'Psoriasis has distinctive histological features: (1) Regular acanthosis with elongated rete ridges of similar length, (2) Thinned suprapapillary plate, (3) Dilated tortuous capillaries in dermal papillae, (4) Parakeratosis (retained nuclei in stratum corneum), (5) Munro microabscesses (neutrophils in stratum corneum), and (6) Spongiform pustules of Kogoj (neutrophils in epidermis).',
    educationalObjective: 'Recognize the histopathological features of psoriasis',
    topic: 'Inflammatory Dermatoses',
    relatedDiseaseId: 'psoriasis',
    relatedStructureIds: ['epidermis', 'stratum_corneum', 'blood_vessels']
  }
];

// ============================================================================
// HISTOLOGY REFERENCES
// ============================================================================

export const HISTOLOGY_REFERENCES: HistologyReference[] = [
  {
    id: 'normal_skin_overview',
    structureId: 'epidermis',
    imagePath: '/histology/normal_skin_10x.jpg',
    title: 'Normal Skin - Overview',
    stain: 'H&E',
    magnification: '10x',
    description: 'Low-power view showing the epidermis, dermis, and superficial hypodermis with normal architecture.',
    keyFeatures: [
      'Basket-weave stratum corneum',
      'Distinct epidermal layers',
      'Undulating dermal-epidermal junction',
      'Pink collagen bundles in dermis',
      'Skin appendages visible'
    ],
    annotations: [
      { id: 'a1', x: 50, y: 8, label: 'Stratum corneum', description: 'Anucleate corneocytes in basket-weave pattern', modelStructureId: 'stratum_corneum' },
      { id: 'a2', x: 50, y: 18, label: 'Epidermis', description: 'Stratified squamous keratinizing epithelium', modelStructureId: 'epidermis' },
      { id: 'a3', x: 50, y: 50, label: 'Dermis', description: 'Dense irregular connective tissue with collagen', modelStructureId: 'dermis' },
      { id: 'a4', x: 30, y: 45, label: 'Hair follicle', description: 'Pilosebaceous unit extending into dermis', modelStructureId: 'hair_follicle' }
    ]
  },
  {
    id: 'psoriasis_histology',
    diseaseId: 'psoriasis',
    imagePath: '/histology/psoriasis_20x.jpg',
    title: 'Psoriasis - Histopathology',
    stain: 'H&E',
    magnification: '20x',
    description: 'Classic histological features of plaque psoriasis showing epidermal hyperplasia and parakeratosis.',
    keyFeatures: [
      'Regular acanthosis (elongated rete ridges)',
      'Thinned suprapapillary plate',
      'Parakeratosis',
      'Dilated capillaries in dermal papillae',
      'Munro microabscesses may be present'
    ],
    annotations: [
      { id: 'p1', x: 50, y: 10, label: 'Parakeratosis', description: 'Retained nuclei in stratum corneum', modelStructureId: 'stratum_corneum' },
      { id: 'p2', x: 50, y: 35, label: 'Regular acanthosis', description: 'Uniformly elongated rete ridges', modelStructureId: 'epidermis' },
      { id: 'p3', x: 35, y: 55, label: 'Dilated capillaries', description: 'Tortuous vessels in dermal papillae', modelStructureId: 'blood_vessels' }
    ]
  }
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get educational content for a specific structure
 */
export function getStructureEducation(structureId: string): StructureEducationalContent | undefined {
  return STRUCTURE_EDUCATIONAL_CONTENT[structureId];
}

/**
 * Get clinical correlations for a disease
 */
export function getDiseaseClinicalCorrelations(diseaseId: DiseaseId): ClinicalCorrelation[] {
  return CLINICAL_CORRELATIONS.filter(cc => cc.diseaseId === diseaseId);
}

/**
 * Get clinical correlations for a structure
 */
export function getStructureClinicalCorrelations(structureId: string): ClinicalCorrelation[] {
  return CLINICAL_CORRELATIONS.filter(cc =>
    cc.structureId === structureId || cc.relatedStructures?.includes(structureId)
  );
}

/**
 * Get board-style questions by difficulty
 */
export function getQuestionsByDifficulty(difficulty: DifficultyLevel): BoardStyleQuestion[] {
  return BOARD_STYLE_QUESTIONS.filter(q => q.difficulty === difficulty);
}

/**
 * Get board-style questions by type
 */
export function getQuestionsByType(type: QuizQuestionType): BoardStyleQuestion[] {
  return BOARD_STYLE_QUESTIONS.filter(q => q.type === type);
}

/**
 * Get histology references for a structure
 */
export function getStructureHistology(structureId: string): HistologyReference[] {
  return HISTOLOGY_REFERENCES.filter(h => h.structureId === structureId);
}

/**
 * Get histology references for a disease
 */
export function getDiseaseHistology(diseaseId: DiseaseId): HistologyReference[] {
  return HISTOLOGY_REFERENCES.filter(h => h.diseaseId === diseaseId);
}
