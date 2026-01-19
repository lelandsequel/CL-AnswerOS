/**
 * Asset Mapper - Converts saved audit assets to form data for pSEO and Deck Outline
 */

import type { ClientAsset } from './types';

export interface AuditAssetPayload {
  url: string;
  rawScan: string;
  structuredAudit: any;
  keywordMetrics?: any;
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
 */
function extractCompanyName(asset: ClientAsset): string {
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
 */
function extractIndustry(payload: AuditAssetPayload): string {
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
 * Extract challenges from audit for deck outline
 */
function extractChallenges(payload: AuditAssetPayload): string[] {
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
function extractOpportunities(payload: AuditAssetPayload): string[] {
  if (!payload.structuredAudit) return [];
  
  const audit = payload.structuredAudit;
  const opportunities: string[] = [];
  
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
 */
export function auditAssetToPseoForm(asset: ClientAsset): Partial<PseoFormData> {
  const payload = asset.payload as AuditAssetPayload;
  
  return {
    company_name: extractCompanyName(asset),
    website_url: payload.url || '',
    industry: extractIndustry(payload),
    target_customer: '',
    notes: asset.summary || '',
  };
}

/**
 * Convert audit asset to deck outline form data
 */
export function auditAssetToDeckOutlineForm(asset: ClientAsset): Partial<DeckOutlineFormData> {
  const payload = asset.payload as AuditAssetPayload;
  const challenges = extractChallenges(payload);
  const opportunities = extractOpportunities(payload);
  
  return {
    company_name: extractCompanyName(asset),
    website_url: payload.url || '',
    industry: extractIndustry(payload),
    current_challenges: challenges.join('\n'),
    target_outcomes: opportunities.join('\n'),
  };
}

