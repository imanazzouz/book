import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ArrowRight, BadgeCheck, Check, ClipboardCheck, ImagePlus, Store, UserRound, Wheat } from 'lucide-react';
import { ButtonLink } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { Notice } from '@/components/ui/notice';
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
    path: '/join-farmer',
    title: t('joinTitle'),
    description: t('homeDescription'),
  });
}

export default async function JoinFarmerPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  const locale = asLocale(rawLocale);
  if (!locale) notFound();
  setRequestLocale(locale);

  const t = await getTranslations('join');

  const steps = [
    { icon: UserRound, title: t('step1Title'), body: t('step1Body') },
    { icon: Store, title: t('step2Title'), body: t('step2Body') },
    { icon: ClipboardCheck, title: t('step3Title'), body: t('step3Body') },
    { icon: ImagePlus, title: t('step4Title'), body: t('step4Body') },
  ];

  const requirements = [
    t('requirement1'),
    t('requirement2'),
    t('requirement3'),
    t('requirement4'),
  ];

  return (
    <Container className="py-12 sm:py-16">
      <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div>
          <PageHeader eyebrow={t('title')} title={t('subtitle')} subtitle={t('intro')} />
          <div className="mt-7 flex flex-wrap gap-3">
            <ButtonLink href="/login" size="lg">
              {t('cta')}
              <ArrowRight className="size-4 rtl:rotate-180" aria-hidden />
            </ButtonLink>
            <ButtonLink href="/faq" variant="outline" size="lg">
              FAQ
            </ButtonLink>
          </div>
          <Notice className="mt-5">{t('supportNote')}</Notice>
        </div>

        <div className="relative aspect-[5/4] overflow-hidden rounded-[2rem] border border-line shadow-soft">
          <Image
            src="/images/editorial/citrus-crates.webp"
            alt={locale === 'ar' ? 'صناديق برتقال وليمون طازجة' : locale === 'fr' ? 'Caisses d’oranges et de citrons frais' : 'Crates of fresh oranges and lemons'}
            fill
            sizes="(max-width: 1024px) 100vw, 44vw"
            className="object-cover"
          />
        </div>
      </div>

      <section className="mt-16">
        <h2 className="text-2xl font-bold text-forest-deep">{t('title')}</h2>
        <ol className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => (
            <li key={step.title} className="rounded-card border border-line bg-white p-6 shadow-soft">
              <div className="flex items-center justify-between">
                <span className="flex size-11 items-center justify-center rounded-2xl bg-soft text-forest">
                  <step.icon className="size-5" aria-hidden />
                </span>
                <span className="text-2xl font-extrabold tabular-nums text-soft-deep">
                  {String(index + 1).padStart(2, '0')}
                </span>
              </div>
              <h3 className="mt-4 text-base font-bold text-forest-deep">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <div className="mt-12 grid gap-6 lg:grid-cols-2">
        <section className="rounded-card border border-line bg-white p-7 shadow-soft">
          <h2 className="flex items-center gap-2 text-base font-bold text-forest-deep">
            <BadgeCheck className="size-5 text-leaf" aria-hidden />
            {t('requirementsTitle')}
          </h2>
          <ul className="mt-4 space-y-3">
            {requirements.map((requirement) => (
              <li key={requirement} className="flex items-start gap-3 text-sm text-ink">
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-soft text-forest">
                  <Check className="size-3.5" aria-hidden strokeWidth={3} />
                </span>
                {requirement}
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-card border border-line bg-canvas/70 p-7">
          <h2 className="flex items-center gap-2 text-base font-bold text-forest-deep">
            <Wheat className="size-5 text-leaf" aria-hidden />
            {t('noticeTitle')}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted">{t('noticeBody')}</p>
          <p className="mt-4 rounded-xl bg-white/70 px-4 py-3 text-sm font-semibold text-forest">
            {t('commissionNote')}
          </p>
        </section>
      </div>
    </Container>
  );
}
