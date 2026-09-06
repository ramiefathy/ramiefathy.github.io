/* Rheum–Derm Immune Atlas P0 scientific-integrity remediation.
 * Loaded after the explorer renderers and before atlas initialization.
 * This layer narrows the default graph to synthesis-explicit (not independently validated)
 * phenotype links, quarantines invalid generated mappings, and makes optional
 * exploratory/canonical-background layers user controlled.
 */
(() => {
  'use strict'

  const REMEDIATION_VERSION = '2026-08-03-p0.3'
  const DEFAULT_ORIGINS = new Set(['source-explicit'])
  const VASCULITIS_ENDOTYPES = ['aav', 'egpa', 'gca', 'immune_complex_vasculitis']

  const normalize = value => String(value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[α]/g, 'alpha')
    .replace(/[β]/g, 'beta')
    .replace(/[γ]/g, 'gamma')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()

  const clone = value => JSON.parse(JSON.stringify(value))
  const unique = values => [...new Set(values.filter(Boolean))]

  function replacePattern(domainKey, patterns) {
    const domain = MANIFEST_BY_KEY[domainKey]
    if (!domain) throw new Error(`Missing manifestation domain: ${domainKey}`)
    domain.patterns = patterns
  }

  function addManifestDomain(domain, beforeKey = 'other') {
    if (MANIFEST_BY_KEY[domain.key]) return MANIFEST_BY_KEY[domain.key]
    const at = MANIFEST_ONTOLOGY.findIndex(item => item.key === beforeKey)
    MANIFEST_ONTOLOGY.splice(at < 0 ? MANIFEST_ONTOLOGY.length : at, 0, domain)
    MANIFEST_BY_KEY[domain.key] = domain
    const orderAt = DOMAIN_ORDER.indexOf(beforeKey)
    DOMAIN_ORDER.splice(orderAt < 0 ? DOMAIN_ORDER.length : orderAt, 0, domain.key)
    return domain
  }

  function remediateManifestOntology() {
    addManifestDomain({ key: 'granulomatous_necrobiotic', label: 'Necrobiotic / palisading granulomatous lesions', color: '#c2674a', patterns: ['rheumatoid nodule', 'palisading', 'necrobi'] }, 'cutaneous')
    addManifestDomain({ key: 'purpuric_vascular', label: 'Purpura / small-vessel cutaneous injury', color: '#c026d3', patterns: ['palpable purpura', 'retiform purpura', '\\bpurpura\\b'] }, 'ulceration')
    addManifestDomain({ key: 'otologic', label: 'Otologic / audiovestibular disease', color: '#0891b2', patterns: ['hearing loss', 'audiovestibular', 'sensorineural'] }, 'neurologic')
    addManifestDomain({ key: 'atrophy', label: 'Atrophy / tissue loss', color: '#a78bfa', patterns: ['\\batrophy\\b', 'atrophic'] }, 'fibrosis')
    addManifestDomain({ key: 'calcification', label: 'Calcinosis / mineral deposition', color: '#f0e442', patterns: ['calcinosis', 'calcification', 'mineral deposition'] }, 'fibrosis')
    addManifestDomain({ key: 'thromboinflammatory_crisis', label: 'Systemic thromboinflammatory crisis', color: '#991b1b', patterns: ['catastrophic aps', 'catastrophic antiphospholipid'] }, 'systemic')
    addManifestDomain({ key: 'trigger_response', label: 'Trigger-linked inflammatory attacks', color: '#116a4d', patterns: ['cold-triggered', 'triggered attack'] }, 'other')
    addManifestDomain({ key: 'syndromic_overlap', label: 'Syndromic overlap phenotype', color: '#006da6', patterns: ['papa', 'pash', 'papash', 'syndromic'] }, 'other')

    replacePattern('cutaneous', ['\\bcle\\b', 'plaque psoriasis', 'papul', 'poikiloderma', 'heliotrope', 'gottron', 'erythema nodosum', 'pernio', 'photosens', 'pustulosis', '\\bacne\\b', 'urticaria', '\\brash\\b', 'palmar erythema', 'lilac ring'])
    replacePattern('neutrophilic', ['neutrophil', 'pustul', 'abscess', '\\bsweet\\b', 'pyoderma', 'suppurat', 'drain', 'tunnel', 'papulopust'])
    replacePattern('ulceration', ['\\bulcer', 'tissue loss', 'necrosis'])
    replacePattern('fibrosis', ['fibro', 'sclero', 'skin thick', 'scarr', 'contracture', 'collagen'])
    replacePattern('appendage', ['alopecia', '\\bnail\\b'])
    replacePattern('neurologic', ['neurolog', 'neurovascular', 'neuropath', '\\bcns\\b', 'meningitis', 'mononeuritis'])
    replacePattern('vascular', ['vascular', 'vasculitis', 'vasculopathy', 'raynaud', 'digital ischem', 'digital ulcer', 'thromb', 'aneurysm', 'livedo', 'ischemi', 'endothelial', '\\bpah\\b', 'pulmonary arterial hypertension', 'microangiopathy', 'capillaritis'])
  }

  const VASCULITIS_CONDITIONS = [
    {
      id: 'aav', name: 'ANCA-associated vasculitis (GPA / MPA)', abbr: 'AAV', group: 'Vasculitis', color: '#be123c',
      one_liner: 'PR3- or MPO-ANCA–associated necrotizing small-vessel vasculitis driven by neutrophil activation and alternative-complement amplification.',
      physiology: 'Neutrophils and complement normally clear pathogens without attacking quiescent small-vessel endothelium.',
      pathophysiology: 'Inflammatory priming exposes PR3 or MPO; ANCA ligation activates adherent neutrophils, while C5a provides a self-amplifying recruitment loop that injures capillaries, venules and arterioles.',
      manifestations: ['Palpable purpura', 'Skin ulcers', 'Mononeuritis multiplex', 'Glomerulonephritis', 'Pulmonary hemorrhage'],
      biomarkers: ['PR3-ANCA or MPO-ANCA', 'Urinalysis/creatinine', 'Chest imaging', 'Biopsy when feasible', 'Disease-specific activity assessment'],
      pearls: ['ANCA specificity and clinical phenotype both matter.', 'C5aR1 mechanism evidence is separate from avacopan efficacy; the archived ADVOCATE claim is quarantined.', 'Organ-threatening renal or pulmonary disease requires prompt combination therapy.'],
      flow: ['Inflammatory priming', 'PR3/MPO surface expression', 'ANCA–Fc receptor activation', 'C5a amplification', 'Necrotizing small-vessel injury', 'Renal, pulmonary, neural and cutaneous disease'],
      refs: ['R28', 'R53', 'V03', 'V04']
    },
    {
      id: 'egpa', name: 'Eosinophilic granulomatosis with polyangiitis', abbr: 'EGPA', group: 'Vasculitis', color: '#d55e00',
      one_liner: 'An eosinophilic and variably ANCA-associated vasculitis linking asthma, type-2 inflammation and organ-specific vasculitic injury.',
      physiology: 'Eosinophils support barrier defense but normally undergo controlled turnover after allergen or parasite responses.',
      pathophysiology: 'IL-5–dependent eosinophil expansion and tissue recruitment coexist with variable MPO-ANCA–associated neutrophil injury, producing eosinophilic, granulomatous and vasculitic disease domains.',
      manifestations: ['Palpable purpura', 'Asthma/eosinophilia', 'Mononeuritis multiplex', 'Pulmonary infiltrates', 'Cardiac involvement'],
      biomarkers: ['Absolute eosinophil count', 'MPO-ANCA in a subset', 'IgE', 'Cardiac biomarkers/imaging when indicated', 'Pulmonary assessment'],
      pearls: ['Eosinophilic inflammation and ANCA-mediated vasculitis are related but non-identical domains.', 'Anti–IL-5/IL-5R therapy is most directly validated for relapsing eosinophilic/asthma-predominant disease.', 'Severe cardiac, renal or neurologic disease may require broader induction therapy.'],
      flow: ['Type-2/eosinophilic predisposition', 'IL-5–dependent eosinophil survival', 'Tissue eosinophilia ± MPO-ANCA', 'Endothelial and organ injury', 'Asthma, neuropathy and systemic disease'],
      refs: ['R33', 'R34', 'R35']
    },
    {
      id: 'gca', name: 'Giant-cell arteritis (cranial or large-vessel)', abbr: 'GCA', group: 'Vasculitis', color: '#e11d48',
      one_liner: 'Granulomatous large- and medium-artery inflammation organized by vessel dendritic cells, Th1/Th17 programs, macrophages and IL-6.',
      physiology: 'Large arteries maintain immune quiescence while preserving elastic integrity, perfusion and adaptive remodeling.',
      pathophysiology: 'Vessel-wall dendritic activation recruits CD4 T cells and macrophages; IL-6 drives systemic inflammation while IFN-γ and growth-factor programs contribute to intimal hyperplasia and ischemia.',
      manifestations: ['Cranial ischemia', 'Scalp tenderness', 'Jaw claudication', 'Large-vessel inflammation', 'Polymyalgia rheumatica'],
      biomarkers: ['CRP/ESR before IL-6 blockade', 'Temporal/axillary ultrasound', 'CTA/MRA/PET when indicated', 'Temporal artery biopsy in selected cases'],
      pearls: ['Cranial ischemic risk requires immediate treatment.', 'IL-6 blockade suppresses CRP, so clinical and imaging assessment remain important.', 'Large-vessel and cranial phenotypes can diverge.'],
      flow: ['Arterial dendritic activation', 'Th1/Th17 recruitment', 'Macrophage and IL-6 amplification', 'Intimal hyperplasia and wall injury', 'Cranial or large-vessel ischemia'],
      refs: ['R30', 'R31', 'R32']
    },
    {
      id: 'immune_complex_vasculitis', name: 'Immune-complex small-vessel vasculitis', abbr: 'ICV', group: 'Vasculitis', color: '#006da6',
      one_liner: 'Immune-complex small-vessel injury is heterogeneous. Complement pathways differ by immune reactant; IgA vasculitis must not be assigned a universal classical-pathway mechanism.',
      physiology: 'Circulating immune complexes are normally cleared without persistent deposition in postcapillary venules or glomeruli.',
      pathophysiology: 'Persistent antigen–antibody complexes deposit in susceptible vascular beds, activate complement and recruit neutrophils, producing purpura, ulceration and organ-specific immune-complex injury.',
      manifestations: ['Palpable purpura', 'Livedo', 'Skin ulcers', 'Glomerulonephritis', 'Arthralgia'],
      biomarkers: ['Complement levels', 'Cryoglobulins', 'Serum/urine protein studies when indicated', 'Urinalysis/creatinine', 'Direct immunofluorescence/biopsy'],
      pearls: ['Identify and treat the underlying trigger or clonal/infectious driver when present.', 'Purpura does not by itself imply ulceration or tissue loss.', 'Therapy depends on cause and organ threat rather than a single generic vasculitis algorithm.'],
      flow: ['Persistent antigen or clone', 'Immune-complex formation', 'Vascular deposition', 'Immune-reactant-dependent complement pathways', 'Neutrophilic small-vessel injury', 'Purpura, ulcers or glomerulonephritis'],
      refs: ['R53', 'V05']
    }
  ]

  function splitVasculitisEndotypes() {
    const originalIndex = DATA.conditions.findIndex(condition => condition.id === 'vasculitis')
    if (originalIndex < 0) return

    DATA.conditions.splice(originalIndex, 1, ...VASCULITIS_CONDITIONS.map(clone))
    delete COND.vasculitis
    VASCULITIS_CONDITIONS.forEach(condition => { COND[condition.id] = DATA.conditions.find(item => item.id === condition.id) })

    CONDITION_CLUSTERS.forEach(cluster => {
      const at = cluster.conditions.indexOf('vasculitis')
      if (at >= 0) cluster.conditions.splice(at, 1, ...VASCULITIS_ENDOTYPES)
    })

    delete CONDITION_SUBTYPES.vasculitis
    Object.assign(CONDITION_SUBTYPES, {
      aav: { summary: 'ANCA specificity, relapse biology and organ threat define practical AAV phenotypes.', items: [['PR3-AAV / GPA spectrum', 'Granulomatous upper-airway or pulmonary disease with higher relapse propensity.'], ['MPO-AAV / MPA spectrum', 'Renal-predominant or fibrotic-lung-associated patterns are common.'], ['Organ-threatening capillaritis', 'Rapidly progressive glomerulonephritis or diffuse alveolar hemorrhage.']] },
      egpa: { summary: 'Eosinophilic and vasculitic domains should be assessed separately.', items: [['Eosinophilic/asthma-predominant', 'Asthma, sinonasal disease and eosinophilic tissue inflammation dominate.'], ['ANCA/vasculitic-predominant', 'Neuropathy, glomerulonephritis or purpura may be more prominent.'], ['Cardiac-predominant', 'Myocardial or pericardial involvement drives urgency and monitoring.']] },
      gca: { summary: 'Cranial and extracranial large-vessel phenotypes overlap but require independent surveillance.', items: [['Cranial GCA', 'Temporal, ophthalmic and other cranial arterial inflammation with ischemic risk.'], ['Large-vessel GCA', 'Aortic and branch-vessel inflammation, stenosis or aneurysmal complications.'], ['PMR-associated', 'Polymyalgia symptoms coexist with overt or occult arterial inflammation.']] },
      immune_complex_vasculitis: { summary: 'The deposited immune reactant and underlying driver determine prognosis and treatment.', items: [['IgA vasculitis', 'IgA-dominant small-vessel disease with skin, joint, gastrointestinal or renal involvement.'], ['Cryoglobulinemic vasculitis', 'Immune-complex disease associated with infection, autoimmunity or B-cell clones.'], ['Other cutaneous immune-complex vasculitis', 'Drug-, infection- or autoimmune-associated patterns with variable systemic involvement.']] }
    })

    const pathwayScope = pathway => {
      const text = normalize(`${pathway.family} ${pathway.axis}`)
      if (text.includes('eosinoph') || text.includes('il 5')) return 'egpa'
      if (text.includes('arterial wall') || text.includes('giant cell') || text.includes('large vessel')) return 'gca'
      if (text.includes('immune complex') || text.includes('iga') || text.includes('cryoglob')) return 'immune_complex_vasculitis'
      return 'aav'
    }
    DATA.pathways.filter(pathway => pathway.condition === 'vasculitis').forEach(pathway => {
      pathway.condition = pathwayScope(pathway)
      pathway.endotypeScope = pathway.condition
      if (pathway.condition === 'immune_complex_vasculitis') {
        pathway.axis = 'IgA / cryoglobulin / other immune complexes; immune-reactant-dependent complement pathways'
        pathway.role = 'Complement findings differ by endotype. IgA vasculitis proteomic evidence implicates lectin and alternative pathways; it is not proof of uniform classical-pathway activation or a treatment effect.'
        pathway.refs = unique([...pathway.refs.filter(id => id !== 'R28'), 'V05'])
      }
    })

    const effectScope = {
      ritux: 'aav', cyc: 'aav', avacopan: 'aav', mtx: 'aav', aza: 'aav',
      tociliz: 'gca', jaki: 'gca', mepo: 'egpa', benra: 'egpa', dapsone: 'immune_complex_vasculitis'
    }
    const sourceVasculitisEffects = DATA.effects.filter(effect => effect.condition === 'vasculitis')
    const rewrittenEffects = []
    const rejectedEffects = []
    let acceptedSourceEffects = 0
    DATA.effects.forEach(effect => {
      if (effect.condition !== 'vasculitis') { rewrittenEffects.push(effect); return }
      if (effect.med === 'systemic_gc') {
        acceptedSourceEffects += 1
        // R28 is an AAV guideline. Do not clone its grade or benefit into other endotypes.
        rewrittenEffects.push({ ...clone(effect), condition: 'aav', endotypeScope: 'aav',
          manifestations: 'Glucocorticoids within an AAV induction regimen; severity and regimen must be specified',
          originalManifestations: effect.manifestations,
          caveat: `${effect.caveat || ''} Scoped to AAV; this row does not establish efficacy or dosing in EGPA, GCA, or immune-complex vasculitis.`.trim() })
        return
      }
      const condition = effectScope[effect.med]
      if (condition) {
        acceptedSourceEffects += 1
        rewrittenEffects.push({ ...effect, condition, endotypeScope: condition })
        return
      }
      rejectedEffects.push({ ...clone(effect), rejectionReason: `No vasculitis endotype scope is defined for medication ${effect.med}.` })
    })
    DATA.effects.splice(0, DATA.effects.length, ...rewrittenEffects)
    DATA.rejectedEffects = [...(DATA.rejectedEffects || []), ...rejectedEffects]
    if (acceptedSourceEffects + rejectedEffects.length !== sourceVasculitisEffects.length) {
      throw new Error('Vasculitis treatment-effect accounting is incomplete')
    }

    DATA.manifestationLinks.forEach(link => {
      if (link.condition !== 'vasculitis') return
      const pathway = DATA.pathways[link.pathIndex]
      link.condition = pathway?.condition || 'aav'
      link.endotypeScope = link.condition
    })

    DATA.meta.vasculitisEndotypeContract = {
      umbrellaRetainedForNavigation: false,
      endotypes: VASCULITIS_ENDOTYPES,
      sourceTreatmentEffects: sourceVasculitisEffects.length,
      acceptedSourceTreatmentEffects: acceptedSourceEffects,
      rejectedTreatmentEffects: rejectedEffects.length,
      treatmentEffectAccountingComplete: acceptedSourceEffects + rejectedEffects.length === sourceVasculitisEffects.length,
      rule: 'Subtype-specific pathways and outcomes do not propagate across AAV, EGPA, GCA/LVV and immune-complex vasculitis.'
    }
  }

  const SOURCE_SYNONYMS = {
    'Plaque psoriasis': ['plaques', 'plaque psoriasis'],
    'Nail dystrophy': ['nail disease', 'nail dystrophy'],
    'Peripheral arthritis': ['peripheral arthritis', 'synovitis'],
    'Enthesitis': ['enthesitis'],
    'Dactylitis': ['dactylitis'],
    'Axial disease': ['axial disease', 'axial symptoms'],
    'Acute/subacute/chronic CLE': ['cle', 'cutaneous lupus'],
    'Photosensitivity': ['photosensitive skin', 'photosensitivity'],
    'Cytopenias': ['cytopenias'],
    'Nephritis': ['nephritis'],
    'Heliotrope/Gottron eruption': ['heliotrope', 'gottron'],
    'Photosensitive poikiloderma': ['poikiloderma'],
    'Proximal weakness': ['weakness', 'myofiber injury'],
    'Dysphagia': ['dysphagia'],
    'Interstitial lung disease': ['ild', 'interstitial lung disease'],
    'Vasculopathy': ['vasculopathy'],
    'Raynaud phenomenon': ['raynaud'],
    'Digital ulcers': ['digital ulcers'],
    'Skin thickening': ['skin fibrosis', 'skin thickening'],
    'Inflammatory lilac-ring plaques': ['inflammatory border', 'lilac ring'],
    'Sclerotic plaques': ['plaque sclerosis', 'sclerotic plaques'],
    'Joint contracture': ['contracture'],
    'Oral aphthae': ['oral ulcers', 'oral aphthae', 'mucosal ulcers'],
    'Genital ulcers': ['genital ulcers', 'mucosal ulcers'],
    'Papulopustules': ['papulopustules'],
    'Erythema nodosum-like lesions': ['erythema nodosum', 'skin disease'],
    'Uveitis': ['uveitis'],
    'Neurologic/GI disease': ['neurologic disease', 'gi disease'],
    'Venous/arterial disease': ['venous thrombosis', 'arterial disease', 'aneurysm'],
    'Inflammatory nodules': ['inflammatory nodules', 'nodules'],
    'Abscesses': ['abscesses'],
    'Draining tunnels': ['tunnels', 'tunnel activity'],
    'Pain': ['pain'],
    'Rheumatoid vasculitis': ['rheumatoid vasculitis', 'vasculitis'],
    'Leg ulcers': ['ulcers'],
    'Rheumatoid nodules': ['rheumatoid nodules'],
    'Neutrophilic dermatosis': ['rheumatoid neutrophilic dermatosis', 'neutrophilic dermatosis'],
    'Pyoderma gangrenosum association': ['pg association', 'pyoderma gangrenosum'],
    'Palpable purpura': ['palpable purpura', 'purpura'],
    'Skin ulcers': ['skin ulcers', 'ulcers'],
    'Mononeuritis multiplex': ['neuropathy', 'mononeuritis multiplex'],
    'Glomerulonephritis': ['glomerulonephritis'],
    'Pulmonary hemorrhage': ['pulmonary capillaritis', 'pulmonary hemorrhage'],
    'Asthma/eosinophilia': ['egpa asthma', 'asthma', 'eosinophilic tissue disease'],
    'Large-vessel inflammation': ['large-vessel inflammation', 'giant-cell arteritis'],
    'Cranial ischemia': ['cranial ischemia'],
    'Livedo': ['livedo'],
    'Lupus pernio': ['lupus pernio'],
    'Pulmonary disease': ['pulmonary', 'lung'],
    'Quotidian fever': ['fever'],
    'Evanescent salmon rash': ['rash'],
    'Arthritis': ['arthritis'],
    'Hepatitis': ['hepatitis'],
    'MAS': ['mas', 'macrophage activation syndrome'],
    'Chronic nonpruritic urticaria': ['urticaria'],
    'Recurrent fever': ['fever'],
    'Bone pain': ['bone pain'],
    'Elevated CRP/SAA': ['elevated inflammatory markers', 'crp', 'saa'],
    'Anterior chest-wall osteitis': ['osteitis'],
    'Hyperostosis': ['hyperostosis'],
    'Palmoplantar pustulosis': ['palmoplantar pustulosis'],
    'Severe acne': ['acne'],
    'Auricular chondritis sparing lobule': ['auricular chondritis', 'chondritis'],
    'Nasal chondritis': ['nasal chondritis', 'chondritis'],
    'Airway chondritis': ['airway chondritis', 'airway inflammation'],
    'Nonerosive arthritis': ['arthritis'],
    'Ocular inflammation': ['ocular disease', 'ocular inflammation'],
    'Sweet plaques': ['sweet plaques'],
    'Pyoderma gangrenosum ulcers': ['pg ulcers', 'pyoderma gangrenosum'],
    'Parotid enlargement': ['gland enlargement', 'parotid enlargement'],
    'Cutaneous vasculitis': ['vasculitis'],
    'Lymphoma risk': ['lymphoma risk'],
    'Neuropathy': ['neuropathy'],
    'Dry mouth': ['dry mouth'],
    'Urticaria-like rash': ['urticaria-like rash', 'rash'],
    'Fever': ['fever'],
    'Arthralgia': ['arthralgia'],
    'Conjunctivitis': ['eye inflammation', 'conjunctivitis'],
    'Sensorineural hearing loss': ['hearing loss'],
    'Aseptic meningitis': ['cns inflammation', 'meningitis'],
    'Bony overgrowth': ['bony overgrowth'],
    'Livedo racemosa': ['livedo'],
    'Venous/arterial thrombosis': ['arterial/venous thrombosis', 'macrovascular thrombosis', 'thrombosis'],
    'Pregnancy morbidity': ['obstetric morbidity', 'obstetric aps'],
    'Catastrophic APS': ['catastrophic aps'],
    'Retiform purpura': ['retiform purpura']
  }

  const GENERIC_SPANS = new Set([
    'skin', 'cutaneous', 'skin disease', 'mucocutaneous', 'systemic', 'systemic activity', 'systemic disease',
    'vascular disease', 'organ injury', 'all manifestations', 'all caps manifestations', 'all major inflammatory manifestations',
    'all major domains', 'disease activity', 'some skin disease', 'selected skin', 'phenotype specific skin', 'inflammation'
  ].map(normalize))

  const GENERIC_SOURCE_CANDIDATES = new Set([
    'ulcers', 'pain', 'vasculitis', 'rash', 'fever', 'pulmonary', 'lung', 'arthritis',
    'mucosal ulcers', 'chondritis', 'livedo', 'urticaria', 'neuropathy', 'hearing loss',
    'pyoderma gangrenosum', 'purpura', 'thrombosis', 'weakness', 'nodules', 'asthma'
  ].map(normalize))

  const escapeRegExp = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const containsWholePhrase = (value, phrase) => new RegExp(`(?:^| )${escapeRegExp(phrase)}(?: |$)`).test(value)

  function sourceSpanFor(link, pathway) {
    const assertion = String(pathway?.manifestations || '')
    if (!assertion) return ''
    const primaryCandidate = normalize(link.manifestation)
    const candidates = [link.manifestation, ...(SOURCE_SYNONYMS[link.manifestation] || [])]
      .map(normalize)
      .filter(candidate => candidate && !GENERIC_SPANS.has(candidate))
    const segments = assertion.split(/;|,(?=\s*[A-Za-z])/).map(segment => segment.trim()).filter(Boolean)
    for (const segment of segments) {
      const normalizedSegment = normalize(segment)
      if (!normalizedSegment || GENERIC_SPANS.has(normalizedSegment)) continue
      for (const candidate of candidates) {
        if (normalizedSegment === candidate) {
          if (candidate === primaryCandidate || !GENERIC_SOURCE_CANDIDATES.has(candidate)) return segment
          continue
        }
        if (GENERIC_SOURCE_CANDIDATES.has(candidate)) continue
        if (containsWholePhrase(normalizedSegment, candidate)) return segment
      }
    }
    return ''
  }

  const CURATED_DECISIONS = {
      'aav|neutrophil|Palpable purpura': 'ANCA-activated neutrophil small-vessel injury is curator-confirmed for cutaneous purpura in AAV; no claim is made for every livedoid or ischemic phenotype.',
      'aav|neutrophil|Glomerulonephritis': 'ANCA-neutrophil capillaritis is curator-confirmed for pauci-immune glomerulonephritis.',
      'aav|neutrophil|Pulmonary hemorrhage': 'ANCA-neutrophil capillaritis is curator-confirmed for diffuse alveolar hemorrhage.',
      'aav|complement|Glomerulonephritis': 'Alternative-complement/C5a amplification is curator-confirmed as a contributor to AAV organ injury; magnitude is not inferred from avacopan response alone.',
      'egpa|eosinophil|Asthma/eosinophilia': 'IL-5–dependent eosinophil biology is curator-confirmed for the eosinophilic/asthma domain of EGPA, distinct from ANCA-mediated vasculitis.',
      'gca|il6|Large-vessel inflammation': 'IL-6, arterial dendritic-cell and Th1/Th17 biology is curator-confirmed for GCA/LVV; treatment response is supporting context rather than sole causal proof.',
      'immune_complex_vasculitis|autoantibody|Palpable purpura': 'Immune-complex deposition with Fc-receptor and classical-complement recruitment is curator-confirmed for palpable purpura.',
      'immune_complex_vasculitis|autoantibody|Glomerulonephritis': 'Immune-complex deposition is curator-confirmed for glomerular injury in the relevant endotypes.',
      'aps|complement|Pregnancy morbidity': 'Complement-mediated placental and microvascular injury is curator-confirmed as one contributor to obstetric APS; coagulation is not treated as the sole mechanism.',
      'caps|inflammasome|Urticaria-like rash': 'Monogenic NLRP3 causality supports the syndrome-level rash phenotype.',
      'caps|inflammasome|Fever': 'Monogenic NLRP3 causality supports the syndrome-level fever phenotype.',
      'caps|inflammasome|Arthralgia': 'Monogenic NLRP3 causality supports the syndrome-level articular phenotype.',
      'caps|inflammasome|Conjunctivitis': 'Monogenic NLRP3 causality supports the syndrome-level ocular phenotype.',
      'caps|inflammasome|Cold-triggered attacks': 'Monogenic NLRP3 causality supports trigger-linked inflammatory attacks.',
      'caps|inflammasome|Sensorineural hearing loss': 'Monogenic NLRP3 causality supports the syndrome-level audiologic phenotype.',
      'caps|inflammasome|Aseptic meningitis': 'Monogenic NLRP3 causality supports the syndrome-level CNS phenotype.',
      'caps|inflammasome|Bony overgrowth': 'Monogenic NLRP3 causality supports the severe CAPS skeletal phenotype.',
      'caps|il1|Urticaria-like rash': 'Mechanism-matched IL-1 biology and longitudinal response support this phenotype without assigning a quantitative causal effect.',
      'caps|il1|Fever': 'Mechanism-matched IL-1 biology and longitudinal response support this phenotype without assigning a quantitative causal effect.',
      'caps|il1|Arthralgia': 'Mechanism-matched IL-1 biology and longitudinal response support this phenotype without assigning a quantitative causal effect.',
      'ra_skin|granuloma|Rheumatoid nodules': 'Palisading granulomatous histopathology is curator-confirmed as the defining reaction pattern for rheumatoid nodules.'
  }

  function curatedDecisionFor(link, pathway) {
    const pathwayKey = primaryPathwayKey(pathway)
    const key = `${link.condition}|${pathwayKey}|${link.manifestation}`
    return CURATED_DECISIONS[key] || ''
  }

  function rejectionReason(link, pathway) {
    const pathwayKey = primaryPathwayKey(pathway)
    const medication = link.supportingMedication || ''
    if (link.condition === 'ra_skin' && link.manifestation === 'Palmar erythema') return 'Generic skin terminology cannot establish a pathway-specific palmar-erythema relationship.'
    if (link.condition === 'ra_skin' && link.manifestation === 'Rheumatoid nodules' && pathwayKey === 'neutrophil') return 'Rheumatoid nodules are primarily necrobiotic/palisading granulomatous, not a generic neutrophilic or suppurative phenotype.'
    if (link.condition === 'dm' && pathwayKey === 'complement' && ['Heliotrope/Gottron eruption', 'Photosensitive poikiloderma', 'Proximal weakness', 'Dysphagia'].includes(link.manifestation) && medication === 'Rituximab') return 'Rituximab effector pharmacology cannot be used as proof that complement causes each responsive dermatomyositis manifestation.'
    if (link.condition === 'schnitzler' && pathwayKey === 'il1' && link.manifestation.includes('Monoclonal')) return 'IL-1 blockade controls inflammation but does not eradicate or normalize the monoclonal gammopathy.'
    if (link.condition === 'sjogren' && link.manifestation === 'Fatigue/pain' && medication === 'Rituximab') return 'Randomized rituximab trials do not support a simple positive global fatigue/pain treatment-response mapping.'
    if (link.condition === 'aps' && pathwayKey === 'coagulation' && link.manifestation === 'Thrombocytopenia') return 'Anticoagulation treats thrombosis and does not validate coagulation as the treatment pathway for APS-associated thrombocytopenia.'
    if (link.condition === 'ssc' && pathwayKey === 'vascular' && link.manifestation === 'Renal crisis' && medication === 'ACE inhibitor') return 'ACE-inhibitor efficacy in established renal crisis does not specifically validate an endothelin/NO causal edge.'
    if (link.condition === 'aav' && ['Livedo', 'Digital ischemia', 'Cranial ischemia'].includes(link.manifestation)) return 'The umbrella vasculitis mapping crossed incompatible endotypes; the exact phenotype is not supported in this AAV source row.'
    if (link.condition === 'egpa' && ['Livedo', 'Digital ischemia', 'Cranial ischemia'].includes(link.manifestation)) return 'EGPA IL-5 evidence cannot be propagated to generic livedoid, digital-ischemic or GCA cranial-ischemic phenotypes.'
    return ''
  }

  function domainForManifestation(label) {
    const domains = manifestDomains(label)
    return domains[0] || 'other'
  }

  function sanitizeManifestationLinks() {
    const active = []
    const exploratory = []
    const rejected = []

    for (const original of DATA.manifestationLinks) {
      const link = { ...original }
      const pathway = DATA.pathways[link.pathIndex]
      if (!pathway) { rejected.push({ ...link, rejectionReason: 'Missing parent pathway row.' }); continue }
      link.condition = pathway.condition
      link.endotypeScope = pathway.endotypeScope || pathway.condition
      const condition = COND[link.condition]
      if (!condition || !condition.manifestations.includes(link.manifestation)) {
        rejected.push({ ...link, rejectionReason: 'Manifestation is outside the declared condition/endotype scope.' })
        continue
      }

      link.domain = domainForManifestation(link.manifestation)
      link.domainLabel = MANIFEST_BY_KEY[link.domain]?.label || MANIFEST_BY_KEY.other.label
      link.domainTags = unique(manifestDomains(link.manifestation))
      const rejection = rejectionReason(link, pathway)
      if (rejection) { rejected.push({ ...link, rejectionReason: rejection, curationStatus: 'rejected' }); continue }

      const sourceSpan = sourceSpanFor(link, pathway)
      const curatorDecision = curatedDecisionFor(link, pathway)
      if (sourceSpan) {
        link.relationship = 'Synthesis-explicit'
        link.relationOrigin = 'source-explicit'
        link.relationMeaning = 'contributory'
        link.mappingConfidence = 'synthesis-match-only'
        link.curationStatus = 'unreviewed'
        link.sourceAssertion = pathway.manifestations
        link.sourceSpan = sourceSpan
        link.curatorDecision = ''
        link.sourceKind = 'embedded-synthesis'
        link.clinicallyValidated = false
        link.rationale = `Embedded synthesis span: “${sourceSpan}.” ${pathway.role} This match is not independent primary-source validation.`
        link.defaultVisible = true
        delete link.supportingMedication
        active.push(link)
        continue
      }
      if (curatorDecision) {
        link.relationship = 'Editorial hypothesis'
        link.relationOrigin = 'editorial-hypothesis'
        link.relationMeaning = 'contributory'
        link.mappingConfidence = 'unassessed'
        link.curationStatus = 'unreviewed'
        link.sourceAssertion = pathway.manifestations
        link.sourceSpan = ''
        link.editorialRationale = curatorDecision
        link.curatorDecision = ''
        link.clinicallyValidated = false
        link.relationMeaning = 'hypothesis'
        link.rationale = `Unadjudicated editorial hypothesis. Historical rationale (not a reviewer attestation): ${curatorDecision} Parent synthesis: “${pathway.manifestations}.”`
        link.defaultVisible = false
        delete link.supportingMedication
        exploratory.push(link)
        continue
      }

      const origin = original.relationship === 'Therapeutically triangulated'
        ? 'therapy-informed'
        : original.relationship === 'Domain-consistent'
          ? 'domain-inferred'
          : 'lexical-inferred'
      link.relationship = origin === 'therapy-informed' ? 'Therapy-informed hypothesis' : origin === 'domain-inferred' ? 'Domain-level hypothesis' : 'Lexical hypothesis'
      link.relationOrigin = origin
      link.relationMeaning = 'hypothesis'
      link.mappingConfidence = 'low'
      link.curationStatus = 'unreviewed'
      link.sourceAssertion = pathway.manifestations
      link.sourceSpan = ''
      link.curatorDecision = ''
      link.defaultVisible = false
      link.rationale = `${link.relationship}; excluded from the default graph. ${original.rationale}`
      exploratory.push(link)
    }

    DATA.defaultManifestationLinks = active
    DATA.exploratoryManifestationLinks = exploratory
    DATA.rejectedManifestationLinks = rejected
    DATA.allSanitizedManifestationLinks = [...active, ...exploratory]
    DATA.manifestationLinks = active

    DATA.meta.manifestationLinkMethod = 'Default pathway–manifestation edges match the embedded synthesis, not independently retrieved publications. This is not primary-source validation or human review. Editorial, lexical, organ-domain and treatment-response hypotheses require opt-in. Treatment response never establishes disease-pathway causality. Rejected mappings remain auditable and excluded.'
    DATA.meta.relationshipContract = {
      availabilityState: ['present', 'explicit-zero', 'unknown', 'structurally-unavailable'],
      visibilityState: ['visible', 'filtered'],
      relationOrigin: ['source-explicit', 'editorial-hypothesis', 'domain-inferred', 'therapy-informed', 'lexical-inferred', 'canonical-background'],
      relationMeaning: ['contributory', 'associated', 'treatment-response', 'pharmacologic-target', 'hypothesis'],
      curationStatus: ['reviewed', 'unreviewed', 'rejected']
    }
  }

  function refreshConditionSelects() {
    const selections = new Map()
    const selectors = [
      '#radarCondition', '#effectChartCondition', '#networkCondition', '#manifestCondition', '#compareConditionA', '#compareConditionB', '#compareContextCondition', '#subtypeCondition', '#triptychConditionSelect', '#mechanismLanesConditionA', '#mechanismLanesConditionB', '#differenceConditionA', '#differenceConditionB', '#parallelCondition', '#coverageSliceEntity',
      '#pathCondition', '#effectCondition', '#quizCondition', '#manifestTableCondition'
    ]
    selectors.forEach(selector => { const element = $(selector); if (element) selections.set(selector, element.value) })
    const blank = new Set(['#pathCondition', '#effectCondition', '#quizCondition', '#manifestTableCondition'])
    selectors.forEach(selector => {
      const element = $(selector)
      if (!element) return
      fillConditionSelect(element, blank.has(selector))
      const previous = selections.get(selector)
      element.value = previous && COND[previous] ? previous : (previous === '' && blank.has(selector) ? '' : 'psa')
    })
  }

  function rebuildSearchIndex() {
    if (!Array.isArray(searchIndex)) return
    searchIndex.splice(0)
    DATA.conditions.forEach(condition => searchIndex.push({ type: 'Condition', title: condition.name, sub: condition.one_liner, text: searchable(condition), id: condition.id, tab: 'conditions' }))
    DATA.pathways.forEach((pathway, index) => searchIndex.push({ type: 'Pathway', title: pathway.axis, sub: `${COND[pathway.condition].name} · ${pathway.manifestations}`, text: `${searchable(pathway)} ${searchable(COND[pathway.condition])}`, index, tab: 'pathways' }))
    DATA.medications.forEach(medication => searchIndex.push({ type: 'Medication', title: medication.name, sub: medication.primary, text: searchable(medication), id: medication.id, tab: 'medications' }))
    DATA.effects.forEach((effect, index) => searchIndex.push({ type: 'Benefit row', title: `${MED[effect.med].name} in ${COND[effect.condition].abbr}`, sub: effect.manifestations, text: `${searchable(effect)} ${searchable(MED[effect.med])} ${searchable(COND[effect.condition])}`, index, tab: 'effects' }))
    DATA.manifestationLinks.forEach((link, index) => searchIndex.push({ type: 'Manifestation–pathway link', title: `${link.manifestation} × ${link.pathway}`, sub: `${COND[link.condition].name} · ${link.relationship} · grade ${link.grade}`, text: `${searchable(link)} ${searchable(COND[link.condition])}`, index, tab: 'manifestationMap' }))
  }

  const canonicalBackgroundRules = causalRules.map(rule => [...rule])

  function installLayerControls() {
    causalRules.splice(0)
    EDGE_STYLE.causal.label = 'optional canonical-background hypothesis'
    EDGE_STYLE.drives.label = 'synthesis pathway–phenotype relationship'

    const advancedGrid = $('#networkAdvancedControls .network-advanced-grid')
    if (advancedGrid && !$('#networkExploratoryMappings')) {
      advancedGrid.insertAdjacentHTML('beforeend', `
        <label class="p0-layer-toggle">Exploratory phenotype mappings
          <span><input id="networkExploratoryMappings" type="checkbox"> Include lexical, domain and therapy-informed hypotheses</span>
        </label>
        <label class="p0-layer-toggle">Canonical background
          <span><input id="networkCanonicalBackground" type="checkbox"> Include general pathway-adjacency hypotheses</span>
        </label>`)
    }

    const axisNote = $('#networkAxisNote')
    if (axisNote && !$('#networkEvidenceBoundary')) {
      axisNote.insertAdjacentHTML('afterend', `<div id="networkEvidenceBoundary" class="network-evidence-boundary" role="status" aria-live="polite"><b>Default synthesis view:</b> embedded-synthesis matches only, not primary-source or human validation. Editorial hypotheses and canonical background are off.</div>`)
    }

    const style = document.createElement('style')
    style.textContent = `
      .network-evidence-boundary{margin:8px 0 10px;padding:10px 12px;border-left:4px solid var(--good);background:var(--panel2);font-size:11px;color:var(--muted)}
      .network-evidence-boundary b{color:var(--text)}
      .p0-layer-toggle span{display:flex;align-items:flex-start;gap:8px;margin-top:5px;color:var(--muted);font-size:11px;line-height:1.35}
      .p0-layer-toggle input{width:18px;height:18px;flex:none;margin-top:0}
      .network-provenance-chip{display:inline-flex;margin:4px 4px 0 0;padding:3px 6px;border:1px solid var(--line);font:700 9px/1.2 var(--font-mono);text-transform:uppercase;letter-spacing:.04em}
    `
    document.head.append(style)

  }

  function refreshP0Ui() {
    refreshConditionSelects()
    const manifest = DATA.layoutManifest
    if (manifest) {
      const labels = {
        pathways: ['Pathways', manifest.pathwayIds.length],
        medications: ['Treatments', manifest.medicationIds.length],
        features: ['Features', manifest.featureIds.length],
      }
      Object.entries(labels).forEach(([facet, [noun, count]]) => {
        const element = document.querySelector(`.cohort-slab[data-cohort-facet="${facet}"] .cohort-slab-label`)
        if (element) element.textContent = `${noun} · ${count}`
      })
    }

    const exploratoryOn = Boolean($('#networkExploratoryMappings')?.checked)
    const mode = $('#manifestTableMode')
    if (mode) {
      const previous = mode.value
      const relationships = [
        ['', 'All relationship types'],
        ['Synthesis-explicit', 'Synthesis-explicit'],
        ...(exploratoryOn ? [
          ['Editorial hypothesis', 'Editorial hypothesis'],
          ['Domain-level hypothesis', 'Domain-level hypothesis'],
          ['Therapy-informed hypothesis', 'Therapy-informed hypothesis'],
          ['Lexical hypothesis', 'Lexical hypothesis'],
        ] : []),
      ]
      mode.innerHTML = relationships.map(([value, label]) => `<option value="${esc(value)}">${esc(label)}</option>`).join('')
      mode.value = relationships.some(([value]) => value === previous) ? previous : ''
    }

    if (!manifestSelected && typeof resetManifestCellInfo === 'function') resetManifestCellInfo()

    const caption = [...document.querySelectorAll('.comparison-caption span')].find(element => element.textContent?.includes('condition'))
    if (caption && caption.textContent?.includes('frozen order')) caption.textContent = `All ${DATA.conditions.length} remediated condition contexts remain in a frozen order. Scroll horizontally without changing the denominator.`
  }

  let layerStateQueue = Promise.resolve()

  function applyLayerState() {
    const requestedState = {
      exploratoryOn: Boolean($('#networkExploratoryMappings')?.checked),
      canonicalOn: Boolean($('#networkCanonicalBackground')?.checked),
    }
    layerStateQueue = layerStateQueue.then(
      () => runLayerState(requestedState),
      () => runLayerState(requestedState),
    )
    return layerStateQueue
  }

  async function runLayerState({ exploratoryOn, canonicalOn }) {
    DATA.manifestationLinks = exploratoryOn ? DATA.allSanitizedManifestationLinks : DATA.defaultManifestationLinks
    causalRules.splice(0, causalRules.length, ...(canonicalOn ? canonicalBackgroundRules.map(rule => [...rule]) : []))
    await initRelationalContract()
    refreshP0Ui()
    rebuildSearchIndex()
    if (typeof buildNetwork === 'function') buildNetwork($('#networkCondition')?.value || currentCondition)
    if ($('#manifestationMap')?.classList.contains('active')) { renderManifestLinkTable(); renderManifestMatrix() }
    if ($('#phenotypeMaps')?.classList.contains('active')) { drawComparison(); renderCohort() }
    const boundary = $('#networkEvidenceBoundary')
    if (boundary) {
      const heading = document.createElement('b')
      heading.textContent = exploratoryOn || canonicalOn ? 'Expanded exploratory view:' : 'Default synthesis view:'
      boundary.replaceChildren(
        heading,
        document.createTextNode(` ${DATA.manifestationLinks.length} phenotype links visible; ${DATA.exploratoryManifestationLinks.length} exploratory mappings ${exploratoryOn ? 'included' : 'quarantined'}; ${canonicalOn ? canonicalBackgroundRules.length : 0} canonical-background rules active.`),
      )
    }
    document.documentElement.dataset.atlasExploratoryMappings = String(exploratoryOn)
    document.documentElement.dataset.atlasCanonicalBackground = String(canonicalOn)
    window.dispatchEvent(new CustomEvent('atlas:relations-updated'))
  }

  function bindLayerControls() {
    $('#networkExploratoryMappings')?.addEventListener('change', () => { void applyLayerState() })
    $('#networkCanonicalBackground')?.addEventListener('change', () => { void applyLayerState() })
  }

  function validateP0Contract() {
    const errors = []
    const active = DATA.defaultManifestationLinks || []
    if (DATA.conditions.some(condition => condition.id === 'vasculitis')) errors.push('Unsplit vasculitis umbrella remains active')
    for (const id of VASCULITIS_ENDOTYPES) if (!COND[id]) errors.push(`Missing vasculitis endotype ${id}`)
    for (const link of active) {
      if (!DEFAULT_ORIGINS.has(link.relationOrigin)) errors.push(`Non-reviewed default origin: ${link.id} ${link.relationOrigin}`)
      if (link.relationOrigin === 'source-explicit' && !link.sourceSpan) errors.push(`Source-explicit link lacks source span: ${link.id}`)
      if (link.relationOrigin === 'curator-confirmed' && !link.curatorDecision) errors.push(`Curator-confirmed link lacks decision: ${link.id}`)
      if (link.curationStatus === 'reviewed' || link.clinicallyValidated === true) errors.push(`Synthesis match promoted to clinical review: ${link.id}`)
      if (link.supportingMedication) errors.push(`Treatment triangulation leaked into default links: ${link.id}`)
    }
    const defaultState = DATA.meta.p0ScientificRemediation
    if (defaultState?.defaultCanonicalBackground !== false || defaultState?.defaultCanonicalRuleCount !== 0) errors.push('Canonical background is not off by default')
    if (defaultState?.defaultExploratoryMappings !== false) errors.push('Exploratory mappings are not off by default')
    const linkKey = link => `${link.id}|${link.condition}|${link.pathIndex}|${link.manifestation}`
    const rejectedKeys = new Set((DATA.rejectedManifestationLinks || []).map(linkKey))
    for (const link of DATA.allSanitizedManifestationLinks || []) {
      if (rejectedKeys.has(linkKey(link))) errors.push(`Rejected relationship became active: ${link.id}`)
    }
    const effectContract = DATA.meta.vasculitisEndotypeContract
    if (effectContract?.treatmentEffectAccountingComplete !== true) errors.push('Vasculitis treatment-effect accounting is incomplete')
    if ((DATA.rejectedEffects || []).some(effect => !effect.rejectionReason)) errors.push('Rejected treatment effect lacks an audit reason')
    const prohibited = [
      ['ra_skin', 'Palmar erythema'],
      ['sjogren', 'Fatigue/pain'],
      ['aps', 'Thrombocytopenia'],
      ['schnitzler', 'Monoclonal IgM (usually)']
    ]
    prohibited.forEach(([condition, manifestation]) => {
      if (active.some(link => link.condition === condition && link.manifestation === manifestation)) errors.push(`Prohibited default link remains: ${condition} ${manifestation}`)
    })
    return { ok: errors.length === 0, errors }
  }

  remediateManifestOntology()
  splitVasculitisEndotypes()
  sanitizeManifestationLinks()
  refreshConditionSelects()
  rebuildSearchIndex()
  installLayerControls()
  bindLayerControls()

  DATA.meta.version = '5.1'
  DATA.meta.p0ScientificRemediation = {
    version: REMEDIATION_VERSION,
    defaultPhenotypeLinks: DATA.defaultManifestationLinks.length,
    exploratoryPhenotypeLinks: DATA.exploratoryManifestationLinks.length,
    rejectedPhenotypeLinks: DATA.rejectedManifestationLinks.length,
    rejectedTreatmentEffects: (DATA.rejectedEffects || []).length,
    canonicalBackgroundRules: canonicalBackgroundRules.length,
    defaultCanonicalBackground: false,
    defaultCanonicalRuleCount: causalRules.length,
    defaultExploratoryMappings: false
  }

  const validation = validateP0Contract()
  if (!validation.ok) throw new Error(`Atlas P0 scientific-integrity contract invalid: ${validation.errors.join('; ')}`)

  window.__ATLAS_P0__ = {
    version: REMEDIATION_VERSION,
    vasculitisEndotypes: [...VASCULITIS_ENDOTYPES],
    canonicalBackgroundRules: canonicalBackgroundRules.map(rule => [...rule]),
    get data() { return DATA },
    get graphEdges() { return networkEdges },
    get graphNodes() { return networkNodes },
    get canonicalRuleCount() { return causalRules.length },
    get defaultLinks() { return DATA.defaultManifestationLinks },
    get exploratoryLinks() { return DATA.exploratoryManifestationLinks },
    get rejectedLinks() { return DATA.rejectedManifestationLinks },
    get rejectedEffects() { return DATA.rejectedEffects || [] },
    get activeLinks() { return DATA.manifestationLinks },
    validate: validateP0Contract,
    refreshUi: refreshP0Ui,
    setExploratoryMappings: async enabled => { const input = $('#networkExploratoryMappings'); if (input) input.checked = Boolean(enabled); await applyLayerState() },
    setCanonicalBackground: async enabled => { const input = $('#networkCanonicalBackground'); if (input) input.checked = Boolean(enabled); await applyLayerState() }
  }

  document.documentElement.dataset.atlasP0Remediation = REMEDIATION_VERSION
  document.documentElement.dataset.atlasExploratoryMappings = 'false'
  document.documentElement.dataset.atlasCanonicalBackground = 'false'
})()
