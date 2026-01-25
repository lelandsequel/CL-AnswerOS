// lib/pseo-audit-analyzer.ts
// Analyzes SEO/AEO audit data and recommends pSEO pages

import { callLLMTask, safeParseJsonFromText } from "./llm";
import type { StructuredAudit, KeywordMetric } from "./types";
import type {
  PageRecommendation,
  AuditExtractedContext,
  PseoPageType,
} from "./pseo-types";

export interface AuditAnalysisInput {
  structuredAudit: StructuredAudit;
  rawScan?: string;
  keywordMetrics?: KeywordMetric[];
}

/**
 * Extract company context from structured audit (deterministic, no LLM)
 */
export function extractContextFromAudit(
  audit: StructuredAudit
): AuditExtractedContext {
  return {
    company_name: extractCompanyName(audit),
    website_url: audit.overview?.domain || "",
    industry: inferIndustry(audit),
    geography: inferGeography(audit),
    services: extractServices(audit),
    target_customer: extractTargetCustomer(audit),
  };
}

function extractCompanyName(audit: StructuredAudit): string {
  const domain = audit.overview?.domain || "";
  // Convert domain to company name
  return domain
    .replace(/^https?:\/\/(www\.)?/, "")
    .split(".")[0]
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function inferIndustry(audit: StructuredAudit): string {
  const pillars = audit.content_playbook?.content_pillars || [];
  const messaging = audit.content_playbook?.key_messaging_pillars || [];
  const combined = [...pillars, ...messaging].join(" ").toLowerCase();

  // Industry detection rules
  if (
    combined.includes("loan") ||
    combined.includes("finance") ||
    combined.includes("bridge") ||
    combined.includes("lending")
  ) {
    return "Commercial Real Estate Finance";
  }
  if (combined.includes("saas") || combined.includes("software")) {
    return "SaaS";
  }
  if (combined.includes("legal") || combined.includes("law")) {
    return "Legal Services";
  }
  if (combined.includes("health") || combined.includes("medical")) {
    return "Healthcare";
  }
  if (combined.includes("real estate") || combined.includes("property")) {
    return "Real Estate";
  }
  if (combined.includes("market") || combined.includes("agency")) {
    return "Marketing & Advertising";
  }

  return "Professional Services";
}

function inferGeography(audit: StructuredAudit): string {
  // Try to extract from positioning or overview
  const positioning = audit.content_playbook?.positioning_statement || "";
  const currentState = audit.overview?.current_state || "";
  const combined = `${positioning} ${currentState}`.toLowerCase();

  // Check for common geography patterns
  if (combined.includes("nationwide") || combined.includes("national")) {
    return "United States";
  }
  if (combined.includes("texas") || combined.includes("tx")) {
    return "Texas";
  }
  if (combined.includes("california") || combined.includes("ca")) {
    return "California";
  }
  if (combined.includes("new york") || combined.includes("ny")) {
    return "New York";
  }
  if (combined.includes("florida") || combined.includes("fl")) {
    return "Florida";
  }

  return "United States"; // Default
}

function extractServices(audit: StructuredAudit): string[] {
  return audit.content_playbook?.content_pillars || [];
}

function extractTargetCustomer(audit: StructuredAudit): string {
  return audit.content_playbook?.target_persona?.summary || "";
}

/**
 * Analyze audit with LLM to get smart page recommendations
 * Uses triple-model fallback chain: Haiku → Gemini Flash → GPT-4o-mini
 */
export async function analyzeAuditForPseo(
  input: AuditAnalysisInput
): Promise<PageRecommendation[]> {
  const prompt = buildAnalysisPrompt(input);

  try {
    const result = await callLLMTask({
      task: "pseo_strategy", // Uses Haiku → Gemini → GPT chain for strategy analysis
      prompt,
      expectJson: true,
    });

    const parsed =
      result.raw?.parsedJson || safeParseJsonFromText(result.text);

    if (!parsed?.recommendations || !Array.isArray(parsed.recommendations)) {
      throw new Error("LLM returned invalid response format - missing recommendations array");
    }

    // Validate and normalize recommendations
    return normalizeRecommendations(parsed.recommendations);
  } catch (error: any) {
    // Don't silently fallback - throw to notify user
    throw new Error(
      `Failed to analyze audit for pSEO strategy: ${error.message}. ` +
        `All LLM providers (Haiku, Gemini Flash, GPT-4o-mini) failed or returned invalid data.`
    );
  }
}

function normalizeRecommendations(recs: any[]): PageRecommendation[] {
  const validTypes: PseoPageType[] = [
    "service",
    "loan_program",
    "asset_class",
    "market",
    "use_case",
    "qualifier",
    "comparison",
    "faq_hub",
  ];

  return recs
    .filter((r) => r && typeof r === "object")
    .map((r) => ({
      pageType: validTypes.includes(r.pageType) ? r.pageType : "service",
      title: String(r.title || "Untitled Page"),
      rationale: String(r.rationale || ""),
      sourceIssue: r.sourceIssue ? String(r.sourceIssue) : undefined,
      sourceOpportunity: r.sourceOpportunity
        ? String(r.sourceOpportunity)
        : undefined,
      priority: ["high", "medium", "low"].includes(r.priority)
        ? r.priority
        : "medium",
      targetKeywords: Array.isArray(r.targetKeywords)
        ? r.targetKeywords.map(String)
        : [],
      expectedImpact: String(r.expectedImpact || ""),
    }));
}

function buildAnalysisPrompt(input: AuditAnalysisInput): string {
  const { structuredAudit, keywordMetrics } = input;

  // Truncate large data for prompt efficiency
  const truncatedKeywords = keywordMetrics?.slice(0, 20) || [];

  return `You are a programmatic SEO strategist. Analyze this SEO/AEO audit and recommend specific pages to generate.

## Audit Data

### Overview
${JSON.stringify(structuredAudit.overview || {}, null, 2)}

### Core Issues (problems to address)
${JSON.stringify(structuredAudit.core_issues || [], null, 2)}

### AEO Opportunities (voice/AI search)
${JSON.stringify(structuredAudit.aeo_opportunities || [], null, 2)}

### Content Playbook (messaging strategy)
${JSON.stringify(structuredAudit.content_playbook || {}, null, 2)}

### Quick Wins (high-priority actions)
${JSON.stringify(structuredAudit.quick_wins_48h || [], null, 2)}

### Top Keywords (with metrics)
${JSON.stringify(truncatedKeywords, null, 2)}

## Your Task

Recommend 10-25 pSEO pages to generate. For each page:
1. Choose the page type that best addresses the identified issue/opportunity
2. Explain WHY this page was recommended (link to specific audit findings)
3. List target keywords based on the audit data
4. Estimate impact

### Page Types Available
- service: Main service/offering pages (from content pillars)
- faq_hub: FAQ collection pages (great for AEO/voice search)
- comparison: X vs Y comparison pages (high-intent keywords)
- qualifier: Qualification/eligibility pages (bottom-funnel)
- use_case: Scenario-based pages (specific use cases)
- market: Location/market-specific pages
- loan_program: Product/program-specific pages
- asset_class: Category/segment pages

### Priority Guidelines
- high: Addresses CRITICAL severity issues or quick wins
- medium: Addresses core content gaps or opportunities
- low: Nice-to-have expansions

Return JSON in this exact format:
{
  "recommendations": [
    {
      "pageType": "faq_hub",
      "title": "Bridge Loans FAQs",
      "rationale": "Core issue: Missing FAQ schema. AEO opportunity: Position for voice search.",
      "sourceIssue": "Missing schema markup",
      "sourceOpportunity": "Voice search optimization",
      "priority": "high",
      "targetKeywords": ["bridge loan faq", "what is a bridge loan"],
      "expectedImpact": "Capture featured snippets, improve AEO visibility"
    }
  ]
}

IMPORTANT:
- Prioritize pages that address CRITICAL or HIGH severity issues first
- Include at least 2-3 FAQ pages for AEO opportunities
- Include comparison pages for competitive differentiation
- Use content pillars as service page topics
- Maximum 25 recommendations`;
}

/**
 * Categorize recommendations by priority and purpose
 */
export function categorizeRecommendations(recs: PageRecommendation[]): {
  quickWinPages: string[];
  aeoFocusedPages: string[];
  highPriority: PageRecommendation[];
  mediumPriority: PageRecommendation[];
  lowPriority: PageRecommendation[];
} {
  const quickWinPages: string[] = [];
  const aeoFocusedPages: string[] = [];

  for (const rec of recs) {
    const slug = slugify(rec.title);

    // Quick wins are high priority with low effort indication
    if (rec.priority === "high") {
      quickWinPages.push(slug);
    }

    // AEO-focused pages
    if (
      rec.pageType === "faq_hub" ||
      rec.sourceOpportunity?.toLowerCase().includes("voice") ||
      rec.sourceOpportunity?.toLowerCase().includes("aeo") ||
      rec.rationale?.toLowerCase().includes("featured snippet")
    ) {
      aeoFocusedPages.push(slug);
    }
  }

  return {
    quickWinPages,
    aeoFocusedPages,
    highPriority: recs.filter((r) => r.priority === "high"),
    mediumPriority: recs.filter((r) => r.priority === "medium"),
    lowPriority: recs.filter((r) => r.priority === "low"),
  };
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
