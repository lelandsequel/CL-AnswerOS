// lib/dataforseo-keywords.ts
// DataForSEO helpers for keyword ideas + volumes

import { KeywordIdea, KeywordRequest } from "@/lib/types";

const DATAFORSEO_LOGIN = process.env.DATAFORSEO_LOGIN;
const DATAFORSEO_PASSWORD = process.env.DATAFORSEO_PASSWORD;

if (!DATAFORSEO_LOGIN || !DATAFORSEO_PASSWORD) {
  // eslint-disable-next-line no-console
  console.warn(
    "[DataForSEO] Keyword endpoints need DATAFORSEO_LOGIN and DATAFORSEO_PASSWORD in env."
  );
}

function getAuthHeader() {
  if (!DATAFORSEO_LOGIN || !DATAFORSEO_PASSWORD) return undefined;
  const token = Buffer.from(
    `${DATAFORSEO_LOGIN}:${DATAFORSEO_PASSWORD}`
  ).toString("base64");
  return `Basic ${token}`;
}

interface DFSKeywordIdeaItem {
  keyword: string;
  avg_monthly_searches?: number;
  competition?: number;
  cpc?: number;
}

interface DFSSearchVolumeItem {
  keyword: string;
  search_volume: number;
  competition: number;
  cpc: number;
}

/**
 * Fetch keyword ideas from DataForSEO based on seed keyword and/or URL.
 * This uses a simplified combination of "keywords_for_site" and "search_volume".
 */
export async function fetchKeywordIdeas(
  req: KeywordRequest
): Promise<KeywordIdea[]> {
  const auth = getAuthHeader();
  if (!auth) {
    throw new Error(
      "DATAFORSEO_LOGIN / DATAFORSEO_PASSWORD not configured"
    );
  }

  const location = req.location || "United States";
  const language = req.language || "English";
  const limit = req.limit && req.limit > 0 ? req.limit : 50;

  if (!req.seedKeyword && !req.url) {
    throw new Error("seedKeyword or url is required");
  }

  const tasks: any[] = [];

  if (req.seedKeyword) {
    tasks.push({
      keywords: [req.seedKeyword],
      location_code: 2840, // US
      language_name: language,
      limit,
    });
  }

  if (req.url) {
    tasks.push({
      url: req.url,
      location_code: 2840, // US
      language_name: language,
      limit,
    });
  }

  if (!tasks.length) {
    throw new Error("No keyword tasks to send to DataForSEO");
  }

  // 1) Keyword ideas (Google Ads-style)
  const endpoint = req.url
    ? "https://api.dataforseo.com/v3/keywords_data/google_ads/keywords_for_site/live"
    : "https://api.dataforseo.com/v3/keywords_data/google_ads/keywords_for_keywords/live";

  const ideaRes = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: auth,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(tasks),
  });

  const ideaText = await ideaRes.text();
  console.log("[DataForSEO] Keyword ideas response status:", ideaRes.status);
  console.log("[DataForSEO] Keyword ideas response preview:", ideaText.substring(0, 500));
  if (!ideaRes.ok) {
    console.error("DataForSEO keyword ideas error:", ideaText);
    throw new Error(
      `Keyword ideas API error: ${ideaRes.status} ${ideaRes.statusText}`
    );
  }

  let ideaJson: any = {};
  try {
    ideaJson = JSON.parse(ideaText);
  } catch (e) {
    console.error("Failed to parse DFS keyword ideas JSON:", e);
    throw new Error("Could not parse DataForSEO keyword ideas response");
  }

  console.log("[DataForSEO] Parsed response structure:", {
    tasksCount: ideaJson.tasks?.length,
    firstTask: ideaJson.tasks?.[0] ? {
      status: ideaJson.tasks[0].status_code,
      resultCount: ideaJson.tasks[0].result_count,
      hasResult: !!ideaJson.tasks[0].result,
      resultType: typeof ideaJson.tasks[0].result,
      isArray: Array.isArray(ideaJson.tasks[0].result),
      resultKeys: typeof ideaJson.tasks[0].result === 'object' && ideaJson.tasks[0].result !== null ? Object.keys(ideaJson.tasks[0].result).slice(0, 5) : 'not object',
      resultLength: Array.isArray(ideaJson.tasks[0].result) ? ideaJson.tasks[0].result.length : (typeof ideaJson.tasks[0].result === 'object' ? Object.keys(ideaJson.tasks[0].result).length : 'unknown')
    } : 'no tasks'
  });

  const ideaItems: DFSKeywordIdeaItem[] = [];

  if (Array.isArray(ideaJson?.tasks)) {
    for (const task of ideaJson.tasks) {
      console.log("[DataForSEO] Processing task:", task.id, "result_count:", task.result_count);
      if (!task?.result) {
        console.log("[DataForSEO] No result in task");
        continue;
      }

      // For keywords_for_keywords, result is an object with keyword keys
      if (typeof task.result === 'object' && !Array.isArray(task.result)) {
        console.log("[DataForSEO] Result is object with keys:", Object.keys(task.result).length);
        for (const keywordKey in task.result) {
          const keywordData = task.result[keywordKey];
          if (keywordData && typeof keywordData === 'object') {
            console.log("[DataForSEO] Processing keyword:", keywordKey, "data keys:", Object.keys(keywordData));
            // The keyword data might be nested
            if (Array.isArray(keywordData)) {
              for (const item of keywordData) {
                ideaItems.push(item as DFSKeywordIdeaItem);
              }
            } else if (keywordData.keyword) {
              ideaItems.push(keywordData as DFSKeywordIdeaItem);
            }
          }
        }
      } else if (Array.isArray(task.result)) {
        // For keywords_for_keywords, result is a direct array of keyword objects
        console.log("[DataForSEO] Result is array with", task.result.length, "items");
        for (const item of task.result) {
          console.log("[DataForSEO] Array item type:", typeof item, "keys:", Object.keys(item || {}));
          if (item && typeof item === 'object' && item.keyword) {
            ideaItems.push(item as DFSKeywordIdeaItem);
          }
        }
      }
    }
  }

  console.log("[DataForSEO] Extracted", ideaItems.length, "idea items");

  // Deduplicate by keyword
  const seen = new Set<string>();
  const uniqueIdeas: DFSKeywordIdeaItem[] = [];
  for (const item of ideaItems) {
    const kw = (item.keyword || "").toLowerCase();
    if (!kw || seen.has(kw)) continue;
    seen.add(kw);
    uniqueIdeas.push(item);
  }

  // 2) Optional: fetch search volume details for the collected ideas
  const keywordsForVolume = uniqueIdeas
    .slice(0, limit)
    .map((k) => k.keyword)
    .filter(Boolean);

  let volumeMap = new Map<string, DFSSearchVolumeItem>();

  if (keywordsForVolume.length) {
    const volumePayload = keywordsForVolume.map((kw) => ({
      keyword: kw,
      location_code: 2840, // US
      language_name: language,
    }));

    const volRes = await fetch(
      "https://api.dataforseo.com/v3/keywords_data/google_ads/search_volume/live",
      {
        method: "POST",
        headers: {
          Authorization: auth,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(volumePayload),
      }
    );

    const volText = await volRes.text();
    if (!volRes.ok) {
      console.error("DataForSEO search volume error:", volText);
      // We can still proceed with ideas-only; don't throw here
    } else {
      try {
        const volJson = JSON.parse(volText);
        if (Array.isArray(volJson?.tasks)) {
          for (const task of volJson.tasks) {
            if (!Array.isArray(task?.result)) continue;
            for (const result of task.result) {
              if (!Array.isArray(result?.items)) continue;
              for (const item of result.items) {
                const k = (item.keyword || "").toLowerCase();
                if (!k) continue;
                volumeMap.set(k, item as DFSSearchVolumeItem);
              }
            }
          }
        }
      } catch (e) {
        console.error("Failed to parse DFS search volume JSON:", e);
      }
    }
  }

  const keywordIdeas: KeywordIdea[] = uniqueIdeas
    .slice(0, limit)
    .map((it) => {
      const kw = (it.keyword || "").toLowerCase();
      const volItem = volumeMap.get(kw);

      const searchVolume =
        typeof volItem?.search_volume === "number"
          ? volItem.search_volume
          : typeof it.avg_monthly_searches === "number"
          ? it.avg_monthly_searches
          : undefined;

      const cpc =
        typeof volItem?.cpc === "number"
          ? volItem.cpc
          : typeof it.cpc === "number"
          ? it.cpc
          : undefined;

      const competitionIndex =
        typeof volItem?.competition === "number"
          ? volItem.competition
          : typeof it.competition === "number"
          ? it.competition
          : undefined;

      return {
        keyword: it.keyword || "",
        searchVolume,
        cpc,
        competitionIndex,
      } as KeywordIdea;
    })
    .filter((k) => !!k.keyword);

  return keywordIdeas;
}

