import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider } from '../../contexts/ThemeContext';
import ThemeToggle from '../ThemeToggle';

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock as Storage;

const ThemeToggleWithProvider = (props: React.ComponentProps<typeof ThemeToggle>) => (
  <ThemeProvider>
    <ThemeToggle {...props} />
  </ThemeProvider>
);

describe('ThemeToggle', () => {
  beforeEach(() => {
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
  });

  it('renders theme toggle button', () => {
    render(<ThemeToggleWithProvider />);
    
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  it('shows correct tooltip text', () => {
    render(<ThemeToggleWithProvider />);
    
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('title', expect.stringContaining('Switch to'));
  });

  it('toggles theme when clicked', () => {
    render(<ThemeToggleWithProvider />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    // Should call localStorage.setItem to persist theme
    expect(localStorageMock.setItem).toHaveBeenCalled();
  });

  it('shows label when showLabel is true', () => {
    render(<ThemeToggleWithProvider showLabel />);
    
    expect(screen.getByText(/Mode/)).toBeInTheDocument();
  });

  it('applies correct size classes', () => {
    const { rerender } = render(<ThemeToggleWithProvider size="sm" />);
    let button = screen.getByRole('button');
    expect(button).toHaveClass('w-8', 'h-8');

    rerender(<ThemeToggleWithProvider size="lg" />);
    button = screen.getByRole('button');
    expect(button).toHaveClass('w-12', 'h-12');
  });
});