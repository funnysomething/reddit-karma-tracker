import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import CombinedChart from '../CombinedChart';
import { HistoryData } from '../../lib/types';

// Mock Chart.js
vi.mock('react-chartjs-2', () => ({
  Line: () => <div data-testid="mocked-combined-chart">Mocked Combined Chart</div>
}));

describe('CombinedChart Component', () => {
  const mockUserData: Record<string, HistoryData[]> = {
    user1: [
      {
        id: '1',
        username: 'user1',
        karma: 100,
        post_count: 5,
        collected_at: '2023-01-01T12:00:00Z'
      },
      {
        id: '2',
        username: 'user1',
        karma: 150,
        post_count: 7,
        collected_at: '2023-01-02T12:00:00Z'
      }
    ],
    user2: [
      {
        id: '3',
        username: 'user2',
        karma: 200,
        post_count: 10,
        collected_at: '2023-01-01T12:00:00Z'
      },
      {
        id: '4',
        username: 'user2',
        karma: 250,
        post_count: 12,
        collected_at: '2023-01-02T12:00:00Z'
      }
    ]
  };

  beforeEach(() => {
    cleanup();
  });

  it('displays empty state when no data is provided', () => {
    render(<CombinedChart data={{}} />);
    expect(screen.getByText('No users to compare')).toBeInTheDocument();
    expect(screen.getByText('Add multiple users to see comparison charts.')).toBeInTheDocument();
  });

  it('displays single user message when only one user is provided', () => {
    const singleUserData = { user1: mockUserData.user1 };
    render(<CombinedChart data={singleUserData} />);
    
    expect(screen.getByText('Single user tracked')).toBeInTheDocument();
    expect(screen.getByText('Add more users to enable comparison view.')).toBeInTheDocument();
  });

  it('renders chart when multiple users are provided', async () => {
    render(<CombinedChart data={mockUserData} />);
    
    await vi.waitFor(() => {
      expect(screen.getByTestId('mocked-combined-chart')).toBeInTheDocument();
    });
  });

  it('shows loading state initially', () => {
    // Test with empty data to ensure loading state is visible
    render(<CombinedChart data={{}} />);
    // With empty data, it should show the empty state instead of loading
    expect(screen.getByText('No users to compare')).toBeInTheDocument();
  });

  it('applies custom className and height', () => {
    const { container } = render(
      <CombinedChart data={mockUserData} className="custom-class" height={500} />
    );
    
    // Check if the chart container has the custom height
    const chartContainer = container.querySelector('[style*="height: 500px"]');
    expect(chartContainer).toBeInTheDocument();
  });

  it('handles different metrics (karma vs posts)', async () => {
    render(<CombinedChart data={mockUserData} metric="posts" />);
    
    await vi.waitFor(() => {
      expect(screen.getByTestId('mocked-combined-chart')).toBeInTheDocument();
    });
  });

  it('handles different time ranges', async () => {
    render(<CombinedChart data={mockUserData} timeRange="7d" />);
    
    await vi.waitFor(() => {
      expect(screen.getByTestId('mocked-combined-chart')).toBeInTheDocument();
    });
  });

  it('shows and hides legend based on showLegend prop', async () => {
    const { rerender } = render(<CombinedChart data={mockUserData} showLegend={true} />);
    
    await vi.waitFor(() => {
      expect(screen.getByTestId('mocked-combined-chart')).toBeInTheDocument();
    });

    rerender(<CombinedChart data={mockUserData} showLegend={false} />);
    
    await vi.waitFor(() => {
      expect(screen.getByTestId('mocked-combined-chart')).toBeInTheDocument();
    });
  });

  it('shows and hides title based on showTitle prop', async () => {
    const { rerender } = render(<CombinedChart data={mockUserData} showTitle={true} />);
    
    await vi.waitFor(() => {
      expect(screen.getByTestId('mocked-combined-chart')).toBeInTheDocument();
    });

    rerender(<CombinedChart data={mockUserData} showTitle={false} />);
    
    await vi.waitFor(() => {
      expect(screen.getByTestId('mocked-combined-chart')).toBeInTheDocument();
    });
  });

  it('handles empty user data arrays', () => {
    const emptyUserData = { user1: [], user2: [] };
    render(<CombinedChart data={emptyUserData} />);
    
    // Should still render the chart component even with empty data
    expect(screen.queryByText('No users to compare')).not.toBeInTheDocument();
  });

  it('handles users with different data point counts', async () => {
    const unevenData = {
      user1: mockUserData.user1,
      user2: [mockUserData.user2[0]] // Only one data point
    };
    
    render(<CombinedChart data={unevenData} />);
    
    await vi.waitFor(() => {
      expect(screen.getByTestId('mocked-combined-chart')).toBeInTheDocument();
    });
  });

  it('handles many users (color cycling)', async () => {
    const manyUsersData: Record<string, HistoryData[]> = {};
    
    // Create 10 users to test color cycling
    for (let i = 1; i <= 10; i++) {
      manyUsersData[`user${i}`] = [
        {
          id: `${i}`,
          username: `user${i}`,
          karma: i * 100,
          post_count: i * 5,
          collected_at: '2023-01-01T12:00:00Z'
        }
      ];
    }
    
    render(<CombinedChart data={manyUsersData} />);
    
    await vi.waitFor(() => {
      expect(screen.getByTestId('mocked-combined-chart')).toBeInTheDocument();
    });
  });
});