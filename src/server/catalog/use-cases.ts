import type { CatalogRepository } from './catalog.repository';
import {
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  type CatalogSort,
  type Paginated,
  type ProductListQuery,
  type ProductSummary,
} from './types';

const SORTS: readonly CatalogSort[] = ['newest', 'price_asc', 'price_desc'];

export interface RawMarketSearchParams {
  q?: string | string[];
  category?: string | string[];
  wilaya?: string | string[];
  maxPrice?: string | string[];
  sort?: string | string[];
  page?: string | string[];
}

function firstValue(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

function toPositiveInt(value: string | undefined, fallback: number, max: number): number {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return Math.min(parsed, max);
}

function normalizeText(value: string | undefined, maxLength: number): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed.slice(0, maxLength) : undefined;
}

/**
 * Normalizes untrusted URL search params into a validated query object.
 * Unknown sorts fall back to `newest`; page sizes are clamped server-side.
 */
export function parseMarketSearchParams(params: RawMarketSearchParams): ProductListQuery {
  const sortCandidate = firstValue(params.sort);
  const sort = SORTS.find((value) => value === sortCandidate) ?? 'newest';

  const maxPriceRaw = normalizeText(firstValue(params.maxPrice), 12);
  const maxPriceNumber = maxPriceRaw ? Number(maxPriceRaw) : Number.NaN;
  const maxPriceDzd =
    Number.isFinite(maxPriceNumber) && maxPriceNumber > 0
      ? maxPriceNumber.toFixed(2)
      : undefined;

  const query: ProductListQuery = {
    sort,
    page: toPositiveInt(firstValue(params.page), 1, 10_000),
    pageSize: DEFAULT_PAGE_SIZE,
  };

  const q = normalizeText(firstValue(params.q), 80);
  const categorySlug = normalizeText(firstValue(params.category), 40);
  const wilayaCode = normalizeText(firstValue(params.wilaya), 3);

  if (q) query.q = q;
  if (categorySlug) query.categorySlug = categorySlug;
  if (wilayaCode) query.wilayaCode = wilayaCode;
  if (maxPriceDzd) query.maxPriceDzd = maxPriceDzd;

  return query;
}

export function searchMarket(
  repository: CatalogRepository,
  query: ProductListQuery,
): Promise<Paginated<ProductSummary>> {
  const safeQuery: ProductListQuery = {
    ...query,
    pageSize: Math.min(Math.max(query.pageSize, 1), MAX_PAGE_SIZE),
  };
  return repository.listPublishedProducts(safeQuery);
}
