import type { GuitarArt as ArtType } from '@/lib/catalog';
import { cn } from '@/lib/cn';

/**
 * Realistic, model-aware guitar artwork (front view, headstock up).
 *
 * The public API stays `{ art, seed }` so every call site (card, detail, cart)
 * is unchanged — `seed` is the product slug, which we look up in {@link MODELS}
 * to pick the real body shape, finish, hardware and string count. Unknown slugs
 * fall back to a sensible default per `art` family.
 *
 * Coordinates: viewBox 0 0 300 860, centreline x=150. Headstock ~30–150,
 * fretboard 150–430, body 410–800.
 */

type Shape = 'singlecut' | 'doublecut' | 'acoustic';
type Headstock = 'inline' | 'split' | 'slotted' | 'bass';
type Feature = 'pickups' | 'soundhole';
type PickupKind = 'single' | 'hum' | 'split';
type Bridge = 'tele' | 'trem' | 'tom' | 'hardtail' | 'acoustic' | 'classic' | 'bass';
type Metal = 'chrome' | 'gold' | 'black';
type Inlay = 'dot' | 'trapezoid' | 'none';
type Guard = 'strat' | 'tele' | 'bass' | 'acoustic' | 'none';

type ModelSpec = {
  shape: Shape;
  finish: string;
  headstock: Headstock;
  strings: number;
  feature: Feature;
  bridge: Bridge;
  metal: Metal;
  inlay: Inlay;
  guard: Guard;
  /** Electric/bass pickups in body order (neck → bridge). */
  pickups?: PickupKind[];
  /** LP-style carved top: adds binding + a domed centre highlight. */
  carved?: boolean;
  /** Single cutaway on acoustics / sharper horns on metal electrics. */
  cutaway?: boolean;
  /** Cream body binding (LP, acoustics, classicals). */
  bound?: boolean;
  /** Flamenco tap plate. */
  golpeador?: boolean;
};

const MODELS: Record<string, ModelSpec> = {
  'ironwood-solaris-t': {
    shape: 'singlecut',
    finish: 'Butterscotch Blonde',
    headstock: 'inline',
    strings: 6,
    feature: 'pickups',
    pickups: ['single', 'single'],
    bridge: 'tele',
    metal: 'chrome',
    inlay: 'dot',
    guard: 'tele',
  },
  'vesper-nova-s': {
    shape: 'doublecut',
    finish: 'Surf Green',
    headstock: 'inline',
    strings: 6,
    feature: 'pickups',
    pickups: ['single', 'single', 'single'],
    bridge: 'trem',
    metal: 'chrome',
    inlay: 'dot',
    guard: 'strat',
  },
  'nocturne-eclipse-lp': {
    shape: 'singlecut',
    finish: 'Cherry Sunburst',
    headstock: 'split',
    strings: 6,
    feature: 'pickups',
    pickups: ['hum', 'hum'],
    bridge: 'tom',
    metal: 'gold',
    inlay: 'trapezoid',
    guard: 'none',
    carved: true,
    bound: true,
  },
  'halcyon-drophawk-7': {
    shape: 'doublecut',
    finish: 'Satin Black',
    headstock: 'inline',
    strings: 7,
    feature: 'pickups',
    pickups: ['hum', 'hum'],
    bridge: 'hardtail',
    metal: 'black',
    inlay: 'dot',
    guard: 'none',
    cutaway: true,
  },
  'sienna-dreadnought-d2': {
    shape: 'acoustic',
    finish: 'Natural Satin',
    headstock: 'split',
    strings: 6,
    feature: 'soundhole',
    bridge: 'acoustic',
    metal: 'chrome',
    inlay: 'dot',
    guard: 'acoustic',
  },
  'sienna-folk-om1': {
    shape: 'acoustic',
    finish: 'Cedar Natural',
    headstock: 'split',
    strings: 6,
    feature: 'soundhole',
    bridge: 'acoustic',
    metal: 'chrome',
    inlay: 'dot',
    guard: 'acoustic',
  },
  'cordova-grand-auditorium-ga5': {
    shape: 'acoustic',
    finish: 'Vintage Sunburst',
    headstock: 'split',
    strings: 6,
    feature: 'soundhole',
    bridge: 'acoustic',
    metal: 'chrome',
    inlay: 'dot',
    guard: 'acoustic',
    cutaway: true,
    bound: true,
  },
  'cordova-maestro-c7': {
    shape: 'acoustic',
    finish: 'French Polish',
    headstock: 'slotted',
    strings: 6,
    feature: 'soundhole',
    bridge: 'classic',
    metal: 'gold',
    inlay: 'none',
    guard: 'none',
    bound: true,
  },
  'cordova-estudio-c3': {
    shape: 'acoustic',
    finish: 'Natural Gloss',
    headstock: 'slotted',
    strings: 6,
    feature: 'soundhole',
    bridge: 'classic',
    metal: 'gold',
    inlay: 'none',
    guard: 'none',
  },
  'cordova-flamenco-negra': {
    shape: 'acoustic',
    finish: 'Cypress Natural',
    headstock: 'slotted',
    strings: 6,
    feature: 'soundhole',
    bridge: 'classic',
    metal: 'gold',
    inlay: 'none',
    guard: 'none',
    golpeador: true,
  },
  'ironwood-lowtide-p': {
    shape: 'doublecut',
    finish: 'Olympic White',
    headstock: 'bass',
    strings: 4,
    feature: 'pickups',
    pickups: ['split'],
    bridge: 'bass',
    metal: 'chrome',
    inlay: 'dot',
    guard: 'none',
  },
  'vesper-groove-j5': {
    shape: 'doublecut',
    finish: '3-Tone Sunburst',
    headstock: 'bass',
    strings: 5,
    feature: 'pickups',
    pickups: ['single', 'single'],
    bridge: 'bass',
    metal: 'chrome',
    inlay: 'dot',
    guard: 'none',
  },
};

const FALLBACK: Record<ArtType, ModelSpec> = {
  electric: MODELS['vesper-nova-s'],
  acoustic: MODELS['sienna-dreadnought-d2'],
  classical: MODELS['cordova-estudio-c3'],
  bass: MODELS['ironwood-lowtide-p'],
};

type FinishKind = 'solid' | 'wood' | 'sunburst';
type FinishSpec = { kind: FinishKind; c: [string, string, string]; grain: boolean; gloss: number };

const FINISH: Record<string, FinishSpec> = {
  'Butterscotch Blonde': { kind: 'wood', c: ['#F4D177', '#E0AE3D', '#B27C22'], grain: true, gloss: 0.18 },
  'Surf Green': { kind: 'solid', c: ['#B6E0CC', '#80BFA4', '#4E8C74'], grain: false, gloss: 0.22 },
  'Cherry Sunburst': { kind: 'sunburst', c: ['#E9B24F', '#B8401C', '#531312'], grain: false, gloss: 0.26 },
  'Satin Black': { kind: 'solid', c: ['#3C3C42', '#1E1E22', '#0C0C0E'], grain: false, gloss: 0.06 },
  'Natural Satin': { kind: 'wood', c: ['#F3E1B6', '#E4CB8E', '#C6A766'], grain: true, gloss: 0.1 },
  'Cedar Natural': { kind: 'wood', c: ['#EBCB97', '#D7AC70', '#B5874C'], grain: true, gloss: 0.12 },
  'Vintage Sunburst': { kind: 'sunburst', c: ['#EACC82', '#B07636', '#583016'], grain: true, gloss: 0.2 },
  'French Polish': { kind: 'wood', c: ['#EDCF93', '#DBB268', '#B98944'], grain: true, gloss: 0.24 },
  'Natural Gloss': { kind: 'wood', c: ['#F4E2B4', '#E6CD8C', '#CBA760'], grain: true, gloss: 0.22 },
  'Cypress Natural': { kind: 'wood', c: ['#F2DA9E', '#E3C172', '#C29A4C'], grain: true, gloss: 0.18 },
  'Olympic White': { kind: 'solid', c: ['#F6F2E9', '#E7E1D1', '#C7C1AF'], grain: false, gloss: 0.2 },
  '3-Tone Sunburst': { kind: 'sunburst', c: ['#ECCF6F', '#BE451B', '#221511'], grain: false, gloss: 0.24 },
};

const METAL: Record<Metal, [string, string, string]> = {
  chrome: ['#F4F6F8', '#AEB6BD', '#5C6369'],
  gold: ['#F8E9B0', '#D8B24A', '#8A6A1E'],
  black: ['#4A4A50', '#2A2A2E', '#141416'],
};

/** Body outlines, centred on x=150. Returns an SVG path `d`. */
function bodyPath(shape: Shape, cutaway: boolean): string {
  if (shape === 'doublecut') {
    // Offset double-cutaway (Strat / J-bass): two horns up top with deep
    // cutaways either side of the neck, a pinched waist, and the widest rounded
    // lower bout near the bottom. `cutaway` sharpens the horns (metal 7-string).
    return [
      `M58 426`,
      `C52 458 54 490 62 516`, // bass horn → upper bout (left)
      `C72 550 94 568 96 602`, // upper bout → waist (left)
      `C100 642 58 662 54 704`, // waist → lower bout (left)
      `C50 762 100 806 150 806`, // lower bout → bottom centre
      `C200 806 250 762 246 704`,
      `C242 662 200 642 204 602`, // lower bout → waist (right)
      `C206 568 228 550 238 516`, // waist → upper bout (right)
      `C246 490 248 458 242 426`, // upper bout → treble horn tip
      `C232 442 212 448 194 448`, // treble horn inner → neck pocket
      `C178 448 170 446 150 446`,
      `C130 446 122 448 106 448`, // neck pocket → bass horn inner
      `C88 448 68 442 58 426 Z`,
    ].join(' ');
  }
  if (shape === 'singlecut') {
    // Single cutaway on the treble (right) side near the neck; full rounded body
    // with the widest lower bout near the bottom (Tele / Les Paul).
    return [
      `M150 410`,
      `C116 408 86 418 70 450`, // left shoulder
      `C50 480 48 524 54 566`, // upper bout (left)
      `C50 610 50 660 70 700`, // gentle waist → lower bout (left)
      `C92 760 120 806 150 806`, // lower bout → bottom centre
      `C194 806 232 760 246 700`,
      `C252 660 250 610 246 566`,
      `C250 522 252 484 234 458`, // upper bout (right)
      `C224 442 206 438 190 448`, // treble horn
      `C176 426 166 420 156 430`, // cutaway notch back to neck
      `C154 422 152 414 150 410 Z`,
    ].join(' ');
  }
  // Acoustic figure-8 (upper bout, waist, larger lower bout). The treble-side
  // upper bout (right) tucks in for a Venetian cutaway when `cutaway`.
  const rUpper = cutaway ? 206 : 232; // right upper-bout reach
  const rShoulder = cutaway ? 182 : 214;
  return [
    `M150 408`,
    `C112 406 80 422 68 454`, // left upper bout (shoulder)
    `C58 478 56 504 62 530`,
    `C68 554 44 568 74 596`, // left waist
    `C52 624 44 668 48 706`,
    `C52 762 96 808 150 810`, // left lower bout → bottom centre
    `C204 808 248 762 252 706`,
    `C256 668 248 624 226 596`, // right lower bout up to waist
    `C256 568 232 554 238 530`, // right waist
    `C244 504 242 478 232 454`,
    `C${rUpper} 426 ${rShoulder} 408 150 408 Z`, // right upper bout (tucked if cutaway)
  ].join(' ');
}

function PickupGroup({
  kind,
  cy,
  metalUrl,
  strings,
}: {
  kind: PickupKind;
  cy: number;
  metalUrl: string;
  strings: number;
}) {
  const halfSpread = 4 + strings * 3.4;
  if (kind === 'hum') {
    return (
      <g>
        <rect x={150 - halfSpread - 6} y={cy - 16} width={(halfSpread + 6) * 2} height={32} rx={4} fill="#1A1614" />
        <rect x={150 - halfSpread - 6} y={cy - 16} width={(halfSpread + 6) * 2} height={32} rx={4} fill="none" stroke="#0C0A09" strokeWidth={1} />
        {[-1, 1].map((s) => (
          <g key={s}>
            {Array.from({ length: 6 }, (_, i) => (
              <circle key={i} cx={150 - halfSpread + 3 + (i * (halfSpread * 2 - 6)) / 5} cy={cy + s * 7} r={1.5} fill={metalUrl} />
            ))}
          </g>
        ))}
      </g>
    );
  }
  if (kind === 'split') {
    return (
      <g fill="#201A16">
        <rect x={150 - halfSpread - 6} y={cy - 18} width={halfSpread + 8} height={18} rx={3} />
        <rect x={150 - 2} y={cy} width={halfSpread + 8} height={18} rx={3} />
      </g>
    );
  }
  return (
    <g>
      <rect x={150 - halfSpread - 3} y={cy - 9} width={(halfSpread + 3) * 2} height={18} rx={6} fill="#EDE7DA" />
      <rect x={150 - halfSpread - 3} y={cy - 9} width={(halfSpread + 3) * 2} height={18} rx={6} fill="none" stroke="#9A9384" strokeWidth={0.8} />
      {Array.from({ length: strings }, (_, i) => (
        <circle key={i} cx={150 - halfSpread + (i * halfSpread * 2) / (strings - 1)} cy={cy} r={1.4} fill="#3A3530" />
      ))}
    </g>
  );
}

export function GuitarArt({ art, seed, className }: { art: ArtType; seed: string; className?: string }) {
  const m = MODELS[seed] ?? FALLBACK[art];
  const f = FINISH[m.finish] ?? FINISH['Natural Satin'];
  const uid = seed.replace(/[^a-z0-9]/gi, '');
  const bodyId = `body-${uid}`;
  const glossId = `gloss-${uid}`;
  const grainId = `grain-${uid}`;
  const metalId = `metal-${uid}`;
  const bodyClip = `clip-${uid}`;

  const [mLight, mMid, mDark] = METAL[m.metal];
  const body = bodyPath(m.shape, m.cutaway ?? false);

  // String geometry.
  const n = m.strings;
  const nutHalf = 9 + n * 0.6;
  const bridgeY = m.feature === 'soundhole' ? 712 : 728;
  const bridgeHalf = 11 + n * 2.6;
  const stringW = m.shape === 'doublecut' && n <= 5 && art === 'bass' ? 1.5 : n >= 7 ? 0.85 : 0.95;

  // Feature centre (soundhole / pickup field).
  const featureCy = 590;

  return (
    <svg viewBox="0 12 300 808" className={cn('h-full w-full', className)} role="img" aria-label={`${art} guitar`}>
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
        <radialGradient id={glossId} cx="0.34" cy="0.26" r="0.5">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity={f.gloss} />
          <stop offset="60%" stopColor="#FFFFFF" stopOpacity={f.gloss * 0.35} />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={metalId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={mLight} />
          <stop offset="50%" stopColor={mMid} />
          <stop offset="100%" stopColor={mDark} />
        </linearGradient>
        {f.grain && (
          <filter id={grainId} x="-10%" y="-10%" width="120%" height="120%">
            <feTurbulence type="fractalNoise" baseFrequency="0.012 0.32" numOctaves={2} seed={uid.length} result="n" />
            <feColorMatrix in="n" type="matrix" values="0 0 0 0 0.32  0 0 0 0 0.22  0 0 0 0 0.10  0 0 0 0.5 0" />
          </filter>
        )}
        <clipPath id={bodyClip}>
          <path d={body} />
        </clipPath>
      </defs>

      {/* drop shadow */}
      <path d={body} fill="#000000" opacity="0.28" transform="translate(5 8)" />

      {/* ---- neck + fretboard (drawn before body so the body overlaps the heel) ---- */}
      <rect x={150 - nutHalf - 5} y={148} width={(nutHalf + 5) * 2} height={300} rx={6} fill="#7A5230" />
      <rect x={150 - nutHalf - 5} y={148} width={(nutHalf + 5) * 2} height={300} fill="#FFFFFF" opacity="0.06" />
      {/* fretboard */}
      <rect x={150 - nutHalf - 1} y={150} width={(nutHalf + 1) * 2} height={292} rx={4} fill="#2B1C12" />
      {/* frets */}
      {Array.from({ length: 14 }, (_, i) => 168 + i * 19).map((y) => (
        <line key={y} x1={150 - nutHalf - 1} y1={y} x2={150 + nutHalf + 1} y2={y} stroke={mLight} strokeWidth={1.1} opacity={0.8} />
      ))}
      {/* inlays */}
      {m.inlay !== 'none' &&
        [206, 244, 282, 320, 396].map((y, idx) =>
          m.inlay === 'trapezoid' ? (
            <rect key={y} x={150 - nutHalf + 2} y={y - 5} width={(nutHalf - 2) * 2} height={10} rx={1.5} fill="#E8E0CE" opacity="0.92" />
          ) : (
            <g key={y}>
              {idx === 3 ? (
                [-1, 1].map((s) => <circle key={s} cx={150 + s * (nutHalf * 0.5)} cy={y} r={2.4} fill="#D9D2C2" />)
              ) : (
                <circle cx={150} cy={y} r={2.6} fill="#D9D2C2" />
              )}
            </g>
          ),
        )}
      {/* nut */}
      <rect x={150 - nutHalf - 2} y={150} width={(nutHalf + 2) * 2} height={5} rx={1.5} fill="#E8E2D2" />

      {/* ---- body ---- */}
      <path d={body} fill={`url(#${bodyId})`} />
      {f.grain && <rect x="40" y="400" width="220" height="420" clipPath={`url(#${bodyClip})`} filter={`url(#${grainId})`} opacity="0.4" />}
      {m.bound && <path d={body} fill="none" stroke="#F0E7CC" strokeWidth={4} opacity="0.85" />}
      <path d={body} fill="none" stroke="#100B08" strokeWidth={2} opacity="0.7" />
      {/* rim light so the silhouette reads against the dark card (esp. dark finishes) */}
      <path d={body} fill="none" stroke="#FFFFFF" strokeWidth={1.1} opacity="0.18" />
      {/* carved-top depth: a soft dark ring just inside the binding */}
      {m.carved && (
        <g clipPath={`url(#${bodyClip})`}>
          <path d={body} fill="none" stroke="#000000" strokeWidth={14} opacity="0.14" />
        </g>
      )}
      {/* lacquer gloss */}
      <g clipPath={`url(#${bodyClip})`}>
        <rect x="40" y="400" width="220" height="420" fill={`url(#${glossId})`} />
      </g>

      {/* ---- top features ---- */}
      {m.feature === 'soundhole' ? (
        <g>
          {m.guard === 'acoustic' && !m.golpeador && (
            <path d={`M${150 + nutHalf + 8} ${featureCy + 8} q 34 0 40 60 q -22 18 -40 8 Z`} fill="#241712" opacity="0.55" />
          )}
          {m.golpeador && <ellipse cx={158} cy={featureCy + 44} rx={42} ry={50} fill="#161009" opacity="0.5" />}
          {/* rosette */}
          <circle cx={150} cy={featureCy} r={42} fill="none" stroke="#0E0A07" strokeWidth={5} opacity="0.5" />
          <circle cx={150} cy={featureCy} r={42} fill="none" stroke={mMid} strokeWidth={1.4} opacity="0.5" />
          {/* soundhole */}
          <circle cx={150} cy={featureCy} r={33} fill="#0B0705" />
          <circle cx={150} cy={featureCy} r={33} fill="none" stroke="#FFFFFF" strokeWidth={1} opacity="0.08" />
          <circle cx={150} cy={featureCy} r={38} fill="none" stroke="#0E0A07" strokeWidth={2.5} opacity="0.6" />
        </g>
      ) : (
        <g>
          {m.guard === 'strat' && (
            <path d={`M150 524 C178 522 198 544 200 588 C202 636 190 694 162 716 C138 728 116 714 110 682 C104 636 110 560 126 536 C134 527 142 524 150 524 Z`} fill="#F3EFE6" opacity="0.94" stroke="#B7B0A0" strokeWidth={1} />
          )}
          {m.guard === 'tele' && (
            <path d={`M108 520 C112 504 130 500 142 506 L142 712 C126 712 110 700 106 672 C100 620 102 566 108 520 Z`} fill="#1A1714" opacity="0.92" />
          )}
          {m.guard === 'bass' && (
            <path d={`M150 536 C176 538 192 560 194 600 C196 648 184 700 156 720 C150 720 150 720 150 720 C150 690 168 648 168 600 C168 566 160 546 150 536 Z`} fill="#2A1C18" opacity="0.85" />
          )}
          {m.pickups?.map((p, i, arr) => (
            <PickupGroup key={i} kind={p} cy={arr.length === 1 ? 636 : 566 + (i * 150) / (arr.length - 1)} metalUrl={mLight} strings={m.strings} />
          ))}
          {/* control knobs */}
          {[0, 1].map((i) => (
            <circle key={i} cx={214 - i * 6} cy={690 + i * 20} r={5} fill={`url(#${metalId})`} stroke="#0C0A09" strokeWidth={0.6} />
          ))}
        </g>
      )}

      {/* ---- bridge ---- */}
      {m.feature === 'soundhole' ? (
        <g>
          <path d={`M${150 - bridgeHalf - 8} ${bridgeY} h ${(bridgeHalf + 8) * 2} l -6 14 h ${-((bridgeHalf + 8) * 2 - 12)} Z`} fill="#1C120B" />
          <rect x={150 - bridgeHalf - 2} y={bridgeY + 2} width={(bridgeHalf + 2) * 2} height={4} rx={2} fill="#E8E2D2" />
          {Array.from({ length: n }, (_, i) => (
            <circle key={i} cx={150 - bridgeHalf + (i * bridgeHalf * 2) / (n - 1)} cy={bridgeY + 8} r={1.6} fill="#E8E2D2" />
          ))}
        </g>
      ) : (
        <g>
          <rect x={150 - bridgeHalf} y={bridgeY} width={bridgeHalf * 2} height={m.bridge === 'tom' ? 8 : 14} rx={2} fill={`url(#${metalId})`} stroke="#0C0A09" strokeWidth={0.6} />
          {m.bridge === 'tom' && <rect x={150 - bridgeHalf + 2} y={bridgeY + 16} width={bridgeHalf * 2 - 4} height={6} rx={2} fill={`url(#${metalId})`} />}
          {m.bridge === 'trem' && <rect x={150 - bridgeHalf + 3} y={bridgeY + 16} width={bridgeHalf * 2 - 6} height={20} rx={2} fill={`url(#${metalId})`} opacity="0.85" />}
          {Array.from({ length: n }, (_, i) => (
            <circle key={i} cx={150 - bridgeHalf + 3 + (i * (bridgeHalf * 2 - 6)) / (n - 1)} cy={bridgeY + (m.bridge === 'tom' ? 4 : 7)} r={1.3} fill="#0C0A09" />
          ))}
        </g>
      )}

      {/* ---- strings (over body, under nothing) ---- */}
      {Array.from({ length: n }, (_, i) => {
        const t = n === 1 ? 0.5 : i / (n - 1);
        const x1 = 150 - nutHalf + t * nutHalf * 2;
        const x2 = 150 - bridgeHalf + t * bridgeHalf * 2;
        return (
          <line key={i} x1={x1} y1={152} x2={x2} y2={bridgeY + 2} stroke="#E9E3D6" strokeWidth={stringW + i * 0.14} opacity={0.7} />
        );
      })}

      {/* ---- headstock + tuners ---- */}
      {(() => {
        const pegFill = `url(#${metalId})`;
        if (m.headstock === 'slotted') {
          return (
            <g>
              <path d="M128 36 H172 V150 H128 Z" fill="#2A1C12" stroke="#120C08" strokeWidth={1.5} />
              <rect x={138} y={60} width={6} height={70} rx={3} fill="#0B0705" />
              <rect x={156} y={60} width={6} height={70} rx={3} fill="#0B0705" />
              {[74, 100, 126].map((y) => (
                <g key={y}>
                  <circle cx={122} cy={y} r={4} fill={pegFill} />
                  <circle cx={178} cy={y} r={4} fill={pegFill} />
                </g>
              ))}
            </g>
          );
        }
        if (m.headstock === 'split') {
          return (
            <g>
              <path d="M126 40 C126 30 174 30 174 40 L172 150 H128 Z" fill="#211009" stroke="#0E0805" strokeWidth={1.5} />
              {[58, 84, 110].map((y) => (
                <g key={y}>
                  <circle cx={120} cy={y} r={4.4} fill={pegFill} stroke="#0C0A09" strokeWidth={0.5} />
                  <circle cx={180} cy={y} r={4.4} fill={pegFill} stroke="#0C0A09" strokeWidth={0.5} />
                </g>
              ))}
            </g>
          );
        }
        // inline (6-in-line / bass): all tuners on one side
        const count = m.headstock === 'bass' ? m.strings : 6;
        const big = m.headstock === 'bass';
        return (
          <g>
            <path d={big ? 'M132 150 L138 44 C138 30 176 30 176 48 L168 150 Z' : 'M134 150 L140 50 C140 36 170 34 172 52 L166 150 Z'} fill="#241008" stroke="#0E0805" strokeWidth={1.5} />
            {Array.from({ length: count }, (_, i) => 60 + i * (84 / Math.max(1, count - 1))).map((y) => (
              <circle key={y} cx={big ? 124 : 128} cy={y} r={big ? 5.4 : 4.2} fill={pegFill} stroke="#0C0A09" strokeWidth={0.5} />
            ))}
          </g>
        );
      })()}
    </svg>
  );
}
