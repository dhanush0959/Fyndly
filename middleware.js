import { withAuth } from 'next-auth/middleware';

/**
 * Protect all app pages that require authentication.
 * NextAuth will redirect unauthenticated visitors to the signIn page (/).
 */
export default withAuth({
  pages: {
    signIn: '/',
  },
});

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/report-lost/:path*',
    '/report-found/:path*',
    '/gallery/:path*',
    '/chat/:path*',
  ],
};
