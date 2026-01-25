// app/api/execution-plan/route.ts
// Generate execution plan from a deep audit result

import { NextRequest, NextResponse } from 'next/server';
import { mapAuditToExecution } from '@/lib/execution-mapper';
import type { DeepAuditResult } from '@/lib/audit-engine/types';

interface ExecutionPlanRequestBody {
  deepAudit: DeepAuditResult;
  format?: 'full' | 'workflow' | 'bbb';
  includeArtifacts?: boolean;  // Default true - include full artifacts list
  // persist?: boolean;  // Future: save to DB for state tracking
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ExecutionPlanRequestBody;

    if (!body.deepAudit) {
      return NextResponse.json(
        { error: 'Missing required field: deepAudit' },
        { status: 400 }
      );
    }

    // Validate it looks like a DeepAuditResult
    if (!body.deepAudit.url || !body.deepAudit.seo || !body.deepAudit.aeo) {
      return NextResponse.json(
        { error: 'Invalid deepAudit format - missing required fields' },
        { status: 400 }
      );
    }

    console.log(`[execution-plan] Mapping audit for ${body.deepAudit.domain}`);
    const startTime = Date.now();

    // Map audit to execution plan
    const executionPlan = mapAuditToExecution(body.deepAudit);

    const duration = Date.now() - startTime;
    console.log(`[execution-plan] Complete in ${duration}ms`);

    // Return based on requested format
    const format = body.format || 'full';

    if (format === 'workflow') {
      return new NextResponse(executionPlan.workflowDoc, {
        headers: {
          'Content-Type': 'text/markdown',
          'Content-Disposition': `attachment; filename="workflow-${body.deepAudit.domain}.md"`,
        },
      });
    }

    if (format === 'bbb') {
      return new NextResponse(executionPlan.executionBBB, {
        headers: {
          'Content-Type': 'text/markdown',
          'Content-Disposition': `attachment; filename="execution-bbb-${body.deepAudit.domain}.md"`,
        },
      });
    }

    // Handle includeArtifacts option (default true)
    const includeArtifacts = body.includeArtifacts !== false;

    // Build response plan - optionally strip artifacts
    const responsePlan = includeArtifacts
      ? executionPlan
      : {
          ...executionPlan,
          artifactsAll: undefined,  // Omit for smaller payload
          phases: executionPlan.phases.map(p => ({
            ...p,
            issues: p.issues.map(i => ({ ...i, artifacts: undefined })),
          })),
        };

    // Full JSON response
    return NextResponse.json({
      success: true,
      duration,
      plan: responsePlan,
      summary: {
        totalIssues: executionPlan.phases.reduce((sum, p) => sum + p.issues.length, 0),
        totalArtifacts: executionPlan.artifactsAll.length,
        phaseCount: executionPlan.phases.length,
        quickWinCount: executionPlan.quickWins.length,
        criticalPathCount: executionPlan.criticalPath.length,
        // Legacy score fields (backwards compatible)
        currentScore: executionPlan.currentScores.overall,
        projectedScoreMin: executionPlan.projectedScores.overall.min,
        projectedScoreMax: executionPlan.projectedScores.overall.max,
        // New score snapshots
        scores: {
          before: executionPlan.scores.before,
          afterSimulated: executionPlan.scores.afterSimulated,
          delta: executionPlan.scores.delta,
        },
      },
    });
  } catch (error) {
    console.error('[execution-plan] Error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

// GET endpoint to describe the API
export async function GET() {
  return NextResponse.json({
    name: 'Execution Plan Generator',
    description: 'Converts deep audit results into executable workflows with BBBType classification',
    usage: {
      method: 'POST',
      body: {
        deepAudit: 'DeepAuditResult object from /api/deep-audit',
        format: 'full | workflow | bbb (optional, defaults to full)',
        includeArtifacts: 'boolean (optional, defaults to true) - include deduped artifacts list',
      },
    },
    outputs: {
      full: 'Complete ExecutionPlan JSON with phases, issues, artifacts, and score snapshots',
      workflow: 'Human-readable markdown workflow document',
      bbb: 'Claude-ready execution big block',
    },
    scoreSnapshots: {
      before: 'ScoreSnapshot from audit (timestamp, overall, seo, aeo, pillars)',
      afterSimulated: 'Projected ScoreSnapshot after fixes applied',
      delta: 'ScoreDelta with min/max ranges for overall, seo, aeo, and pillars',
    },
    bbbTypes: {
      mechanical: 'Copy-paste code/config, no decisions needed',
      structural: 'Architecture changes, requires understanding',
      strategic: 'Content/positioning decisions, requires operator input',
    },
  });
}
