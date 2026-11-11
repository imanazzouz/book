import { and, asc, desc, eq, isNull, sql, type SQL } from 'drizzle-orm';
import type { AnyDatabase } from '@/server/db/types';
import {
  categories,
  communes,
  farmerProfiles,
  inventoryItems,
  productImages,
  products,
  stores,
  wilayas,
} from '@/server/db/schema';
import type { CatalogRepository } from './catalog.repository';
import type {
  CatalogLocale,
  CategorySummary,
  Paginated,
  ProductDetail,
  ProductImage,
  ProductListQuery,
  ProductSummary,
  StoreDetail,
  WilayaSummary,
} from './types';

/**
 * Accent/case folding that matches the `app_normalize()` SQL function used by
 * the trigram indexes, so the JS-normalized pattern hits the index.
 */
export function normalizeSearchText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[\u064B-\u0652]/g, '') // Arabic harakat
    .toLowerCase();
}

function localized(locale: CatalogLocale, values: { ar: string; fr: string; en: string }): string {
  return values[locale] || values.ar;
}

type ImageInput = {
  url: string | null;
  altAr: string | null;
  altFr: string | null;
  altEn: string | null;
  width: number | null;
  height: number | null;
};

function toImage(row: ImageInput | null, locale: CatalogLocale): ProductImage | null {
  if (!row?.url) return null;
  return {
    url: row.url,
    alt: localized(locale, { ar: row.altAr ?? '', fr: row.altFr ?? '', en: row.altEn ?? '' }),
    width: row.width ?? 0,
    height: row.height ?? 0,
  };
}

function money(value: string | number | null): string {
  return value === null ? '0.00' : String(value);
}

/** Only published products from active, non-deleted stores are ever public. */
function visibleProductCondition(): SQL {
  return and(
    eq(products.status, 'published'),
    isNull(products.deletedAt),
    eq(stores.status, 'active'),
    isNull(stores.deletedAt),
  )!;
}

const productColumns = {
  id: products.id,
  slug: products.slug,
  name: products.name,
  price: products.price,
  unit: products.unit,
  publishedAt: products.publishedAt,
  storeName: stores.name,
  storeSlug: stores.slug,
  wilayaNameAr: wilayas.nameAr,
  wilayaNameFr: wilayas.nameFr,
  wilayaNameEn: wilayas.nameEn,
  imageUrl: productImages.url,
  imageAltAr: productImages.altAr,
  imageAltFr: productImages.altFr,
  imageAltEn: productImages.altEn,
  imageWidth: productImages.width,
  imageHeight: productImages.height,
};

type ProductRow = {
  id: string;
  slug: string;
  name: string;
  price: string;
  unit: ProductSummary['unit'];
  publishedAt: Date | null;
  storeName: string;
  storeSlug: string;
  wilayaNameAr: string | null;
  wilayaNameFr: string | null;
  wilayaNameEn: string | null;
  imageUrl: string | null;
  imageAltAr: string | null;
  imageAltFr: string | null;
  imageAltEn: string | null;
  imageWidth: number | null;
  imageHeight: number | null;
};

function toSummary(row: ProductRow, locale: CatalogLocale): ProductSummary {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    priceDzd: money(row.price),
    unit: row.unit,
    storeName: row.storeName,
    storeSlug: row.storeSlug,
    wilayaName:
      row.wilayaNameAr === null
        ? null
        : localized(locale, {
            ar: row.wilayaNameAr,
            fr: row.wilayaNameFr ?? row.wilayaNameAr,
            en: row.wilayaNameEn ?? row.wilayaNameAr,
          }),
    image: toImage(
      {
        url: row.imageUrl,
        altAr: row.imageAltAr,
        altFr: row.imageAltFr,
        altEn: row.imageAltEn,
        width: row.imageWidth,
        height: row.imageHeight,
      },
      locale,
    ),
    publishedAt: (row.publishedAt ?? new Date(0)).toISOString(),
  };
}

export function createDrizzleCatalogRepository(db: AnyDatabase): CatalogRepository {
  /** Shared product query; `storeId` narrows it for the store page. */
  async function queryProducts(
    query: ProductListQuery,
    locale: CatalogLocale,
    storeId?: string,
  ): Promise<Paginated<ProductSummary>> {
    const conditions: SQL[] = [visibleProductCondition()];

    if (storeId) conditions.push(eq(products.storeId, storeId));
    if (query.categorySlug) conditions.push(eq(categories.slug, query.categorySlug));
    if (query.wilayaCode) conditions.push(eq(stores.wilayaCode, query.wilayaCode));
    if (query.maxPriceDzd) {
      conditions.push(sql`${products.price} <= ${query.maxPriceDzd}::numeric`);
    }
    if (query.q) {
      const pattern = `%${normalizeSearchText(query.q)}%`;
      conditions.push(
        sql`(
          app_normalize(${products.name}) LIKE ${pattern}
          OR app_normalize(${products.description}) LIKE ${pattern}
          OR app_normalize(${stores.name}) LIKE ${pattern}
        )`,
      );
    }

    const where = and(...conditions)!;

    const orderBy =
      query.sort === 'price_asc'
        ? [asc(products.price), desc(products.publishedAt)]
        : query.sort === 'price_desc'
          ? [desc(products.price), desc(products.publishedAt)]
          : [desc(products.publishedAt), desc(products.id)];

    const rows = await db
      .select(productColumns)
      .from(products)
      .innerJoin(stores, eq(stores.id, products.storeId))
      .innerJoin(categories, eq(categories.id, products.categoryId))
      .leftJoin(wilayas, eq(wilayas.code, stores.wilayaCode))
      .leftJoin(
        productImages,
        and(eq(productImages.productId, products.id), eq(productImages.sortOrder, 0)),
      )
      .where(where)
      .orderBy(...orderBy)
      .limit(query.pageSize)
      .offset((query.page - 1) * query.pageSize);

    const [countRow] = await db
      .select({ total: sql<number>`count(*)::int` })
      .from(products)
      .innerJoin(stores, eq(stores.id, products.storeId))
      .innerJoin(categories, eq(categories.id, products.categoryId))
      .where(where);

    return {
      items: rows.map((row) => toSummary(row as ProductRow, locale)),
      total: countRow?.total ?? 0,
      page: query.page,
      pageSize: query.pageSize,
    };
  }

  return {
    async listCategories(): Promise<CategorySummary[]> {
      const rows = await db
        .select({
          slug: categories.slug,
          productCount: sql<number>`(count(${products.id}) FILTER (WHERE ${stores.status} = 'active' AND ${stores.deletedAt} IS NULL))::int`,
        })
        .from(categories)
        .leftJoin(
          products,
          and(
            eq(products.categoryId, categories.id),
            eq(products.status, 'published'),
            isNull(products.deletedAt),
          ),
        )
        .leftJoin(stores, eq(stores.id, products.storeId))
        .where(and(eq(categories.isActive, true), isNull(categories.deletedAt)))
        .groupBy(categories.slug, categories.sortOrder)
        .orderBy(asc(categories.sortOrder), asc(categories.slug));

      return rows.map((row) => ({ slug: row.slug, productCount: row.productCount ?? 0 }));
    },

    async listWilayas(locale = 'ar'): Promise<WilayaSummary[]> {
      const rows = await db
        .select({
          code: wilayas.code,
          nameAr: wilayas.nameAr,
          nameFr: wilayas.nameFr,
          nameEn: wilayas.nameEn,
        })
        .from(wilayas)
        .orderBy(asc(wilayas.sortOrder), asc(wilayas.code));

      return rows.map((row) => ({
        code: row.code,
        name: localized(locale, {
          ar: row.nameAr,
          fr: row.nameFr,
          en: row.nameEn,
        }),
      }));
    },

    listPublishedProducts(query, locale = 'ar') {
      return queryProducts(query, locale);
    },

    async findProductBySlug(slug, locale = 'ar'): Promise<ProductDetail | null> {
      const [row] = await db
        .select({
          ...productColumns,
          description: products.description,
          minOrderQty: products.minOrderQty,
          isOrganic: products.isOrganic,
          supportsPickup: products.supportsPickup,
          supportsDelivery: products.supportsDelivery,
          categorySlug: categories.slug,
          quantityAvailable: inventoryItems.quantityAvailable,
        })
        .from(products)
        .innerJoin(stores, eq(stores.id, products.storeId))
        .innerJoin(categories, eq(categories.id, products.categoryId))
        .leftJoin(wilayas, eq(wilayas.code, stores.wilayaCode))
        .leftJoin(
          productImages,
          and(eq(productImages.productId, products.id), eq(productImages.sortOrder, 0)),
        )
        .leftJoin(inventoryItems, eq(inventoryItems.productId, products.id))
        .where(and(eq(products.slug, slug), visibleProductCondition()))
        .limit(1);

      if (!row) return null;

      const images = await db
        .select({
          url: productImages.url,
          altAr: productImages.altAr,
          altFr: productImages.altFr,
          altEn: productImages.altEn,
          width: productImages.width,
          height: productImages.height,
        })
        .from(productImages)
        .where(eq(productImages.productId, row.id))
        .orderBy(asc(productImages.sortOrder));

      const summary = toSummary(row as ProductRow, locale);

      return {
        ...summary,
        description: row.description,
        quantityAvailable: money(row.quantityAvailable ?? '0'),
        minOrderQuantity: money(row.minOrderQty),
        categorySlug: row.categorySlug,
        isOrganic: row.isOrganic,
        supportsPickup: row.supportsPickup,
        supportsDelivery: row.supportsDelivery,
        images: images
          .map((image) => toImage(image, locale))
          .filter((image): image is ProductImage => image !== null),
      };
    },

    async findStoreBySlug(slug, locale = 'ar'): Promise<StoreDetail | null> {
      const [row] = await db
        .select({
          id: stores.id,
          slug: stores.slug,
          name: stores.name,
          description: stores.description,
          isPickupEnabled: stores.isPickupEnabled,
          deliveryNotes: stores.deliveryNotes,
          farmerId: stores.farmerId,
          logoUrl: stores.logoUrl,
          coverUrl: stores.coverUrl,
          wilayaCode: stores.wilayaCode,
          wilayaNameAr: wilayas.nameAr,
          wilayaNameFr: wilayas.nameFr,
          wilayaNameEn: wilayas.nameEn,
          communeNameAr: communes.nameAr,
          communeNameFr: communes.nameFr,
          communeNameEn: communes.nameEn,
        })
        .from(stores)
        .leftJoin(wilayas, eq(wilayas.code, stores.wilayaCode))
        .leftJoin(communes, eq(communes.code, stores.communeCode))
        .where(and(eq(stores.slug, slug), eq(stores.status, 'active'), isNull(stores.deletedAt)))
        .limit(1);

      if (!row) return null;

      const productPage = await queryProducts(
        { sort: 'newest', page: 1, pageSize: 48 },
        locale,
        row.id,
      );

      const verified = await db
        .select({ id: farmerProfiles.id })
        .from(farmerProfiles)
        .where(
          and(
            eq(farmerProfiles.userId, row.farmerId),
            eq(farmerProfiles.verificationStatus, 'approved'),
          ),
        )
        .limit(1);

      return {
        id: row.id,
        slug: row.slug,
        name: row.name,
        description: row.description,
        wilayaName:
          row.wilayaNameAr === null
            ? null
            : localized(locale, {
                ar: row.wilayaNameAr,
                fr: row.wilayaNameFr ?? row.wilayaNameAr,
                en: row.wilayaNameEn ?? row.wilayaNameAr,
              }),
        communeName:
          row.communeNameAr === null
            ? null
            : localized(locale, {
                ar: row.communeNameAr,
                fr: row.communeNameFr ?? row.communeNameAr,
                en: row.communeNameEn ?? row.communeNameAr,
              }),
        isVerified: verified.length > 0,
        supportsPickup: row.isPickupEnabled,
        deliveryNotes: row.deliveryNotes,
        logo: row.logoUrl ? { url: row.logoUrl, alt: row.name, width: 200, height: 200 } : null,
        cover: row.coverUrl ? { url: row.coverUrl, alt: row.name, width: 1200, height: 600 } : null,
        products: productPage.items,
      };
    },
  };
}
