'use client';

import React from 'react';

interface TimeRangeSelectorProps {
  value: '1d' | '7d' | '30d' | '90d' | 'all';
  onChange: (value: '1d' | '7d' | '30d' | '90d' | 'all') => void;
  className?: string;
}

export default function TimeRangeSelector({
  value,
  onChange,
  className = ''
}: TimeRangeSelectorProps) {
  const options = [
    { value: '1d', label: '1D' },
    { value: '7d', label: '7D' },
    { value: '30d', label: '30D' },
    { value: '90d', label: '90D' },
    { value: 'all', label: 'All' }
  ];

  return (
    <div className={`inline-flex rounded-md shadow-sm ${className}`}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={`px-4 py-2 text-sm font-medium transition-theme ${
            value === option.value
              ? 'bg-accent-primary text-white'
              : 'bg-secondary text-secondary hover:bg-tertiary'
          } ${
            option.value === '1d'
              ? 'rounded-l-md'
              : option.value === 'all'
              ? 'rounded-r-md'
              : ''
          } border border-default`}
          onClick={() => onChange(option.value as '1d' | '7d' | '30d' | '90d' | 'all')}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}