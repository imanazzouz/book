import { Sprout } from 'lucide-react';
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { ButtonLink } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { EmptyState } from '@/components/ui/empty-state';
import { ProductCard } from '@/components/ui/product-card';
import { findCategorySeed } from '@/config/catalog';
import { Link } from '@/i18n/navigation';
import { asLocale } from '@/lib/i18n-helpers';
import { container } from '@/server/container';
import { searchMarket } from '@/server/catalog/use-cases';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const category = findCategorySeed(slug);
  if (!category) notFound();

  const localeKey = (['ar', 'fr', 'en'] as const).find((value) => value === locale) ?? 'ar';

  return {
    title: `${category.name[localeKey]} — AgriDirect`,
    description: category.name[localeKey],
    alternates: { canonical: `/${locale}/category/${slug}` },
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: rawLocale, slug } = await params;
  const locale = asLocale(rawLocale);
  if (!locale) notFound();
  setRequestLocale(locale);

  const category = findCategorySeed(slug);
  if (!category) notFound();

  const result = await searchMarket(container.catalog, {
    categorySlug: slug,
    sort: 'newest',
    page: 1,
    pageSize: 12,
  });

  const t = await getTranslations('categories');
  const tCommon = await getTranslations('common');

  return (
    <Container className="py-10 sm:py-14">
      <nav aria-label={tCommon('search')} className="text-xs text-muted">
        <Link href="/categories" className="hover:text-forest">
          {t('title')}
        </Link>
        <span aria-hidden> / </span>
        <span className="font-semibold text-forest-deep">{category.name[locale]}</span>
      </nav>

      <h1 className="mt-4 text-3xl font-extrabold text-forest-deep sm:text-4xl">
        {category.name[locale]}
      </h1>

      <div className="mt-9">
        {result.items.length === 0 ? (
          <EmptyState
            icon={<Sprout className="size-7" aria-hidden />}
            title={t('emptyTitle')}
            body={t('emptyBody')}
            actions={
              <>
                <ButtonLink href="/market" variant="outline">
                  {tCommon('viewAll')}
                </ButtonLink>
                <ButtonLink href="/join-farmer">{tCommon('apply')}</ButtonLink>
              </>
            }
          />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {result.items.map((product) => (
              <ProductCard key={product.id} product={product} locale={locale} />
            ))}
          </div>
        )}
      </div>
    </Container>
  );
}
