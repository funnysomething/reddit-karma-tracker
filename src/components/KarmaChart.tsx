'use client';

import React, { useState, useEffect } from 'react';
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

interface KarmaChartProps {
  data: HistoryData[];
  username?: string;
  className?: string;
  height?: number;
  showLegend?: boolean;
  showTitle?: boolean;
  timeRange?: '1d' | '7d' | '30d' | '90d' | 'all';
}

export default function KarmaChart({
  data,
  username,
  className = '',
  height = 300,
  showLegend = true,
  showTitle = true,
  timeRange = 'all'
}: KarmaChartProps) {
  const { theme } = useTheme();
  const [chartData, setChartData] = useState<{
    labels: Date[];
    datasets: Array<{
      label: string;
      data: number[];
      borderColor: string;
      backgroundColor: string;
      tension: number;
      pointRadius: number;
      pointHoverRadius: number;
    }>;
  } | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!data || data.length === 0) {
      setIsLoading(false);
      return;
    }

    // Filter data based on time range
    const filteredData = filterDataByTimeRange(data, timeRange);
    
    // Process data for chart
    const processedData = processChartData(filteredData);
    setChartData(processedData);
    setIsLoading(false);
  }, [data, timeRange]);

  const filterDataByTimeRange = (data: HistoryData[], range: string): HistoryData[] => {
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
  };

  const processChartData = (data: HistoryData[]) => {
    // Sort data by timestamp
    const sortedData = [...data].sort(
      (a, b) => new Date(a.collected_at).getTime() - new Date(b.collected_at).getTime()
    );

    // Theme-aware colors
    const karmaColor = theme === 'dark' ? 'rgb(239, 68, 68)' : 'rgb(220, 38, 127)';
    const karmaColorAlpha = theme === 'dark' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(220, 38, 127, 0.3)';
    const postsColor = theme === 'dark' ? 'rgb(96, 165, 250)' : 'rgb(59, 130, 246)';
    const postsColorAlpha = theme === 'dark' ? 'rgba(96, 165, 250, 0.3)' : 'rgba(59, 130, 246, 0.3)';

    return {
      labels: sortedData.map(item => new Date(item.collected_at)),
      datasets: [
        {
          label: 'Karma',
          data: sortedData.map(item => item.karma),
          borderColor: karmaColor,
          backgroundColor: karmaColorAlpha,
          tension: 0.2,
          pointRadius: 3,
          pointHoverRadius: 5,
        },
        {
          label: 'Posts',
          data: sortedData.map(item => item.post_count),
          borderColor: postsColor,
          backgroundColor: postsColorAlpha,
          tension: 0.2,
          pointRadius: 3,
          pointHoverRadius: 5,
        }
      ]
    };
  };

  const chartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: showLegend,
        position: 'top' as const,
        labels: {
          color: theme === 'dark' ? '#e2e8f0' : '#334155',
        }
      },
      title: {
        display: showTitle && !!username,
        text: username ? `Karma History for u/${username}` : 'Karma History',
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
          text: 'Value',
          color: theme === 'dark' ? '#e2e8f0' : '#334155',
        },
        ticks: {
          color: theme === 'dark' ? '#94a3b8' : '#64748b',
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

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ height: `${height}px` }}>
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-primary"></div>
          <p className="mt-3 text-secondary">Loading chart data...</p>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className={`flex items-center justify-center bg-tertiary rounded-lg ${className}`} style={{ height: `${height}px` }}>
        <div className="text-center p-6">
          <svg className="mx-auto h-12 w-12 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-primary">No chart data available</h3>
          <p className="mt-1 text-sm text-secondary">
            {username 
              ? `No karma history found for u/${username}.` 
              : 'No karma history data available.'}
          </p>
          <p className="mt-1 text-xs text-muted">
            Data will appear here once collected.
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