// lib/dataforseo-leads.ts
import { Lead } from "@/lib/types";

interface DataForSEOBusinessListingItem {
  title?: string;
  description?: string | null;
  category?: string | null;
  address?: string | null;
  address_info?: {
    borough?: string | null;
    address?: string | null;
    city?: string | null;
    zip?: string | null;
    region?: string | null;
    country_code?: string | null;
  } | null;
  phone?: string | null;
  url?: string | null;
  domain?: string | null;
  snippet?: string | null;
  rating?: {
    rating_type?: string | null;
    value?: number | null;
    votes_count?: number | null;
    rating_max?: number | null;
  } | null;
}

const DATAFORSEO_LOGIN = process.env.DATAFORSEO_LOGIN;
const DATAFORSEO_PASSWORD = process.env.DATAFORSEO_PASSWORD;

if (!DATAFORSEO_LOGIN || !DATAFORSEO_PASSWORD) {
  console.warn(
    "[DataForSEO] DATAFORSEO_LOGIN or DATAFORSEO_PASSWORD is not set. Lead generator will fail until configured."
  );
}

function getAuthHeader() {
  if (!DATAFORSEO_LOGIN || !DATAFORSEO_PASSWORD) return undefined;
  const token = Buffer.from(
    `${DATAFORSEO_LOGIN}:${DATAFORSEO_PASSWORD}`
  ).toString("base64");
  return `Basic ${token}`;
}

export interface BusinessListingsOptions {
  industry: string;
  locationName: string;   // e.g. "Houston, Texas" or "77007"
  countryCode: string;    // e.g. "US"
  limit: number;
}

export async function fetchBusinessListingsForLeads(
  opts: BusinessListingsOptions
): Promise<DataForSEOBusinessListingItem[]> {
  const auth = getAuthHeader();
  if (!auth) {
    throw new Error(
      "DATAFORSEO_LOGIN / DATAFORSEO_PASSWORD not configured in environment"
    );
  }

  // Shape is based on DFS business listings search/live
  const payload = [
    {
      location_name: opts.locationName,
      location_code: null, // let DFS resolve from name
      language_name: "English",
      keyword: opts.industry,
      limit: opts.limit,
      order_by: ["rating.value,desc"],
    },
  ];

  const res = await fetch(
    "https://api.dataforseo.com/v3/business_data/google/my_business/search/live",
    {
      method: "POST",
      headers: {
        Authorization: auth,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }
  );

  const text = await res.text();
  if (!res.ok) {
    console.error("DataForSEO lead search error:", text);
    throw new Error(
      `DataForSEO Business Listings API error: ${res.status} ${res.statusText} – ${text}`
    );
  }

  let json: any = {};
  try {
    json = JSON.parse(text);
  } catch (e) {
    console.error("Failed to parse DataForSEO JSON:", e, text);
    throw new Error("Could not parse DataForSEO response");
  }

  const items: DataForSEOBusinessListingItem[] = [];

  if (Array.isArray(json?.tasks)) {
    for (const task of json.tasks) {
      if (!Array.isArray(task?.result)) continue;
      for (const result of task.result) {
        if (!Array.isArray(result?.items)) continue;
        for (const item of result.items) {
          items.push(item as DataForSEOBusinessListingItem);
        }
      }
    }
  }

  return items;
}

export function mapBusinessListingsToBasicLeads(
  listings: DataForSEOBusinessListingItem[],
  industryLabel: string
): Lead[] {
  return listings.map((b) => {
    const city = b.address_info?.city || "";
    const region = b.address_info?.region || "";
    const zip = b.address_info?.zip || "";
    const country = b.address_info?.country_code || "";

    const locParts = [city, region, zip, country].filter(Boolean);
    const location = locParts.length
      ? locParts.join(", ")
      : b.address || "";

    const ratingValue =
      typeof b.rating?.value === "number" ? b.rating.value : undefined;
    const ratingVotes =
      typeof b.rating?.votes_count === "number"
        ? b.rating.votes_count
        : undefined;

    const website = b.url || (b.domain ? `https://${b.domain}` : "");

    return {
      name: b.title || "Unknown business",
      website,
      location,
      industry: industryLabel,
      contactPhone: b.phone || undefined,
      description: b.description || b.snippet || undefined,
      rating: ratingValue,
      ratingVotes,
      rawCategory: b.category || undefined,
    } as Lead;
  });
}

