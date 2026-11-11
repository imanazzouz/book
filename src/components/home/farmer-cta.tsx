import { ArrowRight } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { ButtonLink } from '@/components/ui/button';
import { Container } from '@/components/ui/container';

export async function FarmerCta() {
  const t = await getTranslations('home.farmerCta');

  return (
    <section className="pb-4">
      <Container>
        <div className="relative overflow-hidden rounded-[2rem] bg-forest px-7 py-12 text-canvas sm:px-12 sm:py-14">
          <div className="ag-grain absolute inset-0 opacity-25" aria-hidden />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <h2 className="text-2xl font-bold text-white sm:text-3xl">{t('title')}</h2>
              <p className="mt-3 text-base leading-relaxed text-canvas/80">{t('body')}</p>
              <p className="mt-4 text-xs text-canvas/60">{t('note')}</p>
            </div>
            <ButtonLink href="/join-farmer" variant="inverse" size="lg" className="shrink-0">
              {t('cta')}
              <ArrowRight className="size-4 rtl:rotate-180" aria-hidden />
            </ButtonLink>
          </div>
        </div>
      </Container>
    </section>
  );
}
