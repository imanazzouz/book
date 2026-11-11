import { getTranslations } from 'next-intl/server';
import { Container } from '@/components/ui/container';
import { PageHeader } from '@/components/ui/page-header';

type LegalNamespace = 'legal.privacy' | 'legal.terms';

export async function LegalDocument({ namespace }: { namespace: LegalNamespace }) {
  const t = await getTranslations(namespace);
  const tLegal = await getTranslations('legal');

  const sections = [1, 2, 3, 4, 5, 6, 7].filter((index) =>
    t.has(`s${index}Title` as never),
  );

  return (
    <Container className="py-12 sm:py-16">
      <PageHeader title={t('title')} subtitle={tLegal('updated')} />

      <p className="mt-6 max-w-3xl rounded-xl border border-warning/30 bg-warning/5 px-4 py-3 text-sm text-warning">
        {tLegal('draftNotice')}
      </p>

      <div className="mt-10 max-w-3xl space-y-8">
        {sections.map((index) => (
          <section key={index}>
            <h2 className="text-lg font-bold text-forest-deep">
              {index}. {t(`s${index}Title` as never)}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">{t(`s${index}Body` as never)}</p>
          </section>
        ))}
      </div>
    </Container>
  );
}
