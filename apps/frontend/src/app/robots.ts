import type { MetadataRoute } from 'next';

const base = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3011';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/account/', '/dashboard', '/login'],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
