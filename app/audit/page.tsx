// app/audit/page.tsx

"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import Spinner from "@/components/Spinner";
import { OperatorReportPanel } from "@/components/LelandizedPanel";
import { SaveAssetButton } from "@/components/assets";
import { PdfExportButton } from "@/components/PdfExportButton";
import { DeepAuditPanel } from "@/components/DeepAuditPanel";
import type { Client, ClientAsset, OperatorReport, StructuredAudit } from "@/lib/types";
import type { DeepAuditResult } from "@/lib/audit-engine/types";
import type { ExecutionPlan } from "@/lib/execution-mapper/types";

interface AuditResultPayload {
  url: string;
  rawScan: string;
  structuredAudit: any;
  keywordMetrics?: any;
}

type AuditMode = "standard" | "deep";

type SaveState = "idle" | "saving" | "saved" | "error";

function extractStructuredFields(auditResult: AuditResultPayload) {
  if (!auditResult.structuredAudit) return {};
  const audit = auditResult.structuredAudit;
  const companyName = auditResult.url
    ? auditResult.url.replace(/^https?:\/\/(www\.)?/, '').split('.')[0].replace(/[-_]/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
    : '';
  const industry = audit.overview?.industry || audit.industry || '';
  const geography = audit.overview?.geography || audit.geography || '';
  const services = audit.content_playbook?.content_pillars || [];
  const targetCustomer = audit.content_playbook?.target_persona?.summary || '';
  return {
    company_name: companyName,
    website_url: auditResult.url,
    industry,
    geography,
    services: Array.isArray(services) ? services : [],
    target_customer: targetCustomer,
    core_issues: audit.core_issues || [],
    quick_wins: audit.quick_wins_48h || [],
    aeo_opportunities: audit.aeo_opportunities || [],
  };
}

export default function AuditPage() {
  const [url, setUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [auditResult, setAuditResult] = useState<AuditResultPayload | null>(null);
  const [deepAuditResult, setDeepAuditResult] = useState<DeepAuditResult | null>(null);
  const [auditMode, setAuditMode] = useState<AuditMode>("standard");
  const [deepAuditAvailable, setDeepAuditAvailable] = useState<boolean | null>(null);
  const [error, setError] = useState("");
  const [clients, setClients] = useState<Client[]>([]);
  const [clientsLoading, setClientsLoading] = useState(false);
  const [clientError, setClientError] = useState("");
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [clientIdAtRun, setClientIdAtRun] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [saveError, setSaveError] = useState("");
  const [savedAuditId, setSavedAuditId] = useState<string | null>(null);
  const [autoSaved, setAutoSaved] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [reportError, setReportError] = useState("");
  const [generatedReport, setGeneratedReport] = useState<OperatorReport | null>(null);
  const [reportPreview, setReportPreview] = useState<string>("");
  const [showReportPreview, setShowReportPreview] = useState(false);
  const [savedAssetId, setSavedAssetId] = useState<string | null>(null);
  const [executionPlan, setExecutionPlan] = useState<ExecutionPlan | null>(null);
  const [generatingPlan, setGeneratingPlan] = useState(false);
  const [planError, setPlanError] = useState("");
  const [planFormat, setPlanFormat] = useState<"full" | "workflow" | "bbb">("full");

  useEffect(() => {
    loadClients();
    checkDeepAuditAvailability();
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const urlParam = params.get("url");
      if (urlParam) setUrl(urlParam);
    }
  }, []);

  async function checkDeepAuditAvailability() {
    try {
      const res = await fetch("/api/deep-audit");
      const data = await res.json();
      setDeepAuditAvailable(data.available === true);
    } catch {
      setDeepAuditAvailable(false);
    }
  }

  async function loadClients() {
    try {
      setClientsLoading(true);
      setClientError("");
      const res = await fetch("/api/clients");
      const text = await res.text();
      if (!res.ok) throw new Error(text || "Failed to fetch clients");
      const data = JSON.parse(text);
      setClients(data.clients || []);
    } catch (err: any) {
      console.error(err);
      setClientError(err?.message || "Failed to load clients");
    } finally {
      setClientsLoading(false);
    }
  }

  const selectedClient = useMemo(() => clients.find((c) => c.id === selectedClientId) || null, [clients, selectedClientId]);

  async function runAudit() {
    if (!url.trim()) return;
    try {
      setLoading(true);
      setError("");
      setAuditResult(null);
      setDeepAuditResult(null);
      setSaveState("idle");
      setSaveError("");
      setSavedAuditId(null);
      setSavedAssetId(null);
      setAutoSaved(false);
      const clientSnapshot = selectedClientId || "";
      setClientIdAtRun(clientSnapshot ? clientSnapshot : null);

      if (auditMode === "deep") {
        // Run deep audit via DataForSEO
        const res = await fetch("/api/deep-audit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url, maxPages: 50 }),
        });

        const text = await res.text();
        if (!res.ok) {
          let errorMsg = "Deep audit failed";
          try {
            const errData = JSON.parse(text);
            errorMsg = errData.error || errData.details || errorMsg;
          } catch {
            errorMsg = text || errorMsg;
          }
          throw new Error(errorMsg);
        }

        let data: any;
        try {
          data = JSON.parse(text);
        } catch {
          throw new Error("Could not parse deep-audit response");
        }

        if (data.deepAudit) {
          setDeepAuditResult(data.deepAudit);
        }

        // Also set standard audit result for backward compatibility
        if (data.structuredAudit) {
          const payload: AuditResultPayload = {
            url: data.url || url,
            rawScan: JSON.stringify(data.deepAudit, null, 2),
            structuredAudit: data.structuredAudit,
            keywordMetrics: null,
          };
          setAuditResult(payload);
          if (clientSnapshot) await autoSaveAudit(payload, clientSnapshot);
        }
      } else {
        // Standard audit (existing flow)
        const res = await fetch("/api/run-audit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url }),
        });

        const text = await res.text();
        if (!res.ok) throw new Error(text || "Audit request failed");

        let data: any;
        try {
          data = JSON.parse(text);
        } catch {
          throw new Error("Could not parse run-audit response");
        }

        const payload: AuditResultPayload = {
          url: data.url || url,
          rawScan: data.rawScan || "",
          structuredAudit: data.structuredAudit || null,
          keywordMetrics: data.keywordMetrics || null,
        };

        setAuditResult(payload);
        if (clientSnapshot) await autoSaveAudit(payload, clientSnapshot);
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Something went wrong running the audit");
    } finally {
      setLoading(false);
    }
  }

  function extractDomainFromUrl(targetUrl: string): string {
    try {
      const u = new URL(targetUrl);
      return u.hostname.replace(/^www\./, "");
    } catch {
      return targetUrl.replace(/^https?:\/\//, "").split("/")[0].replace(/^www\./, "");
    }
  }

  function deriveSummaryFields(structured: any) {
    if (!structured || typeof structured !== "object") {
      return { summary: "Audit completed. Structured data available.", opportunityRating: undefined, rawScore: undefined };
    }
    const overview = structured.overview || structured.business_summary || structured.summary || {};
    const currentState = overview.current_state || overview.currentState || overview.current_digital_health || "";
    const oppRating = overview.opportunity_rating || structured?.investment_outlook?.opportunity_rating || "";
    const rawScore = typeof overview.raw_score === "number" ? overview.raw_score : typeof structured.raw_score === "number" ? structured.raw_score : undefined;
    const sumParts: string[] = [];
    if (currentState) sumParts.push(String(currentState));
    if (oppRating) sumParts.push(`Opportunity: ${oppRating}`);
    return { summary: sumParts.join(" — ") || "Audit completed.", opportunityRating: oppRating || undefined, rawScore };
  }

  async function autoSaveAudit(payload: AuditResultPayload, clientId: string) {
    try {
      setSaveState("saving");
      setSaveError("");
      const domain = extractDomainFromUrl(payload.url);
      const derived = deriveSummaryFields(payload.structuredAudit);
      const res = await fetch("/api/audits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: payload.url, domain, summary: derived.summary, opportunityRating: derived.opportunityRating,
          rawScore: derived.rawScore, structuredAudit: payload.structuredAudit, rawScan: payload.rawScan,
          keywordMetrics: payload.keywordMetrics, clientId,
        }),
      });
      const text = await res.text();
      if (!res.ok) throw new Error(text || "Failed to auto-save audit");
      let data: any = {};
      try { data = JSON.parse(text); } catch { data = {}; }
      setSavedAuditId(data.id || null);
      setSaveState("saved");
      setAutoSaved(true);
    } catch (err: any) {
      console.error(err);
      setSaveState("error");
      setSaveError(err?.message || "Failed to auto-save audit");
      setAutoSaved(false);
    }
  }

  async function manualSaveAudit() {
    if (!auditResult) return;
    try {
      setSaveState("saving");
      setSaveError("");
      const domain = extractDomainFromUrl(auditResult.url);
      const derived = deriveSummaryFields(auditResult.structuredAudit);
      const clientId = selectedClientId || undefined;
      const res = await fetch("/api/audits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: auditResult.url, domain, summary: derived.summary, opportunityRating: derived.opportunityRating,
          rawScore: derived.rawScore, structuredAudit: auditResult.structuredAudit, rawScan: auditResult.rawScan,
          keywordMetrics: auditResult.keywordMetrics, clientId,
        }),
      });
      const text = await res.text();
      if (!res.ok) throw new Error(text || "Failed to save audit");
      let data: any = {};
      try { data = JSON.parse(text); } catch { data = {}; }
      setSavedAuditId(data.id || null);
      setSaveState("saved");
      setAutoSaved(false);
    } catch (err: any) {
      console.error(err);
      setSaveState("error");
      setSaveError(err?.message || "Failed to save audit");
    }
  }

  async function generateReport() {
    if (!auditResult || !auditResult.structuredAudit) return;
    try {
      setGeneratingReport(true);
      setReportError("");
      setGeneratedReport(null);
      const res = await fetch("/api/lelandize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: auditResult.url, clientName: selectedClient?.name, structuredAudit: auditResult.structuredAudit,
          notes, sassLevel: 7, chaosLevel: 5,
        }),
      });
      const text = await res.text();
      if (!res.ok) throw new Error(text || "Report generation failed");
      let data: any;
      try { data = JSON.parse(text); } catch { throw new Error("Could not parse report response"); }
      setGeneratedReport(data.report || null);
    } catch (err: any) {
      console.error(err);
      setReportError(err?.message || "Failed to generate report");
    } finally {
      setGeneratingReport(false);
    }
  }

  async function generateExecutionPlan(format: "full" | "workflow" | "bbb" = "full") {
    if (!deepAuditResult) return;
    try {
      setGeneratingPlan(true);
      setPlanError("");
      setExecutionPlan(null);
      setPlanFormat(format);

      const res = await fetch("/api/execution-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deepAudit: deepAuditResult, format }),
      });

      if (format === "workflow" || format === "bbb") {
        // These return markdown text, trigger download
        const text = await res.text();
        if (!res.ok) throw new Error(text || "Failed to generate plan");
        const blob = new Blob([text], { type: "text/markdown" });
        const blobUrl = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = `execution-${format}-${deepAuditResult.domain}-${Date.now()}.md`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(blobUrl);
        document.body.removeChild(a);
      } else {
        // Full JSON response
        const text = await res.text();
        if (!res.ok) throw new Error(text || "Failed to generate plan");
        const data = JSON.parse(text);
        if (data.plan) {
          setExecutionPlan(data.plan);
        }
      }
    } catch (err: any) {
      console.error(err);
      setPlanError(err?.message || "Failed to generate execution plan");
    } finally {
      setGeneratingPlan(false);
    }
  }

  async function downloadReport(format: "txt" | "md") {
    if (!auditResult || !generatedReport) return;
    try {
      const res = await fetch("/api/export-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: auditResult.url,
          domain: auditResult.url.replace(/^https?:\/\//, "").split("/")[0].replace(/^www\./, ""),
          clientName: selectedClient?.name,
          rawScore: auditResult.structuredAudit?.overview?.raw_score,
          opportunityRating: auditResult.structuredAudit?.overview?.opportunity_rating,
          structuredAudit: auditResult.structuredAudit,
          operatorReport: generatedReport,
          format,
        }),
      });
      if (!res.ok) throw new Error("Failed to generate report");
      const text = await res.text();
      setReportPreview(text);
      setShowReportPreview(true);
      const blob = new Blob([text], { type: format === "md" ? "text/markdown" : "text/plain" });
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `audit-report-${Date.now()}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(blobUrl);
      document.body.removeChild(a);
    } catch (err: any) {
      console.error("Download failed:", err);
    }
  }

  function renderStructuredOverview() {
    if (!auditResult?.structuredAudit) return null;
    const structured = auditResult.structuredAudit;
    const overview = structured.overview || structured.business_summary || {};
    const coreIssues = structured.core_issues || [];
    const aeoOpportunities = structured.aeo_opportunities || [];
    const { summary, rawScore } = deriveSummaryFields(structured);

    return (
      <div className="space-y-4 text-sm">
        <div>
          <div className="text-xs text-slate-600 mb-2">// overview</div>
          <div className="text-slate-200">{summary}</div>
          {rawScore != null && (
            <div className="text-xs text-slate-500 mt-1">
              raw_score: <span className="text-amber-400">{rawScore.toFixed(1)}</span>
            </div>
          )}
        </div>

        {coreIssues.length > 0 && (
          <div>
            <div className="text-xs text-slate-600 mb-2">// core_issues[{coreIssues.length}]</div>
            <div className="space-y-2">
              {coreIssues.slice(0, 4).map((issue: any, idx: number) => (
                <div key={idx} className="border border-slate-800 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-slate-300">{issue.category || "Issue"}</span>
                    {issue.severity && <span className="text-xs text-red-400">[{issue.severity}]</span>}
                  </div>
                  {Array.isArray(issue.symptoms) && issue.symptoms.slice(0, 3).map((s: any, i2: number) => (
                    <div key={i2} className="text-xs text-slate-500 mt-1">
                      <span className="text-slate-700">→</span> {s}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        {aeoOpportunities.length > 0 && (
          <div>
            <div className="text-xs text-slate-600 mb-2">// aeo_opportunities[{aeoOpportunities.length}]</div>
            <div className="space-y-2">
              {aeoOpportunities.slice(0, 4).map((opp: any, idx: number) => (
                <div key={idx} className="border border-violet-500/30 bg-violet-500/5 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-violet-300">{opp.focus || "Opportunity"}</span>
                    {opp.expected_impact && <span className="text-xs text-violet-500">{opp.expected_impact}</span>}
                  </div>
                  {Array.isArray(opp.tactics) && opp.tactics.slice(0, 3).map((t: any, i2: number) => (
                    <div key={i2} className="text-xs text-slate-500 mt-1">
                      <span className="text-violet-700">→</span> {t}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-12 font-mono">
      <div className="mb-8">
        <div className="text-xs text-slate-600 mb-2">// audit.init()</div>
        <h1 className="text-3xl font-bold text-white mb-2">Audit Engine</h1>
        <p className="text-slate-500 text-sm">
          Drop a URL, attach a client (optional), get a structured SEO/AEO audit.
        </p>
        <div className="mt-2 h-px w-24 bg-gradient-to-r from-violet-500 to-transparent" />
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_1fr]">
        {/* Left: Controls */}
        <div className="space-y-4">
          <Card>
            <div className="space-y-4">
              <Input
                label="url"
                value={url}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUrl(e.target.value)}
                placeholder="https://example.com"
              />

              <div>
                <label className="block text-xs text-slate-500 mb-1.5">client_id</label>
                <select
                  value={selectedClientId}
                  onChange={(e) => setSelectedClientId(e.target.value)}
                  className="w-full px-4 py-2.5 font-mono text-sm bg-slate-950 border border-slate-800 text-slate-200 focus:border-violet-500/50 focus:outline-none"
                >
                  <option value="">null</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}{c.primaryDomain ? ` — ${c.primaryDomain}` : ""}</option>
                  ))}
                </select>
              </div>

              <Textarea
                label="notes"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="// optional context"
              />

              {/* Audit Mode Toggle */}
              <div>
                <label className="block text-xs text-slate-500 mb-1.5">audit_mode</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setAuditMode("standard")}
                    className={`flex-1 px-4 py-2.5 text-sm font-mono border transition-colors ${
                      auditMode === "standard"
                        ? "border-violet-500 text-violet-400 bg-violet-500/10"
                        : "border-slate-800 text-slate-500 hover:text-slate-300 hover:border-slate-700"
                    }`}
                  >
                    standard
                  </button>
                  <button
                    onClick={() => setAuditMode("deep")}
                    disabled={deepAuditAvailable === false}
                    className={`flex-1 px-4 py-2.5 text-sm font-mono border transition-colors ${
                      auditMode === "deep"
                        ? "border-violet-500 text-violet-400 bg-violet-500/10"
                        : deepAuditAvailable === false
                        ? "border-slate-800 text-slate-700 cursor-not-allowed"
                        : "border-slate-800 text-slate-500 hover:text-slate-300 hover:border-slate-700"
                    }`}
                  >
                    deep
                    {deepAuditAvailable === false && (
                      <span className="ml-2 text-[10px] text-slate-700">(no API key)</span>
                    )}
                  </button>
                </div>
                {auditMode === "deep" && (
                  <p className="text-[10px] text-slate-600 mt-1">
                    Deep audit uses DataForSEO for comprehensive crawl + Lighthouse analysis
                  </p>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                <Button onClick={runAudit} disabled={loading || !url.trim()} prefix="$">
                  {loading ? "executing..." : "run --audit"}
                </Button>

                {auditResult && (
                  <>
                    <Button variant="secondary" onClick={manualSaveAudit} disabled={saveState === "saving" || !!savedAuditId} prefix="$">
                      {savedAuditId ? "saved" : "save --audit"}
                    </Button>
                    <Button variant="secondary" onClick={generateReport} disabled={generatingReport} prefix="$">
                      {generatingReport ? "generating..." : "generate --report"}
                    </Button>
                  </>
                )}
              </div>

              {saveState === "saved" && (
                <div className="text-xs text-emerald-500">
                  <span className="text-emerald-600">→</span> audit saved{autoSaved && selectedClient ? ` to ${selectedClient.name}` : ""}
                </div>
              )}

              {error && (
                <div className="text-xs text-red-400 border border-red-500/30 bg-red-500/5 p-3">
                  <span className="text-red-500">✗</span> {error}
                </div>
              )}
            </div>
          </Card>

          {auditResult && (
            <Card title="actions">
              <div className="flex flex-wrap gap-2">
                <SaveAssetButton
                  label="save_asset"
                  clientId={selectedClientId || null}
                  type="audit"
                  title={auditResult.url ? `Audit – ${auditResult.url}` : "SEO Audit"}
                  summary={auditResult.structuredAudit?.summary || "Structured SEO/AEO audit"}
                  payload={{ ...auditResult, structuredFields: extractStructuredFields(auditResult) }}
                  tags={["audit", "seo"]}
                  onSaved={(asset: ClientAsset) => setSavedAssetId(asset.id)}
                />

                {savedAssetId && (
                  <Link href={`/pseo?asset=${savedAssetId}`}>
                    <Button variant="primary" prefix="→">
                      continue --pseo
                    </Button>
                  </Link>
                )}

                <Button
                  variant="outline"
                  onClick={() => {
                    const auditData = auditResult.structuredAudit ? JSON.stringify(auditResult.structuredAudit) : auditResult.rawScan || "";
                    const params = new URLSearchParams({ url: auditResult.url, audit: encodeURIComponent(auditData) });
                    window.open(`/fix?${params.toString()}`, '_blank');
                  }}
                >
                  fix --generate
                </Button>

                {deepAuditResult && (
                  <>
                    <Button
                      variant="primary"
                      onClick={() => generateExecutionPlan("full")}
                      disabled={generatingPlan}
                      prefix="→"
                    >
                      {generatingPlan ? "generating..." : "execution --plan"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => generateExecutionPlan("bbb")}
                      disabled={generatingPlan}
                    >
                      export --bbb
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => generateExecutionPlan("workflow")}
                      disabled={generatingPlan}
                    >
                      export --workflow
                    </Button>
                  </>
                )}

                <Link href="/clients" className="text-xs text-slate-600 hover:text-violet-400 px-4 py-2.5">
                  → /clients
                </Link>
              </div>
            </Card>
          )}
        </div>

        {/* Right: Results */}
        <div className="space-y-4">
          {!auditResult && !loading && (
            <div className="border border-dashed border-slate-800 p-8 text-center">
              <div className="text-slate-600 text-sm">
                <span className="text-slate-700">→</span> run audit to see results
              </div>
            </div>
          )}

          {loading && (
            <Card variant="terminal" title="~/audit">
              <div className="text-slate-500 text-sm">
                <span className="text-emerald-500">→</span>
                {auditMode === "deep" ? "running deep audit" : "scanning"}
                <span className="animate-pulse">...</span>
              </div>
              {auditMode === "deep" && (
                <div className="text-[10px] text-slate-600 mt-2">
                  This may take 1-3 minutes (crawling + Lighthouse)
                </div>
              )}
              <Spinner />
            </Card>
          )}

          {/* Deep Audit Results */}
          {deepAuditResult && (
            <DeepAuditPanel result={deepAuditResult} />
          )}

          {/* Execution Plan Results */}
          {planError && (
            <Card variant="terminal" title="~/execution/error">
              <div className="text-red-400 text-sm">
                <span className="text-red-500">✗</span> {planError}
              </div>
            </Card>
          )}

          {generatingPlan && (
            <Card variant="terminal" title="~/execution/plan">
              <div className="text-slate-500 text-sm">
                <span className="text-emerald-500">→</span> generating execution plan<span className="animate-pulse">...</span>
              </div>
              <Spinner />
            </Card>
          )}

          {executionPlan && (
            <Card variant="terminal" title="~/execution/plan">
              {/* Score Summary */}
              <div className="mb-6">
                <div className="text-xs text-slate-600 mb-3">// score_projection</div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="border border-slate-800 p-3">
                    <div className="text-[10px] text-slate-600 uppercase mb-1">Before</div>
                    <div className="text-2xl font-bold text-slate-400">{executionPlan.scores.before.overall}</div>
                  </div>
                  <div className="border border-emerald-500/30 bg-emerald-500/5 p-3">
                    <div className="text-[10px] text-emerald-600 uppercase mb-1">After (Simulated)</div>
                    <div className="text-2xl font-bold text-emerald-400">{executionPlan.scores.afterSimulated.overall}</div>
                  </div>
                  <div className="border border-violet-500/30 bg-violet-500/5 p-3">
                    <div className="text-[10px] text-violet-600 uppercase mb-1">Delta</div>
                    <div className="text-2xl font-bold text-violet-400">
                      +{executionPlan.scores.delta.overallMin}-{executionPlan.scores.delta.overallMax}
                    </div>
                  </div>
                </div>
                <div className="mt-3 text-xs text-slate-600">
                  SEO: +{executionPlan.scores.delta.seoMin}-{executionPlan.scores.delta.seoMax} pts |
                  AEO: +{executionPlan.scores.delta.aeoMin}-{executionPlan.scores.delta.aeoMax} pts
                </div>
              </div>

              {/* Phases */}
              <div className="mb-6">
                <div className="text-xs text-slate-600 mb-3">// phases[{executionPlan.phases.length}]</div>
                <div className="space-y-3">
                  {executionPlan.phases.map((phaseBlock, idx) => {
                    const bbbIcon = phaseBlock.phase.bbbType === 'mechanical' ? '🔧' :
                      phaseBlock.phase.bbbType === 'structural' ? '🏗️' : '🎯';
                    const bbbColor = phaseBlock.phase.bbbType === 'mechanical' ? 'text-blue-400 border-blue-500/30' :
                      phaseBlock.phase.bbbType === 'structural' ? 'text-amber-400 border-amber-500/30' : 'text-violet-400 border-violet-500/30';

                    return (
                      <div key={idx} className="border border-slate-800 p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-slate-600 text-xs">Phase {phaseBlock.phase.order}</span>
                            <span className="text-slate-200 font-medium">{phaseBlock.phase.name}</span>
                            <span className={`text-[10px] px-1.5 py-0.5 border ${bbbColor}`}>
                              {bbbIcon} {phaseBlock.phase.bbbType.toUpperCase()}
                            </span>
                          </div>
                          <span className="text-xs text-emerald-500">
                            +{phaseBlock.aggregateScoreImpact.overallDeltaMin}-{phaseBlock.aggregateScoreImpact.overallDeltaMax} pts
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 mb-2">{phaseBlock.phase.description}</div>
                        <div className="text-[10px] text-slate-600">
                          {phaseBlock.issues.length} issues • {phaseBlock.totalEstimatedEffort} •
                          {phaseBlock.canStart ? (
                            <span className="text-emerald-500 ml-1">ready to start</span>
                          ) : (
                            <span className="text-amber-500 ml-1">blocked</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Artifacts */}
              <div className="mb-6">
                <div className="text-xs text-slate-600 mb-3">// artifacts[{executionPlan.artifactsAll.length}]</div>
                <div className="flex flex-wrap gap-2">
                  {executionPlan.artifactsAll.slice(0, 12).map((artifact, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] px-2 py-1 border border-slate-700 text-slate-400 bg-slate-900"
                      title={artifact.description}
                    >
                      {artifact.id}
                    </span>
                  ))}
                  {executionPlan.artifactsAll.length > 12 && (
                    <span className="text-[10px] text-slate-600">
                      +{executionPlan.artifactsAll.length - 12} more
                    </span>
                  )}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-800">
                <Button variant="outline" onClick={() => generateExecutionPlan("bbb")}>
                  export --bbb
                </Button>
                <Button variant="outline" onClick={() => generateExecutionPlan("workflow")}>
                  export --workflow
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    const blob = new Blob([JSON.stringify(executionPlan, null, 2)], { type: "application/json" });
                    const blobUrl = window.URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = blobUrl;
                    a.download = `execution-plan-${executionPlan.auditUrl.replace(/[^a-z0-9]/gi, '-')}-${Date.now()}.json`;
                    document.body.appendChild(a);
                    a.click();
                    window.URL.revokeObjectURL(blobUrl);
                    document.body.removeChild(a);
                  }}
                >
                  export --json
                </Button>
              </div>
            </Card>
          )}

          {/* Standard Audit Results (when no deep audit) */}
          {auditResult && !deepAuditResult && (
            <>
              <Card variant="terminal" title="~/audit/result">
                {renderStructuredOverview()}
              </Card>

              {generatedReport && (
                <Card variant="terminal" title="~/audit/report">
                  <OperatorReportPanel report={generatedReport} url={auditResult.url} clientName={selectedClient?.name} />

                  <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-800">
                    <Button variant="outline" onClick={() => downloadReport("txt")}>export --txt</Button>
                    <Button variant="outline" onClick={() => downloadReport("md")}>export --md</Button>
                    <PdfExportButton
                      auditData={{
                        url: auditResult.url,
                        clientName: selectedClient?.name,
                        structuredAudit: auditResult.structuredAudit as StructuredAudit,
                        report: generatedReport,
                      }}
                      label="export --pdf"
                    />
                  </div>
                </Card>
              )}

              {auditResult.keywordMetrics && (
                <Card variant="terminal" title="~/audit/keywords">
                  <pre className="text-xs text-slate-400 overflow-auto max-h-48">
                    {JSON.stringify(auditResult.keywordMetrics, null, 2)}
                  </pre>
                </Card>
              )}
            </>
          )}
        </div>
      </div>

      <div className="mt-16 text-xs text-slate-800">// end of file</div>
    </main>
  );
}
