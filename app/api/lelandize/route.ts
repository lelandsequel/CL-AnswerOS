// app/api/lelandize/route.ts
// Takes structuredAudit + context and returns a Lelandized report (board summary, whiteboard roast, moneyboard)

import { NextRequest, NextResponse } from "next/server";
import {
  LelandizeRequestBody,
  LelandizeResponseBody,
} from "@/lib/types";
import {
  callLLMTask,
  safeParseJsonFromText,
} from "@/lib/llm";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as LelandizeRequestBody;

    if (!body || !body.structuredAudit || !body.url) {
      return NextResponse.json(
        {
          error:
            "url and structuredAudit are required for Lelandizer",
        },
        { status: 400 }
      );
    }

    const url = body.url.trim();
    const clientName = body.clientName?.trim();
    const sassLevel =
      typeof body.sassLevel === "number"
        ? Math.min(
            10,
            Math.max(1, body.sassLevel)
          )
        : 7;
    const chaosLevel =
      typeof body.chaosLevel === "number"
        ? Math.min(
            10,
            Math.max(1, body.chaosLevel)
          )
        : 5;
    const notes = body.notes?.trim() || "";

    const structuredAudit = body.structuredAudit;

    const domain = (() => {
      try {
        const u = new URL(url);
        return u.hostname.replace(/^www\./, "");
      } catch {
        return url
          .replace(/^https?:\/\//, "")
          .split("/")[0]
          .replace(/^www\./, "");
      }
    })();

    const prompt = `
You are "Lelandizer" — an operator-grade, slightly unhinged consultant.
Your job is to transform a structured SEO/AEO audit into three deliverables:

1) Board Summary ("boardSummary"):
   - Tone: sharp, investor/board ready
   - Length: ~4–7 short paragraphs
   - Focus: what matters in money and risk terms
   - Include: clearest diagnosis, opportunity, and what must happen next
   - No fluff, no agency-speak. Operator language.

2) Whiteboard Roast ("whiteboardRoast"):
   - Tone: brutally honest war-room session
   - Length: bullet-heavy, can be spicy but still professional-ish
   - Highlight: dumb decisions, missed basics, and obvious money leaks
   - This is what you'd write on a whiteboard while pacing around the room.

3) Moneyboard ("moneyboard"):
   - Tone: execution deck / revenue roadmap
   - Format: sections with bullets and simple headings
   - Cover:
     - "Immediate Money Moves (0–14 days)"
     - "Leverage Plays (30–90 days)"
     - "Moat + AEO Dominance (90–180 days)"
   - Each bullet: one specific move, expected impact, and who should own it (role-level, not names).

Context:
- URL / Domain: ${url} (${domain})
- Client Name: ${clientName || "N/A"}
- Sass Level (1-10): ${sassLevel}
- Chaos Level (1-10): ${chaosLevel}
- Extra Notes / Intent:
${notes || "None provided."}

STRUCTURED AUDIT (JSON):
${JSON.stringify(structuredAudit, null, 2)}

RESPONSE FORMAT:
Return ONLY a JSON object with this exact shape:

{
  "boardSummary": "string",
  "whiteboardRoast": "string",
  "moneyboard": "string",
  "subjectLine": "string"
}

Where:
- "subjectLine" is a punchy subject line or title you'd use in email or slide deck.
- Do NOT include markdown fences, no extra commentary, no prose outside JSON.
`;

    const { text, raw } = await callLLMTask({
      task: "lelandizer",
      prompt,
      expectJson: true,
    });

    const parsed =
      raw?.parsedJson ||
      safeParseJsonFromText(text) ||
      null;

    if (!parsed || typeof parsed !== "object") {
      return NextResponse.json(
        {
          error:
            "Lelandizer returned non-JSON output",
          rawText: text,
        },
        { status: 500 }
      );
    }

    const report: LelandizeResponseBody = {
      url,
      clientName,
      report: {
        boardSummary:
          parsed.boardSummary || parsed.board_summary || "",
        whiteboardRoast:
          parsed.whiteboardRoast ||
          parsed.whiteboard_roast ||
          "",
        moneyboard:
          parsed.moneyboard || "",
        subjectLine:
          parsed.subjectLine ||
          parsed.subject_line ||
          "",
      },
    };

    return NextResponse.json(report);
  } catch (err: any) {
    console.error("[lelandize] error:", err);
    return NextResponse.json(
      {
        error:
          err?.message ||
          "Failed to generate Lelandized report",
      },
      { status: 500 }
    );
  }
}

