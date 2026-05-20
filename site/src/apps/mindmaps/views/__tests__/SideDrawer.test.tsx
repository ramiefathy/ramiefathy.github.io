// @vitest-environment jsdom
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { SideDrawer } from '../SideDrawer';

afterEach(() => cleanup());

describe('SideDrawer', () => {
  it('renders nothing when content is null', () => {
    const { container } = render(<SideDrawer content={null} onClose={() => {}} />);
    expect(container.querySelector('.side-drawer')).toBeNull();
  });

  it('renders title and markdown body when open', () => {
    render(<SideDrawer content={{ title: 'Hair Pull Test', markdown: '<p>Pull ~50 hairs</p>' }} onClose={() => {}} />);
    expect(screen.getByText('Hair Pull Test')).toBeInTheDocument();
    expect(screen.getByText(/Pull ~50 hairs/)).toBeInTheDocument();
  });

  it('renders citations when present', () => {
    render(<SideDrawer content={{
      title: 'X',
      markdown: '<p>body</p>',
      citations: [{ pmid: '12345', quote: 'study X showed Y' }]
    }} onClose={() => {}} />);
    expect(screen.getByText(/study X showed Y/)).toBeInTheDocument();
    expect(screen.getByText('PMID 12345')).toBeInTheDocument();
  });

  it('calls onClose when the close button is clicked', () => {
    const onClose = vi.fn();
    render(<SideDrawer content={{ title: 'X', markdown: '' }} onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: /close/i }));
    expect(onClose).toHaveBeenCalled();
  });

  it('strips script tags and inline event handlers from markdown', () => {
    const hostile = '<p>safe</p><script>window.__pwn = true</script><img src=x onerror="window.__pwn=true">';
    const { container } = render(<SideDrawer content={{ title: 'X', markdown: hostile }} onClose={() => {}} />);
    const body = container.querySelector('.side-drawer__body');
    expect(body?.innerHTML).not.toMatch(/<script/i);
    expect(body?.innerHTML).not.toMatch(/onerror=/i);
    expect(body?.innerHTML).toMatch(/<p>safe<\/p>/);
  });

  it('strips javascript: URLs from anchor hrefs', () => {
    // eslint-disable-next-line no-script-url
    const hostile = '<a href="javascript:alert(1)">click</a>';
    const { container } = render(<SideDrawer content={{ title: 'X', markdown: hostile }} onClose={() => {}} />);
    const body = container.querySelector('.side-drawer__body');
    expect(body?.innerHTML).not.toMatch(/javascript:/i);
  });
});
