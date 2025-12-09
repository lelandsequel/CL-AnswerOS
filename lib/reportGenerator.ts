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
  lines.push("COMPREHENSIVE SEO/AEO AUDIT REPORT");
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
    lines.push("");
    lines.push("This audit evaluates your website across the 5 pillars of SEO:");
    lines.push("  1. Technical SEO - Crawlability, indexability, site speed, mobile");
    lines.push("  2. On-Page SEO - Content quality, keywords, structure, metadata");
    lines.push("  3. Off-Page SEO - Backlinks, authority, brand mentions");
    lines.push("  4. User Experience - Core Web Vitals, usability, engagement");
    lines.push("  5. Content Strategy - Relevance, depth, freshness, topical authority");
  }
  lines.push("");

  // Core Issues - Organized by SEO Pillar
  if (data.structuredAudit?.core_issues && Array.isArray(data.structuredAudit.core_issues)) {
    lines.push("─".repeat(80));
    lines.push("CORE ISSUES & FINDINGS");
    lines.push("─".repeat(80));

    // Group issues by category/pillar
    const issuesByCategory: Record<string, any[]> = {};
    data.structuredAudit.core_issues.forEach((issue: any) => {
      const cat = issue.category || "Other";
      if (!issuesByCategory[cat]) issuesByCategory[cat] = [];
      issuesByCategory[cat].push(issue);
    });

    // Display grouped issues
    Object.entries(issuesByCategory).forEach(([category, issues]) => {
      lines.push(`\n▶ ${category.toUpperCase()}`);
      lines.push("  " + "─".repeat(76));
      issues.forEach((issue: any, idx: number) => {
        lines.push(`  ${idx + 1}. [${issue.severity}] ${issue.category || category}`);
        lines.push(`     Business Impact: ${issue.business_impact}`);
        if (Array.isArray(issue.symptoms) && issue.symptoms.length > 0) {
          lines.push("     Specific Issues:");
          issue.symptoms.forEach((symptom: string) => {
            lines.push(`       • ${symptom}`);
          });
        }
        lines.push("");
      });
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

  // Content Playbook
  if (data.structuredAudit?.content_playbook) {
    lines.push("─".repeat(80));
    lines.push("CONTENT STRATEGY & PLAYBOOK");
    lines.push("─".repeat(80));
    const playbook = data.structuredAudit.content_playbook;
    if (playbook.positioning_statement) {
      lines.push(`Positioning: ${playbook.positioning_statement}`);
    }
    if (Array.isArray(playbook.key_messaging_pillars) && playbook.key_messaging_pillars.length > 0) {
      lines.push("\nKey Messaging Pillars:");
      playbook.key_messaging_pillars.forEach((pillar: string) => {
        lines.push(`  • ${pillar}`);
      });
    }
    if (Array.isArray(playbook.content_pillars) && playbook.content_pillars.length > 0) {
      lines.push("\nContent Pillars (Topic Clusters):");
      playbook.content_pillars.forEach((pillar: string) => {
        lines.push(`  • ${pillar}`);
      });
    }
    if (playbook.target_persona) {
      lines.push(`\nTarget Persona: ${playbook.target_persona.summary || "N/A"}`);
      if (Array.isArray(playbook.target_persona.pain_points)) {
        lines.push("Pain Points:");
        playbook.target_persona.pain_points.forEach((pain: string) => {
          lines.push(`  • ${pain}`);
        });
      }
    }
    lines.push("");
  }

  // Quick Wins (48-hour actions)
  if (data.structuredAudit?.quick_wins_48h && Array.isArray(data.structuredAudit.quick_wins_48h)) {
    lines.push("─".repeat(80));
    lines.push("QUICK WINS (48-HOUR ACTIONS)");
    lines.push("─".repeat(80));
    lines.push("These are high-impact, low-effort changes you can implement immediately:\n");
    data.structuredAudit.quick_wins_48h.forEach((win: any, idx: number) => {
      lines.push(`${idx + 1}. ${win.action}`);
      lines.push(`   Impact Score: ${win.impact_score || "N/A"}/10`);
      lines.push(`   Effort Level: ${win.effort_level || "N/A"}`);
      lines.push("");
    });
  }

  // 30/60/90 Roadmap
  if (data.structuredAudit?.roadmap_30_60_90) {
    lines.push("─".repeat(80));
    lines.push("30/60/90 DAY ROADMAP");
    lines.push("─".repeat(80));
    const roadmap = data.structuredAudit.roadmap_30_60_90;

    if (roadmap["30_days"]) {
      lines.push(`\n30 DAYS: ${roadmap["30_days"].theme || "Phase 1"}`);
      if (Array.isArray(roadmap["30_days"].initiatives)) {
        roadmap["30_days"].initiatives.forEach((init: string) => {
          lines.push(`  • ${init}`);
        });
      }
    }

    if (roadmap["60_days"]) {
      lines.push(`\n60 DAYS: ${roadmap["60_days"].theme || "Phase 2"}`);
      if (Array.isArray(roadmap["60_days"].initiatives)) {
        roadmap["60_days"].initiatives.forEach((init: string) => {
          lines.push(`  • ${init}`);
        });
      }
    }

    if (roadmap["90_days"]) {
      lines.push(`\n90 DAYS: ${roadmap["90_days"].theme || "Phase 3"}`);
      if (Array.isArray(roadmap["90_days"].initiatives)) {
        roadmap["90_days"].initiatives.forEach((init: string) => {
          lines.push(`  • ${init}`);
        });
      }
    }
    lines.push("");
  }

  // Investment Outlook
  if (data.structuredAudit?.investment_outlook) {
    lines.push("─".repeat(80));
    lines.push("INVESTMENT OUTLOOK & BUDGET");
    lines.push("─".repeat(80));
    const outlook = data.structuredAudit.investment_outlook;
    lines.push(`Recommended Budget: ${outlook.recommended_budget_range || outlook.budget || "N/A"}`);
    lines.push(`Projected ROI: ${outlook.projected_roi || outlook.roi || "N/A"}`);
    if (outlook.notes) lines.push(`Strategic Notes: ${outlook.notes}`);
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
  lines.push("# Comprehensive SEO/AEO Audit Report");
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
    lines.push("");
    lines.push("### The 5 Pillars of SEO");
    lines.push("This audit evaluates your website across:");
    lines.push("1. **Technical SEO** - Crawlability, indexability, site speed, mobile");
    lines.push("2. **On-Page SEO** - Content quality, keywords, structure, metadata");
    lines.push("3. **Off-Page SEO** - Backlinks, authority, brand mentions");
    lines.push("4. **User Experience** - Core Web Vitals, usability, engagement");
    lines.push("5. **Content Strategy** - Relevance, depth, freshness, topical authority");
  }
  lines.push("");

  // Core Issues - Organized by Pillar
  if (data.structuredAudit?.core_issues && Array.isArray(data.structuredAudit.core_issues)) {
    lines.push("## Core Issues & Findings");

    // Group issues by category
    const issuesByCategory: Record<string, any[]> = {};
    data.structuredAudit.core_issues.forEach((issue: any) => {
      const cat = issue.category || "Other";
      if (!issuesByCategory[cat]) issuesByCategory[cat] = [];
      issuesByCategory[cat].push(issue);
    });

    // Display grouped issues
    Object.entries(issuesByCategory).forEach(([category, issues]) => {
      lines.push(`### ${category}`);
      issues.forEach((issue: any) => {
        lines.push(`#### [${issue.severity}] ${issue.category || category}`);
        lines.push(`${issue.business_impact}`);
        if (Array.isArray(issue.symptoms) && issue.symptoms.length > 0) {
          lines.push("**Specific Issues:**");
          issue.symptoms.forEach((symptom: string) => {
            lines.push(`- ${symptom}`);
          });
        }
        lines.push("");
      });
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

  // Content Playbook
  if (data.structuredAudit?.content_playbook) {
    lines.push("## Content Strategy & Playbook");
    const playbook = data.structuredAudit.content_playbook;
    if (playbook.positioning_statement) {
      lines.push(`**Positioning:** ${playbook.positioning_statement}`);
      lines.push("");
    }
    if (Array.isArray(playbook.key_messaging_pillars) && playbook.key_messaging_pillars.length > 0) {
      lines.push("### Key Messaging Pillars");
      playbook.key_messaging_pillars.forEach((pillar: string) => {
        lines.push(`- ${pillar}`);
      });
      lines.push("");
    }
    if (Array.isArray(playbook.content_pillars) && playbook.content_pillars.length > 0) {
      lines.push("### Content Pillars (Topic Clusters)");
      playbook.content_pillars.forEach((pillar: string) => {
        lines.push(`- ${pillar}`);
      });
      lines.push("");
    }
    if (playbook.target_persona) {
      lines.push("### Target Persona");
      lines.push(`${playbook.target_persona.summary || "N/A"}`);
      if (Array.isArray(playbook.target_persona.pain_points)) {
        lines.push("**Pain Points:**");
        playbook.target_persona.pain_points.forEach((pain: string) => {
          lines.push(`- ${pain}`);
        });
      }
      lines.push("");
    }
  }

  // Quick Wins
  if (data.structuredAudit?.quick_wins_48h && Array.isArray(data.structuredAudit.quick_wins_48h)) {
    lines.push("## Quick Wins (48-Hour Actions)");
    lines.push("High-impact, low-effort changes you can implement immediately:");
    lines.push("");
    data.structuredAudit.quick_wins_48h.forEach((win: any, idx: number) => {
      lines.push(`${idx + 1}. **${win.action}**`);
      lines.push(`   - Impact Score: ${win.impact_score || "N/A"}/10`);
      lines.push(`   - Effort Level: ${win.effort_level || "N/A"}`);
      lines.push("");
    });
  }

  // 30/60/90 Roadmap
  if (data.structuredAudit?.roadmap_30_60_90) {
    lines.push("## 30/60/90 Day Roadmap");
    const roadmap = data.structuredAudit.roadmap_30_60_90;

    if (roadmap["30_days"]) {
      lines.push(`### 30 Days: ${roadmap["30_days"].theme || "Phase 1"}`);
      if (Array.isArray(roadmap["30_days"].initiatives)) {
        roadmap["30_days"].initiatives.forEach((init: string) => {
          lines.push(`- ${init}`);
        });
      }
      lines.push("");
    }

    if (roadmap["60_days"]) {
      lines.push(`### 60 Days: ${roadmap["60_days"].theme || "Phase 2"}`);
      if (Array.isArray(roadmap["60_days"].initiatives)) {
        roadmap["60_days"].initiatives.forEach((init: string) => {
          lines.push(`- ${init}`);
        });
      }
      lines.push("");
    }

    if (roadmap["90_days"]) {
      lines.push(`### 90 Days: ${roadmap["90_days"].theme || "Phase 3"}`);
      if (Array.isArray(roadmap["90_days"].initiatives)) {
        roadmap["90_days"].initiatives.forEach((init: string) => {
          lines.push(`- ${init}`);
        });
      }
      lines.push("");
    }
  }

  // Investment Outlook
  if (data.structuredAudit?.investment_outlook) {
    lines.push("## Investment Outlook & Budget");
    const outlook = data.structuredAudit.investment_outlook;
    lines.push(`- **Recommended Budget:** ${outlook.recommended_budget_range || outlook.budget || "N/A"}`);
    lines.push(`- **Projected ROI:** ${outlook.projected_roi || outlook.roi || "N/A"}`);
    if (outlook.notes) lines.push(`- **Strategic Notes:** ${outlook.notes}`);
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

