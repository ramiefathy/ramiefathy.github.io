import {
  monitoringEntries,
  CONDITION_LABELS,
  REQUIREMENT_LABELS,
  MONITORING_FREQUENCY_LABELS,
  RISK_BADGE_LABELS,
  dataVersion
} from './data.js';

const COPY_BUTTON_LABEL = 'Copy monitoring checklist for clinical note';

const RISK_LEVEL_LABELS = {
  high: 'High risk',
  moderate: 'Moderate risk',
  low: 'Lower risk'
};

const riskBadgeConfig = {
  'boxed-warning': { icon: '⚠️', className: 'badge-boxed' },
  teratogenic: { icon: '🤰', className: 'badge-teratogenic' },
  rems: { icon: '📋', className: 'badge-rems' },
  'age-65-plus': { icon: '🧓', className: 'badge-age' },
  pediatric: { icon: '🧒', className: 'badge-pediatric' },
  infection: { icon: '🦠', className: 'badge-infection' }
};

const riskBadgeDescriptions = {
  'boxed-warning':
    'FDA boxed warning present – review prescribing information for life-threatening risks, monitoring, and contraindications before prescribing.',
  teratogenic:
    'Teratogenic risk – requires strict pregnancy prevention, counseling, and testing per regimen guidelines.',
  rems:
    'REMS program required – enrollment and compliance with Risk Evaluation and Mitigation Strategy are mandatory.',
  'age-65-plus':
    'Higher risk in patients aged 65 and older – evaluate cardiovascular, malignancy, and infection risks closely.',
  pediatric:
    'Pediatric-specific considerations – dosing, safety, or monitoring differs in children and adolescents.',
  infection:
    'Elevated serious infection risk – ensure screening, vaccination, and patient counseling on early symptom reporting.'
};

const STORAGE_KEYS = {
  favorites: 'biologic-dashboard:favorites',
  recent: 'biologic-dashboard:recent',
  checklist: 'biologic-dashboard:checklist'
};

const MAX_COMPARISON = 3;
const RECENT_LIMIT = 5;

const userPreferences = {
  favorites: loadSet(STORAGE_KEYS.favorites),
  recent: loadArray(STORAGE_KEYS.recent),
  checklist: loadChecklist(STORAGE_KEYS.checklist)
};

const state = {
  search: '',
  categories: new Set(['Biologics', 'Targeted', 'Conventional']),
  conditions: new Set(),
  requirements: new Set(),
  riskLevels: new Set(),
  monitoringIntensity: new Set(),
  expanded: new Set(),
  activeTabs: new Map(),
  comparison: new Set(),
  viewMode: 'cards'
};

const dom = {
  searchInput: document.querySelector('#search-input'),
  categoryButtons: document.querySelectorAll('[data-category]'),
  conditionFilters: document.querySelector('#condition-filters'),
  requirementFilters: document.querySelector('#requirement-filters'),
  riskFilters: document.querySelector('#risk-filters'),
  intensityFilters: document.querySelector('#intensity-filters'),
  viewToggle: document.querySelector('#view-toggle'),
  resetButton: document.querySelector('#reset-filters'),
  exportCsvButton: document.querySelector('#export-csv'),
  labTemplatesButton: document.querySelector('#lab-templates'),
  themeToggle: document.querySelector('#theme-toggle'),
  resultsContainer: document.querySelector('#results'),
  resultCount: document.querySelector('#result-count'),
  favoritesList: document.querySelector('#favorites-list'),
  recentList: document.querySelector('#recent-list'),
  comparisonView: document.querySelector('#comparison-view'),
  modalRoot: document.querySelector('#modal-root'),
  panelCloseButtons: document.querySelectorAll('.panel-close'),
  favoritesPanel: document.querySelector('#favorites-panel'),
  recentPanel: document.querySelector('#recent-panel')
};

let dropdownOutsideListenerAttached = false;

const filterOptions = {
  conditions: buildFilterOptions(extractUniqueValues('conditions'), CONDITION_LABELS),
  requirements: buildFilterOptions(extractUniqueValues('tags'), REQUIREMENT_LABELS),
  riskLevels: buildFilterOptions(extractUniqueValues('riskLevel'), RISK_LEVEL_LABELS),
  monitoringIntensity: buildFilterOptions(extractUniqueValues('monitoringFrequency'), MONITORING_FREQUENCY_LABELS)
};

function extractUniqueValues(key) {
  const values = new Set();
  monitoringEntries.forEach((entry) => {
    const payload = entry[key];
    if (!payload) return;
    if (Array.isArray(payload)) {
      payload.forEach((item) => values.add(item));
    } else {
      values.add(payload);
    }
  });
  return Array.from(values).filter(Boolean);
}

function buildFilterOptions(values, labelMap) {
  return values
    .map((value) => ({ id: value, label: labelMap[value] || toTitleCase(value) }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

function escapeAttribute(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function loadSet(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch (error) {
    console.warn('Failed to load set from storage', error);
    return new Set();
  }
}

function loadArray(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn('Failed to load array from storage', error);
    return [];
  }
}

function loadChecklist(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch (error) {
    console.warn('Failed to load checklist from storage', error);
    return {};
  }
}

function persistFavorites() {
  localStorage.setItem(STORAGE_KEYS.favorites, JSON.stringify(Array.from(userPreferences.favorites)));
}

function persistRecent() {
  localStorage.setItem(STORAGE_KEYS.recent, JSON.stringify(userPreferences.recent));
}

function persistChecklist() {
  localStorage.setItem(STORAGE_KEYS.checklist, JSON.stringify(userPreferences.checklist));
}

function toTitleCase(value) {
  return value
    .replace(/[-_]/g, ' ')
    .replace(/\b([a-z])/g, (char) => char.toUpperCase());
}

function normalise(text) {
  return text.toLowerCase();
}

function matchesSearch(entry, query) {
  if (!query) return true;
  const conditionLabels = (entry.conditions || [])
    .map((id) => CONDITION_LABELS[id] || id)
    .join(' ');
  const requirementLabels = (entry.tags || [])
    .map((id) => REQUIREMENT_LABELS[id] || id)
    .join(' ');
  const baselineTasks = (entry.baselineTasks || [])
    .map((item) => `${item.label} ${item.notes || ''}`)
    .join(' ');
  const monitoringItems = (entry.monitoringSchedule || [])
    .map((item) => `${item.timing} ${item.description}`)
    .join(' ');
  const holdCriteria = (entry.holdCriteria || []).join(' ');

  const haystack = [
    entry.name,
    entry.agents.join(' '),
    entry.summary,
    entry.baseline,
    entry.monitoring,
    entry.cautions,
    entry.contraindications,
    entry.interactions,
    entry.dosing,
    conditionLabels,
    requirementLabels,
    baselineTasks,
    monitoringItems,
    holdCriteria
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return haystack.includes(query);
}

function highlightText(text, query) {
  if (!query || !text) return text;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, 'gi');
  return text.replace(regex, '<mark class="highlight">$1</mark>');
}

function filterEntries() {
  const query = normalise(state.search);
  return monitoringEntries.filter((entry) => {
    const categoryMatch = state.categories.has(entry.category);
    const searchMatch = matchesSearch(entry, query);
    const conditionMatch =
      state.conditions.size === 0 || (entry.conditions || []).some((condition) => state.conditions.has(condition));
    const requirementMatch =
      state.requirements.size === 0 ||
      Array.from(state.requirements).every((req) => (entry.tags || []).includes(req));
    const riskMatch = state.riskLevels.size === 0 || state.riskLevels.has(entry.riskLevel);
    const intensityMatch =
      state.monitoringIntensity.size === 0 || state.monitoringIntensity.has(entry.monitoringFrequency);
    return categoryMatch && searchMatch && conditionMatch && requirementMatch && riskMatch && intensityMatch;
  });
}

function renderFilterChips(container, options, stateSet) {
  if (!container) return;
  container.innerHTML = '';
  const fragment = document.createDocumentFragment();
  options.forEach((option, index) => {
    const label = document.createElement('label');
    label.className = 'dropdown-option';
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = stateSet.has(option.id);
    input.dataset.filterId = option.id;
    input.id = `${container.id || 'filter'}-${index}`;
    input.addEventListener('change', (event) => {
      if (event.target.checked) {
        stateSet.add(option.id);
      } else {
        stateSet.delete(option.id);
      }
      announce(`Filter updated: ${option.label}`);
      render();
    });
    const wrapper = document.createElement('span');
    wrapper.className = 'dropdown-option__text';
    wrapper.textContent = option.label;
    label.appendChild(input);
    label.appendChild(wrapper);
    fragment.appendChild(label);
  });
  container.appendChild(fragment);
}

function setupDropdowns() {
  const dropdowns = document.querySelectorAll('[data-dropdown]');
  if (!dropdowns.length) return;
  dropdowns.forEach((dropdown) => {
    const toggle = dropdown.querySelector('[data-dropdown-toggle]');
    const panel = dropdown.querySelector('[data-dropdown-panel]');
    if (!toggle || !panel || toggle.dataset.dropdownReady === 'true') return;
    toggle.dataset.dropdownReady = 'true';
    toggle.setAttribute('aria-expanded', 'false');
    panel.setAttribute('aria-hidden', 'true');
    toggle.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      const isOpen = dropdown.classList.contains('is-open');
      closeAllDropdowns();
      if (!isOpen) {
        dropdown.classList.add('is-open');
        toggle.setAttribute('aria-expanded', 'true');
        panel.setAttribute('aria-hidden', 'false');
      }
    });
  });

  if (!dropdownOutsideListenerAttached) {
    document.addEventListener('click', (event) => {
      if (!event.target.closest('[data-dropdown]')) {
        closeAllDropdowns();
      }
    });
    dropdownOutsideListenerAttached = true;
  }
}

function closeAllDropdowns() {
  document.querySelectorAll('[data-dropdown]').forEach((dropdown) => {
    dropdown.classList.remove('is-open');
    const toggle = dropdown.querySelector('[data-dropdown-toggle]');
    const panel = dropdown.querySelector('[data-dropdown-panel]');
    if (toggle) toggle.setAttribute('aria-expanded', 'false');
    if (panel) panel.setAttribute('aria-hidden', 'true');
  });
}

function buildRiskIndicators(entry) {
  if (!entry.warningFlags || !entry.warningFlags.length) return '';
  const badges = entry.warningFlags
    .map((flag) => {
      const config = riskBadgeConfig[flag] || { icon: '⚠️', className: 'badge-generic' };
      const label = RISK_BADGE_LABELS[flag] || toTitleCase(flag);
      const description = riskBadgeDescriptions[flag] || 'Review prescribing information for additional safety guidance.';
      return `<span class="risk-badge ${config.className}" tabindex="0" data-tooltip="${escapeAttribute(
        description
      )}" aria-label="${escapeAttribute(description)}">${config.icon} <span class="risk-badge__text">${label}</span></span>`;
    })
    .join('');
  return `<div class="risk-indicators">${badges}</div>`;
}

function buildMetaChips(entry) {
  const conditions = (entry.conditions || [])
    .map((id) => CONDITION_LABELS[id] || toTitleCase(id))
    .map((label) => `<span class="meta-chip">${label}</span>`)
    .join('');
  const requirements = (entry.tags || [])
    .map((id) => REQUIREMENT_LABELS[id] || toTitleCase(id))
    .map((label) => `<span class="meta-chip meta-chip--muted">${label}</span>`)
    .join('');
  return `
    <div class="meta-group">
      ${conditions ? `<div class="meta-row">${conditions}</div>` : ''}
      ${requirements ? `<div class="meta-row requirements">${requirements}</div>` : ''}
    </div>
  `;
}

function buildChecklist(entry, type, items, query) {
  if (!items || !items.length) return '<p class="muted">No tasks recorded.</p>';
  const entryChecklist = userPreferences.checklist[entry.id]?.[type] || {};
  return `<div class="checklist">${items
    .map((item) => {
      const checked = Boolean(entryChecklist[item.id]);
      const label = highlightText(item.label, query);
      const notes = item.notes ? `<small>${highlightText(item.notes, query)}</small>` : '';
      const inputId = `${entry.id}-${type}-${item.id}`;
      return `
        <label class="checklist-row ${item.critical ? 'is-critical' : ''}" for="${inputId}">
          <input type="checkbox" id="${inputId}" data-action="checklist" data-entry-id="${entry.id}" data-checklist-type="${type}" data-item-id="${item.id}" ${
        checked ? 'checked' : ''
      }>
          <div class="checklist-copy">
            <span>${label}</span>
            ${notes}
          </div>
        </label>
      `;
    })
    .join('')}</div>`;
}

function buildHoldCriteria(entry, query) {
  if (!entry.holdCriteria || !entry.holdCriteria.length) return '<p class="muted">No hold parameters recorded.</p>';
  return `<ul class="bullet-list">${entry.holdCriteria
    .map((item) => `<li>${highlightText(item, query)}</li>`)
    .join('')}</ul>`;
}

function buildReferences(entry) {
  if (!entry.references || !entry.references.length) return '';
  return `<div class="references-row" role="list">${entry.references
    .map((ref) => `<a class="reference-chip" role="listitem" href="${ref.url}" target="_blank" rel="noopener noreferrer">${ref.label}</a>`)
    .join('')}</div>`;
}

function buildTimeline(entry) {
  const items = entry.monitoringSchedule || [];
  if (!items.length) return '';
  const numericWeeks = items.map((item) => item.relativeWeeks).filter((value) => typeof value === 'number');
  const maxWeeks = numericWeeks.length ? Math.max(...numericWeeks, 52) : 52;
  const points = items.map((item) => {
    const weeks = typeof item.relativeWeeks === 'number' ? item.relativeWeeks : maxWeeks + 8;
    const position = Math.min(100, Math.round((weeks / Math.max(maxWeeks, 1)) * 100));
    return {
      label: item.timing,
      description: item.description,
      priority: item.priority,
      position
    };
  });
  return `
    <div class="timeline">
      <div class="timeline-track">
        ${points
          .map(
            (point) => `
              <div class="timeline-point timeline-point--${point.priority}" style="left: ${point.position}%">
                <div class="timeline-marker"></div>
                <div class="timeline-tooltip">
                  <strong>${point.label}</strong>
                  <span>${point.description}</span>
                </div>
              </div>
            `
          )
          .join('')}
      </div>
      <div class="timeline-axis">
        <span>Baseline</span>
        <span>3 mo</span>
        <span>6 mo</span>
        <span>12 mo</span>
        <span>Ongoing</span>
      </div>
    </div>
  `;
}

function buildClipboardText(entry) {
  const agents = entry.agents.join(', ');
  const header = `**<u>Monitoring checklist for ${entry.name} (${agents})</u>**`;

  const baselineItems = (entry.baselineTasks || []).map((task) => `- ${task.label}`);
  const followUpItems = (entry.monitoringSchedule || []).map(
    (item) => `- ${item.timing}: ${item.description}`
  );

  const baselineSection = baselineItems.length
    ? baselineItems.join('\n')
    : '- Refer to regimen baseline guidance';
  const followUpSection = followUpItems.length
    ? followUpItems.join('\n')
    : '- Clinical surveillance per specialist guidance';

  const cautionsLine = entry.cautions ? `*Cautions: ${entry.cautions}*` : '';

  return [
    header,
    '',
    '<u>Baseline:</u>',
    baselineSection,
    '',
    '<u>Follow-up:</u>',
    followUpSection,
    '',
    cautionsLine
  ]
    .filter((segment, index, arr) => segment || arr[index - 1])
    .join('\n');
}

function renderEntryCard(entry, query) {
  const isExpanded = state.expanded.has(entry.id);
  const activeTab = state.activeTabs.get(entry.id) || 'monitoring';
  const isFavorite = userPreferences.favorites.has(entry.id);
  const isCompared = state.comparison.has(entry.id);

  const summary = highlightText(entry.summary || '', query);
  const baselineOverview = highlightText(entry.baseline || '', query);
  const monitoringOverview = highlightText(entry.monitoring || '', query);
  const precautions = highlightText(entry.cautions || 'No cautions documented.', query);
  const contraindications = highlightText(entry.contraindications || 'No contraindications documented.', query);
  const interactions = highlightText(entry.interactions || 'No notable interactions documented.', query);
  const dosing = highlightText(entry.dosing || 'Refer to prescribing information.', query);

  const baselineChecklist = buildChecklist(entry, 'baseline', entry.baselineTasks, query);
  const monitoringChecklistData = (entry.monitoringSchedule || []).map((item) => ({
    id: item.id,
    label: `${item.timing}: ${item.description}`,
    critical: item.priority === 'critical'
  }));
  const monitoringChecklist = buildChecklist(entry, 'monitoring', monitoringChecklistData, query);
  const holdCriteria = buildHoldCriteria(entry, query);
  const timeline = buildTimeline(entry);

  const tabPanels = {
    monitoring: `
      <div class="grid-split">
        <section>
          <h4>Baseline essentials</h4>
          <p class="muted">${baselineOverview}</p>
          ${baselineChecklist}
        </section>
        <section>
          <h4>Follow-up cadence</h4>
          <p class="muted">${monitoringOverview}</p>
          ${timeline}
          ${monitoringChecklist}
        </section>
      </div>
      <section>
        <h4>Hold or adjust therapy when</h4>
        ${holdCriteria}
      </section>
    `,
    contraindications: `<p>${contraindications}</p>`,
    interactions: `<p>${interactions}</p>`,
    dosing: `<p>${dosing}</p>`
  };

  return `
    <article class="entry-card" data-entry-id="${entry.id}">
      <header class="entry-header">
        <div class="entry-header__titles">
          <p class="entry-category">${entry.category}</p>
          <h2>${highlightText(entry.name, query)}</h2>
          <p class="entry-summary">${summary}</p>
          ${buildRiskIndicators(entry)}
        </div>
        <div class="entry-header__meta">
          <span class="agent-count">${entry.agents.length} agent${entry.agents.length > 1 ? 's' : ''}</span>
          <span class="meta-pill">${RISK_LEVEL_LABELS[entry.riskLevel] || 'Risk profile'}</span>
          <span class="meta-pill">${
            MONITORING_FREQUENCY_LABELS[entry.monitoringFrequency] || 'Monitoring'
          }</span>
          <div class="meta-actions">
            <button type="button" class="icon-btn favorite-btn ${isFavorite ? 'is-active' : ''}" data-action="toggle-favorite" data-entry-id="${entry.id}" aria-pressed="${isFavorite}">
              <span aria-hidden="true">${isFavorite ? '★' : '☆'}</span>
              <span class="sr-only">${isFavorite ? 'Remove from favorites' : 'Add to favorites'}</span>
            </button>
            <button type="button" class="icon-btn compare-btn ${isCompared ? 'is-active' : ''}" data-action="toggle-compare" data-entry-id="${entry.id}" aria-pressed="${isCompared}">
              <span aria-hidden="true">⇄</span>
              <span class="sr-only">${isCompared ? 'Remove from comparison' : 'Add to comparison'}</span>
            </button>
            <button class="secondary-btn export-btn" type="button" data-action="export-checklist" data-entry-id="${entry.id}">Export checklist</button>
          </div>
        </div>
      </header>
      <div class="entry-meta-block">
        <div>
          <h3>Agents</h3>
          <p class="agent-list">${highlightText(entry.agents.join(', '), query)}</p>
        </div>
        ${buildMetaChips(entry)}
      </div>
      <div class="entry-toggle">
        <button class="expand-btn" type="button" data-action="toggle-details" data-entry-id="${entry.id}" aria-expanded="${isExpanded}">
          <span class="expand-btn__label">${isExpanded ? 'Hide monitoring details' : 'View monitoring details'}</span>
          <span class="expand-btn__icon" aria-hidden="true">${isExpanded ? '▴' : '▾'}</span>
        </button>
      </div>
      <div class="entry-details ${isExpanded ? 'is-open' : ''}" data-entry-details="${entry.id}" aria-hidden="${!isExpanded}">
        <div class="detail-tabs" role="tablist">
          ${['monitoring', 'contraindications', 'interactions', 'dosing']
            .map((tab) => {
              const label =
                tab === 'monitoring'
                  ? 'Monitoring'
                  : tab === 'contraindications'
                  ? 'Contraindications'
                  : tab === 'interactions'
                  ? 'Drug interactions'
                  : 'Dosing notes';
              const isActive = activeTab === tab;
              return `<button type="button" class="tab-btn ${isActive ? 'is-active' : ''}" data-action="switch-tab" data-entry-id="${entry.id}" data-tab="${tab}" role="tab" aria-selected="${isActive}">${label}</button>`;
            })
            .join('')}
        </div>
        <div class="tab-panels">
          ${['monitoring', 'contraindications', 'interactions', 'dosing']
            .map((tab) => `<section class="tab-panel ${activeTab === tab ? 'is-active' : ''}" role="tabpanel" data-tab-panel="${tab}" data-entry-id="${entry.id}">${tabPanels[tab]}</section>`)
            .join('')}
        </div>
        <div class="entry-footer">
          <div class="caution-block">
            <h4>Clinical cautions</h4>
            <p>${precautions}</p>
          </div>
          ${buildReferences(entry)}
          <div class="entry-actions">
            <button class="copy-btn" type="button" data-action="copy" data-entry-id="${entry.id}">${COPY_BUTTON_LABEL}</button>
          </div>
        </div>
      </div>
    </article>
  `;
}

function renderCards(entries) {
  const query = normalise(state.search);
  dom.resultsContainer.innerHTML = entries.map((entry) => renderEntryCard(entry, query)).join('');
}

function renderTable(entries) {
  const query = normalise(state.search);
  dom.resultsContainer.innerHTML = `
    <table class="entry-table">
      <thead>
        <tr>
          <th scope="col">Regimen</th>
          <th scope="col">Summary</th>
          <th scope="col">Baseline essentials</th>
          <th scope="col">Follow-up cadence</th>
          <th scope="col">Clinical cautions</th>
        </tr>
      </thead>
      <tbody>
        ${entries
          .map((entry) => {
            const baseline = (entry.baselineTasks || []).map((task) => `• ${highlightText(task.label, query)}`).join('<br>');
            const monitoring = (entry.monitoringSchedule || [])
              .map((item) => `• ${highlightText(item.timing, query)}: ${highlightText(item.description, query)}`)
              .join('<br>');
            return `
              <tr>
                <th scope="row">
                  <div class="table-class">${highlightText(entry.name, query)}</div>
                  <div class="table-agents">${highlightText(entry.agents.join(', '), query)}</div>
                  <span class="table-pill">${entry.category}</span>
                </th>
                <td>${highlightText(entry.summary, query)}</td>
                <td>${baseline || '<span class="muted">Refer to detailed view</span>'}</td>
                <td>${monitoring || '<span class="muted">Refer to detailed view</span>'}</td>
                <td>${highlightText(entry.cautions || '', query)}</td>
              </tr>
            `;
          })
          .join('')}
      </tbody>
    </table>
  `;
}

function renderFavoritesList() {
  if (!dom.favoritesList) return;
  const favorites = Array.from(userPreferences.favorites)
    .map((id) => monitoringEntries.find((entry) => entry.id === id))
    .filter(Boolean);
  dom.favoritesList.innerHTML = favorites.length
    ? favorites
        .map(
          (entry) => `
            <button class="panel-item" type="button" data-action="jump" data-entry-id="${entry.id}">
              <span>${entry.name}</span>
              <small>${entry.agents.join(', ')}</small>
            </button>
          `
        )
        .join('')
    : '<p class="muted">Save a regimen to favorite it for quick access.</p>';
}

function renderRecentList() {
  if (!dom.recentList) return;
  const recent = userPreferences.recent
    .map((id) => monitoringEntries.find((entry) => entry.id === id))
    .filter(Boolean);
  dom.recentList.innerHTML = recent.length
    ? recent
        .map(
          (entry) => `
            <button class="panel-item" type="button" data-action="jump" data-entry-id="${entry.id}">
              <span>${entry.name}</span>
              <small>Viewed ${entry.agents.length} agent${entry.agents.length > 1 ? 's' : ''}</small>
            </button>
          `
        )
        .join('')
    : '<p class="muted">Expand a regimen to add it to your recent history.</p>';
}

function renderComparison() {
  const entries = monitoringEntries.filter((entry) => state.comparison.has(entry.id));
  if (!entries.length) {
    dom.comparisonView.classList.remove('is-visible');
    dom.comparisonView.innerHTML = '';
    return;
  }
  dom.comparisonView.classList.add('is-visible');
  dom.comparisonView.innerHTML = `
    <div class="comparison-header">
      <h2>⇄ Comparison (${entries.length}/${MAX_COMPARISON})</h2>
      <button class="secondary-btn" type="button" data-action="clear-comparison">Clear</button>
    </div>
    <div class="comparison-grid">
      ${entries
        .map((entry) => {
          const monitoringItems = (entry.monitoringSchedule || [])
            .map((item) => `<li><strong>${item.timing}:</strong> ${item.description}</li>`)
            .join('');
          return `
            <article class="comparison-card" data-entry-id="${entry.id}">
              <header>
                <h3>${entry.name}</h3>
                <p>${entry.summary}</p>
              </header>
              <section>
                <h4>Baseline</h4>
                <ul>
                  ${(entry.baselineTasks || []).map((task) => `<li>${task.label}</li>`).join('')}
                </ul>
              </section>
              <section>
                <h4>Monitoring</h4>
                <ul>${monitoringItems}</ul>
              </section>
              <section>
                <h4>Cautions</h4>
                <p>${entry.cautions}</p>
              </section>
            </article>
          `;
        })
        .join('')}
    </div>
  `;
}

function render() {
  const filtered = filterEntries();
  const viewLabel = state.viewMode === 'cards' ? 'Switch to table view' : 'Switch to card view';
  dom.viewToggle.textContent = viewLabel;
  dom.viewToggle.setAttribute('aria-label', viewLabel);

  if (!filtered.length) {
    dom.resultCount.textContent = `0 regimens shown · Data refreshed ${formatVersionDate(dataVersion)}`;
    dom.resultsContainer.innerHTML = '<p class="empty-state">No regimens match your filters. Clear filters or adjust search terms.</p>';
    renderComparison();
    return;
  }

  dom.resultCount.textContent = `${filtered.length} regimen${filtered.length === 1 ? '' : 's'} shown · Data refreshed ${formatVersionDate(
    dataVersion
  )}`;

  if (state.viewMode === 'cards') {
    renderCards(filtered);
  } else {
    renderTable(filtered);
  }

  renderComparison();
}

function formatVersionDate(value) {
  if (!value) return 'recently';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
}

function handleCardInteraction(event) {
  const toggleDetails = event.target.closest('[data-action="toggle-details"]');
  if (toggleDetails) {
    const entryId = toggleDetails.dataset.entryId;
    if (state.expanded.has(entryId)) {
      state.expanded.delete(entryId);
    } else {
      state.expanded.add(entryId);
      addRecent(entryId);
    }
    renderRecentList();
    render();
    return;
  }

  const tabButton = event.target.closest('[data-action="switch-tab"]');
  if (tabButton) {
    const { entryId, tab } = tabButton.dataset;
    state.activeTabs.set(entryId, tab);
    state.expanded.add(entryId);
    addRecent(entryId);
    renderRecentList();
    render();
    return;
  }

  const favoriteButton = event.target.closest('[data-action="toggle-favorite"]');
  if (favoriteButton) {
    const entryId = favoriteButton.dataset.entryId;
    if (userPreferences.favorites.has(entryId)) {
      userPreferences.favorites.delete(entryId);
      announce('Removed from favorites');
    } else {
      userPreferences.favorites.add(entryId);
      announce('Added to favorites');
    }
    persistFavorites();
    renderFavoritesList();
    render();
    return;
  }

  const compareButton = event.target.closest('[data-action="toggle-compare"]');
  if (compareButton) {
    const entryId = compareButton.dataset.entryId;
    if (state.comparison.has(entryId)) {
      state.comparison.delete(entryId);
    } else if (state.comparison.size >= MAX_COMPARISON) {
      showToast(`Maximum of ${MAX_COMPARISON} regimens can be compared.`);
      return;
    } else {
      state.comparison.add(entryId);
    }
    renderComparison();
    render();
    return;
  }

  const copyButton = event.target.closest('[data-action="copy"]');
  if (copyButton) {
    const entryId = copyButton.dataset.entryId;
    const entry = monitoringEntries.find((item) => item.id === entryId);
    if (entry) {
      const text = buildClipboardText(entry);
      copyToClipboard(text, copyButton);
    }
    return;
  }

  const exportButton = event.target.closest('[data-action="export-checklist"]');
  if (exportButton) {
    const entryId = exportButton.dataset.entryId;
    const entry = monitoringEntries.find((item) => item.id === entryId);
    if (entry) exportChecklist(entry);
    return;
  }
}

function handleChecklistChange(event) {
  const checkbox = event.target.closest('input[data-action="checklist"]');
  if (!checkbox) return;
  const entryId = checkbox.dataset.entryId;
  const type = checkbox.dataset['checklistType'];
  const itemId = checkbox.dataset['itemId'];
  const entryState = (userPreferences.checklist[entryId] = userPreferences.checklist[entryId] || {});
  const typeState = (entryState[type] = entryState[type] || {});
  typeState[itemId] = checkbox.checked;
  persistChecklist();
}

function addRecent(entryId) {
  userPreferences.recent = userPreferences.recent.filter((id) => id !== entryId);
  userPreferences.recent.unshift(entryId);
  if (userPreferences.recent.length > RECENT_LIMIT) {
    userPreferences.recent.length = RECENT_LIMIT;
  }
  persistRecent();
}

function clearComparison() {
  state.comparison.clear();
  renderComparison();
  render();
}

function exportChecklist(entry) {
  const entryChecklist = userPreferences.checklist[entry.id] || {};
  const baseline = (entry.baselineTasks || []).map((task) => `${entryChecklist.baseline?.[task.id] ? '[x]' : '[ ]'} ${task.label}`);
  const monitoring = (entry.monitoringSchedule || []).map(
    (item) => `${entryChecklist.monitoring?.[item.id] ? '[x]' : '[ ]'} ${item.timing}: ${item.description}`
  );
  const content = `Checklist for ${entry.name}\n\nBaseline essentials:\n${baseline.join('\n')}\n\nFollow-up cadence:\n${monitoring.join('\n')}`;
  copyToClipboard(content, null);
  showToast('Checklist copied to clipboard');
}

function exportCurrentViewAsCSV() {
  const entries = filterEntries();
  if (!entries.length) {
    showToast('Nothing to export for current filters.');
    return;
  }
  const headers = [
    'Name',
    'Category',
    'Agents',
    'Summary',
    'Baseline',
    'Monitoring',
    'Cautions',
    'Risk Level',
    'Monitoring Intensity'
  ];
  const rows = entries.map((entry) => [
    entry.name,
    entry.category,
    entry.agents.join('; '),
    entry.summary,
    entry.baseline,
    entry.monitoring,
    entry.cautions,
    RISK_LEVEL_LABELS[entry.riskLevel] || entry.riskLevel,
    MONITORING_FREQUENCY_LABELS[entry.monitoringFrequency] || entry.monitoringFrequency
  ]);
  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
    .join('\n');
  downloadFile(csv, 'biologic-monitoring-dashboard.csv', 'text/csv');
  showToast(`Exported ${rows.length} regimen${rows.length === 1 ? '' : 's'} as CSV.`);
}

function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function copyToClipboard(text, button) {
  navigator.clipboard
    .writeText(text)
    .then(() => {
      if (button) {
        button.textContent = 'Copied!';
        button.classList.add('copied');
        setTimeout(() => {
          button.textContent = COPY_BUTTON_LABEL;
          button.classList.remove('copied');
        }, 1600);
      } else {
        showToast('Copied to clipboard.');
      }
    })
    .catch(() => {
      if (button) {
        button.textContent = 'Copy failed';
        setTimeout(() => {
          button.textContent = COPY_BUTTON_LABEL;
        }, 1600);
      } else {
        showToast('Copy failed.', true);
      }
    });
}

function announce(message) {
  if (!message) return;
  dom.resultCount.setAttribute('data-status', message);
  setTimeout(() => dom.resultCount.removeAttribute('data-status'), 1200);
}

function showToast(message, isError = false) {
  const toast = document.createElement('div');
  toast.className = `toast ${isError ? 'is-error' : ''}`;
  toast.textContent = message;
  dom.modalRoot.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('is-visible'));
  setTimeout(() => {
    toast.classList.remove('is-visible');
    setTimeout(() => toast.remove(), 240);
  }, 2800);
}

function showKeyboardShortcuts() {
  const modal = document.createElement('div');
  modal.className = 'modal-backdrop';
  modal.innerHTML = `
    <div class="modal" role="dialog" aria-modal="true">
      <header>
        <h2>Keyboard shortcuts</h2>
        <button type="button" class="icon-btn" data-action="close-modal">×</button>
      </header>
      <dl class="shortcut-list">
        <div><dt><kbd>Ctrl</kbd>/<kbd>Cmd</kbd> + <kbd>K</kbd></dt><dd>Focus search</dd></div>
        <div><dt><kbd>Ctrl</kbd>/<kbd>Cmd</kbd> + <kbd>/</kbd></dt><dd>Show keyboard shortcuts</dd></div>
        <div><dt><kbd>V</kbd></dt><dd>Toggle card/table view</dd></div>
        <div><dt><kbd>C</kbd></dt><dd>Clear all filters</dd></div>
        <div><dt><kbd>D</kbd></dt><dd>Toggle dark mode</dd></div>
        <div><dt><kbd>L</kbd></dt><dd>Open lab templates</dd></div>
        <div><dt><kbd>Shift</kbd> + <kbd>F</kbd></dt><dd>Toggle favorites panel</dd></div>
      </dl>
    </div>
  `;
  dom.modalRoot.appendChild(modal);
  modal.addEventListener('click', (event) => {
    if (event.target === modal || event.target.closest('[data-action="close-modal"]')) {
      modal.remove();
    }
  });
  document.addEventListener(
    'keydown',
    function escListener(event) {
      if (event.key === 'Escape') {
        modal.remove();
        document.removeEventListener('keydown', escListener);
      }
    },
    { once: true }
  );
}

const THEME_STORAGE_KEY = 'biologic-dashboard:theme';

function initializeTheme() {
  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
  if (savedTheme) {
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeToggleIcon(savedTheme);
  } else {
    // Check system preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (prefersDark) {
      updateThemeToggleIcon('dark');
    }
  }
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem(THEME_STORAGE_KEY, newTheme);
  updateThemeToggleIcon(newTheme);
  showToast(`${newTheme === 'dark' ? 'Dark' : 'Light'} mode enabled`);
}

function updateThemeToggleIcon(theme) {
  if (!dom.themeToggle) return;
  const icon = dom.themeToggle.querySelector('span');
  if (icon) {
    icon.textContent = theme === 'dark' ? '☀️' : '🌙';
  }
  dom.themeToggle.setAttribute('aria-label', `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`);
}

const LAB_TEMPLATES = [
  {
    id: 'biologic-baseline',
    name: 'Biologic Baseline',
    description: 'CBC, CMP, LFTs, Hep B/C, TB screen',
    labs: ['CBC with differential', 'Comprehensive metabolic panel', 'Liver function tests (AST, ALT, ALP, bilirubin)', 'Hepatitis B surface antigen', 'Hepatitis B core antibody', 'Hepatitis C antibody', 'QuantiFERON-TB Gold or TB skin test', 'Lipid panel']
  },
  {
    id: 'jak-inhibitor',
    name: 'JAK Inhibitor Monitoring',
    description: 'CBC, CMP, lipids, CK',
    labs: ['CBC with differential', 'Comprehensive metabolic panel', 'Lipid panel (fasting)', 'Creatine kinase (CK)', 'Liver function tests']
  },
  {
    id: 'methotrexate',
    name: 'Methotrexate Monitoring',
    description: 'CBC, CMP, LFTs',
    labs: ['CBC with differential', 'Comprehensive metabolic panel', 'Liver function tests (AST, ALT, albumin)', 'Creatinine']
  },
  {
    id: 'il17-inhibitor',
    name: 'IL-17 Inhibitor',
    description: 'TB screen, Hep B/C',
    labs: ['QuantiFERON-TB Gold or TB skin test', 'Hepatitis B surface antigen', 'Hepatitis B core antibody', 'Hepatitis C antibody', 'CBC with differential']
  },
  {
    id: 'cyclosporine',
    name: 'Cyclosporine Monitoring',
    description: 'BMP, BP, lipids',
    labs: ['Basic metabolic panel (BMP)', 'Creatinine', 'Blood pressure measurement', 'Lipid panel', 'Magnesium', 'Uric acid']
  },
  {
    id: 'mycophenolate',
    name: 'Mycophenolate Monitoring',
    description: 'CBC, CMP',
    labs: ['CBC with differential', 'Comprehensive metabolic panel', 'Liver function tests', 'Pregnancy test (if applicable)']
  }
];

function showLabTemplates() {
  const modal = document.createElement('div');
  modal.className = 'modal-backdrop';
  modal.innerHTML = `
    <div class="modal lab-template-modal" role="dialog" aria-modal="true">
      <header>
        <h2>📋 Lab Order Templates</h2>
        <button type="button" class="icon-btn" data-action="close-modal">×</button>
      </header>
      <p class="muted">Click a template to copy the lab order list to your clipboard.</p>
      <div class="template-grid">
        ${LAB_TEMPLATES.map(template => `
          <button class="lab-template-btn" type="button" data-template-id="${template.id}">
            <h4>${template.name}</h4>
            <p>${template.description}</p>
          </button>
        `).join('')}
      </div>
    </div>
  `;

  dom.modalRoot.appendChild(modal);

  modal.addEventListener('click', (event) => {
    if (event.target === modal || event.target.closest('[data-action="close-modal"]')) {
      modal.remove();
      return;
    }

    const templateBtn = event.target.closest('[data-template-id]');
    if (templateBtn) {
      const templateId = templateBtn.dataset.templateId;
      const template = LAB_TEMPLATES.find(t => t.id === templateId);
      if (template) {
        const labList = `${template.name} Lab Order:\n\n${template.labs.map((lab, i) => `${i + 1}. ${lab}`).join('\n')}`;
        copyToClipboard(labList, null);
        showToast(`${template.name} labs copied to clipboard`);
        modal.remove();
      }
    }
  });

  document.addEventListener(
    'keydown',
    function escListener(event) {
      if (event.key === 'Escape') {
        modal.remove();
        document.removeEventListener('keydown', escListener);
      }
    },
    { once: true }
  );
}

function printQuickRefCard(entry) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    showToast('Please allow popups for printing', true);
    return;
  }

  const baselineTasks = (entry.baselineTasks || []).map(t => `<li>${t.label}</li>`).join('');
  const monitoringItems = (entry.monitoringSchedule || []).map(m => `<li><strong>${m.timing}:</strong> ${m.description}</li>`).join('');

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Quick Reference - ${entry.name}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; }
        h1 { font-size: 18px; border-bottom: 2px solid #000; padding-bottom: 10px; }
        h2 { font-size: 14px; margin: 16px 0 8px; text-transform: uppercase; }
        ul { margin: 0; padding-left: 20px; }
        li { margin-bottom: 6px; font-size: 12px; }
        .caution { font-style: italic; color: #666; margin-top: 16px; font-size: 11px; border-top: 1px solid #ccc; padding-top: 10px; }
        .agents { color: #666; margin-bottom: 16px; font-size: 12px; }
        @media print { body { padding: 0; } }
      </style>
    </head>
    <body>
      <h1>${entry.name}</h1>
      <p class="agents">${entry.agents.join(', ')}</p>

      <h2>Baseline Requirements</h2>
      <ul>${baselineTasks || '<li>Refer to prescribing information</li>'}</ul>

      <h2>Monitoring Schedule</h2>
      <ul>${monitoringItems || '<li>Per specialist guidance</li>'}</ul>

      <p class="caution"><strong>Cautions:</strong> ${entry.cautions || 'Review prescribing information'}</p>

      <script>window.print(); window.close();</script>
    </body>
    </html>
  `);
  printWindow.document.close();
}

function handleGlobalKeydown(event) {
  const meta = event.metaKey || event.ctrlKey;
  const activeElement = document.activeElement;
  const isInputFocused = activeElement && ['INPUT', 'TEXTAREA'].includes(activeElement.tagName);

  if (meta && event.key.toLowerCase() === 'k') {
    event.preventDefault();
    dom.searchInput.focus();
    return;
  }

  if (meta && event.key === '/') {
    event.preventDefault();
    showKeyboardShortcuts();
    return;
  }

  if (!meta && !event.shiftKey && event.key.toLowerCase() === 'v' && !isInputFocused) {
    state.viewMode = state.viewMode === 'cards' ? 'table' : 'cards';
    document.body.setAttribute('data-view', state.viewMode);
    render();
    return;
  }

  if (!meta && !event.shiftKey && event.key.toLowerCase() === 'c' && !isInputFocused) {
    resetAll();
    return;
  }

  if (!meta && !event.shiftKey && event.key.toLowerCase() === 'd' && !isInputFocused) {
    toggleTheme();
    return;
  }

  if (!meta && !event.shiftKey && event.key.toLowerCase() === 'l' && !isInputFocused) {
    showLabTemplates();
    return;
  }

  if (event.shiftKey && !meta && event.key.toLowerCase() === 'f' && !isInputFocused) {
    if (dom.favoritesPanel) {
      event.preventDefault();
      togglePanel(dom.favoritesPanel);
    }
  }
}

function togglePanel(panel) {
  if (!panel) return;
  panel.classList.toggle('is-collapsed');
}

function handleMobileAction(event) {
  const button = event.target.closest('[data-mobile-action]');
  if (!button) return;
  const action = button.dataset.mobileAction;
  if (action === 'favorites' && dom.favoritesPanel) {
    dom.favoritesPanel.classList.remove('is-collapsed');
    dom.favoritesPanel.scrollIntoView({ behavior: 'smooth' });
  } else if (action === 'filters') {
    document.querySelector('.controls').scrollIntoView({ behavior: 'smooth' });
  } else if (action === 'top') {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

function attachListeners() {
  dom.searchInput.addEventListener('input', (event) => {
    state.search = event.target.value.trim();
    render();
  });

  dom.categoryButtons.forEach((button) => {
    button.classList.add('is-active');
    button.addEventListener('click', () => {
      const category = button.dataset.category;
      if (state.categories.has(category)) {
        state.categories.delete(category);
      } else {
        state.categories.add(category);
      }
      if (!state.categories.size) {
        state.categories = new Set(['Biologics', 'Targeted', 'Conventional']);
        dom.categoryButtons.forEach((btn) => btn.classList.add('is-active'));
      } else {
        dom.categoryButtons.forEach((btn) => {
          const isActive = state.categories.has(btn.dataset.category);
          btn.classList.toggle('is-active', isActive);
        });
      }
      render();
    });
  });

  dom.viewToggle.addEventListener('click', () => {
    state.viewMode = state.viewMode === 'cards' ? 'table' : 'cards';
    document.body.setAttribute('data-view', state.viewMode);
    render();
  });

  dom.resetButton.addEventListener('click', () => resetAll());
  dom.exportCsvButton.addEventListener('click', () => exportCurrentViewAsCSV());

  if (dom.themeToggle) {
    dom.themeToggle.addEventListener('click', () => toggleTheme());
  }

  if (dom.labTemplatesButton) {
    dom.labTemplatesButton.addEventListener('click', () => showLabTemplates());
  }

  dom.resultsContainer.addEventListener('click', handleCardInteraction);
  dom.resultsContainer.addEventListener('change', handleChecklistChange);

  if (dom.favoritesList) {
    dom.favoritesList.addEventListener('click', (event) => {
      const target = event.target.closest('[data-action="jump"]');
      if (!target) return;
      const entryId = target.dataset.entryId;
      jumpToEntry(entryId);
    });
  }

  if (dom.recentList) {
    dom.recentList.addEventListener('click', (event) => {
      const target = event.target.closest('[data-action="jump"]');
      if (!target) return;
      jumpToEntry(target.dataset.entryId);
    });
  }

  dom.comparisonView.addEventListener('click', (event) => {
    if (event.target.matches('[data-action="clear-comparison"]')) {
      clearComparison();
    }
  });

  dom.panelCloseButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const panel = button.dataset.panel === 'favorites' ? dom.favoritesPanel : dom.recentPanel;
      togglePanel(panel);
    });
  });

  if (dom.mobileActions) {
    dom.mobileActions.addEventListener('click', handleMobileAction);
  }

  document.addEventListener('keydown', handleGlobalKeydown);

  setupDropdowns();

  let touchStartX = 0;
  let touchEndX = 0;
  document.addEventListener('touchstart', (event) => {
    touchStartX = event.changedTouches[0].screenX;
  });
  document.addEventListener('touchend', (event) => {
    touchEndX = event.changedTouches[0].screenX;
    const diff = touchEndX - touchStartX;
    if (Math.abs(diff) > 60) {
      if (diff > 0) {
        dom.favoritesPanel.classList.remove('is-collapsed');
        dom.favoritesPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        dom.favoritesPanel.classList.add('is-collapsed');
        const filtersSection = document.querySelector('.controls');
        if (filtersSection) {
          filtersSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
          showToast('Filter controls ready', false);
        }
      }
    }
  });
}

function jumpToEntry(entryId) {
  const card = dom.resultsContainer.querySelector(`[data-entry-id="${entryId}"]`);
  if (card) {
    state.expanded.add(entryId);
    state.activeTabs.set(entryId, 'monitoring');
    card.scrollIntoView({ behavior: 'smooth', block: 'start' });
    render();
  } else {
    announce('Entry not visible with current filters.');
  }
}

function resetAll() {
  state.search = '';
  state.categories = new Set(['Biologics', 'Targeted', 'Conventional']);
  state.conditions.clear();
  state.requirements.clear();
  state.riskLevels.clear();
  state.monitoringIntensity.clear();
  state.expanded.clear();
  state.activeTabs.clear();
  state.comparison.clear();
  state.viewMode = 'cards';
  dom.searchInput.value = '';
  dom.categoryButtons.forEach((btn) => btn.classList.add('is-active'));
  initialiseFilters();
  document.body.setAttribute('data-view', 'cards');
  render();
  closeAllDropdowns();
  showToast('Filters reset');
}

function initialiseFilters() {
  renderFilterChips(dom.conditionFilters, filterOptions.conditions, state.conditions);
  renderFilterChips(dom.requirementFilters, filterOptions.requirements, state.requirements);
  renderFilterChips(dom.riskFilters, filterOptions.riskLevels, state.riskLevels);
  renderFilterChips(dom.intensityFilters, filterOptions.monitoringIntensity, state.monitoringIntensity);
}

function initialise() {
  initializeTheme();
  initialiseFilters();
  renderFavoritesList();
  renderRecentList();
  attachListeners();
  render();
}

initialise();
