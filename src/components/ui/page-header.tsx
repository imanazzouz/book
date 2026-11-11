import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  children,
  className,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <header className={cn('max-w-3xl', className)}>
      {eyebrow ? (
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-leaf">{eyebrow}</p>
      ) : null}
      <h1 className="text-3xl font-extrabold leading-tight text-forest-deep sm:text-4xl">{title}</h1>
      {subtitle ? <p className="mt-4 text-base leading-relaxed text-muted">{subtitle}</p> : null}
      {children}
    </header>
  );
}
