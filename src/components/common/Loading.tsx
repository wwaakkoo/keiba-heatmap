import * as React from 'react';
import { cn } from '@/utils/cn';
import { Skeleton } from '@/components/ui/skeleton';

interface LoadingProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'spinner' | 'skeleton' | 'dots';
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

const Loading = React.forwardRef<HTMLDivElement, LoadingProps>(
  ({ className, variant = 'spinner', size = 'md', text, ...props }, ref) => {
    const sizeClasses = {
      sm: 'h-4 w-4',
      md: 'h-8 w-8',
      lg: 'h-12 w-12',
    };

    if (variant === 'skeleton') {
      return (
        <div ref={ref} className={cn('space-y-3', className)} {...props}>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      );
    }

    if (variant === 'dots') {
      return (
        <div
          ref={ref}
          className={cn(
            'flex items-center justify-center space-x-1',
            className
          )}
          {...props}
        >
          <div className="animate-bounce h-2 w-2 bg-primary rounded-full [animation-delay:-0.3s]"></div>
          <div className="animate-bounce h-2 w-2 bg-primary rounded-full [animation-delay:-0.15s]"></div>
          <div className="animate-bounce h-2 w-2 bg-primary rounded-full"></div>
          {text && (
            <span className="ml-2 text-sm text-muted-foreground">{text}</span>
          )}
        </div>
      );
    }

    return (
      <div
        ref={ref}
        className={cn(
          'flex flex-col items-center justify-center space-y-2',
          className
        )}
        {...props}
      >
        <div
          className={cn(
            'animate-spin rounded-full border-2 border-muted border-t-primary',
            sizeClasses[size]
          )}
        />
        {text && <p className="text-sm text-muted-foreground">{text}</p>}
      </div>
    );
  }
);
Loading.displayName = 'Loading';

export { Loading };
