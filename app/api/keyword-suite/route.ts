import { NextRequest, NextResponse } from "next/server";
import { runKeywordSuiteLLM, safeParseJsonFromText } from "@/lib/llm";

type KeywordSuiteResult = {
  primary_keywords: string[];
  secondary_keywords: string[];
  clusters: {
    cluster_name: string;
    intent: "informational" | "commercial" | "transactional" | "navigational";
    keywords: string[];
  }[];
  content_ideas: {
    title: string;
    type: "blog" | "landing" | "faq" | "press_release" | "support_doc";
    angle: string;
    target_cluster: string;
  }[];
  faqs: {
    question: string;
    intent: "informational" | "transactional" | "trust" | "objection";
  }[];
};

function extractJsonBlock(text: string): any {
  const first = text.indexOf("{");
  const last = text.lastIndexOf("}");
  if (first === -1 || last === -1 || last <= first) {
    throw new Error("No JSON object found in LLM response");
  }
  const jsonString = text.slice(first, last + 1);
  return JSON.parse(jsonString);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { auditText } = body as { auditText?: string };

    if (!auditText || auditText.trim().length < 40) {
      return NextResponse.json(
        {
          error:
            "auditText is required and should be at least 40 characters of meaningful content.",
        },
        { status: 400 }
      );
    }

    const prompt = `
You are "BLUE MODE" – Leland's money-printing SEO/AEO content strategist.

You receive an audit/scan text for a website. Your job is to transform this into a concise, **actionable plan** that Leland can SELL as deliverables.

INPUT (auditText):
---
${auditText}
---

REQUIRED OUTPUT:
Return a **single JSON object only**, with this exact shape:

{
  "primary_keywords": string[],
  "secondary_keywords": string[],
  "clusters": [
    {
      "cluster_name": string,
      "intent": "informational" | "commercial" | "transactional" | "navigational",
      "keywords": string[]
    }
  ],
  "content_ideas": [
    {
      "title": string,
      "type": "blog" | "landing" | "faq" | "press_release" | "support_doc",
      "angle": string,
      "target_cluster": string
    }
  ],
  "faqs": [
    {
      "question": string,
      "intent": "informational" | "transactional" | "trust" | "objection"
    }
  ]
}

RULES:
- DO NOT wrap JSON in backticks or a code fence.
- DO NOT add commentary before or after JSON.
- Use American English.
- Bias toward **money / booking / leads / table-turning** angles.
- Make clusters and ideas **actually usable** for proposals & scope.
`;

    const result = await runKeywordSuiteLLM(prompt, { expectJson: true });
    const rawText = result.text;

    let parsed: KeywordSuiteResult;
    try {
      parsed = extractJsonBlock(rawText);
    } catch (err) {
      console.error("Failed to parse JSON from LLM response:", err, rawText);
      return NextResponse.json(
        {
          error: "Failed to parse JSON from LLM response",
          rawText,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(parsed);
  } catch (err: any) {
    console.error("keyword-suite route error:", err);
    return NextResponse.json(
      { error: err?.message || "Unexpected server error in keyword-suite" },
      { status: 500 }
    );
  }
}

