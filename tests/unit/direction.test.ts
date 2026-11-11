import { describe, expect, it } from 'vitest';
import { getDirection, isRtl } from '@/lib/direction';
import { isLocale, localeLabels, routing } from '@/i18n/routing';

describe('locale direction', () => {
  it('renders Arabic RTL and French/English LTR', () => {
    expect(getDirection('ar')).toBe('rtl');
    expect(getDirection('fr')).toBe('ltr');
    expect(getDirection('en')).toBe('ltr');
    expect(isRtl('ar')).toBe(true);
    expect(isRtl('fr')).toBe(false);
  });

  it('exposes exactly the three supported locales with labels', () => {
    expect(routing.locales).toEqual(['ar', 'fr', 'en']);
    for (const locale of routing.locales) {
      expect(localeLabels[locale].length).toBeGreaterThan(0);
    }
  });

  it('guards against unsupported locales', () => {
    expect(isLocale('de')).toBe(false);
    expect(isLocale('ar')).toBe(true);
  });
});
