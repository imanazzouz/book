import { Search, Truck } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { siteConfig } from '@/config/site';
import { ButtonLink } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { LocaleSwitcher } from './locale-switcher';
import { Logo } from './logo';
import { MobileNav } from './mobile-nav';

export async function Header({ locale }: { locale: Locale }) {
  const t = await getTranslations('nav');
  const tCommon = await getTranslations('common');

  const items = [
    { href: '/market', label: t('market') },
    { href: '/categories', label: t('categories') },
    { href: '/#how-it-works', label: t('howItWorks') },
    { href: '/join-farmer', label: t('forFarmers') },
    { href: '/faq', label: t('faq') },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-line/80 bg-canvas/85 backdrop-blur-md">
      <div className="hidden bg-forest text-canvas/90 md:block">
        <Container className="flex h-9 items-center justify-between text-xs">
          <p className="flex items-center gap-2">
            <Truck className="size-3.5" aria-hidden />
            <span>{tCommon('deliveryStrip')}</span>
          </p>
          <Link href="/join-farmer" className="font-semibold underline-offset-4 hover:underline">
            {t('forFarmers')}
          </Link>
        </Container>
      </div>

      <Container className="flex h-[4.5rem] items-center gap-3">
        <Logo tagline={siteConfig.tagline[locale]} />

        <nav aria-label={t('mainNav')} className="ms-6 hidden items-center gap-1 lg:flex">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full px-3 py-2 text-sm font-semibold text-ink/80 transition hover:bg-soft/70 hover:text-forest-deep"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ms-auto flex items-center gap-2">
          <form action={`/${locale}/market`} method="get" className="hidden xl:flex">
            <label htmlFor="header-search" className="sr-only">
              {tCommon('search')}
            </label>
            <div className="flex h-10 items-center gap-2 rounded-full border border-line-strong bg-white/80 ps-4 pe-1 focus-within:border-forest">
              <Search className="size-4 shrink-0 text-muted" aria-hidden />
              <input
                id="header-search"
                name="q"
                type="search"
                placeholder={tCommon('searchPlaceholder')}
                className="w-40 bg-transparent text-sm text-ink placeholder:text-muted/70 focus:outline-none"
              />
              <button
                type="submit"
                className="inline-flex size-8 items-center justify-center rounded-full bg-forest text-white transition hover:bg-forest-deep"
                aria-label={tCommon('searchButton')}
              >
                <Search className="size-4" aria-hidden />
              </button>
            </div>
          </form>

          <LocaleSwitcher label={t('language')} />

          <ButtonLink href="/login" size="sm" className="hidden sm:inline-flex">
            {t('login')}
          </ButtonLink>

          <MobileNav items={items} loginLabel={t('login')} />
        </div>
      </Container>
    </header>
  );
}
