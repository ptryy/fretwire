'use client';

import { forwardRef } from 'react';

import { cn } from '@/lib/cn';

export type IconButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
};

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { label, className, children, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      aria-label={label}
      className={cn(
        'inline-flex h-10 w-10 items-center justify-center rounded-[var(--radius)] border border-[var(--color-border-strong)] text-[var(--color-muted)] transition-colors',
        'hover:border-[var(--color-amber)] hover:text-[var(--color-amber)]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-amber)]',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
});
