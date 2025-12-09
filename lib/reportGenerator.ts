// lib/reportGenerator.ts
// Generates comprehensive text/markdown reports from audit data

import { OperatorReport } from "./types";

export interface ReportData {
  url: string;
  domain: string;
  clientName?: string;
  rawScore?: number;
  opportunityRating?: string;
  structuredAudit?: any;
  operatorReport?: OperatorReport;
  createdAt?: string;
}

export function generateTextReport(data: ReportData): string {
  const lines: string[] = [];
  const now = new Date().toLocaleDateString();

  // Header
  lines.push("═".repeat(80));
  lines.push("SEO/AEO AUDIT REPORT");
  lines.push("═".repeat(80));
  lines.push("");
  lines.push(`Generated: ${now}`);
  lines.push(`Client: ${data.clientName || "N/A"}`);
  lines.push(`Domain: ${data.domain}`);
  lines.push(`URL: ${data.url}`);
  lines.push("");

  // Executive Summary
  lines.push("─".repeat(80));
  lines.push("EXECUTIVE SUMMARY");
  lines.push("─".repeat(80));
  if (data.structuredAudit?.overview) {
    const overview = data.structuredAudit.overview;
    lines.push(`Current State: ${overview.current_state || "N/A"}`);
    lines.push(`Raw Score: ${data.rawScore || overview.raw_score || "N/A"}/100`);
    lines.push(`Opportunity Rating: ${data.opportunityRating || overview.opportunity_rating || "N/A"}`);
  }
  lines.push("");

  // Core Issues
  if (data.structuredAudit?.core_issues && Array.isArray(data.structuredAudit.core_issues)) {
    lines.push("─".repeat(80));
    lines.push("CORE ISSUES");
    lines.push("─".repeat(80));
    data.structuredAudit.core_issues.forEach((issue: any, idx: number) => {
      lines.push(`\n${idx + 1}. ${issue.category} [${issue.severity}]`);
      lines.push(`   Business Impact: ${issue.business_impact}`);
      if (Array.isArray(issue.symptoms)) {
        lines.push("   Issues:");
        issue.symptoms.forEach((symptom: string) => {
          lines.push(`     • ${symptom}`);
        });
      }
    });
    lines.push("");
  }

  // AEO Opportunities
  if (data.structuredAudit?.aeo_opportunities && Array.isArray(data.structuredAudit.aeo_opportunities)) {
    lines.push("─".repeat(80));
    lines.push("AEO OPPORTUNITIES");
    lines.push("─".repeat(80));
    data.structuredAudit.aeo_opportunities.forEach((opp: any, idx: number) => {
      lines.push(`\n${idx + 1}. ${opp.focus}`);
      lines.push(`   Expected Impact: ${opp.expected_impact}`);
      if (Array.isArray(opp.tactics)) {
        lines.push("   Recommended Tactics:");
        opp.tactics.forEach((tactic: string) => {
          lines.push(`     • ${tactic}`);
        });
      }
    });
    lines.push("");
  }

  // Investment Outlook
  if (data.structuredAudit?.investment_outlook) {
    lines.push("─".repeat(80));
    lines.push("INVESTMENT OUTLOOK");
    lines.push("─".repeat(80));
    const outlook = data.structuredAudit.investment_outlook;
    lines.push(`Budget: ${outlook.budget || "N/A"}`);
    lines.push(`ROI Projection: ${outlook.roi || "N/A"}`);
    if (outlook.notes) lines.push(`Notes: ${outlook.notes}`);
    lines.push("");
  }

  // Operator Report
  if (data.operatorReport) {
    lines.push("─".repeat(80));
    lines.push("OPERATOR REPORT");
    lines.push("─".repeat(80));

    if (data.operatorReport.boardSummary) {
      lines.push("\nBOARD SUMMARY");
      lines.push("─".repeat(40));
      lines.push(data.operatorReport.boardSummary);
    }

    if (data.operatorReport.whiteboardRoast) {
      lines.push("\n\nWHITEBOARD ROAST");
      lines.push("─".repeat(40));
      lines.push(data.operatorReport.whiteboardRoast);
    }

    if (data.operatorReport.moneyboard) {
      lines.push("\n\nMONEYBOARD");
      lines.push("─".repeat(40));
      lines.push(data.operatorReport.moneyboard);
    }
    lines.push("");
  }

  // Footer
  lines.push("═".repeat(80));
  lines.push("END OF REPORT");
  lines.push("═".repeat(80));

  return lines.join("\n");
}

export function generateMarkdownReport(data: ReportData): string {
  const lines: string[] = [];
  const now = new Date().toLocaleDateString();

  // Header
  lines.push("# SEO/AEO Audit Report");
  lines.push("");
  lines.push(`**Generated:** ${now}`);
  lines.push(`**Client:** ${data.clientName || "N/A"}`);
  lines.push(`**Domain:** ${data.domain}`);
  lines.push(`**URL:** ${data.url}`);
  lines.push("");

  // Executive Summary
  lines.push("## Executive Summary");
  if (data.structuredAudit?.overview) {
    const overview = data.structuredAudit.overview;
    lines.push(`- **Current State:** ${overview.current_state || "N/A"}`);
    lines.push(`- **Raw Score:** ${data.rawScore || overview.raw_score || "N/A"}/100`);
    lines.push(`- **Opportunity Rating:** ${data.opportunityRating || overview.opportunity_rating || "N/A"}`);
  }
  lines.push("");

  // Core Issues
  if (data.structuredAudit?.core_issues && Array.isArray(data.structuredAudit.core_issues)) {
    lines.push("## Core Issues");
    data.structuredAudit.core_issues.forEach((issue: any) => {
      lines.push(`### ${issue.category} - ${issue.severity}`);
      lines.push(`${issue.business_impact}`);
      if (Array.isArray(issue.symptoms)) {
        lines.push("**Issues:**");
        issue.symptoms.forEach((symptom: string) => {
          lines.push(`- ${symptom}`);
        });
      }
      lines.push("");
    });
  }

  // AEO Opportunities
  if (data.structuredAudit?.aeo_opportunities && Array.isArray(data.structuredAudit.aeo_opportunities)) {
    lines.push("## AEO Opportunities");
    data.structuredAudit.aeo_opportunities.forEach((opp: any) => {
      lines.push(`### ${opp.focus}`);
      lines.push(`**Expected Impact:** ${opp.expected_impact}`);
      if (Array.isArray(opp.tactics)) {
        lines.push("**Recommended Tactics:**");
        opp.tactics.forEach((tactic: string) => {
          lines.push(`- ${tactic}`);
        });
      }
      lines.push("");
    });
  }

  // Investment Outlook
  if (data.structuredAudit?.investment_outlook) {
    lines.push("## Investment Outlook");
    const outlook = data.structuredAudit.investment_outlook;
    lines.push(`- **Budget:** ${outlook.budget || "N/A"}`);
    lines.push(`- **ROI Projection:** ${outlook.roi || "N/A"}`);
    if (outlook.notes) lines.push(`- **Notes:** ${outlook.notes}`);
    lines.push("");
  }

  // Operator Report
  if (data.operatorReport) {
    lines.push("## Operator Report");

    if (data.operatorReport.boardSummary) {
      lines.push("### Board Summary");
      lines.push(data.operatorReport.boardSummary);
      lines.push("");
    }

    if (data.operatorReport.whiteboardRoast) {
      lines.push("### Whiteboard Roast");
      lines.push(data.operatorReport.whiteboardRoast);
      lines.push("");
    }

    if (data.operatorReport.moneyboard) {
      lines.push("### Moneyboard");
      lines.push(data.operatorReport.moneyboard);
      lines.push("");
    }
  }

  return lines.join("\n");
}

