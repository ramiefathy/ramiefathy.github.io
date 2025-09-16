import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';

const NAV_LINKS = [
  { label: 'Features', href: '#apps' },
  { label: 'Pricing', href: 'https://ramiefathy.netlify.app', external: true },
  { label: 'Docs', href: '/legacy' }
];

const Logo = () => (
  <svg width="42" height="42" viewBox="0 0 64 64" aria-hidden="true">
    <defs>
      <linearGradient id="rfGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#6d28d9" />
        <stop offset="55%" stopColor="#a855f7" />
        <stop offset="100%" stopColor="#38bdf8" />
      </linearGradient>
    </defs>
    <rect width="64" height="64" rx="18" fill="url(#rfGradient)" />
    <path
      d="M20 45.5V18h14.3c7.6 0 12.1 3.7 12.1 9.2 0 4.4-2.5 7.2-6.3 8.4l7.5 9.9H41.2l-6.6-8.9h-6.9v8.9H20Zm22.2-18.3c0-2.9-2.1-4.6-6.4-4.6h-8.6v9.2h8.6c4.2 0 6.4-1.8 6.4-4.6Z"
      fill="#fff"
    />
  </svg>
);

const gooeyFilter = (
  <svg width="0" height="0">
    <filter id="gooey">
      <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
      <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -10" result="gooey" />
      <feComposite in="SourceGraphic" in2="gooey" operator="atop" />
    </filter>
  </svg>
);

const Header = () => {
  const [hovered, setHovered] = useState(false);
  const loginVariants = useMemo(
    () => ({
      initial: { width: 96, backgroundColor: 'rgba(15, 23, 42, 0.78)' },
      hover: { width: 134, backgroundColor: 'rgba(99, 102, 241, 0.95)' }
    }),
    []
  );

  const orbVariants = useMemo(
    () => ({
      initial: { x: 44, scale: 1, backgroundColor: 'rgba(59, 130, 246, 1)' },
      hover: { x: 68, scale: 1.55, backgroundColor: 'rgba(236, 72, 153, 1)' }
    }),
    []
  );

  return (
    <header className="header-shell">
      {gooeyFilter}
      <div className="header-inner">
        <a href="/" aria-label="Ramie Fathy home" className="header-logo">
          <Logo />
          <span>Ramie Fathy, MD</span>
        </a>
        <nav className="header-nav" aria-label="Primary">
          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="header-link"
              target={link.external ? '_blank' : undefined}
              rel={link.external ? 'noreferrer' : undefined}
            >
              {link.label}
            </a>
          ))}
        </nav>
        <div
          className="header-login"
          style={{ filter: 'url(#gooey)' }}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          <motion.button
            type="button"
            className="login-pill"
            variants={loginVariants}
            initial="initial"
            animate={hovered ? 'hover' : 'initial'}
            transition={{ type: 'spring', stiffness: 260, damping: 28 }}
          >
            <span>Login</span>
          </motion.button>
          <motion.div
            className="login-orb"
            variants={orbVariants}
            initial="initial"
            animate={hovered ? 'hover' : 'initial'}
            transition={{ type: 'spring', stiffness: 320, damping: 24 }}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
              <path d="M3 8h8.2l-2.6-2.6L9 4.8l4.2 4.2L9 13.2l-0.4-0.6L11.2 10H3V8Z" fill="white" />
            </svg>
          </motion.div>
        </div>
      </div>
    </header>
  );
};

export default Header;
