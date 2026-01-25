// lib/execution-mapper/types.ts
// Type definitions for the Execution Mapping Engine

import type { AuditIssue, Severity, DeepAuditResult } from '../audit-engine/types';

/**
 * Fix classification - how the fix is executed (issue-level)
 */
export type FixClassification =
  | 'mechanical'   // Copy-paste code/config, no decisions needed
  | 'structural'   // Architecture changes, requires understanding
  | 'strategic';   // Content/positioning decisions, requires operator input

/**
 * BBB Type - agent posture for a phase (phase-level)
 * Aliased to FixClassification for consistency
 */
export type BBBType = FixClassification;

/**
 * Execution phases - ordered sequence of work
 */
export type ExecutionPhase =
  | 'entity-foundation'    // Schema, organization identity
  | 'technical-hygiene'    // Meta tags, H1s, alt text, robots, sitemap
  | 'content-structure'    // Headings, internal links, content gaps
  | 'answer-architecture'  // FAQs, voice search, featured snippets
  | 'authority-building'   // Backlinks, citations, entity establishment
  | 'performance-optimization'; // Core Web Vitals, speed

/**
 * Phase metadata
 */
export interface PhaseDefinition {
  id: ExecutionPhase;
  name: string;
  description: string;
  order: number;  // Execution sequence
  estimatedDuration: string;  // "1-2 days", "1 week", etc.
  prerequisites: ExecutionPhase[];  // Phases that must complete first
  bbbType: BBBType;  // Agent posture for this phase
}

/**
 * A mapped issue ready for execution
 */
export interface MappedIssue {
  // Original issue data
  issue: AuditIssue;

  // Execution mapping
  phase: ExecutionPhase;
  fixType: FixClassification;

  // Dependencies
  dependsOn: string[];      // Issue IDs this depends on
  blocks: string[];         // Issue IDs this blocks

  // Artifacts to produce
  artifacts: Artifact[];

  // Score impact
  scoreImpact: ScoreImpact;

  // Execution instructions
  executionBBB?: string;    // Claude-ready prompt for this fix
}

/**
 * Artifact kind - what type of output
 */
export type ArtifactKind = 'file' | 'schema' | 'content' | 'config' | 'code-change' | 'verification';

/**
 * Artifact scope - what level it applies to
 */
export type ArtifactScope = 'global' | 'page' | 'system';

/**
 * An artifact to be produced
 */
export interface Artifact {
  // Identity (for dedupe)
  id: string;  // Stable id, e.g., "schema.organization", "seo.metaDescriptions"

  // Classification
  type: 'file' | 'code-change' | 'config' | 'content' | 'verification';  // Legacy compat
  kind: ArtifactKind;
  scope: ArtifactScope;

  // Metadata
  name: string;
  description: string;
  template?: string;  // Template content if applicable
  producedByPhaseId?: string;  // Which phase produces this

  // Targets (optional)
  targets?: string[];  // URLs/pages/components affected
  files?: string[];    // Repo paths to create/modify
  notes?: string;      // Short instructions
}

/**
 * Expected score impact from fixing an issue
 */
export interface ScoreImpact {
  pillars: {
    pillar: string;
    deltaMin: number;
    deltaMax: number;
  }[];
  overallDeltaMin: number;
  overallDeltaMax: number;
}

/**
 * A complete phase with its issues
 */
export interface ExecutionPhaseBlock {
  phase: PhaseDefinition;
  issues: MappedIssue[];
  totalEstimatedEffort: string;
  aggregateScoreImpact: ScoreImpact;
  canStart: boolean;  // True if all prerequisite phases are complete
}

/**
 * Score snapshot at a point in time
 */
export interface ScoreSnapshot {
  overall: number;
  seo: number;
  aeo: number;
  pillars?: Record<string, number>;  // e.g., { "technical": 100, "onPage": 35 }
  timestamp: string;  // ISO
  source: 'audit' | 'simulated';
}

/**
 * Score delta (change between snapshots)
 */
export interface ScoreDelta {
  overallMin: number;
  overallMax: number;
  seoMin: number;
  seoMax: number;
  aeoMin: number;
  aeoMax: number;
  pillarsMin?: Record<string, number>;
  pillarsMax?: Record<string, number>;
}

/**
 * Scores container with before/after snapshots
 */
export interface ExecutionScores {
  before: ScoreSnapshot;
  afterSimulated: ScoreSnapshot;
  delta: ScoreDelta;
}

/**
 * The full execution plan
 */
export interface ExecutionPlan {
  // Source audit
  auditUrl: string;
  auditDate: string;

  // Score snapshots (new)
  scores: ExecutionScores;

  // Legacy: Current scores (for backwards compatibility)
  currentScores: {
    overall: number;
    seo: number;
    aeo: number;
  };

  // Legacy: Projected scores (for backwards compatibility)
  projectedScores: {
    overall: { min: number; max: number };
    seo: { min: number; max: number };
    aeo: { min: number; max: number };
  };

  // Canonical artifact list (deduped by id)
  artifactsAll: Artifact[];

  // Phases in execution order
  phases: ExecutionPhaseBlock[];

  // Critical path - minimum set of issues to maximize score
  criticalPath: MappedIssue[];

  // Quick wins - high impact, low effort
  quickWins: MappedIssue[];

  // Generated artifacts
  workflowDoc: string;      // Human-readable markdown
  executionBBB: string;     // Claude-ready big block
}

/**
 * Issue-to-phase mapping rules
 */
export interface PhaseMapping {
  issueIdPattern: RegExp;
  phase: ExecutionPhase;
  fixType: FixClassification;
  scoreImpact: ScoreImpact;
}

/**
 * Configuration for the execution mapper
 */
export interface ExecutionMapperConfig {
  phaseMappings: PhaseMapping[];
  phaseDefinitions: PhaseDefinition[];
  dependencyRules: DependencyRule[];
}

/**
 * Dependency rules - which issues block which
 */
export interface DependencyRule {
  // Issue pattern that creates the dependency
  blockerPattern: RegExp;
  // Issue pattern that is blocked
  blockedPattern: RegExp;
  // Reason for the dependency
  reason: string;
}

// =============================================================================
// PERSISTENCE TYPES (for future state tracking)
// =============================================================================

/**
 * Issue execution status
 */
export type IssueStatus =
  | 'pending'      // Not started
  | 'in_progress'  // Work has begun
  | 'blocked'      // Waiting on dependency
  | 'completed'    // Fix applied
  | 'verified'     // Fix confirmed working
  | 'skipped';     // Intentionally not fixing

/**
 * Tracked issue with execution state
 */
export interface TrackedIssue {
  issueId: string;
  status: IssueStatus;
  startedAt?: string;       // ISO timestamp
  completedAt?: string;     // ISO timestamp
  verifiedAt?: string;      // ISO timestamp
  assignedTo?: string;      // Agent or operator ID
  notes?: string;           // Execution notes
  actualEffort?: string;    // "15 minutes", "2 hours", etc.
}

/**
 * Phase execution state
 */
export interface TrackedPhase {
  phaseId: ExecutionPhase;
  status: 'pending' | 'in_progress' | 'completed';
  startedAt?: string;
  completedAt?: string;
  issueStatuses: TrackedIssue[];
}

/**
 * Persisted execution plan with state
 */
export interface PersistedExecutionPlan {
  // Identity
  id: string;                    // UUID
  clientId?: string;             // Associated client
  auditId?: string;              // Source audit reference

  // Plan data
  plan: ExecutionPlan;

  // Execution state
  phases: TrackedPhase[];
  overallStatus: 'pending' | 'in_progress' | 'completed' | 'stalled';

  // Score tracking
  scoreHistory: ScoreSnapshot[]; // Snapshots over time

  // Metadata
  createdAt: string;
  updatedAt: string;
  createdBy?: string;            // User or system
}

/**
 * Execution plan persistence interface
 */
export interface ExecutionPlanStore {
  save(plan: PersistedExecutionPlan): Promise<void>;
  load(id: string): Promise<PersistedExecutionPlan | null>;
  loadByClient(clientId: string): Promise<PersistedExecutionPlan[]>;
  updateIssueStatus(planId: string, issueId: string, status: IssueStatus): Promise<void>;
  addScoreSnapshot(planId: string, snapshot: ScoreSnapshot): Promise<void>;
}
