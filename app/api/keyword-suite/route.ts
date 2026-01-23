import { NextRequest, NextResponse } from "next/server";
import { runKeywordSuiteLLM, requireJsonFromText } from "@/lib/llm";

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

import { parseJsonBody, errorResponse, getErrorMessage } from "@/lib/api-utils";

interface KeywordSuiteRequestBody {
  auditText?: string;
}

export async function POST(req: NextRequest) {
  try {
    const { data: body, error: parseError } = await parseJsonBody<KeywordSuiteRequestBody>(req);

    if (parseError || !body) {
      return errorResponse(parseError || "Invalid request body", 400);
    }

    const { auditText } = body;

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
      parsed = requireJsonFromText(rawText) as KeywordSuiteResult;
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
  } catch (err) {
    console.error("keyword-suite route error:", err);
    return errorResponse(getErrorMessage(err));
  }
}

