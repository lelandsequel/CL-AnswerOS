// app/content/page.tsx

"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import Spinner from "@/components/Spinner";
import {
  BaseContentRequest,
  ContentGenerationResponse,
  ContentGenerationResult,
  ContentMode,
  Client,
} from "@/lib/types";
import { ContentResultPanel } from "@/components/ContentResultPanel";

const MODES: { id: ContentMode; label: string; command: string; description: string }[] = [
  {
    id: "press_release",
    label: "Press Release",
    command: "--press",
    description: "Launches, funding, partnerships, milestones.",
  },
  {
    id: "article",
    label: "SEO Article",
    command: "--article",
    description: "Long-form, keyword-driven operator content.",
  },
  {
    id: "landing",
    label: "Landing Page",
    command: "--landing",
    description: "Hero, value props, CTAs, and sections.",
  },
  {
    id: "social",
    label: "Social Pack",
    command: "--social",
    description: "LinkedIn, X thread, email, and bullets.",
  },
];

export default function ContentSuitePage() {
  const [mode, setMode] = useState<ContentMode>("press_release");
  const [company, setCompany] = useState("Infinity Digital Consulting");
  const [audience, setAudience] = useState(
    "growth-minded founders, CMOs, and operators"
  );
  const [brandVoice, setBrandVoice] = useState(
    "authoritative, sharp, non-cringey, operator-brained"
  );
  const [primaryKeyword, setPrimaryKeyword] = useState(
    "SEO and Answer Engine Optimization audit"
  );
  const [url, setUrl] = useState("https://infinitydigitalconsulting.com");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ContentGenerationResult | null>(null);

  // Clients
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>("");

  useEffect(() => {
    fetch("/api/clients")
      .then((res) => res.json())
      .then((data) => setClients(data.clients || []))
      .catch((err) => console.error("Failed to load clients", err));
  }, []);

  async function generate() {
    try {
      setLoading(true);
      setError("");
      setResult(null);

      const payload: BaseContentRequest = {
        mode,
        company,
        audience,
        brandVoice,
        primaryKeyword,
        url,
        notes,
      };

      const res = await fetch("/api/content/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const text = await res.text();
      if (!res.ok) {
        throw new Error(text || "Generation failed");
      }

      let data: ContentGenerationResponse;
      try {
        data = JSON.parse(text);
      } catch (e) {
        console.error("Parse error:", e, text);
        throw new Error("Could not parse content response");
      }

      setResult(data.result);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const modeMeta = MODES.find((m) => m.id === mode);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-12 font-mono">
      {/* Header */}
      <div className="mb-8">
        <div className="text-xs text-slate-600 mb-2">// content.init()</div>
        <h1 className="text-3xl font-bold text-white mb-2">Content Suite</h1>
        <p className="text-slate-500 text-sm">
          Press releases, SEO articles, landing pages, and social packs - all wired to the same brain.
        </p>
        <div className="mt-2 h-px w-24 bg-gradient-to-r from-pink-500 to-transparent" />
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_1fr]">
        {/* Left: Form */}
        <div className="space-y-4">
          <Card title="config">
            {/* Client Selector */}
            <div className="mb-4">
              <label className="block text-xs text-slate-500 mb-1.5">client_id</label>
              <select
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                className="w-full px-4 py-2.5 font-mono text-sm bg-slate-950 border border-slate-800 text-slate-200 focus:border-violet-500/50 focus:outline-none"
              >
                <option value="">null</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Mode selector */}
            <div className="mb-4">
              <div className="text-xs text-slate-600 mb-2">// mode.select()</div>
              <div className="flex flex-wrap gap-2">
                {MODES.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setMode(m.id)}
                    className={`px-3 py-2 text-xs border transition-all ${
                      mode === m.id
                        ? "border-violet-500 bg-violet-500/20 text-violet-300"
                        : "border-slate-800 bg-slate-900/50 text-slate-400 hover:border-slate-700 hover:text-slate-300"
                    }`}
                  >
                    {m.command}
                  </button>
                ))}
              </div>
              {modeMeta && (
                <div className="text-xs text-slate-600 mt-2">
                  // {modeMeta.description}
                </div>
              )}
            </div>

            <div className="space-y-4">
              <Input
                label="company"
                value={company}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCompany(e.target.value)}
              />

              <Input
                label="audience"
                value={audience}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAudience(e.target.value)}
                placeholder="Who this is for - as specifically as possible"
              />

              <Input
                label="brand_voice"
                value={brandVoice}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBrandVoice(e.target.value)}
                placeholder="e.g. sharp, no-BS, operator-level, a bit playful..."
              />

              <Input
                label="primary_keyword"
                value={primaryKeyword}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPrimaryKeyword(e.target.value)}
                placeholder="e.g. SEO audit for B2B SaaS, digital growth OS, etc."
              />

              <Input
                label="url"
                value={url}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUrl(e.target.value)}
                placeholder="Page or product URL to align around"
              />

              <Textarea
                label="notes"
                rows={5}
                value={notes}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNotes(e.target.value)}
                placeholder={
                  mode === "press_release"
                    ? "// announcement details, numbers (ARR, growth), dates, names..."
                    : mode === "article"
                    ? "// outline ideas, subtopics, POV, examples, case studies..."
                    : mode === "landing"
                    ? "// offer details, price/plan info, risk reversal, differentiators..."
                    : "// key beats for social, what you want people to think/feel/do..."
                }
              />

              <Button
                className="w-full"
                disabled={loading || !company.trim() || !primaryKeyword.trim()}
                onClick={generate}
                prefix="$"
              >
                {loading ? "generating..." : `generate ${modeMeta?.command ?? "--content"}`}
              </Button>

              {error && (
                <div className="text-xs text-red-400 border border-red-500/30 bg-red-500/5 p-3">
                  <span className="text-red-500">x</span> {error}
                </div>
              )}

              <div className="text-xs text-slate-600">
                // paste audited insights or keyword outputs into notes to steer output
              </div>
            </div>
          </Card>
        </div>

        {/* Right: Result */}
        <div className="space-y-4">
          {!result && !loading && (
            <div className="border border-dashed border-slate-800 p-8 text-center">
              <div className="text-slate-600 text-sm">
                <span className="text-slate-700">-&gt;</span> select mode and run generate {modeMeta?.command ?? "--content"}
              </div>
              <div className="text-xs text-slate-700 mt-2">
                outputs: {modeMeta?.label.toLowerCase() ?? "content"} ready for deployment
              </div>
            </div>
          )}

          {loading && (
            <Card variant="terminal" title="~/content">
              <div className="text-slate-500 text-sm">
                <span className="text-emerald-500">-&gt;</span> generating {modeMeta?.label.toLowerCase() ?? "content"}<span className="animate-pulse">...</span>
              </div>
              <Spinner />
            </Card>
          )}

          {result && (
            <div>
              <div className="text-xs text-slate-600 mb-4">// content.output</div>
              <ContentResultPanel result={result} clientId={selectedClientId || null} />
            </div>
          )}
        </div>
      </div>

      <div className="mt-16 text-xs text-slate-800">// end of file</div>
    </main>
  );
}
