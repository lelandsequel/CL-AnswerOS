/**
 * Asset Mapper - Converts saved audit assets to form data for pSEO and Deck Outline
 *
 * DETERMINISTIC: Prefers explicit structured fields, falls back to inference only if missing
 */

import type { ClientAsset } from './types';

export interface StructuredFields {
  company_name?: string;
  website_url?: string;
  industry?: string;
  geography?: string;
  services?: string[];
  target_customer?: string;
  core_issues?: any[];
  quick_wins?: any[];
  aeo_opportunities?: any[];
  seo_opportunities?: any[];
}

export interface AuditAssetPayload {
  url: string;
  rawScan: string;
  structuredAudit: any;
  keywordMetrics?: any;
  structuredFields?: StructuredFields; // NEW: Explicit fields
  metadata?: {
    demo?: boolean;
    demo_key?: string;
    demo_created_at?: string;
  };
}

export interface PseoFormData {
  company_name: string;
  website_url: string;
  industry: string;
  geography: string;
  services: string;
  target_customer: string;
  notes: string;
  locations: string;
  loan_programs: string;
  asset_classes: string;
  use_cases: string;
}

export interface DeckOutlineFormData {
  company_name: string;
  website_url: string;
  industry: string;
  current_challenges: string;
  target_outcomes: string;
  budget_range: string;
  timeline: string;
}

/**
 * Extract company name from audit asset
 * Prefers explicit field, falls back to title/domain inference
 */
function extractCompanyName(asset: ClientAsset, structured?: StructuredFields): string {
  // DETERMINISTIC: Prefer explicit field
  if (structured?.company_name) return structured.company_name;

  const payload = asset.payload as AuditAssetPayload;

  // Try to extract from title (e.g., "Audit – https://rockspring.com")
  if (asset.title) {
    const match = asset.title.match(/Audit\s*–\s*(.+)/);
    if (match) {
      const domain = match[1].trim();
      // Convert domain to company name (e.g., rockspring.com -> Rockspring)
      return domain
        .replace(/^https?:\/\/(www\.)?/, '')
        .split('.')[0]
        .replace(/[-_]/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    }
  }

  return '';
}

/**
 * Extract industry from structured audit
 * Prefers explicit field, falls back to inference
 */
function extractIndustry(payload: AuditAssetPayload, structured?: StructuredFields): string {
  // DETERMINISTIC: Prefer explicit field
  if (structured?.industry) return structured.industry;

  if (!payload.structuredAudit) return '';

  const audit = payload.structuredAudit;

  // Look for industry hints in overview or content
  if (audit.overview?.industry) return audit.overview.industry;
  if (audit.industry) return audit.industry;

  // Try to infer from content
  const content = JSON.stringify(audit).toLowerCase();
  if (content.includes('real estate') || content.includes('bridge loan')) return 'Real Estate Finance';
  if (content.includes('fintech')) return 'Financial Technology';
  if (content.includes('saas')) return 'SaaS';

  return '';
}

/**
 * Extract geography from structured audit
 */
function extractGeography(payload: AuditAssetPayload, structured?: StructuredFields): string {
  // DETERMINISTIC: Prefer explicit field
  if (structured?.geography) return structured.geography;

  if (!payload.structuredAudit) return '';

  const audit = payload.structuredAudit;

  // Look for geography in overview
  if (audit.overview?.geography) return audit.overview.geography;
  if (audit.geography) return audit.geography;

  return '';
}

/**
 * Extract services from structured audit
 */
function extractServices(payload: AuditAssetPayload, structured?: StructuredFields): string[] {
  // DETERMINISTIC: Prefer explicit field
  if (structured?.services && Array.isArray(structured.services)) {
    return structured.services;
  }

  if (!payload.structuredAudit) return [];

  const audit = payload.structuredAudit;

  // Look for services in content_playbook
  if (audit.content_playbook?.content_pillars && Array.isArray(audit.content_playbook.content_pillars)) {
    return audit.content_playbook.content_pillars.slice(0, 5);
  }

  return [];
}

/**
 * Extract target customer from structured audit
 */
function extractTargetCustomer(payload: AuditAssetPayload, structured?: StructuredFields): string {
  // DETERMINISTIC: Prefer explicit field
  if (structured?.target_customer) return structured.target_customer;

  if (!payload.structuredAudit) return '';

  const audit = payload.structuredAudit;

  // Look for target persona
  if (audit.content_playbook?.target_persona?.summary) {
    return audit.content_playbook.target_persona.summary;
  }

  return '';
}

/**
 * Extract challenges from audit for deck outline
 */
function extractChallenges(payload: AuditAssetPayload, structured?: StructuredFields): string[] {
  // DETERMINISTIC: Prefer explicit field
  if (structured?.core_issues && Array.isArray(structured.core_issues)) {
    return structured.core_issues
      .slice(0, 5)
      .map((issue: any) => issue.title || issue.issue || issue.category || '');
  }

  if (!payload.structuredAudit) return [];

  const audit = payload.structuredAudit;
  const challenges: string[] = [];

  // Extract from core issues
  if (Array.isArray(audit.core_issues)) {
    audit.core_issues.forEach((issue: any) => {
      if (issue.title || issue.issue) {
        challenges.push(issue.title || issue.issue);
      }
    });
  }

  return challenges.slice(0, 5); // Limit to 5
}

/**
 * Extract opportunities from audit for deck outline
 */
function extractOpportunities(payload: AuditAssetPayload, structured?: StructuredFields): string[] {
  // DETERMINISTIC: Prefer explicit fields
  const opportunities: string[] = [];

  if (structured?.aeo_opportunities && Array.isArray(structured.aeo_opportunities)) {
    structured.aeo_opportunities.forEach((opp: any) => {
      if (opp.focus || opp.title || opp.opportunity) {
        opportunities.push(opp.focus || opp.title || opp.opportunity);
      }
    });
  }

  if (structured?.quick_wins && Array.isArray(structured.quick_wins)) {
    structured.quick_wins.forEach((win: any) => {
      if (win.action || win.title || win.win) {
        opportunities.push(win.action || win.title || win.win);
      }
    });
  }

  if (opportunities.length > 0) return opportunities.slice(0, 5);

  // Fallback to inference
  if (!payload.structuredAudit) return [];

  const audit = payload.structuredAudit;

  // Extract from AEO opportunities
  if (Array.isArray(audit.aeo_opportunities)) {
    audit.aeo_opportunities.forEach((opp: any) => {
      if (opp.title || opp.opportunity) {
        opportunities.push(opp.title || opp.opportunity);
      }
    });
  }

  // Extract from quick wins
  if (Array.isArray(audit.quick_wins_48h)) {
    audit.quick_wins_48h.forEach((win: any) => {
      if (win.title || win.win) {
        opportunities.push(win.title || win.win);
      }
    });
  }

  return opportunities.slice(0, 5); // Limit to 5
}

/**
 * Convert audit asset to pSEO form data
 * DETERMINISTIC: Uses structured fields when available
 */
export function auditAssetToPseoForm(asset: ClientAsset): Partial<PseoFormData> {
  const payload = asset.payload as AuditAssetPayload;
  const structured = payload.structuredFields;

  return {
    company_name: extractCompanyName(asset, structured),
    website_url: structured?.website_url || payload.url || '',
    industry: extractIndustry(payload, structured),
    geography: extractGeography(payload, structured),
    services: structured?.services ? structured.services.join(', ') : '',
    target_customer: extractTargetCustomer(payload, structured),
    notes: asset.summary || '',
  };
}

/**
 * Convert audit asset to deck outline form data
 * DETERMINISTIC: Uses structured fields when available
 */
export function auditAssetToDeckOutlineForm(asset: ClientAsset): Partial<DeckOutlineFormData> {
  const payload = asset.payload as AuditAssetPayload;
  const structured = payload.structuredFields;

  const challenges = extractChallenges(payload, structured);
  const opportunities = extractOpportunities(payload, structured);

  return {
    company_name: extractCompanyName(asset, structured),
    website_url: structured?.website_url || payload.url || '',
    industry: extractIndustry(payload, structured),
    current_challenges: challenges.join('\n'),
    target_outcomes: opportunities.join('\n'),
  };
}

