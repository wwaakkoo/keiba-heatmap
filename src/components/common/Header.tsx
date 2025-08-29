import * as React from 'react';
import { cn } from '@/utils/cn';

interface HeaderProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
}

const Header = React.forwardRef<HTMLElement, HeaderProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <header
        ref={ref}
        className={cn(
          'sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60',
          className
        )}
        {...props}
      >
        <div className="container flex h-14 items-center">{children}</div>
      </header>
    );
  }
);
Header.displayName = 'Header';

export { Header };
