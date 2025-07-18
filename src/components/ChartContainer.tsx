'use client';

import React, { useState } from 'react';
import KarmaChart from './KarmaChart';
import TimeRangeSelector from './TimeRangeSelector';
import { HistoryData } from '../lib/types';


interface ChartContainerProps {
  data: HistoryData[];
  username?: string;
  className?: string;
  height?: number;
}

export default function ChartContainer({
  data,
  username,
  className = '',
  height = 400
}: ChartContainerProps) {

// ...existing code...
  const [timeRange, setTimeRange] = useState<'1d' | '7d' | '30d' | '90d' | 'all'>('all');
  const [metrics, setMetrics] = useState<{karma: boolean; posts: boolean; comments: boolean; postsAndComments: boolean;}>(
    { karma: true, posts: true, comments: true, postsAndComments: false }
  );

  const handleMetricChange = (metric: keyof typeof metrics) => {
    setMetrics((prev) => ({ ...prev, [metric]: !prev[metric] }));
  };

  return (
    <div className={`bg-secondary rounded-lg shadow-theme-md p-6 transition-theme ${className}`}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
        <h2 className="text-xl font-semibold text-primary mb-2 sm:mb-0">
          {username ? `Karma History for u/${username}` : 'Karma History'}
        </h2>
        <div className="flex flex-col sm:flex-row gap-2 items-center">
          <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
          <div className="flex flex-wrap gap-2 mt-2 sm:mt-0">
            <label className="flex items-center gap-1 text-xs font-medium">
              <input type="checkbox" checked={metrics.karma} onChange={() => handleMetricChange('karma')} /> Karma
            </label>
            <label className="flex items-center gap-1 text-xs font-medium">
              <input type="checkbox" checked={metrics.posts} onChange={() => handleMetricChange('posts')} /> Posts
            </label>
            <label className="flex items-center gap-1 text-xs font-medium">
              <input type="checkbox" checked={metrics.comments} onChange={() => handleMetricChange('comments')} /> Comments
            </label>
            <label className="flex items-center gap-1 text-xs font-medium">
              <input type="checkbox" checked={metrics.postsAndComments} onChange={() => handleMetricChange('postsAndComments')} /> Posts + Comments
            </label>
          </div>
        </div>
      </div>
      <KarmaChart 
        data={data} 
        username={username} 
        height={height} 
        timeRange={timeRange}
        showTitle={false}
        metrics={metrics}
      />
      <div className="mt-4 text-sm text-muted flex justify-between">
        <div>
          {data.length > 0 && (
            <span>
              Showing {data.length} data points
            </span>
          )}
        </div>
        <div>
          Last updated: {data.length > 0 
            ? new Date(Math.max(...data.map(d => new Date(d.collected_at).getTime()))).toLocaleString() 
            : 'N/A'}
        </div>
      </div>
    </div>
  );
}