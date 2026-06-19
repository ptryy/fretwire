import { CATEGORIES, PRODUCTS, type Category, type Product } from './data';

export type { Category, Product, Spec, GuitarArt } from './data';

export function listCategories(): Category[] {
  return CATEGORIES;
}

export function getCategory(slug: string): Category | null {
  return CATEGORIES.find((c) => c.slug === slug) ?? null;
}

export function listProducts(opts: { categorySlug?: string; q?: string } = {}): Product[] {
  const q = opts.q?.trim().toLowerCase();
  return PRODUCTS.filter((p) => {
    if (opts.categorySlug && p.categorySlug !== opts.categorySlug) return false;
    if (q && !`${p.brand} ${p.name}`.toLowerCase().includes(q)) return false;
    return true;
  });
}

export function getProductBySlug(slug: string): Product | null {
  return PRODUCTS.find((p) => p.slug === slug) ?? null;
}

export function getProductsBySlugs(slugs: string[]): Product[] {
  const set = new Set(slugs);
  return PRODUCTS.filter((p) => set.has(p.slug));
}
