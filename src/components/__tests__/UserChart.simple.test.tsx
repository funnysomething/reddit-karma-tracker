import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import UserChart from '../UserChart';
import { HistoryData } from '../../lib/types';

// Mock Recharts to avoid rendering issues
vi.mock('recharts', () => ({
  LineChart: ({ children }: { children: React.ReactNode }) => <div data-testid="line-chart">{children}</div>,
  Line: ({ dataKey }: { dataKey: string }) => <div data-testid={`line-${dataKey}`} />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div data-testid="responsive-container">{children}</div>,
  Brush: () => <div data-testid="brush" />,
  ReferenceLine: () => <div data-testid="reference-line" />
}));

describe('UserChart Component - Simple Tests', () => {
  const mockData: HistoryData[] = [
    {
      id: '1',
      username: 'testuser',
      karma: 1000,
      post_count: 20,
      collected_at: '2024-01-01T12:00:00Z'
    },
    {
      id: '2',
      username: 'testuser',
      karma: 1200,
      post_count: 25,
      collected_at: '2024-01-02T12:00:00Z'
    }
  ];

  beforeEach(() => {
    cleanup();
  });

  it('should render without crashing', () => {
    expect(() => 
      render(<UserChart username="testuser" data={mockData} metric="karma" />)
    ).not.toThrow();
  });

  it('should render chart title', () => {
    render(<UserChart username="testuser" data={mockData} metric="karma" />);
    expect(screen.getAllByText(/Karma History - u\/testuser/)[0]).toBeInTheDocument();
  });

  it('should render empty state when no data', () => {
    render(<UserChart username="testuser" data={[]} metric="karma" />);
    expect(screen.getAllByText('No data available')[0]).toBeInTheDocument();
  });

  it('should render time range buttons', () => {
    render(<UserChart username="testuser" data={mockData} metric="karma" />);
    expect(screen.getAllByText('7D')[0]).toBeInTheDocument();
    expect(screen.getAllByText('30D')[0]).toBeInTheDocument();
    expect(screen.getAllByText('All')[0]).toBeInTheDocument();
  });

  it('should render chart components when data is available', () => {
    render(<UserChart username="testuser" data={mockData} metric="karma" />);
    expect(screen.getAllByTestId('responsive-container')[0]).toBeInTheDocument();
    expect(screen.getAllByTestId('line-chart')[0]).toBeInTheDocument();
  });
});