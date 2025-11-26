// app/api/keywords/route.ts
// Keyword Suite API: DataForSEO keyword ideas + LLM clustering/prioritization

import { NextRequest, NextResponse } from "next/server";
import { KeywordRequest, KeywordResponse, KeywordIdea } from "@/lib/types";
import { fetchKeywordIdeas } from "@/lib/dataforseo-keywords";
import { runKeywordExpandLLM, safeParseJsonFromText } from "@/lib/llm";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as KeywordRequest;

    if (!body.seedKeyword && !body.url) {
      return NextResponse.json(
        { error: "seedKeyword or url is required" },
        { status: 400 }
      );
    }

    const seedKeyword = body.seedKeyword || "";
    const url = body.url || "";
    const location = body.location || "United States";
    const language = body.language || "English";
    const limit = body.limit && body.limit > 0 ? body.limit : 50;

    // ----------------------------------------
    // 1) Fetch raw ideas from DataForSEO
    // ----------------------------------------
    console.log("[Keywords API] Fetching DataForSEO ideas for:", { seedKeyword, url, location, language, limit });
    const dfsIdeas = await fetchKeywordIdeas({
      seedKeyword,
      url,
      location,
      language,
      limit,
    });

    console.log("[Keywords API] DataForSEO returned", dfsIdeas.length, "ideas");

    if (!dfsIdeas.length) {
      console.log("[Keywords API] No ideas found, returning empty response");
      const empty: KeywordResponse = {
        seedKeyword,
        url,
        location,
        language,
        ideas: [],
      };
      return NextResponse.json(empty);
    }

    const compactIdeas = dfsIdeas.map((k) => ({
      keyword: k.keyword,
      searchVolume: k.searchVolume ?? null,
      cpc: k.cpc ?? null,
      competitionIndex: k.competitionIndex ?? null,
    }));

    // ----------------------------------------
    // 2) LLM clustering + prioritization
    // ----------------------------------------
    const prompt = `
You are an SEO strategist with real operator experience.

You are given a JSON array of keyword ideas with basic metrics:

${JSON.stringify(compactIdeas.slice(0, limit), null, 2)}

Context:
- Seed keyword: "${seedKeyword}"
- URL (may be empty): "${url}"
- Location: "${location}"
- Language: "${language}"

TASK:
Cluster and prioritize these keywords for a REAL SEO/AEO content & growth strategy.

For each keyword, you must output:

{
  "keyword": "string",
  "searchVolume": number | null,
  "cpc": number | null,
  "competitionIndex": number | null,
  "difficultyScore": number,
  "intent": "informational" | "navigational" | "commercial" | "transactional" | "mixed",
  "clusterLabel": "short cluster or content theme label",
  "priorityScore": number,
  "notes": "1-3 short bullet-style sentences with specific recommendations or angles"
}

Rules:
- PRIORITY: weigh high-intent + realistic difficulty + relevant search volume.
- Favor keywords that a scrappy but competent team can ACTUALLY rank for.
- Only return keywords present in the input array.
- No extra commentary. Return ONLY a JSON array of the objects above.
`;

    let enriched: KeywordIdea[] = dfsIdeas;

    console.log("[Keywords API] Starting LLM enrichment for", compactIdeas.length, "keywords");
    try {
      const { text, raw } = await runKeywordExpandLLM(prompt, {
        expectJson: true,
      });

      console.log("[Keywords API] LLM response length:", text?.length);
      const parsed =
        raw?.parsedJson || safeParseJsonFromText(text) || null;

      console.log("[Keywords API] LLM parsed result:", parsed ? "success" : "failed");

      if (parsed && Array.isArray(parsed)) {
        console.log("[Keywords API] LLM returned", parsed.length, "enriched keywords");
        // Merge onto base DataForSEO ideas by keyword
        const idx = new Map<string, any>();
        for (const item of parsed) {
          const kw = (item.keyword || "").toLowerCase();
          if (!kw) continue;
          idx.set(kw, item);
        }

        enriched = dfsIdeas.map((base) => {
          const key = base.keyword.toLowerCase();
          const scored = idx.get(key);
          if (!scored) return base;

          const difficultyScore =
            typeof scored.difficultyScore === "number"
              ? scored.difficultyScore
              : base.difficultyScore;

          const priorityScore =
            typeof scored.priorityScore === "number"
              ? scored.priorityScore
              : base.priorityScore;

          const intent = scored.intent || base.intent;
          const clusterLabel =
            scored.clusterLabel || base.clusterLabel;

          const notes = scored.notes || base.notes;

          return {
            ...base,
            difficultyScore:
              typeof difficultyScore === "number"
                ? difficultyScore
                : undefined,
            priorityScore:
              typeof priorityScore === "number"
                ? priorityScore
                : undefined,
            intent,
            clusterLabel,
            notes,
          } as KeywordIdea;
        });
        console.log("[Keywords API] Successfully enriched", enriched.filter(k => k.clusterLabel).length, "keywords with clusters");
      } else {
        console.warn(
          "[keywords] LLM returned non-array, using raw DFS ideas."
        );
      }
    } catch (err) {
      console.error("[keywords] LLM expansion failed:", err);
      // Keep enriched as dfsIdeas
    }

    // ----------------------------------------
    // 3) Response
    // ----------------------------------------
    enriched.sort(
      (a, b) =>
        (b.priorityScore ?? 0) - (a.priorityScore ?? 0)
    );

    const resp: KeywordResponse = {
      seedKeyword,
      url,
      location,
      language,
      ideas: enriched.slice(0, limit),
    };

    return NextResponse.json(resp);
  } catch (err: any) {
    console.error("[keywords] Fatal error:", err);
    return NextResponse.json(
      { error: err?.message || "Keyword suite failed" },
      { status: 500 }
    );
  }
}

