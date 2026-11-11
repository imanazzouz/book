import type { CatalogRepository } from './catalog/catalog.repository';
import { createDrizzleCatalogRepository } from './catalog/drizzle-catalog.repository';
import { emptyCatalogRepository } from './catalog/empty-catalog.repository';
import { getDb, isDatabaseConfigured } from './db/client';

/**
 * Minimal composition root.
 *
 * When `DATABASE_URL` is configured the catalog reads from Postgres through
 * Drizzle. Without it (local UI work, preview builds) the app falls back to the
 * empty repository, which is honest: it renders real empty states instead of
 * inventing products. Both implementations satisfy the same interface, so no
 * page knows the difference.
 */
export interface Container {
  readonly catalog: CatalogRepository;
}

let catalog: CatalogRepository | null = null;

export const container: Container = {
  get catalog(): CatalogRepository {
    if (!catalog) {
      catalog = isDatabaseConfigured()
        ? createDrizzleCatalogRepository(getDb())
        : emptyCatalogRepository;
    }
    return catalog;
  },
};

/** Test seam: build a container around a specific repository. */
export function createContainer(overrides: Partial<Container> = {}): Container {
  return { catalog: overrides.catalog ?? container.catalog };
}

/** Only used by scripts and tests that need to swap the implementation. */
export function setCatalogRepository(repository: CatalogRepository | null): void {
  catalog = repository;
}
