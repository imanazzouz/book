import { localeDirections, type Locale } from '@/i18n/routing';

export function getDirection(locale: Locale): 'rtl' | 'ltr' {
  return localeDirections[locale];
}

export function isRtl(locale: Locale): boolean {
  return getDirection(locale) === 'rtl';
}
