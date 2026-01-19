// lib/proposal/renderers/proposal-deck.ts
// Renders PROPOSAL_DECK_OUTLINE.md (17 slides)

import { ProposalConfig } from "../config";
import { AuditFindings } from "../audit-adapter";
import { PSEOPlan } from "../pseo-planner";
import { formatDate, getDomain } from "../utils";

export function renderProposalDeck(
  config: ProposalConfig,
  findings: AuditFindings,
  pseoData: PSEOPlan
): string {
  const domain = getDomain(config.website_url);
  const lines: string[] = [];

  lines.push("# Proposal Deck Outline: Growth + Trust Blueprint");
  lines.push("");
  lines.push(`**For:** ${config.company_name}`);
  lines.push(`**Date:** ${formatDate()}`);
  lines.push(`**Prepared by:** C&L Strategy`);
  lines.push("");
  lines.push("---");
  lines.push("");

  // Slide 1: Cover
  lines.push("## Slide 1: Cover");
  lines.push("");
  lines.push("**Title:** Growth + Trust Blueprint for " + config.company_name);
  lines.push("**Subtitle:** SEO + AEO + pSEO Plan (90 Days)");
  lines.push("**Footer:** Prepared by C&L Strategy");
  lines.push("");
  lines.push("**Speaker Notes:**");
  lines.push(
    "Welcome the client. Set expectations: this is a comprehensive 90-day plan to improve"
  );
  lines.push(
    "visibility, trust, and lead generation through SEO, AEO, and programmatic SEO."
  );
  lines.push("");
  lines.push("**Suggested Visual:** Company logo + growth chart");
  lines.push("");
  lines.push("---");
  lines.push("");

  // Slide 2: Executive Summary
  lines.push("## Slide 2: Executive Summary");
  lines.push("");
  lines.push("**Bullets:**");
  lines.push("- **Current State:** Website has strong foundation but missing key optimization");
  lines.push("- **What's Broken:** Technical issues, content gaps, no AEO strategy");
  lines.push("- **What We're Fixing:** 5-pillar SEO, AEO schema, 50+ pSEO pages");
  lines.push("");
  lines.push("**Outcome Snapshot:**");
  lines.push("- Speed: +40% improvement in Core Web Vitals");
  lines.push("- Visibility: +200 new keyword rankings");
  lines.push("- Leads: +2-3x increase in qualified inquiries");
  lines.push("");
  lines.push("**Speaker Notes:**");
  lines.push(
    "This slide sets the stage. We're not just fixing problems—we're building a growth engine."
  );
  lines.push("");
  lines.push("**Suggested Visual:** 3-column layout (Current / Issues / Solution)");
  lines.push("");
  lines.push("---");
  lines.push("");

  // Slide 3: What We Found
  lines.push("## Slide 3: What We Found");
  lines.push("");
  lines.push("**Top 10 Issues (Prioritized):**");
  const allIssues = [
    ...findings.technicalIssues.slice(0, 2),
    ...findings.contentGaps.slice(0, 2),
    ...findings.authorityGaps.slice(0, 2),
    ...findings.uxIssues.slice(0, 2),
    ...findings.aeoOpportunities.slice(0, 2),
  ];
  allIssues.slice(0, 10).forEach((issue, idx) => {
    const severity = idx < 3 ? "🔴 Critical" : idx < 6 ? "🟠 High" : "🟡 Medium";
    lines.push(`${idx + 1}. ${severity} - ${issue}`);
  });
  lines.push("");
  lines.push("**Speaker Notes:**");
  lines.push(
    "Walk through each issue. Explain why it matters. Connect to business impact."
  );
  lines.push("");
  lines.push("**Suggested Visual:** Severity gauge or heat map");
  lines.push("");
  lines.push("---");
  lines.push("");

  // Slide 4: Why This Matters
  lines.push("## Slide 4: Why This Matters");
  lines.push("");
  lines.push("**Impact:**");
  lines.push("- **Lost Traffic:** 30-40% of potential organic traffic");
  lines.push("- **Lost Trust:** Poor UX signals hurt conversion rates");
  lines.push("- **Lost Conversions:** Missing content = missed opportunities");
  lines.push("");
  lines.push("**Business Impact:**");
  lines.push("- Competitors ranking for your keywords");
  lines.push("- Customers can't find you in AI search results");
  lines.push("- Lead quality and volume suffering");
  lines.push("");
  lines.push("**Speaker Notes:**");
  lines.push(
    "Make it personal. Show how these issues directly impact revenue and growth."
  );
  lines.push("");
  lines.push("**Suggested Visual:** Revenue impact chart");
  lines.push("");
  lines.push("---");
  lines.push("");

  // Slide 5: Definitions
  lines.push("## Slide 5: Definitions (Simple)");
  lines.push("");
  lines.push("**SEO = Rank + Capture Demand**");
  lines.push("- Get your website to rank for keywords your customers search");
  lines.push("- Capture the demand that already exists");
  lines.push("");
  lines.push("**AEO = Win Answer Surfaces**");
  lines.push("- Appear in AI search results (ChatGPT, Google AI Overviews)");
  lines.push("- Win voice search and assistant queries");
  lines.push("- Provide clear, structured answers");
  lines.push("");
  lines.push("**pSEO = Scale Landing Pages**");
  lines.push("- Generate 50-500+ optimized pages from templates + data");
  lines.push("- Cover every market, product, and customer segment");
  lines.push("- Minimal ongoing effort");
  lines.push("");
  lines.push("**Speaker Notes:**");
  lines.push("Keep it simple. Use analogies if needed.");
  lines.push("");
  lines.push("**Suggested Visual:** 3 icons representing each pillar");
  lines.push("");
  lines.push("---");
  lines.push("");

  // Slides 6-10: SEO Pillars (condensed)
  const pillars = [
    {
      name: "Technical",
      issues: findings.technicalIssues,
      kpi: "Core Web Vitals / Indexation / Errors",
    },
    {
      name: "On-Page",
      issues: ["Titles/H1s not optimized", "Meta descriptions missing"],
      kpi: "Keyword rankings / CTR",
    },
    {
      name: "Content",
      issues: findings.contentGaps,
      kpi: "Pages indexed / Keyword coverage",
    },
    {
      name: "Authority",
      issues: findings.authorityGaps,
      kpi: "Backlinks / Domain authority",
    },
    {
      name: "UX/Conversion",
      issues: findings.uxIssues,
      kpi: "Conversion rate / Lead quality",
    },
  ];

  pillars.forEach((pillar, idx) => {
    lines.push(`## Slide ${6 + idx}: SEO Pillar ${idx + 1} — ${pillar.name}`);
    lines.push("");
    lines.push("**Before:**");
    pillar.issues.slice(0, 2).forEach((issue) => {
      lines.push(`- ${issue}`);
    });
    lines.push("");
    lines.push("**Fixes:**");
    lines.push("- [Specific action 1]");
    lines.push("- [Specific action 2]");
    lines.push("- [Specific action 3]");
    lines.push("");
    lines.push(`**KPI:** ${pillar.kpi}`);
    lines.push("");
    lines.push("**Speaker Notes:**");
    lines.push("Explain the pillar. Show before/after. Connect to business outcome.");
    lines.push("");
    lines.push("**Suggested Visual:** Before/after comparison");
    lines.push("");
    lines.push("---");
    lines.push("");
  });

  // Slide 11: AEO Strategy
  lines.push("## Slide 11: AEO Strategy");
  lines.push("");
  lines.push("**Entity Definition:**");
  lines.push(`- **Who:** ${config.company_name}`);
  lines.push(`- **What:** ${config.offer}`);
  lines.push(`- **Where:** ${config.geography}`);
  lines.push("");
  lines.push("**Schema Plan:**");
  lines.push("- Organization schema (who you are)");
  lines.push("- Service schema (what you offer)");
  lines.push("- FAQ schema (common questions)");
  lines.push("");
  lines.push("**Answer Targets:**");
  findings.aeoOpportunities.slice(0, 3).forEach((opp) => {
    lines.push(`- ${opp}`);
  });
  lines.push("");
  lines.push("**Speaker Notes:**");
  lines.push(
    "AEO is the future. AI is already answering questions. We need to be in those answers."
  );
  lines.push("");
  lines.push("**Suggested Visual:** AI search result mockup");
  lines.push("");
  lines.push("---");
  lines.push("");

  // Slide 12: pSEO Strategy
  lines.push("## Slide 12: pSEO Strategy");
  lines.push("");
  lines.push("**Page Types:**");
  pseoData.pageTypes.slice(0, 3).forEach((pt) => {
    lines.push(`- ${pt.name} (${pt.estimatedCount} pages)`);
  });
  lines.push("");
  lines.push("**Data Source:** Google Sheet or Airtable");
  lines.push("**URL Patterns:** /markets/{location}, /services/{service}, etc.");
  lines.push("");
  lines.push(`**Scale Estimate:** ${pseoData.totalEstimatedPages} pages in ${pseoData.implementationTimeline}`);
  lines.push("");
  lines.push("**Speaker Notes:**");
  lines.push(
    "pSEO is the growth lever. Instead of writing 100 pages, we write 1 template and generate 100."
  );
  lines.push("");
  lines.push("**Suggested Visual:** Template + data = pages diagram");
  lines.push("");
  lines.push("---");
  lines.push("");

  // Slide 13: Before / After
  lines.push("## Slide 13: Before / After");
  lines.push("");
  lines.push("**Today:**");
  lines.push("- Limited visibility in search");
  lines.push("- Missing from AI search results");
  lines.push("- Inconsistent lead quality");
  lines.push("");
  lines.push("**After Implementation:**");
  lines.push("- Ranking for 200+ keywords");
  lines.push("- Appearing in AI Overviews");
  lines.push("- 2-3x more qualified leads");
  lines.push("");
  lines.push("**Speaker Notes:**");
  lines.push("Paint the picture. Show the transformation.");
  lines.push("");
  lines.push("**Suggested Visual:** Split-screen before/after");
  lines.push("");
  lines.push("---");
  lines.push("");

  // Slide 14: 90-Day Implementation Plan
  lines.push("## Slide 14: 90-Day Implementation Plan");
  lines.push("");
  lines.push("**Week 1-2: Foundation**");
  lines.push("- Technical SEO fixes");
  lines.push("- Tracking & analytics setup");
  lines.push("");
  lines.push("**Week 3-6: Content & AEO**");
  lines.push("- On-page optimization");
  lines.push("- Schema markup implementation");
  lines.push("- FAQ page creation");
  lines.push("");
  lines.push("**Week 7-12: pSEO Launch**");
  lines.push("- Build data source");
  lines.push("- Create page templates");
  lines.push("- Generate and launch pages");
  lines.push("");
  lines.push("**Speaker Notes:**");
  lines.push("Walk through the timeline. Set expectations for each phase.");
  lines.push("");
  lines.push("**Suggested Visual:** Gantt chart or timeline");
  lines.push("");
  lines.push("---");
  lines.push("");

  // Slide 15: Measurement & Reporting
  lines.push("## Slide 15: Measurement & Reporting");
  lines.push("");
  lines.push("**KPIs We Track:**");
  lines.push("- Organic impressions & clicks");
  lines.push("- Keyword rankings");
  lines.push("- Lead volume & quality");
  lines.push("- Conversion rate");
  lines.push("");
  lines.push("**Reporting Cadence:**");
  lines.push("- Weekly check-in (15 min)");
  lines.push("- Monthly report (detailed analysis)");
  lines.push("");
  lines.push("**Speaker Notes:**");
  lines.push("Transparency builds trust. We report on what matters to your business.");
  lines.push("");
  lines.push("**Suggested Visual:** Dashboard mockup");
  lines.push("");
  lines.push("---");
  lines.push("");

  // Slide 16: What You Get
  lines.push("## Slide 16: What You Get");
  lines.push("");
  lines.push("**Deliverables:**");
  lines.push("- SEO Audit (5 pillars)");
  lines.push("- AEO Audit (schema plan)");
  lines.push("- pSEO Plan (page templates)");
  lines.push("- Implementation Blueprint (copy/paste code)");
  lines.push("- Monthly reports (90 days)");
  lines.push("");
  lines.push("**Speaker Notes:**");
  lines.push("We don't just advise—we deliver actionable, implementable work.");
  lines.push("");
  lines.push("**Suggested Visual:** Checklist or package contents");
  lines.push("");
  lines.push("---");
  lines.push("");

  // Slide 17: Next Steps
  lines.push("## Slide 17: Next Steps");
  lines.push("");
  lines.push("**To Get Started:**");
  lines.push("1. Approve scope and timeline");
  lines.push("2. Kickoff meeting (30 min)");
  lines.push("3. Access checklist (website access, analytics, etc.)");
  lines.push("4. Week 1 begins");
  lines.push("");
  lines.push("**Questions?**");
  lines.push("");
  lines.push("**Speaker Notes:**");
  lines.push("Close strong. Ask for the commitment. Provide next steps.");
  lines.push("");
  lines.push("**Suggested Visual:** CTA button or contact info");
  lines.push("");

  return lines.join("\n");
}

