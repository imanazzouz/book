import { Banknote, MapPin, ShieldCheck, Tags } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { Container } from '@/components/ui/container';

export async function TrustBar() {
  const t = await getTranslations('home.trust');

  const items = [
    { icon: ShieldCheck, title: t('directTitle'), body: t('directBody') },
    { icon: Tags, title: t('priceTitle'), body: t('priceBody') },
    { icon: Banknote, title: t('codTitle'), body: t('codBody') },
    { icon: MapPin, title: t('coverageTitle'), body: t('coverageBody') },
  ];

  return (
    <section className="border-y border-line bg-white/60">
      <Container className="grid gap-6 py-10 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => (
          <div key={item.title} className="flex gap-3.5">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-soft text-forest">
              <item.icon className="size-5" aria-hidden strokeWidth={1.7} />
            </span>
            <div>
              <h3 className="text-sm font-bold text-forest-deep">{item.title}</h3>
              <p className="mt-1 text-xs leading-relaxed text-muted">{item.body}</p>
            </div>
          </div>
        ))}
      </Container>
    </section>
  );
}
