import type {
  CatalogLocale,
  CategorySummary,
  Paginated,
  ProductDetail,
  ProductListQuery,
  ProductSummary,
  StoreDetail,
  WilayaSummary,
} from './types';

/**
 * Read contract for the marketplace. The Drizzle implementation
 * (drizzle-catalog.repository.ts) replaces the empty one without touching pages
 * or use cases beyond passing the locale they already know.
 */
export interface CatalogRepository {
  listCategories(): Promise<CategorySummary[]>;
  /** Official wilaya list for the market filters (69 entries, localized). */
  listWilayas(locale?: CatalogLocale): Promise<WilayaSummary[]>;
  listPublishedProducts(
    query: ProductListQuery,
    locale?: CatalogLocale,
  ): Promise<Paginated<ProductSummary>>;
  findProductBySlug(slug: string, locale?: CatalogLocale): Promise<ProductDetail | null>;
  findStoreBySlug(slug: string, locale?: CatalogLocale): Promise<StoreDetail | null>;
}
