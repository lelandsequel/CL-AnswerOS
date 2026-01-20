/**
 * Deterministic demo payload for one-click demo
 * Same output every run (no randomness, no external API calls)
 * Includes metadata for idempotent asset reuse
 */

import type { AuditAssetPayload, StructuredFields } from '@/lib/asset-mapper';

export const DEMO_KEY = 'rockspring_v1';

export function getDemoAuditPayload(): AuditAssetPayload {
  const structuredFields: StructuredFields = {
    company_name: 'Rockspring Capital',
    website_url: 'https://rockspring.com',
    industry: 'Real Estate Finance',
    geography: 'US, California',
    services: ['Bridge Loans', 'Fix & Flip Financing', 'Construction Loans'],
    target_customer: 'Real Estate Investors & Developers',
    core_issues: [
      'Low organic visibility for "bridge loans near me"',
      'Competitors ranking for "fix and flip financing"',
      'Limited content on loan programs and eligibility',
      'No FAQ content addressing investor pain points',
    ],
    quick_wins: [
      'Create "Bridge Loan Calculator" tool',
      'Add FAQ page for common investor questions',
      'Optimize existing loan program pages for keywords',
      'Create case study content showing successful deals',
    ],
    aeo_opportunities: [
      'Build scalable landing pages for each loan type',
      'Create investor education hub with 50+ pages',
      'Implement structured data for loan products',
      'Build comparison pages (bridge vs traditional loans)',
    ],
  };

  return {
    url: 'https://rockspring.com',
    metadata: {
      demo: true,
      demo_key: DEMO_KEY,
      demo_created_at: new Date().toISOString(),
    },
    rawScan: `
# Rockspring Capital - SEO Audit

## Overview
- Domain: rockspring.com
- Industry: Real Estate Finance
- Current Ranking Keywords: ~150
- Organic Traffic Estimate: ~2,500/month

## Core Issues
${structuredFields.core_issues?.map(issue => `- ${issue}`).join('\n')}

## Quick Wins (48h)
${structuredFields.quick_wins?.map(win => `- ${win}`).join('\n')}

## AEO Opportunities
${structuredFields.aeo_opportunities?.map(opp => `- ${opp}`).join('\n')}
    `.trim(),
    structuredAudit: {
      summary: 'Rockspring Capital is a real estate finance company with strong market position but limited organic visibility.',
      overview: {
        industry: 'Real Estate Finance',
        geography: 'US, California',
        company_name: 'Rockspring Capital',
      },
      core_issues: structuredFields.core_issues,
      quick_wins_48h: structuredFields.quick_wins,
      aeo_opportunities: structuredFields.aeo_opportunities,
      content_playbook: {
        content_pillars: structuredFields.services,
        target_persona: {
          summary: structuredFields.target_customer,
        },
      },
    },
    structuredFields,
  };
}

/**
 * Get demo payload with optional overrides (for testing)
 */
export function getDemoAuditPayloadWithOverrides(overrides?: Partial<StructuredFields>): AuditAssetPayload {
  const payload = getDemoAuditPayload();
  if (overrides) {
    payload.structuredFields = {
      ...payload.structuredFields,
      ...overrides,
    };
  }
  return payload;
}

