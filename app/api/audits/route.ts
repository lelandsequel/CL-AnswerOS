// app/api/audits/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";
import { AuditRecord } from "@/lib/types";

export async function GET() {
  try {
    const supabase = getSupabaseServer();

    const { data, error } = await supabase
      .from("audits")
      .select("id, client_id, url, domain, summary, opportunity_rating, raw_score, created_at")
      .order("created_at", { ascending: false })
      .limit(30);

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
    console.error("[audits] GET error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to fetch audits" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({} as any));

    const url = String(body.url || "").trim();
    const domain = String(body.domain || "").trim();
    const summary = String(body.summary || "").trim();
    const opportunityRating = body.opportunityRating
      ? String(body.opportunityRating).trim()
      : null;
    const rawScore =
      typeof body.rawScore === "number" ? body.rawScore : null;
    const structuredAudit = body.structuredAudit || null;
    const rawScan = body.rawScan || null;
    const keywordMetrics = body.keywordMetrics || null;
    const clientId =
      body.clientId && String(body.clientId).trim()
        ? String(body.clientId).trim()
        : null;

    if (!url || !domain || !summary) {
      return NextResponse.json(
        {
          error:
            "url, domain, and summary are required to save an audit",
        },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServer();

    const { data, error } = await supabase
      .from("audits")
      .insert({
        client_id: clientId,
        url,
        domain,
        summary,
        opportunity_rating: opportunityRating,
        raw_score: rawScore,
        structured_audit: structuredAudit,
        raw_scan: rawScan,
        keyword_metrics: keywordMetrics,
      })
      .select("id, created_at")
      .single();

    if (error) throw error;

    return NextResponse.json({
      id: data.id,
      createdAt: data.created_at,
    });
  } catch (err: any) {
    console.error("[audits] POST error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to save audit" },
      { status: 500 }
    );
  }
}

