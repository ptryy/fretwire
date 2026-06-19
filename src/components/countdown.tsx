'use client';

import { useEffect, useState } from 'react';

function remainingMs(expiresAt: string): number {
  return Math.max(0, Date.parse(expiresAt) - Date.now());
}

export function Countdown({ expiresAt }: { expiresAt: string }) {
  const [ms, setMs] = useState(() => remainingMs(expiresAt));

  useEffect(() => {
    const id = setInterval(() => setMs(remainingMs(expiresAt)), 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  if (ms <= 0) return <span className="text-[var(--color-muted)]">expired</span>;

  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return (
    <span className="tabular-nums">
      {min}:{String(sec).padStart(2, '0')}
    </span>
  );
}
