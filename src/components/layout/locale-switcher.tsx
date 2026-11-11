'use client';

import { Globe } from 'lucide-react';
import { useLocale } from 'next-intl';
import { useTransition } from 'react';
import { usePathname, useRouter } from '@/i18n/navigation';
import { localeLabels, routing, type Locale } from '@/i18n/routing';
import { cn } from '@/lib/cn';

export function LocaleSwitcher({ label, className }: { label: string; className?: string }) {
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const nextLocale = event.target.value as Locale;
    // Read the live query string in the handler only, so the switcher itself
    // stays server-rendered (no Suspense fallback on first paint).
    const query = window.location.search.replace(/^\?/, '');
    const target = query ? `${pathname}?${query}` : pathname;
    startTransition(() => {
      router.replace(target, { locale: nextLocale });
    });
  }

  return (
    <div
      className={cn(
        'relative inline-flex items-center gap-1.5 rounded-full border border-line-strong bg-white/80 ps-3 pe-1 text-sm',
        isPending && 'opacity-60',
        className,
      )}
    >
      <Globe className="size-4 text-muted" aria-hidden />
      <select
        aria-label={label}
        value={locale}
        onChange={handleChange}
        className="h-9 cursor-pointer appearance-none bg-transparent pe-1 text-sm font-semibold text-ink focus:outline-none"
      >
        {routing.locales.map((value) => (
          <option key={value} value={value}>
            {localeLabels[value]}
          </option>
        ))}
      </select>
    </div>
  );
}

export function LocaleSwitcherFallback() {
  return (
    <div className="h-9 w-28 animate-pulse rounded-full border border-line bg-white/60" aria-hidden />
  );
}
