import {
  PseoAuditRequest,
  PseoAuditResponse,
  PseoPage,
  PseoPageType,
  PageRecommendation,
  AuditDrivenStrategy,
} from "./pseo-types";
import { fetchKeywordDataFromDataForSEO } from "./dataforseo-extended";
import { addPageBriefs } from "./pseo-briefs";
import {
  extractContextFromAudit,
  analyzeAuditForPseo,
  categorizeRecommendations,
} from "./pseo-audit-analyzer";
import { batchGenerateContent } from "./pseo-content-pipeline";

function normList(input?: string[] | string): string[] {
  if (!input) return [];
  if (Array.isArray(input)) return input.map(s => s.trim()).filter(Boolean);
  return input.split(",").map(s => s.trim()).filter(Boolean);
}

function titleCase(s: string): string {
  return s
    .trim()
    .split(/\s+/)
    .map(w => (w.length ? w[0].toUpperCase() + w.slice(1).toLowerCase() : w))
    .join(" ");
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function dedupe(list: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of list) {
    const k = item.toLowerCase().trim();
    if (!k) continue;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(item.trim());
  }
  return out;
}

function parseGeographyToLocations(geography: string): { locations: string[]; mode: "single" | "multi" } {
  const g = geography.trim();
  if (!g) return { locations: [], mode: "multi" };

  const lc = g.toLowerCase();

  if (lc === "united states" || lc === "usa") {
    return {
      locations: ["Houston", "Dallas", "Austin", "Chicago", "New York", "Los Angeles", "Miami", "Denver", "Atlanta", "Phoenix"],
      mode: "multi",
    };
  }

  if (lc === "texas" || lc.includes("texas")) {
    return { locations: ["Houston", "Dallas", "Austin", "San Antonio", "Fort Worth"], mode: "multi" };
  }

  const parts = g.split(",").map(s => s.trim()).filter(Boolean);
  if (parts.length >= 1 && parts[0].length) {
    return { locations: [titleCase(parts[0])], mode: "single" };
  }

  return { locations: [], mode: "multi" };
}


const TEMPLATE_SECTIONS: Record<PseoPageType, string[]> = {
  service: ["H1", "Overview", "Who It's For", "Benefits", "Process", "FAQs", "CTA"],
  loan_program: ["H1", "Program Overview", "Typical Terms", "Eligibility", "Process", "FAQs", "CTA"],
  asset_class: ["H1", "Asset Class Overview", "Common Deal Structures", "What We Finance", "Case Examples", "FAQs", "CTA"],
  market: ["H1", "Market Snapshot", "Local Deal Types", "How We Help", "FAQs", "CTA"],
  use_case: ["H1", "Use Case Overview", "Ideal Borrower", "How It Works", "Timeline", "FAQs", "CTA"],
  qualifier: ["H1", "Quick Answer", "Details", "Examples", "FAQs", "CTA"],
  comparison: ["H1", "Side-by-Side", "When To Choose A", "When To Choose B", "FAQs", "CTA"],
  faq_hub: ["H1", "Top Questions", "Glossary", "Related Pages", "CTA"],
};

const SCHEMA_TYPES: Record<PseoPageType, string[]> = {
  service: ["Service", "FAQPage", "BreadcrumbList", "Organization"],
  loan_program: ["Service", "FAQPage", "BreadcrumbList", "Organization"],
  asset_class: ["Service", "FAQPage", "BreadcrumbList", "Organization"],
  market: ["LocalBusiness", "Service", "FAQPage", "BreadcrumbList", "Organization"],
  use_case: ["Article", "FAQPage", "BreadcrumbList", "Organization"],
  qualifier: ["FAQPage", "BreadcrumbList", "Organization"],
  comparison: ["Article", "FAQPage", "BreadcrumbList", "Organization"],
  faq_hub: ["FAQPage", "BreadcrumbList", "Organization"],
};

function page(
  type: PseoPageType,
  title: string,
  path: string,
  primary_keyword: string,
  secondary_keywords: string[] = []
): PseoPage {
  return {
    type,
    title,
    path,
    primary_keyword,
    secondary_keywords,
    template_sections: TEMPLATE_SECTIONS[type],
    schema_types: SCHEMA_TYPES[type],
  };
}

function countByType(pages: PseoPage[]): Record<PseoPageType, number> {
  const base: Record<PseoPageType, number> = {
    service: 0,
    loan_program: 0,
    asset_class: 0,
    market: 0,
    use_case: 0,
    qualifier: 0,
    comparison: 0,
    faq_hub: 0,
  };
  for (const p of pages) base[p.type] += 1;
  return base;
}

export async function generatePseoAudit(req: PseoAuditRequest): Promise<PseoAuditResponse> {
  // Check if audit-driven strategy is enabled
  const hasAudit = req.structuredAudit && !req.structuredAudit.parsingFallback;
  const useAuditStrategy = req.useAuditDrivenStrategy && hasAudit;

  // Variables for context
  let company: string;
  let industry: string;
  let geo: string;
  let services: string[];
  let targetCustomer: string;
  let websiteUrl: string;

  // Extract context from audit or use manual inputs
  if (useAuditStrategy && req.structuredAudit) {
    const context = extractContextFromAudit(req.structuredAudit);
    company = req.company_name?.trim() || context.company_name;
    industry = req.industry?.trim() || context.industry;
    geo = req.geography?.trim() || context.geography;
    services = dedupe(normList(req.services)).length > 0
      ? dedupe(normList(req.services))
      : context.services;
    targetCustomer = req.target_customer?.trim() || context.target_customer;
    websiteUrl = req.website_url?.trim() || context.website_url;
  } else {
    // Original manual extraction
    company = req.company_name?.trim() || "";
    industry = req.industry?.trim() || "";
    geo = req.geography?.trim() || "";
    services = dedupe(normList(req.services));
    targetCustomer = req.target_customer?.trim() || "";
    websiteUrl = req.website_url?.trim() || "";
  }

  const loanPrograms = dedupe((req.loan_programs ?? []).map(s => s.trim()).filter(Boolean));
  const assetClasses = dedupe((req.asset_classes ?? []).map(s => s.trim()).filter(Boolean));
  const useCases = dedupe((req.use_cases ?? []).map(s => s.trim()).filter(Boolean));
  const explicitLocations = dedupe((req.locations ?? []).map(s => s.trim()).filter(Boolean));

  const geoParsed = parseGeographyToLocations(geo);
  const locations = explicitLocations.length ? explicitLocations : (geoParsed.locations.length ? geoParsed.locations : []);

  const url_conventions = {
    service_base: "/services",
    loan_base: "/loans",
    asset_class_base: "/asset-classes",
    market_base: "/markets",
    use_case_base: "/use-cases",
    qualify_base: "/qualify",
    compare_base: "/compare",
    faq_base: "/faqs",
  };

  let pages: PseoPage[] = [];
  let auditDrivenStrategy: AuditDrivenStrategy | undefined;

  // AUDIT-DRIVEN MODE: Use LLM to analyze audit and recommend pages
  if (useAuditStrategy && req.structuredAudit) {
    const extractedContext = extractContextFromAudit(req.structuredAudit);

    // Get LLM-driven page recommendations
    const recommendations = await analyzeAuditForPseo({
      structuredAudit: req.structuredAudit,
      rawScan: req.rawScan,
      keywordMetrics: req.keywordMetrics,
    });

    // Categorize recommendations
    const categorized = categorizeRecommendations(recommendations);

    // Convert recommendations to pages
    pages = recommendations.map((rec) => convertRecommendationToPage(rec, url_conventions));

    // Generate validated content for each page (in batches)
    const contentMap = await batchGenerateContent(
      recommendations,
      req.structuredAudit,
      extractedContext,
      { concurrency: 3 }
    );

    // Attach generated content to pages
    for (const page of pages) {
      const slug = slugify(page.title);
      const content = contentMap.get(slug);
      if (content) {
        page.generatedContent = content;
      }
    }

    // Store strategy metadata
    auditDrivenStrategy = {
      extractedContext,
      recommendations,
      quickWinPages: categorized.quickWinPages,
      aeoFocusedPages: categorized.aeoFocusedPages,
    };

  } else {
    // MANUAL MODE: Original deterministic generation

  const defaultLoanPrograms = ["Bridge Loans","Construction Financing","Permanent Debt","Mezzanine Financing","Preferred Equity"];
  const defaultAssetClasses = ["Multifamily","Industrial","Office","Retail","Hospitality","Self Storage"];
  const defaultUseCases = ["Acquisition Financing","Refinance","Value-Add Renovation","Ground-Up Development","Cash-Out Refinance"];

  const finalLoanPrograms = loanPrograms.length ? loanPrograms : defaultLoanPrograms;
  const finalAssetClasses = assetClasses.length ? assetClasses : defaultAssetClasses;
  const finalUseCases = useCases.length ? useCases : defaultUseCases;

  for (const s of services) {
    const title = `${titleCase(s)} for ${titleCase(industry)}`;
    pages.push(page("service", title, `${url_conventions.service_base}/${slugify(s)}`, `${s} ${industry}`));
  }

  for (const lp of finalLoanPrograms) {
    pages.push(page("loan_program", titleCase(lp), `${url_conventions.loan_base}/${slugify(lp)}`, `${lp.toLowerCase()} ${industry}`));
  }

  for (const ac of finalAssetClasses) {
    pages.push(page("asset_class", `${titleCase(ac)} Pages`, `${url_conventions.asset_class_base}/${slugify(ac)}`, `${ac.toLowerCase()} ${industry}`));
  }

  for (const loc of locations) {
    pages.push(page("market", `${titleCase(loc)} ${titleCase(industry)}`, `${url_conventions.market_base}/${slugify(loc)}`, `${loc.toLowerCase()} ${industry.toLowerCase()}`));
  }

  for (const uc of finalUseCases) {
    pages.push(page("use_case", titleCase(uc), `${url_conventions.use_case_base}/${slugify(uc)}`, `${uc.toLowerCase()} ${industry.toLowerCase()}`));
  }

  const qualifiers = [
    { title: "Minimum Loan Size", kw: "minimum loan size" },
    { title: "Typical LTV", kw: "loan to value" },
    { title: "Recourse vs Non-Recourse", kw: "recourse vs non recourse" },
    { title: "Speed to Close", kw: "how fast can I close" },
  ];
  for (const q of qualifiers) {
    pages.push(
      page(
        "qualifier",
        `${q.title}`,
        `${url_conventions.qualify_base}/${slugify(q.title)}`,
        `${q.kw} ${industry}`
      )
    );
  }

  const comparisons = [
    { a: "Bridge Loan", b: "Construction Loan" },
    { a: "Preferred Equity", b: "Mezzanine Financing" },
  ];
  for (const c of comparisons) {
    pages.push(
      page(
        "comparison",
        `${c.a} vs ${c.b}`,
        `${url_conventions.compare_base}/${slugify(`${c.a}-vs-${c.b}`)}`,
        `${c.a} vs ${c.b}`
      )
    );
  }

  const faqHubs = [
    "Bridge Loans FAQs",
    "Construction Financing FAQs",
    "Underwriting FAQs",
    "Closing Process FAQs",
  ];
  for (const fh of faqHubs) {
    pages.push(
      page(
        "faq_hub",
        fh,
        `${url_conventions.faq_base}/${slugify(fh.replace(/ faqs$/i, ""))}`,
        fh.toLowerCase().replace(/\s+/g, " ")
      )
    );
  }
  } // End of else block (manual mode)

  const by_type = countByType(pages);
  const total_pages = pages.length;

  const hubs = [
    ...pages.filter(p => p.type === "service").map(p => p.path),
    ...pages.filter(p => p.type === "loan_program").map(p => p.path),
  ];
  const spokes = [
    ...pages.filter(p => p.type === "market").map(p => p.path),
    ...pages.filter(p => p.type === "asset_class").map(p => p.path),
    ...pages.filter(p => p.type === "use_case").map(p => p.path),
  ];

  const schema_recommendations: Record<string, string[]> = {
    homepage: ["Organization", "WebSite", "BreadcrumbList"],
    market: SCHEMA_TYPES.market,
    service: SCHEMA_TYPES.service,
    loan_program: SCHEMA_TYPES.loan_program,
    asset_class: SCHEMA_TYPES.asset_class,
  };

  const internal_linking = {
    hubs,
    spokes,
    rules: [
      "Hubs link to 5–8 spokes each using exact-match anchors.",
      "Markets link to relevant hubs + 1 qualifier page.",
      "FAQ hubs link to all hubs + top spokes.",
      "Every page includes breadcrumbs + related pages block.",
    ],
  };

  const lines: string[] = [];
  lines.push(`# pSEO Audit: ${company}`);
  lines.push(``);
  lines.push(`## Overview`);
  lines.push(`- **Industry:** ${industry}`);
  lines.push(`- **Geography:** ${geo}`);
  if (explicitLocations.length) lines.push(`- **Markets:** ${explicitLocations.join(", ")}`);
  lines.push(`- **Target Customer:** ${req.target_customer}`);
  lines.push(`- **Total Pages:** ${total_pages}`);
  lines.push(``);
  lines.push(`## Page Inventory`);
  const order: PseoPageType[] = ["service","loan_program","asset_class","market","use_case","qualifier","comparison","faq_hub"];
  for (const t of order) lines.push(`- **${t}**: ${by_type[t]}`);
  lines.push(``);
  lines.push(`## URL Conventions`);
  lines.push(`- Services: \`${url_conventions.service_base}/{service}\``);
  lines.push(`- Loans: \`${url_conventions.loan_base}/{program}\``);
  lines.push(`- Asset Classes: \`${url_conventions.asset_class_base}/{asset}\``);
  lines.push(`- Markets: \`${url_conventions.market_base}/{market}\``);
  lines.push(`- Use Cases: \`${url_conventions.use_case_base}/{use-case}\``);
  lines.push(`- Qualify: \`${url_conventions.qualify_base}/{topic}\``);
  lines.push(`- Compare: \`${url_conventions.compare_base}/{a}-vs-{b}\``);
  lines.push(`- FAQs: \`${url_conventions.faq_base}/{topic}\``);
  lines.push(``);
  lines.push(`## Internal Linking`);
  for (const r of internal_linking.rules) lines.push(`- ${r}`);
  lines.push(``);
  lines.push(`## Schema`);
  lines.push(`- Homepage: Organization, WebSite, BreadcrumbList`);
  lines.push(`- Market: ${schema_recommendations.market.join(", ")}`);
  lines.push(`- Service: ${schema_recommendations.service.join(", ")}`);
  lines.push(``);
  lines.push(`## Pages (${total_pages})`);
  for (const p of pages) lines.push(`- **${p.title}** (\`${p.path}\`) — ${p.type}`);

  const markdown = lines.join("\n");

  // Enrich pages with real DataForSEO keyword data
  try {
    const keywords = pages.map(p => p.primary_keyword);
    const keywordData = await fetchKeywordDataFromDataForSEO(keywords, {
      location_name: geo,
    });

    // Create a map for quick lookup
    const dataMap = new Map(
      keywordData.map(d => [d.keyword.toLowerCase(), d])
    );

    // Enrich pages with metrics
    for (const page of pages) {
      const data = dataMap.get(page.primary_keyword.toLowerCase());
      if (data) {
        (page as any).metrics = {
          keyword: data.keyword,
          searchVolume: data.searchVolume,
          cpc: data.cpc,
          competition: data.competition,
        };
      }
    }

    // Update markdown with metrics
    const metricsLines: string[] = [];
    metricsLines.push(`## Pages (${total_pages})`);
    for (const p of pages) {
      const metrics = (p as any).metrics;
      if (metrics) {
        metricsLines.push(
          `- **${p.title}** (\`${p.path}\`) — ${p.type} | Vol: ${metrics.searchVolume} | CPC: $${metrics.cpc.toFixed(2)} | Comp: ${(metrics.competition * 100).toFixed(0)}%`
        );
      } else {
        metricsLines.push(`- **${p.title}** (\`${p.path}\`) — ${p.type}`);
      }
    }

    // Replace the pages section in markdown
    const markdownLines = markdown.split("\n");
    const pagesStartIdx = markdownLines.findIndex(l => l.startsWith("## Pages"));
    if (pagesStartIdx !== -1) {
      const newMarkdown = [
        ...markdownLines.slice(0, pagesStartIdx),
        ...metricsLines,
      ].join("\n");
      lines.splice(0, lines.length, ...newMarkdown.split("\n"));
    }
  } catch (error) {
    console.error("Failed to enrich with DataForSEO:", error);
    // Continue without enrichment
  }

  const baseMarkdown = lines.join("\n");
  const enrichedMarkdown = addPageBriefs(baseMarkdown, {
    company_name: company,
    industry,
    geography: geo,
    markets: locations,
    services,
  });

  return {
    meta: {
      company_name: company,
      website_url: websiteUrl,
      industry,
      geography: geo,
      target_customer: targetCustomer,
    },
    totals: { total_pages, by_type },
    url_conventions,
    internal_linking,
    schema_recommendations,
    pages,
    markdown: enrichedMarkdown,
    auditDrivenStrategy,
  };
}

/**
 * Convert a PageRecommendation to a PseoPage
 */
function convertRecommendationToPage(
  rec: PageRecommendation,
  urlConventions: Record<string, string>
): PseoPage {
  const basePaths: Record<PseoPageType, string> = {
    service: urlConventions.service_base,
    loan_program: urlConventions.loan_base,
    asset_class: urlConventions.asset_class_base,
    market: urlConventions.market_base,
    use_case: urlConventions.use_case_base,
    qualifier: urlConventions.qualify_base,
    comparison: urlConventions.compare_base,
    faq_hub: urlConventions.faq_base,
  };

  const path = `${basePaths[rec.pageType]}/${slugify(rec.title)}`;

  return {
    type: rec.pageType,
    title: rec.title,
    path,
    primary_keyword: rec.targetKeywords[0] || rec.title.toLowerCase(),
    secondary_keywords: rec.targetKeywords.slice(1),
    template_sections: TEMPLATE_SECTIONS[rec.pageType],
    schema_types: SCHEMA_TYPES[rec.pageType],
    recommendation: {
      rationale: rec.rationale,
      priority: rec.priority,
      expectedImpact: rec.expectedImpact,
      sourceIssue: rec.sourceIssue,
      sourceOpportunity: rec.sourceOpportunity,
    },
  };
}
