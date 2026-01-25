// lib/pseo/content-pipeline.ts
// LLM content generation with cross-model validation
// BBB Step 4: Generate → Validate → Correct Pipeline

import { callLLMTask, safeParseJsonFromText } from '../llm';
import type {
  pSEOPageRecommendation,
  AuditDerivedContext,
  LLMGeneratedPageContent,
  ContentValidation,
  ValidatedPageContent,
  pSEOPageTemplateSpec,
} from './types';

// ============================================================================
// Step 1: Generate Content
// ============================================================================

/**
 * Generate page content using LLM (Haiku primary)
 */
export async function generatePageContent(
  recommendation: pSEOPageRecommendation,
  context: AuditDerivedContext,
  template?: pSEOPageTemplateSpec
): Promise<LLMGeneratedPageContent> {
  const prompt = buildGenerationPrompt(recommendation, context, template);

  const result = await callLLMTask({
    task: 'pseo_generate',
    prompt,
    expectJson: true,
  });

  const parsed = result.raw?.parsedJson || safeParseJsonFromText(result.text);
  if (!parsed) {
    throw new Error('Failed to parse generated content');
  }

  return {
    pageId: recommendation.id,
    title: parsed.title || recommendation.title,
    metaTitle: parsed.metaTitle || parsed.title || recommendation.title,
    metaDescription: parsed.metaDescription || '',
    h1: parsed.h1 || parsed.title || recommendation.title,
    introductionParagraph: parsed.introductionParagraph || parsed.intro || '',
    sections: parsed.sections || [],
    faqs: parsed.faqs || [],
    primaryCTA: parsed.primaryCTA || 'Contact Us',
    secondaryCTA: parsed.secondaryCTA,
    suggestedInternalLinks: parsed.suggestedInternalLinks || [],
    generatedAt: new Date().toISOString(),
    modelUsed: 'haiku', // Primary model
  };
}

function buildGenerationPrompt(
  recommendation: pSEOPageRecommendation,
  context: AuditDerivedContext,
  template?: pSEOPageTemplateSpec
): string {
  const targetWordCount = template?.targetWordCount || 1500;

  return `You are an SEO content writer creating a ${recommendation.family} page.

## Company Context
- Company: ${context.companyName}
- Industry: ${context.industry}
- Services: ${context.services.join(', ') || 'Various services'}
- Locations: ${context.locations.join(', ') || 'National'}
- Target Customer: ${context.targetCustomer}
- Brand Voice: ${context.brandVoice}

## Page Requirements
- Page Type: ${recommendation.family}
- Title: ${recommendation.title}
- URL: ${recommendation.targetUrl}
- Target Keywords: ${recommendation.targetKeywords.join(', ')}
- Reason for Page: ${recommendation.reason}

## Content Guidelines
1. Write in ${context.brandVoice} tone
2. Target approximately ${targetWordCount} words total
3. Include target keywords naturally (no stuffing)
4. Structure for featured snippets where appropriate
5. Make content directly useful to ${context.targetCustomer}
6. Include clear calls to action

${recommendation.family === 'faq_hub' ? `
## FAQ Specific Requirements
- Generate 5-7 FAQs
- Each answer should be 2-4 sentences
- Format answers for voice search (direct, clear)
- Include question variations people actually ask
` : ''}

${recommendation.family === 'how_to' ? `
## How-To Specific Requirements
- Include clear numbered steps
- Each step should be actionable
- Include a brief intro explaining the benefit
- Consider voice search phrasing
` : ''}

${recommendation.family === 'service_page' || recommendation.family === 'service_location' ? `
## Service Page Requirements
- Lead with the value proposition
- Include specific benefits (not just features)
- Address common objections
- Include social proof placeholder
` : ''}

## Return JSON
{
  "title": "Page title",
  "metaTitle": "SEO title (max 60 chars)",
  "metaDescription": "Meta description (max 155 chars)",
  "h1": "H1 heading",
  "introductionParagraph": "2-3 sentence intro paragraph",
  "sections": [
    {
      "heading": "Section H2",
      "content": "Section content (markdown allowed)",
      "schemaType": "optional schema type"
    }
  ],
  "faqs": [
    { "question": "Question?", "answer": "Answer text" }
  ],
  "primaryCTA": "Main call to action text",
  "secondaryCTA": "Optional secondary CTA",
  "suggestedInternalLinks": [
    {
      "anchorText": "link text",
      "targetPath": "/suggested/path",
      "reason": "why link here"
    }
  ]
}`;
}

// ============================================================================
// Step 2: Validate Content
// ============================================================================

/**
 * Validate generated content using a different model (Gemini primary)
 */
export async function validateContent(
  generated: LLMGeneratedPageContent,
  context: AuditDerivedContext,
  recommendation: pSEOPageRecommendation
): Promise<ContentValidation> {
  const prompt = buildValidationPrompt(generated, context, recommendation);

  const result = await callLLMTask({
    task: 'pseo_validate',
    prompt,
    expectJson: true,
  });

  const parsed = result.raw?.parsedJson || safeParseJsonFromText(result.text);
  if (!parsed) {
    // If validation fails to parse, assume content is OK but flag it
    return {
      valid: true,
      score: 70,
      issues: [{
        type: 'inconsistency',
        description: 'Validation response could not be parsed',
        location: 'system',
        severity: 'warning',
        suggestion: 'Manual review recommended',
      }],
      validatedAt: new Date().toISOString(),
      validatorModel: 'gemini-flash',
    };
  }

  return {
    valid: parsed.valid ?? true,
    score: parsed.score ?? 80,
    issues: (parsed.issues || []).map((issue: any) => ({
      type: issue.type || 'inconsistency',
      description: issue.description || issue.issue || 'Unknown issue',
      location: issue.location || issue.field || 'unknown',
      severity: issue.severity || 'warning',
      suggestion: issue.suggestion || issue.fix || '',
    })),
    validatedAt: new Date().toISOString(),
    validatorModel: 'gemini-flash',
  };
}

function buildValidationPrompt(
  generated: LLMGeneratedPageContent,
  context: AuditDerivedContext,
  recommendation: pSEOPageRecommendation
): string {
  return `You are a content validator. Check this generated pSEO page content for accuracy and quality.

## Original Context (Source of Truth)
- Company: ${context.companyName}
- Industry: ${context.industry}
- Services: ${context.services.join(', ') || 'Various'}
- Locations: ${context.locations.join(', ') || 'National'}
- Target Customer: ${context.targetCustomer}
- Brand Voice: ${context.brandVoice}

## Page Intent
- Page Type: ${recommendation.family}
- Target Keywords: ${recommendation.targetKeywords.join(', ')}
- Reason: ${recommendation.reason}

## Generated Content to Validate
${JSON.stringify(generated, null, 2)}

## Validation Checks
1. **Hallucination Check**: Are there any made-up facts, statistics, or claims not supported by the context?
2. **Consistency Check**: Does the content match the company's industry and services?
3. **Keyword Check**: Are target keywords used naturally without stuffing?
4. **Tone Check**: Does the tone match the specified brand voice (${context.brandVoice})?
5. **Quality Check**: Is the content substantive or generic filler?
6. **Accuracy Check**: Are there any factual errors or contradictions?

## Return JSON
{
  "valid": true/false,
  "score": 0-100,
  "issues": [
    {
      "type": "hallucination|inconsistency|missing_context|keyword_stuffing|tone_mismatch",
      "description": "Specific description of the issue",
      "location": "Which field/section has the issue",
      "severity": "error|warning",
      "suggestion": "How to fix it"
    }
  ]
}

If everything looks good, return {"valid": true, "score": 95, "issues": []}`;
}

// ============================================================================
// Step 3: Correct Content
// ============================================================================

/**
 * Correct content issues using a third model (GPT-4o-mini primary)
 */
export async function correctContent(
  generated: LLMGeneratedPageContent,
  validation: ContentValidation,
  context: AuditDerivedContext
): Promise<LLMGeneratedPageContent> {
  const prompt = buildCorrectionPrompt(generated, validation, context);

  const result = await callLLMTask({
    task: 'pseo_correct',
    prompt,
    expectJson: true,
  });

  const parsed = result.raw?.parsedJson || safeParseJsonFromText(result.text);
  if (!parsed) {
    // If correction fails, return original
    console.warn('[pSEO] Correction failed to parse, returning original content');
    return generated;
  }

  return {
    ...generated,
    title: parsed.title || generated.title,
    metaTitle: parsed.metaTitle || generated.metaTitle,
    metaDescription: parsed.metaDescription || generated.metaDescription,
    h1: parsed.h1 || generated.h1,
    introductionParagraph: parsed.introductionParagraph || generated.introductionParagraph,
    sections: parsed.sections || generated.sections,
    faqs: parsed.faqs || generated.faqs,
    primaryCTA: parsed.primaryCTA || generated.primaryCTA,
    secondaryCTA: parsed.secondaryCTA || generated.secondaryCTA,
    generatedAt: new Date().toISOString(),
    modelUsed: 'gpt-4o-mini', // Corrector model
  };
}

function buildCorrectionPrompt(
  generated: LLMGeneratedPageContent,
  validation: ContentValidation,
  context: AuditDerivedContext
): string {
  const issuesList = validation.issues
    .map(i => `- [${i.severity.toUpperCase()}] ${i.location}: ${i.description}. Fix: ${i.suggestion}`)
    .join('\n');

  return `You are a content editor fixing issues in generated content.

## Company Context (Source of Truth)
- Company: ${context.companyName}
- Industry: ${context.industry}
- Services: ${context.services.join(', ') || 'Various'}
- Locations: ${context.locations.join(', ') || 'National'}
- Target Customer: ${context.targetCustomer}
- Brand Voice: ${context.brandVoice}

## Original Generated Content
${JSON.stringify(generated, null, 2)}

## Issues to Fix
${issuesList}

## Instructions
1. Fix ONLY the issues listed above
2. Maintain the overall structure and intent
3. Remove any hallucinated or unsupported claims
4. Ensure all content aligns with the company context
5. Keep the same JSON structure

## Return corrected JSON
Return the complete corrected content in the same JSON format as the input.`;
}

// ============================================================================
// Main Pipeline: Generate → Validate → Correct
// ============================================================================

export interface ContentPipelineResult {
  content: ValidatedPageContent;
  pipelineStats: {
    generated: boolean;
    validated: boolean;
    corrected: boolean;
    validationScore: number;
    totalLLMCalls: number;
  };
}

/**
 * Run the full content pipeline: Generate → Validate → Correct
 */
export async function runContentPipeline(
  recommendation: pSEOPageRecommendation,
  context: AuditDerivedContext,
  options?: {
    template?: pSEOPageTemplateSpec;
    skipValidation?: boolean;
    correctionThreshold?: number; // Score below which to correct (default 80)
  }
): Promise<ContentPipelineResult> {
  const correctionThreshold = options?.correctionThreshold ?? 80;
  let llmCalls = 0;

  // Step 1: Generate
  const generated = await generatePageContent(
    recommendation,
    context,
    options?.template
  );
  llmCalls++;

  // Skip validation if requested
  if (options?.skipValidation) {
    return {
      content: {
        ...generated,
        validation: {
          valid: true,
          score: 100,
          issues: [],
          validatedAt: new Date().toISOString(),
          validatorModel: 'skipped',
        },
        corrected: false,
      },
      pipelineStats: {
        generated: true,
        validated: false,
        corrected: false,
        validationScore: 100,
        totalLLMCalls: llmCalls,
      },
    };
  }

  // Step 2: Validate
  const validation = await validateContent(generated, context, recommendation);
  llmCalls++;

  // Step 3: Correct if needed
  let finalContent = generated;
  let corrected = false;

  if (!validation.valid || validation.score < correctionThreshold) {
    finalContent = await correctContent(generated, validation, context);
    corrected = true;
    llmCalls++;
  }

  return {
    content: {
      ...finalContent,
      validation,
      corrected,
      correctedAt: corrected ? new Date().toISOString() : undefined,
      correctorModel: corrected ? 'gpt-4o-mini' : undefined,
      originalContent: corrected ? generated : undefined,
    },
    pipelineStats: {
      generated: true,
      validated: true,
      corrected,
      validationScore: validation.score,
      totalLLMCalls: llmCalls,
    },
  };
}

// ============================================================================
// Batch Processing
// ============================================================================

export interface BatchPipelineResult {
  results: Map<string, ContentPipelineResult>;
  summary: {
    total: number;
    successful: number;
    failed: number;
    corrected: number;
    averageScore: number;
    totalLLMCalls: number;
  };
  errors: Array<{ pageId: string; error: string }>;
}

/**
 * Process multiple pages through the content pipeline
 */
export async function runBatchContentPipeline(
  recommendations: pSEOPageRecommendation[],
  context: AuditDerivedContext,
  options?: {
    concurrency?: number;
    skipValidation?: boolean;
    correctionThreshold?: number;
  }
): Promise<BatchPipelineResult> {
  const concurrency = options?.concurrency ?? 3;
  const results = new Map<string, ContentPipelineResult>();
  const errors: Array<{ pageId: string; error: string }> = [];

  // Process in batches for rate limiting
  for (let i = 0; i < recommendations.length; i += concurrency) {
    const batch = recommendations.slice(i, i + concurrency);

    const batchPromises = batch.map(async (rec) => {
      try {
        const result = await runContentPipeline(rec, context, options);
        results.set(rec.id, result);
      } catch (error) {
        errors.push({
          pageId: rec.id,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    });

    await Promise.all(batchPromises);

    // Small delay between batches to avoid rate limits
    if (i + concurrency < recommendations.length) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  // Calculate summary
  const resultValues = Array.from(results.values());
  const successful = resultValues.length;
  const correctedCount = resultValues.filter(r => r.pipelineStats.corrected).length;
  const totalScore = resultValues.reduce((sum, r) => sum + r.pipelineStats.validationScore, 0);
  const totalLLMCalls = resultValues.reduce((sum, r) => sum + r.pipelineStats.totalLLMCalls, 0);

  return {
    results,
    summary: {
      total: recommendations.length,
      successful,
      failed: errors.length,
      corrected: correctedCount,
      averageScore: successful > 0 ? Math.round(totalScore / successful) : 0,
      totalLLMCalls,
    },
    errors,
  };
}
