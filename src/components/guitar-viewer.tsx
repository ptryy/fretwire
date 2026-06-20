'use client';

import { Repeat, Rotate3d, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import type { GuitarArt as ArtType } from '@/lib/catalog';
import { cn } from '@/lib/cn';

import { GuitarArt } from './guitar-art';
import { GuitarArtBack } from './guitar-art-back';
import { Button } from './ui/button';

type Props = { art: ArtType; seed: string; name: string; finish: string };

const DEG_PER_PX = 0.55;

/** Normalise an angle to [0,360) to decide which face is toward the viewer. */
function facing(angle: number): 'front' | 'back' {
  const a = ((angle % 360) + 360) % 360;
  return a > 90 && a < 270 ? 'back' : 'front';
}

export function GuitarViewer({ art, seed, name, finish }: Props) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [angle, setAngle] = useState(0);
  const [spin, setSpin] = useState(false);
  const [animate, setAnimate] = useState(true);

  useEffect(() => setMounted(true), []);
  const drag = useRef<{ id: number; x: number; start: number } | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  // Respect reduced motion: no auto-spin, snap instead of animate.
  const reduced =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  const close = useCallback(() => {
    setOpen(false);
    setSpin(false);
  }, []);

  // Lock scroll + Esc + initial focus while open.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') {
        setSpin(false);
        setAnimate(true);
        setAngle((a) => a - 30);
      }
      if (e.key === 'ArrowRight') {
        setSpin(false);
        setAnimate(true);
        setAngle((a) => a + 30);
      }
    };
    window.addEventListener('keydown', onKey);
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, close]);

  // Auto-spin loop.
  useEffect(() => {
    if (!open || !spin || reduced) return;
    let raf = 0;
    const tick = () => {
      setAngle((a) => a + 0.6);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [open, spin, reduced]);

  const onPointerDown = (e: React.PointerEvent) => {
    setSpin(false);
    setAnimate(false);
    drag.current = { id: e.pointerId, x: e.clientX, start: angle };
    (e.target as Element).setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    setAngle(d.start + (e.clientX - d.x) * DEG_PER_PX);
  };
  const onPointerUp = (e: React.PointerEvent) => {
    if (drag.current?.id === e.pointerId) drag.current = null;
  };

  const snap = (face: 'front' | 'back') => {
    setSpin(false);
    setAnimate(true);
    setAngle((a) =>
      face === 'front' ? Math.round(a / 360) * 360 : Math.round((a - 180) / 360) * 360 + 180,
    );
  };

  const current = facing(angle);

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        leftIcon={<Rotate3d className="h-4 w-4" />}
        onClick={() => {
          setAngle(0);
          setOpen(true);
        }}
        className="absolute right-3 top-3 bg-[color-mix(in_oklab,var(--color-bg)_70%,transparent)] backdrop-blur"
      >
        View in 3D
      </Button>

      {open &&
        mounted &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`${name} — 3D view`}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[color-mix(in_oklab,#000_72%,transparent)] backdrop-blur-md"
            onPointerDown={(e) => {
              if (e.target === e.currentTarget) close();
            }}
          >
            <button
              ref={closeRef}
              onClick={close}
              aria-label="Close"
              className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--color-border-strong)] text-[var(--color-muted)] transition-colors hover:text-[var(--color-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-amber)]"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="pointer-events-none absolute left-1/2 top-8 -translate-x-1/2 text-center">
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--color-subtle)]">
                {finish}
              </p>
              <h2 className="font-display text-2xl font-semibold text-[var(--color-text)]">
                {name}
              </h2>
            </div>

            {/* 3D stage */}
            <div
              className="relative flex touch-none select-none items-center justify-center"
              style={{
                perspective: '1500px',
                width: 'min(80vw, 340px)',
                height: 'min(64vh, 560px)',
              }}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
            >
              {/* floor shadow */}
              <div
                aria-hidden
                className="absolute bottom-[6%] left-1/2 h-6 -translate-x-1/2 rounded-[100%] bg-black/55 blur-xl"
                style={{ width: `${44 + Math.abs(Math.cos((angle * Math.PI) / 180)) * 38}%` }}
              />
              <div
                className="relative h-full w-full cursor-grab active:cursor-grabbing"
                style={{
                  transformStyle: 'preserve-3d',
                  transform: `rotateY(${angle}deg)`,
                  transition:
                    animate && !reduced ? 'transform 600ms cubic-bezier(0.22,1,0.36,1)' : 'none',
                }}
              >
                <Face>
                  <GuitarArt art={art} seed={seed} />
                </Face>
                <Face back>
                  <GuitarArtBack art={art} seed={seed} />
                </Face>
              </div>
            </div>

            {/* controls */}
            <div className="absolute bottom-8 left-1/2 flex -translate-x-1/2 flex-col items-center gap-3">
              <div className="flex items-center gap-1 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] p-1">
                <Seg active={current === 'front'} onClick={() => snap('front')}>
                  Front
                </Seg>
                <Seg active={current === 'back'} onClick={() => snap('back')}>
                  Back
                </Seg>
                <button
                  onClick={() => {
                    setAnimate(false);
                    setSpin((s) => !s);
                  }}
                  aria-pressed={spin}
                  className={cn(
                    'inline-flex h-8 items-center gap-1.5 rounded-full px-3.5 text-sm transition-colors',
                    spin
                      ? 'bg-[var(--color-amber)] text-[#14110e]'
                      : 'text-[var(--color-muted)] hover:text-[var(--color-text)]',
                  )}
                >
                  <Repeat className="h-3.5 w-3.5" /> Spin
                </button>
              </div>
              <p className="font-mono text-[11px] uppercase tracking-wider text-[var(--color-subtle)]">
                Drag to rotate · ← → keys · Esc to close
              </p>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}

function Face({ children, back }: { children: React.ReactNode; back?: boolean }) {
  return (
    <div
      className="absolute inset-0 flex items-center justify-center"
      style={{
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden',
        transform: back ? 'rotateY(180deg)' : undefined,
      }}
    >
      {children}
    </div>
  );
}

function Seg({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'h-8 rounded-full px-4 text-sm transition-colors',
        active
          ? 'bg-[var(--color-surface-2)] text-[var(--color-text)]'
          : 'text-[var(--color-muted)] hover:text-[var(--color-text)]',
      )}
    >
      {children}
    </button>
  );
}
