/** Shared, DOM-free clinical-data and export contracts. This is not clinical validation. */
export const CLINICAL_SCOPE = 'Educational reference only—not prescribing advice, a complete interaction checker, or clearance to start/refill treatment. Verify the current agent-, indication-, age- and jurisdiction-specific label and local protocol. Class condition tags can include off-label uses and never imply approval for every member.';
export const CHECKLIST_SCOPE = 'Temporary, unverified checklist marks for this page only; not a patient record or proof that testing was performed. Marks clear on reload and must be cleared between encounters.';

export function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}

export function highlightSafe(text = '', query = '') {
  if (!query) return escapeHtml(text);
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return String(text).split(new RegExp(`(${escaped})`, 'gi')).map((part, index) =>
    index % 2 ? `<mark class="highlight">${escapeHtml(part)}</mark>` : escapeHtml(part)
  ).join('');
}

function requireValue(condition, message) {
  if (!condition) throw new Error(`Invalid monitoring dataset: ${message}`);
}
const text = (value) => typeof value === 'string' && value.trim().length > 0;
const validDate = (value) => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) &&
  Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;

export function validateMonitoringData(data) {
  requireValue(validDate(data.dataVersion) && validDate(data.safetyRevision), 'version dates');
  requireValue(Array.isArray(data.monitoringEntries) && data.monitoringEntries.length > 0, 'entries');
  const ids = new Set();
  for (const entry of data.monitoringEntries) {
    requireValue(entry && /^[a-z0-9-]+$/.test(entry.id) && !ids.has(entry.id), 'unique entry ID');
    ids.add(entry.id);
    for (const field of ['name', 'summary', 'baseline', 'monitoring', 'cautions', 'contraindications', 'interactions', 'dosing']) {
      requireValue(text(entry[field]), `${entry.id}.${field}`);
    }
    requireValue(['Biologics', 'Targeted', 'Conventional'].includes(entry.category), `${entry.id}.category`);
    requireValue(['low', 'moderate', 'high'].includes(entry.riskLevel), `${entry.id}.riskLevel`);
    requireValue(Object.hasOwn(data.MONITORING_FREQUENCY_LABELS, entry.monitoringFrequency), `${entry.id}.frequency`);
    requireValue(Array.isArray(entry.agents) && entry.agents.length > 0 && entry.agents.every(text), `${entry.id}.agents`);
    for (const [field, dictionary] of [['conditions', 'CONDITION_LABELS'], ['tags', 'REQUIREMENT_LABELS'], ['warningFlags', 'RISK_BADGE_LABELS']]) {
      requireValue(Array.isArray(entry[field]) && new Set(entry[field]).size === entry[field].length &&
        entry[field].every((value) => Object.hasOwn(data[dictionary], value)), `${entry.id}.${field}`);
    }
    requireValue(Array.isArray(entry.holdCriteria) && entry.holdCriteria.every(text), `${entry.id}.holdCriteria`);
    requireValue(Array.isArray(entry.references) && entry.references.length > 0, `${entry.id}.references`);
    for (const reference of entry.references) {
      let url;
      try { url = new URL(reference.url); } catch { /* Rejected below. */ }
      requireValue(text(reference.label) && url?.protocol === 'https:' && !url.username && !url.password, `${entry.id}.reference`);
    }
    for (const field of ['baselineTasks', 'monitoringSchedule']) {
      requireValue(Array.isArray(entry[field]) && entry[field].length > 0, `${entry.id}.${field}`);
      const itemIds = new Set();
      for (const item of entry[field]) {
        requireValue(item && /^[a-z0-9-]+$/.test(item.id) && !itemIds.has(item.id), `${entry.id}.${field}.ID`);
        itemIds.add(item.id);
        if (field === 'baselineTasks') {
          requireValue(text(item.label) && typeof item.critical === 'boolean' && typeof item.notes === 'string', `${entry.id}.task`);
        } else {
          requireValue(text(item.timing) && text(item.description) && ['standard', 'high', 'critical'].includes(item.priority), `${entry.id}.schedule`);
          requireValue(item.relativeWeeks == null || (Number.isFinite(item.relativeWeeks) && item.relativeWeeks >= 0), `${entry.id}.relativeWeeks`);
        }
      }
    }
    if (entry.safetyReview) {
      requireValue(validDate(entry.safetyReview.date) && text(entry.safetyReview.scope) && text(entry.safetyReview.status), `${entry.id}.safetyReview`);
    }
  }
  return true;
}

export function reviewSummary(entry, dataVersion) {
  return entry.safetyReview
    ? `Targeted safety correction ${entry.safetyReview.date}: ${entry.safetyReview.scope}. ${entry.safetyReview.status}. Original dataset: ${dataVersion}.`
    : `Original dataset: ${dataVersion}. This entry has not received a complete current-label validation; verify all clinical details.`;
}

export function clinicalExport(entry, dataVersion, checklist) {
  const mark = (type, id) => checklist ? `${checklist[type]?.[id] ? '[x]' : '[ ]'} ` : '- ';
  return [
    `Monitoring reference: ${entry.name} (${entry.agents.join(', ')})`, CLINICAL_SCOPE,
    reviewSummary(entry, dataVersion), CHECKLIST_SCOPE, '', 'Baseline:', entry.baseline,
    ...entry.baselineTasks.map((task) => `${mark('baseline', task.id)}${task.label}${task.critical ? ' [important]' : ''}${task.notes ? ` — ${task.notes}` : ''}`),
    '', 'Follow-up:', entry.monitoring,
    ...entry.monitoringSchedule.map((item) => `${mark('monitoring', item.id)}${item.timing}: ${item.description}`),
    '', 'Hold / adjustment considerations:', ...entry.holdCriteria.map((value) => `- ${value}`),
    '', `Contraindications / precautions: ${entry.contraindications}`, `Cautions: ${entry.cautions}`,
    `Interactions (not exhaustive): ${entry.interactions}`, `Dosing context: ${entry.dosing}`,
    '', 'Sources (verify current versions):', ...entry.references.map((reference) => `${reference.label}: ${reference.url}`)
  ].join('\n');
}

export function csvCell(value) {
  let result = String(value ?? '');
  // CSV quotes alone do not prevent spreadsheet formula execution.
  if (/^[\s]*[=+@-]/.test(result) || /^[\t\r\n]/.test(result)) result = `'${result}`;
  return `"${result.replace(/"/g, '""')}"`;
}
