"use client";

import React, { useState } from "react";

type KeywordMetrics = {
  keyword: string;
  search_volume?: number;
  competition?: number;
  cpc?: number;
  keyword_difficulty?: number;
  trend?: "up" | "down" | "stable";
};

type KeywordSuiteResult = {
  primary_keywords: string[];
  secondary_keywords: string[];
  clusters: {
    cluster_name: string;
    intent: "informational" | "commercial" | "transactional" | "navigational";
    keywords: string[];
  }[];
  content_ideas: {
    title: string;
    type: "blog" | "landing" | "faq" | "press_release" | "support_doc";
    angle: string;
    target_cluster: string;
  }[];
  faqs: {
    question: string;
    intent: "informational" | "transactional" | "trust" | "objection";
  }[];
};

interface KeywordSuiteProps {
  initialAuditText?: string;
  keywords?: { primary: string[]; supporting: string[] };
  dataForSeo?: { keyword_overview_items: any[] };
}

export default function KeywordSuite({
  initialAuditText,
  keywords: initialKeywords,
  dataForSeo: initialDataForSeo
}: KeywordSuiteProps) {
  const [auditText, setAuditText] = useState(initialAuditText ?? "");
  const [result, setResult] = useState<KeywordSuiteResult | null>(null);
  const [metrics, setMetrics] = useState<Map<string, KeywordMetrics>>(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize metrics from DataForSEO if provided
  React.useEffect(() => {
    if (initialDataForSeo?.keyword_overview_items) {
      const metricsMap = new Map<string, KeywordMetrics>();
      initialDataForSeo.keyword_overview_items.forEach((item: any) => {
        metricsMap.set(item.keyword, {
          keyword: item.keyword,
          search_volume: item.keyword_info?.search_volume,
          competition: item.keyword_info?.competition,
          cpc: item.keyword_info?.cpc,
          keyword_difficulty: item.keyword_properties?.keyword_difficulty,
        });
      });
      setMetrics(metricsMap);
    }
  }, [initialDataForSeo]);

  const canRun = auditText.trim().length > 40 && !loading;

  const runKeywordSuite = async () => {
    if (!canRun) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setMetrics(new Map());
    try {
      const res = await fetch("/api/keyword-suite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ auditText }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || `Keyword suite failed: ${res.status}`);
      }

      const data = (await res.json()) as KeywordSuiteResult;
      setResult(data);

      // Fetch metrics for all keywords
      await fetchKeywordMetrics(data);
    } catch (err: any) {
      console.error("Keyword suite error:", err);
      setError(err?.message || "Something went wrong running keyword suite.");
    } finally {
      setLoading(false);
    }
  };

  const fetchKeywordMetrics = async (data: KeywordSuiteResult) => {
    try {
      const allKeywords = [
        ...data.primary_keywords,
        ...data.secondary_keywords,
        ...data.clusters.flatMap((c) => c.keywords),
      ];

      const uniqueKeywords = Array.from(new Set(allKeywords));

      const metricsRes = await fetch("/api/keyword-metrics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keywords: uniqueKeywords }),
      });

      if (metricsRes.ok) {
        const metricsData = await metricsRes.json();
        const metricsMap = new Map<string, KeywordMetrics>();
        metricsData.metrics?.forEach((m: KeywordMetrics) => {
          metricsMap.set(m.keyword, m);
        });
        setMetrics(metricsMap);
      }
    } catch (err) {
      console.error("Failed to fetch keyword metrics:", err);
      // Don't fail the whole thing if metrics fail
    }
  };

  return (
    <section className="bg-slate-900/70 border border-slate-700 rounded-2xl p-4 md:p-6 space-y-4">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-blue-100">
            BLUE MODE · Keyword & Content Suite
          </h2>
          <p className="text-xs md:text-sm text-slate-300/80 max-w-xl">
            Paste your <span className="font-semibold">audit or scan output</span> and turn it into{" "}
            <span className="font-semibold text-blue-200">
              keywords, clusters, content ideas, and FAQs
            </span>{" "}
            you can actually sell.
          </p>
        </div>
        <button
          onClick={runKeywordSuite}
          disabled={!canRun}
          className={`inline-flex items-center justify-center rounded-lg px-4 py-2 text-xs md:text-sm font-semibold transition
            ${
              canRun
                ? "bg-blue-500 hover:bg-blue-400 text-white shadow-sm shadow-blue-500/40"
                : "bg-slate-700 text-slate-400 cursor-not-allowed"
            }`}
        >
          {loading ? "Cooking BLUE…" : "Run Keyword Suite"}
        </button>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="block text-xs font-medium text-slate-200">
            Audit / Scan Text
          </label>
          <textarea
            value={auditText}
            onChange={(e) => setAuditText(e.target.value)}
            placeholder="Paste your audit output, raw scan, or a summary of issues here…"
            className="w-full h-44 md:h-56 rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2 text-xs md:text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500/70 focus:border-blue-500/70 resize-none"
          />
          <p className="text-[0.65rem] text-slate-400">
            Tip: drop in the <span className="font-semibold">Raw Scan</span> or <span className="font-semibold">Audit Summary</span>. The richer the input, the better BLUE cooks.
          </p>
        </div>

        <div className="space-y-3">
          {error && (
            <div className="text-xs text-red-300 bg-red-950/40 border border-red-700/70 rounded-lg p-2">
              {error}
            </div>
          )}
          {!result && !error && (
            <div className="text-xs text-slate-300/80 bg-slate-950/40 border border-dashed border-slate-700 rounded-lg p-3">
              Hit <span className="font-semibold text-blue-200">Run</span> to generate:
              <ul className="mt-1 list-disc list-inside space-y-0.5">
                <li>Primary & secondary money keywords</li>
                <li>SEO/AEO-friendly clusters by intent</li>
                <li>Concrete content ideas you can pitch</li>
                <li>FAQ questions to close objections</li>
              </ul>
            </div>
          )}
          {result && (
            <div className="space-y-3 text-xs md:text-[0.8rem] max-h-96 overflow-y-auto">
              <div className="bg-slate-950/60 border border-slate-700 rounded-lg p-2.5 space-y-1.5">
                <h3 className="font-semibold text-blue-100 text-xs">Primary Keywords</h3>
                <div className="space-y-1">
                  {result.primary_keywords.map((kw, idx) => {
                    const m = metrics.get(kw);
                    return (
                      <div key={idx} className="flex items-center justify-between text-[0.7rem] bg-slate-900/40 px-2 py-1 rounded">
                        <span className="text-slate-200 font-medium">{kw}</span>
                        {m && (
                          <div className="flex gap-2 text-slate-400">
                            {m.search_volume && <span>📊 {m.search_volume.toLocaleString()}</span>}
                            {m.cpc && <span>💰 ${m.cpc.toFixed(2)}</span>}
                            {m.keyword_difficulty && <span>🎯 {m.keyword_difficulty}%</span>}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-slate-950/60 border border-slate-700 rounded-lg p-2.5 space-y-1.5">
                <h3 className="font-semibold text-blue-100 text-xs">Secondary Keywords</h3>
                <p className="text-slate-300">{result.secondary_keywords.join(" · ")}</p>
              </div>

              <div className="bg-slate-950/60 border border-slate-700 rounded-lg p-2.5 space-y-1.5">
                <h3 className="font-semibold text-blue-100 text-xs">Clusters by Intent</h3>
                <div className="space-y-1.5">
                  {result.clusters.map((cluster, idx) => (
                    <div key={idx} className="border-l-2 border-blue-500/70 pl-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-slate-100">{cluster.cluster_name}</span>
                        <span className="text-[0.65rem] uppercase tracking-wide text-blue-300">{cluster.intent}</span>
                      </div>
                      <p className="text-slate-300 text-[0.7rem]">{cluster.keywords.join(" · ")}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-slate-950/60 border border-slate-700 rounded-lg p-2.5 space-y-1.5">
                <h3 className="font-semibold text-blue-100 text-xs">Content Ideas (Sell These)</h3>
                <div className="space-y-1.5">
                  {result.content_ideas.map((idea, idx) => (
                    <div key={idx} className="border-l-2 border-emerald-500/70 pl-2">
                      <div className="flex flex-wrap items-center gap-1 justify-between">
                        <span className="font-semibold text-slate-100">{idea.title}</span>
                        <span className="text-[0.6rem] uppercase tracking-wide text-emerald-300">{idea.type} · {idea.target_cluster}</span>
                      </div>
                      <p className="text-slate-300 text-[0.7rem]">{idea.angle}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-slate-950/60 border border-slate-700 rounded-lg p-2.5 space-y-1.5">
                <h3 className="font-semibold text-blue-100 text-xs">FAQ / Objection Handling</h3>
                <div className="space-y-1.5">
                  {result.faqs.map((faq, idx) => (
                    <div key={idx} className="border-l-2 border-violet-500/70 pl-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-100 text-[0.75rem]">{faq.question}</span>
                        <span className="text-[0.6rem] uppercase tracking-wide text-violet-300">{faq.intent}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

