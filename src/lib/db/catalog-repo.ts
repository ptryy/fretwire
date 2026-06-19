import { getDb } from './index';

export type Category = { id: number; slug: string; name: string };

export type Product = {
  id: number;
  slug: string;
  name: string;
  description: string;
  categorySlug: string;
  priceDisplay: number;
  image: string;
};

type ProductRow = {
  id: number;
  slug: string;
  name: string;
  description: string;
  category_slug: string;
  price_display: number;
  image: string;
};

const toProduct = (r: ProductRow): Product => ({
  id: r.id,
  slug: r.slug,
  name: r.name,
  description: r.description,
  categorySlug: r.category_slug,
  priceDisplay: r.price_display,
  image: r.image,
});

export function listCategories(): Category[] {
  return getDb().prepare('SELECT id, slug, name FROM categories ORDER BY name').all() as Category[];
}

export function listProducts(opts: { categorySlug?: string; q?: string } = {}): Product[] {
  const clauses: string[] = [];
  const params: Record<string, string> = {};
  if (opts.categorySlug) {
    clauses.push('category_slug = @category');
    params.category = opts.categorySlug;
  }
  if (opts.q) {
    clauses.push('name LIKE @q');
    params.q = `%${opts.q}%`;
  }
  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const stmt = getDb().prepare(`SELECT * FROM products ${where} ORDER BY name`);
  const rows = (Object.keys(params).length ? stmt.all(params) : stmt.all()) as ProductRow[];
  return rows.map(toProduct);
}

export function getProductBySlug(slug: string): Product | null {
  const row = getDb().prepare('SELECT * FROM products WHERE slug = ?').get(slug) as
    | ProductRow
    | undefined;
  return row ? toProduct(row) : null;
}

export function getProductsBySlugs(slugs: string[]): Product[] {
  if (slugs.length === 0) return [];
  const placeholders = slugs.map(() => '?').join(', ');
  const rows = getDb()
    .prepare(`SELECT * FROM products WHERE slug IN (${placeholders})`)
    .all(...slugs) as ProductRow[];
  return rows.map(toProduct);
}
