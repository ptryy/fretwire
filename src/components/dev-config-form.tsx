'use client';

import { RotateCcw, Save, TriangleAlert } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { useToast } from '@/components/ui/toast';
import type { ConfigSource, ConfigView, PaymentsMode } from '@/lib/payments/types';

type Props = { initialView: ConfigView };

/** The five string fields, in display order. `mode` is a separate Select. */
const TEXT_FIELDS = [
  { key: 'apiUrl', label: 'API URL', placeholder: 'https://api.omnipayx.io' },
  { key: 'publicKey', label: 'Public key (client id)', placeholder: '' },
  { key: 'privateKey', label: 'Private key', placeholder: '' },
  { key: 'ipnSecret', label: 'IPN secret', placeholder: '' },
  { key: 'appUrl', label: 'Site / app URL', placeholder: 'https://shop.example' },
] as const;

type TextField = (typeof TEXT_FIELDS)[number]['key'];
type Values = Record<TextField, string>;

function SourceBadge({ source }: { source: ConfigSource }) {
  const override = source === 'override';
  return (
    <span
      className={
        override
          ? 'rounded-full bg-[color-mix(in_oklab,var(--color-amber)_18%,transparent)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-amber)]'
          : 'rounded-full bg-[var(--color-surface-2)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-subtle)]'
      }
    >
      {override ? 'override' : 'env'}
    </span>
  );
}

/**
 * A secret renders blank whatever its stored value — the server never sends one
 * back. Blank therefore means "keep what's stored", so its input starts empty and
 * the label carries only a last-4 hint. "Reset to env" is the one way to clear it.
 *
 * A non-secret starts empty when it comes from env (the env value shows as the
 * placeholder) and prefilled when it's an override; clearing it reverts to env.
 */
function seed(view: ConfigView): Values {
  const values = {} as Values;
  for (const field of TEXT_FIELDS) {
    const cell = view.fields[field.key];
    values[field.key] = !cell.secret && cell.source === 'override' ? cell.value : '';
  }
  return values;
}

export function DevConfigForm({ initialView }: Props) {
  const { toast } = useToast();
  const [view, setView] = useState(initialView);
  const [mode, setMode] = useState<PaymentsMode>(initialView.fields.mode.value as PaymentsMode);
  const [values, setValues] = useState<Values>(() => seed(initialView));
  const [busy, setBusy] = useState(false);

  const applyView = (next: ConfigView) => {
    setView(next);
    setMode(next.fields.mode.value as PaymentsMode);
    setValues(seed(next));
  };

  /** Blank secrets are dropped, so saving without retyping a key doesn't wipe it. */
  const payload = (): Record<string, string> => {
    const body: Record<string, string> = { mode };
    for (const field of TEXT_FIELDS) {
      const value = values[field.key];
      if (view.fields[field.key].secret && value.trim() === '') continue;
      body[field.key] = value;
    }
    return body;
  };

  const send = async (init: RequestInit, done: string) => {
    setBusy(true);
    try {
      const res = await fetch('/api/dev/config', init);
      if (!res.ok) throw new Error(`[${res.status}]`);
      applyView((await res.json()) as ConfigView);
      toast(done, 'success');
    } catch (err) {
      toast(`Failed: ${String(err)}`, 'error');
    } finally {
      setBusy(false);
    }
  };

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    void send(
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload()),
      },
      'Saved — applies to the next checkout / IPN.',
    );
  };

  const reset = () => void send({ method: 'DELETE' }, 'Override cleared — back to env.');

  const placeholderFor = (key: TextField, fallback: string): string => {
    const cell = view.fields[key];
    if (cell.secret) return cell.hint ? `${cell.hint} — blank keeps it` : 'not set';
    return cell.source === 'env' && cell.value ? cell.value : fallback;
  };

  return (
    <form onSubmit={save} className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-semibold text-[var(--color-text)]">Gateway config</h1>
        <p className="text-sm text-[var(--color-muted)]">
          Runtime override, layered on top of the env vars. A filled field wins over its env var;
          clearing one falls back to env. The private key and IPN secret are write-only — never
          shown, and left blank they keep whatever is stored.
        </p>
      </div>

      {!view.persistent && (
        <div className="flex gap-3 rounded-[var(--radius)] bg-[color-mix(in_oklab,var(--color-amber)_12%,transparent)] p-4 text-sm text-[var(--color-text)]">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-amber)]" />
          <p>
            No shared store is configured, so this override lives in one instance&apos;s memory. On
            serverless that means per-invocation (Vercel) or per-isolate (Workers) — the next
            request may not see what you save. Set{' '}
            <code className="text-[var(--color-amber)]">UPSTASH_REDIS_REST_URL</code> and{' '}
            <code className="text-[var(--color-amber)]">UPSTASH_REDIS_REST_TOKEN</code> to make it
            stick.
          </p>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Label htmlFor="cfg-mode">Payments mode</Label>
          <SourceBadge source={view.fields.mode.source} />
        </div>
        <Select
          id="cfg-mode"
          value={mode}
          onChange={(e) => setMode(e.target.value as PaymentsMode)}
        >
          <option value="mock">mock — offline, simulated IPN</option>
          <option value="http">http — real gateway</option>
        </Select>
      </div>

      {TEXT_FIELDS.map((field) => (
        <div key={field.key} className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Label htmlFor={`cfg-${field.key}`}>{field.label}</Label>
            <SourceBadge source={view.fields[field.key].source} />
          </div>
          <Input
            id={`cfg-${field.key}`}
            type={view.fields[field.key].secret ? 'password' : 'text'}
            value={values[field.key]}
            placeholder={placeholderFor(field.key, field.placeholder) || undefined}
            autoComplete="off"
            spellCheck={false}
            onChange={(e) => setValues((v) => ({ ...v, [field.key]: e.target.value }))}
          />
        </div>
      ))}

      <div className="flex gap-3">
        <Button type="submit" disabled={busy} leftIcon={<Save className="h-4 w-4" />}>
          {busy ? 'Working…' : 'Save config'}
        </Button>
        <Button
          type="button"
          variant="ghost"
          disabled={busy}
          onClick={reset}
          leftIcon={<RotateCcw className="h-4 w-4" />}
        >
          Reset to env
        </Button>
      </div>
    </form>
  );
}
