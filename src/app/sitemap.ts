import type { MetadataRoute } from 'next';

import { listProducts } from '@/lib/catalog';
import { SITE } from '@/lib/site';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = SITE.url;
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: base, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/products`, changeFrequency: 'weekly', priority: 0.8 },
  ];
  const products: MetadataRoute.Sitemap = listProducts().map((p) => ({
    url: `${base}/products/${p.slug}`,
    changeFrequency: 'monthly',
    priority: 0.6,
  }));
  return [...staticRoutes, ...products];
}
