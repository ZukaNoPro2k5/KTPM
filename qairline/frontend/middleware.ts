import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const token = request.headers.get("Authorization");
    console.log('Middleware Token:', token);

    if (!token) {
        const url = request.nextUrl.clone();
        if (url.pathname.startsWith('/admin/home')) {
            return NextResponse.redirect(new URL('/admin', request.url));
        }
        return NextResponse.redirect(new URL('/home', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [],
};