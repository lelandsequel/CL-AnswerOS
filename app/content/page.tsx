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

const MODES: { id: ContentMode; label: string; description: string }[] = [
  {
    id: "press_release",
    label: "Press Release",
    description: "Launches, funding, partnerships, milestones.",
  },
  {
    id: "article",
    label: "SEO Article",
    description: "Long-form, keyword-driven operator content.",
  },
  {
    id: "landing",
    label: "Landing Page",
    description: "Hero, value props, CTAs, and sections.",
  },
  {
    id: "social",
    label: "Social Pack",
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
  const [result, setResult] = useState<ContentGenerationResult | null>(
    null
  );

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
    <div className="space-y-8">
      <Card>
        <div className="flex flex-col gap-2 mb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#0A84FF]">
              Content Suite
            </h1>
            <p className="text-xs sm:text-sm text-gray-400">
              Press releases, SEO articles, landing pages, and social packs
              — all wired to the same brain.
            </p>
          </div>
        </div>

        {/* Client Selector */}
        <div className="mb-6">
          <label className="text-xs text-gray-400 block mb-1">
            Attach to Client (optional)
          </label>
          <select
            value={selectedClientId}
            onChange={(e) => setSelectedClientId(e.target.value)}
            className="w-full sm:w-64 px-2 py-2 text-xs rounded-xl bg-black/40 border border-white/10 text-gray-100"
          >
            <option value="">Unassigned</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Mode selector */}
        <div className="flex flex-wrap gap-2 mb-4">
          {MODES.map((m) => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className={`px-3 py-2 rounded-full text-xs sm:text-sm border transition ${
                mode === m.id
                  ? "bg-[#0A84FF] text-white border-[#0A84FF]"
                  : "bg-black/40 text-gray-300 border-white/10 hover:border-[#0A84FF]"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
        {modeMeta && (
          <p className="text-[11px] text-gray-500 mb-4">
            {modeMeta.description}
          </p>
        )}

        {/* Form grid */}
        <div className="grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1.4fr)]">
          {/* Left column – shared fields */}
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-400 block mb-1">
                Company / Brand
              </label>
              <Input
                value={company}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCompany(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">
                Audience
              </label>
              <Input
                value={audience}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAudience(e.target.value)}
                placeholder="Who this is for — as specifically as possible"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">
                Brand Voice
              </label>
              <Input
                value={brandVoice}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBrandVoice(e.target.value)}
                placeholder="e.g. sharp, no-BS, operator-level, a bit playful…"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">
                Primary Keyword / Topic
              </label>
              <Input
                value={primaryKeyword}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPrimaryKeyword(e.target.value)}
                placeholder="e.g. SEO audit for B2B SaaS, digital growth OS, etc."
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">
                URL (optional)
              </label>
              <Input
                value={url}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUrl(e.target.value)}
                placeholder="Page or product URL to align around"
              />
            </div>
          </div>

          {/* Right column – mode-specific notes */}
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-400 block mb-1">
                Extra Instructions / Raw Notes
              </label>
              <Textarea
                rows={7}
                value={notes}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNotes(e.target.value)}
                placeholder={
                  mode === "press_release"
                    ? "What is the actual announcement? Any numbers (ARR, growth, clients), dates, names, etc."
                    : mode === "article"
                    ? "Outline ideas, subtopics, POV you want to emphasize, examples, case studies, etc."
                    : mode === "landing"
                    ? "Offer details, price/plan info, risk reversal, what makes this different."
                    : "Key beats to hit in social, what you want people to think/feel/do."
                }
              />
            </div>

            <Button
              className="w-full"
              disabled={loading || !company.trim() || !primaryKeyword.trim()}
              onClick={generate}
            >
              {loading
                ? "Cooking content…"
                : `Generate ${modeMeta?.label ?? "Content"}`}
            </Button>

            {error && (
              <div className="text-xs text-red-300 bg-red-900/30 border border-red-800 rounded-xl px-3 py-2 whitespace-pre-wrap">
                {error}
              </div>
            )}

            <p className="text-[10px] text-gray-500">
              Powered by Claude 3.5 Sonnet. You can paste audited insights or
              keyword outputs into the notes to steer the output harder.
            </p>
          </div>
        </div>
      </Card>

      {loading && <Spinner />}
      <ContentResultPanel result={result} clientId={selectedClientId || null} />
    </div>
  );
}

