import { useEffect, useState } from 'react';

const NAV_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'About', href: '/about' },
  { label: 'Apps & Projects', href: '/apps' },
  { label: 'Research', href: '/research' },
  { label: 'Blog', href: '/blog' },
  { label: 'Contact', href: '#contact' }
];

const Header = () => {
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const current = document.documentElement.dataset.theme || 'light';
    setTheme(current);
  }, []);

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

  return (
    <header className="header-shell" data-scroll-fade>
      <div className="header-inner">
        <a href="/" aria-label="Ramie Fathy home" className="header-logo">
          <img src="/favicon.svg" width="36" height="36" alt="Ramie Fathy logo" />
          <span>Ramie Fathy, MD</span>
        </a>
        <nav className="header-nav" aria-label="Primary navigation">
          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="header-link"
              target={link.href.startsWith('http') ? '_blank' : undefined}
              rel={link.href.startsWith('http') ? 'noreferrer' : undefined}
            >
              {link.label}
            </a>
          ))}
        </nav>
        <button
          type="button"
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label="Toggle dark mode"
          aria-pressed={theme === 'dark'}
        >
          <span aria-hidden="true">{theme === 'dark' ? '☾' : '☀︎'}</span>
        </button>
      </div>
    </header>
  );
};

export default Header;
