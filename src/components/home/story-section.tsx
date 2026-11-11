import Image from 'next/image';
import { Check } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { Container } from '@/components/ui/container';

export async function StorySection() {
  const t = await getTranslations('home.story');
  const bullets = [t('bullet1'), t('bullet2'), t('bullet3')];

  return (
    <section className="py-16 sm:py-20">
      <Container className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <div className="relative order-2 lg:order-1">
          <div className="relative aspect-[5/4] overflow-hidden rounded-[2rem] border border-line shadow-soft">
            <Image
              src="/images/editorial/tomatoes-crate.webp"
              alt={t('imageAlt')}
              fill
              sizes="(max-width: 1024px) 100vw, 46vw"
              className="object-cover"
            />
          </div>
        </div>
        <div className="order-1 lg:order-2">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-leaf">{t('eyebrow')}</p>
          <h2 className="mt-3 text-2xl leading-tight text-forest-deep sm:text-3xl">{t('title')}</h2>
          <p className="mt-4 text-base leading-relaxed text-muted">{t('body')}</p>
          <ul className="mt-7 space-y-3">
            {bullets.map((bullet) => (
              <li key={bullet} className="flex items-start gap-3 text-sm font-medium text-ink">
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-soft text-forest">
                  <Check className="size-3.5" aria-hidden strokeWidth={3} />
                </span>
                {bullet}
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </section>
  );
}
