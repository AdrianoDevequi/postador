import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { SESSION_COOKIE, verifySessionToken } from '@/lib/session'

export async function middleware(request: NextRequest) {
    // 1. Allow auth pages and public static assets
    if (
        request.nextUrl.pathname.startsWith('/login') ||
        request.nextUrl.pathname.startsWith('/signup') ||
        request.nextUrl.pathname.startsWith('/_next') ||
        request.nextUrl.pathname.includes('.') // public files like favicon.ico
    ) {
        return NextResponse.next()
    }

    // 2. Allow API Routes (They have their own secret check, OR we check cookie)
    // We generally let API routes pass middleware and handle their own auth
    // because Cron Jobs don't have cookies.
    if (request.nextUrl.pathname.startsWith('/api')) {
        return NextResponse.next()
    }

    // 3. Protect everything else (The Dashboard /)
    const userId = await verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value)
    if (!userId) {
        return NextResponse.redirect(new URL('/login', request.url))
    }

    return NextResponse.next()
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
