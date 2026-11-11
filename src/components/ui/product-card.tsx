import Image from 'next/image';
import { Sprout } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import type { ProductSummary, SaleUnit } from '@/server/catalog/types';
import { Badge } from './badge';
import { Price } from './price';

const UNIT_LABEL: Record<SaleUnit, Record<Locale, string>> = {
  kg: { ar: 'كغ', fr: 'kg', en: 'kg' },
  g: { ar: 'غ', fr: 'g', en: 'g' },
  piece: { ar: 'قطعة', fr: 'pièce', en: 'piece' },
  box: { ar: 'صندوق', fr: 'caisse', en: 'box' },
  bunch: { ar: 'حزمة', fr: 'botte', en: 'bunch' },
  liter: { ar: 'لتر', fr: 'litre', en: 'litre' },
  quintal: { ar: 'قنطار', fr: 'quintal', en: 'quintal' },
};

export async function ProductCard({
  product,
  locale,
}: {
  product: ProductSummary;
  locale: Locale;
}) {
  const t = await getTranslations('a11y');

  return (
    <article className="group overflow-hidden rounded-card border border-line bg-white shadow-soft transition duration-200 hover:-translate-y-0.5 hover:shadow-lift">
      <Link href={`/product/${product.slug}`} className="block">
        <div className="relative aspect-[4/3] overflow-hidden bg-canvas-deep">
          {product.image ? (
            <Image
              src={product.image.url}
              alt={product.image.alt}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              className="object-cover transition duration-500 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-muted">
              <Sprout className="size-8" aria-hidden strokeWidth={1.5} />
              <span className="px-4 text-center text-xs">{t('imagePlaceholder')}</span>
            </div>
          )}
        </div>

        <div className="space-y-2 p-4">
          <h3 className="line-clamp-1 font-semibold text-ink">{product.name}</h3>
          <p className="line-clamp-1 text-xs text-muted">
            {product.storeName}
            {product.wilayaName ? ` · ${product.wilayaName}` : ''}
          </p>
          <div className="flex items-baseline gap-1.5 pt-1">
            <Price amountDzd={product.priceDzd} locale={locale} />
            <span className="text-xs text-muted">/ {UNIT_LABEL[product.unit][locale]}</span>
          </div>
        </div>
      </Link>
    </article>
  );
}

export function ProductCardBadge({ children }: { children: React.ReactNode }) {
  return <Badge tone="warning">{children}</Badge>;
}
