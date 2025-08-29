import * as React from 'react';
import { cn } from '@/utils/cn';

interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
  title?: string;
  description?: string;
}

const Section = React.forwardRef<HTMLElement, SectionProps>(
  ({ className, children, title, description, ...props }, ref) => {
    return (
      <section ref={ref} className={cn('space-y-6', className)} {...props}>
        {(title || description) && (
          <div className="space-y-2">
            {title && (
              <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
            )}
            {description && (
              <p className="text-muted-foreground">{description}</p>
            )}
          </div>
        )}
        {children}
      </section>
    );
  }
);
Section.displayName = 'Section';

export { Section };
