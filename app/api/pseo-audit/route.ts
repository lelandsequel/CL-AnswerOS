import { NextResponse } from "next/server";
import { PseoAuditRequestSchema } from "@/lib/pseo-types";
import { generatePseoAudit } from "@/lib/pseo-audit";

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const parsed = PseoAuditRequestSchema.parse(json);

    // Validate: require either manual inputs OR audit data
    const hasManualInputs =
      parsed.company_name?.trim() &&
      parsed.industry?.trim() &&
      parsed.geography?.trim();
    const hasAuditData =
      parsed.structuredAudit && !parsed.structuredAudit.parsingFallback;

    if (!hasManualInputs && !hasAuditData) {
      return NextResponse.json(
        {
          error:
            "Either provide manual inputs (company_name, industry, geography) or structured audit data with useAuditDrivenStrategy=true",
        },
        { status: 400 }
      );
    }

    const result = await generatePseoAudit(parsed);
    return NextResponse.json(result);
  } catch (e: any) {
    console.error("[pseo-audit] Error:", e);

    // Surface LLM pipeline failures clearly
    const isLLMError =
      e?.message?.includes("LLM") ||
      e?.message?.includes("Failed to analyze audit");

    return NextResponse.json(
      {
        error: e?.message ?? "Failed to generate pSEO audit",
        details: String(e),
        isLLMError,
      },
      { status: isLLMError ? 503 : 400 }
    );
  }
}
