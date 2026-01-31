import { NextResponse } from 'next/server';

export async function middleware(request) {
    const session = request.cookies.get('session')?.value;
    const { pathname } = request.nextUrl;

    // Public routes that don't require authentication
    const publicPaths = ['/login', '/signup'];
    const isPublicPath = publicPaths.some(path => pathname.startsWith(path));

    // Special handling for admin routes
    if (pathname.startsWith('/admin')) {
        // If unauthenticated and not on login page, go to admin/login
        if (!session && pathname !== '/admin/login') {
            return NextResponse.redirect(new URL('/admin/login', request.url));
        }
        // If authenticated and on login page, go to admin dashboard
        // Note: We don't verify strict admin role here (cookie only), page does that.
        // But preventing login page access if logged in is good UX.
        // If authenticated and on login page, we allow access so they can switch accounts or see "Not Authorized" message.
        // Previously: return NextResponse.redirect(new URL('/admin', request.url));
        if (session && pathname === '/admin/login') {
            return NextResponse.next();
        }
        return NextResponse.next();
    }

    // 1. Redirect authenticated users away from login/signup
    if (session && isPublicPath) {
        return NextResponse.redirect(new URL('/', request.url));
    }

    // 2. Redirect unauthenticated users to login
    if (!session && !isPublicPath) {
        // Exclude internal nextjs paths and static assets
        if (
            pathname.startsWith('/_next') ||
            pathname.startsWith('/api') ||
            pathname.includes('.')
        ) {
            return NextResponse.next();
        }
        return NextResponse.redirect(new URL('/login', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
};
