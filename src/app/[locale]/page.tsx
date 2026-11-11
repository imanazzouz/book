import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { CategorySection } from '@/components/home/category-section';
import { FarmerCta } from '@/components/home/farmer-cta';
import { Hero } from '@/components/home/hero';
import { HowItWorks } from '@/components/home/how-it-works';
import { LatestProducts } from '@/components/home/latest-products';
import { StorySection } from '@/components/home/story-section';
import { TrustBar } from '@/components/home/trust-bar';
import { asLocale } from '@/lib/i18n-helpers';
import type { Locale } from '@/i18n/routing';
import { container } from '@/server/container';
import { searchMarket } from '@/server/catalog/use-cases';

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  const locale = asLocale(rawLocale);
  if (!locale) notFound();
  setRequestLocale(locale);

  const [latest, categories] = await Promise.all([
    searchMarket(container.catalog, { sort: 'newest', page: 1, pageSize: 4 }),
    container.catalog.listCategories(),
  ]);

  return (
    <>
      <Hero locale={locale as Locale} />
      <TrustBar />
      <CategorySection locale={locale as Locale} categories={categories} />
      <LatestProducts locale={locale as Locale} products={latest.items} />
      <HowItWorks />
      <StorySection />
      <FarmerCta />
    </>
  );
}
