'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
  ChartOptions
} from 'chart.js';
import 'chartjs-adapter-date-fns';
import { useTheme } from '../contexts/ThemeContext';
import { HistoryData } from '../lib/types';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
);

interface CombinedChartProps {
  data: Record<string, HistoryData[]>;
  className?: string;
  height?: number;
  showLegend?: boolean;
  showTitle?: boolean;
  timeRange?: '1d' | '7d' | '30d' | '90d' | 'all';
  metric?: 'karma' | 'posts';
}

// Color palette for different users
const USER_COLORS = [
  { border: 'rgb(255, 99, 132)', background: 'rgba(255, 99, 132, 0.1)' },
  { border: 'rgb(53, 162, 235)', background: 'rgba(53, 162, 235, 0.1)' },
  { border: 'rgb(75, 192, 192)', background: 'rgba(75, 192, 192, 0.1)' },
  { border: 'rgb(255, 205, 86)', background: 'rgba(255, 205, 86, 0.1)' },
  { border: 'rgb(153, 102, 255)', background: 'rgba(153, 102, 255, 0.1)' },
  { border: 'rgb(255, 159, 64)', background: 'rgba(255, 159, 64, 0.1)' },
  { border: 'rgb(199, 199, 199)', background: 'rgba(199, 199, 199, 0.1)' },
  { border: 'rgb(83, 102, 255)', background: 'rgba(83, 102, 255, 0.1)' },
];

export default function CombinedChart({
  data,
  className = '',
  height = 400,
  showLegend = true,
  showTitle = true,
  timeRange = 'all',
  metric = 'karma'
}: CombinedChartProps) {
  const { theme } = useTheme();
  const [chartData, setChartData] = useState<{
    labels: Date[];
    datasets: Array<{
      label: string;
      data: (number | null)[];
      borderColor: string;
      backgroundColor: string;
      tension: number;
      pointRadius: number;
      pointHoverRadius: number;
      fill: boolean;
      spanGaps?: boolean;
    }>;
  } | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const filterDataByTimeRange = useCallback((data: HistoryData[], range: string): HistoryData[] => {
    if (range === 'all') return data;
    
    const now = new Date();
    let daysToSubtract = 0;
    
    switch (range) {
      case '1d': daysToSubtract = 1; break;
      case '7d': daysToSubtract = 7; break;
      case '30d': daysToSubtract = 30; break;
      case '90d': daysToSubtract = 90; break;
      default: return data;
    }
    
    const cutoffDate = new Date(now.setDate(now.getDate() - daysToSubtract));
    return data.filter(item => new Date(item.collected_at) >= cutoffDate);
  }, []);

  const processChartData = useCallback((
    userData: Record<string, HistoryData[]>, 
    range: string, 
    selectedMetric: string
  ) => {
    // Get all unique timestamps across all users
    const allTimestamps = new Set<string>();
    const userDataFiltered: Record<string, HistoryData[]> = {};

    // Filter data by time range for each user
    Object.entries(userData).forEach(([username, userHistory]) => {
      const filtered = filterDataByTimeRange(userHistory, range);
      userDataFiltered[username] = filtered.sort(
        (a, b) => new Date(a.collected_at).getTime() - new Date(b.collected_at).getTime()
      );
      
      // Collect all timestamps
      filtered.forEach(item => allTimestamps.add(item.collected_at));
    });

    // Convert to sorted array of dates
    const sortedTimestamps = Array.from(allTimestamps)
      .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
      .map(timestamp => new Date(timestamp));

    // Create datasets for each user
    const datasets = Object.entries(userDataFiltered).map(([username, userHistory], index) => {
      const colorIndex = index % USER_COLORS.length;
      const colors = USER_COLORS[colorIndex];

      // Create data array aligned with timestamps
      const dataPoints = sortedTimestamps.map(timestamp => {
        const dataPoint = userHistory.find(
          item => new Date(item.collected_at).getTime() === timestamp.getTime()
        );
        
        if (dataPoint) {
          return selectedMetric === 'karma' ? dataPoint.karma : dataPoint.post_count;
        }
        
        // Find the most recent data point before this timestamp
        const previousData = userHistory
          .filter(item => new Date(item.collected_at) < timestamp)
          .sort((a, b) => new Date(b.collected_at).getTime() - new Date(a.collected_at).getTime())[0];
        
        if (previousData) {
          return selectedMetric === 'karma' ? previousData.karma : previousData.post_count;
        }
        
        return null; // No data available
      });

      return {
        label: `u/${username}`,
        data: dataPoints,
        borderColor: colors.border,
        backgroundColor: colors.background,
        tension: 0.2,
        pointRadius: 3,
        pointHoverRadius: 5,
        fill: false,
        spanGaps: true // Connect points even with null values
      };
    });

    return {
      labels: sortedTimestamps,
      datasets
    };
  }, [filterDataByTimeRange]);

  useEffect(() => {
    if (!data || Object.keys(data).length === 0) {
      setIsLoading(false);
      return;
    }

    // Process data for chart
    const processedData = processChartData(data, timeRange, metric);
    setChartData(processedData);
    setIsLoading(false);
  }, [data, timeRange, metric, processChartData]);

  const chartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: showLegend,
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
          color: theme === 'dark' ? '#e2e8f0' : '#334155',
        }
      },
      title: {
        display: showTitle,
        text: `${metric === 'karma' ? 'Karma' : 'Post Count'} Comparison`,
        font: {
          size: 16
        },
        color: theme === 'dark' ? '#f8fafc' : '#0f172a',
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: theme === 'dark' ? '#1e293b' : '#ffffff',
        titleColor: theme === 'dark' ? '#f8fafc' : '#0f172a',
        bodyColor: theme === 'dark' ? '#e2e8f0' : '#334155',
        borderColor: theme === 'dark' ? '#334155' : '#e2e8f0',
        borderWidth: 1,
        callbacks: {
          title: (context) => {
            const date = new Date(context[0].parsed.x);
            return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
          },
          label: (context) => {
            const value = context.parsed.y;
            const label = context.dataset.label || '';
            const metricLabel = metric === 'karma' ? 'karma' : 'posts';
            return `${label}: ${value?.toLocaleString()} ${metricLabel}`;
          }
        }
      }
    },
    scales: {
      x: {
        type: 'time',
        time: {
          unit: timeRange === '1d' ? 'hour' : 'day',
          tooltipFormat: 'PPpp',
          displayFormats: {
            hour: 'p',
            day: 'MMM d'
          }
        },
        title: {
          display: true,
          text: 'Date',
          color: theme === 'dark' ? '#e2e8f0' : '#334155',
        },
        ticks: {
          color: theme === 'dark' ? '#94a3b8' : '#64748b',
        },
        grid: {
          color: theme === 'dark' ? '#334155' : '#f1f5f9',
        }
      },
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: metric === 'karma' ? 'Karma' : 'Post Count',
          color: theme === 'dark' ? '#e2e8f0' : '#334155',
        },
        ticks: {
          color: theme === 'dark' ? '#94a3b8' : '#64748b',
          callback: function(value) {
            return typeof value === 'number' ? value.toLocaleString() : value;
          }
        },
        grid: {
          color: theme === 'dark' ? '#334155' : '#f1f5f9',
        }
      }
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    }
  };

  const userCount = Object.keys(data).length;

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ height: `${height}px` }}>
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-primary"></div>
          <p className="mt-3 text-secondary">Loading comparison chart...</p>
        </div>
      </div>
    );
  }

  if (userCount === 0) {
    return (
      <div className={`flex items-center justify-center bg-tertiary rounded-lg ${className}`} style={{ height: `${height}px` }}>
        <div className="text-center p-6">
          <svg className="mx-auto h-12 w-12 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-primary">No users to compare</h3>
          <p className="mt-1 text-sm text-secondary">
            Add multiple users to see comparison charts.
          </p>
        </div>
      </div>
    );
  }

  if (userCount === 1) {
    return (
      <div className={`flex items-center justify-center bg-accent-primary/10 rounded-lg ${className}`} style={{ height: `${height}px` }}>
        <div className="text-center p-6">
          <svg className="mx-auto h-12 w-12 text-accent-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-accent-primary">Single user tracked</h3>
          <p className="mt-1 text-sm text-accent-primary/80">
            Add more users to enable comparison view.
          </p>
          <p className="mt-1 text-xs text-accent-primary/60">
            Individual charts are available for single users.
          </p>
        </div>
      </div>
    );
  }

  if (chartData) {
    return (
      <div className={`${className}`} style={{ height: `${height}px` }}>
        <Line options={chartOptions} data={chartData} />
      </div>
    );
  }

  return null;
}