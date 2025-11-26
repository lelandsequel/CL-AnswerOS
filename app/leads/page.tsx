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
      setAiScoredCount(null); // Reset AI scored count on new search
      
      // Show message if no results matched the location filter
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
      
      // Count how many leads have numeric seo_score OR opportunity_score
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
    <div className="space-y-8">
      <Card>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#0A84FF] mb-1">
          Lead Generator
        </h1>
        <p className="text-xs sm:text-sm text-gray-400 mb-4">
          DataForSEO Business Listings + Claude scoring. Type a niche
          and a city/ZIP, get a hit list of businesses leaking money.
        </p>

        <div className="grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)]">
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-400 block mb-1">
                Industry / Niche
              </label>
              <Input
                value={industry}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setIndustry(e.target.value)}
                placeholder="plastic surgeons, HVAC companies, SaaS startups…"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">
                Location (City, Region, or ZIP)
              </label>
              <Input
                value={location}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLocation(e.target.value)}
                placeholder="Houston, TX or 77007"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">
                Country
              </label>
              <select
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-sm text-gray-200"
              >
                <option value="US">United States</option>
                <option value="GB">United Kingdom</option>
                <option value="CA">Canada</option>
                <option value="AU">Australia</option>
                <option value="DE">Germany</option>
              </select>
            </div>
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-400 block mb-1">
                  Max Leads
                </label>
                <Input
                  type="number"
                  min={1}
                  max={100}
                  value={limit}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLimit(Number(e.target.value || 0))}
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">
                  Min Opportunity Score
                </label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={minScore}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMinScore(Number(e.target.value || 0))}
                />
              </div>
            </div>

            <Button
              className="w-full"
              disabled={loading || !industry.trim() || !location.trim()}
              onClick={runLeadGen}
            >
              {loading ? "Finding Leads…" : "Run Lead Generator"}
            </Button>

            {error && (
              <div className="text-xs text-red-300 bg-red-900/30 border border-red-800 rounded-xl px-3 py-2 whitespace-pre-wrap">
                {error}
              </div>
            )}
          </div>
        </div>
      </Card>

      {loading && <Spinner />}

      {leads.length > 0 && (
        <div className="space-y-4">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-50">Lead List</h2>
              <p className="text-xs text-slate-400">
                Sorted by DataForSEO rating; enrich with AI to see SEO & opportunity scores.
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                Debug · DFS: {rawCount ?? '—'} raw / {dfsFilteredCount ?? '—'} filtered ·
                AI scored: {aiScoredCount ?? '—'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={enrichWithAI}
                disabled={enriching || !leads.length}
                className="inline-flex items-center rounded-full border border-emerald-500/60 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-200 hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {enriching ? "Enriching…" : "Enrich with AI"}
              </button>
            </div>
          </div>

          {enrichError && (
            <p className="mb-2 rounded-2xl border border-red-800/70 bg-red-950/70 px-3 py-2 text-xs text-red-100">
              {enrichError}
            </p>
          )}

          <LeadTable leads={leads} />
        </div>
      )}
    </div>
  );
}

