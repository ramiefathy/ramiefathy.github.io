import { describe, expect, it } from 'vitest';
import { markdownToHtml } from '../MindMapApp';

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
