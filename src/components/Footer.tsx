import { Container, Divider, Link, Stack, Typography } from '@mui/material';
import React from 'react';

export default function Footer() {
  return (
    <footer className="mt-10">
      <Divider />
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="space-between" alignItems="center">
          <Typography variant="body2">© <span id="currentYear">{new Date().getFullYear()}</span> Dr. Ramie Fathy</Typography>
          <Stack direction="row" spacing={3}>
            <Link href="/apps/index.html" underline="hover">Apps</Link>
            <Link href="/assets/public/documents/README.html" underline="hover">Docs</Link>
          </Stack>
        </Stack>
      </Container>
    </footer>
  );
}

