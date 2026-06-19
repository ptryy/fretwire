import { cn } from '@/lib/cn';

/**
 * Signature divider: a fingerboard rendered as a hairline "string" with inlay
 * dots at the marker frets (3·5·7·9) and the double-dot at the 12th. Encodes
 * the subject (a guitar neck) rather than decorating with a generic rule.
 */
export function FretRail({ className }: { className?: string }) {
  const single = [16, 30, 44, 58];
  return (
    <div className={cn('relative h-2 w-full', className)} aria-hidden>
      <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-[var(--color-border-strong)]" />
      {single.map((x) => (
        <span
          key={x}
          style={{ left: `${x}%` }}
          className="absolute top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[color-mix(in_oklab,var(--color-amber)_70%,transparent)]"
        />
      ))}
      <span className="absolute left-[76%] top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-[5px] rounded-full bg-[var(--color-amber)]" />
      <span className="absolute left-[76%] top-1/2 h-1.5 w-1.5 -translate-x-1/2 translate-y-[2px] rounded-full bg-[var(--color-amber)]" />
    </div>
  );
}
