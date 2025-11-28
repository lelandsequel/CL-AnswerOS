import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function getSupabase() {
  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase credentials");
  }
  return createClient(supabaseUrl, supabaseKey);
}

interface AuditData {
  id: string;
  url: string;
  domain: string;
  summary: string;
  opportunity_rating?: string;
  raw_score?: number;
  structured_audit?: {
    overview?: {
      domain?: string;
      current_state?: string;
      opportunity_rating?: string;
      raw_score?: number;
    };
    core_issues?: Array<{
      category?: string;
      severity?: string;
      symptoms?: string[];
      business_impact?: string;
    }>;
    aeo_opportunities?: Array<{
      focus?: string;
      tactics?: string[];
      expected_impact?: string;
    }>;
    quick_wins_48h?: Array<{
      action?: string;
      impact_score?: number;
      effort_level?: string;
    }>;
    investment_outlook?: {
      recommended_budget_range?: string;
      projected_roi?: string;
      notes?: string;
    };
  };
  created_at: string;
  client_name?: string;
}

function generateHTMLReport(audit: AuditData, clientName?: string): string {
  const structured = audit.structured_audit || {};
  const overview = structured.overview || {};
  const coreIssues = structured.core_issues || [];
  const aeoOpportunities = structured.aeo_opportunities || [];
  const quickWins = structured.quick_wins_48h || [];
  const investment = structured.investment_outlook || {};

  const date = new Date(audit.created_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Audit Report - ${audit.domain}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #1a1a1a;
      max-width: 900px;
      margin: 0 auto;
      padding: 40px 20px;
      background: #ffffff;
    }
    .header {
      border-bottom: 3px solid #0A84FF;
      padding-bottom: 24px;
      margin-bottom: 32px;
    }
    .header h1 {
      font-size: 32px;
      font-weight: 700;
      color: #0A84FF;
      margin-bottom: 8px;
    }
    .header .subtitle {
      font-size: 18px;
      color: #666;
    }
    .meta {
      display: flex;
      gap: 24px;
      margin-top: 16px;
      font-size: 14px;
      color: #888;
    }
    .section {
      margin-bottom: 40px;
    }
    .section h2 {
      font-size: 20px;
      font-weight: 600;
      color: #333;
      margin-bottom: 16px;
      padding-bottom: 8px;
      border-bottom: 1px solid #eee;
    }
    .executive-summary {
      background: #f8fafc;
      border-left: 4px solid #0A84FF;
      padding: 20px;
      border-radius: 0 8px 8px 0;
    }
    .executive-summary p {
      font-size: 16px;
      color: #444;
    }
    .rating {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 14px;
      font-weight: 600;
      margin-top: 12px;
    }
    .rating.high {
      background: #dcfce7;
      color: #166534;
    }
    .rating.medium {
      background: #fef3c7;
      color: #92400e;
    }
    .rating.low {
      background: #fee2e2;
      color: #991b1b;
    }
    .issue-card {
      background: #fff;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 12px;
    }
    .issue-card h3 {
      font-size: 16px;
      font-weight: 600;
      color: #333;
      margin-bottom: 8px;
    }
    .severity {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 500;
      margin-left: 8px;
    }
    .severity.critical { background: #fee2e2; color: #991b1b; }
    .severity.high { background: #fed7aa; color: #9a3412; }
    .severity.medium { background: #fef3c7; color: #92400e; }
    .severity.low { background: #e0e7ff; color: #3730a3; }
    .symptoms {
      list-style: disc;
      padding-left: 20px;
      margin: 8px 0;
      color: #666;
    }
    .business-impact {
      font-size: 14px;
      color: #666;
      font-style: italic;
      margin-top: 8px;
    }
    .opportunity-card {
      background: linear-gradient(135deg, #e0f2fe 0%, #f0f9ff 100%);
      border: 1px solid #bae6fd;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 12px;
    }
    .opportunity-card h3 {
      font-size: 16px;
      font-weight: 600;
      color: #0369a1;
      margin-bottom: 8px;
    }
    .tactics {
      list-style: none;
      padding: 0;
    }
    .tactics li {
      padding: 4px 0 4px 20px;
      position: relative;
      color: #444;
    }
    .tactics li:before {
      content: "→";
      position: absolute;
      left: 0;
      color: #0A84FF;
    }
    .quick-win {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px;
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 6px;
      margin-bottom: 8px;
    }
    .quick-win .action {
      flex: 1;
      font-weight: 500;
    }
    .quick-win .meta-badges {
      display: flex;
      gap: 8px;
    }
    .badge {
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 500;
    }
    .badge.impact { background: #dbeafe; color: #1e40af; }
    .badge.effort { background: #f3e8ff; color: #6b21a8; }
    .investment-box {
      background: #fefce8;
      border: 1px solid #fde047;
      border-radius: 8px;
      padding: 20px;
    }
    .investment-box .item {
      margin-bottom: 12px;
    }
    .investment-box .label {
      font-size: 12px;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .investment-box .value {
      font-size: 18px;
      font-weight: 600;
      color: #333;
    }
    .footer {
      margin-top: 60px;
      padding-top: 20px;
      border-top: 1px solid #eee;
      text-align: center;
      color: #888;
      font-size: 12px;
    }
    @media print {
      body { max-width: 100%; padding: 20px; }
      .section { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Website Audit Report</h1>
    <div class="subtitle">${audit.domain}</div>
    <div class="meta">
      ${clientName ? `<span>Client: ${clientName}</span>` : ""}
      <span>Date: ${date}</span>
      <span>URL: ${audit.url}</span>
    </div>
  </div>

  <div class="section">
    <h2>Executive Summary</h2>
    <div class="executive-summary">
      <p>${audit.summary || overview.current_state || "Comprehensive SEO and AEO audit completed."}</p>
      ${
        audit.opportunity_rating || overview.opportunity_rating
          ? `<span class="rating ${(audit.opportunity_rating || overview.opportunity_rating || "").toLowerCase()}">${audit.opportunity_rating || overview.opportunity_rating} Opportunity</span>`
          : ""
      }
      ${
        audit.raw_score !== undefined || overview.raw_score !== undefined
          ? `<p style="margin-top: 12px; font-size: 14px; color: #666;">Raw Score: ${(audit.raw_score ?? overview.raw_score ?? 0).toFixed(1)}/100</p>`
          : ""
      }
    </div>
  </div>

  ${
    coreIssues.length > 0
      ? `
  <div class="section">
    <h2>Key Findings</h2>
    ${coreIssues
      .map(
        (issue) => `
      <div class="issue-card">
        <h3>
          ${issue.category || "Issue"}
          ${issue.severity ? `<span class="severity ${(issue.severity || "").toLowerCase()}">${issue.severity}</span>` : ""}
        </h3>
        ${
          issue.symptoms && issue.symptoms.length > 0
            ? `
          <ul class="symptoms">
            ${issue.symptoms.map((s) => `<li>${s}</li>`).join("")}
          </ul>
        `
            : ""
        }
        ${issue.business_impact ? `<p class="business-impact">${issue.business_impact}</p>` : ""}
      </div>
    `
      )
      .join("")}
  </div>
  `
      : ""
  }

  ${
    aeoOpportunities.length > 0
      ? `
  <div class="section">
    <h2>Opportunities</h2>
    ${aeoOpportunities
      .map(
        (opp) => `
      <div class="opportunity-card">
        <h3>${opp.focus || "Opportunity"}</h3>
        ${
          opp.tactics && opp.tactics.length > 0
            ? `
          <ul class="tactics">
            ${opp.tactics.map((t) => `<li>${t}</li>`).join("")}
          </ul>
        `
            : ""
        }
        ${opp.expected_impact ? `<p style="font-size: 14px; color: #0369a1; margin-top: 8px;">Expected Impact: ${opp.expected_impact}</p>` : ""}
      </div>
    `
      )
      .join("")}
  </div>
  `
      : ""
  }

  ${
    quickWins.length > 0
      ? `
  <div class="section">
    <h2>Action Items (Quick Wins)</h2>
    ${quickWins
      .map(
        (win) => `
      <div class="quick-win">
        <span class="action">${win.action || "Action item"}</span>
        <div class="meta-badges">
          ${win.impact_score !== undefined ? `<span class="badge impact">Impact: ${win.impact_score}</span>` : ""}
          ${win.effort_level ? `<span class="badge effort">${win.effort_level} Effort</span>` : ""}
        </div>
      </div>
    `
      )
      .join("")}
  </div>
  `
      : ""
  }

  ${
    Object.keys(investment).length > 0
      ? `
  <div class="section">
    <h2>Investment Outlook</h2>
    <div class="investment-box">
      ${
        investment.recommended_budget_range
          ? `
        <div class="item">
          <div class="label">Recommended Budget</div>
          <div class="value">${investment.recommended_budget_range}</div>
        </div>
      `
          : ""
      }
      ${
        investment.projected_roi
          ? `
        <div class="item">
          <div class="label">Projected ROI</div>
          <div class="value">${investment.projected_roi}</div>
        </div>
      `
          : ""
      }
      ${
        investment.notes
          ? `
        <div class="item">
          <div class="label">Notes</div>
          <div class="value" style="font-size: 14px; font-weight: 400;">${investment.notes}</div>
        </div>
      `
          : ""
      }
    </div>
  </div>
  `
      : ""
  }

  <div class="footer">
    <p>Generated by C&L Answer OS • Agency Audit Tool</p>
    <p>Report generated on ${new Date().toLocaleString()}</p>
  </div>
</body>
</html>`;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const auditId = searchParams.get("id");
    const clientName = searchParams.get("clientName") || undefined;
    const format = searchParams.get("format") || "html";

    if (!auditId) {
      return NextResponse.json(
        { error: "Missing audit ID" },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    const { data: audit, error } = await supabase
      .from("audits")
      .select("*")
      .eq("id", auditId)
      .single();

    if (error || !audit) {
      return NextResponse.json(
        { error: "Audit not found" },
        { status: 404 }
      );
    }

    if (format === "json") {
      return NextResponse.json(audit);
    }

    // Generate HTML report
    const html = generateHTMLReport(audit, clientName);

    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `attachment; filename="audit-report-${audit.domain || auditId}.html"`,
      },
    });
  } catch (err: unknown) {
    console.error("[audit/export] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Export failed" },
      { status: 500 }
    );
  }
}
