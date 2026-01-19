import { z } from "zod";

export const PseoAuditRequestSchema = z.object({
  company_name: z.string().min(1),
  website_url: z.string().min(1),
  industry: z.string().min(1),
  geography: z.string().min(1),
  services: z.union([z.string(), z.array(z.string())]).optional().default(""),
  target_customer: z.string().min(1),
  notes: z.string().optional().default(""),

  locations: z.array(z.string()).optional(),
  loan_programs: z.array(z.string()).optional(),
  asset_classes: z.array(z.string()).optional(),
  use_cases: z.array(z.string()).optional(),
  competitors: z.array(z.string()).optional(),
});

export type PseoAuditRequest = z.infer<typeof PseoAuditRequestSchema>;

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
