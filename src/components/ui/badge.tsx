import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

type Tone = 'leaf' | 'soft' | 'neutral' | 'danger' | 'warning';

const tones: Record<Tone, string> = {
  leaf: 'bg-forest text-white',
  soft: 'bg-soft text-forest-deep',
  neutral: 'bg-canvas-deep text-muted',
  danger: 'bg-danger/10 text-danger',
  warning: 'bg-warning/10 text-warning',
};

export function Badge({
  children,
  tone = 'soft',
  className,
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
