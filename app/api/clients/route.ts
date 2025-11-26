// app/api/clients/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";
import { Client, ClientStage } from "@/lib/types";

export async function GET() {
  try {
    const supabase = getSupabaseServer();

    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    const clients: Client[] = (data || []).map((row: any) => ({
      id: row.id,
      name: row.name,
      primaryDomain: row.primary_domain || undefined,
      contactName: row.contact_name || undefined,
      contactEmail: row.contact_email || undefined,
      notes: row.notes || undefined,
      stage: (row.stage as ClientStage) || "lead",
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    return NextResponse.json({ clients });
  } catch (err: any) {
    console.error("[clients] GET error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to fetch clients" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({} as any));
    const name = String(body.name || "").trim();
    const primaryDomain = body.primaryDomain
      ? String(body.primaryDomain).trim()
      : null;
    const contactName = body.contactName
      ? String(body.contactName).trim()
      : null;
    const contactEmail = body.contactEmail
      ? String(body.contactEmail).trim()
      : null;
    const notes = body.notes ? String(body.notes).trim() : null;
    const stage: ClientStage =
      (body.stage as ClientStage) || "lead";

    if (!name) {
      return NextResponse.json(
        { error: "name is required" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServer();

    const { data, error } = await supabase
      .from("clients")
      .insert({
        name,
        primary_domain: primaryDomain,
        contact_name: contactName,
        contact_email: contactEmail,
        notes,
        stage,
      })
      .select("*")
      .single();

    if (error) throw error;

    const client: Client = {
      id: data.id,
      name: data.name,
      primaryDomain: data.primary_domain || undefined,
      contactName: data.contact_name || undefined,
      contactEmail: data.contact_email || undefined,
      notes: data.notes || undefined,
      stage: (data.stage as ClientStage) || "lead",
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };

    return NextResponse.json({ client });
  } catch (err: any) {
    console.error("[clients] POST error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to create client" },
      { status: 500 }
    );
  }
}

