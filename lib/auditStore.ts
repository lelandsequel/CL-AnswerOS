import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { AuditResponse, AuditRecord } from "./types";

// Lazy initialization to avoid build-time errors
let _supabase: SupabaseClient | null = null;

function getSupabase(): SupabaseClient | null {
  if (_supabase) return _supabase;
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.warn("[auditStore] Supabase not configured");
    return null;
  }
  
  _supabase = createClient(supabaseUrl, supabaseKey);
  return _supabase;
}

export async function saveAudit(
  url: string,
  chaos: number,
  sass: number,
  data: AuditResponse
) {
  try {
    const supabase = getSupabase();
    if (!supabase) {
      console.warn("[auditStore] Cannot save audit - Supabase not configured");
      return;
    }
    
    const { error } = await supabase.from("audits").insert({
      url,
      chaos,
      sass,
      raw_scan: data.rawScan,
      structured_audit: data.structuredAudit,
      keyword_metrics: data.keywordMetrics,
    });
    if (error) throw error;
  } catch (err) {
    console.error("Failed to save audit", err);
  }
}

export async function fetchAudits(): Promise<AuditRecord[]> {
  const supabase = getSupabase();
  if (!supabase) {
    console.warn("[auditStore] Cannot fetch audits - Supabase not configured");
    return [];
  }
  
  const { data, error } = await supabase
    .from("audits")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("Failed to load audits", error);
    return [];
  }

  return (
    data?.map((row: Record<string, unknown>) => ({
      id: row.id as string,
      clientId: (row.client_id as string) || undefined,
      url: row.url as string,
      domain: (row.domain as string) || '',
      summary: (row.summary as string) || '',
      opportunityRating: (row.opportunity_rating as string) || undefined,
      rawScore: typeof row.raw_score === 'number' ? row.raw_score : undefined,
      createdAt: row.created_at as string,
    })) ?? []
  );
}

