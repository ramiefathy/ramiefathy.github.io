import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { HelmetProvider } from 'react-helmet-async';
import DermaScribePage from '@/pages/apps/DermaScribePage';

class MockEventSource {
  url: string;
  onmessage: ((this: EventSource, ev: MessageEvent) => any) | null = null;
  onerror: ((this: EventSource, ev: Event) => any) | null = null;
  listeners: Record<string, Function[]> = {};
  constructor(url: string) { this.url = url; }
  addEventListener(type: string, cb: any) {
    this.listeners[type] = this.listeners[type] || [];
    this.listeners[type].push(cb);
  }
  close() {}
  emit(type: string, data?: string) {
    if (type === 'message' && this.onmessage) this.onmessage(new MessageEvent('message', { data }));
    (this.listeners[type] || []).forEach((cb) => cb());
  }
}

describe('DermaScribePage', () => {
  const origES = (global as any).EventSource;
  let mockES: MockEventSource;

  beforeEach(() => {
    mockES = new MockEventSource('/.netlify/functions/suggestions');
    (global as any).EventSource = vi.fn(() => mockES);
    // Stub fetch used by refine/finalize; keep simple
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ note: 'N', analysis: 'A' }) } as any);
  });
  afterEach(() => {
    (global as any).EventSource = origES;
    vi.restoreAllMocks();
  });

  it('streams suggestions and applies refinement', async () => {
    render(
      <HelmetProvider>
        <DermaScribePage />
      </HelmetProvider>
    );

    // Enter transcript
    const transcript = screen.getByLabelText(/Transcript/i);
    fireEvent.change(transcript, { target: { value: 'Patient with itchy rash' } });

    // Click Get Suggestions
    fireEvent.click(screen.getByRole('button', { name: /Get Suggestions/i }));
    // Emit two lines
    mockES.emit('message', 'Ask duration and spread');
    mockES.emit('message', 'Inquire triggers and treatments tried');
    mockES.emit('end');

    await waitFor(() => {
      expect(screen.getByText(/Ask duration and spread/i)).toBeInTheDocument();
    });

    // Apply refinement
    const instruction = screen.getByLabelText(/Instruction/i);
    fireEvent.change(instruction, { target: { value: 'Summarize findings concisely' } });
    fireEvent.click(screen.getByRole('button', { name: /Apply Refinement/i }));

    await waitFor(() => expect(global.fetch).toHaveBeenCalledWith('/.netlify/functions/refine', expect.anything()));
  });
});

