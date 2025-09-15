import { AppBar, Box, Container, IconButton, Toolbar, Typography } from '@mui/material';
import { Brightness4, Brightness7 } from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import React from 'react';

type Props = {
  mode: 'light' | 'dark';
  toggleMode: () => void;
};

export default function Header({ mode, toggleMode }: Props) {
  return (
    <AppBar position="sticky" color="inherit" elevation={1} sx={{ bgcolor: 'background.paper' }}>
      <Container maxWidth="lg">
        <Toolbar disableGutters>
          <Typography variant="h6" component={RouterLink} to="/" color="primary" sx={{ textDecoration: 'none', fontWeight: 700 }}>
            Dr. Ramie Fathy
          </Typography>
          <Box sx={{ flexGrow: 1 }} />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography component={RouterLink} to="/about" color="text.primary" sx={{ textDecoration: 'none', '&:hover': { color: 'primary.main' } }}>
              About
            </Typography>
            <IconButton onClick={toggleMode} aria-label="Toggle theme">
              {mode === 'dark' ? <Brightness7 /> : <Brightness4 />}
            </IconButton>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
}

