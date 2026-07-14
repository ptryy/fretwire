'use client';

import { KeyRound } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/toast';

/** Trades `DEV_CONFIG_TOKEN` for the unlock cookie, then re-renders the page. */
export function DevConfigUnlock() {
  const router = useRouter();
  const { toast } = useToast();
  const [token, setToken] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const unlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/dev/config/unlock', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      if (!res.ok) throw new Error('wrong token');
      setToken('');
      router.refresh();
    } catch {
      toast('Wrong token.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={unlock} className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-semibold text-[var(--color-text)]">Gateway config</h1>
        <p className="text-sm text-[var(--color-muted)]">
          This editor changes how the shop talks to the payment gateway. Enter the operator token to
          continue.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="dev-token">Operator token</Label>
        <Input
          id="dev-token"
          type="password"
          value={token}
          autoComplete="off"
          autoFocus
          onChange={(e) => setToken(e.target.value)}
        />
      </div>

      <Button
        type="submit"
        disabled={submitting || token === ''}
        leftIcon={<KeyRound className="h-4 w-4" />}
      >
        {submitting ? 'Unlocking…' : 'Unlock'}
      </Button>
    </form>
  );
}
