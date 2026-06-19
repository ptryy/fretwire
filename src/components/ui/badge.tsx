import { cn } from '@/lib/cn';

export type BadgeTone = 'amber' | 'emerald' | 'ember' | 'neutral';

const TONES: Record<BadgeTone, string> = {
  amber:
    'border-[color-mix(in_oklab,var(--color-amber)_40%,transparent)] bg-[var(--color-amber-soft)] text-[var(--color-amber)]',
  emerald: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
  ember:
    'border-[color-mix(in_oklab,var(--color-ember)_45%,transparent)] bg-[color-mix(in_oklab,var(--color-ember)_14%,transparent)] text-[color-mix(in_oklab,var(--color-ember)_70%,white)]',
  neutral:
    'border-[var(--color-border-strong)] bg-[var(--color-surface-2)] text-[var(--color-muted)]',
};

export function Badge({
  tone = 'neutral',
  className,
  children,
}: {
  tone?: BadgeTone;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium',
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
