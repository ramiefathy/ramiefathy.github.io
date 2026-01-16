import { useEffect, useRef, useState } from 'react';

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

const Header = () => {
  const [theme, setTheme] = useState('light');
  const [menuOpen, setMenuOpen] = useState(false);
  const [activePath, setActivePath] = useState('');
  const previousOverflow = useRef('');

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const current = document.documentElement.dataset.theme || 'light';
    setTheme(current);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const updatePath = () => setActivePath(window.location.pathname || '/');
    updatePath();
    window.addEventListener('popstate', updatePath);
    return () => window.removeEventListener('popstate', updatePath);
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);

    if (menuOpen) {
      previousOverflow.current = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = previousOverflow.current || '';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow.current || '';
    };
  }, [menuOpen]);

  const toggleTheme = () => {
    if (typeof document === 'undefined') return;
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.dataset.theme = next;
    try {
      window.localStorage.setItem('theme', next);
    } catch (err) {
      console.warn('Unable to persist theme preference', err);
    }
  };

  const toggleMenu = () => setMenuOpen((value) => !value);
  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="header-shell" data-scroll-fade>
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
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label="Toggle dark mode"
            aria-pressed={theme === 'dark'}
          >
            <span aria-hidden="true">{theme === 'dark' ? '☾' : '☀︎'}</span>
          </button>
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
    </header>
  );
};

export default Header;
