// components/KeywordTable.tsx

"use client";

import { KeywordIdea } from "@/lib/types";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { useState } from "react";

export function KeywordTable({ ideas }: { ideas: KeywordIdea[] }) {
  const [copied, setCopied] = useState(false);

  if (!ideas?.length) return null;

  const exportCsv = () => {
    const header = [
      "Keyword",
      "SearchVolume",
      "CPC",
      "CompetitionIndex",
      "DifficultyScore",
      "Intent",
      "ClusterLabel",
      "PriorityScore",
      "Notes",
    ];
    const rows = ideas.map((k) => [
      k.keyword,
      k.searchVolume ?? "",
      k.cpc ?? "",
      k.competitionIndex ?? "",
      k.difficultyScore ?? "",
      k.intent ?? "",
      k.clusterLabel ?? "",
      k.priorityScore ?? "",
      (k.notes || "").replace(/\n/g, " "),
    ]);

    const csv =
      header.join(",") +
      "\n" +
      rows
        .map((r) =>
          r
            .map((x) =>
              `"${String(x).replace(/"/g, '""')}"`
            )
            .join(",")
        )
        .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "keywords.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyClustered = async () => {
    const lines = ideas.map((k) => {
      return [
        `Keyword: ${k.keyword}`,
        k.clusterLabel ? `Cluster: ${k.clusterLabel}` : "",
        k.intent ? `Intent: ${k.intent}` : "",
        k.priorityScore != null
          ? `Priority: ${k.priorityScore}/100`
          : "",
        k.searchVolume != null
          ? `Volume: ${k.searchVolume}`
          : "",
        k.difficultyScore != null
          ? `Difficulty: ${k.difficultyScore}/100`
          : "",
        k.notes ? `Notes: ${k.notes}` : "",
      ]
        .filter(Boolean)
        .join(" | ");
    });

    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <Card>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
        <div>
          <h2 className="text-lg font-semibold text-[#0A84FF]">
            Keyword Map
          </h2>
          <p className="text-[11px] text-gray-400">
            DataForSEO metrics + LLM clustering & prioritization.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportCsv}>
            Export CSV
          </Button>
          <Button
            variant="outline"
            onClick={copyClustered}
          >
            {copied ? "Copied" : "Copy as Plan"}
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-xs sm:text-sm text-gray-200">
          <thead className="border-b border-white/10 text-[10px] uppercase text-gray-500">
            <tr>
              <th className="py-2 pr-3 text-left">Keyword</th>
              <th className="py-2 pr-3 text-right">Volume</th>
              <th className="py-2 pr-3 text-right">CPC</th>
              <th className="py-2 pr-3 text-right">Comp.</th>
              <th className="py-2 pr-3 text-right">Diff.</th>
              <th className="py-2 pr-3 text-left">Intent</th>
              <th className="py-2 pr-3 text-left">Cluster</th>
              <th className="py-2 pr-3 text-right">Priority</th>
              <th className="py-2 pr-3 text-left">Notes</th>
            </tr>
          </thead>
          <tbody>
            {ideas.map((k, i) => (
              <tr key={i} className="border-b border-white/5 align-top">
                <td className="py-2 pr-3">
                  <div className="font-semibold">{k.keyword}</div>
                </td>
                <td className="py-2 pr-3 text-right text-gray-300">
                  {k.searchVolume != null ? k.searchVolume : "—"}
                </td>
                <td className="py-2 pr-3 text-right text-gray-300">
                  {k.cpc != null ? `$${k.cpc.toFixed(2)}` : "—"}
                </td>
                <td className="py-2 pr-3 text-right text-gray-300">
                  {k.competitionIndex != null
                    ? k.competitionIndex.toFixed(2)
                    : "—"}
                </td>
                <td className="py-2 pr-3 text-right text-gray-300">
                  {k.difficultyScore != null
                    ? `${k.difficultyScore}/100`
                    : "—"}
                </td>
                <td className="py-2 pr-3 text-gray-300">
                  {k.intent || "—"}
                </td>
                <td className="py-2 pr-3 text-gray-300">
                  {k.clusterLabel || "—"}
                </td>
                <td className="py-2 pr-3 text-right text-gray-300">
                  {k.priorityScore != null
                    ? `${k.priorityScore}/100`
                    : "—"}
                </td>
                <td className="py-2 pr-3 text-gray-300 whitespace-pre-wrap max-w-xs">
                  {k.notes || "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

