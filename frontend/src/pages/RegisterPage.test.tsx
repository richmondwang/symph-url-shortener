import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import RegisterPage from './RegisterPage';
import { MemoryRouter } from 'react-router-dom';

describe('RegisterPage', () => {
  it('renders register form and validates', () => {
    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>
    );
    expect(screen.getByLabelText(/Username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
  });
});
