import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import ShortenerPage from './Shortener';
import { MemoryRouter } from 'react-router-dom';

describe('ShortenerPage', () => {
  it('renders form and validates input', () => {
    render(
      <MemoryRouter>
        <ShortenerPage />
      </MemoryRouter>
    );
    expect(screen.getByLabelText(/Destination URL/i)).toBeInTheDocument();
    fireEvent.blur(screen.getByLabelText(/Destination URL/i));
    expect(screen.getByText(/Please enter a valid URL/i)).toBeInTheDocument();
  });

  it('shows error for invalid slug', () => {
    render(
      <MemoryRouter>
        <ShortenerPage />
      </MemoryRouter>
    );
    const slugInput = screen.getByLabelText(/Custom Slug/i);
    fireEvent.change(slugInput, { target: { value: 'bad slug!' } });
    fireEvent.blur(slugInput);
    expect(screen.getByText(/Slug can only contain/i)).toBeInTheDocument();
  });

  it('shows success after shortening (mock)', async () => {
    render(
      <MemoryRouter>
        <ShortenerPage />
      </MemoryRouter>
    );
  });
});
