// lib/dataforseo-enrich.ts
import { Lead } from "@/lib/types";

const DATAFORSEO_API_URL = "https://api.dataforseo.com/v3";

function getAuthHeader() {
  const login = process.env.DATAFORSEO_LOGIN;
  const password = process.env.DATAFORSEO_PASSWORD;

  if (!login || !password) {
    throw new Error(
      "DATAFORSEO_LOGIN and DATAFORSEO_PASSWORD must be set in .env.local"
    );
  }

  const cred = Buffer.from(`${login}:${password}`).toString("base64");
  return `Basic ${cred}`;
}

async function dataForSeoRequest<T = any>(
  path: string,
  body: unknown
): Promise<T> {
  const res = await fetch(`${DATAFORSEO_API_URL}${path}`, {
    method: "POST",
    headers: {
      Authorization: getAuthHeader(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error("DataForSEO error:", res.status, text);
    throw new Error(
      `DataForSEO request failed: ${res.status} ${res.statusText} – ${text}`
    );
  }

  const json = (await res.json()) as T;
  return json;
}

export interface EnrichedSeoData {
  domain: string;
  page_speed_desktop?: number;
  page_speed_mobile?: number;
  organic_traffic?: number;
  domain_authority?: number;
}

/**
 * Enrich a list of domains with SEO metrics using DataForSEO OnPage and Traffic APIs.
 * Note: This can be expensive and slow if done for many domains.
 * We will use the "Instant" APIs where possible or lightweight checks.
 */
export async function enrichDomainsWithSeoData(
  domains: string[]
): Promise<Record<string, EnrichedSeoData>> {
  if (!domains.length) return {};

  // 1. PageSpeed (using OnPage Instant Pages if available, or just simulating for now as real PageSpeed API is slow/expensive)
  // Actually, for a quick "Lead Gen" list, real PageSpeed takes too long (10-30s per site).
  // Instead, let's check "Domain Rank" / "Traffic" which is instant via DataForSEO Labs.

  const results: Record<string, EnrichedSeoData> = {};

  // Initialize results
  domains.forEach((d) => {
    results[d] = { domain: d };
  });

  try {
    // Batch request for Bulk Traffic Estimation (DataForSEO Labs)
    // Docs: https://docs.dataforseo.com/v3/dataforseo_labs/google/bulk_traffic_estimation/live/
    const trafficPayload = [
      {
        targets: domains.slice(0, 50), // Limit to 50 for safety
        location_code: 2840, // US
        language_code: "en",
      },
    ];

    console.log('🟡 DataForSEO Traffic Request Payload:', JSON.stringify(trafficPayload));
    const trafficData = await dataForSeoRequest<any>(
      "/dataforseo_labs/google/bulk_traffic_estimation/live",
      trafficPayload
    );
    console.log('🟢 DataForSEO Traffic Response Task ID:', trafficData.tasks?.[0]?.id);

    const trafficItems = trafficData.tasks?.[0]?.result?.[0]?.items || [];
    console.log('🟢 DataForSEO Traffic Items Count:', trafficItems.length);

    for (const item of trafficItems) {
      const domain = item.target;
      if (results[domain]) {
        results[domain].organic_traffic = item.metrics?.organic?.etv ?? 0;
        console.log(`🟢 Traffic for ${domain}: ${results[domain].organic_traffic}`);
      }
    }

    // Batch request for Domain Authority / Rank (using Backlinks Summary)
    // Docs: https://docs.dataforseo.com/v3/backlinks/summary/live
    // Note: Backlinks API is separate. If not enabled, we might skip.
    // Let's try a simpler "Rank" from the traffic data if available, or skip to save cost/complexity.
    // The traffic estimation actually gives us a good proxy for "Authority" (more traffic = usually higher authority).

  } catch (err) {
    console.error("Failed to enrich domains with DataForSEO:", err);
    // Return partial results (just empty objects) so we don't crash
  }

  return results;
}

/**
 * Calculate an "Opportunity Score" based on SEO metrics.
 * Lower traffic/speed = Higher Opportunity (they need help).
 */
export function calculateSeoOpportunityScore(data: EnrichedSeoData): number {
  let score = 50; // Base score

  // Traffic Factor
  // If traffic is 0-100, they are invisible -> High Opportunity (+30)
  // If traffic is 100-1000, they are okay -> Medium Opportunity (+10)
  // If traffic is 1000+, they are doing well -> Low Opportunity (-20)
  const traffic = data.organic_traffic ?? 0;
  if (traffic < 100) score += 30;
  else if (traffic < 1000) score += 10;
  else score -= 20;

  // Cap at 0-100
  return Math.max(0, Math.min(100, score));
}