import Image from 'next/image';
import { BadgeCheck, MapPin, Sprout, Truck } from 'lucide-react';
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Container } from '@/components/ui/container';
import { EmptyState } from '@/components/ui/empty-state';
import { ProductCard } from '@/components/ui/product-card';
import { asLocale } from '@/lib/i18n-helpers';
import { container } from '@/server/container';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const store = await container.catalog.findStoreBySlug(slug, asLocale(locale) ?? 'ar');
  if (!store) notFound();

  return {
    title: `${store.name} — AgriDirect`,
    description: store.description.slice(0, 155),
    alternates: { canonical: `/${locale}/store/${slug}` },
  };
}

export default async function StorePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: rawLocale, slug } = await params;
  const locale = asLocale(rawLocale);
  if (!locale) notFound();
  setRequestLocale(locale);

  const store = await container.catalog.findStoreBySlug(slug, locale);
  if (!store) notFound();

  const t = await getTranslations('store');

  return (
    <div>
      <div className="relative h-48 w-full overflow-hidden bg-soft-deep sm:h-64">
        {store.cover ? (
          <Image
            src={store.cover.url}
            alt={store.cover.alt}
            fill
            sizes="100vw"
            className="object-cover"
            priority
          />
        ) : null}
      </div>

      <Container className="-mt-12 pb-14">
        <div className="rounded-card border border-line bg-white p-6 shadow-soft sm:p-8">
          <div className="flex flex-wrap items-start gap-5">
            {store.logo ? (
              <span className="relative size-20 shrink-0 overflow-hidden rounded-2xl border border-line">
                <Image
                  src={store.logo.url}
                  alt={store.logo.alt}
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              </span>
            ) : (
              <span className="flex size-20 shrink-0 items-center justify-center rounded-2xl bg-soft text-forest">
                <Sprout className="size-8" aria-hidden />
              </span>
            )}

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-extrabold text-forest-deep">{store.name}</h1>
                {store.isVerified ? (
                  <Badge tone="soft">
                    <BadgeCheck className="size-3.5" aria-hidden />
                    {t('verified')}
                  </Badge>
                ) : (
                  <Badge tone="warning">{t('notVerified')}</Badge>
                )}
              </div>
              {store.wilayaName ? (
                <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-muted">
                  <MapPin className="size-4" aria-hidden />
                  {[store.wilayaName, store.communeName].filter(Boolean).join(' · ')}
                </p>
              ) : null}
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted">
                {store.description}
              </p>
            </div>
          </div>

          {store.deliveryNotes || store.supportsPickup ? (
            <div className="mt-6 rounded-xl border border-line bg-canvas/60 p-4 text-sm">
              <p className="flex items-center gap-2 font-semibold text-forest-deep">
                <Truck className="size-4" aria-hidden />
                {t('deliveryInfo')}
              </p>
              {store.deliveryNotes ? (
                <p className="mt-1.5 text-muted">{store.deliveryNotes}</p>
              ) : null}
              {store.supportsPickup ? <p className="mt-1.5 text-muted">{t('pickup')}</p> : null}
            </div>
          ) : null}
        </div>

        <h2 className="mt-10 text-xl font-bold text-forest-deep">{t('products')}</h2>
        <div className="mt-5">
          {store.products.length === 0 ? (
            <EmptyState
              icon={<Sprout className="size-7" aria-hidden />}
              title={t('noProducts')}
              body={t('deliveryInfo')}
            />
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {store.products.map((product) => (
                <ProductCard key={product.id} product={product} locale={locale} />
              ))}
            </div>
          )}
        </div>
      </Container>
    </div>
  );
}
