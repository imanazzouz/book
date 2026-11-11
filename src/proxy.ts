import createMiddleware from 'next-intl/middleware';
import { routing } from '@/i18n/routing';

/**
 * Next.js 16 `proxy` convention (formerly middleware).
 * Locale routing only. Authorization is never decided here: every sensitive
 * operation re-checks the session and permissions on the server.
 */
export default createMiddleware(routing);

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
