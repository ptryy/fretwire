'use client';

import { Search, X } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

export function SearchBox() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [q, setQ] = useState(searchParams.get('q') ?? '');

  /** Write the query to the URL, preserving the active category. */
  const commit = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      const next = value.trim();
      if (next) params.set('q', next);
      else params.delete('q');
      router.replace(`${pathname}${params.toString() ? `?${params}` : ''}`, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  // Realtime search: debounce the URL update so the server-rendered list
  // re-filters as the user types, without a navigation on every keystroke.
  useEffect(() => {
    if (q.trim() === (searchParams.get('q') ?? '')) return;
    const t = setTimeout(() => commit(q), 300);
    return () => clearTimeout(t);
  }, [q, commit, searchParams]);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        commit(q);
      }}
      className="relative w-full sm:max-w-xs"
      role="search"
    >
      <Search
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-subtle)]"
        aria-hidden
      />
      <input
        type="text"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search guitars"
        aria-label="Search guitars"
        className="h-11 w-full rounded-[var(--radius)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] pl-9 pr-10 text-sm text-[var(--color-text)] placeholder:text-[var(--color-subtle)] transition-colors focus:border-[var(--color-amber)] focus:outline-none"
      />
      {q && (
        <button
          type="button"
          onClick={() => {
            setQ('');
            commit('');
          }}
          aria-label="Clear search"
          className="absolute right-2 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-full text-[var(--color-subtle)] transition-colors hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)]"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </form>
  );
}
