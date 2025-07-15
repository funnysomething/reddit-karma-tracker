import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import UserChart from '../UserChart';
import { HistoryData } from '../../lib/types';

// Mock Recharts components to avoid canvas rendering issues in tests
vi.mock('recharts', () => ({
  LineChart: ({ children, ...props }: any) => (
    <div data-testid="line-chart" {...props}>
      {children}
    </div>
  ),
  Line: ({ dataKey, name, ...props }: any) => (
    <div data-testid={`line-${dataKey}`} data-name={name} {...props} />
  ),
  XAxis: (props: any) => <div data-testid="x-axis" {...props} />,
  YAxis: (props: any) => <div data-testid="y-axis" {...props} />,
  CartesianGrid: (props: any) => <div data-testid="cartesian-grid" {...props} />,
  Tooltip: (props: any) => <div data-testid="tooltip" {...props} />,
  Legend: (props: any) => <div data-testid="legend" {...props} />,
  ResponsiveContainer: ({ children, ...props }: any) => (
    <div data-testid="responsive-container" {...props}>
      {children}
    </div>
  ),
  Brush: (props: any) => <div data-testid="brush" {...props} />,
  ReferenceLine: (props: any) => <div data-testid="reference-line" {...props} />
}));

describe('UserChart Component', () => {
  const mockHistoryData: HistoryData[] = [
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
    },
    {
      id: '3',
      username: 'testuser',
      karma: 1500,
      post_count: 30,
      collected_at: '2024-01-03T12:00:00Z'
    }
  ];

  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render without crashing', () => {
      expect(() => 
        render(<UserChart username="testuser" data={mockHistoryData} metric="karma" />)
      ).not.toThrow();
    });

    it('should render chart title with username and metric', () => {
      render(<UserChart username="testuser" data={mockHistoryData} metric="karma" />);
      
      expect(screen.getByText('Karma History - u/testuser')).toBeInTheDocument();
    });

    it('should render chart title for posts metric', () => {
      render(<UserChart username="testuser" data={mockHistoryData} metric="posts" />);
      
      expect(screen.getByText('Posts History - u/testuser')).toBeInTheDocument();
    });

    it('should render time range selector buttons', () => {
      render(<UserChart username="testuser" data={mockHistoryData} metric="karma" />);
      
      expect(screen.getByText('7D')).toBeInTheDocument();
      expect(screen.getByText('30D')).toBeInTheDocument();
      expect(screen.getByText('90D')).toBeInTheDocument();
      expect(screen.getByText('All')).toBeInTheDocument();
    });

    it('should render statistics section', () => {
      render(<UserChart username="testuser" data={mockHistoryData} metric="karma" />);
      
      expect(screen.getByText('Current')).toBeInTheDocument();
      expect(screen.getByText('Change')).toBeInTheDocument();
      expect(screen.getByText('Min/Max')).toBeInTheDocument();
      expect(screen.getByText('Data Points')).toBeInTheDocument();
    });

    it('should render chart components', () => {
      render(<UserChart username="testuser" data={mockHistoryData} metric="karma" />);
      
      expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
      expect(screen.getByTestId('x-axis')).toBeInTheDocument();
      expect(screen.getByTestId('y-axis')).toBeInTheDocument();
      expect(screen.getByTestId('cartesian-grid')).toBeInTheDocument();
      expect(screen.getByTestId('tooltip')).toBeInTheDocument();
      expect(screen.getByTestId('legend')).toBeInTheDocument();
    });

    it('should render zoom control checkbox', () => {
      render(<UserChart username="testuser" data={mockHistoryData} metric="karma" />);
      
      expect(screen.getByLabelText('Enable zoom')).toBeInTheDocument();
    });
  });

  describe('Empty Data State', () => {
    it('should render empty state when no data provided', () => {
      render(<UserChart username="testuser" data={[]} metric="karma" />);
      
      expect(screen.getByText('No data available')).toBeInTheDocument();
      expect(screen.getByText('Data collection is in progress for this user.')).toBeInTheDocument();
    });

    it('should render empty state when data is null', () => {
      render(<UserChart username="testuser" data={null as any} metric="karma" />);
      
      expect(screen.getByText('No data available')).toBeInTheDocument();
    });

    it('should not render chart components in empty state', () => {
      render(<UserChart username="testuser" data={[]} metric="karma" />);
      
      expect(screen.queryByTestId('line-chart')).not.toBeInTheDocument();
      expect(screen.queryByTestId('responsive-container')).not.toBeInTheDocument();
    });

    it('should still render title in empty state', () => {
      render(<UserChart username="testuser" data={[]} metric="karma" />);
      
      expect(screen.getByText('Karma History - u/testuser')).toBeInTheDocument();
    });
  });

  describe('Metric Selection', () => {
    it('should render karma line when metric is karma', () => {
      render(<UserChart username="testuser" data={mockHistoryData} metric="karma" />);
      
      expect(screen.getByTestId('line-karma')).toBeInTheDocument();
    });

    it('should render posts line when metric is posts', () => {
      render(<UserChart username="testuser" data={mockHistoryData} metric="posts" />);
      
      expect(screen.getByTestId('line-posts')).toBeInTheDocument();
    });

    it('should render reference posts line when showing karma', () => {
      render(<UserChart username="testuser" data={mockHistoryData} metric="karma" />);
      
      // Should have both karma line and posts reference line
      expect(screen.getByTestId('line-karma')).toBeInTheDocument();
      expect(screen.getByTestId('line-posts')).toBeInTheDocument();
    });
  });

  describe('Time Range Selection', () => {
    it('should have 30D selected by default', () => {
      render(<UserChart username="testuser" data={mockHistoryData} metric="karma" />);
      
      const thirtyDayButton = screen.getByText('30D');
      expect(thirtyDayButton).toHaveClass('bg-white', 'text-blue-600');
    });

    it('should change selected time range when clicked', () => {
      render(<UserChart username="testuser" data={mockHistoryData} metric="karma" />);
      
      const sevenDayButton = screen.getByText('7D');
      fireEvent.click(sevenDayButton);
      
      expect(sevenDayButton).toHaveClass('bg-white', 'text-blue-600');
    });

    it('should update chart when time range changes', () => {
      render(<UserChart username="testuser" data={mockHistoryData} metric="karma" />);
      
      const allButton = screen.getByText('All');
      fireEvent.click(allButton);
      
      expect(allButton).toHaveClass('bg-white', 'text-blue-600');
      // Chart should re-render with all data
      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });
  });

  describe('Statistics Calculation', () => {
    it('should display current value correctly', () => {
      render(<UserChart username="testuser" data={mockHistoryData} metric="karma" />);
      
      // Should show the latest karma value (1500)
      expect(screen.getByText('1,500')).toBeInTheDocument();
    });

    it('should calculate and display change correctly', () => {
      render(<UserChart username="testuser" data={mockHistoryData} metric="karma" />);
      
      // Change from 1200 to 1500 = +300
      expect(screen.getByText('+300')).toBeInTheDocument();
    });

    it('should display min/max values correctly', () => {
      render(<UserChart username="testuser" data={mockHistoryData} metric="karma" />);
      
      // Min: 1000, Max: 1500
      expect(screen.getByText('1,000 / 1,500')).toBeInTheDocument();
    });

    it('should display correct data points count', () => {
      render(<UserChart username="testuser" data={mockHistoryData} metric="karma" />);
      
      expect(screen.getByText('3')).toBeInTheDocument();
    });
  });

  describe('Interactive Features', () => {
    it('should toggle brush/zoom when checkbox is clicked', () => {
      render(<UserChart username="testuser" data={mockHistoryData} metric="karma" />);
      
      const zoomCheckbox = screen.getByLabelText('Enable zoom') as HTMLInputElement;
      expect(zoomCheckbox.checked).toBe(false);
      
      fireEvent.click(zoomCheckbox);
      expect(zoomCheckbox.checked).toBe(true);
      
      // Should render brush component when enabled
      expect(screen.getByTestId('brush')).toBeInTheDocument();
    });

    it('should not render brush by default', () => {
      render(<UserChart username="testuser" data={mockHistoryData} metric="karma" />);
      
      expect(screen.queryByTestId('brush')).not.toBeInTheDocument();
    });
  });

  describe('Data Formatting', () => {
    it('should handle large numbers in statistics', () => {
      const largeData: HistoryData[] = [
        {
          id: '1',
          username: 'testuser',
          karma: 1000000,
          post_count: 50000,
          collected_at: '2024-01-01T12:00:00Z'
        }
      ];

      render(<UserChart username="testuser" data={largeData} metric="karma" />);
      
      // Should format large numbers with commas
      expect(screen.getByText('1,000,000')).toBeInTheDocument();
    });

    it('should handle negative changes', () => {
      const decreasingData: HistoryData[] = [
        {
          id: '1',
          username: 'testuser',
          karma: 1500,
          post_count: 30,
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

      render(<UserChart username="testuser" data={decreasingData} metric="karma" />);
      
      // Should show negative change
      expect(screen.getByText('-300')).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('should apply custom className', () => {
      const { container } = render(
        <UserChart 
          username="testuser" 
          data={mockHistoryData} 
          metric="karma" 
          className="custom-class"
        />
      );
      
      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('should render responsive container for chart', () => {
      render(<UserChart username="testuser" data={mockHistoryData} metric="karma" />);
      
      const container = screen.getByTestId('responsive-container');
      expect(container).toHaveAttribute('width', '100%');
      expect(container).toHaveAttribute('height', '100%');
    });
  });

  describe('Chart Footer', () => {
    it('should display last updated timestamp', () => {
      render(<UserChart username="testuser" data={mockHistoryData} metric="karma" />);
      
      expect(screen.getByText(/Last updated:/)).toBeInTheDocument();
      expect(screen.getByText(/Data collected from Reddit API/)).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle single data point', () => {
      const singleData: HistoryData[] = [
        {
          id: '1',
          username: 'testuser',
          karma: 1000,
          post_count: 20,
          collected_at: '2024-01-01T12:00:00Z'
        }
      ];

      render(<UserChart username="testuser" data={singleData} metric="karma" />);
      
      expect(screen.getByText('1,000')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument(); // Data points count
    });

    it('should handle data with same values', () => {
      const flatData: HistoryData[] = [
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
          karma: 1000,
          post_count: 20,
          collected_at: '2024-01-02T12:00:00Z'
        }
      ];

      render(<UserChart username="testuser" data={flatData} metric="karma" />);
      
      expect(screen.getByText('1,000')).toBeInTheDocument();
      expect(screen.getByText('+0')).toBeInTheDocument(); // No change
      expect(screen.getByText('1,000 / 1,000')).toBeInTheDocument(); // Same min/max
    });
  });
});