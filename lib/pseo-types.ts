import { z } from "zod";

export const PseoAuditRequestSchema = z.object({
  // Core fields - optional when audit data provided
  company_name: z.string().optional(),
  website_url: z.string().optional(),
  industry: z.string().optional(),
  geography: z.string().optional(),
  services: z.union([z.string(), z.array(z.string())]).optional().default(""),
  target_customer: z.string().optional(),
  notes: z.string().optional().default(""),

  // Explicit page configuration
  locations: z.array(z.string()).optional(),
  loan_programs: z.array(z.string()).optional(),
  asset_classes: z.array(z.string()).optional(),
  use_cases: z.array(z.string()).optional(),
  competitors: z.array(z.string()).optional(),

  // Audit-driven strategy inputs
  structuredAudit: z.any().optional().nullable(),
  rawScan: z.string().optional().nullable(),
  keywordMetrics: z.array(z.any()).optional().nullable(),
  useAuditDrivenStrategy: z.boolean().optional().default(false),
});

export type PseoAuditRequest = z.infer<typeof PseoAuditRequestSchema>;

// Page recommendation from LLM analysis
export interface PageRecommendation {
  pageType: PseoPageType;
  title: string;
  rationale: string;
  sourceIssue?: string;
  sourceOpportunity?: string;
  priority: "high" | "medium" | "low";
  targetKeywords: string[];
  expectedImpact: string;
}

// LLM-generated content for a page
export interface LLMGeneratedPageContent {
  title: string;
  metaTitle: string;
  metaDescription: string;
  h1: string;
  introductionParagraph: string;
  faqs: Array<{ question: string; answer: string }>;
  primaryCTA: string;
  secondaryCTA?: string;
}

// Validation result from cross-model check
export interface ContentValidation {
  valid: boolean;
  score: number;
  issues: string[];
  suggestions: string[];
}

// Final validated page content
export interface ValidatedPageContent extends LLMGeneratedPageContent {
  validationScore: number;
  corrected: boolean;
  validationIssues?: string[];
}

// Context extracted from audit for pSEO
export interface AuditExtractedContext {
  company_name: string;
  website_url: string;
  industry: string;
  geography: string;
  services: string[];
  target_customer: string;
}

// Full audit-driven strategy output
export interface AuditDrivenStrategy {
  extractedContext: AuditExtractedContext;
  recommendations: PageRecommendation[];
  quickWinPages: string[];
  aeoFocusedPages: string[];
}

export type PseoPageType =
  | "service"
  | "loan_program"
  | "asset_class"
  | "market"
  | "use_case"
  | "qualifier"
  | "comparison"
  | "faq_hub";

export type PseoPage = {
  type: PseoPageType;
  title: string;
  path: string;
  primary_keyword: string;
  secondary_keywords: string[];
  template_sections: string[];
  schema_types: string[];
  // Recommendation metadata (when audit-driven)
  recommendation?: {
    rationale: string;
    priority: "high" | "medium" | "low";
    expectedImpact: string;
    sourceIssue?: string;
    sourceOpportunity?: string;
  };
  // LLM-generated content (when using content pipeline)
  generatedContent?: ValidatedPageContent;
};

export type PseoAuditResponse = {
  meta: {
    company_name: string;
    website_url: string;
    industry: string;
    geography: string;
    target_customer: string;
  };
  totals: {
    total_pages: number;
    by_type: Record<PseoPageType, number>;
  };
  url_conventions: {
    service_base: string;
    loan_base: string;
    asset_class_base: string;
    market_base: string;
    use_case_base: string;
    qualify_base: string;
    compare_base: string;
    faq_base: string;
  };
  internal_linking: {
    hubs: string[];
    spokes: string[];
    rules: string[];
  };
  schema_recommendations: Record<string, string[]>;
  pages: PseoPage[];
  markdown: string;
  // Audit-driven strategy metadata (when useAuditDrivenStrategy is true)
  auditDrivenStrategy?: AuditDrivenStrategy;
};

// Deck Outline Types (legacy support)
export const DeckOutlineRequestSchema = z.object({
  company_name: z.string().min(1, "Company name required"),
  website_url: z.string().url("Valid URL required"),
  industry: z.string().min(1, "Industry required"),
  current_challenges: z.array(z.string()).min(1, "At least one challenge required"),
  target_outcomes: z.array(z.string()).min(1, "At least one outcome required"),
  budget_range: z.string().optional(),
  timeline: z.string().optional(),
});

export type DeckOutlineRequest = z.infer<typeof DeckOutlineRequestSchema>;

export interface DeckSlide {
  slideNumber: number;
  title: string;
  bullets: string[];
  speakerNotes: string;
  suggestedVisuals: string;
}

export interface DeckOutlineResult {
  company_name: string;
  totalSlides: number;
  slides: DeckSlide[];
  outline: string;
}
