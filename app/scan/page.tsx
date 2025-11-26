"use client";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Spinner from "@/components/Spinner";

interface ScanResponse {
  summary: string;
  crawledPages?: number;
  linksFound?: number;
  issues?: string[];
  raw?: any;
}

export default function ScanPage() {
  const [url, setUrl] = useState("");
  const [depth, setDepth] = useState(3);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScanResponse | null>(null);
  const [error, setError] = useState("");

  async function runScan() {
    try {
      setLoading(true);
      setError("");
      setResult(null);

      const res = await fetch("/api/run-scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, depth }),
      });

      if (!res.ok) throw new Error("Scan failed");
      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || "Scan failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <Card>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#0A84FF] mb-4">
          Deep Scan
        </h1>
        <p className="text-xs sm:text-sm text-gray-400 mb-4">
          Crawl the site, map internal links, and surface technical issues
          before we start yelling in the audit.
        </p>
        <div className="space-y-4">
          <div>
            <label className="text-xs text-gray-400 block mb-1">
              Website URL
            </label>
            <Input
              placeholder="https://example.com"
              value={url}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUrl(e.target.value)}
            />
          </div>
          <div>
            <div className="flex justify-between text-xs text-gray-400">
              <span>Depth</span>
              <span>{depth}</span>
            </div>
            <input
              type="range"
              min={1}
              max={10}
              value={depth}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDepth(Number(e.target.value))}
              className="w-full"
            />
          </div>
          <Button onClick={runScan} disabled={loading || !url}>
            {loading ? "Scanning…" : "Run Deep Scan"}
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
        <Card>
          <h2 className="text-lg font-semibold text-[#0A84FF] mb-2">
            Scan Summary
          </h2>
          <p className="text-sm text-gray-200 mb-3">{result.summary}</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-gray-300 mb-4">
            <div>
              <div className="text-gray-500">Crawled Pages</div>
              <div className="text-lg">{result.crawledPages ?? "—"}</div>
            </div>
            <div>
              <div className="text-gray-500">Links Found</div>
              <div className="text-lg">{result.linksFound ?? "—"}</div>
            </div>
          </div>
          {result.issues?.length ? (
            <div className="mt-2">
              <div className="text-xs uppercase tracking-[0.18em] text-gray-500 mb-2">
                Key Issues
              </div>
              <ul className="list-disc list-inside text-xs text-gray-300 space-y-1">
                {result.issues.map((i, idx) => (
                  <li key={idx}>{i}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </Card>
      )}
    </div>
  );
}

