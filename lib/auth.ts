// lib/auth.ts
// Authentication and authorization utilities

import { NextRequest, NextResponse } from 'next/server';

/**
 * Auth configuration
 */
export interface AuthConfig {
  // API key for external access
  apiKey?: string;
  // Whether auth is required (false in development by default)
  requireAuth: boolean;
  // Routes that skip auth (e.g., health checks)
  publicRoutes: string[];
}

/**
 * Get auth configuration from environment
 */
export function getAuthConfig(): AuthConfig {
  const isDev = process.env.NODE_ENV === 'development';

  return {
    apiKey: process.env.API_KEY,
    // Require auth in production if API_KEY is set
    requireAuth: !isDev && !!process.env.API_KEY,
    publicRoutes: [
      '/api/health',
      '/api/demo/create-audit-asset',
      '/api/demo/cleanup',
    ],
  };
}

/**
 * Result of auth check
 */
export interface AuthResult {
  authenticated: boolean;
  error?: string;
  statusCode?: number;
}

/**
 * Validate API key from request
 */
export function validateApiKey(req: NextRequest): AuthResult {
  const config = getAuthConfig();

  // If auth not required, allow all
  if (!config.requireAuth) {
    return { authenticated: true };
  }

  // Check if route is public
  const pathname = req.nextUrl.pathname;
  if (config.publicRoutes.some(route => pathname.startsWith(route))) {
    return { authenticated: true };
  }

  // No API key configured but auth required - misconfiguration
  if (!config.apiKey) {
    console.warn('[auth] Auth required but no API_KEY configured');
    return { authenticated: true }; // Fail open in this case
  }

  // Check Authorization header
  const authHeader = req.headers.get('authorization');

  if (!authHeader) {
    return {
      authenticated: false,
      error: 'Missing Authorization header',
      statusCode: 401,
    };
  }

  // Support both "Bearer <key>" and just "<key>"
  const providedKey = authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : authHeader;

  if (providedKey !== config.apiKey) {
    return {
      authenticated: false,
      error: 'Invalid API key',
      statusCode: 401,
    };
  }

  return { authenticated: true };
}

/**
 * Create unauthorized response
 */
export function unauthorizedResponse(message: string = 'Unauthorized'): NextResponse {
  return NextResponse.json(
    { error: message },
    { status: 401 }
  );
}

/**
 * Higher-order function to wrap API handlers with auth
 */
export function withAuth<T extends (...args: any[]) => Promise<NextResponse>>(
  handler: T
): T {
  return (async (req: NextRequest, ...rest: any[]) => {
    const authResult = validateApiKey(req);

    if (!authResult.authenticated) {
      return unauthorizedResponse(authResult.error);
    }

    return handler(req, ...rest);
  }) as T;
}

/**
 * Rate limiting configuration (simple in-memory implementation)
 */
interface RateLimitConfig {
  windowMs: number;      // Time window in milliseconds
  maxRequests: number;   // Max requests per window
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Simple rate limiter
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = { windowMs: 60000, maxRequests: 60 }
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(identifier);

  // Clean up expired entries periodically
  if (Math.random() < 0.01) {
    for (const [key, value] of rateLimitStore.entries()) {
      if (value.resetAt < now) {
        rateLimitStore.delete(key);
      }
    }
  }

  if (!entry || entry.resetAt < now) {
    // New window
    const newEntry: RateLimitEntry = {
      count: 1,
      resetAt: now + config.windowMs,
    };
    rateLimitStore.set(identifier, newEntry);
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetAt: newEntry.resetAt,
    };
  }

  if (entry.count >= config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetAt,
    };
  }

  entry.count++;
  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetAt: entry.resetAt,
  };
}

/**
 * Get client identifier for rate limiting
 */
export function getClientIdentifier(req: NextRequest): string {
  // Try X-Forwarded-For first (for proxied requests)
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  // Fall back to a hash of user-agent + some request info
  const ua = req.headers.get('user-agent') || 'unknown';
  return `ua:${ua.slice(0, 50)}`;
}

/**
 * Rate limit exceeded response
 */
export function rateLimitResponse(resetAt: number): NextResponse {
  const retryAfter = Math.ceil((resetAt - Date.now()) / 1000);

  return NextResponse.json(
    { error: 'Rate limit exceeded', retryAfter },
    {
      status: 429,
      headers: {
        'Retry-After': String(retryAfter),
        'X-RateLimit-Reset': String(resetAt),
      },
    }
  );
}
