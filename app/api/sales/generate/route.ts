import { NextRequest, NextResponse } from "next/server";
import { callLLMTask, safeParseJsonFromText } from "@/lib/llm";

type SalesMode = "pitch_deck" | "proposal" | "roi_calc" | "outreach" | "emails";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { mode, companyName, industry, services, budget, timeline, painPoints, goals } = body;

    if (!mode || !companyName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Map mode to LLM task
    const taskMap: Record<string, string> = {
      pitch_deck: "sales_pitch_deck",
      proposal: "sales_proposal",
      roi_calc: "sales_roi_calc",
      outreach: "sales_outreach",
      emails: "sales_emails",
    };

    const llmTask = taskMap[mode];
    if (!llmTask) {
      return NextResponse.json({ error: `Unsupported mode: ${mode}` }, { status: 400 });
    }

    const prompt = buildSalesPrompt(mode, {
      companyName,
      industry,
      services,
      budget,
      timeline,
      painPoints,
      goals,
    });

    const { text } = await callLLMTask({
      task: llmTask as any,
      prompt,
      expectJson: true,
    });

    const result = safeParseJsonFromText(text);
    if (!result) {
      return NextResponse.json(
        { error: "LLM returned non-JSON content", text: text.substring(0, 500) },
        { status: 500 }
      );
    }
    return NextResponse.json({ result });
  } catch (err: any) {
    console.error("[Sales API Error]", err);
    return NextResponse.json(
      { error: err?.message || "Sales generation failed" },
      { status: 500 }
    );
  }
}

function buildSalesPrompt(mode: SalesMode, data: any): string {
  const { companyName, industry, services, budget, timeline, painPoints, goals } = data;

  const context = `
Company: ${companyName}
Industry: ${industry}
Services: ${services}
${budget ? `Budget: ${budget}` : ''}
${timeline ? `Timeline: ${timeline}` : ''}
Pain Points: ${painPoints || 'Not specified'}
Goals: ${goals || 'Not specified'}
`;

  switch (mode) {
    case "pitch_deck":
      return `
You are a sales deck expert creating compelling pitch decks for SEO/digital marketing services.

${context}

Create a 10-slide pitch deck in JSON format:

{
  "slides": [
    {
      "title": "Slide Title",
      "content": "Main content for this slide",
      "keyPoints": ["Bullet point 1", "Bullet point 2"]
    }
  ]
}

Focus on:
- Problem identification
- Solution value proposition
- Social proof/results
- Clear next steps

Make it persuasive and conversion-focused.
`;

    case "proposal":
      return `
You are a professional proposal writer creating detailed service proposals.

${context}

Create a comprehensive proposal in JSON format:

{
  "executiveSummary": "Brief overview of the proposal",
  "scopeOfWork": "Detailed description of services to be provided",
  "timeline": "Project timeline and milestones",
  "pricing": "Pricing structure and payment terms",
  "terms": "Terms and conditions"
}

Make it professional, detailed, and compelling.
`;

    case "roi_calc":
      return `
You are an ROI calculator expert creating detailed financial projections.

${context}

Create an ROI analysis in JSON format:

{
  "currentRevenue": "$X per month",
  "projectedRevenue": "$Y per month",
  "roiMultiple": "Zx",
  "breakdown": "Detailed explanation of calculations and assumptions",
  "timeline": "When ROI will be achieved"
}

Use realistic numbers based on industry standards for SEO/digital marketing.
`;

    case "outreach":
      return `
You are an outreach expert creating compelling scripts for prospecting.

${context}

Create 3 outreach scripts in JSON format:

{
  "templates": [
    {
      "title": "Cold Email Script",
      "content": "Full email script with subject line and body"
    },
    {
      "title": "LinkedIn Message",
      "content": "LinkedIn outreach message"
    },
    {
      "title": "Follow-up Script",
      "content": "Follow-up communication script"
    }
  ]
}

Make them personalized, value-focused, and conversion-oriented.
`;

    case "emails":
      return `
You are an email marketing expert creating professional client communication templates.

${context}

Create 4 email templates in JSON format:

{
  "templates": [
    {
      "subject": "Email Subject Line",
      "content": "Full email body with greeting, content, and call-to-action"
    }
  ]
}

Include:
- Welcome/onboarding email
- Project update email
- Results delivery email
- Follow-up/re-engagement email

Make them professional, personalized, and action-oriented.
`;

    default:
      return "Return an error message for unsupported mode";
  }
}