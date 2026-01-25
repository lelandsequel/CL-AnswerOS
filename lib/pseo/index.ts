// lib/pseo/index.ts
// Enhanced pSEO module with comprehensive types
// Provides audit-driven page generation with cross-model validation

// Export types
export * from './types';

// Export audit analyzer
export {
  extractContextFromAudit,
  generateRuleBasedRecommendations,
  analyzeAuditForPseo,
  buildPseoPlan,
} from './audit-analyzer';

// Export content pipeline
export {
  generatePageContent,
  validateContent,
  correctContent,
  runContentPipeline,
  runBatchContentPipeline,
} from './content-pipeline';
