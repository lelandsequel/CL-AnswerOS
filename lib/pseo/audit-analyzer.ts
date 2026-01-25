// lib/pseo/audit-analyzer.ts
// Analyzes StructuredAudit and recommends pSEO pages
// BBB Step 2: Audit → Opportunity Extraction

import { callLLMTask, safeParseJsonFromText } from '../llm';
import type { StructuredAudit } from '../types';
import type { DeepAuditResult, PillarAnalysis, AuditIssue } from '../audit-engine/types';
import type {
  AuditDerivedContext,
  pSEOPageRecommendation,
  PageFamilyType,
  PagePriority,
  pSEOPlan,
  GeneratePseoRequest,
  ISSUE_TO_PAGE_FAMILY,
} from './types';

// ============================================================================
// Context Extraction (Deterministic - No LLM)
// ============================================================================

/**
 * Extract pSEO-relevant context from a structured audit
 * This is deterministic - no LLM calls
 */
export function extractContextFromAudit(audit: StructuredAudit): AuditDerivedContext {
  const playbook = audit.content_playbook;
  const overview = audit.overview;

  // Extract company name from domain
  const domain = overview?.domain || '';
  const companyName = domain
    .replace(/^https?:\/\/(www\.)?/, '')
    .split('.')[0]
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  // Extract services from content pillars
  const services = playbook?.content_pillars || [];

  // Extract locations from positioning statement (if mentioned)
  const locations: string[] = [];
  const positioningText = playbook?.positioning_statement?.toLowerCase() || '';
  if (positioningText.includes('nationwide') || positioningText.includes('national')) {
    locations.push('United States');
  }

  // Infer industry from content pillars and positioning
  const combined = [
    ...(playbook?.content_pillars || []),
    ...(playbook?.key_messaging_pillars || []),
    playbook?.positioning_statement || '',
  ].join(' ').toLowerCase();

  let industry = 'Professional Services';
  if (combined.includes('loan') || combined.includes('finance') || combined.includes('lending')) {
    industry = 'Commercial Real Estate Finance';
  } else if (combined.includes('saas') || combined.includes('software')) {
    industry = 'SaaS';
  } else if (combined.includes('legal') || combined.includes('law')) {
    industry = 'Legal Services';
  } else if (combined.includes('health') || combined.includes('medical')) {
    industry = 'Healthcare';
  } else if (combined.includes('real estate') || combined.includes('property')) {
    industry = 'Real Estate';
  }

  // Determine brand voice
  let brandVoice: AuditDerivedContext['brandVoice'] = 'professional';
  if (combined.includes('friendly') || combined.includes('approachable')) {
    brandVoice = 'friendly';
  } else if (combined.includes('technical') || combined.includes('expert')) {
    brandVoice = 'technical';
  }

  // Find biggest gaps from issues
  const biggestGaps: string[] = [];
  const coreIssues = audit.core_issues || [];
  const criticalIssues = coreIssues
    .filter(i => i.severity === 'Critical' || i.severity === 'High')
    .slice(0, 5);
  for (const issue of criticalIssues) {
    biggestGaps.push(issue.category + ': ' + issue.symptoms.join(', '));
  }

  // Extract target customer from persona
  const targetCustomer = playbook?.target_persona?.summary || 'General consumers';

  return {
    companyName: companyName || 'Company',
    industry,
    services: [...new Set(services)],
    locations: [...new Set(locations)],
    targetCustomer,
    brandVoice,
    competitorMentions: [],
    currentSeoScore: overview?.raw_score ?? 50,
    currentAeoScore: 40, // AEO score not directly available in StructuredAudit
    biggestGaps,
  };
}

/**
 * Simplified issue for internal processing
 */
interface SimpleIssue {
  id: string;
  title: string;
  severity: string;
  description?: string;
}

/**
 * Collect all issues from all pillars in the audit
 */
function collectAllIssues(audit: StructuredAudit): SimpleIssue[] {
  const issues: SimpleIssue[] = [];

  // From core issues (StructuredAudit format)
  if (audit.core_issues) {
    for (const issue of audit.core_issues) {
      issues.push({
        id: `${issue.category.toLowerCase()}-${issues.length + 1}`,
        title: issue.symptoms[0] || issue.category,
        severity: issue.severity.toUpperCase(),
        description: issue.business_impact,
      });
    }
  }

  // From pillars (if deep audit format)
  const deepAudit = audit as unknown as DeepAuditResult;

  // Check SEO pillars
  if (deepAudit.seo) {
    for (const pillar of Object.values(deepAudit.seo)) {
      if (pillar && typeof pillar === 'object' && 'issues' in pillar) {
        const pillarIssues = (pillar as PillarAnalysis).issues || [];
        for (const issue of pillarIssues) {
          issues.push({
            id: issue.id,
            title: issue.title,
            severity: issue.severity,
            description: issue.description,
          });
        }
      }
    }
  }

  // Check AEO pillars
  if (deepAudit.aeo) {
    for (const pillar of Object.values(deepAudit.aeo)) {
      if (pillar && typeof pillar === 'object' && 'issues' in pillar) {
        const pillarIssues = (pillar as PillarAnalysis).issues || [];
        for (const issue of pillarIssues) {
          issues.push({
            id: issue.id,
            title: issue.title,
            severity: issue.severity,
            description: issue.description,
          });
        }
      }
    }
  }

  return issues;
}

// ============================================================================
// Rule-Based Page Recommendations
// ============================================================================

/**
 * Generate page recommendations based on audit issues (rule-based, no LLM)
 */
export function generateRuleBasedRecommendations(
  audit: StructuredAudit,
  context: AuditDerivedContext
): pSEOPageRecommendation[] {
  const recommendations: pSEOPageRecommendation[] = [];
  const allIssues = collectAllIssues(audit);
  let idCounter = 1;

  // Rule 1: FAQ gaps → faq_hub pages
  const faqIssues = allIssues.filter(i =>
    i.id.includes('faq') ||
    i.title.toLowerCase().includes('faq') ||
    i.title.toLowerCase().includes('question')
  );
  if (faqIssues.length > 0) {
    recommendations.push({
      id: `pseo-${idCounter++}`,
      family: 'faq_hub',
      title: `${context.industry} FAQ Hub`,
      targetUrl: '/faq',
      targetKeywords: [`${context.industry} faq`, `${context.companyName} questions`, 'frequently asked questions'],
      reason: `Audit identified ${faqIssues.length} FAQ-related issues. FAQ hubs are critical for AEO and voice search.`,
      sourceIssueIds: faqIssues.map(i => i.id),
      sourceOpportunityIds: [],
      dependsOnArtifacts: ['schema.organization'],
      priority: 'critical',
      expectedImpact: {
        traffic: 'medium',
        conversions: 'low',
        aeoVisibility: 'high',
      },
      variables: {
        topic: context.industry,
        brand: context.companyName,
      },
    });
  }

  // Rule 2: Schema gaps → service pages with proper schema
  const schemaIssues = allIssues.filter(i =>
    i.id.includes('schema') ||
    i.title.toLowerCase().includes('schema') ||
    i.title.toLowerCase().includes('structured data')
  );
  if (schemaIssues.length > 0 && context.services.length > 0) {
    for (const service of context.services.slice(0, 3)) {
      recommendations.push({
        id: `pseo-${idCounter++}`,
        family: 'service_page',
        title: `${service} Services`,
        targetUrl: `/services/${slugify(service)}`,
        targetKeywords: [service.toLowerCase(), `${service} services`, `${context.companyName} ${service}`],
        reason: `Missing Service schema identified. Creating dedicated service pages with proper markup.`,
        sourceIssueIds: schemaIssues.map(i => i.id),
        sourceOpportunityIds: [],
        dependsOnArtifacts: ['schema.organization', 'schema.website'],
        priority: 'high',
        expectedImpact: {
          traffic: 'high',
          conversions: 'high',
          aeoVisibility: 'medium',
        },
        variables: {
          service,
          brand: context.companyName,
        },
      });
    }
  }

  // Rule 3: Local SEO gaps → service_location pages
  const localIssues = allIssues.filter(i =>
    i.id.includes('local') ||
    i.title.toLowerCase().includes('local') ||
    i.title.toLowerCase().includes('location')
  );
  if (localIssues.length > 0 && context.locations.length > 0 && context.services.length > 0) {
    const topService = context.services[0];
    for (const location of context.locations.slice(0, 3)) {
      recommendations.push({
        id: `pseo-${idCounter++}`,
        family: 'service_location',
        title: `${topService} in ${location}`,
        targetUrl: `/services/${slugify(topService)}/${slugify(location)}`,
        targetKeywords: [
          `${topService} ${location}`,
          `${topService} near me`,
          `${location} ${topService}`,
        ],
        reason: `Local SEO gaps identified. Location-specific pages improve local search visibility.`,
        sourceIssueIds: localIssues.map(i => i.id),
        sourceOpportunityIds: [],
        dependsOnArtifacts: ['schema.localbusiness'],
        priority: 'high',
        expectedImpact: {
          traffic: 'high',
          conversions: 'high',
          aeoVisibility: 'medium',
        },
        variables: {
          service: topService,
          location,
          brand: context.companyName,
        },
      });
    }
  }

  // Rule 4: Voice search gaps → how_to pages
  const voiceIssues = allIssues.filter(i =>
    i.id.includes('voice') ||
    i.title.toLowerCase().includes('voice') ||
    i.title.toLowerCase().includes('speakable')
  );
  if (voiceIssues.length > 0) {
    recommendations.push({
      id: `pseo-${idCounter++}`,
      family: 'how_to',
      title: `How to Choose a ${context.industry} Provider`,
      targetUrl: `/guides/how-to-choose-${slugify(context.industry)}-provider`,
      targetKeywords: [
        `how to choose ${context.industry}`,
        `best ${context.industry}`,
        `${context.industry} guide`,
      ],
      reason: `Voice search optimization gaps found. How-to content targets conversational queries.`,
      sourceIssueIds: voiceIssues.map(i => i.id),
      sourceOpportunityIds: [],
      dependsOnArtifacts: ['schema.organization'],
      priority: 'high',
      expectedImpact: {
        traffic: 'medium',
        conversions: 'medium',
        aeoVisibility: 'high',
      },
      variables: {
        action: `Choose a ${context.industry} Provider`,
        brand: context.companyName,
      },
    });
  }

  // Rule 5: Content gaps → resource hub
  const contentIssues = allIssues.filter(i =>
    i.id.includes('content') ||
    i.title.toLowerCase().includes('content') ||
    i.title.toLowerCase().includes('thin')
  );
  if (contentIssues.length > 2) {
    recommendations.push({
      id: `pseo-${idCounter++}`,
      family: 'resource_hub',
      title: `${context.industry} Resources & Guides`,
      targetUrl: '/resources',
      targetKeywords: [
        `${context.industry} resources`,
        `${context.industry} guides`,
        `${context.industry} help`,
      ],
      reason: `Multiple content gaps identified. A resource hub consolidates authority and improves internal linking.`,
      sourceIssueIds: contentIssues.map(i => i.id),
      sourceOpportunityIds: [],
      dependsOnArtifacts: ['schema.website'],
      priority: 'medium',
      expectedImpact: {
        traffic: 'medium',
        conversions: 'low',
        aeoVisibility: 'medium',
      },
      variables: {
        topic: context.industry,
        brand: context.companyName,
      },
    });
  }

  // Rule 6: AI citation gaps → comparison pages
  const aiIssues = allIssues.filter(i =>
    i.id.includes('ai') ||
    i.title.toLowerCase().includes('ai citation') ||
    i.title.toLowerCase().includes('ai search')
  );
  if (aiIssues.length > 0 && context.competitorMentions.length > 0) {
    const competitor = context.competitorMentions[0];
    recommendations.push({
      id: `pseo-${idCounter++}`,
      family: 'comparison',
      title: `${context.companyName} vs ${competitor}`,
      targetUrl: `/compare/${slugify(context.companyName)}-vs-${slugify(competitor)}`,
      targetKeywords: [
        `${context.companyName} vs ${competitor}`,
        `${competitor} alternative`,
        `${context.companyName} comparison`,
      ],
      reason: `AI citation optimization needed. Comparison pages establish positioning and get cited by AI systems.`,
      sourceIssueIds: aiIssues.map(i => i.id),
      sourceOpportunityIds: [],
      dependsOnArtifacts: ['schema.organization'],
      priority: 'medium',
      expectedImpact: {
        traffic: 'medium',
        conversions: 'high',
        aeoVisibility: 'high',
      },
      variables: {
        optionA: context.companyName,
        optionB: competitor,
        year: new Date().getFullYear().toString(),
        brand: context.companyName,
      },
    });
  }

  return recommendations;
}

// ============================================================================
// LLM-Enhanced Page Strategy
// ============================================================================

/**
 * Use LLM to generate intelligent page recommendations based on audit
 * Falls back to rule-based if LLM fails
 */
export async function analyzeAuditForPseo(input: {
  structuredAudit: StructuredAudit;
  rawScanHtml?: string;
  keywordMetrics?: Array<{ keyword: string; volume: number; difficulty: number }>;
}): Promise<pSEOPageRecommendation[]> {
  const context = extractContextFromAudit(input.structuredAudit);
  const allIssues = collectAllIssues(input.structuredAudit);

  const prompt = `You are an SEO strategist analyzing an audit to recommend programmatic SEO pages.

## Company Context
- Company: ${context.companyName}
- Industry: ${context.industry}
- Services: ${context.services.join(', ') || 'Not specified'}
- Locations: ${context.locations.join(', ') || 'National/Online'}
- Target Customer: ${context.targetCustomer}
- Current SEO Score: ${context.currentSeoScore}/100
- Current AEO Score: ${context.currentAeoScore}/100

## Audit Issues (Top 10)
${allIssues.slice(0, 10).map(i => `- [${i.severity}] ${i.title}: ${i.description || ''}`).join('\n')}

## Biggest Gaps
${context.biggestGaps.map(g => `- ${g}`).join('\n')}

${input.keywordMetrics ? `
## Keyword Opportunities
${input.keywordMetrics.slice(0, 10).map(k => `- "${k.keyword}" (vol: ${k.volume}, diff: ${k.difficulty})`).join('\n')}
` : ''}

## Task
Recommend 5-10 programmatic pages to generate. For each page:
1. Choose the best page family type
2. Explain WHY this page addresses audit gaps
3. Prioritize based on impact

## Page Family Types
- faq_hub: FAQ collection pages (great for AEO/voice)
- service_page: Individual service landing pages
- service_location: Service + location combinations
- comparison: "X vs Y" pages
- how_to: Step-by-step guides (featured snippets)
- glossary: Definition pages
- case_study: Results-focused pages
- pricing: Cost/pricing pages
- resource_hub: Pillar content pages

## Return JSON
{
  "recommendations": [
    {
      "family": "faq_hub",
      "title": "Page Title",
      "targetUrl": "/suggested/url",
      "targetKeywords": ["keyword1", "keyword2"],
      "reason": "Why this page based on audit findings",
      "priority": "critical|high|medium|low",
      "expectedImpact": {
        "traffic": "low|medium|high",
        "conversions": "low|medium|high",
        "aeoVisibility": "low|medium|high"
      }
    }
  ]
}`;

  try {
    const result = await callLLMTask({
      task: 'pseo_strategy',
      prompt,
      expectJson: true,
    });

    const parsed = result.raw?.parsedJson || safeParseJsonFromText(result.text);
    if (!parsed?.recommendations || !Array.isArray(parsed.recommendations)) {
      throw new Error('LLM returned invalid response format');
    }

    // Convert LLM output to full recommendations with IDs and dependencies
    let idCounter = 1;
    return parsed.recommendations.map((rec: any) => ({
      id: `pseo-${idCounter++}`,
      family: rec.family as PageFamilyType,
      title: rec.title,
      targetUrl: rec.targetUrl,
      targetKeywords: rec.targetKeywords || [],
      reason: rec.reason,
      sourceIssueIds: mapReasonToIssueIds(rec.reason, allIssues),
      sourceOpportunityIds: [],
      dependsOnArtifacts: inferDependencies(rec.family),
      priority: rec.priority as PagePriority,
      expectedImpact: rec.expectedImpact || {
        traffic: 'medium',
        conversions: 'medium',
        aeoVisibility: 'medium',
      },
      variables: {
        brand: context.companyName,
      },
    }));
  } catch (error) {
    // IMPORTANT: Per BBB spec, we throw error instead of silent fallback
    // This surfaces the failure to the user
    throw new Error(
      `Failed to analyze audit for pSEO strategy: ${error instanceof Error ? error.message : 'Unknown error'}. ` +
      `All LLM providers failed. Please try again or use manual mode.`
    );
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function mapReasonToIssueIds(reason: string, issues: SimpleIssue[]): string[] {
  const matchedIds: string[] = [];
  const reasonLower = reason.toLowerCase();

  for (const issue of issues) {
    const titleLower = issue.title.toLowerCase();
    // Simple keyword matching
    const keywords = titleLower.split(/\s+/);
    for (const keyword of keywords) {
      if (keyword.length > 4 && reasonLower.includes(keyword)) {
        matchedIds.push(issue.id);
        break;
      }
    }
  }

  return [...new Set(matchedIds)].slice(0, 3);
}

function inferDependencies(family: PageFamilyType): string[] {
  const deps: string[] = ['schema.organization'];

  switch (family) {
    case 'service_page':
    case 'service_location':
      deps.push('schema.service');
      break;
    case 'faq_hub':
      deps.push('content.faq');
      break;
    case 'service_location':
      deps.push('schema.localbusiness');
      break;
  }

  return deps;
}

// ============================================================================
// Main Export: Build Full pSEO Plan
// ============================================================================

/**
 * Build a complete pSEO plan from audit data
 */
export async function buildPseoPlan(request: GeneratePseoRequest): Promise<pSEOPlan> {
  const hasValidAudit = request.structuredAudit &&
    !request.structuredAudit.parsingFallback;

  if (!hasValidAudit && !request.companyName) {
    throw new Error('Either a valid structured audit or company name is required');
  }

  // Extract context
  const context: AuditDerivedContext = hasValidAudit
    ? extractContextFromAudit(request.structuredAudit!)
    : {
        companyName: request.companyName!,
        industry: request.industry || 'General',
        services: request.services || [],
        locations: request.locations || [],
        targetCustomer: 'General consumers',
        brandVoice: 'professional',
        competitorMentions: [],
        currentSeoScore: 50,
        currentAeoScore: 40,
        biggestGaps: [],
      };

  // Get recommendations
  let recommendations: pSEOPageRecommendation[];

  if (request.useAuditDrivenStrategy && hasValidAudit) {
    // LLM-driven strategy
    recommendations = await analyzeAuditForPseo({
      structuredAudit: request.structuredAudit!,
      rawScanHtml: request.rawScanHtml,
      keywordMetrics: request.keywordMetrics,
    });
  } else if (hasValidAudit) {
    // Rule-based from audit
    recommendations = generateRuleBasedRecommendations(
      request.structuredAudit!,
      context
    );
  } else {
    // Manual/deterministic mode
    recommendations = generateManualRecommendations(context, request);
  }

  // Apply max pages limit
  if (request.maxPages && recommendations.length > request.maxPages) {
    recommendations = recommendations.slice(0, request.maxPages);
  }

  // Group into families
  const familyCounts = new Map<PageFamilyType, number>();
  for (const rec of recommendations) {
    familyCounts.set(rec.family, (familyCounts.get(rec.family) || 0) + 1);
  }

  // Build phases based on dependencies
  const phases = buildImplementationPhases(recommendations);

  // Determine strategy focus
  const focus = request.focus || determineStrategyFocus(context);

  return {
    id: `pseo-plan-${Date.now()}`,
    createdAt: new Date().toISOString(),
    sourceAuditId: request.structuredAudit?.overview?.domain,
    auditContext: context,
    strategy: {
      focus,
      reasoning: generateStrategyReasoning(context, focus),
      totalPagesRecommended: recommendations.length,
      estimatedTimeToImplement: estimateImplementationTime(recommendations.length),
    },
    families: Array.from(familyCounts.entries()).map(([type, count]) => ({
      type,
      count,
      priority: getFamilyPriority(type, context),
      rationale: getFamilyRationale(type, context),
    })),
    templates: [], // Templates are generated separately
    recommendations,
    phases,
    nextActions: generateNextActions(recommendations, context),
  };
}

function generateManualRecommendations(
  context: AuditDerivedContext,
  request: GeneratePseoRequest
): pSEOPageRecommendation[] {
  const recommendations: pSEOPageRecommendation[] = [];
  let idCounter = 1;

  // Basic service pages
  for (const service of context.services.slice(0, 5)) {
    recommendations.push({
      id: `pseo-${idCounter++}`,
      family: 'service_page',
      title: `${service} Services`,
      targetUrl: `/services/${slugify(service)}`,
      targetKeywords: [service.toLowerCase()],
      reason: 'Standard service page for core offering.',
      sourceIssueIds: [],
      sourceOpportunityIds: [],
      dependsOnArtifacts: ['schema.organization'],
      priority: 'high',
      expectedImpact: {
        traffic: 'high',
        conversions: 'high',
        aeoVisibility: 'medium',
      },
      variables: { service, brand: context.companyName },
    });
  }

  // Basic FAQ page
  recommendations.push({
    id: `pseo-${idCounter++}`,
    family: 'faq_hub',
    title: `${context.industry} FAQ`,
    targetUrl: '/faq',
    targetKeywords: [`${context.industry} faq`],
    reason: 'Standard FAQ page for common questions.',
    sourceIssueIds: [],
    sourceOpportunityIds: [],
    dependsOnArtifacts: ['schema.organization'],
    priority: 'high',
    expectedImpact: {
      traffic: 'medium',
      conversions: 'low',
      aeoVisibility: 'high',
    },
    variables: { topic: context.industry, brand: context.companyName },
  });

  return recommendations;
}

function buildImplementationPhases(recommendations: pSEOPageRecommendation[]): pSEOPlan['phases'] {
  // Group by priority
  const critical = recommendations.filter(r => r.priority === 'critical');
  const high = recommendations.filter(r => r.priority === 'high');
  const medium = recommendations.filter(r => r.priority === 'medium');
  const low = recommendations.filter(r => r.priority === 'low');

  const phases: pSEOPlan['phases'] = [];

  if (critical.length > 0) {
    phases.push({
      phase: 1,
      name: 'Critical AEO Foundation',
      pageIds: critical.map(r => r.id),
      blockedBy: ['schema.organization'],
      estimatedImpact: { seoLift: 5, aeoLift: 15 },
    });
  }

  if (high.length > 0) {
    phases.push({
      phase: phases.length + 1,
      name: 'High-Impact Pages',
      pageIds: high.map(r => r.id),
      blockedBy: critical.length > 0 ? critical.map(r => r.id) : [],
      estimatedImpact: { seoLift: 10, aeoLift: 10 },
    });
  }

  if (medium.length > 0) {
    phases.push({
      phase: phases.length + 1,
      name: 'Authority Building',
      pageIds: medium.map(r => r.id),
      blockedBy: high.length > 0 ? high.slice(0, 2).map(r => r.id) : [],
      estimatedImpact: { seoLift: 8, aeoLift: 5 },
    });
  }

  if (low.length > 0) {
    phases.push({
      phase: phases.length + 1,
      name: 'Extended Coverage',
      pageIds: low.map(r => r.id),
      blockedBy: [],
      estimatedImpact: { seoLift: 5, aeoLift: 3 },
    });
  }

  return phases;
}

function determineStrategyFocus(context: AuditDerivedContext): 'aeo_first' | 'traffic_first' | 'balanced' {
  if (context.currentAeoScore < 40) return 'aeo_first';
  if (context.currentSeoScore < 50) return 'traffic_first';
  return 'balanced';
}

function generateStrategyReasoning(
  context: AuditDerivedContext,
  focus: 'aeo_first' | 'traffic_first' | 'balanced'
): string {
  switch (focus) {
    case 'aeo_first':
      return `Current AEO score (${context.currentAeoScore}) indicates significant gaps in AI/voice search optimization. ` +
        `Prioritizing FAQ hubs and how-to content to establish answer engine presence.`;
    case 'traffic_first':
      return `Current SEO score (${context.currentSeoScore}) shows room for traffic growth. ` +
        `Prioritizing service pages and location-based content for search visibility.`;
    case 'balanced':
      return `Scores are relatively balanced. Implementing a mix of traffic-driving and AEO-focused pages.`;
  }
}

function estimateImplementationTime(pageCount: number): string {
  if (pageCount <= 5) return '1-2 weeks';
  if (pageCount <= 10) return '2-4 weeks';
  if (pageCount <= 20) return '4-6 weeks';
  return '6+ weeks';
}

function getFamilyPriority(family: PageFamilyType, context: AuditDerivedContext): PagePriority {
  if (family === 'faq_hub' && context.currentAeoScore < 50) return 'critical';
  if (family === 'service_page') return 'high';
  if (family === 'service_location' && context.locations.length > 0) return 'high';
  return 'medium';
}

function getFamilyRationale(family: PageFamilyType, context: AuditDerivedContext): string {
  switch (family) {
    case 'faq_hub':
      return 'FAQ hubs are primary sources for AI answers and voice search responses.';
    case 'service_page':
      return 'Service pages capture high-intent search traffic and establish service schema.';
    case 'service_location':
      return 'Location-specific pages dominate local search and "near me" queries.';
    case 'comparison':
      return 'Comparison pages get cited by AI and capture competitor search traffic.';
    case 'how_to':
      return 'How-to guides target featured snippets and conversational voice queries.';
    default:
      return 'Additional content to build topical authority.';
  }
}

function generateNextActions(
  recommendations: pSEOPageRecommendation[],
  context: AuditDerivedContext
): pSEOPlan['nextActions'] {
  const actions: pSEOPlan['nextActions'] = [];

  // Check for schema dependencies
  if (recommendations.some(r => r.dependsOnArtifacts.includes('schema.organization'))) {
    actions.push({
      action: 'Implement Organization schema on homepage',
      priority: 'immediate',
    });
  }

  // First content action
  const firstPage = recommendations[0];
  if (firstPage) {
    actions.push({
      action: `Generate content for: ${firstPage.title}`,
      priority: 'immediate',
      dependsOn: ['schema.organization'],
    });
  }

  // Internal linking
  if (recommendations.length > 3) {
    actions.push({
      action: 'Plan internal linking structure between new pages',
      priority: 'soon',
    });
  }

  return actions;
}
