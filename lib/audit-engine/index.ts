// lib/audit-engine/index.ts
// Deep SEO/AEO Audit Engine - Main Orchestrator

import { startOnPageCrawl, waitForCrawl, getBacklinksSummary } from './dataforseo-client';
import { analyzeTechnicalSEO } from './analyzers/technical';
import { analyzeOnPageSEO } from './analyzers/on-page';
import {
  analyzeEntityDefinition,
  analyzeSchemaMarkup,
  analyzeFAQTargeting,
  analyzeVoiceSearch,
  analyzeAISearch,
} from './analyzers/aeo';
import type { DeepAuditResult, DeepAuditOptions, PillarAnalysis, AuditIssue } from './types';

export * from './types';

/**
 * Run a comprehensive deep SEO/AEO audit
 *
 * This is the main entry point for the audit engine.
 * It orchestrates all pillar analyses and generates the final report.
 */
export async function runDeepAudit(options: DeepAuditOptions): Promise<DeepAuditResult> {
  const { url, maxPages = 100 } = options;

  console.log(`[DeepAudit] Starting audit for ${url}`);
  const startTime = Date.now();

  // Parse URL
  const urlObj = new URL(url);
  const domain = urlObj.hostname.replace(/^www\./, '');
  const brandName = domain.split('.')[0].replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

  // Initialize result structure
  const result: DeepAuditResult = {
    url,
    domain,
    auditedAt: new Date().toISOString(),
    overallScore: 0,
    seoScore: 0,
    aeoScore: 0,
    seo: {
      technical: createEmptyPillar('Technical SEO'),
      onPage: createEmptyPillar('On-Page SEO'),
      content: createEmptyPillar('Content'),
      authority: createEmptyPillar('Authority'),
      ux: createEmptyPillar('UX'),
    },
    aeo: {
      entityDefinition: createEmptyPillar('Entity Definition'),
      schemaMarkup: createEmptyPillar('Schema Markup'),
      faqTargeting: createEmptyPillar('FAQ Targeting'),
      voiceSearch: createEmptyPillar('Voice Search'),
      aiSearch: createEmptyPillar('AI Search'),
    },
    rawData: {},
    actionPlan: {
      immediate: [],
      shortTerm: [],
      mediumTerm: [],
      longTerm: [],
    },
  };

  // =========================================================================
  // PHASE 1: Start On-Page Crawl (runs in background)
  // =========================================================================
  let taskId: string | null = null;
  let crawlSummary: Awaited<ReturnType<typeof waitForCrawl>> = null;

  try {
    console.log('[DeepAudit] Starting On-Page crawl...');
    taskId = await startOnPageCrawl(url, { maxPages });
    crawlSummary = await waitForCrawl(taskId, { maxWaitMs: 180000 });
    console.log('[DeepAudit] Crawl complete');
  } catch (error) {
    console.error('[DeepAudit] Crawl failed:', error);
    // Continue with what we can analyze
  }

  // =========================================================================
  // PHASE 2: Run SEO Analyses (parallel where possible)
  // =========================================================================

  // Technical SEO (uses crawl data)
  try {
    console.log('[DeepAudit] Analyzing Technical SEO...');
    const technicalResult = await analyzeTechnicalSEO(url, { maxPages });
    result.seo.technical = technicalResult.analysis;
    result.rawData.technical = technicalResult.rawData;
  } catch (error) {
    console.error('[DeepAudit] Technical analysis failed:', error);
  }

  // On-Page SEO (uses crawl data)
  if (taskId) {
    try {
      console.log('[DeepAudit] Analyzing On-Page SEO...');
      const onPageResult = await analyzeOnPageSEO(taskId, domain, brandName);
      result.seo.onPage = onPageResult.analysis;
      result.rawData.onPage = onPageResult.rawData;
    } catch (error) {
      console.error('[DeepAudit] On-Page analysis failed:', error);
    }
  }

  // Authority (Backlinks) - optional
  if (options.includeBacklinks) {
    try {
      console.log('[DeepAudit] Analyzing Authority...');
      const backlinks = await getBacklinksSummary(domain);
      if (backlinks) {
        result.seo.authority = analyzeBacklinksData(backlinks, domain);
        result.rawData.authority = {
          domainAuthority: backlinks.rank || 0,
          pageAuthority: 0,
          backlinks: {
            total: backlinks.backlinks || 0,
            referring_domains: backlinks.referring_domains || 0,
            dofollow: backlinks.referring_links_attributes?.dofollow || 0,
            nofollow: backlinks.referring_links_attributes?.nofollow || 0,
            toxic: 0,
          },
          topBacklinks: [],
          internalLinking: {
            averageInternalLinks: 0,
            orphanPages: [],
            hubPages: [],
          },
        };
      }
    } catch (error) {
      console.error('[DeepAudit] Authority analysis failed:', error);
    }
  }

  // Content & UX placeholders (would need more sophisticated analysis)
  result.seo.content = createContentPillarPlaceholder(brandName);
  result.seo.ux = createUXPillarPlaceholder();

  // =========================================================================
  // PHASE 3: Run AEO Analyses
  // =========================================================================
  const aeoInput = {
    url,
    domain,
    companyName: brandName,
    industry: 'Professional Services', // Would be inferred from content
    existingSchema: [],
  };

  try {
    console.log('[DeepAudit] Analyzing Entity Definition...');
    const entityResult = await analyzeEntityDefinition(aeoInput);
    result.aeo.entityDefinition = entityResult.analysis;
    result.rawData.entity = entityResult.rawData;
  } catch (error) {
    console.error('[DeepAudit] Entity analysis failed:', error);
  }

  try {
    console.log('[DeepAudit] Analyzing Schema Markup...');
    const schemaResult = await analyzeSchemaMarkup(aeoInput);
    result.aeo.schemaMarkup = schemaResult.analysis;
    result.rawData.schema = schemaResult.rawData;
  } catch (error) {
    console.error('[DeepAudit] Schema analysis failed:', error);
  }

  try {
    console.log('[DeepAudit] Analyzing FAQ Targeting...');
    const faqResult = await analyzeFAQTargeting(aeoInput);
    result.aeo.faqTargeting = faqResult.analysis;
    result.rawData.faq = faqResult.rawData;
  } catch (error) {
    console.error('[DeepAudit] FAQ analysis failed:', error);
  }

  try {
    console.log('[DeepAudit] Analyzing Voice Search...');
    const voiceResult = await analyzeVoiceSearch(aeoInput);
    result.aeo.voiceSearch = voiceResult.analysis;
    result.rawData.voice = voiceResult.rawData;
  } catch (error) {
    console.error('[DeepAudit] Voice analysis failed:', error);
  }

  try {
    console.log('[DeepAudit] Analyzing AI Search...');
    const aiResult = await analyzeAISearch(aeoInput);
    result.aeo.aiSearch = aiResult.analysis;
  } catch (error) {
    console.error('[DeepAudit] AI analysis failed:', error);
  }

  // =========================================================================
  // PHASE 4: Calculate Scores & Generate Action Plan
  // =========================================================================

  // Calculate SEO score (average of pillar scores)
  const seoScores = [
    result.seo.technical.score,
    result.seo.onPage.score,
    result.seo.content.score,
    result.seo.authority.score,
    result.seo.ux.score,
  ];
  result.seoScore = Math.round(seoScores.reduce((a, b) => a + b, 0) / seoScores.length);

  // Calculate AEO score
  const aeoScores = [
    result.aeo.entityDefinition.score,
    result.aeo.schemaMarkup.score,
    result.aeo.faqTargeting.score,
    result.aeo.voiceSearch.score,
    result.aeo.aiSearch.score,
  ];
  result.aeoScore = Math.round(aeoScores.reduce((a, b) => a + b, 0) / aeoScores.length);

  // Overall score (weighted)
  result.overallScore = Math.round(result.seoScore * 0.6 + result.aeoScore * 0.4);

  // Generate action plan
  result.actionPlan = generateActionPlan(result);

  const duration = Date.now() - startTime;
  console.log(`[DeepAudit] Complete in ${duration}ms. Score: ${result.overallScore}/100`);

  return result;
}

/**
 * Generate prioritized action plan from all issues
 */
function generateActionPlan(result: DeepAuditResult) {
  const allIssues: AuditIssue[] = [];

  // Collect all issues from all pillars
  for (const pillar of Object.values(result.seo)) {
    allIssues.push(...pillar.issues);
  }
  for (const pillar of Object.values(result.aeo)) {
    allIssues.push(...pillar.issues);
  }

  // Sort by severity
  const critical = allIssues.filter(i => i.severity === 'CRITICAL');
  const high = allIssues.filter(i => i.severity === 'HIGH');
  const medium = allIssues.filter(i => i.severity === 'MEDIUM');
  const low = allIssues.filter(i => i.severity === 'LOW');

  // Prioritize by effort within severity
  const sortByEffort = (issues: AuditIssue[]) => {
    return issues.sort((a, b) => {
      const effortOrder = { minutes: 0, hours: 1, days: 2 };
      return (effortOrder[a.fix.estimatedEffort] || 2) - (effortOrder[b.fix.estimatedEffort] || 2);
    });
  };

  return {
    immediate: sortByEffort([...critical, ...high.filter(i => i.fix.estimatedEffort === 'minutes')]),
    shortTerm: sortByEffort([...high.filter(i => i.fix.estimatedEffort !== 'minutes')]),
    mediumTerm: sortByEffort(medium),
    longTerm: sortByEffort(low),
  };
}

/**
 * Helper to create an empty pillar analysis
 */
function createEmptyPillar(name: string): PillarAnalysis {
  return {
    name,
    score: 50,
    status: 'needs-work',
    summary: 'Analysis pending.',
    currentState: {},
    issues: [],
    quickWins: [],
  };
}

/**
 * Analyze backlinks data
 */
function analyzeBacklinksData(
  data: Awaited<ReturnType<typeof getBacklinksSummary>>,
  domain: string
): PillarAnalysis {
  const issues: AuditIssue[] = [];

  if (!data) {
    return createEmptyPillar('Authority');
  }

  const referringDomains = data.referring_domains || 0;

  if (referringDomains < 50) {
    issues.push({
      id: 'authority-001',
      title: 'Low Domain Authority',
      description: `Only ${referringDomains} referring domains found. More backlinks needed.`,
      severity: 'HIGH',
      impact: 'Lower rankings for competitive keywords',
      currentState: `${referringDomains} referring domains`,
      fix: {
        type: 'instruction',
        title: 'Link Building Strategy',
        description: 'How to build more quality backlinks',
        content: `# Link Building Strategy

## Quick Wins
1. **Get listed on industry directories**
2. **Claim business profiles** (Google, Bing, Yelp)
3. **Partner/vendor link requests**

## Medium-Term
1. **Create linkable assets**
   - Industry reports
   - Tools/calculators
   - Original research

2. **Guest posting**
   - Industry publications
   - Local business blogs

3. **Digital PR**
   - Press releases for news
   - Expert commentary

## Outreach Template:
Subject: Collaboration opportunity with ${domain}

Hi [Name],

I came across your article on [topic] and thought
our [resource] might be valuable for your readers.

[Brief description of what you're offering]

Would you be open to including a mention?

Best,
[Your name]
`,
        estimatedEffort: 'days',
      },
    });
  }

  const score = Math.min(100, referringDomains * 2);

  return {
    name: 'Authority',
    score,
    status: score >= 70 ? 'good' : score >= 40 ? 'needs-work' : 'critical',
    summary: `Domain has ${referringDomains} referring domains.`,
    currentState: {
      referringDomains,
      backlinks: data.backlinks || 0,
      dofollow: data.referring_links_attributes?.dofollow || 0,
    },
    issues,
    quickWins: [],
  };
}

/**
 * Placeholder for content pillar (would need deeper analysis)
 */
function createContentPillarPlaceholder(brandName: string): PillarAnalysis {
  return {
    name: 'Content',
    score: 50,
    status: 'needs-work',
    summary: 'Content analysis requires manual review.',
    currentState: {
      estimatedPages: 'Unknown',
      hasBlog: 'Unknown',
      hasFAQ: 'Unknown',
    },
    issues: [
      {
        id: 'content-001',
        title: 'Content Strategy Review Needed',
        description: 'A comprehensive content audit should be performed to identify gaps and opportunities.',
        severity: 'MEDIUM',
        impact: 'May be missing topical coverage that competitors have',
        currentState: 'Content depth unknown',
        fix: {
          type: 'instruction',
          title: 'Content Audit Process',
          description: 'Steps to audit your content',
          content: `# Content Audit Process

## 1. Inventory All Content
- Export list of all pages
- Categorize by type (blog, service, landing)
- Note word count for each

## 2. Analyze Performance
- Check Google Analytics for traffic
- Check Search Console for rankings
- Identify top performers

## 3. Identify Gaps
- Compare to competitor content
- Find missing topics
- Look for thin content to expand

## 4. Create Action Plan
- Update high-value thin content
- Create missing topic clusters
- Consolidate duplicate content

## Recommended Tools:
- Screaming Frog (content inventory)
- Clearscope (content optimization)
- SurferSEO (content gap analysis)
`,
          estimatedEffort: 'days',
        },
      },
    ],
    quickWins: [],
  };
}

/**
 * Placeholder for UX pillar
 */
function createUXPillarPlaceholder(): PillarAnalysis {
  return {
    name: 'UX',
    score: 60,
    status: 'needs-work',
    summary: 'UX analysis performed via Core Web Vitals.',
    currentState: {
      mobileOptimized: 'Unknown',
      coreWebVitals: 'See Technical SEO',
    },
    issues: [],
    quickWins: [],
  };
}

/**
 * Convert deep audit to the legacy StructuredAudit format
 * for backward compatibility with pSEO generator
 */
export function deepAuditToStructuredAudit(deepAudit: DeepAuditResult) {
  const allIssues = deepAudit.actionPlan.immediate.concat(
    deepAudit.actionPlan.shortTerm,
    deepAudit.actionPlan.mediumTerm
  );

  return {
    summary: `Deep SEO/AEO audit for ${deepAudit.domain}. Overall score: ${deepAudit.overallScore}/100.`,
    overview: {
      domain: deepAudit.domain,
      industry: 'Professional Services',
      geography: 'United States',
      company_name: deepAudit.domain.split('.')[0].replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      current_state: `SEO Score: ${deepAudit.seoScore}/100, AEO Score: ${deepAudit.aeoScore}/100`,
    },
    core_issues: allIssues.slice(0, 10).map(issue => ({
      title: issue.title,
      severity: issue.severity,
      description: issue.description,
      recommendation: issue.fix.title,
    })),
    quick_wins_48h: deepAudit.actionPlan.immediate.slice(0, 5).map(issue => ({
      title: issue.title,
      impact: 'HIGH',
      effort: issue.fix.estimatedEffort.toUpperCase(),
    })),
    aeo_opportunities: Object.values(deepAudit.aeo)
      .flatMap(p => p.issues)
      .slice(0, 5)
      .map(issue => ({
        title: issue.title,
        description: issue.description,
        priority: issue.severity,
      })),
    content_playbook: {
      positioning_statement: `${deepAudit.domain} provides professional services.`,
      key_messaging_pillars: [],
      content_pillars: [],
      target_persona: {
        summary: 'Target customers seeking professional services.',
        pain_points: allIssues.slice(0, 3).map(i => i.impact),
      },
    },
  };
}
