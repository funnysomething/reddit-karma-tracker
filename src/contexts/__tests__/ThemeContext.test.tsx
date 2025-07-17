import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { ThemeProvider, useTheme } from '../ThemeContext';

// Mock matchMedia
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

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock as Storage;

// Test component that uses the theme context
const TestComponent = () => {
  const { theme, themePreference, toggleTheme, setThemePreference, systemPreference } = useTheme();
  
  return (
    <div>
      <div data-testid="theme">{theme}</div>
      <div data-testid="theme-preference">{themePreference}</div>
      <div data-testid="system-preference">{systemPreference}</div>
      <button data-testid="toggle-theme" onClick={toggleTheme}>
        Toggle Theme
      </button>
      <button data-testid="set-light" onClick={() => setThemePreference('light')}>
        Set Light
      </button>
      <button data-testid="set-dark" onClick={() => setThemePreference('dark')}>
        Set Dark
      </button>
      <button data-testid="set-system" onClick={() => setThemePreference('system')}>
        Set System
      </button>
    </div>
  );
};

describe('ThemeContext', () => {
  beforeEach(() => {
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    // Reset document classes
    document.documentElement.className = '';
  });

  it('provides default theme values', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    expect(screen.getByTestId('theme')).toHaveTextContent('light');
    expect(screen.getByTestId('theme-preference')).toHaveTextContent('system');
    expect(screen.getByTestId('system-preference')).toHaveTextContent('light');
  });

  it('loads theme preference from localStorage', () => {
    localStorageMock.getItem.mockReturnValue('dark');

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    expect(localStorageMock.getItem).toHaveBeenCalledWith('theme-preference');
  });

  it('toggles theme correctly', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    const toggleButton = screen.getByTestId('toggle-theme');
    
    act(() => {
      fireEvent.click(toggleButton);
    });

    expect(localStorageMock.setItem).toHaveBeenCalled();
  });

  it('sets theme preference correctly', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    const setLightButton = screen.getByTestId('set-light');
    
    act(() => {
      fireEvent.click(setLightButton);
    });

    expect(screen.getByTestId('theme-preference')).toHaveTextContent('light');
    expect(localStorageMock.setItem).toHaveBeenCalledWith('theme-preference', 'light');
  });

  it('applies theme class to document', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    // Should apply light theme class by default
    expect(document.documentElement).toHaveClass('light');
    expect(document.documentElement).toHaveAttribute('data-theme', 'light');
  });

  it('handles localStorage errors gracefully', () => {
    localStorageMock.getItem.mockImplementation(() => {
      throw new Error('localStorage error');
    });

    // Should not throw error
    expect(() => {
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );
    }).not.toThrow();
  });

  it('throws error when useTheme is used outside provider', () => {
    // Suppress console.error for this test
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      render(<TestComponent />);
    }).toThrow('useTheme must be used within a ThemeProvider');

    consoleSpy.mockRestore();
  });
});