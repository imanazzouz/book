'use client';

import { useSearchParams } from 'next/navigation';
import { usePathname, useRouter } from '@/i18n/navigation';

export type SortValue = 'newest' | 'price_asc' | 'price_desc';

export function SortSelect({
  value,
  labels,
}: {
  value: SortValue;
  labels: Record<SortValue, string>;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (
    <select
      value={value}
      onChange={(event) => {
        const params = new URLSearchParams(searchParams.toString());
        const next = event.target.value;
        if (next === 'newest') {
          params.delete('sort');
        } else {
          params.set('sort', next);
        }
        params.delete('page');
        const qs = params.toString();
        router.replace(qs ? `${pathname}?${qs}` : pathname);
      }}
      className="h-10 cursor-pointer rounded-xl border border-line-strong bg-white px-3 text-sm font-semibold text-ink focus:border-forest focus:outline-none"
    >
      <option value="newest">{labels.newest}</option>
      <option value="price_asc">{labels.price_asc}</option>
      <option value="price_desc">{labels.price_desc}</option>
    </select>
  );
}
