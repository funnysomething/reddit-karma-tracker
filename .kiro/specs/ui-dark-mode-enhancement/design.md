# Design Document

## Overview

This design transforms the Reddit Karma Tracker into a modern, dark mode-enabled application with a bento box layout. The design emphasizes visual hierarchy, accessibility, and contemporary UI patterns while maintaining the application's core functionality.

## Architecture

### Theme System Architecture

The theme system will be built using:
- **CSS Custom Properties**: For dynamic color switching
- **React Context**: For theme state management
- **Local Storage**: For theme persistence
- **System Preference Detection**: For initial theme selection

### Layout Architecture

The bento box layout will use:
- **CSS Grid**: Primary layout system for responsive bento boxes
- **Flexbox**: Secondary layout for internal card arrangements
- **Responsive Breakpoints**: Mobile-first approach with adaptive sizing
- **Card-based Components**: Modular design for easy maintenance

## Components and Interfaces

### 1. Theme Provider Component

```typescript
interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  systemPreference: 'light' | 'dark';
}

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: 'light' | 'dark' | 'system';
}
```

**Responsibilities:**
- Manage theme state across the application
- Persist theme preference in localStorage
- Detect system preference changes
- Provide theme context to all components

### 2. Theme Toggle Component

```typescript
interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}
```

**Features:**
- Animated sun/moon icon transition
- Tooltip showing current theme
- Keyboard accessibility
- Visual feedback on interaction

### 3. Bento Grid Layout Component

```typescript
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
}
```

**Grid System:**
- 12-column responsive grid
- Predefined card sizes (1x1, 2x1, 2x2, 3x2, etc.)
- Auto-placement with manual override options
- Responsive breakpoint adjustments

### 4. Enhanced Dashboard Layout

**Header Section:**
- Dynamic statistics display
- Theme toggle integration
- Responsive navigation
- Real-time data indicators

**Main Bento Grid:**
- User management card (medium size)
- Chart display card (large size)
- Statistics overview card (small size)
- Recent activity card (medium size)
- Quick actions card (small size)

### 5. Chart Components Enhancement

**Dark Mode Adaptations:**
- Chart background colors
- Axis and grid line colors
- Data point and line colors
- Tooltip styling
- Legend styling

## Data Models

### Theme Configuration

```typescript
interface ThemeConfig {
  colors: {
    light: ColorPalette;
    dark: ColorPalette;
  };
  typography: TypographyScale;
  spacing: SpacingScale;
  borderRadius: BorderRadiusScale;
  shadows: ShadowScale;
}

interface ColorPalette {
  background: {
    primary: string;
    secondary: string;
    tertiary: string;
  };
  foreground: {
    primary: string;
    secondary: string;
    muted: string;
  };
  accent: {
    primary: string;
    secondary: string;
    destructive: string;
  };
  border: {
    default: string;
    muted: string;
  };
}
```

### Layout Configuration

```typescript
interface BentoLayoutConfig {
  breakpoints: {
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  gridColumns: {
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  cardSizes: {
    [key: string]: {
      width: number;
      height: number;
    };
  };
}
```

## Error Handling

### Theme System Errors

1. **localStorage Access Errors**
   - Fallback to system preference
   - Graceful degradation without persistence

2. **System Preference Detection Errors**
   - Default to light theme
   - Continue with manual toggle functionality

3. **CSS Custom Property Errors**
   - Fallback to hardcoded values
   - Maintain basic functionality

### Layout Errors

1. **Grid Layout Failures**
   - Fallback to flexbox layout
   - Maintain responsive behavior

2. **Card Sizing Issues**
   - Default to medium size cards
   - Preserve content accessibility

## Testing Strategy

### Visual Testing

1. **Theme Switching Tests**
   - Verify smooth transitions between themes
   - Test all components in both light and dark modes
   - Validate color contrast ratios

2. **Layout Responsiveness Tests**
   - Test bento grid on various screen sizes
   - Verify card reordering and sizing
   - Test touch interactions on mobile

### Accessibility Testing

1. **Color Contrast Testing**
   - Automated contrast ratio validation
   - Manual testing with screen readers
   - High contrast mode compatibility

2. **Keyboard Navigation Testing**
   - Theme toggle keyboard accessibility
   - Focus management in bento layout
   - Screen reader compatibility

### Integration Testing

1. **Theme Persistence Testing**
   - localStorage functionality
   - Cross-session theme retention
   - System preference synchronization

2. **Chart Integration Testing**
   - Chart rendering in both themes
   - Data visualization accessibility
   - Interactive element theming

## Implementation Approach

### Phase 1: Theme System Foundation
- Implement ThemeProvider and context
- Create CSS custom properties system
- Add theme toggle component
- Test basic theme switching

### Phase 2: Bento Layout Implementation
- Create BentoGrid and BentoCard components
- Implement responsive grid system
- Migrate existing components to bento layout
- Test layout responsiveness

### Phase 3: Component Enhancement
- Update all existing components for dark mode
- Enhance chart components with theme support
- Implement dynamic header section
- Add loading states and animations

### Phase 4: Polish and Optimization
- Fine-tune color palettes and contrast
- Add smooth transitions and animations
- Optimize performance and bundle size
- Comprehensive testing and bug fixes

## Design Tokens

### Color System

**Light Theme:**
```css
--background-primary: #ffffff;
--background-secondary: #f8fafc;
--background-tertiary: #f1f5f9;
--foreground-primary: #0f172a;
--foreground-secondary: #334155;
--foreground-muted: #64748b;
--accent-primary: #3b82f6;
--accent-secondary: #06b6d4;
--border-default: #e2e8f0;
--border-muted: #f1f5f9;
```

**Dark Theme:**
```css
--background-primary: #0f172a;
--background-secondary: #1e293b;
--background-tertiary: #334155;
--foreground-primary: #f8fafc;
--foreground-secondary: #e2e8f0;
--foreground-muted: #94a3b8;
--accent-primary: #60a5fa;
--accent-secondary: #22d3ee;
--border-default: #334155;
--border-muted: #1e293b;
```

### Typography Scale

```css
--text-xs: 0.75rem;
--text-sm: 0.875rem;
--text-base: 1rem;
--text-lg: 1.125rem;
--text-xl: 1.25rem;
--text-2xl: 1.5rem;
--text-3xl: 1.875rem;
--text-4xl: 2.25rem;
```

### Spacing Scale

```css
--space-1: 0.25rem;
--space-2: 0.5rem;
--space-3: 0.75rem;
--space-4: 1rem;
--space-6: 1.5rem;
--space-8: 2rem;
--space-12: 3rem;
--space-16: 4rem;
```

This design provides a comprehensive foundation for creating a modern, accessible, and visually appealing Reddit Karma Tracker with full dark mode support and contemporary bento box layout.