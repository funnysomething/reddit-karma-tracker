'use client';

import React from 'react';

interface BentoGridProps {
  children: React.ReactNode;
  className?: string;
  columns?: number;
  gap?: string;
}

interface BentoCardProps {
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  priority?: 'high' | 'medium' | 'low';
  colSpan?: number;
  rowSpan?: number;
}

export function BentoGrid({ 
  children, 
  className = '', 
  columns = 12, 
  gap = 'gap-6' 
}: BentoGridProps) {
  const gridCols = {
    4: 'grid-cols-4',
    6: 'grid-cols-6',
    8: 'grid-cols-8',
    12: 'grid-cols-12'
  };

  return (
    <div 
      className={`
        grid 
        grid-cols-1 
        sm:grid-cols-2 
        md:grid-cols-4 
        lg:grid-cols-6 
        xl:${gridCols[columns as keyof typeof gridCols] || 'grid-cols-12'}
        ${gap}
        auto-rows-min
        ${className}
      `}
    >
      {children}
    </div>
  );
}

export function BentoCard({ 
  children, 
  size = 'md', 
  className = '', 
  priority = 'medium',
  colSpan,
  rowSpan
}: BentoCardProps) {
  // Size-based responsive spans
  const sizeSpans = {
    sm: {
      col: 'col-span-1 sm:col-span-1 md:col-span-2 lg:col-span-2 xl:col-span-3',
      row: 'row-span-1'
    },
    md: {
      col: 'col-span-1 sm:col-span-2 md:col-span-2 lg:col-span-3 xl:col-span-4',
      row: 'row-span-1'
    },
    lg: {
      col: 'col-span-1 sm:col-span-2 md:col-span-4 lg:col-span-4 xl:col-span-6',
      row: 'row-span-1 md:row-span-2'
    },
    xl: {
      col: 'col-span-1 sm:col-span-2 md:col-span-4 lg:col-span-6 xl:col-span-8',
      row: 'row-span-1 md:row-span-2 lg:row-span-3'
    }
  };

  // Priority-based styling
  const priorityStyles = {
    high: 'ring-2 ring-accent-primary/20 shadow-theme-lg',
    medium: 'shadow-theme-md',
    low: 'shadow-theme-sm'
  };

  // Custom spans override size-based spans
  const colSpanClass = colSpan ? `col-span-${colSpan}` : sizeSpans[size].col;
  const rowSpanClass = rowSpan ? `row-span-${rowSpan}` : sizeSpans[size].row;

  return (
    <div 
      className={`
        ${colSpanClass}
        ${rowSpanClass}
        bg-secondary 
        border border-default 
        rounded-xl 
        p-6 
        transition-theme
        hover:shadow-theme-lg
        hover:border-accent
        ${priorityStyles[priority]}
        ${className}
      `}
    >
      {children}
    </div>
  );
}

// Preset card components for common use cases
export function BentoCardHeader({ 
  title, 
  subtitle, 
  action,
  className = '' 
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex items-start justify-between mb-4 ${className}`}>
      <div>
        <h3 className="text-lg font-semibold text-primary mb-1">{title}</h3>
        {subtitle && (
          <p className="text-sm text-muted">{subtitle}</p>
        )}
      </div>
      {action && (
        <div className="flex-shrink-0 ml-4">
          {action}
        </div>
      )}
    </div>
  );
}

export function BentoCardContent({ 
  children, 
  className = '' 
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex-1 ${className}`}>
      {children}
    </div>
  );
}

export function BentoCardFooter({ 
  children, 
  className = '' 
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`mt-4 pt-4 border-t border-muted ${className}`}>
      {children}
    </div>
  );
}