'use client';

import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export default function ThemeToggle({ 
  className = '', 
  showLabel = false, 
  size = 'md' 
}: ThemeToggleProps) {
  const { theme, toggleTheme, themePreference } = useTheme();

  const sizeClasses = {
    sm: 'w-8 h-8 p-1',
    md: 'w-10 h-10 p-2',
    lg: 'w-12 h-12 p-2.5'
  };

  const iconSizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const getTooltipText = () => {
    if (themePreference === 'system') {
      return `System theme (currently ${theme})`;
    }
    return `Switch to ${theme === 'light' ? 'dark' : 'light'} mode`;
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={toggleTheme}
        className={`
          ${sizeClasses[size]}
          relative rounded-lg border border-default bg-secondary hover:bg-tertiary
          transition-all duration-200 ease-in-out
          focus:outline-none focus:ring-2 focus:ring-accent-primary focus:ring-offset-2
          active:scale-95
          ${className}
        `}
        title={getTooltipText()}
        aria-label={getTooltipText()}
      >
        {/* Sun Icon */}
        <svg
          className={`
            ${iconSizeClasses[size]}
            absolute inset-0 m-auto text-foreground-primary
            transition-all duration-300 ease-in-out
            ${theme === 'dark' ? 'opacity-0 rotate-90 scale-0' : 'opacity-100 rotate-0 scale-100'}
          `}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <circle cx="12" cy="12" r="5" />
          <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
        </svg>

        {/* Moon Icon */}
        <svg
          className={`
            ${iconSizeClasses[size]}
            absolute inset-0 m-auto text-foreground-primary
            transition-all duration-300 ease-in-out
            ${theme === 'light' ? 'opacity-0 -rotate-90 scale-0' : 'opacity-100 rotate-0 scale-100'}
          `}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      </button>

      {showLabel && (
        <span className="text-sm text-secondary font-medium">
          {theme === 'light' ? 'Light' : 'Dark'} Mode
          {themePreference === 'system' && (
            <span className="text-muted ml-1">(System)</span>
          )}
        </span>
      )}
    </div>
  );
}