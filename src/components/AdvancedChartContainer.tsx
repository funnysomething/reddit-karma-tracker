'use client';

import React, { useState, useMemo } from 'react';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
} from 'chart.js';
import 'chartjs-adapter-date-fns';
import { useTheme } from '../contexts/ThemeContext';
import { HistoryData } from '../lib/types';
import TimeRangeSelector from './TimeRangeSelector';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
);

interface AdvancedChartContainerProps {
  data: Record<string, HistoryData[]>;
  className?: string;
  height?: number;
  showAdvancedStats?: boolean;
}

type ChartType = 'line' | 'bar' | 'growth' | 'distribution' | 'leaderboard';
type MetricType = 'karma' | 'posts' | 'comments';
type TimeRangeType = '1d' | '7d' | '30d' | '90d' | 'all';

// Color palette for different users
const USER_COLORS = [
  { border: 'rgb(255, 99, 132)', background: 'rgba(255, 99, 132, 0.2)' },
  { border: 'rgb(53, 162, 235)', background: 'rgba(53, 162, 235, 0.2)' },
  { border: 'rgb(75, 192, 192)', background: 'rgba(75, 192, 192, 0.2)' },
  { border: 'rgb(255, 205, 86)', background: 'rgba(255, 205, 86, 0.2)' },
  { border: 'rgb(153, 102, 255)', background: 'rgba(153, 102, 255, 0.2)' },
  { border: 'rgb(255, 159, 64)', background: 'rgba(255, 159, 64, 0.2)' },
  { border: 'rgb(199, 199, 199)', background: 'rgba(199, 199, 199, 0.2)' },
  { border: 'rgb(83, 102, 255)', background: 'rgba(83, 102, 255, 0.2)' },
];

export default function AdvancedChartContainer({
  data,
  className = '',
  height = 400,
  showAdvancedStats = false
}: AdvancedChartContainerProps) {
  const { theme } = useTheme();
  const [chartType, setChartType] = useState<ChartType>('line');
  const [metric, setMetric] = useState<MetricType>('karma');
  const [timeRange, setTimeRange] = useState<TimeRangeType>('30d');

  // Filter data by time range
  const filteredData = useMemo(() => {
    if (timeRange === 'all') return data;
    
    const now = new Date();
    const daysToSubtract = {
      '1d': 1,
      '7d': 7,
      '30d': 30,
      '90d': 90
    }[timeRange];
    
    const cutoffDate = new Date(now.setDate(now.getDate() - daysToSubtract));
    
    const filtered: Record<string, HistoryData[]> = {};
    Object.entries(data).forEach(([username, history]) => {
      filtered[username] = history.filter(item => 
        new Date(item.collected_at) >= cutoffDate
      );
    });
    
    return filtered;
  }, [data, timeRange]);

  // Calculate growth rates
  const growthData = useMemo(() => {
    const growth: Record<string, { username: string; karmaGrowth: number; postGrowth: number; commentGrowth: number; }> = {};
    
    Object.entries(filteredData).forEach(([username, history]) => {
      if (history.length < 2) {
        growth[username] = { username, karmaGrowth: 0, postGrowth: 0, commentGrowth: 0 };
        return;
      }
      
      const sorted = [...history].sort((a, b) => 
        new Date(a.collected_at).getTime() - new Date(b.collected_at).getTime()
      );
      
      const first = sorted[0];
      const last = sorted[sorted.length - 1];
      
      const karmaGrowth = first.karma > 0 ? ((last.karma - first.karma) / first.karma) * 100 : 0;
      const postGrowth = first.post_count > 0 ? ((last.post_count - first.post_count) / first.post_count) * 100 : 0;
      const commentGrowth = (first.comment_count || 0) > 0 ? (((last.comment_count || 0) - (first.comment_count || 0)) / (first.comment_count || 0)) * 100 : 0;
      
      growth[username] = { username, karmaGrowth, postGrowth, commentGrowth };
    });
    
    return growth;
  }, [filteredData]);

  // Calculate current standings
  const leaderboardData = useMemo(() => {
    const standings: Array<{ username: string; karma: number; posts: number; comments: number; }> = [];
    
    Object.entries(filteredData).forEach(([username, history]) => {
      if (history.length === 0) return;
      
      const latest = history.reduce((latest, current) => 
        new Date(current.collected_at) > new Date(latest.collected_at) ? current : latest
      );
      
      standings.push({
        username,
        karma: latest.karma,
        posts: latest.post_count,
        comments: latest.comment_count || 0
      });
    });
    
    return standings.sort((a, b) => {
      switch (metric) {
        case 'karma': return b.karma - a.karma;
        case 'posts': return b.posts - a.posts;
        case 'comments': return b.comments - a.comments;
        default: return b.karma - a.karma;
      }
    });
  }, [filteredData, metric]);

  // Generate chart data based on type
  const chartData = useMemo(() => {
    const usernames = Object.keys(filteredData);
    
    switch (chartType) {
      case 'line': {
        // Get all unique timestamps
        const allTimestamps = new Set<string>();
        Object.values(filteredData).forEach(history => {
          history.forEach(item => allTimestamps.add(item.collected_at));
        });
        
        const sortedTimestamps = Array.from(allTimestamps)
          .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
          .map(timestamp => new Date(timestamp));

        const datasets = usernames.map((username, index) => {
          const colorIndex = index % USER_COLORS.length;
          const colors = USER_COLORS[colorIndex];
          const history = filteredData[username];
          
          const dataPoints = sortedTimestamps.map(timestamp => {
            const dataPoint = history.find(
              item => new Date(item.collected_at).getTime() === timestamp.getTime()
            );
            
            if (dataPoint) {
              switch (metric) {
                case 'karma': return dataPoint.karma;
                case 'posts': return dataPoint.post_count;
                case 'comments': return dataPoint.comment_count || 0;
                default: return dataPoint.karma;
              }
            }
            
            // Find the most recent data point before this timestamp
            const previousData = history
              .filter(item => new Date(item.collected_at) < timestamp)
              .sort((a, b) => new Date(b.collected_at).getTime() - new Date(a.collected_at).getTime())[0];
            
            if (previousData) {
              switch (metric) {
                case 'karma': return previousData.karma;
                case 'posts': return previousData.post_count;
                case 'comments': return previousData.comment_count || 0;
                default: return previousData.karma;
              }
            }
            
            return null;
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
            spanGaps: true
          };
        });

        return { labels: sortedTimestamps, datasets };
      }
      
      case 'bar': {
        return {
          labels: leaderboardData.map(user => `u/${user.username}`),
          datasets: [{
            label: metric === 'karma' ? 'Karma' : metric === 'posts' ? 'Posts' : 'Comments',
            data: leaderboardData.map(user => {
              switch (metric) {
                case 'karma': return user.karma;
                case 'posts': return user.posts;
                case 'comments': return user.comments;
                default: return user.karma;
              }
            }),
            backgroundColor: leaderboardData.map((_, index) => {
              const colorIndex = index % USER_COLORS.length;
              return USER_COLORS[colorIndex].background;
            }),
            borderColor: leaderboardData.map((_, index) => {
              const colorIndex = index % USER_COLORS.length;
              return USER_COLORS[colorIndex].border;
            }),
            borderWidth: 2
          }]
        };
      }
      
      case 'growth': {
        const growthValues = Object.values(growthData);
        return {
          labels: growthValues.map(user => `u/${user.username}`),
          datasets: [{
            label: metric === 'karma' ? 'Karma Growth (%)' : metric === 'posts' ? 'Post Growth (%)' : 'Comment Growth (%)',
            data: growthValues.map(user => {
              switch (metric) {
                case 'karma': return user.karmaGrowth;
                case 'posts': return user.postGrowth;
                case 'comments': return user.commentGrowth;
                default: return user.karmaGrowth;
              }
            }),
            backgroundColor: growthValues.map((user) => {
              const growth = metric === 'karma' ? user.karmaGrowth : metric === 'posts' ? user.postGrowth : user.commentGrowth;
              return growth >= 0 ? 'rgba(34, 197, 94, 0.6)' : 'rgba(239, 68, 68, 0.6)';
            }),
            borderColor: growthValues.map((user) => {
              const growth = metric === 'karma' ? user.karmaGrowth : metric === 'posts' ? user.postGrowth : user.commentGrowth;
              return growth >= 0 ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)';
            }),
            borderWidth: 2
          }]
        };
      }
      
      case 'distribution': {
        return {
          labels: leaderboardData.map(user => `u/${user.username}`),
          datasets: [{
            label: metric === 'karma' ? 'Karma Distribution' : metric === 'posts' ? 'Post Distribution' : 'Comment Distribution',
            data: leaderboardData.map(user => {
              switch (metric) {
                case 'karma': return user.karma;
                case 'posts': return user.posts;
                case 'comments': return user.comments;
                default: return user.karma;
              }
            }),
            backgroundColor: leaderboardData.map((_, index) => {
              const colorIndex = index % USER_COLORS.length;
              return USER_COLORS[colorIndex].background;
            }),
            borderColor: leaderboardData.map((_, index) => {
              const colorIndex = index % USER_COLORS.length;
              return USER_COLORS[colorIndex].border;
            }),
            borderWidth: 2
          }]
        };
      }
      
      default:
        return { labels: [], datasets: [] };
    }
  }, [chartType, metric, filteredData, growthData, leaderboardData]);

  // Chart options
  const chartOptions = useMemo(() => {
    // Helper function for chart titles
    const getChartTitle = () => {
      const metricText = metric === 'karma' ? 'Karma' : metric === 'posts' ? 'Posts' : 'Comments';
      switch (chartType) {
        case 'line': return `${metricText} Trends Over Time`;
        case 'bar': return `Current ${metricText} Leaderboard`;
        case 'growth': return `${metricText} Growth Rate (${timeRange.toUpperCase()})`;
        case 'distribution': return `${metricText} Distribution`;
        case 'leaderboard': return `${metricText} Rankings`;
        default: return 'Advanced Analytics';
      }
    };

    const baseOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: chartType !== 'distribution',
          position: 'top' as const,
          labels: {
            usePointStyle: true,
            padding: 20,
            color: theme === 'dark' ? '#e2e8f0' : '#334155',
          }
        },
        title: {
          display: true,
          text: getChartTitle(),
          font: { size: 16 },
          color: theme === 'dark' ? '#f8fafc' : '#0f172a',
        },
        tooltip: {
          backgroundColor: theme === 'dark' ? '#1e293b' : '#ffffff',
          titleColor: theme === 'dark' ? '#f8fafc' : '#0f172a',
          bodyColor: theme === 'dark' ? '#e2e8f0' : '#334155',
          borderColor: theme === 'dark' ? '#334155' : '#e2e8f0',
          borderWidth: 1,
        }
      }
    };

    if (chartType === 'line') {
      return {
        ...baseOptions,
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
              text: metric === 'karma' ? 'Karma' : metric === 'posts' ? 'Posts' : 'Comments',
              color: theme === 'dark' ? '#e2e8f0' : '#334155',
            },
            ticks: {
              color: theme === 'dark' ? '#94a3b8' : '#64748b',
              callback: function(value: string | number) {
                return typeof value === 'number' ? value.toLocaleString() : value;
              }
            },
            grid: {
              color: theme === 'dark' ? '#334155' : '#f1f5f9',
            }
          }
        }
      };
    }

    if (chartType === 'bar' || chartType === 'growth') {
      return {
        ...baseOptions,
        scales: {
          x: {
            title: {
              display: true,
              text: 'Users',
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
              text: chartType === 'growth' 
                ? 'Growth Rate (%)' 
                : (metric === 'karma' ? 'Karma' : 'Posts'),
              color: theme === 'dark' ? '#e2e8f0' : '#334155',
            },
            ticks: {
              color: theme === 'dark' ? '#94a3b8' : '#64748b',
              callback: function(value: string | number) {
                if (chartType === 'growth') {
                  return `${value}%`;
                }
                return typeof value === 'number' ? value.toLocaleString() : value;
              }
            },
            grid: {
              color: theme === 'dark' ? '#334155' : '#f1f5f9',
            }
          }
        }
      };
    }

    return baseOptions;
  }, [chartType, metric, timeRange, theme]);

  function renderChart() {
    switch (chartType) {
      case 'line':
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return <Line options={chartOptions as any} data={chartData as any} />;
      case 'bar':
      case 'growth':
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return <Bar options={chartOptions as any} data={chartData as any} />;
      case 'distribution':
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return <Doughnut options={chartOptions as any} data={chartData as any} />;
      default:
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return <Line options={chartOptions as any} data={chartData as any} />;
    }
  }

  const userCount = Object.keys(data).length;

  if (userCount === 0) {
    return (
      <div className={`bg-secondary rounded-lg shadow-theme-md p-6 ${className}`}>
        <div className="text-center py-12">
          <svg className="mx-auto h-16 w-16 text-muted mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <h3 className="text-lg font-medium text-primary mb-2">No Data Available</h3>
          <p className="text-secondary">Add users to see advanced analytics.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-secondary rounded-lg shadow-theme-md p-6 transition-theme ${className}`}>
      {/* Header with Controls */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
        <div>
          <h2 className="text-xl font-semibold text-primary">Advanced Analytics</h2>
          <p className="text-sm text-secondary mt-1">
            Deep insights from {userCount} user{userCount !== 1 ? 's' : ''}
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Chart Type Selector */}
          <select
            value={chartType}
            onChange={(e) => setChartType(e.target.value as ChartType)}
            className="px-3 py-2 text-sm border border-default rounded-md bg-secondary text-primary focus:ring-2 focus:ring-accent-primary focus:border-accent-primary transition-theme"
          >
            <option value="line">Trend Lines</option>
            <option value="bar">Leaderboard</option>
            <option value="growth">Growth Rate</option>
            <option value="distribution">Distribution</option>
          </select>
          
          {/* Metric Toggle */}
          <div className="inline-flex rounded-md shadow-sm">
            <button
              type="button"
              className={`px-3 py-2 text-sm font-medium rounded-l-md border transition-theme ${
                metric === 'karma'
                  ? 'bg-accent-primary text-white border-accent-primary'
                  : 'bg-secondary text-secondary border-default hover:bg-tertiary'
              }`}
              onClick={() => setMetric('karma')}
            >
              Karma
            </button>
            <button
              type="button"
              className={`px-3 py-2 text-sm font-medium border-l-0 border transition-theme ${
                metric === 'posts'
                  ? 'bg-accent-primary text-white border-accent-primary'
                  : 'bg-secondary text-secondary border-default hover:bg-tertiary'
              }`}
              onClick={() => setMetric('posts')}
            >
              Posts
            </button>
            <button
              type="button"
              className={`px-3 py-2 text-sm font-medium rounded-r-md border-l-0 border transition-theme ${
                metric === 'comments'
                  ? 'bg-accent-primary text-white border-accent-primary'
                  : 'bg-secondary text-secondary border-default hover:bg-tertiary'
              }`}
              onClick={() => setMetric('comments')}
            >
              Comments
            </button>
          </div>
          
          {/* Time Range Selector */}
          <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
        </div>
      </div>

      {/* Chart */}
      <div style={{ height: `${height}px` }}>
        {renderChart()}
      </div>

      {/* Statistics Panel */}
      {showAdvancedStats && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-tertiary rounded-lg p-4">
            <h4 className="text-sm font-medium text-secondary mb-2">Top Performer</h4>
            {leaderboardData.length > 0 && (
              <div>
                <p className="text-lg font-bold text-accent-primary">
                  u/{leaderboardData[0].username}
                </p>
                <p className="text-sm text-muted">
                  {metric === 'karma' 
                    ? `${leaderboardData[0].karma.toLocaleString()} karma`
                    : metric === 'posts'
                    ? `${leaderboardData[0].posts.toLocaleString()} posts`
                    : `${leaderboardData[0].comments.toLocaleString()} comments`
                  }
                </p>
              </div>
            )}
          </div>
          
          <div className="bg-tertiary rounded-lg p-4">
            <h4 className="text-sm font-medium text-secondary mb-2">Fastest Growth</h4>
            {Object.keys(growthData).length > 0 && (
              <div>
                {(() => {
                  const fastestGrowth = Object.values(growthData).reduce((max, current) => {
                    const currentGrowth = metric === 'karma' ? current.karmaGrowth : metric === 'posts' ? current.postGrowth : current.commentGrowth;
                    const maxGrowth = metric === 'karma' ? max.karmaGrowth : metric === 'posts' ? max.postGrowth : max.commentGrowth;
                    return currentGrowth > maxGrowth ? current : max;
                  });
                  const growthValue = metric === 'karma' ? fastestGrowth.karmaGrowth : metric === 'posts' ? fastestGrowth.postGrowth : fastestGrowth.commentGrowth;
                  
                  return (
                    <>
                      <p className="text-lg font-bold text-green-600">
                        u/{fastestGrowth.username}
                      </p>
                      <p className="text-sm text-muted">
                        {growthValue >= 0 ? '+' : ''}{growthValue.toFixed(1)}% growth
                      </p>
                    </>
                  );
                })()}
              </div>
            )}
          </div>
          
          <div className="bg-tertiary rounded-lg p-4">
            <h4 className="text-sm font-medium text-secondary mb-2">Total Tracked</h4>
            <div>
              <p className="text-lg font-bold text-primary">{userCount}</p>
              <p className="text-sm text-muted">
                {Object.values(filteredData).reduce((sum, history) => sum + history.length, 0)} data points
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}