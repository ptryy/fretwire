import type { MetadataRoute } from 'next';

import { SITE } from '@/lib/site';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/pay/', '/orders/', '/dev/'],
    },
    sitemap: `${SITE.url}/sitemap.xml`,
  };
}
