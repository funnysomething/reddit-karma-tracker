import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider } from '../contexts/ThemeContext';
import ThemeToggle from '../components/ThemeToggle';
import { BentoCard } from '../components/BentoGrid';

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
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

const TestApp = () => (
  <ThemeProvider>
    <div className="bg-primary text-primary">
      <ThemeToggle showLabel />
      <BentoCard>
        <div>Test Content</div>
      </BentoCard>
    </div>
  </ThemeProvider>
);

describe('Theme Integration', () => {
  beforeEach(() => {
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    document.documentElement.className = '';
  });

  it('integrates theme system with components correctly', async () => {
    render(<TestApp />);

    // Check initial state
    expect(document.documentElement).toHaveClass('light');
    expect(screen.getByText(/Light Mode/)).toBeInTheDocument();

    // Toggle theme
    const toggleButton = screen.getByRole('button');
    fireEvent.click(toggleButton);

    // Wait for theme change
    await waitFor(() => {
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });
  });

  it('applies CSS custom properties correctly', () => {
    render(<TestApp />);

    // Check that CSS custom properties are available
    const styles = getComputedStyle(document.documentElement);
    
    // These should be defined in our CSS
    expect(styles.getPropertyValue('--background-primary')).toBeTruthy();
    expect(styles.getPropertyValue('--foreground-primary')).toBeTruthy();
    expect(styles.getPropertyValue('--accent-primary')).toBeTruthy();
  });

  it('persists theme preference across sessions', () => {
    localStorageMock.getItem.mockReturnValue('dark');

    render(<TestApp />);

    expect(localStorageMock.getItem).toHaveBeenCalledWith('theme-preference');
  });

  it('handles system preference detection', () => {
    // Mock system dark mode preference
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(query => ({
        matches: query === '(prefers-color-scheme: dark)',
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });

    render(<TestApp />);

    // Should detect system preference
    expect(window.matchMedia).toHaveBeenCalledWith('(prefers-color-scheme: dark)');
  });
});