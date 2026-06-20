import type { GuitarArt as ArtType } from '@/lib/catalog';
import { cn } from '@/lib/cn';

import { bodyPath, FALLBACK, FINISH, METAL, MODELS } from './guitar-art';

/**
 * Back view of a guitar, sharing the model spec + body geometry with
 * {@link GuitarArt}. The body is mirrored horizontally so a single cutaway / an
 * offset lands on the correct side when you spin the instrument round. The front
 * hardware is gone — the back shows a neck plate, cavity covers and strap
 * buttons (electric / bass), or a centre back-seam and trim (acoustic).
 */
export function GuitarArtBack({
  art,
  seed,
  className,
}: {
  art: ArtType;
  seed: string;
  className?: string;
}) {
  const m = MODELS[seed] ?? FALLBACK[art];
  const f = FINISH[m.finish] ?? FINISH['Natural Satin'];
  const uid = `b${seed.replace(/[^a-z0-9]/gi, '')}`;
  const bodyId = `body-${uid}`;
  const glossId = `gloss-${uid}`;
  const grainId = `grain-${uid}`;
  const metalId = `metal-${uid}`;
  const clip = `clip-${uid}`;
  const [mLight, mMid, mDark] = METAL[m.metal];
  const body = bodyPath(m.shape, m.cutaway ?? false);
  const acoustic = m.feature === 'soundhole';
  const boltOn = !m.carved && !acoustic; // set-neck (LP) and acoustics have no neck plate
  const nutHalf = 9 + m.strings * 0.6;

  return (
    <svg
      viewBox="0 12 300 808"
      className={cn('h-full w-full', className)}
      role="img"
      aria-label={`${art} guitar, back`}
    >
      <defs>
        {f.kind === 'sunburst' ? (
          <radialGradient id={bodyId} cx="0.42" cy="0.4" r="0.75">
            <stop offset="0%" stopColor={f.c[0]} />
            <stop offset="52%" stopColor={f.c[1]} />
            <stop offset="100%" stopColor={f.c[2]} />
          </radialGradient>
        ) : (
          <linearGradient id={bodyId} x1="0" y1="0" x2="1" y2="0.15">
            <stop offset="0%" stopColor={f.c[0]} />
            <stop offset="48%" stopColor={f.c[1]} />
            <stop offset="100%" stopColor={f.c[2]} />
          </linearGradient>
        )}
        <radialGradient id={glossId} cx="0.62" cy="0.3" r="0.5">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity={f.gloss} />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={metalId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={mLight} />
          <stop offset="50%" stopColor={mMid} />
          <stop offset="100%" stopColor={mDark} />
        </linearGradient>
        {f.grain && (
          <filter id={grainId} x="-10%" y="-10%" width="120%" height="120%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.012 0.32"
              numOctaves={2}
              seed={uid.length}
              result="n"
            />
            <feColorMatrix
              in="n"
              type="matrix"
              values="0 0 0 0 0.32  0 0 0 0 0.22  0 0 0 0 0.10  0 0 0 0.5 0"
            />
          </filter>
        )}
        <clipPath id={clip}>
          <path d={body} />
        </clipPath>
      </defs>

      {/* mirror so the physical back reads correctly */}
      <g transform="translate(300 0) scale(-1 1)">
        {/* drop shadow */}
        <path d={body} fill="#000000" opacity="0.28" transform="translate(5 8)" />

        {/* neck back (no fretboard) */}
        <rect
          x={150 - nutHalf - 6}
          y={146}
          width={(nutHalf + 6) * 2}
          height={306}
          rx={7}
          fill="#6E4A2B"
        />
        <rect x={150 - 3} y={150} width={6} height={300} fill="#FFFFFF" opacity="0.07" />
        {/* heel cap */}
        <rect
          x={150 - nutHalf - 7}
          y={430}
          width={(nutHalf + 7) * 2}
          height={26}
          rx={5}
          fill="#5A3A20"
        />

        {/* body */}
        <path d={body} fill={`url(#${bodyId})`} />
        {f.grain && (
          <rect
            x="40"
            y="400"
            width="220"
            height="420"
            clipPath={`url(#${clip})`}
            filter={`url(#${grainId})`}
            opacity="0.4"
          />
        )}
        {/* darker back-wood wash for acoustics */}
        {acoustic && (
          <g clipPath={`url(#${clip})`}>
            <rect x="40" y="400" width="220" height="420" fill="#2A160C" opacity="0.18" />
          </g>
        )}
        {m.bound && <path d={body} fill="none" stroke="#F0E7CC" strokeWidth={4} opacity="0.85" />}
        <path d={body} fill="none" stroke="#100B08" strokeWidth={2} opacity="0.7" />
        <path d={body} fill="none" stroke="#FFFFFF" strokeWidth={1.1} opacity="0.18" />
        <g clipPath={`url(#${clip})`}>
          <rect x="40" y="400" width="220" height="420" fill={`url(#${glossId})`} />
        </g>

        {acoustic ? (
          <g clipPath={`url(#${clip})`}>
            {/* centre back seam + decorative strip */}
            <line
              x1={150}
              y1={414}
              x2={150}
              y2={808}
              stroke="#1C0F08"
              strokeWidth={3}
              opacity="0.5"
            />
            <line x1={150} y1={414} x2={150} y2={808} stroke={mMid} strokeWidth={1} opacity="0.4" />
            <rect x={150 - 4} y={560} width={8} height={250} fill="#1C0F08" opacity="0.25" />
            {/* strap button at the tail */}
            <circle cx={150} cy={798} r={4} fill={`url(#${metalId})`} />
          </g>
        ) : (
          <g>
            {/* neck plate (bolt-on) or set-neck heel */}
            {boltOn ? (
              <g>
                <rect
                  x={150 - 24}
                  y={446}
                  width={48}
                  height={44}
                  rx={4}
                  fill={`url(#${metalId})`}
                  stroke="#0C0A09"
                  strokeWidth={0.8}
                />
                {[
                  [-13, -10],
                  [13, -10],
                  [-13, 14],
                  [13, 14],
                ].map(([dx, dy], i) => (
                  <circle
                    key={i}
                    cx={150 + dx}
                    cy={468 + dy}
                    r={2.6}
                    fill="#0C0A09"
                    opacity="0.7"
                  />
                ))}
              </g>
            ) : (
              <ellipse cx={150} cy={470} rx={20} ry={26} fill="#000000" opacity="0.12" />
            )}
            {/* control cavity cover */}
            <rect
              x={150 - 30}
              y={624}
              width={60}
              height={70}
              rx={10}
              fill="#000000"
              opacity="0.16"
            />
            <rect
              x={150 - 30}
              y={624}
              width={60}
              height={70}
              rx={10}
              fill="none"
              stroke="#000000"
              strokeWidth={1}
              opacity="0.3"
            />
            {[
              [-18, 0],
              [18, 0],
              [0, 30],
            ].map(([dx, dy], i) => (
              <circle key={i} cx={150 + dx} cy={644 + dy} r={1.8} fill="#000000" opacity="0.4" />
            ))}
            {/* tremolo spring cover (strat) */}
            {m.bridge === 'trem' && (
              <rect
                x={150 - 14}
                y={706}
                width={28}
                height={48}
                rx={4}
                fill="#000000"
                opacity="0.14"
              />
            )}
            {/* strap buttons */}
            <circle
              cx={150}
              cy={802}
              r={4.5}
              fill={`url(#${metalId})`}
              stroke="#0C0A09"
              strokeWidth={0.5}
            />
            <circle
              cx={88}
              cy={470}
              r={4.5}
              fill={`url(#${metalId})`}
              stroke="#0C0A09"
              strokeWidth={0.5}
            />
          </g>
        )}

        {/* headstock back + tuner bushings */}
        {(() => {
          const wood = '#3A2415';
          if (m.headstock === 'slotted') {
            return (
              <g>
                <path d="M128 36 H172 V150 H128 Z" fill={wood} stroke="#120C08" strokeWidth={1.5} />
                {[74, 100, 126].map((y) => (
                  <g key={y}>
                    <circle cx={122} cy={y} r={3} fill={`url(#${metalId})`} />
                    <circle cx={178} cy={y} r={3} fill={`url(#${metalId})`} />
                  </g>
                ))}
              </g>
            );
          }
          if (m.headstock === 'split') {
            return (
              <g>
                <path
                  d="M126 40 C126 30 174 30 174 40 L172 150 H128 Z"
                  fill={wood}
                  stroke="#0E0805"
                  strokeWidth={1.5}
                />
                <rect x={150 - 7} y={70} width={14} height={36} rx={3} fill="#1C120A" />
                {[58, 84, 110].map((y) => (
                  <g key={y}>
                    <circle cx={120} cy={y} r={3.2} fill={`url(#${metalId})`} />
                    <circle cx={180} cy={y} r={3.2} fill={`url(#${metalId})`} />
                  </g>
                ))}
              </g>
            );
          }
          const big = m.headstock === 'bass';
          const count = big ? m.strings : 6;
          return (
            <g>
              <path
                d={
                  big
                    ? 'M132 150 L138 44 C138 30 176 30 176 48 L168 150 Z'
                    : 'M134 150 L140 50 C140 36 170 34 172 52 L166 150 Z'
                }
                fill={wood}
                stroke="#0E0805"
                strokeWidth={1.5}
              />
              {Array.from({ length: count }, (_, i) => 60 + i * (84 / Math.max(1, count - 1))).map(
                (y) => (
                  <circle
                    key={y}
                    cx={big ? 124 : 128}
                    cy={y}
                    r={big ? 3.6 : 3}
                    fill={`url(#${metalId})`}
                  />
                ),
              )}
            </g>
          );
        })()}
      </g>
    </svg>
  );
}
