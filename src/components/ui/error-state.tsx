'use client';

import { TriangleAlert } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from './button';

export function ErrorState({ onRetry }: { onRetry?: () => void }) {
  const t = useTranslations('common');

  return (
    <div
      role="alert"
      className="rounded-card border border-danger/25 bg-danger/5 px-6 py-10 text-center"
    >
      <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl bg-danger/10 text-danger">
        <TriangleAlert className="size-6" aria-hidden />
      </div>
      <h3 className="text-base font-bold text-ink">{t('errorTitle')}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted">{t('errorBody')}</p>
      {onRetry ? (
        <Button variant="outline" size="sm" className="mt-5" onClick={onRetry}>
          {t('retry')}
        </Button>
      ) : null}
    </div>
  );
}
