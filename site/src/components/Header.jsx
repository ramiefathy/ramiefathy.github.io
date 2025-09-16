const NAV_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'About', href: '/about' },
  { label: 'Applications', href: '/apps' },
  { label: 'Legacy', href: '/legacy' },
  { label: 'Contact', href: '#contact' }
];

const Header = () => {
  return (
    <header className="header-shell">
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
      </div>
    </header>
  );
};

export default Header;
