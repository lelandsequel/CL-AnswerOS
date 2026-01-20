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
import type { Client, OperatorReport } from "@/lib/types";

interface AuditResultPayload {
  url: string;
  rawScan: string;
  structuredAudit: any;
  keywordMetrics?: any;
}

type SaveState =
  | "idle"
  | "saving"
  | "saved"
  | "error";

/**
 * Extract structured fields from audit result for deterministic asset mapping
 */
function extractStructuredFields(auditResult: AuditResultPayload) {
  if (!auditResult.structuredAudit) return {};

  const audit = auditResult.structuredAudit;

  // Extract company name from URL
  const companyName = auditResult.url
    ? auditResult.url
        .replace(/^https?:\/\/(www\.)?/, '')
        .split('.')[0]
        .replace(/[-_]/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
    : '';

  // Extract industry
  const industry = audit.overview?.industry ||
    audit.industry ||
    '';

  // Extract geography
  const geography = audit.overview?.geography ||
    audit.geography ||
    '';

  // Extract services from content_playbook
  const services = audit.content_playbook?.content_pillars || [];

  // Extract target customer
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
  const [auditResult, setAuditResult] =
    useState<AuditResultPayload | null>(null);
  const [error, setError] = useState("");

  // Clients
  const [clients, setClients] = useState<Client[]>([]);
  const [clientsLoading, setClientsLoading] = useState(false);
  const [clientError, setClientError] = useState("");
  const [selectedClientId, setSelectedClientId] =
    useState<string>("");

  // Hybrid save flow (Option C)
  const [clientIdAtRun, setClientIdAtRun] =
    useState<string | null>(null);
  const [saveState, setSaveState] =
    useState<SaveState>("idle");
  const [saveError, setSaveError] = useState("");
  const [savedAuditId, setSavedAuditId] =
    useState<string | null>(null);
  const [autoSaved, setAutoSaved] = useState(false);

  // Report Generator
  const [generatingReport, setGeneratingReport] = useState(false);
  const [reportError, setReportError] = useState("");
  const [generatedReport, setGeneratedReport] =
    useState<OperatorReport | null>(null);
  const [reportPreview, setReportPreview] = useState<string>("");
  const [showReportPreview, setShowReportPreview] = useState(false);

  // Load clients on mount
  useEffect(() => {
    loadClients();

    // Check for URL param
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const urlParam = params.get("url");
      if (urlParam) {
        setUrl(urlParam);
      }
    }
  }, []);

  async function loadClients() {
    try {
      setClientsLoading(true);
      setClientError("");
      const res = await fetch("/api/clients");
      const text = await res.text();
      if (!res.ok) {
        throw new Error(
          text || "Failed to fetch clients"
        );
      }
      const data = JSON.parse(text);
      setClients(data.clients || []);
    } catch (err: any) {
      console.error(err);
      setClientError(
        err?.message || "Failed to load clients"
      );
    } finally {
      setClientsLoading(false);
    }
  }

  const selectedClient = useMemo(
    () =>
      clients.find(
        (c) => c.id === selectedClientId
      ) || null,
    [clients, selectedClientId]
  );

  // --------- MAIN AUDIT RUNNER ---------

  async function runAudit() {
    if (!url.trim()) return;
    try {
      setLoading(true);
      setError("");
      setAuditResult(null);
      setSaveState("idle");
      setSaveError("");
      setSavedAuditId(null);
      setAutoSaved(false);

      // Snapshot of which client was selected at run time
      const clientSnapshot = selectedClientId || "";
      setClientIdAtRun(
        clientSnapshot ? clientSnapshot : null
      );

      const res = await fetch("/api/run-audit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      });

      const text = await res.text();
      if (!res.ok) {
        throw new Error(
          text || "Audit request failed"
        );
      }

      let data: any;
      try {
        data = JSON.parse(text);
      } catch (err) {
        console.error(
          "Failed to parse run-audit JSON:",
          err,
          text
        );
        throw new Error(
          "Could not parse run-audit response"
        );
      }

      const payload: AuditResultPayload = {
        url: data.url || url,
        rawScan: data.rawScan || "",
        structuredAudit: data.structuredAudit || null,
        keywordMetrics: data.keywordMetrics || null,
      };

      setAuditResult(payload);

      // Option C:
      // If a client was selected AT RUN TIME, auto-save the audit.
      if (clientSnapshot) {
        await autoSaveAudit(
          payload,
          clientSnapshot
        );
      }
    } catch (err: any) {
      console.error(err);
      setError(
        err?.message ||
          "Something went wrong running the audit"
      );
    } finally {
      setLoading(false);
    }
  }

  // --------- SAVE LOGIC ---------

  function extractDomainFromUrl(
    targetUrl: string
  ): string {
    try {
      const u = new URL(targetUrl);
      return u.hostname.replace(/^www\./, "");
    } catch {
      // Fallback: crude parse
      return targetUrl
        .replace(/^https?:\/\//, "")
        .split("/")[0]
        .replace(/^www\./, "");
    }
  }

  function deriveSummaryFields(structured: any) {
    if (!structured || typeof structured !== "object") {
      return {
        summary:
          "Audit completed. Structured data available.",
        opportunityRating: undefined as
          | string
          | undefined,
        rawScore: undefined as
          | number
          | undefined,
      };
    }

    const overview =
      structured.overview ||
      structured.business_summary ||
      structured.summary ||
      {};

    const currentState =
      overview.current_state ||
      overview.currentState ||
      overview.current_digital_health ||
      overview.currentStatus ||
      overview.current_state_summary ||
      "";

    const oppRating =
      overview.opportunity_rating ||
      overview.opportunityRating ||
      overview.opportunity_level ||
      structured?.investment_outlook
        ?.opportunity_rating ||
      structured?.investment_outlook
        ?.opportunityRating ||
      "";

    const rawScore =
      typeof overview.raw_score === "number"
        ? overview.raw_score
        : typeof overview.rawScore === "number"
        ? overview.rawScore
        : typeof structured.raw_score === "number"
        ? structured.raw_score
        : typeof structured.rawScore === "number"
        ? structured.rawScore
        : undefined;

    const sumParts: string[] = [];
    if (currentState) {
      sumParts.push(String(currentState));
    }
    if (oppRating) {
      sumParts.push(
        `Opportunity: ${oppRating}`
      );
    }

    const summary =
      sumParts.join(" — ") ||
      "Audit completed. Structured data available.";

    return {
      summary,
      opportunityRating: oppRating || undefined,
      rawScore,
    };
  }

  async function autoSaveAudit(
    payload: AuditResultPayload,
    clientId: string
  ) {
    try {
      setSaveState("saving");
      setSaveError("");

      const domain = extractDomainFromUrl(
        payload.url
      );
      const derived =
        deriveSummaryFields(
          payload.structuredAudit
        );

      const res = await fetch("/api/audits", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: payload.url,
          domain,
          summary: derived.summary,
          opportunityRating:
            derived.opportunityRating,
          rawScore: derived.rawScore,
          structuredAudit:
            payload.structuredAudit,
          rawScan: payload.rawScan,
          keywordMetrics:
            payload.keywordMetrics,
          clientId,
        }),
      });

      const text = await res.text();
      if (!res.ok) {
        throw new Error(
          text || "Failed to auto-save audit"
        );
      }

      let data: any = {};
      try {
        data = JSON.parse(text);
      } catch {
        data = {};
      }

      setSavedAuditId(data.id || null);
      setSaveState("saved");
      setAutoSaved(true);
    } catch (err: any) {
      console.error(err);
      setSaveState("error");
      setSaveError(
        err?.message ||
          "Failed to auto-save audit"
      );
      setAutoSaved(false);
    }
  }

  async function manualSaveAudit() {
    if (!auditResult) return;
    try {
      setSaveState("saving");
      setSaveError("");

      const domain = extractDomainFromUrl(
        auditResult.url
      );
      const derived =
        deriveSummaryFields(
          auditResult.structuredAudit
        );

      const clientId =
        selectedClientId || undefined;

      const res = await fetch("/api/audits", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: auditResult.url,
          domain,
          summary: derived.summary,
          opportunityRating:
            derived.opportunityRating,
          rawScore: derived.rawScore,
          structuredAudit:
            auditResult.structuredAudit,
          rawScan: auditResult.rawScan,
          keywordMetrics:
            auditResult.keywordMetrics,
          clientId,
        }),
      });

      const text = await res.text();
      if (!res.ok) {
        throw new Error(
          text || "Failed to save audit"
        );
      }

      let data: any = {};
      try {
        data = JSON.parse(text);
      } catch {
        data = {};
      }

      setSavedAuditId(data.id || null);
      setSaveState("saved");
      setAutoSaved(false);
    } catch (err: any) {
      console.error(err);
      setSaveState("error");
      setSaveError(
        err?.message || "Failed to save audit"
      );
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
          url: auditResult.url,
          clientName: selectedClient?.name,
          structuredAudit: auditResult.structuredAudit,
          notes,
          sassLevel: 7,
          chaosLevel: 5,
        }),
      });

      const text = await res.text();
      if (!res.ok) {
        throw new Error(
          text || "Report generation request failed"
        );
      }

      let data: any;
      try {
        data = JSON.parse(text);
      } catch (err) {
        console.error(
          "Failed to parse report JSON:",
          err,
          text
        );
        throw new Error(
          "Could not parse report response"
        );
      }

      setGeneratedReport(data.report || null);
    } catch (err: any) {
      console.error(err);
      setReportError(
        err?.message ||
          "Failed to generate report"
      );
    } finally {
      setGeneratingReport(false);
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
          domain: auditResult.url
            .replace(/^https?:\/\//, "")
            .split("/")[0]
            .replace(/^www\./, ""),
          clientName: selectedClient?.name,
          rawScore: auditResult.structuredAudit?.overview?.raw_score,
          opportunityRating: auditResult.structuredAudit?.overview?.opportunity_rating,
          structuredAudit: auditResult.structuredAudit,
          operatorReport: generatedReport,
          format,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to generate report");
      }

      const text = await res.text();

      // Show preview
      setReportPreview(text);
      setShowReportPreview(true);

      // Download file
      const blob = new Blob([text], { type: format === "md" ? "text/markdown" : "text/plain" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `audit-report-${Date.now()}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      console.error("Download failed:", err);
      alert("Failed to download report: " + (err?.message || "Unknown error"));
    }
  }

  // --------- RENDER HELPERS ---------

  function renderStructuredOverview() {
    if (!auditResult?.structuredAudit)
      return null;

    const structured =
      auditResult.structuredAudit;

    const overview =
      structured.overview ||
      structured.business_summary ||
      structured.summary ||
      {};

    const coreIssues =
      structured.core_issues ||
      structured.coreIssues ||
      [];

    const aeoOpportunities =
      structured.aeo_opportunities ||
      structured.aeoOpportunities ||
      [];

    const investmentOutlook =
      structured.investment_outlook ||
      structured.investmentOutlook ||
      {};

    const {
      summary,
      opportunityRating,
      rawScore,
    } = deriveSummaryFields(structured);

    return (
      <div className="space-y-3 text-xs sm:text-sm text-gray-200">
        <div>
          <div className="text-[11px] uppercase tracking-wide text-gray-500 mb-1">
            Overview
          </div>
          <div className="text-sm font-semibold text-gray-100">
            {summary}
          </div>
          {rawScore != null && (
            <div className="text-[11px] text-gray-400 mt-1">
              Raw Score:{" "}
              <span className="text-gray-100">
                {rawScore.toFixed(1)}
              </span>
            </div>
          )}
        </div>

        {Array.isArray(coreIssues) &&
          coreIssues.length > 0 && (
            <div>
              <div className="text-[11px] uppercase tracking-wide text-gray-500 mb-1">
                Core Issues
              </div>
              <div className="space-y-2">
                {coreIssues
                  .slice(0, 4)
                  .map(
                    (
                      issue: any,
                      idx: number
                    ) => (
                      <div
                        key={idx}
                        className="border border-white/10 rounded-lg p-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="font-semibold text-gray-100 text-xs">
                            {issue.category ||
                              "Issue"}
                          </div>
                          {issue.severity && (
                            <div className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-gray-200">
                              {issue.severity}
                            </div>
                          )}
                        </div>
                        {Array.isArray(
                          issue.symptoms
                        ) &&
                          issue.symptoms
                            .slice(0, 3)
                            .map(
                              (
                                s: any,
                                i2: number
                              ) => (
                                <div
                                  key={i2}
                                  className="text-[11px] text-gray-300"
                                >
                                  • {s}
                                </div>
                              )
                            )}
                        {issue.business_impact && (
                          <div className="text-[11px] text-gray-400 mt-1">
                            {issue.business_impact}
                          </div>
                        )}
                      </div>
                    )
                  )}
              </div>
            </div>
          )}

        {Array.isArray(aeoOpportunities) &&
          aeoOpportunities.length > 0 && (
            <div>
              <div className="text-[11px] uppercase tracking-wide text-gray-500 mb-1">
                AEO Opportunities
              </div>
              <div className="space-y-2">
                {aeoOpportunities
                  .slice(0, 4)
                  .map(
                    (
                      opp: any,
                      idx: number
                    ) => (
                      <div
                        key={idx}
                        className="border border-[#0A84FF]/30 bg-[#0A84FF]/5 rounded-lg p-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="font-semibold text-gray-100 text-xs">
                            {opp.focus ||
                              opp.stream ||
                              "Opportunity"}
                          </div>
                          {opp.expected_impact && (
                            <div className="text-[10px] text-[#0A84FF]">
                              {opp.expected_impact}
                            </div>
                          )}
                        </div>
                        {Array.isArray(
                          opp.tactics
                        ) && (
                          <ul className="mt-1 space-y-1 text-[11px] text-gray-300">
                            {opp.tactics
                              .slice(0, 4)
                              .map(
                                (
                                  t: any,
                                  i2: number
                                ) => (
                                  <li
                                    key={i2}
                                  >
                                    • {t}
                                  </li>
                                )
                              )}
                          </ul>
                        )}
                      </div>
                    )
                  )}
              </div>
            </div>
          )}

        {Object.keys(investmentOutlook).length >
          0 && (
          <div>
            <div className="text-[11px] uppercase tracking-wide text-gray-500 mb-1">
              Investment Outlook
            </div>
            <div className="text-[11px] text-gray-300 space-y-1">
              {investmentOutlook.recommended_budget_range && (
                <div>
                  Budget:{" "}
                  <span className="text-gray-100">
                    {
                      investmentOutlook.recommended_budget_range
                    }
                  </span>
                </div>
              )}
              {investmentOutlook.projected_roi && (
                <div>
                  ROI:{" "}
                  <span className="text-gray-100">
                    {
                      investmentOutlook.projected_roi
                    }
                  </span>
                </div>
              )}
              {investmentOutlook.notes && (
                <div>
                  Notes:{" "}
                  <span className="text-gray-100">
                    {investmentOutlook.notes}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  function renderKeywordMetrics() {
    if (!auditResult?.keywordMetrics) return null;

    const metrics = auditResult.keywordMetrics;

    return (
      <div className="space-y-1 text-xs sm:text-sm text-gray-200">
        <div className="text-[11px] uppercase tracking-wide text-gray-500 mb-1">
          Keyword Metrics (Raw)
        </div>
        <pre className="text-[10px] sm:text-[11px] bg-black/40 border border-white/10 rounded-xl p-2 overflow-auto max-h-60">
          {JSON.stringify(
            metrics,
            null,
            2
          )}
        </pre>
      </div>
    );
  }

  function renderRawScan() {
    if (!auditResult?.rawScan) return null;
    return (
      <div className="space-y-1 text-xs sm:text-sm text-gray-200">
        <div className="text-[11px] uppercase tracking-wide text-gray-500 mb-1">
          Raw Scan
        </div>
        <Textarea
          readOnly
          value={auditResult.rawScan}
          className="text-[10px] sm:text-[11px] bg-black/40 border border-white/10 rounded-xl min-h-[120px]"
        />
      </div>
    );
  }

  // --------- MAIN RENDER ---------

  return (
    <div className="space-y-8">
      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#0A84FF]">
              Audit Engine
            </h1>
            <p className="text-xs sm:text-sm text-gray-400">
              Drop a URL, pick a client (optional), and get a
              structured operator-grade SEO/AEO audit. If a client is
              selected at run time, the audit auto-saves to your CRM.
            </p>
          </div>
          <div className="text-[11px] text-gray-500">
            {clientsLoading
              ? "Loading clients…"
              : `${clients.length} clients`}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-[minmax(0,2.2fr)_minmax(0,1.6fr)]">
          {/* Left side: controls */}
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-400 block mb-1">
                URL to Audit
              </label>
              <Input
                value={url}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setUrl(e.target.value)
                }
                placeholder="https://example.com"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-400 block mb-1">
                  Attach to Client (optional)
                </label>
                <select
                  value={selectedClientId}
                  onChange={(e) =>
                    setSelectedClientId(
                      e.target.value
                    )
                  }
                  className="w-full px-2 py-2 text-xs rounded-xl bg-black/40 border border-white/10 text-gray-100"
                >
                  <option value="">
                    Unassigned
                  </option>
                  {clients.map((c) => (
                    <option
                      key={c.id}
                      value={c.id}
                    >
                      {c.name}
                      {c.primaryDomain
                        ? ` — ${c.primaryDomain}`
                        : ""}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-gray-500 mt-1">
                  If you pick a client before running, the audit
                  will automatically save and appear under that
                  client.
                </p>
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">
                  Notes / Intent (optional)
                </label>
                <Textarea
                  rows={3}
                  value={notes}
                  onChange={(e) =>
                    setNotes(e.target.value)
                  }
                  placeholder="Internal notes, campaign context, or what you're looking for in this audit."
                  className="text-xs"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between mt-1">
              <Button
                className="w-full sm:w-auto"
                onClick={runAudit}
                disabled={
                  loading || !url.trim()
                }
              >
                {loading
                  ? "Running Audit…"
                  : "Run Audit"}
              </Button>

              <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-[11px] text-gray-500">
                {saveState === "saving" && (
                  <span>
                    Saving audit…
                  </span>
                )}
                {saveState === "saved" &&
                  autoSaved &&
                  selectedClient && (
                    <span className="text-[#0A84FF]">
                      Auto-saved to client:{" "}
                      {selectedClient.name}
                    </span>
                  )}
                {saveState === "saved" &&
                  !autoSaved && (
                    <span className="text-[#0A84FF]">
                      Audit saved.
                    </span>
                  )}
                {saveState === "error" && (
                  <span className="text-red-300">
                    {saveError ||
                      "Failed to save audit"}
                  </span>
                )}
              </div>
            </div>

            {error && (
              <div className="text-xs text-red-300 bg-red-900/30 border border-red-800 rounded-xl px-3 py-2 whitespace-pre-wrap">
                {error}
              </div>
            )}
            {clientError && (
              <div className="text-xs text-yellow-300 bg-yellow-900/20 border border-yellow-700 rounded-xl px-3 py-2 whitespace-pre-wrap">
                {clientError}
              </div>
            )}

            {reportError && (
              <div className="text-xs text-red-300 bg-red-900/30 border border-red-800 rounded-xl px-3 py-2 whitespace-pre-wrap mt-2">
                {reportError}
              </div>
            )}

            {/* Manual Save Controls */}
            {auditResult && (
              <div className="mt-2 flex flex-col sm:flex-row sm:items-center gap-2 flex-wrap">
                <Button
                  variant="outline"
                  disabled={
                    saveState === "saving" ||
                    autoSaved ||
                    !!savedAuditId
                  }
                  onClick={manualSaveAudit}
                >
                  {saveState === "saving"
                    ? "Saving…"
                    : savedAuditId || autoSaved
                    ? "Audit Saved"
                    : "Save Audit (optional)"}
                </Button>

                <Button
                  variant="outline"
                  disabled={generatingReport}
                  onClick={generateReport}
                >
                  {generatingReport
                    ? "Generating…"
                    : "Generate Report"}
                </Button>

                <Link
                  href="/clients"
                  className="text-[11px] text-gray-400 hover:text-gray-200 underline-offset-2 hover:underline"
                >
                  Open Clients Dashboard
                </Link>
              </div>
            )}
          </div>

          {/* Right side: result */}
          <div className="space-y-4">
            {!auditResult && !loading && (
              <div className="text-xs sm:text-sm text-gray-500">
                Run an audit to see structured findings, AEO
                opportunities, and raw scan context. Once saved,
                you&apos;ll be able to see it under{" "}
                <span className="text-gray-200">
                  /clients
                </span>
                .
              </div>
            )}

            {loading && <Spinner />}

            {auditResult && (
              <>
                <div className="flex flex-col gap-3">
                  <Card>
                    {renderStructuredOverview()}
                  </Card>

                  {generatedReport && (
                    <OperatorReportPanel
                      report={generatedReport}
                      url={auditResult.url}
                      clientName={selectedClient?.name}
                    />
                  )}

                  <div className="flex flex-col sm:flex-row gap-2">
                    <SaveAssetButton
                      label="Save Audit as Asset"
                      clientId={selectedClientId || null}
                      type="audit"
                      title={
                        auditResult.url
                          ? `Audit – ${auditResult.url}`
                          : "SEO / Content Audit"
                      }
                      summary={
                        auditResult.structuredAudit
                          ?.summary ||
                        "Structured SEO/AEO audit"
                      }
                      payload={{
                        ...auditResult,
                        structuredFields: extractStructuredFields(auditResult),
                      }}
                      tags={["audit", "seo"]}
                    />

                    <Button
                      variant="outline"
                      onClick={() => {
                        const auditData = auditResult.structuredAudit
                          ? JSON.stringify(auditResult.structuredAudit)
                          : auditResult.rawScan || "";
                        const params = new URLSearchParams({
                          url: auditResult.url,
                          audit: encodeURIComponent(auditData),
                        });
                        window.open(`/fix?${params.toString()}`, '_blank');
                      }}
                      className="text-xs"
                    >
                      Generate Fix Pack
                    </Button>
                  </div>
                </div>

                {generatedReport && (
                  <div className="flex flex-col gap-3">
                    <OperatorReportPanel
                      report={generatedReport}
                      url={auditResult.url}
                      clientName={selectedClient?.name}
                    />

                    <div className="flex flex-col sm:flex-row gap-2">
                      <SaveAssetButton
                        label="Save Operator Report"
                        clientId={selectedClientId || null}
                        type="operator_report"
                        title={
                          auditResult.url
                            ? `Operator Report – ${auditResult.url}`
                            : "Operator Audit Report"
                        }
                        summary={
                          generatedReport.boardSummary?.slice(
                            0,
                            220
                          ) || "Operator report"
                        }
                        payload={generatedReport}
                        tags={["report_generator", "report"]}
                      />

                      <Button
                        variant="outline"
                        onClick={() => downloadReport("txt")}
                        className="text-xs"
                      >
                        Download Report (TXT)
                      </Button>

                      <Button
                        variant="outline"
                        onClick={() => downloadReport("md")}
                        className="text-xs"
                      >
                        Download Report (MD)
                      </Button>
                    </div>

                    {showReportPreview && reportPreview && (
                      <Card className="bg-slate-900 border-slate-700">
                        <div className="p-4">
                          <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-white">
                              Full Report Preview
                            </h3>
                            <Button
                              variant="ghost"
                              onClick={() => setShowReportPreview(false)}
                              className="text-slate-400 hover:text-white px-2 py-1"
                            >
                              ✕
                            </Button>
                          </div>
                          <pre className="bg-slate-950 p-4 rounded text-xs text-slate-200 overflow-auto max-h-96 whitespace-pre-wrap break-words font-mono">
                            {reportPreview}
                          </pre>
                        </div>
                      </Card>
                    )}
                  </div>
                )}

                <Card>{renderKeywordMetrics()}</Card>

                <Card>{renderRawScan()}</Card>
              </>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
