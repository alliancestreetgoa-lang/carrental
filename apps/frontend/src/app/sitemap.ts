import type { MetadataRoute } from 'next';

const base = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3011';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${base}/cars`, lastModified: new Date(), changeFrequency: 'hourly', priority: 0.9 },
    { url: `${base}/account/login`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
    { url: `${base}/account/register`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
  ];

  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4055/api';
    const res = await fetch(`${apiUrl}/portal/cars`, { next: { revalidate: 3600 } });
    if (!res.ok) return staticRoutes;
    const json = await res.json();
    const cars: Array<{ id: string }> = json?.data ?? [];
    const carRoutes: MetadataRoute.Sitemap = cars.map((c) => ({
      url: `${base}/cars/${c.id}`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.8,
    }));
    return [...staticRoutes, ...carRoutes];
  } catch {
    return staticRoutes;
  }
}
