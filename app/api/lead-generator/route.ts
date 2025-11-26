// app/api/lead-generator/route.ts
import { NextResponse } from 'next/server';
import axios from 'axios';
import { enrichDomainsWithSeoData, calculateSeoOpportunityScore } from '@/lib/dataforseo-enrich';

interface LeadGeneratorRequest {
  keyword: string;
  location: string;
  country: string;
  limit?: number;
  minScore?: number;
}

// Convert country code to full name for Serper
const COUNTRY_FULL_NAMES: Record<string, string> = {
  'US': 'United States',
  'GB': 'United Kingdom',
  'CA': 'Canada',
  'AU': 'Australia',
  'DE': 'Germany',
};

async function fetchBusinessListings(params: LeadGeneratorRequest) {
  const { keyword, location, country, limit = 25 } = params;

  const apiKey = process.env.SERPER_API_KEY;
  const endpoint = 'https://google.serper.dev/places';

  if (!apiKey) {
    throw new Error('SERPER_API_KEY is missing');
  }

  const countryFullName = COUNTRY_FULL_NAMES[country.toUpperCase()] || country;
  
  // Construct a natural language query for Maps
  // e.g. "personal injury lawyer in Houston, TX"
  const query = `${keyword} in ${location}`;

  console.log('🟢 Serper Maps request:', { query, country: countryFullName });

  const payload = {
    q: query,
    gl: country.toLowerCase(),
    hl: 'en',
    limit: Math.max(1, Math.min(limit || 25, 100)),
  };

  let data;
  try {
    const response = await axios.post(endpoint, payload, {
      headers: {
        'X-API-KEY': apiKey,
        'Content-Type': 'application/json',
      },
    });
    data = response.data;
  } catch (axiosError: any) {
    console.error('Axios error:', axiosError?.response?.data || axiosError);
    throw new Error(
      `Serper API request failed: ${axiosError?.message || 'Unknown error'}`,
    );
  }

  const places = data?.places || [];
  console.log('🟣 Serper items_count:', places.length);

  // Extract domains for enrichment
  const domainsToEnrich: string[] = [];
  places.forEach((p: any) => {
    if (p.website) {
      try {
        const url = new URL(p.website);
        domainsToEnrich.push(url.hostname);
      } catch (e) {
        // ignore invalid urls
      }
    }
  });

  // Enrich with DataForSEO
  console.log('🟡 Enriching domains:', domainsToEnrich.length);
  console.log('🟡 Domains to enrich:', domainsToEnrich);
  const enrichedData = await enrichDomainsWithSeoData(domainsToEnrich);
  console.log('🟢 Enriched data keys:', Object.keys(enrichedData));

  // Map Serper results to our Lead format
  const results = places.map((place: any) => {
    let domain = '';
    try {
      if (place.website) {
        domain = new URL(place.website).hostname;
      }
    } catch (e) {}

    const seoData = enrichedData[domain];
    const opportunityScore = seoData ? calculateSeoOpportunityScore(seoData) : 50;

    return {
      title: place.title,
      address: place.address,
      address_info: {
        city: location.split(',')[0].trim(), // Approximate
        country_code: country,
      },
      phone: place.phoneNumber,
      url: place.website,
      rating: {
        value: place.rating,
        votes_count: place.ratingCount,
      },
      category: place.category,
      latitude: place.latitude,
      longitude: place.longitude,
      // Add enriched data
      organic_traffic: seoData?.organic_traffic,
      opportunity_score: opportunityScore,
    };
  });

  // Sort by Opportunity Score (Descending) - highest opportunity first
  results.sort((a: any, b: any) => (b.opportunity_score || 0) - (a.opportunity_score || 0));

  return {
    results,
    raw_count: places.length,
    filtered_count: places.length,
    message: results.length > 0
      ? `Found ${results.length} results for "${query}"`
      : 'No results found',
  };
}

export async function GET() {
  return NextResponse.json({ message: 'Lead Generator API is working' });
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as LeadGeneratorRequest;

    console.log('🟢 Lead Generator API called:', {
      keyword: body.keyword,
      location: body.location,
      country: body.country,
      limit: body.limit,
    });

    if (!body.keyword || !body.location || !body.country) {
      return NextResponse.json(
        { error: 'keyword, location, and country are required' },
        { status: 400 },
      );
    }

    const { results, raw_count, filtered_count, message } =
      await fetchBusinessListings(body);

    return NextResponse.json(
      {
        success: true,
        results,
        raw_count,
        filtered_count,
        message,
      },
      { status: 200 },
    );
  } catch (err: any) {
    console.error('Lead Generator Error:', err);
    console.error('Error details:', {
      message: err?.message,
      response: err?.response?.data,
      stack: err?.stack,
    });

    const errorMessage = err?.message || err?.response?.data?.error || String(err) || 'Internal server error';
    
    return NextResponse.json(
      {
        error: errorMessage,
      },
      { status: 500 },
    );
  }
}
