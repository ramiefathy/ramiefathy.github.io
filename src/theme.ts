import { createTheme } from '@mui/material/styles';

export const buildTheme = (mode: 'light' | 'dark' = 'light') =>
  createTheme({
    palette: {
      mode,
      primary: { main: '#0b6bcb' },
      secondary: { main: '#7c3aed' }
    },
    typography: {
      fontFamily: [
        'Inter',
        'ui-sans-serif',
        'system-ui',
        '-apple-system',
        'Segoe UI',
        'Roboto',
        'Helvetica Neue',
        'Arial',
        'Noto Sans',
        'sans-serif'
      ].join(',')
    },
    shape: {
      borderRadius: 10
    }
  });

