// lib/proposal/config.ts
// Configuration types and validation for Proposal Package Generator

export interface ProposalConfig {
  company_name: string;
  website_url: string;
  industry: string;
  geography: string;
  offer: string;
  target_customer: string;
  brand_voice: string;
  notes?: string;
  competitors?: string[];
  contact_name?: string;
  contact_email?: string;
}

export function validateConfig(config: any): ProposalConfig {
  const required = [
    "company_name",
    "website_url",
    "industry",
    "geography",
    "offer",
    "target_customer",
    "brand_voice",
  ];

  for (const field of required) {
    if (!config[field]) {
      throw new Error(`Missing required field: ${field}`);
    }
  }

  // Validate URL format
  try {
    new URL(config.website_url);
  } catch {
    throw new Error(`Invalid website_url: ${config.website_url}`);
  }

  return {
    company_name: String(config.company_name).trim(),
    website_url: String(config.website_url).trim(),
    industry: String(config.industry).trim(),
    geography: String(config.geography).trim(),
    offer: String(config.offer).trim(),
    target_customer: String(config.target_customer).trim(),
    brand_voice: String(config.brand_voice).trim(),
    notes: config.notes ? String(config.notes).trim() : undefined,
    competitors: Array.isArray(config.competitors)
      ? config.competitors.map((c: any) => String(c).trim())
      : undefined,
    contact_name: config.contact_name
      ? String(config.contact_name).trim()
      : undefined,
    contact_email: config.contact_email
      ? String(config.contact_email).trim()
      : undefined,
  };
}

