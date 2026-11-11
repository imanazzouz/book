import type { ReactNode } from 'react';
import { Info } from 'lucide-react';
import { cn } from '@/lib/cn';

/**
 * Honest status notice: used where a feature is intentionally not active yet,
 * so no control ever looks functional while doing nothing.
 */
export function Notice({
  children,
  tone = 'info',
  className,
}: {
  children: ReactNode;
  tone?: 'info' | 'warning';
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-xl border px-4 py-3 text-sm leading-relaxed',
        tone === 'info'
          ? 'border-info/25 bg-info/5 text-info'
          : 'border-warning/30 bg-warning/5 text-warning',
        className,
      )}
    >
      <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
      <p>{children}</p>
    </div>
  );
}
