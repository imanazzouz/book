import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { siteConfig } from '@/config/site';
import { Container } from '@/components/ui/container';
import { LogoMark } from './logo';

export async function Footer({ locale }: { locale: Locale }) {
  const t = await getTranslations('footer');
  const year = 2026;

  const columns = [
    {
      title: t('explore'),
      links: [
        { href: '/market', label: t('market') },
        { href: '/categories', label: t('categories') },
        { href: '/about', label: t('about') },
      ],
    },
    {
      title: t('forFarmers'),
      links: [
        { href: '/join-farmer', label: t('join') },
        { href: '/faq', label: t('faq') },
      ],
    },
    {
      title: t('legal'),
      links: [
        { href: '/legal/privacy', label: t('privacy') },
        { href: '/legal/terms', label: t('terms') },
        { href: '/contact', label: t('contact') },
      ],
    },
  ];

  return (
    <footer className="mt-24 bg-forest-deep text-canvas">
      <Container className="py-14">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div>
            <div className="flex items-center gap-2.5">
              <LogoMark className="size-10" />
              <div>
                <p className="text-lg font-extrabold tracking-tight">AgriDirect</p>
                <p className="text-xs text-canvas/70">{siteConfig.tagline[locale]}</p>
              </div>
            </div>
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-canvas/75">{t('aboutText')}</p>
            <p className="mt-4 text-xs text-canvas/55">{t('coverageLine')}</p>
          </div>

          {columns.map((column) => (
            <div key={column.title}>
              <h2 className="text-sm font-bold text-white">{column.title}</h2>
              <ul className="mt-4 space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-canvas/70 transition hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-white/10 pt-6 text-xs text-canvas/55 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} AgriDirect. {t('rights')}
          </p>
          <p className="flex items-center gap-3">
            <span>{t('madeIn')}</span>
            <span aria-hidden>·</span>
            <span>{t('phase')}</span>
          </p>
        </div>
      </Container>
    </footer>
  );
}
