import { cn } from '@/lib/cn';

export function Card({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface)]',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
