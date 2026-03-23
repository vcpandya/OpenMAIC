import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip for static assets and Next.js internals
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/avatars/') ||
    pathname.includes('.') // static files
  ) {
    return NextResponse.next();
  }

  // Always allow setup, auth, and API routes
  if (
    pathname.startsWith('/setup') ||
    pathname.startsWith('/auth/') ||
    pathname.startsWith('/api/')
  ) {
    return NextResponse.next();
  }

  const deploymentMode = process.env.DEPLOYMENT_MODE;

  // --- Setup wizard redirect (first-run) ---
  const setupDone = request.cookies.get('openmaic-setup-done');
  if (!setupDone && !deploymentMode) {
    return NextResponse.redirect(new URL('/setup', request.url));
  }

  // --- Organization mode: require auth ---
  const isOrgMode = deploymentMode === 'organization' ||
    setupDone?.value === 'organization' ||
    !!process.env.DATABASE_URL;

  if (isOrgMode) {
    // Check for NextAuth session token
    const sessionToken =
      request.cookies.get('__Secure-authjs.session-token') ||
      request.cookies.get('authjs.session-token') ||
      request.cookies.get('next-auth.session-token');

    if (!sessionToken) {
      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Admin routes — checked by admin layout server component, not middleware
    // (middleware can't decode JWT without crypto, so role checks happen in layout)
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all routes except static files and API
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
