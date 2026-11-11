import { getTranslations } from 'next-intl/server';
import { Home, Search } from 'lucide-react';
import { Container } from '@/components/ui/container';
import { Link } from '@/i18n/navigation';

export default async function LocaleNotFound() {
  const t = await getTranslations('common');

  return (
    <Container className="flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
      <p className="text-6xl font-extrabold text-soft-deep">404</p>
      <h1 className="mt-4 text-2xl font-bold text-forest-deep">{t('notFoundTitle')}</h1>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-muted">{t('notFoundBody')}</p>
      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <Link
          href="/"
          className="inline-flex h-11 items-center gap-2 rounded-full bg-forest px-5 text-sm font-semibold text-white"
        >
          <Home className="size-4" aria-hidden />
          {t('backHome')}
        </Link>
        <Link
          href="/market"
          className="inline-flex h-11 items-center gap-2 rounded-full border border-line-strong bg-white px-5 text-sm font-semibold text-ink"
        >
          <Search className="size-4" aria-hidden />
          {t('searchButton')}
        </Link>
      </div>
    </Container>
  );
}
