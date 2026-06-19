import type { Spec } from '@/lib/catalog';
import { cn } from '@/lib/cn';

/** Mono spec list — scale length, tonewood, pickups. The "data" voice. */
export function SpecStrip({ specs, className }: { specs: Spec[]; className?: string }) {
  return (
    <dl className={cn('grid grid-cols-2 gap-x-4 gap-y-1.5 font-mono text-xs', className)}>
      {specs.map((s) => (
        <div key={s.label} className="flex items-baseline justify-between gap-2">
          <dt className="text-[var(--color-subtle)]">{s.label}</dt>
          <dd className="text-right text-[var(--color-muted)]">{s.value}</dd>
        </div>
      ))}
    </dl>
  );
}
