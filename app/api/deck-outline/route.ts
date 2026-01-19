// app/api/deck-outline/route.ts
// Deck outline generation API endpoint

import { NextRequest, NextResponse } from "next/server";
import { DeckOutlineRequestSchema } from "@/lib/pseo-types";
import { generateDeckOutline } from "@/lib/deck-outline";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate request
    const validation = DeckOutlineRequestSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validation.error.flatten(),
        },
        { status: 400 }
      );
    }

    const request = validation.data;

    // Generate deck outline
    const result = await generateDeckOutline(request);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("[deck-outline] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to generate deck outline",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

