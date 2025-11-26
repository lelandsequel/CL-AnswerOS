"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import React from "react";

type SalesMode = "pitch_deck" | "proposal" | "roi_calc" | "outreach" | "emails";

export default function SalesPage() {
  const [mode, setMode] = useState<SalesMode>("pitch_deck");
  const [companyName, setCompanyName] = useState("");
  const [industry, setIndustry] = useState("");
  const [services, setServices] = useState("");
  const [budget, setBudget] = useState("");
  const [timeline, setTimeline] = useState("");
  const [painPoints, setPainPoints] = useState("");
  const [goals, setGoals] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const generateContent = async () => {
    try {
      setLoading(true);
      setResult(null);

      const payload = {
        mode,
        companyName,
        industry,
        services,
        budget,
        timeline,
        painPoints,
        goals,
      };

      const res = await fetch("/api/sales/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed");

      setResult(data.result);
    } catch (err: any) {
      console.error(err);
      setResult({ error: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <Card>
        <div className="flex flex-col gap-2 mb-6">
          <h1 className="text-3xl font-bold text-emerald-300">
            Sales Engine
          </h1>
          <p className="text-sm text-slate-400">
            Generate pitch decks, proposals, ROI calculators, outreach scripts, and client communications.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {[
            { id: "pitch_deck", label: "Pitch Deck" },
            { id: "proposal", label: "Proposal" },
            { id: "roi_calc", label: "ROI Calculator" },
            { id: "outreach", label: "Outreach Scripts" },
            { id: "emails", label: "Email Templates" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setMode(item.id as SalesMode)}
              className={`px-3 py-2 rounded-full text-xs sm:text-sm border transition ${
                mode === item.id
                  ? "bg-emerald-600 text-white border-emerald-600"
                  : "bg-slate-800 text-slate-300 border-slate-700 hover:border-emerald-600"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="mt-6 space-y-4">
            {/* Common Fields */}
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-xs text-slate-400 block mb-1">
                  Company Name
                </label>
                <Input
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Client company name"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">
                  Industry
                </label>
                <Input
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  placeholder="e.g. SaaS, E-commerce, Healthcare"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">
                Services You're Offering
              </label>
              <Input
                value={services}
                onChange={(e) => setServices(e.target.value)}
                placeholder="SEO audit, content strategy, technical fixes, etc."
              />
            </div>

            {/* Mode-specific fields */}
            {mode === "proposal" && (
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">
                    Budget Range
                  </label>
                  <Input
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    placeholder="$10k - $25k"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">
                    Timeline
                  </label>
                  <Input
                    value={timeline}
                    onChange={(e) => setTimeline(e.target.value)}
                    placeholder="3 months, 6 months, etc."
                  />
                </div>
              </div>
            )}

            {mode === "roi_calc" && (
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">
                    Current Monthly Traffic
                  </label>
                  <Input
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    placeholder="e.g. 5,000 visitors/month"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">
                    Expected Growth %
                  </label>
                  <Input
                    value={timeline}
                    onChange={(e) => setTimeline(e.target.value)}
                    placeholder="e.g. 200% increase"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="text-xs text-slate-400 block mb-1">
                Client Pain Points / Goals
              </label>
              <Textarea
                rows={3}
                value={painPoints}
                onChange={(e) => setPainPoints(e.target.value)}
                placeholder={
                  mode === "pitch_deck"
                    ? "Low website traffic, poor conversion rates, competitors ranking higher..."
                    : mode === "proposal"
                    ? "Need better SEO performance, want to increase leads, struggling with content..."
                    : mode === "roi_calc"
                    ? "Current traffic numbers, conversion goals, revenue targets..."
                    : "Their specific challenges and what they want to achieve..."
                }
              />
            </div>

            <Button
              className="w-full"
              disabled={loading || !companyName.trim()}
              onClick={generateContent}
            >
              {loading
                ? "Generating..."
                : `Generate ${mode.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase())}`}
            </Button>
          </div>
      </Card>

      {result && (
        <Card>
          <div className="p-6">
            {result.error ? (
              <div className="text-red-300 bg-red-900/20 border border-red-800 rounded-lg p-4">
                {result.error}
              </div>
            ) : (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-emerald-300">
                  Generated {mode.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase())}
                </h2>

                {mode === "pitch_deck" && result.slides && (
                  <div className="space-y-4">
                    {result.slides.map((slide: any, idx: number) => (
                      <div key={idx} className="border border-slate-700 rounded-lg p-4">
                        <h3 className="font-semibold text-slate-200 mb-2">
                          Slide {idx + 1}: {slide.title}
                        </h3>
                        <p className="text-slate-300 mb-2">{slide.content}</p>
                        {slide.keyPoints && (
                          <ul className="list-disc list-inside space-y-1 text-sm text-slate-400">
                            {slide.keyPoints.map((point: string, i: number) => (
                              <li key={i}>{point}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {mode === "proposal" && (
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-slate-200 mb-2">Executive Summary</h3>
                      <p className="text-slate-300">{result.executiveSummary}</p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-200 mb-2">Scope of Work</h3>
                      <p className="text-slate-300 whitespace-pre-wrap">{result.scopeOfWork}</p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-200 mb-2">Timeline & Deliverables</h3>
                      <p className="text-slate-300 whitespace-pre-wrap">{result.timeline}</p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-200 mb-2">Pricing</h3>
                      <p className="text-slate-300">{result.pricing}</p>
                    </div>
                  </div>
                )}

                {mode === "roi_calc" && (
                  <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="bg-slate-950 p-4 rounded border border-slate-700">
                        <h3 className="font-semibold text-emerald-300 mb-2">Current Revenue</h3>
                        <p className="text-2xl font-bold text-slate-200">{result.currentRevenue}</p>
                      </div>
                      <div className="bg-slate-950 p-4 rounded border border-slate-700">
                        <h3 className="font-semibold text-blue-300 mb-2">Projected Revenue</h3>
                        <p className="text-2xl font-bold text-slate-200">{result.projectedRevenue}</p>
                      </div>
                      <div className="bg-slate-950 p-4 rounded border border-slate-700">
                        <h3 className="font-semibold text-purple-300 mb-2">ROI Multiple</h3>
                        <p className="text-2xl font-bold text-slate-200">{result.roiMultiple}x</p>
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-200 mb-2">ROI Breakdown</h3>
                      <p className="text-slate-300 whitespace-pre-wrap">{result.breakdown}</p>
                    </div>
                  </div>
                )}

                {(mode === "outreach" || mode === "emails") && (
                  <div className="space-y-4">
                    {result.templates?.map((template: any, idx: number) => (
                      <div key={idx} className="border border-slate-700 rounded-lg p-4">
                        <h3 className="font-semibold text-slate-200 mb-2">
                          {template.subject || template.title}
                        </h3>
                        <div className="text-slate-300 whitespace-pre-wrap">
                          {template.content || template.body}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-2 pt-4 border-t border-slate-700">
                  <Button
                    variant="outline"
                    onClick={() => navigator.clipboard.writeText(JSON.stringify(result, null, 2))}
                  >
                    📋 Copy JSON
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      const text = Object.values(result).join('\n\n');
                      navigator.clipboard.writeText(text);
                    }}
                  >
                    📄 Copy Text
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}

