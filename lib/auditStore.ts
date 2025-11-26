import { createClient } from "@supabase/supabase-js";
import { AuditResponse, AuditRecord } from "./types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function saveAudit(
  url: string,
  chaos: number,
  sass: number,
  data: AuditResponse
) {
  try {
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
    data?.map((row: any) => ({
      id: row.id,
      clientId: row.client_id || undefined,
      url: row.url,
      domain: row.domain || '',
      summary: row.summary || '',
      opportunityRating: row.opportunity_rating || undefined,
      rawScore: typeof row.raw_score === 'number' ? row.raw_score : undefined,
      createdAt: row.created_at,
    })) ?? []
  );
}

