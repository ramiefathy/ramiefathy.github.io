import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Box, Button, Divider, Paper, Stack, TextField, Typography } from '@mui/material';

export default function DermaScribePage() {
  const [transcript, setTranscript] = React.useState('');
  const [note, setNote] = React.useState('');
  const [analysis, setAnalysis] = React.useState('');
  const [recording, setRecording] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [suggestions, setSuggestions] = React.useState<string[]>([]);
  const [suggesting, setSuggesting] = React.useState(false);
  const [instruction, setInstruction] = React.useState('');
  const [imageDescription, setImageDescription] = React.useState('');
  const [analyzingImage, setAnalyzingImage] = React.useState(false);

  const recognitionRef = React.useRef<SpeechRecognition | null>(null);

  const startRecording = () => {
    setError(null);
    const SpeechRecognitionImpl: any = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionImpl) {
      setError('SpeechRecognition API not supported in this browser.');
      return;
    }
    const recog: SpeechRecognition = new SpeechRecognitionImpl();
    recog.lang = 'en-US';
    recog.continuous = true;
    recog.interimResults = true;
    recog.onresult = (ev: SpeechRecognitionEvent) => {
      let full = '';
      for (let i = 0; i < ev.results.length; i++) {
        full += ev.results[i][0].transcript + ' ';
      }
      setTranscript(full.trim());
    };
    recog.onerror = (e: any) => setError(e.error || 'Microphone error');
    recog.onend = () => setRecording(false);
    recognitionRef.current = recog;
    recog.start();
    setRecording(true);
  };

  const stopRecording = () => {
    recognitionRef.current?.stop();
    setRecording(false);
  };

  const generateNote = async () => {
    setError(null);
    setNote('');
    setAnalysis('');
    try {
      const res = await fetch('/.netlify/functions/finalize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setNote(data.note || '');
      setAnalysis(data.analysis || '');
    } catch (e: any) {
      setError(e.message || 'Failed to generate note');
    }
  };

  const getSuggestions = async () => {
    try {
      setError(null);
      setSuggestions([]);
      setSuggesting(true);
      const url = `/.netlify/functions/suggestions?transcript=${encodeURIComponent(transcript)}`;
      const es = new EventSource(url);
      es.onmessage = (ev) => {
        if (ev.data) setSuggestions((prev) => [...prev, ev.data]);
      };
      es.addEventListener('end', () => {
        setSuggesting(false);
        es.close();
      });
      es.onerror = (err) => {
        setSuggesting(false);
        setError('Suggestions stream error');
        es.close();
      };
    } catch (e: any) {
      setSuggesting(false);
      setError(e.message || 'Failed to open suggestions stream');
    }
  };

  const applyRefinement = async () => {
    try {
      setError(null);
      const res = await fetch('/.netlify/functions/refine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note, analysis, instruction }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setNote(data.note || '');
      setAnalysis(data.analysis || '');
      setInstruction('');
    } catch (e: any) {
      setError(e.message || 'Failed to refine');
    }
  };

  const onPickImage = async (file: File) => {
    try {
      setError(null);
      setAnalyzingImage(true);
      const base64 = await toBase64(file);
      const payload = { imageBase64: base64.split(',')[1], mimeType: file.type || 'image/png' };
      const res = await fetch('/.netlify/functions/image-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setImageDescription(data.description || '');
      setAnalyzingImage(false);
    } catch (e: any) {
      setAnalyzingImage(false);
      setError(e.message || 'Image analysis failed');
    }
  };

  const integrateImageDescription = () => {
    if (!imageDescription) return;
    const appended = transcript ? `${transcript}\n\nIMAGE FINDINGS: ${imageDescription}` : `IMAGE FINDINGS: ${imageDescription}`;
    setTranscript(appended);
  };

  function toBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  return (
    <>
      <Helmet>
        <title>DermaScribe — Draft Clinical Notes</title>
      </Helmet>
      <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" fontWeight={700} gutterBottom>
          DermaScribe (React)
        </Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          {!recording ? (
            <Button variant="contained" onClick={startRecording}>Start Recording</Button>
          ) : (
            <Button variant="outlined" color="error" onClick={stopRecording}>Stop</Button>
          )}
          <Button variant="contained" onClick={generateNote} disabled={!transcript}>Generate Note</Button>
          <Button variant="outlined" onClick={getSuggestions} disabled={!transcript || suggesting}>
            {suggesting ? 'Streaming Suggestions…' : 'Get Suggestions'}
          </Button>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => e.target.files && e.target.files[0] && onPickImage(e.target.files[0])}
            aria-label="Upload clinical image"
          />
        </Stack>
        {error && (
          <Typography color="error" sx={{ mt: 2 }}>{error}</Typography>
        )}
        <TextField
          label="Transcript"
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          fullWidth
          multiline
          minRows={6}
          sx={{ mt: 2 }}
        />
      </Paper>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
        <Paper variant="outlined" sx={{ p: 2, flex: 1 }}>
          <Typography variant="h6" gutterBottom>Draft Note</Typography>
          <Box component="pre" sx={{ whiteSpace: 'pre-wrap' }}>{note || '—'}</Box>
        </Paper>
        <Paper variant="outlined" sx={{ p: 2, flex: 1 }}>
          <Typography variant="h6" gutterBottom>AI Analysis</Typography>
          <Box component="pre" sx={{ whiteSpace: 'pre-wrap' }}>{analysis || '—'}</Box>
        </Paper>
        <Paper variant="outlined" sx={{ p: 2, flex: 1 }}>
          <Typography variant="h6" gutterBottom>Realtime Suggestions</Typography>
          <Stack component="ul" sx={{ m: 0, p: 0, listStyle: 'disc', pl: 3 }}>
            {suggestions.length === 0 ? (
              <Typography color="text.secondary">—</Typography>
            ) : (
              suggestions.map((s, i) => (
                <Typography component="li" key={i}>{s}</Typography>
              ))
            )}
          </Stack>
        </Paper>
      </Stack>

      <Paper variant="outlined" sx={{ p: 2, mt: 2 }}>
        <Typography variant="h6" gutterBottom>Refine Note/Analysis</Typography>
        <TextField
          label="Instruction (e.g., add ROS rash details; clarify exam)"
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
          fullWidth
          multiline
          minRows={2}
        />
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 2 }}>
          <Button variant="contained" onClick={applyRefinement} disabled={!instruction.trim()}>Apply Refinement</Button>
          <Divider flexItem orientation="vertical" />
          <Button variant="outlined" disabled={!imageDescription || analyzingImage} onClick={integrateImageDescription}>
            Integrate Image Description into Transcript
          </Button>
          {analyzingImage && <Typography variant="body2">Analyzing image…</Typography>}
          {imageDescription && !analyzingImage && (
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>Image: {imageDescription.slice(0, 120)}…</Typography>
          )}
        </Stack>
      </Paper>
    </>
  );
}
