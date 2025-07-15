import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import UserManagement from '../UserManagement';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('UserManagement Component - Basic Tests', () => {
  beforeEach(() => {
    cleanup(); // Clean up after each test
    vi.clearAllMocks();
    mockFetch.mockClear();
  });

  it('should render without crashing', () => {
    // Arrange
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: [] })
    });

    // Act & Assert
    expect(() => render(<UserManagement />)).not.toThrow();
  });

  it('should render the main title', () => {
    // Arrange
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: [] })
    });

    // Act
    render(<UserManagement />);

    // Assert
    expect(screen.getAllByText('Manage Tracked Users')[0]).toBeInTheDocument();
  });

  it('should render the input field', () => {
    // Arrange
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: [] })
    });

    // Act
    render(<UserManagement />);

    // Assert
    expect(screen.getAllByPlaceholderText('Enter Reddit username (e.g., spez)')[0]).toBeInTheDocument();
  });

  it('should render the add button', () => {
    // Arrange
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: [] })
    });

    // Act
    render(<UserManagement />);

    // Assert
    expect(screen.getAllByRole('button', { name: 'Add User' })[0]).toBeInTheDocument();
  });

  it('should have proper form structure', () => {
    // Arrange
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: [] })
    });

    // Act
    render(<UserManagement />);

    // Assert
    const forms = screen.getAllByRole('form');
    expect(forms.length).toBeGreaterThan(0);
    
    const inputs = screen.getAllByRole('textbox');
    expect(inputs.length).toBeGreaterThan(0);
    
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });
});