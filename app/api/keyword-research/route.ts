import { NextRequest, NextResponse } from "next/server";
import {
  KeywordResearchRequest,
  KeywordResearchResponse,
  KeywordMetricDetailed,
} from "@/lib/types";
import { fetchKeywordDataFromDataForSEO } from "@/lib/dataforseo-extended";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as KeywordResearchRequest;
    const seed = body.seed?.trim();
    if (!seed) {
      return NextResponse.json(
        { error: "Missing seed keyword" },
        { status: 400 }
      );
    }

    const max = body.maxKeywords || 40;

    // Generate keyword variations
    const baseKeywords = [seed];
    baseKeywords.push(`${seed} services`);
    baseKeywords.push(`${seed} consulting`);
    baseKeywords.push(`${seed} pricing`);
    baseKeywords.push(`${seed} near me`);
    baseKeywords.push(`${seed} case studies`);
    baseKeywords.push(`what is ${seed}`);
    baseKeywords.push(`best ${seed}`);

    // Dedupe
    const unique = Array.from(new Set(baseKeywords)).slice(0, max);

    const dfs = await fetchKeywordDataFromDataForSEO(unique, {
      language_name: body.language || "English",
      location_name:
        body.market === "gb"
          ? "United Kingdom"
          : body.market === "ca"
          ? "Canada"
          : body.market === "au"
          ? "Australia"
          : "United States",
    });

    const detailed: KeywordMetricDetailed[] = dfs.map((k: any) => ({
      keyword: k.keyword,
      searchVolume: k.searchVolume,
      cpc: k.cpc,
      competition: k.competition,
      difficulty: Math.round(
        Math.min(100, (k.competition || 0.5) * 100 + 10)
      ),
      intent: "commercial",
      serpFeatures: [],
    }));

    // Split into buckets
    const primary = detailed.slice(0, 10);
    const supporting = detailed.slice(10, 25);
    const questions = detailed.filter((k) =>
      k.keyword.toLowerCase().startsWith("what") ||
      k.keyword.toLowerCase().startsWith("how") ||
      k.keyword.toLowerCase().startsWith("why")
    );

    const response: KeywordResearchResponse = {
      primary,
      supporting,
      questions,
    };

    return NextResponse.json(response);
  } catch (err: any) {
    console.error(err);
    return NextResponse.json(
      { error: err.message || "Keyword research failed" },
      { status: 500 }
    );
  }
}

