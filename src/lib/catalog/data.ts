/**
 * Static guitar catalog — the storefront's source of truth. No database: a
 * bundled, typed module reads instantly and deploys anywhere (incl. Vercel
 * serverless). Prices are USD display amounts; `art` selects the SVG rendering.
 */

export type GuitarArt = 'electric' | 'acoustic' | 'classical' | 'bass';

export type Spec = { label: string; value: string };

export type Product = {
  slug: string;
  name: string;
  brand: string;
  description: string;
  categorySlug: string;
  priceDisplay: number;
  art: GuitarArt;
  /** Finish name, used both as a spec and to tint the artwork. */
  finish: string;
  specs: Spec[];
};

export type Category = { slug: string; name: string; blurb: string };

export const CATEGORIES: Category[] = [
  { slug: 'electric', name: 'Electric', blurb: 'Solid-body voltage — from twang to high gain.' },
  { slug: 'acoustic', name: 'Acoustic', blurb: 'Steel-string warmth for stage and porch.' },
  { slug: 'classical', name: 'Classical', blurb: 'Nylon-string nuance, built for the fingers.' },
  { slug: 'bass', name: 'Bass', blurb: 'The low end that holds the room together.' },
];

export const PRODUCTS: Product[] = [
  {
    slug: 'ironwood-solaris-t',
    name: 'Solaris T',
    brand: 'Ironwood',
    description:
      'A bright, articulate single-cut that lives for spank and twang — bolt-on maple and a pair of vintage single-coils.',
    categorySlug: 'electric',
    priceDisplay: 1299,
    art: 'electric',
    finish: 'Butterscotch Blonde',
    specs: [
      { label: 'Scale', value: '25.5"' },
      { label: 'Body', value: 'Swamp ash' },
      { label: 'Pickups', value: '2× single-coil' },
      { label: 'Neck', value: 'Roasted maple' },
    ],
  },
  {
    slug: 'vesper-nova-s',
    name: 'Nova S',
    brand: 'Vesper',
    description:
      'Three single-coils and a tremolo for shimmering in-between tones and expressive dive bombs.',
    categorySlug: 'electric',
    priceDisplay: 1549,
    art: 'electric',
    finish: 'Surf Green',
    specs: [
      { label: 'Scale', value: '25.5"' },
      { label: 'Body', value: 'Alder' },
      { label: 'Pickups', value: '3× single-coil' },
      { label: 'Bridge', value: 'Vintage tremolo' },
    ],
  },
  {
    slug: 'nocturne-eclipse-lp',
    name: 'Eclipse LP',
    brand: 'Nocturne',
    description:
      'Mahogany body, maple cap, two humbuckers — thick sustain and a singing midrange for rock and blues.',
    categorySlug: 'electric',
    priceDisplay: 1899,
    art: 'electric',
    finish: 'Cherry Sunburst',
    specs: [
      { label: 'Scale', value: '24.75"' },
      { label: 'Body', value: 'Mahogany + maple' },
      { label: 'Pickups', value: '2× humbucker' },
      { label: 'Neck', value: 'Set mahogany' },
    ],
  },
  {
    slug: 'halcyon-drophawk-7',
    name: 'Drophawk 7',
    brand: 'Halcyon',
    description:
      'A seven-string built for low tunings: extended scale, active pickups, and a flat, fast neck.',
    categorySlug: 'electric',
    priceDisplay: 1749,
    art: 'electric',
    finish: 'Satin Black',
    specs: [
      { label: 'Scale', value: '26.5"' },
      { label: 'Strings', value: '7' },
      { label: 'Pickups', value: 'Active humbuckers' },
      { label: 'Body', value: 'Mahogany' },
    ],
  },
  {
    slug: 'sienna-dreadnought-d2',
    name: 'Dreadnought D-2',
    brand: 'Sienna',
    description: 'A big-voiced flat-top with a solid Sitka top — bold projection for strumming.',
    categorySlug: 'acoustic',
    priceDisplay: 899,
    art: 'acoustic',
    finish: 'Natural Satin',
    specs: [
      { label: 'Top', value: 'Solid Sitka spruce' },
      { label: 'Back', value: 'Mahogany' },
      { label: 'Scale', value: '25.5"' },
      { label: 'Strings', value: 'Steel' },
    ],
  },
  {
    slug: 'sienna-folk-om1',
    name: 'Folk OM-1',
    brand: 'Sienna',
    description: 'An orchestra model with balanced, fingerstyle-friendly response and a cedar top.',
    categorySlug: 'acoustic',
    priceDisplay: 1049,
    art: 'acoustic',
    finish: 'Cedar Natural',
    specs: [
      { label: 'Top', value: 'Solid cedar' },
      { label: 'Back', value: 'Rosewood' },
      { label: 'Scale', value: '25.4"' },
      { label: 'Nut', value: '1.75"' },
    ],
  },
  {
    slug: 'cordova-grand-auditorium-ga5',
    name: 'Grand Auditorium GA-5',
    brand: 'Cordova',
    description:
      'Versatile mid-size body — comfortable, articulate, and stage-ready with onboard pre-amp.',
    categorySlug: 'acoustic',
    priceDisplay: 1399,
    art: 'acoustic',
    finish: 'Vintage Sunburst',
    specs: [
      { label: 'Top', value: 'Solid spruce' },
      { label: 'Back', value: 'Ovangkol' },
      { label: 'Electronics', value: 'Pre-amp + tuner' },
      { label: 'Scale', value: '25.5"' },
    ],
  },
  {
    slug: 'cordova-maestro-c7',
    name: 'Maestro C-7',
    brand: 'Cordova',
    description:
      'A concert classical with a solid cedar top and Indian rosewood — warm, even, and responsive.',
    categorySlug: 'classical',
    priceDisplay: 1199,
    art: 'classical',
    finish: 'French Polish',
    specs: [
      { label: 'Top', value: 'Solid cedar' },
      { label: 'Back', value: 'Indian rosewood' },
      { label: 'Scale', value: '650 mm' },
      { label: 'Strings', value: 'Nylon' },
    ],
  },
  {
    slug: 'cordova-estudio-c3',
    name: 'Estudio C-3',
    brand: 'Cordova',
    description:
      'A dependable student classical that punches above its price — easy action, sweet tone.',
    categorySlug: 'classical',
    priceDisplay: 649,
    art: 'classical',
    finish: 'Natural Gloss',
    specs: [
      { label: 'Top', value: 'Solid spruce' },
      { label: 'Back', value: 'Mahogany' },
      { label: 'Scale', value: '650 mm' },
      { label: 'Strings', value: 'Nylon' },
    ],
  },
  {
    slug: 'cordova-flamenco-negra',
    name: 'Flamenco Negra',
    brand: 'Cordova',
    description:
      'Bright attack and fast response with cypress back and sides — built for rasgueado.',
    categorySlug: 'classical',
    priceDisplay: 1650,
    art: 'classical',
    finish: 'Cypress Natural',
    specs: [
      { label: 'Top', value: 'Solid spruce' },
      { label: 'Back', value: 'Cypress' },
      { label: 'Scale', value: '650 mm' },
      { label: 'Tap plate', value: 'Golpeador' },
    ],
  },
  {
    slug: 'ironwood-lowtide-p',
    name: 'Lowtide P',
    brand: 'Ironwood',
    description: 'A classic split-coil precision bass — round, punchy, and unkillable in the mix.',
    categorySlug: 'bass',
    priceDisplay: 1149,
    art: 'bass',
    finish: 'Olympic White',
    specs: [
      { label: 'Scale', value: '34"' },
      { label: 'Strings', value: '4' },
      { label: 'Pickup', value: 'Split-coil P' },
      { label: 'Body', value: 'Alder' },
    ],
  },
  {
    slug: 'vesper-groove-j5',
    name: 'Groove J5',
    brand: 'Vesper',
    description:
      'A five-string J-style with a slim neck and two single-coils for growl and clarity.',
    categorySlug: 'bass',
    priceDisplay: 1499,
    art: 'bass',
    finish: '3-Tone Sunburst',
    specs: [
      { label: 'Scale', value: '34"' },
      { label: 'Strings', value: '5' },
      { label: 'Pickups', value: '2× J single-coil' },
      { label: 'Body', value: 'Swamp ash' },
    ],
  },
];
