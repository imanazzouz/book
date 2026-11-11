import Image from 'next/image';
import { MapPin, Sprout, Store, Truck } from 'lucide-react';
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { Notice } from '@/components/ui/notice';
import { Price } from '@/components/ui/price';
import { Link } from '@/i18n/navigation';
import { asLocale } from '@/lib/i18n-helpers';
import { formatQuantity } from '@/lib/format';
import { container } from '@/server/container';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const product = await container.catalog.findProductBySlug(slug, asLocale(locale) ?? 'ar');
  if (!product) notFound();

  return {
    title: `${product.name} — AgriDirect`,
    description: product.description.slice(0, 155),
    alternates: { canonical: `/${locale}/product/${slug}` },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: rawLocale, slug } = await params;
  const locale = asLocale(rawLocale);
  if (!locale) notFound();
  setRequestLocale(locale);

  const product = await container.catalog.findProductBySlug(slug, locale);
  if (!product) notFound();

  const t = await getTranslations('product');
  const images = product.images.length > 0 ? product.images : product.image ? [product.image] : [];
  const cover = images[0];

  return (
    <Container className="py-10 sm:py-14">
      <nav className="text-xs text-muted">
        <Link href="/market" className="hover:text-forest">
          {t('store')}
        </Link>
        <span aria-hidden> / </span>
        <span className="font-semibold text-forest-deep">{product.name}</span>
      </nav>

      <div className="mt-6 grid gap-10 lg:grid-cols-2">
        <div>
          <div className="relative aspect-square overflow-hidden rounded-[1.75rem] border border-line bg-canvas-deep">
            {cover ? (
              <Image
                src={cover.url}
                alt={cover.alt}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-2 text-muted">
                <Sprout className="size-10" aria-hidden />
              </div>
            )}
          </div>
          {images.length > 1 ? (
            <div className="mt-3 grid grid-cols-4 gap-3">
              {images.slice(1, 5).map((image) => (
                <div
                  key={image.url}
                  className="relative aspect-square overflow-hidden rounded-xl border border-line"
                >
                  <Image
                    src={image.url}
                    alt={image.alt}
                    fill
                    sizes="120px"
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <div>
          <div className="flex flex-wrap items-center gap-2">
            {product.isOrganic ? <Badge tone="soft">{t('organic')}</Badge> : null}
            <Badge tone="neutral">
              {formatQuantity(product.quantityAvailable, locale)} {t('stock')}
            </Badge>
          </div>

          <h1 className="mt-4 text-3xl font-extrabold text-forest-deep sm:text-4xl">
            {product.name}
          </h1>

          <div className="mt-4 flex items-baseline gap-2">
            <Price amountDzd={product.priceDzd} locale={locale} size="lg" />
            <span className="text-sm text-muted">/ {product.unit}</span>
          </div>

          <p className="mt-5 text-sm leading-relaxed text-muted">{product.description}</p>

          <dl className="mt-6 space-y-3 rounded-card border border-line bg-white p-5 text-sm">
            <div className="flex items-center justify-between gap-4">
              <dt className="flex items-center gap-2 text-muted">
                <Store className="size-4" aria-hidden /> {t('store')}
              </dt>
              <dd className="font-semibold text-ink">
                <Link href={`/store/${product.storeSlug}`} className="hover:text-forest">
                  {product.storeName}
                </Link>
              </dd>
            </div>
            {product.wilayaName ? (
              <div className="flex items-center justify-between gap-4">
                <dt className="flex items-center gap-2 text-muted">
                  <MapPin className="size-4" aria-hidden /> {t('location')}
                </dt>
                <dd className="font-semibold text-ink">{product.wilayaName}</dd>
              </div>
            ) : null}
            <div className="flex items-center justify-between gap-4">
              <dt className="flex items-center gap-2 text-muted">
                <Truck className="size-4" aria-hidden /> {t('delivery')}
              </dt>
              <dd className="font-semibold text-ink">
                {product.supportsDelivery ? t('deliveryAvailable') : t('fulfillmentUnavailable')}
                {product.supportsPickup ? ` · ${t('pickupAvailable')}` : ''}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-muted">{t('minOrder')}</dt>
              <dd className="font-semibold text-ink">
                {formatQuantity(product.minOrderQuantity, locale)} {product.unit}
              </dd>
            </div>
          </dl>

          <Button size="lg" className="mt-6 w-full" disabled>
            {t('addToCart')}
          </Button>
          <Notice className="mt-3">{t('soon')}</Notice>
        </div>
      </div>

      <section className="mt-14">
        <h2 className="text-xl font-bold text-forest-deep">{t('reviews')}</h2>
        <p className="mt-2 text-sm text-muted">{t('noReviews')}</p>
      </section>
    </Container>
  );
}
