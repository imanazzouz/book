import type { MetadataRoute } from 'next';
import { routing } from '@/i18n/routing';

const baseUrl = process.env.APP_URL ?? 'http://localhost:3000';

const PUBLIC_PATHS = [
  '',
  '/market',
  '/categories',
  '/about',
  '/contact',
  '/faq',
  '/join-farmer',
  '/legal/privacy',
  '/legal/terms',
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  return routing.locales.flatMap((locale) =>
    PUBLIC_PATHS.map((path) => ({
      url: `${baseUrl}/${locale}${path}`,
      changeFrequency: path === '' || path === '/market' ? ('daily' as const) : ('monthly' as const),
      priority: path === '' ? 1 : 0.7,
      alternates: {
        languages: Object.fromEntries(
          routing.locales.map((value) => [value, `${baseUrl}/${value}${path}`]),
        ),
      },
    })),
  );
}
