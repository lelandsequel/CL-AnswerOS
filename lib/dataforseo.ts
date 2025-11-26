// lib/dataforseo.ts
// Thin wrapper around DataForSEO v3 APIs
// We'll start with Keyword Overview (Labs) to get hard keyword metrics.

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

// Types are intentionally loose – we just grab what we need.
export interface KeywordOverviewItem {
  keyword: string;
  search_volume?: number;
  competition?: number;
  cpc?: number;
  keyword_difficulty?: number;
  monthly_searches?: Array<{
    year: number;
    month: number;
    search_volume: number;
  }>;
}

export interface KeywordOverviewResponse {
  tasks?: Array<{
    result?: Array<{
      items?: KeywordOverviewItem[];
    }>;
  }>;
}

/**
 * Get Keyword Overview for a batch of keywords using DataForSEO Labs.
 *
 * Docs:
 * - /v3/dataforseo_labs/google/keyword_overview/live
 *   https://docs.dataforseo.com/v3/dataforseo_labs-google-keyword_overview-live/
 */
export async function getKeywordOverviewForKeywords(options: {
  keywords: string[];
  location_code?: number;
  language_code?: string;
}): Promise<KeywordOverviewItem[]> {
  const { keywords, location_code = 2840, language_code = "en" } = options;

  if (!keywords.length) return [];

  const payload = [
    {
      keywords,
      location_code,
      language_code,
    },
  ];

  const json = await dataForSeoRequest<KeywordOverviewResponse>(
    "/dataforseo_labs/google/keyword_overview/live",
    payload
  );

  const task = json.tasks?.[0];
  const result = task?.result?.[0];
  const items = result?.items ?? [];

  return items;
}

