import { cn } from '@/lib/cn';
import { SITE } from '@/lib/site';

/** Wordmark + a guitar-pick mark with three strings. No emoji. */
export function Logo({ className, showName = true }: { className?: string; showName?: boolean }) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden>
        <path
          d="M12 2.2c5 0 8 2.8 8 6.4 0 4-3.2 8.9-6.2 12.3a2.4 2.4 0 0 1-3.6 0C7.2 17.5 4 12.6 4 8.6c0-3.6 3-6.4 8-6.4Z"
          fill="var(--color-amber)"
        />
        <path
          d="M9.2 6.6v8.8M12 6.1v10.2M14.8 6.6v8.8"
          stroke="#14110e"
          strokeWidth="0.9"
          strokeLinecap="round"
        />
      </svg>
      {showName && (
        <span className="font-display text-lg font-bold tracking-tight text-[var(--color-text)]">
          {SITE.name}
        </span>
      )}
    </span>
  );
}
