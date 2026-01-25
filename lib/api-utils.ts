// lib/api-utils.ts
// Shared utilities for API routes

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

/**
 * Safely parse JSON from request body.
 * Returns null if parsing fails (instead of throwing).
 */
export async function parseJsonBody<T = Record<string, unknown>>(
  req: NextRequest
): Promise<{ data: T | null; error: string | null }> {
  try {
    const data = await req.json();
    return { data: data as T, error: null };
  } catch {
    return { data: null, error: "Invalid JSON in request body" };
  }
}

/**
 * Validation result - either success with data, or error response
 */
export type ValidationResult<T> =
  | { success: true; data: T; error: null }
  | { success: false; data: null; error: NextResponse };

/**
 * Parse and validate request body with Zod schema.
 */
export async function parseAndValidate<T extends z.ZodSchema>(
  req: NextRequest,
  schema: T
): Promise<ValidationResult<z.infer<T>>> {
  try {
    const body = await req.json();
    const result = schema.safeParse(body);

    if (!result.success) {
      const errors = result.error.issues.map((i) => ({
        field: i.path.join("."),
        message: i.message,
      }));

      return {
        success: false,
        data: null,
        error: NextResponse.json(
          { error: "Validation failed", details: errors },
          { status: 400 }
        ),
      };
    }

    return { success: true, data: result.data, error: null };
  } catch {
    return {
      success: false,
      data: null,
      error: NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      ),
    };
  }
}

/**
 * Extract error message from unknown error type.
 */
export function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  return "An unexpected error occurred";
}

/**
 * Create a standardized error response.
 */
export function errorResponse(
  message: string,
  status: number = 500,
  details?: Record<string, unknown>
): NextResponse {
  return NextResponse.json(
    { error: message, ...details },
    { status }
  );
}

/**
 * Create a standardized success response.
 */
export function successResponse<T>(
  data: T,
  status: number = 200
): NextResponse {
  return NextResponse.json(data, { status });
}

/**
 * Validate required fields in request body.
 * Returns error response if validation fails, null if valid.
 */
export function validateRequired(
  body: Record<string, unknown>,
  fields: string[]
): NextResponse | null {
  const missing = fields.filter(
    (f) => body[f] === undefined || body[f] === null || body[f] === ""
  );

  if (missing.length > 0) {
    return errorResponse(
      `Missing required fields: ${missing.join(", ")}`,
      400
    );
  }

  return null;
}

/**
 * Safely parse a URL string.
 * Returns null if invalid.
 */
export function parseUrl(urlString: string): URL | null {
  try {
    // Ensure URL has protocol
    const normalized = urlString.startsWith("http")
      ? urlString
      : `https://${urlString}`;
    return new URL(normalized);
  } catch {
    return null;
  }
}

/**
 * Extract domain from URL string.
 */
export function extractDomain(urlString: string): string | null {
  const url = parseUrl(urlString);
  if (!url) return null;
  return url.hostname.replace(/^www\./, "");
}
