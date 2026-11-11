import { describe, expect, it } from 'vitest';
import { CATEGORY_SEED, findCategorySeed } from '@/config/catalog';

describe('bootstrap taxonomy', () => {
  it('has unique, URL-safe slugs', () => {
    const slugs = CATEGORY_SEED.map((category) => category.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const slug of slugs) {
      expect(slug).toMatch(/^[a-z0-9-]+$/);
    }
  });

  it('translates every category into all three languages', () => {
    for (const category of CATEGORY_SEED) {
      expect(category.name.ar.length).toBeGreaterThan(0);
      expect(category.name.fr.length).toBeGreaterThan(0);
      expect(category.name.en.length).toBeGreaterThan(0);
    }
  });

  it('resolves known slugs only', () => {
    expect(findCategorySeed('vegetables')?.slug).toBe('vegetables');
    expect(findCategorySeed('unknown-category')).toBeUndefined();
  });

  it('contains no product, store, user or order sample data', () => {
    for (const category of CATEGORY_SEED) {
      expect(Object.keys(category)).toEqual(['slug', 'icon', 'name']);
    }
  });
});
