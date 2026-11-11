'use client';

import { TriangleAlert } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations('common');

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-5 py-16 text-center">
      <span className="flex size-14 items-center justify-center rounded-2xl bg-danger/10 text-danger">
        <TriangleAlert className="size-7" aria-hidden />
      </span>
      <h1 className="mt-5 text-2xl font-bold text-forest-deep">{t('errorTitle')}</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted">{t('errorBody')}</p>
      {error.digest ? (
        <p dir="ltr" className="mt-3 text-xs text-muted/70">
          ref: {error.digest}
        </p>
      ) : null}
      <button
        type="button"
        onClick={reset}
        className="mt-6 inline-flex h-11 items-center rounded-full bg-forest px-6 text-sm font-semibold text-white"
      >
        {t('retry')}
      </button>
    </div>
  );
}
