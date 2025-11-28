// =======================================================================
// lib/audit-utils.ts - Error handling & cost tracking utilities for audits
// =======================================================================

/**
 * Cost tracking for audit operations
 * Tracks estimated costs per LLM provider and operation
 */
export interface AuditCost {
  provider: string;
  operation: string;
  inputTokens: number;
  outputTokens: number;
  estimatedCost: number;
  timestamp: Date;
}

// Estimated costs per 1K tokens (approximate, as of late 2024)
const COST_PER_1K_TOKENS: Record<string, { input: number; output: number }> = {
  "claude-sonnet": { input: 0.003, output: 0.015 },
  "claude-haiku": { input: 0.00025, output: 0.00125 },
  "gpt-4o": { input: 0.005, output: 0.015 },
  "gpt-4o-mini": { input: 0.00015, output: 0.0006 },
  "gemini-flash": { input: 0.000075, output: 0.0003 },
};

/**
 * Calculate estimated cost for an LLM operation
 */
export function calculateCost(
  provider: string,
  inputTokens: number,
  outputTokens: number
): number {
  const costs = COST_PER_1K_TOKENS[provider] || COST_PER_1K_TOKENS["gpt-4o-mini"];
  const inputCost = (inputTokens / 1000) * costs.input;
  const outputCost = (outputTokens / 1000) * costs.output;
  return inputCost + outputCost;
}

/**
 * Log cost for an audit operation
 */
export function logAuditCost(cost: AuditCost): void {
  console.log(
    `[AUDIT COST] ${cost.operation} via ${cost.provider}: ` +
    `$${cost.estimatedCost.toFixed(4)} ` +
    `(${cost.inputTokens} in / ${cost.outputTokens} out)`
  );
}

/**
 * Retry configuration for API calls
 */
export interface RetryConfig {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 30000,
  backoffMultiplier: 2,
};

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Execute a function with exponential backoff retry logic
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const {
    maxRetries,
    initialDelayMs,
    maxDelayMs,
    backoffMultiplier,
  } = { ...DEFAULT_RETRY_CONFIG, ...config };

  let lastError: Error | null = null;
  let delay = initialDelayMs;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Check if error is retryable
      const isRetryable = isRetryableError(lastError);
      
      if (!isRetryable || attempt === maxRetries) {
        console.error(
          `[RETRY] Failed after ${attempt + 1} attempts:`,
          lastError.message
        );
        throw lastError;
      }

      console.warn(
        `[RETRY] Attempt ${attempt + 1} failed, retrying in ${delay}ms:`,
        lastError.message
      );
      
      await sleep(delay);
      delay = Math.min(delay * backoffMultiplier, maxDelayMs);
    }
  }

  throw lastError || new Error("Retry failed with unknown error");
}

/**
 * Determine if an error is retryable
 */
function isRetryableError(error: Error): boolean {
  const message = error.message.toLowerCase();
  
  // Rate limiting errors
  if (message.includes("rate limit") || message.includes("429")) {
    return true;
  }
  
  // Server errors
  if (message.includes("500") || message.includes("502") || 
      message.includes("503") || message.includes("504")) {
    return true;
  }
  
  // Network errors
  if (message.includes("timeout") || message.includes("econnreset") ||
      message.includes("network") || message.includes("fetch failed")) {
    return true;
  }
  
  // Temporary API issues
  if (message.includes("temporarily unavailable") || 
      message.includes("overloaded")) {
    return true;
  }
  
  return false;
}

/**
 * Simple request queue to prevent overwhelming APIs
 */
class RequestQueue {
  private queue: Array<() => Promise<void>> = [];
  private processing = false;
  private minDelayMs: number;

  constructor(minDelayMs = 100) {
    this.minDelayMs = minDelayMs;
  }

  async add<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await fn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });

      if (!this.processing) {
        this.process();
      }
    });
  }

  private async process(): Promise<void> {
    this.processing = true;

    while (this.queue.length > 0) {
      const fn = this.queue.shift();
      if (fn) {
        await fn();
        if (this.queue.length > 0) {
          await sleep(this.minDelayMs);
        }
      }
    }

    this.processing = false;
  }
}

// Global request queue instance
export const auditRequestQueue = new RequestQueue(200);

/**
 * Validate URL format
 */
export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Extract domain from URL
 */
export function extractDomain(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, "");
  } catch {
    return url.replace(/^https?:\/\//, "").split("/")[0].replace(/^www\./, "");
  }
}

/**
 * Sanitize URL for display/storage
 */
export function sanitizeUrl(url: string): string {
  let sanitized = url.trim();
  
  // Add protocol if missing
  if (!sanitized.match(/^https?:\/\//i)) {
    sanitized = "https://" + sanitized;
  }
  
  return sanitized;
}

/**
 * Format error message for user display
 */
export function formatErrorForUser(error: Error): string {
  const message = error.message.toLowerCase();
  
  if (message.includes("rate limit")) {
    return "Too many requests. Please wait a moment and try again.";
  }
  
  if (message.includes("timeout")) {
    return "The request took too long. Please try again.";
  }
  
  if (message.includes("network") || message.includes("fetch")) {
    return "Network error. Please check your connection and try again.";
  }
  
  if (message.includes("api key") || message.includes("unauthorized")) {
    return "Authentication error. Please contact support.";
  }
  
  // Return generic message for unknown errors
  return "Something went wrong. Please try again.";
}

/**
 * Audit session tracker for cost aggregation
 */
export class AuditSession {
  private costs: AuditCost[] = [];
  private startTime: Date;
  public readonly sessionId: string;

  constructor() {
    this.sessionId = crypto.randomUUID();
    this.startTime = new Date();
  }

  addCost(
    provider: string,
    operation: string,
    inputTokens: number,
    outputTokens: number
  ): void {
    const cost: AuditCost = {
      provider,
      operation,
      inputTokens,
      outputTokens,
      estimatedCost: calculateCost(provider, inputTokens, outputTokens),
      timestamp: new Date(),
    };
    
    this.costs.push(cost);
    logAuditCost(cost);
  }

  getTotalCost(): number {
    return this.costs.reduce((sum, c) => sum + c.estimatedCost, 0);
  }

  getSummary(): {
    sessionId: string;
    totalCost: number;
    operations: number;
    durationMs: number;
    costs: AuditCost[];
  } {
    return {
      sessionId: this.sessionId,
      totalCost: this.getTotalCost(),
      operations: this.costs.length,
      durationMs: Date.now() - this.startTime.getTime(),
      costs: this.costs,
    };
  }

  logSummary(): void {
    const summary = this.getSummary();
    console.log(
      `[AUDIT SESSION ${this.sessionId}] Complete\n` +
      `  Total Cost: $${summary.totalCost.toFixed(4)}\n` +
      `  Operations: ${summary.operations}\n` +
      `  Duration: ${(summary.durationMs / 1000).toFixed(2)}s`
    );
  }
}
