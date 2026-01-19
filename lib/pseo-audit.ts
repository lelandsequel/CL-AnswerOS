// lib/pseo-audit.ts
// pSEO audit generation logic

import { PSEOAuditRequest, PSEOAuditResult, PSEOPageType } from "./pseo-types";
import { buildPSEOAuditPrompt } from "./operator-prompts";

export async function generatePSEOAudit(
  request: PSEOAuditRequest
): Promise<PSEOAuditResult> {
  // For now, use deterministic defaults (can be enhanced with LLM later)
  return getDefaultPSEOAudit(request);
}

function getDefaultPSEOAudit(request: PSEOAuditRequest): PSEOAuditResult {
  const pageTypes = generatePageTypes(request.industry, request.services);
  const samplePages = generateSamplePages(pageTypes, request.geography);

  return {
    company_name: request.company_name,
    industry: request.industry,
    pageTypes,
    totalEstimatedPages: samplePages.length,
    urlStructure:
      "Use descriptive slugs: /[page-type]/[primary-keyword]-[modifier]. Example: /services/commercial-real-estate-financing, /markets/new-york-bridge-loans",
    internalLinkingStrategy:
      "Hub/spoke model: Main service pages (hubs) link to location/vertical pages (spokes). Spokes link back to hubs and related spokes. Use contextual anchor text with target keywords.",
    schemaRecommendations: [
      "LocalBusiness (for location pages)",
      "Service (for service pages)",
      "FAQPage (for FAQ sections)",
      "BreadcrumbList (for navigation)",
      "Article (for resource pages)",
      "Organization (homepage)",
    ],
    samplePages,
    contentTemplates: generateContentTemplates(pageTypes),
  };
}

function generatePageTypes(industry: string, services: string[]): PSEOPageType[] {
  const isFinance = industry.toLowerCase().includes("finance") ||
    industry.toLowerCase().includes("lending") ||
    industry.toLowerCase().includes("real estate");

  const basePageTypes: PSEOPageType[] = [
    {
      name: "Service Pages",
      description: "Detailed pages for each service offering",
      urlPattern: "/services/{service-slug}",
      estimatedCount: services.length || 5,
      templateSections: [
        "H1 with service name",
        "Service overview",
        "Key benefits",
        "Use cases",
        "Process/timeline",
        "Case studies",
        "FAQ",
        "CTA",
      ],
      schemaTypes: ["Service", "FAQPage"],
    },
    {
      name: "Location Pages",
      description: "Market-specific landing pages",
      urlPattern: "/markets/{location-slug}",
      estimatedCount: 15,
      templateSections: [
        "H1 with location",
        "Market overview",
        "Local services",
        "Local team",
        "Local case studies",
        "Local testimonials",
        "CTA",
      ],
      schemaTypes: ["LocalBusiness", "Service"],
    },
    {
      name: "Industry/Vertical Pages",
      description: "Pages targeting specific industries",
      urlPattern: "/industries/{industry-slug}",
      estimatedCount: 8,
      templateSections: [
        "H1 with industry",
        "Industry challenges",
        "Solutions offered",
        "Industry expertise",
        "Case studies",
        "FAQ",
        "CTA",
      ],
      schemaTypes: ["Service", "FAQPage"],
    },
  ];

  if (isFinance) {
    basePageTypes.push({
      name: "Loan Type Pages",
      description: "Pages for specific loan products",
      urlPattern: "/loan-types/{loan-type-slug}",
      estimatedCount: 6,
      templateSections: [
        "H1 with loan type",
        "Loan overview",
        "Eligibility",
        "Terms",
        "Process",
        "FAQ",
        "CTA",
      ],
      schemaTypes: ["Service", "FAQPage"],
    });
  }

  return basePageTypes;
}

function generateSamplePages(
  pageTypes: PSEOPageType[],
  geography: string
): Array<{ title: string; url: string; pageType: string }> {
  const pages: Array<{ title: string; url: string; pageType: string }> = [];

  // Service pages
  const services = [
    "Bridge Loans",
    "Construction Financing",
    "Permanent Debt",
    "Mezzanine Financing",
    "Preferred Equity",
  ];
  services.forEach((service) => {
    pages.push({
      title: service,
      url: `/services/${service.toLowerCase().replace(/\s+/g, "-")}`,
      pageType: "Service Pages",
    });
  });

  // Location pages
  const locations = [
    "New York",
    "Los Angeles",
    "Chicago",
    "San Francisco",
    "Boston",
    "Miami",
    "Austin",
    "Denver",
    "Seattle",
    "Atlanta",
  ];
  locations.forEach((location) => {
    pages.push({
      title: `${location} Commercial Real Estate Financing`,
      url: `/markets/${location.toLowerCase().replace(/\s+/g, "-")}`,
      pageType: "Location Pages",
    });
  });

  // Industry pages
  const industries = [
    "Multifamily",
    "Office",
    "Retail",
    "Industrial",
    "Hospitality",
    "Healthcare",
  ];
  industries.forEach((ind) => {
    pages.push({
      title: `${ind} Real Estate Financing`,
      url: `/industries/${ind.toLowerCase()}`,
      pageType: "Industry/Vertical Pages",
    });
  });

  return pages;
}

function generateContentTemplates(
  pageTypes: PSEOPageType[]
): Record<string, string[]> {
  const templates: Record<string, string[]> = {};

  pageTypes.forEach((pt) => {
    templates[pt.name] = pt.templateSections;
  });

  return templates;
}

