import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export function Card({
  children,
  className,
  as: Tag = 'div',
}: {
  children: ReactNode;
  className?: string;
  as?: 'div' | 'article' | 'section' | 'li';
}) {
  return (
    <Tag
      className={cn(
        'rounded-card border border-line bg-white shadow-soft',
        className,
      )}
    >
      {children}
    </Tag>
  );
}
