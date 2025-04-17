import React from 'react';
import { cn } from '@/lib/utils';

interface LoadingAnimationProps {
  size?: 'xs' | 'sm' | 'md' | 'lg';
  variant?: 'pulse' | 'bounce' | 'dots';
  className?: string;
  text?: string;
  textPosition?: 'top' | 'bottom' | 'right' | 'left';
  color?: 'primary' | 'secondary' | 'accent' | 'default';
}

export function LoadingAnimation({
  size = 'md',
  variant = 'pulse',
  className,
  text,
  textPosition = 'bottom',
  color = 'primary',
}: LoadingAnimationProps) {
  // Size mapping
  const sizeClasses = {
    xs: 'h-4 w-4',
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  // Color mapping
  const colorClasses = {
    primary: 'text-primary',
    secondary: 'text-secondary',
    accent: 'text-purple-500',
    default: 'text-slate-800 dark:text-slate-200',
  };

  // Generate flex direction based on text position
  const flexDirection = {
    top: 'flex-col-reverse',
    bottom: 'flex-col',
    left: 'flex-row-reverse',
    right: 'flex-row',
  };

  // Common spacing class
  const spacing = {
    top: 'space-y-reverse space-y-2',
    bottom: 'space-y-2',
    left: 'space-x-reverse space-x-2',
    right: 'space-x-2',
  };

  const renderAnimation = () => {
    switch (variant) {
      case 'pulse':
        return (
          <div className={cn("animate-pulse rounded-full", sizeClasses[size], colorClasses[color])}>
            <svg className="w-full h-full" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            </svg>
          </div>
        );
      case 'bounce':
        return (
          <div className="flex items-center justify-center space-x-1.5">
            <div className={cn("bg-current rounded-full animate-bounce", colorClasses[color], 
              size === 'xs' ? 'h-1.5 w-1.5' : 
              size === 'sm' ? 'h-2 w-2' : 
              size === 'md' ? 'h-3 w-3' : 
              'h-4 w-4')} 
              style={{ animationDelay: '0ms' }} />
            <div className={cn("bg-current rounded-full animate-bounce", colorClasses[color],
              size === 'xs' ? 'h-1.5 w-1.5' : 
              size === 'sm' ? 'h-2 w-2' : 
              size === 'md' ? 'h-3 w-3' : 
              'h-4 w-4')}
              style={{ animationDelay: '150ms' }} />
            <div className={cn("bg-current rounded-full animate-bounce", colorClasses[color],
              size === 'xs' ? 'h-1.5 w-1.5' : 
              size === 'sm' ? 'h-2 w-2' : 
              size === 'md' ? 'h-3 w-3' : 
              'h-4 w-4')}
              style={{ animationDelay: '300ms' }} />
          </div>
        );
      case 'dots':
        return (
          <div className="flex items-center justify-center">
            <svg className={cn("animate-spin", sizeClasses[size], colorClasses[color])} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className={cn(
      'flex items-center justify-center',
      flexDirection[textPosition],
      spacing[textPosition],
      className
    )}>
      {renderAnimation()}
      {text && (
        <div className={cn(
          "text-sm font-medium",
          size === 'xs' ? 'text-xs' : size === 'lg' ? 'text-base' : 'text-sm',
          colorClasses[color]
        )}>
          {text}
        </div>
      )}
    </div>
  );
}