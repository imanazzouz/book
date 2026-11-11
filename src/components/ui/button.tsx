import type { ComponentProps, ReactNode } from 'react';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/cn';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'inverse';
type Size = 'sm' | 'md' | 'lg';

const base =
  'inline-flex items-center justify-center gap-2 rounded-full font-semibold transition duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] disabled:cursor-not-allowed disabled:opacity-55 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest';

const variants: Record<Variant, string> = {
  primary: 'bg-forest text-white shadow-soft hover:bg-forest-deep active:translate-y-px',
  secondary: 'bg-soft text-forest-deep hover:bg-soft-deep active:translate-y-px',
  outline: 'border border-line-strong bg-white/70 text-ink hover:border-forest hover:text-forest',
  ghost: 'text-forest hover:bg-soft/70',
  inverse: 'bg-canvas text-forest-deep hover:bg-white active:translate-y-px',
};

const sizes: Record<Size, string> = {
  sm: 'h-9 px-4 text-sm',
  md: 'h-11 px-5 text-sm',
  lg: 'h-13 px-7 text-base',
};

export function buttonStyles(variant: Variant = 'primary', size: Size = 'md', className?: string) {
  return cn(base, variants[variant], sizes[size], className);
}

export interface ButtonProps extends ComponentProps<'button'> {
  variant?: Variant;
  size?: Size;
}

export function Button({ variant = 'primary', size = 'md', className, ...props }: ButtonProps) {
  return <button className={buttonStyles(variant, size, className)} {...props} />;
}

export interface ButtonLinkProps {
  href: ComponentProps<typeof Link>['href'];
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
  prefetch?: boolean;
}

export function ButtonLink({
  href,
  variant = 'primary',
  size = 'md',
  className,
  children,
  prefetch,
}: ButtonLinkProps) {
  return (
    <Link href={href} className={buttonStyles(variant, size, className)} prefetch={prefetch}>
      {children}
    </Link>
  );
}
