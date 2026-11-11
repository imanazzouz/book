import type { CatalogRepository } from './catalog/catalog.repository';
import { emptyCatalogRepository } from './catalog/empty-catalog.repository';

/**
 * Minimal composition root. Phase 3 swaps the catalog implementation for the
 * Prisma one here; nothing else in the app needs to change.
 */
export interface Container {
  catalog: CatalogRepository;
}

export const container: Container = {
  catalog: emptyCatalogRepository,
};
