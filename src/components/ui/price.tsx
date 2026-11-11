import type { Locale } from '@/i18n/routing';
import { cn } from '@/lib/cn';
import { formatPrice } from '@/lib/format';

export function Price({
  amountDzd,
  locale,
  className,
  size = 'md',
}: {
  amountDzd: string;
  locale: Locale;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}) {
  return (
    <span
      dir="ltr"
      className={cn(
        'inline-flex items-baseline font-bold tabular-nums text-forest-deep',
        size === 'sm' && 'text-sm',
        size === 'md' && 'text-lg',
        size === 'lg' && 'text-2xl sm:text-3xl',
        className,
      )}
    >
      {formatPrice(amountDzd, locale)}
    </span>
  );
}
