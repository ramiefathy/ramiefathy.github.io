import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { lockScroll, unlockScroll } from '../lib/scrollLock.js';

/**
 * ⌘K / Ctrl-K navigation palette.
 *
 * Rendered by `Header` so every route gets it. Keyboard contract:
 *   ⌘K / Ctrl-K  open        Esc      close
 *   ↑ / ↓        move        Enter    navigate to the highlighted row
 *   Tab / Shift-Tab           cycle focus within the dialog (does not escape it)
 *
 * The bare `k` shortcut only fires when focus is on the document body, so it
 * never steals a keystroke from the contact form or the apps search box.
 *
 * Keyboard handling lives on the dialog element, not the input: once a
 * result button has focus (via Tab or click), the input no longer sees
 * keydown events, so binding only there left Escape and the arrow keys dead
 * as soon as focus moved.
 */

const FOCUSABLE_SELECTOR = 'input, button, [href], [tabindex]:not([tabindex="-1"])';

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

    lockScroll();

    return () => {
      window.cancelAnimationFrame(raf);
      unlockScroll();
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
        return;
      }
      if (event.key === 'Tab') {
        // Trap focus inside the dialog — Tab must not leak into the page
        // the overlay sits on top of.
        const focusable = event.currentTarget.querySelectorAll(FOCUSABLE_SELECTOR);
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
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
      <div
        className="palette-dialog"
        role="dialog"
        aria-modal="true"
        aria-label="Navigate this site"
        onKeyDown={handleKeyDown}
      >
        <input
          ref={inputRef}
          className="palette-input"
          type="text"
          role="combobox"
          aria-expanded="true"
          aria-controls="palette-listbox"
          aria-activedescendant={results[cursor] ? `palette-option-${cursor}` : undefined}
          value={query}
          placeholder="Type a destination…"
          aria-label="Filter destinations"
          autoComplete="off"
          onChange={(event) => setQuery(event.target.value)}
        />
        {results.length ? (
          <ul className="palette-list" id="palette-listbox" role="listbox" aria-label="Destinations">
            {results.map((item, index) => (
              <li key={item.href} role="presentation">
                <button
                  type="button"
                  id={`palette-option-${index}`}
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
