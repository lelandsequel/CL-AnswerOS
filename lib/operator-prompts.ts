// lib/operator-prompts.ts
// Shared prompt builders for SEO/AEO/pSEO/Deck operations

import { PseoAuditRequest } from "./pseo-types";

function clean(s: string | undefined) {
  return String(s ?? "").trim();
}

export function buildPseoPrompt(req: PseoAuditRequest) {
  const company = clean(req.company_name);
  const website = clean(req.website_url);
  const industry = clean(req.industry);
  const geography = clean(req.geography);
  const target = clean(req.target_customer);
  const services = Array.isArray(req.services) ? req.services : String(req.services || "").split(",").map(s => s.trim()).filter(Boolean);

  const locations = (req.locations ?? []).map(clean).filter(Boolean);
  const loanPrograms = (req.loan_programs ?? []).map(clean).filter(Boolean);
  const assetClasses = (req.asset_classes ?? []).map(clean).filter(Boolean);
  const useCases = (req.use_cases ?? []).map(clean).filter(Boolean);

  const notes = clean(req.notes || "");

  return [
    `You are generating a deterministic pSEO plan.`,
    `Return STRICT JSON only matching the PseoAuditResponse schema.`,
    ``,
    `INPUT`,
    `company_name: ${company}`,
    `website_url: ${website}`,
    `industry: ${industry}`,
    `geography: ${geography}`,
    locations.length ? `locations: ${locations.join(", ")}` : `locations: (none)`,
    `target_customer: ${target}`,
    services.length ? `services: ${services.join(", ")}` : `services: (none)`,
    loanPrograms.length ? `loan_programs: ${loanPrograms.join(", ")}` : `loan_programs: (none)`,
    assetClasses.length ? `asset_classes: ${assetClasses.join(", ")}` : `asset_classes: (none)`,
    useCases.length ? `use_cases: ${useCases.join(", ")}` : `use_cases: (none)`,
    notes ? `notes: ${notes}` : `notes: (none)`,
    ``,
    `RULES`,
    `- Do NOT concatenate geography and locations. Keep them separate.`,
    `- If locations are provided, markets must come ONLY from locations.`,
    `- If locations are empty, derive markets from geography safely.`,
    ``,
  ].join("\n");
}

export function buildDeckOutlinePrompt(params: {
  company_name: string;
  website_url: string;
  industry: string;
  current_challenges: string[];
  target_outcomes: string[];
  budget_range?: string;
  timeline?: string;
}): string {
  return `You are an expert proposal deck strategist. Create a comprehensive deck outline for a client proposal.

Client: ${params.company_name}
Website: ${params.website_url}
Industry: ${params.industry}
Current Challenges: ${params.current_challenges.join(", ")}
Target Outcomes: ${params.target_outcomes.join(", ")}
${params.budget_range ? `Budget Range: ${params.budget_range}` : ""}
${params.timeline ? `Timeline: ${params.timeline}` : ""}

Generate a JSON response with this structure:
{
  "slides": [
    {
      "slideNumber": 1,
      "title": "Slide Title",
      "bullets": ["Bullet 1", "Bullet 2", "Bullet 3"],
      "speakerNotes": "What to say on this slide",
      "suggestedVisuals": "What visual to show"
    }
  ]
}

Create 15-17 slides covering:
1. Cover slide
2. Executive summary
3. Current state diagnosis
4. Opportunities
5-9. Pillar findings (SEO, AEO, pSEO, etc.)
10. Before/after
11. Implementation roadmap
12. Pricing/engagement
13. Why us
14. Next steps

Make it compelling and client-focused.`;
}

export function buildSEOAuditPrompt(url: string, scanData: string): string {
  return `You are an expert SEO auditor. Analyze this website scan and provide a structured audit.

URL: ${url}
Scan Data:
${scanData}

Provide a comprehensive SEO audit covering:
1. Technical SEO issues
2. On-page optimization gaps
3. Content strategy recommendations
4. Authority/backlink opportunities
5. UX/conversion issues

Format as JSON with clear, actionable findings.`;
}

export function buildAEOAuditPrompt(
  company_name: string,
  industry: string,
  offer: string
): string {
  return `You are an expert AEO (Answer Engine Optimization) strategist. Create an AEO audit for this company.

Company: ${company_name}
Industry: ${industry}
Offer: ${offer}

Provide:
1. Entity definition (who, what, where)
2. Schema markup recommendations
3. FAQ targets
4. Answer surface opportunities
5. AI search optimization strategy

Format as JSON with specific, implementable recommendations.`;
}

