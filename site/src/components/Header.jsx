import { useEffect, useState } from 'react';
import CommandPalette from './CommandPalette.jsx';
import { lockScroll, unlockScroll } from '../lib/scrollLock.js';

const NAV_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'About', href: '/about' },
  { label: 'Apps & Projects', href: '/apps' },
  { label: 'Research', href: '/research' },
  { label: 'Blog', href: '/blog' },
  { label: 'Contact', href: '/contact' }
];

function isActiveLink(pathname, href) {
  if (!pathname || !href) return false;
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}

const CLOCK_FORMATTER = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/New_York',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false
});

/** Baltimore wall-clock for the status bar — always America/New_York,
 *  regardless of the visitor's own timezone, since the label reads
 *  "· Baltimore". Rendered empty on the server so SSR markup and the first
 *  client paint agree. */
const useClock = () => {
  const [stamp, setStamp] = useState('');
  useEffect(() => {
    const tick = () => setStamp(CLOCK_FORMATTER.format(new Date()));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);
  return stamp;
};

const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activePath, setActivePath] = useState('');
  const [paletteOpen, setPaletteOpen] = useState(false);
  const clock = useClock();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const updatePath = () => setActivePath(window.location.pathname || '/');
    updatePath();
    window.addEventListener('popstate', updatePath);
    return () => window.removeEventListener('popstate', updatePath);
  }, []);

  // ⌘K / Ctrl-K anywhere; bare `k` only when nothing is focused, so typing in
  // a form field never opens the palette.
  useEffect(() => {
    const onKeyDown = (event) => {
      const key = event.key?.toLowerCase();
      if (key !== 'k') return;
      const bareKeyIsSafe =
        !event.metaKey &&
        !event.ctrlKey &&
        !event.altKey &&
        document.activeElement === document.body;
      if (event.metaKey || event.ctrlKey || bareKeyIsSafe) {
        event.preventDefault();
        setPaletteOpen(true);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);

    if (menuOpen) lockScroll();

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (menuOpen) unlockScroll();
    };
  }, [menuOpen]);

  const toggleMenu = () => setMenuOpen((value) => !value);
  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="header-shell">
      <div className="status-bar">
        <span className="status-bar__who">
          <span className="status-bar__dot" aria-hidden="true"></span>
          <span className="status-bar__name">Ramie Fathy, MD</span>
          <span className="status-bar__where">· Johns Hopkins Dermatology</span>
        </span>
        <span className="status-bar__right">
          <span className="status-clock">
            {clock ? `${clock} · Baltimore` : 'Baltimore'}
          </span>
          <button
            type="button"
            className="palette-key"
            onClick={() => setPaletteOpen(true)}
            aria-haspopup="dialog"
          >
            navigate <kbd>⌘K</kbd>
          </button>
        </span>
      </div>
      <div className="header-inner">
        <a href="/" aria-label="Ramie Fathy home" className="header-logo">
          <img src="/favicon.ico" width="32" height="32" alt="Ramie Fathy logo" />
          <span>Ramie Fathy, MD</span>
        </a>
        <nav className="header-nav" aria-label="Primary navigation">
          {NAV_LINKS.map((link) => (
            <a
              key={`desktop-${link.label}`}
              href={link.href}
              className={`header-link ${isActiveLink(activePath, link.href) ? 'is-active' : ''}`}
              target={link.href.startsWith('http') ? '_blank' : undefined}
              rel={link.href.startsWith('http') ? 'noreferrer' : undefined}
            >
              {link.label}
            </a>
          ))}
        </nav>
        <div className="header-actions">
          <button
            type="button"
            className="header-menu"
            aria-label="Toggle navigation"
            aria-expanded={menuOpen}
            aria-controls="mobile-navigation"
            onClick={toggleMenu}
          >
            <span className="header-menu__icon" aria-hidden="true">
              <span></span>
              <span></span>
              <span></span>
            </span>
            <span className="sr-only">Menu</span>
          </button>
        </div>
      </div>
      <div className={`header-drawer ${menuOpen ? 'is-open' : ''}`} id="mobile-navigation">
        <nav className="header-drawer__nav" aria-label="Mobile navigation">
          {NAV_LINKS.map((link) => (
            <a
              key={`mobile-${link.label}`}
              href={link.href}
              className={`header-drawer__link ${isActiveLink(activePath, link.href) ? 'is-active' : ''}`}
              target={link.href.startsWith('http') ? '_blank' : undefined}
              rel={link.href.startsWith('http') ? 'noreferrer' : undefined}
              onClick={closeMenu}
            >
              {link.label}
            </a>
          ))}
        </nav>
      </div>
      {menuOpen && <button type="button" className="header-drawer__backdrop" aria-label="Close navigation" onClick={closeMenu}></button>}
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </header>
  );
};

export default Header;
