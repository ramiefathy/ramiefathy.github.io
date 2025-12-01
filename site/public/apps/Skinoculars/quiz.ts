// Quiz system with multiple question types and difficulty levels

export type QuizQuestionType =
  | 'structure_identification'    // Click on the structure
  | 'clinical_correlation'        // Multiple choice about clinical relevance
  | 'board_style'                 // USMLE-style vignette questions
  | 'pathology_recognition'       // Identify pathological changes
  | 'layer_identification'        // Identify which layer
  | 'function_matching';          // Match structure to function

export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced' | 'board_prep';

export type ExamLevel = 'step1' | 'step2' | 'step3' | 'abd';

export interface QuizOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface QuizQuestion {
  id: string;
  type: QuizQuestionType;
  difficulty: DifficultyLevel;
  prompt: string;
  // For structure_identification and pathology_recognition
  targetStructureIds?: string[];
  // For multiple choice questions
  options?: QuizOption[];
  // For board_style questions
  vignette?: string;
  leadIn?: string;
  explanation: string;
  educationalObjective?: string;
  relatedStructures?: string[];
  relatedConditions?: string[];
  // Exam levels this question targets
  examLevels?: ExamLevel[];
}

// ============================================================================
// STRUCTURE IDENTIFICATION QUESTIONS (Click-based)
// ============================================================================
const STRUCTURE_IDENTIFICATION_QUESTIONS: QuizQuestion[] = [
  // BEGINNER
  {
    id: 'identify_epidermis',
    type: 'structure_identification',
    difficulty: 'beginner',
    prompt: 'Click on the epidermis (outermost layer of skin).',
    targetStructureIds: ['epidermis'],
    explanation: 'The epidermis is the outermost layer of skin, composed primarily of keratinocytes. It provides a waterproof barrier and protects against pathogens.',
    educationalObjective: 'Identify the major skin layers',
    examLevels: ['step1']
  },
  {
    id: 'identify_dermis',
    type: 'structure_identification',
    difficulty: 'beginner',
    prompt: 'Click on the dermis (middle layer of skin).',
    targetStructureIds: ['dermis'],
    explanation: 'The dermis is the thick middle layer containing collagen, elastin, blood vessels, nerves, and skin appendages.',
    educationalObjective: 'Identify the major skin layers',
    examLevels: ['step1']
  },
  {
    id: 'identify_hypodermis',
    type: 'structure_identification',
    difficulty: 'beginner',
    prompt: 'Click on the hypodermis (subcutaneous layer).',
    targetStructureIds: ['hypodermis'],
    explanation: 'The hypodermis (subcutis) is the deepest layer, composed mainly of adipose tissue for insulation and cushioning.',
    educationalObjective: 'Identify the major skin layers',
    examLevels: ['step1']
  },
  {
    id: 'identify_sweat_gland',
    type: 'structure_identification',
    difficulty: 'beginner',
    prompt: 'Click on the eccrine sweat gland.',
    targetStructureIds: ['sweat_gland'],
    explanation: 'Eccrine sweat glands are coiled tubular glands in the deep dermis that connect to the skin surface via a straight duct.',
    educationalObjective: 'Identify skin appendages',
    examLevels: ['step1']
  },
  {
    id: 'identify_hair_follicle',
    type: 'structure_identification',
    difficulty: 'beginner',
    prompt: 'Click on the hair follicle.',
    targetStructureIds: ['hair_follicle'],
    explanation: 'Hair follicles span from the epidermal surface into the dermis, ending in a bulb anchored near the dermis-hypodermis interface.',
    educationalObjective: 'Identify skin appendages',
    examLevels: ['step1']
  },
  // INTERMEDIATE
  {
    id: 'identify_collagen',
    type: 'structure_identification',
    difficulty: 'intermediate',
    prompt: 'Click on the collagen matrix.',
    targetStructureIds: ['collagen'],
    explanation: 'Collagen is visualized as a dense irregular array of fibers in the dermis that provides tensile strength. Type I collagen is most abundant.',
    educationalObjective: 'Identify dermal structural components',
    examLevels: ['step1']
  },
  {
    id: 'identify_stratum_corneum',
    type: 'structure_identification',
    difficulty: 'intermediate',
    prompt: 'Click on the stratum corneum.',
    targetStructureIds: ['stratum_corneum'],
    explanation: 'The stratum corneum is the outermost layer of the epidermis, consisting of dead cells (corneocytes) that form the skin barrier.',
    educationalObjective: 'Identify epidermal sublayers',
    examLevels: ['step1']
  },
  {
    id: 'identify_blood_vessels',
    type: 'structure_identification',
    difficulty: 'intermediate',
    prompt: 'Click on the dermal blood vessels.',
    targetStructureIds: ['blood_vessels'],
    explanation: 'The dermal vasculature is arranged in superficial and deep plexuses, providing nutrients and thermoregulation.',
    educationalObjective: 'Identify dermal vascular structures',
    examLevels: ['step1']
  },
  {
    id: 'identify_nerves',
    type: 'structure_identification',
    difficulty: 'intermediate',
    prompt: 'Click on the sensory nerves.',
    targetStructureIds: ['nerves'],
    explanation: 'Sensory nerve fibers in the dermis detect touch, pressure, temperature, and pain through various specialized receptors.',
    educationalObjective: 'Identify dermal neural structures',
    examLevels: ['step1']
  },
  // ADVANCED
  {
    id: 'identify_keratinocytes',
    type: 'structure_identification',
    difficulty: 'advanced',
    prompt: 'Click on the keratinocytes in the stratum basale.',
    targetStructureIds: ['keratinocytes'],
    explanation: 'Keratinocytes in the stratum basale are stem cells that divide and migrate upward, differentiating as they go.',
    educationalObjective: 'Identify cellular components of epidermis',
    examLevels: ['step1', 'step2']
  },
  {
    id: 'identify_adipose',
    type: 'structure_identification',
    difficulty: 'advanced',
    prompt: 'Click on the adipose tissue (fat cells).',
    targetStructureIds: ['adipose'],
    explanation: 'Adipocytes in the hypodermis store energy and produce adipokines like leptin and adiponectin.',
    educationalObjective: 'Identify hypodermal structures',
    examLevels: ['step1', 'step2']
  }
];

// ============================================================================
// CLINICAL CORRELATION QUESTIONS (Multiple choice)
// ============================================================================
const CLINICAL_CORRELATION_QUESTIONS: QuizQuestion[] = [
  {
    id: 'clinical_psoriasis_turnover',
    type: 'clinical_correlation',
    difficulty: 'intermediate',
    prompt: 'A patient presents with well-demarcated erythematous plaques covered with silvery scales. What is the primary pathophysiologic change in the epidermis?',
    options: [
      { id: 'a', text: 'Decreased keratinocyte proliferation', isCorrect: false },
      { id: 'b', text: 'Accelerated epidermal turnover (3-5 days vs 28 days)', isCorrect: true },
      { id: 'c', text: 'Loss of melanocytes', isCorrect: false },
      { id: 'd', text: 'Increased collagen deposition', isCorrect: false }
    ],
    explanation: 'Psoriasis is characterized by dramatically accelerated epidermal turnover. Normal turnover takes ~28 days, but in psoriasis it occurs in just 3-5 days, leading to the characteristic silvery scale from incomplete keratinocyte maturation.',
    educationalObjective: 'Understand the pathophysiology of psoriasis',
    relatedStructures: ['epidermis', 'keratinocytes'],
    relatedConditions: ['psoriasis'],
    examLevels: ['step1', 'step2', 'abd']
  },
  {
    id: 'clinical_eczema_barrier',
    type: 'clinical_correlation',
    difficulty: 'intermediate',
    prompt: 'A 6-year-old presents with chronic itchy, lichenified patches in the antecubital fossae. What is the strongest genetic risk factor for this condition?',
    options: [
      { id: 'a', text: 'HLA-B27', isCorrect: false },
      { id: 'b', text: 'Filaggrin (FLG) gene mutations', isCorrect: true },
      { id: 'c', text: 'BRCA1 mutations', isCorrect: false },
      { id: 'd', text: 'Factor V Leiden', isCorrect: false }
    ],
    explanation: 'Filaggrin gene (FLG) mutations are the strongest genetic risk factor for atopic dermatitis. Filaggrin is essential for proper stratum corneum formation and barrier function.',
    educationalObjective: 'Identify genetic factors in atopic dermatitis',
    relatedStructures: ['stratum_corneum', 'epidermis'],
    relatedConditions: ['eczema'],
    examLevels: ['step1', 'step2', 'abd']
  },
  {
    id: 'clinical_cf_sweat',
    type: 'clinical_correlation',
    difficulty: 'advanced',
    prompt: 'A newborn fails newborn screening and a confirmatory test shows elevated sweat chloride. Which structure\'s function is most directly affected by this genetic mutation?',
    options: [
      { id: 'a', text: 'Hair follicle', isCorrect: false },
      { id: 'b', text: 'Sebaceous gland', isCorrect: false },
      { id: 'c', text: 'Eccrine sweat gland duct', isCorrect: true },
      { id: 'd', text: 'Apocrine sweat gland', isCorrect: false }
    ],
    explanation: 'Cystic fibrosis is caused by CFTR chloride channel mutations. In the eccrine sweat gland duct, defective CFTR prevents chloride reabsorption, resulting in elevated sweat chloride (>60 mEq/L is diagnostic).',
    educationalObjective: 'Understand the role of eccrine glands in cystic fibrosis diagnosis',
    relatedStructures: ['sweat_gland'],
    examLevels: ['step1', 'step2']
  },
  {
    id: 'clinical_scurvy',
    type: 'clinical_correlation',
    difficulty: 'intermediate',
    prompt: 'A patient with poor dietary intake presents with bleeding gums, perifollicular hemorrhages, and poor wound healing. Which dermal component synthesis is impaired?',
    options: [
      { id: 'a', text: 'Elastin', isCorrect: false },
      { id: 'b', text: 'Keratin', isCorrect: false },
      { id: 'c', text: 'Collagen', isCorrect: true },
      { id: 'd', text: 'Melanin', isCorrect: false }
    ],
    explanation: 'Scurvy (vitamin C deficiency) impairs collagen synthesis. Vitamin C is required for hydroxylation of proline and lysine residues during collagen synthesis, and deficiency leads to weak, poorly cross-linked collagen.',
    educationalObjective: 'Understand the role of vitamin C in collagen synthesis',
    relatedStructures: ['collagen', 'dermis'],
    examLevels: ['step1']
  },
  {
    id: 'clinical_keloid',
    type: 'clinical_correlation',
    difficulty: 'advanced',
    prompt: 'A patient develops a raised, firm scar that extends beyond the original wound margins 6 months after ear piercing. What distinguishes this from a hypertrophic scar?',
    options: [
      { id: 'a', text: 'Keloids extend beyond wound margins; hypertrophic scars do not', isCorrect: true },
      { id: 'b', text: 'Keloids are painful; hypertrophic scars are not', isCorrect: false },
      { id: 'c', text: 'Keloids occur only on the trunk', isCorrect: false },
      { id: 'd', text: 'Hypertrophic scars have more collagen', isCorrect: false }
    ],
    explanation: 'Keloids extend beyond the original wound margins and can continue to grow, while hypertrophic scars remain within the wound boundaries. Both result from excessive collagen deposition during wound healing.',
    educationalObjective: 'Distinguish keloids from hypertrophic scars',
    relatedStructures: ['collagen', 'dermis'],
    examLevels: ['step2', 'step3', 'abd']
  },
  {
    id: 'clinical_shingles_dermatome',
    type: 'clinical_correlation',
    difficulty: 'intermediate',
    prompt: 'A 70-year-old presents with painful vesicles in a band-like distribution on the left trunk. The lesions do not cross the midline. Which structure explains this distribution?',
    options: [
      { id: 'a', text: 'Blood vessel distribution', isCorrect: false },
      { id: 'b', text: 'Lymphatic drainage pattern', isCorrect: false },
      { id: 'c', text: 'Dermatome/sensory nerve distribution', isCorrect: true },
      { id: 'd', text: 'Muscle fiber orientation', isCorrect: false }
    ],
    explanation: 'Herpes zoster (shingles) follows a dermatomal distribution because VZV remains latent in dorsal root ganglia and reactivates along that sensory nerve distribution. The rash does not cross the midline because each dermatome is unilateral.',
    educationalObjective: 'Understand dermatomal distribution in herpes zoster',
    relatedStructures: ['nerves'],
    examLevels: ['step1', 'step2']
  }
];

// ============================================================================
// BOARD-STYLE QUESTIONS (USMLE vignette format)
// ============================================================================
const BOARD_STYLE_QUESTIONS: QuizQuestion[] = [
  {
    id: 'board_pemphigus_vs_pemphigoid',
    type: 'board_style',
    difficulty: 'board_prep',
    vignette: 'A 65-year-old woman presents with flaccid blisters that rupture easily, leaving painful erosions on her oral mucosa and trunk. Nikolsky sign is positive. Direct immunofluorescence shows IgG deposition in a "chicken wire" pattern around epidermal cells.',
    leadIn: 'What is the target of the pathogenic antibodies in this condition?',
    prompt: 'What is the target of the pathogenic antibodies?',
    options: [
      { id: 'a', text: 'Type VII collagen', isCorrect: false },
      { id: 'b', text: 'Desmoglein 1 and 3', isCorrect: true },
      { id: 'c', text: 'BP180 and BP230 (hemidesmosomes)', isCorrect: false },
      { id: 'd', text: 'Laminin-332', isCorrect: false }
    ],
    explanation: 'This is pemphigus vulgaris. The "chicken wire" pattern on DIF indicates antibodies targeting desmogleins (cell-cell junctions) rather than the basement membrane. Desmoglein 3 (mucosal) and desmoglein 1 (cutaneous) are the targets. Bullous pemphigoid targets hemidesmosomes (BP180/BP230) and shows linear staining at the DEJ.',
    educationalObjective: 'Distinguish pemphigus vulgaris from bullous pemphigoid by mechanism and immunofluorescence pattern',
    relatedStructures: ['epidermis', 'keratinocytes'],
    examLevels: ['step2', 'step3', 'abd']
  },
  {
    id: 'board_melanoma_depth',
    type: 'board_style',
    difficulty: 'board_prep',
    vignette: 'A 55-year-old man presents with an asymmetric, irregularly bordered pigmented lesion on his back. Biopsy reveals melanoma. The pathology report states "Breslow thickness 2.1 mm, Clark level IV."',
    leadIn: 'To which layer has the melanoma invaded?',
    prompt: 'Clark level IV indicates invasion to which layer?',
    options: [
      { id: 'a', text: 'Epidermis only', isCorrect: false },
      { id: 'b', text: 'Papillary dermis', isCorrect: false },
      { id: 'c', text: 'Reticular dermis', isCorrect: true },
      { id: 'd', text: 'Subcutaneous fat', isCorrect: false }
    ],
    explanation: 'Clark levels: I = epidermis, II = papillary dermis, III = papillary-reticular junction, IV = reticular dermis, V = subcutaneous fat. Breslow thickness (vertical depth in mm) is the most important prognostic factor.',
    educationalObjective: 'Understand melanoma staging using Clark levels and Breslow thickness',
    relatedStructures: ['epidermis', 'dermis', 'hypodermis'],
    examLevels: ['step2', 'step3', 'abd']
  },
  {
    id: 'board_alopecia_areata',
    type: 'board_style',
    difficulty: 'board_prep',
    vignette: 'A 25-year-old woman presents with a well-circumscribed patch of hair loss on her scalp. On examination, short broken hairs that taper proximally ("exclamation point hairs") are seen at the margins. Pull test is positive. Scalp appears normal without scarring.',
    leadIn: 'What is the pathophysiology of this condition?',
    prompt: 'What is the pathophysiology?',
    options: [
      { id: 'a', text: 'Androgen-mediated follicular miniaturization', isCorrect: false },
      { id: 'b', text: 'Autoimmune attack on anagen hair bulb', isCorrect: true },
      { id: 'c', text: 'Telogen synchronization following stress', isCorrect: false },
      { id: 'd', text: 'Trichotillomania (hair pulling)', isCorrect: false }
    ],
    explanation: 'Alopecia areata is an autoimmune condition targeting the hair follicle bulb during anagen phase. "Exclamation point hairs" are pathognomonic. Unlike androgenetic alopecia (miniaturization) or telogen effluvium (diffuse shedding), it presents as patchy non-scarring alopecia.',
    educationalObjective: 'Identify alopecia areata and understand its autoimmune pathophysiology',
    relatedStructures: ['hair_follicle'],
    examLevels: ['step2', 'abd']
  },
  {
    id: 'board_rosacea_pathophysiology',
    type: 'board_style',
    difficulty: 'advanced',
    vignette: 'A 45-year-old woman complains of facial flushing triggered by hot beverages, alcohol, and stress. Physical examination reveals persistent centrofacial erythema with telangiectasias on the cheeks and nose. No pustules or papules are present.',
    leadIn: 'Which skin structure dysfunction is primarily responsible for the flushing episodes?',
    prompt: 'Which structure is primarily responsible for flushing?',
    options: [
      { id: 'a', text: 'Sebaceous glands', isCorrect: false },
      { id: 'b', text: 'Dermal blood vessels and neurovascular dysregulation', isCorrect: true },
      { id: 'c', text: 'Eccrine sweat glands', isCorrect: false },
      { id: 'd', text: 'Hair follicles', isCorrect: false }
    ],
    explanation: 'Rosacea involves neurovascular dysregulation of dermal blood vessels. The flushing is due to vasodilation triggered by various stimuli. Telangiectasias represent persistently dilated superficial vessels. This is erythematotelangiectatic rosacea (subtype 1).',
    educationalObjective: 'Understand the vascular component of rosacea pathophysiology',
    relatedStructures: ['blood_vessels'],
    relatedConditions: ['rosacea'],
    examLevels: ['step2', 'abd']
  },
  {
    id: 'board_ehlers_danlos',
    type: 'board_style',
    difficulty: 'board_prep',
    vignette: 'A 22-year-old woman presents with easy bruising, hyperextensible skin, and joint hypermobility. She reports that her wounds heal slowly and leave widened, "cigarette paper" scars. Her mother had similar findings.',
    leadIn: 'A mutation in which protein is most likely responsible for this presentation?',
    prompt: 'Which protein mutation is most likely responsible?',
    options: [
      { id: 'a', text: 'Fibrillin-1', isCorrect: false },
      { id: 'b', text: 'Type V collagen or collagen processing enzymes', isCorrect: true },
      { id: 'c', text: 'Dystrophin', isCorrect: false },
      { id: 'd', text: 'Elastin', isCorrect: false }
    ],
    explanation: 'Classical Ehlers-Danlos syndrome involves type V collagen mutations (COL5A1/COL5A2). The triad of skin hyperextensibility, joint hypermobility, and abnormal scarring is classic. Fibrillin-1 mutations cause Marfan syndrome (tall stature, aortic root dilation, lens dislocation).',
    educationalObjective: 'Recognize Ehlers-Danlos syndrome and understand collagen defects',
    relatedStructures: ['collagen', 'dermis'],
    examLevels: ['step1', 'step2']
  },
  // NEW ABD-STYLE VIGNETTES
  {
    id: 'board_dermatomyositis',
    type: 'board_style',
    difficulty: 'board_prep',
    vignette: 'A 52-year-old woman presents with proximal muscle weakness, difficulty climbing stairs, and a violaceous discoloration of the upper eyelids. Physical examination also reveals erythematous papules over the metacarpophalangeal and interphalangeal joints.',
    leadIn: 'Which additional workup is most important in this patient?',
    prompt: 'What additional workup is most important?',
    options: [
      { id: 'a', text: 'Patch testing for contact allergens', isCorrect: false },
      { id: 'b', text: 'Age-appropriate malignancy screening', isCorrect: true },
      { id: 'c', text: 'Sweat chloride test', isCorrect: false },
      { id: 'd', text: 'Nerve conduction studies', isCorrect: false }
    ],
    explanation: 'This patient has dermatomyositis with heliotrope rash (violaceous eyelids) and Gottron papules (over joints). Adult-onset dermatomyositis is associated with internal malignancy in 15-25% of cases, requiring age-appropriate cancer screening (CT chest/abdomen/pelvis, mammography, colonoscopy).',
    educationalObjective: 'Recognize dermatomyositis skin findings and malignancy association',
    relatedStructures: ['epidermis', 'dermis'],
    examLevels: ['step2', 'step3', 'abd']
  },
  {
    id: 'board_drug_eruption_sjs',
    type: 'board_style',
    difficulty: 'board_prep',
    vignette: 'A 35-year-old man started on allopurinol 3 weeks ago develops fever, painful oral erosions, and targetoid lesions with epidermal detachment involving 8% BSA. Nikolsky sign is positive in areas of erythema.',
    leadIn: 'What is the most appropriate immediate management?',
    prompt: 'What is the most appropriate immediate management?',
    options: [
      { id: 'a', text: 'High-dose oral prednisone', isCorrect: false },
      { id: 'b', text: 'Discontinue allopurinol and transfer to burn unit', isCorrect: true },
      { id: 'c', text: 'Start acyclovir for herpes simplex', isCorrect: false },
      { id: 'd', text: 'Apply topical tacrolimus to affected areas', isCorrect: false }
    ],
    explanation: 'This is Stevens-Johnson Syndrome (SJS; <10% BSA detachment). TEN is >30% BSA. Allopurinol is a high-risk medication. Management: immediate drug discontinuation, transfer to burn/ICU for wound care, fluid/electrolyte management, infection monitoring. Systemic steroids are controversial and not first-line.',
    educationalObjective: 'Recognize SJS/TEN and understand appropriate management',
    relatedStructures: ['epidermis', 'keratinocytes'],
    relatedConditions: ['drug_eruption'],
    examLevels: ['step2', 'step3', 'abd']
  },
  {
    id: 'board_ctcl_staging',
    type: 'board_style',
    difficulty: 'board_prep',
    vignette: 'A 68-year-old man has had "refractory eczema" for 15 years. Now he presents with generalized erythroderma, lymphadenopathy, and intensely pruritic skin. Skin biopsy shows atypical lymphocytes with cerebriform nuclei in the epidermis (Pautrier microabscesses). Flow cytometry of peripheral blood shows 2,500 Sezary cells/μL.',
    leadIn: 'What is the diagnosis and stage?',
    prompt: 'What is the diagnosis and stage?',
    options: [
      { id: 'a', text: 'Mycosis fungoides, patch stage (IA)', isCorrect: false },
      { id: 'b', text: 'Mycosis fungoides, tumor stage (IIB)', isCorrect: false },
      { id: 'c', text: 'Sezary syndrome (IVA)', isCorrect: true },
      { id: 'd', text: 'Adult T-cell leukemia/lymphoma', isCorrect: false }
    ],
    explanation: 'Sezary syndrome is the leukemic variant of CTCL defined by erythroderma + circulating Sezary cells (≥1000/μL or ≥10% of lymphocytes with abnormal phenotype). Pautrier microabscesses are pathognomonic for epidermotropic CTCL. This is stage IVA (blood involvement).',
    educationalObjective: 'Diagnose Sezary syndrome and understand CTCL staging',
    relatedStructures: ['epidermis'],
    examLevels: ['abd']
  },
  {
    id: 'board_porphyria_cutanea_tarda',
    type: 'board_style',
    difficulty: 'board_prep',
    vignette: 'A 55-year-old man with hepatitis C presents with vesicles and bullae on sun-exposed areas of his hands. The blisters heal with scarring and milia formation. He also notes increased facial hair and skin fragility. Urine fluoresces coral-pink under Wood lamp.',
    leadIn: 'Which enzyme is deficient in this condition?',
    prompt: 'Which enzyme is deficient?',
    options: [
      { id: 'a', text: 'Porphobilinogen deaminase', isCorrect: false },
      { id: 'b', text: 'Uroporphyrinogen decarboxylase', isCorrect: true },
      { id: 'c', text: 'Ferrochelatase', isCorrect: false },
      { id: 'd', text: 'ALA dehydratase', isCorrect: false }
    ],
    explanation: 'Porphyria cutanea tarda (PCT) is caused by decreased uroporphyrinogen decarboxylase (UROD) activity. Classic findings: photosensitive blistering, skin fragility, hypertrichosis, hyperpigmentation. Associated with hepatitis C, alcohol, iron overload. Treatment: phlebotomy, low-dose hydroxychloroquine.',
    educationalObjective: 'Recognize PCT and understand the enzyme deficiency',
    relatedStructures: ['epidermis', 'dermis'],
    examLevels: ['step1', 'abd']
  },
  {
    id: 'board_leprosy_spectrum',
    type: 'board_style',
    difficulty: 'board_prep',
    vignette: 'A 40-year-old immigrant from India presents with multiple hypopigmented, anesthetic macules on his trunk. Skin biopsy shows well-formed granulomas with Langerhans giant cells. AFB stain shows rare bacilli. Nerve examination reveals enlarged greater auricular nerve.',
    leadIn: 'Where does this fall on the leprosy spectrum?',
    prompt: 'Where on the leprosy spectrum?',
    options: [
      { id: 'a', text: 'Tuberculoid (TT) - high cell-mediated immunity', isCorrect: true },
      { id: 'b', text: 'Lepromatous (LL) - low cell-mediated immunity', isCorrect: false },
      { id: 'c', text: 'Borderline tuberculoid (BT)', isCorrect: false },
      { id: 'd', text: 'Indeterminate leprosy', isCorrect: false }
    ],
    explanation: 'Tuberculoid leprosy (TT) = few, well-defined hypopigmented anesthetic lesions with well-formed granulomas and rare AFB. Strong cell-mediated immunity limits bacterial load. Lepromatous (LL) = many symmetric lesions, diffuse infiltration, "foam cells" with many AFB, leonine facies.',
    educationalObjective: 'Understand the leprosy spectrum and its immunologic basis',
    relatedStructures: ['epidermis', 'dermis', 'nerves'],
    examLevels: ['step2', 'abd']
  },
  {
    id: 'board_vitiligo_management',
    type: 'board_style',
    difficulty: 'board_prep',
    vignette: 'A 28-year-old woman presents with progressive symmetric depigmented patches on her face, hands, and periorbital areas over 6 months. Wood lamp accentuates the lesions. She has a history of Hashimoto thyroiditis. Patches cover approximately 5% BSA.',
    leadIn: 'What is the most appropriate first-line treatment for facial lesions?',
    prompt: 'What is first-line treatment for facial vitiligo?',
    options: [
      { id: 'a', text: 'Oral corticosteroids', isCorrect: false },
      { id: 'b', text: 'Topical calcineurin inhibitors (tacrolimus)', isCorrect: true },
      { id: 'c', text: 'Surgical melanocyte transplantation', isCorrect: false },
      { id: 'd', text: 'Depigmentation with monobenzone', isCorrect: false }
    ],
    explanation: 'For facial vitiligo, topical calcineurin inhibitors (tacrolimus, pimecrolimus) are preferred over steroids to avoid facial steroid side effects. NB-UVB phototherapy is added for widespread disease. Surgical options are for stable, localized disease. Depigmentation is reserved for >50% BSA involvement.',
    educationalObjective: 'Understand vitiligo treatment algorithm',
    relatedStructures: ['epidermis'],
    relatedConditions: ['vitiligo'],
    examLevels: ['step3', 'abd']
  }
];

// ============================================================================
// PATHOLOGY RECOGNITION QUESTIONS (Identify pathological changes)
// ============================================================================
const PATHOLOGY_RECOGNITION_QUESTIONS: QuizQuestion[] = [
  {
    id: 'pathology_psoriasis_epidermis',
    type: 'pathology_recognition',
    difficulty: 'intermediate',
    prompt: 'In psoriasis, which structure shows the most dramatic pathological changes? Click on it.',
    targetStructureIds: ['epidermis', 'keratinocytes'],
    explanation: 'In psoriasis, the epidermis shows marked acanthosis (thickening), parakeratosis (retained nuclei in stratum corneum), and elongated rete ridges. The papillary dermis shows dilated, tortuous capillaries.',
    educationalObjective: 'Identify histopathological changes in psoriasis',
    relatedConditions: ['psoriasis'],
    examLevels: ['step1', 'step2', 'abd']
  },
  {
    id: 'pathology_photoaging_dermis',
    type: 'pathology_recognition',
    difficulty: 'intermediate',
    prompt: 'In photoaged skin, which structure is most affected by chronic UV damage? Click on it.',
    targetStructureIds: ['collagen', 'dermis'],
    explanation: 'Photoaging primarily affects the dermis through solar elastosis (abnormal elastic fiber accumulation), collagen degradation by UV-induced MMPs, and overall dermal thinning.',
    educationalObjective: 'Identify dermal changes in photoaging',
    relatedConditions: ['photoaging'],
    examLevels: ['step1', 'abd']
  },
  {
    id: 'pathology_eczema_barrier',
    type: 'pathology_recognition',
    difficulty: 'advanced',
    prompt: 'In atopic dermatitis, which epidermal layer has impaired barrier function? Click on it.',
    targetStructureIds: ['stratum_corneum'],
    explanation: 'The stratum corneum is defective in atopic dermatitis due to filaggrin deficiency and lipid abnormalities. This impairs the "brick and mortar" barrier, increasing transepidermal water loss and allergen penetration.',
    educationalObjective: 'Identify barrier dysfunction in atopic dermatitis',
    relatedConditions: ['eczema'],
    examLevels: ['step1', 'step2', 'abd']
  },
  {
    id: 'pathology_acne_follicle',
    type: 'pathology_recognition',
    difficulty: 'intermediate',
    prompt: 'In acne vulgaris, which structure becomes occluded and inflamed? Click on it.',
    targetStructureIds: ['hair_follicle'],
    explanation: 'Acne involves the pilosebaceous unit. Follicular hyperkeratinization occludes the follicle, sebum accumulates, C. acnes proliferates, and inflammation ensues. The result is comedones, papules, pustules, and in severe cases, nodules/cysts.',
    educationalObjective: 'Identify the pilosebaceous unit as the target in acne',
    relatedConditions: ['acne'],
    examLevels: ['step1', 'step2', 'abd']
  }
];

// ============================================================================
// LAYER IDENTIFICATION QUESTIONS
// ============================================================================
const LAYER_IDENTIFICATION_QUESTIONS: QuizQuestion[] = [
  {
    id: 'layer_basement_membrane',
    type: 'layer_identification',
    difficulty: 'advanced',
    prompt: 'The basement membrane (dermal-epidermal junction) separates which two layers?',
    options: [
      { id: 'a', text: 'Stratum corneum and stratum granulosum', isCorrect: false },
      { id: 'b', text: 'Epidermis and dermis', isCorrect: true },
      { id: 'c', text: 'Dermis and hypodermis', isCorrect: false },
      { id: 'd', text: 'Papillary and reticular dermis', isCorrect: false }
    ],
    explanation: 'The basement membrane zone (BMZ) or dermal-epidermal junction (DEJ) separates the epidermis from the dermis. It contains type IV collagen, laminins, and anchoring structures. Defects here cause blistering diseases like bullous pemphigoid.',
    educationalObjective: 'Identify the dermal-epidermal junction',
    relatedStructures: ['epidermis', 'dermis'],
    examLevels: ['step1', 'step2']
  },
  {
    id: 'layer_papillary_reticular',
    type: 'layer_identification',
    difficulty: 'intermediate',
    prompt: 'Which dermis layer contains the majority of type I collagen organized in thick bundles?',
    options: [
      { id: 'a', text: 'Papillary dermis', isCorrect: false },
      { id: 'b', text: 'Reticular dermis', isCorrect: true },
      { id: 'c', text: 'Both equally', isCorrect: false },
      { id: 'd', text: 'Hypodermis', isCorrect: false }
    ],
    explanation: 'The reticular dermis contains dense irregular connective tissue with thick bundles of type I collagen. The papillary dermis is thinner, with loose connective tissue and more type III collagen.',
    educationalObjective: 'Distinguish papillary from reticular dermis',
    relatedStructures: ['dermis', 'collagen'],
    examLevels: ['step1']
  }
];

// ============================================================================
// FUNCTION MATCHING QUESTIONS
// ============================================================================
const FUNCTION_MATCHING_QUESTIONS: QuizQuestion[] = [
  {
    id: 'function_thermoregulation',
    type: 'function_matching',
    difficulty: 'beginner',
    prompt: 'Which structure is primarily responsible for thermoregulation through evaporative cooling?',
    options: [
      { id: 'a', text: 'Hair follicle', isCorrect: false },
      { id: 'b', text: 'Eccrine sweat gland', isCorrect: true },
      { id: 'c', text: 'Sebaceous gland', isCorrect: false },
      { id: 'd', text: 'Melanocyte', isCorrect: false }
    ],
    explanation: 'Eccrine sweat glands produce hypotonic sweat that evaporates from the skin surface, providing efficient cooling. They are found throughout the body, with highest density on palms, soles, and forehead.',
    educationalObjective: 'Understand the thermoregulatory function of eccrine glands',
    relatedStructures: ['sweat_gland'],
    examLevels: ['step1']
  },
  {
    id: 'function_uv_protection',
    type: 'function_matching',
    difficulty: 'beginner',
    prompt: 'Which cell type provides protection against ultraviolet radiation?',
    options: [
      { id: 'a', text: 'Keratinocyte', isCorrect: false },
      { id: 'b', text: 'Melanocyte', isCorrect: true },
      { id: 'c', text: 'Langerhans cell', isCorrect: false },
      { id: 'd', text: 'Merkel cell', isCorrect: false }
    ],
    explanation: 'Melanocytes produce melanin, which absorbs UV radiation and protects DNA from damage. Melanin is transferred to keratinocytes, where it forms a "cap" over the nucleus.',
    educationalObjective: 'Understand melanocyte function in photoprotection',
    relatedStructures: ['epidermis'],
    examLevels: ['step1']
  },
  {
    id: 'function_immune_surveillance',
    type: 'function_matching',
    difficulty: 'intermediate',
    prompt: 'Which cell type serves as the primary antigen-presenting cell of the epidermis?',
    options: [
      { id: 'a', text: 'Keratinocyte', isCorrect: false },
      { id: 'b', text: 'Melanocyte', isCorrect: false },
      { id: 'c', text: 'Langerhans cell', isCorrect: true },
      { id: 'd', text: 'Merkel cell', isCorrect: false }
    ],
    explanation: 'Langerhans cells are dendritic cells derived from bone marrow that reside in the epidermis. They capture antigens, migrate to lymph nodes, and present to T cells, initiating adaptive immune responses.',
    educationalObjective: 'Understand immune surveillance in the skin',
    relatedStructures: ['epidermis'],
    examLevels: ['step1', 'step2']
  },
  {
    id: 'function_tensile_strength',
    type: 'function_matching',
    difficulty: 'intermediate',
    prompt: 'Which dermal component provides tensile strength and resistance to stretching?',
    options: [
      { id: 'a', text: 'Elastin', isCorrect: false },
      { id: 'b', text: 'Type I collagen', isCorrect: true },
      { id: 'c', text: 'Hyaluronic acid', isCorrect: false },
      { id: 'd', text: 'Fibronectin', isCorrect: false }
    ],
    explanation: 'Type I collagen provides tensile strength (resistance to stretching/pulling forces). Elastin provides elastic recoil (returns skin to original shape). Both are important for skin mechanical properties.',
    educationalObjective: 'Distinguish the functions of collagen and elastin',
    relatedStructures: ['collagen', 'dermis'],
    examLevels: ['step1']
  }
];

// ============================================================================
// COMBINED QUIZ BANK
// ============================================================================
export const QUIZ_QUESTIONS: QuizQuestion[] = [
  ...STRUCTURE_IDENTIFICATION_QUESTIONS,
  ...CLINICAL_CORRELATION_QUESTIONS,
  ...BOARD_STYLE_QUESTIONS,
  ...PATHOLOGY_RECOGNITION_QUESTIONS,
  ...LAYER_IDENTIFICATION_QUESTIONS,
  ...FUNCTION_MATCHING_QUESTIONS
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get questions filtered by type
 */
export function getQuestionsByType(type: QuizQuestionType): QuizQuestion[] {
  return QUIZ_QUESTIONS.filter(q => q.type === type);
}

/**
 * Get questions filtered by difficulty
 */
export function getQuestionsByDifficulty(difficulty: DifficultyLevel): QuizQuestion[] {
  return QUIZ_QUESTIONS.filter(q => q.difficulty === difficulty);
}

/**
 * Get questions filtered by exam level
 */
export function getQuestionsByExamLevel(level: ExamLevel): QuizQuestion[] {
  return QUIZ_QUESTIONS.filter(q => q.examLevels?.includes(level));
}

/**
 * Get questions by type AND difficulty
 */
export function getQuestionsByTypeAndDifficulty(
  type: QuizQuestionType,
  difficulty: DifficultyLevel
): QuizQuestion[] {
  return QUIZ_QUESTIONS.filter(q => q.type === type && q.difficulty === difficulty);
}

/**
 * Get questions related to a specific structure
 */
export function getQuestionsForStructure(structureId: string): QuizQuestion[] {
  return QUIZ_QUESTIONS.filter(q =>
    q.targetStructureIds?.includes(structureId) ||
    q.relatedStructures?.includes(structureId)
  );
}

/**
 * Get questions related to a specific condition
 */
export function getQuestionsForCondition(conditionId: string): QuizQuestion[] {
  return QUIZ_QUESTIONS.filter(q =>
    q.relatedConditions?.includes(conditionId)
  );
}

/**
 * Get a random subset of questions
 */
export function getRandomQuestions(count: number, filter?: {
  type?: QuizQuestionType;
  difficulty?: DifficultyLevel;
}): QuizQuestion[] {
  let pool = [...QUIZ_QUESTIONS];

  if (filter?.type) {
    pool = pool.filter(q => q.type === filter.type);
  }
  if (filter?.difficulty) {
    pool = pool.filter(q => q.difficulty === filter.difficulty);
  }

  // Shuffle and take count
  const shuffled = pool.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

/**
 * Generate a quiz session with progressive difficulty
 * Optionally filter by exam level
 */
export function generateProgressiveQuiz(
  questionsPerLevel: number = 3,
  examLevel?: ExamLevel
): QuizQuestion[] {
  const levels: DifficultyLevel[] = ['beginner', 'intermediate', 'advanced', 'board_prep'];
  const session: QuizQuestion[] = [];

  for (const level of levels) {
    let pool = getQuestionsByDifficulty(level);

    // Filter by exam level if provided
    if (examLevel) {
      pool = pool.filter(q => q.examLevels?.includes(examLevel));
    }

    // Shuffle and take questionsPerLevel
    const shuffled = pool.sort(() => Math.random() - 0.5);
    session.push(...shuffled.slice(0, questionsPerLevel));
  }

  return session;
}

/**
 * Calculate score statistics
 */
export function calculateQuizStats(
  answers: { questionId: string; correct: boolean }[]
): {
  total: number;
  correct: number;
  percentage: number;
  byDifficulty: Record<DifficultyLevel, { total: number; correct: number }>;
  byType: Record<QuizQuestionType, { total: number; correct: number }>;
} {
  const stats = {
    total: answers.length,
    correct: answers.filter(a => a.correct).length,
    percentage: 0,
    byDifficulty: {} as Record<DifficultyLevel, { total: number; correct: number }>,
    byType: {} as Record<QuizQuestionType, { total: number; correct: number }>
  };

  stats.percentage = stats.total > 0 ? (stats.correct / stats.total) * 100 : 0;

  // Initialize
  const difficulties: DifficultyLevel[] = ['beginner', 'intermediate', 'advanced', 'board_prep'];
  const types: QuizQuestionType[] = ['structure_identification', 'clinical_correlation', 'board_style', 'pathology_recognition', 'layer_identification', 'function_matching'];

  difficulties.forEach(d => { stats.byDifficulty[d] = { total: 0, correct: 0 }; });
  types.forEach(t => { stats.byType[t] = { total: 0, correct: 0 }; });

  // Calculate
  for (const answer of answers) {
    const question = QUIZ_QUESTIONS.find(q => q.id === answer.questionId);
    if (question) {
      stats.byDifficulty[question.difficulty].total++;
      stats.byType[question.type].total++;
      if (answer.correct) {
        stats.byDifficulty[question.difficulty].correct++;
        stats.byType[question.type].correct++;
      }
    }
  }

  return stats;
}
