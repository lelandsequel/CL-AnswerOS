"use client";

import { Card } from "./ui/card";
import { AuditResponse } from "@/lib/types";

function isPlainObject(val: any) {
  return val && typeof val === "object" && !Array.isArray(val);
}

export default function AuditResult({ data }: { data: AuditResponse }) {
  if (!data) return null;

  const structured: any = (data as any).structuredAudit;
  const keywordMetrics = Array.isArray(data.keywordMetrics)
    ? data.keywordMetrics
    : [];

  return (
    <div className="space-y-8 mt-6">
      {/* 1. RAW SCAN */}
      <Card>
        <h2 className="text-xl font-bold text-[#0A84FF] mb-3">1. RAW Scan</h2>
        <pre className="text-gray-300 whitespace-pre-wrap text-xs sm:text-sm">
          {data.rawScan}
        </pre>
      </Card>

      {/* 2. STRUCTURED AUDIT */}
      <Card>
        <h2 className="text-xl font-bold text-[#0A84FF] mb-3">
          2. Structured Audit
        </h2>

        {/* case 1: legacy array-of-sections */}
        {Array.isArray(structured) && (
          <div className="space-y-6">
            {structured.map((s: any, i: number) => (
              <div key={i} className="border-b border-white/10 pb-4">
                <div className="flex justify-between items-center gap-4">
                  <h3 className="text-sm sm:text-base font-semibold text-blue-300">
                    {s.title}
                  </h3>
                  {s.score !== undefined && (
                    <span className="text-gray-400 text-xs">
                      Score: {s.score}/100
                    </span>
                  )}
                </div>
                <p className="mt-2 text-gray-300 whitespace-pre-wrap text-xs sm:text-sm">
                  {s.content}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* case 2: JSON object like all the blobs you pasted */}
        {isPlainObject(structured) && (
          <div className="space-y-6 text-xs sm:text-sm text-gray-200">
            {/* Overview / Business Summary */}
            {structured.business_summary && (
              <section className="border-b border-white/10 pb-4">
                <h3 className="text-sm sm:text-base font-semibold text-blue-300 mb-1">
                  Overview
                </h3>
                {(() => {
                  const bs = structured.business_summary;
                  const name =
                    bs.company ||
                    bs.client ||
                    bs.business_name ||
                    "Client";
                  const state =
                    bs.current_digital_health ||
                    bs.current_state ||
                    bs.current_status ||
                    "Current digital state";
                  const potential =
                    bs.raw_potential_score ??
                    bs.potential_revenue_impact ??
                    null;

                  const insight =
                    bs.critical_insight ||
                    bs.critical_diagnosis ||
                    bs.key_takeaway ||
                    null;

                  return (
                    <>
                      <p className="text-gray-200">
                        <span className="font-semibold">{name}</span> –{" "}
                        {state}.
                      </p>
                      {potential && (
                        <p className="mt-1 text-gray-300">
                          Potential impact:{" "}
                          <span className="font-mono">{potential}</span>
                        </p>
                      )}
                      {insight && (
                        <p className="mt-1 text-gray-300 italic">{insight}</p>
                      )}
                    </>
                  );
                })()}
              </section>
            )}

            {/* Core Issues */}
            {Array.isArray(structured.core_issues) && (
              <section className="border-b border-white/10 pb-4">
                <h3 className="text-sm sm:text-base font-semibold text-blue-300 mb-2">
                  Core Issues
                </h3>
                <div className="space-y-3">
                  {structured.core_issues.map((issue: any, idx: number) => {
                    const points =
                      issue.problems || issue.symptoms || issue.details || [];
                    const extra =
                      issue.potential_revenue_impact ||
                      issue.business_translation ||
                      issue.potential_loss ||
                      issue.severity ||
                      null;

                    return (
                      <div key={idx}>
                        <div className="font-semibold text-gray-100">
                          {issue.category || "Issue"}
                        </div>
                        {Array.isArray(points) && points.length > 0 && (
                          <ul className="list-disc list-inside mt-1 space-y-1">
                            {points.map((p: string, i: number) => (
                              <li key={i}>{p}</li>
                            ))}
                          </ul>
                        )}
                        {extra && (
                          <div className="mt-1 text-gray-400">{extra}</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* AEO / Opportunities */}
            {Array.isArray(structured.aeo_opportunities) && (
              <section className="border-b border-white/10 pb-4">
                <h3 className="text-sm sm:text-base font-semibold text-blue-300 mb-2">
                  AEO / Growth Opportunities
                </h3>
                <div className="space-y-3">
                  {structured.aeo_opportunities.map(
                    (opp: any, idx: number) => {
                      const focus =
                        opp.focus ||
                        opp.stream ||
                        opp.optimization_zone ||
                        "Opportunity";
                      const lift =
                        opp.estimated_lift ||
                        opp.potential_gain ||
                        opp.estimated_impact ||
                        null;
                      const tactics = opp.tactics || opp.recommendations || [];

                      return (
                        <div key={idx}>
                          <div className="font-semibold text-gray-100">
                            {focus}
                          </div>
                          {Array.isArray(tactics) && (
                            <ul className="list-disc list-inside mt-1 space-y-1">
                              {tactics.map((t: string, i: number) => (
                                <li key={i}>{t}</li>
                              ))}
                            </ul>
                          )}
                          {lift && (
                            <div className="mt-1 text-gray-400">
                              Est. impact: {lift}
                            </div>
                          )}
                        </div>
                      );
                    }
                  )}
                </div>
              </section>
            )}

            {/* Content Playbook */}
            {structured.content_playbook && (
              <section className="border-b border-white/10 pb-4 space-y-2">
                <h3 className="text-sm sm:text-base font-semibold text-blue-300">
                  Content Playbook
                </h3>
                {(() => {
                  const cp = structured.content_playbook;
                  const positioning =
                    cp.positioning_statement ||
                    cp.positioning_strategy ||
                    cp.narrative_framework ||
                    null;
                  const tone =
                    cp.tone ||
                    cp.voice ||
                    "Authoritative, consultative, results-driven";

                  return (
                    <>
                      {positioning && (
                        <p className="text-gray-200">
                          <span className="font-semibold">Narrative: </span>
                          {positioning}
                        </p>
                      )}
                      {tone && (
                        <p className="text-gray-300">
                          <span className="font-semibold">Tone: </span>
                          {tone}
                        </p>
                      )}
                    </>
                  );
                })()}

                {/* persona (if present, from first schema) */}
                {structured.content_playbook.target_persona && (
                  <div className="text-gray-300">
                    <div className="font-semibold text-gray-100 mt-2">
                      Target Persona
                    </div>
                    <div>
                      {
                        structured.content_playbook.target_persona
                          .demographic
                      }
                    </div>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      {structured.content_playbook.target_persona.pain_points?.map(
                        (p: string, i: number) => (
                          <li key={i}>{p}</li>
                        )
                      )}
                    </ul>
                  </div>
                )}

                {/* messaging framework / pillars */}
                {(Array.isArray(structured.content_playbook.content_pillars) ||
                  Array.isArray(
                    structured.content_playbook.key_messaging_pillars
                  ) ||
                  Array.isArray(
                    structured.content_playbook.messaging_framework
                  )) && (
                  <div className="text-gray-300">
                    <div className="font-semibold text-gray-100 mt-2">
                      Pillars
                    </div>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      {(
                        structured.content_playbook.content_pillars ||
                        structured.content_playbook.key_messaging_pillars ||
                        structured.content_playbook.messaging_framework
                      ).map((p: string, i: number) => (
                        <li key={i}>{p}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </section>
            )}

            {/* Quick Wins */}
            {structured.quick_wins_48h && (
              <section className="border-b border-white/10 pb-4">
                <h3 className="text-sm sm:text-base font-semibold text-blue-300 mb-2">
                  Quick Wins (Next 48 Hours)
                </h3>

                {/* array of objects OR array of strings */}
                {Array.isArray(structured.quick_wins_48h) && (
                  <ul className="space-y-2">
                    {structured.quick_wins_48h.map((w: any, idx: number) => {
                      if (typeof w === "string") {
                        return (
                          <li key={idx} className="text-gray-200">
                            • {w}
                          </li>
                        );
                      }
                      return (
                        <li key={idx} className="text-gray-200">
                          <span className="font-semibold">
                            {w.action || "Quick win"}
                          </span>
                          {w.impact_score && (
                            <span className="text-gray-400">
                              {" "}
                              (Impact: {w.impact_score}/10
                              {w.effort_required &&
                                `, Effort: ${w.effort_required}`}
                              )
                            </span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>
            )}

            {/* 30 / 60 / 90 – can be object blocks OR arrays of strings */}
            {structured.roadmap_30_60_90 && (
              <section className="border-b border-white/10 pb-4">
                <h3 className="text-sm sm:text-base font-semibold text-blue-300 mb-2">
                  30 / 60 / 90 Day Roadmap
                </h3>
                <div className="grid sm:grid-cols-3 gap-4 text-xs sm:text-sm">
                  {["30_days", "60_days", "90_days"].map((key) => {
                    const block = structured.roadmap_30_60_90[key];
                    if (!block) return null;

                    const label =
                      key === "30_days"
                        ? "0–30 Days"
                        : key === "60_days"
                        ? "30–60 Days"
                        : "60–90 Days";

                    // version 1: object with focus + key_initiatives/deliverables
                    if (isPlainObject(block)) {
                      const list =
                        block.key_initiatives || block.deliverables || [];
                      return (
                        <div
                          key={key}
                          className="bg-black/40 rounded-xl p-3"
                        >
                          <div className="text-[#0A84FF] font-semibold mb-1">
                            {label}
                          </div>
                          <div className="text-gray-200 mb-1">
                            {block.focus}
                          </div>
                          {Array.isArray(list) && (
                            <ul className="list-disc list-inside text-gray-300 space-y-1">
                              {list.map((k: string, i: number) => (
                                <li key={i}>{k}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                      );
                    }

                    // version 2: array of strings like your latest blob
                    if (Array.isArray(block)) {
                      return (
                        <div
                          key={key}
                          className="bg-black/40 rounded-xl p-3"
                        >
                          <div className="text-[#0A84FF] font-semibold mb-1">
                            {label}
                          </div>
                          <ul className="list-disc list-inside text-gray-300 space-y-1">
                            {block.map((k: string, i: number) => (
                              <li key={i}>{k}</li>
                            ))}
                          </ul>
                        </div>
                      );
                    }

                    return null;
                  })}
                </div>
              </section>
            )}

            {/* Final Assessment / Investment Perspective */}
            {(structured.final_assessment ||
              structured.investment_perspective) && (
              <section>
                <h3 className="text-sm sm:text-base font-semibold text-blue-300 mb-1">
                  Final Assessment
                </h3>
                {(() => {
                  const fa =
                    structured.final_assessment ||
                    structured.investment_perspective;
                  const potential =
                    fa.potential_unlocked || fa.estimated_roi || null;
                  const budget =
                    fa.recommended_investment_range ||
                    fa.recommended_monthly_budget ||
                    fa.recommended_budget ||
                    null;
                  const roi = fa.projected_roi || fa.estimated_roi || null;
                  const breakeven = fa.breakeven_timeline || null;

                  return (
                    <>
                      {potential && (
                        <p className="text-gray-200">
                          Potential:{" "}
                          <span className="font-semibold">
                            {potential}
                          </span>
                          .
                        </p>
                      )}
                      {budget && (
                        <p className="text-gray-200">
                          Recommended investment:{" "}
                          <span className="font-semibold">{budget}</span>.
                        </p>
                      )}
                      {roi && (
                        <p className="text-gray-200">
                          Projected ROI:{" "}
                          <span className="font-semibold">{roi}</span>.
                        </p>
                      )}
                      {breakeven && (
                        <p className="text-gray-200">
                          Breakeven timeline:{" "}
                          <span className="font-semibold">{breakeven}</span>.
                        </p>
                      )}
                    </>
                  );
                })()}
              </section>
            )}
          </div>
        )}
      </Card>

      {/* 3. KEYWORD METRICS */}
      {keywordMetrics.length > 0 && (
        <Card>
          <h2 className="text-xl font-bold text-[#0A84FF] mb-3">
            3. Keyword Metrics (DataForSEO)
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full text-gray-300 text-xs sm:text-sm">
              <thead className="border-b border-white/10 text-gray-500 uppercase text-[10px]">
                <tr>
                  <th className="py-2 text-left pr-4">Keyword</th>
                  <th className="py-2 text-left pr-4">Volume</th>
                  <th className="py-2 text-left pr-4">CPC</th>
                  <th className="py-2 text-left">Competition</th>
                </tr>
              </thead>
              <tbody>
                {keywordMetrics.map((k, i) => (
                  <tr key={i} className="border-b border-white/5">
                    <td className="py-2 pr-4">{k.keyword}</td>
                    <td className="py-2 pr-4">{k.searchVolume}</td>
                    <td className="py-2 pr-4">${k.cpc}</td>
                    <td className="py-2">{k.competition}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

