import type {
  CategorySummary,
  Paginated,
  ProductDetail,
  ProductListQuery,
  ProductSummary,
  StoreDetail,
} from './types';

/**
 * Read contract for the marketplace. The Prisma implementation replaces the
 * empty one in phase 3 without touching pages or use cases.
 */
export interface CatalogRepository {
  listCategories(): Promise<CategorySummary[]>;
  listPublishedProducts(query: ProductListQuery): Promise<Paginated<ProductSummary>>;
  findProductBySlug(slug: string): Promise<ProductDetail | null>;
  findStoreBySlug(slug: string): Promise<StoreDetail | null>;
}
