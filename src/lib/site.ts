const url =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

/** Brand + canonical-URL constants, single source of truth for SEO + chrome. */
export const SITE = {
  name: 'Fretwire',
  tagline: 'Guitars, end to end',
  description:
    'A modern guitar shop — electric, acoustic, classical, and bass — with fast crypto checkout.',
  url,
} as const;
