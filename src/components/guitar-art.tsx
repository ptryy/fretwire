import type { GuitarArt as ArtType } from '@/lib/catalog';
import { cn } from '@/lib/cn';

/** Lacquer gradient per instrument family. */
const GRAD: Record<ArtType, [string, string]> = {
  electric: ['#E8A33D', '#6E3310'],
  acoustic: ['#D9A05B', '#553A1E'],
  classical: ['#C9924A', '#462913'],
  bass: ['#A6B4BE', '#2C383F'],
};

const BODY =
  'M100 150 C152 150 178 196 178 262 C178 342 142 432 100 432 C58 432 22 342 22 262 C22 196 48 150 100 150 Z';

/**
 * Parametric guitar artwork. Acoustic/classical get a soundhole; electric/bass
 * get pickups; bass drops to four strings. `seed` (the product slug) keeps the
 * gradient id unique when several render on one page.
 */
export function GuitarArt({
  art,
  seed,
  className,
}: {
  art: ArtType;
  seed: string;
  className?: string;
}) {
  const [from, to] = GRAD[art];
  const acoustic = art === 'acoustic' || art === 'classical';
  const count = art === 'bass' ? 4 : 6;
  const gradId = `lacquer-${seed}`;
  const xs = Array.from({ length: count }, (_, i) => 92 + (i * 16) / (count - 1));

  return (
    <svg
      viewBox="0 0 200 480"
      className={cn('h-full w-full', className)}
      role="img"
      aria-label={`${art} guitar`}
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={from} />
          <stop offset="100%" stopColor={to} />
        </linearGradient>
      </defs>

      {/* headstock + tuners */}
      <path d="M85 16 H115 L119 47 H81 Z" fill="#2A231C" stroke="#4A3D2E" strokeWidth="1.5" />
      {[24, 33, 42].map((y) => (
        <g key={y}>
          <circle cx="77" cy={y} r="2.4" fill="#4A3D2E" />
          <circle cx="123" cy={y} r="2.4" fill="#4A3D2E" />
        </g>
      ))}

      {/* neck */}
      <rect
        x="90"
        y="44"
        width="20"
        height="112"
        rx="4"
        fill="#2A231C"
        stroke="#4A3D2E"
        strokeWidth="1.5"
      />
      {[64, 84, 104, 124, 144].map((y) => (
        <line key={y} x1="90" y1={y} x2="110" y2={y} stroke="#4A3D2E" strokeWidth="1" />
      ))}

      {/* body */}
      <path d={BODY} fill={`url(#${gradId})`} stroke="#1A1512" strokeWidth="2" />
      {/* lacquer sheen */}
      <ellipse cx="80" cy="210" rx="34" ry="60" fill="#FFFFFF" opacity="0.08" />

      {acoustic ? (
        <>
          <circle cx="100" cy="300" r="30" fill="#14110E" opacity="0.85" />
          <circle cx="100" cy="300" r="30" fill="none" stroke="#1A1512" strokeWidth="2" />
          <circle
            cx="100"
            cy="300"
            r="36"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="1"
            opacity="0.12"
          />
        </>
      ) : (
        <>
          <rect x="74" y="250" width="52" height="16" rx="3" fill="#14110E" opacity="0.8" />
          <rect x="74" y="292" width="52" height="16" rx="3" fill="#14110E" opacity="0.8" />
        </>
      )}

      {/* bridge */}
      <rect x="82" y="356" width="36" height="10" rx="2" fill="#14110E" opacity="0.85" />

      {/* strings */}
      {xs.map((x, i) => (
        <line
          key={x}
          x1={x}
          y1="20"
          x2={x}
          y2="361"
          stroke="#EDE6DA"
          strokeWidth={art === 'bass' ? 1.2 : 0.8}
          opacity={0.55 - i * 0.03}
        />
      ))}
    </svg>
  );
}
