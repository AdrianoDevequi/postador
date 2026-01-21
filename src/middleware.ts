import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
    const adminSession = request.cookies.get('admin_session')?.value
    const correctPassword = process.env.ADMIN_PASSWORD

    // 1. Allow Login Page and Public Static Assets
    if (
        request.nextUrl.pathname.startsWith('/login') ||
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
    // Secure logic: If no password set on server, or cookie doesn't match, Redirect.
    if (!correctPassword || adminSession !== correctPassword) {
        return NextResponse.redirect(new URL('/login', request.url))
    }

    return NextResponse.next()
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
