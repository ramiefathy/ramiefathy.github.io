const ALLOWED_CATEGORIES = new Set(['Biologics', 'Targeted', 'Conventional'])
const ALLOWED_FREQUENCIES = new Set(['minimal', 'moderate', 'frequent'])
const ALLOWED_RISK_LEVELS = new Set(['low', 'moderate', 'high'])
const ALLOWED_WARNING_FLAGS = new Set([
  'boxed-warning',
  'teratogenic',
  'rems',
  'age-65-plus',
  'pediatric',
  'infection',
  'psychiatric'
])

const IBD_CONDITION_IDS = new Set(['crohns-disease', 'ulcerative-colitis'])

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0
}

function addIssue(collection, entryId, field, message) {
  collection.push({ entryId, field, message })
}

function normalizeUniqueStrings(value) {
  if (!Array.isArray(value)) return []
  return [...new Set(value.filter(isNonEmptyString).map((item) => item.trim()))]
}

function validateReference(reference, entry, errors) {
  if (!reference || !isNonEmptyString(reference.label) || !isNonEmptyString(reference.url)) {
    addIssue(errors, entry.id, 'references', 'Each reference requires a label and URL.')
    return
  }

  let parsed
  try {
    parsed = new URL(reference.url)
  } catch (error) {
    addIssue(errors, entry.id, 'references', `Invalid reference URL: ${reference.url}`)
    return
  }

  if (parsed.protocol !== 'https:') {
    addIssue(errors, entry.id, 'references', `Reference must use HTTPS: ${reference.url}`)
  }
}

function validateTask(task, entry, errors) {
  if (!task || !isNonEmptyString(task.id) || !isNonEmptyString(task.label)) {
    addIssue(errors, entry.id, 'baselineTasks', 'Each baseline task requires an id and label.')
  }
}

function validateSchedule(item, entry, errors) {
  if (!item || !isNonEmptyString(item.id) || !isNonEmptyString(item.timing) || !isNonEmptyString(item.description)) {
    addIssue(errors, entry.id, 'monitoringSchedule', 'Each monitoring schedule item requires id, timing, and description.')
  }
  if (item?.relativeWeeks !== null && item?.relativeWeeks !== undefined && (!Number.isFinite(item.relativeWeeks) || item.relativeWeeks < 0)) {
    addIssue(errors, entry.id, 'monitoringSchedule', 'relativeWeeks must be null or a finite non-negative number.')
  }
}

function reconcileKnownClinicalSemantics(entry, corrections, warnings) {
  entry.conditions = normalizeUniqueStrings(entry.conditions)
  entry.cautionConditions = normalizeUniqueStrings(entry.cautionConditions)

  if (entry.id === 'il17-inhibitors') {
    const removed = entry.conditions.filter((condition) => IBD_CONDITION_IDS.has(condition))
    if (removed.length) {
      entry.conditions = entry.conditions.filter((condition) => !IBD_CONDITION_IDS.has(condition))
      entry.cautionConditions = [...new Set([...entry.cautionConditions, ...removed])]
      corrections.push({
        entryId: entry.id,
        field: 'conditions',
        message: `Moved ${removed.join(', ')} from treatment indications to caution conditions.`
      })
    }

    if (!entry.cautionConditions.some((condition) => IBD_CONDITION_IDS.has(condition))) {
      entry.cautionConditions = [...entry.cautionConditions, ...IBD_CONDITION_IDS]
      corrections.push({
        entryId: entry.id,
        field: 'cautionConditions',
        message: 'Added inflammatory bowel disease caution context for IL-17 blockade.'
      })
    }
  }

  if (entry.conditions.some((condition) => entry.cautionConditions.includes(condition))) {
    addIssue(
      warnings,
      entry.id,
      'conditions',
      'A condition is represented as both a treatment indication and caution; agent-level reconciliation is required.'
    )
  }
}

export function runClinicalDataGate({ monitoringEntries, conditionLabels, requirementLabels, dataVersion }) {
  const errors = []
  const warnings = []
  const corrections = []
  const seenIds = new Set()

  if (!Array.isArray(monitoringEntries) || monitoringEntries.length === 0) {
    errors.push({ entryId: 'dataset', field: 'monitoringEntries', message: 'Monitoring dataset is empty.' })
  }
  if (!isNonEmptyString(dataVersion) || !/^\d{4}-\d{2}-\d{2}$/.test(dataVersion)) {
    errors.push({ entryId: 'dataset', field: 'dataVersion', message: 'dataVersion must use YYYY-MM-DD.' })
  }

  for (const entry of monitoringEntries ?? []) {
    const entryId = isNonEmptyString(entry?.id) ? entry.id : 'unknown-entry'
    if (!isNonEmptyString(entry?.id)) addIssue(errors, entryId, 'id', 'Entry id is required.')
    if (seenIds.has(entryId)) addIssue(errors, entryId, 'id', 'Entry id must be unique.')
    seenIds.add(entryId)

    for (const field of ['name', 'summary', 'baseline', 'monitoring', 'cautions', 'contraindications', 'interactions', 'dosing']) {
      if (!isNonEmptyString(entry?.[field])) addIssue(errors, entryId, field, `${field} is required.`)
    }

    if (!ALLOWED_CATEGORIES.has(entry?.category)) addIssue(errors, entryId, 'category', `Unsupported category: ${entry?.category}`)
    if (!ALLOWED_FREQUENCIES.has(entry?.monitoringFrequency)) {
      addIssue(errors, entryId, 'monitoringFrequency', `Unsupported monitoring frequency: ${entry?.monitoringFrequency}`)
    }
    if (!ALLOWED_RISK_LEVELS.has(entry?.riskLevel)) addIssue(errors, entryId, 'riskLevel', `Unsupported risk level: ${entry?.riskLevel}`)

    entry.agents = normalizeUniqueStrings(entry.agents)
    entry.tags = normalizeUniqueStrings(entry.tags)
    entry.warningFlags = normalizeUniqueStrings(entry.warningFlags)
    entry.holdCriteria = normalizeUniqueStrings(entry.holdCriteria)

    if (!entry.agents.length) addIssue(errors, entryId, 'agents', 'At least one agent is required.')
    if (!Array.isArray(entry.baselineTasks) || !entry.baselineTasks.length) {
      addIssue(errors, entryId, 'baselineTasks', 'At least one baseline task is required.')
    } else {
      entry.baselineTasks.forEach((task) => validateTask(task, entry, errors))
    }
    if (!Array.isArray(entry.monitoringSchedule) || !entry.monitoringSchedule.length) {
      addIssue(errors, entryId, 'monitoringSchedule', 'At least one monitoring schedule item is required.')
    } else {
      entry.monitoringSchedule.forEach((item) => validateSchedule(item, entry, errors))
    }
    if (!Array.isArray(entry.references) || !entry.references.length) {
      addIssue(errors, entryId, 'references', 'At least one source reference is required.')
    } else {
      entry.references.forEach((reference) => validateReference(reference, entry, errors))
    }

    for (const flag of entry.warningFlags) {
      if (!ALLOWED_WARNING_FLAGS.has(flag)) addIssue(errors, entryId, 'warningFlags', `Unsupported warning flag: ${flag}`)
    }
    for (const condition of entry.conditions ?? []) {
      if (!conditionLabels?.[condition]) addIssue(errors, entryId, 'conditions', `Unknown condition id: ${condition}`)
    }
    for (const tag of entry.tags) {
      if (!requirementLabels?.[tag]) addIssue(errors, entryId, 'tags', `Unknown monitoring requirement id: ${tag}`)
    }

    reconcileKnownClinicalSemantics(entry, corrections, warnings)
  }

  return {
    ok: errors.length === 0,
    dataVersion,
    entryCount: monitoringEntries?.length ?? 0,
    errors,
    warnings,
    corrections
  }
}

export function formatClinicalDataDate(dataVersion) {
  const parsed = new Date(`${dataVersion}T00:00:00Z`)
  if (Number.isNaN(parsed.getTime())) return dataVersion
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC'
  }).format(parsed)
}
