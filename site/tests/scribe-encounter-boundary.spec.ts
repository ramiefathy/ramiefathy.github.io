import { expect, test } from '@playwright/test';
import { blockExternalRequests } from './helpers/network.js';

const route = '/apps/dermatology-scribe/index.html';

test.beforeEach(async ({ page }) => {
  await blockExternalRequests(page);
  await page.addInitScript(() => {
    sessionStorage.setItem('dermascribe.sessionToken', 'synthetic-test-token');
    sessionStorage.setItem('dermascribe.websocketUrl', 'ws://localhost:8765');
    (window as any).__sockets = [];
    (window as any).__sent = [];
    class SyntheticSocket {
      static OPEN = 1;
      static CONNECTING = 0;
      readyState = 1;
      onopen: any = null;
      onmessage: any = null;
      onclose: any = null;
      onerror: any = null;
      constructor(..._args: any[]) {
        (window as any).__sockets.push(this);
        queueMicrotask(() => this.onopen?.({}));
      }
      send(text: string) { (window as any).__sent.push(JSON.parse(text)); }
      close() { this.readyState = 3; }
      emit(message: object) { this.onmessage?.({ data: JSON.stringify(message) }); }
    }
    (window as any).WebSocket = SyntheticSocket;
  });
  await page.clock.install();
  await page.goto(route, { waitUntil: 'networkidle' });
  await page.click('#startTranscriptionModeCard');
  await expect.poll(() => page.evaluate(() => (window as any).__sockets.length)).toBeGreaterThan(0);
  await page.evaluate(() => {
    const w = window as any;
    const resetId = w.__sent.filter((message: any) => message.type === 'start_new_session').at(-1).data.resetId;
    w.__sockets.at(-1).emit({ type: 'status', event: 'session_reset', resetId });
  });
});

test('queued clinical responses cannot repopulate a new encounter before its reset acknowledgment', async ({ page }) => {
  await page.evaluate(() => {
    const w = window as any;
    w.__sockets.at(-1).emit({ type: 'note_updated', draftNote: 'PREVIOUS_ENCOUNTER' });
  });
  await expect(page.locator('#soapNoteOutput')).toContainText('PREVIOUS_ENCOUNTER');
  await page.evaluate(() => {
    const w = window as any;
    w.beginNewTranscriptionSession();
    const socket = w.__sockets.at(-1);
    for (const message of [
      { type: 'note_updated', draftNote: 'STALE_NOTE' },
      { type: 'initial_generation_complete', draftNote: 'STALE_INITIAL', aiAnalysis: 'STALE_ANALYSIS' },
      { type: 'stream_chunk', streamType: 'note', text: 'STALE_CHUNK' },
      { type: 'stream_complete', streamType: 'note', noteText: 'STALE_COMPLETION' },
      { type: 'realtime_suggestions', suggestions: ['STALE_SUGGESTION'] }
    ]) socket.emit(message);
  });
  await expect(page.locator('body')).not.toContainText('STALE_');
  await expect(page.locator('#soapNoteOutput')).not.toContainText('PREVIOUS_ENCOUNTER');
  await page.evaluate(() => {
    const w = window as any;
    const resetId = w.__sent.filter((message: any) => message.type === 'start_new_session').at(-1).data.resetId;
    const socket = w.__sockets.at(-1);
    socket.emit({ type: 'status', event: 'session_reset', resetId, message: 'New session started.' });
    socket.emit({ type: 'note_updated', draftNote: 'CURRENT_ENCOUNTER' });
  });
  await expect(page.locator('#soapNoteOutput')).toContainText('CURRENT_ENCOUNTER');
});

test('an earlier reset or same-socket connection acknowledgment cannot release the latest reset', async ({ page }) => {
  await page.evaluate(() => {
    const w = window as any;
    w.beginNewTranscriptionSession();
    w.beginNewTranscriptionSession();
    const resets = w.__sent.filter((message: any) => message.type === 'start_new_session');
    const socket = w.__sockets.at(-1);
    socket.emit({ type: 'status', event: 'session_reset', resetId: resets.at(-2).data.resetId });
    socket.emit({ type: 'connection_ack', sessionId: 'synthetic-same-connection' });
    socket.emit({ type: 'note_updated', draftNote: 'STALE_AFTER_OLD_ACK' });
  });
  await expect(page.locator('#soapNoteOutput')).not.toContainText('STALE_AFTER_OLD_ACK');
  await page.evaluate(() => {
    const w = window as any;
    const resetId = w.__sent.filter((message: any) => message.type === 'start_new_session').at(-1).data.resetId;
    w.__sockets.at(-1).emit({ type: 'status', event: 'session_reset', resetId });
    w.__sockets.at(-1).emit({ type: 'note_updated', draftNote: 'AFTER_LATEST_ACK' });
  });
  await expect(page.locator('#soapNoteOutput')).toContainText('AFTER_LATEST_ACK');
});

test('clearing a transcript discards old streaming buffers and queued completion', async ({ page }) => {
  await page.evaluate(() => {
    const w = window as any;
    const socket = w.__sockets.at(-1);
    socket.emit({ type: 'stream_chunk', streamType: 'note', text: 'OLD_PROVISIONAL' });
    w.clearTranscript();
    socket.emit({ type: 'stream_complete', streamType: 'note', noteText: 'STALE_COMPLETION' });
    const resetId = w.__sent.filter((message: any) => message.type === 'start_new_session').at(-1).data.resetId;
    socket.emit({ type: 'status', event: 'session_reset', resetId });
    socket.emit({ type: 'stream_chunk', streamType: 'note', text: 'NEW_PROVISIONAL' });
  });
  await expect(page.locator('#soapNoteOutput')).toContainText('NEW_PROVISIONAL');
  await expect(page.locator('#soapNoteOutput')).not.toContainText('OLD_PROVISIONAL');
  await expect(page.locator('#soapNoteOutput')).not.toContainText('STALE_COMPLETION');
});

test('superseded sockets cannot supply clinical output or change current connection state', async ({ page }) => {
  await page.evaluate(() => {
    const w = window as any;
    w.beginNewTranscriptionSession();
    const oldSocket = w.__sockets.at(-1);
    oldSocket.readyState = 3;
    w.connectWebSocket();
    w.__sockets.at(-1).emit({ type: 'connection_ack', sessionId: 'synthetic-fresh-connection' });
    oldSocket.emit({ type: 'note_updated', draftNote: 'STALE_OLD_SOCKET' });
    oldSocket.onclose({ code: 1000 });
    oldSocket.onerror(new Error('synthetic old socket'));
    w.__sockets.at(-1).emit({ type: 'note_updated', draftNote: 'FRESH_SOCKET_NOTE' });
  });
  await expect(page.locator('#soapNoteOutput')).toContainText('FRESH_SOCKET_NOTE');
  await expect(page.locator('body')).not.toContainText('STALE_OLD_SOCKET');
  await expect(page.locator('#sessionMode')).not.toContainText('Disconnected');
});

test('a server error during the reset fence is surfaced and releases the fence instead of hanging the encounter', async ({ page }) => {
  await page.evaluate(() => {
    const w = window as any;
    w.beginNewTranscriptionSession();
    const socket = w.__sockets.at(-1);
    socket.emit({ type: 'stream_chunk', streamType: 'note', text: 'PROVISIONAL_DURING_FENCE' });
    socket.emit({ type: 'error', message: 'Rate limit exceeded. Please slow down and retry.', retryAfter: 5 });
  });
  const failure = page.locator('.notification-error', { hasText: /new session request failed/i });
  await expect(failure).toBeVisible();
  await expect(failure).toContainText(/start a new session again/i);
  await expect(page.locator('.notification-error', { hasText: /rate limit exceeded/i })).toBeVisible();
  await expect(page.locator('body')).not.toContainText('PROVISIONAL_DURING_FENCE');
  await page.evaluate(() => {
    (window as any).__sockets.at(-1).emit({ type: 'note_updated', draftNote: 'AFTER_FAILED_RESET' });
  });
  await expect(page.locator('#soapNoteOutput')).toContainText('AFTER_FAILED_RESET');
});

test('an unacknowledged reset times out, discards provisional output, and notifies the user', async ({ page }) => {
  await page.evaluate(() => {
    const w = window as any;
    w.beginNewTranscriptionSession();
    const socket = w.__sockets.at(-1);
    socket.emit({ type: 'note_updated', draftNote: 'FENCED_BEFORE_TIMEOUT' });
  });
  await expect(page.locator('body')).not.toContainText('FENCED_BEFORE_TIMEOUT');
  await page.clock.runFor(9_000);
  await page.evaluate(() => (window as any).__sockets.at(-1).emit({ type: 'note_updated', draftNote: 'STILL_FENCED' }));
  await expect(page.locator('body')).not.toContainText('STILL_FENCED');
  await page.clock.runFor(1_500);
  await expect(page.locator('.notification-error', { hasText: /did not confirm the new session/i })).toBeVisible();
  await page.evaluate(() => (window as any).__sockets.at(-1).emit({ type: 'note_updated', draftNote: 'AFTER_TIMEOUT' }));
  await expect(page.locator('#soapNoteOutput')).toContainText('AFTER_TIMEOUT');
});

test('an acknowledged reset cancels the timeout so no spurious failure notice appears later', async ({ page }) => {
  await page.evaluate(() => {
    const w = window as any;
    w.beginNewTranscriptionSession();
    const resetId = w.__sent.filter((message: any) => message.type === 'start_new_session').at(-1).data.resetId;
    w.__sockets.at(-1).emit({ type: 'status', event: 'session_reset', resetId });
  });
  await page.clock.runFor(12_000);
  await expect(page.locator('.notification-error')).toHaveCount(0);
});

test('a reset request that could not be sent does not arm the fence', async ({ page }) => {
  await page.evaluate(() => {
    const w = window as any;
    w.__sockets.at(-1).readyState = 3; // no open transport
    w.beginNewTranscriptionSession();
  });
  const sentResets = await page.evaluate(() => (window as any).__sent.filter((m: any) => m.type === 'start_new_session').length);
  expect(sentResets).toBe(1);
  await page.evaluate(() => {
    const w = window as any;
    w.__sockets.at(-1).emit({ type: 'connection_ack', sessionId: 'synthetic-reconnect' });
    w.__sockets.at(-1).emit({ type: 'note_updated', draftNote: 'AFTER_RECONNECT' });
  });
  await expect(page.locator('#soapNoteOutput')).toContainText('AFTER_RECONNECT');
  await page.clock.runFor(12_000);
  await expect(page.locator('.notification-error')).toHaveCount(0);
});

test('connectWebSocket closes a superseded CONNECTING socket instead of orphaning it', async ({ page }) => {
  const states = await page.evaluate(() => {
    const w = window as any;
    w.__sockets.at(-1).readyState = 3;
    w.connectWebSocket();
    const connecting = w.__sockets.at(-1);
    connecting.readyState = 0; // still CONNECTING
    w.connectWebSocket();
    return { connectingState: connecting.readyState, count: w.__sockets.length };
  });
  expect(states.connectingState).toBe(3);
  await page.evaluate(() => {
    const w = window as any;
    w.__sockets.at(-1).emit({ type: 'connection_ack', sessionId: 'synthetic-after-replace' });
    w.__sockets.at(-1).emit({ type: 'note_updated', draftNote: 'REPLACEMENT_SOCKET' });
  });
  await expect(page.locator('#soapNoteOutput')).toContainText('REPLACEMENT_SOCKET');
});
