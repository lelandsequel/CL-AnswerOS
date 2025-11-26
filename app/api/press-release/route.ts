import { NextRequest, NextResponse } from "next/server";
import {
  PressReleaseRequest,
  PressReleaseResponse,
} from "@/lib/types";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

function capitalize(str: string) {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

async function generatePRWithClaude(input: PressReleaseRequest): Promise<PressReleaseResponse> {
  const toneGuide = {
    serious: "professional, formal, journalistic tone suitable for traditional business press",
    balanced: "clear, professional but approachable tone that balances credibility with accessibility",
    hype: "energetic, forward-thinking tone with emphasis on innovation and disruption",
  };

  const prompt = `You are a press release writer for a digital consulting and strategy firm. Generate a professional press release with the following details:

Company: ${input.company}
Announcement: ${input.headlineFocus}
Type: ${input.announcementType}
Target Audience: ${input.audience || "general business and tech press"}
Tone: ${toneGuide[input.tone || "balanced"]}
Website: ${input.website || "N/A"}
${input.notes ? `Additional Context: ${input.notes}` : ""}

Generate a JSON response with this exact structure (no markdown, pure JSON):
{
  "headline": "Compelling headline (max 12 words)",
  "subheadline": "Supporting subheadline that adds context",
  "sections": [
    {
      "title": "Section title",
      "content": "Section content (2-3 sentences)"
    }
  ],
  "boilerplate": "About the company (2-3 sentences)",
  "quotes": ["Quote 1", "Quote 2"],
  "socialSnippets": ["Tweet 1", "Tweet 2"]
}

Requirements:
- Headline should be punchy and newsworthy
- Include 4-5 sections: Overview, Why It Matters, How It Works, About [Company], and optionally Contact
- Quotes should sound like real executive quotes
- Social snippets should be tweet-length (under 280 chars)
- Tone should match the specified tone guide
- All content should be specific to the announcement type and audience`;

  const message = await client.messages.create({
    model: "claude-3-5-haiku-20241022",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  const content = message.content[0];
  if (content.type !== "text") {
    throw new Error("Unexpected response type from Claude");
  }

  // Extract JSON from response
  const jsonMatch = content.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Could not parse Claude response as JSON");
  }

  const parsed = JSON.parse(jsonMatch[0]);
  return {
    headline: parsed.headline || "Announcement",
    subheadline: parsed.subheadline || "",
    sections: parsed.sections || [],
    boilerplate: parsed.boilerplate || "",
    quotes: parsed.quotes || [],
    socialSnippets: parsed.socialSnippets || [],
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as any;
    const input: PressReleaseRequest = {
      company: body.company,
      headlineFocus: body.headlineFocus,
      announcementType: body.announcementType,
      tone: body.tone || "balanced",
      website: body.website,
      audience: body.audience,
      notes: body.notes,
      pullFromAudit: body.pullFromAudit,
    };

    if (!input.company || !input.headlineFocus) {
      return NextResponse.json(
        { error: "Missing company or headlineFocus" },
        { status: 400 }
      );
    }

    // Use Claude to generate the PR
    const response = await generatePRWithClaude(input);

    return NextResponse.json(response);
  } catch (err: any) {
    console.error(err);
    return NextResponse.json(
      { error: err.message || "Press release generation failed" },
      { status: 500 }
    );
  }
}

