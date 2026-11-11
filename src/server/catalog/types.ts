/**
 * Transport types for the catalog. Money and quantities are decimal strings so
 * no binary floating point value ever crosses the server/client boundary.
 */
export type SaleUnit = 'kg' | 'g' | 'piece' | 'box' | 'bunch' | 'liter' | 'quintal';

export type ProductStatus = 'draft' | 'pending_review' | 'published' | 'out_of_stock' | 'archived';

export type CatalogSort = 'newest' | 'price_asc' | 'price_desc';

export interface ProductImage {
  url: string;
  alt: string;
  width: number;
  height: number;
}

export interface ProductSummary {
  id: string;
  slug: string;
  name: string;
  priceDzd: string;
  unit: SaleUnit;
  storeName: string;
  storeSlug: string;
  wilayaName: string | null;
  image: ProductImage | null;
  publishedAt: string;
}

export interface ProductDetail extends ProductSummary {
  description: string;
  quantityAvailable: string;
  minOrderQuantity: string;
  categorySlug: string;
  isOrganic: boolean;
  supportsPickup: boolean;
  supportsDelivery: boolean;
  images: ProductImage[];
}

export interface StoreDetail {
  id: string;
  slug: string;
  name: string;
  description: string;
  wilayaName: string | null;
  communeName: string | null;
  isVerified: boolean;
  supportsPickup: boolean;
  deliveryNotes: string | null;
  logo: ProductImage | null;
  cover: ProductImage | null;
  products: ProductSummary[];
}

export interface CategorySummary {
  slug: string;
  productCount: number;
}

export interface ProductListQuery {
  q?: string;
  categorySlug?: string;
  wilayaCode?: string;
  maxPriceDzd?: string;
  sort: CatalogSort;
  page: number;
  pageSize: number;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export const DEFAULT_PAGE_SIZE = 12;
export const MAX_PAGE_SIZE = 48;
