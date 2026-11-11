import type { CatalogRepository } from './catalog.repository';
import type {
  CategorySummary,
  Paginated,
  ProductDetail,
  ProductListQuery,
  ProductSummary,
  StoreDetail,
} from './types';

/**
 * Phase 2 implementation: the database does not exist yet, so the catalog is
 * genuinely empty. This is deliberate — no sample products, stores or reviews
 * are ever injected to make the UI look complete.
 */
export const emptyCatalogRepository: CatalogRepository = {
  async listCategories(): Promise<CategorySummary[]> {
    return [];
  },

  async listPublishedProducts(query: ProductListQuery): Promise<Paginated<ProductSummary>> {
    return { items: [], total: 0, page: query.page, pageSize: query.pageSize };
  },

  async findProductBySlug(): Promise<ProductDetail | null> {
    return null;
  },

  async findStoreBySlug(): Promise<StoreDetail | null> {
    return null;
  },
};
