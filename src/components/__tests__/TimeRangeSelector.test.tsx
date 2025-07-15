import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TimeRangeSelector from '../TimeRangeSelector';

describe('TimeRangeSelector Component', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  it('renders all time range options', () => {
    render(<TimeRangeSelector value="all" onChange={mockOnChange} />);
    
    expect(screen.getByText('1D')).toBeInTheDocument();
    expect(screen.getByText('7D')).toBeInTheDocument();
    expect(screen.getByText('30D')).toBeInTheDocument();
    expect(screen.getByText('90D')).toBeInTheDocument();
    expect(screen.getByText('All')).toBeInTheDocument();
  });

  it('highlights the selected value', () => {
    render(<TimeRangeSelector value="7d" onChange={mockOnChange} />);
    
    const selectedButton = screen.getByText('7D');
    expect(selectedButton).toHaveClass('bg-blue-600', 'text-white');
  });

  it('calls onChange when a different option is clicked', () => {
    render(<TimeRangeSelector value="all" onChange={mockOnChange} />);
    
    const button30d = screen.getByText('30D');
    fireEvent.click(button30d);
    
    expect(mockOnChange).toHaveBeenCalledWith('30d');
  });

  it('applies correct border radius classes', () => {
    render(<TimeRangeSelector value="all" onChange={mockOnChange} />);
    
    const firstButton = screen.getByText('1D');
    const lastButton = screen.getByText('All');
    
    expect(firstButton).toHaveClass('rounded-l-md');
    expect(lastButton).toHaveClass('rounded-r-md');
  });
});