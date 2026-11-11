import { describe, expect, it } from 'vitest';
import { formatDate, formatPrice, formatQuantity } from '@/lib/format';

describe('formatPrice', () => {
  it('formats DZD amounts with Latin digits for every locale', () => {
    for (const locale of ['ar', 'fr', 'en'] as const) {
      const output = formatPrice('1250.50', locale);
      expect(output).toMatch(/1[.,\s]250/);
      expect(output).not.toMatch(/[\u0660-\u0669\u200e\u200f]/);
    }
  });

  it('accepts numbers and decimal strings alike', () => {
    expect(formatPrice(500, 'fr')).toBe(formatPrice('500', 'fr'));
  });

  it('rejects non-finite input instead of printing NaN', () => {
    expect(() => formatPrice('abc', 'ar')).toThrow();
    expect(() => formatPrice(Number.POSITIVE_INFINITY, 'ar')).toThrow();
  });
});

describe('formatQuantity', () => {
  it('keeps up to three decimals', () => {
    expect(formatQuantity('2.5', 'en')).toMatch(/2[.,]5/);
  });
});

describe('formatDate', () => {
  it('formats in the Africa/Algiers timezone', () => {
    const output = formatDate('2026-04-05T12:00:00Z', 'fr');
    expect(output).toContain('2026');
  });

  it('throws on invalid dates', () => {
    expect(() => formatDate('not-a-date', 'ar')).toThrow();
  });
});
