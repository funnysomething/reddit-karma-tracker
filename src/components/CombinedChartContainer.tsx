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
  const [metric, setMetric] = useState<'karma' | 'posts'>('karma');

  const userCount = Object.keys(data).length;
  const totalDataPoints = Object.values(data).reduce((sum, userHistory) => sum + userHistory.length, 0);

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-4 gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">
            Multi-User Comparison
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Comparing {userCount} user{userCount !== 1 ? 's' : ''}
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Metric Toggle */}
          <div className="inline-flex rounded-md shadow-sm">
            <button
              type="button"
              className={`px-4 py-2 text-sm font-medium rounded-l-md border ${
                metric === 'karma'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
              onClick={() => setMetric('karma')}
            >
              Karma
            </button>
            <button
              type="button"
              className={`px-4 py-2 text-sm font-medium rounded-r-md border-l-0 border ${
                metric === 'posts'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
              onClick={() => setMetric('posts')}
            >
              Posts
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

      <div className="mt-4 text-sm text-gray-500 flex flex-col sm:flex-row justify-between gap-2">
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
        <div className="mt-4 p-4 bg-gray-50 rounded-md">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Tracked Users:</h4>
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
                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white border-2 ${colors[colorIndex]}`}
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