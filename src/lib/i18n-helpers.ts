import { hasLocale } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import { routing, type Locale } from '@/i18n/routing';

/** Narrows an untrusted route param to a supported locale. */
export function asLocale(value: string): Locale | null {
  return hasLocale(routing.locales, value) ? value : null;
}

export async function metaTranslator(locale: string) {
  const safeLocale = asLocale(locale);
  if (!safeLocale) return null;
  return getTranslations({ locale: safeLocale, namespace: 'meta' });
}
