// =======================================================================
// lib/dataforseo-extended.ts - Extended DataForSEO utilities
// NOTE: requires DataForSEO creds in env:
//   DATAFORSEO_LOGIN=your_login
//   DATAFORSEO_PASSWORD=your_password
// =======================================================================

const DATAFORSEO_LOGIN = process.env.DATAFORSEO_LOGIN;
const DATAFORSEO_PASSWORD = process.env.DATAFORSEO_PASSWORD;

interface DFSKeywordTask {
  keyword: string;
  language_name?: string;
  location_name?: string;
}

export async function fetchKeywordDataFromDataForSEO(
  keywords: string[],
  {
    language_name = "English",
    location_name = "United States",
  }: { language_name?: string; location_name?: string } = {}
) {
  if (!DATAFORSEO_LOGIN || !DATAFORSEO_PASSWORD) {
    console.warn("DataForSEO credentials missing – returning mock data");
    // fallback mock
    return keywords.map((k, idx) => ({
      keyword: k,
      searchVolume: 1000 - idx * 37,
      cpc: +(1.5 + idx * 0.12).toFixed(2),
      competition: +(0.2 + idx * 0.05).toFixed(2),
    }));
  }

  const auth = Buffer.from(
    `${DATAFORSEO_LOGIN}:${DATAFORSEO_PASSWORD}`
  ).toString("base64");

  const tasks: DFSKeywordTask[] = keywords.map((k) => ({
    keyword: k,
    language_name,
    location_name,
  }));

  const res = await fetch(
    "https://api.dataforseo.com/v3/keywords_data/google_ads/search_volume/live",
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(tasks),
    }
  );

  if (!res.ok) {
    console.error("DataForSEO error", await res.text());
    throw new Error("DataForSEO request failed");
  }

  const json = await res.json();

  // shape depends on DFS; adapt to what you actually get
  const results: any[] =
    json.tasks?.[0]?.result?.[0]?.items || json.tasks?.[0]?.result || [];

  return results.map((item: any) => ({
    keyword: item.keyword || item.keyword_text || "",
    searchVolume: item.search_volume || item.avg_search_volume || 0,
    cpc: item.cpc ? item.cpc / 100 : 0,
    competition: item.competition || 0,
  }));
}

