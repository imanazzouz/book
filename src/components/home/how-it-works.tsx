import { PackageCheck, Search, Truck } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { Container } from '@/components/ui/container';
import { SectionHeading } from '@/components/ui/section-heading';

export async function HowItWorks() {
  const t = await getTranslations('home.how');

  const steps = [
    { icon: Search, title: t('step1Title'), body: t('step1Body') },
    { icon: PackageCheck, title: t('step2Title'), body: t('step2Body') },
    { icon: Truck, title: t('step3Title'), body: t('step3Body') },
  ];

  return (
    <section id="how-it-works" className="scroll-mt-28 bg-white/60 py-16 sm:py-20">
      <Container>
        <SectionHeading title={t('title')} subtitle={t('subtitle')} align="center" />
        <ol className="mt-12 grid gap-6 md:grid-cols-3">
          {steps.map((step, index) => (
            <li
              key={step.title}
              className="relative rounded-card border border-line bg-canvas/70 p-7"
            >
              <span className="absolute end-6 top-6 text-4xl font-extrabold tabular-nums text-soft-deep">
                {String(index + 1).padStart(2, '0')}
              </span>
              <span className="flex size-12 items-center justify-center rounded-2xl bg-forest text-white">
                <step.icon className="size-6" aria-hidden strokeWidth={1.7} />
              </span>
              <h3 className="mt-5 text-lg font-bold text-forest-deep">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{step.body}</p>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}
