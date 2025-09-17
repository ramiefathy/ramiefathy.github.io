import { useMemo, useState } from 'react';
import { publications } from '../data/publications.js';

const sortPublications = (items) =>
  [...items].sort((a, b) => {
    if (b.year !== a.year) return b.year - a.year;
    return a.title.localeCompare(b.title);
  });

const allPublications = sortPublications(publications);

const ScholarFeed = () => {
  const [query, setQuery] = useState('');
  const [year, setYear] = useState('');

  const filtered = useMemo(() => {
    return allPublications.filter((entry) => {
      const matchesQuery = query
        ? `${entry.title} ${entry.authors} ${entry.venue}`.toLowerCase().includes(query.toLowerCase())
        : true;
      const matchesYear = year ? String(entry.year || '').startsWith(year) : true;
      return matchesQuery && matchesYear;
    });
  }, [query, year]);

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
      {filtered.length ? (
        <ul className="scholar-list">
          {filtered.map((entry) => (
            <li key={`${entry.title}-${entry.year}`} className="scholar-item">
              <div>
                <a href={entry.url} target="_blank" rel="noreferrer" className="scholar-title">
                  {entry.title}
                </a>
                {entry.authors && <p className="scholar-authors">{entry.authors}</p>}
                {entry.venue && <p className="scholar-journal">{entry.venue}</p>}
                {entry.tags?.length ? (
                  <div className="scholar-tags">
                    {entry.tags.map((tag) => (
                      <span key={`${entry.title}-${tag}`} className="tag tag--muted">{tag}</span>
                    ))}
                  </div>
                ) : null}
              </div>
              {entry.year && <span className="scholar-year">{entry.year}</span>}
            </li>
          ))}
        </ul>
      ) : (
        <p className="scholar-status">No publications match the current filters.</p>
      )}
    </section>
  );
};

export default ScholarFeed;
