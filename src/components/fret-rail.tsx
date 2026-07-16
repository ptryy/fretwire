import { cn } from '@/lib/cn';

/**
 * Signature divider: a fingerboard rendered as a hairline "string" with an amber
 * inlay dot centred over each category below. The dots share the cards' grid
 * (`grid-cols-4 gap-4`), so every marker lines up with the middle of its card
 * instead of floating at arbitrary offsets.
 */
export function FretRail({ count = 4, className }: { count?: number; className?: string }) {
  return (
    <div className={cn('relative h-2 w-full', className)} aria-hidden>
      <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-[var(--color-border-strong)]" />
      <div className="absolute inset-0 grid grid-cols-4 gap-4">
        {Array.from({ length: count }).map((_, i) => (
          <span key={i} className="flex items-center justify-center">
            <span className="h-1.5 w-1.5 rounded-full bg-[color-mix(in_oklab,var(--color-amber)_70%,transparent)]" />
          </span>
        ))}
      </div>
    </div>
  );
}
