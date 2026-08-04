/* Rheum–Derm Immune Atlas P1/P2 governance and interface layer.
 * Loaded after p0-scientific-remediation.js and before parent initialization.
 *
 * P1: orthogonal relationship dimensions, polyhierarchical phenotype tags,
 * mandatory scope, optional canonical-background registry, curation/conflict
 * support, and one documented relationship-state contract.
 *
 * P2: task-oriented navigation, provenance-first defaults, simplified visual
 * grammar, epistemic denominators, grouped search, label disclosure, expanded
 * provenance inspection, reproducible URLs, visible-subset export, and
 * non-drag/touch/assistive-technology alternatives.
 */
(() => {
  'use strict'

  const VERSION = '2026-08-04-p1-p2.1'
  const $ = window.$ || (selector => document.querySelector(selector))
  const $$ = selector => [...document.querySelectorAll(selector)]
  const text = value => String(value ?? '').trim()
  const normalize = value => text(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[α]/g, 'alpha')
    .replace(/[β]/g, 'beta')
    .replace(/[γ]/g, 'gamma')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
  const unique = values => [...new Set((values || []).filter(Boolean))]
  const clone = value => JSON.parse(JSON.stringify(value))
  const gradeRank = { A: 4, B: 3, C: 2, D: 1 }

  const RELATIONSHIP_MODEL = Object.freeze({
    availability: ['present', 'explicit-zero', 'unknown', 'structurally-unavailable'],
    visibility: ['visible', 'filtered', 'hidden-optional'],
    provenanceKind: ['source-explicit', 'curator-confirmed', 'domain-inferred', 'therapy-informed', 'canonical-background'],
    provenanceDirectness: ['direct', 'derived'],
    evidenceConsensus: ['supporting', 'mixed', 'insufficient', 'not-assessed'],
    causalityMeaning: ['causal', 'contributory', 'associated', 'treatment-response', 'pharmacologic-target', 'secondary-modulation', 'mechanistic-hypothesis'],
    curationStatus: ['reviewed', 'provisional', 'unreviewed', 'contested', 'rejected'],
  })

  const PHENOTYPE_TAGS = Object.freeze([
    { key: 'cutaneous-inflammatory', label: 'Inflammatory cutaneous disease', parents: ['cutaneous'], tissues: ['skin'] },
    { key: 'neutrophilic', label: 'Neutrophilic / suppurative reaction', parents: ['cutaneous', 'innate-effector'], tissues: ['skin'] },
    { key: 'purpuric-vascular', label: 'Purpuric small-vessel injury', parents: ['cutaneous', 'vascular'], tissues: ['skin', 'small-vessel'] },
    { key: 'ulceration-tissue-loss', label: 'Ulceration / tissue loss', parents: ['cutaneous', 'tissue-injury'], tissues: ['skin'] },
    { key: 'mucosal-ulceration', label: 'Mucosal ulceration', parents: ['mucosal', 'tissue-injury'], tissues: ['oral-mucosa', 'genital-mucosa'] },
    { key: 'necrobiotic-granulomatous', label: 'Necrobiotic / palisading granulomatous', parents: ['cutaneous', 'granulomatous'], tissues: ['skin', 'subcutis'] },
    { key: 'fibrosis-sclerosis', label: 'Fibrosis / sclerosis', parents: ['remodeling'], tissues: ['skin', 'subcutis', 'fascia'] },
    { key: 'atrophy', label: 'Atrophy / tissue loss', parents: ['tissue-injury'], tissues: ['skin', 'subcutis'] },
    { key: 'calcification', label: 'Calcinosis / mineral deposition', parents: ['deposition'], tissues: ['skin', 'subcutis', 'muscle'] },
    { key: 'vascular-ischemic', label: 'Vasculopathy / ischemia', parents: ['vascular'], tissues: ['small-vessel', 'medium-vessel', 'large-vessel'] },
    { key: 'thrombotic', label: 'Thrombosis / thromboinflammation', parents: ['vascular', 'hematologic'], tissues: ['vessel', 'blood'] },
    { key: 'muscle', label: 'Muscle injury / weakness', parents: ['musculoskeletal'], tissues: ['skeletal-muscle'] },
    { key: 'joint', label: 'Joint inflammation', parents: ['musculoskeletal'], tissues: ['synovium', 'joint'] },
    { key: 'enthesis-bone', label: 'Enthesis / axial / bone disease', parents: ['musculoskeletal'], tissues: ['enthesis', 'bone'] },
    { key: 'pulmonary', label: 'Pulmonary disease', parents: ['internal-organ'], tissues: ['lung', 'pulmonary-vessel'] },
    { key: 'renal', label: 'Renal disease', parents: ['internal-organ'], tissues: ['kidney', 'glomerulus'] },
    { key: 'neurologic', label: 'Neurologic disease', parents: ['internal-organ'], tissues: ['peripheral-nerve', 'central-nervous-system'] },
    { key: 'otologic', label: 'Otologic / audiovestibular disease', parents: ['sensory-organ'], tissues: ['inner-ear'] },
    { key: 'ocular', label: 'Ocular inflammation', parents: ['sensory-organ'], tissues: ['eye'] },
    { key: 'hematologic', label: 'Hematologic / clonal disease', parents: ['blood'], tissues: ['blood', 'bone-marrow'] },
    { key: 'glandular', label: 'Glandular / sicca dysfunction', parents: ['secretory-organ'], tissues: ['salivary-gland', 'lacrimal-gland'] },
    { key: 'obstetric-placental', label: 'Obstetric / placental morbidity', parents: ['reproductive'], tissues: ['placenta', 'maternal-fetal-interface'] },
    { key: 'systemic-inflammatory', label: 'Systemic / acute-phase inflammation', parents: ['systemic'], tissues: ['systemic'] },
    { key: 'trigger-response', label: 'Trigger-linked inflammatory attacks', parents: ['systemic'], tissues: ['systemic'] },
    { key: 'thromboinflammatory-crisis', label: 'Systemic thromboinflammatory crisis', parents: ['systemic', 'vascular', 'hematologic'], tissues: ['systemic', 'vessel', 'blood'] },
    { key: 'syndromic-overlap', label: 'Syndromic overlap phenotype', parents: ['multisystem'], tissues: ['multisystem'] },
    { key: 'pain-pruritus', label: 'Pain / pruritus', parents: ['symptom'], tissues: ['multisystem'] },
    { key: 'other', label: 'Other / unclassified', parents: [], tissues: ['unspecified'] },
  ])
  const TAG_BY_KEY = Object.fromEntries(PHENOTYPE_TAGS.map(tag => [tag.key, tag]))

  const TAG_RULES = [
    ['necrobiotic-granulomatous', /rheumatoid nodule|necrobi|palisad/i],
    ['purpuric-vascular', /palpable purpura|retiform purpura|\bpurpura\b/i],
    ['mucosal-ulceration', /oral aph|oral ulcer|genital ulcer|mucosal ulcer|aphth/i],
    ['ulceration-tissue-loss', /\bulcer|tissue loss|necrosis/i],
    ['neutrophilic', /neutrophil|pustul|abscess|sweet|pyoderma|suppurat|drain|tunnel/i],
    ['calcification', /calcinosis|calcification|mineral deposition/i],
    ['atrophy', /\batrophy\b|atrophic/i],
    ['fibrosis-sclerosis', /fibro|sclero|skin thick|scar|contracture|collagen/i],
    ['thromboinflammatory-crisis', /catastrophic aps|catastrophic antiphospholipid/i],
    ['trigger-response', /cold.trigger|triggered attack/i],
    ['syndromic-overlap', /\bpapa\b|\bpash\b|\bpapash\b|syndromic/i],
    ['obstetric-placental', /pregnan|obstetric|placent/i],
    ['otologic', /hearing loss|audiovestibular|sensorineural/i],
    ['ocular', /uveitis|ocular|conjunctiv|\beye\b/i],
    ['renal', /nephritis|glomeruloneph|\brenal\b|\bkidney\b|proteinuria/i],
    ['pulmonary', /\bild\b|interstitial lung|pulmonary|\blung\b|hemorrhage|\basthma\b/i],
    ['neurologic', /neurolog|neuropath|\bcns\b|meningitis|mononeuritis/i],
    ['hematologic', /cytopen|thrombocytopen|macrophage activation|lymphoma|gammopathy|monoclonal|coagulopathy/i],
    ['thrombotic', /thromb|coagulation|platelet|embol/i],
    ['vascular-ischemic', /vascul|raynaud|digital ischem|livedo|ischemi|endothel|capillar/i],
    ['muscle', /weakness|myositis|myofiber|\bmuscle\b|dysphagia|perifascicular/i],
    ['joint', /arthritis|arthral|synovitis|dactylitis|\bjoint\b|articular/i],
    ['enthesis-bone', /enthes|\baxial\b|osteitis|hyperost|bone pain|ankyl|erosion|bony overgrowth/i],
    ['glandular', /dry eye|dry mouth|\bsicca\b|parotid|\bgland/i],
    ['systemic-inflammatory', /\bfever\b|systemic|constitutional|fatigue|acute phase|\bcrp\b|\bsaa\b|lymphaden|flare/i],
    ['pain-pruritus', /\bpain\b|prur|\bitch/i],
    ['cutaneous-inflammatory', /\bcle\b|plaque psoriasis|papul|poikiloderma|heliotrope|gottron|erythema nodosum|pernio|photosens|urticaria|\brash\b|palmar erythema|lilac ring/i],
  ]

  const LAYOUT_PRIORITY = [
    'purpuric-vascular', 'vascular-ischemic', 'thrombotic', 'ulceration-tissue-loss',
    'mucosal-ulceration', 'necrobiotic-granulomatous', 'neutrophilic', 'calcification',
    'atrophy', 'fibrosis-sclerosis', 'muscle', 'joint', 'enthesis-bone', 'pulmonary',
    'renal', 'neurologic', 'otologic', 'ocular', 'hematologic', 'glandular',
    'obstetric-placental', 'thromboinflammatory-crisis', 'trigger-response',
    'systemic-inflammatory', 'cutaneous-inflammatory', 'pain-pruritus', 'syndromic-overlap', 'other'
  ]

  const ENDOTYPE_BY_CONDITION = Object.freeze({
    aav: ['anca-associated-vasculitis'],
    egpa: ['eosinophilic-granulomatosis-with-polyangiitis'],
    gca: ['giant-cell-arteritis-large-vessel-vasculitis'],
    immune_complex_vasculitis: ['immune-complex-small-vessel-vasculitis'],
    dm: ['dermatomyositis-spectrum'],
    sle: ['systemic-lupus-erythematosus'],
    ssc: ['systemic-sclerosis'],
    morphea: ['localized-scleroderma'],
    aps: ['antiphospholipid-syndrome'],
    sjogren: ['sjogren-disease'],
  })

  function phenotypeTags(label) {
    const matched = TAG_RULES.filter(([, pattern]) => pattern.test(text(label))).map(([key]) => key)
    const direct = matched.length ? matched : ['other']
    const parents = direct.flatMap(key => TAG_BY_KEY[key]?.parents || [])
    return unique([...direct, ...parents])
  }

  function layoutTagFor(tags) {
    return LAYOUT_PRIORITY.find(key => tags.includes(key)) || 'other'
  }

  function tissuesFor(tags) {
    return unique(tags.flatMap(key => TAG_BY_KEY[key]?.tissues || []).filter(Boolean)).length
      ? unique(tags.flatMap(key => TAG_BY_KEY[key]?.tissues || []).filter(Boolean))
      : ['unspecified']
  }

  function evidenceFrom(record) {
    const grade = ['A', 'B', 'C', 'D'].includes(record.evidenceGrade || record.grade) ? (record.evidenceGrade || record.grade) : 'D'
    const supporting = unique(record.supportingReferences || record.supportingRefs || record.references || record.refs || [])
    const conflicting = unique(record.conflictingReferences || record.conflictingRefs || [])
    return {
      grade,
      consensus: conflicting.length ? 'mixed' : supporting.length ? 'supporting' : 'not-assessed',
      supportingReferences: supporting,
      conflictingReferences: conflicting,
      note: text(record.evidenceNote || record.caveat || ''),
    }
  }

  function provenanceFrom(record) {
    const origin = record.relationOrigin || record.origin || (record.sourceSpan ? 'source-explicit' : record.curatorDecision ? 'curator-confirmed' : 'domain-inferred')
    const kind = RELATIONSHIP_MODEL.provenanceKind.includes(origin) ? origin : 'domain-inferred'
    return {
      kind,
      directness: record.directness || (kind === 'source-explicit' ? 'direct' : 'derived'),
      sourceSpan: text(record.sourceSpan || ''),
      mappingRule: text(record.mappingRule || record.candidateMappingMethod || record.rule || ''),
    }
  }

  function causalityFrom(record) {
    const candidate = record.causalityMeaning || record.relationMeaning || record.relationship || record.rel || record.type
    const map = {
      causal: 'causal', drives: 'contributory', association: 'associated', benefits: 'treatment-response',
      worsens: 'treatment-response', targets: 'pharmacologic-target', activates: 'pharmacologic-target',
      modulates: 'secondary-modulation', 'canonical-background': 'mechanistic-hypothesis'
    }
    const meaning = RELATIONSHIP_MODEL.causalityMeaning.includes(candidate) ? candidate : (map[candidate] || 'associated')
    return {
      meaning,
      direction: text(record.direction || (record.source && record.target ? `${record.source} → ${record.target}` : 'not-specified')),
      certainty: text(record.causalCertainty || record.mappingConfidence || (meaning === 'causal' ? 'moderate' : 'not-claimed')),
    }
  }

  function scopeFrom(record) {
    const condition = record.condition || record.conditionId || record.contextId
    const conditionIds = unique(record.conditionIds || (condition ? [condition] : ['cross-condition']))
    const endotypeIds = unique(record.endotypeIds || record.endotypeScope || conditionIds.flatMap(id => ENDOTYPE_BY_CONDITION[id] || [id]))
    const tags = record.phenotypeTags || phenotypeTags(record.manifestation || record.feature || record.label || '')
    const tissueIds = unique(record.tissueIds || record.tissueScope || tissuesFor(tags))
    return {
      conditionIds: conditionIds.length ? conditionIds : ['cross-condition'],
      endotypeIds: endotypeIds.length ? endotypeIds : ['unspecified-endotype'],
      tissueIds: tissueIds.length ? tissueIds : ['unspecified'],
      applicability: text(record.applicability || record.claimScope || record.scope || 'Educational relationship model; applicability is limited to the listed context and tissue scope.'),
    }
  }

  function curationFrom(record, provenance, evidence) {
    const fallback = provenance.kind === 'source-explicit' || provenance.kind === 'curator-confirmed' ? 'reviewed'
      : provenance.kind === 'canonical-background' ? 'provisional' : 'unreviewed'
    const status = evidence.conflictingReferences.length ? 'contested' : (record.curationStatus || record.reviewState || fallback)
    return {
      status: RELATIONSHIP_MODEL.curationStatus.includes(status) ? status : fallback,
      decision: text(record.curatorDecision || record.curationDecision || record.rejectionReason || ''),
      reviewedAt: text(record.reviewedAt || ''),
    }
  }

  function availabilityFrom(record) {
    const candidate = record.availabilityState || record.availability || record.state
    if (RELATIONSHIP_MODEL.availability.includes(candidate)) return candidate
    if (candidate === 'explicit_zero' || candidate === 'zero') return 'explicit-zero'
    if (candidate === 'unavailable') return 'structurally-unavailable'
    if (candidate === 'unknown') return 'unknown'
    return 'present'
  }

  function visibilityFrom(record) {
    const candidate = record.visibilityState || record.visibility
    if (RELATIONSHIP_MODEL.visibility.includes(candidate)) return candidate
    if (record.filtered || record.state === 'filtered') return 'filtered'
    if (record.optional || record.relationOrigin === 'canonical-background') return 'hidden-optional'
    return 'visible'
  }

  function relationKey(record, index = 0) {
    return text(record.relationshipId || record.id || [record.condition, record.pathwayKey || record.pathway, record.manifestation || record.feature, record.medication || record.med].filter(Boolean).join('|') || `relation-${index}`)
  }

  function normalizeRelation(record, index = 0) {
    const phenotype = phenotypeTags(record.manifestation || record.feature || record.label || '')
    const provenance = provenanceFrom(record)
    const evidence = evidenceFrom(record)
    const relation = {
      ...record,
      relationshipId: relationKey(record, index),
      availability: availabilityFrom(record),
      visibility: visibilityFrom(record),
      provenance,
      evidence,
      causality: causalityFrom(record),
      scope: scopeFrom({ ...record, phenotypeTags: phenotype }),
      curation: curationFrom(record, provenance, evidence),
      phenotypeTags: phenotype,
      layoutTagKey: layoutTagFor(phenotype),
    }
    relation.compactState = relation.availability === 'present'
      ? relation.visibility === 'visible' ? (relation.provenance.directness === 'direct' ? 'direct' : 'derived') : 'filtered'
      : relation.availability === 'explicit-zero' ? 'explicit-zero'
      : relation.availability === 'structurally-unavailable' ? 'structurally-unavailable' : 'unknown'
    return relation
  }

  function gatherRawRelations() {
    const sets = [
      window.DATA?.manifestationLinks,
      window.DATA?.defaultManifestationLinks,
      window.DATA?.exploratoryManifestationLinks,
      window.DATA?.allSanitizedManifestationLinks,
      window.DATA?.relationalRows,
      window.DATA?.relations,
    ].filter(Array.isArray)
    const seen = new Set()
    const rows = []
    sets.forEach(set => set.forEach((record, index) => {
      const key = relationKey(record, index)
      if (seen.has(key)) return
      seen.add(key)
      rows.push(record)
    }))
    return rows
  }

  const conflictRegistry = new Map()
  let governedRelations = []

  function rebuildGovernedRelations() {
    governedRelations = gatherRawRelations().map(normalizeRelation).map(record => {
      const conflict = conflictRegistry.get(record.relationshipId)
      if (!conflict) return record
      return {
        ...record,
        evidence: {
          ...record.evidence,
          consensus: 'mixed',
          conflictingReferences: unique([...record.evidence.conflictingReferences, ...conflict.references]),
          note: [record.evidence.note, conflict.note].filter(Boolean).join(' '),
        },
        curation: record.curation.status === 'rejected' ? record.curation : { ...record.curation, status: 'contested' },
      }
    })
    if (window.DATA) {
      window.DATA.governedRelations = governedRelations
      window.DATA.relationshipModel = RELATIONSHIP_MODEL
      window.DATA.phenotypeTagOntology = PHENOTYPE_TAGS
      window.DATA.relationshipConflicts = [...conflictRegistry.entries()].map(([relationshipId, value]) => ({ relationshipId, ...value }))
      window.DATA.manifestationLinks?.forEach((record, index) => Object.assign(record, normalizeRelation(record, index)))
      window.DATA.defaultManifestationLinks?.forEach((record, index) => Object.assign(record, normalizeRelation(record, index)))
      window.DATA.exploratoryManifestationLinks?.forEach((record, index) => Object.assign(record, normalizeRelation(record, index)))
      window.DATA.allSanitizedManifestationLinks?.forEach((record, index) => Object.assign(record, normalizeRelation(record, index)))
      window.DATA.meta = window.DATA.meta || {}
      window.DATA.meta.p1Governance = {
        version: VERSION,
        relationshipCount: governedRelations.length,
        dimensions: ['availability', 'visibility', 'provenance', 'evidence', 'causality', 'scope', 'curation'],
        polyhierarchicalPhenotypes: true,
        canonicalBackgroundOptional: true,
        conflictingEvidenceSupported: true,
      }
    }
    return governedRelations
  }

  function registerConflict(relationshipId, references = [], note = '') {
    conflictRegistry.set(relationshipId, { references: unique(references), note: text(note), registeredAt: new Date().toISOString() })
    rebuildGovernedRelations()
    refreshP2Ui()
    return governedRelations.find(record => record.relationshipId === relationshipId)
  }

  const canonicalBackgroundRegistry = Object.freeze((window.canonicalBackgroundRules || window.__ATLAS_P0__?.canonicalBackgroundRules || []).map((rule, index) => {
    const [source, target] = Array.isArray(rule) ? rule : [rule.source, rule.target]
    return normalizeRelation({
      id: `canonical-background-${source}-${target}-${index}`,
      source,
      target,
      relationOrigin: 'canonical-background',
      directness: 'derived',
      availability: 'present',
      visibility: 'hidden-optional',
      evidenceGrade: 'D',
      evidenceNote: 'General canonical background only; not condition-specific evidence.',
      causalityMeaning: 'mechanistic-hypothesis',
      causalCertainty: 'hypothesis',
      curationStatus: 'provisional',
      conditionIds: ['cross-condition'],
      endotypeIds: ['cross-condition'],
      tissueIds: ['immune-system'],
      applicability: 'Optional canonical background model; excluded from condition-specific evidence counts.',
    }, index)
  }))

  const TASKS = Object.freeze([
    { id: 'explain', label: 'Explain a condition', description: 'Trace source-backed pathway → condition → phenotype or treatment context.', representation: 'triptych', target: 'triptychTab' },
    { id: 'compare', label: 'Compare mechanisms', description: 'Align two contexts without treating unknown as absent.', representation: 'lanes', target: 'mechanismLanesTab' },
    { id: 'treatments', label: 'Evaluate treatments', description: 'Inspect target overlap, evidence, and applicability boundaries.', representation: 'bipartite', target: 'bipartiteTab' },
    { id: 'audit', label: 'Audit evidence', description: 'Inspect provenance, curation, conflicts, denominators, and scope.', representation: 'triptych', target: 'triptychTab' },
    { id: 'explore3d', label: 'Explore the 3D model', description: 'Use the optional spatial projection after reviewing provenance.', representation: 'free', target: 'freeSpaceTab' },
  ])

  const state = {
    task: 'explain',
    representation: 'triptych',
    selectedId: '',
    camera: 'iso',
    suppressUrlWrite: false,
    lastExportCount: 0,
  }

  function injectStylesheet() {
    if (document.querySelector('link[data-atlas-p2-style]')) return
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'explorer/p2-interface.css?v=20260804-p2-1'
    link.dataset.atlasP2Style = 'true'
    document.head.appendChild(link)
  }

  function createTaskNavigation() {
    const representationSwitch = document.querySelector('.representation-switch')
    if (!representationSwitch || $('#atlasTaskNavigation')) return
    const nav = document.createElement('section')
    nav.id = 'atlasTaskNavigation'
    nav.className = 'atlas-task-navigation'
    nav.setAttribute('aria-labelledby', 'atlasTaskHeading')
    nav.innerHTML = `
      <div class="atlas-task-heading">
        <div><span class="eyebrow">Choose the question</span><h4 id="atlasTaskHeading">What are you trying to determine?</h4></div>
        <p>Start with a provenance-first view. The 3D projection remains available as an optional exploratory representation.</p>
      </div>
      <div class="atlas-task-grid" role="list">
        ${TASKS.map(task => `<button type="button" class="atlas-task-card" data-atlas-task="${task.id}" role="listitem" aria-pressed="false"><strong>${task.label}</strong><span>${task.description}</span></button>`).join('')}
      </div>
      <div class="atlas-task-status" id="atlasTaskStatus" aria-live="polite"></div>`
    representationSwitch.before(nav)
    nav.addEventListener('click', event => {
      const button = event.target.closest('[data-atlas-task]')
      if (!button) return
      activateTask(button.dataset.atlasTask, true)
    })
  }

  function activateTask(taskId, focus = false) {
    const task = TASKS.find(item => item.id === taskId) || TASKS[0]
    state.task = task.id
    state.representation = task.representation
    $$('[data-atlas-task]').forEach(button => {
      const active = button.dataset.atlasTask === task.id
      button.classList.toggle('active', active)
      button.setAttribute('aria-pressed', String(active))
    })
    const tab = document.getElementById(task.target)
    if (tab) {
      tab.click()
      if (focus) tab.focus({ preventScroll: true })
    }
    const status = $('#atlasTaskStatus')
    if (status) status.textContent = `${task.label}: ${task.description}`
    scheduleUrlWrite()
  }

  function createModelGuide() {
    const networkPanel = document.querySelector('.network-panel')
    if (!networkPanel || $('#relationshipModelGuide')) return
    const details = document.createElement('details')
    details.id = 'relationshipModelGuide'
    details.className = 'relationship-model-guide'
    details.innerHTML = `
      <summary>How to read a relationship</summary>
      <div class="relationship-model-grid">
        <div><b>Availability</b><span>Present, explicit zero, unknown, or structurally unavailable.</span></div>
        <div><b>Visibility</b><span>Visible now, filtered by the current view, or hidden optional background.</span></div>
        <div><b>Provenance</b><span>Source-explicit, curator-confirmed, inferred, therapy-informed, or canonical background; direct or derived.</span></div>
        <div><b>Evidence</b><span>Grade, supporting references, conflicting references, and consensus.</span></div>
        <div><b>Causality</b><span>Causal, contributory, associated, treatment response, pharmacologic, or hypothesis.</span></div>
        <div><b>Scope</b><span>Condition, endotype, tissue, population/applicability boundaries.</span></div>
        <div><b>Curation</b><span>Reviewed, provisional, unreviewed, contested, or rejected.</span></div>
      </div>
      <p class="relationship-model-note">Compact line styles and table states are projections of this record. They are not substitutes for the complete relationship model.</p>`
    const taskNav = $('#atlasTaskNavigation')
    ;(taskNav || networkPanel.firstElementChild).after(details)
  }

  function simplifyVisualGrammar() {
    document.documentElement.dataset.atlasVisualGrammar = 'simple'
    const density = $('#networkDensity')
    const labels = $('#networkLabels')
    const evidence = $('#networkEvidence')
    if (density && !new URLSearchParams(location.search).has('density')) density.value = 'focused'
    if (labels && !new URLSearchParams(location.search).has('labels')) labels.value = 'selected'
    if (evidence && !new URLSearchParams(location.search).has('evidence')) evidence.value = 'B'
    const legend = $('#networkLegend')
    if (legend && !$('#atlasSimpleGrammar')) {
      const note = document.createElement('div')
      note.id = 'atlasSimpleGrammar'
      note.className = 'atlas-simple-grammar'
      note.innerHTML = '<b>Default grammar</b><span>Shape = entity class · color = biological family · line pattern = provenance. Node size is not comparable across entity classes.</span>'
      legend.before(note)
    }
  }

  function denominatorSnapshot() {
    const rows = governedRelations.length ? governedRelations : rebuildGovernedRelations()
    const evidenceFloor = $('#networkEvidence')?.value || 'B'
    const floorRank = gradeRank[evidenceFloor] || 3
    const canonicalOn = document.documentElement.dataset.atlasCanonicalBackground === 'true' || $('#networkCanonicalBackground')?.checked
    const exploratoryOn = document.documentElement.dataset.atlasExploratoryMappings === 'true' || $('#networkExploratoryMappings')?.checked
    const counts = {
      total: rows.length + canonicalBackgroundRegistry.length,
      present: 0,
      explicitZero: 0,
      unknown: 0,
      unavailable: 0,
      visible: 0,
      filtered: 0,
      optionalHidden: 0,
      direct: 0,
      derived: 0,
      mixed: 0,
      contested: 0,
      rejected: 0,
      belowEvidenceFloor: 0,
      canonicalAvailable: canonicalBackgroundRegistry.length,
      canonicalVisible: canonicalOn ? canonicalBackgroundRegistry.length : 0,
      exploratoryVisible: exploratoryOn ? (window.DATA?.exploratoryManifestationLinks?.length || 0) : 0,
    }
    rows.forEach(row => {
      if (row.availability === 'present') counts.present += 1
      else if (row.availability === 'explicit-zero') counts.explicitZero += 1
      else if (row.availability === 'structurally-unavailable') counts.unavailable += 1
      else counts.unknown += 1
      if ((gradeRank[row.evidence.grade] || 1) < floorRank) counts.belowEvidenceFloor += 1
      if (row.visibility === 'visible') counts.visible += 1
      else if (row.visibility === 'hidden-optional') counts.optionalHidden += 1
      else counts.filtered += 1
      if (row.provenance.directness === 'direct') counts.direct += 1
      else counts.derived += 1
      if (row.evidence.consensus === 'mixed') counts.mixed += 1
      if (row.curation.status === 'contested') counts.contested += 1
      if (row.curation.status === 'rejected') counts.rejected += 1
    })
    counts.visibleEligible = Math.max(0, counts.visible - counts.belowEvidenceFloor) + counts.canonicalVisible
    return counts
  }

  function createEpistemicDenominator() {
    const axisNote = $('#networkAxisNote')
    if (!axisNote || $('#networkEpistemicDenominator')) return
    const section = document.createElement('section')
    section.id = 'networkEpistemicDenominator'
    section.className = 'network-epistemic-denominator'
    section.setAttribute('aria-live', 'polite')
    section.innerHTML = '<div class="eyebrow">Epistemic denominator</div><div class="network-denominator-grid"></div><p>Counts describe governed records, not biological prevalence or effect magnitude.</p>'
    axisNote.after(section)
  }

  function refreshDenominator() {
    const root = $('#networkEpistemicDenominator .network-denominator-grid')
    if (!root) return
    const c = denominatorSnapshot()
    const cells = [
      ['Visible eligible', c.visibleEligible],
      ['Present', c.present],
      ['Explicit zero', c.explicitZero],
      ['Unknown', c.unknown],
      ['Structurally unavailable', c.unavailable],
      ['Below evidence floor', c.belowEvidenceFloor],
      ['Mixed evidence', c.mixed],
      ['Contested / rejected', `${c.contested} / ${c.rejected}`],
      ['Canonical background', `${c.canonicalVisible} shown / ${c.canonicalAvailable} available`],
    ]
    root.innerHTML = cells.map(([label, value]) => `<div><span>${label}</span><strong>${value}</strong></div>`).join('')
  }

  function searchEntities() {
    const entities = []
    const push = (type, id, label, aliases = []) => {
      if (!id || !label) return
      entities.push({ type, id: text(id), label: text(label), aliases: unique(aliases.map(text)), normalized: normalize([label, id, ...aliases].join(' ')) })
    }
    ;(window.DATA?.conditions || []).forEach(item => push('Condition', item.id, item.name || item.label, [item.abbr]))
    ;(window.DATA?.medications || window.DATA?.meds || []).forEach(item => push('Treatment', item.id, item.name || item.label, [item.abbr, item.target]))
    ;(window.PATHWAY_ONTOLOGY || window.DATA?.pathways || []).forEach(item => push('Pathway', item.key || item.id, item.label || item.name, item.terms || []))
    const features = unique((window.DATA?.conditions || []).flatMap(item => item.manifestations || []))
    features.forEach(label => push('Phenotype', normalize(label).replace(/ /g, '-'), label))
    return entities
  }

  let entityIndex = []
  function createGroupedSearch() {
    const input = $('#networkSearch')
    if (!input || $('#networkSearchResults')) return
    input.removeAttribute('list')
    input.setAttribute('role', 'combobox')
    input.setAttribute('aria-autocomplete', 'list')
    input.setAttribute('aria-expanded', 'false')
    input.setAttribute('aria-controls', 'networkSearchResults')
    input.setAttribute('aria-haspopup', 'listbox')
    input.placeholder = 'Search conditions, pathways, treatments, phenotypes…'
    const results = document.createElement('div')
    results.id = 'networkSearchResults'
    results.className = 'network-search-results'
    results.setAttribute('role', 'listbox')
    results.hidden = true
    input.after(results)
    entityIndex = searchEntities()
    let active = -1

    const render = () => {
      const query = normalize(input.value)
      if (!query) {
        results.hidden = true
        input.setAttribute('aria-expanded', 'false')
        active = -1
        return
      }
      const matches = entityIndex
        .map(item => ({ ...item, score: item.normalized.startsWith(query) ? 3 : item.normalized.includes(query) ? 2 : item.aliases.some(alias => normalize(alias).includes(query)) ? 1 : 0 }))
        .filter(item => item.score)
        .sort((a, b) => b.score - a.score || a.type.localeCompare(b.type) || a.label.localeCompare(b.label))
        .slice(0, 24)
      const groups = Object.groupBy ? Object.groupBy(matches, item => item.type) : matches.reduce((acc, item) => ((acc[item.type] ||= []).push(item), acc), {})
      results.innerHTML = Object.entries(groups).map(([type, items]) => `<section role="group" aria-label="${type}"><div class="network-search-group">${type}</div>${items.map(item => `<button type="button" role="option" data-search-id="${item.id}" data-search-type="${item.type}" aria-selected="false"><span>${item.label}</span><small>${item.id}</small></button>`).join('')}</section>`).join('') || '<p class="network-search-empty">No matching governed entity.</p>'
      results.hidden = false
      input.setAttribute('aria-expanded', 'true')
      active = -1
    }

    const select = button => {
      const item = entityIndex.find(entity => entity.id === button.dataset.searchId && entity.type === button.dataset.searchType)
      if (!item) return
      input.value = item.label
      state.selectedId = item.id
      if (item.type === 'Condition' && $('#networkCondition')) {
        $('#networkCondition').value = item.id
        $('#networkCondition').dispatchEvent(new Event('change', { bubbles: true }))
      } else {
        input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
      }
      results.hidden = true
      input.setAttribute('aria-expanded', 'false')
      scheduleUrlWrite()
      updateLabelDisclosure()
    }

    input.addEventListener('input', render)
    input.addEventListener('keydown', event => {
      const options = $$(`#${results.id} [role="option"]`)
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault()
        if (!options.length) return
        active = event.key === 'ArrowDown' ? (active + 1) % options.length : (active - 1 + options.length) % options.length
        options.forEach((option, index) => option.setAttribute('aria-selected', String(index === active)))
        options[active].scrollIntoView({ block: 'nearest' })
      } else if (event.key === 'Enter' && active >= 0 && options[active]) {
        event.preventDefault(); select(options[active])
      } else if (event.key === 'Escape') {
        results.hidden = true
        input.setAttribute('aria-expanded', 'false')
      }
    })
    results.addEventListener('click', event => {
      const button = event.target.closest('[role="option"]')
      if (button) select(button)
    })
    document.addEventListener('click', event => {
      if (!results.contains(event.target) && event.target !== input) {
        results.hidden = true
        input.setAttribute('aria-expanded', 'false')
      }
    })
  }

  function createLabelDisclosure() {
    const tray = $('#networkConnectedTray')
    if (!tray || $('#networkLabelDisclosure')) return
    const section = document.createElement('section')
    section.id = 'networkLabelDisclosure'
    section.className = 'network-label-disclosure'
    section.innerHTML = `
      <div><span class="eyebrow">Label disclosure</span><strong id="networkLabelDisclosureCount">Calculating visible labels…</strong></div>
      <label><input type="checkbox" id="networkNeighborhoodLabels" checked> Show selected neighborhood labels</label>
      <button type="button" class="btn sm" id="networkVisibleEntitiesButton" aria-expanded="false" aria-controls="networkVisibleEntities">Visible entities</button>
      <div id="networkVisibleEntities" class="network-visible-entities" hidden></div>`
    tray.before(section)
    $('#networkNeighborhoodLabels')?.addEventListener('change', event => {
      document.documentElement.dataset.atlasNeighborhoodLabels = String(event.target.checked)
      $('#networkFocusLabels')?.classList.toggle('labels-suppressed', !event.target.checked)
      updateLabelDisclosure()
      scheduleUrlWrite()
    })
    $('#networkVisibleEntitiesButton')?.addEventListener('click', event => {
      const list = $('#networkVisibleEntities')
      const expanded = event.currentTarget.getAttribute('aria-expanded') === 'true'
      event.currentTarget.setAttribute('aria-expanded', String(!expanded))
      list.hidden = expanded
      if (!expanded) updateVisibleEntityList()
    })
  }

  function projectedLabelCount() {
    return $$('#networkFocusLabels [data-node-id], #networkFocusLabels button, #networkConnectedTrayList button').length
  }

  function estimatedEntityCount() {
    const stats = text($('#networkStats')?.textContent)
    const match = stats.match(/(\d+)\s*(?:nodes|entities)/i)
    return match ? Number(match[1]) : entityIndex.length
  }

  function updateLabelDisclosure() {
    const visible = projectedLabelCount()
    const total = Math.max(visible, estimatedEntityCount())
    const hidden = Math.max(0, total - visible)
    const label = $('#networkLabelDisclosureCount')
    if (label) label.textContent = `${visible} disclosed · ${hidden} hidden to prevent overlap or by current filters`
  }

  function updateVisibleEntityList() {
    const list = $('#networkVisibleEntities')
    if (!list) return
    const labels = unique($$('#networkFocusLabels button, #networkConnectedTrayList button').map(button => text(button.textContent)))
    list.innerHTML = labels.length ? `<ul>${labels.map(label => `<li>${label}</li>`).join('')}</ul>` : '<p>No labels are currently projected. Use grouped search or the precision navigator to inspect an entity.</p>'
  }

  function findSelectedRelation() {
    const selectedText = normalize([$('#nodeInfo')?.textContent, $('#networkRelations')?.textContent].join(' '))
    if (state.selectedId) {
      const exact = governedRelations.find(row => row.relationshipId === state.selectedId || row.id === state.selectedId)
      if (exact) return exact
    }
    return governedRelations.find(row => {
      const terms = [row.relationshipId, row.manifestation, row.feature, row.pathwayLabel, row.pathwayKey, row.medication, row.med, row.condition].filter(Boolean)
      return terms.filter(term => normalize(term).length >= 4).some(term => selectedText.includes(normalize(term)))
    }) || null
  }

  function createProvenanceInspector() {
    const nodeInfo = $('#nodeInfo')
    if (!nodeInfo || $('#networkProvenanceInspector')) return
    const section = document.createElement('section')
    section.id = 'networkProvenanceInspector'
    section.className = 'network-provenance-inspector'
    section.setAttribute('aria-labelledby', 'networkProvenanceInspectorHeading')
    section.innerHTML = `
      <div class="network-inspector-heading"><div><span class="eyebrow">Governed provenance record</span><h4 id="networkProvenanceInspectorHeading">No relationship selected</h4></div><span id="networkInspectorInclusion" class="state-pill">Not selected</span></div>
      <dl id="networkProvenanceDimensions" class="network-provenance-dimensions"></dl>
      <div id="networkProvenanceSources" class="network-provenance-sources"></div>
      <div class="network-inspector-actions"><button type="button" class="btn sm" id="networkCopyRelationJson">Copy relation JSON</button><a class="btn sm" id="networkReportMapping" href="mailto:ramie.fathy@gmail.com?subject=Rheum-Derm%20Atlas%20mapping%20review">Report mapping issue</a></div>
      <p class="network-inspector-empty">Select a relationship in any representation. Availability, visibility, provenance, evidence, causality, scope, and curation remain independent.</p>`
    nodeInfo.after(section)
    $('#networkCopyRelationJson')?.addEventListener('click', async event => {
      const relation = findSelectedRelation()
      if (!relation) return
      await navigator.clipboard?.writeText(JSON.stringify(relation, null, 2))
      event.currentTarget.textContent = 'Copied'
      setTimeout(() => { event.currentTarget.textContent = 'Copy relation JSON' }, 1200)
    })
    const observer = new MutationObserver(() => refreshInspector())
    observer.observe(nodeInfo, { childList: true, subtree: true, characterData: true })
    if ($('#networkRelations')) observer.observe($('#networkRelations'), { childList: true, subtree: true, characterData: true })
  }

  const dimensionRow = (term, value) => `<div><dt>${term}</dt><dd>${value || 'Not specified'}</dd></div>`
  function refreshInspector() {
    const relation = findSelectedRelation()
    const root = $('#networkProvenanceInspector')
    if (!root) return
    root.classList.toggle('has-relation', Boolean(relation))
    if (!relation) return
    state.selectedId = relation.relationshipId
    $('#networkProvenanceInspectorHeading').textContent = relation.relationshipId
    $('#networkInspectorInclusion').textContent = `${relation.availability} · ${relation.visibility}`
    $('#networkProvenanceDimensions').innerHTML = [
      ['Availability', relation.availability],
      ['Visibility', relation.visibility],
      ['Provenance', `${relation.provenance.kind} · ${relation.provenance.directness}`],
      ['Evidence', `Grade ${relation.evidence.grade} · ${relation.evidence.consensus}`],
      ['Causality', `${relation.causality.meaning} · certainty ${relation.causality.certainty}`],
      ['Condition scope', relation.scope.conditionIds.join(', ')],
      ['Endotype scope', relation.scope.endotypeIds.join(', ')],
      ['Tissue scope', relation.scope.tissueIds.join(', ')],
      ['Phenotype tags', relation.phenotypeTags.join(', ')],
      ['Layout tag', `${relation.layoutTagKey} (coordinate only)`],
      ['Curation', relation.curation.status],
    ].map(([term, value]) => dimensionRow(term, value)).join('')
    const source = relation.provenance.sourceSpan ? `<blockquote>${relation.provenance.sourceSpan}</blockquote>` : '<p>No exact source span is recorded.</p>'
    const supporting = relation.evidence.supportingReferences.length ? relation.evidence.supportingReferences.join(', ') : 'None recorded'
    const conflicting = relation.evidence.conflictingReferences.length ? relation.evidence.conflictingReferences.join(', ') : 'None recorded'
    $('#networkProvenanceSources').innerHTML = `
      <h5>Claim and provenance</h5>${source}
      <p><b>Mapping rule:</b> ${relation.provenance.mappingRule || 'No generated mapping rule.'}</p>
      <p><b>Supporting references:</b> ${supporting}</p>
      <p><b>Conflicting references:</b> ${conflicting}</p>
      <p><b>Applicability:</b> ${relation.scope.applicability}</p>
      <p><b>Curation decision:</b> ${relation.curation.decision || 'No additional decision note.'}</p>`
    $('#networkReportMapping').href = `mailto:ramie.fathy@gmail.com?subject=${encodeURIComponent(`Rheum-Derm Atlas mapping review: ${relation.relationshipId}`)}&body=${encodeURIComponent(`Relationship: ${relation.relationshipId}\nView: ${location.href}\nIssue:\n`)}`
    scheduleUrlWrite()
  }

  function createNonDragControls() {
    const controls = document.querySelector('.network-view-controls')
    const canvas = $('#network3d')
    if (!controls || !canvas || $('#networkNonDragControls')) return
    canvas.setAttribute('role', 'region')
    canvas.setAttribute('aria-label', 'Optional interactive three-dimensional relationship projection. Equivalent search, precision navigation, camera, zoom, pan, and structured relationship controls are adjacent.')
    const group = document.createElement('div')
    group.id = 'networkNonDragControls'
    group.className = 'network-nondrag-controls'
    group.setAttribute('role', 'group')
    group.setAttribute('aria-label', 'Non-drag graph controls')
    group.innerHTML = `
      <button type="button" class="btn sm" data-p2-control="rotate-left" aria-label="Rotate graph left">↶</button>
      <button type="button" class="btn sm" data-p2-control="rotate-right" aria-label="Rotate graph right">↷</button>
      <button type="button" class="btn sm" data-p2-control="zoom-in" aria-label="Zoom graph in">＋</button>
      <button type="button" class="btn sm" data-p2-control="zoom-out" aria-label="Zoom graph out">−</button>
      <button type="button" class="btn sm" data-p2-control="pan-left" aria-label="Pan graph left">←</button>
      <button type="button" class="btn sm" data-p2-control="pan-right" aria-label="Pan graph right">→</button>
      <button type="button" class="btn sm" data-p2-control="pan-up" aria-label="Pan graph up">↑</button>
      <button type="button" class="btn sm" data-p2-control="pan-down" aria-label="Pan graph down">↓</button>`
    controls.after(group)
    group.addEventListener('click', event => {
      const control = event.target.closest('[data-p2-control]')?.dataset.p2Control
      if (!control) return
      const rect = canvas.getBoundingClientRect()
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2
      if (control.startsWith('zoom')) {
        canvas.dispatchEvent(new WheelEvent('wheel', { deltaY: control === 'zoom-in' ? -180 : 180, clientX: centerX, clientY: centerY, bubbles: true, cancelable: true }))
      } else {
        const shift = control.startsWith('pan')
        const delta = 42
        const dx = control.endsWith('left') ? -delta : control.endsWith('right') ? delta : 0
        const dy = control.endsWith('up') ? -delta : control.endsWith('down') ? delta : 0
        canvas.dispatchEvent(new PointerEvent('pointerdown', { pointerId: 1, clientX: centerX, clientY: centerY, button: 0, shiftKey: shift, bubbles: true }))
        canvas.dispatchEvent(new PointerEvent('pointermove', { pointerId: 1, clientX: centerX + dx, clientY: centerY + dy, buttons: 1, shiftKey: shift, bubbles: true }))
        canvas.dispatchEvent(new PointerEvent('pointerup', { pointerId: 1, clientX: centerX + dx, clientY: centerY + dy, button: 0, shiftKey: shift, bubbles: true }))
      }
      $('#networkSelectionStatus').textContent = `Applied non-drag control: ${control.replace('-', ' ')}.`
      scheduleUrlWrite()
    })
  }

  function representationId() {
    const active = document.querySelector('.representation-switch [aria-selected="true"]')
    return active?.dataset.networkRepresentation || state.representation || 'triptych'
  }

  function serializedState() {
    return {
      task: state.task,
      rep: representationId(),
      condition: $('#networkCondition')?.value || '',
      selected: state.selectedId || '',
      evidence: $('#networkEvidence')?.value || '',
      density: $('#networkDensity')?.value || '',
      family: $('#networkEdgeFamily')?.value || '',
      labels: $('#networkLabels')?.value || '',
      neighborhood: $('#networkNeighborhoodLabels')?.checked === false ? '0' : '1',
      exploratory: $('#networkExploratoryMappings')?.checked ? '1' : '0',
      canonical: $('#networkCanonicalBackground')?.checked ? '1' : '0',
      camera: state.camera,
      compareA: $('#mechanismLanesConditionA')?.value || $('#differenceConditionA')?.value || '',
      compareB: $('#mechanismLanesConditionB')?.value || $('#differenceConditionB')?.value || '',
    }
  }

  function scheduleUrlWrite() {
    if (state.suppressUrlWrite) return
    clearTimeout(scheduleUrlWrite.timer)
    scheduleUrlWrite.timer = setTimeout(writeUrlState, 80)
  }

  function writeUrlState() {
    if (state.suppressUrlWrite) return
    const params = new URLSearchParams(location.search)
    Object.entries(serializedState()).forEach(([key, value]) => value ? params.set(key, value) : params.delete(key))
    history.replaceState(null, '', `${location.pathname}?${params.toString()}${location.hash}`)
  }

  async function restoreUrlState() {
    const params = new URLSearchParams(location.search)
    state.suppressUrlWrite = true
    const setValue = (selector, key) => {
      const element = $(selector)
      const value = params.get(key)
      if (element && value && [...element.options || []].some(option => option.value === value)) {
        element.value = value
        element.dispatchEvent(new Event('change', { bubbles: true }))
      }
    }
    setValue('#networkCondition', 'condition')
    setValue('#networkEvidence', 'evidence')
    setValue('#networkDensity', 'density')
    setValue('#networkEdgeFamily', 'family')
    setValue('#networkLabels', 'labels')
    setValue('#mechanismLanesConditionA', 'compareA')
    setValue('#mechanismLanesConditionB', 'compareB')
    setValue('#differenceConditionA', 'compareA')
    setValue('#differenceConditionB', 'compareB')
    if ($('#networkExploratoryMappings') && params.has('exploratory')) {
      $('#networkExploratoryMappings').checked = params.get('exploratory') === '1'
      $('#networkExploratoryMappings').dispatchEvent(new Event('change', { bubbles: true }))
    }
    if ($('#networkCanonicalBackground') && params.has('canonical')) {
      $('#networkCanonicalBackground').checked = params.get('canonical') === '1'
      $('#networkCanonicalBackground').dispatchEvent(new Event('change', { bubbles: true }))
    }
    if ($('#networkNeighborhoodLabels') && params.has('neighborhood')) {
      $('#networkNeighborhoodLabels').checked = params.get('neighborhood') !== '0'
      $('#networkNeighborhoodLabels').dispatchEvent(new Event('change', { bubbles: true }))
    }
    state.selectedId = params.get('selected') || ''
    state.camera = params.get('camera') || 'iso'
    const rep = params.get('rep')
    const task = params.get('task') || (rep === 'free' ? 'explore3d' : 'explain')
    state.suppressUrlWrite = false
    activateTask(task, false)
    if (rep) document.querySelector(`[data-network-representation="${CSS.escape(rep)}"]`)?.click()
    if (state.camera) document.querySelector(`[data-view-preset="${CSS.escape(state.camera)}"]`)?.click()
    if (state.selectedId) {
      const entity = entityIndex.find(item => item.id === state.selectedId)
      if (entity && $('#networkSearch')) {
        $('#networkSearch').value = entity.label
        $('#networkSearch').dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
      }
    }
    scheduleUrlWrite()
  }

  function visibleSubset() {
    const floor = gradeRank[$('#networkEvidence')?.value || 'B'] || 3
    const family = $('#networkEdgeFamily')?.value || 'all'
    const exploratory = $('#networkExploratoryMappings')?.checked
    const canonical = $('#networkCanonicalBackground')?.checked
    return governedRelations.filter(row => {
      if (row.availability !== 'present') return false
      if ((gradeRank[row.evidence.grade] || 1) < floor) return false
      if (row.visibility === 'hidden-optional' && !canonical) return false
      if (row.provenance.kind === 'domain-inferred' && !exploratory) return false
      if (row.curation.status === 'rejected') return false
      if (family === 'therapy' && !['treatment-response', 'pharmacologic-target', 'secondary-modulation'].includes(row.causality.meaning)) return false
      if (family === 'phenotype' && !row.manifestation && !row.feature) return false
      if (family === 'pathogenesis' && ['treatment-response', 'pharmacologic-target', 'secondary-modulation'].includes(row.causality.meaning)) return false
      return true
    })
  }

  function download(name, type, content) {
    const url = URL.createObjectURL(new Blob([content], { type }))
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = name
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  function createShareExportControls() {
    const toolbar = document.querySelector('.network-toolbar')
    if (!toolbar || $('#networkShareControls')) return
    const group = document.createElement('div')
    group.id = 'networkShareControls'
    group.className = 'network-share-controls'
    group.setAttribute('role', 'group')
    group.setAttribute('aria-label', 'Reproducible view and export controls')
    group.innerHTML = `
      <button type="button" class="btn sm" id="networkCopyViewLink">Copy view link</button>
      <button type="button" class="btn sm" id="networkExportVisibleJson">Export visible JSON</button>
      <button type="button" class="btn sm" id="networkExportVisibleCsv">Export visible CSV</button>
      <span id="networkExportStatus" aria-live="polite"></span>`
    toolbar.appendChild(group)
    $('#networkCopyViewLink').addEventListener('click', async event => {
      writeUrlState()
      await navigator.clipboard?.writeText(location.href)
      event.currentTarget.textContent = 'Link copied'
      setTimeout(() => { event.currentTarget.textContent = 'Copy view link' }, 1200)
    })
    $('#networkExportVisibleJson').addEventListener('click', () => {
      const rows = visibleSubset()
      state.lastExportCount = rows.length
      download(`rheum-derm-atlas-visible-${Date.now()}.json`, 'application/json', JSON.stringify({ schema: 'rheum-derm-atlas-visible-subset-v1', generatedAt: new Date().toISOString(), view: serializedState(), url: location.href, count: rows.length, relationships: rows }, null, 2))
      $('#networkExportStatus').textContent = `Exported ${rows.length} visible governed relationships.`
    })
    $('#networkExportVisibleCsv').addEventListener('click', () => {
      const rows = visibleSubset()
      const columns = ['relationshipId', 'availability', 'visibility', 'provenance', 'directness', 'grade', 'consensus', 'causality', 'conditionScope', 'endotypeScope', 'tissueScope', 'curation']
      const escape = value => `"${text(value).replace(/"/g, '""')}"`
      const lines = [columns.join(','), ...rows.map(row => [row.relationshipId, row.availability, row.visibility, row.provenance.kind, row.provenance.directness, row.evidence.grade, row.evidence.consensus, row.causality.meaning, row.scope.conditionIds.join(';'), row.scope.endotypeIds.join(';'), row.scope.tissueIds.join(';'), row.curation.status].map(escape).join(','))]
      state.lastExportCount = rows.length
      download(`rheum-derm-atlas-visible-${Date.now()}.csv`, 'text/csv', lines.join('\n'))
      $('#networkExportStatus').textContent = `Exported ${rows.length} visible governed relationships.`
    })
  }

  function bindStateListeners() {
    const selectors = ['#networkCondition', '#networkEvidence', '#networkDensity', '#networkEdgeFamily', '#networkLabels', '#mechanismLanesConditionA', '#mechanismLanesConditionB', '#differenceConditionA', '#differenceConditionB', '#networkExploratoryMappings', '#networkCanonicalBackground']
    selectors.forEach(selector => $(selector)?.addEventListener('change', () => {
      setTimeout(() => {
        rebuildGovernedRelations()
        refreshP2Ui()
        scheduleUrlWrite()
      }, 0)
    }))
    $$('.representation-switch [data-network-representation]').forEach(tab => tab.addEventListener('click', () => {
      state.representation = tab.dataset.networkRepresentation
      setTimeout(() => { refreshP2Ui(); scheduleUrlWrite() }, 0)
    }))
    $$('[data-view-preset]').forEach(button => button.addEventListener('click', () => {
      state.camera = button.dataset.viewPreset
      scheduleUrlWrite()
    }))
  }

  function defaultRepresentation() {
    const params = new URLSearchParams(location.search)
    if (params.has('rep') || params.has('task')) return
    const mobile = matchMedia('(max-width: 760px)').matches || navigator.maxTouchPoints > 0
    activateTask(mobile ? 'explain' : 'explain', false)
  }

  function refreshP2Ui() {
    refreshDenominator()
    updateLabelDisclosure()
    refreshInspector()
    const mobile = matchMedia('(max-width: 760px)').matches
    document.documentElement.dataset.atlasMobileProvenanceDefault = String(mobile && representationId() !== 'free')
    document.documentElement.dataset.atlasP2Ready = 'true'
  }

  function validateP1P2() {
    const errors = []
    const rows = governedRelations.length ? governedRelations : rebuildGovernedRelations()
    const dimensions = ['availability', 'visibility', 'provenance', 'evidence', 'causality', 'scope', 'curation']
    rows.forEach(row => {
      dimensions.forEach(key => { if (!row[key]) errors.push(`${row.relationshipId}: missing ${key}`) })
      if (!RELATIONSHIP_MODEL.availability.includes(row.availability)) errors.push(`${row.relationshipId}: invalid availability`)
      if (!RELATIONSHIP_MODEL.visibility.includes(row.visibility)) errors.push(`${row.relationshipId}: invalid visibility`)
      if (!row.scope.conditionIds.length || !row.scope.endotypeIds.length || !row.scope.tissueIds.length) errors.push(`${row.relationshipId}: incomplete scope`)
      if (!Array.isArray(row.phenotypeTags) || !row.phenotypeTags.length || !row.layoutTagKey) errors.push(`${row.relationshipId}: incomplete phenotype tags`)
    })
    if (window.causalRules?.length && !$('#networkCanonicalBackground')?.checked) errors.push('Canonical background is active without explicit opt-in')
    if (!$('#atlasTaskNavigation')) errors.push('Task navigation missing')
    if (!$('#networkEpistemicDenominator')) errors.push('3D epistemic denominator missing')
    if (!$('#networkProvenanceInspector')) errors.push('Provenance inspector missing')
    if (!$('#networkShareControls')) errors.push('Reproducible view/export controls missing')
    if ($('#network3d')?.getAttribute('role') === 'application') errors.push('Canvas still uses role=application')
    if (!$('#networkNonDragControls')) errors.push('Non-drag controls missing')
    return { ok: errors.length === 0, errors, relationshipCount: rows.length, phenotypeTagCount: PHENOTYPE_TAGS.length, canonicalBackgroundCount: canonicalBackgroundRegistry.length }
  }

  async function initialize() {
    if (!window.DATA) return
    injectStylesheet()
    rebuildGovernedRelations()
    createTaskNavigation()
    createModelGuide()
    simplifyVisualGrammar()
    createEpistemicDenominator()
    createGroupedSearch()
    createLabelDisclosure()
    createProvenanceInspector()
    createNonDragControls()
    createShareExportControls()
    bindStateListeners()
    await restoreUrlState()
    defaultRepresentation()
    refreshP2Ui()
    setTimeout(refreshP2Ui, 250)
    setTimeout(refreshP2Ui, 1000)
    window.addEventListener('resize', () => setTimeout(refreshP2Ui, 60), { passive: true })
    if (window.DATA) {
      window.DATA.meta = window.DATA.meta || {}
      window.DATA.meta.p2Interface = {
        version: VERSION,
        taskOrientedNavigation: true,
        provenanceFirstDefault: true,
        simplifiedVisualGrammar: true,
        epistemicDenominators: true,
        groupedSearchAndLabelDisclosure: true,
        expandedProvenanceInspector: true,
        reproducibleUrlsAndVisibleSubsetExport: true,
        nonDragTouchAndAssistiveAlternatives: true,
      }
    }
  }

  window.__ATLAS_P1__ = Object.freeze({
    version: VERSION,
    relationshipModel: RELATIONSHIP_MODEL,
    phenotypeTags: PHENOTYPE_TAGS,
    canonicalBackgroundRegistry,
    get relations() { return governedRelations },
    normalizeRelation,
    registerConflict,
    validate: validateP1P2,
  })

  window.__ATLAS_P2__ = Object.freeze({
    version: VERSION,
    tasks: TASKS,
    activateTask,
    serialize: serializedState,
    restore: restoreUrlState,
    visibleSubset,
    denominators: denominatorSnapshot,
    refresh: refreshP2Ui,
    validate: validateP1P2,
    get state() { return clone(state) },
  })

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => void initialize(), { once: true })
  } else {
    void initialize()
  }
})()
