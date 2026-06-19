'use client';

import { CheckCircle2, CircleAlert, Info, X } from 'lucide-react';
import { createContext, useCallback, useContext, useMemo, useState } from 'react';

import { cn } from '@/lib/cn';

type ToastKind = 'success' | 'error' | 'info';
type ToastItem = { id: number; kind: ToastKind; message: string };

type ToastContextValue = { toast: (message: string, kind?: ToastKind) => void };

const ToastContext = createContext<ToastContextValue | null>(null);

const ICON = { success: CheckCircle2, error: CircleAlert, info: Info } as const;
const TONE: Record<ToastKind, string> = {
  success: 'text-emerald-300',
  error: 'text-[color-mix(in_oklab,var(--color-ember)_75%,white)]',
  info: 'text-[var(--color-amber)]',
};

let seq = 0;
const TOAST_MS = 3200;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const remove = useCallback((id: number) => {
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, kind: ToastKind = 'info') => {
      const id = ++seq;
      setToasts((list) => [...list, { id, kind, message }]);
      setTimeout(() => remove(id), TOAST_MS);
    },
    [remove],
  );

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-5 z-50 flex flex-col items-center gap-2 px-4">
        {toasts.map((t) => {
          const Icon = ICON[t.kind];
          return (
            <div
              key={t.id}
              role="status"
              className="pointer-events-auto flex items-center gap-3 rounded-[var(--radius)] border border-[var(--color-border-strong)] bg-[var(--color-surface-2)] py-3 pl-4 pr-3 text-sm text-[var(--color-text)] shadow-[0_10px_40px_-12px_rgba(0,0,0,0.7)]"
            >
              <Icon className={cn('h-4 w-4 shrink-0', TONE[t.kind])} aria-hidden />
              <span>{t.message}</span>
              <button
                type="button"
                onClick={() => remove(t.id)}
                aria-label="Dismiss notification"
                className="ml-1 text-[var(--color-subtle)] transition-colors hover:text-[var(--color-text)]"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
}
