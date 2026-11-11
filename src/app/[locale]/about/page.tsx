import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { MapPin, ShieldCheck, Sprout, Tags } from 'lucide-react';
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
    path: '/about',
    title: t('aboutTitle'),
    description: t('homeDescription'),
  });
}

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  const locale = asLocale(rawLocale);
  if (!locale) notFound();
  setRequestLocale(locale);

  const t = await getTranslations('about');

  const principles = [
    t('principle1'),
    t('principle2'),
    t('principle3'),
    t('principle4'),
  ];

  return (
    <Container className="py-12 sm:py-16">
      <PageHeader eyebrow="AgriDirect" title={t('title')} subtitle={t('intro')} />

      <div className="mt-12 grid gap-6 lg:grid-cols-3">
        <section className="rounded-card border border-line bg-white p-7 shadow-soft">
          <span className="flex size-11 items-center justify-center rounded-2xl bg-soft text-forest">
            <Sprout className="size-5" aria-hidden />
          </span>
          <h2 className="mt-4 text-lg font-bold text-forest-deep">{t('missionTitle')}</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">{t('missionBody')}</p>
        </section>

        <section className="rounded-card border border-line bg-white p-7 shadow-soft">
          <span className="flex size-11 items-center justify-center rounded-2xl bg-soft text-forest">
            <Tags className="size-5" aria-hidden />
          </span>
          <h2 className="mt-4 text-lg font-bold text-forest-deep">{t('modelTitle')}</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">{t('modelBody')}</p>
        </section>

        <section className="rounded-card border border-line bg-white p-7 shadow-soft">
          <span className="flex size-11 items-center justify-center rounded-2xl bg-soft text-forest">
            <MapPin className="size-5" aria-hidden />
          </span>
          <h2 className="mt-4 text-lg font-bold text-forest-deep">{t('coverageTitle')}</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">{t('coverageBody')}</p>
        </section>
      </div>

      <section className="mt-12 rounded-card border border-line bg-white p-7 shadow-soft sm:p-9">
        <h2 className="flex items-center gap-2 text-xl font-bold text-forest-deep">
          <ShieldCheck className="size-5 text-leaf" aria-hidden />
          {t('principlesTitle')}
        </h2>
        <ul className="mt-5 grid gap-3 sm:grid-cols-2">
          {principles.map((principle) => (
            <li
              key={principle}
              className="rounded-xl border border-line bg-canvas/60 px-4 py-3 text-sm leading-relaxed text-ink"
            >
              {principle}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8 rounded-card border border-line bg-canvas/70 p-7 sm:p-9">
        <h2 className="text-lg font-bold text-forest-deep">{t('closingTitle')}</h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted">{t('closingBody')}</p>
      </section>
    </Container>
  );
}
