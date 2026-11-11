import { getTranslations } from 'next-intl/server';
import type { Locale } from '@/i18n/routing';
import { CATEGORY_SEED } from '@/config/catalog';
import type { CategorySummary } from '@/server/catalog/types';
import { ButtonLink } from '@/components/ui/button';
import { CategoryCard } from '@/components/ui/category-card';
import { Container } from '@/components/ui/container';
import { SectionHeading } from '@/components/ui/section-heading';

export async function CategorySection({
  locale,
  categories,
}: {
  locale: Locale;
  categories: CategorySummary[];
}) {
  const t = await getTranslations('home.categories');
  const counts = new Map(categories.map((category) => [category.slug, category.productCount]));

  return (
    <section className="py-16 sm:py-20">
      <Container>
        <SectionHeading
          title={t('title')}
          subtitle={t('subtitle')}
          action={
            <ButtonLink href="/categories" variant="ghost" size="sm">
              {t('browseAll')}
            </ButtonLink>
          }
        />
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
      </Container>
    </section>
  );
}
