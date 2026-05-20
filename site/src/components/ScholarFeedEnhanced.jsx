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
  const [visibleCount, setVisibleCount] = useState(15);
  const networkRef = useRef(null);
  const loadMoreRef = useRef(null);

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

  // Reset visible window on filter change
  useEffect(() => {
    setVisibleCount(15);
  }, [query, yearFilter, typeFilter]);

  useEffect(() => {
    const node = loadMoreRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleCount((count) => count + 15);
          }
        });
      },
      { rootMargin: '200px' }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [filtered.length]);

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
                Export
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

      {/* Results count — only shown when a filter is active */}
      {(query || yearFilter || typeFilter) && (
        <p className="scholar-count">
          {filtered.length} {filtered.length === 1 ? 'match' : 'matches'}
        </p>
      )}

      {/* Publications list */}
      {filtered.length ? (
        <ul className="scholar-list">
          {filtered.slice(0, visibleCount).map((entry, index) => (
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
          {visibleCount < filtered.length && (
            <li className="scholar-load-more" ref={loadMoreRef} aria-live="polite">
              Loading more publications…
            </li>
          )}
        </ul>
      ) : (
        <p className="scholar-status">No publications match the current filters.</p>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        /* ScholarFeedEnhanced — Atlas register style */
        .scholar-feed-enhanced { width: 100%; }

        .scholar-controls {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 24px;
          align-items: end;
          padding: 18px 20px;
          background: var(--bone-2);
          border: 2px solid var(--ink);
          margin-bottom: 0;
        }
        .scholar-filters { display: flex; flex-wrap: wrap; gap: 18px; }
        .filter-item { display: flex; flex-direction: column; gap: 4px; }
        .filter-item span {
          font-family: var(--font-mono);
          font-size: 10px;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: var(--terracotta);
          font-weight: 700;
        }
        .filter-item input,
        .filter-item select {
          font-family: var(--font-mono);
          font-size: 12px;
          color: var(--ink);
          background: var(--plate-bg);
          border: 1px solid var(--rule);
          border-radius: 0;
          padding: 6px 10px;
          min-width: 140px;
          outline: none;
        }
        .filter-item input:focus-visible,
        .filter-item select:focus-visible { border-color: var(--terracotta); }

        .scholar-actions { display: flex; gap: 8px; }
        .export-dropdown { position: relative; }
        .export-btn, .network-btn {
          appearance: none;
          background: transparent;
          border: 1px solid var(--rule);
          padding: 8px 14px;
          font-family: var(--font-mono);
          font-size: 10px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--ink-soft);
          cursor: pointer;
          border-radius: 0;
          transition: background 180ms ease, color 180ms ease;
        }
        .export-btn:hover,
        .network-btn:hover,
        .network-btn.is-active {
          background: var(--ink);
          color: var(--bone);
          border-color: var(--ink);
        }

        .export-menu {
          position: absolute;
          top: calc(100% + 6px);
          right: 0;
          background: var(--plate-bg);
          border: 1px solid var(--ink);
          z-index: 100;
          min-width: 160px;
        }
        .export-menu button {
          display: block;
          width: 100%;
          padding: 10px 14px;
          background: transparent;
          border: 0;
          border-bottom: 1px solid var(--rule-soft);
          font-family: var(--font-mono);
          font-size: 11px;
          letter-spacing: 0.08em;
          color: var(--ink-soft);
          text-align: left;
          cursor: pointer;
        }
        .export-menu button:last-child { border-bottom: 0; }
        .export-menu button:hover { background: var(--bone-2); color: var(--terracotta); }

        /* Co-author network */
        .network-container {
          background: var(--plate-bg);
          border: 1px solid var(--ink);
          border-top: 0;
          padding: 24px;
          overflow: hidden;
        }
        .network-header { margin-bottom: 12px; }
        .network-header h4 {
          font-family: var(--font-display);
          font-weight: 500;
          font-size: 18px;
          letter-spacing: -0.012em;
          color: var(--ink);
          margin: 0;
        }
        .network-header p {
          font-family: var(--font-mono);
          font-size: 11px;
          color: var(--slate);
          margin: 4px 0 0;
          letter-spacing: 0.04em;
        }
        .network-graph {
          width: 100%;
          min-height: 380px;
          background: var(--bone);
          border: 1px solid var(--rule-soft);
        }
        .network-legend {
          display: flex;
          gap: 18px;
          margin-top: 12px;
          font-family: var(--font-mono);
          font-size: 10px;
          letter-spacing: 0.06em;
          color: var(--slate);
        }
        .legend-item { display: flex; align-items: center; gap: 6px; }
        .legend-dot { width: 10px; height: 10px; }
        .legend-dot--primary { background: var(--terracotta); }
        .legend-dot--secondary { background: var(--slate); }
        .legend-text { font-family: var(--font-mono); font-size: 10px; color: var(--slate); }

        .scholar-count {
          font-family: var(--font-mono);
          font-size: 11px;
          color: var(--slate);
          letter-spacing: 0.06em;
          padding: 14px 0;
          border-bottom: 1px solid var(--rule-soft);
          margin: 0;
        }

        /* Register list */
        .scholar-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 0;
          background: var(--plate-bg);
          border: 1px solid var(--ink);
          border-top: 0;
        }
        .scholar-load-more {
          text-align: center;
          padding: 18px;
          font-family: var(--font-mono);
          font-size: 11px;
          color: var(--slate);
          letter-spacing: 0.06em;
        }
        .scholar-item {
          display: block;
          padding: 18px 20px;
          border-bottom: 1px solid var(--rule-soft);
          transition: background 180ms ease;
        }
        .scholar-item-content { display: block; }
        .scholar-item:last-child { border-bottom: 0; }
        .scholar-item:hover { background: var(--bone); }

        .scholar-item-meta {
          display: flex;
          gap: 12px;
          align-items: baseline;
          margin-bottom: 6px;
        }
        .scholar-type {
          font-family: var(--font-mono);
          font-size: 9px;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: var(--terracotta);
          font-weight: 700;
        }
        .scholar-year {
          font-family: var(--font-mono);
          font-size: 11px;
          color: var(--ink);
          font-weight: 700;
          letter-spacing: 0.06em;
        }
        .scholar-title {
          display: block;
          font-family: var(--font-emphasis);
          font-weight: 400;
          font-size: 17px;
          line-height: 1.3;
          color: var(--ink);
          text-decoration: none;
          margin-bottom: 6px;
        }
        .scholar-title:hover { color: var(--terracotta); }
        .scholar-authors {
          font-family: var(--font-mono);
          font-size: 11px;
          color: var(--slate);
          letter-spacing: 0.04em;
          margin: 0 0 4px;
        }
        .scholar-journal {
          font-family: var(--font-display);
          font-size: 13px;
          color: var(--ink-soft);
          margin: 0;
        }

        .scholar-item-footer {
          display: flex;
          flex-wrap: wrap;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
          margin-top: 10px;
        }
        .scholar-tags { display: flex; flex-wrap: wrap; gap: 6px; }
        .scholar-feed-enhanced .tag,
        .scholar-feed-enhanced .tag--muted {
          font-family: var(--font-mono);
          font-size: 9px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--slate);
          background: transparent;
          border: 1px solid var(--rule-soft);
          padding: 3px 7px;
          border-radius: 0;
        }

        .export-dropdown--inline { margin-left: auto; }
        .export-btn--small { padding: 5px 10px; font-size: 9px; }

        .scholar-status {
          text-align: center;
          padding: 32px;
          font-family: var(--font-emphasis);
          font-style: italic;
          color: var(--slate);
        }

        @media (max-width: 768px) {
          .scholar-controls {
            grid-template-columns: 1fr;
          }
          .scholar-actions { justify-content: flex-start; flex-wrap: wrap; }
          .filter-item input,
          .filter-item select { min-width: 0; width: 100%; }
        }
      ` }} />
    </section>
  );
};

export default ScholarFeedEnhanced;
