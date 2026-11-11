import { createNavigation } from 'next-intl/navigation';
import { routing } from './routing';

/** Locale-aware navigation primitives: they keep the active locale prefix. */
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
