import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for static assets, internal Next.js paths, and API routes
  if (
    pathname.startsWith('/_next') || 
    pathname.startsWith('/api') || 
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // 1. Check for the "System Initialized" flag in cookies
  // This avoids hitting the backend API on every single page navigation
  const sysInitCookie = request.cookies.get('sys_init');

  if (sysInitCookie?.value === '1') {
    // If system is initialized, block access to the setup page
    if (pathname === '/setup') {
      return NextResponse.redirect(new URL('/auth', request.url));
    }
    return NextResponse.next();
  }

  // 2. If flag is missing, verify status with the backend
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

    // We call the backend directly from the server-side middleware
    const statusRes = await fetch(`${apiUrl}/api/v1/auth/setup-status`, {
      cache: 'no-store', // Always get fresh status if cookie is missing
    });
    
    if (!statusRes.ok) return NextResponse.next();
    
    const { isInitialized } = await statusRes.json();

    if (isInitialized) {
      // If initialized, allow normal flow
      const response = NextResponse.next();
      
      // Set a persistent cookie so the middleware skips this check next time
      response.cookies.set('sys_init', '1', { 
        maxAge: 31536000, // 1 year
        path: '/',
        httpOnly: true,
        sameSite: 'strict',
        secure: process.env.NODE_ENV === 'production'
      });
      
      return response;
    } else {
      // If NOT initialized, force them to the local setup wizard
      if (pathname !== '/setup') {
        return NextResponse.redirect(new URL('/setup', request.url));
      }
    }
  } catch (err) {
    // If backend is down, allow request to proceed to avoid total blackout,
    // but log the error for diagnostics.
    console.error('Middleware: System initialization check failed', err);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
