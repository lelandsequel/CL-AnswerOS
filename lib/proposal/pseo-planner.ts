// lib/proposal/pseo-planner.ts
// Programmatic SEO (pSEO) planning module

import { ProposalConfig } from "./config";

export interface PSEOPageType {
  name: string;
  description: string;
  urlPattern: string;
  templateOutline: string[];
  requiredDataFields: string[];
  estimatedCount: number;
}

export interface PSEOPlan {
  pageTypes: PSEOPageType[];
  totalEstimatedPages: number;
  dataSourceRecommendation: string;
  implementationTimeline: string;
  scalingStrategy: string;
}

export function generatePSEOPlan(config: ProposalConfig): PSEOPlan {
  const industry = config.industry.toLowerCase();
  const pageTypes: PSEOPageType[] = [];

  // Industry-specific page types
  if (
    industry.includes("real estate") ||
    industry.includes("finance") ||
    industry.includes("lending")
  ) {
    pageTypes.push(
      {
        name: "Location Pages",
        description: "Market-specific landing pages (city, state, region)",
        urlPattern: "/markets/{location-slug}",
        templateOutline: [
          "Hero with location name",
          "Local market overview",
          "Services available in location",
          "Local case studies",
          "Local team members",
          "CTA for local inquiry",
        ],
        requiredDataFields: [
          "location_name",
          "state",
          "market_size",
          "local_team",
          "case_studies",
        ],
        estimatedCount: 15,
      },
      {
        name: "Product/Service Pages",
        description: "Detailed pages for each service offering",
        urlPattern: "/services/{service-slug}",
        templateOutline: [
          "Service overview",
          "Use cases",
          "Process/timeline",
          "Pricing/terms",
          "Case studies",
          "FAQ",
          "CTA",
        ],
        requiredDataFields: [
          "service_name",
          "description",
          "use_cases",
          "timeline",
          "case_studies",
        ],
        estimatedCount: 8,
      },
      {
        name: "Industry/Vertical Pages",
        description: "Pages targeting specific industries or deal types",
        urlPattern: "/industries/{industry-slug}",
        templateOutline: [
          "Industry overview",
          "Specific challenges",
          "Solutions offered",
          "Industry expertise",
          "Case studies",
          "CTA",
        ],
        requiredDataFields: [
          "industry_name",
          "challenges",
          "solutions",
          "expertise_level",
          "case_studies",
        ],
        estimatedCount: 6,
      }
    );
  } else {
    // Generic page types for other industries
    pageTypes.push(
      {
        name: "Solution Pages",
        description: "Pages for each solution/offering",
        urlPattern: "/solutions/{solution-slug}",
        templateOutline: [
          "Solution overview",
          "Benefits",
          "Use cases",
          "Case studies",
          "CTA",
        ],
        requiredDataFields: [
          "solution_name",
          "benefits",
          "use_cases",
          "case_studies",
        ],
        estimatedCount: 5,
      },
      {
        name: "Resource Pages",
        description: "Educational/resource pages",
        urlPattern: "/resources/{resource-slug}",
        templateOutline: [
          "Resource title",
          "Overview",
          "Key takeaways",
          "Related resources",
          "CTA",
        ],
        requiredDataFields: ["resource_name", "content", "related_resources"],
        estimatedCount: 10,
      }
    );
  }

  const totalPages = pageTypes.reduce((sum, pt) => sum + pt.estimatedCount, 0);

  return {
    pageTypes,
    totalEstimatedPages: totalPages,
    dataSourceRecommendation:
      "Google Sheet or Airtable with columns for each required field",
    implementationTimeline: `${Math.ceil(totalPages / 5)} weeks (5 pages/week with template)`,
    scalingStrategy:
      "Start with 1 page type, validate performance, then scale to others",
  };
}

