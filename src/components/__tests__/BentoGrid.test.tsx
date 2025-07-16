import React from 'react';
import { render, screen } from '@testing-library/react';
import { BentoGrid, BentoCard, BentoCardHeader, BentoCardContent } from '../BentoGrid';

describe('BentoGrid', () => {
  it('renders children correctly', () => {
    render(
      <BentoGrid>
        <div data-testid="child">Test Child</div>
      </BentoGrid>
    );
    
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('applies correct grid classes', () => {
    const { container } = render(
      <BentoGrid>
        <div>Child</div>
      </BentoGrid>
    );
    
    const gridElement = container.firstChild;
    expect(gridElement).toHaveClass('grid');
    expect(gridElement).toHaveClass('grid-cols-1');
    expect(gridElement).toHaveClass('gap-6');
  });

  it('applies custom gap', () => {
    const { container } = render(
      <BentoGrid gap="gap-4">
        <div>Child</div>
      </BentoGrid>
    );
    
    const gridElement = container.firstChild;
    expect(gridElement).toHaveClass('gap-4');
  });
});

describe('BentoCard', () => {
  it('renders children correctly', () => {
    render(
      <BentoCard>
        <div data-testid="card-child">Card Content</div>
      </BentoCard>
    );
    
    expect(screen.getByTestId('card-child')).toBeInTheDocument();
  });

  it('applies size-based classes correctly', () => {
    const { container, rerender } = render(
      <BentoCard size="sm">
        <div>Small Card</div>
      </BentoCard>
    );
    
    let cardElement = container.firstChild;
    expect(cardElement).toHaveClass('col-span-1');

    rerender(
      <BentoCard size="lg">
        <div>Large Card</div>
      </BentoCard>
    );
    
    cardElement = container.firstChild;
    expect(cardElement).toHaveClass('col-span-1');
  });

  it('applies priority-based styling', () => {
    const { container, rerender } = render(
      <BentoCard priority="high">
        <div>High Priority Card</div>
      </BentoCard>
    );
    
    let cardElement = container.firstChild;
    expect(cardElement).toHaveClass('ring-2', 'ring-accent-primary/20');

    rerender(
      <BentoCard priority="low">
        <div>Low Priority Card</div>
      </BentoCard>
    );
    
    cardElement = container.firstChild;
    expect(cardElement).toHaveClass('shadow-theme-sm');
  });

  it('applies base styling classes', () => {
    const { container } = render(
      <BentoCard>
        <div>Card</div>
      </BentoCard>
    );
    
    const cardElement = container.firstChild;
    expect(cardElement).toHaveClass(
      'bg-secondary',
      'border',
      'border-default',
      'rounded-xl',
      'p-6',
      'transition-theme'
    );
  });
});

describe('BentoCardHeader', () => {
  it('renders title correctly', () => {
    render(<BentoCardHeader title="Test Title" />);
    
    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test Title')).toHaveClass('text-lg', 'font-semibold', 'text-primary');
  });

  it('renders subtitle when provided', () => {
    render(<BentoCardHeader title="Test Title" subtitle="Test Subtitle" />);
    
    expect(screen.getByText('Test Subtitle')).toBeInTheDocument();
    expect(screen.getByText('Test Subtitle')).toHaveClass('text-sm', 'text-muted');
  });

  it('renders action when provided', () => {
    const action = <button data-testid="action-button">Action</button>;
    render(<BentoCardHeader title="Test Title" action={action} />);
    
    expect(screen.getByTestId('action-button')).toBeInTheDocument();
  });
});

describe('BentoCardContent', () => {
  it('renders children correctly', () => {
    render(
      <BentoCardContent>
        <div data-testid="content-child">Content</div>
      </BentoCardContent>
    );
    
    expect(screen.getByTestId('content-child')).toBeInTheDocument();
  });

  it('applies flex-1 class', () => {
    const { container } = render(
      <BentoCardContent>
        <div>Content</div>
      </BentoCardContent>
    );
    
    expect(container.firstChild).toHaveClass('flex-1');
  });
});