/**
 * Canonical bootstrap taxonomy.
 *
 * This is platform configuration, not sample data: phase 3 seeds `categories`
 * from this exact list, so the UI and the database stay in sync without
 * duplication. It contains no products, stores, users or reviews.
 */
export type CategoryIcon =
  | 'carrot'
  | 'apple'
  | 'palm'
  | 'wheat'
  | 'droplet'
  | 'bean'
  | 'sprout'
  | 'hexagon';

export interface CategorySeed {
  slug: string;
  icon: CategoryIcon;
  name: { ar: string; fr: string; en: string };
}

export const CATEGORY_SEED: readonly CategorySeed[] = [
  { slug: 'vegetables', icon: 'carrot', name: { ar: 'خضروات', fr: 'Légumes', en: 'Vegetables' } },
  { slug: 'fruits', icon: 'apple', name: { ar: 'فواكه', fr: 'Fruits', en: 'Fruits' } },
  { slug: 'dates', icon: 'palm', name: { ar: 'تمور', fr: 'Dattes', en: 'Dates' } },
  { slug: 'grains', icon: 'wheat', name: { ar: 'حبوب', fr: 'Céréales', en: 'Grains' } },
  { slug: 'oils', icon: 'droplet', name: { ar: 'زيوت', fr: 'Huiles', en: 'Oils' } },
  { slug: 'legumes', icon: 'bean', name: { ar: 'بقوليات', fr: 'Légumineuses', en: 'Legumes' } },
  { slug: 'herbs-spices', icon: 'sprout', name: { ar: 'أعشاب وتوابل', fr: 'Herbes et épices', en: 'Herbs & spices' } },
  { slug: 'honey', icon: 'hexagon', name: { ar: 'عسل', fr: 'Miel', en: 'Honey' } },
] as const;

export function findCategorySeed(slug: string): CategorySeed | undefined {
  return CATEGORY_SEED.find((category) => category.slug === slug);
}
