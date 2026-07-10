import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname === '/api/gateway/events') {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.delete('accept-encoding');

    return NextResponse.next({
      request: { headers: requestHeaders },
    });
  }
}

export const config = {
  matcher: '/api/gateway/events',
};
