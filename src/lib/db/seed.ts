import data from '../catalog/products.json';

import { getDb } from './index';

/** Seed (or refresh) the catalog. Idempotent: upserts by `slug`. Run: `pnpm db:seed`. */
function seed(): void {
  const db = getDb();

  const insertCategory = db.prepare(
    'INSERT INTO categories (slug, name) VALUES (@slug, @name) ON CONFLICT(slug) DO UPDATE SET name = excluded.name',
  );
  const insertProduct = db.prepare(`
    INSERT INTO products (slug, name, description, category_slug, price_display, image)
    VALUES (@slug, @name, @description, @categorySlug, @priceDisplay, @image)
    ON CONFLICT(slug) DO UPDATE SET
      name = excluded.name,
      description = excluded.description,
      category_slug = excluded.category_slug,
      price_display = excluded.price_display,
      image = excluded.image
  `);

  const run = db.transaction(() => {
    for (const category of data.categories) insertCategory.run(category);
    for (const product of data.products) insertProduct.run(product);
  });
  run();

  console.log(
    `Seeded ${data.categories.length} categories, ${data.products.length} products into the catalog.`,
  );
}

seed();
