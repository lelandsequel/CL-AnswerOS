import { NextResponse } from "next/server";
import { PseoAuditRequestSchema } from "@/lib/pseo-types";
import { generatePseoAudit } from "@/lib/pseo-audit";

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const parsed = PseoAuditRequestSchema.parse(json);
    const result = await generatePseoAudit(parsed);
    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Failed to generate pSEO audit", details: String(e) },
      { status: 400 }
    );
  }
}
