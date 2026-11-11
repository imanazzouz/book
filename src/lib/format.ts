import type { Locale } from '@/i18n/routing';

const INTL_LOCALES: Record<Locale, string> = {
  ar: 'ar-DZ',
  fr: 'fr-DZ',
  en: 'en-DZ',
};

const CURRENCY = 'DZD';

/**
 * Money is stored and transported as a decimal string. Formatting happens only
 * at the presentation edge, with Latin digits for consistency across locales.
 */
export function formatPrice(amount: string | number, locale: Locale): string {
  const value = typeof amount === 'string' ? Number(amount) : amount;
  if (!Number.isFinite(value)) {
    throw new Error('formatPrice: amount is not a finite number');
  }

  const formatted = new Intl.NumberFormat(INTL_LOCALES[locale], {
    style: 'currency',
    currency: CURRENCY,
    numberingSystem: 'latn',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);

  // Strip bidi control characters: the UI sets its own direction per element.
  return formatted.replace(/[\u200e\u200f]/g, '');
}

export function formatQuantity(amount: string | number, locale: Locale): string {
  const value = typeof amount === 'string' ? Number(amount) : amount;
  if (!Number.isFinite(value)) {
    throw new Error('formatQuantity: amount is not a finite number');
  }

  return new Intl.NumberFormat(INTL_LOCALES[locale], {
    numberingSystem: 'latn',
    maximumFractionDigits: 3,
  }).format(value);
}

export function formatDate(
  date: Date | string,
  locale: Locale,
  options: Intl.DateTimeFormatOptions = { dateStyle: 'medium' },
): string {
  const value = typeof date === 'string' ? new Date(date) : date;
  if (Number.isNaN(value.getTime())) {
    throw new Error('formatDate: invalid date');
  }

  return new Intl.DateTimeFormat(INTL_LOCALES[locale], {
    timeZone: 'Africa/Algiers',
    numberingSystem: 'latn',
    ...options,
  }).format(value);
}
