import { NextRequest, NextResponse } from "next/server";
import { callLLMTask, safeParseJsonFromText } from "@/lib/llm";

interface ToneAdjustRequest {
  text: string;
  sass: number;
  tone: "founder" | "analyst" | "pablo";
}

interface ToneAdjustResponse {
  original: string;
  adjusted: string;
  tone: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ToneAdjustRequest;

    if (!body || !body.text) {
      return NextResponse.json(
        { error: "Text is required for tone adjustment" },
        { status: 400 }
      );
    }

    const { text, sass, tone } = body;

    const prompt = `
You are a tone adjustment specialist. Transform the given text to match the specified tone and intensity level.

Tone: ${tone}
Intensity Level: ${sass}/10 (1 = subtle, 10 = extreme)

Available tones:
- founder: Visionary, strategic, motivational
- analyst: Data-driven, logical, professional
- pablo: Unhinged genius, creative, unconventional

Transform the text while maintaining its core meaning but adjusting the voice, style, and intensity according to the specified tone and level.

Return ONLY a JSON object:
{
  "adjusted": "the transformed text"
}
`;

    const { text: responseText } = await callLLMTask({
      task: "utility_rewrite",
      prompt,
      expectJson: true,
    });

    const parsed = safeParseJsonFromText(responseText);

    if (!parsed || !parsed.adjusted) {
      return NextResponse.json(
        { error: "Failed to adjust tone", rawText: responseText },
        { status: 500 }
      );
    }

    const response: ToneAdjustResponse = {
      original: text,
      adjusted: parsed.adjusted,
      tone,
    };

    return NextResponse.json(response);
  } catch (err: any) {
    console.error("[tone-adjust] error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to adjust tone" },
      { status: 500 }
    );
  }
}