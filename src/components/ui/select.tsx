'use client';

import { ChevronDown } from 'lucide-react';
import { forwardRef } from 'react';

import { cn } from '@/lib/cn';

export const Select = forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  function Select({ className, children, ...props }, ref) {
    return (
      <div className="relative">
        <select
          ref={ref}
          className={cn(
            'h-11 w-full appearance-none rounded-[var(--radius)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 pr-10 text-sm text-[var(--color-text)] transition-colors',
            'focus:border-[var(--color-amber)] focus:outline-none focus:ring-2 focus:ring-[color-mix(in_oklab,var(--color-amber)_30%,transparent)]',
            className,
          )}
          {...props}
        >
          {children}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-subtle)]"
          aria-hidden
        />
      </div>
    );
  },
);
