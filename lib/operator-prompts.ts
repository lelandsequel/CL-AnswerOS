// lib/operator-prompts.ts
// Shared prompt builders for SEO/AEO/pSEO/Deck operations

export function buildPSEOAuditPrompt(params: {
  company_name: string;
  website_url: string;
  industry: string;
  geography: string;
  services: string[];
  target_customer: string;
  notes?: string;
}): string {
  return `You are an expert pSEO (Programmatic SEO) strategist. Analyze this company and create a comprehensive pSEO plan.

Company: ${params.company_name}
Website: ${params.website_url}
Industry: ${params.industry}
Geography: ${params.geography}
Services: ${params.services.join(", ")}
Target Customer: ${params.target_customer}
${params.notes ? `Notes: ${params.notes}` : ""}

Generate a JSON response with this structure:
{
  "pageTypes": [
    {
      "name": "Page Type Name",
      "description": "What this page type targets",
      "urlPattern": "/pattern/{variable}",
      "estimatedCount": 25,
      "templateSections": ["H1 with keyword", "Hero section", "Benefits list", "FAQ", "CTA"],
      "schemaTypes": ["LocalBusiness", "Service", "FAQPage"]
    }
  ],
  "urlStructure": "Recommended URL structure and slug conventions",
  "internalLinkingStrategy": "Hub/spoke strategy description",
  "schemaRecommendations": ["Schema type 1", "Schema type 2"],
  "samplePages": [
    {"title": "Page Title", "url": "/url-slug", "pageType": "Page Type Name"}
  ],
  "contentTemplates": {
    "Page Type Name": ["Section 1", "Section 2", "Section 3"]
  }
}

Provide at least 3 page types and 25+ sample pages. Be specific and actionable.`;
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

