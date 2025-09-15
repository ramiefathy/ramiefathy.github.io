import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Box, Button, Chip, Divider, Grid, Paper, Stack, Typography } from '@mui/material';
import { apps } from '@/data/apps';

export default function HomePage() {
  return (
    <>
      <Helmet>
        <title>Home — Dr. Ramie Fathy</title>
        <meta name="description" content="Dermatology, research, and interactive applications by Dr. Ramie Fathy." />
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Person',
            name: 'Ramie Fathy, MD',
            url: 'https://ramiefathy.github.io',
            jobTitle: 'Dermatology Resident Physician',
            affiliation: 'Johns Hopkins University'
          })}
        </script>
      </Helmet>

      <Paper elevation={0} sx={{ p: 4, mb: 4, bgcolor: 'background.paper' }}>
        <Typography variant="h3" fontWeight={800} gutterBottom>
          Dermatology • AI • Education
        </Typography>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          Tools and research by Dr. Ramie Fathy
        </Typography>
        <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
          <Button href="#apps" variant="contained">Explore Apps</Button>
          <Button href="/assets/public/documents/README.html" variant="outlined">Documentation</Button>
        </Stack>
      </Paper>

      <section id="apps">
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Featured Apps
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Grid container spacing={2}>
          {apps.map((app) => (
            <Grid item xs={12} sm={6} md={4} key={app.path}>
              <Paper variant="outlined" sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h6" gutterBottom>{app.title}</Typography>
                  <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                    {(app.tags || []).map((t) => <Chip key={t} label={t} size="small" />)}
                  </Stack>
                </Box>
                <Button href={app.path} variant="text" sx={{ mt: 2 }}>
                  Open
                </Button>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </section>
    </>
  );
}

