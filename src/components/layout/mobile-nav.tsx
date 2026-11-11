'use client';

import { Menu, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/cn';
import { ButtonLink } from '@/components/ui/button';

export interface NavItem {
  href: string;
  label: string;
}

export function MobileNav({ items, loginLabel }: { items: NavItem[]; loginLabel: string }) {
  const t = useTranslations('nav');
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-expanded={open}
        aria-label={t('openMenu')}
        className="inline-flex size-10 items-center justify-center rounded-full border border-line-strong bg-white text-forest"
      >
        <Menu className="size-5" aria-hidden />
      </button>

      <div
        className={cn(
          'fixed inset-0 z-50 transition',
          open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0',
        )}
        aria-hidden={!open}
      >
        <div
          className="absolute inset-0 bg-forest-deep/40 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
        <div
          role="dialog"
          aria-modal="true"
          aria-label={t('mainNav')}
          className={cn(
            'absolute inset-y-0 end-0 flex w-[86%] max-w-sm flex-col gap-6 bg-canvas p-6 shadow-lift transition duration-300',
            open ? 'translate-x-0' : 'translate-x-full rtl:-translate-x-full',
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold uppercase tracking-widest text-leaf">AgriDirect</span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label={t('closeMenu')}
              className="inline-flex size-10 items-center justify-center rounded-full border border-line-strong bg-white text-forest"
            >
              <X className="size-5" aria-hidden />
            </button>
          </div>

          <nav className="flex flex-col gap-1">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-xl px-3 py-3 text-base font-semibold text-ink hover:bg-soft"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="mt-auto flex flex-col gap-3">
            <ButtonLink href="/login" variant="primary" size="md" className="w-full">
              {loginLabel}
            </ButtonLink>
          </div>
        </div>
      </div>
    </div>
  );
}
