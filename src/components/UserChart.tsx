'use client';

import React, { useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Brush
} from 'recharts';
import { HistoryData } from '../lib/types';

export interface UserChartProps {
  username: string;
  data: HistoryData[];
  metric: 'karma' | 'posts' | 'comments' | 'postsAndComments';
  className?: string;
}

interface ChartDataPoint {
  date: string;
  timestamp: number;
  karma: number;
  posts: number;
  comments: number;
  postsAndComments: number;
  formattedDate: string;
}

interface TimeRange {
  label: string;
  days: number;
}

const TIME_RANGES: TimeRange[] = [
  { label: '7D', days: 7 },
  { label: '30D', days: 30 },
  { label: '90D', days: 90 },
  { label: 'All', days: 0 }
];

export default function UserChart({ username, data, metric, className = '' }: UserChartProps) {
  const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRange>(TIME_RANGES[1]); // Default to 30D
  const [showBrush, setShowBrush] = useState(false);

  // Transform and filter data based on selected time range
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];

    // Transform data to chart format
    const transformedData: ChartDataPoint[] = data.map(item => {
      const date = new Date(item.collected_at);
      return {
        date: item.collected_at,
        timestamp: date.getTime(),
        karma: item.karma,
        posts: item.post_count,
        comments: item.comment_count || 0,
        postsAndComments: (item.post_count || 0) + (item.comment_count || 0),
        formattedDate: date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      };
    });

    // Sort by timestamp
    transformedData.sort((a, b) => a.timestamp - b.timestamp);

    // Filter by time range if not "All"
    if (selectedTimeRange.days > 0) {
      const cutoffTime = Date.now() - (selectedTimeRange.days * 24 * 60 * 60 * 1000);
      return transformedData.filter(item => item.timestamp >= cutoffTime);
    }

    return transformedData;
  }, [data, selectedTimeRange]);

  // Calculate statistics
  const stats = useMemo(() => {
    if (chartData.length === 0) return null;

    let currentValue = 0, previousValue = 0, allValues: number[] = [];
    if (metric === 'karma' || metric === 'posts' || metric === 'comments' || metric === 'postsAndComments') {
      currentValue = chartData[chartData.length - 1]?.[metric] || 0;
      previousValue = chartData[chartData.length - 2]?.[metric] || currentValue;
      allValues = chartData.map(d => d[metric] || 0);
    }
    const change = currentValue - previousValue;
    const changePercent = previousValue > 0 ? ((change / previousValue) * 100) : 0;
    const minValue = Math.min(...allValues);
    const maxValue = Math.max(...allValues);

    return {
      current: currentValue,
      change,
      changePercent,
      min: minValue,
      max: maxValue,
      dataPoints: chartData.length
    };
  }, [chartData, metric]);

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ payload: HistoryData }>; label?: string }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="text-sm font-medium text-gray-900 mb-2">
            {new Date(label || '').toLocaleDateString('en-US', {
              weekday: 'short',
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
          <div className="space-y-1">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
              <span className="text-sm text-gray-600">Karma: </span>
              <span className="text-sm font-medium text-gray-900">{data.karma.toLocaleString()}</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
              <span className="text-sm text-gray-600">Posts: </span>
              <span className="text-sm font-medium text-gray-900">{data.post_count.toLocaleString()}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Format Y-axis values
  const formatYAxisValue = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toString();
  };

  // Format X-axis values
  const formatXAxisValue = (tickItem: string) => {
    const date = new Date(tickItem);
    if (selectedTimeRange.days <= 7) {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } else if (selectedTimeRange.days <= 30) {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    }
  };

  if (!data || data.length === 0) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-800">
            {metric === 'karma' ? 'Karma' : 'Posts'} History - u/{username}
          </h3>
        </div>
        
        <div className="flex items-center justify-center h-64 text-gray-500">
          <div className="text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p className="text-lg font-medium">No data available</p>
            <p className="text-sm">Data collection is in progress for this user.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4 sm:mb-0">
          {metric === 'karma' ? 'Karma' : metric === 'posts' ? 'Posts' : metric === 'comments' ? 'Comments' : 'Posts + Comments'} History - u/{username}
        </h3>
        
        {/* Time Range Selector */}
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          {TIME_RANGES.map((range) => (
            <button
              key={range.label}
              onClick={() => setSelectedTimeRange(range)}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                selectedTimeRange.label === range.label
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Current</p>
            <p className="text-lg font-bold text-gray-900">{stats.current.toLocaleString()}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Change</p>
            <p className={`text-lg font-bold ${stats.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {stats.change >= 0 ? '+' : ''}{stats.change.toLocaleString()}
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Min/Max</p>
            <p className="text-lg font-bold text-gray-900">
              {stats.min.toLocaleString()} / {stats.max.toLocaleString()}
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Data Points</p>
            <p className="text-lg font-bold text-gray-900">{stats.dataPoints}</p>
          </div>
        </div>
      )}

      {/* Chart Controls */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={showBrush}
              onChange={(e) => setShowBrush(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-600">Enable zoom</span>
          </label>
        </div>
        
        <div className="text-xs text-gray-500">
          Showing {chartData.length} data points
        </div>
      </div>

      {/* Chart */}
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="date"
              tickFormatter={formatXAxisValue}
              stroke="#6b7280"
              fontSize={12}
              tickLine={false}
            />
            <YAxis 
              tickFormatter={formatYAxisValue}
              stroke="#6b7280"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            
            {metric === 'karma' && (
              <Line
                type="monotone"
                dataKey="karma"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
                name="Karma"
              />
            )}
            {metric === 'posts' && (
              <Line
                type="monotone"
                dataKey="posts"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 2 }}
                name="Posts"
              />
            )}
            {metric === 'comments' && (
              <Line
                type="monotone"
                dataKey="comments"
                stroke="#f59e42"
                strokeWidth={2}
                dot={{ fill: '#f59e42', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#f59e42', strokeWidth: 2 }}
                name="Comments"
              />
            )}
            {metric === 'postsAndComments' && (
              <Line
                type="monotone"
                dataKey="postsAndComments"
                stroke="#a855f7"
                strokeWidth={2}
                dot={{ fill: '#a855f7', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#a855f7', strokeWidth: 2 }}
                name="Posts + Comments"
              />
            )}
            
            {/* Show both lines when viewing karma to provide context */}
            {metric === 'karma' && (
              <Line
                type="monotone"
                dataKey="posts"
                stroke="#10b981"
                strokeWidth={1}
                strokeDasharray="5 5"
                dot={false}
                name="Posts (Reference)"
                opacity={0.6}
              />
            )}
            
            {showBrush && (
              <Brush 
                dataKey="formattedDate" 
                height={30} 
                stroke="#3b82f6"
                fill="#eff6ff"
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Chart Footer */}
      <div className="mt-4 text-xs text-gray-500 text-center">
        Data collected from Reddit API • Last updated: {new Date(chartData[chartData.length - 1]?.date || Date.now()).toLocaleString()}
      </div>
    </div>
  );
}