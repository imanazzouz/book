import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/cn';

/**
 * Brand mark: a wheat ear and leaf drawn as vectors (no living creatures, no
 * generated imagery). Colours come from the fixed brand palette.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 44 44" className={cn('size-10', className)} role="img" aria-label="AgriDirect">
      <rect width="44" height="44" rx="13" fill="#244A35" />
      <path d="M22 35V15" stroke="#D9E5CF" strokeWidth="1.8" strokeLinecap="round" />
      <g fill="#D9E5CF">
        <ellipse cx="17.2" cy="16.8" rx="4.1" ry="2.3" transform="rotate(-38 17.2 16.8)" />
        <ellipse cx="26.8" cy="16.8" rx="4.1" ry="2.3" transform="rotate(38 26.8 16.8)" />
        <ellipse cx="16.9" cy="22.6" rx="3.9" ry="2.2" transform="rotate(-38 16.9 22.6)" />
        <ellipse cx="27.1" cy="22.6" rx="3.9" ry="2.2" transform="rotate(38 27.1 22.6)" />
        <ellipse cx="17.4" cy="28.2" rx="3.4" ry="2" transform="rotate(-38 17.4 28.2)" />
        <ellipse cx="26.6" cy="28.2" rx="3.4" ry="2" transform="rotate(38 26.6 28.2)" />
      </g>
      <path
        d="M22 15c1.9-3.9 5-5.6 8.6-5.9-.4 3.9-2.7 6.4-6.5 7.3"
        fill="#6B9A62"
      />
    </svg>
  );
}

export function Logo({ className, tagline }: { className?: string; tagline?: string }) {
  return (
    <Link href="/" className={cn('group inline-flex items-center gap-2.5', className)} aria-label="AgriDirect">
      <LogoMark className="transition group-hover:scale-[1.03]" />
      <span className="flex flex-col leading-none">
        <span className="text-lg font-extrabold tracking-tight text-forest-deep">AgriDirect</span>
        {tagline ? (
          <span className="mt-1 text-[11px] font-medium text-muted">{tagline}</span>
        ) : null}
      </span>
    </Link>
  );
}
