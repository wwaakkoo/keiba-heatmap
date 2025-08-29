import * as React from 'react';
import { cn } from '@/utils/cn';
import { Header } from './Header';
import { Footer } from './Footer';

interface AppShellProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  sidebar?: React.ReactNode;
}

const AppShell = React.forwardRef<HTMLDivElement, AppShellProps>(
  ({ className, children, header, footer, sidebar, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('min-h-screen flex flex-col', className)}
        {...props}
      >
        {header && <Header>{header}</Header>}

        <div className="flex-1 flex">
          {sidebar && (
            <aside className="w-64 border-r bg-muted/40 hidden md:block">
              <div className="p-6">{sidebar}</div>
            </aside>
          )}

          <main className="flex-1">{children}</main>
        </div>

        {footer && <Footer>{footer}</Footer>}
      </div>
    );
  }
);
AppShell.displayName = 'AppShell';

export { AppShell };
