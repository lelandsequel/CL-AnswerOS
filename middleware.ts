// middleware.ts
// Next.js middleware for auth and rate limiting

import { NextRequest, NextResponse } from 'next/server';

/**
 * Routes that don't require authentication
 */
const PUBLIC_ROUTES = [
  '/api/health',
  '/api/demo',
];

/**
 * Routes with higher rate limits (expensive operations)
 */
const EXPENSIVE_ROUTES = [
  '/api/deep-audit',
  '/api/run-audit',
  '/api/execution-plan',
  '/api/pseo-audit',
];

/**
 * Simple in-memory rate limiter (resets on server restart)
 * For production, use Redis or similar
 */
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

function getRateLimitConfig(pathname: string) {
  if (EXPENSIVE_ROUTES.some(route => pathname.startsWith(route))) {
    return { windowMs: 60000, maxRequests: 10 }; // 10 per minute
  }
  return { windowMs: 60000, maxRequests: 100 }; // 100 per minute
}

function checkRateLimit(identifier: string, config: { windowMs: number; maxRequests: number }) {
  const now = Date.now();
  const entry = rateLimitStore.get(identifier);

  // Clean up old entries occasionally
  if (Math.random() < 0.01) {
    for (const [key, value] of rateLimitStore.entries()) {
      if (value.resetAt < now) {
        rateLimitStore.delete(key);
      }
    }
  }

  if (!entry || entry.resetAt < now) {
    rateLimitStore.set(identifier, { count: 1, resetAt: now + config.windowMs });
    return { allowed: true, remaining: config.maxRequests - 1 };
  }

  if (entry.count >= config.maxRequests) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count++;
  return { allowed: true, remaining: config.maxRequests - entry.count };
}

function getClientIP(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const realIP = req.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }
  return 'unknown';
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Only apply to API routes
  if (!pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  // Skip public routes
  if (PUBLIC_ROUTES.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  const isDev = process.env.NODE_ENV === 'development';
  const apiKey = process.env.API_KEY;

  // =========================================================================
  // RATE LIMITING
  // =========================================================================
  const clientIP = getClientIP(req);
  const rateLimitKey = `${clientIP}:${pathname.split('/').slice(0, 3).join('/')}`;
  const rateLimitConfig = getRateLimitConfig(pathname);
  const rateLimitResult = checkRateLimit(rateLimitKey, rateLimitConfig);

  if (!rateLimitResult.allowed) {
    const retryAfter = Math.ceil(((rateLimitResult.resetAt || Date.now()) - Date.now()) / 1000);
    return NextResponse.json(
      { error: 'Rate limit exceeded', retryAfter },
      {
        status: 429,
        headers: {
          'Retry-After': String(retryAfter),
          'X-RateLimit-Remaining': '0',
        },
      }
    );
  }

  // =========================================================================
  // AUTHENTICATION
  // =========================================================================
  // Skip auth in development or if no API key configured
  if (isDev || !apiKey) {
    const response = NextResponse.next();
    response.headers.set('X-RateLimit-Remaining', String(rateLimitResult.remaining));
    return response;
  }

  // Check Authorization header
  const authHeader = req.headers.get('authorization');

  if (!authHeader) {
    return NextResponse.json(
      { error: 'Missing Authorization header' },
      { status: 401 }
    );
  }

  // Support "Bearer <key>" or just "<key>"
  const providedKey = authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : authHeader;

  if (providedKey !== apiKey) {
    return NextResponse.json(
      { error: 'Invalid API key' },
      { status: 401 }
    );
  }

  // Auth passed
  const response = NextResponse.next();
  response.headers.set('X-RateLimit-Remaining', String(rateLimitResult.remaining));
  return response;
}

export const config = {
  matcher: '/api/:path*',
};
