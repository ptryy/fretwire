'use client';

import { Search } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

export function SearchBox() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [q, setQ] = useState(searchParams.get('q') ?? '');

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const params = new URLSearchParams();
        const category = searchParams.get('category');
        if (category) params.set('category', category);
        if (q.trim()) params.set('q', q.trim());
        router.push(`/products${params.toString() ? `?${params.toString()}` : ''}`);
      }}
      className="relative w-full sm:max-w-xs"
    >
      <Search
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-subtle)]"
        aria-hidden
      />
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search guitars"
        aria-label="Search guitars"
        className="h-11 w-full rounded-[var(--radius)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] pl-9 pr-3 text-sm text-[var(--color-text)] placeholder:text-[var(--color-subtle)] transition-colors focus:border-[var(--color-amber)] focus:outline-none"
      />
    </form>
  );
}
