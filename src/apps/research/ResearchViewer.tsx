import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Alert, Button, Link, Paper, Stack, TextField, Typography } from '@mui/material';

type Item = { title: string; journal?: string; year?: number; doi?: string; url?: string; authors?: string[]; source: string };

export default function ResearchViewer() {
  const [items, setItems] = React.useState<Item[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [query, setQuery] = React.useState('');

  const load = async () => {
    try {
      setError(null);
      const res = await fetch('/.netlify/functions/research-list');
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setItems(data.items || []);
    } catch (e: any) {
      setError(e.message || 'Failed to load');
    }
  };

  React.useEffect(() => { load(); }, []);

  const filtered = items.filter((i) =>
    !query.trim() ||
    (i.title && i.title.toLowerCase().includes(query.toLowerCase())) ||
    (i.journal && i.journal.toLowerCase().includes(query.toLowerCase()))
  ).slice(0, 100);

  return (
    <>
      <Helmet><title>Research Feed</title></Helmet>
      <Paper variant="outlined" sx={{ p: 3, mb: 2 }}>
        <Typography variant="h5" fontWeight={700} gutterBottom>Dermatology Research (Auto‑Harvest)</Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
          <Button variant="contained" onClick={load}>Load Latest</Button>
          <TextField value={query} onChange={(e) => setQuery(e.target.value)} label="Filter by title/journal" fullWidth />
        </Stack>
        {error && <Alert sx={{ mt: 2 }} severity="error">{error}</Alert>}
      </Paper>
      <Stack spacing={2}>
        {filtered.map((it, idx) => (
          <Paper key={idx} variant="outlined" sx={{ p: 2 }}>
            <Typography variant="subtitle1" fontWeight={600}>{it.title}</Typography>
            <Typography variant="body2" color="text.secondary">
              {(it.authors || []).slice(0, 5).join(', ')}{(it.authors || []).length > 5 ? ' et al.' : ''}
            </Typography>
            <Typography variant="body2" color="text.secondary">{it.journal}{it.year ? ` · ${it.year}` : ''}</Typography>
            <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
              {it.url && <Link href={it.url} target="_blank" rel="noopener">Open</Link>}
              {it.doi && <Link href={`https://doi.org/${it.doi}`} target="_blank" rel="noopener">DOI</Link>}
              <Typography variant="caption" color="text.secondary">{it.source}</Typography>
            </Stack>
          </Paper>
        ))}
        {filtered.length === 0 && <Typography color="text.secondary">No items yet.</Typography>}
      </Stack>
    </>
  );
}

