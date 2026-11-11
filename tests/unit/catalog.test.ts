import { describe, expect, it } from 'vitest';
import { container } from '@/server/container';
import { parseMarketSearchParams, searchMarket } from '@/server/catalog/use-cases';
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '@/server/catalog/types';

describe('parseMarketSearchParams', () => {
  it('falls back to newest and page 1 for empty input', () => {
    const query = parseMarketSearchParams({});
    expect(query).toEqual({ sort: 'newest', page: 1, pageSize: DEFAULT_PAGE_SIZE });
  });

  it('ignores unknown sort values instead of trusting them', () => {
    expect(parseMarketSearchParams({ sort: 'DROP TABLE products' }).sort).toBe('newest');
  });

  it('clamps invalid pages and keeps valid ones', () => {
    expect(parseMarketSearchParams({ page: '0' }).page).toBe(1);
    expect(parseMarketSearchParams({ page: '-4' }).page).toBe(1);
    expect(parseMarketSearchParams({ page: 'abc' }).page).toBe(1);
    expect(parseMarketSearchParams({ page: '3' }).page).toBe(3);
  });

  it('rejects non-positive max price and normalizes valid ones', () => {
    expect(parseMarketSearchParams({ maxPrice: '-10' }).maxPriceDzd).toBeUndefined();
    expect(parseMarketSearchParams({ maxPrice: '0' }).maxPriceDzd).toBeUndefined();
    expect(parseMarketSearchParams({ maxPrice: '1200' }).maxPriceDzd).toBe('1200.00');
  });

  it('trims and truncates free text so the DB never sees unbounded input', () => {
    const long = 'a'.repeat(500);
    const query = parseMarketSearchParams({ q: `  ${long}  ` });
    expect(query.q).toHaveLength(80);
    expect(parseMarketSearchParams({ q: '   ' }).q).toBeUndefined();
  });

  it('takes the first value when a param repeats', () => {
    expect(parseMarketSearchParams({ q: ['tomate', 'carotte'] }).q).toBe('tomate');
  });
});

describe('searchMarket', () => {
  it('returns a well-formed empty page on the phase-2 repository', async () => {
    const result = await searchMarket(container.catalog, {
      sort: 'newest',
      page: 2,
      pageSize: 500,
    });
    expect(result.items).toEqual([]);
    expect(result.total).toBe(0);
    expect(result.page).toBe(2);
    expect(result.pageSize).toBe(MAX_PAGE_SIZE);
  });

  it('never returns products for a product slug while the DB is absent', async () => {
    await expect(container.catalog.findProductBySlug('anything')).resolves.toBeNull();
    await expect(container.catalog.findStoreBySlug('anything')).resolves.toBeNull();
    await expect(container.catalog.listCategories()).resolves.toEqual([]);
  });
});
