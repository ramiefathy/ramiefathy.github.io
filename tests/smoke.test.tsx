import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { HelmetProvider } from 'react-helmet-async';
import HomePage from '@/pages/HomePage';

describe('HomePage', () => {
  it('renders Featured Apps section', () => {
    render(
      <HelmetProvider>
        <HomePage />
      </HelmetProvider>
    );
    expect(screen.getByText(/Featured Apps/i)).toBeInTheDocument();
  });
});

