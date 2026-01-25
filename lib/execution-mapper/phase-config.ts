// lib/execution-mapper/phase-config.ts
// Phase definitions, mappings, and dependency rules

import type {
  PhaseDefinition,
  PhaseMapping,
  DependencyRule,
  ExecutionPhase,
  FixClassification,
  ScoreImpact,
  BBBType,
} from './types';

/**
 * Phase definitions in execution order
 */
export const PHASE_DEFINITIONS: PhaseDefinition[] = [
  {
    id: 'entity-foundation',
    name: 'Entity Foundation',
    description: 'Establish organization identity and structured data foundation',
    order: 1,
    estimatedDuration: '1-2 days',
    prerequisites: [],
    bbbType: 'structural',  // Architecture: schema foundation
  },
  {
    id: 'technical-hygiene',
    name: 'Technical Hygiene',
    description: 'Fix fundamental technical SEO issues (meta, headings, images)',
    order: 2,
    estimatedDuration: '2-3 days',
    prerequisites: [],
    bbbType: 'mechanical',  // Copy-paste fixes: metas, alt text, H1s
  },
  {
    id: 'content-structure',
    name: 'Content Structure',
    description: 'Optimize content organization, internal linking, fill gaps',
    order: 3,
    estimatedDuration: '1-2 weeks',
    prerequisites: ['technical-hygiene'],
    bbbType: 'strategic',  // Requires content/messaging decisions
  },
  {
    id: 'answer-architecture',
    name: 'Answer Architecture',
    description: 'Build FAQ content, voice search optimization, featured snippet targeting',
    order: 4,
    estimatedDuration: '1-2 weeks',
    prerequisites: ['entity-foundation', 'content-structure'],
    bbbType: 'strategic',  // FAQ + AEO content requires operator input
  },
  {
    id: 'performance-optimization',
    name: 'Performance Optimization',
    description: 'Core Web Vitals, page speed, rendering optimization',
    order: 5,
    estimatedDuration: '3-5 days',
    prerequisites: ['technical-hygiene'],
    bbbType: 'structural',  // Architecture: rendering, caching, etc.
  },
  {
    id: 'authority-building',
    name: 'Authority Building',
    description: 'Backlink strategy, citation building, entity establishment',
    order: 6,
    estimatedDuration: 'Ongoing',
    prerequisites: ['entity-foundation', 'content-structure'],
    bbbType: 'strategic',  // Requires outreach/relationship decisions
  },
];

/**
 * Helper to create score impact
 */
function impact(
  pillars: { pillar: string; min: number; max: number }[],
  overallMin: number,
  overallMax: number
): ScoreImpact {
  return {
    pillars: pillars.map((p) => ({
      pillar: p.pillar,
      deltaMin: p.min,
      deltaMax: p.max,
    })),
    overallDeltaMin: overallMin,
    overallDeltaMax: overallMax,
  };
}

/**
 * Issue ID to phase/fix-type mappings
 */
export const PHASE_MAPPINGS: PhaseMapping[] = [
  // ==========================================================================
  // TECHNICAL SEO ISSUES
  // ==========================================================================
  {
    issueIdPattern: /^tech-001$/, // Missing robots.txt
    phase: 'technical-hygiene',
    fixType: 'mechanical',
    scoreImpact: impact(
      [{ pillar: 'Technical SEO', min: 5, max: 10 }],
      2, 5
    ),
  },
  {
    issueIdPattern: /^tech-002$/, // Missing sitemap
    phase: 'technical-hygiene',
    fixType: 'mechanical',
    scoreImpact: impact(
      [{ pillar: 'Technical SEO', min: 5, max: 10 }],
      2, 5
    ),
  },
  {
    issueIdPattern: /^tech-003$/, // No HTTPS
    phase: 'technical-hygiene',
    fixType: 'structural',
    scoreImpact: impact(
      [{ pillar: 'Technical SEO', min: 15, max: 25 }],
      5, 10
    ),
  },
  {
    issueIdPattern: /^tech-004$/, // Broken links
    phase: 'technical-hygiene',
    fixType: 'mechanical',
    scoreImpact: impact(
      [{ pillar: 'Technical SEO', min: 5, max: 15 }],
      2, 5
    ),
  },
  {
    issueIdPattern: /^tech-005$/, // Redirect loops
    phase: 'technical-hygiene',
    fixType: 'structural',
    scoreImpact: impact(
      [{ pillar: 'Technical SEO', min: 10, max: 20 }],
      3, 8
    ),
  },
  {
    issueIdPattern: /^tech-006$/, // Poor Core Web Vitals
    phase: 'performance-optimization',
    fixType: 'structural',
    scoreImpact: impact(
      [
        { pillar: 'Technical SEO', min: 5, max: 15 },
        { pillar: 'UX', min: 10, max: 20 },
      ],
      5, 12
    ),
  },
  {
    issueIdPattern: /^tech-007$/, // Duplicate content
    phase: 'content-structure',
    fixType: 'structural',
    scoreImpact: impact(
      [
        { pillar: 'Technical SEO', min: 5, max: 10 },
        { pillar: 'Content', min: 5, max: 10 },
      ],
      3, 8
    ),
  },

  // ==========================================================================
  // ON-PAGE SEO ISSUES
  // ==========================================================================
  {
    issueIdPattern: /^onpage-001$/, // Missing titles
    phase: 'technical-hygiene',
    fixType: 'mechanical',
    scoreImpact: impact(
      [{ pillar: 'On-Page SEO', min: 10, max: 20 }],
      3, 8
    ),
  },
  {
    issueIdPattern: /^onpage-002$/, // Missing meta descriptions
    phase: 'technical-hygiene',
    fixType: 'mechanical',
    scoreImpact: impact(
      [{ pillar: 'On-Page SEO', min: 8, max: 15 }],
      2, 6
    ),
  },
  {
    issueIdPattern: /^onpage-003$/, // Missing H1
    phase: 'technical-hygiene',
    fixType: 'mechanical',
    scoreImpact: impact(
      [{ pillar: 'On-Page SEO', min: 5, max: 10 }],
      2, 5
    ),
  },
  {
    issueIdPattern: /^onpage-004$/, // Images without alt
    phase: 'technical-hygiene',
    fixType: 'mechanical',
    scoreImpact: impact(
      [{ pillar: 'On-Page SEO', min: 3, max: 8 }],
      1, 3
    ),
  },

  // ==========================================================================
  // AEO - ENTITY ISSUES
  // ==========================================================================
  {
    issueIdPattern: /^entity-001$/, // Missing entity definition
    phase: 'entity-foundation',
    fixType: 'strategic',
    scoreImpact: impact(
      [{ pillar: 'Entity Definition', min: 20, max: 35 }],
      5, 12
    ),
  },

  // ==========================================================================
  // AEO - SCHEMA ISSUES
  // ==========================================================================
  {
    issueIdPattern: /^schema-001$/, // Missing Organization schema
    phase: 'entity-foundation',
    fixType: 'mechanical',
    scoreImpact: impact(
      [
        { pillar: 'Schema Markup', min: 15, max: 25 },
        { pillar: 'Entity Definition', min: 10, max: 15 },
      ],
      5, 12
    ),
  },
  {
    issueIdPattern: /^schema-002$/, // Missing WebSite schema
    phase: 'entity-foundation',
    fixType: 'mechanical',
    scoreImpact: impact(
      [{ pillar: 'Schema Markup', min: 10, max: 15 }],
      3, 6
    ),
  },
  {
    issueIdPattern: /^schema-003$/, // Missing FAQPage schema
    phase: 'answer-architecture',
    fixType: 'mechanical',
    scoreImpact: impact(
      [
        { pillar: 'Schema Markup', min: 10, max: 15 },
        { pillar: 'FAQ Targeting', min: 15, max: 25 },
      ],
      5, 10
    ),
  },
  {
    issueIdPattern: /^schema-004$/, // Missing Service schema
    phase: 'entity-foundation',
    fixType: 'mechanical',
    scoreImpact: impact(
      [{ pillar: 'Schema Markup', min: 8, max: 12 }],
      2, 5
    ),
  },
  {
    issueIdPattern: /^schema-005$/, // Missing BreadcrumbList
    phase: 'technical-hygiene',
    fixType: 'mechanical',
    scoreImpact: impact(
      [{ pillar: 'Schema Markup', min: 5, max: 10 }],
      1, 4
    ),
  },

  // ==========================================================================
  // AEO - FAQ ISSUES
  // ==========================================================================
  {
    issueIdPattern: /^faq-001$/, // No FAQ content
    phase: 'answer-architecture',
    fixType: 'strategic',
    scoreImpact: impact(
      [
        { pillar: 'FAQ Targeting', min: 25, max: 40 },
        { pillar: 'Voice Search', min: 10, max: 20 },
        { pillar: 'AI Search', min: 10, max: 15 },
      ],
      8, 18
    ),
  },
  {
    issueIdPattern: /^faq-002$/, // FAQ without schema
    phase: 'answer-architecture',
    fixType: 'mechanical',
    scoreImpact: impact(
      [{ pillar: 'FAQ Targeting', min: 10, max: 20 }],
      3, 8
    ),
  },

  // ==========================================================================
  // AEO - VOICE ISSUES
  // ==========================================================================
  {
    issueIdPattern: /^voice-001$/, // No speakable schema
    phase: 'answer-architecture',
    fixType: 'mechanical',
    scoreImpact: impact(
      [{ pillar: 'Voice Search', min: 15, max: 25 }],
      3, 8
    ),
  },
  {
    issueIdPattern: /^voice-002$/, // No conversational content
    phase: 'content-structure',
    fixType: 'strategic',
    scoreImpact: impact(
      [
        { pillar: 'Voice Search', min: 10, max: 20 },
        { pillar: 'AI Search', min: 5, max: 10 },
      ],
      4, 10
    ),
  },

  // ==========================================================================
  // AEO - AI SEARCH ISSUES
  // ==========================================================================
  {
    issueIdPattern: /^ai-001$/, // Low citation readiness
    phase: 'content-structure',
    fixType: 'strategic',
    scoreImpact: impact(
      [{ pillar: 'AI Search', min: 15, max: 30 }],
      4, 10
    ),
  },
  {
    issueIdPattern: /^ai-002$/, // No structured claims
    phase: 'content-structure',
    fixType: 'structural',
    scoreImpact: impact(
      [{ pillar: 'AI Search', min: 10, max: 20 }],
      3, 8
    ),
  },

  // ==========================================================================
  // FALLBACK - catch any unmapped issues
  // ==========================================================================
  {
    issueIdPattern: /^tech-/,
    phase: 'technical-hygiene',
    fixType: 'mechanical',
    scoreImpact: impact([{ pillar: 'Technical SEO', min: 2, max: 8 }], 1, 3),
  },
  {
    issueIdPattern: /^onpage-/,
    phase: 'technical-hygiene',
    fixType: 'mechanical',
    scoreImpact: impact([{ pillar: 'On-Page SEO', min: 2, max: 8 }], 1, 3),
  },
  {
    issueIdPattern: /^content-/,
    phase: 'content-structure',
    fixType: 'structural',
    scoreImpact: impact([{ pillar: 'Content', min: 2, max: 8 }], 1, 3),
  },
  {
    issueIdPattern: /^authority-/,
    phase: 'authority-building',
    fixType: 'strategic',
    scoreImpact: impact([{ pillar: 'Authority', min: 2, max: 8 }], 1, 3),
  },
  {
    issueIdPattern: /^ux-/,
    phase: 'performance-optimization',
    fixType: 'structural',
    scoreImpact: impact([{ pillar: 'UX', min: 2, max: 8 }], 1, 3),
  },
  {
    issueIdPattern: /^entity-/,
    phase: 'entity-foundation',
    fixType: 'strategic',
    scoreImpact: impact([{ pillar: 'Entity Definition', min: 5, max: 15 }], 2, 5),
  },
  {
    issueIdPattern: /^schema-/,
    phase: 'entity-foundation',
    fixType: 'mechanical',
    scoreImpact: impact([{ pillar: 'Schema Markup', min: 5, max: 15 }], 2, 5),
  },
  {
    issueIdPattern: /^faq-/,
    phase: 'answer-architecture',
    fixType: 'strategic',
    scoreImpact: impact([{ pillar: 'FAQ Targeting', min: 5, max: 15 }], 2, 5),
  },
  {
    issueIdPattern: /^voice-/,
    phase: 'answer-architecture',
    fixType: 'mechanical',
    scoreImpact: impact([{ pillar: 'Voice Search', min: 5, max: 15 }], 2, 5),
  },
  {
    issueIdPattern: /^ai-/,
    phase: 'content-structure',
    fixType: 'strategic',
    scoreImpact: impact([{ pillar: 'AI Search', min: 5, max: 15 }], 2, 5),
  },
  // Ultimate fallback
  {
    issueIdPattern: /.*/,
    phase: 'technical-hygiene',
    fixType: 'mechanical',
    scoreImpact: impact([], 1, 3),
  },
];

/**
 * Dependency rules - which issues block which
 */
export const DEPENDENCY_RULES: DependencyRule[] = [
  // Entity foundation blocks schema that references it
  {
    blockerPattern: /^entity-001$/,
    blockedPattern: /^schema-001$/,
    reason: 'Organization schema requires entity definition',
  },
  {
    blockerPattern: /^entity-001$/,
    blockedPattern: /^schema-004$/,
    reason: 'Service schema requires organization entity',
  },

  // Organization schema blocks other schemas
  {
    blockerPattern: /^schema-001$/,
    blockedPattern: /^schema-002$/,
    reason: 'WebSite schema should reference Organization',
  },

  // FAQ content blocks FAQ schema
  {
    blockerPattern: /^faq-001$/,
    blockedPattern: /^schema-003$/,
    reason: 'FAQPage schema requires FAQ content to exist',
  },
  {
    blockerPattern: /^faq-001$/,
    blockedPattern: /^faq-002$/,
    reason: 'Cannot add schema to non-existent FAQ',
  },

  // Basic on-page blocks content strategy
  {
    blockerPattern: /^onpage-001$/,
    blockedPattern: /^ai-001$/,
    reason: 'Fix basic page structure before content optimization',
  },
  {
    blockerPattern: /^onpage-003$/,
    blockedPattern: /^voice-002$/,
    reason: 'Page needs H1 before voice optimization',
  },

  // HTTPS blocks everything else
  {
    blockerPattern: /^tech-003$/,
    blockedPattern: /^authority-/,
    reason: 'Enable HTTPS before building backlinks',
  },
];

/**
 * Get phase definition by ID
 */
export function getPhaseDefinition(phaseId: ExecutionPhase): PhaseDefinition {
  return PHASE_DEFINITIONS.find((p) => p.id === phaseId) || PHASE_DEFINITIONS[0];
}

/**
 * Normalize issue ID for pattern matching
 * Strips aeo-/seo- prefixes so patterns can match core issue types
 */
function normalizeIssueId(issueId: string): string {
  return issueId.replace(/^(aeo|seo)-/, '');
}

/**
 * Get mapping for an issue ID
 */
export function getMappingForIssue(issueId: string): PhaseMapping {
  const normalizedId = normalizeIssueId(issueId);

  for (const mapping of PHASE_MAPPINGS) {
    // Try normalized ID first, then original
    if (mapping.issueIdPattern.test(normalizedId) || mapping.issueIdPattern.test(issueId)) {
      return mapping;
    }
  }
  // Return last fallback
  return PHASE_MAPPINGS[PHASE_MAPPINGS.length - 1];
}

/**
 * Get dependencies for an issue
 */
export function getDependencies(
  issueId: string,
  allIssueIds: string[]
): { dependsOn: string[]; blocks: string[] } {
  const dependsOn: string[] = [];
  const blocks: string[] = [];
  const normalizedId = normalizeIssueId(issueId);

  for (const rule of DEPENDENCY_RULES) {
    // Check if this issue is blocked by something (try normalized and original)
    if (rule.blockedPattern.test(normalizedId) || rule.blockedPattern.test(issueId)) {
      const blocker = allIssueIds.find((id) => {
        const normId = normalizeIssueId(id);
        return rule.blockerPattern.test(normId) || rule.blockerPattern.test(id);
      });
      if (blocker) {
        dependsOn.push(blocker);
      }
    }

    // Check if this issue blocks something (try normalized and original)
    if (rule.blockerPattern.test(normalizedId) || rule.blockerPattern.test(issueId)) {
      const blocked = allIssueIds.filter((id) => {
        const normId = normalizeIssueId(id);
        return rule.blockedPattern.test(normId) || rule.blockedPattern.test(id);
      });
      blocks.push(...blocked);
    }
  }

  return { dependsOn, blocks };
}
