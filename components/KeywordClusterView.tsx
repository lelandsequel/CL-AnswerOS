"use client";

import { KeywordCluster } from "@/lib/types";
import { Card } from "./ui/card";

export function KeywordClusterView({ clusters }: { clusters: KeywordCluster[] }) {
  if (!clusters?.length) return null;

  return (
    <Card>
      <h2 className="text-lg font-semibold text-[#0A84FF] mb-3">
        Keyword Clusters
      </h2>
      <div className="grid md:grid-cols-3 gap-4 text-xs sm:text-sm">
        {clusters.map((c, idx) => (
          <div
            key={idx}
            className="bg-black/40 rounded-xl p-3 border border-white/10"
          >
            <div className="text-[#0A84FF] font-semibold mb-1">
              {c.topic}
            </div>
            <div className="text-gray-300 mb-1">
              Parent: <span className="font-mono">{c.parentKeyword}</span>
            </div>
            <div className="text-gray-400 mb-1">
              Intent: {c.intent} · Difficulty: {c.difficulty}
            </div>
            <ul className="list-disc list-inside text-gray-200 space-y-1 mt-1">
              {c.keywords.map((k, i) => (
                <li key={i}>{k}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Card>
  );
}

