import { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { publications } from '../data/publications.js';
import { isEnabled } from '../lib/featureFlags.js';

// Citation format generators
const generateBibTeX = (entry) => {
  const key = entry.title.split(' ').slice(0, 2).join('').replace(/[^a-zA-Z]/g, '') + entry.year;
  const authors = entry.authors?.replace(/, /g, ' and ') || 'Unknown';
  return `@article{${key},
  title = {${entry.title}},
  author = {${authors}},
  journal = {${entry.venue?.split('.')[0] || 'Unknown'}},
  year = {${entry.year}},
  url = {${entry.url || ''}}
}`;
};

const generateRIS = (entry) => {
  const authors = entry.authors?.split(', ').map(a => `AU  - ${a}`).join('\n') || '';
  return `TY  - JOUR
TI  - ${entry.title}
${authors}
JO  - ${entry.venue?.split('.')[0] || ''}
PY  - ${entry.year}
UR  - ${entry.url || ''}
ER  -`;
};

const generateEndNote = (entry) => {
  const authors = entry.authors?.split(', ').map(a => `%A ${a}`).join('\n') || '';
  return `%0 Journal Article
%T ${entry.title}
${authors}
%J ${entry.venue?.split('.')[0] || ''}
%D ${entry.year}
%U ${entry.url || ''}`;
};

// Infer publication type from venue/tags
const inferType = (entry) => {
  const venue = (entry.venue || '').toLowerCase();
  const tags = entry.tags || [];

  if (venue.includes('journal') || venue.includes('jaad') || venue.includes('jama')) {
    return 'Journal Article';
  }
  if (venue.includes('abstract') || venue.includes('poster')) {
    return 'Abstract';
  }
  if (venue.includes('preprint') || venue.includes('arxiv') || venue.includes('medrxiv')) {
    return 'Preprint';
  }
  if (venue.includes('book') || venue.includes('chapter')) {
    return 'Book Chapter';
  }
  if (venue.includes('report') || venue.includes('thesis')) {
    return 'Report';
  }
  return 'Journal Article'; // Default
};

// Parse authors for network
const parseAuthors = (authorsString) => {
  if (!authorsString) return [];
  return authorsString
    .split(/,\s*(?=[A-Z])/)
    .map(name => name.trim().replace(/,?\s*et al\.?/i, ''))
    .filter(name => name && !name.match(/^et\s*al\.?$/i));
};

// Sort publications by year
const sortPublications = (items) =>
  [...items].sort((a, b) => {
    if (b.year !== a.year) return b.year - a.year;
    return a.title.localeCompare(b.title);
  });

const allPublications = sortPublications(publications.map(p => ({
  ...p,
  type: p.type || inferType(p)
})));

// Get unique types and years
const allTypes = [...new Set(allPublications.map(p => p.type))];
const allYears = [...new Set(allPublications.map(p => p.year))].sort((a, b) => b - a);

// Build co-author network
const buildCoauthorNetwork = (pubs) => {
  const authorCounts = {};
  const links = [];
  const linkMap = {};

  pubs.forEach(pub => {
    const authors = parseAuthors(pub.authors);
    authors.forEach(author => {
      authorCounts[author] = (authorCounts[author] || 0) + 1;
    });

    // Create links between co-authors
    for (let i = 0; i < authors.length; i++) {
      for (let j = i + 1; j < authors.length; j++) {
        const key = [authors[i], authors[j]].sort().join('|');
        if (!linkMap[key]) {
          linkMap[key] = { source: authors[i], target: authors[j], weight: 0 };
          links.push(linkMap[key]);
        }
        linkMap[key].weight++;
      }
    }
  });

  const nodes = Object.entries(authorCounts)
    .map(([name, count]) => ({ id: name, count }))
    .sort((a, b) => b.count - a.count);

  return { nodes, links };
};

const ScholarFeedEnhanced = () => {
  const [query, setQuery] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [showExport, setShowExport] = useState(null);
  const [showNetwork, setShowNetwork] = useState(false);
  const networkRef = useRef(null);

  // Feature flags
  const exportEnabled = isEnabled('citationExport');
  const typeFilterEnabled = isEnabled('publicationTypeFilter');
  const networkEnabled = isEnabled('coauthorNetwork');

  const filtered = useMemo(() => {
    return allPublications.filter((entry) => {
      const matchesQuery = query
        ? `${entry.title} ${entry.authors} ${entry.venue}`.toLowerCase().includes(query.toLowerCase())
        : true;
      const matchesYear = yearFilter ? String(entry.year) === yearFilter : true;
      const matchesType = typeFilter ? entry.type === typeFilter : true;
      return matchesQuery && matchesYear && matchesType;
    });
  }, [query, yearFilter, typeFilter]);

  // Build network from filtered publications
  const network = useMemo(() => buildCoauthorNetwork(filtered), [filtered]);

  // Export handlers
  const handleExport = useCallback((entry, format) => {
    let content = '';
    let filename = '';
    let mimeType = 'text/plain';

    switch (format) {
      case 'bibtex':
        content = generateBibTeX(entry);
        filename = `${entry.title.slice(0, 30).replace(/[^a-zA-Z0-9]/g, '_')}.bib`;
        break;
      case 'ris':
        content = generateRIS(entry);
        filename = `${entry.title.slice(0, 30).replace(/[^a-zA-Z0-9]/g, '_')}.ris`;
        break;
      case 'endnote':
        content = generateEndNote(entry);
        filename = `${entry.title.slice(0, 30).replace(/[^a-zA-Z0-9]/g, '_')}.enw`;
        break;
      default:
        return;
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    setShowExport(null);
  }, []);

  // Export all filtered
  const handleExportAll = useCallback((format) => {
    const contents = filtered.map(entry => {
      switch (format) {
        case 'bibtex': return generateBibTeX(entry);
        case 'ris': return generateRIS(entry);
        case 'endnote': return generateEndNote(entry);
        default: return '';
      }
    }).join('\n\n');

    const extensions = { bibtex: 'bib', ris: 'ris', endnote: 'enw' };
    const blob = new Blob([contents], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `publications_export.${extensions[format]}`;
    a.click();
    URL.revokeObjectURL(url);
  }, [filtered]);

  // Simple network visualization (D3 would be more sophisticated)
  useEffect(() => {
    if (!showNetwork || !networkRef.current || !networkEnabled) return;

    const container = networkRef.current;
    const width = container.clientWidth;
    const height = 400;

    // Clear previous content
    container.innerHTML = '';

    // Create SVG
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', width);
    svg.setAttribute('height', height);
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    container.appendChild(svg);

    // Simple force simulation (without full D3)
    const nodes = network.nodes.slice(0, 30); // Limit for performance
    const links = network.links.filter(l =>
      nodes.some(n => n.id === l.source) && nodes.some(n => n.id === l.target)
    );

    // Position nodes in a circle initially
    nodes.forEach((node, i) => {
      const angle = (i / nodes.length) * 2 * Math.PI;
      const radius = Math.min(width, height) * 0.35;
      node.x = width / 2 + radius * Math.cos(angle);
      node.y = height / 2 + radius * Math.sin(angle);
    });

    // Draw links
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    links.forEach(link => {
      const source = nodes.find(n => n.id === link.source);
      const target = nodes.find(n => n.id === link.target);
      if (!source || !target) return;

      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', source.x);
      line.setAttribute('y1', source.y);
      line.setAttribute('x2', target.x);
      line.setAttribute('y2', target.y);
      line.setAttribute('stroke', 'rgba(59, 130, 246, 0.3)');
      line.setAttribute('stroke-width', Math.min(link.weight * 2, 5));
      g.appendChild(line);
    });
    svg.appendChild(g);

    // Draw nodes
    nodes.forEach(node => {
      const gNode = document.createElementNS('http://www.w3.org/2000/svg', 'g');

      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      const radius = Math.min(5 + node.count * 3, 20);
      circle.setAttribute('cx', node.x);
      circle.setAttribute('cy', node.y);
      circle.setAttribute('r', radius);
      circle.setAttribute('fill', node.id.includes('Fathy') ? '#10b981' : '#3b82f6');
      circle.setAttribute('stroke', 'white');
      circle.setAttribute('stroke-width', '2');
      gNode.appendChild(circle);

      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', node.x);
      text.setAttribute('y', node.y + radius + 12);
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('font-size', '10');
      text.setAttribute('fill', 'currentColor');
      text.textContent = node.id.split(' ').pop(); // Last name only
      gNode.appendChild(text);

      svg.appendChild(gNode);
    });

  }, [showNetwork, network, networkEnabled]);

  return (
    <section className="scholar-feed-enhanced" data-scroll-fade>
      {/* Controls */}
      <div className="scholar-controls">
        <div className="scholar-filters">
          <label className="filter-item">
            <span>Search</span>
            <input
              type="search"
              placeholder="Title or author"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>

          <label className="filter-item">
            <span>Year</span>
            <select value={yearFilter} onChange={(e) => setYearFilter(e.target.value)}>
              <option value="">All Years</option>
              {allYears.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </label>

          {typeFilterEnabled && (
            <label className="filter-item">
              <span>Type</span>
              <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                <option value="">All Types</option>
                {allTypes.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </label>
          )}
        </div>

        <div className="scholar-actions">
          {exportEnabled && (
            <div className="export-dropdown">
              <button
                className="export-btn"
                onClick={() => setShowExport(showExport === 'all' ? null : 'all')}
              >
                Export All ({filtered.length})
              </button>
              <AnimatePresence>
                {showExport === 'all' && (
                  <motion.div
                    className="export-menu"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <button onClick={() => handleExportAll('bibtex')}>BibTeX (.bib)</button>
                    <button onClick={() => handleExportAll('ris')}>RIS (.ris)</button>
                    <button onClick={() => handleExportAll('endnote')}>EndNote (.enw)</button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {networkEnabled && (
            <button
              className={`network-btn ${showNetwork ? 'is-active' : ''}`}
              onClick={() => setShowNetwork(!showNetwork)}
            >
              {showNetwork ? 'Hide Network' : 'Co-author Network'}
            </button>
          )}
        </div>
      </div>

      {/* Co-author Network */}
      <AnimatePresence>
        {showNetwork && networkEnabled && (
          <motion.div
            className="network-container"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
          >
            <div className="network-header">
              <h4>Co-author Network</h4>
              <p>Showing top {Math.min(network.nodes.length, 30)} collaborators based on filtered publications</p>
            </div>
            <div ref={networkRef} className="network-graph" />
            <div className="network-legend">
              <span className="legend-item"><span className="legend-dot legend-dot--primary" /> Primary Author</span>
              <span className="legend-item"><span className="legend-dot legend-dot--secondary" /> Co-author</span>
              <span className="legend-text">Node size = publication count</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results count */}
      <p className="scholar-count">
        Showing {filtered.length} of {allPublications.length} publications
      </p>

      {/* Publications list */}
      {filtered.length ? (
        <ul className="scholar-list">
          {filtered.map((entry, index) => (
            <motion.li
              key={`${entry.title}-${entry.year}`}
              className="scholar-item"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
            >
              <div className="scholar-item-content">
                <div className="scholar-item-meta">
                  {typeFilterEnabled && (
                    <span className="scholar-type">{entry.type}</span>
                  )}
                  {entry.year && <span className="scholar-year">{entry.year}</span>}
                </div>

                <a href={entry.url} target="_blank" rel="noreferrer" className="scholar-title">
                  {entry.title}
                </a>

                {entry.authors && <p className="scholar-authors">{entry.authors}</p>}
                {entry.venue && <p className="scholar-journal">{entry.venue}</p>}

                <div className="scholar-item-footer">
                  {entry.tags?.length > 0 && (
                    <div className="scholar-tags">
                      {entry.tags.map((tag) => (
                        <span key={`${entry.title}-${tag}`} className="tag tag--muted">{tag}</span>
                      ))}
                    </div>
                  )}

                  {exportEnabled && (
                    <div className="export-dropdown export-dropdown--inline">
                      <button
                        className="export-btn export-btn--small"
                        onClick={() => setShowExport(showExport === entry.title ? null : entry.title)}
                      >
                        Cite
                      </button>
                      <AnimatePresence>
                        {showExport === entry.title && (
                          <motion.div
                            className="export-menu"
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                          >
                            <button onClick={() => handleExport(entry, 'bibtex')}>BibTeX</button>
                            <button onClick={() => handleExport(entry, 'ris')}>RIS</button>
                            <button onClick={() => handleExport(entry, 'endnote')}>EndNote</button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </div>
              </div>
            </motion.li>
          ))}
        </ul>
      ) : (
        <p className="scholar-status">No publications match the current filters.</p>
      )}

      <style>{`
        .scholar-feed-enhanced {
          width: 100%;
        }

        .scholar-controls {
          display: flex;
          flex-wrap: wrap;
          justify-content: space-between;
          align-items: flex-end;
          gap: 1rem;
          margin-bottom: 1.5rem;
          padding-bottom: 1.5rem;
          border-bottom: 1px solid rgba(148, 163, 184, 0.2);
        }

        .scholar-filters {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .filter-item {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
        }

        .filter-item span {
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--secondary-500, #64748b);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .filter-item input,
        .filter-item select {
          padding: 0.5rem 0.75rem;
          border: 1px solid rgba(148, 163, 184, 0.25);
          border-radius: 6px;
          font-size: 0.9rem;
          background: white;
          min-width: 140px;
        }

        [data-theme='dark'] .filter-item input,
        [data-theme='dark'] .filter-item select {
          background: var(--secondary-800, #1e293b);
          border-color: rgba(148, 163, 184, 0.2);
          color: var(--secondary-200, #e2e8f0);
        }

        .scholar-actions {
          display: flex;
          gap: 0.75rem;
        }

        .export-dropdown {
          position: relative;
        }

        .export-btn,
        .network-btn {
          padding: 0.5rem 1rem;
          font-size: 0.85rem;
          font-weight: 500;
          border: 1px solid rgba(148, 163, 184, 0.25);
          border-radius: 6px;
          background: white;
          color: var(--secondary-700, #334155);
          cursor: pointer;
          transition: all 0.2s;
        }

        [data-theme='dark'] .export-btn,
        [data-theme='dark'] .network-btn {
          background: var(--secondary-800, #1e293b);
          border-color: rgba(148, 163, 184, 0.2);
          color: var(--secondary-300, #cbd5e1);
        }

        .export-btn:hover,
        .network-btn:hover,
        .network-btn.is-active {
          border-color: var(--primary-400, #60a5fa);
          color: var(--primary-600, #2563eb);
        }

        [data-theme='dark'] .export-btn:hover,
        [data-theme='dark'] .network-btn:hover,
        [data-theme='dark'] .network-btn.is-active {
          color: var(--primary-400, #60a5fa);
        }

        .export-menu {
          position: absolute;
          top: calc(100% + 0.5rem);
          right: 0;
          background: white;
          border: 1px solid rgba(148, 163, 184, 0.2);
          border-radius: 8px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
          overflow: hidden;
          z-index: 100;
        }

        [data-theme='dark'] .export-menu {
          background: var(--secondary-800, #1e293b);
        }

        .export-menu button {
          display: block;
          width: 100%;
          padding: 0.6rem 1rem;
          text-align: left;
          border: none;
          background: none;
          font-size: 0.85rem;
          color: var(--secondary-700, #334155);
          cursor: pointer;
          transition: background 0.2s;
        }

        [data-theme='dark'] .export-menu button {
          color: var(--secondary-300, #cbd5e1);
        }

        .export-menu button:hover {
          background: var(--primary-50, #eff6ff);
        }

        [data-theme='dark'] .export-menu button:hover {
          background: var(--secondary-700, #334155);
        }

        /* Network */
        .network-container {
          background: var(--secondary-50, #f8fafc);
          border-radius: 12px;
          padding: 1.5rem;
          margin-bottom: 1.5rem;
          overflow: hidden;
        }

        [data-theme='dark'] .network-container {
          background: var(--secondary-800, #1e293b);
        }

        .network-header {
          margin-bottom: 1rem;
        }

        .network-header h4 {
          margin: 0 0 0.25rem 0;
          font-size: 1rem;
          color: var(--secondary-800, #1e293b);
        }

        [data-theme='dark'] .network-header h4 {
          color: var(--secondary-200, #e2e8f0);
        }

        .network-header p {
          margin: 0;
          font-size: 0.8rem;
          color: var(--secondary-500, #64748b);
        }

        .network-graph {
          width: 100%;
          min-height: 400px;
          background: white;
          border-radius: 8px;
        }

        [data-theme='dark'] .network-graph {
          background: var(--secondary-900, #0f172a);
        }

        .network-legend {
          display: flex;
          flex-wrap: wrap;
          gap: 1.5rem;
          margin-top: 1rem;
          font-size: 0.8rem;
          color: var(--secondary-500, #64748b);
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .legend-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
        }

        .legend-dot--primary {
          background: #10b981;
        }

        .legend-dot--secondary {
          background: #3b82f6;
        }

        /* Count */
        .scholar-count {
          font-size: 0.85rem;
          color: var(--secondary-500, #64748b);
          margin-bottom: 1rem;
        }

        /* List */
        .scholar-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .scholar-item {
          background: white;
          border-radius: 12px;
          padding: 1.25rem;
          border: 1px solid rgba(148, 163, 184, 0.15);
          transition: all 0.2s;
        }

        [data-theme='dark'] .scholar-item {
          background: var(--secondary-800, #1e293b);
          border-color: rgba(148, 163, 184, 0.1);
        }

        .scholar-item:hover {
          border-color: var(--primary-300, #93c5fd);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.1);
        }

        .scholar-item-meta {
          display: flex;
          gap: 0.75rem;
          margin-bottom: 0.5rem;
        }

        .scholar-type {
          font-size: 0.7rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding: 0.15rem 0.5rem;
          background: var(--primary-100, #dbeafe);
          color: var(--primary-700, #1d4ed8);
          border-radius: 4px;
        }

        [data-theme='dark'] .scholar-type {
          background: rgba(59, 130, 246, 0.2);
          color: var(--primary-300, #93c5fd);
        }

        .scholar-year {
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--secondary-500, #64748b);
        }

        .scholar-title {
          display: block;
          font-size: 1.05rem;
          font-weight: 600;
          color: var(--secondary-900, #0f172a);
          text-decoration: none;
          line-height: 1.4;
          margin-bottom: 0.35rem;
        }

        [data-theme='dark'] .scholar-title {
          color: var(--secondary-100, #f1f5f9);
        }

        .scholar-title:hover {
          color: var(--primary-600, #2563eb);
        }

        [data-theme='dark'] .scholar-title:hover {
          color: var(--primary-400, #60a5fa);
        }

        .scholar-authors {
          font-size: 0.85rem;
          color: var(--secondary-600, #475569);
          margin: 0 0 0.25rem 0;
        }

        [data-theme='dark'] .scholar-authors {
          color: var(--secondary-400, #94a3b8);
        }

        .scholar-journal {
          font-size: 0.85rem;
          color: var(--secondary-500, #64748b);
          font-style: italic;
          margin: 0;
        }

        .scholar-item-footer {
          display: flex;
          flex-wrap: wrap;
          justify-content: space-between;
          align-items: center;
          gap: 0.75rem;
          margin-top: 0.75rem;
        }

        .scholar-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 0.35rem;
        }

        .tag--muted {
          background: var(--secondary-100, #f1f5f9);
          color: var(--secondary-600, #475569);
          font-size: 0.7rem;
          padding: 0.2rem 0.5rem;
          border-radius: 4px;
        }

        [data-theme='dark'] .tag--muted {
          background: var(--secondary-700, #334155);
          color: var(--secondary-300, #cbd5e1);
        }

        .export-dropdown--inline {
          margin-left: auto;
        }

        .export-btn--small {
          padding: 0.3rem 0.6rem;
          font-size: 0.75rem;
        }

        .scholar-status {
          text-align: center;
          padding: 2rem;
          color: var(--secondary-500, #64748b);
        }

        @media (max-width: 640px) {
          .scholar-controls {
            flex-direction: column;
            align-items: stretch;
          }

          .scholar-actions {
            justify-content: flex-end;
          }

          .filter-item input,
          .filter-item select {
            min-width: 0;
            width: 100%;
          }
        }
      `}</style>
    </section>
  );
};

export default ScholarFeedEnhanced;
