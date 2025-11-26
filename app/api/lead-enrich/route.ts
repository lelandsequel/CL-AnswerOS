// app/api/lead-enrich/route.ts
import { NextResponse } from 'next/server';
import { callLLMTask } from '@/lib/llm';

type LeadEnrichRequest = {
  leads: any[];
  keyword?: string;
  location?: string;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as LeadEnrichRequest;
    const leads = Array.isArray(body.leads) ? body.leads : [];
    const keyword = body.keyword || '';
    const location = body.location || '';

    if (!leads.length) {
      return NextResponse.json(
        { error: 'No leads provided to enrich' },
        { status: 400 },
      );
    }

    // Keep payload small-ish for reliability
    const limited = leads.slice(0, 40);

    const slim = limited.map((lead, index) => ({
      index,
      name:
        lead.title ||
        lead.name ||
        lead.business_name ||
        lead.business_title ||
        lead.gmb_name ||
        null,
      rating:
        typeof lead.rating === 'number'
          ? lead.rating
          : lead.rating?.value ?? null,
      reviews_count:
        lead.reviews_count ??
        lead.rating?.votes_count ??
        null,
      website: lead.domain || lead.site || lead.url || lead.place_url || null,
      location:
        lead.address ||
        lead.address_info?.formatted_address ||
        lead.address_info?.address ||
        lead.city ||
        lead.location ||
        null,
      categories: lead.category || lead.categories || null,
    }));

    const systemPrompt = `
You are an elite outbound strategist for a high-ticket SEO/AEO & digital growth agency.

For each business in the list, you must:
- Score "OPPORTUNITY" from 0–100: how good a sales prospect they are.
- Score "SEO" from 0–100: how weak their SEO/AEO/web presence likely is (higher = more problems).
- Provide 2–4 short, punchy issue statements describing what's probably wrong (from a growth/SEO/AEO standpoint).
- Provide a 1-sentence quick pitch you could drop into a cold outreach email.

Context:
- Niche: ${keyword}
- Location: ${location}

Return ONLY JSON with this shape:

{
  "scored": [
    {
      "index": number,
      "opportunity_score": number,
      "seo_score": number,
      "issues": string[],
      "quick_pitch": string
    }
  ]
}
`.trim();

    const userPrompt = `
Here are the businesses as JSON:

${JSON.stringify(slim, null, 2)}

Respond with ONLY the JSON object described above and nothing else.
`.trim();

    // Use unified LLM router with lead_scoring task
    const result = await callLLMTask({
      task: 'lead_scoring',
      system: systemPrompt,
      prompt: userPrompt,
      expectJson: true,
    });

    const textContent = result.text;

    if (typeof textContent !== 'string') {
      console.error('LLM response missing text:', result);
      return NextResponse.json(
        { error: 'LLM response missing text content' },
        { status: 500 },
      );
    }

    let parsed: any;
    try {
      // Extract JSON from markdown code blocks if present
      let jsonStr = textContent;
      const jsonMatch = textContent.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1];
      }
      parsed = JSON.parse(jsonStr);
    } catch (err) {
      console.error('Failed to parse LLM JSON:', textContent, err);
      return NextResponse.json(
        { error: 'Failed to parse enrichment JSON' },
        { status: 500 },
      );
    }

    const scoredArr: {
      index: number;
      opportunity_score: number;
      seo_score: number;
      issues: string[];
      quick_pitch: string;
    }[] = parsed?.scored ?? [];

    const scoreMap = new Map<
      number,
      {
        opportunity_score: number;
        seo_score: number;
        issues: string[];
        quick_pitch: string;
      }
    >();

    for (const s of scoredArr) {
      if (typeof s.index !== 'number') continue;
      scoreMap.set(s.index, {
        opportunity_score: Math.max(
          0,
          Math.min(100, Number(s.opportunity_score ?? 0)),
        ),
        seo_score: Math.max(0, Math.min(100, Number(s.seo_score ?? 0))),
        issues: Array.isArray(s.issues)
          ? s.issues.filter((i: any) => typeof i === 'string').slice(0, 5)
          : [],
        quick_pitch:
          typeof s.quick_pitch === 'string' ? s.quick_pitch : '',
      });
    }

    // Merge back into original leads array
    const enriched = leads.map((lead, idx) => {
      // find mapping index in limited slice
      const limitedIndex = limited.indexOf(lead);
      if (limitedIndex === -1) return lead;

      const scored = scoreMap.get(limitedIndex);
      if (!scored) return lead;

      return {
        ...lead,
        opportunity_score: scored.opportunity_score,
        seo_score: scored.seo_score,
        issues: scored.issues,
        score_reason: scored.quick_pitch,
        score: scored.opportunity_score,
      };
    });

    return NextResponse.json(
      {
        success: true,
        results: enriched,
      },
      { status: 200 },
    );
  } catch (err: any) {
    console.error('Lead Enrich Error:', err);
    return NextResponse.json(
      { error: err?.message || 'Internal server error' },
      { status: 500 },
    );
  }
}

