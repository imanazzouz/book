import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/cn';
import type { Locale } from '@/i18n/routing';

export function Pagination({
  page,
  pageSize,
  total,
  basePath,
  searchParams,
  locale,
  label,
}: {
  page: number;
  pageSize: number;
  total: number;
  basePath: string;
  searchParams: Record<string, string | undefined>;
  locale: Locale;
  label: string;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages <= 1) return null;

  const hrefFor = (target: number) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(searchParams)) {
      if (value && key !== 'page') params.set(key, value);
    }
    if (target > 1) params.set('page', String(target));
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  const isRtl = locale === 'ar';
  const PrevIcon = isRtl ? ChevronRight : ChevronLeft;
  const NextIcon = isRtl ? ChevronLeft : ChevronRight;

  return (
    <nav aria-label={label} className="mt-10 flex items-center justify-center gap-3">
      {page > 1 ? (
        <Link
          href={hrefFor(page - 1)}
          className="inline-flex size-10 items-center justify-center rounded-full border border-line-strong bg-white text-forest hover:border-forest"
          aria-label="previous page"
        >
          <PrevIcon className="size-4" aria-hidden />
        </Link>
      ) : (
        <span className={cn('inline-flex size-10 items-center justify-center rounded-full border border-line text-muted/40')}>
          <PrevIcon className="size-4" aria-hidden />
        </span>
      )}

      <span dir="ltr" className="text-sm font-semibold tabular-nums text-muted">
        {page} / {totalPages}
      </span>

      {page < totalPages ? (
        <Link
          href={hrefFor(page + 1)}
          className="inline-flex size-10 items-center justify-center rounded-full border border-line-strong bg-white text-forest hover:border-forest"
          aria-label="next page"
        >
          <NextIcon className="size-4" aria-hidden />
        </Link>
      ) : (
        <span className="inline-flex size-10 items-center justify-center rounded-full border border-line text-muted/40">
          <NextIcon className="size-4" aria-hidden />
        </span>
      )}
    </nav>
  );
}
