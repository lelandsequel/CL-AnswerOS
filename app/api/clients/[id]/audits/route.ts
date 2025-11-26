// app/api/clients/[id]/audits/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";
import { AuditRecord } from "@/lib/types";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const clientId = id;
    if (!clientId) {
      return NextResponse.json(
        { error: "client id is required" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServer();

    const { data, error } = await supabase
      .from("audits")
      .select("id, client_id, url, domain, summary, opportunity_rating, raw_score, created_at")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    const audits: AuditRecord[] = (data || []).map((row: any) => ({
      id: row.id,
      clientId: row.client_id || undefined,
      url: row.url,
      domain: row.domain,
      summary: row.summary,
      opportunityRating: row.opportunity_rating || undefined,
      rawScore:
        typeof row.raw_score === "number" ? row.raw_score : undefined,
      createdAt: row.created_at,
    }));

    return NextResponse.json({ audits });
  } catch (err: any) {
    console.error("[client audits] GET error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to fetch audits" },
      { status: 500 }
    );
  }
}

