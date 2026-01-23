// app/keywords/page.tsx

"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import Spinner from "@/components/Spinner";
import { KeywordIdea, KeywordResponse } from "@/lib/types";
import { KeywordTable } from "@/components/KeywordTable";

export default function KeywordsPage() {
  const [seedKeyword, setSeedKeyword] = useState(
    "seo audit for b2b saas"
  );
  const [url, setUrl] = useState("");
  const [location, setLocation] = useState("United States");
  const [language, setLanguage] = useState("English");
  const [limit, setLimit] = useState(40);
  const [notes, setNotes] = useState("");
  const [ideas, setIdeas] = useState<KeywordIdea[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function runKeywords() {
    try {
      setLoading(true);
      setError("");
      setIdeas([]);

      const res = await fetch("/api/keywords", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          seedKeyword: seedKeyword || undefined,
          url: url || undefined,
          location,
          language,
          limit,
        }),
      });

      const text = await res.text();
      if (!res.ok) {
        throw new Error(text || "Keyword generation failed");
      }

      let data: KeywordResponse;
      try {
        data = JSON.parse(text);
      } catch (e) {
        console.error("Keyword parse error:", e, text);
        throw new Error("Could not parse keyword response");
      }

      setIdeas(data.ideas || []);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-12 font-mono">
      {/* Header */}
      <div className="mb-8">
        <div className="text-xs text-slate-600 mb-2">// keywords.init()</div>
        <h1 className="text-3xl font-bold text-white mb-2">Keyword Suite</h1>
        <p className="text-slate-500 text-sm">
          DataForSEO keyword ideas + LLM clustering and prioritization for operator-grade SEO and AEO strategy.
        </p>
        <div className="mt-2 h-px w-24 bg-gradient-to-r from-amber-500 to-transparent" />
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_1fr]">
        {/* Left: Form */}
        <Card title="config">
          <div className="space-y-4">
            <Input
              label="seed_keyword"
              value={seedKeyword}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSeedKeyword(e.target.value)}
              placeholder="e.g. seo audit for dentists"
            />
            <div className="text-xs text-slate-600">
              // you can also use just a URL below for site-based ideas
            </div>

            <Input
              label="url"
              value={url}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUrl(e.target.value)}
              placeholder="https://example.com"
            />

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="location"
                value={location}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLocation(e.target.value)}
                placeholder="United States, Texas, etc."
              />
              <Input
                label="language"
                value={language}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLanguage(e.target.value)}
                placeholder="English, Spanish, etc."
              />
            </div>

            <Input
              label="limit"
              type="number"
              min={5}
              max={100}
              value={limit}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setLimit(Number(e.target.value || 0))
              }
            />

            <Textarea
              label="notes"
              rows={4}
              value={notes}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNotes(e.target.value)}
              placeholder="// strategy intent, markets, personas for LLM clustering"
            />

            <Button
              className="w-full"
              disabled={loading || (!seedKeyword.trim() && !url.trim())}
              onClick={runKeywords}
              prefix="$"
            >
              {loading ? "finding..." : "run --keywords"}
            </Button>

            {error && (
              <div className="text-xs text-red-400 border border-red-500/30 bg-red-500/5 p-3">
                <span className="text-red-500">x</span> {error}
              </div>
            )}

            <div className="text-xs text-slate-600">
              // export CSV for spreadsheets, "Copy as Plan" for Notion/slides
            </div>
          </div>
        </Card>

        {/* Right: Status */}
        <div className="space-y-4">
          {!ideas.length && !loading && (
            <div className="border border-dashed border-slate-800 p-8 text-center">
              <div className="text-slate-600 text-sm">
                <span className="text-slate-700">-&gt;</span> enter seed keyword and run --keywords
              </div>
              <div className="text-xs text-slate-700 mt-2">
                outputs: keyword clusters, volume, difficulty, priority
              </div>
            </div>
          )}

          {loading && (
            <Card variant="terminal" title="~/keywords">
              <div className="text-slate-500 text-sm">
                <span className="text-emerald-500">-&gt;</span> fetching keywords<span className="animate-pulse">...</span>
              </div>
              <Spinner />
            </Card>
          )}

          {ideas.length > 0 && !loading && (
            <Card variant="terminal" title="~/keywords/result">
              <div className="text-xs text-slate-600 mb-2">
                // found {ideas.length} keyword ideas
              </div>
              <div className="text-sm text-slate-300">
                <span className="text-emerald-500">-&gt;</span> keywords loaded. scroll down for full table.
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Results Table */}
      {ideas.length > 0 && (
        <div className="mt-8">
          <div className="text-xs text-slate-600 mb-4">// keywords.results[{ideas.length}]</div>
          <KeywordTable ideas={ideas} />
        </div>
      )}

      <div className="mt-16 text-xs text-slate-800">// end of file</div>
    </main>
  );
}
