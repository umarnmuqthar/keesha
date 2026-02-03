import { NextResponse } from 'next/server';

export async function middleware(request) {
    const adminSession = request.cookies.get('session_admin')?.value;
    const userSession = request.cookies.get('session_user')?.value;
    const { pathname } = request.nextUrl;

    // 1. Admin Handling
    // NOTE: This middleware only checks for the existence of the cookie.
    // It does NOT verify the signature or revocation status (requires Admin SDK).
    // Secure pages MUST verify the session again in Server Actions or Page Components.
    if (pathname.startsWith('/admin')) {
        // Admin Login Page
        if (pathname === '/admin/login') {
            if (adminSession) {
                return NextResponse.redirect(new URL('/admin', request.url));
            }
            return NextResponse.next();
        }

        // Protected Admin Routes
        if (!adminSession) {
            return NextResponse.redirect(new URL('/admin/login', request.url));
        }

        return NextResponse.next();
    }

    // 2. User Handling
    const publicUserPaths = [
        '/login',
        '/signup',
        '/forgot-password',
        '/reset-password'
    ];
    const isPublicUserPath = publicUserPaths.some(path => pathname.startsWith(path));

    // Authenticated User on Public Page -> Redirect to Dashboard
    if (userSession && isPublicUserPath) {
        return NextResponse.redirect(new URL('/', request.url));
    }

    // Unauthenticated User on Protected Page -> Redirect to Login
    if (!userSession && !isPublicUserPath) {
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
