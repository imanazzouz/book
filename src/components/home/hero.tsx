import Image from 'next/image';
import { Banknote, Leaf, MapPin, ShieldCheck } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import type { Locale } from '@/i18n/routing';
import { ButtonLink } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { SearchForm } from '@/components/market/search-form';

export async function Hero({ locale }: { locale: Locale }) {
  const t = await getTranslations('home.hero');
  const tCommon = await getTranslations('common');

  return (
    <section className="relative overflow-hidden">
      <div className="ag-hero-glow absolute inset-0 -z-10" aria-hidden />
      <Container className="grid items-center gap-12 py-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:py-20">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-leaf/30 bg-white/70 px-3.5 py-1.5 text-xs font-bold text-forest">
            <Leaf className="size-3.5" aria-hidden />
            {t('eyebrow')}
          </p>

          <h1 className="mt-5 text-4xl leading-[1.08] text-forest-deep sm:text-5xl lg:text-[3.6rem]">
            {t('title')}{' '}
            <span className="relative inline-block">
              <span className="relative z-10">{t('titleAccent')}</span>
              <svg
                className="absolute inset-x-0 -bottom-1 z-0 h-3 w-full text-leaf/45"
                viewBox="0 0 200 12"
                preserveAspectRatio="none"
                aria-hidden
              >
                <path
                  d="M2 9c40-6 90-7 196-3"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="5"
                  strokeLinecap="round"
                />
              </svg>
            </span>
          </h1>

          <p className="mt-6 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
            {t('subtitle')}
          </p>

          <div className="mt-8 max-w-xl">
            <SearchForm
              action={`/${locale}/market`}
              placeholder={tCommon('searchPlaceholder')}
              buttonLabel={tCommon('searchButton')}
              size="lg"
            />
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-semibold text-forest/80">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="size-4 text-leaf" aria-hidden /> {t('badgeDirect')}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Banknote className="size-4 text-leaf" aria-hidden /> {t('badgeCod')}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="size-4 text-leaf" aria-hidden /> {t('badgeCoverage')}
            </span>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href="/market" size="lg">
              {t('primaryCta')}
            </ButtonLink>
            <ButtonLink href="/join-farmer" variant="outline" size="lg">
              {t('secondaryCta')}
            </ButtonLink>
          </div>
        </div>

        <div className="relative">
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[2rem] border border-white/60 shadow-lift sm:aspect-[5/4]">
            <Image
              src="/images/editorial/wheat-field-golden-hour.webp"
              alt={t('imageAlt')}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 46vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-forest-deep/45 via-transparent to-transparent" />

            <div className="absolute inset-x-4 bottom-4 rounded-2xl border border-white/40 bg-canvas/95 p-4 shadow-soft backdrop-blur sm:inset-x-5 sm:bottom-5">
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-xl bg-soft text-forest">
                  <ShieldCheck className="size-5" aria-hidden />
                </span>
                <div>
                  <p className="text-sm font-bold text-forest-deep">{t('badgeDirect')}</p>
                  <p className="mt-0.5 text-xs text-muted">{tCommon('deliveryStrip')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
