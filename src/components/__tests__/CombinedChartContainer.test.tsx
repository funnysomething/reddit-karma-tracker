import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CombinedChartContainer from '../CombinedChartContainer';
import { HistoryData } from '../../lib/types';

// Mock the CombinedChart component
vi.mock('../CombinedChart', () => ({
  default: ({ data, metric, timeRange }: { data: Record<string, HistoryData[]>; metric: string; timeRange: string }) => (
    <div data-testid="mocked-combined-chart">
      Mocked Combined Chart - Metric: {metric}, TimeRange: {timeRange}, Users: {Object.keys(data).length}
    </div>
  )
}));

// Mock TimeRangeSelector
vi.mock('../TimeRangeSelector', () => ({
  default: ({ value, onChange }: { value: string; onChange: (value: string) => void }) => (
    <div data-testid="time-range-selector">
      <button onClick={() => onChange('7d')}>7D</button>
      <button onClick={() => onChange('30d')}>30D</button>
      <span>Current: {value}</span>
    </div>
  )
}));

describe('CombinedChartContainer Component', () => {
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
      }
    ]
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the component with title and controls', () => {
    render(<CombinedChartContainer data={mockUserData} />);
    
    expect(screen.getByText('Multi-User Comparison')).toBeInTheDocument();
    expect(screen.getByText('Comparing 2 users')).toBeInTheDocument();
    expect(screen.getByText('Karma')).toBeInTheDocument();
    expect(screen.getByText('Posts')).toBeInTheDocument();
    expect(screen.getByTestId('time-range-selector')).toBeInTheDocument();
  });

  it('displays correct user count and data points', () => {
    render(<CombinedChartContainer data={mockUserData} />);
    
    expect(screen.getByText('2 users tracked')).toBeInTheDocument();
    expect(screen.getByText('3 total data points')).toBeInTheDocument();
  });

  it('handles singular user count correctly', () => {
    const singleUserData = { user1: mockUserData.user1 };
    render(<CombinedChartContainer data={singleUserData} />);
    
    expect(screen.getByText('Comparing 1 user')).toBeInTheDocument();
    expect(screen.getByText('1 user tracked')).toBeInTheDocument();
  });

  it('switches between karma and posts metrics', async () => {
    const user = userEvent.setup();
    render(<CombinedChartContainer data={mockUserData} />);
    
    // Initially should show karma
    expect(screen.getByText(/Metric: karma/)).toBeInTheDocument();
    
    // Click posts button
    const postsButton = screen.getByRole('button', { name: 'Posts' });
    await user.click(postsButton);
    
    expect(screen.getByText(/Metric: posts/)).toBeInTheDocument();
    
    // Click karma button
    const karmaButton = screen.getByRole('button', { name: 'Karma' });
    await user.click(karmaButton);
    
    expect(screen.getByText(/Metric: karma/)).toBeInTheDocument();
  });

  it('updates time range when selector changes', async () => {
    render(<CombinedChartContainer data={mockUserData} />);
    
    // Initially should show 'all'
    expect(screen.getByText(/TimeRange: all/)).toBeInTheDocument();
    
    // Click 7D button in mocked selector
    const sevenDayButton = screen.getByText('7D');
    fireEvent.click(sevenDayButton);
    
    expect(screen.getByText(/TimeRange: 7d/)).toBeInTheDocument();
  });

  it('displays user legend when multiple users are present', () => {
    render(<CombinedChartContainer data={mockUserData} />);
    
    expect(screen.getByText('Tracked Users:')).toBeInTheDocument();
    expect(screen.getByText('u/user1')).toBeInTheDocument();
    expect(screen.getByText('u/user2')).toBeInTheDocument();
  });

  it('does not display user legend for single user', () => {
    const singleUserData = { user1: mockUserData.user1 };
    render(<CombinedChartContainer data={singleUserData} />);
    
    expect(screen.queryByText('Tracked Users:')).not.toBeInTheDocument();
  });

  it('displays last updated time correctly', () => {
    render(<CombinedChartContainer data={mockUserData} />);
    
    expect(screen.getByText(/Last updated:/)).toBeInTheDocument();
  });

  it('handles empty data gracefully', () => {
    render(<CombinedChartContainer data={{}} />);
    
    expect(screen.getByText('Comparing 0 users')).toBeInTheDocument();
    expect(screen.getByText('0 users tracked')).toBeInTheDocument();
    expect(screen.getByText('0 total data points')).toBeInTheDocument();
  });

  it('applies custom className and height', () => {
    const { container } = render(<CombinedChartContainer data={mockUserData} className="custom-class" height={500} />);
    
    // Check if the root container has the custom class
    const rootContainer = container.firstChild as HTMLElement;
    expect(rootContainer).toHaveClass('custom-class');
  });

  it('shows correct button states for metric selection', () => {
    render(<CombinedChartContainer data={mockUserData} />);
    
    const karmaButton = screen.getByRole('button', { name: 'Karma' });
    const postsButton = screen.getByRole('button', { name: 'Posts' });
    
    // Karma should be selected by default
    expect(karmaButton).toHaveClass('bg-blue-600', 'text-white');
    expect(postsButton).toHaveClass('bg-white', 'text-gray-700');
  });

  it('passes correct props to CombinedChart', () => {
    render(<CombinedChartContainer data={mockUserData} height={600} />);
    
    expect(screen.getByText(/Users: 2/)).toBeInTheDocument();
    expect(screen.getByText(/Metric: karma/)).toBeInTheDocument();
    expect(screen.getByText(/TimeRange: all/)).toBeInTheDocument();
  });
});