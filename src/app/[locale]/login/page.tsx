import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ArrowLeft, Lock, Mail } from 'lucide-react';
import { Container } from '@/components/ui/container';
import { Notice } from '@/components/ui/notice';
import { Link } from '@/i18n/navigation';
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
  return {
    ...pageMetadata({
      locale,
      path: '/login',
      title: t('loginTitle'),
      description: t('loginTitle'),
    }),
    robots: { index: false, follow: false },
  };
}

export default async function LoginPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  const locale = asLocale(rawLocale);
  if (!locale) notFound();
  setRequestLocale(locale);

  const t = await getTranslations('auth');

  return (
    <Container className="flex min-h-[70vh] items-center justify-center py-12">
      <div className="w-full max-w-md rounded-card border border-line bg-white p-7 shadow-soft sm:p-9">
        <h1 className="text-2xl font-extrabold text-forest-deep">{t('title')}</h1>
        <p className="mt-2 text-sm text-muted">{t('subtitle')}</p>

        <div className="mt-6 space-y-3">
          <button
            type="button"
            disabled
            aria-describedby="auth-phase-notice"
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full border border-line-strong bg-white text-sm font-semibold text-ink disabled:cursor-not-allowed disabled:opacity-55"
          >
            <Lock className="size-4" aria-hidden />
            {t('google')}
          </button>
          <button
            type="button"
            disabled
            aria-describedby="auth-phase-notice"
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-forest text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-55"
          >
            <Mail className="size-4" aria-hidden />
            {t('email')}
          </button>
        </div>

        <p className="mt-4 text-xs leading-relaxed text-muted">{t('otpNote')}</p>

        <Notice className="mt-5">
          <span id="auth-phase-notice">{t('phaseNotice')}</span>
        </Notice>

        <div className="mt-6 flex items-center justify-between border-t border-line pt-5 text-sm">
          <Link href="/" className="inline-flex items-center gap-1.5 font-semibold text-forest hover:underline">
            <ArrowLeft className="size-4 rtl:rotate-180" aria-hidden />
            {t('backHome')}
          </Link>
          <Link href="/join-farmer" className="font-semibold text-forest hover:underline">
            {t('joinAsFarmer')}
          </Link>
        </div>
      </div>
    </Container>
  );
}
