'use client';

import { Clock, Copy, Wallet, Zap } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import type { OrderStatus } from '@/lib/payments/types';

import { Countdown } from './countdown';
import { Qr } from './qr';
import { StatusBadge } from './status-badge';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Label } from './ui/label';
import { useToast } from './ui/toast';

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
  const { toast } = useToast();
  const [status, setStatus] = useState<OrderStatus>(initial.status);
  const [simulating, setSimulating] = useState(false);

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

  useEffect(() => {
    if (status === 'paid') router.push(`/orders/${orderId}/success`);
  }, [status, orderId, router]);

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(initial.address);
      toast('Address copied', 'success');
    } catch {
      toast('Could not copy address', 'error');
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
    <Card className="flex flex-col gap-6 p-6 sm:p-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-[var(--color-muted)]">
          <Wallet className="h-4 w-4 text-[var(--color-amber)]" aria-hidden />
          <h1 className="font-display text-xl font-semibold text-[var(--color-text)]">
            Complete payment
          </h1>
        </div>
        <StatusBadge status={status} />
      </div>

      {status === 'pending' ? (
        <>
          <p className="text-sm text-[var(--color-muted)]">
            Send exactly{' '}
            <span className="font-mono font-semibold text-[var(--color-text)]">
              {initial.amount} {initial.coin}
            </span>
            {initial.network ? ` on ${initial.network}` : ''} to the address below. This page
            confirms automatically.
          </p>

          <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
            <div className="shrink-0 rounded-[var(--radius)] bg-white p-3">
              <Qr value={initial.address} size={188} />
            </div>
            <div className="flex w-full flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label>{initial.coin} address</Label>
                <button
                  type="button"
                  onClick={copyAddress}
                  className="group flex items-center justify-between gap-3 rounded-[var(--radius)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2.5 text-left"
                >
                  <span className="break-all font-mono text-sm text-[var(--color-text)]">
                    {initial.address}
                  </span>
                  <Copy className="h-4 w-4 shrink-0 text-[var(--color-subtle)] transition-colors group-hover:text-[var(--color-amber)]" />
                </button>
              </div>

              {initial.memo ? (
                <div className="flex flex-col gap-1.5">
                  <Label>Memo / Tag</Label>
                  <span className="font-mono text-sm text-[var(--color-text)]">{initial.memo}</span>
                </div>
              ) : null}

              <div className="flex items-center gap-2 text-sm text-[var(--color-muted)]">
                <Clock className="h-4 w-4 text-[var(--color-amber)]" aria-hidden />
                Expires in <Countdown expiresAt={initial.expiresAt} />
              </div>
            </div>
          </div>

          {mock && (
            <Button
              variant="outline"
              size="sm"
              className="self-start"
              disabled={simulating}
              leftIcon={<Zap className="h-4 w-4" />}
              onClick={simulate}
            >
              {simulating ? 'Simulating…' : 'Simulate payment (mock)'}
            </Button>
          )}
        </>
      ) : status === 'expired' ? (
        <p className="text-sm text-[var(--color-muted)]">
          This payment window expired. Start a new order to try again.
        </p>
      ) : (
        <p className="text-sm text-[var(--color-muted)]">This order is {status}.</p>
      )}
    </Card>
  );
}
