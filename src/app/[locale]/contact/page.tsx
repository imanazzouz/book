import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ButtonLink } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { FieldHint, Input, Label, Textarea } from '@/components/ui/field';
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
    path: '/contact',
    title: t('contactTitle'),
    description: t('faqTitle'),
  });
}

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  const locale = asLocale(rawLocale);
  if (!locale) notFound();
  setRequestLocale(locale);

  const t = await getTranslations('contact');
  const tFaq = await getTranslations('faq');

  return (
    <Container className="py-12 sm:py-16">
      <PageHeader title={t('title')} subtitle={t('subtitle')} />

      <div className="mt-10 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-card border border-line bg-white p-6 shadow-soft sm:p-8">
          <h2 className="text-lg font-bold text-forest-deep">{t('formTitle')}</h2>
          <Notice className="mt-4">{t('disabledNote')}</Notice>

          <fieldset disabled className="mt-6 space-y-5">
            <div>
              <Label htmlFor="contact-name">{t('name')}</Label>
              <Input id="contact-name" name="name" autoComplete="name" />
            </div>
            <div>
              <Label htmlFor="contact-email">{t('email')}</Label>
              <Input id="contact-email" name="email" type="email" autoComplete="email" dir="ltr" />
            </div>
            <div>
              <Label htmlFor="contact-subject">{t('subject')}</Label>
              <Input id="contact-subject" name="subject" />
            </div>
            <div>
              <Label htmlFor="contact-message">{t('message')}</Label>
              <Textarea id="contact-message" name="message" />
            </div>
            <button
              type="submit"
              className="h-11 rounded-full bg-forest px-6 text-sm font-semibold text-white"
            >
              {t('send')}
            </button>
          </fieldset>
        </section>

        <aside className="space-y-4">
          <div className="rounded-card border border-line bg-white p-6 shadow-soft">
            <h2 className="text-sm font-bold text-forest-deep">{t('channelsTitle')}</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">{t('supportHours')}</p>
            <FieldHint>{t('disabledNote')}</FieldHint>
          </div>
          <div className="rounded-card border border-line bg-canvas/70 p-6">
            <h2 className="text-sm font-bold text-forest-deep">{t('faqCta')}</h2>
            <ButtonLink href="/faq" variant="outline" size="sm" className="mt-4">
              {tFaq('title')}
            </ButtonLink>
          </div>
        </aside>
      </div>
    </Container>
  );
}
