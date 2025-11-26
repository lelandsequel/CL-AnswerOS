"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import Spinner from "@/components/Spinner";
import { PressReleasePreview } from "@/components/PressReleasePreview";
import { PressReleaseResponse } from "@/lib/types";

export default function PressReleasePage() {
  const [company, setCompany] = useState("");
  const [headlineFocus, setHeadlineFocus] = useState("");
  const [announcementType, setAnnouncementType] = useState("launch");
  const [website, setWebsite] = useState("");
  const [audience, setAudience] = useState("Tech & business press");
  const [tone, setTone] = useState<"serious" | "balanced" | "hype">(
    "balanced"
  );
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState<PressReleaseResponse | null>(null);
  const [error, setError] = useState("");

  async function generatePR() {
    try {
      setLoading(true);
      setError("");
      setDraft(null);

      const res = await fetch("/api/press-release", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company,
          headlineFocus,
          announcementType,
          tone,
          website,
          audience,
          notes,
        }),
      });

      if (!res.ok) throw new Error("PR generation failed");
      const data: PressReleaseResponse = await res.json();
      setDraft(data);
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
        <h1 className="text-2xl sm:text-3xl font-bold text-[#0A84FF] mb-2">
          Press Release Generator
        </h1>
        <p className="text-xs sm:text-sm text-gray-400 mb-4">
          Turn your positioning into something you can send to a journalist.
        </p>

        <div className="grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-400 block mb-1">
                Company / Brand
              </label>
              <Input
                value={company}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCompany(e.target.value)}
                placeholder="Infinity Digital Consulting"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">
                Headline Focus
              </label>
              <Input
                value={headlineFocus}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setHeadlineFocus(e.target.value)}
                placeholder="Launch of AI-powered audit engine"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">
                Additional Notes / Angles
              </label>
              <Textarea
                value={notes}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNotes(e.target.value)}
                placeholder="Key numbers, results, client quotes..."
              />
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-400 block mb-1">
                Announcement Type
              </label>
              <select
                value={announcementType}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                  setAnnouncementType(e.target.value as any)
                }
                className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-sm text-gray-200"
              >
                <option value="launch">Product / Service Launch</option>
                <option value="funding">Funding Announcement</option>
                <option value="partnership">Partnership</option>
                <option value="milestone">Milestone / Growth</option>
                <option value="hiring">Executive Hire</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-400 block mb-1">
                  Tone
                </label>
                <select
                  value={tone}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    setTone(e.target.value as "serious" | "balanced" | "hype")
                  }
                  className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-sm text-gray-200"
                >
                  <option value="serious">Serious / Traditional</option>
                  <option value="balanced">Balanced</option>
                  <option value="hype">Hype / TechCrunch</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">
                  Website / URL
                </label>
                <Input
                  value={website}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setWebsite(e.target.value)}
                  placeholder="https://example.com"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-400 block mb-1">
                Target Audience
              </label>
              <Input
                value={audience}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAudience(e.target.value)}
                placeholder="Tech & marketing press"
              />
            </div>

            <Button
              onClick={generatePR}
              disabled={loading || !company || !headlineFocus}
              className="w-full"
            >
              {loading ? "Generating…" : "Generate Press Release"}
            </Button>

            {error && (
              <div className="text-xs text-red-300 bg-red-900/30 border border-red-800 rounded-xl px-3 py-2">
                {error}
              </div>
            )}
          </div>
        </div>
      </Card>

      {loading && <Spinner />}
      {draft && <PressReleasePreview data={draft} />}
    </div>
  );
}

