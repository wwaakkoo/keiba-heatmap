import * as React from 'react';
import { cn } from '@/utils/cn';

interface NavigationItem {
  label: string;
  href: string;
  icon?: React.ReactNode;
  active?: boolean;
}

interface NavigationProps extends React.HTMLAttributes<HTMLElement> {
  items: NavigationItem[];
  orientation?: 'horizontal' | 'vertical';
}

const Navigation = React.forwardRef<HTMLElement, NavigationProps>(
  ({ className, items, orientation = 'horizontal', ...props }, ref) => {
    return (
      <nav
        ref={ref}
        className={cn(
          'flex',
          orientation === 'horizontal'
            ? 'items-center space-x-6'
            : 'flex-col space-y-2',
          className
        )}
        {...props}
      >
        {items.map((item, index) => (
          <a
            key={index}
            href={item.href}
            className={cn(
              'flex items-center space-x-2 text-sm font-medium transition-colors hover:text-primary',
              item.active ? 'text-foreground' : 'text-muted-foreground',
              orientation === 'vertical' &&
                'w-full px-3 py-2 rounded-md hover:bg-accent'
            )}
          >
            {item.icon && <span className="h-4 w-4">{item.icon}</span>}
            <span>{item.label}</span>
          </a>
        ))}
      </nav>
    );
  }
);
Navigation.displayName = 'Navigation';

export { Navigation, type NavigationItem };
