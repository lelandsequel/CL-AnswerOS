// lib/pseo-content-pipeline.ts
// Generate → Validate → Correct pipeline for pSEO content
// Uses cross-model validation to prevent hallucination

import { callLLMTask, safeParseJsonFromText } from "./llm";
import type { StructuredAudit } from "./types";
import type {
  PageRecommendation,
  LLMGeneratedPageContent,
  ContentValidation,
  ValidatedPageContent,
  AuditExtractedContext,
} from "./pseo-types";

export interface ContentGenerationContext {
  structuredAudit: StructuredAudit;
  extractedContext: AuditExtractedContext;
  recommendation: PageRecommendation;
}

/**
 * Generate validated content for a page using 3-model pipeline
 * Step 1: Generate (Haiku) → Step 2: Validate (Gemini) → Step 3: Correct if needed (GPT)
 */
export async function generateValidatedPageContent(
  ctx: ContentGenerationContext
): Promise<ValidatedPageContent> {
  // Step 1: Generate content with primary model (Haiku)
  const generated = await generatePageContent(ctx);

  // Step 2: Validate with secondary model (Gemini Flash)
  const validation = await validateContent(generated, ctx);

  // Step 3: Correct if validation fails or score is low
  if (!validation.valid || validation.score < 80) {
    const corrected = await correctContent(generated, validation, ctx);
    return {
      ...corrected,
      validationScore: validation.score,
      corrected: true,
      validationIssues: validation.issues,
    };
  }

  return {
    ...generated,
    validationScore: validation.score,
    corrected: false,
  };
}

/**
 * Step 1: Generate page content
 */
async function generatePageContent(
  ctx: ContentGenerationContext
): Promise<LLMGeneratedPageContent> {
  const prompt = buildGenerationPrompt(ctx);

  const result = await callLLMTask({
    task: "pseo_generate",
    prompt,
    expectJson: true,
  });

  const parsed = result.raw?.parsedJson || safeParseJsonFromText(result.text);

  if (!parsed) {
    throw new Error("Failed to generate page content - LLM returned invalid JSON");
  }

  return normalizeGeneratedContent(parsed);
}

/**
 * Step 2: Validate content against audit data
 */
async function validateContent(
  content: LLMGeneratedPageContent,
  ctx: ContentGenerationContext
): Promise<ContentValidation> {
  const prompt = buildValidationPrompt(content, ctx);

  const result = await callLLMTask({
    task: "pseo_validate",
    prompt,
    expectJson: true,
  });

  const parsed = result.raw?.parsedJson || safeParseJsonFromText(result.text);

  if (!parsed) {
    // If validation fails to parse, assume content is valid but flag it
    return {
      valid: true,
      score: 70,
      issues: ["Validation could not be completed - manual review recommended"],
      suggestions: [],
    };
  }

  return {
    valid: parsed.valid ?? true,
    score: typeof parsed.score === "number" ? parsed.score : 75,
    issues: Array.isArray(parsed.issues) ? parsed.issues : [],
    suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
  };
}

/**
 * Step 3: Correct content based on validation issues
 */
async function correctContent(
  original: LLMGeneratedPageContent,
  validation: ContentValidation,
  ctx: ContentGenerationContext
): Promise<LLMGeneratedPageContent> {
  const prompt = buildCorrectionPrompt(original, validation, ctx);

  const result = await callLLMTask({
    task: "pseo_correct",
    prompt,
    expectJson: true,
  });

  const parsed = result.raw?.parsedJson || safeParseJsonFromText(result.text);

  if (!parsed) {
    // If correction fails, return original with a note
    return {
      ...original,
      introductionParagraph:
        original.introductionParagraph +
        " [Note: Auto-correction failed - manual review recommended]",
    };
  }

  return normalizeGeneratedContent(parsed);
}

function normalizeGeneratedContent(parsed: any): LLMGeneratedPageContent {
  return {
    title: String(parsed.title || ""),
    metaTitle: String(parsed.metaTitle || parsed.meta_title || parsed.title || ""),
    metaDescription: String(
      parsed.metaDescription || parsed.meta_description || ""
    ),
    h1: String(parsed.h1 || parsed.title || ""),
    introductionParagraph: String(
      parsed.introductionParagraph ||
        parsed.introduction_paragraph ||
        parsed.intro ||
        ""
    ),
    faqs: Array.isArray(parsed.faqs)
      ? parsed.faqs.map((faq: any) => ({
          question: String(faq.question || faq.q || ""),
          answer: String(faq.answer || faq.a || ""),
        }))
      : [],
    primaryCTA: String(parsed.primaryCTA || parsed.primary_cta || parsed.cta || ""),
    secondaryCTA: parsed.secondaryCTA || parsed.secondary_cta || undefined,
  };
}

function buildGenerationPrompt(ctx: ContentGenerationContext): string {
  const { structuredAudit, extractedContext, recommendation } = ctx;
  const playbook = structuredAudit.content_playbook;

  return `You are an SEO content specialist. Generate content for a pSEO page.

## Company Context
- Company: ${extractedContext.company_name}
- Industry: ${extractedContext.industry}
- Geography: ${extractedContext.geography}
- Target Customer: ${extractedContext.target_customer}

## Positioning & Messaging
- Positioning: ${playbook?.positioning_statement || "N/A"}
- Key Pillars: ${playbook?.key_messaging_pillars?.join(", ") || "N/A"}
- Pain Points: ${playbook?.target_persona?.pain_points?.join(", ") || "N/A"}

## Page to Generate
- Type: ${recommendation.pageType}
- Title: ${recommendation.title}
- Target Keywords: ${recommendation.targetKeywords.join(", ")}
- Rationale: ${recommendation.rationale}

## Generate Content

Return JSON with these fields:
{
  "title": "Page title (include primary keyword)",
  "metaTitle": "SEO title tag (50-60 chars, include keyword)",
  "metaDescription": "Meta description (150-160 chars, compelling + keyword)",
  "h1": "Main heading (can differ from title, conversational)",
  "introductionParagraph": "2-3 sentences introducing the topic and company value prop",
  "faqs": [
    { "question": "Natural question about topic?", "answer": "Concise, helpful answer" }
  ],
  "primaryCTA": "Action-oriented CTA text (e.g., 'Get Started Today')",
  "secondaryCTA": "Optional secondary CTA"
}

IMPORTANT:
- Only include facts from the provided context
- Do NOT make up statistics, testimonials, or specific claims
- Keep tone professional but approachable
- Target 3-5 FAQs relevant to the page topic
- FAQs should be questions the target customer would actually ask`;
}

function buildValidationPrompt(
  content: LLMGeneratedPageContent,
  ctx: ContentGenerationContext
): string {
  const { structuredAudit, extractedContext, recommendation } = ctx;

  return `You are a content validator. Check this generated pSEO page content for accuracy and alignment.

## Original Audit Context
${JSON.stringify(
  {
    company: extractedContext.company_name,
    industry: extractedContext.industry,
    positioning: structuredAudit.content_playbook?.positioning_statement,
    target_customer: extractedContext.target_customer,
    messaging_pillars: structuredAudit.content_playbook?.key_messaging_pillars,
    pain_points: structuredAudit.content_playbook?.target_persona?.pain_points,
  },
  null,
  2
)}

## Page Purpose
- Type: ${recommendation.pageType}
- Title: ${recommendation.title}
- Target Keywords: ${recommendation.targetKeywords.join(", ")}

## Generated Content to Validate
${JSON.stringify(content, null, 2)}

## Validation Checklist
1. Are all claims factually supported by the audit context? (No hallucinated stats/testimonials)
2. Does the content align with the company's positioning and messaging?
3. Are the keywords appropriately integrated (not stuffed)?
4. Is the tone consistent with the target persona?
5. Are FAQs relevant and answers accurate based on context?
6. Is the meta description within 160 chars and compelling?
7. Is the meta title within 60 chars and includes keyword?

## Return JSON
{
  "valid": true or false,
  "score": 0-100 (confidence score),
  "issues": ["List specific problems found"],
  "suggestions": ["How to fix each issue"]
}

Be strict about hallucination - flag any claims not directly supported by the provided context.`;
}

function buildCorrectionPrompt(
  original: LLMGeneratedPageContent,
  validation: ContentValidation,
  ctx: ContentGenerationContext
): string {
  const { structuredAudit, extractedContext, recommendation } = ctx;

  return `You are a content editor. Fix the issues identified in this pSEO page content.

## Audit Context (source of truth)
${JSON.stringify(
  {
    company: extractedContext.company_name,
    industry: extractedContext.industry,
    positioning: structuredAudit.content_playbook?.positioning_statement,
    target_customer: extractedContext.target_customer,
    messaging_pillars: structuredAudit.content_playbook?.key_messaging_pillars,
  },
  null,
  2
)}

## Page Purpose
- Type: ${recommendation.pageType}
- Title: ${recommendation.title}
- Target Keywords: ${recommendation.targetKeywords.join(", ")}

## Original Content
${JSON.stringify(original, null, 2)}

## Issues to Fix
${validation.issues.map((i, idx) => `${idx + 1}. ${i}`).join("\n")}

## Suggestions
${validation.suggestions.map((s, idx) => `${idx + 1}. ${s}`).join("\n")}

## Your Task

Rewrite the content to fix all identified issues. Return the corrected JSON:
{
  "title": "...",
  "metaTitle": "...",
  "metaDescription": "...",
  "h1": "...",
  "introductionParagraph": "...",
  "faqs": [...],
  "primaryCTA": "...",
  "secondaryCTA": "..."
}

IMPORTANT:
- Remove any hallucinated claims
- Stay strictly within the provided context
- Maintain SEO best practices (title/description lengths, keyword placement)`;
}

/**
 * Batch generate content for multiple pages
 * Processes in parallel with rate limiting
 */
export async function batchGenerateContent(
  pages: PageRecommendation[],
  structuredAudit: StructuredAudit,
  extractedContext: AuditExtractedContext,
  options?: { concurrency?: number }
): Promise<Map<string, ValidatedPageContent>> {
  const concurrency = options?.concurrency ?? 3;
  const results = new Map<string, ValidatedPageContent>();

  // Process in batches
  for (let i = 0; i < pages.length; i += concurrency) {
    const batch = pages.slice(i, i + concurrency);
    const batchResults = await Promise.all(
      batch.map(async (rec) => {
        try {
          const content = await generateValidatedPageContent({
            structuredAudit,
            extractedContext,
            recommendation: rec,
          });
          return { slug: slugify(rec.title), content };
        } catch (error) {
          console.error(`Failed to generate content for ${rec.title}:`, error);
          return null;
        }
      })
    );

    for (const result of batchResults) {
      if (result) {
        results.set(result.slug, result.content);
      }
    }
  }

  return results;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
