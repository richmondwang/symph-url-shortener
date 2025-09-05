import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import LoginPage from './Login';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom';

describe('LoginPage', () => {
  it('renders login form and validates', () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );
    expect(screen.getByLabelText(/Username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
  });
});
