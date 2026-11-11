import type { Metadata } from 'next';
import { routing } from '@/i18n/routing';

export function pageMetadata({
  locale,
  path,
  title,
  description,
}: {
  locale: string;
  path: string;
  title: string;
  description: string;
}): Metadata {
  return {
    title,
    description,
    alternates: {
      canonical: `/${locale}${path}`,
      languages: Object.fromEntries(routing.locales.map((value) => [value, `/${value}${path}`])),
    },
  };
}
