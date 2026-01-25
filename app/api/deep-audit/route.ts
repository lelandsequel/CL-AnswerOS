// app/api/deep-audit/route.ts
// Deep SEO/AEO Audit API - Uses DataForSEO for real data

import { NextRequest, NextResponse } from 'next/server';
import { runDeepAudit, deepAuditToStructuredAudit } from '@/lib/audit-engine';
import { parseAndValidate, errorResponse } from '@/lib/api-utils';
import { DeepAuditSchema } from '@/lib/validation';
import type { DeepAuditOptions } from '@/lib/audit-engine';

export async function POST(req: NextRequest) {
  try {
    // Validate request body
    const validation = await parseAndValidate(req, DeepAuditSchema);
    if (!validation.success) return validation.error;
    const data = validation.data;

    const options: DeepAuditOptions = {
      url: data.url,
      maxPages: data.maxPages,
      includeBacklinks: data.includeBacklinks,
      includeKeywordGaps: data.includeKeywordGaps,
      competitors: data.competitors,
    };

    console.log(`[deep-audit] Starting audit for ${data.url}`);
    const startTime = Date.now();

    // Run the deep audit
    const deepAuditResult = await runDeepAudit(options);

    // Also generate legacy format for backward compatibility
    const structuredAudit = deepAuditToStructuredAudit(deepAuditResult);

    const duration = Date.now() - startTime;
    console.log(`[deep-audit] Complete in ${duration}ms`);

    return NextResponse.json({
      success: true,
      url: data.url,
      duration,

      // New deep audit format
      deepAudit: deepAuditResult,

      // Legacy format for backward compatibility
      structuredAudit,

      // Summary stats
      summary: {
        overallScore: deepAuditResult.overallScore,
        seoScore: deepAuditResult.seoScore,
        aeoScore: deepAuditResult.aeoScore,
        totalIssues: deepAuditResult.actionPlan.immediate.length +
          deepAuditResult.actionPlan.shortTerm.length +
          deepAuditResult.actionPlan.mediumTerm.length +
          deepAuditResult.actionPlan.longTerm.length,
        criticalIssues: deepAuditResult.actionPlan.immediate.filter(
          i => i.severity === 'CRITICAL'
        ).length,
        quickWins: deepAuditResult.actionPlan.immediate.filter(
          i => i.fix.estimatedEffort === 'minutes'
        ).length,
      },
    });
  } catch (error) {
    console.error('[deep-audit] Error:', error);

    // Check if it's a DataForSEO credential error
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    if (errorMessage.includes('DATAFORSEO')) {
      return errorResponse(
        'DataForSEO credentials not configured',
        503,
        { details: 'Add DATAFORSEO_LOGIN and DATAFORSEO_PASSWORD to your .env.local' }
      );
    }

    return errorResponse(errorMessage);
  }
}

// GET endpoint to check if deep audit is configured
export async function GET() {
  const hasCredentials = !!(
    process.env.DATAFORSEO_LOGIN && process.env.DATAFORSEO_PASSWORD
  );

  return NextResponse.json({
    available: hasCredentials,
    message: hasCredentials
      ? 'Deep audit is configured and ready'
      : 'DataForSEO credentials not configured. Add DATAFORSEO_LOGIN and DATAFORSEO_PASSWORD to .env.local',
  });
}
