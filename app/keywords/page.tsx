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
    <div className="space-y-8">
      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#0A84FF]">
              Keyword Suite
            </h1>
            <p className="text-xs sm:text-sm text-gray-400">
              DataForSEO keyword ideas + LLM clustering and prioritization
              for operator-grade SEO and AEO strategy.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-[minmax(0,2.2fr)_minmax(0,1.4fr)]">
          {/* Left column */}
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-400 block mb-1">
                Seed Keyword
              </label>
              <Input
                value={seedKeyword}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSeedKeyword(e.target.value)}
                placeholder="e.g. seo audit for dentists"
              />
              <p className="text-[10px] text-gray-500 mt-1">
                You can also use just a URL (below) and leave this blank for
                site-based ideas.
              </p>
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">
                URL (optional)
              </label>
              <Input
                value={url}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUrl(e.target.value)}
                placeholder="https://example.com"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-400 block mb-1">
                  Location
                </label>
                <Input
                  value={location}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLocation(e.target.value)}
                  placeholder="United States, Texas, etc."
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">
                  Language
                </label>
                <Input
                  value={language}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLanguage(e.target.value)}
                  placeholder="English, Spanish, etc."
                />
              </div>
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-400 block mb-1">
                Limit (max keywords)
              </label>
              <Input
                type="number"
                min={5}
                max={100}
                value={limit}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setLimit(Number(e.target.value || 0))
                }
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">
                Notes / Strategy Intent (optional)
              </label>
              <Textarea
                rows={4}
                value={notes}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNotes(e.target.value)}
                placeholder="What kind of content or offer is this for? What markets or personas? You can use this later to hand-tune LLM clustering."
              />
            </div>

            <Button
              className="w-full"
              disabled={
                loading || (!seedKeyword.trim() && !url.trim())
              }
              onClick={runKeywords}
            >
              {loading ? "Finding Keywords…" : "Run Keyword Suite"}
            </Button>

            {error && (
              <div className="text-xs text-red-300 bg-red-900/30 border border-red-800 rounded-xl px-3 py-2 whitespace-pre-wrap">
                {error}
              </div>
            )}

            <p className="text-[10px] text-gray-500">
              Use the CSV export for spreadsheets and the &quot;Copy as Plan&quot; button
              to drop clusters directly into Notion, slides, or audit docs.
            </p>
          </div>
        </div>
      </Card>

      {loading && <Spinner />}
      {ideas.length > 0 && <KeywordTable ideas={ideas} />}
    </div>
  );
}

