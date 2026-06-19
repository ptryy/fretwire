'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import type { OrderStatus } from '@/lib/payments/types';

import { Countdown } from './countdown';
import { Qr } from './qr';
import { StatusBadge } from './status-badge';

type Initial = {
  status: OrderStatus;
  address: string;
  amount: number;
  coin: string;
  network?: string | null;
  memo?: string | null;
  expiresAt: string;
};

const POLL_INTERVAL_MS = 4000;

export function PayPanel({
  orderId,
  initial,
  mock,
}: {
  orderId: string;
  initial: Initial;
  mock: boolean;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<OrderStatus>(initial.status);
  const [simulating, setSimulating] = useState(false);
  const [copied, setCopied] = useState(false);

  // Poll the status endpoint while the order is still pending.
  useEffect(() => {
    if (status !== 'pending') return;
    const id = setInterval(async () => {
      try {
        const res = await fetch(`/api/orders/${orderId}/status`, { cache: 'no-store' });
        const data = (await res.json()) as { status?: OrderStatus };
        if (data.status && data.status !== status) setStatus(data.status);
      } catch {
        // transient — keep polling
      }
    }, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [orderId, status]);

  // Advance to the receipt once paid.
  useEffect(() => {
    if (status === 'paid') router.push(`/orders/${orderId}/success`);
  }, [status, orderId, router]);

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(initial.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      // clipboard may be unavailable
    }
  };

  const simulate = async () => {
    setSimulating(true);
    try {
      await fetch(`/api/orders/${orderId}/simulate`, { method: 'POST' });
    } finally {
      setSimulating(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Complete payment</h1>
        <StatusBadge status={status} />
      </div>

      {status === 'pending' ? (
        <>
          <p className="text-sm text-[var(--color-muted)]">
            Send exactly{' '}
            <span className="font-semibold text-[var(--color-text)]">
              {initial.amount} {initial.coin}
            </span>{' '}
            {initial.network ? `on ${initial.network} ` : ''}to the address below. This page updates
            automatically once the payment confirms.
          </p>

          <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start">
            <Qr value={initial.address} size={200} />
            <div className="flex w-full flex-col gap-3">
              <Field label={`${initial.coin} address`}>
                <button
                  type="button"
                  onClick={copyAddress}
                  className="break-all text-left font-mono text-sm text-[var(--color-text)] underline-offset-4 hover:underline"
                >
                  {initial.address}
                </button>
                {copied && <span className="ml-2 text-xs text-emerald-300">copied</span>}
              </Field>
              {initial.memo ? (
                <Field label="Memo / Tag">
                  <span className="font-mono text-sm">{initial.memo}</span>
                </Field>
              ) : null}
              <Field label="Expires in">
                <Countdown expiresAt={initial.expiresAt} />
              </Field>
            </div>
          </div>

          {mock && (
            <button
              type="button"
              onClick={simulate}
              disabled={simulating}
              className="self-start rounded-lg border border-dashed border-[var(--color-accent)] px-4 py-2 text-sm text-[var(--color-accent)] transition hover:bg-[var(--color-accent)]/10 disabled:opacity-50"
            >
              {simulating ? 'Simulating…' : '▶ Simulate payment (mock)'}
            </button>
          )}
        </>
      ) : status === 'expired' ? (
        <p className="text-sm text-[var(--color-muted)]">
          This payment window expired. Please start a new order.
        </p>
      ) : (
        <p className="text-sm text-[var(--color-muted)]">This order is {status}.</p>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-muted)]">
        {label}
      </span>
      <div>{children}</div>
    </div>
  );
}
