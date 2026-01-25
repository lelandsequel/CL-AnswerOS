// components/DeepAuditPanel.tsx
// Renders deep audit results with pillar breakdowns and fixes

"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import type { DeepAuditResult, PillarAnalysis, AuditIssue, Severity } from "@/lib/audit-engine/types";

interface DeepAuditPanelProps {
  result: DeepAuditResult;
}

function ScoreBadge({ score, size = "md" }: { score: number; size?: "sm" | "md" | "lg" }) {
  const color =
    score >= 70 ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/10" :
    score >= 40 ? "text-amber-400 border-amber-500/30 bg-amber-500/10" :
    "text-red-400 border-red-500/30 bg-red-500/10";

  const sizeClass =
    size === "lg" ? "text-3xl px-4 py-2" :
    size === "md" ? "text-xl px-3 py-1.5" :
    "text-sm px-2 py-1";

  return (
    <span className={`font-mono font-bold border ${color} ${sizeClass}`}>
      {score}
    </span>
  );
}

function StatusBadge({ status }: { status: "good" | "needs-work" | "critical" }) {
  const styles = {
    good: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
    "needs-work": "text-amber-400 border-amber-500/30 bg-amber-500/10",
    critical: "text-red-400 border-red-500/30 bg-red-500/10",
  };

  return (
    <span className={`text-xs px-2 py-0.5 border ${styles[status]}`}>
      {status.replace("-", " ")}
    </span>
  );
}

function SeverityBadge({ severity }: { severity: Severity }) {
  const styles = {
    CRITICAL: "text-red-400 border-red-500/50",
    HIGH: "text-orange-400 border-orange-500/50",
    MEDIUM: "text-amber-400 border-amber-500/50",
    LOW: "text-slate-400 border-slate-500/50",
  };

  return (
    <span className={`text-[10px] px-1.5 py-0.5 border ${styles[severity]}`}>
      {severity}
    </span>
  );
}

function IssueCard({ issue, defaultExpanded = false }: { issue: AuditIssue; defaultExpanded?: boolean }) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <div className="border border-slate-800 bg-slate-900/50">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-3 text-left flex items-start gap-3"
      >
        <span className="text-slate-600 text-xs mt-0.5">{expanded ? "▼" : "▶"}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <SeverityBadge severity={issue.severity} />
            <span className="text-slate-200 text-sm">{issue.title}</span>
          </div>
          <p className="text-xs text-slate-500 mt-1 line-clamp-1">{issue.description}</p>
        </div>
      </button>

      {expanded && (
        <div className="px-3 pb-3 pt-0 border-t border-slate-800 mt-0">
          <div className="pt-3 space-y-3">
            <div>
              <div className="text-[10px] text-slate-600 uppercase tracking-wider mb-1">Current State</div>
              <div className="text-xs text-slate-400">{issue.currentState}</div>
            </div>

            <div>
              <div className="text-[10px] text-slate-600 uppercase tracking-wider mb-1">Impact</div>
              <div className="text-xs text-slate-400">{issue.impact}</div>
            </div>

            <div className="border border-violet-500/30 bg-violet-500/5 p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="text-[10px] text-violet-400 uppercase tracking-wider">
                  Fix: {issue.fix.title}
                </div>
                <span className="text-[10px] text-slate-500">
                  ~{issue.fix.estimatedEffort}
                </span>
              </div>
              <p className="text-xs text-slate-400 mb-2">{issue.fix.description}</p>

              {issue.fix.type === "code" || issue.fix.type === "file" ? (
                <div className="relative">
                  <pre className="text-xs bg-slate-950 p-3 overflow-x-auto border border-slate-800 max-h-64 overflow-y-auto">
                    <code className={`language-${issue.fix.language || "text"}`}>
                      {issue.fix.content}
                    </code>
                  </pre>
                  <button
                    onClick={() => navigator.clipboard.writeText(issue.fix.content)}
                    className="absolute top-2 right-2 text-[10px] text-slate-500 hover:text-violet-400 border border-slate-700 px-2 py-1 bg-slate-900"
                  >
                    copy
                  </button>
                </div>
              ) : (
                <div className="text-xs text-slate-300 whitespace-pre-wrap bg-slate-950 p-3 border border-slate-800 max-h-64 overflow-y-auto">
                  {issue.fix.content}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PillarCard({
  pillar,
  icon,
  category,
}: {
  pillar: PillarAnalysis;
  icon: string;
  category: "seo" | "aeo";
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`border ${category === "aeo" ? "border-violet-500/30" : "border-slate-800"}`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 text-left"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-lg">{icon}</span>
            <div>
              <div className="text-sm text-slate-200">{pillar.name}</div>
              <div className="text-[10px] text-slate-600 uppercase tracking-wider">
                {category === "aeo" ? "AEO" : "SEO"} Pillar
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={pillar.status} />
            <ScoreBadge score={pillar.score} size="sm" />
          </div>
        </div>
        <p className="text-xs text-slate-500 mt-2">{pillar.summary}</p>
        {pillar.issues.length > 0 && (
          <div className="text-[10px] text-slate-600 mt-2">
            {pillar.issues.length} issue{pillar.issues.length !== 1 ? "s" : ""} found
            {pillar.quickWins.length > 0 && (
              <span className="text-emerald-500 ml-2">
                ({pillar.quickWins.length} quick win{pillar.quickWins.length !== 1 ? "s" : ""})
              </span>
            )}
          </div>
        )}
      </button>

      {expanded && pillar.issues.length > 0 && (
        <div className="px-4 pb-4 space-y-2">
          {pillar.issues.map((issue) => (
            <IssueCard key={issue.id} issue={issue} />
          ))}
        </div>
      )}
    </div>
  );
}

function ActionPlanSection({ title, issues, color }: { title: string; issues: AuditIssue[]; color: string }) {
  const [expanded, setExpanded] = useState(false);

  if (issues.length === 0) return null;

  return (
    <div className={`border ${color}`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-3 text-left flex items-center justify-between"
      >
        <span className="text-sm text-slate-200">{title}</span>
        <span className="text-xs text-slate-500">{issues.length} items</span>
      </button>
      {expanded && (
        <div className="px-3 pb-3 space-y-2">
          {issues.map((issue) => (
            <IssueCard key={issue.id} issue={issue} />
          ))}
        </div>
      )}
    </div>
  );
}

export function DeepAuditPanel({ result }: DeepAuditPanelProps) {
  const [view, setView] = useState<"pillars" | "action-plan">("pillars");

  const seoPillars = [
    { pillar: result.seo.technical, icon: "🔧", category: "seo" as const },
    { pillar: result.seo.onPage, icon: "📄", category: "seo" as const },
    { pillar: result.seo.content, icon: "📝", category: "seo" as const },
    { pillar: result.seo.authority, icon: "🔗", category: "seo" as const },
    { pillar: result.seo.ux, icon: "📱", category: "seo" as const },
  ];

  const aeoPillars = [
    { pillar: result.aeo.entityDefinition, icon: "🏢", category: "aeo" as const },
    { pillar: result.aeo.schemaMarkup, icon: "🏷️", category: "aeo" as const },
    { pillar: result.aeo.faqTargeting, icon: "❓", category: "aeo" as const },
    { pillar: result.aeo.voiceSearch, icon: "🎤", category: "aeo" as const },
    { pillar: result.aeo.aiSearch, icon: "🤖", category: "aeo" as const },
  ];

  const totalIssues =
    result.actionPlan.immediate.length +
    result.actionPlan.shortTerm.length +
    result.actionPlan.mediumTerm.length +
    result.actionPlan.longTerm.length;

  const quickWins = [...seoPillars, ...aeoPillars].reduce(
    (acc, p) => acc + p.pillar.quickWins.length,
    0
  );

  return (
    <div className="space-y-6">
      {/* Score Overview */}
      <Card variant="terminal" title="~/deep-audit/scores">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-[10px] text-slate-600 uppercase tracking-wider mb-2">Overall</div>
            <ScoreBadge score={result.overallScore} size="lg" />
          </div>
          <div>
            <div className="text-[10px] text-slate-600 uppercase tracking-wider mb-2">SEO Score</div>
            <ScoreBadge score={result.seoScore} size="lg" />
          </div>
          <div>
            <div className="text-[10px] text-violet-600 uppercase tracking-wider mb-2">AEO Score</div>
            <ScoreBadge score={result.aeoScore} size="lg" />
          </div>
        </div>

        <div className="flex justify-center gap-6 mt-4 pt-4 border-t border-slate-800 text-xs text-slate-500">
          <span>
            <span className="text-red-400">{totalIssues}</span> issues found
          </span>
          <span>
            <span className="text-emerald-400">{quickWins}</span> quick wins
          </span>
        </div>
      </Card>

      {/* View Toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setView("pillars")}
          className={`px-4 py-2 text-sm border ${
            view === "pillars"
              ? "border-violet-500 text-violet-400 bg-violet-500/10"
              : "border-slate-800 text-slate-500 hover:text-slate-300"
          }`}
        >
          By Pillar
        </button>
        <button
          onClick={() => setView("action-plan")}
          className={`px-4 py-2 text-sm border ${
            view === "action-plan"
              ? "border-violet-500 text-violet-400 bg-violet-500/10"
              : "border-slate-800 text-slate-500 hover:text-slate-300"
          }`}
        >
          Action Plan
        </button>
      </div>

      {view === "pillars" ? (
        <>
          {/* SEO Pillars */}
          <div>
            <div className="text-xs text-slate-600 mb-3">// seo_pillars[5]</div>
            <div className="space-y-2">
              {seoPillars.map(({ pillar, icon, category }) => (
                <PillarCard key={pillar.name} pillar={pillar} icon={icon} category={category} />
              ))}
            </div>
          </div>

          {/* AEO Pillars */}
          <div>
            <div className="text-xs text-violet-600 mb-3">// aeo_pillars[5]</div>
            <div className="space-y-2">
              {aeoPillars.map(({ pillar, icon, category }) => (
                <PillarCard key={pillar.name} pillar={pillar} icon={icon} category={category} />
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="space-y-3">
          <ActionPlanSection
            title="Do Today"
            issues={result.actionPlan.immediate}
            color="border-red-500/30"
          />
          <ActionPlanSection
            title="Do This Week"
            issues={result.actionPlan.shortTerm}
            color="border-orange-500/30"
          />
          <ActionPlanSection
            title="Do This Month"
            issues={result.actionPlan.mediumTerm}
            color="border-amber-500/30"
          />
          <ActionPlanSection
            title="Do This Quarter"
            issues={result.actionPlan.longTerm}
            color="border-slate-700"
          />
        </div>
      )}

      {/* Metadata */}
      <div className="text-[10px] text-slate-700 pt-4 border-t border-slate-900">
        audited: {result.domain} @ {new Date(result.auditedAt).toLocaleString()}
      </div>
    </div>
  );
}
