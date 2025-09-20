import { monitoringEntries } from './data.js';

const state = {
  search: '',
  categories: new Set(['Biologics', 'Targeted & Conventional']),
  viewMode: 'cards'
};

const searchInput = document.querySelector('#search-input');
const categoryToggles = document.querySelectorAll('[data-category]');
const viewToggle = document.querySelector('#view-toggle');
const resultsContainer = document.querySelector('#results');
const resultCount = document.querySelector('#result-count');
const resetFiltersBtn = document.querySelector('#reset-filters');

function normalise(text) {
  return text.toLowerCase();
}

function matchesSearch(entry, query) {
  if (!query) return true;
  const haystack = [
    entry.name,
    entry.agents.join(' '),
    entry.uses,
    entry.baseline,
    entry.monitoring,
    entry.cautions
  ].join(' ').toLowerCase();
  return haystack.includes(query);
}

function filterEntries() {
  const query = normalise(state.search);
  return monitoringEntries.filter((entry) => {
    const categoryMatch = state.categories.has(entry.category);
    const searchMatch = matchesSearch(entry, query);
    return categoryMatch && searchMatch;
  });
}

function createReferenceChip(ref) {
  const link = document.createElement('a');
  link.href = ref.url;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.className = 'reference-chip';
  link.textContent = ref.label;
  return link;
}

function copyToClipboard(text, button) {
  navigator.clipboard.writeText(text).then(() => {
    button.textContent = 'Copied!';
    button.classList.add('copied');
    setTimeout(() => {
      button.textContent = 'Copy note';
      button.classList.remove('copied');
    }, 1600);
  }).catch(() => {
    button.textContent = 'Copy failed';
    setTimeout(() => {
      button.textContent = 'Copy note';
    }, 1600);
  });
}

function renderCards(entries) {
  resultsContainer.innerHTML = '';
  const fragment = document.createDocumentFragment();
  entries.forEach((entry) => {
    const card = document.createElement('article');
    card.className = 'entry-card';
    card.innerHTML = `
      <header class="entry-header">
        <div>
          <p class="entry-category">${entry.category}</p>
          <h2>${entry.name}</h2>
        </div>
        <span class="agent-count">${entry.agents.length} agent${entry.agents.length > 1 ? 's' : ''}</span>
      </header>
      <div class="entry-body">
        <section>
          <h3>Agents</h3>
          <p class="agent-list">${entry.agents.join(', ')}</p>
        </section>
        <section>
          <h3>Clinical uses</h3>
          <p>${entry.uses}</p>
        </section>
        <section>
          <h3>Baseline</h3>
          <p>${entry.baseline}</p>
        </section>
        <section>
          <h3>Follow-up</h3>
          <p>${entry.monitoring}</p>
        </section>
        <section>
          <h3>Cautions</h3>
          <p>${entry.cautions}</p>
        </section>
      </div>
    `;

    const referencesRow = document.createElement('div');
    referencesRow.className = 'references-row';
    referencesRow.setAttribute('role', 'list');
    entry.references.forEach((ref) => {
      const chip = createReferenceChip(ref);
      chip.setAttribute('role', 'listitem');
      referencesRow.appendChild(chip);
    });

    const copyButton = document.createElement('button');
    copyButton.className = 'copy-btn';
    copyButton.type = 'button';
    copyButton.textContent = 'Copy note';
    const clipboardText = `${entry.name} (${entry.agents.join(', ')}): Baseline - ${entry.baseline} Follow-up - ${entry.monitoring} Cautions - ${entry.cautions}`;
    copyButton.addEventListener('click', () => copyToClipboard(clipboardText, copyButton));

    const footer = document.createElement('footer');
    footer.className = 'entry-footer';
    footer.appendChild(referencesRow);
    footer.appendChild(copyButton);

    card.appendChild(footer);
    fragment.appendChild(card);
  });
  resultsContainer.appendChild(fragment);
}

function renderTable(entries) {
  resultsContainer.innerHTML = '';
  const table = document.createElement('table');
  table.className = 'entry-table';
  table.innerHTML = `
    <thead>
      <tr>
        <th scope="col">Class / Agent</th>
        <th scope="col">Clinical uses</th>
        <th scope="col">Baseline</th>
        <th scope="col">Follow-up</th>
        <th scope="col">Cautions</th>
        <th scope="col">References</th>
      </tr>
    </thead>
  `;
  const tbody = document.createElement('tbody');
  entries.forEach((entry) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <th scope="row">
        <div class="table-class">${entry.name}</div>
        <div class="table-agents">${entry.agents.join(', ')}</div>
        <span class="table-pill">${entry.category}</span>
      </th>
      <td>${entry.uses}</td>
      <td>${entry.baseline}</td>
      <td>${entry.monitoring}</td>
      <td>${entry.cautions}</td>
      <td class="table-refs"></td>
    `;
    const refCell = row.querySelector('.table-refs');
    entry.references.forEach((ref) => {
      const chip = createReferenceChip(ref);
      refCell.appendChild(chip);
    });

    const copyButton = document.createElement('button');
    copyButton.type = 'button';
    copyButton.className = 'copy-btn copy-btn--inline';
    copyButton.textContent = 'Copy';
    const clipboardText = `${entry.name} (${entry.agents.join(', ')}): Baseline - ${entry.baseline} Follow-up - ${entry.monitoring} Cautions - ${entry.cautions}`;
    copyButton.addEventListener('click', () => copyToClipboard(clipboardText, copyButton));
    refCell.appendChild(copyButton);

    tbody.appendChild(row);
  });
  table.appendChild(tbody);
  resultsContainer.appendChild(table);
}

function render() {
  const filtered = filterEntries();
  resultCount.textContent = `${filtered.length} regimen${filtered.length === 1 ? '' : 's'} shown`;
  if (!filtered.length) {
    resultsContainer.innerHTML = '<p class="empty-state">No regimens match your filters. Try clearing search or toggling categories.</p>';
    return;
  }
  if (state.viewMode === 'cards') {
    renderCards(filtered);
  } else {
    renderTable(filtered);
  }
}

searchInput.addEventListener('input', (event) => {
  state.search = event.target.value.trim();
  render();
});

categoryToggles.forEach((toggle) => {
  toggle.addEventListener('click', () => {
    const category = toggle.dataset.category;
    if (state.categories.has(category)) {
      state.categories.delete(category);
    } else {
      state.categories.add(category);
    }
    if (state.categories.size === 0) {
      state.categories = new Set(['Biologics', 'Targeted & Conventional']);
      categoryToggles.forEach((btn) => btn.classList.add('is-active'));
    } else {
      categoryToggles.forEach((btn) => {
        const cat = btn.dataset.category;
        btn.classList.toggle('is-active', state.categories.has(cat));
      });
    }
    render();
  });
});

viewToggle.addEventListener('click', () => {
  state.viewMode = state.viewMode === 'cards' ? 'table' : 'cards';
  viewToggle.textContent = state.viewMode === 'cards' ? 'Switch to table view' : 'Switch to card view';
  document.body.setAttribute('data-view', state.viewMode);
  render();
});

resetFiltersBtn.addEventListener('click', () => {
  state.search = '';
  state.categories = new Set(['Biologics', 'Targeted & Conventional']);
  state.viewMode = 'cards';
  searchInput.value = '';
  viewToggle.textContent = 'Switch to table view';
  document.body.setAttribute('data-view', 'cards');
  categoryToggles.forEach((btn) => btn.classList.add('is-active'));
  render();
});

// Initialize toggle appearance
categoryToggles.forEach((btn) => btn.classList.add('is-active'));
render();
