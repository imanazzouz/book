import { ArrowRight } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import type { CategorySeed } from '@/config/catalog';
import { CategoryIcon } from './category-icon';

export function CategoryCard({
  category,
  locale,
  count,
}: {
  category: CategorySeed;
  locale: Locale;
  count?: number;
}) {
  return (
    <Link
      href={{ pathname: '/market', query: { category: category.slug } }}
      className="group flex items-center gap-4 rounded-card border border-line bg-white p-4 shadow-soft transition duration-200 hover:-translate-y-0.5 hover:border-leaf hover:shadow-lift"
    >
      <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-soft text-forest transition group-hover:bg-forest group-hover:text-white">
        <CategoryIcon icon={category.icon} className="size-6" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-semibold text-ink">{category.name[locale]}</span>
        {typeof count === 'number' ? (
          <span className="mt-0.5 block text-xs text-muted tabular-nums">{count}</span>
        ) : null}
      </span>
      <ArrowRight className="size-4 shrink-0 text-muted transition group-hover:text-forest rtl:rotate-180" aria-hidden />
    </Link>
  );
}
