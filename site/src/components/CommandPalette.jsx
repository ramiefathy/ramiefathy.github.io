import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

/**
 * ⌘K / Ctrl-K navigation palette.
 *
 * Rendered by `Header` so every route gets it. Keyboard contract:
 *   ⌘K / Ctrl-K  open        Esc      close
 *   ↑ / ↓        move        Enter    navigate to the highlighted row
 *
 * The bare `k` shortcut only fires when focus is on the document body, so it
 * never steals a keystroke from the contact form or the apps search box.
 */

const DESTINATIONS = [
  { label: 'Home', href: '/', keywords: 'home start index' },
  { label: 'About', href: '/about', keywords: 'about bio cv training fellowship leadership' },
  { label: 'Apps & projects', href: '/apps', keywords: 'apps projects software tools ramie scribe navigator mind maps skinoculars' },
  { label: 'Research', href: '/research', keywords: 'research publications papers scholarship dermoscopy dashboard' },
  { label: 'Blog', href: '/blog', keywords: 'blog writing essays media' },
  { label: 'Contact', href: '/contact', keywords: 'contact email reach collaborate speaking' }
];

const CommandPalette = ({ open, onClose }) => {
  const [query, setQuery] = useState('');
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef(null);
  const previouslyFocused = useRef(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return DESTINATIONS;
    return DESTINATIONS.filter(
      (item) => `${item.label} ${item.keywords}`.toLowerCase().includes(q)
    );
  }, [query]);

  useEffect(() => {
    setCursor(0);
  }, [query]);

  useEffect(() => {
    if (!open) return undefined;
    previouslyFocused.current = document.activeElement;
    setQuery('');
    setCursor(0);
    const raf = window.requestAnimationFrame(() => inputRef.current?.focus());

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.cancelAnimationFrame(raf);
      document.body.style.overflow = previousOverflow;
      const target = previouslyFocused.current;
      if (target && typeof target.focus === 'function') target.focus();
    };
  }, [open]);

  const go = useCallback((item) => {
    if (!item) return;
    window.location.assign(item.href);
  }, []);

  const handleKeyDown = useCallback(
    (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setCursor((c) => (results.length ? (c + 1) % results.length : 0));
        return;
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        setCursor((c) => (results.length ? (c - 1 + results.length) % results.length : 0));
        return;
      }
      if (event.key === 'Enter') {
        event.preventDefault();
        go(results[cursor]);
      }
    },
    [results, cursor, go, onClose]
  );

  if (!open) return null;

  return (
    <div
      className="palette-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="palette-dialog" role="dialog" aria-modal="true" aria-label="Navigate this site">
        <input
          ref={inputRef}
          className="palette-input"
          type="text"
          value={query}
          placeholder="Type a destination…"
          aria-label="Filter destinations"
          autoComplete="off"
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={handleKeyDown}
        />
        {results.length ? (
          <ul className="palette-list" role="listbox" aria-label="Destinations">
            {results.map((item, index) => (
              <li key={item.href} role="presentation">
                <button
                  type="button"
                  className="palette-item"
                  role="option"
                  aria-selected={index === cursor}
                  onMouseEnter={() => setCursor(index)}
                  onClick={() => go(item)}
                >
                  <span>{item.label}</span>
                  <span className="palette-item__hint">{item.href}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="palette-empty">No destination matches “{query}”.</p>
        )}
      </div>
    </div>
  );
};

export { DESTINATIONS };
export default CommandPalette;
