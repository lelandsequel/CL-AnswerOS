// components/OperatorReportPanel.tsx

"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { OperatorReport } from "@/lib/types";

interface Props {
  report: OperatorReport;
  url: string;
  clientName?: string;
}

type TabKey = "board" | "roast" | "money";

export function OperatorReportPanel({
  report,
  url,
  clientName,
}: Props) {
  const [tab, setTab] = useState<TabKey>("board");
  const [copied, setCopied] = useState(false);

  if (
    !report.boardSummary &&
    !report.whiteboardRoast &&
    !report.moneyboard
  ) {
    return null;
  }

  const currentText =
    tab === "board"
      ? report.boardSummary
      : tab === "roast"
      ? report.whiteboardRoast
      : report.moneyboard;

  const handleCopy = async () => {
    try {
      const header = [
        clientName
          ? `Client: ${clientName}`
          : "",
        `URL: ${url}`,
        report.subjectLine
          ? `Title: ${report.subjectLine}`
          : "",
        "",
      ]
        .filter(Boolean)
        .join("\n");

      await navigator.clipboard.writeText(
        header + currentText
      );
      setCopied(true);
      setTimeout(
        () => setCopied(false),
        2000
      );
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <Card>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
        <div>
          <h2 className="text-lg font-semibold text-[#0A84FF]">
            Operator Report
          </h2>
          <p className="text-[11px] text-gray-400">
            Operator-grade translation of your audit into board
            narrative, whiteboard ammo, and a money roadmap.
          </p>
          {report.subjectLine && (
            <p className="mt-1 text-[11px] text-gray-300">
              <span className="text-gray-500">
                Subject:
              </span>{" "}
              {report.subjectLine}
            </p>
          )}
        </div>
        <div className="flex gap-2 text-[11px]">
          <button
            onClick={() => setTab("board")}
            className={`px-3 py-1 rounded-full border text-xs ${
              tab === "board"
                ? "border-[#0A84FF] text-[#0A84FF]"
                : "border-white/10 text-gray-300"
            }`}
          >
            Board Summary
          </button>
          <button
            onClick={() => setTab("roast")}
            className={`px-3 py-1 rounded-full border text-xs ${
              tab === "roast"
                ? "border-[#0A84FF] text-[#0A84FF]"
                : "border-white/10 text-gray-300"
            }`}
          >
            Whiteboard Roast
          </button>
          <button
            onClick={() => setTab("money")}
            className={`px-3 py-1 rounded-full border text-xs ${
              tab === "money"
                ? "border-[#0A84FF] text-[#0A84FF]"
                : "border-white/10 text-gray-300"
            }`}
          >
            Moneyboard
          </button>
        </div>
      </div>

      <div className="mb-3">
        <div className="flex items-center justify-between gap-2 text-[11px] text-gray-500">
          <div>
            {tab === "board" &&
              "Board-ready summary for investors and execs."}
            {tab === "roast" &&
              "War-room critique you write on a whiteboard."}
            {tab === "money" &&
              "Execution roadmap that actually makes money."}
          </div>
          <Button
            variant="outline"
            onClick={handleCopy}
          >
            {copied ? "Copied" : "Copy"}
          </Button>
        </div>
      </div>

      <div className="rounded-xl bg-black/40 border border-white/10 p-3 max-h-[360px] overflow-auto text-xs sm:text-sm text-gray-200 whitespace-pre-wrap">
        {currentText || (
          <span className="text-gray-500">
            No content for this tab.
          </span>
        )}
      </div>
    </Card>
  );
}

