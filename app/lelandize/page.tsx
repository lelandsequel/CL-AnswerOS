"use client";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import Spinner from "@/components/Spinner";

interface LelandizeResponse {
  original: string;
  lelandized: string;
  tone: string;
}

export default function LelandizePage() {
  const [text, setText] = useState("");
  const [sass, setSass] = useState(7);
  const [tone, setTone] = useState<"founder" | "analyst" | "pablo">("founder");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<LelandizeResponse | null>(null);
  const [error, setError] = useState("");

  async function lelandize() {
    try {
      setLoading(true);
      setError("");
      setResult(null);

      const res = await fetch("/api/lelandize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, sass, tone }),
      });

      if (!res.ok) throw new Error("Lelandize failed");
      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || "Failed to lelandize");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <Card>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#0A84FF] mb-4">
          Lelandizer
        </h1>
        <p className="text-xs sm:text-sm text-gray-400 mb-4">
          Transform any text into Leland's voice. Pick your tone pack and sass
          level.
        </p>
        <div className="space-y-4">
          <div>
            <label className="text-xs text-gray-400 block mb-1">
              Input Text
            </label>
            <Textarea
              placeholder="Paste your audit, report, or any text here…"
              value={text}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setText(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-400 block mb-1">
                Tone Pack
              </label>
              <select
                value={tone}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                  setTone(e.target.value as "founder" | "analyst" | "pablo")
                }
                className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-sm text-gray-200"
              >
                <option value="founder">Founder – Visionary</option>
                <option value="analyst">Analyst – Data-Driven</option>
                <option value="pablo">Pablo – Unhinged Genius</option>
              </select>
            </div>
            <div>
              <div className="flex justify-between text-xs text-gray-400">
                <span>Sass Level</span>
                <span>{sass}</span>
              </div>
              <input
                type="range"
                min={1}
                max={10}
                value={sass}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSass(Number(e.target.value))}
                className="w-full"
              />
            </div>
          </div>
          <Button onClick={lelandize} disabled={loading || !text}>
            {loading ? "Lelandizing…" : "Transform"}
          </Button>
          {error && (
            <div className="text-xs text-red-300 bg-red-900/30 border border-red-800 rounded-xl px-3 py-2 mt-2">
              {error}
            </div>
          )}
        </div>
      </Card>

      {loading && <Spinner />}

      {result && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <h2 className="text-sm font-semibold text-gray-400 mb-2">
              Original
            </h2>
            <p className="text-xs sm:text-sm text-gray-200 whitespace-pre-wrap">
              {result.original}
            </p>
          </Card>
          <Card>
            <h2 className="text-sm font-semibold text-[#0A84FF] mb-2">
              Lelandized ({result.tone})
            </h2>
            <p className="text-xs sm:text-sm text-gray-200 whitespace-pre-wrap">
              {result.lelandized}
            </p>
            <Button
              variant="ghost"
              className="mt-3 text-xs"
              onClick={() => {
                navigator.clipboard.writeText(result.lelandized);
              }}
            >
              Copy
            </Button>
          </Card>
        </div>
      )}
    </div>
  );
}

