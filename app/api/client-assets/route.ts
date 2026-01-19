import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";
import { ClientAsset } from "@/lib/types";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get("clientId");

    const supabase = getSupabaseServer();

    let query = supabase
      .from("client_assets")
      .select("*")
      .order("created_at", { ascending: false });

    if (clientId) {
      query = query.eq("client_id", clientId);
    }

    const { data, error } = await query;

    if (error) throw error;

    const assets: ClientAsset[] = (data || []).map((row: any) => ({
      id: row.id,
      clientId: row.client_id || null,
      type: row.type,
      title: row.title,
      summary: row.summary,
      payload: row.payload,
      tags: row.tags || [],
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    return NextResponse.json({ assets });
  } catch (err: any) {
    console.error("[client-assets] GET error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to fetch client assets" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({} as any));
    console.log("[Client Assets POST] Received body:", body);

    const clientId = body.clientId ? String(body.clientId).trim() : null;
    const type = String(body.type || "").trim();
    const title = String(body.title || "").trim();
    const summary = body.summary ? String(body.summary).trim() : null;
    const payload = body.payload || {};
    const tags = Array.isArray(body.tags) ? body.tags : [];

    console.log("[Client Assets POST] Parsed data:", { clientId, type, title, summary, tagsCount: tags.length });

    if (!type || !title) {
      console.log("[Client Assets POST] Missing required fields:", { type, title });
      return NextResponse.json(
        { error: "type and title are required" },
        { status: 400 }
      );
    }

    // clientId is optional - allow saving assets without a client association
    // This is useful for saving templates or general assets

    const supabase = getSupabaseServer();

    const { data, error } = await supabase
      .from("client_assets")
      .insert({
        client_id: clientId,
        type,
        title,
        summary,
        payload,
        tags,
      })
      .select("*")
      .single();

    if (error) throw error;

    const asset: ClientAsset = {
      id: data.id,
      clientId: data.client_id,
      type: data.type,
      title: data.title,
      summary: data.summary,
      payload: data.payload,
      tags: data.tags || [],
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };

    return NextResponse.json({ asset });
  } catch (err: any) {
    console.error("[client-assets] POST error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to save client asset" },
      { status: 500 }
    );
  }
}
