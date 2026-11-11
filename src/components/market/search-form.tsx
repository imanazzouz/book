import { Search } from 'lucide-react';

export function SearchForm({
  action,
  placeholder,
  buttonLabel,
  size = 'md',
}: {
  action: string;
  placeholder: string;
  buttonLabel: string;
  size?: 'md' | 'lg';
}) {
  return (
    <form
      action={action}
      method="get"
      role="search"
      className="flex w-full items-center gap-2 rounded-full border border-line-strong bg-white p-1.5 shadow-soft focus-within:border-forest"
    >
      <label htmlFor={`search-${size}`} className="sr-only">
        {buttonLabel}
      </label>
      <Search className="ms-3 size-5 shrink-0 text-muted" aria-hidden />
      <input
        id={`search-${size}`}
        type="search"
        name="q"
        placeholder={placeholder}
        autoComplete="off"
        className={
          size === 'lg'
            ? 'h-11 min-w-0 flex-1 bg-transparent text-base text-ink placeholder:text-muted/70 focus:outline-none'
            : 'h-10 min-w-0 flex-1 bg-transparent text-sm text-ink placeholder:text-muted/70 focus:outline-none'
        }
      />
      <button
        type="submit"
        className={
          size === 'lg'
            ? 'inline-flex h-11 shrink-0 items-center justify-center rounded-full bg-forest px-6 text-sm font-semibold text-white transition hover:bg-forest-deep'
            : 'inline-flex h-10 shrink-0 items-center justify-center rounded-full bg-forest px-5 text-sm font-semibold text-white transition hover:bg-forest-deep'
        }
      >
        {buttonLabel}
      </button>
    </form>
  );
}
