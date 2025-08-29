import * as React from 'react';
import { cn } from '@/utils/cn';

interface FooterProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
}

const Footer = React.forwardRef<HTMLElement, FooterProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <footer
        ref={ref}
        className={cn('border-t bg-background', className)}
        {...props}
      >
        <div className="container flex flex-col items-center justify-between gap-4 py-10 md:h-24 md:flex-row md:py-0">
          {children}
        </div>
      </footer>
    );
  }
);
Footer.displayName = 'Footer';

export { Footer };
