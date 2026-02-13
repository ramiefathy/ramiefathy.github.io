import { test, expect, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const APP_PATH = '/apps/dermatology-scribe/index.html';
const WS_URL = 'ws://127.0.0.1:8765';
const SESSION_TOKEN = 'development-token';
const GEMINI_CONFIGURED = Boolean(process.env.GEMINI_API_KEY);

const SAMPLE_TRANSCRIPT =
  "35-year-old with 6 months of itchy rash on flexural elbows and behind knees. Worse in winter, improves with moisturizers. No fever. History of atopic dermatitis as a child. Exam: erythematous, scaly patches with excoriations. No signs of infection.";

// Keep under 21 words to avoid triggering backend realtime-suggestion generation in Gemini-less runs.
const SEED_TRANSCRIPT = 'Itchy rash on flexural elbows and behind knees for 6 months; worse in winter.';

async function waitForNotification(page: Page, text: string) {
  await expect(page.locator('.notification', { hasText: text }).first()).toBeVisible();
}

async function configureBackendStorage(page: Page) {
  await page.addInitScript(
    ({ wsUrl, token }) => {
      // Scribe treats tokens as sensitive and only reads them from sessionStorage.
      // Keep tests aligned with production behavior (no long-lived secrets in localStorage).
      sessionStorage.setItem('dermascribe.websocketUrl', wsUrl);
      sessionStorage.setItem('dermascribe.sessionToken', token);
    },
    { wsUrl: WS_URL, token: SESSION_TOKEN }
  );
}

async function seedTranscriptOnServer(page: Page, transcript: string) {
  await page.evaluate((segment) => {
    const sendToServerFn = (window as unknown as { sendToServer?: (type: string, data: unknown) => boolean })
      .sendToServer;
    if (typeof sendToServerFn !== 'function') {
      throw new Error('sendToServer is not available on the page');
    }
    const ok = sendToServerFn('transcript_segment', { segment, is_final: true });
    if (!ok) {
      throw new Error('Unable to send transcript_segment (websocket not connected)');
    }
  }, transcript);
}

test.describe('RAMIE AI Scribe smoke', () => {
  test.describe.configure({ mode: 'serial' });

  test('connect → seed transcript → (optional plan error) → save → load → export (no Gemini required)', async ({
    page
  }) => {
    await configureBackendStorage(page);

    await page.goto(APP_PATH, { waitUntil: 'domcontentloaded' });

    // Connect.
    await waitForNotification(page, 'Connected to AI server');

    // Enter transcription mode.
    await page.getByText('Live Transcription & DDx').click();
    await expect(page.locator('#transcriptionView')).toBeVisible();

    // Paste transcript + diagnoses.
    await page.locator('#transcriptSummary').fill(SAMPLE_TRANSCRIPT);
    await page.locator('#diagnosesInput').fill('Atopic dermatitis');

    // Seed the backend session with a transcript without invoking Gemini (keeps this test stable
    // even if GEMINI_API_KEY is set in the environment).
    await seedTranscriptOnServer(page, SEED_TRANSCRIPT);

    // If Gemini isn't configured, also verify the UI handles plan generation gracefully.
    // If Gemini is configured, don't trigger external calls in this "no Gemini required" test.
    if (!GEMINI_CONFIGURED) {
      await page.locator('#generatePlanBtn').click();
      await waitForNotification(page, 'Gemini API key is not configured');
    }

    // Save.
    await page.getByTitle('Save session (Ctrl+S)').click();
    await waitForNotification(page, 'Session saved successfully');

    // Go to saved sessions and load it.
    await page.getByTitle('Back to Home').click();
    await page.getByText('View Saved Sessions').click();
    await expect(page.locator('#sessionsModal')).toBeVisible();

    await page.getByText('Transcription Session').first().click();
    await expect(page.locator('#transcriptionView')).toBeVisible();
    await expect(page.locator('#transcriptionOutput')).toContainText('itchy rash');

    // Export -> Plain Text (.txt) and verify the download contains the transcript.
    await page.keyboard.press('Control+E');
    await expect(page.locator('#exportModal')).toBeVisible();

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: /Plain Text/i }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('clinical-note.txt');

    const outPath = path.join(os.tmpdir(), `ramie-smoke-${Date.now()}-clinical-note.txt`);
    await download.saveAs(outPath);
    const exported = await fs.readFile(outPath, 'utf8');
    expect(exported).toContain('=== TRANSCRIPT ===');
    expect(exported).toContain('itchy rash');
  });

  test('chat mode → send message → (optional Gemini error) → save → load → export (no Gemini required)', async ({
    page
  }) => {
    await configureBackendStorage(page);

    await page.goto(APP_PATH, { waitUntil: 'domcontentloaded' });
    await waitForNotification(page, 'Connected to AI server');

    // Enter chat mode.
    await page.getByText('Chat with RAMIE').click();
    await expect(page.locator('#chatView')).toBeVisible();

    const chatMessage = 'Patient has an itchy rash; can you suggest questions to ask?';
    await page.locator('#chatInput').fill(chatMessage);
    await page.getByRole('button', { name: 'Send' }).click();

    // Server always sends a status before attempting Gemini; this confirms backend round-trip works.
    await waitForNotification(page, 'AI is processing your input');

    // If Gemini isn't configured, verify the app reports it gracefully (no hard dependency).
    if (!GEMINI_CONFIGURED) {
      await waitForNotification(page, 'Gemini API key is not configured');
    }

    // Save.
    await page.getByRole('button', { name: /Save Session/i }).click();
    await waitForNotification(page, 'Session saved successfully');

    // Load from saved sessions.
    await page.getByTitle('Back to Home').click();
    await page.getByText('View Saved Sessions').click();
    await expect(page.locator('#sessionsModal')).toBeVisible();

    await page.getByText('Chat Session').first().click();
    await expect(page.locator('#chatView')).toBeVisible();
    await expect(page.locator('#chatMessages')).toContainText('itchy rash');

    // Export -> Plain Text (.txt) and verify the download contains the chat transcript.
    await page.keyboard.press('Control+E');
    await expect(page.locator('#exportModal')).toBeVisible();

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: /Plain Text/i }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('clinical-note.txt');

    const outPath = path.join(os.tmpdir(), `ramie-smoke-${Date.now()}-chat.txt`);
    await download.saveAs(outPath);
    const exported = await fs.readFile(outPath, 'utf8');
    expect(exported).toContain('=== CHAT TRANSCRIPT ===');
    expect(exported).toContain('itchy rash');
  });

  test('connect → paste transcript → generate plan + note → save → load → export (requires GEMINI_API_KEY)', async ({
    page
  }) => {
    test.skip(!process.env.GEMINI_API_KEY, 'Set GEMINI_API_KEY to run the full generation smoke test.');

    await configureBackendStorage(page);

    await page.goto(APP_PATH, { waitUntil: 'domcontentloaded' });
    await waitForNotification(page, 'Connected to AI server');

    await page.getByText('Live Transcription & DDx').click();
    await expect(page.locator('#transcriptionView')).toBeVisible();

    await page.locator('#transcriptSummary').fill(SAMPLE_TRANSCRIPT);
    await page.locator('#diagnosesInput').fill('Atopic dermatitis');

    await page.locator('#generatePlanBtn').click();
    await expect(page.locator('#managementPlanResult')).toContainText('Management Plan', { timeout: 90_000 });

    await page.locator('#generateNoteBtn').click();
    await expect(page.locator('#soapNoteOutput')).toContainText('Clinical Note', { timeout: 90_000 });
    await expect(page.locator('#differentialOutput')).toContainText('Differential Diagnosis', { timeout: 90_000 });

    await page.getByTitle('Save session (Ctrl+S)').click();
    await waitForNotification(page, 'Session saved successfully');

    await page.getByTitle('Back to Home').click();
    await page.getByText('View Saved Sessions').click();
    await expect(page.locator('#sessionsModal')).toBeVisible();

    await page.getByText('Transcription Session').first().click();
    await expect(page.locator('#transcriptionView')).toBeVisible();
    await expect(page.locator('#transcriptionOutput')).toContainText('itchy rash');

    await page.keyboard.press('Control+E');
    await expect(page.locator('#exportModal')).toBeVisible();

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: /Plain Text/i }).click();
    const download = await downloadPromise;
    const outPath = path.join(os.tmpdir(), `ramie-smoke-${Date.now()}-clinical-note.txt`);
    await download.saveAs(outPath);
    const exported = await fs.readFile(outPath, 'utf8');
    expect(exported).toContain('=== TRANSCRIPT ===');
    expect(exported).toContain('itchy rash');
    expect(exported).toContain('=== SOAP NOTE ===');
  });
});
