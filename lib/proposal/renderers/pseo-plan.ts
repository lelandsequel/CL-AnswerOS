// lib/proposal/renderers/pseo-plan.ts
// Renders PSEO_PLAN.md

import { ProposalConfig } from "../config";
import { PSEOPlan } from "../pseo-planner";
import { formatDate, getDomain } from "../utils";

export function renderPSEOPlan(
  config: ProposalConfig,
  pseoData: PSEOPlan
): string {
  const domain = getDomain(config.website_url);
  const lines: string[] = [];

  lines.push("# pSEO Strategy: Programmatic SEO Plan");
  lines.push("");
  lines.push(`**Company:** ${config.company_name}`);
  lines.push(`**Domain:** ${domain}`);
  lines.push(`**Industry:** ${config.industry}`);
  lines.push(`**Date:** ${formatDate()}`);
  lines.push("");

  lines.push("## What is pSEO?");
  lines.push("");
  lines.push(
    "Programmatic SEO (pSEO) uses templates and data to generate hundreds or thousands"
  );
  lines.push(
    "of optimized landing pages automatically. This is ideal for scaling content across:"
  );
  lines.push("- Geographic markets");
  lines.push("- Product variations");
  lines.push("- Industry verticals");
  lines.push("- Customer segments");
  lines.push("");

  lines.push("## Page Types & Strategy");
  lines.push("");

  pseoData.pageTypes.forEach((pageType, idx) => {
    lines.push(`### ${idx + 1}. ${pageType.name}`);
    lines.push("");
    lines.push(`**Description:** ${pageType.description}`);
    lines.push(`**URL Pattern:** \`${pageType.urlPattern}\``);
    lines.push(`**Estimated Pages:** ${pageType.estimatedCount}`);
    lines.push("");

    lines.push("**Template Outline:**");
    pageType.templateOutline.forEach((section) => {
      lines.push(`- ${section}`);
    });
    lines.push("");

    lines.push("**Required Data Fields:**");
    pageType.requiredDataFields.forEach((field) => {
      lines.push(`- \`${field}\``);
    });
    lines.push("");
  });

  lines.push("## Data Source Setup");
  lines.push("");
  lines.push(`**Recommendation:** ${pseoData.dataSourceRecommendation}`);
  lines.push("");
  lines.push("### Example Data Structure");
  lines.push("```");
  lines.push("location_name | state | market_size | local_team | case_studies");
  lines.push("New York     | NY    | $2.5B       | 5 people   | 12 deals");
  lines.push("Los Angeles  | CA    | $3.1B       | 8 people   | 18 deals");
  lines.push("Chicago      | IL    | $1.8B       | 3 people   | 8 deals");
  lines.push("```");
  lines.push("");

  lines.push("## Scale Estimate");
  lines.push("");
  lines.push(`**Total Estimated Pages:** ${pseoData.totalEstimatedPages}`);
  lines.push(`**Implementation Timeline:** ${pseoData.implementationTimeline}`);
  lines.push(`**Scaling Strategy:** ${pseoData.scalingStrategy}`);
  lines.push("");

  lines.push("## Implementation Steps");
  lines.push("");
  lines.push("1. **Build Data Source** - Create spreadsheet with all required fields");
  lines.push("2. **Create Template** - Design page template with dynamic placeholders");
  lines.push("3. **Set Up Generation** - Configure build process to generate pages");
  lines.push("4. **Test & Validate** - QA 5-10 pages before full launch");
  lines.push("5. **Deploy & Monitor** - Launch pages and track performance");
  lines.push("6. **Iterate** - Refine template based on performance data");
  lines.push("");

  lines.push("## Expected Outcomes");
  lines.push("");
  lines.push("- **Traffic:** 30-50% increase in organic traffic (6 months)");
  lines.push("- **Rankings:** 200+ new keyword rankings");
  lines.push("- **Leads:** 2-3x increase in qualified leads");
  lines.push("- **Cost:** Minimal ongoing cost (mostly data maintenance)");
  lines.push("");

  return lines.join("\n");
}

