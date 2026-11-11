import { Sprout } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import type { Locale } from '@/i18n/routing';
import type { ProductSummary } from '@/server/catalog/types';
import { ButtonLink } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { EmptyState } from '@/components/ui/empty-state';
import { ProductCard } from '@/components/ui/product-card';
import { SectionHeading } from '@/components/ui/section-heading';

export async function LatestProducts({
  locale,
  products,
}: {
  locale: Locale;
  products: ProductSummary[];
}) {
  const t = await getTranslations('home.latest');

  return (
    <section className="py-16 sm:py-20">
      <Container>
        <SectionHeading title={t('title')} subtitle={t('subtitle')} />
        <div className="mt-9">
          {products.length === 0 ? (
            <EmptyState
              icon={<Sprout className="size-7" aria-hidden />}
              title={t('emptyTitle')}
              body={t('emptyBody')}
              actions={
                <>
                  <ButtonLink href="/join-farmer">{t('ctaFarmer')}</ButtonLink>
                  <ButtonLink href="/market" variant="outline">
                    {t('ctaMarket')}
                  </ButtonLink>
                </>
              }
            />
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} locale={locale} />
              ))}
            </div>
          )}
        </div>
      </Container>
    </section>
  );
}
