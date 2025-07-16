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
  const [timeRange, setTimeRange] = useState<'1d' | '7d' | '30d' | '90d' | 'all'>('all');

  return (
    <div className={`bg-secondary rounded-lg shadow-theme-md p-6 transition-theme ${className}`}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
        <h2 className="text-xl font-semibold text-primary mb-2 sm:mb-0">
          {username ? `Karma History for u/${username}` : 'Karma History'}
        </h2>
        <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
      </div>
      <KarmaChart 
        data={data} 
        username={username} 
        height={height} 
        timeRange={timeRange}
        showTitle={false}
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