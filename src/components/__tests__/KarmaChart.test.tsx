import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import KarmaChart from '../KarmaChart';
import { HistoryData } from '../../lib/types';

// Mock Chart.js
vi.mock('react-chartjs-2', () => ({
  Line: () => <div data-testid="mocked-chart">Mocked Chart</div>
}));

describe('KarmaChart Component', () => {
  const mockData: HistoryData[] = [
    {
      id: '1',
      username: 'testuser',
      karma: 100,
      post_count: 5,
      collected_at: '2023-01-01T12:00:00Z'
    },
    {
      id: '2',
      username: 'testuser',
      karma: 150,
      post_count: 7,
      collected_at: '2023-01-02T12:00:00Z'
    },
    {
      id: '3',
      username: 'testuser',
      karma: 200,
      post_count: 10,
      collected_at: '2023-01-03T12:00:00Z'
    }
  ];

  beforeEach(() => {
    cleanup();
  });

  it('displays empty state when no data is provided', () => {
    render(<KarmaChart data={[]} />);
    expect(screen.getByText('No chart data available')).toBeInTheDocument();
    expect(screen.getByText('Data will appear here once collected.')).toBeInTheDocument();
  });

  it('renders chart when data is available', async () => {
    render(<KarmaChart data={mockData} />);
    // Wait for the useEffect to process the data
    await vi.waitFor(() => {
      expect(screen.getByTestId('mocked-chart')).toBeInTheDocument();
    });
  });

  it('shows username in empty state when provided', () => {
    render(<KarmaChart data={[]} username="testuser" />);
    expect(screen.getByText('No karma history found for u/testuser.')).toBeInTheDocument();
  });

  it('applies custom className and height', () => {
    const { container } = render(
      <KarmaChart data={mockData} className="custom-class" height={500} />
    );
    
    // Check if the chart container has the custom height
    const chartContainer = container.querySelector('[style*="height: 500px"]');
    expect(chartContainer).toBeInTheDocument();
  });
});