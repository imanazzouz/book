import { SlidersHorizontal, Sprout } from 'lucide-react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Suspense } from 'react';
import { ButtonLink } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { EmptyState } from '@/components/ui/empty-state';
import { FieldHint, Input, Label, Select } from '@/components/ui/field';
import { Notice } from '@/components/ui/notice';
import { Pagination } from '@/components/ui/pagination';
import { ProductCard } from '@/components/ui/product-card';
import { SortSelect } from '@/components/market/sort-select';
import { CATEGORY_SEED } from '@/config/catalog';
import { Link } from '@/i18n/navigation';
import { asLocale, metaTranslator } from '@/lib/i18n-helpers';
import { pageMetadata } from '@/lib/page-metadata';
import { container } from '@/server/container';
import { parseMarketSearchParams, searchMarket } from '@/server/catalog/use-cases';
import { cn } from '@/lib/cn';

type SearchParams = Record<string, string | string[] | undefined>;

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
    path: '/market',
    title: t('marketTitle'),
    description: t('marketDescription'),
  });
}

function pick(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function MarketPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { locale: rawLocale } = await params;
  const locale = asLocale(rawLocale);
  if (!locale) notFound();
  setRequestLocale(locale);

  const raw = await searchParams;
  const query = parseMarketSearchParams(raw);
  const [result, categories] = await Promise.all([
    searchMarket(container.catalog, query),
    container.catalog.listCategories(),
  ]);

  const t = await getTranslations('market');
  const tCommon = await getTranslations('common');
  const counts = new Map(categories.map((category) => [category.slug, category.productCount]));

  const activeCategory = CATEGORY_SEED.find((category) => category.slug === query.categorySlug);
  const hasFilters = Boolean(query.q || query.categorySlug || query.maxPriceDzd);

  const buildHref = (patch: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    const merged = {
      q: pick(raw.q),
      category: query.categorySlug,
      sort: query.sort === 'newest' ? undefined : query.sort,
      maxPrice: query.maxPriceDzd,
      ...patch,
    };
    for (const [key, value] of Object.entries(merged)) {
      if (value) params.set(key, value);
    }
    const qs = params.toString();
    return qs ? `/market?${qs}` : '/market';
  };

  return (
    <div className="bg-canvas">
      <Container className="py-10 sm:py-14">
        <div className="max-w-2xl">
          <h1 className="text-3xl font-extrabold text-forest-deep sm:text-4xl">{t('title')}</h1>
          <p className="mt-3 text-base leading-relaxed text-muted">{t('subtitle')}</p>
        </div>

        <div className="mt-9 grid gap-8 lg:grid-cols-[17rem_1fr] lg:gap-10">
          <aside className="space-y-6 lg:sticky lg:top-28 lg:self-start">
            <div className="rounded-card border border-line bg-white p-5 shadow-soft">
              <h2 className="flex items-center gap-2 text-sm font-bold text-forest-deep">
                <SlidersHorizontal className="size-4" aria-hidden />
                {t('filters')}
              </h2>

              <form action={`/${locale}/market`} method="get" className="mt-4 space-y-4">
                {query.sort !== 'newest' ? <input type="hidden" name="sort" value={query.sort} /> : null}
                <div>
                  <Label htmlFor="market-q">{tCommon('search')}</Label>
                  <Input
                    id="market-q"
                    name="q"
                    type="search"
                    defaultValue={query.q ?? ''}
                    placeholder={tCommon('searchPlaceholder')}
                  />
                </div>
                <div>
                  <Label htmlFor="market-maxPrice">{t('maxPrice')}</Label>
                  <Input
                    id="market-maxPrice"
                    name="maxPrice"
                    type="number"
                    inputMode="numeric"
                    min={0}
                    step={50}
                    defaultValue={query.maxPriceDzd ?? ''}
                    placeholder="1500"
                    dir="ltr"
                  />
                </div>
                {query.categorySlug ? (
                  <input type="hidden" name="category" value={query.categorySlug} />
                ) : null}
                <button
                  type="submit"
                  className="h-11 w-full rounded-full bg-forest text-sm font-semibold text-white transition hover:bg-forest-deep"
                >
                  {tCommon('apply')}
                </button>
              </form>

              <div className="mt-5 border-t border-line pt-5">
                <Label htmlFor="market-wilaya">{t('wilaya')}</Label>
                <Select id="market-wilaya" disabled aria-describedby="wilaya-note">
                  <option>{tCommon('availableSoon')}</option>
                </Select>
                <FieldHint>
                  <span id="wilaya-note">{t('wilayaNote')}</span>
                </FieldHint>
              </div>
            </div>

            <div className="rounded-card border border-line bg-white p-5 shadow-soft">
              <h2 className="text-sm font-bold text-forest-deep">{t('category')}</h2>
              <ul className="mt-3 space-y-1">
                <li>
                  <Link
                    href={buildHref({ category: undefined })}
                    className={cn(
                      'flex items-center justify-between rounded-lg px-3 py-2 text-sm transition',
                      !query.categorySlug
                        ? 'bg-soft font-semibold text-forest-deep'
                        : 'text-ink/80 hover:bg-canvas',
                    )}
                  >
                    {tCommon('allCategories')}
                  </Link>
                </li>
                {CATEGORY_SEED.map((category) => (
                  <li key={category.slug}>
                    <Link
                      href={buildHref({ category: category.slug })}
                      className={cn(
                        'flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm transition',
                        query.categorySlug === category.slug
                          ? 'bg-soft font-semibold text-forest-deep'
                          : 'text-ink/80 hover:bg-canvas',
                      )}
                    >
                      <span>{category.name[locale]}</span>
                      {counts.has(category.slug) ? (
                        <span className="text-xs tabular-nums text-muted">
                          {counts.get(category.slug)}
                        </span>
                      ) : null}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          <section aria-live="polite">
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-card border border-line bg-white/70 px-5 py-4">
              <p className="text-sm text-muted">
                <span className="font-bold tabular-nums text-forest-deep">{result.total}</span>{' '}
                {result.total === 1 ? t('resultsOne') : t('resultsMany')}
                {activeCategory ? (
                  <span className="text-muted"> · {activeCategory.name[locale]}</span>
                ) : null}
              </p>
              <div className="flex items-center gap-3">
                <span className="hidden text-xs font-semibold text-muted sm:inline">
                  {tCommon('sortBy')}
                </span>
                <Suspense fallback={<div className="h-10 w-40 rounded-xl bg-canvas-deep" />}>
                  <SortSelect
                    value={query.sort}
                    labels={{
                      newest: t('sortNewest'),
                      price_asc: t('sortPriceAsc'),
                      price_desc: t('sortPriceDesc'),
                    }}
                  />
                </Suspense>
              </div>
            </div>

            <div className="mt-6">
              {result.items.length === 0 ? (
                hasFilters ? (
                  <EmptyState
                    icon={<Sprout className="size-7" aria-hidden />}
                    title={t('emptyFilteredTitle')}
                    body={t('emptyFilteredBody')}
                    actions={
                      <ButtonLink href="/market" variant="outline">
                        {t('clearFilters')}
                      </ButtonLink>
                    }
                  />
                ) : (
                  <EmptyState
                    icon={<Sprout className="size-7" aria-hidden />}
                    title={t('emptyTitle')}
                    body={t('emptyBody')}
                    actions={
                      <ButtonLink href="/join-farmer">{t('emptyCta')}</ButtonLink>
                    }
                  />
                )
              ) : (
                <>
                  <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                    {result.items.map((product) => (
                      <ProductCard key={product.id} product={product} locale={locale} />
                    ))}
                  </div>
                  <Pagination
                    page={result.page}
                    pageSize={result.pageSize}
                    total={result.total}
                    basePath={`/${locale}/market`}
                    searchParams={{
                      q: query.q,
                      category: query.categorySlug,
                      sort: query.sort === 'newest' ? undefined : query.sort,
                      maxPrice: query.maxPriceDzd,
                    }}
                    locale={locale}
                    label={t('resultsLabel')}
                  />
                </>
              )}
            </div>

            <Notice className="mt-6">{t('wilayaNote')}</Notice>
          </section>
        </div>
      </Container>
    </div>
  );
}
