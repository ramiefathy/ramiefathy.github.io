import { StructureData } from './types';

export const STRUCTURE_CONTENT: Record<string, StructureData> = {
  'epidermis': {
    id: 'epidermis',
    title: 'Epidermis',
    layer: 'Epidermis',
    description: 'The outermost layer of skin, composed primarily of keratinocytes in various stages of differentiation. It provides a waterproof barrier, protects against pathogens, and regulates water loss from the body.',
    funFact: 'The epidermis has no blood vessels - it receives nutrients by diffusion from the dermis below.',
    learningObjectives: `• Identify the five strata of the epidermis (from deep to superficial): stratum basale, spinosum, granulosum, lucidum, corneum
• Explain how keratinocyte differentiation creates a protective barrier
• Describe the role of melanocytes, Langerhans cells, and Merkel cells
• Understand epidermal turnover time (~28 days) and clinical implications`,
    clinicalCorrelates: `HIGH-YIELD: Psoriasis shows accelerated epidermal turnover (3-5 days vs 28 days), causing silvery scale.

BOARD PEARL: Pemphigus vulgaris = intraepidermal blisters (anti-desmoglein antibodies); Bullous pemphigoid = subepidermal blisters (anti-hemidesmosome antibodies).

CLINICAL: Actinic keratoses arise from chronic UV damage to basal keratinocytes and are premalignant (can progress to SCC).`,
    references: ['Fitzpatrick\'s Dermatology, 9th Ed, Ch. 7', 'USMLE First Aid - Dermatology', 'Robbins Pathology, 10th Ed'],
    relatedConditions: ['psoriasis', 'eczema', 'acne']
  },
  'dermis': {
    id: 'dermis',
    title: 'Dermis',
    layer: 'Dermis',
    description: 'The thick middle layer of skin containing collagen and elastin fibers, blood vessels, nerves, hair follicles, and sweat glands. It provides strength, elasticity, and nourishment to the skin.',
    funFact: 'The dermis can be 10-40 times thicker than the epidermis depending on body location.',
    learningObjectives: `• Distinguish papillary dermis (loose CT, type III collagen) from reticular dermis (dense CT, type I collagen)
• Identify dermal appendages and their embryonic origins
• Explain the dermal-epidermal junction (DEJ) and its basement membrane components
• Describe wound healing phases: hemostasis, inflammation, proliferation, remodeling`,
    clinicalCorrelates: `HIGH-YIELD: Type I collagen defects = Osteogenesis Imperfecta; Type III collagen defects = Ehlers-Danlos (vascular type).

BOARD PEARL: Dermal papillae create the "rete ridges" pattern; loss of this pattern occurs in lichen sclerosus and can indicate pathology.

CLINICAL: Keloids result from excessive type I and III collagen deposition during wound healing, more common in darker skin types.`,
    references: ['Gray\'s Anatomy, 42nd Ed', 'Fitzpatrick\'s Dermatology, 9th Ed, Ch. 6', 'Wound Repair and Regeneration Journal'],
    relatedConditions: ['photoaging', 'psoriasis']
  },
  'hypodermis': {
    id: 'hypodermis',
    title: 'Hypodermis (Subcutis)',
    layer: 'Hypodermis',
    description: 'The deepest layer of skin, composed mainly of adipose tissue (fat cells). It insulates the body, cushions and protects underlying muscles and bones, and anchors the skin to underlying structures.',
    funFact: 'The hypodermis can store up to 50% of body fat and plays a major role in temperature regulation.',
    learningObjectives: `• Describe the composition of subcutaneous fat (white adipose tissue)
• Explain the role in thermoregulation and mechanical protection
• Identify septal structures that anchor skin to underlying fascia
• Understand subcutaneous drug administration pharmacokinetics`,
    clinicalCorrelates: `HIGH-YIELD: Panniculitis = inflammation of subcutaneous fat. Erythema nodosum is the most common form (septal panniculitis).

BOARD PEARL: Lipodermatosclerosis ("inverted champagne bottle" legs) = chronic venous insufficiency causing subcutaneous fibrosis.

CLINICAL: Lipomas arise from subcutaneous adipocytes; liposarcomas are rare malignant variants.`,
    references: ['Fitzpatrick\'s Dermatology, 9th Ed, Ch. 8', 'USMLE First Aid - Pathology', 'Andrews\' Diseases of the Skin'],
    relatedConditions: ['photoaging']
  },
  'stratum_corneum': {
    id: 'stratum_corneum',
    title: 'Stratum Corneum',
    layer: 'Epidermis',
    description: 'The outermost layer of the epidermis, consisting of dead cells (corneocytes) embedded in a lipid matrix. This layer serves as the primary barrier between the body and the environment.',
    funFact: 'Dust in your home is largely made up of dead skin cells from this layer.',
    learningObjectives: `• Describe the "brick and mortar" model (corneocytes + lipid lamellae)
• Explain the role of ceramides, cholesterol, and free fatty acids in barrier function
• Understand transepidermal water loss (TEWL) as a measure of barrier integrity
• Identify filaggrin's role in barrier formation and its clinical significance`,
    clinicalCorrelates: `HIGH-YIELD: Filaggrin mutations (FLG) are the strongest genetic risk factor for atopic dermatitis and ichthyosis vulgaris.

BOARD PEARL: "Brick and mortar" model - corneocytes are the bricks, intercellular lipids (ceramides, cholesterol, fatty acids) are the mortar.

CLINICAL: Impaired barrier function increases allergen penetration, explaining the atopic march (eczema → asthma → allergic rhinitis).`,
    references: ['Journal of Investigative Dermatology - Barrier Function Reviews', 'Fitzpatrick\'s Dermatology, 9th Ed, Ch. 7'],
    relatedConditions: ['eczema', 'psoriasis']
  },
  'keratinocytes': {
    id: 'keratinocytes',
    title: 'Keratinocytes',
    layer: 'Epidermis',
    description: 'The primary cell type of the epidermis (90-95%). They produce keratin proteins that provide strength and waterproofing to the skin, and undergo terminal differentiation as they migrate upward.',
    funFact: 'These cells migrate from the bottom of the epidermis to the top over a period of about 4 weeks.',
    learningObjectives: `• Trace keratinocyte differentiation from basal stem cells to corneocytes
• Identify keratin pairs expressed at each epidermal layer (K5/K14 basal, K1/K10 suprabasal)
• Explain the role of desmosomes and hemidesmosomes in cell adhesion
• Describe keratinocyte cytokine production in inflammatory responses`,
    clinicalCorrelates: `HIGH-YIELD: K5/K14 mutations = Epidermolysis Bullosa Simplex (basal layer blistering). K1/K10 mutations = Epidermolytic hyperkeratosis.

BOARD PEARL: Keratinocytes produce antimicrobial peptides (defensins, cathelicidins) - part of innate immunity.

CLINICAL: Squamous cell carcinoma arises from malignant transformation of keratinocytes; HPV oncoproteins E6/E7 drive this in some cases.`,
    references: ['USMLE First Aid - Cell Biology', 'Fitzpatrick\'s Dermatology, 9th Ed, Ch. 45', 'Molecular Biology of the Cell, 6th Ed'],
    relatedConditions: ['psoriasis', 'acne', 'eczema']
  },
  'hair_follicle': {
    id: 'hair_follicle',
    title: 'Hair Follicle',
    layer: 'Dermis',
    description: 'A mammalian skin organ that produces hair. The follicle contains stem cells in the bulge region, is connected to sebaceous glands, and cycles through growth phases.',
    funFact: 'Hair follicles go through cycles of growth (anagen), regression (catagen), and rest (telogen).',
    learningObjectives: `• Describe the hair cycle: anagen (2-7 years), catagen (2-3 weeks), telogen (3 months)
• Locate the bulge region and its role as a stem cell niche
• Explain the pilosebaceous unit (follicle + sebaceous gland + arrector pili)
• Identify androgen-sensitive vs androgen-independent hair`,
    clinicalCorrelates: `HIGH-YIELD: Androgenetic alopecia = miniaturization of androgen-sensitive follicles (vertex, frontal scalp). 5α-reductase converts testosterone → DHT.

BOARD PEARL: Alopecia areata = autoimmune attack on anagen hair bulb ("exclamation point hairs"). Associated with other autoimmune conditions.

CLINICAL: Telogen effluvium = synchronized shedding 2-3 months after stressor (illness, childbirth, surgery). Self-limiting.`,
    references: ['Fitzpatrick\'s Dermatology, 9th Ed, Ch. 85-87', 'JAAD Hair Biology Reviews', 'USMLE First Aid - Dermatology'],
    relatedConditions: ['acne']
  },
  'arrector_pili': {
    id: 'arrector_pili',
    title: 'Arrector Pili Muscle',
    layer: 'Dermis',
    description: 'Small smooth muscles attached to hair follicles in mammals. Contraction causes piloerection (goosebumps) and may help express sebum from sebaceous glands.',
    funFact: 'This reaction is a vestigial reflex from our hairier ancestors to appear larger or retain heat.',
    learningObjectives: `• Identify the arrector pili as smooth muscle (autonomic innervation)
• Explain sympathetic control via α-adrenergic receptors
• Describe the anatomical relationship with the hair follicle bulge region
• Understand the role in sebum secretion`,
    clinicalCorrelates: `HIGH-YIELD: Arrector pili are innervated by sympathetic nervous system - "fight or flight" causes piloerection.

BOARD PEARL: Pilomatricoma (pilomatrixoma) arises from hair matrix cells; shows "ghost cells" on histology.

CLINICAL: Arrector pili attachment to the bulge region may provide mechanical signals important for hair cycling.`,
    references: ['Gray\'s Anatomy, 42nd Ed', 'Fitzpatrick\'s Dermatology, 9th Ed, Ch. 5'],
    relatedConditions: []
  },
  'sweat_gland': {
    id: 'sweat_gland',
    title: 'Eccrine Sweat Gland',
    layer: 'Dermis',
    description: 'Coiled tubular glands that discharge hypotonic sweat directly onto the skin surface via a duct. Primary function is thermoregulation through evaporative cooling.',
    funFact: 'You have between 2 and 4 million sweat glands on your body.',
    learningObjectives: `• Distinguish eccrine (thermoregulation, palms/soles) from apocrine (axillae, groin, emotional sweating)
• Describe sweat composition (hypotonic, NaCl, urea, lactate)
• Explain cholinergic innervation of eccrine glands (sympathetic but uses ACh)
• Understand the reabsorption function of the sweat duct`,
    clinicalCorrelates: `HIGH-YIELD: Cystic fibrosis = defective CFTR chloride channel → elevated sweat chloride (>60 mEq/L diagnostic). "Sweat test" is diagnostic.

BOARD PEARL: Eccrine glands are innervated by sympathetic fibers but use acetylcholine (exception to sympathetic = norepinephrine rule).

CLINICAL: Hyperhidrosis (excessive sweating) can be treated with botulinum toxin (blocks ACh release) or aluminum chloride antiperspirants.`,
    references: ['USMLE First Aid - Physiology', 'Fitzpatrick\'s Dermatology, 9th Ed, Ch. 83', 'Robbins Pathology, 10th Ed'],
    relatedConditions: ['rosacea']
  },
  'blood_vessels': {
    id: 'blood_vessels',
    title: 'Blood Vessels',
    layer: 'Dermis',
    description: 'A network of arterioles, venules, and capillaries arranged in superficial and deep plexuses. Provides nutrients, removes waste, and critically regulates body temperature through vasodilation/vasoconstriction.',
    funFact: 'The skin holds about 25-30% of the body\'s blood volume at any given time.',
    learningObjectives: `• Describe the two horizontal plexuses: superficial (papillary) and deep (reticular/subcutaneous)
• Explain thermoregulatory control via arteriovenous anastomoses
• Identify the role of cutaneous vasculature in blood pressure regulation
• Understand endothelial cell function and angiogenesis`,
    clinicalCorrelates: `HIGH-YIELD: Vasculitis = inflammation of vessel walls. Leukocytoclastic vasculitis shows palpable purpura (non-blanching).

BOARD PEARL: Cutaneous small-vessel vasculitis involves postcapillary venules; shows "nuclear dust" (karyorrhexis) on histology.

CLINICAL: Rosacea involves dysregulated neurovascular control → flushing, persistent erythema, telangiectasias. Triggers include heat, alcohol, spicy food.`,
    references: ['Fitzpatrick\'s Dermatology, 9th Ed, Ch. 100-103', 'USMLE First Aid - Cardiovascular', 'Robbins Pathology, 10th Ed'],
    relatedConditions: ['rosacea', 'photoaging']
  },
  'collagen': {
    id: 'collagen',
    title: 'Collagen Matrix',
    layer: 'Dermis',
    description: 'The main structural protein in the dermal extracellular matrix, primarily type I (80-90%) and type III (10-20%). Provides tensile strength and is synthesized by fibroblasts.',
    funFact: 'Collagen production decreases about 1% per year after age 20, contributing to wrinkles.',
    learningObjectives: `• Describe collagen synthesis: procollagen → propeptide cleavage → tropocollagen → cross-linking
• Identify the role of vitamin C in hydroxylation of proline and lysine residues
• Distinguish collagen types: I (skin, bone), II (cartilage), III (blood vessels, fetal skin), IV (basement membrane)
• Explain MMP (matrix metalloproteinase) role in collagen degradation and remodeling`,
    clinicalCorrelates: `HIGH-YIELD: Scurvy (vitamin C deficiency) = impaired collagen cross-linking → poor wound healing, bleeding gums, perifollicular hemorrhage.

BOARD PEARL: Ehlers-Danlos syndrome types involve different collagen defects: classical (Type V collagen), vascular (Type III), kyphoscoliotic (lysyl hydroxylase).

CLINICAL: Photoaging involves UV-induced MMP upregulation → collagen degradation → wrinkles. Retinoids inhibit MMPs and stimulate new collagen.`,
    references: ['USMLE First Aid - Biochemistry', 'Fitzpatrick\'s Dermatology, 9th Ed, Ch. 62', 'Journal of Investigative Dermatology'],
    relatedConditions: ['photoaging']
  },
  'nerves': {
    id: 'nerves',
    title: 'Sensory Nerves',
    layer: 'Dermis',
    description: 'A network of sensory nerve fibers detecting touch, pressure, temperature, and pain. Includes free nerve endings (pain, temperature), Meissner corpuscles (light touch), Pacinian corpuscles (pressure/vibration), and Merkel cells (sustained pressure).',
    funFact: 'Your fingertips have about 2,500 receptors per square centimeter, one of the highest concentrations in the body.',
    learningObjectives: `• Classify mechanoreceptors: rapidly adapting (Meissner, Pacinian) vs slowly adapting (Merkel, Ruffini)
• Map dermatomes and understand referred sensation patterns
• Describe the types of nerve fibers: Aβ (touch), Aδ (fast pain, cold), C (slow pain, warmth)
• Explain the gate control theory of pain`,
    clinicalCorrelates: `HIGH-YIELD: Herpes zoster (shingles) follows dermatomal distribution because VZV reactivates from dorsal root ganglia.

BOARD PEARL: Meissner corpuscles (glabrous skin, light touch) vs Pacinian corpuscles (deep pressure, vibration) - both rapidly adapting but different depths.

CLINICAL: Diabetic neuropathy often presents as "stocking-glove" distribution, affecting longest nerves first (feet before hands).`,
    references: ['USMLE First Aid - Neurology', 'Gray\'s Anatomy, 42nd Ed', 'Fitzpatrick\'s Dermatology, 9th Ed, Ch. 94'],
    relatedConditions: ['eczema']
  },
  'adipose': {
    id: 'adipose',
    title: 'Adipose Tissue (Fat)',
    layer: 'Hypodermis',
    description: 'Loose connective tissue composed of adipocytes (white adipose tissue). Functions include energy storage, insulation, mechanical cushioning, and endocrine signaling.',
    funFact: 'Adipose tissue produces hormones like leptin (satiety), adiponectin (insulin sensitivity), and inflammatory cytokines.',
    learningObjectives: `• Distinguish white adipose tissue (energy storage, single large lipid droplet) from brown adipose tissue (thermogenesis, multiple droplets, UCP1)
• Describe adipokine signaling: leptin, adiponectin, resistin, TNF-α
• Explain lipogenesis vs lipolysis and hormonal regulation (insulin, catecholamines)
• Understand the metabolic syndrome connection to visceral adiposity`,
    clinicalCorrelates: `HIGH-YIELD: Leptin resistance in obesity → continued appetite despite high leptin levels. Leptin deficiency = rare cause of severe early-onset obesity.

BOARD PEARL: Lipodystrophies = loss of adipose tissue → insulin resistance, hepatic steatosis, hypertriglyceridemia (fat has nowhere to go).

CLINICAL: Subcutaneous fat injection (lipoatrophy) from insulin or HIV medications can be disfiguring; newer formulations and techniques minimize this.`,
    references: ['USMLE First Aid - Endocrinology', 'Fitzpatrick\'s Dermatology, 9th Ed, Ch. 8', 'New England Journal of Medicine - Adipose Tissue Reviews'],
    relatedConditions: ['photoaging']
  }
};

// High-yield clinical pearls for board exam preparation
export const CLINICAL_PEARLS: Record<string, string[]> = {
  'epidermis': [
    'Nikolsky sign positive = pemphigus vulgaris (intraepidermal); negative in bullous pemphigoid (subepidermal)',
    'Auspitz sign = pinpoint bleeding when psoriatic scale is removed (dilated capillaries in dermal papillae)',
    'Koebner phenomenon = lesions appearing at sites of trauma (psoriasis, lichen planus, vitiligo)',
    'Wickham striae = fine white lines on lichen planus papules'
  ],
  'dermis': [
    'Dermatofibroma = firm papule that dimples with lateral pressure ("dimple sign")',
    'Keloids extend beyond original wound borders; hypertrophic scars do not',
    'Striae (stretch marks) = dermal collagen disruption from rapid stretching or corticosteroids',
    'Morphea = localized scleroderma affecting dermis; systemic sclerosis affects internal organs'
  ],
  'hypodermis': [
    'Erythema nodosum = painful nodules on shins; most common panniculitis',
    'Causes of panniculitis: infections, sarcoidosis, IBD, medications, malignancy',
    'Subcutaneous fat necrosis of newborn = firm nodules after birth trauma; watch for hypercalcemia',
    'Lipomas are soft, mobile, and compress with pressure; liposarcomas are firmer and deeper'
  ],
  'stratum_corneum': [
    'Filaggrin gene (FLG) mutations are the strongest risk factor for atopic dermatitis',
    'Ichthyosis vulgaris = fine scaling on extensor surfaces; hyperlinear palms; FLG mutation',
    'Xerosis (dry skin) = decreased stratum corneum hydration; worse in winter, elderly',
    'Transepidermal water loss (TEWL) is elevated in atopic dermatitis and psoriasis'
  ],
  'keratinocytes': [
    'Acantholysis = loss of keratinocyte cohesion (pemphigus); acanthosis = epidermal thickening',
    'Dyskeratosis = abnormal keratinization; seen in Darier disease and squamous cell carcinoma',
    'Squamous cell carcinoma in situ = Bowen disease; full-thickness atypia without invasion',
    'HPV types 16, 18 = high-risk for malignancy; 6, 11 = condylomata (warts)'
  ],
  'hair_follicle': [
    'Anagen effluvium = hair loss during growth phase (chemotherapy); telogen effluvium = during rest phase',
    'Alopecia areata = "exclamation point" hairs at periphery; may recover spontaneously',
    'Trichotillomania = hair-pulling disorder; irregular patches, broken hairs at different lengths',
    'Female pattern hair loss = diffuse thinning with preserved frontal hairline'
  ],
  'sweat_gland': [
    'Eccrine glands are the only sweat glands on palms and soles',
    'Apocrine glands activate at puberty; body odor is from bacterial breakdown of apocrine sweat',
    'Fox-Fordyce disease = apocrine miliaria; itchy papules in axillae',
    'Hidradenitis suppurativa affects apocrine gland-bearing areas (axillae, groin, inframammary)'
  ],
  'blood_vessels': [
    'Palpable purpura = vasculitis until proven otherwise; non-blanching',
    'Livedo reticularis = net-like vascular pattern; can be benign or sign of vasculitis/hypercoagulability',
    'Spider angiomas = central arteriole with radiating vessels; common in pregnancy, liver disease',
    'Telangiectasias = dilated superficial vessels; seen in rosacea, hereditary hemorrhagic telangiectasia'
  ],
  'collagen': [
    'Vitamin C deficiency (scurvy) = impaired collagen hydroxylation → poor wound healing',
    'Retinoids stimulate collagen synthesis and inhibit MMPs; gold standard for photoaging',
    'Scar maturation takes 1-2 years; premature revision may worsen scarring',
    'Type IV collagen in basement membrane; Goodpasture syndrome = anti-type IV collagen antibodies'
  ],
  'nerves': [
    'Postherpetic neuralgia = persistent pain after shingles; more common in elderly',
    'Notalgia paresthetica = localized itch on upper back; associated with spinal nerve impingement',
    'Brachioradial pruritus = intense arm itching; often related to cervical spine disease',
    'Complex regional pain syndrome can follow trauma; involves skin changes, allodynia'
  ],
  'adipose': [
    'Dercum disease (adiposis dolorosa) = painful lipomas; affects overweight postmenopausal women',
    'Lipedema = symmetric fat accumulation in legs; spares feet; distinct from lymphedema',
    'Familial partial lipodystrophy = selective fat loss with insulin resistance',
    'Steroid-induced lipodystrophy = buffalo hump, moon facies, truncal obesity'
  ],
  // Disease-specific clinical pearls
  'vitiligo': [
    'Vitiligo shows complete melanocyte loss; Wood lamp accentuates depigmentation',
    'Segmental vitiligo (dermatomal) has better prognosis than generalized',
    'Koebner phenomenon occurs in 25-30% of vitiligo patients',
    'Associated autoimmune conditions: thyroiditis, pernicious anemia, Addison disease'
  ],
  'melanoma': [
    'ABCDE criteria: Asymmetry, Border irregularity, Color variation, Diameter >6mm, Evolution',
    'Breslow thickness is the most important prognostic factor (>4mm = poor prognosis)',
    'Clark levels: I (epidermis), II (papillary dermis), III (junction), IV (reticular), V (fat)',
    'Sentinel lymph node biopsy indicated for Breslow >0.8mm or ulceration'
  ],
  'bcc': [
    'Most common skin cancer; rarely metastasizes (<0.5%) despite local invasion',
    'Classic "pearly papule" with rolled borders and telangiectasias',
    'Subtypes: nodular (60%), superficial (30%), morpheaform/infiltrative (5-10%)',
    'PTCH1 gene mutation in sporadic BCC; Gorlin syndrome = multiple BCCs + odontogenic keratocysts'
  ],
  'urticaria': [
    'Wheals last <24 hours; if >24h with residual purpura, consider urticarial vasculitis',
    'Type I hypersensitivity with mast cell degranulation and histamine release',
    'Chronic urticaria (>6 weeks) is often idiopathic; workup for thyroid autoantibodies',
    'Angioedema involves deeper dermis/subcutis; check C4 for hereditary angioedema'
  ],
  'contact_dermatitis': [
    'Allergic contact dermatitis = Type IV delayed hypersensitivity (48-72h)',
    'Patch testing identifies specific allergens; top 5: nickel, fragrance, formaldehyde, cobalt, balsam of Peru',
    'Geometric/linear distribution suggests external contact pattern',
    'Irritant contact dermatitis is more common but non-immune mediated'
  ]
};

// USMLE Step 1 high-yield facts organized by structure
export const HIGH_YIELD_FACTS: Record<string, string[]> = {
  'epidermis': [
    'Derived from ectoderm; dermis and hypodermis from mesoderm',
    'Melanocytes derive from neural crest cells',
    'Langerhans cells are dendritic antigen-presenting cells (from bone marrow)',
    'Merkel cells are neuroendocrine mechanoreceptors in stratum basale'
  ],
  'dermis': [
    'Papillary dermis = loose connective tissue (type III collagen)',
    'Reticular dermis = dense irregular connective tissue (type I collagen)',
    'Mast cells release histamine, tryptase; involved in urticaria, anaphylaxis',
    'Ground substance contains glycosaminoglycans (hyaluronic acid, chondroitin sulfate)'
  ],
  'keratinocytes': [
    'K5/K14 (basal layer) → K1/K10 (suprabasal layers)',
    'Terminal differentiation involves formation of cornified envelope',
    'Desmosomes (cell-cell) use desmogleins and desmocollins',
    'Hemidesmosomes (cell-basement membrane) use integrin α6β4 and type XVII collagen'
  ],
  'sweat_gland': [
    'Eccrine: cholinergic (ACh), thermoregulation, hypotonic sweat',
    'Apocrine: adrenergic, emotional stress, empties into hair follicle',
    'CFTR chloride channel in sweat duct; mutated in cystic fibrosis',
    'Sweat test: Cl⁻ >60 mEq/L = cystic fibrosis'
  ],
  'blood_vessels': [
    'AV anastomoses in acral skin (fingertips, ears) for temperature regulation',
    'Cutaneous vasculature can hold up to 8% of cardiac output',
    'Endothelial cells produce nitric oxide (vasodilation), endothelin (vasoconstriction)',
    'VEGF drives angiogenesis; target for anti-tumor therapies'
  ],
  'collagen': [
    'Collagen synthesis: Gly-X-Y repeat; hydroxyproline and hydroxylysine require vitamin C',
    'Cross-linking by lysyl oxidase (requires copper)',
    'Type I: most abundant, skin/bone; Type III: blood vessels, early wound healing',
    'Type IV: basement membranes; Type VII: anchoring fibrils (mutated in dystrophic EB)'
  ],
  // Disease-specific high-yield facts
  'vitiligo': [
    'Autoimmune destruction of melanocytes by cytotoxic CD8+ T cells',
    'Histology: complete absence of melanocytes on Melan-A/MART-1 staining',
    'Treatment: topical steroids, calcineurin inhibitors, NB-UVB phototherapy',
    'Repigmentation occurs from hair follicle melanocyte reservoir (perifollicular pattern)'
  ],
  'melanoma': [
    'Risk factors: UV exposure, fair skin, >50 nevi, family history, CDKN2A mutation',
    'Histology: asymmetric proliferation, pagetoid spread, mitoses, lack of maturation',
    'Staging uses AJCC TNM; Breslow thickness determines T stage',
    'Treatment: surgical excision with margins based on thickness; immunotherapy for advanced'
  ],
  'bcc': [
    'Arises from basal layer keratinocytes or hair follicle bulge cells',
    'Histology: basaloid cells with peripheral palisading, retraction artifact, mucinous stroma',
    'Hedgehog pathway mutations (PTCH1, SMO) drive pathogenesis',
    'Treatment: excision, Mohs surgery (high-risk), vismodegib for advanced/metastatic'
  ],
  'urticaria': [
    'Mast cell activation releases histamine, prostaglandins, leukotrienes',
    'Dermal edema from increased vascular permeability (histamine on H1 receptors)',
    'Antihistamines are first-line; omalizumab (anti-IgE) for refractory chronic urticaria',
    'Physical urticarias: dermographism, cold, cholinergic, solar, pressure'
  ],
  'contact_dermatitis': [
    'Allergic CD: Langerhans cells present hapten to T cells → memory response',
    'Histology: spongiosis, lymphocytic infiltrate, eosinophils in early phase',
    'Patch test: allergen applied 48h, read at 48h and 96h',
    'Treatment: allergen avoidance, topical steroids, barrier repair'
  ]
};