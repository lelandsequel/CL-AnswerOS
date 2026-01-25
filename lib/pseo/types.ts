// lib/pseo/types.ts
// Canonical types for audit-driven pSEO generation
// Part of BBB: Audit → pSEO Pipeline

import type { StructuredAudit } from '../types';
import type { AuditIssue } from '../audit-engine/types';

// ============================================================================
// Page Family Types
// ============================================================================

/**
 * Categories of programmatic pages that can be generated
 */
export type PageFamilyType =
  | 'faq_hub'           // FAQ collection pages targeting voice/AI search
  | 'service_page'      // Individual service landing pages
  | 'service_location'  // Service + location combinations (e.g., "plumbing in austin")
  | 'comparison'        // Vs pages (e.g., "X vs Y")
  | 'how_to'            // Instructional content targeting featured snippets
  | 'glossary'          // Definition pages for industry terms
  | 'case_study'        // Results-focused pages with schema markup
  | 'pricing'           // Pricing/cost pages (high intent)
  | 'reviews'           // Review aggregation pages with Review schema
  | 'resource_hub';     // Pillar content pages

/**
 * Priority levels for page recommendations
 */
export type PagePriority = 'critical' | 'high' | 'medium' | 'low';

// ============================================================================
// Template Specification
// ============================================================================

/**
 * Variable definition for URL patterns and content templates
 */
export interface TemplateVariable {
  name: string;
  description: string;
  source: 'audit' | 'keyword_data' | 'manual' | 'derived';
  required: boolean;
  examples?: string[];
}

/**
 * Section definition for page templates
 */
export interface TemplateSection {
  id: string;
  name: string;
  required: boolean;
  schemaType?: string;  // e.g., 'FAQPage', 'HowTo', 'Service'
  minWords?: number;
  maxWords?: number;
  guidelines?: string;
}

/**
 * Full template specification for a page family
 */
export interface pSEOPageTemplateSpec {
  family: PageFamilyType;
  name: string;
  description: string;

  // URL structure
  urlPattern: string;  // e.g., '/services/{service}/{location}'
  urlVariables: TemplateVariable[];

  // Content structure
  requiredSections: TemplateSection[];
  optionalSections: TemplateSection[];

  // Schema requirements
  requiredSchema: string[];   // e.g., ['Service', 'FAQPage', 'BreadcrumbList']
  optionalSchema: string[];

  // SEO requirements
  titleTemplate: string;      // e.g., '{service} in {location} | {brand}'
  metaDescTemplate: string;
  h1Template: string;

  // Generation hints
  targetWordCount: number;
  internalLinkingMin: number;
  ctaPlacement: 'top' | 'bottom' | 'both';
}

// ============================================================================
// Page Recommendations (from Audit Analysis)
// ============================================================================

/**
 * A single page recommendation derived from audit analysis
 */
export interface pSEOPageRecommendation {
  id: string;                      // Unique ID for tracking
  family: PageFamilyType;

  // What to generate
  title: string;                   // Page title
  targetUrl: string;               // Suggested URL path
  targetKeywords: string[];        // Primary + secondary keywords

  // Why this page
  reason: string;                  // Human-readable explanation
  sourceIssueIds: string[];        // Which audit issues drove this
  sourceOpportunityIds: string[];  // Which opportunities drove this

  // Dependencies
  dependsOnArtifacts: string[];    // Semantic artifact IDs that must exist first
                                   // e.g., ['schema.organization', 'content.faq']

  // Prioritization
  priority: PagePriority;
  expectedImpact: {
    traffic: 'low' | 'medium' | 'high';
    conversions: 'low' | 'medium' | 'high';
    aeoVisibility: 'low' | 'medium' | 'high';
  };

  // Variables for template
  variables: Record<string, string>;
}

// ============================================================================
// LLM-Generated Content (with Validation)
// ============================================================================

/**
 * Raw LLM-generated page content (before validation)
 */
export interface LLMGeneratedPageContent {
  pageId: string;                  // Links to pSEOPageRecommendation.id

  // Meta
  title: string;
  metaTitle: string;               // May differ from title
  metaDescription: string;

  // Content
  h1: string;
  introductionParagraph: string;   // 2-3 sentences
  sections: Array<{
    heading: string;
    content: string;
    schemaType?: string;
  }>;

  // FAQ (if applicable)
  faqs?: Array<{
    question: string;
    answer: string;
  }>;

  // CTAs
  primaryCTA: string;
  secondaryCTA?: string;

  // Internal linking suggestions
  suggestedInternalLinks: Array<{
    anchorText: string;
    targetPath: string;
    reason: string;
  }>;

  // Generation metadata
  generatedAt: string;
  modelUsed: string;
}

/**
 * Validation result from cross-model check
 */
export interface ContentValidation {
  valid: boolean;
  score: number;                   // 0-100 confidence score
  issues: Array<{
    type: 'hallucination' | 'inconsistency' | 'missing_context' | 'keyword_stuffing' | 'tone_mismatch';
    description: string;
    location: string;              // Which section/field
    severity: 'error' | 'warning';
    suggestion: string;
  }>;
  validatedAt: string;
  validatorModel: string;
}

/**
 * Validated and potentially corrected page content
 */
export interface ValidatedPageContent extends LLMGeneratedPageContent {
  validation: ContentValidation;
  corrected: boolean;
  correctedAt?: string;
  correctorModel?: string;

  // Original content if corrected
  originalContent?: Partial<LLMGeneratedPageContent>;
}

// ============================================================================
// pSEO Plan (Full Output)
// ============================================================================

/**
 * Context extracted from audit for pSEO generation
 */
export interface AuditDerivedContext {
  companyName: string;
  industry: string;
  services: string[];
  locations: string[];
  targetCustomer: string;
  brandVoice: 'professional' | 'casual' | 'technical' | 'friendly';
  competitorMentions: string[];

  // From audit scores
  currentSeoScore: number;
  currentAeoScore: number;
  biggestGaps: string[];           // Top issues by impact
}

/**
 * Complete pSEO generation plan
 */
export interface pSEOPlan {
  id: string;
  createdAt: string;

  // Source
  sourceAuditId?: string;
  auditContext: AuditDerivedContext;

  // Strategy
  strategy: {
    focus: 'aeo_first' | 'traffic_first' | 'balanced';
    reasoning: string;
    totalPagesRecommended: number;
    estimatedTimeToImplement: string;
  };

  // Page families to generate
  families: Array<{
    type: PageFamilyType;
    count: number;
    priority: PagePriority;
    rationale: string;
  }>;

  // Templates (one per family)
  templates: pSEOPageTemplateSpec[];

  // Individual page recommendations
  recommendations: pSEOPageRecommendation[];

  // Implementation order
  phases: Array<{
    phase: number;
    name: string;
    pageIds: string[];
    blockedBy: string[];           // Artifact IDs that must complete first
    estimatedImpact: {
      seoLift: number;
      aeoLift: number;
    };
  }>;

  // Next actions
  nextActions: Array<{
    action: string;
    priority: 'immediate' | 'soon' | 'later';
    dependsOn?: string[];
  }>;
}

// ============================================================================
// API Request/Response Types
// ============================================================================

/**
 * Request to generate pSEO plan
 */
export interface GeneratePseoRequest {
  // Option 1: From audit (preferred)
  structuredAudit?: StructuredAudit;
  rawScanHtml?: string;
  keywordMetrics?: Array<{
    keyword: string;
    volume: number;
    difficulty: number;
    cpc?: number;
  }>;

  // Option 2: Manual input (legacy support)
  companyName?: string;
  industry?: string;
  services?: string[];
  locations?: string[];

  // Strategy options
  useAuditDrivenStrategy?: boolean;  // true = use audit analysis, false = manual/deterministic
  focus?: 'aeo_first' | 'traffic_first' | 'balanced';
  maxPages?: number;
}

/**
 * Response from pSEO plan generation
 */
export interface GeneratePseoResponse {
  success: boolean;
  plan?: pSEOPlan;
  error?: string;

  // Generation metadata
  generationMode: 'audit_driven' | 'manual' | 'hybrid';
  llmCalls: number;
  validationScores: Record<string, number>;  // pageId -> validation score
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Maps audit issue types to page families that can address them
 */
export const ISSUE_TO_PAGE_FAMILY: Record<string, PageFamilyType[]> = {
  'faq': ['faq_hub', 'how_to'],
  'schema': ['service_page', 'faq_hub', 'reviews'],
  'voice': ['faq_hub', 'how_to'],
  'entity': ['service_page', 'case_study'],
  'content': ['service_page', 'resource_hub', 'glossary'],
  'local': ['service_location', 'reviews'],
  'featured-snippet': ['faq_hub', 'how_to', 'comparison'],
};

/**
 * Default template specs per family (can be customized)
 */
export const DEFAULT_TEMPLATES: Partial<Record<PageFamilyType, Partial<pSEOPageTemplateSpec>>> = {
  faq_hub: {
    requiredSchema: ['FAQPage', 'BreadcrumbList'],
    targetWordCount: 1500,
    titleTemplate: '{topic} FAQ | {brand}',
  },
  service_page: {
    requiredSchema: ['Service', 'Organization', 'BreadcrumbList'],
    targetWordCount: 2000,
    titleTemplate: '{service} Services | {brand}',
  },
  service_location: {
    requiredSchema: ['Service', 'LocalBusiness', 'BreadcrumbList'],
    targetWordCount: 1800,
    titleTemplate: '{service} in {location} | {brand}',
  },
  comparison: {
    requiredSchema: ['Article', 'BreadcrumbList'],
    targetWordCount: 2500,
    titleTemplate: '{optionA} vs {optionB}: {year} Comparison | {brand}',
  },
  how_to: {
    requiredSchema: ['HowTo', 'FAQPage', 'BreadcrumbList'],
    targetWordCount: 1800,
    titleTemplate: 'How to {action}: Step-by-Step Guide | {brand}',
  },
};
