import React from 'react';
import { cn } from '../../lib/utils';

export const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'rounded-lg border border-gray-200 bg-white text-gray-900 shadow-sm transition-all duration-200 ease-in-out hover:shadow-md',
      'p-6', // Default padding 24px
      className
    )}
    {...props}
  />
));

Card.displayName = 'Card';
