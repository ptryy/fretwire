'use client';

import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';

import { GuitarArt } from '@/components/guitar-art';
import { GuitarArtBack } from '@/components/guitar-art-back';
import type { GuitarArt as ArtType } from '@/lib/catalog';

/**
 * Hero showpiece: an auto-rotating stack of guitars on the right of the banner.
 * Every {@link INTERVAL_MS} the next model rises into place while spinning a real
 * half-turn on its vertical axis — you see the *back* of the guitar sweep past
 * before it settles front-on. That double-sided spin (not a flat squash of one
 * face) is what makes the twist read as a solid 3D object.
 *
 * Each layer is a `preserve-3d` box holding a front face (GuitarArt) and a back
 * face (GuitarArtBack, pre-flipped 180° with its backface hidden) — the same
 * technique as the product {@link GuitarViewer}. The track carries the
 * `perspective` that gives the rotation depth.
 *
 * Entering: rotateY -180° (back) → 0° (front). Leaving: 0° → 180° (turns away).
 * Both turn the same direction, so it's a continuous conveyor. Travel is kept
 * short (45%) and opacity resolves faster than the spin, so the guitar is solid
 * and inside the frame while it turns — the spin isn't wasted below the crop.
 */

const GUITARS: { art: ArtType; seed: string }[] = [
  { art: 'electric', seed: 'nocturne-eclipse-lp' },
  { art: 'acoustic', seed: 'sienna-dreadnought-d2' },
  { art: 'classical', seed: 'cordova-flamenco-negra' },
  { art: 'bass', seed: 'vesper-groove-j5' },
  { art: 'electric', seed: 'ironwood-solaris-t' },
];

const INTERVAL_MS = 4000;

const TRANSITION =
  'transform 1200ms cubic-bezier(0.34, 1.12, 0.42, 1), opacity 500ms ease-out';

const TRANSFORMS = {
  active: 'translateY(0) rotateY(0deg)',
  leaving: 'translateY(-45%) rotateY(180deg)',
  parked: 'translateY(45%) rotateY(-180deg)',
} as const;

export function HeroGuitarSlider() {
  // -1 => every layer parked below; the mount effect raises the first one so it
  // spins in rather than appearing already in place.
  const [active, setActive] = useState(-1);
  const [prev, setPrev] = useState(-1);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setActive(0));
    const timer = setInterval(() => {
      setActive((cur) => {
        setPrev(cur);
        return (cur + 1) % GUITARS.length;
      });
    }, INTERVAL_MS);
    return () => {
      cancelAnimationFrame(raf);
      clearInterval(timer);
    };
  }, []);

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute bottom-0 right-6 hidden h-[128%] items-end lg:flex xl:right-16"
    >
      <div
        className="relative h-full [aspect-ratio:300/808]"
        style={{ perspective: '1500px' }}
      >
        {GUITARS.map((g, idx) => {
          const state = idx === active ? 'active' : idx === prev ? 'leaving' : 'parked';
          const style: CSSProperties = {
            transform: TRANSFORMS[state],
            opacity: state === 'active' ? 1 : 0,
            transformStyle: 'preserve-3d',
            transformOrigin: 'center',
            transition: state === 'parked' ? 'none' : TRANSITION,
          };
          return (
            <div key={g.seed} className="absolute inset-0" style={style}>
              <Face>
                <GuitarArt
                  art={g.art}
                  seed={g.seed}
                  className="drop-shadow-[0_28px_56px_rgba(0,0,0,0.55)]"
                />
              </Face>
              <Face back>
                <GuitarArtBack
                  art={g.art}
                  seed={g.seed}
                  className="drop-shadow-[0_28px_56px_rgba(0,0,0,0.55)]"
                />
              </Face>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** One side of a two-faced 3D card; the back is pre-flipped so it faces outward. */
function Face({ children, back }: { children: ReactNode; back?: boolean }) {
  return (
    <div
      className="absolute inset-0"
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
