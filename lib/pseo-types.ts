// lib/pseo-types.ts
// Type definitions for pSEO audit and deck outline

import { z } from "zod";

// ============ pSEO Audit Types ============

export const PSEOAuditRequestSchema = z.object({
  company_name: z.string().min(1, "Company name required"),
  website_url: z.string().url("Valid URL required"),
  industry: z.string().min(1, "Industry required"),
  geography: z.string().min(1, "Geography required"),
  services: z.array(z.string()).min(1, "At least one service required"),
  target_customer: z.string().min(1, "Target customer required"),
  notes: z.string().optional(),
});

export type PSEOAuditRequest = z.infer<typeof PSEOAuditRequestSchema>;

export interface PSEOPageType {
  name: string;
  description: string;
  urlPattern: string;
  estimatedCount: number;
  templateSections: string[];
  schemaTypes: string[];
}

export interface KeywordMetrics {
  keyword: string;
  searchVolume: number;
  cpc: number;
  competition: number;
}

export interface PSEOAuditResult {
  company_name: string;
  industry: string;
  pageTypes: PSEOPageType[];
  totalEstimatedPages: number;
  urlStructure: string;
  internalLinkingStrategy: string;
  schemaRecommendations: string[];
  samplePages: Array<{
    title: string;
    url: string;
    pageType: string;
    metrics?: KeywordMetrics;
  }>;
  contentTemplates: Record<string, string[]>;
}

// ============ Deck Outline Types ============

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
  outline: string; // Full markdown outline
}

