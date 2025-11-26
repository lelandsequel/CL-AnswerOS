import { NextRequest, NextResponse } from "next/server";
import {
  KeywordClusterResponse,
  KeywordCluster,
  KeywordMetricDetailed,
} from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const seed: string = body.seed || "";
    const keywords: KeywordMetricDetailed[] = body.keywords || [];

    if (!seed || !keywords.length) {
      return NextResponse.json(
        { error: "Missing seed or keywords" },
        { status: 400 }
      );
    }

    // Naive v1 clustering: group by first 1–2 words
    const clustersMap = new Map<string, KeywordCluster>();

    for (const k of keywords) {
      const parts = k.keyword.toLowerCase().split(" ");
      const topic =
        parts.slice(0, 2).join(" ") || k.keyword.toLowerCase();

      const existing = clustersMap.get(topic);
      if (!existing) {
        clustersMap.set(topic, {
          topic: topic,
          parentKeyword: k.keyword,
          intent: "commercial",
          difficulty: k.difficulty ?? 50,
          keywords: [k.keyword],
        });
      } else {
        existing.keywords.push(k.keyword);
        existing.difficulty = Math.round(
          (existing.difficulty + (k.difficulty ?? 50)) / 2
        );
      }
    }

    const clusters: KeywordCluster[] = Array.from(clustersMap.values());

    const response: KeywordClusterResponse = { clusters };

    return NextResponse.json(response);
  } catch (err: any) {
    console.error(err);
    return NextResponse.json(
      { error: err.message || "Keyword clustering failed" },
      { status: 500 }
    );
  }
}

