import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

type FixItem = {
  id: string;
  category:
    | "TITLE"
    | "META"
    | "CONTENT"
    | "SCHEMA"
    | "TECHNICAL"
    | "INTERNAL_LINKS"
    | "CTA"
    | "LOCAL_SEO"
    | "AEO"
    | "OTHER";
  label: string;
  issue: string;
  fixSummary: string;
  codeSnippet: string;
  implementationSteps: string[];
  successCriteria: string[];
  priority: "low" | "medium" | "high" | "critical";
  estimatedTime: string;
  difficulty: "beginner" | "intermediate" | "advanced";
};

type FixPack = {
  auditSummary: string;
  overallStrategy: string;
  quickWins: FixItem[];
  deepFixes: FixItem[];
  notesForClient: string;
};

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

async function callLLM(audit: string, url: string): Promise<FixPack> {
  const systemPrompt = `
You are "Leland OS – Fix Engine", an elite technical SEO + content strategist with 10+ years implementing fixes that actually move the needle.

Your mission: Transform audit findings into IMPLEMENTATION-READY fixes that developers can copy-paste and clients can understand.

CRITICAL REQUIREMENTS:
- Every fix must include WORKING code snippets (HTML, CSS, JavaScript, JSON-LD)
- Step-by-step implementation instructions with exact file paths
- Measurable success criteria (how to verify the fix worked)
- Priority levels based on impact vs effort
- No generic advice - only specific, actionable fixes

RESPONSE FORMAT: STRICT JSON

{
  "auditSummary": "2-3 sentence executive summary of the site's SEO health",
  "overallStrategy": "High-level 30/60/90 day roadmap",
  "quickWins": FixItem[],
  "deepFixes": FixItem[],
  "notesForClient": "Business-focused explanation of why these fixes matter"
}

FixItem structure:
{
  "id": "unique_slug_like_title_tag_fix",
  "category": "TITLE" | "META" | "CONTENT" | "SCHEMA" | "TECHNICAL" | "INTERNAL_LINKS" | "CTA" | "LOCAL_SEO" | "AEO" | "OTHER",
  "label": "Human-readable title (e.g. 'Fix Missing Title Tags')",
  "issue": "Specific problem identified in audit",
  "fixSummary": "What this fix accomplishes and expected impact",
  "codeSnippet": "COMPLETE, WORKING code that can be copy-pasted. Include HTML, CSS, JS, JSON-LD as needed.",
  "implementationSteps": ["Step 1: Open header.php", "Step 2: Add this code before </head>", "Step 3: Test with browser dev tools"],
  "successCriteria": ["Title appears in browser tab", "Title length is 30-60 characters", "Contains primary keyword"],
  "priority": "critical" | "high" | "medium" | "low",
  "estimatedTime": "5 minutes",
  "difficulty": "beginner" | "intermediate" | "advanced"
}

QUALITY STANDARDS:
- Code snippets must be production-ready and escaped properly for JSON
- Include specific selectors, classes, IDs from the audit when possible
- Provide fallback options for different CMS platforms (WordPress, Shopify, etc.)
- Quantify impact where possible ("Expected 15-25% increase in click-through rate")
- Focus on fixes that provide immediate ROI

MINIMUM FIX REQUIREMENTS:
- 3-5 Quick Wins (under 15 minutes each)
- 5-8 Deep Fixes (30-120 minutes each)
- At least one of each category: TITLE, META, SCHEMA, TECHNICAL, CONTENT
- Include platform-specific instructions when audit data allows
`;

  const userPrompt = `
Website URL: ${url}

Structured Audit:
${audit}
`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.3,
  });

  const raw = completion.choices[0]?.message?.content ?? "{}";
  const parsed = JSON.parse(raw) as FixPack;
  return parsed;
}

async function logFixRun(url: string, audit: string, fixPack: FixPack) {
  if (!supabase) return;
  try {
    await supabase.from("fix_runs").insert({
      url,
      audit_text: audit,
      fix_pack: fixPack,
    });
  } catch (err) {
    console.error("Failed to log fix run:", err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, audit } = body as { url?: string; audit?: string };

    if (!url || !audit) {
      return new NextResponse(
        JSON.stringify({ error: "Missing url or audit in request body" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return new NextResponse(
        JSON.stringify({ error: "Missing OPENAI_API_KEY in environment" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const fixPack = await callLLM(audit, url);

    logFixRun(url, audit, fixPack).catch(() => {});

    return new NextResponse(JSON.stringify({ fixPack }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("Fix engine error:", err);
    return new NextResponse(
      JSON.stringify({
        error: "Failed to generate fix pack",
        detail: err?.message,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

