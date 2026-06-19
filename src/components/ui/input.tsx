'use client';

import { forwardRef } from 'react';

import { cn } from '@/lib/cn';

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return (
      <input
        ref={ref}
        className={cn(
          'h-11 w-full rounded-[var(--radius)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 text-sm text-[var(--color-text)] placeholder:text-[var(--color-subtle)] transition-colors',
          'focus:border-[var(--color-amber)] focus:outline-none focus:ring-2 focus:ring-[color-mix(in_oklab,var(--color-amber)_30%,transparent)]',
          className,
        )}
        {...props}
      />
    );
  },
);
