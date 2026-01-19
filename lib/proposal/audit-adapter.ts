// lib/proposal/audit-adapter.ts
// Adapter to generate audit data for proposal (reuses LLM audit logic)

import { ProposalConfig } from "./config";

export interface AuditFindings {
  technicalIssues: string[];
  contentGaps: string[];
  authorityGaps: string[];
  uxIssues: string[];
  aeoOpportunities: string[];
  topPriorities: string[];
}

export async function generateAuditFindings(
  config: ProposalConfig
): Promise<AuditFindings> {
  // For now, use deterministic defaults (no LLM call needed for offline mode)
  // This ensures fast, reproducible output
  return getDefaultAuditFindings(config);
}

function getDefaultAuditFindings(config: ProposalConfig): AuditFindings {
  return {
    technicalIssues: [
      "Core Web Vitals not optimized (LCP > 2.5s)",
      "Mobile responsiveness issues on key pages",
      "Missing XML sitemap or robots.txt",
    ],
    contentGaps: [
      `Missing service/product comparison pages`,
      `No location-specific landing pages for key markets`,
      `Insufficient FAQ content for common questions`,
    ],
    authorityGaps: [
      `Limited backlink profile for industry keywords`,
      `Missing industry citations and directory listings`,
      `No thought leadership content or bylined articles`,
    ],
    uxIssues: [
      `Lead capture form not optimized for conversion`,
      `Unclear value proposition above the fold`,
      `Navigation doesn't highlight key services`,
    ],
    aeoOpportunities: [
      `Add FAQ schema for common questions`,
      `Create entity schema (Organization, Service)`,
      `Optimize for "near me" and local queries`,
    ],
    topPriorities: [
      `Fix Core Web Vitals and mobile performance`,
      `Build location/service landing page template`,
      `Implement FAQ and schema markup`,
    ],
  };
}

