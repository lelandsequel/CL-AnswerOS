// lib/audit-engine/types.ts
// Type definitions for deep SEO/AEO audit

/**
 * Issue severity levels
 */
export type Severity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

/**
 * Fix types - what kind of deliverable is the fix
 */
export type FixType =
  | 'code'           // Actual code to implement
  | 'file'           // File content to create
  | 'copy'           // Content/copy to write
  | 'config'         // Configuration changes
  | 'instruction';   // Step-by-step instructions

/**
 * A single issue with its fix
 */
export interface AuditIssue {
  id: string;
  title: string;
  description: string;
  severity: Severity;
  impact: string;           // Why this matters
  currentState: string;     // What we found
  fix: AuditFix;
}

/**
 * The actual fix for an issue
 */
export interface AuditFix {
  type: FixType;
  title: string;
  description: string;
  content: string;          // The actual fix content (code, copy, etc.)
  filename?: string;        // If type is 'file', what to name it
  language?: string;        // For code highlighting (tsx, json, html, etc.)
  estimatedEffort: 'minutes' | 'hours' | 'days';
}

/**
 * A pillar analysis result
 */
export interface PillarAnalysis {
  name: string;
  score: number;            // 0-100
  status: 'good' | 'needs-work' | 'critical';
  summary: string;
  currentState: {
    [key: string]: string | number | boolean | string[];
  };
  issues: AuditIssue[];
  quickWins: AuditIssue[];  // Subset of issues that are easy wins
}

// =============================================================================
// SEO PILLARS
// =============================================================================

export interface TechnicalSEOData {
  crawlability: {
    robotsTxt: { exists: boolean; content?: string; issues: string[] };
    sitemap: { exists: boolean; url?: string; pageCount?: number; issues: string[] };
    canonicals: { correctCount: number; missingCount: number; conflictingCount: number };
    redirects: { count: number; chains: number; loops: number };
  };
  performance: {
    loadTime: number;        // seconds
    ttfb: number;            // Time to First Byte
    lcp: number;             // Largest Contentful Paint
    fid: number;             // First Input Delay
    cls: number;             // Cumulative Layout Shift
    mobileScore: number;     // PageSpeed mobile score
    desktopScore: number;    // PageSpeed desktop score
  };
  indexability: {
    indexablePages: number;
    noindexPages: number;
    blockedPages: number;
    orphanPages: number;
  };
  security: {
    https: boolean;
    mixedContent: boolean;
    securityHeaders: string[];
  };
}

export interface OnPageSEOData {
  titles: {
    missing: string[];
    tooLong: string[];
    tooShort: string[];
    duplicate: string[];
    optimized: number;
    total: number;
  };
  metaDescriptions: {
    missing: string[];
    tooLong: string[];
    tooShort: string[];
    duplicate: string[];
    optimized: number;
    total: number;
  };
  headings: {
    pagesWithoutH1: string[];
    pagesWithMultipleH1: string[];
    headingStructureIssues: string[];
  };
  images: {
    withoutAlt: string[];
    withoutTitle: string[];
    oversized: string[];
    totalImages: number;
  };
  links: {
    broken: string[];
    nofollow: number;
    external: number;
    internal: number;
  };
}

export interface ContentSEOData {
  pages: {
    total: number;
    thinContent: string[];       // < 300 words
    averageWordCount: number;
    readabilityScore: number;
  };
  keywords: {
    ranking: Array<{ keyword: string; position: number; url: string }>;
    opportunities: Array<{ keyword: string; volume: number; difficulty: number }>;
    gaps: string[];              // Keywords competitors rank for, we don't
  };
  freshness: {
    lastUpdated: { [url: string]: string };
    stalePages: string[];        // Not updated in 6+ months
  };
  structure: {
    hasBlog: boolean;
    hasFAQ: boolean;
    hasResourceCenter: boolean;
    topicClusters: string[];
  };
}

export interface AuthoritySEOData {
  domainAuthority: number;
  pageAuthority: number;
  backlinks: {
    total: number;
    referring_domains: number;
    dofollow: number;
    nofollow: number;
    toxic: number;
  };
  topBacklinks: Array<{
    source_url: string;
    target_url: string;
    anchor: string;
    domain_authority: number;
  }>;
  internalLinking: {
    averageInternalLinks: number;
    orphanPages: string[];
    hubPages: string[];
  };
}

export interface UXSEOData {
  mobile: {
    isMobileFriendly: boolean;
    viewportConfigured: boolean;
    tapTargetsOk: boolean;
    fontSizesOk: boolean;
    issues: string[];
  };
  coreWebVitals: {
    lcp: { value: number; status: 'good' | 'needs-improvement' | 'poor' };
    fid: { value: number; status: 'good' | 'needs-improvement' | 'poor' };
    cls: { value: number; status: 'good' | 'needs-improvement' | 'poor' };
  };
  usability: {
    ctas: { aboveFold: boolean; clear: boolean };
    navigation: { depth: number; breadcrumbs: boolean };
    trustSignals: string[];      // What trust signals exist
  };
}

// =============================================================================
// AEO PILLARS
// =============================================================================

export interface EntityDefinitionData {
  name: string;
  type: string;                  // Organization, Person, LocalBusiness, etc.
  description: string;
  sameAs: string[];              // Social profiles, Wikipedia, etc.
  knowledgePanel: boolean;       // Does entity have a Knowledge Panel?
  issues: string[];
}

export interface SchemaMarkupData {
  existing: Array<{
    type: string;
    url: string;
    valid: boolean;
    errors: string[];
  }>;
  missing: string[];             // Recommended schema types not present
  recommendations: string[];
}

export interface FAQData {
  existingFAQs: Array<{
    url: string;
    questions: string[];
    hasSchema: boolean;
  }>;
  suggestedFAQs: Array<{
    topic: string;
    questions: string[];
  }>;
  featuredSnippetOpportunities: string[];
}

export interface VoiceSearchData {
  conversationalContent: boolean;
  questionBasedContent: number;  // Count of question-format content
  speakableContent: boolean;     // Has speakable schema
  localOptimization: boolean;    // "near me" optimization
  suggestions: string[];
}

export interface AISearchData {
  citationReadiness: number;     // 0-100 score
  entityClarity: boolean;
  factualClaims: number;         // Count of citable facts
  sourceAttribution: boolean;
  structuredData: boolean;
  suggestions: string[];
}

// =============================================================================
// FULL AUDIT RESULT
// =============================================================================

export interface DeepAuditResult {
  url: string;
  domain: string;
  auditedAt: string;

  // Overall scores
  overallScore: number;
  seoScore: number;
  aeoScore: number;

  // SEO Pillars
  seo: {
    technical: PillarAnalysis;
    onPage: PillarAnalysis;
    content: PillarAnalysis;
    authority: PillarAnalysis;
    ux: PillarAnalysis;
  };

  // AEO Pillars
  aeo: {
    entityDefinition: PillarAnalysis;
    schemaMarkup: PillarAnalysis;
    faqTargeting: PillarAnalysis;
    voiceSearch: PillarAnalysis;
    aiSearch: PillarAnalysis;
  };

  // Raw data for reference
  rawData: {
    technical?: TechnicalSEOData;
    onPage?: OnPageSEOData;
    content?: ContentSEOData;
    authority?: AuthoritySEOData;
    ux?: UXSEOData;
    entity?: EntityDefinitionData;
    schema?: SchemaMarkupData;
    faq?: FAQData;
    voice?: VoiceSearchData;
    aiSearch?: AISearchData;
  };

  // Prioritized action plan
  actionPlan: {
    immediate: AuditIssue[];     // Do today
    shortTerm: AuditIssue[];     // Do this week
    mediumTerm: AuditIssue[];    // Do this month
    longTerm: AuditIssue[];      // Do this quarter
  };
}

/**
 * Options for running a deep audit
 */
export interface DeepAuditOptions {
  url: string;
  includeBacklinks?: boolean;    // Requires extra API credits
  includeKeywordGaps?: boolean;  // Requires competitor URLs
  competitors?: string[];
  maxPages?: number;             // Limit crawl depth
}
