import React from 'react';
import { CssBaseline, ThemeProvider, Container } from '@mui/material';
import { Outlet } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import { buildTheme } from './theme';

export default function App() {
  const [mode, setMode] = React.useState<'light' | 'dark'>(
    (localStorage.getItem('color-mode') as 'light' | 'dark') || 'light'
  );

  const toggleMode = () => {
    setMode((m) => {
      const next = m === 'light' ? 'dark' : 'light';
      localStorage.setItem('color-mode', next);
      return next;
    });
  };

  const theme = React.useMemo(() => buildTheme(mode), [mode]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 bg-white p-2 rounded shadow">Skip to content</a>
      <Header mode={mode} toggleMode={toggleMode} />
      <main id="main">
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Outlet />
        </Container>
      </main>
      <Footer />
    </ThemeProvider>
  );
}

