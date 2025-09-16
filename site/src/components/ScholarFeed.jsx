import { useEffect, useMemo, useState } from 'react';

const SCHOLAR_URL = 'https://r.jina.ai/https://scholar.google.com/citations?user=Pb_Ht9cAAAAJ&hl=en&view_op=list_works&sortby=pubdate';

const parseEntries = (html) => {
  if (typeof window === 'undefined') return [];
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const rows = Array.from(doc.querySelectorAll('.gsc_a_tr'));
  return rows.map((row) => {
    const titleNode = row.querySelector('.gsc_a_at');
    const authorsNode = row.querySelector('.gsc_a_at')?.parentElement?.nextElementSibling;
    const journalNode = row.querySelector('.gsc_a_at')?.parentElement?.nextElementSibling?.nextElementSibling;
    const yearNode = row.querySelector('.gsc_a_y');
    return {
      title: titleNode?.textContent?.trim() ?? 'Untitled',
      url: titleNode ? `https://scholar.google.com${titleNode.getAttribute('href')}` : '#',
      authors: authorsNode?.textContent?.trim() ?? '',
      journal: journalNode?.textContent?.trim() ?? '',
      year: parseInt(yearNode?.textContent ?? '0', 10) || null,
      raw: row.textContent ?? ''
    };
  });
};

const ScholarFeed = () => {
  const [entries, setEntries] = useState([]);
  const [query, setQuery] = useState('');
  const [year, setYear] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function fetchScholar() {
      try {
        setLoading(true);
        const response = await fetch(SCHOLAR_URL);
        const text = await response.text();
        if (!cancelled) {
          setEntries(parseEntries(text));
        }
      } catch (err) {
        if (!cancelled) {
          setError('Unable to load publications from Google Scholar right now.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    fetchScholar();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    return entries.filter((entry) => {
      const matchesQuery = query
        ? entry.title.toLowerCase().includes(query.toLowerCase()) || entry.authors.toLowerCase().includes(query.toLowerCase())
        : true;
      const matchesYear = year ? String(entry.year || '').startsWith(year) : true;
      return matchesQuery && matchesYear;
    });
  }, [entries, query, year]);

  return (
    <section className="scholar-feed" data-scroll-fade>
      <div className="scholar-controls">
        <label>
          <span>Search</span>
          <input
            type="search"
            placeholder="Title or author"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <label>
          <span>Year</span>
          <input
            type="text"
            inputMode="numeric"
            placeholder="2025"
            value={year}
            onChange={(event) => setYear(event.target.value)}
            maxLength={4}
          />
        </label>
      </div>
      {loading && <p className="scholar-status">Fetching publications…</p>}
      {error && <p className="scholar-status scholar-status--error">{error}</p>}
      {!loading && !error && (
        <ul className="scholar-list">
          {filtered.map((entry) => (
            <li key={`${entry.title}-${entry.year}`} className="scholar-item">
              <div>
                <a href={entry.url} target="_blank" rel="noreferrer" className="scholar-title">
                  {entry.title}
                </a>
                {entry.authors && <p className="scholar-authors">{entry.authors}</p>}
                {entry.journal && <p className="scholar-journal">{entry.journal}</p>}
              </div>
              {entry.year && <span className="scholar-year">{entry.year}</span>}
            </li>
          ))}
          {!filtered.length && <li className="scholar-status">No publications match the current filters.</li>}
        </ul>
      )}
    </section>
  );
};

export default ScholarFeed;
