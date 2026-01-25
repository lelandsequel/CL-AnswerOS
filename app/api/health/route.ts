// app/api/health/route.ts
// Health check endpoint - public, no auth required

import { NextResponse } from 'next/server';

export async function GET() {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    services: {
      database: 'ok', // SQLite is file-based, always "ok" if app runs
      llm: checkLLMConfig(),
      dataforseo: checkDataForSEOConfig(),
    },
  };

  return NextResponse.json(health);
}

function checkLLMConfig(): 'configured' | 'partial' | 'not_configured' {
  const hasAnthropic = !!process.env.ANTHROPIC_API_KEY;
  const hasOpenAI = !!process.env.OPENAI_API_KEY;
  const hasGemini = !!process.env.GOOGLE_GEMINI_API_KEY;

  if (hasAnthropic || hasOpenAI || hasGemini) {
    return hasAnthropic && hasOpenAI && hasGemini ? 'configured' : 'partial';
  }
  return 'not_configured';
}

function checkDataForSEOConfig(): 'configured' | 'not_configured' {
  const hasLogin = !!process.env.DATAFORSEO_LOGIN;
  const hasPassword = !!process.env.DATAFORSEO_PASSWORD;

  return hasLogin && hasPassword ? 'configured' : 'not_configured';
}
