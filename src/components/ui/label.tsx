import { cn } from '@/lib/cn';

export function Label({
  className,
  children,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn(
        'text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--color-subtle)]',
        className,
      )}
      {...props}
    >
      {children}
    </label>
  );
}
