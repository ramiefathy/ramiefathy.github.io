import { describe, expect, it, vi, beforeAll } from 'vitest';

vi.mock('isomorphic-dompurify', () => ({
  default: {
    sanitize: (html: string) => html.replace(/<script.*?>.*?<\/script>/gis, '')
  }
}));

vi.mock('jspdf', () => ({
  jsPDF: class {
    addPage() {}
    addImage() {}
    text() {}
    save() {}
  }
}));

let markdownToHtml: typeof import('../MindMapApp').markdownToHtml;

beforeAll(async () => {
  ({ markdownToHtml } = await import('../MindMapApp'));
});

describe('markdownToHtml', () => {
  it('renders markdown bullet lists', () => {
    const html = markdownToHtml({ title: 'Example', markdown: '- item one\n- item two' });
    expect(html).toContain('<ul>');
    expect(html).toContain('<li>item one</li>');
    expect(html).toContain('<li>item two</li>');
  });

  it('sanitizes unsafe HTML', () => {
    const html = markdownToHtml({ title: 'Unsafe', markdown: 'Hello<script>alert(1)</script>' });
    expect(html).toContain('Hello');
    expect(html).not.toContain('<script>');
  });
});
