// app/leads/page.tsx

"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Spinner from "@/components/Spinner";
import { LeadTable } from "@/components/LeadTable";
import { Lead, LeadSearchResponse } from "@/lib/types";

export default function LeadsPage() {
  const [industry, setIndustry] = useState("digital marketing agency");
  const [location, setLocation] = useState("Houston, TX");
  const [countryCode, setCountryCode] = useState("US");
  const [limit, setLimit] = useState(25);
  const [minScore, setMinScore] = useState(60);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [leads, setLeads] = useState<any[]>([]);
  const [enriching, setEnriching] = useState(false);
  const [enrichError, setEnrichError] = useState<string | null>(null);
  const [rawCount, setRawCount] = useState<number | null>(null);
  const [dfsFilteredCount, setDfsFilteredCount] = useState<number | null>(null);
  const [aiScoredCount, setAiScoredCount] = useState<number | null>(null);

  async function runLeadGen() {
    try {
      setLoading(true);
      setError("");
      setLeads([]);

      const res = await fetch("/api/lead-generator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keyword: industry,
          location,
          country: countryCode,
          limit,
          minScore,
        }),
      });

      const text = await res.text();
      if (!res.ok) {
        throw new Error(text || "Lead generation failed");
      }

      let data: any;
      try {
        data = JSON.parse(text);
      } catch (e) {
        throw new Error("Could not parse lead generator response");
      }

      if (data.error) {
        setError(data.error);
        return;
      }

      setLeads(data.results || []);
      setRawCount(data.raw_count ?? null);
      setDfsFilteredCount(data.filtered_count ?? null);
      setAiScoredCount(null);

      if (data.results?.length === 0 && data.message) {
        setError(data.message);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function enrichWithAI() {
    if (!leads.length) return;

    setEnriching(true);
    setEnrichError(null);

    try {
      const res = await fetch('/api/lead-enrich', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leads,
          keyword: industry,
          location,
        }),
      });

      const json = await res.json();

      if (!res.ok || json.error) {
        throw new Error(json.error || 'Failed to enrich leads');
      }

      const enriched = Array.isArray(json.results) ? json.results : leads;
      setLeads(enriched);

      const scoredCount = enriched.filter((lead: any) =>
        typeof lead.seo_score === 'number' || typeof lead.opportunity_score === 'number'
      ).length;
      setAiScoredCount(scoredCount);
    } catch (err: any) {
      console.error('Enrich error:', err);
      setEnrichError(err.message || 'Failed to enrich leads.');
    } finally {
      setEnriching(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-12 font-mono">
      {/* Header */}
      <div className="mb-8">
        <div className="text-xs text-slate-600 mb-2">// leads.init()</div>
        <h1 className="text-3xl font-bold text-white mb-2">Lead Generator</h1>
        <p className="text-slate-500 text-sm">
          DataForSEO Business Listings + Claude scoring. Type a niche and a city/ZIP, get a hit list.
        </p>
        <div className="mt-2 h-px w-24 bg-gradient-to-r from-emerald-500 to-transparent" />
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_1fr]">
        {/* Left: Form */}
        <Card title="config">
          <div className="space-y-4">
            <Input
              label="industry"
              value={industry}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setIndustry(e.target.value)}
              placeholder="plastic surgeons, HVAC companies, SaaS startups..."
            />

            <Input
              label="location"
              value={location}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLocation(e.target.value)}
              placeholder="Houston, TX or 77007"
            />

            <div>
              <label className="block text-xs text-slate-500 mb-1.5">country</label>
              <select
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                className="w-full px-4 py-2.5 font-mono text-sm bg-slate-950 border border-slate-800 text-slate-200 focus:border-violet-500/50 focus:outline-none"
              >
                <option value="US">United States</option>
                <option value="GB">United Kingdom</option>
                <option value="CA">Canada</option>
                <option value="AU">Australia</option>
                <option value="DE">Germany</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="limit"
                type="number"
                min={1}
                max={100}
                value={limit}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLimit(Number(e.target.value || 0))}
              />
              <Input
                label="min_score"
                type="number"
                min={0}
                max={100}
                value={minScore}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMinScore(Number(e.target.value || 0))}
              />
            </div>

            <Button
              className="w-full"
              disabled={loading || !industry.trim() || !location.trim()}
              onClick={runLeadGen}
              prefix="$"
            >
              {loading ? "finding..." : "run --leads"}
            </Button>

            {error && (
              <div className="text-xs text-red-400 border border-red-500/30 bg-red-500/5 p-3">
                <span className="text-red-500">x</span> {error}
              </div>
            )}
          </div>
        </Card>

        {/* Right: Status */}
        <div className="space-y-4">
          {!leads.length && !loading && (
            <div className="border border-dashed border-slate-800 p-8 text-center">
              <div className="text-slate-600 text-sm">
                <span className="text-slate-700">-&gt;</span> enter industry + location and run --leads
              </div>
              <div className="text-xs text-slate-700 mt-2">
                outputs: businesses leaking money, opportunity scores
              </div>
            </div>
          )}

          {loading && (
            <Card variant="terminal" title="~/leads">
              <div className="text-slate-500 text-sm">
                <span className="text-emerald-500">-&gt;</span> searching leads<span className="animate-pulse">...</span>
              </div>
              <Spinner />
            </Card>
          )}

          {leads.length > 0 && !loading && (
            <Card variant="terminal" title="~/leads/stats">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-slate-400">
                  <span>raw_count:</span>
                  <span className="text-amber-400">{rawCount ?? '-'}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>filtered_count:</span>
                  <span className="text-amber-400">{dfsFilteredCount ?? '-'}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>ai_scored:</span>
                  <span className="text-amber-400">{aiScoredCount ?? '-'}</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-800">
                <Button
                  variant="secondary"
                  onClick={enrichWithAI}
                  disabled={enriching || !leads.length}
                  prefix="$"
                  className="w-full"
                >
                  {enriching ? "enriching..." : "enrich --ai"}
                </Button>
              </div>

              {enrichError && (
                <div className="mt-3 text-xs text-red-400 border border-red-500/30 bg-red-500/5 p-3">
                  <span className="text-red-500">x</span> {enrichError}
                </div>
              )}
            </Card>
          )}
        </div>
      </div>

      {/* Results Table */}
      {leads.length > 0 && (
        <div className="mt-8">
          <div className="text-xs text-slate-600 mb-4">// leads.results[{leads.length}]</div>
          <LeadTable leads={leads} />
        </div>
      )}

      <div className="mt-16 text-xs text-slate-800">// end of file</div>
    </main>
  );
}
