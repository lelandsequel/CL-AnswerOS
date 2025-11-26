"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

interface FixCardProps {
  fix: any;
  type: "quick" | "deep";
}

function FixCard({ fix, type }: FixCardProps) {
  const isQuick = type === "quick";
  const colorClass = isQuick ? "border-emerald-600/30 bg-emerald-950/20" : "border-blue-600/30 bg-blue-950/20";
  const headerColor = isQuick ? "text-emerald-300" : "text-blue-300";

  return (
    <div className={`border rounded-lg p-4 space-y-3 ${colorClass}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className={`font-semibold ${headerColor}`}>{fix.label}</h4>
            <span className={`text-xs px-2 py-0.5 rounded ${
              fix.priority === 'critical' ? 'bg-red-600/20 text-red-300' :
              fix.priority === 'high' ? 'bg-orange-600/20 text-orange-300' :
              fix.priority === 'medium' ? 'bg-yellow-600/20 text-yellow-300' :
              'bg-gray-600/20 text-gray-300'
            }`}>
              {fix.priority}
            </span>
            <span className="text-xs text-gray-400">{fix.estimatedTime}</span>
            <span className={`text-xs px-2 py-0.5 rounded ${
              fix.difficulty === 'beginner' ? 'bg-green-600/20 text-green-300' :
              fix.difficulty === 'intermediate' ? 'bg-blue-600/20 text-blue-300' :
              'bg-purple-600/20 text-purple-300'
            }`}>
              {fix.difficulty}
            </span>
          </div>
          <p className="text-sm text-slate-300 mb-2">{fix.issue}</p>
          <p className="text-sm text-slate-200 font-medium">{fix.fixSummary}</p>
        </div>
      </div>

      {fix.codeSnippet && (
        <div>
          <h5 className="text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wide">Code Snippet</h5>
          <pre className="bg-slate-950 p-3 rounded text-xs text-slate-200 overflow-x-auto border border-slate-700">
            <code>{fix.codeSnippet}</code>
          </pre>
        </div>
      )}

      {fix.implementationSteps && fix.implementationSteps.length > 0 && (
        <div>
          <h5 className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wide">Implementation Steps</h5>
          <ol className="space-y-1">
            {fix.implementationSteps.map((step: string, idx: number) => (
              <li key={idx} className="text-sm text-slate-300 flex gap-2">
                <span className="text-slate-500 font-mono text-xs">{idx + 1}.</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {fix.successCriteria && fix.successCriteria.length > 0 && (
        <div>
          <h5 className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wide">Success Criteria</h5>
          <ul className="space-y-1">
            {fix.successCriteria.map((criteria: string, idx: number) => (
              <li key={idx} className="text-sm text-slate-300 flex gap-2">
                <span className="text-emerald-400">✓</span>
                <span>{criteria}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function generateIDECodeBlock(fixPack: any): string {
  const allFixes = [...(fixPack.quickWins || []), ...(fixPack.deepFixes || [])];

  let prompt = `# SEO Fix Implementation Prompt

You are an expert web developer implementing SEO fixes for a website. Below is a comprehensive list of SEO issues and their fixes. Implement ALL of these fixes in the appropriate files.

## Context
- **Overall Strategy**: ${fixPack.overallStrategy}
- **Website**: [The website you're working on]
- **Date**: ${new Date().toISOString().split('T')[0]}

## Implementation Instructions
1. Go through each fix in priority order (critical → high → medium → low)
2. Locate the correct files to modify
3. Implement the code changes exactly as specified
4. Test each fix using the success criteria provided
5. Move to the next fix only after verifying the current one works

## SEO Fixes to Implement

`;

  // Sort fixes by priority
  const priorityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
  allFixes.sort((a, b) => (priorityOrder[a.priority] || 3) - (priorityOrder[b.priority] || 3));

  allFixes.forEach((fix, idx) => {
    prompt += `### Fix ${idx + 1}: ${fix.label}
**Category**: ${fix.category}
**Priority**: ${fix.priority} | **Time**: ${fix.estimatedTime} | **Difficulty**: ${fix.difficulty}

**Problem**: ${fix.issue}

**Solution**: ${fix.fixSummary}

**Implementation Steps**:
${fix.implementationSteps?.map((step: string, i: number) => `${i + 1}. ${step}`).join('\n') || 'See code snippet below'}

**Code Changes**:
\`\`\`
${fix.codeSnippet || 'No code snippet provided - implement based on description above'}
\`\`\`

**Success Criteria**:
${fix.successCriteria?.map((criteria: string) => `✓ ${criteria}`).join('\n') || 'Verify the fix works as expected'}

---

`;
  });

  prompt += `## Final Verification
After implementing all fixes:
1. Run a new SEO audit to verify improvements
2. Check that all success criteria are met
3. Test the website loads properly
4. Validate that no functionality was broken

## Notes for Client
${fixPack.notesForClient || 'No additional client notes.'}

---

**Remember**: Implement these fixes carefully. Test thoroughly after each change. The goal is to improve SEO while maintaining website functionality.`;

  return prompt;
}

export default function FixPage() {
  const [auditText, setAuditText] = useState("");
  const [url, setUrl] = useState("");
  const [fixPack, setFixPack] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load URL params on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const urlParam = params.get("url");
      const auditParam = params.get("audit");

      if (urlParam) {
        setUrl(urlParam);
      }
      if (auditParam) {
        try {
          // Try to parse as JSON first, fallback to raw text
          const parsed = JSON.parse(decodeURIComponent(auditParam));
          setAuditText(typeof parsed === 'string' ? parsed : JSON.stringify(parsed, null, 2));
        } catch {
          setAuditText(decodeURIComponent(auditParam));
        }
      }
    }
  }, []);

  const runFixEngine = async () => {
    console.log("[Fix Engine] Button clicked, auditText:", auditText?.length, "url:", url?.length);
    if (!auditText.trim() || !url.trim()) {
      setError("Please provide both URL and audit text");
      return;
    }
    setLoading(true);
    setError(null);
    setFixPack(null);
    try {
      console.log("[Fix Engine] Making API call...");
      const res = await fetch("/api/fix-engine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, audit: auditText }),
      });

      console.log("[Fix Engine] API response status:", res.status);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || `Fix engine failed: ${res.status}`);
      }

      const data = await res.json();
      console.log("[Fix Engine] API response data:", data);
      setFixPack(data.fixPack);
    } catch (err: any) {
      console.error("[Fix Engine] Error:", err);
      setError(err?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-green-300">Fix Engine</h1>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-200">URL</label>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
            className="w-full p-2 rounded bg-slate-800 border border-slate-700 text-slate-100"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-200">Audit Text</label>
          <textarea
            value={auditText}
            onChange={(e) => setAuditText(e.target.value)}
            placeholder="Paste your audit output here..."
            className="w-full h-24 p-2 rounded bg-slate-800 border border-slate-700 text-slate-100 resize-none"
          />
        </div>
      </div>

      {error && (
        <div className="text-red-300 bg-red-950/40 border border-red-700 rounded p-3">
          {error}
        </div>
      )}

      <button
        onClick={runFixEngine}
        disabled={loading || !auditText.trim() || !url.trim()}
        className="px-4 py-2 bg-green-600 rounded hover:bg-green-500 disabled:opacity-50"
      >
        {loading ? "Generating fixes..." : "Generate Fix Pack"}
      </button>

      {fixPack && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-6 space-y-6">
          <h2 className="text-xl font-semibold text-green-300">Fix Pack Results</h2>

          <div className="bg-slate-950/50 p-4 rounded border border-slate-700">
            <h3 className="font-semibold text-slate-200 mb-2">Overall Strategy</h3>
            <p className="text-slate-300">{fixPack.overallStrategy}</p>
          </div>

          <div>
            <h3 className="font-semibold text-slate-200 mb-4 flex items-center gap-2">
              Quick Wins
              <span className="text-xs bg-emerald-600/20 text-emerald-300 px-2 py-1 rounded">
                Under 15 minutes each
              </span>
            </h3>
            <div className="space-y-4">
              {fixPack.quickWins?.map((fix: any, idx: number) => (
                <FixCard key={idx} fix={fix} type="quick" />
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-slate-200 mb-4 flex items-center gap-2">
              Deep Fixes
              <span className="text-xs bg-blue-600/20 text-blue-300 px-2 py-1 rounded">
                30-120 minutes each
              </span>
            </h3>
            <div className="space-y-4">
              {fixPack.deepFixes?.map((fix: any, idx: number) => (
                <FixCard key={idx} fix={fix} type="deep" />
              ))}
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <Button
              onClick={() => {
                const ideCode = generateIDECodeBlock(fixPack);
                navigator.clipboard.writeText(ideCode);
                alert("IDE code block copied to clipboard!");
              }}
              variant="outline"
              className="text-sm"
            >
              📋 Generate IDE Code Block
            </Button>
          </div>

          {fixPack.notesForClient && (
            <div className="bg-amber-950/30 border border-amber-700/50 p-4 rounded">
              <h3 className="font-semibold text-amber-300 mb-2">Client Notes</h3>
              <p className="text-amber-200">{fixPack.notesForClient}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

