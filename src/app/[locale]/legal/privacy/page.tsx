import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { LegalDocument } from '@/components/legal-document';
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
    path: '/legal/privacy',
    title: t('privacyTitle'),
    description: t('privacyTitle'),
  });
}

export default async function PrivacyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  const locale = asLocale(rawLocale);
  if (!locale) notFound();
  setRequestLocale(locale);

  return <LegalDocument namespace="legal.privacy" />;
}
