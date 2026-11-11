import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ChevronDown } from 'lucide-react';
import { ButtonLink } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { PageHeader } from '@/components/ui/page-header';
import { asLocale, metaTranslator } from '@/lib/i18n-helpers';
import { pageMetadata } from '@/lib/page-metadata';

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
    path: '/faq',
    title: t('faqTitle'),
    description: t('homeDescription'),
  });
}

export default async function FaqPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  const locale = asLocale(rawLocale);
  if (!locale) notFound();
  setRequestLocale(locale);

  const t = await getTranslations('faq');
  const items = [1, 2, 3, 4, 5, 6] as const;

  return (
    <Container className="py-12 sm:py-16">
      <PageHeader title={t('title')} subtitle={t('subtitle')} />

      <div className="mt-10 max-w-3xl space-y-3">
        {items.map((index) => (
          <details
            key={index}
            className="group rounded-card border border-line bg-white px-5 py-4 shadow-soft [&_summary::-webkit-details-marker]:hidden"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-bold text-forest-deep">
              {t(`item${index}Question`)}
              <ChevronDown
                className="size-4 shrink-0 text-muted transition group-open:rotate-180"
                aria-hidden
              />
            </summary>
            <p className="mt-3 text-sm leading-relaxed text-muted">{t(`item${index}Answer`)}</p>
          </details>
        ))}
      </div>

      <div className="mt-10 max-w-3xl rounded-card border border-line bg-canvas/70 p-6">
        <h2 className="text-base font-bold text-forest-deep">{t('ctaTitle')}</h2>
        <p className="mt-2 text-sm text-muted">{t('ctaBody')}</p>
        <ButtonLink href="/contact" variant="outline" size="sm" className="mt-4">
          {t('ctaButton')}
        </ButtonLink>
      </div>
    </Container>
  );
}
