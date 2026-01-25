// lib/validation.ts
// Input validation schemas and utilities using Zod

import { z } from 'zod';
import { NextRequest, NextResponse } from 'next/server';

// =============================================================================
// COMMON SCHEMAS
// =============================================================================

/**
 * URL schema with normalization
 */
export const UrlSchema = z
  .string()
  .min(1, 'URL is required')
  .transform((val) => {
    const trimmed = val.trim();
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      return `https://${trimmed}`;
    }
    return trimmed;
  })
  .refine(
    (val) => {
      try {
        new URL(val);
        return true;
      } catch {
        return false;
      }
    },
    { message: 'Invalid URL format' }
  );

/**
 * Non-empty string schema
 */
export const NonEmptyString = z.string().min(1, 'This field is required');

/**
 * Optional non-empty string (empty string becomes undefined)
 */
export const OptionalString = z
  .string()
  .optional()
  .transform((val) => (val?.trim() || undefined));

/**
 * Positive integer schema
 */
export const PositiveInt = z.number().int().positive();

/**
 * Pagination schema
 */
export const PaginationSchema = z.object({
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
});

// =============================================================================
// API-SPECIFIC SCHEMAS
// =============================================================================

/**
 * Run Audit request
 */
export const RunAuditSchema = z.object({
  url: UrlSchema,
});

/**
 * Deep Audit request
 */
export const DeepAuditSchema = z.object({
  url: UrlSchema,
  maxPages: z.number().int().min(1).max(500).default(50),
  includeBacklinks: z.boolean().default(false),
  includeKeywordGaps: z.boolean().default(false),
  competitors: z.array(z.string()).optional(),
});

/**
 * Execution Plan request
 */
export const ExecutionPlanSchema = z.object({
  deepAudit: z.object({
    url: z.string(),
    domain: z.string(),
    auditedAt: z.string(),
    overallScore: z.number(),
    seoScore: z.number(),
    aeoScore: z.number(),
    seo: z.object({
      technical: z.any(),
      onPage: z.any(),
      content: z.any(),
      authority: z.any(),
      ux: z.any(),
    }),
    aeo: z.object({
      entityDefinition: z.any(),
      schemaMarkup: z.any(),
      faqTargeting: z.any(),
      voiceSearch: z.any(),
      aiSearch: z.any(),
    }),
    rawData: z.any().optional(),
    actionPlan: z.any(),
  }),
  format: z.enum(['full', 'workflow', 'bbb']).default('full'),
});

/**
 * Run Scan request
 */
export const RunScanSchema = z.object({
  url: UrlSchema,
  depth: z.number().int().min(1).max(3).default(1),
});

/**
 * Client create/update request
 */
export const ClientSchema = z.object({
  name: NonEmptyString,
  primaryDomain: OptionalString,
  industry: OptionalString,
  notes: OptionalString,
});

/**
 * Audit save request
 */
export const AuditSaveSchema = z.object({
  url: UrlSchema,
  domain: NonEmptyString,
  summary: OptionalString,
  opportunityRating: OptionalString,
  rawScore: z.number().optional(),
  structuredAudit: z.any().optional(),
  rawScan: z.string().optional(),
  keywordMetrics: z.any().optional(),
  clientId: z.string().uuid().optional(),
});

/**
 * Client Asset save request
 */
export const ClientAssetSchema = z.object({
  clientId: z.string().uuid().optional().nullable(),
  type: z.enum(['audit', 'pseo', 'deck', 'report', 'other']),
  title: NonEmptyString,
  summary: OptionalString,
  payload: z.any(),
  tags: z.array(z.string()).default([]),
});

/**
 * Keyword Research request
 */
export const KeywordResearchSchema = z.object({
  seed: NonEmptyString,
  location: z.string().default('United States'),
  language: z.string().default('en'),
  limit: z.number().int().min(1).max(100).default(20),
});

/**
 * Lead Generator request
 */
export const LeadGeneratorSchema = z.object({
  industry: NonEmptyString,
  location: OptionalString,
  companySize: OptionalString,
  keywords: z.array(z.string()).optional(),
  limit: z.number().int().min(1).max(50).default(10),
});

/**
 * Content Generate request
 */
export const ContentGenerateSchema = z.object({
  topic: NonEmptyString,
  type: z.enum(['blog', 'landing', 'product', 'faq', 'email']).default('blog'),
  tone: z.string().default('professional'),
  keywords: z.array(z.string()).optional(),
  wordCount: z.number().int().min(100).max(5000).default(800),
  outline: z.array(z.string()).optional(),
});

/**
 * Lelandize (Report Generation) request
 */
export const LelandizeSchema = z.object({
  url: UrlSchema,
  clientName: OptionalString,
  structuredAudit: z.any(),
  notes: OptionalString,
  sassLevel: z.number().int().min(0).max(10).default(5),
  chaosLevel: z.number().int().min(0).max(10).default(3),
});

/**
 * Tone Adjust request
 */
export const ToneAdjustSchema = z.object({
  content: NonEmptyString,
  targetTone: z.enum([
    'professional',
    'casual',
    'technical',
    'friendly',
    'urgent',
    'persuasive',
  ]),
  preserveLength: z.boolean().default(true),
});

/**
 * Export Report request
 */
export const ExportReportSchema = z.object({
  url: UrlSchema,
  domain: NonEmptyString,
  clientName: OptionalString,
  rawScore: z.number().optional(),
  opportunityRating: OptionalString,
  structuredAudit: z.any(),
  operatorReport: z.any(),
  format: z.enum(['txt', 'md']).default('md'),
});

/**
 * Fix Engine request
 */
export const FixEngineSchema = z.object({
  url: UrlSchema,
  issues: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      category: z.string(),
      severity: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']),
    })
  ),
  generateCode: z.boolean().default(true),
});

/**
 * Press Release request
 */
export const PressReleaseSchema = z.object({
  companyName: NonEmptyString,
  headline: NonEmptyString,
  details: NonEmptyString,
  quotes: z.array(z.object({
    speaker: z.string(),
    title: z.string(),
    quote: z.string(),
  })).optional(),
  contactInfo: z.object({
    name: z.string(),
    email: z.string().email(),
    phone: z.string().optional(),
  }).optional(),
});

/**
 * Sales Generate request
 */
export const SalesGenerateSchema = z.object({
  companyName: NonEmptyString,
  industry: NonEmptyString,
  product: NonEmptyString,
  targetCustomer: NonEmptyString,
  uniqueValue: OptionalString,
  format: z.enum(['email', 'script', 'proposal']).default('email'),
});

// =============================================================================
// VALIDATION UTILITIES
// =============================================================================

/**
 * Validation result type
 */
export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    details: z.ZodIssue[];
  };
}

/**
 * Validate request body against a Zod schema
 */
export async function validateRequestBody<T extends z.ZodSchema>(
  req: NextRequest,
  schema: T
): Promise<ValidationResult<z.infer<T>>> {
  try {
    const body = await req.json();
    const result = schema.safeParse(body);

    if (result.success) {
      return { success: true, data: result.data };
    }

    return {
      success: false,
      error: {
        message: 'Validation failed',
        details: result.error.issues,
      },
    };
  } catch {
    return {
      success: false,
      error: {
        message: 'Invalid JSON in request body',
        details: [],
      },
    };
  }
}

/**
 * Create validation error response
 */
export function validationErrorResponse(
  message: string,
  details: z.ZodIssue[] = []
): NextResponse {
  const formattedDetails = details.map((issue) => ({
    field: issue.path.join('.'),
    message: issue.message,
    code: issue.code,
  }));

  return NextResponse.json(
    {
      error: message,
      validationErrors: formattedDetails,
    },
    { status: 400 }
  );
}

/**
 * Higher-order function to wrap handlers with validation
 */
export function withValidation<T extends z.ZodSchema>(
  schema: T,
  handler: (req: NextRequest, data: z.infer<T>) => Promise<NextResponse>
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const result = await validateRequestBody(req, schema);

    if (!result.success) {
      return validationErrorResponse(
        result.error?.message || 'Validation failed',
        result.error?.details
      );
    }

    return handler(req, result.data!);
  };
}

/**
 * Sanitize string input (basic XSS prevention)
 */
export function sanitizeString(input: string): string {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Validate and sanitize URL parameter
 */
export function validateUrlParam(param: string | null): string | null {
  if (!param) return null;

  const decoded = decodeURIComponent(param);
  const result = UrlSchema.safeParse(decoded);

  return result.success ? result.data : null;
}
