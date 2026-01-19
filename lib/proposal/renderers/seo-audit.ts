// lib/proposal/renderers/seo-audit.ts
// Renders SEO_AUDIT.md

import { ProposalConfig } from "../config";
import { AuditFindings } from "../audit-adapter";
import { formatDate, getDomain } from "../utils";

export function renderSEOAudit(
  config: ProposalConfig,
  findings: AuditFindings
): string {
  const domain = getDomain(config.website_url);
  const lines: string[] = [];

  lines.push("# SEO Audit: 5 Pillars Analysis");
  lines.push("");
  lines.push(`**Company:** ${config.company_name}`);
  lines.push(`**Domain:** ${domain}`);
  lines.push(`**Industry:** ${config.industry}`);
  lines.push(`**Date:** ${formatDate()}`);
  lines.push("");

  // Executive Summary
  lines.push("## Executive Summary");
  lines.push("");
  lines.push(
    "This audit evaluates your website across the 5 pillars of SEO:"
  );
  lines.push("1. **Technical SEO** - Crawlability, indexability, speed, mobile");
  lines.push("2. **On-Page SEO** - Content quality, keywords, structure, metadata");
  lines.push("3. **Off-Page SEO** - Backlinks, authority, brand mentions");
  lines.push("4. **User Experience** - Core Web Vitals, usability, engagement");
  lines.push("5. **Content Strategy** - Relevance, depth, freshness, topical authority");
  lines.push("");

  // Top Priorities
  lines.push("## Top Priorities (What to Do Next)");
  lines.push("");
  findings.topPriorities.forEach((priority, idx) => {
    lines.push(`${idx + 1}. **${priority}**`);
  });
  lines.push("");

  // Pillar 1: Technical
  lines.push("## Pillar 1: Technical SEO");
  lines.push("");
  lines.push("### Current State");
  lines.push(
    "Your website has several technical issues affecting crawlability and indexability."
  );
  lines.push("");
  lines.push("### Issues Found");
  findings.technicalIssues.forEach((issue) => {
    lines.push(`- ${issue}`);
  });
  lines.push("");
  lines.push("### Recommended Fixes");
  lines.push("- Optimize Core Web Vitals (LCP, FID, CLS)");
  lines.push("- Ensure mobile-first indexing");
  lines.push("- Create and submit XML sitemap");
  lines.push("- Fix crawl errors and broken links");
  lines.push("- Implement proper redirects (301)");
  lines.push("");

  // Pillar 2: On-Page
  lines.push("## Pillar 2: On-Page SEO");
  lines.push("");
  lines.push("### Current State");
  lines.push("On-page optimization needs improvement for target keywords.");
  lines.push("");
  lines.push("### Issues Found");
  lines.push("- Inconsistent title tag optimization");
  lines.push("- H1 tags not aligned with target keywords");
  lines.push("- Meta descriptions missing or too short");
  lines.push("- Internal linking structure not optimized");
  lines.push("");
  lines.push("### Recommended Fixes");
  lines.push("- Optimize title tags (50-60 characters, keyword-first)");
  lines.push("- Create unique H1 per page with target keyword");
  lines.push("- Write compelling meta descriptions (150-160 chars)");
  lines.push("- Build internal linking strategy");
  lines.push("");

  // Pillar 3: Content
  lines.push("## Pillar 3: Content Strategy");
  lines.push("");
  lines.push("### Content Gaps");
  findings.contentGaps.forEach((gap) => {
    lines.push(`- ${gap}`);
  });
  lines.push("");
  lines.push("### Recommended Content");
  lines.push("- Service/product comparison pages");
  lines.push("- Location-specific landing pages");
  lines.push("- FAQ pages for common questions");
  lines.push("- Industry-specific resource pages");
  lines.push("- Case studies and success stories");
  lines.push("");

  // Pillar 4: Authority
  lines.push("## Pillar 4: Authority & Trust");
  lines.push("");
  lines.push("### Authority Gaps");
  findings.authorityGaps.forEach((gap) => {
    lines.push(`- ${gap}`);
  });
  lines.push("");
  lines.push("### Recommended Actions");
  lines.push("- Build local citations and directory listings");
  lines.push("- Develop thought leadership content");
  lines.push("- Pursue industry partnerships and mentions");
  lines.push("- Create bylined articles on industry publications");
  lines.push("");

  // Pillar 5: UX
  lines.push("## Pillar 5: User Experience & Conversion");
  lines.push("");
  lines.push("### UX Issues");
  findings.uxIssues.forEach((issue) => {
    lines.push(`- ${issue}`);
  });
  lines.push("");
  lines.push("### Recommended Improvements");
  lines.push("- Optimize lead capture forms");
  lines.push("- Improve CTA placement and messaging");
  lines.push("- Add trust signals (testimonials, certifications)");
  lines.push("- Implement conversion tracking");
  lines.push("");

  return lines.join("\n");
}

