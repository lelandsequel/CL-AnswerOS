// lib/execution-mapper/mapper.ts
// Core execution mapping engine

import type { DeepAuditResult, AuditIssue } from '../audit-engine/types';
import type {
  ExecutionPlan,
  ExecutionPhaseBlock,
  MappedIssue,
  Artifact,
  ScoreImpact,
  ExecutionPhase,
  ScoreSnapshot,
  ScoreDelta,
  ExecutionScores,
  ArtifactKind,
  ArtifactScope,
} from './types';
import {
  PHASE_DEFINITIONS,
  getPhaseDefinition,
  getMappingForIssue,
  getDependencies,
} from './phase-config';

/**
 * Map a DeepAuditResult to an ExecutionPlan
 */
export function mapAuditToExecution(audit: DeepAuditResult): ExecutionPlan {
  const timestamp = new Date().toISOString();

  // Collect all issues from all pillars
  const allIssues = collectAllIssues(audit);
  const allIssueIds = allIssues.map((i) => i.id);

  // Map each issue to execution context
  const mappedIssues = allIssues.map((issue) => mapIssue(issue, allIssueIds));

  // Group by phase
  const phaseBlocks = buildPhaseBlocks(mappedIssues);

  // Calculate critical path
  const criticalPath = calculateCriticalPath(mappedIssues);

  // Identify quick wins
  const quickWins = identifyQuickWins(mappedIssues);

  // Build score snapshots
  const scores = buildScoreSnapshots(audit, mappedIssues, timestamp);

  // Legacy projectedScores for backwards compatibility
  // Uses current + delta (min/max) to get projected range
  const projectedScores = {
    overall: {
      min: Math.min(100, audit.overallScore + scores.delta.overallMin),
      max: Math.min(100, audit.overallScore + scores.delta.overallMax),
    },
    seo: {
      min: Math.min(100, audit.seoScore + scores.delta.seoMin),
      max: Math.min(100, audit.seoScore + scores.delta.seoMax),
    },
    aeo: {
      min: Math.min(100, audit.aeoScore + scores.delta.aeoMin),
      max: Math.min(100, audit.aeoScore + scores.delta.aeoMax),
    },
  };

  // Dedupe artifacts across all issues
  const artifactsAll = dedupeArtifacts(mappedIssues);

  // Generate documents
  const workflowDoc = generateWorkflowDoc(audit, phaseBlocks, criticalPath);
  const executionBBB = generateExecutionBBB(audit, phaseBlocks);

  return {
    auditUrl: audit.url,
    auditDate: audit.auditedAt,
    scores,
    currentScores: {
      overall: audit.overallScore,
      seo: audit.seoScore,
      aeo: audit.aeoScore,
    },
    projectedScores,
    artifactsAll,
    phases: phaseBlocks,
    criticalPath,
    quickWins,
    workflowDoc,
    executionBBB,
  };
}

/**
 * Pillar weights for composite score calculation
 * These reflect relative importance to overall SEO/AEO health
 */
const PILLAR_WEIGHTS: Record<string, { weight: number; composite: 'seo' | 'aeo' }> = {
  technical: { weight: 0.25, composite: 'seo' },      // Foundation - high weight
  onPage: { weight: 0.20, composite: 'seo' },         // Direct ranking signals
  content: { weight: 0.25, composite: 'seo' },        // Core value
  authority: { weight: 0.20, composite: 'seo' },      // External signals
  ux: { weight: 0.10, composite: 'seo' },             // User experience
  entityDefinition: { weight: 0.25, composite: 'aeo' }, // Foundation for AEO
  schemaMarkup: { weight: 0.20, composite: 'aeo' },     // Structured data
  faqTargeting: { weight: 0.25, composite: 'aeo' },     // Answer targeting
  voiceSearch: { weight: 0.15, composite: 'aeo' },      // Voice optimization
  aiSearch: { weight: 0.15, composite: 'aeo' },         // AI citation readiness
};

/**
 * Apply diminishing returns based on current score
 * Uses logistic curve: gains are easier at low scores, harder near 100
 *
 * @param currentScore - Current score (0-100)
 * @param rawDelta - Raw improvement delta
 * @returns Adjusted delta accounting for diminishing returns
 */
function applyDiminishingReturns(currentScore: number, rawDelta: number): number {
  if (rawDelta <= 0) return 0;

  // Headroom factor: how much room is left to improve
  // At score 30, headroom = 0.7 (70% room)
  // At score 80, headroom = 0.2 (20% room)
  const headroom = (100 - currentScore) / 100;

  // Efficiency curve: logistic decay
  // At low scores, capture ~80% of raw delta
  // At high scores, capture only ~20% of raw delta
  const efficiency = 0.2 + (0.6 * headroom);

  // Apply efficiency, but never exceed headroom
  const adjustedDelta = rawDelta * efficiency;
  const maxPossible = 100 - currentScore;

  return Math.min(adjustedDelta, maxPossible);
}

/**
 * Calculate composite score from weighted pillar scores
 */
function calculateCompositeScore(
  pillars: Record<string, number>,
  composite: 'seo' | 'aeo'
): number {
  let weightedSum = 0;
  let totalWeight = 0;

  for (const [pillar, config] of Object.entries(PILLAR_WEIGHTS)) {
    if (config.composite === composite && pillars[pillar] !== undefined) {
      weightedSum += pillars[pillar] * config.weight;
      totalWeight += config.weight;
    }
  }

  return totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;
}

/**
 * Build score snapshots (before/after/delta)
 * Uses weighted pillar aggregation and diminishing returns model
 */
function buildScoreSnapshots(
  audit: DeepAuditResult,
  mappedIssues: MappedIssue[],
  timestamp: string
): ExecutionScores {
  // Build pillar scores from audit
  const pillarsBefore: Record<string, number> = {
    technical: audit.seo.technical.score,
    onPage: audit.seo.onPage.score,
    content: audit.seo.content.score,
    authority: audit.seo.authority.score,
    ux: audit.seo.ux.score,
    entityDefinition: audit.aeo.entityDefinition.score,
    schemaMarkup: audit.aeo.schemaMarkup.score,
    faqTargeting: audit.aeo.faqTargeting.score,
    voiceSearch: audit.aeo.voiceSearch.score,
    aiSearch: audit.aeo.aiSearch.score,
  };

  const before: ScoreSnapshot = {
    overall: audit.overallScore,
    seo: audit.seoScore,
    aeo: audit.aeoScore,
    pillars: pillarsBefore,
    timestamp: audit.auditedAt,
    source: 'audit',
  };

  // Calculate total impact per pillar
  const totalImpact = aggregateScoreImpacts(mappedIssues.map((i) => i.scoreImpact));

  // Build raw pillar deltas
  const pillarsRawMin: Record<string, number> = {};
  const pillarsRawMax: Record<string, number> = {};

  for (const p of totalImpact.pillars) {
    const key = pillarNameToKey(p.pillar);
    pillarsRawMin[key] = (pillarsRawMin[key] || 0) + p.deltaMin;
    pillarsRawMax[key] = (pillarsRawMax[key] || 0) + p.deltaMax;
  }

  // Apply diminishing returns per pillar based on current score
  const pillarsAdjustedMin: Record<string, number> = {};
  const pillarsAdjustedMax: Record<string, number> = {};
  const pillarsAfterMin: Record<string, number> = {};
  const pillarsAfterMax: Record<string, number> = {};

  for (const [pillar, currentScore] of Object.entries(pillarsBefore)) {
    const rawMin = pillarsRawMin[pillar] || 0;
    const rawMax = pillarsRawMax[pillar] || 0;

    // Apply diminishing returns
    pillarsAdjustedMin[pillar] = Math.round(applyDiminishingReturns(currentScore, rawMin));
    pillarsAdjustedMax[pillar] = Math.round(applyDiminishingReturns(currentScore, rawMax));

    // Calculate after scores
    pillarsAfterMin[pillar] = Math.min(100, currentScore + pillarsAdjustedMin[pillar]);
    pillarsAfterMax[pillar] = Math.min(100, currentScore + pillarsAdjustedMax[pillar]);
  }

  // Calculate composite scores using weighted pillars
  const seoAfterMin = calculateCompositeScore(pillarsAfterMin, 'seo');
  const seoAfterMax = calculateCompositeScore(pillarsAfterMax, 'seo');
  const aeoAfterMin = calculateCompositeScore(pillarsAfterMin, 'aeo');
  const aeoAfterMax = calculateCompositeScore(pillarsAfterMax, 'aeo');

  // Overall is weighted average of SEO (60%) and AEO (40%)
  const overallAfterMin = Math.round(seoAfterMin * 0.6 + aeoAfterMin * 0.4);
  const overallAfterMax = Math.round(seoAfterMax * 0.6 + aeoAfterMax * 0.4);

  // Build delta (difference from before)
  const delta: ScoreDelta = {
    overallMin: overallAfterMin - audit.overallScore,
    overallMax: overallAfterMax - audit.overallScore,
    seoMin: seoAfterMin - audit.seoScore,
    seoMax: seoAfterMax - audit.seoScore,
    aeoMin: aeoAfterMin - audit.aeoScore,
    aeoMax: aeoAfterMax - audit.aeoScore,
    pillarsMin: pillarsAdjustedMin,
    pillarsMax: pillarsAdjustedMax,
  };

  // Simulated after (using midpoint for display)
  const pillarsAfterMid: Record<string, number> = {};
  for (const pillar of Object.keys(pillarsBefore)) {
    pillarsAfterMid[pillar] = Math.round((pillarsAfterMin[pillar] + pillarsAfterMax[pillar]) / 2);
  }

  const afterSimulated: ScoreSnapshot = {
    overall: Math.round((overallAfterMin + overallAfterMax) / 2),
    seo: Math.round((seoAfterMin + seoAfterMax) / 2),
    aeo: Math.round((aeoAfterMin + aeoAfterMax) / 2),
    pillars: pillarsAfterMid,
    timestamp,
    source: 'simulated',
  };

  return { before, afterSimulated, delta };
}

/**
 * Map pillar display name to key
 */
function pillarNameToKey(pillarName: string): string {
  const mapping: Record<string, string> = {
    'Technical SEO': 'technical',
    'On-Page SEO': 'onPage',
    'Content': 'content',
    'Authority': 'authority',
    'UX': 'ux',
    'Entity Definition': 'entityDefinition',
    'Schema Markup': 'schemaMarkup',
    'FAQ Targeting': 'faqTargeting',
    'Voice Search': 'voiceSearch',
    'AI Search': 'aiSearch',
  };
  return mapping[pillarName] || pillarName.toLowerCase().replace(/\s+/g, '');
}

/**
 * Get human description for BBBType
 */
function getBBBTypeDescription(bbbType: string): string {
  switch (bbbType) {
    case 'mechanical':
      return 'Copy-paste code/config, no decisions needed';
    case 'structural':
      return 'Architecture changes, requires understanding';
    case 'strategic':
      return 'Content/positioning decisions, requires operator input';
    default:
      return bbbType;
  }
}

/**
 * Dedupe artifacts across all issues by id
 */
function dedupeArtifacts(mappedIssues: MappedIssue[]): Artifact[] {
  const seen = new Map<string, Artifact>();

  for (const mi of mappedIssues) {
    for (const artifact of mi.artifacts) {
      // Skip if we've seen this id already
      if (!seen.has(artifact.id)) {
        seen.set(artifact.id, artifact);
      }
    }
  }

  return Array.from(seen.values());
}

/**
 * Collect all issues from all pillars in the audit
 */
function collectAllIssues(audit: DeepAuditResult): AuditIssue[] {
  const issues: AuditIssue[] = [];

  // SEO pillars
  issues.push(...audit.seo.technical.issues);
  issues.push(...audit.seo.onPage.issues);
  issues.push(...audit.seo.content.issues);
  issues.push(...audit.seo.authority.issues);
  issues.push(...audit.seo.ux.issues);

  // AEO pillars
  issues.push(...audit.aeo.entityDefinition.issues);
  issues.push(...audit.aeo.schemaMarkup.issues);
  issues.push(...audit.aeo.faqTargeting.issues);
  issues.push(...audit.aeo.voiceSearch.issues);
  issues.push(...audit.aeo.aiSearch.issues);

  return issues;
}

/**
 * Map a single issue to its execution context
 */
function mapIssue(issue: AuditIssue, allIssueIds: string[]): MappedIssue {
  const mapping = getMappingForIssue(issue.id);
  const deps = getDependencies(issue.id, allIssueIds);
  const artifacts = generateArtifacts(issue);
  const executionBBB = generateIssueBBB(issue, mapping.phase);

  return {
    issue,
    phase: mapping.phase,
    fixType: mapping.fixType,
    dependsOn: deps.dependsOn,
    blocks: deps.blocks,
    artifacts,
    scoreImpact: mapping.scoreImpact,
    executionBBB,
  };
}

/**
 * Generate semantic artifact ID based on issue type and context
 * Examples:
 *   schema-001 → schema.organization
 *   schema-002 → schema.website
 *   onpage-002 → content.meta-descriptions
 *   tech-001 → config.robots
 */
function generateSemanticArtifactId(issue: AuditIssue, artifactType: string): string {
  // Extract semantic meaning from issue ID and title
  const issueId = issue.id.toLowerCase();
  const title = issue.title.toLowerCase();

  // Normalize issue ID - strip aeo-/seo- prefixes for matching
  const normalizedId = issueId.replace(/^(aeo|seo)-/, '');

  // Schema artifacts
  if (normalizedId.startsWith('schema-') || issueId.includes('schema')) {
    if (title.includes('organization')) return 'schema.organization';
    if (title.includes('website')) return 'schema.website';
    if (title.includes('faq')) return 'schema.faqpage';
    if (title.includes('service')) return 'schema.service';
    if (title.includes('breadcrumb')) return 'schema.breadcrumb';
    if (title.includes('speakable')) return 'schema.speakable';
    if (title.includes('local')) return 'schema.localbusiness';
    if (title.includes('article')) return 'schema.article';
    if (title.includes('product')) return 'schema.product';
    return `schema.${normalizedId.replace('schema-', '')}`;
  }

  // Entity artifacts
  if (normalizedId.startsWith('entity-')) {
    if (title.includes('definition') || title.includes('identity')) return 'entity.definition';
    if (title.includes('knowledge')) return 'entity.knowledge-panel';
    return `entity.${normalizedId.replace('entity-', '')}`;
  }

  // Technical/config artifacts
  if (normalizedId.startsWith('tech-')) {
    if (title.includes('robots')) return 'config.robots';
    if (title.includes('sitemap')) return 'config.sitemap';
    if (title.includes('https') || title.includes('ssl')) return 'config.https';
    if (title.includes('redirect')) return 'config.redirects';
    if (title.includes('canonical')) return 'config.canonicals';
    if (title.includes('hreflang')) return 'config.hreflang';
    return `tech.${normalizedId.replace('tech-', '')}`;
  }

  // On-page content artifacts
  if (normalizedId.startsWith('onpage-')) {
    if (title.includes('title')) return 'content.titles';
    if (title.includes('meta description')) return 'content.meta-descriptions';
    if (title.includes('h1')) return 'content.h1-tags';
    if (title.includes('alt')) return 'content.image-alts';
    if (title.includes('heading')) return 'content.heading-structure';
    return `content.onpage.${normalizedId.replace('onpage-', '')}`;
  }

  // FAQ artifacts
  if (normalizedId.startsWith('faq-')) {
    if (title.includes('content') || title.includes('no faq')) return 'content.faq';
    if (title.includes('schema')) return 'schema.faqpage';
    return `faq.${normalizedId.replace('faq-', '')}`;
  }

  // Voice search artifacts
  if (normalizedId.startsWith('voice-')) {
    if (title.includes('speakable')) return 'schema.speakable';
    if (title.includes('conversational')) return 'content.conversational';
    return `voice.${normalizedId.replace('voice-', '')}`;
  }

  // AI search artifacts
  if (normalizedId.startsWith('ai-')) {
    if (title.includes('citation')) return 'content.citation-ready';
    if (title.includes('claim') || title.includes('structured')) return 'content.structured-claims';
    return `ai.${normalizedId.replace('ai-', '')}`;
  }

  // Content artifacts
  if (normalizedId.startsWith('content-')) {
    return `content.${normalizedId.replace('content-', '')}`;
  }

  // Authority artifacts
  if (normalizedId.startsWith('authority-')) {
    return `authority.${normalizedId.replace('authority-', '')}`;
  }

  // Performance/UX artifacts
  if (normalizedId.startsWith('ux-') || normalizedId.startsWith('perf-')) {
    return `performance.${normalizedId.replace(/^(ux|perf)-/, '')}`;
  }

  // Fallback: use normalized ID with artifact type
  return `${normalizedId}.${artifactType}`;
}

/**
 * Infer artifact scope from issue context
 */
function inferArtifactScope(issue: AuditIssue): ArtifactScope {
  const issueId = issue.id.toLowerCase();
  const normalizedId = issueId.replace(/^(aeo|seo)-/, '');
  const title = issue.title.toLowerCase();

  // Global: applies to entire site
  if (normalizedId.startsWith('schema-') ||
      normalizedId.startsWith('entity-') ||
      title.includes('organization') ||
      title.includes('website')) {
    return 'global';
  }

  // System: infrastructure/config
  if (normalizedId.startsWith('tech-') ||
      title.includes('robots') ||
      title.includes('sitemap') ||
      title.includes('https')) {
    return 'system';
  }

  // Page: affects individual pages
  return 'page';
}

/**
 * Generate artifacts required for an issue
 */
function generateArtifacts(issue: AuditIssue): Artifact[] {
  const artifacts: Artifact[] = [];
  const mapping = getMappingForIssue(issue.id);
  const scope = inferArtifactScope(issue);

  switch (issue.fix.type) {
    case 'file':
      artifacts.push({
        id: generateSemanticArtifactId(issue, 'file'),
        type: 'file',
        kind: 'file',
        scope,
        name: issue.fix.filename || `fix-${issue.id}.${issue.fix.language || 'txt'}`,
        description: issue.fix.description,
        template: issue.fix.content,
        producedByPhaseId: mapping.phase,
        files: issue.fix.filename ? [issue.fix.filename] : undefined,
      });
      break;

    case 'code':
      artifacts.push({
        id: generateSemanticArtifactId(issue, 'code'),
        type: 'code-change',
        kind: 'code-change',
        scope,
        name: `Code change: ${issue.fix.title}`,
        description: issue.fix.description,
        template: issue.fix.content,
        producedByPhaseId: mapping.phase,
      });
      break;

    case 'config':
      artifacts.push({
        id: generateSemanticArtifactId(issue, 'config'),
        type: 'config',
        kind: 'config',
        scope: 'system',
        name: issue.fix.filename || 'config-change',
        description: issue.fix.description,
        template: issue.fix.content,
        producedByPhaseId: mapping.phase,
        files: issue.fix.filename ? [issue.fix.filename] : undefined,
      });
      break;

    case 'copy':
      artifacts.push({
        id: generateSemanticArtifactId(issue, 'content'),
        type: 'content',
        kind: 'content',
        scope,
        name: `Content: ${issue.fix.title}`,
        description: issue.fix.description,
        template: issue.fix.content,
        producedByPhaseId: mapping.phase,
      });
      break;

    case 'instruction':
      artifacts.push({
        id: generateSemanticArtifactId(issue, 'instruction'),
        type: 'content',
        kind: 'content',
        scope,
        name: `Instructions: ${issue.fix.title}`,
        description: issue.fix.description,
        notes: issue.fix.content,
        producedByPhaseId: mapping.phase,
      });
      break;
  }

  // Verification artifact uses semantic base + .verify suffix
  const baseId = generateSemanticArtifactId(issue, 'verify');
  artifacts.push({
    id: `${baseId}.verify`,
    type: 'verification',
    kind: 'verification',
    scope,
    name: `Verify: ${issue.title}`,
    description: `Confirm ${issue.title} is resolved`,
    producedByPhaseId: mapping.phase,
  });

  return artifacts;
}

/**
 * Generate Claude-ready BBB for a single issue
 */
function generateIssueBBB(issue: AuditIssue, phase: ExecutionPhase): string {
  return `# EXECUTION BLOCK: ${issue.title}

## Context
Phase: ${phase}
Severity: ${issue.severity}
Issue ID: ${issue.id}

## Problem
${issue.description}

Current state: ${issue.currentState}
Impact: ${issue.impact}

## Fix Required
Type: ${issue.fix.type}
Estimated effort: ${issue.fix.estimatedEffort}

${issue.fix.description}

## Implementation
\`\`\`${issue.fix.language || 'text'}
${issue.fix.content}
\`\`\`

## Verification
- [ ] Fix implemented
- [ ] Tested locally
- [ ] Deployed to production
- [ ] Re-audit confirms resolution
`;
}

/**
 * Build phase blocks from mapped issues
 */
function buildPhaseBlocks(mappedIssues: MappedIssue[]): ExecutionPhaseBlock[] {
  const phaseMap = new Map<ExecutionPhase, MappedIssue[]>();

  // Group by phase
  for (const mi of mappedIssues) {
    const existing = phaseMap.get(mi.phase) || [];
    existing.push(mi);
    phaseMap.set(mi.phase, existing);
  }

  // Build blocks in order
  const blocks: ExecutionPhaseBlock[] = [];
  const completedPhases = new Set<ExecutionPhase>();

  for (const phaseDef of PHASE_DEFINITIONS) {
    const phaseIssues = phaseMap.get(phaseDef.id) || [];
    if (phaseIssues.length === 0) continue;

    // Check if can start
    const canStart = phaseDef.prerequisites.every((p) =>
      !phaseMap.has(p) || completedPhases.has(p)
    );

    // Aggregate score impact
    const aggregateImpact = aggregateScoreImpacts(phaseIssues.map((i) => i.scoreImpact));

    // Estimate total effort
    const totalEffort = estimateTotalEffort(phaseIssues);

    blocks.push({
      phase: phaseDef,
      issues: phaseIssues,
      totalEstimatedEffort: totalEffort,
      aggregateScoreImpact: aggregateImpact,
      canStart,
    });
  }

  return blocks;
}

/**
 * Aggregate multiple score impacts
 */
function aggregateScoreImpacts(impacts: ScoreImpact[]): ScoreImpact {
  const pillarTotals = new Map<string, { min: number; max: number }>();

  for (const impact of impacts) {
    for (const p of impact.pillars) {
      const existing = pillarTotals.get(p.pillar) || { min: 0, max: 0 };
      existing.min += p.deltaMin;
      existing.max += p.deltaMax;
      pillarTotals.set(p.pillar, existing);
    }
  }

  const totalMin = impacts.reduce((sum, i) => sum + i.overallDeltaMin, 0);
  const totalMax = impacts.reduce((sum, i) => sum + i.overallDeltaMax, 0);

  return {
    pillars: Array.from(pillarTotals.entries()).map(([pillar, delta]) => ({
      pillar,
      deltaMin: delta.min,
      deltaMax: delta.max,
    })),
    overallDeltaMin: totalMin,
    overallDeltaMax: totalMax,
  };
}

/**
 * Estimate total effort for a set of issues
 */
function estimateTotalEffort(issues: MappedIssue[]): string {
  let minuteCount = 0;
  let hourCount = 0;
  let dayCount = 0;

  for (const mi of issues) {
    switch (mi.issue.fix.estimatedEffort) {
      case 'minutes':
        minuteCount++;
        break;
      case 'hours':
        hourCount++;
        break;
      case 'days':
        dayCount++;
        break;
    }
  }

  if (dayCount > 0) {
    return `${dayCount + Math.ceil(hourCount / 4)} days`;
  }
  if (hourCount > 0) {
    return `${hourCount + Math.ceil(minuteCount / 4)} hours`;
  }
  return `${minuteCount * 15}-${minuteCount * 30} minutes`;
}

/**
 * Calculate critical path - issues that most impact score
 */
function calculateCriticalPath(mappedIssues: MappedIssue[]): MappedIssue[] {
  // Sort by average score impact (descending), then by fix type (mechanical first)
  const sorted = [...mappedIssues].sort((a, b) => {
    const aImpact = (a.scoreImpact.overallDeltaMin + a.scoreImpact.overallDeltaMax) / 2;
    const bImpact = (b.scoreImpact.overallDeltaMin + b.scoreImpact.overallDeltaMax) / 2;

    if (bImpact !== aImpact) {
      return bImpact - aImpact;
    }

    // Prefer mechanical fixes (faster)
    const typeOrder = { mechanical: 0, structural: 1, strategic: 2 };
    return typeOrder[a.fixType] - typeOrder[b.fixType];
  });

  // Take top issues that aren't blocked
  const criticalPath: MappedIssue[] = [];
  const resolved = new Set<string>();

  for (const mi of sorted) {
    const blocked = mi.dependsOn.some((dep) => !resolved.has(dep));
    if (!blocked) {
      criticalPath.push(mi);
      resolved.add(mi.issue.id);
    }
    if (criticalPath.length >= 10) break;
  }

  return criticalPath;
}

/**
 * Identify quick wins - high impact, low effort
 */
function identifyQuickWins(mappedIssues: MappedIssue[]): MappedIssue[] {
  return mappedIssues
    .filter((mi) => {
      // Must be mechanical or low-effort
      if (mi.fixType !== 'mechanical' && mi.issue.fix.estimatedEffort !== 'minutes') {
        return false;
      }
      // Must have meaningful impact
      const avgImpact = (mi.scoreImpact.overallDeltaMin + mi.scoreImpact.overallDeltaMax) / 2;
      return avgImpact >= 3;
    })
    .sort((a, b) => {
      const aRatio = ((a.scoreImpact.overallDeltaMin + a.scoreImpact.overallDeltaMax) / 2) /
        (a.issue.fix.estimatedEffort === 'minutes' ? 1 : 3);
      const bRatio = ((b.scoreImpact.overallDeltaMin + b.scoreImpact.overallDeltaMax) / 2) /
        (b.issue.fix.estimatedEffort === 'minutes' ? 1 : 3);
      return bRatio - aRatio;
    })
    .slice(0, 5);
}

/**
 * Project scores after all fixes
 */
function projectScores(
  audit: DeepAuditResult,
  mappedIssues: MappedIssue[]
): ExecutionPlan['projectedScores'] {
  const totalImpact = aggregateScoreImpacts(mappedIssues.map((i) => i.scoreImpact));

  // Calculate pillar-specific impacts for SEO vs AEO
  let seoMin = 0, seoMax = 0, aeoMin = 0, aeoMax = 0;

  for (const p of totalImpact.pillars) {
    const isAeo = ['Entity Definition', 'Schema Markup', 'FAQ Targeting', 'Voice Search', 'AI Search']
      .includes(p.pillar);

    if (isAeo) {
      aeoMin += p.deltaMin;
      aeoMax += p.deltaMax;
    } else {
      seoMin += p.deltaMin;
      seoMax += p.deltaMax;
    }
  }

  // Normalize (divide by pillar count, apply diminishing returns)
  const seoFactor = 0.15; // ~15% of raw pillar gains translate to composite score
  const aeoFactor = 0.18;

  return {
    overall: {
      min: Math.min(100, audit.overallScore + totalImpact.overallDeltaMin),
      max: Math.min(100, audit.overallScore + totalImpact.overallDeltaMax),
    },
    seo: {
      min: Math.min(100, audit.seoScore + seoMin * seoFactor),
      max: Math.min(100, audit.seoScore + seoMax * seoFactor),
    },
    aeo: {
      min: Math.min(100, audit.aeoScore + aeoMin * aeoFactor),
      max: Math.min(100, audit.aeoScore + aeoMax * aeoFactor),
    },
  };
}

/**
 * Generate human-readable workflow document
 */
function generateWorkflowDoc(
  audit: DeepAuditResult,
  phases: ExecutionPhaseBlock[],
  criticalPath: MappedIssue[]
): string {
  const lines: string[] = [];

  lines.push(`# Execution Workflow: ${audit.domain}`);
  lines.push('');
  lines.push(`Audit Date: ${new Date(audit.auditedAt).toLocaleDateString()}`);
  lines.push(`Current Score: ${audit.overallScore}/100 (SEO: ${audit.seoScore}, AEO: ${audit.aeoScore})`);
  lines.push('');
  lines.push('---');
  lines.push('');

  // Critical path
  lines.push('## Critical Path (Top 10 Impact Items)');
  lines.push('');
  for (let i = 0; i < criticalPath.length; i++) {
    const mi = criticalPath[i];
    const impact = `+${mi.scoreImpact.overallDeltaMin}-${mi.scoreImpact.overallDeltaMax} pts`;
    lines.push(`${i + 1}. **${mi.issue.title}** [${mi.issue.severity}] → ${impact}`);
  }
  lines.push('');
  lines.push('---');
  lines.push('');

  // Phases
  lines.push('## Execution Phases');
  lines.push('');

  for (const block of phases) {
    const bbbLabel = block.phase.bbbType === 'mechanical' ? '🔧 MECHANICAL' :
      block.phase.bbbType === 'structural' ? '🏗️ STRUCTURAL' : '🎯 STRATEGIC';
    lines.push(`### Phase ${block.phase.order}: ${block.phase.name} [${bbbLabel}]`);
    lines.push('');
    lines.push(`*${block.phase.description}*`);
    lines.push('');
    lines.push(`- **Agent Posture:** ${block.phase.bbbType} — ${getBBBTypeDescription(block.phase.bbbType)}`);
    lines.push(`- **Duration:** ${block.totalEstimatedEffort}`);
    lines.push(`- **Issues:** ${block.issues.length}`);
    lines.push(`- **Score Impact:** +${block.aggregateScoreImpact.overallDeltaMin}-${block.aggregateScoreImpact.overallDeltaMax} pts`);
    lines.push(`- **Can Start:** ${block.canStart ? 'Yes' : 'No (waiting on prerequisites)'}`);
    lines.push('');

    if (block.phase.prerequisites.length > 0) {
      lines.push(`Prerequisites: ${block.phase.prerequisites.join(', ')}`);
      lines.push('');
    }

    lines.push('#### Issues');
    lines.push('');
    for (const mi of block.issues) {
      const typeIcon = mi.fixType === 'mechanical' ? '🔧' :
        mi.fixType === 'structural' ? '🏗️' : '🎯';
      lines.push(`- ${typeIcon} **${mi.issue.title}** [${mi.issue.severity}] - ${mi.issue.fix.estimatedEffort}`);
    }
    lines.push('');
  }

  lines.push('---');
  lines.push('');
  lines.push('*Generated by Lelandos Execution Mapper*');

  return lines.join('\n');
}

/**
 * Generate Claude-ready execution BBB
 */
function generateExecutionBBB(
  audit: DeepAuditResult,
  phases: ExecutionPhaseBlock[]
): string {
  const lines: string[] = [];

  lines.push('# EXECUTION BIG BLOCK — ' + audit.domain.toUpperCase());
  lines.push('');
  lines.push('## CONTEXT');
  lines.push('');
  lines.push('This is a Claude-ready execution block for implementing SEO/AEO fixes.');
  lines.push(`Source audit: ${audit.url}`);
  lines.push(`Current scores: Overall ${audit.overallScore}, SEO ${audit.seoScore}, AEO ${audit.aeoScore}`);
  lines.push('');
  lines.push('## EXECUTION RULES');
  lines.push('');
  lines.push('1. Execute phases in order');
  lines.push('2. Complete all items in a phase before moving to next');
  lines.push('3. Verify each fix before marking complete');
  lines.push('4. Do NOT skip mechanical fixes');
  lines.push('5. For strategic fixes, confirm approach with operator first');
  lines.push('6. **PLACEHOLDER RULE:** Any placeholder copy or example text in this BBB (e.g., generic meta descriptions, example H1s) MUST be replaced with client-accurate language before commit. No placeholders may ship.');
  lines.push('');
  lines.push('## BBB TYPE POSTURES');
  lines.push('');
  lines.push('Each phase has a BBBType that determines agent behavior:');
  lines.push('');
  lines.push('- **MECHANICAL** 🔧 — Execute exactly as written. No creativity. Copy-paste.');
  lines.push('- **STRUCTURAL** 🏗️ — Understand context, adapt implementation to codebase patterns.');
  lines.push('- **STRATEGIC** 🎯 — Pause for operator input. Present options. Await approval.');
  lines.push('');
  lines.push('---');
  lines.push('');

  for (const block of phases) {
    const bbbIcon = block.phase.bbbType === 'mechanical' ? '🔧' :
      block.phase.bbbType === 'structural' ? '🏗️' : '🎯';
    lines.push(`## PHASE ${block.phase.order}: ${block.phase.name.toUpperCase()} ${bbbIcon} [${block.phase.bbbType.toUpperCase()}]`);
    lines.push('');

    // Phase scope clarity (Patch 3)
    if (block.phase.id === 'content-structure') {
      lines.push('> **Scope:** INTERNAL content quality, hierarchy, and completeness.');
    } else if (block.phase.id === 'answer-architecture') {
      lines.push('> **Scope:** EXTERNAL answer capture (search, voice, AI, snippets).');
    }

    lines.push(`> ${block.phase.description}`);
    lines.push(`> **Agent Posture:** ${getBBBTypeDescription(block.phase.bbbType)}`);
    lines.push('');

    for (const mi of block.issues) {
      lines.push('### ' + mi.issue.title);
      lines.push('');
      lines.push(`**Severity:** ${mi.issue.severity}`);
      lines.push(`**Fix Type:** ${mi.fixType}`);
      lines.push(`**Effort:** ${mi.issue.fix.estimatedEffort}`);
      lines.push('');
      lines.push('**Problem:**');
      lines.push(mi.issue.description);
      lines.push('');
      lines.push('**Current State:**');
      lines.push(mi.issue.currentState);
      lines.push('');
      lines.push('**Fix:**');
      lines.push('```' + (mi.issue.fix.language || 'text'));
      lines.push(mi.issue.fix.content);
      lines.push('```');
      lines.push('');

      if (mi.dependsOn.length > 0) {
        lines.push(`**Depends On:** ${mi.dependsOn.join(', ')}`);
        lines.push('');
      }

      lines.push('---');
      lines.push('');
    }

    // Expected artifacts for this phase (Patch 4)
    const phaseArtifacts = block.issues
      .flatMap(mi => mi.artifacts)
      .filter(a => a.kind !== 'verification')
      .map(a => a.id);
    const uniqueArtifacts = [...new Set(phaseArtifacts)];
    if (uniqueArtifacts.length > 0) {
      lines.push('**Expected Artifacts:** ' + uniqueArtifacts.join(', '));
      lines.push('');
    }
  }

  lines.push('## COMPLETION');
  lines.push('');
  lines.push('After all phases complete:');
  lines.push('1. Re-run deep audit');
  lines.push('2. Compare scores');
  lines.push('3. Document remaining gaps');
  lines.push('4. Plan next iteration');
  lines.push('');
  lines.push('// END EXECUTION BLOCK');

  return lines.join('\n');
}
