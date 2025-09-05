import React from 'react';
import { render, screen } from '@testing-library/react';
import BasePage from './BasePage';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom';

describe('BasePage', () => {
  it('renders header and logout button', () => {
    render(
      <MemoryRouter>
        <BasePage />
      </MemoryRouter>
    );
    expect(screen.getByText(/URL Shortener/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument();
  });
});
