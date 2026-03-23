import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip for setup page, API routes, static assets, and Next.js internals
  if (
    pathname.startsWith('/setup') ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/avatars/') ||
    pathname.includes('.') // static files
  ) {
    return NextResponse.next();
  }

  // Check if setup has been completed via cookie (set by setup API)
  const setupDone = request.cookies.get('openmaic-setup-done');
  if (setupDone) {
    return NextResponse.next();
  }

  // Check DEPLOYMENT_MODE env var — if set, skip setup
  if (process.env.DEPLOYMENT_MODE) {
    return NextResponse.next();
  }

  // Redirect to setup
  return NextResponse.redirect(new URL('/setup', request.url));
}

export const config = {
  matcher: [
    // Match all routes except static files and API
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
