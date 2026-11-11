import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { CategoryCard } from '@/components/ui/category-card';
import { Container } from '@/components/ui/container';
import { CATEGORY_SEED } from '@/config/catalog';
import { asLocale, metaTranslator } from '@/lib/i18n-helpers';
import { pageMetadata } from '@/lib/page-metadata';
import { container } from '@/server/container';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await metaTranslator(locale);
  if (!t) return {};
  return pageMetadata({
    locale,
    path: '/categories',
    title: t('categoriesTitle'),
    description: t('marketDescription'),
  });
}

export default async function CategoriesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale = asLocale(rawLocale);
  if (!locale) notFound();
  setRequestLocale(locale);

  const t = await getTranslations('categories');
  const categories = await container.catalog.listCategories();
  const counts = new Map(categories.map((category) => [category.slug, category.productCount]));

  return (
    <Container className="py-10 sm:py-14">
      <div className="max-w-2xl">
        <h1 className="text-3xl font-extrabold text-forest-deep sm:text-4xl">{t('title')}</h1>
        <p className="mt-3 text-base leading-relaxed text-muted">{t('subtitle')}</p>
      </div>

      <div className="mt-9 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {CATEGORY_SEED.map((category) => (
          <CategoryCard
            key={category.slug}
            category={category}
            locale={locale}
            {...(counts.has(category.slug) ? { count: counts.get(category.slug) ?? 0 } : {})}
          />
        ))}
      </div>

      <p className="mt-8 max-w-2xl text-xs leading-relaxed text-muted">{t('emptyBody')}</p>
    </Container>
  );
}
