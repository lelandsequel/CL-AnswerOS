// app/api/pseo-audit/route.ts
// pSEO audit API endpoint

import { NextRequest, NextResponse } from "next/server";
import { PSEOAuditRequestSchema } from "@/lib/pseo-types";
import { generatePSEOAudit } from "@/lib/pseo-audit";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate request
    const validation = PSEOAuditRequestSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validation.error.flatten(),
        },
        { status: 400 }
      );
    }

    const request = validation.data;

    // Generate pSEO audit
    const result = await generatePSEOAudit(request);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("[pseo-audit] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to generate pSEO audit",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

