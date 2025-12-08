// =======================================================================
// lib/types.ts - Type definitions for Leland OS
// =======================================================================

export interface KeywordMetric {
  keyword: string;
  searchVolume: number;
  cpc: number;
  competition: number;
}

export interface KeywordMetricDetailed extends KeywordMetric {
  difficulty?: number;
  intent?: "informational" | "navigational" | "commercial" | "transactional";
  serpFeatures?: string[];
}

export interface StructuredAuditSection {
  title: string;
  content: string;
  score?: number;
}

export interface AuditResponse {
  rawScan: string;
  structuredAudit: StructuredAuditSection[] | any;
  keywordMetrics?: KeywordMetric[] | null;
}

export interface LegacyAuditRecord {
  id: string;
  url: string;
  chaos: number;
  sass: number;
  createdAt: string;
  rawScan?: string;
  structuredAudit?: StructuredAuditSection[] | any;
  keywordMetrics?: KeywordMetric[];
}

// Keyword Suite

export interface KeywordResearchRequest {
  seed: string;
  market?: string;
  language?: string;
  url?: string;
  maxKeywords?: number;
}

export interface KeywordResearchResponse {
  primary: KeywordMetricDetailed[];
  supporting: KeywordMetricDetailed[];
  questions: KeywordMetricDetailed[];
}

export interface KeywordCluster {
  topic: string;
  parentKeyword: string;
  intent: string;
  difficulty: number;
  keywords: string[];
}

export interface KeywordClusterResponse {
  clusters: KeywordCluster[];
}

// Press Release

export interface PressReleaseRequest {
  company: string;
  headlineFocus: string;
  announcementType: string;
  tone?: "serious" | "hype" | "balanced";
  website?: string;
  audience?: string;
  notes?: string;
  pullFromAudit?: {
    url: string;
    keyBenefits?: string[];
  };
}

export interface PressReleaseSection {
  title: string;
  content: string;
}

export interface PressReleaseResponse {
  headline: string;
  subheadline: string;
  sections: PressReleaseSection[];
  boilerplate: string;
  quotes: string[];
  socialSnippets: string[];
}

// LEAD GENERATOR TYPES

export interface Lead {
  name: string;
  website: string;
  location: string;
  industry: string;
  contactEmail?: string;
  contactPhone?: string;
  description?: string;
  seoScore?: number;          // 0–100, lower = worse SEO
  opportunityScore?: number;  // 0–100, higher = better lead
  issuesSummary?: string;
  rating?: number;
  ratingVotes?: number;
  rawCategory?: string;
}

export interface LeadSearchRequest {
  industry: string;
  location: string;           // City, region, or ZIP users type in
  countryCode?: string;       // "US", "GB", etc. (optional, default US)
  limit?: number;
  minOpportunityScore?: number;
}

export interface LeadSearchResponse {
  leads: Lead[];
  query: {
    industry: string;
    location: string;
    countryCode: string;
    limit: number;
    minOpportunityScore: number;
  };
  errorMessage?: string;
}

// ======================================================================
// CONTENT GENERATOR TYPES
// ======================================================================

export type ContentMode =
  | "press_release"
  | "article"
  | "landing"
  | "social";

export interface BaseContentRequest {
  mode: ContentMode;
  company?: string;
  brandVoice?: string;
  audience?: string;
  primaryKeyword?: string;
  url?: string;
  notes?: string;
}

// Press Release
export interface PressReleaseContent {
  type: "press_release";
  headline: string;
  subheadline: string;
  sections: { title: string; content: string }[];
  boilerplate: string;
  quotes: string[];
  socialSnippets: string[];
}

// SEO Article
export interface ArticleSection {
  heading: string;
  body: string;
}

export interface ArticleContent {
  type: "article";
  title: string;
  subtitle: string;
  metaTitle: string;
  metaDescription: string;
  wordCountTarget: number;
  primaryKeyword: string;
  outline: ArticleSection[];
  faqs: { question: string; answer: string }[];
}

// Landing Page
export interface LandingPageContent {
  type: "landing";
  heroHeadline: string;
  heroSubheadline: string;
  primaryCTA: string;
  secondaryCTA?: string;
  valueProps: { title: string; body: string }[];
  proofElements: string[]; // testimonials / logos / proof ideas
  sectionBlocks: { title: string; content: string }[];
}

// Social Pack
export interface SocialPackContent {
  type: "social";
  linkedinPost: string;
  twitterThread: string;
  emailTeaser: string;
  bullets: string[];
}

export type ContentGenerationResult =
  | PressReleaseContent
  | ArticleContent
  | LandingPageContent
  | SocialPackContent;

export interface ContentGenerationResponse {
  mode: ContentMode;
  result: ContentGenerationResult;
}

// ======================================================================
// KEYWORD SUITE TYPES
// ======================================================================

export interface KeywordIdea {
  keyword: string;
  searchVolume?: number;
  cpc?: number;
  competitionIndex?: number;
  difficultyScore?: number;
  intent?: "informational" | "navigational" | "commercial" | "transactional" | "mixed";
  clusterLabel?: string;
  priorityScore?: number;
  notes?: string;
}

export interface KeywordRequest {
  seedKeyword?: string;
  url?: string;
  location?: string; // City/region or country, e.g. "United States", "Houston, TX"
  language?: string; // e.g. "English"
  limit?: number;
}

export interface KeywordResponse {
  seedKeyword: string;
  url?: string;
  location: string;
  language: string;
  ideas: KeywordIdea[];
}

// ======================================================================
// CLIENT & AUDIT TYPES
// ======================================================================

export type ClientStage = "lead" | "active" | "past" | "internal";

export interface Client {
  id: string;
  name: string;
  primaryDomain?: string;
  contactName?: string;
  contactEmail?: string;
  notes?: string;
  stage: ClientStage;
  createdAt: string;
  updatedAt: string;
}

export interface AuditRecord {
  id: string;
  clientId?: string;
  url: string;
  domain: string;
  summary: string;
  opportunityRating?: string;
  rawScore?: number;
  createdAt: string;
}

// ======================================================================
// REPORT GENERATION TYPES
// ======================================================================

export interface OperatorReport {
  boardSummary: string;
  whiteboardRoast: string;
  moneyboard: string;
  subjectLine?: string;
}

export interface GenerateReportRequestBody {
  url: string;
  clientName?: string;
  structuredAudit: any;
  notes?: string;
  sassLevel?: number; // 1–10
  chaosLevel?: number; // 1–10
}

export interface GenerateReportResponseBody {
  url: string;
  clientName?: string;
  report: OperatorReport;
}

// ======================================================================
// CLIENT ASSETS TYPES
// ======================================================================

export interface ClientAsset {
  id: string;
  clientId?: string | null;
  type: string; // "audit", "lelandized_report", "keyword_research", etc.
  title: string;
  summary: string;
  payload: any; // The actual data (audit, report, keywords, etc.)
  tags: string[];
  createdAt: string;
  updatedAt: string;
}
