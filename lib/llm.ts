// lib/llm.ts
// Unified LLM router for LelandOS
// Handles Anthropic (Sonnet / Haiku), OpenAI (GPT-4.1 Instant / 4o-mini), Gemini (2.5 Flash)
// Provides task-based routing, fallbacks, and JSON-friendly helpers.

export type LLMProvider = "anthropic" | "openai" | "gemini";

export type LLMTask =
  | "audit_scan"
  | "audit_analysis"
  | "lelandizer"
  | "lead_scoring"
  | "lead_light"
  | "content_press_release"
  | "content_article"
  | "content_landing"
  | "content_social"
  | "keyword_expand"
  | "keyword_suite"
  | "utility_rewrite"
  | "utility_json_fix"
  | "sales_pitch_deck"
  | "sales_proposal"
  | "sales_roi_calc"
  | "sales_outreach"
  | "sales_emails";

export interface LLMCallOptions {
  provider: LLMProvider;
  model: string;
  system?: string;
  prompt: string;
  temperature?: number;
  maxTokens?: number;
  expectJson?: boolean;
}

export interface LLMTaskOptions {
  task: LLMTask;
  system?: string;
  prompt: string;
  temperatureOverride?: number;
  maxTokensOverride?: number;
  expectJson?: boolean;
}

export interface LLMResult<T = any> {
  text: string;
  raw: T;
}

const MODEL_IDS = {
  anthropic: {
    sonnet: process.env.ANTHROPIC_SONNET_MODEL || "claude-3-5-sonnet-20241022",
    haiku: process.env.ANTHROPIC_HAIKU_MODEL || "claude-3-5-haiku-20241022",
  },
  openai: {
    instant: process.env.OPENAI_INSTANT_MODEL || "gpt-4o-mini",
    mini: process.env.OPENAI_MINI_MODEL || "gpt-4o-mini",
  },
  gemini: {
    flash: process.env.GOOGLE_GEMINI_FLASH_MODEL || "gemini-1.5-flash",
  },
} as const;

interface TaskModelConfig {
  primary: LLMCallOptions;
  fallback?: LLMCallOptions;
}

const TASK_MODELS: Record<LLMTask, TaskModelConfig> = {
  audit_scan: {
    primary: {
      provider: "gemini",
      model: MODEL_IDS.gemini.flash,
      temperature: 0.3,
      maxTokens: 4000,
      prompt: "",
    },
  },
  audit_analysis: {
    primary: {
      provider: "anthropic",
      model: MODEL_IDS.anthropic.sonnet,
      temperature: 0.3,
      maxTokens: 6000,
      prompt: "",
    },
    fallback: {
      provider: "openai",
      model: MODEL_IDS.openai.instant,
      temperature: 0.4,
      maxTokens: 6000,
      prompt: "",
    },
  },
  lelandizer: {
    primary: {
      provider: "openai",
      model: MODEL_IDS.openai.instant,
      temperature: 0.7,
      maxTokens: 2000,
      prompt: "",
    },
    fallback: {
      provider: "anthropic",
      model: MODEL_IDS.anthropic.sonnet,
      temperature: 0.7,
      maxTokens: 2000,
      prompt: "",
    },
  },
  lead_scoring: {
    primary: {
      provider: "anthropic",
      model: MODEL_IDS.anthropic.sonnet,
      temperature: 0.2,
      maxTokens: 3000,
      prompt: "",
    },
    fallback: {
      provider: "openai",
      model: MODEL_IDS.openai.instant,
      temperature: 0.3,
      maxTokens: 3000,
      prompt: "",
    },
  },
  lead_light: {
    primary: {
      provider: "openai",
      model: MODEL_IDS.openai.instant,
      temperature: 0.3,
      maxTokens: 1500,
      prompt: "",
    },
    fallback: {
      provider: "anthropic",
      model: MODEL_IDS.anthropic.haiku,
      temperature: 0.3,
      maxTokens: 1500,
      prompt: "",
    },
  },
  content_press_release: {
    primary: {
      provider: "anthropic",
      model: MODEL_IDS.anthropic.haiku,
      temperature: 0.5,
      maxTokens: 3500,
      prompt: "",
    },
  },
  content_article: {
    primary: {
      provider: "anthropic",
      model: MODEL_IDS.anthropic.haiku,
      temperature: 0.45,
      maxTokens: 6000,
      prompt: "",
    },
    fallback: {
      provider: "openai",
      model: MODEL_IDS.openai.instant,
      temperature: 0.5,
      maxTokens: 6000,
      prompt: "",
    },
  },
  content_landing: {
    primary: {
      provider: "anthropic",
      model: MODEL_IDS.anthropic.haiku,
      temperature: 0.55,
      maxTokens: 3000,
      prompt: "",
    },
    fallback: {
      provider: "openai",
      model: MODEL_IDS.openai.instant,
      temperature: 0.55,
      maxTokens: 3000,
      prompt: "",
    },
  },
  content_social: {
    primary: {
      provider: "anthropic",
      model: MODEL_IDS.anthropic.haiku,
      temperature: 0.7,
      maxTokens: 2500,
      prompt: "",
    },
    fallback: {
      provider: "openai",
      model: MODEL_IDS.openai.instant,
      temperature: 0.75,
      maxTokens: 2500,
      prompt: "",
    },
  },
  keyword_expand: {
    primary: {
      provider: "anthropic",
      model: MODEL_IDS.anthropic.haiku,
      temperature: 0.4,
      maxTokens: 2500,
      prompt: "",
    },
    fallback: {
      provider: "gemini",
      model: MODEL_IDS.gemini.flash,
      temperature: 0.4,
      maxTokens: 2500,
      prompt: "",
    },
  },
  keyword_suite: {
    primary: {
      provider: "gemini",
      model: MODEL_IDS.gemini.flash,
      temperature: 0.3,
      maxTokens: 4000,
      prompt: "",
    },
    fallback: {
      provider: "anthropic",
      model: MODEL_IDS.anthropic.sonnet,
      temperature: 0.3,
      maxTokens: 4000,
      prompt: "",
    },
  },
  utility_rewrite: {
    primary: {
      provider: "openai",
      model: MODEL_IDS.openai.instant,
      temperature: 0.5,
      maxTokens: 2000,
      prompt: "",
    },
    fallback: {
      provider: "anthropic",
      model: MODEL_IDS.anthropic.haiku,
      temperature: 0.5,
      maxTokens: 2000,
      prompt: "",
    },
  },
  utility_json_fix: {
    primary: {
      provider: "openai",
      model: MODEL_IDS.openai.mini,
      temperature: 0.0,
      maxTokens: 1500,
      prompt: "",
    },
    fallback: {
      provider: "anthropic",
      model: MODEL_IDS.anthropic.haiku,
      temperature: 0.0,
      maxTokens: 1500,
      prompt: "",
    },
  },
  sales_pitch_deck: {
    primary: {
      provider: "anthropic",
      model: MODEL_IDS.anthropic.sonnet,
      temperature: 0.6,
      maxTokens: 4000,
      prompt: "",
    },
    fallback: {
      provider: "openai",
      model: MODEL_IDS.openai.instant,
      temperature: 0.6,
      maxTokens: 4000,
      prompt: "",
    },
  },
  sales_proposal: {
    primary: {
      provider: "anthropic",
      model: MODEL_IDS.anthropic.sonnet,
      temperature: 0.4,
      maxTokens: 3500,
      prompt: "",
    },
    fallback: {
      provider: "openai",
      model: MODEL_IDS.openai.instant,
      temperature: 0.4,
      maxTokens: 3500,
      prompt: "",
    },
  },
  sales_roi_calc: {
    primary: {
      provider: "anthropic",
      model: MODEL_IDS.anthropic.haiku,
      temperature: 0.3,
      maxTokens: 2000,
      prompt: "",
    },
    fallback: {
      provider: "openai",
      model: MODEL_IDS.openai.instant,
      temperature: 0.3,
      maxTokens: 2000,
      prompt: "",
    },
  },
  sales_outreach: {
    primary: {
      provider: "anthropic",
      model: MODEL_IDS.anthropic.haiku,
      temperature: 0.7,
      maxTokens: 2500,
      prompt: "",
    },
    fallback: {
      provider: "openai",
      model: MODEL_IDS.openai.instant,
      temperature: 0.7,
      maxTokens: 2500,
      prompt: "",
    },
  },
  sales_emails: {
    primary: {
      provider: "anthropic",
      model: MODEL_IDS.anthropic.haiku,
      temperature: 0.6,
      maxTokens: 3000,
      prompt: "",
    },
    fallback: {
      provider: "openai",
      model: MODEL_IDS.openai.instant,
      temperature: 0.6,
      maxTokens: 3000,
      prompt: "",
    },
  },
};

export async function callLLMTask(
  opts: LLMTaskOptions
): Promise<LLMResult> {
  const config = TASK_MODELS[opts.task];
  if (!config) {
    throw new Error(`No LLM config defined for task "${opts.task}"`);
  }

  const primary: LLMCallOptions = {
    ...config.primary,
    system: opts.system,
    prompt: opts.prompt,
    temperature: opts.temperatureOverride ?? config.primary.temperature,
    maxTokens: opts.maxTokensOverride ?? config.primary.maxTokens,
    expectJson: opts.expectJson,
  };

  try {
    return await callLLM(primary);
  } catch (err) {
    console.error(
      `[LLM Router] Primary model failed for task "${opts.task}"`,
      err
    );
    if (!config.fallback) throw err;

    const fb: LLMCallOptions = {
      ...config.fallback,
      system: opts.system,
      prompt: opts.prompt,
      temperature: opts.temperatureOverride ?? config.fallback.temperature,
      maxTokens: opts.maxTokensOverride ?? config.fallback.maxTokens,
      expectJson: opts.expectJson,
    };

    console.warn(
      `[LLM Router] Using fallback model for task "${opts.task}"`
    );
    return await callLLM(fb);
  }
}

export async function callLLM(
  opts: LLMCallOptions
): Promise<LLMResult> {
  const { provider } = opts;

  let text: string;
  let raw: any;

  if (provider === "anthropic") {
    ({ text, raw } = await callAnthropic(opts));
  } else if (provider === "openai") {
    ({ text, raw } = await callOpenAI(opts));
  } else if (provider === "gemini") {
    ({ text, raw } = await callGemini(opts));
  } else {
    throw new Error(`Unsupported provider: ${provider}`);
  }

  if (opts.expectJson) {
    const json = safeParseJsonFromText(text);
    return { text, raw: { ...raw, parsedJson: json } };
  }

  return { text, raw };
}

async function callAnthropic(opts: LLMCallOptions): Promise<LLMResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not configured");

  const body = {
    model: opts.model,
    max_tokens: opts.maxTokens ?? 2000,
    temperature: opts.temperature ?? 0.5,
    system: opts.system || undefined,
    messages: [{ role: "user" as const, content: opts.prompt }],
  };

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  if (!res.ok) throw new Error(`Anthropic error (${res.status}): ${text}`);

  let json: any = {};
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text };
  }

  const content = json.content?.[0];
  const outputText = content?.text || content?.content || String(text || "");

  return { text: outputText, raw: json };
}

async function callOpenAI(opts: LLMCallOptions): Promise<LLMResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY not configured");

  const body = {
    model: opts.model,
    max_tokens: opts.maxTokens ?? 2000,
    temperature: opts.temperature ?? 0.5,
    messages: [
      ...(opts.system ? [{ role: "system" as const, content: opts.system }] : []),
      { role: "user" as const, content: opts.prompt },
    ],
  };

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  if (!res.ok) throw new Error(`OpenAI error (${res.status}): ${text}`);

  let json: any = {};
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text };
  }

  const message = json.choices?.[0]?.message;
  const outputText = message?.content ?? json.choices?.[0]?.delta?.content ?? String(text || "");

  return { text: outputText, raw: json };
}

async function callGemini(opts: LLMCallOptions): Promise<LLMResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not configured");

  const parts: any[] = [];
  if (opts.system) {
    parts.push({ text: `SYSTEM:\n${opts.system}\n\n---\n\n` });
  }
  parts.push({ text: opts.prompt });

  const body = {
    contents: [{ role: "user", parts }],
    generationConfig: {
      maxOutputTokens: opts.maxTokens ?? 2000,
      temperature: opts.temperature ?? 0.5,
    },
  };

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${opts.model}:generateContent?key=${apiKey}`;

  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  if (!res.ok) throw new Error(`Gemini error (${res.status}): ${text}`);

  let json: any = {};
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text };
  }

  const candidates = json.candidates?.[0];
  const candidateText = candidates?.content?.parts?.map((p: any) => p.text || "").join("") || String(text || "");

  return { text: candidateText, raw: json };
}

export function safeParseJsonFromText(text: string): any | null {
  if (!text) return null;
  let cleaned = text.trim();

  const fence = cleaned.match(/```json([\s\S]*?)```/i);
  if (fence) cleaned = fence[1].trim();

  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  const firstBracket = cleaned.indexOf("[");
  const lastBracket = cleaned.lastIndexOf("]");

  let candidate = cleaned;
  if (firstBrace !== -1 && lastBrace !== -1) {
    candidate = cleaned.slice(firstBrace, lastBrace + 1);
  } else if (firstBracket !== -1 && lastBracket !== -1) {
    candidate = cleaned.slice(firstBracket, lastBracket + 1);
  }

  try {
    return JSON.parse(candidate);
  } catch {
    return null;
  }
}

export function requireJsonFromText(text: string): any {
  const parsed = safeParseJsonFromText(text);
  if (!parsed) throw new Error("Failed to parse JSON from LLM output");
  return parsed;
}

export async function runAuditAnalysisLLM(
  prompt: string,
  options?: { expectJson?: boolean }
): Promise<LLMResult> {
  return callLLMTask({
    task: "audit_analysis",
    prompt,
    expectJson: options?.expectJson ?? true,
  });
}

export async function runLeadScoringLLM(
  prompt: string,
  options?: { expectJson?: boolean }
): Promise<LLMResult> {
  return callLLMTask({
    task: "lead_scoring",
    prompt,
    expectJson: options?.expectJson ?? true,
  });
}

export async function runContentLLM(
  mode: "press_release" | "article" | "landing" | "social",
  prompt: string,
  options?: { expectJson?: boolean }
): Promise<LLMResult> {
  const taskMap: Record<string, LLMTask> = {
    press_release: "content_press_release",
    article: "content_article",
    landing: "content_landing",
    social: "content_social",
  };

  const task = taskMap[mode];
  return callLLMTask({
    task,
    prompt,
    expectJson: options?.expectJson ?? true,
  });
}

export async function runKeywordExpandLLM(
  prompt: string,
  options?: { expectJson?: boolean }
): Promise<LLMResult> {
  return callLLMTask({
    task: "keyword_expand",
    prompt,
    expectJson: options?.expectJson ?? true,
  });
}

export async function runKeywordSuiteLLM(
  prompt: string,
  options?: { expectJson?: boolean }
): Promise<LLMResult> {
  return callLLMTask({
    task: "keyword_suite",
    prompt,
    expectJson: options?.expectJson ?? true,
  });
}

export async function runRewriteLLM(prompt: string): Promise<LLMResult> {
  return callLLMTask({
    task: "utility_rewrite",
    prompt,
    expectJson: false,
  });
}

export async function runJsonFixLLM(prompt: string): Promise<LLMResult> {
  return callLLMTask({
    task: "utility_json_fix",
    prompt,
    expectJson: true,
  });
}

export async function runLelandizerLLM(
  prompt: string,
  temperatureOverride?: number
): Promise<LLMResult> {
  return callLLMTask({
    task: "lelandizer",
    prompt,
    temperatureOverride,
    expectJson: false,
  });
}

