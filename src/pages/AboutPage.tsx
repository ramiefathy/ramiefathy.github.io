import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Avatar, Box, Link, Paper, Stack, Typography } from '@mui/material';

export default function AboutPage() {
  return (
    <>
      <Helmet>
        <title>About — Dr. Ramie Fathy</title>
        <meta name="description" content="About Dr. Ramie Fathy — Dermatology Resident Physician at Johns Hopkins University." />
      </Helmet>
      <Paper elevation={0} sx={{ p: 4 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} alignItems={{ xs: 'flex-start', sm: 'center' }}>
          <Avatar sx={{ width: 96, height: 96 }}>RF</Avatar>
          <Box>
            <Typography variant="h4" fontWeight={800} gutterBottom>
              Ramie Fathy, MD
            </Typography>
            <Typography color="text.secondary" gutterBottom>
              PGY-4 Dermatology Resident Physician at Johns Hopkins University
            </Typography>
            <Typography>
              Interests include dermatology and dermatopathology, AI in medicine, medical education, and clinical innovation.
            </Typography>
            <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
              <Link href="/assets/public/documents/Research Website Instructions.docx" underline="hover">CV / Docs</Link>
              <Link href="/" underline="hover">Home</Link>
            </Stack>
          </Box>
        </Stack>
      </Paper>
    </>
  );
}
