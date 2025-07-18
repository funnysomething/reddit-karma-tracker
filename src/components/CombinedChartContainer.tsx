'use client';

import React, { useState } from 'react';
import CombinedChart from './CombinedChart';
import TimeRangeSelector from './TimeRangeSelector';
import { HistoryData } from '../lib/types';

interface CombinedChartContainerProps {
  data: Record<string, HistoryData[]>;
  className?: string;
  height?: number;
}

export default function CombinedChartContainer({
  data,
  className = '',
  height = 400
}: CombinedChartContainerProps) {
  const [timeRange, setTimeRange] = useState<'1d' | '7d' | '30d' | '90d' | 'all'>('all');
  const [metric, setMetric] = useState<'karma' | 'posts' | 'comments' | 'postsAndComments'>('karma');

  const userCount = Object.keys(data).length;
  const totalDataPoints = Object.values(data).reduce((sum, userHistory) => sum + userHistory.length, 0);

  return (
    <div className={`bg-secondary rounded-lg shadow-theme-md p-6 transition-theme ${className}`}>
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-4 gap-4">
        <div>
          <h2 className="text-xl font-semibold text-primary">
            Multi-User Comparison
          </h2>
          <p className="text-sm text-secondary mt-1">
            Comparing {userCount} user{userCount !== 1 ? 's' : ''}
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Metric Toggle */}
          <div className="inline-flex rounded-md shadow-sm">
            <button
              type="button"
              className={`px-4 py-2 text-sm font-medium rounded-l-md border transition-theme ${
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
              className={`px-4 py-2 text-sm font-medium border-l-0 border transition-theme ${
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
              className={`px-4 py-2 text-sm font-medium border-l-0 border transition-theme ${
                metric === 'comments'
                  ? 'bg-accent-primary text-white border-accent-primary'
                  : 'bg-secondary text-secondary border-default hover:bg-tertiary'
              }`}
              onClick={() => setMetric('comments')}
            >
              Comments
            </button>
            <button
              type="button"
              className={`px-4 py-2 text-sm font-medium rounded-r-md border-l-0 border transition-theme ${
                metric === 'postsAndComments'
                  ? 'bg-accent-primary text-white border-accent-primary'
                  : 'bg-secondary text-secondary border-default hover:bg-tertiary'
              }`}
              onClick={() => setMetric('postsAndComments')}
            >
              Posts + Comments
            </button>
          </div>
          
          {/* Time Range Selector */}
          <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
        </div>
      </div>

      <CombinedChart 
        data={data}
        height={height}
        timeRange={timeRange}
        metric={metric}
        showTitle={false}
      />

      <div className="mt-4 text-sm text-muted flex flex-col sm:flex-row justify-between gap-2">
        <div className="flex flex-wrap gap-4">
          <span>
            {userCount} user{userCount !== 1 ? 's' : ''} tracked
          </span>
          <span>
            {totalDataPoints} total data points
          </span>
        </div>
        <div>
          {totalDataPoints > 0 && (
            <span>
              Last updated: {
                Math.max(
                  ...Object.values(data).flat().map(d => new Date(d.collected_at).getTime())
                ) > 0 
                  ? new Date(
                      Math.max(
                        ...Object.values(data).flat().map(d => new Date(d.collected_at).getTime())
                      )
                    ).toLocaleString()
                  : 'N/A'
              }
            </span>
          )}
        </div>
      </div>

      {/* Legend/User List */}
      {userCount > 1 && (
        <div className="mt-4 p-4 bg-tertiary rounded-md">
          <h4 className="text-sm font-medium text-secondary mb-2">Tracked Users:</h4>
          <div className="flex flex-wrap gap-2">
            {Object.keys(data).map((username, index) => {
              const colorIndex = index % 8; // Match the color palette in CombinedChart
              const colors = [
                'border-red-400 text-red-700',
                'border-blue-400 text-blue-700',
                'border-teal-400 text-teal-700',
                'border-yellow-400 text-yellow-700',
                'border-purple-400 text-purple-700',
                'border-orange-400 text-orange-700',
                'border-gray-400 text-gray-700',
                'border-indigo-400 text-indigo-700',
              ];
              
              return (
                <span
                  key={username}
                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary border-2 ${colors[colorIndex]}`}
                >
                  <span className="w-2 h-2 rounded-full mr-2 bg-current"></span>
                  u/{username}
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}