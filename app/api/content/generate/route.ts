import { NextRequest, NextResponse } from "next/server";
import {
  BaseContentRequest,
  ContentGenerationResponse,
  ContentGenerationResult,
  ContentMode,
} from "@/lib/types";

import {
  runContentLLM,
  safeParseJsonFromText,
} from "@/lib/llm";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as BaseContentRequest;

    if (!body.mode) {
      return NextResponse.json(
        { error: "Missing required field: mode" },
        { status: 400 }
      );
    }

    const mode: ContentMode = body.mode;
    const company = body.company || "the client";
    const audience = body.audience || "busy decision makers";
    const brandVoice = body.brandVoice || "operator-driven and sharp";
    const primaryKeyword = body.primaryKeyword || "seo optimization";
    const url = body.url || "";
    const notes = body.notes || "";

    // Build LLM prompt (this matches our new LLM Router architecture)
    const prompt = buildPrompt(body);

    // Run through LLM router
    console.log("[Content API] Calling LLM for mode:", mode);
    const { text, raw } = await runContentLLM(mode, prompt, {
      expectJson: true,
    });

    console.log("[Content API] LLM response text length:", text?.length);
    console.log("[Content API] LLM response text preview:", text?.substring(0, 200));

    const parsed =
      raw?.parsedJson ||
      safeParseJsonFromText(text) ||
      null;

    console.log("[Content API] Parsed result:", parsed ? "success" : "failed");

    if (!parsed) {
      console.error("[Content API] Failed to parse LLM response");
      return NextResponse.json(
        {
          error: "LLM returned non-JSON content",
          text: text?.substring(0, 500),
        },
        { status: 500 }
      );
    }

    const normalized = normalizeResult(mode, parsed);
    console.log("[Content API] Normalized result type:", normalized.type);

    const payload: ContentGenerationResponse = {
      mode,
      result: normalized,
    };

    return NextResponse.json(payload);
  } catch (err: any) {
    console.error("[Content Suite API Error]", err);
    return NextResponse.json(
      { error: err?.message || "Server error" },
      { status: 500 }
    );
  }
}

function buildPrompt(body: BaseContentRequest): string {
  const company = body.company || "the client";
  const audience =
    body.audience || "growth-minded decision makers and operators";
  const brandVoice =
    body.brandVoice ||
    "authoritative, clear, a little sharp, with operator credibility";
  const primaryKeyword =
    body.primaryKeyword || "digital growth strategy and SEO/AEO";
  const notes = body.notes || "";
  const urlPart = body.url
    ? `The primary URL or product is: ${body.url}.\nUse this as reference when framing the story.`
    : "";

  const sharedContext = `
Company / Brand: ${company}
Audience: ${audience}
Brand voice: ${brandVoice}
Primary keyword / topic: ${primaryKeyword}
${urlPart}
Extra notes from the operator:
${notes}
`;

  switch (body.mode as ContentMode) {
    case "press_release":
      return `
You are a senior communications lead who actually ships things.

Generate a press release object in STRICT JSON. No prose, no markdown.

Use this structure:

{
  "type": "press_release",
  "headline": "…",
  "subheadline": "…",
  "sections": [
    { "title": "Overview", "content": "…" },
    { "title": "Why It Matters", "content": "…" },
    { "title": "How It Works", "content": "…" },
    { "title": "About ${company}", "content": "…" }
  ],
  "boilerplate": "…",
  "quotes": [
    "Quote from founder or exec",
    "Optional second quote"
  ],
  "socialSnippets": [
    "One-sentence teaser for social/post",
    "Another punchy line"
  ]
}

Tone: press-ready but not cringe. Avoid buzzword salad. Sharp, concrete, outcome-focused.

Context:
${sharedContext}

Return ONLY the JSON object, nothing else.
`;

    case "article":
      return `
You are an experienced content strategist and SEO writer with operator experience.

Generate a long-form SEO article object in STRICT JSON. No prose, no markdown.

Structure:

{
  "type": "article",
  "title": "SEO Title for the article",
  "subtitle": "Short subheading that adds intrigue",
  "metaTitle": "Exact meta title tag",
  "metaDescription": "Search-optimized meta description (155-165 chars)",
  "wordCountTarget": 1800,
  "primaryKeyword": "${primaryKeyword}",
  "outline": [
    { "heading": "H1 or H2 heading", "body": "Narrative section body text…" },
    { "heading": "…", "body": "…" }
  ],
  "faqs": [
    { "question": "Question 1…", "answer": "Answer…" },
    { "question": "Question 2…", "answer": "Answer…" }
  ]
}

Requirements:
- One clear H1-equivalent heading in the outline.
- Remaining headings are H2/H3-level topic clusters.
- Body copy should be specific, with examples and operator POV.
- Work the primary keyword and semantically related phrases into headings and body naturally.

Context:
${sharedContext}

Return ONLY the JSON object.
`;

    case "landing":
      return `
You are a conversion-focused copywriter who has run experiments in the wild.

Generate a high-converting landing page content object in STRICT JSON.

Structure:

{
  "type": "landing",
  "heroHeadline": "Big promise or transformation",
  "heroSubheadline": "Clarifying one-liner",
  "primaryCTA": "CTA button text (e.g. 'Book a strategy call')",
  "secondaryCTA": "Optional softer CTA",
  "valueProps": [
    { "title": "Value Prop 1", "body": "1-2 sentence explanation" },
    { "title": "Value Prop 2", "body": "…" }
  ],
  "proofElements": [
    "Ideas for proof: logos, metrics, screenshots, testimonials"
  ],
  "sectionBlocks": [
    { "title": "How It Works", "content": "…" },
    { "title": "Who It's For", "content": "…" },
    { "title": "Why Now", "content": "…" }
  ]
}

Tone: confident, precise, no fluff. You are speaking to operators who care about clear ROI more than vibes.

Context:
${sharedContext}

Return ONLY the JSON object.
`;

    case "social":
      return `
You are a content strategist specializing in turning long-form stories into social that doesn't embarrass founders.

Generate a social pack object in STRICT JSON.

Structure:

{
  "type": "social",
  "linkedinPost": "Long-form LinkedIn post (2-5 short paragraphs, with spacing)",
  "twitterThread": "X thread, lines separated by line breaks. 5-8 tweets max.",
  "emailTeaser": "Short email body to tease the launch/article, 3-6 sentences.",
  "bullets": [
    "Ultra-short bullets that could be used in decks, captions, or callouts.",
    "…"
  ]
}

Tone: insightful, non-cringey, light touch of swagger. No hashtags inside the long copy, keep those implicit.

Context:
${sharedContext}

Return ONLY the JSON object.
`;

    default:
      return `Return a minimal JSON object { "error": "Unsupported mode" }.`;
  }
}

function extractJson(text: string): any {
  let cleaned = text.trim();

  const fence = cleaned.match(/```json([\s\S]*?)```/i);
  if (fence) cleaned = fence[1].trim();

  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1) {
    cleaned = cleaned.slice(firstBrace, lastBrace + 1);
  }

  return JSON.parse(cleaned);
}

function normalizeResult(mode: ContentMode, raw: any): ContentGenerationResult {
  const base = raw || {};
  switch (mode) {
    case "press_release":
      return {
        type: "press_release",
        headline: base.headline || "",
        subheadline: base.subheadline || "",
        sections: Array.isArray(base.sections) ? base.sections : [],
        boilerplate: base.boilerplate || "",
        quotes: Array.isArray(base.quotes) ? base.quotes : [],
        socialSnippets: Array.isArray(base.socialSnippets)
          ? base.socialSnippets
          : [],
      };
    case "article":
      return {
        type: "article",
        title: base.title || "",
        subtitle: base.subtitle || "",
        metaTitle: base.metaTitle || "",
        metaDescription: base.metaDescription || "",
        wordCountTarget: base.wordCountTarget || 1800,
        primaryKeyword: base.primaryKeyword || "",
        outline: Array.isArray(base.outline) ? base.outline : [],
        faqs: Array.isArray(base.faqs) ? base.faqs : [],
      };
    case "landing":
      return {
        type: "landing",
        heroHeadline: base.heroHeadline || "",
        heroSubheadline: base.heroSubheadline || "",
        primaryCTA: base.primaryCTA || "",
        secondaryCTA: base.secondaryCTA || "",
        valueProps: Array.isArray(base.valueProps) ? base.valueProps : [],
        proofElements: Array.isArray(base.proofElements)
          ? base.proofElements
          : [],
        sectionBlocks: Array.isArray(base.sectionBlocks)
          ? base.sectionBlocks
          : [],
      };
    case "social":
      return {
        type: "social",
        linkedinPost: base.linkedinPost || "",
        twitterThread: base.twitterThread || "",
        emailTeaser: base.emailTeaser || "",
        bullets: Array.isArray(base.bullets) ? base.bullets : [],
      };
    default:
      return {
        type: "social",
        linkedinPost: "",
        twitterThread: "",
        emailTeaser: "",
        bullets: [],
      };
  }
}

