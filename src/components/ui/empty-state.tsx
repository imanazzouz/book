import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export function EmptyState({
  icon,
  title,
  body,
  actions,
  className,
}: {
  icon?: ReactNode;
  title: string;
  body: string;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'rounded-card border border-dashed border-line-strong bg-white/70 px-6 py-14 text-center',
        className,
      )}
    >
      {icon ? (
        <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-2xl bg-soft text-forest">
          {icon}
        </div>
      ) : null}
      <h3 className="text-lg font-bold text-forest-deep">{title}</h3>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-muted">{body}</p>
      {actions ? <div className="mt-7 flex flex-wrap items-center justify-center gap-3">{actions}</div> : null}
    </div>
  );
}
