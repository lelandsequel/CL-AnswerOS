// lib/pseo-audit.ts
// pSEO audit generation logic

import { PSEOAuditRequest, PSEOAuditResult, PSEOPageType } from "./pseo-types";
import { buildPSEOAuditPrompt } from "./operator-prompts";
import { fetchKeywordDataFromDataForSEO } from "./dataforseo-extended";

export async function generatePSEOAudit(
  request: PSEOAuditRequest
): Promise<PSEOAuditResult> {
  // Generate base audit
  const audit = getDefaultPSEOAudit(request);

  // Enrich with DataForSEO keyword metrics if available
  try {
    await enrichAuditWithKeywordMetrics(audit, request);
  } catch (error) {
    console.warn('Failed to enrich pSEO audit with DataForSEO metrics:', error);
    // Continue with non-enriched data
  }

  return audit;
}

async function enrichAuditWithKeywordMetrics(
  audit: PSEOAuditResult,
  request: PSEOAuditRequest
): Promise<void> {
  // Generate keywords from page types and services
  const keywords = generateKeywordsForEnrichment(audit, request);

  if (keywords.length === 0) return;

  // Fetch metrics from DataForSEO
  const metrics = await fetchKeywordDataFromDataForSEO(keywords, {
    location_name: request.geography || 'United States',
  });

  // Create a map for quick lookup
  const metricsMap = new Map(
    metrics.map(m => [m.keyword.toLowerCase(), m])
  );

  // Enrich sample pages with metrics
  audit.samplePages = audit.samplePages.map(page => ({
    ...page,
    metrics: metricsMap.get(page.title.toLowerCase()),
  }));
}

function generateKeywordsForEnrichment(
  audit: PSEOAuditResult,
  request: PSEOAuditRequest
): string[] {
  const keywords: Set<string> = new Set();

  // Add service-based keywords
  if (request.services && Array.isArray(request.services)) {
    request.services.forEach(service => {
      keywords.add(service);
      keywords.add(`${service} ${request.geography || 'near me'}`);
      keywords.add(`best ${service}`);
    });
  }

  // Add industry keywords
  if (request.industry) {
    keywords.add(request.industry);
    keywords.add(`${request.industry} services`);
    keywords.add(`${request.industry} near me`);
  }

  // Add location-based keywords
  if (request.geography) {
    keywords.add(`${request.industry} ${request.geography}`);
    keywords.add(`${request.target_customer} ${request.geography}`);
  }

  return Array.from(keywords).slice(0, 50); // Limit to 50 keywords
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

