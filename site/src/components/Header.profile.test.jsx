import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import Header from './Header.jsx';

// A different city and institution make literal regressions observable.
vi.mock('../data/profile.json', () => ({
  default: {
    name: 'Fixture Person, MD',
    affiliation: 'Fixture Institution',
    location: 'Honolulu, Hawaii',
    timeZone: 'Pacific/Honolulu'
  }
}));

describe('Header structured profile content', () => {
  it('renders profile affiliation, name, and city in the SSR status bar', () => {
    const html = renderToStaticMarkup(<Header />);
    expect(html).toContain('Fixture Institution');
    expect(html).toContain('Fixture Person, MD');
    expect(html).toContain('Honolulu');
    expect(html).not.toContain('Mass General Brigham');
    expect(html).not.toContain('Boston');
    expect(html).not.toContain('undefined');
    expect(html).not.toMatch(/\d{2}:\d{2}:\d{2}/);
  });
});
