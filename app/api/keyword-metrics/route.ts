import { NextRequest, NextResponse } from "next/server";
import { getKeywordOverviewForKeywords } from "@/lib/dataforseo";

export interface KeywordMetricsResult {
  keyword: string;
  search_volume?: number;
  competition?: number;
  cpc?: number;
  keyword_difficulty?: number;
  trend?: "up" | "down" | "stable";
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { keywords, location_code = 2840, language_code = "en" } = body;

    if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
      return NextResponse.json(
        { error: "Missing or invalid 'keywords' array in request body" },
        { status: 400 }
      );
    }

    // Fetch keyword metrics from DataForSEO
    const items = await getKeywordOverviewForKeywords({
      keywords,
      location_code,
      language_code,
    });

    // Transform to our format
    const results: KeywordMetricsResult[] = items.map((item) => ({
      keyword: item.keyword,
      search_volume: item.search_volume,
      competition: item.competition,
      cpc: item.cpc,
      keyword_difficulty: item.keyword_difficulty,
      trend: determineTrend(item.monthly_searches),
    }));

    return NextResponse.json({ metrics: results }, { status: 200 });
  } catch (err: any) {
    console.error("keyword-metrics error:", err);
    return NextResponse.json(
      {
        error: "Failed to fetch keyword metrics",
        details: err?.message ?? String(err),
      },
      { status: 500 }
    );
  }
}

function determineTrend(
  monthly_searches?: Array<{ year: number; month: number; search_volume: number }>
): "up" | "down" | "stable" {
  if (!monthly_searches || monthly_searches.length < 2) return "stable";

  const sorted = [...monthly_searches].sort(
    (a, b) => new Date(a.year, a.month).getTime() - new Date(b.year, b.month).getTime()
  );

  const recent = sorted.slice(-3);
  if (recent.length < 2) return "stable";

  const avgOld = recent.slice(0, -1).reduce((sum, m) => sum + m.search_volume, 0) / (recent.length - 1);
  const latest = recent[recent.length - 1].search_volume;

  const change = ((latest - avgOld) / avgOld) * 100;

  if (change > 10) return "up";
  if (change < -10) return "down";
  return "stable";
}

