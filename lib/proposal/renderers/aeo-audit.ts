// lib/proposal/renderers/aeo-audit.ts
// Renders AEO_AUDIT.md

import { ProposalConfig } from "../config";
import { AuditFindings } from "../audit-adapter";
import { formatDate, getDomain } from "../utils";

export function renderAEOAudit(
  config: ProposalConfig,
  findings: AuditFindings
): string {
  const domain = getDomain(config.website_url);
  const lines: string[] = [];

  lines.push("# AEO Audit: Answer Engine Optimization");
  lines.push("");
  lines.push(`**Company:** ${config.company_name}`);
  lines.push(`**Domain:** ${domain}`);
  lines.push(`**Industry:** ${config.industry}`);
  lines.push(`**Date:** ${formatDate()}`);
  lines.push("");

  lines.push("## What is AEO?");
  lines.push("");
  lines.push(
    "Answer Engine Optimization (AEO) prepares your content for AI-powered search results,"
  );
  lines.push(
    "including ChatGPT, Google's AI Overviews, and voice assistants. It focuses on:"
  );
  lines.push("- Clear, concise answers to common questions");
  lines.push("- Structured data (schema markup)");
  lines.push("- Entity recognition and relationships");
  lines.push("- FAQ optimization");
  lines.push("");

  lines.push("## Entity Definition");
  lines.push("");
  lines.push("### Who You Are");
  lines.push(`**${config.company_name}** is a ${config.industry} company.`);
  lines.push("");
  lines.push("### What You Do");
  lines.push(`**Offer:** ${config.offer}`);
  lines.push("");
  lines.push("### Who You Serve");
  lines.push(`**Target Customer:** ${config.target_customer}`);
  lines.push("");
  lines.push("### Brand Voice");
  lines.push(`**Tone:** ${config.brand_voice}`);
  lines.push("");

  lines.push("## Schema Markup Plan");
  lines.push("");
  lines.push("### Required Schema Types");
  lines.push("");
  lines.push("#### 1. Organization Schema");
  lines.push("```json");
  lines.push("{");
  lines.push('  "@context": "https://schema.org",');
  lines.push('  "@type": "Organization",');
  lines.push(`  "name": "${config.company_name}",`);
  lines.push(`  "url": "${config.website_url}",`);
  lines.push('  "description": "' + config.offer + '",');
  lines.push('  "areaServed": "' + config.geography + '"');
  lines.push("}");
  lines.push("```");
  lines.push("");

  lines.push("#### 2. Service Schema");
  lines.push("Add for each service/product offering:");
  lines.push("```json");
  lines.push("{");
  lines.push('  "@type": "Service",');
  lines.push('  "name": "[Service Name]",');
  lines.push('  "description": "[Service Description]",');
  lines.push('  "provider": {');
  lines.push(`    "@type": "Organization",`);
  lines.push(`    "name": "${config.company_name}"`);
  lines.push("  }");
  lines.push("}");
  lines.push("```");
  lines.push("");

  lines.push("#### 3. FAQ Schema");
  lines.push("Add for FAQ pages:");
  lines.push("```json");
  lines.push("{");
  lines.push('  "@type": "FAQPage",');
  lines.push('  "mainEntity": [');
  lines.push("    {");
  lines.push('      "@type": "Question",');
  lines.push('      "name": "[Question]",');
  lines.push('      "acceptedAnswer": {');
  lines.push('        "@type": "Answer",');
  lines.push('        "text": "[Answer]"');
  lines.push("      }");
  lines.push("    }");
  lines.push("  ]");
  lines.push("}");
  lines.push("```");
  lines.push("");

  lines.push("## Answer Surface Opportunities");
  lines.push("");
  lines.push("### AI-Friendly Content");
  findings.aeoOpportunities.forEach((opp) => {
    lines.push(`- ${opp}`);
  });
  lines.push("");

  lines.push("## FAQ Targets");
  lines.push("");
  lines.push("Create FAQ pages targeting these question types:");
  lines.push("- **What is...?** - Define your service/product");
  lines.push("- **How does...?** - Explain your process");
  lines.push("- **Why choose...?** - Differentiation");
  lines.push("- **How much does...?** - Pricing/cost");
  lines.push("- **Where do you...?** - Service areas");
  lines.push("");

  lines.push("## Implementation Priority");
  lines.push("");
  lines.push("1. **Week 1:** Add Organization + Service schema");
  lines.push("2. **Week 2:** Create FAQ page with FAQ schema");
  lines.push("3. **Week 3:** Optimize existing content for AI");
  lines.push("4. **Week 4:** Monitor AI Overview appearances");
  lines.push("");

  return lines.join("\n");
}

