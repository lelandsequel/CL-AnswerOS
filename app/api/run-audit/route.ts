import { NextRequest, NextResponse } from "next/server";
import { runAuditAnalysisLLM, safeParseJsonFromText } from "@/lib/llm";
import { parseJsonBody, errorResponse, getErrorMessage } from "@/lib/api-utils";

interface AuditRequestBody {
  url?: string;
}

interface ScanPayload {
  rawScan?: string;
  scan?: string;
  raw?: string;
  keywordMetrics?: Record<string, unknown>;
  keywords?: Record<string, unknown>;
}

export async function POST(req: NextRequest) {
  try {
    const { data: body, error: parseError } = await parseJsonBody<AuditRequestBody>(req);

    if (parseError || !body) {
      return errorResponse(parseError || "Invalid request body", 400);
    }

    const url = typeof body.url === "string" ? body.url.trim() : "";

    if (!url) {
      return errorResponse("Missing required field: url", 400);
    }

    // ----------------------------------------
    // 1) Call /api/run-scan to get raw scan data
    // ----------------------------------------
    let rawScan = "";
    let keywordMetrics: Record<string, unknown> | null = null;
    let scanPayload: ScanPayload | null = null;

    try {
      const origin = req.nextUrl.origin;
      const scanRes = await fetch(`${origin}/api/run-scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const scanText = await scanRes.text();
      if (!scanRes.ok) {
        console.error("[run-audit] /api/run-scan failed:", scanText);
      } else {
        scanPayload = JSON.parse(scanText) as ScanPayload;
        rawScan =
          scanPayload?.rawScan ||
          scanPayload?.scan ||
          scanPayload?.raw ||
          scanText;
        keywordMetrics =
          scanPayload?.keywordMetrics ||
          scanPayload?.keywords ||
          null;
      }
    } catch (err) {
      console.error("[run-audit] Error calling /api/run-scan:", err);
    }

    if (!rawScan) {
      rawScan = `No structured scan payload available. Minimal context: URL = ${url}`;
    }

    // For prompt compactness, avoid sending insane payloads
    const trimmedScan =
      rawScan.length > 8000
        ? rawScan.slice(0, 8000) + "\n\n[...truncated scan output...]"
        : rawScan;

    const keywordSnippet =
      keywordMetrics && typeof keywordMetrics === "object"
        ? JSON.stringify(keywordMetrics).slice(0, 4000)
        : "";

    // ----------------------------------------
    // 2) Build prompt for structured audit
    // ----------------------------------------
    const prompt = `
You are an operator-level SEO/AEO consultant.

You are given:
- A website URL to audit.
- A raw technical/content scan (possibly noisy).
- Optional keyword metrics from tools like DataForSEO.

URL:
${url}

RAW SCAN (noisy, potentially truncated):
${trimmedScan}

KEYWORD METRICS (if present, JSON-ish):
${keywordSnippet || "none provided"}

TASK:
Produce a SINGLE, STRICT JSON object called "structured audit" with the following high-level shape:

{
  "overview": {
    "domain": "string",
    "current_state": "short summary of digital/SEO health",
    "opportunity_rating": "Low | Medium | High",
    "raw_score": number
  },
  "core_issues": [
    {
      "category": "Technical | Content | AEO | Conversion | Brand",
      "severity": "Low | Medium | High | Critical",
      "symptoms": ["short descriptions of issues"],
      "business_impact": "1-3 sentence explanation in business terms"
    }
  ],
  "aeo_opportunities": [
    {
      "focus": "Answer Engine Opportunity name",
      "tactics": ["specific recommended actions"],
      "expected_impact": "short description, optionally with % range"
    }
  ],
  "content_playbook": {
    "positioning_statement": "sharp one-liner",
    "key_messaging_pillars": ["pillar 1", "pillar 2", "pillar 3"],
    "content_pillars": ["topics or series themes"],
    "target_persona": {
      "summary": "short description of main buyer",
      "pain_points": ["pain 1", "pain 2"]
    }
  },
  "quick_wins_48h": [
    {
      "action": "specific action",
      "impact_score": number,
      "effort_level": "Low | Medium | High"
    }
  ],
  "roadmap_30_60_90": {
    "30_days": {
      "theme": "short label",
      "initiatives": ["item", "item"]
    },
    "60_days": {
      "theme": "short label",
      "initiatives": ["item", "item"]
    },
    "90_days": {
      "theme": "short label",
      "initiatives": ["item", "item"]
    }
  },
  "investment_outlook": {
    "recommended_budget_range": "string, e.g. '$10k–$25k'",
    "projected_roi": "short narrative estimate",
    "notes": "optional extra guidance"
  }
}

Requirements:
- Use clear, operator-grade language (no fluff, no agency buzzword salad).
- Be specific and actionable.
- Align recommendations with the scan + keyword context.
- Return ONLY the JSON object (no markdown, no commentary).
`;

    // ----------------------------------------
    // 3) Call LLM router for structured analysis
    // ----------------------------------------
    const { text, raw } = await runAuditAnalysisLLM(prompt, {
      expectJson: true,
    });

    const structuredAudit =
      raw?.parsedJson ||
      safeParseJsonFromText(text) || {
        parsingFallback: true,
        rawText: text,
      };

    // ----------------------------------------
    // 4) Respond with combined payload
    // ----------------------------------------
    return NextResponse.json({
      url,
      rawScan,
      structuredAudit,
      keywordMetrics,
    });
  } catch (err) {
    console.error("[run-audit] Fatal error:", err);
    return errorResponse(getErrorMessage(err));
  }
}

