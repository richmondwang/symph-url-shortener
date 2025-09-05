import React from 'react';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import SlugsPage from './SlugsPage';
import { MemoryRouter } from 'react-router-dom';

describe('SlugsPage', () => {
  it('renders list and handles expired slugs', () => {
    render(
      <MemoryRouter>
        <SlugsPage />
      </MemoryRouter>
    );
    expect(screen.getByText(/Expired/i)).toBeInTheDocument();
  });
});
